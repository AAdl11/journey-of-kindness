/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · The Tree of Many Futures — Shared Rules Engine (Step 2)
   Spec: docs/LEVEL8_ARCHITECTURE_BLUEPRINT.md (Approved for implementation —
   2026-08-22, commit d4632147). Implements §3 state contract, §3.1 fixture
   A1F, §3.2 fixture A3, §4 Engine moves.

   Contract: pure functions only — deterministic, side-effect-free, DOM-free,
   RNG-free. No display text lives here (all strings arrive in Step 8 via
   level8/strings.js). Loadable as a Node module and as a classic <script>.
   ═══════════════════════════════════════════════════════════════════════════ */
const L8_ENGINE = (() => {
'use strict';

/* ── Canonical MAX enumeration order (§3): MOVE N,E,S,W → SERVE → WAIT ──── */
const DIRS = [
    { dir: 'N', dr: -1, dc: 0 },
    { dir: 'E', dr: 0, dc: 1 },
    { dir: 'S', dr: 1, dc: 0 },
    { dir: 'W', dr: 0, dc: -1 },
];

/* ── §4 Engine move parameters.
   Durations are counted in MAX plies after placement (§3): an effect with
   duration d applies to the next d MAX plies, whatever their time cost.
   A cooldown k makes the move illegal for the k MIN plies after the one
   that used it (§3). ─────────────────────────────────────────────────────── */
const RULES = {
    ROAD_CLOSE:   { duration: 2, cooldown: 1 },
    SUPPLY_DELAY: { duration: 2, cooldown: 1 },
    FOG:          { duration: 2, cooldown: 2 },
};

/* ── Edges. Canonical key: lexicographically smaller endpoint first. ────── */
function edgeKey(a, b) {
    const p = (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) ? a : b;
    const q = (p === a) ? b : a;
    return p[0] + ',' + p[1] + '|' + q[0] + ',' + q[1];
}

/* Documented Engine edge enumeration (§3 tie-break): row-major tile scan,
   for each tile its East edge then its South edge. */
function allEdges(n) {
    const list = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (c + 1 < n) list.push(edgeKey([r, c], [r, c + 1]));
        if (r + 1 < n) list.push(edgeKey([r, c], [r + 1, c]));
    }
    return list;
}

/* ── Plain-data deep clone / freeze (state is JSON-shaped by construction) ─ */
function deepClone(v) {
    if (Array.isArray(v)) return v.map(deepClone);
    if (v !== null && typeof v === 'object') {
        const o = {};
        for (const k of Object.keys(v)) o[k] = deepClone(v[k]);
        return o;
    }
    return v;
}
function deepFreeze(v) {
    if (v !== null && typeof v === 'object') {
        for (const k of Object.keys(v)) deepFreeze(v[k]);
        Object.freeze(v);
    }
    return v;
}

/* ── Fixtures (§3.1 A1F, §3.2 A3) — exact, nothing invented ─────────────── */
function initState(act) {
    if (act === 'A1F') {
        return {
            act: 'A1F', n: 3, T: 3, t: 0, toMove: 'MAX', pos: [1, 1],
            households: [
                { id: 'H_A', pos: [0, 2], need: 3, served: false, delay: 0 },
                { id: 'H_B', pos: [2, 2], need: 1, served: false, delay: 0 },
            ],
            /* §3.1 pre-closed storm edges — permanent, not Engine moves */
            preClosed: ['1,0|1,1', '1,1|2,1', '1,2|2,2', '0,0|0,1'],
            closedTemp: {},   /* edgeKey → remaining MAX plies (Engine closures) */
            everClosed: [],   /* Engine-closed edges (§4: never re-closable)     */
            fog: 0,           /* remaining MAX plies of fog                       */
            budgets:   { ROAD_CLOSE: 1, SUPPLY_DELAY: 0, FOG: 0 },
            cooldowns: { ROAD_CLOSE: 0, SUPPLY_DELAY: 0, FOG: 0 },
            rcTargets: ['0,1|0,2'],   /* §3.1 fixture-legal ROAD_CLOSE targets */
        };
    }
    if (act === 'A3') {
        return {
            act: 'A3', n: 5, T: 12, t: 0, toMove: 'MAX', pos: [2, 2],
            households: [
                { id: 'H_A', pos: [0, 2], need: 3, served: false, delay: 0 },
                { id: 'H_B', pos: [4, 2], need: 3, served: false, delay: 0 },
                { id: 'H_C', pos: [2, 0], need: 2, served: false, delay: 0 },
                { id: 'H_D', pos: [2, 4], need: 2, served: false, delay: 0 },
                { id: 'H_E', pos: [0, 0], need: 1, served: false, delay: 0 },
                { id: 'H_F', pos: [0, 4], need: 1, served: false, delay: 0 },
                { id: 'H_G', pos: [4, 0], need: 1, served: false, delay: 0 },
                { id: 'H_H', pos: [4, 4], need: 1, served: false, delay: 0 },
            ],
            preClosed: [],            /* §3.2: all 40 edges start open */
            closedTemp: {}, everClosed: [], fog: 0,
            budgets:   { ROAD_CLOSE: 2, SUPPLY_DELAY: 2, FOG: 1 },
            cooldowns: { ROAD_CLOSE: 0, SUPPLY_DELAY: 0, FOG: 0 },
            rcTargets: null,          /* §3.2: any currently open edge per §4 */
        };
    }
    throw new Error('Unknown act: ' + act);
}

/* ── State queries ──────────────────────────────────────────────────────── */
function inBounds(s, r, c) { return r >= 0 && r < s.n && c >= 0 && c < s.n; }
function edgeOpen(s, key) {
    return s.preClosed.indexOf(key) === -1 && !(s.closedTemp[key] > 0);
}
function householdAt(s, r, c) {
    for (const h of s.households) if (h.pos[0] === r && h.pos[1] === c) return h;
    return null;
}
function allServed(s) { return s.households.every(h => h.served); }

/* §3 terminal: t ≥ T or all households served. Both conditions change only
   on MAX plies, so terminal is always detected immediately after a MAX
   action — a trailing MIN ply can never occur. */
function isTerminal(s) { return s.t >= s.T || allServed(s); }

/* §3 action time costs */
function moveCost(s) { return s.fog > 0 ? 2 : 1; }
function serveCost(s, h) { return h.delay > 0 ? 2 : 1; }

/* ── Legal moves, in canonical enumeration order ────────────────────────── */
function legalMoves(s) {
    if (isTerminal(s)) return [];
    return s.toMove === 'MAX' ? maxMoves(s) : minMoves(s);
}

function maxMoves(s) {
    const r = s.pos[0], c = s.pos[1];
    const here = householdAt(s, r, c);
    const mc = moveCost(s);
    /* SERVE legality: household on this tile, unserved, time for its
       (possibly delayed) cost — §3 legality rule t + cost ≤ T. */
    const canServe = !!here && !here.served && s.t + serveCost(s, here) <= s.T;
    /* §3 urgency rule (hard constraint): occupying the tile of an unserved
       need-3 household while SERVE is legal makes MOVE illegal. Keyed to
       occupancy, never adjacency; releases when SERVE is not legal. */
    const urgent = canServe && here.need === 3;
    const acts = [];
    if (!urgent) {
        for (const d of DIRS) {
            const nr = r + d.dr, nc = c + d.dc;
            if (!inBounds(s, nr, nc)) continue;
            if (!edgeOpen(s, edgeKey([r, c], [nr, nc]))) continue;
            if (s.t + mc > s.T) continue;
            acts.push({ type: 'MOVE', dir: d.dir });
        }
    }
    if (canServe) acts.push({ type: 'SERVE' });
    /* WAIT costs 1; any nonterminal state has t < T, so WAIT is always
       legal — a live MAX node can never lack a legal move (§3). */
    acts.push({ type: 'WAIT' });
    return acts;
}

function minMoves(s) {
    const acts = [];
    /* §3 tie-break order for the Engine:
       enumerated edge list → house list → FOG → PASS. */
    if (s.budgets.ROAD_CLOSE > 0 && s.cooldowns.ROAD_CLOSE === 0) {
        const targets = s.rcTargets !== null ? s.rcTargets : allEdges(s.n);
        for (const e of targets) {
            /* §4: edge open AND not previously closed by the Engine */
            if (edgeOpen(s, e) && s.everClosed.indexOf(e) === -1)
                acts.push({ type: 'ROAD_CLOSE', edge: e });
        }
    }
    if (s.budgets.SUPPLY_DELAY > 0 && s.cooldowns.SUPPLY_DELAY === 0) {
        for (const h of s.households)
            if (!h.served && h.delay === 0)   /* §4: unserved, no delay token */
                acts.push({ type: 'SUPPLY_DELAY', house: h.id });
    }
    if (s.budgets.FOG > 0 && s.cooldowns.FOG === 0 && s.fog === 0)
        acts.push({ type: 'FOG' });           /* §4: fog inactive */
    acts.push({ type: 'PASS' });              /* §4: always legal */
    return acts;
}

/* ── Transition ─────────────────────────────────────────────────────────── */
function sameAction(a, b) {
    return a.type === b.type && a.dir === b.dir &&
           a.edge === b.edge && a.house === b.house;
}

function apply(s0, a) {
    const legal = legalMoves(s0);
    let found = false;
    for (const x of legal) if (sameAction(x, a)) { found = true; break; }
    if (!found)
        throw new Error('Illegal action ' + JSON.stringify(a) +
                        ' for ' + s0.toMove + ' at t=' + s0.t);
    const s = deepClone(s0);

    if (s.toMove === 'MAX') {
        let cost;
        if (a.type === 'MOVE') {
            cost = moveCost(s);
            const d = DIRS.filter(x => x.dir === a.dir)[0];
            s.pos = [s.pos[0] + d.dr, s.pos[1] + d.dc];
        } else if (a.type === 'SERVE') {
            const h = householdAt(s, s.pos[0], s.pos[1]);
            cost = serveCost(s, h);
            h.served = true;
        } else {                       /* WAIT */
            cost = 1;
        }
        s.t += cost;                   /* §3 order: act, then t += cost */
        /* §3 durations count MAX plies: tick every active effect once per
           MAX ply. A closure that reaches 0 is removed — the road reopens. */
        for (const k of Object.keys(s.closedTemp)) {
            s.closedTemp[k] -= 1;
            if (s.closedTemp[k] <= 0) delete s.closedTemp[k];
        }
        if (s.fog > 0) s.fog -= 1;
        for (const h of s.households) if (h.delay > 0) h.delay -= 1;
        s.toMove = 'MIN';
        /* Terminal (t ≥ T or all served) is now visible to isTerminal();
           legalMoves() on a terminal state returns [] — no trailing MIN ply. */
    } else {
        /* §3 cooldowns count MIN plies: tick existing counters first, then
           arm the cooldown of the move just used (so a cooldown k blocks
           exactly the k MIN plies after this one). */
        for (const k of Object.keys(s.cooldowns))
            if (s.cooldowns[k] > 0) s.cooldowns[k] -= 1;
        if (a.type === 'ROAD_CLOSE') {
            s.closedTemp[a.edge] = RULES.ROAD_CLOSE.duration;
            s.everClosed.push(a.edge);
            s.budgets.ROAD_CLOSE -= 1;
            s.cooldowns.ROAD_CLOSE = RULES.ROAD_CLOSE.cooldown;
        } else if (a.type === 'SUPPLY_DELAY') {
            const h = s.households.filter(x => x.id === a.house)[0];
            h.delay = RULES.SUPPLY_DELAY.duration;
            s.budgets.SUPPLY_DELAY -= 1;
            s.cooldowns.SUPPLY_DELAY = RULES.SUPPLY_DELAY.cooldown;
        } else if (a.type === 'FOG') {
            s.fog = RULES.FOG.duration;
            s.budgets.FOG -= 1;
            s.cooldowns.FOG = RULES.FOG.cooldown;
        }
        /* PASS: no effect */
        s.toMove = 'MAX';
    }
    return s;
}

/* ── Terminal utility (§3, MAX view) ────────────────────────────────────── */
function utility(s) {
    if (!isTerminal(s)) throw new Error('utility() called on nonterminal state');
    let u = 0;
    for (const h of s.households) {
        if (h.served) u += h.need === 3 ? 4 : h.need === 2 ? 2 : 1;
        else if (h.need === 3) u -= 3;
    }
    return u;
}

/* ── Exports: Step 2 API + frozen fixtures A1F (§3.1) and A3 (§3.2) ─────── */
const A1F = deepFreeze(initState('A1F'));
const A3  = deepFreeze(initState('A3'));

return deepFreeze({
    initState, legalMoves, apply, isTerminal, utility,
    edgeKey, allEdges, edgeOpen, householdAt, allServed, moveCost, serveCost,
    deepClone, A1F, A3, RULES,
    DIRS: ['N', 'E', 'S', 'W'],
});
})();
if (typeof module !== 'undefined' && module.exports) module.exports = L8_ENGINE;
