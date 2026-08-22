/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · The Tree of Many Futures — Search Core (Step 4: Minimax)
   Spec: docs/LEVEL8_ARCHITECTURE_BLUEPRINT.md (Approved 2026-08-22), Step 4.

   Deterministic full-horizon Minimax ground truth over the engine.js rules.
   No pruning, no memoization, no cutoff evaluation, no RNG, no clock, no
   DOM, no hidden state. All rules knowledge comes from engine.js only.

   Later steps (Alpha-Beta, MCTS) extend this module; they are NOT here.
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

return Object.freeze({ minimax });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = L8_SEARCH;
