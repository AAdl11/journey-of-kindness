/* Run: node tests/l1-dojo-core.test.cjs. No runtime dependencies. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../assets/js/l1-dojo-core.js'),E=require('../assets/js/astar-engine.js');
const results=[];
function test(name,fn){fn();results.push({name,status:'PASS'});}
function bfs(walls,start=C.START,goal=C.GOAL){
 const blocked=new Set(walls.map(C.key)),seen=new Set([C.key(start)]),queue=[{...start,d:0}];
 for(let i=0;i<queue.length;i++){const p=queue[i];if(C.same(p,goal))return p.d;
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,y:p.y+dy,d:p.d+1},k=C.key(q);if(q.x<0||q.x>7||q.y<0||q.y>5||blocked.has(k)||seen.has(k))continue;seen.add(k);queue.push(q);}
 }return null;
}
test('w=0 explores most; w=1 shortest; tuning witness preserves shortest length',()=>{
 const walls=C.FALLBACK,a=C.search(walls,0),b=C.search(walls,1),c=C.search(walls,3);
 assert(a.explored>b.explored&&a.explored>c.explored);assert.equal(b.length,bfs(walls));
 assert(c.explored<=.7*b.explored);assert.equal(c.length,b.length);
 const input=C.grid(walls),before=JSON.stringify(input);E.astarSteps(input);assert.equal(JSON.stringify(input),before);
 assert.deepEqual(E.astarSteps({...input,w:1}),E.astarSteps(input));
 for(const w of [-1,Infinity,NaN,'1'])assert.throws(()=>C.grid(walls,w));
});
let suboptimal=null;
test('w=3 can return a longer route, checked against independent BFS',()=>{
 for(let i=0;i<20000;i++){const walls=C.candidate('weighted-counterexample',i),a=C.search(walls),b=C.search(walls,3);if(a.path&&b.path&&b.length>a.length){suboptimal={walls,optimal:a.length,weighted:b.length,w0:C.search(walls,0).explored,w1:a.explored,w3:b.explored};break;}}
 assert(suboptimal);assert.equal(bfs(suboptimal.walls),suboptimal.optimal);
});
const fallbackProof=C.validate(C.FALLBACK);
test('fixed fallback satisfies all three gates with executable witnesses',()=>{
 assert(fallbackProof.ok);assert(C.FALLBACK.length>=8&&C.FALLBACK.length<=11);
 const wallSet=C.FALLBACK.concat(fallbackProof.breakWalls);
 assert(C.search(wallSet).length-C.search(C.FALLBACK).length>=6);assert(C.race(wallSet));
 for(const r of fallbackProof.tune)assert.equal(r.length,bfs(C.FALLBACK));
 assert.equal(C.generate('2026-01-01',0).fallback,true);
});
const dates=[];
test('100 consecutive date seeds: deterministic, <=50 attempts, three gates or validated fallback',()=>{
 for(let i=0;i<100;i++){
  const seed=C.dateSeed(new Date(2026,0,1+i)),map=C.generate(seed),again=C.generate(seed);
  assert.deepEqual(map,again);assert(map.attempts<=50);assert(map.walls.length>=8&&map.walls.length<=11);
  assert(map.walls.every(p=>!C.protectedCell(p)));assert.equal(new Set(map.walls.map(C.key)).size,map.walls.length);
  assert(map.proof.ok);assert.equal(C.search(map.walls).length,bfs(map.walls));
  const extra=C.search(map.walls.concat(map.proof.breakWalls)).length-map.proof.baseline.length;
  assert(extra>=6);assert(map.proof.breakWalls.length<=3);
  dates.push({seed,attempts:map.attempts,fallback:map.fallback,walls:map.walls,proof:map.proof,breakExtra:extra});
 }
});
test('coins, locks, no duplicate awards, master only after tune',()=>{
 const s=C.normalize(null);assert.deepEqual(C.MODES.map(m=>C.unlocked(s,m)),[true,false,false,false]);
 for(let i=0;i<4;i++){const m=C.MODES[i];assert(C.unlocked(s,m));assert(C.award(s,m));assert.equal(s.coins,i+1);assert.equal(C.award(s,m),false);assert.equal(s.coins,i+1);assert.equal(s.master,m==='tune');}
 assert.equal(C.normalize({coins:4,master:true}).coins,0);assert.equal(C.normalize({master:true}).master,false);
});
test('merge progress preserves unrelated levels and fields; blocked/malformed storage is safe',()=>{
 let raw=JSON.stringify({other:{x:7},levels:{'1':{legacy:42},'8':{stars:3}}});const storage={getItem:()=>raw,setItem:(_,v)=>{raw=v;}};
 const s=C.load(storage);C.award(s,'break');assert(C.save(storage,s));const parsed=JSON.parse(raw);
 assert.equal(parsed.levels['1'].legacy,42);assert.equal(parsed.levels['8'].stars,3);assert.deepEqual(parsed.other,{x:7});
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};assert.equal(C.load(denied).coins,0);assert.equal(C.save(denied,s),false);
 assert.equal(C.load({getItem:()=>'{'}).coins,0);assert.equal(C.save({getItem:()=>'{',setItem(){}},s),false);
});
test('wall repair: nearest-cell relocation, blocked route removal, tuning checked only when requested',()=>{
 const moved=C.repair(C.FALLBACK,[C.FALLBACK[0]],false);assert.equal(moved.moved,1);assert(!moved.walls.some(p=>C.FALLBACK.some(q=>C.same(p,q))));
 const blocked=C.repair(C.FALLBACK,[{x:1,y:0},{x:0,y:1}],false);assert(blocked.removed>0);assert(C.race(C.FALLBACK.concat(blocked.walls)));
 const breaking=C.FALLBACK.concat(fallbackProof.breakWalls);assert(C.race(breaking));
 const ordinary=C.repair(C.FALLBACK,fallbackProof.breakWalls,false);assert.deepEqual(ordinary.walls,fallbackProof.breakWalls);
 const repaired=C.repair(C.FALLBACK,fallbackProof.breakWalls,true);assert(C.tune(C.FALLBACK.concat(repaired.walls)).solutions.length);
});
test('every new UI string has complete English, Traditional Chinese and Spanish entries',()=>{
 const source=fs.readFileSync('assets/js/l1-dojo.js','utf8');
 const literal=source.slice(source.indexOf('const TEXT=')+11,source.indexOf('\n};\nconst esc')+2);
 const values=require('node:vm').runInNewContext('('+literal+')');
 for(const [key,value]of Object.entries(values))assert(Array.isArray(value)&&value.length===3&&value.every(v=>typeof v==='string'&&v.length),'Incomplete translation: '+key);
});
const report={baseCommit:'6f2fa87',results,summary:{passed:results.length,total:results.length,dateSeeds:dates.length,fallbackCount:dates.filter(d=>d.fallback).length,uniqueMaps:new Set(dates.map(d=>d.walls.map(C.key).sort().join(';'))).size},fallback:{walls:C.FALLBACK,proof:fallbackProof},weightedCounterexample:suboptimal,dates};
fs.writeFileSync('docs/JOK_SPEC_03/core-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
