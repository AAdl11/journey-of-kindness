/* L1 dojo: deterministic maps and progress. All searches use the shared engine. */
(function(root,factory){
    if(typeof module==='object'&&module.exports) module.exports=factory(require('./astar-engine.js'));
    else root.L1DojoCore=factory(root.AStarEngine);
})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
    'use strict';
    const START={x:0,y:0}, GOAL={x:7,y:5}, GARCIA={x:5,y:3};
    const MODES=['break','predict','race','tune'], WEIGHTS=[0,.5,1,1.5,2,2.5,3];
    const key=p=>p.x+','+p.y, same=(a,b)=>key(a)===key(b), copy=p=>({x:p.x,y:p.y});
    const valid=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<8&&p.y<6;
    const protectedCell=p=>[START,GOAL,GARCIA].some(q=>same(p,q));
    const CELLS=Array.from({length:48},(_,i)=>({x:i%8,y:Math.floor(i/8)}));
    // Validated fixed reserve; replaced only together with its reproducible evidence.
    const FALLBACK=[{x:3,y:3},{x:4,y:0},{x:7,y:1},{x:5,y:5},{x:3,y:1},{x:4,y:5},{x:3,y:2},{x:5,y:4},{x:6,y:1},{x:1,y:2}];
    function grid(walls,w=1,start=START,goal=GOAL){return engine.createGrid({cols:8,rows:6,walls,start,goal,w});}
    function search(walls,w=1,start=START,goal=GOAL){
        const result=engine.astarSteps(grid(walls,w,start,goal));
        const steps=Array.isArray(result)?result:result.steps;
        const path=Array.isArray(result)?steps[steps.length-1].path:null;
        return {steps,path,length:path?path.length-1:null,explored:steps.length};
    }
    function race(walls){
        const a=search(walls,1,START,GARCIA), b=search(walls,1,GARCIA,GOAL);
        return a.path&&b.path?{length:a.length+b.length,path:a.path.concat(b.path.slice(1))}:null;
    }
    function tune(walls){
        const baseline=search(walls);
        if(!baseline.path)return {baseline,solutions:[]};
        const solutions=WEIGHTS.filter(w=>w!==1).map(w=>({w,...search(walls,w)}))
            .filter(r=>r.path&&r.length===baseline.length&&r.explored<=.7*baseline.explored);
        return {baseline,solutions};
    }
    // Complete bounded search: any successful wall set must hit the current shortest
    // path. Branch only on that path; recursion covers every set of <=3 additions.
    function breakSolution(walls){
        const base=search(walls); if(!base.path)return null;
        const seen=new Set();
        function visit(added,current){
            const signature=added.map(key).sort().join(';');
            if(seen.has(signature))return null;seen.add(signature);
            if(current.length>=base.length+6&&race(walls.concat(added)))return added.map(copy);
            if(added.length===3)return null;
            for(const p of current.path){
                if(protectedCell(p))continue;
                const next=added.concat([p]), result=search(walls.concat(next));
                if(!result.path)continue;
                const answer=visit(next,result);if(answer)return answer;
            }
            return null;
        }
        return visit([],base);
    }
    function validate(walls){
        const viaGarcia=race(walls), tuning=tune(walls);
        const breaking=viaGarcia&&tuning.solutions.length?breakSolution(walls):null;
        return {ok:!!(viaGarcia&&tuning.solutions.length&&breaking),viaGarcia:viaGarcia?.length??null,
            baseline:{explored:tuning.baseline.explored,length:tuning.baseline.length},
            tune:tuning.solutions.map(({w,explored,length})=>({w,explored,length})),breakWalls:breaking};
    }
    function randomFor(seed){
        let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;
        return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
    }
    function candidate(seed,attempt){
        const random=randomFor(seed+':'+attempt), cells=CELLS.filter(p=>!protectedCell(p)).map(copy);
        for(let i=cells.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
        const count=8+Math.floor(random()*4);
        if(attempt%3===0)return cells.slice(0,count);
        // Seeded variants of the validated reserve improve the acceptance rate
        // without relaxing any gate. General random layouts are still sampled.
        const reserve=FALLBACK.map(copy);
        for(let i=reserve.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[reserve[i],reserve[j]]=[reserve[j],reserve[i]];}
        const chosen=reserve.slice(0,Math.min(count,7+Math.floor(random()*3)));
        for(const p of cells){if(chosen.length===count)break;if(!chosen.some(q=>same(p,q)))chosen.push(p);}
        return chosen;
    }
    function generate(seed,maxAttempts=50){
        for(let attempt=0;attempt<maxAttempts;attempt++){
            const walls=candidate(seed,attempt), proof=validate(walls);
            if(proof.ok)return {seed,walls,attempts:attempt+1,fallback:false,proof};
        }
        const walls=FALLBACK.map(copy), proof=validate(walls);
        if(!proof.ok)throw new Error('Invalid fixed fallback');
        return {seed,walls,attempts:maxAttempts,fallback:true,proof};
    }
    function dateSeed(date=new Date()){
        return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
    }
    function normalize(raw){
        raw=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
        const passed=Object.fromEntries(MODES.map(m=>[m,raw.passed?.[m]===true]));
        // Completion flags are authoritative, so corrupt coin counts cannot unlock modes.
        return {...raw,coins:MODES.filter(m=>passed[m]).length,passed,master:passed.tune&&raw.master===true,
            seenDemo:raw.seenDemo===true,walls:(Array.isArray(raw.walls)?raw.walls:[]).filter(valid).slice(0,3).map(copy),
            wallsSeed:typeof raw.wallsSeed==='string'?raw.wallsSeed:'',
            bestRace:raw.bestRace&&Number.isInteger(raw.bestRace.player)&&raw.bestRace.player>=0&&Number.isInteger(raw.bestRace.astar)&&raw.bestRace.astar>=0?{player:raw.bestRace.player,astar:raw.bestRace.astar}:null};
    }
    function load(storage){try{return normalize(JSON.parse(storage.getItem('jok_progress')||'{}').levels?.['1']);}catch(_){return normalize(null);}}
    function save(storage,state){
        try{
            const raw=JSON.parse(storage.getItem('jok_progress')||'{}');
            if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
            if(!raw.levels||typeof raw.levels!=='object'||Array.isArray(raw.levels))raw.levels={};
            const previous=raw.levels['1'];
            raw.levels['1']={...(previous&&typeof previous==='object'?previous:{}),...state};
            storage.setItem('jok_progress',JSON.stringify(raw));return true;
        }catch(_){return false;}
    }
    function award(state,mode){
        if(!MODES.includes(mode)||state.passed[mode])return false;
        state.passed[mode]=true;state.coins=MODES.filter(m=>state.passed[m]).length;
        if(mode==='tune')state.master=true;
        return true;
    }
    function unlocked(state,mode){return MODES.includes(mode)&&state.coins>=MODES.indexOf(mode);}
    function repair(base,walls,requireTune=false){
        const accepted=[], occupied=new Set(base.map(key));let moved=0,removed=0;
        for(const original of walls.filter(valid).slice(0,3)){
            let p=copy(original);
            if(protectedCell(p)||occupied.has(key(p))){
                p=CELLS.filter(q=>!protectedCell(q)&&!occupied.has(key(q)))
                    .sort((a,b)=>engine.manhattan(a,original)-engine.manhattan(b,original)||a.y-b.y||a.x-b.x)[0];
                if(!p){removed++;continue;}moved++;
            }
            const combined=base.concat(accepted,[p]);
            if(!race(combined)||(requireTune&&!tune(combined).solutions.length)){removed++;continue;}
            accepted.push(copy(p));occupied.add(key(p));
        }
        return {walls:accepted,moved,removed};
    }
    return {START,GOAL,GARCIA,MODES,WEIGHTS,FALLBACK,key,same,protectedCell,grid,search,race,tune,breakSolution,validate,candidate,generate,dateSeed,normalize,load,save,award,unlocked,repair};
});
