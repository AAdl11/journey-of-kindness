/* Level 4 touch-interaction regression tests. Node.js built-ins only. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class FakeClassList {
  constructor() { this.names = new Set(); }
  add(...names) { names.forEach(name => this.names.add(name)); }
  remove(...names) { names.forEach(name => this.names.delete(name)); }
  toggle(name, force) {
    const next = force === undefined ? !this.names.has(name) : !!force;
    next ? this.names.add(name) : this.names.delete(name);
    return next;
  }
  contains(name) { return this.names.has(name); }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.classList = new FakeClassList();
    this.textContent = '';
    this.innerHTML = '';
    this.disabled = false;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  play() { return Promise.resolve(); }
  pause() {}
}

const elements = new Map();
const getElement = id => {
  if (!elements.has(id)) elements.set(id, new FakeElement(id));
  return elements.get(id);
};

const document = {
  getElementById: getElement,
  querySelectorAll() { return []; },
  addEventListener() {}
};
const localStorage = {
  data: new Map(),
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; },
  setItem(key, value) { this.data.set(key, String(value)); }
};
const window = {
  document,
  localStorage,
  location: { href: '' },
  addEventListener() {}
};
const context = vm.createContext({
  console: { log() {}, error: console.error },
  document,
  window,
  localStorage,
  Math,
  Set,
  Array,
  Object,
  JSON,
  Date,
  RegExp,
  Promise,
  setTimeout() { return 0; },
  clearTimeout() {},
  setInterval() { return 0; },
  clearInterval() {},
  confetti() {}
});

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.includes('CONFIGURATION'));
assert.strictEqual(scripts.length, 1, 'expected one Level 4 game script');
vm.runInContext(scripts[0], context, { filename: 'level4/index.html' });

function run(code) { return vm.runInContext(code, context); }
function resetSafeFixture() {
  run(`
    GRID_SIZE = 4;
    TIER = 'challenge';
    world = {
      agentPos:{x:1,y:1}, familyPos:{x:4,y:4}, barrierPos:{x:4,y:3},
      dangerZones:[{x:3,y:4}], wumpusPos:{x:3,y:3}, wumpusAlive:true,
      alive:true, hasFamily:false, escaped:false, trail:null, arrows:1
    };
    agent = {visited:new Set(), safe:new Set(), bcProved:new Set(), kb:new Set(), steps:0, elo:1200};
    resolutionMode = false; clarityMode = false; updateKB(1,1); updateDisplays();
  `);
}

resetSafeFixture();
run('cellAction(2,1)');
assert.strictEqual(run('agent.steps'), 1, 'tapping one adjacent cell must move exactly once');
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(world.agentPos)')), { x: 2, y: 1 });

resetSafeFixture();
run('cellAction(4,4)');
assert.strictEqual(run('agent.steps'), 0, 'tapping a non-adjacent cell must not move');

resetSafeFixture();
run('world.wumpusPos={x:2,y:1}; clarityMode=true; cellAction(2,1)');
assert.strictEqual(run('world.arrows'), 0, 'Clarity Treasure must be single-use');
assert.strictEqual(run('world.wumpusAlive'), false, 'explicit adjacent target must dispel the rumor source');
assert.strictEqual(run('clarityMode'), false, 'Clarity mode must exit after use');
assert.strictEqual(run('agent.steps'), 0, 'using Clarity Treasure must not move the player');

resetSafeFixture();
run('toggleResolution(); cellAction(4,4)');
assert.strictEqual(getElement('res-modal').style.display, 'flex', 'Resolution mode must query a tapped cell');
assert.strictEqual(run('agent.steps'), 0, 'Resolution query must not move the player');

assert(!html.includes('dpad-container'), 'direction pad must remain removed');
assert(html.includes('id="clarity-btn"'), 'Clarity Treasure must remain in the toolbar');

console.log('LEVEL 4 INTERACTION TESTS PASSED — tap movement, Clarity Treasure target, Resolution query, no D-pad');
