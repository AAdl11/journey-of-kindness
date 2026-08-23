/* Level 5 visual-asset integrity gate. Node.js built-ins only. */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const imageDir = path.join(root, 'assets', 'images');
const audioDir = path.join(root, 'assets', 'audio');
const manifestPath = path.join(root, 'assets', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expectedImages = new Set(manifest.images.map(item => item.file));
const expectedAudio = new Set(manifest.audio.map(item => item.file));
const actualImages = new Set(fs.readdirSync(imageDir).filter(name => /\.png$/i.test(name)));
const actualAudio = new Set(fs.readdirSync(audioDir).filter(name => /\.mp3$/i.test(name)));
const failures = [];

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

for (const item of manifest.audio) {
  const filePath = path.join(audioDir, item.file);
  if (!fs.existsSync(filePath)) {
    failures.push(`missing audio: ${item.file}`);
    continue;
  }
  const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  if (digest !== item.sha256) failures.push(`audio hash mismatch: ${item.file}`);
  const reference = `assets/audio/${item.file}`;
  if (!html.includes(reference)) failures.push(`audio not referenced by index.html: ${item.file}`);
}

for (const file of actualImages) {
  if (!expectedImages.has(file)) failures.push(`untracked image: ${file}`);
}
for (const file of actualAudio) {
  if (!expectedAudio.has(file)) failures.push(`untracked audio: ${file}`);
}

const staticRefs = new Set();
const refPattern = /(?:src\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+))/g;
let match;
while ((match = refPattern.exec(html))) {
  const ref = match[1] || match[2];
  if (!ref || /^(?:data:|https?:|#)/.test(ref) || ref.includes('${')) continue;
  staticRefs.add(ref);
}
for (const ref of staticRefs) {
  if (ref.startsWith('../')) failures.push(`external runtime dependency forbidden: ${ref}`);
  if (!fs.existsSync(path.resolve(root, ref))) failures.push(`broken local reference: ${ref}`);
}

if (!html.includes('data-en="Ataraxy Portico"')) failures.push('canonical Ataraxy Portico label missing');
if (html.includes('Gate of Stillness')) failures.push('non-canonical literal translation remains: Gate of Stillness');

if (failures.length) {
  console.error('LEVEL 5 ASSET GATE FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`LEVEL 5 FULL CAPSULE PASSED — ${manifest.images.length} images + ${manifest.audio.length} audio files + mobile contract + zero external runtime dependencies`);
