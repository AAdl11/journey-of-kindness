const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const measurementId = 'G-BKBPRQQQ1Y';
const failures = [];
const rows = [];

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const homeLoaderCount = count(homepage, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${measurementId}`, 'g'));
const homeConfigCount = count(homepage, new RegExp(`gtag\\('config','${measurementId}'\\)`, 'g'));
if (homeLoaderCount !== 1) failures.push(`index.html: expected one GA4 loader, found ${homeLoaderCount}`);
if (homeConfigCount !== 1) failures.push(`index.html: expected one GA4 config, found ${homeConfigCount}`);

for (let level = 1; level <= 8; level++) {
  const rel = `level${level}/index.html`;
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: missing entry file`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const loaderCount = count(html, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${measurementId}`, 'g'));
  const configCount = count(html, new RegExp(`gtag\\('config','${measurementId}'\\)`, 'g'));
  const ids = [...html.matchAll(/G-[A-Z0-9]{6,}/g)].map(m => m[0]);
  const foreignIds = [...new Set(ids.filter(id => id !== measurementId))];
  const hasStart = /['"]level_start['"]/.test(html);
  const hasComplete = /['"]level_complete['"]/.test(html);
  const hasAbandon = /['"]level_abandon['"]/.test(html);

  if (loaderCount !== 1) failures.push(`${rel}: expected one GA4 loader, found ${loaderCount}`);
  if (configCount !== 1) failures.push(`${rel}: expected one GA4 config, found ${configCount}`);
  if (foreignIds.length) failures.push(`${rel}: foreign measurement ID(s): ${foreignIds.join(', ')}`);
  if (!hasStart) failures.push(`${rel}: missing level_start event`);
  if (!hasComplete) failures.push(`${rel}: missing level_complete event`);
  if (!hasAbandon) failures.push(`${rel}: missing level_abandon event`);

  rows.push({ level, loaderCount, configCount, hasStart, hasComplete, hasAbandon });
}

console.log(`HOME: tag=${homeLoaderCount === 1 && homeConfigCount === 1 ? 'YES' : 'NO'}`);
for (const row of rows) {
  console.log(
    `L${row.level}: tag=${row.loaderCount === 1 && row.configCount === 1 ? 'YES' : 'NO'} ` +
    `start=${row.hasStart ? 'YES' : 'NO'} complete=${row.hasComplete ? 'YES' : 'NO'} ` +
    `abandon=${row.hasAbandon ? 'YES' : 'NO'}`
  );
}

if (failures.length) {
  console.error('\nGA4 GATE FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nGA4 GATE PASSED - homepage + 8 levels use one measurement ID; every level has a complete play lifecycle');
