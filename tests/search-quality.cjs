'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs');
const L=require('../src/optimizer-legacy.cjs'),U=require('../src/purchase-lookahead.cjs');
const {Checkpoints}=require('../src/search-checkpoints.cjs'),blank=require('../src/blank-farm.cjs');

// Synthetic, deliberately small decision problem: one prerequisite and one
// upgrade fit before the research deadline. Enumerate ALL legal purchase
// orders within that horizon independently of the lookahead implementation.
function unlockFixture(){
 const raw=blank(1791993600);
 Object.assign(raw.farm,{cash:1e15,soulEggs:1e30,proPermit:true,earningsMode:'online',
  habs:Array(4).fill(18),vehicles:Array.from({length:17},(_,i)=>({id:i<4?11:null,cars:1})),
  research:{comfy_nests:50,nutritional_sup:29}});
 Object.assign(raw.plan,{strategy:'user',autoSequence:false,sequence:'C R C',target:1,actionSeconds:.3});
 return raw;
}
function exhaustive(initial,c,maxPurchases){
 let best=L.finishHere(initial,c),examined=0;
 function explore(s,depth){
  const end=L.finishHere(s,c);if(R.better(end,best))best=end;
  if(depth===maxPurchases)return;
  for(let i=0;i<S.D.research.length;i++){
   const a={type:'research',i};if(!S.allowed(s,c,a))continue;
   const ready=S.afford(s,c,a);if(!ready||ready.t+c.actionsSeconds>c.end)continue;
   try{const n=S.buy(ready,c,a);examined++;explore(n,depth+1);}catch{}
  }
 }
 explore(initial,0);return {best,examined};
}
function quality(){
 const raw=unlockFixture(),{s,c}=R.prepare(raw,R.routes(raw)[0],3);
 c.researchDeadline=s.t+2*c.actionsSeconds+1e-6;
 const exact=exhaustive(s,c,2),lookahead=U.chains(s,c),candidates=[s,...lookahead.candidates.map(x=>x.state)];
 const found=candidates.map(n=>L.finishHere(n,c)).filter(Boolean).sort((a,b)=>a.t-b.t||a.stage-b.stage)[0];
 assert.ok(lookahead.candidates.length>0);assert.equal(found.t,exact.best.t,'lookahead matches exhaustive optimal completion in this two-purchase problem');
 let greedyBest=null;
 for(const policy of ['balanced','income','fleet','cheap']){
  let n=s;
  for(let step=0;step<2;step++){const a=R.scored(n,c,policy)[0]?.a;if(!a)break;const ready=S.afford(n,c,a);if(!ready)break;try{n=S.buy(ready,c,a);}catch{break;}}
  const end=L.finishHere(n,c);if(R.better(end,greedyBest))greedyBest=end;
 }
 assert.ok(found.t<greedyBest.t-1e-3,'a full unlock chain beats each immediate-purchase policy in the controlled horizon');
 const actions=S.history(found).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:R.routes(raw)[0],researchSales:3}});
 assert.equal(R.replay(raw,actions).s.t,found.t,'winning unlock chain is entirely paid and replayable');
 assert.ok(actions.some(a=>a.type==='research'&&a.i===S.RMAP.leafsprings));
 assert.equal(U.chains({...s,stage:c.finalCStage},c).candidates.length,0,'last Curiosity is delivery only');
 assert.equal(U.chains(s,{...c,researchDeadline:s.t}).candidates.length,0,'expired research window is respected');
 assert.equal(U.chains(s,{...c,researchDeadline:s.t+c.actionsSeconds+.01}).candidates.length,0,'do not truncate a purchase interaction to unlock a tier');
 assert.equal(U.chains({...s,cash:0}, {...c,end:s.t+.01}).candidates.length,0,'no free prerequisite purchases');
 assert.throws(()=>U.chains(s,c,{checkpoint:()=>{throw Error('Cancelled');}}),/Cancelled/);
 const deeper=[];
 for(const missing of [2,3]){
  const farm=unlockFixture();farm.farm.research.nutritional_sup=30-missing;
  const p=R.prepare(farm,R.routes(farm)[0],3);p.c.researchDeadline=p.s.t+(missing+1)*p.c.actionsSeconds+1e-6;
  const all=exhaustive(p.s,p.c,missing+1),searched=U.chains(p.s,p.c);
  const best=[p.s,...searched.candidates.map(x=>x.state)].map(n=>L.finishHere(n,p.c)).filter(Boolean).sort((a,b)=>a.t-b.t)[0];
  assert.equal(best.t,all.best.t,'lookahead matches exhaustive completion with '+missing+' prerequisites');
  deeper.push({prerequisites:missing,enumeratedPurchases:all.examined,lookaheadNodes:searched.nodes,gapSeconds:best.t-all.best.t});
 }
 return {enumeratedPurchases:exact.examined,lookaheadNodes:lookahead.nodes,optimalSeconds:found.t-c.start,greedySeconds:greedyBest.t-c.start,deeper};
}
function reuse(){
 const raw=unlockFixture(),{s,c}=R.prepare(raw,R.routes(raw)[0],3),cache=new Checkpoints();
 const a={type:'research',i:S.RMAP.excitable_chickens};let calls=0;
 const run=(state=s,context=c)=>cache.run(state,context,'one purchase',()=>{calls++;return S.buy(state,context,a);});
 const first=run(),again=run();assert.equal(calls,1);assert.deepEqual(again,first);
 again.r[a.i]=999;again.path.action.cost=-1;assert.deepEqual(run(),first,'cached states and actions cannot be mutated by a caller');
 const differentPath=S.record(s,{type:'wait',t:s.t,end:s.t,egg:s.egg,earningsMode:'online',reason:'Different paid prefix'});
 const rebased=run(differentPath);assert.equal(calls,1);let base=rebased.path;while(base&&base!==differentPath.path)base=base.prev;
 assert.equal(base,differentPath.path,'reuse preserves this caller’s prefix, not the first caller’s timeline');
 for(const change of [n=>n.t++,n=>n.cash++,n=>n.soul*=.99,n=>n.eggs[0]++,n=>n.fuel[0]++,n=>n.r[0]--,n=>n.h[0]--,
  n=>n.v[0].cars++,n=>n.silos++,n=>n.shipFlights.push({slot:1,returnAt:n.t+60}),n=>n.shipRuns++]){
  const changed=S.clone(s);change(changed);assert.notEqual(cache.key(changed,c,'one purchase'),cache.key(s,c,'one purchase'));
 }
 for(const change of [x=>x.researchDeadline--,x=>x.actionsSeconds++,x=>x.shiftSeconds++,x=>x.offlineMinSeconds++,x=>x.target++,
  x=>x.floors[0]++,x=>x.sequence[1]=4,x=>x.epic.cheaper_research++,x=>x.col.researchCost*=2,x=>x.earningsScale*=2]){
  const changed=structuredClone(c);change(changed);assert.ok(cache.key(s,changed,'one purchase')!==cache.key(s,c,'one purchase'),'changed constraints cannot reuse a continuation');
 }
 const changedRoute={...c,sequence:[0,4,1,0,2,0],finalCStage:5};
 assert.equal(cache.key(s,c,'local',true),cache.key(s,changedRoute,'local',true),'identical local purchases can share different later routes');
 assert.notEqual(cache.key(s,c,'continuation'),cache.key(s,changedRoute,'continuation'),'continuations cannot ignore later routes');
 const breaks=S.record(s,{type:'wait',t:s.t-60,end:s.t,earningsMode:'offline'});
 assert.notEqual(cache.key(s,c,'one purchase'),cache.key(breaks,c,'one purchase'),'break-count tie breaker is preserved');
 const failed=new Checkpoints();assert.throws(()=>failed.run(s,c,'fail',()=>{throw Error('failed');}),/failed/);assert.equal(failed.summary().entries,0);
 let checks=0;assert.throws(()=>failed.run(s,c,'cancel',()=>S.buy(s,c,a),()=>{if(++checks===2)throw Error('Cancelled');}),/Cancelled/);assert.equal(failed.summary().entries,0);
 checks=0;const late=failed.run(s,c,'late complete',()=>S.buy(s,c,a),()=>{if(++checks===2)throw Error('Deadline');},false,true);
 assert.equal(late.r[a.i],s.r[a.i]+1);assert.equal(failed.summary().entries,0,'a complete result returned after a time slice is kept but never cached');
 const one=R.recipe(s,c,'C1',60,new Checkpoints());const prefixes=R.researchPrefixes(s,c,S.history(one));
 assert.ok(prefixes.every(n=>!n.path||n.path.action.type==='wait'),'branch only after full purchase interactions');
 const small=new Checkpoints({maxEntries:1,maxActions:2});small.run(s,c,1,()=>S.buy(s,c,a));small.run(s,c,2,()=>S.buy(s,c,a));assert.equal(small.summary().entries,1);assert.ok(small.summary().actions<=2);assert.equal(small.summary().evictions,1);
 const independent=new Checkpoints();assert.equal(independent.summary().entries,0);
 // Full paid continuation reuse must be byte-for-byte equivalent as well.
 const completeRaw=require('./research-sale-plans.cjs').fixture(),route=R.routes(completeRaw)[0],prepared=R.prepare(completeRaw,route,3);
 const direct=R.seedRoute(prepared.s,prepared.c,60),memo=new Checkpoints(),before=performance.now();
 const uncached=R.seedRoute(prepared.s,prepared.c,60,()=>{},memo),firstMs=performance.now()-before,secondStart=performance.now();
 const cached=R.seedRoute(prepared.s,prepared.c,60,()=>{},memo),reusedMs=performance.now()-secondStart;
 assert.ok(direct&&uncached&&cached);assert.deepEqual(S.history(cached),S.history(direct));assert.deepEqual(S.history(uncached),S.history(direct));assert.equal(cached.t,direct.t);
 const marked=S.history(cached).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});assert.equal(R.replay(completeRaw,marked).s.t,cached.t);
 return {firstMs,reusedMs,...memo.summary()};
}
function run(){const result={quality:quality(),checkpoints:reuse()};console.log('PASS search quality: exhaustive small-case optimum, paid unlock chains, deadlines, final C, cancellation, exact checkpoint keys, immutable rebasing, bounded memory, and complete continuation replay.');return result;}
module.exports={unlockFixture,exhaustive,quality,reuse,run};
if(require.main===module)console.log(JSON.stringify(run()));
