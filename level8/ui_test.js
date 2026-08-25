#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · ui_test.js — Step 8 UI release gate (static + logic layer)
   Companion to tools/l8_playwright_check.js (real-browser playthrough).

   Verifies, without a browser:
   · strings.js is complete and balanced across en / zh-Hant / es
   · index.html uses engine.js + search_core.js only (no mcts_core, no V0)
   · no hard-coded display text outside strings.js; no <detail-s> teaching;
     no button-grid play; touch-first mobile contract present
   · Step 9 approved assets present and used; homepage unlock present
   · the numbers the UI shows are exactly the verified backend numbers
   · the three-act decision loop the UI drives terminates (headless replay)

   Run:  node level8/ui_test.js         (exit 0 = pass)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const E = require('./engine.js');
const SC = require('./search_core.js');
const STR = require('./strings.js');

let passed = 0, failed = 0;
const failures = [];
function ok(cond, name) { if (cond) passed++; else { failed++; failures.push(name); console.log('  ✗ FAIL  ' + name); } }
function section(s) { console.log('· ' + s); }

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');

/* ── S1: strings.js completeness ────────────────────────────────────────── */
section('S1 strings.js — three locales, balanced, non-empty');
const locales = Object.keys(STR);
ok(JSON.stringify(locales.slice().sort()) === JSON.stringify(['en', 'es', 'zh-Hant']),
   'locales are exactly en / zh-Hant / es (got ' + locales.join(',') + ')');
const enKeys = Object.keys(STR.en).sort();
for (const loc of locales) {
    const keys = Object.keys(STR[loc]).sort();
    ok(JSON.stringify(keys) === JSON.stringify(enKeys), loc + ' key set matches en (' + keys.length + ' keys)');
    ok(Object.values(STR[loc]).every(v => typeof v === 'string' && v.trim() !== ''),
       loc + ' has no empty strings');
}
console.log('  ' + enKeys.length + ' UI strings × 3 languages');

/* ── S2: architecture bans ──────────────────────────────────────────────── */
section('S2 index.html — imports, bans, single text source');
ok(/<script src="engine\.js">/.test(html), 'imports engine.js');
ok(/<script src="search_core\.js">/.test(html), 'imports search_core.js');
ok(/<script src="strings\.js">/.test(html), 'imports strings.js');
ok(!/mcts_core/.test(html), 'no runtime dependence on superseded mcts_core.js');
ok(!/<details/i.test(html), 'no <detai' + 'ls> textbook teaching');
ok(!/data-zh=|data-en=|data-es=/.test(html), 'no per-element data-lang attrs — strings.js is the single source');
ok(!/determiniz/i.test(inline), 'no determinization in the UI (V1 fully observable)');
for (const forbidden of ['5.61', '4.60', '3.28', '120 test', '120 個', '120個']) {
    ok(!html.includes(forbidden), 'unreproducible V0 benchmark figure "' + forbidden + '" absent');
}
/* the old V0 eight-button park grid must be gone */
ok(!/class="park"|class="rv"/.test(html), 'V0 eight-button choice grid absent');
/* CJK only allowed in <title>, the language-name button, and code comments
   (comments are not display text) */
const bodyText = html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/>中文</g, '><')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
ok(!/[㐀-鿿　-〿＀-￯]/.test(bodyText.replace(inline, '')),
   'no hard-coded CJK display text in markup outside strings.js');
ok(!/[㐀-鿿]/.test(inline), 'no hard-coded CJK display text in the UI script');

/* ── S3: mobile touch-first contract (level1_STABLE standard) ───────────── */
section('S3 mobile contract');
for (const [label, needle] of [
    ['tap highlight disabled', '-webkit-tap-highlight-color: transparent'],
    ['horizontal overflow protected', 'overflow-x: hidden'],
    ['touch controls enabled', 'touch-action: manipulation'],
    ['Android blur disabled on mobile', 'backdrop-filter: none !important'],
    ['portrait breakpoint present', '@media (max-width: 640px)'],
    ['landscape breakpoint present', '@media (orientation: landscape) and (max-height: 600px)'],
    ['reduced-motion honored', 'prefers-reduced-motion'],
    ['touch targets ≥ 44px', 'min-height: 44px'],
    ['pause control present', 'togglePause'],
    ['safe home always available', 'goHome'],
]) ok(html.includes(needle), label);
ok(!/class="dpad"|id="dpad"|D-pad/i.test(html), 'no D-pad — tap-to-move only');

/* ── S4: Step 9 semantic asset contract wired ───────────────────────────── */
section('S4 approved art contract and homepage unlock');
for (const name of ['l8_bg_grove.png', 'l8_bg_park.png', 'l8_volunteer_sheet.png',
    'l8_ghost_volunteer_sheet.png', 'l8_engine_totem_sheet.png', 'l8_house_marker_sheet.png',
    'l8_need_badges.png', 'l8_roadblock.png', 'l8_fog_overlay.png', 'l8_tree_node_sheet.png'])
    ok(html.includes('assets/images/' + name), 'wired: ' + name);
const missing = ['l8_bg_grove.png', 'l8_bg_park.png', 'l8_volunteer_sheet.png',
    'l8_ghost_volunteer_sheet.png', 'l8_engine_totem_sheet.png', 'l8_house_marker_sheet.png',
    'l8_need_badges.png', 'l8_roadblock.png', 'l8_fog_overlay.png', 'l8_tree_node_sheet.png']
    .filter(n => !fs.existsSync(path.join(__dirname, 'assets', 'images', n)));
ok(missing.length === 0, 'approved final art present (10/10)' + (missing.length ? ': missing ' + missing.join(', ') : ''));
for (const hook of ['house-art', 'l8_volunteer_sheet.png', 'l8_ghost_volunteer_sheet.png',
    'l8_engine_totem_sheet.png', 'l8_roadblock.png', 'l8_fog_overlay.png',
    'l8_tree_node_sheet.png']) ok(html.includes(hook), 'runtime art hook: ' + hook);
const homeHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const l8Card = (homeHtml.match(/<!-- Level 8 -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/) || [''])[0];
ok(/level-card l8" onclick="goToLevel\(8\)"/.test(l8Card), 'homepage Level 8 card links to playable level');
ok(!/coming-soon|Coming Soon|即將推出|Próximamente/.test(l8Card), 'homepage Level 8 card is unlocked in all languages');

/* ── S5: Step 11 learning-evidence events ───────────────────────────────── */
section('S5 learning-evidence events');
for (const ev of ['l8_predict_engine', 'l8_prune_predict', 'l8_rehearsal_follow',
    'level_start', 'level_complete', 'level_abandon'])
    ok(inline.includes("'" + ev + "'"), 'event wired: ' + ev);
ok(/typeof gtag === 'function'/.test(inline), 'analytics wrapper is stub-safe');
ok(inline.includes('jok_progress'), 'jok_progress local model updated');

/* ── S6: inline script parses ───────────────────────────────────────────── */
section('S6 script parses');
{
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'l8ui-'));
    const f = path.join(tmp, 'ui.js');
    fs.writeFileSync(f, inline);
    let parses = true;
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
    catch (e) { parses = false; console.log('    ' + String(e.stderr).split('\n')[0]); }
    ok(parses, 'inline UI script parses');
}

/* ── S7: the numbers the UI displays are the verified backend numbers ───── */
section('S7 backend number cross-checks');
{
    /* Act 1 tree: UI buildTree walk must equal minimax full expansion */
    let count = 0;
    (function grow(s) {
        count++;
        if (E.isTerminal(s)) return;
        for (const a of E.legalMoves(s)) grow(E.apply(s, a));
    })(E.initState('A1F'));
    const mm = SC.minimax(E.initState('A1F'));
    ok(count === mm.nodes, 'UI tree walk == minimax full expansion (' + count + ' vs ' + mm.nodes + ')');
    ok(count === 122, 'complete A1F tree is exactly 122 nodes');
    ok(mm.value === 4 && mm.action.type === 'MOVE' && mm.action.dir === 'E', 'root ground truth +4 via MOVE E');

    /* Act 2 viz walk (identical logic to index.html computeAbViz) must equal
       search_core alphabeta natural-order nodesExplored */
    let explored = 0, prunedCount = 0;
    (function visit(s, alpha, beta) {
        explored++;
        if (E.isTerminal(s)) return E.utility(s);
        const isMax = s.toMove === 'MAX';
        const legal = E.legalMoves(s);
        let best = null;
        for (let i = 0; i < legal.length; i++) {
            const v = visit(E.apply(s, legal[i]), alpha, beta);
            if (best === null || (isMax ? v > best : v < best)) best = v;
            if (isMax) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
            if (beta < alpha) {
                for (let j = i + 1; j < legal.length; j++)
                    prunedCount += SC.minimax(E.apply(s, legal[j])).nodes;
                break;
            }
        }
        return best;
    })(E.initState('A1F'), -Infinity, Infinity);
    const nat = SC.alphabeta(E.initState('A1F'), -Infinity, Infinity, { order: 'natural' });
    const bf = SC.alphabeta(E.initState('A1F'), -Infinity, Infinity, { order: 'best-first' });
    ok(explored === nat.nodesExplored,
       'UI pruning walk == alphabeta natural nodesExplored (' + explored + ' vs ' + nat.nodesExplored + ')');
    ok(explored + prunedCount === count, 'explored + pruned == full tree (' + explored + '+' + prunedCount + '=' + count + ')');
    ok(nat.value === mm.value && JSON.stringify(nat.action) === JSON.stringify(mm.action), 'alphabeta answer == minimax answer');
    ok(bf.value === mm.value && JSON.stringify(bf.action) === JSON.stringify(mm.action), 'best-first answer == minimax answer');
    ok(nat.nodesExplored !== bf.nodesExplored, 'ordering toggle shows two distinct counts (' + nat.nodesExplored + ' vs ' + bf.nodesExplored + ')');
    console.log('  tree 122 · explored natural ' + nat.nodesExplored + ' · best-first ' + bf.nodesExplored);
}

/* ── S8: headless replay of the exact loops the UI drives ───────────────── */
section('S8 three-act decision loops terminate (headless replay)');
{
    const SEED_BASE = parseInt((inline.match(/MCTS_SEED_BASE = (\d+)/) || [])[1], 10);
    ok(Number.isInteger(SEED_BASE), 'UI seed base found (' + SEED_BASE + ')');

    /* Act 1: the taught optimal line, Engine replying with minimax (as UI does) */
    let s = E.initState('A1F'), ply = 0;
    const script = [{ type: 'MOVE', dir: 'E' }, { type: 'MOVE', dir: 'N' }, { type: 'SERVE' }];
    let si = 0, guard = 0;
    while (!E.isTerminal(s) && guard++ < 20) {
        if (s.toMove === 'MAX') { s = E.apply(s, script[si++]); ply++; }
        else { s = E.apply(s, SC.minimax(s).action); ply++; }
    }
    ok(E.isTerminal(s) && E.utility(s) === 4, 'Act 1 optimal playthrough ends +4 (Engine plays exact minimax)');

    /* Act 1: the trap line loses under exact play — the lesson exists */
    let s2 = E.initState('A1F');
    s2 = E.apply(s2, { type: 'MOVE', dir: 'N' });
    s2 = E.apply(s2, SC.minimax(s2).action);
    ok(s2.closedTemp['0,1|0,2'] > 0, 'Act 1 trap: Engine cuts the N route');

    /* Act 3: follow-best vs Engine-MCTS, exactly the UI loop, to terminal */
    let s3 = E.initState('A3'); let p3 = 0; guard = 0;
    const t0 = Date.now();
    while (!E.isTerminal(s3) && guard++ < 60) {
        if (s3.toMove === 'MAX') {
            const r = SC.mcts(s3, 100, SEED_BASE + p3);
            s3 = E.apply(s3, r.action); p3++;
        } else {
            s3 = E.apply(s3, SC.mcts(s3, 100, SEED_BASE + p3).action); p3++;
        }
    }
    const elapsed = Date.now() - t0;
    ok(E.isTerminal(s3), 'Act 3 follow-best loop reaches terminal (' + p3 + ' plies, ' + elapsed + 'ms @100 iters)');
    ok(Number.isInteger(E.utility(s3)), 'Act 3 terminal utility computable (' + E.utility(s3) + ')');

    /* determinism: same seeds → byte-identical rehearsal */
    const a = SC.mcts(E.initState('A3'), 100, SEED_BASE);
    const b = SC.mcts(E.initState('A3'), 100, SEED_BASE);
    ok(JSON.stringify(a) === JSON.stringify(b), 'rehearsals reproducible for a fixed seed');

    /* default budget stays responsive on mid hardware */
    const t1 = Date.now();
    SC.mcts(E.initState('A3'), 500, SEED_BASE);
    const ms = Date.now() - t1;
    ok(ms < 4000, 'default 500-iteration rehearsal computes in ' + ms + 'ms');
}

console.log('──────────────────────────────────────────');
if (failed === 0) { console.log('L8 UI GATE PASSED — ' + passed + ' checks'); process.exit(0); }
console.log('L8 UI GATE FAILED — ' + failed + ' of ' + (passed + failed));
process.exit(1);
