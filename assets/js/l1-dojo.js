/* L1 UI adapter. Story/demo, media, stars and GA lifecycle remain in index.html. */
(function(){
'use strict';
const C=L1DojoCore, $=id=>document.getElementById(id);
const TEXT={
 title:['A* Dojo','A* 道場','Dojo A*'], coins:['Coins: {n}','金幣：{n}','Monedas: {n}'],
 break:['Break it','破解','Romper'],predict:['Predict','預測','Predecir'],race:['Race','競速','Carrera'],tune:['Tune it','調參','Ajustar'],
 breakDesc:['Add roadblocks to make the route longer.','放路障，讓路線變長。','Añade obstáculos para alargar la ruta.'],
 predictDesc:['Guess which cell AI expands next.','猜 AI 下一步展開哪一格。','Adivina qué casilla expande la IA.'],
 raceDesc:['Visit Grandma, then match A*.','經過阿嬤，再追平 A*。','Visita a la abuela e iguala A*.'],
 tuneDesc:['Adjust w. Explore less, keep the shortest route.','調整 w，少探索，仍走最短路。','Ajusta w. Explora menos y conserva la ruta más corta.'],
 cost:['Requires {n} coins','需要 {n} 枚金幣','Requiere {n} monedas'],
 unlocked:['Unlocked','已解鎖','Desbloqueado'],locked:['Locked','尚未解鎖','Bloqueado'],passed:['Passed','已通過','Superado'],
 lockHint:['Pass the previous trial to unlock this mode.','通過上一層的考驗就能解鎖。','Supera la prueba anterior para desbloquear este modo.'],
 economy:['Each trial awards one coin, once. Coins unlock the next mode.','每個考驗首次通過給一枚金幣，用來解鎖下一層。','Cada prueba da una moneda solo la primera vez. Las monedas desbloquean el siguiente modo.'],
 clear:['Clear my roadblocks','清空我的路障','Borrar mis obstáculos'], cleared:['Your roadblocks have been cleared.','已清空你的路障。','Se borraron tus obstáculos.'],
 demo:['Watch the demo again','再看一次示範','Volver a ver la demostración'],menu:['Dojo menu','道場選單','Menú del dojo'],
 enterDojo:['Enter the dojo','進入道場','Entrar al dojo'],retry:['Try again','再試一次','Reintentar'],
 demoNext:['Go to your turn','進入你的回合','Ir a tu turno'],
 breakTask:['👉 Tap road cells to add roadblocks (up to 3). Make A*’s route {n} steps or longer to earn a coin.','👉 點道路放路障（最多 3 個），讓 A* 的路線變成 {n} 步以上，就拿到 1 枚金幣。','👉 Toca calles para poner obstáculos (hasta 3). Haz que la ruta de A* tenga {n} pasos o más para ganar una moneda.'],
 predictTask:['👉 Tap the cell A* will expand next. Get {n} of {total} right to earn a coin.','👉 點 A* 下一步會展開的格子。{total} 題答對 {n} 題，就拿到 1 枚金幣。','👉 Toca la casilla que A* expandirá. Acierta {n} de {total} para ganar una moneda.'],
 tuneTask:['👉 Drag the w slider. Explore 30% fewer cells than w = 1, with the same route length, to earn a coin.','👉 拖動 w 滑桿。探索格數比 w = 1 少三成、路線一樣短，就拿到 1 枚金幣。','👉 Mueve el control w. Explora un 30% menos de casillas que con w = 1, con la misma longitud de ruta, para ganar una moneda.'],
 demoPlaying:['🎬 The AI shows you first. Your turn starts in a moment.','🎬 AI 先示範一次，馬上換你。','🎬 La IA te muestra primero. Enseguida es tu turno.'],
 breakDemoPick:['🎬 The AI taps a road cell on the route. That drops a roadblock.','🎬 AI 點路線上的一格道路，放下一個路障。','🎬 La IA toca una calle de la ruta y pone un obstáculo.'],
 breakDemoResult:['🎬 A* went around it: {a} steps before, {b} steps now. Find spots that force a longer way around.','🎬 A* 繞過去了：原本 {a} 步，現在 {b} 步。找出逼它繞更遠的位置。','🎬 A* lo rodeó: antes {a} pasos, ahora {b}. Busca lugares que la obliguen a dar más vuelta.'],
 yourTurnBreak:['✋ Your turn. Tap a road cell to add a roadblock. Tap it again to remove it.','✋ 換你了。點一格道路放路障，再點一次就移除。','✋ Tu turno. Toca una calle para poner un obstáculo. Tócalo otra vez para quitarlo.'],
 predictDemo:['🎬 Watch: A* always expands the open cell with the lowest f (the small number in the corner).','🎬 看好：A* 每次都展開候選格裡 f 最小的那一格（格子角落的小數字）。','🎬 Mira: A* siempre expande la casilla abierta con la f más baja (el número pequeño de la esquina).'],
 yourTurnPredict:['✋ Your turn. Tap the cell with the lowest f.','✋ 換你了。點 f 最小的那一格。','✋ Tu turno. Toca la casilla con la f más baja.'],
 tuneDemo:['🎬 Watch: w = 0 explores {e0} cells. w = 1 explores {e1}.','🎬 看好：w = 0 探索 {e0} 格，w = 1 探索 {e1} 格。','🎬 Mira: w = 0 explora {e0} casillas. w = 1 explora {e1}.'],
 yourTurnTune:['✋ Your turn. Drag the slider and watch E and L.','✋ 換你了。拖動滑桿，看 E 和 L 怎麼變。','✋ Tu turno. Mueve el control y observa E y L.'],
 raceDemo:['🎬 Watch the AI’s route to Grandma first. Then it’s your turn.','🎬 先看 AI 怎麼走到阿嬤家，然後換你。','🎬 Primero mira la ruta de la IA hasta la abuela. Luego es tu turno.'],
 showMe:['▶ Show me how','▶ 示範給我看','▶ Muéstrame cómo'],
 backToBoard:['Back to the board','回到地圖','Volver al tablero'],
 playAgain:['Play again','再玩一次','Jugar otra vez'],
 coinEarned:['Coins now: {n}.','金幣現在：{n} 枚。','Monedas ahora: {n}.'],
 backMenu:['← Dojo menu','← 道場選單','← Menú del dojo'],
 route:['Route now: {n} steps','路線現在：{n} 步','Ruta ahora: {n} pasos'],goal:['Goal: {n}+ steps','目標：{n} 步以上','Meta: {n}+ pasos'],walls:['Walls: {n}/3','路障：{n}/3','Muros: {n}/3'],
 wallLimit:['You can place up to 3 roadblocks.','最多可放 3 個路障。','Puedes colocar hasta 3 obstáculos.'],
 noPath:['No path. A* gives up here. Remove a wall.','沒有路了。A* 在這裡停止，請移除一個路障。','No hay ruta. A* se detiene aquí. Quita un muro.'],
 breakPass:['You just made A* work harder. +1 coin','你讓 A* 多費了一番功夫。+1 金幣','Acabas de hacer trabajar más a A*. +1 moneda'],
 againPass:['Trial passed. This mode’s coin was already earned.','考驗通過。這一層的金幣已經領過了。','Prueba superada. Ya ganaste la moneda de este modo.'],
 predictCount:['Correct: {correct}/{total} · Guess {step}/{total}','答對：{correct}/{total} · 第 {step}/{total} 步','Aciertos: {correct}/{total} · Paso {step}/{total}'],
 correct:['Correct! +1','猜對了！+1','¡Correcto! +1'],wrong:['The next cell has f = {f}.','下一個展開的格子 f = {f}。','La siguiente casilla tiene f = {f}.'],
 predictPass:['Prediction trial passed. +1 coin','預測考驗通過。+1 金幣','Prueba de predicción superada. +1 moneda'],
 predictFail:['{correct}/{total} correct. Try again on the same map.','答對 {correct}/{total} 步。在同一張地圖再試一次。','{correct}/{total} aciertos. Reintenta en el mismo mapa.'],
 hint:['Why does this happen?','為什麼？','¿Por qué ocurre?'],
 frontier:['h estimates distance to the goal, so lower f often pulls the frontier toward it.','h 估計到終點的距離，所以較小的 f 常讓候選範圍往終點延伸。','h estima la distancia a la meta, por eso una f menor suele orientar la frontera hacia ella.'],
 weight:['Weight w','權重 w','Peso w'],dijkstra:['0 = Dijkstra (full exploration)','0 = Dijkstra（全圖探索）','0 = Dijkstra (exploración completa)'],
 astar:['1 = A*','1 = A*','1 = A*'],greedy:['3 = Greedy','3 = Greedy（貪婪）','3 = Greedy (voraz)'],
 tuneNote:['w = 0 ignores the goal and spreads evenly (Dijkstra). w = 1 is A*: h never overestimates, so the path is always shortest. w > 1 trusts h more than it should: fewer cells explored, but the path can come out longer. Find the sweet spot for this map.','w = 0 不看終點，往四面平均擴散（Dijkstra）。w = 1 是 A*：h 從不高估，所以路一定最短。w > 1 太相信 h：探的格子變少，但路可能變長。找出這張圖的甜蜜點。','w = 0 ignora la meta y se expande parejo (Dijkstra). w = 1 es A*: h nunca sobreestima, así que la ruta siempre es la más corta. w > 1 confía de más en h: explora menos celdas, pero la ruta puede alargarse. Encuentra el punto justo para este mapa.'],
 explored:['Explored E: {n}','探索格數 E：{n}','Exploradas E: {n}'],length:['Path L: {n}','路徑長度 L：{n}','Longitud L: {n}'],
 baseline:['w = 1 baseline: E₁ = {e}, L₁ = {l}','w = 1 基準：E₁ = {e}，L₁ = {l}','Referencia w = 1: E₁ = {e}, L₁ = {l}'],
 tunePass:['A* Master · +1 coin','A* 大師 · +1 金幣','Maestro A* · +1 moneda'],master:['A* Master','A* 大師','Maestro A*'],
 weightHint:['When w > 1, w·h can overestimate the remaining cost, so the shortest route is no longer guaranteed.','w > 1 時，w·h 可能高估剩餘成本，失去 admissible 的保證，因此可能找到次佳路線。','Cuando w > 1, w·h puede sobreestimar el costo restante y ya no se garantiza la ruta más corta.'],
 moved:['A roadblock was moved to the nearest free cell.','一個路障已移到最近的空格。','Se movió un obstáculo a la casilla libre más cercana.'],
 removed:['One of your roadblocks blocked today’s route and has been removed.','你昨天的一個路障今天擋住路了，已移開。','Uno de tus obstáculos bloqueaba la ruta de hoy y se retiró.'],
 removedTune:['A roadblock made the tuning trial impossible and has been removed.','一個路障讓調參考驗無解，已移開。','Un obstáculo impedía resolver la prueba de ajuste y se retiró.'],
 storage:['Progress could not be saved on this device.','這個裝置目前無法儲存進度。','No se pudo guardar el progreso en este dispositivo.'],
 raceHelp:['Visit Grandma, then reach home in {n} steps or fewer to earn a coin.','先經過阿嬤家，再在 {n} 步內到終點，就拿到 1 枚金幣。','Visita a la abuela y llega a casa en {n} pasos o menos para ganar una moneda.'],
 astarSteps:['A*: {n} steps','A*：{n} 步','A*: {n} pasos'],playerSteps:['You: {n} steps','你：{n} 步','Tú: {n} pasos'],
 raceTie:['I tied A* in {n} steps.','我跟 A* 平手，{n} 步。','Empaté con A* en {n} pasos.'],
 raceBetter:['I beat A* by {n} steps.','我比 A* 少 {n} 步。','Superé a A* por {n} pasos.'],
 racePass:['Race trial passed. +1 coin','競速考驗通過。+1 金幣','Prueba de carrera superada. +1 moneda'],
 portico:['Ataraxy Portico','靜心之門','Portal de la Serenidad'],
 saveCard:['Save a screenshot of this card.','可截圖保存這張成績卡。','Puedes guardar una captura de esta tarjeta.']
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function strings(id,values={}){return TEXT[id].map(s=>s.replace(/\{(\w+)\}/g,(_,k)=>values[k]??''));}
function text(id,v){return strings(id,v)[['en','zh','es'].indexOf(currentLang)]||strings(id,v)[0];}
function tag(id,v={},name='span'){const a=strings(id,v);return `<${name} data-en="${esc(a[0])}" data-zh="${esc(a[1])}" data-es="${esc(a[2])}">${esc(text(id,v))}</${name}>`;}
function button(id,action,primary=false){return `<button class="dojo-btn${primary?' primary':''}" data-dojo-action="${action}">${tag(id)}</button>`;}
let statsGroup=null,statsAnchor=null;
function restoreStats(){if(statsGroup&&statsAnchor?.parentNode)statsAnchor.parentNode.insertBefore(statsGroup,statsAnchor.nextSibling);}
let storage;try{storage=localStorage;}catch(_){storage={getItem(){throw Error('Storage denied');},setItem(){throw Error('Storage denied');}};}
let state=C.load(storage),map=null,mode='demo',view=null,prediction=null,runId=0,startingRace=false,epoch=0,notice='',lastBreak=null,lastTune=null,trialPassed=false;
function persist(){if(!C.save(storage,state)){notice=tag('storage');return false;}return true;}
function analytics(name,params){if(window.jokAnalytics)jokAnalytics.event(name,params);}
function combined(){return map.walls.concat(state.walls);}
// A trial's first visit plays a short AI demo; player input waits until it ends.
let demoActive=false,demoCleanup=null;
function endDemo(){demoActive=false;if(demoCleanup){const f=demoCleanup;demoCleanup=null;f();}}
function stopView(){runId++;endDemo();if(view){view.destroy();view=null;}prediction=null;}
function stopMeditation(){epoch++;const a=$('meditation-music');a.pause();a.currentTime=0;}
function repair(requireTune=false){
    const r=C.repair(map.walls,state.walls,requireTune);state.walls=r.walls;state.wallsSeed=map.seed;
    if(r.moved)notice+=tag('moved')+' ';
    if(r.removed)notice+=tag(requireTune?'removedTune':'removed')+' ';
    persist();
}
function setView(next){
    mode=next;document.body.dataset.dojoView=next;
    $('dojo-shell').hidden=!['menu','break','predict','tune'].includes(next);
    $('dojo-demo-tools').hidden=next!=='demo';
    $('dojo-race-compare').hidden=next!=='race';
    showScreen('game-screen');
}
// Mode names inside a sentence must follow the language, so these are built per language.
const NEXT=['Next: {m}','下一關：{m}','Siguiente: {m}'],UNLOCKED=['{m} is now unlocked.','「{m}」已解鎖。','{m} ya está desbloqueado.'];
function tagParts(a,name='span'){return `<${name} data-en="${esc(a[0])}" data-zh="${esc(a[1])}" data-es="${esc(a[2])}">${esc(a[['en','zh','es'].indexOf(currentLang)]??a[0])}</${name}>`;}
function withMode(tpl,m){return tagParts(tpl.map((t,i)=>t.replace('{m}',TEXT[m][i])));}
function nextMode(m){return C.MODES[C.MODES.indexOf(m)+1]||null;}
function updateCoins(){document.querySelectorAll('.dojo-coins,.dojo-sticky-coins').forEach(e=>{e.innerHTML=tag('coins',{n:state.coins});});}
function sticky(show){
    let bar=$('dojo-sticky');if(!bar){bar=document.createElement('div');bar.id='dojo-sticky';document.body.appendChild(bar);}
    bar.innerHTML=`<button class="dojo-btn" data-dojo-action="menu">${tag('backMenu')}</button><span class="dojo-sticky-coins">${tag('coins',{n:state.coins})}</span>`;bar.hidden=!show;
}
function menu(){
    restoreStats();
    stopView();stopCinematic();searchViz.active=false;gameState.mode='dojo';stopMeditation();
    setView('menu');
    $('dojo-shell').innerHTML=`<section class="dojo-panel"><div class="dojo-top"><p class="dojo-eyebrow">L1 · A*</p><div class="dojo-coins">${tag('coins',{n:state.coins})}</div></div><h1 class="dojo-title">${tag('title')}</h1><p class="dojo-help">${tag('economy')}</p><p class="dojo-status" id="dojo-notice" aria-live="polite">${notice}</p><div class="dojo-cards">${C.MODES.map((m,i)=>`<button class="dojo-card" data-dojo-mode="${m}" data-locked="${!C.unlocked(state,m)}" data-passed="${state.passed[m]}"><small>0${i+1} · ${tag('cost',{n:i})}</small><strong>${tag(m)}</strong><small>${tag(m+'Desc')}</small><small>${tag(state.passed[m]?'passed':C.unlocked(state,m)?'unlocked':'locked')}</small></button>`).join('')}</div>${state.master?`<div class="dojo-success" id="dojo-master">🏅 ${tag('master')}</div>`:''}<div class="dojo-actions">${button('clear','clear')}${button('demo','demo')}</div><p class="dojo-note">${esc(map.seed)}</p></section>`;
    sticky(false);
    $('dojo-shell').scrollIntoView({block:'start'});
}
function hintBlock(id){return `<details class="dojo-hint"><summary>${tag('hint')}</summary><p>${tag(id)}</p>${button('backToBoard','board')}</details>`;}
function shell(m,vars={}){
    restoreStats();
    setView(m);gameState.mode='dojo';
    $('dojo-shell').innerHTML=`<section class="dojo-panel"><div class="dojo-top">${button('menu','menu')}<div class="dojo-coins">${tag('coins',{n:state.coins})}</div></div><h1 class="dojo-mode-title">${tag(m)}</h1><p class="dojo-task" id="dojo-task">${tag(m+'Task',vars)}</p><p class="dojo-status" id="dojo-notice" aria-live="polite">${notice}</p><div id="dojo-metrics" class="dojo-metrics"></div><div class="dojo-panelstats" id="dojo-panelstats"></div><div id="dojo-extra"></div><p id="dojo-status" class="dojo-status dojo-turn" aria-live="polite"></p><div id="dojoboard"></div><div id="dojo-result"></div><div id="dojo-bottom"></div></section>`;
    $('dojo-panelstats').appendChild(statsGroup);
    sticky(true);
    $('dojo-shell').scrollIntoView({block:'start'});
}
function showStatus(id,vars={}){if($('dojo-status'))$('dojo-status').innerHTML=tag(id,vars);}
function panel(snapshot){if(!snapshot)return;for(const k of ['g','h','f'])$(k+'-value').textContent=snapshot[k];}
function renderCell(cell,p,frame){
    const k=C.key(p),walls=new Set(frame.grid.walls.map(C.key));
    cell.textContent=C.same(p,C.START)?'🚚':C.same(p,C.GOAL)?'🏠':C.same(p,C.GARCIA)?'👵':walls.has(k)?'■':'';
    if(state.walls.some(q=>C.same(q,p)))cell.classList.add('dojo-player-wall');
    const candidate=frame.snapshot?.open.find(q=>C.same(p,q));
    if(candidate){const n=document.createElement('small');n.className='dojo-f';n.textContent=candidate.f;cell.appendChild(n);}
}
function mount(w=1,onCellClick,play=false,speed=120){
    if(view)view.destroy();
    view=mountAStar($('dojoboard'),C.grid(combined(),w),{renderCell,onCellClick,sound:()=>soundEnabled,onStep:panel});
    if(play)view.setSpeed(speed).play();
    return view;
}
// Draw the finished search and its route at once, so a tap shows its effect immediately.
function showFinal(r){const last=r.steps[r.steps.length-1];view.redraw(last,r.path||[]);panel(last);}
function flash(p){const el=$('dojoboard')?.querySelector(`[data-x="${p.x}"][data-y="${p.y}"]`);if(el)el.classList.add('dojo-flash');}
function award(m,params){
    if(trialPassed)return false;trialPassed=true;
    const first=C.award(state,m);persist();
    analytics('l1_'+m+'_pass',params);
    if(first)analytics('l1_coin',{coins_total:state.coins});
    return first;
}
function resultHtml(id,first,m,extraButtons=''){
    const next=nextMode(m),open=next&&C.unlocked(state,next);
    const earned=first?`<p>${tag('coinEarned',{n:state.coins})}${open?' '+withMode(UNLOCKED,next):''}</p>`:'';
    const nextButton=open?`<button class="dojo-btn primary" data-dojo-mode="${next}">${withMode(NEXT,next)}</button>`:'';
    return `<div class="dojo-success" id="dojo-pass"><h3>${tag(first?id:'againPass')}</h3>${earned}<div class="dojo-actions">${nextButton}${extraButtons||button('playAgain','retry',!open)}${button('menu','menu')}</div></div>`;
}
function result(id,first,m){
    $('dojo-result').innerHTML=resultHtml(id,first,m);updateCoins();
    $('dojo-result').scrollIntoView({block:'center',behavior:'smooth'});
}
function runBreak(){
    const goal=C.breakTarget(map.walls),current=C.search(combined()),extra=current.path?current.length-goal.base:null;
    lastBreak={n0:goal.base,n:current.length,extra,walls:state.walls.length,target:goal.target};
    $('dojo-metrics').innerHTML=tag('route',{n:current.length??'—'})+tag('goal',{n:goal.target})+tag('walls',{n:state.walls.length});
    mount(1,breakClick);showFinal(current);
    if(!current.path){showStatus('noPath');return;}
    if(!demoActive&&!trialPassed&&current.length>=goal.target){
        const first=award('break',{extra_steps:extra,walls_used:state.walls.length});result('breakPass',first,'break');
    }
}
function breakClick(x,y){
    if(mode!=='break')return;
    if(demoActive){showStatus('demoPlaying');return;}
    const p={x,y};
    if(C.protectedCell(p)||map.walls.some(q=>C.same(p,q)))return;
    const at=state.walls.findIndex(q=>C.same(p,q));
    if(at>=0)state.walls.splice(at,1);
    else if(state.walls.length<3)state.walls.push(p);
    else{showStatus('wallLimit');return;}
    state.wallsSeed=map.seed;persist();showStatus('yourTurnBreak');runBreak();
}
function breakDemo(){
    if(demoActive)return;
    const version=runId,saved=state.walls.map(p=>({...p})),base=C.search(map.walls);
    // Demo a roadblock that A* simply walks around (same length), so it teaches
    // the move without giving away a passing spot.
    const options=(base.path||[]).filter(q=>!C.protectedCell(q)).map(q=>({q,r:C.search(map.walls.concat([q]))}))
        .filter(o=>o.r.path&&C.race(map.walls.concat([o.q])));
    const pick=options.find(o=>o.r.length===base.length)||options[0];
    if(!pick){state.breakDemoSeen=true;persist();showStatus('yourTurnBreak');return;}
    demoActive=true;demoCleanup=()=>{state.walls=saved;};
    state.walls=[];runBreak();showStatus('demoPlaying');
    const alive=()=>version===runId&&mode==='break'&&demoActive;
    setTimeout(()=>{if(!alive())return;flash(pick.q);showStatus('breakDemoPick');},1200);
    setTimeout(()=>{if(!alive())return;state.walls=[{...pick.q}];runBreak();showStatus('breakDemoResult',{a:base.length,b:pick.r.length});},3200);
    setTimeout(()=>{
        if(!alive())return;
        demoCleanup=null;demoActive=false;state.walls=saved;state.breakDemoSeen=true;persist();runBreak();showStatus('yourTurnBreak');
    },7600);
}
function breakMode(){
    shell('break',{n:C.breakTarget(map.walls).target});
    $('dojo-bottom').innerHTML=hintBlock('frontier')+`<div class="dojo-actions">${button('showMe','showme')}</div>`;
    runBreak();
    if(!state.breakDemoSeen)breakDemo();else if(!trialPassed)showStatus('yourTurnBreak');
}
function predictMetrics(){const p=prediction;$('dojo-metrics').innerHTML=tag('predictCount',{correct:p.correct,total:p.total,step:Math.min(p.index+1,p.total)});}
function predictMode(){
    const r=C.search(combined()),total=Math.min(10,r.steps.length-1);
    shell('predict',{n:Math.ceil(.7*total),total});
    prediction={steps:r.steps.slice(1),total,index:0,correct:0,locked:false};
    $('dojo-bottom').innerHTML=hintBlock('frontier')+`<div class="dojo-actions">${button('showMe','showme')}</div>`;
    mount(1,predictClick);predictFrame();
    if(!state.predictDemoSeen)predictDemo();else showStatus('yourTurnPredict');
}
function predictFrame(){
    const p=prediction;
    if(p.index>=p.total){
        const passed=p.correct>=Math.ceil(.7*p.total);p.locked=true;
        if(passed){const first=award('predict',{correct:p.correct,total:p.total});result('predictPass',first,'predict');}
        else{$('dojo-result').innerHTML=`<div class="dojo-success">${tag('predictFail',{correct:p.correct,total:p.total})}<div class="dojo-actions">${button('retry','retry',true)}${button('menu','menu')}</div></div>`;$('dojo-result').scrollIntoView({block:'center',behavior:'smooth'});}
        predictMetrics();return;
    }
    const first=C.search(combined()).steps[0];
    const previous=p.index?p.steps[p.index-1]:first;
    view.redraw(previous,[]);panel(previous);
    predictMetrics();
}
function predictDemo(){
    if(demoActive||!prediction)return;
    const version=runId,steps=C.search(combined()).steps;
    demoActive=true;prediction.locked=true;$('dojo-result').innerHTML='';
    view.redraw(steps[0],[]);panel(steps[0]);showStatus('predictDemo');
    const alive=()=>version===runId&&mode==='predict'&&demoActive;
    let i=0;
    const tick=()=>{
        if(!alive())return;
        if(i>=2||!steps[i+1]){
            demoActive=false;state.predictDemoSeen=true;persist();
            Object.assign(prediction,{index:0,correct:0,locked:false});trialPassed=false;predictFrame();showStatus('yourTurnPredict');return;
        }
        flash(steps[i+1].current);
        setTimeout(()=>{if(!alive())return;view.redraw(steps[i+1],[]);panel(steps[i+1]);i++;setTimeout(tick,1000);},1500);
    };
    setTimeout(tick,1800);
}
function predictClick(x,y){
    const p=prediction;if(mode!=='predict'||!p)return;
    if(demoActive){showStatus('demoPlaying');return;}
    if(p.locked)return;
    const next=p.steps[p.index],open=p.index?p.steps[p.index-1].open:C.search(combined()).steps[0].open;
    const chosen=open.find(q=>q.x===x&&q.y===y),correct=!!chosen&&chosen.f===next.f;
    p.locked=true;const version=runId;
    if(correct){p.correct++;showStatus('correct');const cell=$('dojoboard').querySelector(`[data-x="${x}"][data-y="${y}"]`);cell.classList.add('dojo-correct');}
    else{showStatus('wrong',{f:next.f});flash(next.current);}
    setTimeout(()=>{
        if(version!==runId||mode!=='predict')return;
        view.redraw(next,[]);panel(next);p.index++;p.locked=false;predictFrame();
    },correct?450:1000);
}
function tuneRun(w){
    const base=C.search(combined()),r=C.search(combined(),w);lastTune={w,explored:r.explored,length:r.length,baseline_explored:base.explored,baseline_length:base.length};
    $('dojo-weight-value').textContent=w;
    $('dojo-metrics').innerHTML=tag('explored',{n:r.explored})+tag('length',{n:r.length??'—'});
    $('dojo-baseline').innerHTML=tag('baseline',{e:base.explored,l:base.length});
    mount(w,null,true,80);
    if(demoActive||trialPassed)return;
    if(r.path&&r.explored<=.7*base.explored&&r.length===base.length){const first=award('tune',{w,explored:r.explored,baseline_explored:base.explored});result('tunePass',first,'tune');}
    else $('dojo-result').innerHTML='';
}
function tuneDemo(){
    if(demoActive)return;
    const version=runId,slider=$('dojo-weight'),e0=C.search(combined(),0).explored,e1=C.search(combined(),1).explored;
    demoActive=true;slider.disabled=true;demoCleanup=()=>{if($('dojo-weight'))$('dojo-weight').disabled=false;};
    showStatus('demoPlaying');
    const alive=()=>version===runId&&mode==='tune'&&demoActive;
    setTimeout(()=>{if(!alive())return;slider.value='0';tuneRun(0);showStatus('tuneDemo',{e0,e1});},1200);
    setTimeout(()=>{if(!alive())return;slider.value='1';tuneRun(1);},4200);
    setTimeout(()=>{if(!alive())return;demoCleanup=null;demoActive=false;slider.disabled=false;state.tuneDemoSeen=true;persist();showStatus('yourTurnTune');},7000);
}
function tuneMode(){
    shell('tune');
    $('dojo-extra').innerHTML=`<p class="dojo-help mono">f = g + w·h</p><label for="dojo-weight">${tag('weight')}: <strong id="dojo-weight-value">1</strong></label><input id="dojo-weight" class="dojo-range" type="range" min="0" max="3" step="0.5" value="1"><div class="dojo-weight-labels">${tag('dijkstra')}${tag('astar')}${tag('greedy')}</div><p id="dojo-baseline" class="dojo-help"></p><p class="dojo-note">${tag('tuneNote')}</p>`;
    $('dojo-bottom').innerHTML=hintBlock('weightHint')+`<div class="dojo-actions">${button('showMe','showme')}</div>`;
    $('dojo-weight').addEventListener('input',e=>{if(!demoActive)tuneRun(Number(e.target.value));});tuneRun(1);
    if(!state.tuneDemoSeen)tuneDemo();else showStatus('yourTurnTune');
}
function raceCompare(){
    if(mode==='race')$('dojo-race-compare').innerHTML=tag('astarSteps',{n:gameState.raceOptimal})+'<br>'+tag('playerSteps',{n:gameState.steps});
}
function raceDemo(){
    const version=runId,help=()=>setSub(text('raceHelp',{n:gameState.raceOptimal}),'A*');
    setSub(text('raceDemo'),'🎬');
    // The hint is the AI's own route to Grandma; it never moves the player.
    // It is a demo here, so it is not counted as a player hint.
    const challenge=gameState.challengeMode;gameState.challengeMode=false;
    try{originalWatch();}finally{gameState.challengeMode=challenge;}
    state.raceDemoSeen=true;persist();
    const poll=setInterval(()=>{
        if(version!==runId||mode!=='race'){clearInterval(poll);return;}
        if(!hintPlayback.active){clearInterval(poll);if(!gameState.reachedGoal)help();}
    },300);
}
function raceMode(){
    restoreStats();
    setView('race');startingRace=true;
    try{enterChallenge(false);}finally{startingRace=false;}
    gameState.obstacles=combined().map(p=>({...p}));gameState.garcia={...C.GARCIA};
    gameState.raceOptimal=C.race(combined()).length;statsGroup.lastElementChild.querySelector('.stat-value').textContent=gameState.raceOptimal;gameState.aiPath=C.search(combined()).path;
    gameState.nearGarcia=false;gameState.garciaHint=true;
    // enterChallenge used the old map; force the shared renderer to mount the daily map.
    if(gridRenderer){gridRenderer.destroy();gridRenderer=null;}gridSignature='';
    setSub(text('raceHelp',{n:gameState.raceOptimal}),'A*');renderGrid();raceCompare();
    sticky(true);
    $('game-screen').scrollIntoView({block:'start'});
    if(!state.raceDemoSeen)raceDemo();
}
function enter(m){
    if(!C.MODES.includes(m))return;
    if(!C.unlocked(state,m)){const n=$('dojo-notice');if(n){n.innerHTML=tag('lockHint');n.scrollIntoView({block:'center',behavior:'smooth'});}return;}
    stopView();stopCinematic();searchViz.active=false;notice='';
    if(m!=='break')repair(m==='tune');
    gameState.raceOptimal=undefined;trialPassed=false;
    jokAnalytics.start('dojo');analytics('l1_mode_enter',{mode:m});
    ({break:breakMode,predict:predictMode,race:raceMode,tune:tuneMode})[m]();
}
function prepareDemo(){
    restoreStats();
    stopView();stopMeditation();setView('demo');gameState.raceOptimal=undefined;gameState.challengeMode=false;gameState.hardMode=false;
    if(statsGroup)statsGroup.lastElementChild.querySelector('.stat-value').textContent=12;
    applyMap(false);gameState.steps=0;gameState.reachedGoal=false;gameState.savedGarcia=false;
    if(gridRenderer){gridRenderer.destroy();gridRenderer=null;}gridSignature='';
}
function finishDemo(){state.seenDemo=true;persist();menu();}
function resetActive(){if(mode==='race'){enter('race');return true;}if(mode==='menu'){menu();return true;}return false;}
window.replayDojo=function(){stopMeditation();menu();};
window.leavePorticoHome=function(){stopMeditation();window.location.href='../index.html';};
window.L1Dojo={menu,enter,prepareDemo,finishDemo,resetActive,isRaceStarting:()=>startingRace,
    canEnterPortico:()=>mode==='race'&&gameState.savedGarcia&&gameState.reachedGoal&&gameState.steps<=gameState.raceOptimal,
    breathEpoch:()=>epoch,
    beforePortico(){stopView();mode='portico';document.body.dataset.dojoView='portico';$('dojo-race-compare').hidden=true;}
};
const originalLang=setLang;
setLang=function(lang){originalLang(lang);raceCompare();if(mode==='race'&&!gameState.reachedGoal)setSub(text('raceHelp',{n:gameState.raceOptimal}),'A*');};
const originalFaceSlap=showFaceSlap;
showFaceSlap=function(saved){
    originalFaceSlap(saved);$('complete-btn').classList.add('hidden');state.seenDemo=true;persist();
    if(!$('story-area').querySelector('[onclick="L1Dojo.finishDemo()"]'))$('story-area').insertAdjacentHTML('beforeend',renderLadder());
};
const originalMove=movePlayer;
movePlayer=function(x,y){if(mode!=='demo'&&mode!=='race')return;originalMove(x,y);raceCompare();};
const originalResult=showChallengeResult;
showChallengeResult=function(){
    originalResult();if(mode!=='race')return;
    const passed=gameState.savedGarcia&&gameState.steps<=gameState.raceOptimal;
    $('complete-btn').classList.toggle('hidden',!passed);
    const area=$('story-area');area.querySelector('.faceslap > p.text-yellow-300')?.remove();
    // The old rung menu was replaced; use one set of result controls here.
    area.querySelector('.dojo-race-actions')?.remove();
    if(passed){
        const first=award('race',{player_steps:gameState.steps,astar_steps:gameState.raceOptimal});
        if(!state.bestRace||gameState.steps<state.bestRace.player){state.bestRace={player:gameState.steps,astar:gameState.raceOptimal};persist();}
        area.insertAdjacentHTML('beforeend',`<div id="dojo-race-card"><small>L1 · ${esc(map.seed)}</small><strong>${tag(gameState.steps===gameState.raceOptimal?'raceTie':'raceBetter',{n:gameState.steps===gameState.raceOptimal?gameState.steps:gameState.raceOptimal-gameState.steps})}</strong><small>${tag('astarSteps',{n:gameState.raceOptimal})}</small></div><p class="dojo-note">${tag('saveCard')}</p><p class="dojo-help">${tag(first?'racePass':'againPass')}${first?' '+tag('coinEarned',{n:state.coins})+(C.unlocked(state,'tune')?' '+withMode(UNLOCKED,'tune'):''):''}</p><div class="dojo-race-actions">${button('portico','portico',true)}${C.unlocked(state,'tune')?`<button class="dojo-btn" data-dojo-mode="tune">${withMode(NEXT,'tune')}</button>`:''}${button('playAgain','race')}${button('menu','menu')}</div>`);updateCoins();
    }else area.insertAdjacentHTML('beforeend',`<div class="dojo-race-actions">${button('retry','race',true)}${button('menu','menu')}</div>`);
};
const originalWatch=watchAStar;
watchAStar=function(){if(mode==='race'||mode==='demo')originalWatch();};
document.addEventListener('click',e=>{
    const card=e.target.closest('[data-dojo-mode]');if(card){enter(card.dataset.dojoMode);return;}
    const b=e.target.closest('[data-dojo-action]');if(!b)return;
    const action=b.dataset.dojoAction;
    if(action==='menu')menu();
    if(action==='demo'){prepareDemo();startCinematic();}
    if(action==='clear'){state.walls=[];state.wallsSeed=map.seed;notice=tag('cleared');persist();menu();}
    if(action==='retry'){
        // Play again starts Break from a clean board; other trials keep the roadblocks.
        if(mode==='break'){state.walls=[];state.wallsSeed=map.seed;persist();}
        enter(mode);
    }
    if(action==='showme'){({break:breakDemo,predict:predictDemo,tune:tuneDemo})[mode]?.();}
    if(action==='board'){b.closest('details')?.removeAttribute('open');$('dojoboard')?.scrollIntoView({block:'center',behavior:'smooth'});}
    if(action==='race')enter('race');
    if(action==='portico')completeLevel();
    if(action==='demoNext')aiStepForward();
});
document.addEventListener('DOMContentLoaded',()=>{
    statsGroup=$('g-value').parentNode.parentNode;statsAnchor=document.createComment('shared g/h/f panel');statsGroup.parentNode.insertBefore(statsAnchor,statsGroup);
    const shellEl=document.createElement('main');shellEl.id='dojo-shell';shellEl.className='dojo-shell';shellEl.hidden=true;document.body.appendChild(shellEl);
    const demoTools=document.createElement('div');demoTools.id='dojo-demo-tools';demoTools.className='dojo-demo-tools';demoTools.innerHTML=button('demoNext','demoNext');$('astar-grid').parentNode.appendChild(demoTools);
    const compare=document.createElement('div');compare.id='dojo-race-compare';compare.hidden=true;compare.setAttribute('aria-live','polite');document.body.appendChild(compare);
    map=C.generate(C.dateSeed());repair(false);
    if(state.seenDemo)menu();else{jokAnalytics.start('demo');startCinematic();}
});
})();
