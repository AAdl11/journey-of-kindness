/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · The Tree of Many Futures — Search Core
   Steps 4–5: Minimax ground truth + Alpha-Beta Pruning
   Spec: docs/LEVEL8_ARCHITECTURE_BLUEPRINT.md (Approved 2026-08-22).

   Deterministic full-horizon search over the engine.js rules. No memoization,
   cutoff evaluation, RNG, clock, DOM, or hidden state. All game knowledge
   comes from engine.js only. Alpha-Beta preserves canonical tie-breaking even
   when the traversal order changes.
   ═══════════════════════════════════════════════════════════════════════════ */
const L8_SEARCH = (() => {
'use strict';

/* Engine access: Node module or shared classic-script scope (same dual-load
   convention as engine.js). */
const E = (typeof module !== 'undefined' && module.exports)
    ? require('./engine.js')
    : L8_ENGINE;

/* minimax(state) → { action, value, nodes, pv }
   · MAX picks the greatest terminal utility; MIN picks the smallest.
   · Children are visited in engine.js canonical order; equal values keep
     the FIRST canonical action (strict > for MAX, strict < for MIN).
   · nodes counts every recursive state visit, root and leaves included.
   · pv is the complete alternating principal variation (MIN moves and
     PASS included).
   · Terminal input → { action: null, value: utility(state), nodes: 1, pv: [] }.
   · Never mutates its input (engine.apply is pure). */
function minimax(state) {
    if (E.isTerminal(state))
        return { action: null, value: E.utility(state), nodes: 1, pv: [] };
    const isMax = state.toMove === 'MAX';
    const legal = E.legalMoves(state);       /* canonical enumeration order */
    let nodes = 1;                           /* this state visit */
    let bestAction = null, bestValue = null, bestPv = null;
    for (const a of legal) {
        const r = minimax(E.apply(state, a));
        nodes += r.nodes;
        if (bestValue === null ||
            (isMax ? r.value > bestValue : r.value < bestValue)) {
            bestAction = a;
            bestValue = r.value;
            bestPv = [a].concat(r.pv);
        }
    }
    return { action: bestAction, value: bestValue, nodes: nodes, pv: bestPv };
}

/* ── Step 5: deterministic move ordering ──────────────────────────────────
   The built-in best-first strategy is a cheap domain heuristic, NOT a hidden
   Minimax call. It estimates whether urgent households remain reachable inside
   the time horizon. For a MAX candidate followed by a MIN ply, it scores the
   worst immediate legal Engine reply. Ordering probes are reported separately
   and are never disguised as searched tree nodes. */
function shortestOpenDistance(state, target) {
    const q = [[state.pos[0], state.pos[1], 0]];
    const seen = {};
    seen[state.pos[0] + ',' + state.pos[1]] = true;
    for (let head = 0; head < q.length; head++) {
        const r = q[head][0], c = q[head][1], dist = q[head][2];
        if (r === target[0] && c === target[1]) return dist;
        const next = [[r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1]];
        for (const p of next) {
            const nr = p[0], nc = p[1], key = nr + ',' + nc;
            if (nr < 0 || nr >= state.n || nc < 0 || nc >= state.n) continue;
            if (seen[key]) continue;
            if (!E.edgeOpen(state, E.edgeKey([r, c], [nr, nc]))) continue;
            seen[key] = true;
            q.push([nr, nc, dist + 1]);
        }
    }
    return Infinity;
}

function orderingStateScore(state) {
    if (E.isTerminal(state)) return E.utility(state) * 1000;
    const remaining = state.T - state.t;
    let score = 0;
    for (const h of state.households) {
        const weight = h.need === 3 ? 4 : h.need === 2 ? 2 : 1;
        if (h.served) {
            score += weight * 100;
            continue;
        }
        const distance = shortestOpenDistance(state, h.pos);
        const required = distance * E.moveCost(state) + E.serveCost(state, h);
        if (required <= remaining) score += weight * 20 - required;
        else if (h.need === 3) score -= 100;
    }
    return score;
}

function bestFirstItems(state, canonical, stats) {
    const items = canonical.map((action, index) => ({ action, index, score: 0 }));
    for (const item of items) {
        const child = E.apply(state, item.action);
        stats.orderingProbes++;
        if (state.toMove === 'MAX' && !E.isTerminal(child)) {
            /* Robust one-reply estimate: MAX candidates are ranked by their
               worst immediate legal MIN response. */
            let worst = Infinity;
            for (const reply of E.legalMoves(child)) {
                const replyState = E.apply(child, reply);
                stats.orderingProbes++;
                worst = Math.min(worst, orderingStateScore(replyState));
            }
            item.score = worst;
        } else {
            item.score = orderingStateScore(child);
        }
    }
    items.sort((a, b) => {
        const scoreDelta = state.toMove === 'MAX' ? b.score - a.score : a.score - b.score;
        return scoreDelta || a.index - b.index;
    });
    return items;
}

function actionKey(action) { return JSON.stringify(action); }

function orderedItems(state, canonical, options, stats) {
    const natural = canonical.map((action, index) => ({ action, index }));
    if (typeof options.orderActions === 'function') {
        const reordered = options.orderActions(state, canonical.slice());
        if (!Array.isArray(reordered) || reordered.length !== canonical.length)
            throw new Error('orderActions must return every legal action exactly once');
        const byKey = {};
        for (let i = 0; i < canonical.length; i++) byKey[actionKey(canonical[i])] = i;
        const used = {};
        return reordered.map(action => {
            const key = actionKey(action), index = byKey[key];
            if (index === undefined || used[key])
                throw new Error('orderActions returned an invalid action permutation');
            used[key] = true;
            return { action: canonical[index], index };
        });
    }
    if (options.order === 'best-first') return bestFirstItems(state, canonical, stats);
    if (options.order !== undefined && options.order !== 'natural')
        throw new Error('Unknown Alpha-Beta order: ' + options.order);
    return natural;
}

/* alphabeta(state, alpha, beta, options)
   options.order: 'natural' (default) or 'best-first'.
   options.orderActions: optional deterministic permutation hook.

   Canonical action identity is independent of traversal order: equal values
   always choose the lowest engine.js canonical index. This is essential for
   exact action equality with Minimax. */
function alphabeta(state, alpha, beta, options) {
    const lo = alpha === undefined ? -Infinity : alpha;
    const hi = beta === undefined ? Infinity : beta;
    const opts = options || {};
    const stats = { orderingProbes: 0 };

    function visit(current, aBound, bBound) {
        if (E.isTerminal(current)) {
            return {
                action: null, value: E.utility(current), nodes: 1,
                nodesExplored: 1, pv: [], cutoffs: 0,
            };
        }
        const isMax = current.toMove === 'MAX';
        const canonical = E.legalMoves(current);
        const items = orderedItems(current, canonical, opts, stats);
        let nodes = 1, cutoffs = 0;
        let bestAction = null, bestValue = null, bestPv = null, bestIndex = Infinity;
        for (const item of items) {
            const result = visit(E.apply(current, item.action), aBound, bBound);
            nodes += result.nodes;
            cutoffs += result.cutoffs;
            const improves = bestValue === null ||
                (isMax ? result.value > bestValue : result.value < bestValue) ||
                (result.value === bestValue && item.index < bestIndex);
            if (improves) {
                bestAction = item.action;
                bestValue = result.value;
                bestPv = [item.action].concat(result.pv);
                bestIndex = item.index;
            }
            if (isMax) aBound = Math.max(aBound, bestValue);
            else bBound = Math.min(bBound, bestValue);
            /* Strict inequality is deliberate. With reordered children, an
               equality cutoff can return only a bound for a canonically earlier
               action and falsely turn it into a tie. Continuing on equality
               preserves the engine's canonical tie-break exactly. */
            if (bBound < aBound) {
                cutoffs++;
                break;
            }
        }
        return {
            action: bestAction, value: bestValue, nodes,
            nodesExplored: nodes, pv: bestPv, cutoffs,
        };
    }

    const result = visit(state, lo, hi);
    result.order = opts.order || (opts.orderActions ? 'custom' : 'natural');
    result.orderingProbes = stats.orderingProbes;
    return result;
}

function compareOrdering(state) {
    return {
        natural: alphabeta(state, -Infinity, Infinity, { order: 'natural' }),
        bestFirst: alphabeta(state, -Infinity, Infinity, { order: 'best-first' }),
    };
}

return Object.freeze({ minimax, alphabeta, compareOrdering });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = L8_SEARCH;
