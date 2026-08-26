#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const invite = fs.readFileSync(path.join(root, 'level1/jok-feedback.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'feedback/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'feedback/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'feedback/styles.css'), 'utf8');
const failures = [];
let checks = 0;

function ok(condition, message) {
    checks++;
    if (!condition) failures.push(message);
}

for (let level = 1; level <= 8; level++) {
    const html = fs.readFileSync(path.join(root, `level${level}`, 'index.html'), 'utf8');
    const localInvite = fs.readFileSync(path.join(root, `level${level}`, 'jok-feedback.js'), 'utf8');
    ok(html.includes(`src="jok-feedback.js" data-level="${level}"`), `Level ${level}: feedback invitation is not wired`);
    ok(/level_complete/.test(html), `Level ${level}: completion event is missing`);
    ok(localInvite === invite, `Level ${level}: self-contained invitation script differs`);
    ok(new RegExp(`\\n\\s*${level}: \\{`).test(app), `Level ${level}: level-specific survey content is missing`);
}

ok(invite.includes("const SURVEY_PATH = '../feedback/'"), 'Completion invitation does not open the JOK feedback frontend');
ok(invite.includes("url.searchParams.set('level'"), 'Completion invitation does not preselect the level');
ok(invite.includes("url.searchParams.set('lang'"), 'Completion invitation does not preserve the game language');
ok(invite.includes('feedback_prompt_view'), 'GA4 feedback_prompt_view event is missing');
ok(invite.includes('feedback_open'), 'GA4 feedback_open event is missing');
ok(invite.includes('target="_blank"'), 'Feedback must open without replacing the completed level');
ok(invite.includes('noopener noreferrer'), 'New-tab protection is missing');
ok(!/\.open\s*\(/.test(invite), 'Feedback must never auto-open');
ok((invite.match(/Help improve this level|幫我改進這一關|Ayúdame a mejorar este nivel/g) || []).length === 3, 'Completion invitation is not complete in zh/en/es');
ok(invite.includes("8: '#screen-finish .card'"), 'Level 8 invitation target is not the finish screen');
ok(invite.includes("7: '#mindfulness-screen .mindfulness-overlay'"), 'Level 7 invitation target is not Ataraxy Portico');

const formAction = 'https://docs.google.com/forms/d/e/1FAIpQLSessk0TDC6wJCF6C3baLOP-U0rfnZzFftKEG-rFhDkpoarnHA/formResponse';
ok(page.includes(`action="${formAction}"`), 'Feedback frontend does not submit to the published Form');
[
    'entry.755510498','entry.1465065171','entry.1836795989','entry.80604527',
    'entry.522681155','entry.557430297','entry.605863183','entry.1992198983'
].forEach(field => ok(page.includes(`name="${field}"`) || app.includes(`'${field}'`), `Google Form field ${field} is missing`));
ok(page.includes('target="feedbackTransport"'), 'Form submission is not isolated in its hidden transport frame');
ok(page.includes('id="feedback-transport"'), 'Hidden form transport is missing');
ok(app.includes('feedback_page_view'), 'GA4 feedback_page_view is missing');
ok(app.includes('feedback_submit_attempt'), 'GA4 feedback_submit_attempt is missing');
ok(app.includes('feedback_submit_transport_complete'), 'GA4 transport-complete event is missing');
ok(!app.includes("'feedback_submit'"), 'Transport completion must not be mislabeled as backend-verified feedback_submit');
ok(app.includes('No email is collected'), 'Privacy notice is missing');
ok(app.includes('No se recopila tu correo'), 'Spanish privacy notice is missing');
ok(app.includes('不收集電子郵件'), 'Traditional Chinese privacy notice is missing');
ok((app.match(/value:'Level [1-8]｜/g) || []).length === 8, 'Exact backend level values are incomplete');
ok((app.match(/question:\{zh:/g) || []).length === 8, 'Eight trilingual algorithm questions are incomplete');
ok((app.match(/options:\[/g) || []).length === 8, 'Eight algorithm answer sets are incomplete');
ok(app.includes("zh: '繁體中文（zh-TW）'"), 'Traditional Chinese backend language value is missing');
ok(app.includes("en: 'English（en）'"), 'English backend language value is missing');
ok(app.includes("es: 'Español（es）'"), 'Spanish backend language value is missing');
ok(css.includes('@media(max-width:620px)'), 'Portrait mobile layout is missing');
ok(css.includes('orientation:landscape'), 'Phone landscape layout is missing');
ok(css.includes('min-height:44px'), 'Minimum touch-target contract is missing');

const outro = fs.readFileSync(path.join(root, 'outro.html'), 'utf8');
const allText = page + app + invite + outro;
ok(!allText.includes('1FAIpQLSfchDx0sz7pxNVqCyfToF5ajknAfi3jln2K6sb7h12uOvsznw'), 'Obsolete Google Form URL remains in player-facing feedback files');
ok(!allText.includes('entry.567290314'), 'Obsolete Google Form level field remains');
ok(outro.includes('id="passport-feedback-link"'), 'Outro feedback card is missing');
ok(outro.includes('feedback/?source=outro'), 'Outro does not open the new feedback frontend');
ok(outro.includes('assets/images/qr_survey.png'), 'Outro feedback QR code is missing');
ok(outro.includes('data-en="Open survey directly"'), 'Outro visible direct feedback link is missing');
const surveyQr = fs.readFileSync(path.join(root, 'assets/images/qr_survey.png'));
ok(surveyQr.subarray(1, 4).toString('ascii') === 'PNG', 'Outro survey QR asset is not a real PNG');

if (failures.length) {
    console.error(`JOK FEEDBACK GATE FAILED — ${failures.length} of ${checks}`);
    failures.forEach(message => console.error(`- ${message}`));
    process.exit(1);
}

console.log(`JOK FEEDBACK GATE PASSED — ${checks} checks`);
