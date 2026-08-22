/* Level 5 visual-asset integrity gate. Node.js built-ins only. */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const imageDir = path.join(root, 'assets', 'images');
const manifestPath = path.join(root, 'assets', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expected = new Set(manifest.images.map(item => item.file));
const actual = new Set(fs.readdirSync(imageDir).filter(name => /\.png$/i.test(name)));
const failures = [];

const mobileStandardPath = path.resolve(root, manifest.mobileStandard);
if (!fs.existsSync(mobileStandardPath)) {
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
  ['tap reveals Bayesian evidence', 'showBayesian(id);']
];

for (const [rule, snippet] of mobileContract) {
  if (!html.includes(snippet)) failures.push(`mobile contract missing: ${rule}`);
}

for (const item of manifest.images) {
  const filePath = path.join(imageDir, item.file);
  if (!fs.existsSync(filePath)) {
    failures.push(`missing: ${item.file}`);
    continue;
  }
  const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  if (digest !== item.sha256) failures.push(`hash mismatch: ${item.file}`);
  const reference = `assets/images/${item.file}`;
  if (!html.includes(reference)) failures.push(`not referenced by index.html: ${item.file}`);
}

for (const file of actual) {
  if (!expected.has(file)) failures.push(`untracked image: ${file}`);
}

if (failures.length) {
  console.error('LEVEL 5 ASSET GATE FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`LEVEL 5 RELEASE GATE PASSED — ${manifest.images.length} Owner-verified images + mobile contract`);
