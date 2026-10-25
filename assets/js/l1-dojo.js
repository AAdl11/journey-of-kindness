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
 breakTask:['👉 Tap road cells to drop up to 3 roadblocks. Make A* walk 6 extra steps.','👉 點地圖上的空格放路障，最多 3 個，讓 AI 多走 6 步。','👉 Toca las calles para poner hasta 3 muros. Haz que A* camine 6 pasos más.'],
 predictTask:['👉 Tap the cell A* will expand next. 7 of 10 to pass.','👉 點 AI 下一步會展開的格子，10 題答對 7 題就過。','👉 Toca la casilla que A* expandirá. 7 de 10 para aprobar.'],
 raceTask:['👉 Walk to Mrs. Garcia, then home, in no more steps than A*.','👉 走到 Garcia 阿嬤家再到終點，步數不能比 A* 多。','👉 Llega a la Sra. Garcia y luego a la meta sin superar los pasos de A*.'],
 tuneTask:['👉 Drag the w slider. Explore 30% fewer cells and keep the shortest path.','👉 拖動 w 滑桿，探索格數少三成、路仍最短。','👉 Mueve el control w. Explora 30% menos celdas y mantén la ruta más corta.'],
 demoWall:['Watch: one tap here adds a wall and A* re-plans. Now you try.','看好：點這一格就是放路障，AI 立刻重算。換你試。','Mira: un toque aquí pone un muro y A* replanifica. Ahora tú.'],
 backMenu:['← Dojo menu','← 道場選單','← Menú del dojo'],
 breakHelp:['Tap a road to add a wall, or your wall to remove it. Use at most 3 walls to add at least 6 steps.','點道路放路障，點自己的路障移除。最多用 3 個，讓 AI 多走至少 6 步。','Toca una calle para añadir un muro o tu muro para quitarlo. Usa hasta 3 para añadir al menos 6 pasos.'],
 base:['Original N₀: {n}','原始 N₀：{n}','Original N₀: {n}'],now:['Now N: {n}','現在 N：{n}','Ahora N: {n}'],extra:['Extra steps: {n}','多走 {n} 步','Pasos extra: {n}'],walls:['Walls: {n}/3','路障：{n}/3','Muros: {n}/3'],
 wallLimit:['You can place up to 3 roadblocks.','最多可放 3 個路障。','Puedes colocar hasta 3 obstáculos.'],
 noPath:['No path. A* gives up here. Remove a wall.','沒有路了。A* 在這裡停止，請移除一個路障。','No hay ruta. A* se detiene aquí. Quita un muro.'],
 breakPass:['You just made A* work harder. +1 coin','你讓 A* 多費了一番功夫。+1 金幣','Acabas de hacer trabajar más a A*. +1 moneda'],
 againPass:['Trial passed. This mode’s coin was already earned.','考驗通過。這一層的金幣已經領過了。','Prueba superada. Ya ganaste la moneda de este modo.'],
 predictHelp:['Tap the cell AI will expand next. Any open cell tied for the lowest f counts.','點 AI 下一步會展開的格子。候選格中最低 f 同分，都算對。','Toca la casilla que la IA expandirá después. Cualquier casilla abierta empatada con la f mínima cuenta.'],
 predictCount:['Correct: {correct}/{total} · Guess {step}/{total}','答對：{correct}/{total} · 第 {step}/{total} 步','Aciertos: {correct}/{total} · Paso {step}/{total}'],
 correct:['Correct! +1','猜對了！+1','¡Correcto! +1'],wrong:['The next cell has f = {f}.','下一個展開的格子 f = {f}。','La siguiente casilla tiene f = {f}.'],
 predictGoal:['Pass with {n} correct guesses. Wrong guesses lose no points.','答對 {n} 步就通過，猜錯不扣分。','Supera la prueba con {n} aciertos. Los errores no restan puntos.'],
 predictPass:['Prediction trial passed. +1 coin','預測考驗通過。+1 金幣','Prueba de predicción superada. +1 moneda'],
 predictFail:['{correct}/{total} correct. Try again on the same map.','答對 {correct}/{total} 步。在同一張地圖再試一次。','{correct}/{total} aciertos. Reintenta en el mismo mapa.'],
 hint:['Why does this happen?','為什麼？','¿Por qué ocurre?'],
 frontier:['h estimates distance to the goal, so lower f often pulls the frontier toward it.','h 估計到終點的距離，所以較小的 f 常讓候選範圍往終點延伸。','h estima la distancia a la meta, por eso una f menor suele orientar la frontera hacia ella.'],
 tuneHelp:['Find w with at least 30% fewer explored cells and the same shortest path length.','找出一個 w，讓探索格數減少至少 30%，路徑仍和最短路一樣長。','Busca un w que explore al menos un 30% menos de casillas y conserve la longitud mínima.'],
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
 raceHelp:['Visit Grandma, then reach the goal in at most {n} steps.','經過阿嬤，再於 {n} 步內抵達終點。','Visita a la abuela y llega a la meta en un máximo de {n} pasos.'],
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
function stopView(){runId++;if(view){view.destroy();view=null;}prediction=null;}
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
function menu(){
    restoreStats();
    stopView();stopCinematic();searchViz.active=false;gameState.mode='dojo';stopMeditation();
    setView('menu');
    $('dojo-shell').innerHTML=`<section class="dojo-panel"><div class="dojo-top"><p class="dojo-eyebrow">L1 · A*</p><div class="dojo-coins">${tag('coins',{n:state.coins})}</div></div><h1 class="dojo-title">${tag('title')}</h1><p class="dojo-help">${tag('economy')}</p><div class="dojo-cards">${C.MODES.map((m,i)=>`<button class="dojo-card" data-dojo-mode="${m}" data-locked="${!C.unlocked(state,m)}" data-passed="${state.passed[m]}"><small>0${i+1} · ${tag('cost',{n:i})}</small><strong>${tag(m)}</strong><small>${tag(m+'Desc')}</small><small>${tag(state.passed[m]?'passed':C.unlocked(state,m)?'unlocked':'locked')}</small></button>`).join('')}</div>${state.master?`<div class="dojo-success" id="dojo-master">🏅 ${tag('master')}</div>`:''}<div class="dojo-actions">${button('clear','clear')}${button('demo','demo')}</div><p class="dojo-status" id="dojo-notice" aria-live="polite">${notice}</p><p class="dojo-note">${esc(map.seed)}</p></section>`;
    if($('dojo-sticky'))$('dojo-sticky').hidden=true;
    $('dojo-shell').scrollIntoView({block:'start'});
}
function shell(m){
    restoreStats();
    setView(m);gameState.mode='dojo';
    $('dojo-shell').innerHTML=`<section class="dojo-panel"><div class="dojo-top">${button('menu','menu')}<div class="dojo-coins">${tag('coins',{n:state.coins})}</div></div><h1 class="dojo-mode-title">${tag(m)}</h1><p class="dojo-help">${tag(m+'Help')}</p><p class="dojo-status" id="dojo-notice" aria-live="polite">${notice}</p><p class="dojo-task" id="dojo-task">${tag(m+'Task')}</p><div id="dojo-metrics" class="dojo-metrics"></div><div class="dojo-panelstats" id="dojo-panelstats"></div><div id="dojo-extra"></div><div id="dojoboard"></div><p id="dojo-status" class="dojo-status" aria-live="polite"></p><div id="dojo-result"></div><div id="dojo-bottom"></div></section>`;
    $('dojo-panelstats').appendChild(statsGroup);
    let bar=$('dojo-sticky');if(!bar){bar=document.createElement('div');bar.id='dojo-sticky';document.body.appendChild(bar);}
    bar.innerHTML=`<button class="dojo-btn" data-dojo-action="menu">${tag('backMenu')}</button><span class="dojo-sticky-coins">${tag('coins',{n:state.coins})}</span>`;bar.hidden=false;
    $('dojo-task').scrollIntoView({block:'start'});
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
function award(m,params){
    if(trialPassed)return false;trialPassed=true;
    const first=C.award(state,m);persist();
    analytics('l1_'+m+'_pass',params);
    if(first)analytics('l1_coin',{coins_total:state.coins});
    return first;
}
function result(id,first){
    $('dojo-result').innerHTML=`<div class="dojo-success"><h3>${tag(first?id:'againPass')}</h3>${button('menu','menu',true)}</div>`;
    const coins=document.querySelector('#dojo-shell .dojo-coins');if(coins)coins.innerHTML=tag('coins',{n:state.coins});
}
function runBreak(edited=false){
    const current=C.search(combined()),base=C.search(map.walls),extra=current.path?current.length-base.length:null;
    lastBreak={n0:base.length,n:current.length,extra,walls:state.walls.length};
    $('dojo-metrics').innerHTML=tag('base',{n:base.length})+tag('now',{n:current.length??'—'})+tag('extra',{n:extra??'—'})+tag('walls',{n:state.walls.length});
    if(!current.path)showStatus('noPath');else $('dojo-status').textContent='';
    mount(1,breakClick,true,edited?240:120);
    if(current.path&&extra>=6){const first=award('break',{extra_steps:extra,walls_used:state.walls.length});result('breakPass',first);}
}
function breakClick(x,y){
    if(mode!=='break')return;const p={x,y};
    if(C.protectedCell(p)||map.walls.some(q=>C.same(p,q)))return;
    const at=state.walls.findIndex(q=>C.same(p,q));
    if(at>=0)state.walls.splice(at,1);
    else if(state.walls.length<3)state.walls.push(p);
    else{showStatus('wallLimit');return;}
    state.wallsSeed=map.seed;persist();$('dojo-result').innerHTML='';runBreak(true);
}
function breakMode(){
    shell('break');$('dojo-bottom').innerHTML=`<details class="dojo-hint"><summary>${tag('hint')}</summary><p>${tag('frontier')}</p></details>`;runBreak();
    if(!state.breakDemoSeen&&state.walls.length===0){
        const version=runId;
        setTimeout(()=>{
            if(version!==runId||mode!=='break')return;
            const base=C.search(map.walls);
            const pick=(base.path||[]).filter(q=>!C.protectedCell(q)).map(q=>({q,n:C.search(map.walls.concat([q])).length})).filter(o=>o.n&&o.n>base.length).sort((a,b)=>b.n-a.n)[0];
            const cell=pick?pick.q:(base.path||[]).find(q=>!C.protectedCell(q));
            if(!cell)return;
            const el=$('dojoboard').querySelector(`[data-x="${cell.x}"][data-y="${cell.y}"]`);if(el)el.classList.add('dojo-flash');
            setTimeout(()=>{
                if(version!==runId||mode!=='break')return;
                state.walls=[{x:cell.x,y:cell.y}];runBreak(true);showStatus('demoWall');
                setTimeout(()=>{
                    if(version!==runId||mode!=='break')return;
                    state.walls=[];state.breakDemoSeen=true;persist();runBreak(true);showStatus('demoWall');
                },2600);
            },900);
        },2200);
    }
}
function predictMetrics(){const p=prediction;$('dojo-metrics').innerHTML=tag('predictCount',{correct:p.correct,total:p.total,step:Math.min(p.index+1,p.total)});}
function predictMode(){
    shell('predict');const r=C.search(combined());
    prediction={steps:r.steps.slice(1),total:Math.min(10,r.steps.length-1),index:0,correct:0,locked:false};
    $('dojo-extra').innerHTML=`<p class="dojo-note">${tag('predictGoal',{n:Math.ceil(.7*prediction.total)})}</p>`;
    mount(1,predictClick);predictFrame();
}
function predictFrame(){
    const p=prediction;
    if(p.index>=p.total){
        const passed=p.correct>=Math.ceil(.7*p.total);p.locked=true;
        if(passed){const first=award('predict',{correct:p.correct,total:p.total});result('predictPass',first);}
        else{$('dojo-result').innerHTML=`<div class="dojo-success">${tag('predictFail',{correct:p.correct,total:p.total})}<div class="dojo-actions">${button('retry','retry',true)}${button('menu','menu')}</div></div>`;}
        predictMetrics();return;
    }
    const first=C.search(combined()).steps[0];
    const previous=p.index?p.steps[p.index-1]:first;
    view.redraw(previous,[]);panel(previous);
    predictMetrics();
}
function predictClick(x,y){
    const p=prediction;if(mode!=='predict'||!p||p.locked)return;
    const next=p.steps[p.index],open=p.index?p.steps[p.index-1].open:C.search(combined()).steps[0].open;
    const chosen=open.find(q=>q.x===x&&q.y===y),correct=!!chosen&&chosen.f===next.f;
    p.locked=true;const version=runId;
    if(correct){p.correct++;showStatus('correct');const cell=$('dojoboard').querySelector(`[data-x="${x}"][data-y="${y}"]`);cell.classList.add('dojo-correct');}
    else{showStatus('wrong',{f:next.f});const cell=$('dojoboard').querySelector(`[data-x="${next.current.x}"][data-y="${next.current.y}"]`);cell.classList.add('dojo-flash');}
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
    if(r.path&&r.explored<=.7*base.explored&&r.length===base.length){const first=award('tune',{w,explored:r.explored,baseline_explored:base.explored});result('tunePass',first);}
    else $('dojo-result').innerHTML='';
}
function tuneMode(){
    shell('tune');
    $('dojo-extra').innerHTML=`<p class="dojo-help mono">f = g + w·h</p><label for="dojo-weight">${tag('weight')}: <strong id="dojo-weight-value">1</strong></label><input id="dojo-weight" class="dojo-range" type="range" min="0" max="3" step="0.5" value="1"><div class="dojo-weight-labels">${tag('dijkstra')}${tag('astar')}${tag('greedy')}</div><p id="dojo-baseline" class="dojo-help"></p><p class="dojo-note">${tag('tuneNote')}</p>`;
    $('dojo-bottom').innerHTML=`<details class="dojo-hint"><summary>${tag('hint')}</summary><p>${tag('weightHint')}</p></details>`;
    $('dojo-weight').addEventListener('input',e=>tuneRun(Number(e.target.value)));tuneRun(1);
}
function raceCompare(){
    if(mode==='race')$('dojo-race-compare').innerHTML=tag('astarSteps',{n:gameState.raceOptimal})+'<br>'+tag('playerSteps',{n:gameState.steps});
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
    $('game-screen').scrollIntoView({block:'start'});
}
function enter(m){
    if(!C.MODES.includes(m))return;
    if(!C.unlocked(state,m)){if($('dojo-notice'))$('dojo-notice').innerHTML=tag('lockHint');return;}
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
        area.insertAdjacentHTML('beforeend',`<div id="dojo-race-card"><small>L1 · ${esc(map.seed)}</small><strong>${tag(gameState.steps===gameState.raceOptimal?'raceTie':'raceBetter',{n:gameState.steps===gameState.raceOptimal?gameState.steps:gameState.raceOptimal-gameState.steps})}</strong><small>${tag('astarSteps',{n:gameState.raceOptimal})}</small></div><p class="dojo-note">${tag('saveCard')}</p><p class="dojo-help">${tag(first?'racePass':'againPass')}</p><div class="dojo-race-actions">${button('portico','portico',true)}${button('menu','menu')}</div>`);
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
    if(action==='retry')enter(mode);
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
