/* Load astar-engine.js first. No page IDs, L1 globals, or external dependencies. */
(function (root) {
    'use strict';
    const instances = new WeakMap();
    let audioContext;
    const key = p => p.x + ',' + p.y;
    const css = `
    .jok-astar:not([data-astar-host]) { box-sizing:border-box; display:grid;
        grid-template-columns:repeat(var(--astar-cols),minmax(0,1fr));
        width:min(100%,var(--astar-width,580px),calc(var(--astar-cols) * var(--astar-cell-size,48px) + (var(--astar-cols) - 1) * var(--astar-gap,3px) + 2 * var(--astar-padding,6px)));
        min-width:0; gap:var(--astar-gap,3px); padding:var(--astar-padding,6px);
        background:var(--astar-board,#122033); border-radius:var(--astar-radius,12px); }
    .jok-astar:not([data-astar-host]) > .jok-astar-cell { box-sizing:border-box;
        aspect-ratio:1; min-width:0; min-height:0; overflow:hidden; position:relative;
        display:flex; align-items:center; justify-content:center; touch-action:manipulation;
        border:1px solid var(--astar-border,#526277); border-radius:var(--astar-cell-radius,5px);
        background:var(--astar-cell,#293c51); color:var(--astar-text,#fff);
        font-size:var(--astar-font-size,clamp(8px,2.5vw,16px)); }
    .jok-astar:not([data-astar-host]) > .jok-astar-cell.astar-wall { background:var(--astar-wall,#45515f); }
    .jok-astar > .jok-astar-cell.astar-open { background:var(--astar-frontier,rgba(251,191,36,.24)); border-color:var(--astar-frontier-border,#fbbf24); }
    .jok-astar > .jok-astar-cell.astar-closed { background:var(--astar-closed,rgba(45,50,78,.8)); }
    .jok-astar > .jok-astar-cell.astar-current { background:var(--astar-current,#0ea5e9); animation:astar-current-pulse .32s ease-out; }
    .jok-astar > .jok-astar-cell.astar-path { background:var(--astar-path,rgba(251,191,36,.6)); box-shadow:inset 0 0 8px var(--astar-path-glow,#fbbf24); }
    .jok-astar:not([data-astar-host]) .astar-score { font-size:var(--astar-score-size,clamp(7px,2vw,12px)); }
    @keyframes astar-current-pulse { 50% { filter:brightness(1.6); } }
    @media (prefers-reduced-motion:reduce) { .jok-astar > .jok-astar-cell.astar-current { animation:none; } }
    `;

    function mountAStar(container, input, options = {}) {
        if (!container || container.nodeType !== 1) throw new TypeError('A container element is required');
        if (!root.AStarEngine) throw new Error('Load astar-engine.js before astar-renderer.js');
        if (instances.has(container)) instances.get(container).destroy();
        const doc = container.ownerDocument;
        if (!doc.querySelector('style[data-jok-astar]')) {
            const style = doc.createElement('style');
            style.dataset.jokAstar = ''; style.textContent = css; doc.head.appendChild(style);
        }
        let grid = root.AStarEngine.createGrid(input), steps, path;
        let index = -1, pathIndex = 0, timer = null, running = false, finished = false, destroyed = false;
        let speed = 350, replayFactor = 1, revision = 0, lastSnapshot = null, lastPath = [];
        let done = typeof options.onDone === 'function' ? options.onDone : () => {};
        let noPath = typeof options.onNoPath === 'function' ? options.onNoPath : () => {};
        const cells = [];
        container.classList.add('jok-astar');
        if (options.hostLayout) container.setAttribute('data-astar-host', '');
        else container.removeAttribute('data-astar-host');
        container.style.setProperty('--astar-cols', grid.cols);
        const variables = { cellSize: '--astar-cell-size', width: '--astar-width', gap: '--astar-gap',
            padding: '--astar-padding', fontSize: '--astar-font-size' };
        Object.keys(variables).forEach(k => {
            if (options[k] !== undefined) container.style.setProperty(variables[k],
                typeof options[k] === 'number' ? options[k] + 'px' : options[k]);
        });
        Object.keys(options.colors || {}).forEach(k => {
            if (/^[a-z-]+$/.test(k)) container.style.setProperty('--astar-' + k, options.colors[k]);
        });
        container.replaceChildren();
        for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.cols; x++) {
            const cell = doc.createElement('div'), point = { x, y };
            cell.dataset.x = x; cell.dataset.y = y;
            if (options.onCellClick || options.editable) {
                cell.setAttribute('role', 'button'); cell.tabIndex = 0;
                cell.setAttribute('aria-label', x + ', ' + y);
                const activate = () => {
                    if (destroyed) return;
                    if (options.onCellClick) options.onCellClick(x, y);
                    else api.dropWall(x, y);
                };
                cell.addEventListener('click', activate);
                cell.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
                });
            }
            cells.push({ cell, point }); container.appendChild(cell);
        }

        function calculate() {
            const result = root.AStarEngine.astarSteps(grid);
            steps = Array.isArray(result) ? result : result.steps;
            path = Array.isArray(result) ? result[result.length - 1].path : null;
        }
        function redraw(snapshot = null, litPath = []) {
            if (destroyed) return;
            lastSnapshot = snapshot; lastPath = litPath;
            const open = new Map((snapshot ? snapshot.open : []).map(p => [key(p), p.f]));
            const closed = new Set((snapshot ? snapshot.closed : []).map(key));
            const lit = new Set(litPath.map(key)), walls = new Set(grid.walls.map(key));
            for (const { cell, point } of cells) {
                const k = key(point);
                cell.className = 'jok-astar-cell'; cell.textContent = '';
                if (options.renderCell) options.renderCell(cell, point, { snapshot, path: litPath, grid });
                else {
                    cell.textContent = k === key(grid.start) ? '●' : k === key(grid.goal) ? '◎' : walls.has(k) ? '■' : '';
                    if (!cell.textContent && open.has(k)) {
                        const score = doc.createElement('span'); score.className = 'astar-score';
                        score.textContent = open.get(k); cell.appendChild(score);
                    }
                }
                cell.classList.add('jok-astar-cell');
                if (walls.has(k)) cell.classList.add('astar-wall');
                if (snapshot) {
                    if (closed.has(k)) cell.classList.add('astar-closed');
                    if (open.has(k)) cell.classList.add('astar-open');
                    if (snapshot.current && k === key(snapshot.current)) cell.classList.add('astar-current');
                }
                if (lit.has(k)) cell.classList.add('astar-path');
            }
        }
        function soundAllowed() { return typeof options.sound === 'function' ? options.sound() : options.sound !== false; }
        function unlockAudio() {
            if (!soundAllowed()) return;
            try {
                const Audio = root.AudioContext || root.webkitAudioContext;
                if (!Audio) return;
                if (!audioContext) audioContext = new Audio();
                if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
            } catch (_) { /* Audio may be unavailable; search must still work. */ }
        }
        function feedback() {
            if (soundAllowed()) {
                unlockAudio();
                try {
                    if (audioContext && audioContext.state === 'running') {
                        const osc = audioContext.createOscillator(), gain = audioContext.createGain();
                        const now = audioContext.currentTime;
                        osc.frequency.setValueAtTime(650, now);
                        osc.frequency.exponentialRampToValueAtTime(200, now + .025);
                        gain.gain.setValueAtTime(.035, now);
                        gain.gain.exponentialRampToValueAtTime(.001, now + .03);
                        osc.connect(gain); gain.connect(audioContext.destination);
                        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
                        osc.start(now); osc.stop(now + .035);
                    }
                } catch (_) { /* Silent fallback. */ }
            }
            try { if (options.vibrate !== false && root.navigator && root.navigator.vibrate) root.navigator.vibrate(8); } catch (_) {}
        }
        function clearTimer() { if (timer !== null) root.clearTimeout(timer); timer = null; }
        function pause() { running = false; clearTimer(); return api; }
        function complete() {
            pause(); finished = true;
            container.dataset.astarStatus = path ? 'done' : 'no-path';
            if (path) done(path.map(p => ({ ...p })));
            else noPath();
        }
        function advance() {
            if (destroyed || finished) return;
            if (index + 1 < steps.length) {
                index++;
                redraw(steps[index], []); feedback();
                const version = revision;
                if (options.onStep) options.onStep(steps[index], index);
                if (destroyed || version !== revision) return;
                if (!path && index === steps.length - 1) complete();
            } else if (path && pathIndex < path.length) {
                pathIndex++; redraw(steps[steps.length - 1], path.slice(0, pathIndex)); feedback();
                if (pathIndex === path.length) complete();
            } else complete();
        }
        function schedule() {
            clearTimer();
            if (running && !finished && !destroyed) timer = root.setTimeout(() => {
                timer = null; advance(); schedule();
            }, speed * replayFactor);
        }
        function reset() {
            pause(); revision++; replayFactor = 1; index = -1; pathIndex = 0; finished = false;
            calculate(); redraw(); container.dataset.astarStatus = 'ready'; return api;
        }
        const api = {
            play() {
                if (destroyed || finished || running) return api;
                unlockAudio(); running = true; container.dataset.astarStatus = 'playing';
                advance(); schedule(); return api;
            },
            pause,
            step() { pause(); unlockAudio(); advance(); return api; },
            reset,
            setSpeed(ms) {
                if (!Number.isFinite(ms) || ms <= 0) throw new RangeError('Speed must be positive milliseconds');
                speed = ms; if (running) schedule(); return api;
            },
            onDone(cb) { if (typeof cb !== 'function') throw new TypeError('Callback required'); done = cb; return api; },
            onNoPath(cb) { if (typeof cb !== 'function') throw new TypeError('Callback required'); noPath = cb; return api; },
            dropWall(x, y) {
                if (destroyed) return api;
                if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return api;
                const k = key({ x, y }), exists = grid.walls.some(p => key(p) === k);
                // Endpoints remain walkable: an endpoint/wall click clears a wall; ordinary roads add one.
                if (exists || k === key(grid.start) || k === key(grid.goal)) grid.walls = grid.walls.filter(p => key(p) !== k);
                else grid.walls.push({ x, y });
                reset(); replayFactor = .5; return api.play();
            },
            // Host adapter helpers; redraw has no timers, sound, or completion callbacks.
            redraw,
            refresh() { redraw(lastSnapshot, lastPath); return api; },
            destroy() {
                if (destroyed) return;
                pause(); revision++; destroyed = true;
                if (instances.get(container) === api) instances.delete(container);
            }
        };
        if (options.speed !== undefined) api.setSpeed(options.speed);
        instances.set(container, api); reset(); return api;
    }
    root.mountAStar = mountAStar;
})(typeof globalThis !== 'undefined' ? globalThis : this);
