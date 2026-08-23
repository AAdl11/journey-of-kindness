/* Level 4 visual-asset and mobile interaction integrity gate. Node.js built-ins only. */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const imageDir = path.join(root, 'assets', 'images');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'manifest.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expected = new Set(manifest.images.map(item => item.file));
const actual = new Set(fs.readdirSync(imageDir).filter(name => /\.(png|webp|jpe?g)$/i.test(name)));
const failures = [];

if (!fs.existsSync(path.resolve(path.dirname(path.join(root, 'assets', 'manifest.json')), manifest.mobileStandard))) {
  failures.push(`protected mobile standard missing: ${manifest.mobileStandard}`);
}

const mobileContract = [
  ['tap highlight disabled', '-webkit-tap-highlight-color: transparent'],
  ['horizontal overflow protected', 'overflow-x: hidden'],
  ['touch controls enabled', 'touch-action: manipulation'],
  ['Android blur disabled', '* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }'],
  ['portrait breakpoint present', '@media (max-width: 640px)'],
  ['landscape breakpoint present', '@media (orientation: landscape) and (max-height: 600px)'],
  ['mobile game uses document flow', '#game-screen.active { display: block !important; min-height: auto !important; }'],
  ['single-column narrow layout', '.game-layout { display: block !important; width: 100%; }'],
  ['grid tap routes through interaction modes', 'onclick="cellAction(${x},${y})"'],
  ['clarity treasure is in toolbar', 'id="clarity-btn"'],
  ['clarity uses an explicit target cell', 'shootArrow(x, y)']
];

for (const [rule, snippet] of mobileContract) {
  if (!html.includes(snippet)) failures.push(`mobile contract missing: ${rule}`);
}

for (const forbidden of ['dpad-container', 'dpad-btn', 'id="btn-up"', '>DISPEL</button>']) {
  if (html.includes(forbidden)) failures.push(`obsolete direction-pad UI remains: ${forbidden}`);
}

for (const item of manifest.images) {
  const filePath = path.join(imageDir, item.file);
  if (!fs.existsSync(filePath)) {
    failures.push(`missing: ${item.file}`);
    continue;
  }
  const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  if (digest !== item.sha256) failures.push(`hash mismatch: ${item.file}`);
  if (!html.includes(`assets/images/${item.file}`)) failures.push(`not referenced by index.html: ${item.file}`);
}

for (const file of actual) {
  if (!expected.has(file)) failures.push(`untracked image: ${file}`);
}

if (failures.length) {
  console.error('LEVEL 4 RELEASE GATE FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`LEVEL 4 RELEASE GATE PASSED — ${manifest.images.length} recovered images + touch-first mobile contract`);
