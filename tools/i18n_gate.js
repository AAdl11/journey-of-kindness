#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   JOK localization gate — smallest repeatable check that player-facing text
   is trilingual (zh / en / es), uses the canonical Ataraxy naming, contains
   no forbidden name variants, and that every inline script still parses.

   Run:  node tools/i18n_gate.js          (exit 0 = pass, 1 = fail)

   Canonical transition name (owner-approved):
     EN  Ataraxy Portico · ZH 靜心之門 · ES Portal de la Serenidad
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const failures = [];
let checks = 0;
function ok(cond, msg) { checks++; if (!cond) { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function stripComments(html) { return html.replace(/<!--[\s\S]*?-->/g, ''); }

/* HTML tag scanner that respects quoted '>' inside attribute values */
const TAG_RE = /<[a-zA-Z][^<>"']*(?:"[^"]*"[^<>"']*|'[^']*'[^<>"']*)*>/g;

const LEVELS = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7'];
const ATTR_LEVELS = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6'];

/* ── 1. data-attribute completeness: zh + en present ⇒ es present ───────── */
for (const lvl of ATTR_LEVELS) {
    const html = read(lvl + '/index.html');
    let pairs = 0, missing = 0;
    for (const tag of html.match(TAG_RE) || []) {
        const hasZh = /data-zh="/.test(tag), hasEn = /data-en="/.test(tag);
        if (!hasZh && !hasEn) continue;
        pairs++;
        const es = tag.match(/data-es="([^"]*)"/);
        if (!es || es[1].trim() === '') {
            missing++;
            if (missing <= 3) console.log('    · missing/empty data-es in ' + lvl + ': ' + tag.slice(0, 90));
        }
    }
    ok(missing === 0, lvl + ': ' + missing + ' of ' + pairs + ' translatable elements lack Spanish');
    console.log('  ' + lvl + ': ' + pairs + ' translatable elements, all trilingual: ' + (missing === 0 ? 'YES' : 'NO'));
}

/* ── 2. canonical Ataraxy naming present in every level ─────────────────── */
for (const lvl of LEVELS) {
    const html = read(lvl + '/index.html');
    ok(html.includes('Ataraxy Portico'), lvl + ': canonical English name "Ataraxy Portico" missing');
    ok(html.includes('靜心之門'), lvl + ': canonical Chinese name 靜心之門 missing');
    ok(html.includes('Portal de la Serenidad'), lvl + ': canonical Spanish name "Portal de la Serenidad" missing');
}

/* ── 3. forbidden variants absent from player-facing text ───────────────── */
const FORBIDDEN = [
    [/Portal de(?! la) Serenidad/, 'short Spanish variant "Portal de Serenidad"'],
    [/Puerta de la Serenidad/, 'variant "Puerta de la Serenidad"'],
    [/Gate of (Serenity|Stillness)/, 'non-canonical English gate name'],
];
for (const lvl of LEVELS.concat(['.'])) {
    const html = stripComments(read((lvl === '.' ? '' : lvl + '/') + 'index.html'));
    for (const [re, label] of FORBIDDEN)
        ok(!re.test(html), (lvl === '.' ? 'homepage' : lvl) + ': forbidden ' + label);
    /* Two-language currentLang ternaries silently drop Spanish. A conditional
       on 'zh'/'en' is only acceptable when 'es' is handled within the same
       expression — checked in a 500-char window after the match. */
    const ternary = /currentLang\s*===?\s*'(?:zh|en)'\s*\n?\s*\?/g;
    let m, bad = 0;
    while ((m = ternary.exec(html)) !== null) {
        const windowText = html.slice(m.index, m.index + 500);
        if (!/currentLang\s*===?\s*'es'|\bes\s*:/.test(windowText)) {
            bad++;
            if (bad <= 3) console.log('    · es-less ternary in ' + (lvl === '.' ? 'homepage' : lvl) + ': ' + windowText.slice(0, 80).replace(/\n/g, ' '));
        }
    }
    ok(bad === 0, (lvl === '.' ? 'homepage' : lvl) + ': ' + bad + ' currentLang ternaries do not handle Spanish');
}

/* ── 4. every inline script still parses (node --check) ─────────────────── */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jok-i18n-'));
for (const lvl of LEVELS.concat(['.'])) {
    const html = read((lvl === '.' ? '' : lvl + '/') + 'index.html');
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
    scripts.forEach(([, code], i) => {
        const f = path.join(tmp, (lvl === '.' ? 'home' : lvl) + '-' + i + '.js');
        fs.writeFileSync(f, code);
        let parses = true;
        try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
        catch (e) { parses = false; console.log('    · ' + String(e.stderr).split('\n')[0]); }
        ok(parses, (lvl === '.' ? 'homepage' : lvl) + ' inline script #' + i + ' does not parse');
    });
}

/* ── 5. Level 5 data model: every {en, zh} leaf carries es ──────────────── */
{
    const html = read('level5/index.html');
    const code = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
        .map(m => m[1]).join('\n')
        /* vm quirk: top-level const/let never lands on the context object.
           Rewriting this one declaration to var (test copy only) exposes it. */
        .replace(/\bconst characters\b/, 'var characters');
    const stubEl = () => ({ classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        style: {}, textContent: '', innerHTML: '', setAttribute() {}, getAttribute: () => null,
        play: () => ({ catch() {} }), pause() {}, addEventListener() {} });
    const ctx = vm.createContext({
        document: { addEventListener() {}, getElementById: stubEl, querySelectorAll: () => [] },
        window: { location: {} }, console,
    });
    vm.runInContext(code, ctx);
    let leaves = 0, bad = [];
    (function walk(v, trail) {
        if (Array.isArray(v)) return v.forEach((x, i) => walk(x, trail + '[' + i + ']'));
        if (v && typeof v === 'object') {
            const keys = Object.keys(v);
            if (keys.includes('en') && keys.includes('zh')) {
                leaves++;
                const es = v.es;
                const lenOk = !Array.isArray(v.en) ||
                    (Array.isArray(es) && es.length === v.en.length && es.length === v.zh.length);
                if (es === undefined || es === '' || !lenOk) bad.push(trail);
            }
            keys.forEach(k => walk(v[k], trail + '.' + k));
        }
    })(ctx.characters, 'characters');
    ok(Array.isArray(ctx.characters) && ctx.characters.length === 5, 'level5: characters data loads in vm');
    ok(bad.length === 0, 'level5: ' + bad.length + ' localized data leaves lack matching es: ' + bad.slice(0, 4).join(', '));
    console.log('  level5 data model: ' + leaves + ' localized leaves, all with es: ' + (bad.length === 0 ? 'YES' : 'NO'));
}

/* ── 6. homepage spans and Level 7 dictionaries stay balanced ───────────── */
{
    const home = read('index.html');
    const c = cls => (home.match(new RegExp('class="[^"]*\\b' + cls + '\\b', 'g')) || []).length;
    ok(c('text-en') === c('text-zh') && c('text-zh') === c('text-es'),
       'homepage: text-en/zh/es span counts differ (' + c('text-en') + '/' + c('text-zh') + '/' + c('text-es') + ')');
    const l7 = read('level7/index.html');
    const k = key => (l7.match(new RegExp('\\b' + key + ':', 'g')) || []).length;
    ok(k('en') === k('zh') && k('zh') === k('es'),
       'level7: en/zh/es dictionary key counts differ (' + k('en') + '/' + k('zh') + '/' + k('es') + ')');
}

console.log('──────────────────────────────────────────');
if (failures.length === 0) {
    console.log('I18N GATE PASSED — ' + checks + ' checks');
    process.exit(0);
}
console.log('I18N GATE FAILED — ' + failures.length + ' of ' + checks + ' checks');
process.exit(1);
