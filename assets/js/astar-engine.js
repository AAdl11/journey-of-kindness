/* JOK A* engine. Classic script: AStarEngine; CommonJS: require(). No DOM. */
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.AStarEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const key = p => p.x + ',' + p.y;
    const copy = p => ({ x: p.x, y: p.y });
    const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    function createGrid({ cols, rows, walls = [], start, goal, tieBreak = 'deeper' }) {
        if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) {
            throw new RangeError('cols and rows must be positive integers');
        }
        const valid = p => p && Number.isInteger(p.x) && Number.isInteger(p.y)
            && p.x >= 0 && p.y >= 0 && p.x < cols && p.y < rows;
        if (!valid(start) || !valid(goal) || !Array.isArray(walls) || !walls.every(valid)) {
            throw new RangeError('All coordinates must be integer cells inside the grid');
        }
        if (!['deeper', 'fifo'].includes(tieBreak)) throw new TypeError('Unknown tieBreak');
        return { cols, rows, walls: Array.from(new Map(walls.map(p => [key(p), copy(p)])).values()),
            start: copy(start), goal: copy(goal), tieBreak };
    }

    // Success: array of independent snapshots; last snapshot has path.
    // Unreachable: {steps, path:null}, as required by specification 01.
    function astarSteps(input) {
        const grid = createGrid(input), { start, goal } = grid;
        const walls = new Set(grid.walls.map(key));
        const steps = [], closed = [], closedKeys = new Set();
        if (walls.has(key(start)) || walls.has(key(goal))) return { steps, path: null };
        const openSet = [start], cameFrom = {}, gScore = {}, fScore = {};
        gScore[key(start)] = 0;
        fScore[key(start)] = manhattan(start, goal);
        while (openSet.length) {
            // Preserve recorder's larger-g tie break; fifo preserves the old path-only routine.
            openSet.sort((a, b) => (fScore[key(a)] - fScore[key(b)])
                || (grid.tieBreak === 'deeper' ? gScore[key(b)] - gScore[key(a)] : 0));
            const current = openSet.shift(), ck = key(current);
            closed.push(copy(current));
            closedKeys.add(ck);
            const found = ck === key(goal);
            if (!found) {
                [{ x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
                    { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }]
                    .filter(n => n.x >= 0 && n.y >= 0 && n.x < grid.cols && n.y < grid.rows
                        && !walls.has(key(n)) && !closedKeys.has(key(n)))
                    .forEach(n => {
                        const nk = key(n), g = gScore[ck] + 1;
                        if (gScore[nk] === undefined || g < gScore[nk]) {
                            cameFrom[nk] = copy(current);
                            gScore[nk] = g;
                            fScore[nk] = g + manhattan(n, goal);
                            if (!openSet.some(p => key(p) === nk)) openSet.push(n);
                        }
                    });
            }
            const parents = {};
            Object.keys(cameFrom).forEach(k => { parents[k] = copy(cameFrom[k]); });
            const snapshot = { current: copy(current),
                open: openSet.map(p => ({ ...copy(p), f: fScore[key(p)] })),
                closed: closed.map(copy), cameFrom: parents,
                g: gScore[ck], h: manhattan(current, goal), f: fScore[ck] };
            if (found) {
                snapshot.path = [copy(current)];
                let p = current;
                while (cameFrom[key(p)]) { p = cameFrom[key(p)]; snapshot.path.unshift(copy(p)); }
            }
            steps.push(snapshot);
            if (found) return steps;
        }
        return { steps, path: null };
    }
    return { createGrid, astarSteps, manhattan };
});
