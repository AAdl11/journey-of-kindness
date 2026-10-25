/* Run with Playwright installed: node tests/l1-dojo-browser.test.cjs.
 * Optional JOK_BROWSER_PATH, JOK_TEST_TAILWIND_CSS, JOK_TEST_FONT_ROOT are test-only.
 * Public analytics are blocked. No production requests or writes occur. */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const qaDir=process.env.JOK_QA_DIR||'/tmp/jok-spec03-qa';fs.mkdirSync(qaDir,{recursive:true});
const root=path.resolve(__dirname,'..'),report={checks:[],layouts:[],errors:[],testAssets:{tailwind:!!process.env.JOK_TEST_TAILWIND_CSS,fonts:!!process.env.JOK_TEST_FONT_ROOT}};
const check=(name,ok)=>{assert(ok,name);report.checks.push({name,status:'PASS'});console.log('PASS '+name);};
const server=http.createServer((req,res)=>{
 try{
  const url=decodeURIComponent(req.url.split('?')[0]);let file;
  if(url.startsWith('/__testfonts/')&&process.env.JOK_TEST_FONT_ROOT)file=path.join(process.env.JOK_TEST_FONT_ROOT,url.slice(13));
  else file=path.join(root,url);
  if(!file.startsWith(root)&&!file.startsWith(process.env.JOK_TEST_FONT_ROOT||'\0'))throw Error('path');
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':mime});fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch(_){res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.JOK_BROWSER_PATH?{executablePath:process.env.JOK_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}: {})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'America/Los_Angeles'});
 await context.route('**/*',async route=>{
  const u=route.request().url();
  if(/googletagmanager|google-analytics/.test(u))return route.abort();
  if(u.startsWith('https://cdn.tailwindcss.com')&&process.env.JOK_TEST_TAILWIND_CSS){const css=fs.readFileSync(process.env.JOK_TEST_TAILWIND_CSS,'utf8');return route.fulfill({contentType:'text/javascript',body:`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s)})()`});}
  if(u.startsWith('https://fonts.googleapis.com')&&process.env.JOK_TEST_FONT_ROOT){
   const fontroot=process.env.JOK_TEST_FONT_ROOT;
   let css=fs.readFileSync(path.join(fontroot,'noto-sans-tc/index.css'),'utf8').replaceAll('./files/',base+'/__testfonts/noto-sans-tc/files/');
   css+=fs.readFileSync(path.join(fontroot,'noto-emoji/index.css'),'utf8').replaceAll('./files/',base+'/__testfonts/noto-emoji/files/');
   css+="\n*{font-family:'Noto Sans TC','Noto Emoji',sans-serif}.mono{font-family:monospace}";return route.fulfill({contentType:'text/css',body:css});
  }
  if(u.startsWith('https://cdn.jsdelivr.net'))return route.fulfill({contentType:'text/javascript',body:''});
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const cell=(x,y,board='#dojoboard')=>page.locator(`${board} [data-x="${x}"][data-y="${y}"]`);
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jok_progress')).levels['1']);
 async function layout(name){
  await page.evaluate(()=>document.fonts.ready);
  const l=await page.evaluate(()=>{const width=innerWidth;return{width,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('button,input,.jok-astar-cell,.dojo-panel')].filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.className,r:e.getBoundingClientRect().right,l:e.getBoundingClientRect().left})).filter(r=>r.r>width+1||r.l< -1)}});
  report.layouts.push({name,...l});check(name+' horizontal fit',l.scroll<=l.width&&l.overflow.length===0);
 }
 await page.goto(base+'/assets/js/astar-engine.test.html');await page.waitForFunction(()=>window.testResults);
 check('engine browser page 8/8 PASS',await page.evaluate(()=>testResults.passed===8&&testResults.total===8));
 for(const w of ['0','1','3'])await page.locator('#weight-slider').fill(w);
 await page.goto(base+'/level1/index.html');await page.waitForFunction(()=>document.body.dataset.dojoView==='demo');
 check('fresh state starts the preserved demo',await page.evaluate(()=>gameState.mode==='ai'&&cinematic.active));
 await layout('390 demo');
 await page.locator('[data-dojo-action="demoNext"]').click();
 const storyPath=await page.evaluate(()=>L1DojoCore.race(MAP_NORMAL.obstacles).path);
 for(const p of storyPath.slice(1))await cell(p.x,p.y,'#astar-grid').click({force:true});
 check('third act retains Grandma reveal and tea image',await page.locator('img[src="../assets/images/clean_Mrs__Garcia.png"]').count()===1);
 await page.locator('[onclick="L1Dojo.finishDemo()"]').click();
 check('demo does not award coins', (await state()).coins===0);
 check('only Break is unlocked',await page.locator('.dojo-card[data-locked="false"]').count()===1);
 await page.locator('[data-dojo-mode="tune"]').click();check('locked cards explain the prerequisite',await page.locator('#dojo-notice').innerText()!=='');
 await layout('390 menu');
 
 await page.screenshot({path:path.join(qaDir,'menu-390.png'),fullPage:true});
 await page.locator('[data-dojo-mode="break"]').click();
 const map=await page.evaluate(()=>L1DojoCore.generate(L1DojoCore.dateSeed()));
 // No-path feedback and removal, using two cells next to start on this seed.
 for(const p of [{x:1,y:0},{x:0,y:1}])await cell(p.x,p.y).click();
 check('blocked path does not award a coin',(await state()).coins===0);
 check('no-path feedback visible',await page.locator('#dojo-status').innerText()!=='');
 for(const p of [{x:1,y:0},{x:0,y:1}])await cell(p.x,p.y).click();
 for(const p of map.proof.breakWalls)await cell(p.x,p.y).click();
 check('Break earns exactly one coin',(await state()).coins===1);
 await layout('390 Break');
 await page.screenshot({path:path.join(qaDir,'break-390.png'),fullPage:true});
 const beforePredict=(await state()).walls;
 await page.locator('[data-dojo-action="menu"]:visible').first().click();await page.locator('[data-dojo-mode="predict"]').click();
 check('Predict keeps reachable Break walls',JSON.stringify((await state()).walls)===JSON.stringify(beforePredict));
 check('shared g/h/f panel is visible',await page.locator('#g-value').isVisible());
 const expanded=await page.evaluate(()=>L1DojoCore.search(L1DojoCore.generate(L1DojoCore.dateSeed()).walls.concat(JSON.parse(localStorage.getItem('jok_progress')).levels['1'].walls)).steps.slice(0,10));
 // One deliberate wrong answer. Remaining guesses follow the engine; choose a
 // different equal-f candidate when one is available.
 await cell(7,5).click();await page.waitForTimeout(1050);let tied=false;
 for(let i=1;i<expanded.length;i++){
  const options=expanded[i-1].open.filter(p=>p.f===expanded[i].f),alternate=options.find(p=>p.x!==expanded[i].current.x||p.y!==expanded[i].current.y);
  const p=alternate||expanded[i].current;if(alternate)tied=true;
  await cell(p.x,p.y).click();await page.waitForTimeout(480);
 }
 check('Predict accepts 9/10 with an error, no penalty',(await state()).coins===2);
 check('equal-f alternative accepted in this run',tied);
 await layout('390 Predict');
 await page.screenshot({path:path.join(qaDir,'predict-390.png'),fullPage:true});
 await page.locator('[data-dojo-action="menu"]:visible').first().click();await page.locator('[data-dojo-mode="race"]').click();
 check('Race optimal panel follows daily benchmark',await page.evaluate(()=>Number(document.querySelector('#g-value').parentNode.parentNode.lastElementChild.querySelector('.stat-value').textContent)===gameState.raceOptimal));
 check('Race keeps reachable Break walls',JSON.stringify((await state()).walls)===JSON.stringify(beforePredict));
 const racePath=await page.evaluate(()=>L1DojoCore.race(gameState.obstacles).path);
 const stepsBefore=await page.evaluate(()=>gameState.steps);
 await page.locator('#astar-think-btn').click();await page.waitForFunction(()=>!hintPlayback.active,{},{timeout:15000});
 check('existing hint leaves position and score unchanged',await page.evaluate(n=>gameState.steps===n,stepsBefore));
 for(const p of racePath.slice(1))await cell(p.x,p.y,'#astar-grid').click({force:true});
 check('Race earns third coin',(await state()).coins===3);
 check('Race writes best stars in original format',await page.evaluate(()=>localStorage.getItem('jok_l1_beststars')==='3'));
 check('Race scorecard is fixed 300x190',await page.locator('#dojo-race-card').evaluate(e=>{const r=e.getBoundingClientRect();return r.width===300&&r.height===190}));
 check('repeat moves after finish cannot duplicate results',await page.evaluate(()=>{const before=gameState.steps;movePlayer(6,5);return gameState.steps===before}));
 await layout('390 Race result');
 await page.locator('#dojo-race-card').screenshot({path:path.join(qaDir,'race-card.png')});
 await page.locator('[data-dojo-action="portico"]').click();
 check('Race leads to original portico',await page.locator('#ataraxy-screen').evaluate(e=>e.classList.contains('active')));
 for(const lang of ['en','zh','es']){
  await page.locator('#lang-'+lang).click();const q=await page.locator('.jingsi-card p').allTextContents();
  check('portico '+lang+' has one attribution',q[2].split('Master Cheng Yen').length<=2);
  if(lang==='en')check('English portico second line is original Chinese',q[1]==='不辭勞苦的付出，便是『慈悲』');
 }
 await layout('390 Portico');
 await page.locator('[onclick="replayDojo()"]').click();
 check('replay returns to menu and stops meditation',await page.evaluate(()=>document.body.dataset.dojoView==='menu'&&document.getElementById('meditation-music').paused&&!document.getElementById('ataraxy-screen').classList.contains('active')));
 await page.locator('[data-dojo-mode="tune"]').click();
 const w=await page.evaluate(()=>L1DojoCore.tune(L1DojoCore.generate(L1DojoCore.dateSeed()).walls.concat(JSON.parse(localStorage.getItem('jok_progress')).levels['1'].walls)).solutions[0].w);
 check('Tune entry repairs to a solvable map',Number.isFinite(w));
 await page.locator('#dojo-weight').fill(String(w));
 check('Tune earns fourth coin and the only master badge',(await state()).coins===4&&(await state()).master===true);
 await layout('390 Tune');await page.screenshot({path:path.join(qaDir,'tune-390.png'),fullPage:true});
 await page.locator('[data-dojo-action="menu"]:visible').first().click();
 check('master badge appears in menu after Tune',await page.locator('#dojo-master').count()===1);
 for(const lang of ['en','zh','es']){
  await page.locator('#lang-'+lang).click();
  check('new menu '+lang+' translation complete',await page.locator('#dojo-shell [data-en]').evaluateAll((nodes,lang)=>nodes.every(n=>n.hasAttribute('data-zh')&&n.hasAttribute('data-es')&&n.textContent===n.getAttribute('data-'+lang)),lang));
 }
 const firstEvents=await page.evaluate(()=>dataLayer.filter(a=>a[0]==='event').map(a=>({name:a[1],params:a[2]})));
 // Reload persists all progress and skips the demo; preserved unrelated fields.
 await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('jok_progress'));p.unrelated={keep:42};p.levels['8']={keep:true};localStorage.setItem('jok_progress',JSON.stringify(p));});
 await page.reload();await page.waitForFunction(()=>document.body.dataset.dojoView==='menu');
 check('reload skips demo and preserves completed modes',(await state()).coins===4);
 await page.locator('[data-dojo-mode="break"]').click();
 const s=await state();for(const p of s.walls)await cell(p.x,p.y).click();
 for(const p of map.proof.breakWalls)await cell(p.x,p.y).click();
 check('repeating Break does not mint coins',(await state()).coins===4);
 check('other progress remains unchanged',await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('jok_progress'));return p.unrelated.keep===42&&p.levels['8'].keep===true}));
 const events=firstEvents.concat(await page.evaluate(()=>dataLayer.filter(a=>a[0]==='event').map(a=>({name:a[1],params:a[2]}))));
 check('new telemetry carries legacy context',events.filter(e=>e.name.startsWith('l1_')).every(e=>e.params.level===1&&Number.isInteger(e.params.attempt)&&typeof e.params.ui_language==='string'));
 check('all required mode and award events emitted',['l1_mode_enter','l1_break_pass','l1_predict_pass','l1_race_pass','l1_tune_pass','l1_coin','l1_hint_astar'].every(name=>events.some(e=>e.name===name)));
 check('only four first-pass coin events',JSON.stringify(events.filter(e=>e.name==='l1_coin').map(e=>e.params.coins_total))==='[1,2,3,4]');
 await page.evaluate(()=>L1Dojo.enter('predict'));
 const retryMap=JSON.stringify((await state()).walls);
 const incorrectSteps=await page.evaluate(()=>L1DojoCore.search(L1DojoCore.generate(L1DojoCore.dateSeed()).walls.concat(JSON.parse(localStorage.getItem('jok_progress')).levels['1'].walls)).steps.slice(0,10));
 for(let i=0;i<incorrectSteps.length;i++){
  const closed=i?incorrectSteps[i-1].closed[0]:{x:7,y:5};await cell(closed.x,closed.y).click();await page.waitForTimeout(1050);
 }
 check('failed Predict offers immediate retry',await page.locator('[data-dojo-action="retry"]:visible').count()===1);
 await page.locator('[data-dojo-action="retry"]:visible').click();
 check('failed Predict retry keeps the same map',JSON.stringify((await state()).walls)===retryMap);
 check('failed/retried Predict cannot mint coins',(await state()).coins===4);
 for(const width of [360,390,412,844,1280]){
  await page.setViewportSize({width,height:width===844?390:844});
  for(const m of ['menu','break','predict','race','tune']){await page.evaluate(m=>m==='menu'?L1Dojo.menu():L1Dojo.enter(m),m);await layout(width+' '+m);}
 }
 check('no uncaught page errors',report.errors.length===0);
 report.events=events;report.summary={passed:report.checks.length,total:report.checks.length};
 fs.writeFileSync(path.join(root,'docs/JOK_SPEC_03/browser-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.summary));await browser.close();server.close();
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(root,'docs/JOK_SPEC_03/browser-failure.json'),JSON.stringify({error:e.message,report},null,2));server.close();process.exit(1);});
