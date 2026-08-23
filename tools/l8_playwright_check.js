#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   JOK Level 8 · real-browser release check (Blueprint Steps 8 & 10)
   Chromium (Playwright) plays all three acts end-to-end, portrait 390×844
   and phone-landscape 844×390:
     · zero page JS errors (third-party resource fetch failures excluded)
     · no horizontal clipping on any screen
     · complete scripted playthrough: Act 1 predict → tree, Act 2 prune +
       ordering toggle, Act 3 ghost rehearsals → finish
     · touch targets ≥ 44 px, Spanish selection never blank

   Run:  node tools/l8_playwright_check.js       (exit 0 = pass)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'level8', 'index.html') + '?uitest=1';
let passed = 0, failed = 0;
const failures = [];
function ok(cond, name) { if (cond) passed++; else { failed++; failures.push(name); console.log('  ✗ FAIL  ' + name); } }

async function noOverflow(page, label) {
    const o = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    ok(o.sw <= o.cw + 1, label + ': no horizontal clipping (scrollWidth ' + o.sw + ' ≤ ' + o.cw + ')');
}

async function playthrough(browser, viewport, label) {
    console.log('· ' + label + ' (' + viewport.width + '×' + viewport.height + ')');
    const ctx = await browser.newContext({ viewport, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !/Failed to load resource|net::|ERR_/.test(m.text()))
            errors.push('console: ' + m.text());
    });
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    await noOverflow(page, label + ' intro');

    /* Spanish never blank */
    await page.click('button[data-lang="es"]');
    const blank = await page.evaluate(() =>
        [...document.querySelectorAll('[data-str]')].filter(el => el.textContent.trim() === '').length);
    ok(blank === 0, label + ': Spanish leaves zero blank strings');
    const startText = await page.textContent('#btn-start');
    ok(/misión/i.test(startText), label + ': Spanish start button reads "' + startText.trim() + '"');
    await page.click('button[data-lang="zh-Hant"]');

    /* touch targets */
    const box = await (await page.$('#btn-start')).boundingBox();
    ok(box.height >= 44, label + ': start button ≥ 44px (' + Math.round(box.height) + ')');

    /* ── Act 1: optimal line with prediction ── */
    await page.click('#btn-start');
    await page.waitForSelector('#tile-1-2.tap-target', { timeout: 5000 });
    await noOverflow(page, label + ' act1 board');
    await page.click('#tile-1-2');                       /* MOVE E */
    await page.waitForSelector('#chip-pass', { timeout: 5000 });
    ok(true, label + ': Act 1 prediction prompt appeared');
    await page.click('#chip-edge');                      /* predict the road-cut */
    await page.waitForSelector('#tile-0-2.tap-target', { timeout: 8000 });
    await page.click('#tile-0-2');                       /* MOVE N onto H_A */
    await page.waitForSelector('#btn-serve', { timeout: 8000 });
    const wrongTapShrugged = await page.evaluate(() => {
        const before = document.getElementById('pawn').style.left;
        document.getElementById('tile-1-1').click();     /* MOVE illegal under urgency */
        return document.getElementById('pawn').style.left === before;
    });
    ok(wrongTapShrugged, label + ': urgency rule blocks moving off the need-3 tile');
    await page.click('#btn-serve');
    await page.waitForSelector('#result-overlay.open', { timeout: 8000 });
    const resultTitle = await page.textContent('#result-title');
    ok(resultTitle.length > 0, label + ': Act 1 result shown (' + resultTitle.trim() + ')');
    await page.click('#result-btn-0');                   /* see the whole tree */
    await page.waitForSelector('#tree-svg', { timeout: 8000 });
    const circles = await page.$$eval('#tree-svg circle', els => els.length);
    ok(circles === 122, label + ': complete tree renders all 122 nodes (' + circles + ')');
    await noOverflow(page, label + ' tree view');

    /* ── Act 2: prune prediction + reveal + ordering toggle ── */
    await page.click('#btn-to-act2');
    await page.waitForSelector('#branch-0', { timeout: 5000 });
    await page.click('#branch-0');                       /* predict a branch */
    await page.waitForSelector('#btn-order-toggle', { timeout: 10000 });
    const counter = await page.textContent('#tree-counter');
    ok(/68/.test(counter), label + ': explored-node counter shows 68 (' + counter.trim() + ')');
    const pruned = await page.$$eval('#tree-svg circle[opacity]', els => els.length);
    ok(pruned > 0, label + ': pruned branches visibly grayed (' + pruned + ' nodes)');
    const scissors = await page.evaluate(() => document.getElementById('tree-svg').textContent.includes('✂️'));
    ok(scissors, label + ': ✂️ marks the cutoffs');
    const t1 = await page.textContent('#btn-order-toggle');
    await page.click('#btn-order-toggle');
    const t2 = await page.textContent('#btn-order-toggle');
    ok(t1 !== t2 && /62/.test(t2), label + ': ordering toggle shows the second count (' + t2.trim() + ')');

    /* ── Act 3: ghost rehearsals to terminal ── */
    await page.click('#btn-to-act3');
    await page.waitForSelector('#tile-2-2', { timeout: 5000 });
    await noOverflow(page, label + ' act3 board');
    let sawGhost = false;
    for (let turn = 0; turn < 30; turn++) {
        const done = await page.$('#result-overlay.open');
        if (done) break;
        try {
            await page.waitForSelector('#btn-follow', { timeout: 20000 });
        } catch (e) {
            const finished = await page.$('#result-overlay.open');
            if (finished) break;
            throw e;
        }
        if (!sawGhost) sawGhost = (await page.$$eval('.ghost', els => els.length)) > 0;
        await page.click('#btn-follow');
        await page.waitForTimeout(250);
    }
    ok(sawGhost, label + ': ghost volunteers rehearsed routes');
    await page.waitForSelector('#result-overlay.open', { timeout: 30000 });
    ok(true, label + ': Act 3 reached terminal');
    await page.click('#result-btn-0');
    await page.waitForSelector('#screen-finish.active', { timeout: 5000 });
    ok(true, label + ': finish screen reached — all three acts playable');
    await noOverflow(page, label + ' finish');

    ok(errors.length === 0, label + ': zero runtime JS errors' + (errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''));
    await ctx.close();
}

(async () => {
    const browser = await chromium.launch();
    try {
        await playthrough(browser, { width: 390, height: 844 }, 'portrait');
        await playthrough(browser, { width: 844, height: 390 }, 'landscape');
    } catch (e) {
        failed++;
        failures.push('run aborted: ' + e.message);
        console.log('  ✗ ABORT  ' + e.message);
    }
    await browser.close();
    console.log('──────────────────────────────────────────');
    if (failed === 0) { console.log('L8 BROWSER GATE PASSED — ' + passed + ' checks'); process.exit(0); }
    console.log('L8 BROWSER GATE FAILED — ' + failed + ' of ' + (passed + failed));
    process.exit(1);
})();
