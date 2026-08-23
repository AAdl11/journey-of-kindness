/* Level 6 story-flow regression tests. Node.js built-ins only. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const screenIds = new Set([...html.matchAll(/<div\s+id="(screen-[^"]+)"\s+class="screen(?:\s+active)?"/g)].map(match => match[1]));
const targets = [...html.matchAll(/goToScreen\('([^']+)'\)/g)].map(match => match[1]);

assert(screenIds.has('screen-opening'), 'opening transition screen must exist');
assert(screenIds.has('screen-ataraxy'), 'Ataraxy Portico screen must exist');
assert(screenIds.size >= 17, `expected the full story sequence; found ${screenIds.size} screens`);
for (const target of targets) assert(screenIds.has(target), `missing goToScreen target: ${target}`);

const requiredMappings = [
  ['screen-opening', 'l6_raw_rice_opening.webp'],
  ['screen-intro', 'l6_team_huddle.webp'],
  ['screen-judgment', 'l6_system_rejection.webp'],
  ['screen-welcome', 'l6_marcus_portrait.webp'],
  ['screen-transformation', 'l6_transformation.webp'],
  ['screen-final', 'l6_meeting_homeless.webp'],
  ['screen-invitation', 'l6_invitation_moment.webp'],
  ['screen-ataraxy', 'l6_stillness_bg.webp']
];
for (const [screen, image] of requiredMappings) {
  const pattern = new RegExp(`<div id="${screen}"[^>]+${image.replace('.', '\\.')}`);
  assert(pattern.test(html), `${screen} must use ${image}`);
}

assert(html.includes('src="assets/images/l6_marcus_portrait.webp"'), 'Marcus portrait must appear in the applicant UI');
assert(html.includes('Ataraxy Portico'), 'canonical player-facing English label must appear in Level 6');
assert(html.includes('data-es="Portal de la Serenidad"'), 'Ataraxy Portico must have its canonical Spanish label');
assert(html.includes('data-es="Respira profundamente 3 veces"'), 'Ataraxy breathing prompt must have Spanish');
assert(html.includes('data-es="🎉 ¡Nivel 6 completado!"'), 'Level 6 completion message must have Spanish');
assert(!html.includes('Gate of Stillness'), 'non-canonical literal translation must not appear in Level 6');

assert(/function musicForScreen\(id\)[\s\S]*screen-opening'[\s\S]*music-opening/.test(html), 'raw-rice opening must map to the transition track');
for (const screen of ['screen-judgment', 'screen-bad-ending', 'screen-objection', 'screen-investigation']) {
  assert(html.includes(`'${screen}'`), `${screen} must be included in the system-judgment music act`);
}
assert(/\['screen-judgment', 'screen-bad-ending', 'screen-objection', 'screen-investigation'\]\.includes\(id\)\) return 'music-bad'/.test(html), 'system judgment act must map to bad-day music');
assert(/id === 'screen-ataraxy'\) return 'music-ataraxy'/.test(html), 'Ataraxy Portico must map to its own music');
assert(/playMusic\(musicForScreen\(id\)\)/.test(html), 'navigation must select music by story act');
assert(/function initAudio\(\)[\s\S]*playMusic\(currentMusic\)/.test(html), 'first interaction must preserve the destination track');

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
for (const source of inlineScripts) new vm.Script(source);

console.log(`LEVEL 6 STORY TESTS PASSED — ${screenIds.size} screens, ${targets.length} transitions, Spanish Ataraxy UI, four-act music mapping`);
