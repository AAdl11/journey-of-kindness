/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · The Tree of Many Futures — Search Core
   Steps 4–6: Minimax + Alpha-Beta Pruning + adversarial MCTS
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

/* ── Step 6: two-player adversarial Monte Carlo Tree Search ───────────────
   Every value is stored from MAX's perspective. Tree selection is therefore:
     MAX node: maximize mean + C * sqrt(ln(parentVisits) / childVisits)
     MIN node: minimize mean - C * sqrt(ln(parentVisits) / childVisits)
   Both conventions favor underexplored children. Rules are deterministic;
   the only randomness is the seeded PRNG used for expansion and rollouts. */
function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function uctScore(mean, parentVisits, childVisits, toMove, exploration) {
    if (childVisits === 0)
        return toMove === 'MAX' ? Infinity : -Infinity;
    const bonus = exploration * Math.sqrt(Math.log(parentVisits) / childVisits);
    return toMove === 'MAX' ? mean + bonus : mean - bonus;
}

/* Exposed because the same convention drives the Engineer View explanation.
   stats entries must be canonical-order {visits, mean} records. */
function selectUctIndex(stats, parentVisits, toMove, exploration) {
    if (toMove !== 'MAX' && toMove !== 'MIN') throw new Error('Invalid UCT role');
    const c = exploration === undefined ? Math.SQRT2 : exploration;
    let best = 0;
    let bestScore = uctScore(stats[0].mean, parentVisits, stats[0].visits, toMove, c);
    for (let i = 1; i < stats.length; i++) {
        const score = uctScore(stats[i].mean, parentVisits, stats[i].visits, toMove, c);
        if ((toMove === 'MAX' && score > bestScore) ||
            (toMove === 'MIN' && score < bestScore)) {
            best = i;
            bestScore = score;
        }
    }
    return best;
}

function mcts(state, iters, seed) {
    if (!Number.isInteger(iters) || iters <= 0)
        throw new Error('mcts iters must be a positive integer');
    if (!Number.isInteger(seed)) throw new Error('mcts seed must be an integer');
    if (E.isTerminal(state)) {
        return {
            action: null, value: E.utility(state), iterations: iters,
            seed, rootVisits: 0, rootActions: [],
        };
    }

    const rng = seededRandom(seed);
    const exploration = Math.SQRT2;

    function makeNode(nodeState, parent, action, canonicalIndex) {
        return {
            state: nodeState,
            parent,
            action,
            canonicalIndex,
            visits: 0,
            valueSum: 0,
            children: [],
            untried: E.legalMoves(nodeState).map((a, index) => ({ action: a, index })),
        };
    }

    const rootLegal = E.legalMoves(state);
    const root = makeNode(state, null, null, -1);

    function expand(node) {
        const pick = Math.floor(rng() * node.untried.length);
        const item = node.untried.splice(pick, 1)[0];
        const child = makeNode(E.apply(node.state, item.action), node,
                               item.action, item.index);
        node.children.push(child);
        return child;
    }

    function select(node) {
        const canonical = node.children.slice().sort((a, b) =>
            a.canonicalIndex - b.canonicalIndex);
        const stats = canonical.map(child => ({
            visits: child.visits,
            mean: child.valueSum / child.visits,
        }));
        return canonical[selectUctIndex(stats, node.visits, node.state.toMove,
                                        exploration)];
    }

    function rollout(rolloutState) {
        let current = rolloutState;
        while (!E.isTerminal(current)) {
            const legal = E.legalMoves(current);
            const action = legal[Math.floor(rng() * legal.length)];
            current = E.apply(current, action);
        }
        return E.utility(current);
    }

    for (let iteration = 0; iteration < iters; iteration++) {
        let node = root;
        while (!E.isTerminal(node.state) && node.untried.length === 0)
            node = select(node);
        if (!E.isTerminal(node.state) && node.untried.length > 0)
            node = expand(node);
        const reward = rollout(node.state);
        while (node !== null) {
            node.visits++;
            node.valueSum += reward;
            node = node.parent;
        }
    }

    const byIndex = {};
    for (const child of root.children) byIndex[child.canonicalIndex] = child;
    const rootActions = rootLegal.map((action, index) => {
        const child = byIndex[index];
        return {
            action,
            visits: child ? child.visits : 0,
            mean: child ? child.valueSum / child.visits : null,
        };
    });
    let chosenIndex = 0;
    for (let i = 1; i < rootActions.length; i++)
        if (rootActions[i].visits > rootActions[chosenIndex].visits) chosenIndex = i;
    const chosen = byIndex[chosenIndex];

    return {
        action: rootActions[chosenIndex].action,
        value: chosen.valueSum / chosen.visits,
        iterations: iters,
        seed,
        rootVisits: root.visits,
        rootActions,
    };
}

return Object.freeze({
    minimax, alphabeta, compareOrdering,
    mcts, uctScore, selectUctIndex,
});
})();
if (typeof module !== 'undefined' && module.exports) module.exports = L8_SEARCH;
