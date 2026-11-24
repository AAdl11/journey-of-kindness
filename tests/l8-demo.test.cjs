/* JOK Level 8 · first-visit AI demo, goal lines and result screens (SPEC-04).
 * Run: node tests/l8-demo.test.cjs   (no browser needed; exit 0 = pass)
 *
 * Loads level8/engine.js, search_core.js, strings.js and the inline UI script
 * of level8/index.html into a Node vm with a small DOM stub, then drives the
 * real UI functions. Covers: the demo auto-plays only on the first visit, the
 * replay button plays it again, a tap made during the demo is not lost, every
 * result screen has Next / Play again / Level menu, and the three locales hold
 * the same number of strings. No network, no production writes. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const L8 = path.resolve(__dirname, '..', 'level8');
const html = fs.readFileSync(path.join(L8, 'index.html'), 'utf8');
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.includes('L8_ENGINE')).join('\n');
const STR = require(path.join(L8, 'strings.js'));

let passed = 0;
function check(name, cond) { assert(cond, name); passed++; console.log('PASS ' + name); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── minimal DOM ─────────────────────────────────────────────────────────── */
function makeDom() {
  const registry = new Map();
  class ClassList {
    constructor() { this.s = new Set(); }
    add(...c) { c.forEach(x => this.s.add(x)); }
    remove(...c) { c.forEach(x => this.s.delete(x)); }
    contains(c) { return this.s.has(c); }
    toggle(c, f) { const on = f === undefined ? !this.s.has(c) : !!f; on ? this.s.add(c) : this.s.delete(c); return on; }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.parent = null; this._id = '';
      this.dataset = {}; this.classList = new ClassList(); this.attrs = {}; this.listeners = [];
      this.style = { setProperty() {} }; this.textContent = ''; this.disabled = false; this.onclick = null;
    }
    get id() { return this._id; }
    set id(v) { if (this._id && registry.get(this._id) === this) registry.delete(this._id); this._id = v; if (v) registry.set(v, this); }
    set className(v) { this.classList = new ClassList(); String(v).split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c)); }
    get className() { return [...this.classList.s].join(' '); }
    set innerHTML(v) { this.children.slice().forEach(c => c.remove()); this._html = v; }
    get innerHTML() { return this._html || ''; }
    get firstChild() { return this.children[0] || null; }
    appendChild(c) { if (c.parent) c.remove(); c.parent = this; this.children.push(c); if (c._id) registry.set(c._id, c); return c; }
    insertBefore(c, ref) { if (!ref) return this.appendChild(c); if (c.parent) c.remove(); c.parent = this; this.children.splice(this.children.indexOf(ref), 0, c); return c; }
    remove() {
      if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; }
      (function un(x) { if (x._id && registry.get(x._id) === x) registry.delete(x._id); x.children.forEach(un); })(this);
    }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k]; }
    addEventListener(type, fn) { if (type === 'click') this.listeners.push(fn); }
    click() { if (this.disabled) return; this.listeners.forEach(f => f()); if (this.onclick) this.onclick(); }
    scrollIntoView() {}
    all() { const out = []; (function walk(x) { x.children.forEach(c => { out.push(c); walk(c); }); })(this); return out; }
    querySelectorAll(sel) { return this.all().filter(e => matches(e, sel)); }
    querySelector(sel) {
      if (/ tbody$/.test(sel)) { const host = registry.get(sel.split(' ')[0].slice(1)); if (!host.tbody) host.tbody = new El('tbody'); return host.tbody; }
      return this.querySelectorAll(sel)[0] || null;
    }
  }
  function matches(e, sel) {
    const attr = sel.match(/^\[data-([a-z-]+)\]$/);
    if (attr) return typeof e.dataset[attr[1].replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())] === 'string';
    if (/^[a-z]+$/.test(sel)) return e.tagName === sel.toUpperCase();
    const m = sel.match(/^([a-z]*)((?:\.[\w-]+)+)$/);
    if (m) return (!m[1] || e.tagName === m[1].toUpperCase()) && m[2].split('.').filter(Boolean).every(c => e.classList.contains(c));
    throw new Error('selector not supported by test DOM: ' + sel);
  }
  /* build the static markup of <body> (everything before the first script) */
  const body = new El('body');
  const markup = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script src="engine.js">'));
  const stack = [body];
  for (const tok of markup.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g)) {
    const [, close, tag, attrs] = tok;
    if (close) { if (stack.length > 1) stack.pop(); continue; }
    const el = new El(tag);
    for (const a of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) {
      const k = a[1], v = a[2];
      if (k === 'id') el.id = v;
      else if (k === 'class') el.className = v;
      else if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())] = v;
      else if (k === 'style') { if (/display:\s*none/.test(v)) el.style.display = 'none'; }
      else el.setAttribute(k, v);
    }
    stack[stack.length - 1].appendChild(el);
    if (!/^(img|br|input|meta|link)$/i.test(tag) && !/\/$/.test(attrs.trim())) stack.push(el);
  }
  let ready = null;
  const document = {
    body, documentElement: { clientWidth: 390 },
    getElementById: id => registry.get(id) || null,
    createElement: tag => new El(tag),
    querySelectorAll: sel => body.querySelectorAll(sel),
    querySelector: sel => body.querySelector(sel),
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') ready = fn; },
  };
  return { document, boot: () => ready() };
}

function makeStorage(seed, broken) {
  const data = new Map(Object.entries(seed || {}));
  if (broken) return { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
}

function loadLevel(storage) {
  const dom = makeDom();
  const ctx = {
    document: dom.document, localStorage: storage, console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    location: { search: '?uitest=1', href: '', reload() {} },
    innerHeight: 844, scrollTo() {}, addEventListener() {}, matchMedia: () => ({ matches: false }),
    Image: class { set src(v) {} }, gtag: () => {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['engine.js', 'search_core.js', 'strings.js']) vm.runInContext(fs.readFileSync(path.join(L8, f), 'utf8'), ctx, { filename: f });
  vm.runInContext(inline, ctx, { filename: 'level8/index.html#inline' });
  const said = [];
  const realNarrate = ctx.narrate;
  ctx.narrate = msg => { said.push(msg); realNarrate(msg); };
  dom.boot();
  const get = expr => vm.runInContext(expr, ctx);
  return { ctx, get, said, $: id => dom.document.getElementById(id) };
}
const zh = STR['zh-Hant'];
const waitFor = async (fn, ms = 3000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) return false; await sleep(5); } return true; };

(async () => {
  /* ── 1. first visit: demo auto-plays, a tap during it is held ─────────── */
  const storage = makeStorage({ jok_progress: JSON.stringify({ levels: { '1': { coins: 2 } }, l8: { completed: true }, other: 5 }) });
  const A = loadLevel(storage);
  A.ctx.startMission();
  check('first visit: demo starts automatically', A.get('demoActive') === true);
  check('first visit: demo opens with the demo line', A.said.includes(zh.demoIntro));
  check('goal line shows the Act 1 goal', A.$('goal-line').textContent === zh.goalAct1);
  check('replay button is shown in Act 1 and disabled while the demo plays', A.$('btn-replay-demo').style.display === '' && A.$('btn-replay-demo').disabled === true);
  check('player input waits: no action buttons during the demo', A.$('action-bar').children.length === 0);
  let worstShown = false;
  const n0 = A.ctx.narrate;
  A.ctx.narrate = msg => { if (msg === zh.demoWorst) worstShown = !!A.$('demo-worst'); n0(msg); };
  A.ctx.onTileTap(1, 2);                       /* tap East during the demo */
  check('a tap during the demo is held, not dropped', JSON.stringify(A.get('heldTap')) === '{"r":1,"c":2}');
  check('a tap during the demo does not move the player', A.get('demoSaved').G.pos.join(',') === '1,1');
  await waitFor(() => A.get('demoActive') === false);
  check('demo ends and hands over', A.get('demoActive') === false);
  const order = [zh.demoIntro, zh.demoMove, zh.demoWorst, zh.demoBack, zh.demoHandover].map(s => A.said.indexOf(s));
  check('demo plays move, worst reply, turn back, hand-over in order', order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])));
  check('demo marks the Engine worst reply on the board', worstShown);
  check('demo shows the road being cut', A.said.some(s => s.endsWith('這條路線斷了。')));
  check('held tap is replayed at hand-over (player moved East)', A.get('G.pos').join(',') === '1,2' && A.get('ply') === 1);
  check('the game goes on to the Engine prediction', !!A.get('pendingPredict'));
  const saved = JSON.parse(storage.data.get('jok_progress'));
  check('demo seen is stored in jok_progress.levels["8"]', saved.levels['8'].demoSeen === true);
  check('other jok_progress fields are kept', saved.levels['1'].coins === 2 && saved.l8.completed === true && saved.other === 5);

  /* ── 2. replay button plays the demo again and keeps the game ─────────── */
  A.ctx.resolvePrediction({ type: 'PASS' });
  await waitFor(() => A.get('awaitingPlayer') === true);
  const before = { pos: A.get('G.pos').join(','), ply: A.get('ply'), t: A.get('G.t') };
  check('replay button is enabled on the player turn', A.$('btn-replay-demo').disabled === false);
  A.$('btn-replay-demo').onclick = () => A.ctx.replayDemo();
  A.$('btn-replay-demo').click();
  check('replay button starts the demo again', A.get('demoActive') === true && A.get('G.pos').join(',') === '1,1');
  await waitFor(() => A.get('demoActive') === false);
  check('after the replay the player is back where they were', A.get('G.pos').join(',') === before.pos && A.get('ply') === before.ply && A.get('G.t') === before.t);
  check('after the replay the player has the turn', A.get('awaitingPlayer') === true);

  /* ── 3. second visit: no auto-play ───────────────────────────────────── */
  const B = loadLevel(storage);
  B.ctx.startMission();
  check('second visit: demo does not auto-play', B.get('demoActive') === false && B.get('awaitingPlayer') === true);
  check('second visit: replay button still available', B.$('btn-replay-demo').style.display === '');
  B.ctx.restartAct();
  check('restarting Act 1 does not replay the demo', B.get('demoActive') === false);

  /* ── 4. storage blocked: no crash, demo once per page ─────────────────── */
  const C = loadLevel(makeStorage(null, true));
  C.ctx.startMission();
  check('blocked storage: demo still plays', C.get('demoActive') === true);
  await waitFor(() => C.get('demoActive') === false);
  C.ctx.restartAct();
  check('blocked storage: demo does not loop on restart', C.get('demoActive') === false);

  /* ── 5. every result screen has Next / Play again / Level menu ────────── */
  const labels = () => B.$('result-actions').children.map(b => b.textContent);
  const three = [zh.nextSeeTree, zh.playAgain, zh.levelMenu];
  B.get(`G = (function () { let s = ENGINE.initState('A1F');
    for (const a of [{type:'MOVE',dir:'E'}]) s = ENGINE.apply(s, a);
    s = ENGINE.apply(s, SEARCH.minimax(s).action); s = ENGINE.apply(s, {type:'MOVE',dir:'N'});
    while (!ENGINE.isTerminal(s)) s = ENGINE.apply(s, s.toMove === 'MAX' ? SEARCH.minimax(s).action : SEARCH.minimax(s).action);
    return s; })(); phase = 'act1'; onTerminal();`);
  check('Act 1 pass screen: Next / Play again / Level menu', JSON.stringify(labels()) === JSON.stringify(three) && B.get('ENGINE.utility(G)') > 0);
  B.get(`G = (function () { let s = ENGINE.apply(ENGINE.initState('A1F'), {type:'MOVE',dir:'N'});
    while (!ENGINE.isTerminal(s)) s = ENGINE.apply(s, SEARCH.minimax(s).action); return s; })(); phase = 'act1'; onTerminal();`);
  check('Act 1 fail screen: Next / Play again / Level menu', JSON.stringify(labels()) === JSON.stringify(three) && B.get('ENGINE.utility(G)') <= 0);
  B.$('result-actions').children[2].click();
  check('Level menu goes back to the level menu', B.$('screen-intro').classList.contains('active') && !B.$('result-overlay').classList.contains('open'));
  for (const target of ['win', 'end']) {
    B.get(`G = (function () { let s = ENGINE.initState('A3'), p = 0;
      while (!ENGINE.isTerminal(s)) { s = ENGINE.apply(s, SEARCH.mcts(s, 100, 20260823 + p).action); p++; } return s; })();
      ${target === 'end' ? "G = Object.assign({}, G, { households: G.households.map(h => Object.assign({}, h, { served: false })) });" : ''}
      phase = 'act3'; onTerminal();`);
    check('Act 3 ' + target + ' screen: Next / Play again / Level menu',
      JSON.stringify(labels()) === JSON.stringify([zh.nextFinish, zh.playAgain, zh.levelMenu]));
  }

  /* ── 6. strings: three locales, same counts, new keys clean ───────────── */
  const NEW = ['goalAct1', 'goalAct2', 'goalAct3', 'demoIntro', 'demoMove', 'demoWorst', 'demoCutFmt', 'demoBack', 'demoHandover', 'replayDemo', 'nextSeeTree', 'nextFinish', 'playAgain', 'levelMenu'];
  const counts = ['en', 'zh-Hant', 'es'].map(l => Object.keys(STR[l]).length);
  check('three locales hold the same number of strings (' + counts.join(' / ') + ')', counts.every(n => n === counts[0]));
  check('every new string exists and is non-empty in EN / ZH / ES', NEW.every(k => ['en', 'zh-Hant', 'es'].every(l => typeof STR[l][k] === 'string' && STR[l][k].trim())));
  check('no em dash in new EN / ES strings', NEW.every(k => !/—/.test(STR.en[k] + STR.es[k])));
  check('new Chinese strings use Traditional characters', NEW.every(k => !/[这时间选关过门测试机么后进单两戏务样还]/.test(STR['zh-Hant'][k].replace(/時間/g, ''))));
  check('Act 2 and Act 3 show their own goal lines', (() => {
    B.ctx.startAct2(); const a2 = B.$('tree-goal-line').textContent === zh.goalAct2;
    B.ctx.setLang('en'); const a2en = B.$('tree-goal-line').textContent === STR.en.goalAct2; B.ctx.setLang('zh-Hant');
    B.ctx.startAct3(); const a3 = B.$('goal-line').textContent === zh.goalAct3 && B.$('btn-replay-demo').style.display === 'none';
    return a2 && a2en && a3;
  })());

  /* ── 7. GA4 event names unchanged ─────────────────────────────────────── */
  const events = [...new Set([...inline.matchAll(/track\('([\w]+)'/g)].map(m => m[1]))].sort();
  check('GA4 event names unchanged', JSON.stringify(events) === JSON.stringify(['l8_predict_engine', 'l8_prune_predict', 'l8_rehearsal_follow', 'level_abandon', 'level_complete', 'level_start']));

  console.log(JSON.stringify({ passed, total: passed }));
  process.exit(0);
})().catch(e => { console.error('FAIL ' + e.message); process.exit(1); });
