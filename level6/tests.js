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

function findUnmarkedVisibleText(source) {
  const body = (source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [,''])[1]
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const tokenRe = /<\/?[a-zA-Z][^<>"']*(?:"[^"]*"[^<>"']*|'[^']*'[^<>"']*)*>|[^<]+/g;
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const stack = [];
  const gaps = [];
  for (const token of body.match(tokenRe) || []) {
    if (!token.startsWith('<')) {
      const text = token.replace(/\s+/g, ' ').trim();
      if (text && /[A-Za-z\u3400-\u9fff]/.test(text) && !stack.some(item => item.marked)) gaps.push(text);
      continue;
    }
    const end = token.match(/^<\/([a-zA-Z0-9-]+)/);
    if (end) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === end[1].toLowerCase()) { stack.length = i; break; }
      }
      continue;
    }
    const start = token.match(/^<([a-zA-Z0-9-]+)/);
    if (!start) continue;
    const tag = start[1].toLowerCase();
    const marked = /\bdata-es="[^"]+"/.test(token) || /\bdata-i18n-static="[^"]+"/.test(token);
    if (!voidTags.has(tag) && !/\/>$/.test(token)) stack.push({ tag, marked });
  }
  return gaps;
}

const unmarkedVisibleText = findUnmarkedVisibleText(html);
assert.deepStrictEqual(unmarkedVisibleText, [], `player-visible text bypasses localization: ${unmarkedVisibleText.slice(0, 8).join(' | ')}`);
for (const spanish of [
  'Lógica de primer orden', 'JUICIO DEL SISTEMA', 'Verificación final de elegibilidad',
  'INVESTIGACIÓN FOL', 'Paso 1: Consultar Registered(Marcus)',
  'HOJA DE ASISTENCIA A LA ORIENTACIÓN', 'Aprovecha el tiempo y valora el espacio.',
  'Apreciar a los demás es dignificarnos a nosotros mismos.',
  'Maestra Cheng Yen, Aforismos Jing Si'
]) assert(html.includes(spanish), `Spanish player-facing text missing: ${spanish}`);
assert(/es:\s*\{\s*query:\s*'Consulta',\s*result:\s*'Resultado',\s*analysis:\s*'Análisis',\s*hypothesis:\s*'Hipótesis'\s*\}/.test(html), 'dynamic FOL engine labels must include Spanish');
for (const key of ['query', 'result', 'analysis', 'hypothesis']) {
  assert(html.includes(`\${ui.${key}}`), `dynamic FOL output must render localized ${key} label`);
}

assert(/function musicForScreen\(id\)[\s\S]*screen-opening'[\s\S]*music-opening/.test(html), 'raw-rice opening must map to the transition track');
assert(/<audio id="music-opening"(?![^>]*\sloop\b)[^>]*rice_incident\.mp3/.test(html), 'raw-rice narrative track must not loop');
assert(/onclick="startOpeningStory\(\)"/.test(html), 'opening must provide a direct mobile-safe gesture to start the raw-rice story music');
assert(/id="openingContinueBtn"[^>]*display:\s*none/.test(html), '25 Years Later must remain hidden until the raw-rice story music starts');
assert(/function startOpeningStory\(\)[\s\S]*playMusic\('music-opening'\)[\s\S]*openingContinueBtn/.test(html), 'opening story action must play rice_incident before revealing the transition');
assert(/\['screen-judgment', 'screen-bad-ending'\]\.includes\(id\)\) return 'music-bad'/.test(html), 'system misjudgment and bad ending must map to bad-day music');
assert(!/\[[^\]]*screen-objection[^\]]*\]\.includes\(id\)\) return 'music-bad'/.test(html), 'objection must return to FOL game music');
assert(!/\[[^\]]*screen-investigation[^\]]*\]\.includes\(id\)\) return 'music-bad'/.test(html), 'investigation must use FOL game music');
assert(/id === 'screen-ataraxy'\) return 'music-ataraxy'/.test(html), 'Ataraxy Portico must map to its own music');
assert(/playMusic\(musicForScreen\(id\)\)/.test(html), 'navigation must select music by story act');
assert(!/function initAudio\(\)/.test(html), 'unrelated first clicks must not start or replace story music');

const musicForScreenSource = html.match(/function musicForScreen\(id\) \{[\s\S]*?\n\}/);
assert(musicForScreenSource, 'musicForScreen implementation must be extractable for behavior testing');
const musicForScreen = vm.runInNewContext(`(${musicForScreenSource[0]})`);
const expectedMusic = {
  'screen-opening': 'music-opening',
  'screen-intro': 'music-game',
  'screen-applicants': 'music-game',
  'screen-lily': 'music-game',
  'screen-deshawn': 'music-game',
  'screen-marcus': 'music-game',
  'screen-judgment': 'music-bad',
  'screen-bad-ending': 'music-bad',
  'screen-objection': 'music-game',
  'screen-investigation': 'music-game',
  'screen-insight': 'music-game',
  'screen-evidence': 'music-game',
  'screen-welcome': 'music-game',
  'screen-transformation': 'music-game',
  'screen-final': 'music-game',
  'screen-invitation': 'music-game',
  'screen-ataraxy': 'music-ataraxy'
};
for (const [screen, music] of Object.entries(expectedMusic)) {
  assert.strictEqual(musicForScreen(screen), music, `${screen} must select ${music}`);
}

const openingSource = html.match(/function startOpeningStory\(\) \{[\s\S]*?\n\}/);
assert(openingSource, 'startOpeningStory implementation must be extractable for behavior testing');
const openingElements = {
  musicBtn: { textContent: '🔇', style: {} },
  openingStartBtn: { style: {} },
  openingContinueBtn: { style: {} }
};
let playedMusic = null;
const openingContext = {
  musicPlaying: false,
  document: { getElementById: id => openingElements[id] },
  playMusic: id => { playedMusic = id; }
};
vm.runInNewContext(`${openingSource[0]}; startOpeningStory();`, openingContext);
assert.strictEqual(openingContext.musicPlaying, true, 'Start Story must enable music');
assert.strictEqual(playedMusic, 'music-opening', 'Start Story must select rice_incident music');
assert.strictEqual(openingElements.openingStartBtn.style.display, 'none', 'Start Story button must hide after activation');
assert.strictEqual(openingElements.openingContinueBtn.style.display, 'inline-flex', '25 Years Later must appear after activation');

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
for (const source of inlineScripts) new vm.Script(source);

console.log(`LEVEL 6 STORY TESTS PASSED — ${screenIds.size} screens, ${targets.length} transitions, complete Spanish UI/engine, scene-accurate four-track music mapping`);
