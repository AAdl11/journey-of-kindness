#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · tests.js — Step 2 unit gate + Step 3 invariant audit
   Spec: docs/LEVEL8_ARCHITECTURE_BLUEPRINT.md (Approved 2026-08-22).

   Run:  node level8/tests.js            → all suites
         node level8/tests.js unit       → Step 2 gate only
         node level8/tests.js invariants → Step 3 gate only

   Exit code 0 iff every assertion passes. The engine is RNG-free; the only
   PRNG here is a fixed-seed mulberry32 used by the TEST HARNESS to walk A3
   deterministically (identical results on every run).
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const E = require('./engine.js');
const fs = require('fs');
const path = require('path');

/* ── tiny harness ───────────────────────────────────────────────────────── */
let passed = 0, failed = 0;
const failures = [];
function ok(cond, name) {
    if (cond) { passed++; }
    else { failed++; failures.push(name); console.log('  ✗ FAIL  ' + name); }
}
function eq(got, want, name) {
    const g = JSON.stringify(got), w = JSON.stringify(want);
    ok(g === w, name + '  [got ' + g + ' | want ' + w + ']');
}
function throws(fn, name) {
    let threw = false;
    try { fn(); } catch (e) { threw = true; }
    ok(threw, name + ' (expected throw)');
}
function section(title) { console.log('· ' + title); }

/* deterministic test-harness PRNG (fixed seeds — reproducible) */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const A = { M: (d) => ({ type: 'MOVE', dir: d }), S: { type: 'SERVE' },
            W: { type: 'WAIT' }, P: { type: 'PASS' },
            RC: (e) => ({ type: 'ROAD_CLOSE', edge: e }),
            SD: (h) => ({ type: 'SUPPLY_DELAY', house: h }),
            FOG: { type: 'FOG' } };
/* hand-build helper: clone a fixture state and override fields (blueprint
   Step 2 gate explicitly tests on hand-built positions) */
function craft(base, patch) { return Object.assign(E.deepClone(base), patch); }

/* ═══════════════════ STEP 2 — UNIT SUITE ═══════════════════════════════ */
function suiteUnit() {
    console.log('══ STEP 2 UNIT GATE ══');

    section('U1 fixture A1F is exact (§3.1)');
    const f = E.initState('A1F');
    eq([f.n, f.T, f.t, f.toMove], [3, 3, 0, 'MAX'], 'A1F n/T/t/toMove');
    eq(f.pos, [1, 1], 'A1F volunteer start');
    eq(f.households, [
        { id: 'H_A', pos: [0, 2], need: 3, served: false, delay: 0 },
        { id: 'H_B', pos: [2, 2], need: 1, served: false, delay: 0 },
    ], 'A1F households');
    eq(f.preClosed.slice().sort(),
       ['0,0|0,1', '1,0|1,1', '1,1|2,1', '1,2|2,2'], 'A1F pre-closed edges');
    eq(E.allEdges(3).length, 12, 'A1F 12 grid edges');
    eq(E.allEdges(3).filter(e => E.edgeOpen(f, e)).length, 8, 'A1F 8 open edges');
    eq(f.budgets, { ROAD_CLOSE: 1, SUPPLY_DELAY: 0, FOG: 0 }, 'A1F budgets');
    eq(f.cooldowns, { ROAD_CLOSE: 0, SUPPLY_DELAY: 0, FOG: 0 }, 'A1F cooldowns');
    eq(f.rcTargets, ['0,1|0,2'], 'A1F fixture-legal ROAD_CLOSE target');
    eq([f.fog, f.closedTemp, f.everClosed], [0, {}, []], 'A1F no initial effects');

    section('U2 fixture A3 is exact (§3.2)');
    const g = E.initState('A3');
    eq([g.n, g.T, g.t, g.toMove], [5, 12, 0, 'MAX'], 'A3 n/T/t/toMove');
    eq(g.pos, [2, 2], 'A3 volunteer start');
    eq(E.allEdges(5).length, 40, 'A3 40 grid edges');
    ok(E.allEdges(5).every(e => E.edgeOpen(g, e)), 'A3 all 40 edges open');
    eq(g.households.map(h => [h.id, h.pos, h.need]), [
        ['H_A', [0, 2], 3], ['H_B', [4, 2], 3], ['H_C', [2, 0], 2],
        ['H_D', [2, 4], 2], ['H_E', [0, 0], 1], ['H_F', [0, 4], 1],
        ['H_G', [4, 0], 1], ['H_H', [4, 4], 1],
    ], 'A3 households (ids, positions, needs, order)');
    ok(g.households.every(h => !h.served && h.delay === 0), 'A3 all unserved, no tokens');
    eq(g.budgets, { ROAD_CLOSE: 2, SUPPLY_DELAY: 2, FOG: 1 }, 'A3 budgets 2/2/1');
    eq([g.fog, g.closedTemp, g.everClosed, g.cooldowns],
       [0, {}, [], { ROAD_CLOSE: 0, SUPPLY_DELAY: 0, FOG: 0 }],
       'A3 no initial fog/closure/cooldown');
    eq(g.rcTargets, null, 'A3 ROAD_CLOSE may target any open edge (§4)');

    section('U3 canonical action ordering (§3)');
    eq(E.legalMoves(f), [A.M('N'), A.M('E'), A.W],
       'A1F root MAX order = MOVE N, MOVE E, WAIT (S/W pre-closed)');
    eq(E.legalMoves(g), [A.M('N'), A.M('E'), A.M('S'), A.M('W'), A.W],
       'A3 root MAX order = MOVE N,E,S,W, WAIT');
    const gMin = E.apply(g, A.W);                    /* MAX WAIT → MIN turn */
    const mm = E.legalMoves(gMin);
    eq(mm.length, 50, 'A3 MIN branching at start = 40 RC + 8 SD + FOG + PASS');
    eq(mm[0], A.RC('0,0|0,1'), 'A3 MIN order: first edge is 0,0|0,1');
    eq(mm[1], A.RC('0,0|1,0'), 'A3 MIN order: second edge is 0,0|1,0');
    eq(mm[39], A.RC('4,3|4,4'), 'A3 MIN order: last edge is 4,3|4,4');
    eq(mm[40], A.SD('H_A'), 'A3 MIN order: houses follow edges, H_A first');
    eq(mm[47], A.SD('H_H'), 'A3 MIN order: H_H last house');
    eq(mm[48], A.FOG, 'A3 MIN order: FOG after houses');
    eq(mm[49], A.P, 'A3 MIN order: PASS last');
    const fMin = E.apply(f, A.M('N'));
    eq(E.legalMoves(fMin), [A.RC('0,1|0,2'), A.P],
       'A1F MIN legal = fixture target + PASS only (SD/FOG budget 0)');

    section('U4 action time costs (§3)');
    eq(E.apply(g, A.M('N')).t, 1, 'MOVE costs 1');
    eq(E.apply(g, A.W).t, 1, 'WAIT costs 1');
    let s4 = E.apply(g, A.W);                    /* t=1, MIN */
    s4 = E.apply(s4, A.FOG);                     /* fog=2, MAX */
    eq(E.moveCost(s4), 2, 'fog active → move cost 2');
    s4 = E.apply(s4, A.M('N'));
    eq(s4.t, 3, 'fogged MOVE costs 2 (t 1→3)');
    let s4b = E.apply(g, A.W);
    s4b = E.apply(s4b, A.SD('H_A'));
    s4b.pos = [0, 2];                            /* hand-built position */
    const hA = E.householdAt(s4b, 0, 2);
    eq(E.serveCost(s4b, hA), 2, 'delay token → serve cost 2');
    s4b = E.apply(s4b, A.S);
    eq(s4b.t, 3, 'delayed SERVE costs 2 (t 1→3)');
    ok(E.householdAt(s4b, 0, 2).served, 'delayed SERVE still serves');
    let s4c = E.apply(E.apply(E.apply(g, A.M('N')), A.P), A.M('N')); /* → (0,2), t=2 */
    eq(s4c.pos, [0, 2], 'two MOVE N reach H_A tile');
    s4c = E.apply(E.apply(s4c, A.P), A.S);
    eq(s4c.t, 3, 'normal SERVE costs 1');
    ok(E.householdAt(s4c, 0, 2).served, 'SERVE marks household served');

    section('U5 legality violations throw');
    throws(() => E.apply(f, A.M('S')), 'A1F MOVE S through pre-closed edge');
    throws(() => E.apply(f, A.M('W')), 'A1F MOVE W through pre-closed edge');
    throws(() => E.apply(f, A.S), 'SERVE with no household on tile');
    const closedP = E.apply(E.apply(f, A.M('N')), A.RC('0,1|0,2'));
    throws(() => E.apply(closedP, A.M('E')), 'MOVE through Engine-closed edge');
    throws(() => E.apply(fMin, A.RC('1,1|1,2')), 'A1F RC outside fixture target list');
    throws(() => E.apply(fMin, A.SD('H_A')), 'A1F SUPPLY_DELAY with budget 0');
    throws(() => E.apply(fMin, A.FOG), 'A1F FOG with budget 0');
    const term = E.apply(craft(g, { t: 11 }), A.W);   /* t=12 terminal */
    throws(() => E.apply(term, A.W), 'apply() on terminal state');
    throws(() => E.utility(g), 'utility() on nonterminal state');
    throws(() => E.initState('A2'), 'unknown act name');

    section('U6 budgets & cooldowns (§4)');
    let s6 = E.apply(g, A.W);                        /* MIN ply 1 */
    s6 = E.apply(s6, A.RC('0,0|0,1'));
    eq(s6.budgets.ROAD_CLOSE, 1, 'RC budget 2→1');
    eq(s6.cooldowns.ROAD_CLOSE, 1, 'RC cooldown armed = 1');
    eq(s6.closedTemp['0,0|0,1'], 2, 'closure duration = 2 MAX plies');
    eq(s6.everClosed, ['0,0|0,1'], 'everClosed records the edge');
    s6 = E.apply(s6, A.W);                           /* MAX; MIN ply 2 next */
    const min2 = E.legalMoves(s6);
    ok(!min2.some(a => a.type === 'ROAD_CLOSE'),
       'cooldown: no RC on the MIN ply after use (budget remains)');
    ok(min2.some(a => a.type === 'SUPPLY_DELAY'), 'SD unaffected by RC cooldown');
    s6 = E.apply(s6, A.P);                           /* MIN ply 2: PASS */
    eq(s6.cooldowns.ROAD_CLOSE, 0, 'RC cooldown ticks 1→0 on the MIN ply');
    s6 = E.apply(s6, A.W);                           /* MAX; MIN ply 3 next */
    const min3 = E.legalMoves(s6);
    ok(min3.some(a => a.type === 'ROAD_CLOSE'), 'RC available again after cooldown');
    ok(!min3.some(a => a.type === 'ROAD_CLOSE' && a.edge === '0,0|0,1'),
       'still-closed edge is not a target');
    /* exhaust RC budget, then verify hard stop */
    s6 = E.apply(s6, A.RC('4,3|4,4'));
    eq(s6.budgets.ROAD_CLOSE, 0, 'RC budget 1→0');
    s6 = E.apply(s6, A.W); s6 = E.apply(s6, A.P); s6 = E.apply(s6, A.W);
    ok(!E.legalMoves(s6).some(a => a.type === 'ROAD_CLOSE'),
       'RC budget exhausted → never offered again');
    throws(() => E.apply(s6, A.RC('2,2|2,3')), 'third ROAD_CLOSE throws');
    /* FOG budget 1 + cooldown 2 */
    let s6f = E.apply(g, A.W);
    s6f = E.apply(s6f, A.FOG);
    eq([s6f.budgets.FOG, s6f.cooldowns.FOG, s6f.fog], [0, 2, 2], 'FOG armed: budget 0, cd 2, dur 2');
    s6f = E.apply(s6f, A.W); s6f = E.apply(s6f, A.P);
    eq(s6f.cooldowns.FOG, 1, 'FOG cooldown 2→1');
    s6f = E.apply(s6f, A.W); s6f = E.apply(s6f, A.P);
    eq(s6f.cooldowns.FOG, 0, 'FOG cooldown 1→0');
    throws(() => E.apply(E.apply(s6f, A.W), A.FOG), 'second FOG throws (budget)');
    /* SUPPLY_DELAY preconditions */
    let s6d = E.apply(g, A.W);
    s6d = E.apply(s6d, A.SD('H_C'));
    eq(E.householdAt(s6d, 2, 0).delay, 2, 'delay token = 2 MAX plies');
    s6d = E.apply(s6d, A.W);
    throws(() => E.apply(s6d, A.SD('H_C')), 'SD on token-active household throws');
    /* isolate the token precondition from the cooldown: crafted MIN state
       with cd clear and H_C's token still active */
    const tok = craft(g, { toMove: 'MIN' });
    tok.households[2].delay = 1;                     /* H_C token active */
    const sdOffers = E.legalMoves(tok)
        .filter(a => a.type === 'SUPPLY_DELAY').map(a => a.house);
    ok(sdOffers.indexOf('H_C') === -1 && sdOffers.indexOf('H_A') !== -1,
       '§4 precondition: token-active household excluded, others offered');
    s6d = E.apply(s6d, A.P); s6d = E.apply(s6d, A.W);   /* token expires */
    eq(E.householdAt(s6d, 2, 0).delay, 0, 'delay token expired after 2 MAX plies');
    ok(E.legalMoves(E.apply(s6d, A.P)).length > 0, 'game continues');
    let s6d2 = E.apply(s6d, A.SD('H_C'));
    eq(s6d2.budgets.SUPPLY_DELAY, 0, 'expired token → re-delay legal, budget 2→0');
    const served6 = craft(g, {});
    served6.households[2].served = true;             /* H_C served */
    served6.toMove = 'MIN';
    ok(!E.legalMoves(served6).some(a => a.type === 'SUPPLY_DELAY' && a.house === 'H_C'),
       'SD never targets a served household');

    section('U7 temporary road reopening (§4) + no re-close');
    let s7 = E.apply(g, A.W);                        /* t=1 */
    s7 = E.apply(s7, A.RC('2,2|2,3'));               /* close E exit of center */
    ok(!E.legalMoves(s7).some(a => a.type === 'MOVE' && a.dir === 'E'),
       'closed: MOVE E illegal on MAX ply 2');
    eq(s7.closedTemp['2,2|2,3'], 2, 'closure counter 2');
    s7 = E.apply(s7, A.W);                           /* MAX ply 2 */
    eq(s7.closedTemp['2,2|2,3'], 1, 'closure counter 2→1');
    s7 = E.apply(s7, A.P);
    ok(!E.legalMoves(s7).some(a => a.type === 'MOVE' && a.dir === 'E'),
       'closed: MOVE E still illegal on MAX ply 3');
    s7 = E.apply(s7, A.W);                           /* MAX ply 3 */
    eq(s7.closedTemp['2,2|2,3'], undefined, 'closure expired after 2 MAX plies');
    ok(E.edgeOpen(s7, '2,2|2,3'), 'road reopened');
    s7 = E.apply(s7, A.P);
    ok(E.legalMoves(E.apply(s7, A.W)).length > 0, 'state well-formed after reopen');
    ok(E.legalMoves(craft(s7, { toMove: 'MAX' })).some(a => a.type === 'MOVE' && a.dir === 'E'),
       'reopened: MOVE E legal again');
    const min7 = E.legalMoves(E.apply(s7, A.W));   /* advance to a MIN ply */
    ok(!min7.some(a => a.type === 'ROAD_CLOSE' && a.edge === '2,2|2,3'),
       '§4 not-previously-closed: reopened edge can never be re-closed');
    ok(min7.some(a => a.type === 'ROAD_CLOSE' && a.edge === '0,0|0,1'),
       'other edges still closable (budget remains)');

    section('U8 urgency rule (§3 hard constraint)');
    let s8 = E.apply(E.apply(E.apply(g, A.M('N')), A.P), A.M('N')); /* on H_A, t=2 */
    eq(E.legalMoves(craft(s8, { toMove: 'MAX' })), [A.S, A.W],
       'on unserved need-3 tile with SERVE legal → only SERVE, WAIT');
    const adj = craft(g, { pos: [1, 2] });           /* adjacent to H_A */
    ok(E.legalMoves(adj).some(a => a.type === 'MOVE'),
       'adjacency does NOT trigger urgency (occupancy-keyed)');
    const need2 = craft(g, { pos: [2, 0] });         /* on H_C, need 2 */
    ok(E.legalMoves(need2).some(a => a.type === 'MOVE') &&
       E.legalMoves(need2).some(a => a.type === 'SERVE'),
       'need-2 household never triggers urgency');
    const late = craft(g, { pos: [0, 2], t: 11 });
    eq(E.legalMoves(late), [A.S, A.W],
       't=11, serve cost 1 legal → urgency binds on last ply');
    const lateDelay = craft(g, { pos: [0, 2], t: 11 });
    lateDelay.households[0].delay = 1;               /* serve cost 2 > horizon */
    eq(E.legalMoves(lateDelay), [A.M('E'), A.M('S'), A.M('W'), A.W],
       'delayed SERVE no longer legal → urgency releases, MOVEs return');
    const servedTile = craft(g, { pos: [0, 2] });
    servedTile.households[0].served = true;
    ok(E.legalMoves(servedTile).some(a => a.type === 'MOVE') &&
       !E.legalMoves(servedTile).some(a => a.type === 'SERVE'),
       'served household frees the tile (no urgency, no SERVE)');

    section('U9 terminal order & utility (§3)');
    ok(E.isTerminal(term) && term.t === 12, 't reaches T → terminal');
    eq(E.legalMoves(term), [], 'terminal → no moves offered (no trailing MIN ply)');
    eq(term.toMove, 'MIN', 'terminal detected immediately after the MAX action');
    eq(E.utility(term), -6, 'A3 nothing served: −3·2 need-3 = −6');
    const allSrv = craft(g, { t: 9 });
    allSrv.households.forEach(h => { h.served = true; });
    ok(E.isTerminal(allSrv), 'all served → terminal before t=T');
    eq(E.utility(allSrv), 16, 'A3 all served: 4+4+2+2+1+1+1+1 = 16');
    const mixed = craft(g, { t: 12 });
    ['H_A', 'H_C', 'H_E'].forEach(id => {
        mixed.households.filter(h => h.id === id)[0].served = true;
    });
    eq(E.utility(mixed), 4, 'A3 mixed: 4+2+1 − 3(H_B) = 4');
    const fWin = craft(f, { t: 3 });
    fWin.households[0].served = true;
    eq(E.utility(fWin), 4, 'A1F serve H_A only: +4 (need-1 unserved → no penalty)');
    eq(E.utility(craft(f, { t: 3 })), -3, 'A1F nothing served: −3');

    section('U10 purity & determinism');
    const snapF = JSON.stringify(E.A1F), snapG = JSON.stringify(E.A3);
    E.legalMoves(E.A1F); E.apply(E.A1F, A.M('N'));
    E.legalMoves(E.A3);  E.apply(E.A3, A.W);
    eq(JSON.stringify(E.A1F), snapF, 'exported A1F fixture never mutated');
    eq(JSON.stringify(E.A3), snapG, 'exported A3 fixture never mutated');
    const in10 = E.initState('A3');
    const before10 = JSON.stringify(in10);
    E.apply(in10, A.M('N'));
    eq(JSON.stringify(in10), before10, 'apply() does not mutate its input');
    const script = [A.M('N'), A.SD('H_B'), A.M('N'), A.RC('0,1|0,2'), A.S, A.P, A.M('S')];
    const run = () => script.reduce((s, a) => E.apply(s, a), E.initState('A3'));
    eq(JSON.stringify(run()), JSON.stringify(run()),
       'identical action sequence → byte-identical state');
    const src = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
    ok(!/Math\.random|Date\.now|new Date|document\.|window\.|localStorage/.test(src),
       'engine source static audit: RNG-free, clock-free, DOM-free');
}

/* ═══════════════════ STEP 3 — INVARIANT AUDIT ══════════════════════════ */

/* I1: exhaustive walk of the COMPLETE A1F game tree (§3.1 gate). */
function auditA1FTree() {
    let nodes = 0, leaves = 0, maxMaxBranch = 0, maxMinBranch = 0;
    function walk(s, lastMover) {
        nodes++;
        if (E.isTerminal(s)) {
            leaves++;
            ok(lastMover === 'MAX', 'I1 terminal reached only via a MAX action');
            ok(E.legalMoves(s).length === 0, 'I1 terminal offers no moves');
            const u = E.utility(s);
            ok(Number.isInteger(u) && u >= -3 && u <= 5, 'I1 leaf utility in range');
            ok(s.t === 3, 'I1 A1F leaf always at t=3 (all costs 1)');
            ok(!E.allServed(s), 'I1 H_B unreachable → all-served never triggers');
            return;
        }
        const legal = E.legalMoves(s);
        ok(legal.length >= 1, 'I1 nonterminal state has ≥1 legal action');
        if (s.toMove === 'MAX') {
            maxMaxBranch = Math.max(maxMaxBranch, legal.length);
            ok(legal.some(a => a.type === 'WAIT'), 'I1 WAIT present at every MAX node');
            ok(legal.length <= 3, 'I1 §3.1 MAX branching ≤ 3');
        } else {
            maxMinBranch = Math.max(maxMinBranch, legal.length);
            ok(legal.some(a => a.type === 'PASS'), 'I1 PASS present at every MIN node');
            ok(legal.length <= 2, 'I1 §3.1 MIN branching ≤ 2');
        }
        ok(s.budgets.ROAD_CLOSE >= 0 && s.budgets.ROAD_CLOSE <= 1, 'I1 RC budget in [0,1]');
        for (const a of legal) walk(E.apply(s, a), s.toMove);
    }
    walk(E.initState('A1F'), null);
    return { nodes, leaves, maxMaxBranch, maxMinBranch };
}

/* I2: deterministic seeded random walks of A3 asserting invariants each ply */
function auditA3Walks(nGames) {
    let terminals = 0;
    for (let seed = 1; seed <= nGames; seed++) {
        const rng = mulberry32(seed);
        let s = E.initState('A3');
        const used = { ROAD_CLOSE: 0, SUPPLY_DELAY: 0, FOG: 0 };
        let plies = 0, lastMover = null, prevT = 0;
        while (!E.isTerminal(s)) {
            plies++;
            if (plies > 40) { ok(false, 'I2 walk exceeded ply safety cap'); break; }
            const legal = E.legalMoves(s);
            if (legal.length < 1) { ok(false, 'I2 empty legal set (seed ' + seed + ')'); break; }
            if (s.toMove === 'MAX' && !legal.some(a => a.type === 'WAIT')) {
                ok(false, 'I2 WAIT missing at MAX node (seed ' + seed + ')'); break;
            }
            const a = legal[Math.floor(rng() * legal.length)];
            if (s.toMove === 'MIN' && a.type !== 'PASS') used[a.type]++;
            lastMover = s.toMove;
            s = E.apply(s, a);
            /* per-ply invariants */
            if (!(s.t >= prevT && s.t <= s.T)) { ok(false, 'I2 t out of bounds'); break; }
            prevT = s.t;
            const b = s.budgets;
            if (b.ROAD_CLOSE < 0 || b.SUPPLY_DELAY < 0 || b.FOG < 0) {
                ok(false, 'I2 negative budget'); break;
            }
            if (Object.keys(s.closedTemp).length > 2) { ok(false, 'I2 >2 closures live'); break; }
            if (!Object.values(s.closedTemp).every(v => v === 1 || v === 2)) {
                ok(false, 'I2 closure counter out of range'); break;
            }
            if (s.fog < 0 || s.fog > 2) { ok(false, 'I2 fog out of range'); break; }
            if (!s.households.every(h => h.delay >= 0 && h.delay <= 2)) {
                ok(false, 'I2 delay out of range'); break;
            }
            if (!Object.values(s.cooldowns).every(v => v >= 0 && v <= 2)) {
                ok(false, 'I2 cooldown out of range'); break;
            }
        }
        if (E.isTerminal(s)) {
            terminals++;
            ok(lastMover === 'MAX', 'I2 no trailing MIN ply (seed ' + seed + ')');
            const u = E.utility(s);
            ok(Number.isInteger(u) && u >= -6 && u <= 16, 'I2 utility in [−6,16]');
            /* budgets strictly consumed: initial − final = uses */
            ok(2 - s.budgets.ROAD_CLOSE === used.ROAD_CLOSE &&
               2 - s.budgets.SUPPLY_DELAY === used.SUPPLY_DELAY &&
               1 - s.budgets.FOG === used.FOG,
               'I2 budgets strictly consumed (seed ' + seed + ')');
        }
    }
    return terminals;
}

/* I3: scripted deterministic expiry timeline (durations tick exactly) */
function auditExpiry() {
    let s = E.apply(E.initState('A3'), A.W);          /* t1 · MIN1 */
    s = E.apply(s, A.RC('2,2|2,3'));
    s = E.apply(s, A.W);                              /* t2: closure 2→1 */
    s = E.apply(s, A.FOG);                            /* MIN2 */
    s = E.apply(s, A.W);                              /* t3: closure 1→gone, fog 2→1 */
    eq(s.closedTemp['2,2|2,3'], undefined, 'I3 closure expired exactly after 2 MAX plies');
    eq(s.fog, 1, 'I3 fog ticked 2→1');
    s = E.apply(s, A.SD('H_D'));                      /* MIN3 */
    s = E.apply(s, A.W);                              /* t4: fog 1→0, delay 2→1 */
    eq(s.fog, 0, 'I3 fog expired exactly after 2 MAX plies');
    eq(E.householdAt(s, 2, 4).delay, 1, 'I3 delay ticked 2→1');
    eq(E.moveCost(s), 1, 'I3 move cost back to 1 after fog');
    s = E.apply(s, A.P);
    s = E.apply(s, A.W);                              /* t5: delay 1→0 */
    eq(E.householdAt(s, 2, 4).delay, 0, 'I3 delay expired exactly after 2 MAX plies');
}

/* I4: no permanent rules-created lockout — MIN spends everything as fast as
   the rules allow (always the first non-PASS legal move); afterwards the
   board fully recovers. */
function auditLockoutRecovery() {
    let s = E.initState('A3');
    while (!E.isTerminal(s)) {
        const legal = E.legalMoves(s);
        let a;
        if (s.toMove === 'MAX') a = { type: 'WAIT' };
        else a = legal.find(x => x.type !== 'PASS') || { type: 'PASS' };
        s = E.apply(s, a);
        const spent = s.budgets.ROAD_CLOSE === 0 && s.budgets.SUPPLY_DELAY === 0 &&
                      s.budgets.FOG === 0;
        const cleared = Object.keys(s.closedTemp).length === 0 && s.fog === 0 &&
                        s.households.every(h => h.delay === 0);
        if (spent && cleared && s.toMove === 'MAX' && !E.isTerminal(s)) {
            ok(E.allEdges(5).every(e => E.edgeOpen(s, e)),
               'I4 all 40 edges open again after every effect expired');
            const legal2 = E.legalMoves(s);
            ok(legal2.filter(x => x.type === 'MOVE').length === 4,
               'I4 volunteer fully mobile from center after recovery');
            ok(legal2.some(x => x.type === 'WAIT'), 'I4 WAIT still guaranteed');
            return true;
        }
    }
    return false;
}

function suiteInvariants() {
    console.log('══ STEP 3 INVARIANT AUDIT ══');

    section('I1 A1F complete-tree exhaustive audit (§3.1 gate)');
    const r1 = auditA1FTree();
    console.log('    A1F complete tree: ' + r1.nodes + ' nodes, ' + r1.leaves +
                ' leaves, max MAX branching ' + r1.maxMaxBranch +
                ', max MIN branching ' + r1.maxMinBranch);
    ok(r1.nodes <= 200, 'I1 §3.1 gate: complete-tree node count ≤ 200 (exact: ' + r1.nodes + ')');
    eq(r1.nodes, 122, 'I1 node count matches hand-derived expectation (122)');
    eq(r1.leaves, 69, 'I1 leaf count matches hand-derived expectation (69)');
    const r1b = auditA1FTree();
    eq(r1b.nodes, r1.nodes, 'I1 enumeration deterministic across runs');

    section('I2 A3 seeded walks: legal-action availability + bounded effects');
    const terms = auditA3Walks(300);
    eq(terms, 300, 'I2 all 300 deterministic seeded games reach terminal');

    section('I3 deterministic duration/cooldown expiry');
    auditExpiry();

    section('I4 no permanent rules-created lockout');
    ok(auditLockoutRecovery(),
       'I4 aggressive-MIN game reaches full-recovery checkpoint before terminal');
}

/* ═══════════════════ RUN ═══════════════════════════════════════════════ */
const mode = (process.argv[2] || 'all').toLowerCase();
if (mode === 'unit' || mode === 'all') suiteUnit();
if (mode === 'invariants' || mode === 'all') suiteInvariants();

console.log('──────────────────────────────────────────');
if (failed === 0) {
    console.log('ALL TESTS PASSED — ' + passed + ' assertions (' + mode + ')');
    process.exit(0);
} else {
    console.log('FAILED ' + failed + ' / ' + (passed + failed) + ' assertions (' + mode + ')');
    failures.slice(0, 20).forEach(f => console.log('  · ' + f));
    process.exit(1);
}
