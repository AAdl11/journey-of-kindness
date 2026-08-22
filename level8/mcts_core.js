/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · MCTS Core — Monte Carlo Tree Search (AIMA 4e, Ch. 5.4)
   獨立模組:純函式、可測試、零 DOM 依賴。世界觀:獵人角 RV Park 八戶人家。
   對手是「時間」——志工只有一個下午,需求會隨時間升級,天氣會出招。
   規格源自 2026-08-09 視窗(8 戶、對手=時間);實作 2026-08-21。
   ═══════════════════════════════════════════════════════════════════════════ */
const MCTS = (() => {
'use strict';

// ── 可重現隨機(mulberry32,與 L4 模擬同標準)──────────────────────────────
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── 遊戲常數 ────────────────────────────────────────────────────────────────
const N_HOMES   = 8;    // 八戶人家,環狀排列(0-7)
const TIME_MAX  = 12;   // 一個下午 = 12 個時段(每段 15 分鐘,共 3 小時)
const ESCALATE_P = { 0: 0.00, 1: 0.22, 2: 0.30, 3: 0.00 }; // 需求升級機率(3=頂)
const RAIN_TICKS = [4, 8];   // 時間的兩次出招:起霧漲潮,移動變貴
const NEED_SCORE = { 1: 1, 2: 2, 3: 4 };  // 幫到時的分數(越急越重)
const MISS_PENALTY = 3;      // 收工時仍有紅色急件,每件扣分

// ── 距離:環狀步數(順逆時針取短)────────────────────────────────────────────
function dist(a, b) {
    const d = Math.abs(a - b);
    return Math.min(d, N_HOMES - d);
}

// ── 初始局面 ────────────────────────────────────────────────────────────────
// needs[i]: 0 沒事 / 1 輕 / 2 中 / 3 急    helped[i]: 已探視
// 起手:經理只交代了 3 戶的狀況(known),其餘要到了門口才知道——部分可觀測。
function newGame(seed) {
    const rng = mulberry32(seed);
    const needs = [], known = [];
    let urgent = 0;
    for (let i = 0; i < N_HOMES; i++) {
        const r = rng();
        const lvl = r < 0.15 ? 0 : r < 0.5 ? 1 : r < 0.85 ? 2 : 3;
        if (lvl === 3) urgent++;
        needs.push(lvl); known.push(false);
    }
    if (urgent === 0) needs[Math.floor(rng() * N_HOMES)] = 3;  // 保底一件急事
    // 經理交代 3 戶(隨機)
    const idx = [...Array(N_HOMES).keys()];
    for (let k = 0; k < 3; k++) known[idx.splice(Math.floor(rng() * idx.length), 1)[0]] = true;
    return {
        t: 0, pos: 0, travelCost: 1, score: 0,
        needs, known, helped: Array(N_HOMES).fill(false),
        log: [], seed
    };
}

function clone(s) {
    return { t: s.t, pos: s.pos, travelCost: s.travelCost, score: s.score,
             needs: s.needs.slice(), known: s.known.slice(), helped: s.helped.slice(),
             log: [], seed: s.seed };
}

function legalActions(s) {
    if (isTerminal(s)) return [];
    const acts = [];
    for (let i = 0; i < N_HOMES; i++) {
        if (!s.helped[i]) {
            const cost = dist(s.pos, i) * s.travelCost + 1;  // 走過去 + 探視
            if (s.t + cost <= TIME_MAX) acts.push(i);
        }
    }
    return acts;
}

// 時間的回合:每經過一個時段,未探視戶的需求可能升級;固定時點起霧。
function timeMoves(s, elapsed, rng) {
    for (let e = 0; e < elapsed; e++) {
        const tickAt = s.t - elapsed + e + 1;
        if (RAIN_TICKS.includes(tickAt)) { s.travelCost = 2; s.log.push({ ev: 'rain', t: tickAt }); }
        for (let i = 0; i < N_HOMES; i++) {
            if (!s.helped[i] && s.needs[i] > 0 && s.needs[i] < 3) {
                if (rng() < ESCALATE_P[s.needs[i]]) { s.needs[i]++; s.log.push({ ev: 'esc', home: i, t: tickAt }); }
            }
        }
    }
}

function applyAction(s0, a, rng) {
    const s = clone(s0);
    const cost = dist(s.pos, a) * s.travelCost + 1;
    s.t += cost; s.pos = a;
    timeMoves(s, cost, rng);
    s.helped[a] = true; s.known[a] = true;
    if (s.needs[a] > 0) s.score += NEED_SCORE[s.needs[a]];
    s.log.push({ ev: 'visit', home: a, need: s.needs[a], t: s.t });
    return s;
}

function isTerminal(s) {
    if (s.t >= TIME_MAX) return true;
    for (let i = 0; i < N_HOMES; i++) {
        if (!s.helped[i] && s.t + dist(s.pos, i) * s.travelCost + 1 <= TIME_MAX) return false;
    }
    return true;
}

function finalScore(s) {
    let sc = s.score;
    for (let i = 0; i < N_HOMES; i++) if (!s.helped[i] && s.needs[i] === 3) sc -= MISS_PENALTY;
    return sc;
}

// ── 模擬視角:AI 不偷看未知戶的真實需求(L4 同一條鐵律)──────────────────────
// 未知戶在模擬裡以「機率抽樣」代替真值(determinize):AI 排練的是可能性,不是答案。
function determinize(s, rng) {
    const d = clone(s);
    for (let i = 0; i < N_HOMES; i++) {
        if (!d.known[i] && !d.helped[i]) {
            const r = rng();
            d.needs[i] = r < 0.15 ? 0 : r < 0.5 ? 1 : r < 0.85 ? 2 : 3;
        }
    }
    return d;
}

function rolloutPolicy(s, rng) {   // 隨機探視(輕偏向近處)
    const acts = legalActions(s);
    if (!acts.length) return -1;
    acts.sort((x, y) => dist(s.pos, x) - dist(s.pos, y));
    return acts[Math.floor(Math.pow(rng(), 1.6) * acts.length)];
}

function rollout(s, rng) {
    let cur = s;
    while (!isTerminal(cur)) {
        const a = rolloutPolicy(cur, rng);
        if (a < 0) break;
        cur = applyAction(cur, a, rng);
    }
    return finalScore(cur);
}

// ── MCTS 主體:UCB1 選擇 → 擴展 → 隨機模擬 → 回傳 ───────────────────────────
function search(rootState, iters, seed) {
    const rng = mulberry32(seed ^ 0x9E3779B9);
    const root = { n: 0, w: 0, children: new Map(), acts: null };
    const C = 1.4;

    for (let it = 0; it < iters; it++) {
        // 每次迭代用一個「可能的世界」(determinization)
        let s = determinize(rootState, rng);
        let node = root, path = [root];
        // 1. Selection + 2. Expansion
        while (true) {
            if (node.acts === null) node.acts = legalActions(s);
            const unexpanded = node.acts.filter(a => !node.children.has(a));
            if (isTerminal(s) || node.acts.length === 0) break;
            let a;
            if (unexpanded.length) {
                a = unexpanded[Math.floor(rng() * unexpanded.length)];
                node.children.set(a, { n: 0, w: 0, children: new Map(), acts: null });
            } else {
                let best = -Infinity;
                for (const [act, ch] of node.children) {
                    const ucb = ch.w / ch.n + C * Math.sqrt(Math.log(node.n + 1) / ch.n);
                    if (ucb > best) { best = ucb; a = act; }
                }
            }
            s = applyAction(s, a, rng);
            node = node.children.get(a); path.push(node);
            if (node.n === 0) break;   // 新節點:去模擬
        }
        // 3. Simulation
        const value = rollout(s, rng);
        // 4. Backpropagation
        for (const nd of path) { nd.n++; nd.w += value; }
    }

    const stats = [];
    for (const [a, ch] of root.children)
        stats.push({ action: a, visits: ch.n, mean: ch.n ? ch.w / ch.n : 0 });
    stats.sort((x, y) => y.visits - x.visits);
    return { best: stats.length ? stats[0].action : -1, stats, iters };
}

// 貪婪基準(對照組:只看眼前最近的已知需求)
function greedyAction(s) {
    const acts = legalActions(s);
    if (!acts.length) return -1;
    let best = acts[0], bestV = -Infinity;
    for (const a of acts) {
        const need = s.known[a] ? s.needs[a] : 1.2;
        const v = need / (dist(s.pos, a) * s.travelCost + 1);
        if (v > bestV) { bestV = v; best = a; }
    }
    return best;
}

return { newGame, clone, legalActions, applyAction, isTerminal, finalScore,
         search, greedyAction, dist, mulberry32, determinize,
         N_HOMES, TIME_MAX, RAIN_TICKS };
})();
if (typeof module !== 'undefined') module.exports = MCTS;
