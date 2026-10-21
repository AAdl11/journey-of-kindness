/* Homepage adapter. Search and path animation belong to the shared A* library. */
(function () {
 'use strict';
 const $ = id => document.getElementById(id);
 const door = $('door'), board = $('door-grid'), stage = $('map-stage');
 let language = document.documentElement.dataset.lang || 'en';
 let soundEnabled = false, view, mini, miniTimer, toastTimer, transitionTimer;
 let phase = 'campus', editable = false, pendingRoadblocks = [], interactionCount = 0;
 let lastReplayEnd = 0, blocked = false;
 const began = performance.now();
 const later = (fn, ms) => window.setTimeout(fn, ms);
 const elapsed = () => performance.now() - began;
 const words = {
  en: {map:'Interactive route map',cell:'Cell',start:'You are here',goal:'Destination',wall:'Roadblock',road:'Road',music:'Music could not start. Try again.'},
  zh: {map:'可互動的路線地圖',cell:'格子',start:'你在這裡',goal:'終點',wall:'路障',road:'道路',music:'音樂無法播放，請再試一次。'},
  es: {map:'Mapa de rutas interactivo',cell:'Casilla',start:'Estás aquí',goal:'Destino',wall:'Obstáculo',road:'Camino',music:'No se pudo iniciar la música. Inténtalo de nuevo.'}
 };
 function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
 function track(name, extra = {}) { if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({ui_language: language},extra)); }
 function setLang(lang) {
  if (!['en','zh','es'].includes(lang)) return;
  language = lang;
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang;
  document.body.classList.remove('lang-en','lang-zh','lang-es');
  document.body.classList.add('lang-'+lang);
  try { localStorage.setItem('jok-lang',lang); } catch (_) {}
  document.querySelectorAll('.languages button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.lang === lang)));
  board.setAttribute('aria-label',words[lang].map);
  $('story-video').setAttribute('aria-label',$('story-link').innerText);
  if (view) view.refresh();
 }
 window.setLang = setLang;
 document.querySelectorAll('.languages button').forEach(b => b.addEventListener('click',() => setLang(b.dataset.lang)));
 function caption(id) { document.querySelectorAll('.scene-caption').forEach(p => { const active=p.id===id; p.classList.toggle('active',active); p.setAttribute('aria-hidden',String(!active)); }); }
 function renderCell(cell, point, frame) {
  const same = p => p.x === point.x && p.y === point.y;
  const start = same(frame.grid.start), goal = same(frame.grid.goal), wall = frame.grid.walls.some(same);
  if (start || goal) { const marker = document.createElement('i'); marker.className = start ? 'start-dot' : 'flag'; marker.setAttribute('aria-hidden','true'); cell.appendChild(marker); }
  const w = words[language];
  cell.setAttribute('aria-label',`${w.cell} ${point.x+1}, ${point.y+1}: ${start?w.start:goal?(phase==='neighborhood'?({en:'Mrs. Garcia',zh:'Garcia 阿嬤',es:'Señora Garcia'}[language]):w.goal):wall?w.wall:w.road}`);
  cell.setAttribute('aria-disabled',String(!editable)); cell.tabIndex = editable ? 0 : -1;
  cell.setAttribute('aria-pressed',String(wall));
 }
 function enableEditing(on) { editable=on;board.dataset.editable=String(on); if(view)view.refresh(); }
 function campusGrid() { return AStarEngine.createGrid({cols:6,rows:6,start:{x:0,y:4},goal:{x:5,y:1},walls:[{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:1,y:2},{x:3,y:3},{x:4,y:3},{x:1,y:5}]}); }
 function replayFinished(noPath) {
  blocked=noPath;
  $('no-path').hidden = !noPath;
  if (pendingRoadblocks.length) {
   // Preserve one event per gesture even if another gesture restarts an unfinished replay.
   pendingRoadblocks.splice(0).forEach(lang => track('door_roadblock',{ui_language:lang}));
   clearTimeout(toastTimer); $('toast').hidden=false;
   toastTimer=later(() => {$('toast').hidden=true;},2000);
   lastReplayEnd=elapsed();
  }
  if (phase==='campus') scheduleTransition();
 }
 function drop(x,y) {
  if(!editable) return;
  clearTimeout(transitionTimer);
  pendingRoadblocks.push(language); interactionCount++;
  $('no-path').hidden=true; $('toast').hidden=true;
  blocked=false;
  view.dropWall(x,y);
 }
 function mount(grid) {
  view=mountAStar(board,grid,{onCellClick:drop,renderCell,sound:()=>soundEnabled,vibrate:false,
   onDone:()=>replayFinished(false),onNoPath:()=>replayFinished(true)}).setSpeed(120);
  enableEditing(editable);
 }
 function scheduleTransition() {
  clearTimeout(transitionTimer);
  if(phase!=='campus'||blocked||pendingRoadblocks.length) return;
  const target=interactionCount?Math.max(12000,lastReplayEnd+2000):15000;
  transitionTimer=later(beginCredits,Math.max(0,target-elapsed()));
 }
 function beginCredits() {
  if(phase!=='campus'||pendingRoadblocks.length||blocked)return;
  phase='credits';enableEditing(false);view.pause();
  caption('caption-book');
  later(()=>caption(''),1000);
  later(()=>caption('caption-grad'),1250);
  later(()=>caption(''),2250);
  later(()=>{
   stage.classList.add('zoom-out');
   later(()=>{
    phase='neighborhood';door.dataset.scene=phase;
    $('location').style.visibility='hidden';
    document.querySelector('.garcia-name').hidden=false;
    mount(AStarEngine.createGrid({cols:6,rows:6,start:{x:0,y:4},goal:{x:5,y:1},walls:[{x:1,y:1},{x:1,y:2},{x:2,y:4},{x:3,y:4},{x:4,y:2},{x:4,y:3}]}));
    stage.classList.remove('zoom-out');stage.classList.add('arrive');
    caption('caption-real');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{stage.classList.remove('arrive');enableEditing(true);view.play();}));
   },650);
  },2500);
 }
 function progress() {
  let data;try{data=JSON.parse(read('jok_progress')||'{}');}catch(_){data={};}
  const stars=Number(read('jok_l1_beststars'));
  const complete={1:Number.isFinite(stars)&&stars>0,4:Number(data?.levels?.['4']?.rescues)>0,8:data?.l8?.completed===true};
  document.querySelectorAll('.level-card').forEach(c=>{const done=complete[c.dataset.level]===true;c.classList.toggle('completed',done);c.querySelector('.completion').hidden=!done;});
 }
 window.addEventListener('storage',e=>{if(e.key==='jok_progress'||e.key==='jok_l1_beststars')progress();if(e.key==='jok-lang'&&e.newValue)setLang(e.newValue);});
 window.addEventListener('pageshow',progress);
 $('door-play').addEventListener('click',()=>track('door_to_l1',{transport_type:'beacon'}));
 const music=$('bgMusic'), musicButton=$('music-button');
 function musicState(on) { soundEnabled=on;musicButton.setAttribute('aria-pressed',String(on));musicButton.querySelector('.music-off').hidden=on;musicButton.querySelector('.music-on').hidden=!on; }
 musicButton.addEventListener('click',async()=>{
  if(!music.paused){music.pause();musicState(false);return;}
  try{await music.play();musicState(true);}catch(_){musicState(false);musicButton.title=words[language].music;}
 });
 const dialog=$('story-dialog'),video=$('story-video');let resumeMusic=false;
 $('story-link').addEventListener('click',e=>{
  if(typeof dialog.showModal!=='function')return;
  e.preventDefault();resumeMusic=!music.paused;music.pause();soundEnabled=false;
  video.src='intro.mp4';dialog.showModal();video.play().catch(()=>{});
 });
 $('close-story').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();if(resumeMusic)music.play().then(()=>musicState(true)).catch(()=>musicState(false));});
 setLang(language);progress();caption('');mount(campusGrid());
 track('door_seen');
 later(()=>{view.play();},2000);
 later(()=>caption('caption-maps'),3000);
 later(()=>{caption('caption-drop');enableEditing(true);},6000);
 scheduleTransition();
 const miniGrid=AStarEngine.createGrid({cols:6,rows:6,start:{x:0,y:5},goal:{x:5,y:0},walls:[{x:2,y:2},{x:2,y:3},{x:2,y:4},{x:4,y:1}]});
 mini=mountAStar($('mini-grid'),miniGrid,{sound:false,vibrate:false,renderCell:()=>{},onDone:()=>{miniTimer=later(()=>mini.reset().play(),1000);}}).setSpeed(200);
 // Keep the looping thumbnail inexpensive when the directory is off screen.
 let miniVisible=false;
 const observer=new IntersectionObserver(entries=>{miniVisible=entries[0].isIntersecting;runMini();});
 function runMini(){clearTimeout(miniTimer);if(miniVisible&&!document.hidden){if($('mini-grid').dataset.astarStatus==='done')mini.reset();mini.play();}else mini.pause();}
 observer.observe($('mini-grid'));document.addEventListener('visibilitychange',runMini);
 window.addEventListener('pagehide',()=>{view.pause();mini.pause();clearTimeout(miniTimer);});
 window.addEventListener('pageshow',e=>{if(e.persisted){view.play();runMini();}});
})();
