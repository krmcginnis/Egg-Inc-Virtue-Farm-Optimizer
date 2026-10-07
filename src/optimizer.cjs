'use strict';
const formatNumber=require('./number-format.cjs').format;
const S=require('./simulator.cjs'),F=require('./feasibility.cjs'),T=require('./staged-route.cjs'),B=require('./offline-batch.cjs'),U=require('./shift-summary.cjs');const {D,stats,clone,teByEgg,totalTE,reached,advance,buy,afford,allowed,price,at,history}=S;
const W=require('./waiting-objective.cjs');
const E=require('./opening-search.cjs'),Ships=require('./ships.cjs'),SalePlans=require('./research-sale-plans.cjs');
function remainingEggs(s,c){return c.autoSequence&&s.stage<c.maxSwitches?[0,1,2,3,4]:c.autoSequence?[s.egg]:c.sequence.slice(s.stage);}
function finishHere(s,c){if(c.ships?.enabled&&!s.shipsDone){if(s.egg!==2)return null;try{s=Ships.launch(s,c);}catch{return null;}if(!s.shipsDone)return null;}const te=teByEgg(s,c);if(c.floors.some((n,i)=>i!==s.egg&&n>te[i]))return null;const needed=Math.max(c.floors[s.egg],c.target-te.reduce((sum,n,i)=>sum+(i===s.egg?0:n),0));if(needed>98)return null;if(needed<=te[s.egg])return reached(s,c)?s:null;const r=stats(s,c);if(r.delivery<=0)return null;const t=s.t+Math.max(0,D.te[needed-1]-s.eggs[s.egg])/r.delivery+0.001;if(t>S.visitDeadline(s,c))return null;return advance(s,c,t,'Deliver enough eggs to reach the Truth Egg target');}
// A feasible completion using the current rate and the remaining sequence, without upgrades.
// Allocate optional TE to the cheapest marginal threshold, then visit the required Virtues.
function completionGoals(s,c){
 const shipDelivery=Ships.anticipatedDelivery(s,c);if(shipDelivery){s=clone(s);s.eggs[2]+=shipDelivery;}
 if(c.ships?.mode==='efficient-two-visits'&&s.shipRuns===1&&!s.shipsDone){const r=stats(s,c),hen=c.ships.missions[0],corv=c.ships.corvette,maxCorvs=2*Math.floor(hen.seconds/corv.seconds),diversion=(7*hen.fuel[2]+maxCorvs*corv.fuel[2])/r.laying,delivery=Math.max(0,2*hen.seconds-diversion)*r.delivery;if(Number.isFinite(delivery)){s=clone(s);s.eggs[2]+=delivery;}}
 const te=teByEgg(s,c),minimum=c.floors.map((n,i)=>Math.max(0,n-te[i]));const needed=Math.max(0,c.target-totalTE(s,c),minimum.reduce((a,b)=>a+b,0)),available=new Set(remainingEggs(s,c));
 const visitLimit=c.autoSequence?Math.min(4,c.maxSwitches-s.stage):4;
 let dp=new Map([['0:0',{cost:0,goals:[]}]]);
 for(let egg=0;egg<5;egg++){const next=new Map();for(const [key,value]of dp){const [total,visits]=key.split(':').map(Number);const max=available.has(egg)?Math.min(98-te[egg],needed-total):0;for(let k=minimum[egg];k<=max;k++){const count=visits+(k>0&&egg!==s.egg?1:0);if(count>visitLimit)continue;const cost=value.cost+(k?Math.max(0,D.te[te[egg]+k-1]-s.eggs[egg]):0),id=(total+k)+':'+count,old=next.get(id);if(!old||cost<old.cost)next.set(id,{cost,goals:value.goals.concat(te[egg]+k)});}}dp=next;}
 let best=null,leastVisits=Infinity;for(const [key,value]of dp){const [total,visits]=key.split(':').map(Number);if(total===needed&&(!best||value.cost<best.cost||value.cost===best.cost&&visits<leastVisits)){best=value;leastVisits=visits;}}return best?.goals||null;
}
function tailPlain(s,c){
 if(c.ships?.enabled&&!s.shipsDone&&s.egg===2&&Ships.ready(s,c)){try{s=Ships.launch(s,c);}catch{return null;}}
 if(reached(s,c))return s;const rate=stats(s,c).delivery;if(rate<=0)return null;const te=teByEgg(s,c),goal=completionGoals(s,c);if(!goal)return null;
 let route=c.autoSequence?[s.egg,...remainingEggs(s,c).filter(e=>e!==s.egg&&goal[e]>te[e])]:c.sequence.slice(s.stage);
 if(c.autoSequence&&c.ships?.enabled&&!s.shipsDone){
  const stock=s.fuel.slice(),cycles=[];
  for(let visit=s.shipRuns||0;visit<c.ships.visits;visit++){
   const run=c.ships.runs?.[visit]||c.ships;
   for(const egg of [0,1,3,4]){
    const laterLegacyVisit=c.ships.mode!=='custom-two-visits'&&visit>(s.shipRuns||0);
    if((laterLegacyVisit?run.targets[egg]>0:stock[egg]+Math.max(1,run.targets[egg])*1e-12<run.targets[egg])&&(visit!==(s.shipRuns||0)||egg!==s.egg))cycles.push(egg);
    stock[egg]=Math.max(stock[egg],run.targets[egg])-run.fuel[egg];
   }
   cycles.push(2);
  }
  route=[s.egg,...cycles,...route.filter(e=>e!==s.egg&&e!==2)];route=route.flatMap((e,i)=>i&&e===route[i-1]?(e===2?[0,2]:[]):[e]);
 }

 let n=s;for(let ri=0;ri<route.length;ri++){const e=route[ri];if(n.egg!==e){try{n=buy(n,c,{type:'shift',egg:e});}catch{return null;}}
  const required=e===2&&!n.shipsDone?0:goal[e]===te[e]?0:Math.max(0,D.te[goal[e]-1]-n.eggs[e]);const dt=required/rate;
  if(dt>0){if(n.t+dt+.001>S.visitDeadline(n,c)){if(n.openingFirst&&route.slice(ri+1).includes(e))continue;return null;}n=advance(n,c,n.t+dt+.001,'Collect '+S.NAME[e]+' Truth Egg milestones');}if(reached(n,c))return n;
 }return null;
}
function tail(s,c){
 let best=tailPlain(s,c);if(!c.autoSequence&&s.egg!==2)return best;
 for(const set of S.artifactChoices(s,c)){if(set===s.set)continue;let n=s;try{if(n.egg!==2)n=buy(n,c,{type:'shift',egg:2});n=buy(n,c,S.artifactAction(set,c));if(stats(n,c).delivery<=stats(s,c).delivery)continue;const end=tailPlain(n,c);if(W.better(end,best))best=end;}catch{}}
 return best;
}

function candidates(s,c){const out=[];
 if(s.egg===0){for(let i=0;i<D.research.length;i++)if(allowed(s,c,{type:'research',i}))out.push({type:'research',i});}
 if(s.egg===1){const seen=new Set();for(let slot=0;slot<4;slot++){const id=s.h[slot];if(seen.has(id))continue;seen.add(id);for(let next=(id===null?0:id+1);next<19;next++)out.push({type:'hab',slot,id:next});}}
 if(s.egg===4){const seen=new Set();const r=stats(s,c);for(let slot=0;slot<r.slots;slot++){const v=s.v[slot];const key=v.id+':'+v.cars;if(seen.has(key))continue;seen.add(key);for(let id=v.id===null?0:v.id+1;id<12;id++)out.push({type:'vehicle',slot,id});if(v.id===11&&v.cars<r.trainLength)out.push({type:'car',slot});}}
 if(s.egg===3&&allowed(s,c,{type:'silo'}))out.push({type:'silo'});
 if(s.egg===2)for(const set of S.artifactChoices(s,c))if(set!==s.set)out.push(S.artifactAction(set,c));return out;}
function rateGain(s,c,a){const before=stats(s,c);let n;try{n=S.mutate(s,c,a);}catch{return 0;}const after=stats(n,c);const deliver=before.delivery>0?after.delivery/before.delivery-1:after.delivery>0?1e6:0;
 const earn=before.earning>0?after.earning/before.earning-1:after.earning>0?1e6:0;let future=Math.max(after.laying/Math.max(1,before.laying)-1,after.shipping/Math.max(1,before.shipping)-1);
 // A one-car Hyperloop initially matches a Quantum Transporter. Its engine is
 // useful because it unlocks separately purchased cars, not an immediate gain.
 if(a.type==='vehicle'&&a.id===11&&after.trainLength>1){const expanded=clone(n);expanded.v[a.slot].cars=2;const potential=stats(expanded,c);future=Math.max(future,potential.shipping/Math.max(1,before.shipping)-1);}
 // Graviton Coupling opens another car on every train. Value the capacity
 // unlocked for later purchases even when the research itself adds no eggs/sec.
 // This is a score only: each actual car still has to be bought and replayed.
 if(a.type==='research'&&D.research[a.i].id==='micro_coupling'){
  const expanded=clone(n);for(const v of expanded.v)if(v.id===11)v.cars=after.trainLength;
  future=Math.max(future,stats(expanded,c).shipping/Math.max(1,before.shipping)-1);
 }
 const research=a.type==='set'&&S.researchNeeded(s)?(after.earning/Math.max(1e-300,before.earning))*(before.researchMult/after.researchMult)-1:0;
 return {deliver,earn,research,future,after};}
function key(s){return s.stage+'|'+s.egg+'|'+s.openingMask+'|'+s.openingFirst+'|'+s.set+'|'+s.r.join(',')+'|'+s.h.join(',')+'|'+s.v.map(v=>v.id+':'+v.cars).join(',')+'|'+s.silos+'|'+s.shipsDone+'|'+s.shipRuns+'|'+s.shipRunStage+'|'+JSON.stringify(s.shipFlights||[])+'|'+(s.fuel||[]).join(',');}
function dominates(a,b,c){const scale=1e-10;return S.visitDeadline(a,c)>=S.visitDeadline(b,c)-1e-6&&W.offlineBreaks(a)<=W.offlineBreaks(b)&&a.t<=b.t+1e-6&&a.cash>=b.cash-Math.max(1,b.cash)*scale&&a.soul>=b.soul-Math.max(1,b.soul)*scale&&a.eggs.every((x,i)=>x>=b.eggs[i]-Math.max(1,b.eggs[i])*scale)&&(a.fuel||[]).every((x,i)=>x>=(b.fuel?.[i]||0)-Math.max(1,b.fuel?.[i]||0)*scale);}
function rank(s,c){const te=teByEgg(s,c),r=stats(s,c);let missing=Math.max(0,c.target-te.reduce((a,b)=>a+b,0));let estimates=[];const available=new Set(remainingEggs(s,c));
 for(const e of available){for(let n=te[e]+1;n<=98;n++){const base=n===te[e]+1?s.eggs[e]:D.te[n-2];estimates.push(Math.max(0,D.te[n-1]-base)/Math.max(1e-300,r.delivery));}}
 estimates.sort((a,b)=>a-b);const deliveryTime=estimates.slice(0,missing).reduce((a,b)=>a+b,0);
 // Earnings has secondary value: reduces wait for future production purchases.
 const productionPotential=Math.max(r.laying,r.shipping)/Math.max(1,r.delivery);
 return s.t-c.start+deliveryTime/(1+Math.min(.2,Math.log1p(productionPotential-1)*.1));}
function replay(raw,actions,record=false,options={}){const {s:initial,c}=S.prepare(raw,{...options,artifactReplay:true,artifactSets:S.recordedArtifactSets(actions),oneStartingSilo:options.oneStartingSilo??actions.some(a=>a.initialSiloRule==='one')});if(c.enforceOpeningCaps){c.c1MaxMinutes=E.maximum(c.c1MaxMinutes);c.k1MaxMinutes=E.maximum(c.k1MaxMinutes);}let s=initial;for(const a of actions){if(a.type==='wait'){if(Math.abs(a.t-s.t)>0.01)throw Error('Timeline wait has inconsistent start time.');s=advance(s,c,a.end,a.reason,record,a.earningsMode||'auto');}else{if(Math.abs(a.t-s.t)>0.01)throw Error('Timeline purchase has inconsistent time.');try{s=buy(s,{...c,shiftSeconds:0,actionsSeconds:a.type==='ship-run'?c.actionsSeconds:0,shipReplay:true},a,record);}catch(e){throw Error(e.message+' at '+JSON.stringify({type:a.type,i:a.i,t:a.t,cash:s.cash,cost:price(s,c,a),recordedCost:a.cost,stage:s.stage}));}if(a.type==='ship-run'&&Math.abs(s.t-a.end)>0.01)throw Error('Ship launch run has inconsistent end time.');}if(record&&a.initialSiloRule&&s.path)s={...s,path:{prev:s.path.prev,action:{...s.path.action,initialSiloRule:a.initialSiloRule}}};}if(!reached(s,c))throw Error('Replayed plan did not reach the requested target.');return {s,c};}
function simplify(raw,actions,options={}){
 let kept=actions.slice();
 // Remove a purchase only when the remaining timeline can still be fully replayed
 // with real costs, permissions and the same goal. This also removes filler that
 // did not unlock any subsequently purchased research.
 let removalChecks=0;const removalLimit=kept.length>250?24:Infinity;
 for(let i=kept.length-1;i>=0;i--){if(['wait','shift','fuel','fuel-dump','ship-run','ship-visit'].includes(kept[i].type))continue;if(removalChecks++>=removalLimit)break;
  const trial=kept.slice(0,i).concat(kept.slice(i+1));try{replay(raw,trial,false,options);kept=trial;}catch{}}
 const combined=[];for(const a of kept){const last=combined.at(-1);if(a.type==='wait'&&last?.type==='wait'&&a.egg===last.egg&&a.earningsMode===last.earningsMode&&Math.abs(a.t-last.end)<.01){last.end=a.end;last.reason=a.reason;}else combined.push({...a});}
 const {s:initial,c}=S.prepare(raw,{...options,artifactSets:S.recordedArtifactSets(combined)});if(c.enforceOpeningCaps){c.c1MaxMinutes=E.maximum(c.c1MaxMinutes);c.k1MaxMinutes=E.maximum(c.k1MaxMinutes);}let n=initial;
 for(let i=0;i<combined.length;i++){const a=combined[i];if(a.type==='wait'){const next=combined[i+1];const reason=next?.type==='shift'?'Deliver Truth Egg progress before switching':next?'Accumulate cash and deliver eggs for the next purchase':'Deliver enough eggs to reach the Truth Egg target';n=advance(n,c,a.end,reason,true,a.earningsMode||'auto');}else n=buy(n,{...c,shiftSeconds:0,actionsSeconds:a.type==='ship-run'?c.actionsSeconds:0,shipReplay:true},a,true);}
 return {s:n,c,actions:history(n)};
}
// Seed feasible upgrade cycles so route branching does not have to discover every
// early research level and physical upgrade before it can report a solution.
function seedCycles(initial,c,consider,deadline,cancelled,collect){
 // Fixed routes need the same upgrade pass as automatic routes; keep every
 // visit in the entered order and never insert or replace a required farm.
 const orders=c.autoSequence?[[0,4,1],[0,1,4],[1,4,0]]:[null];
 for(const maxUpgradeWait of [7*86400,86400])for(const saleOnly of [true,false])for(const order of orders){let route=c.autoSequence?[initial.egg]:c.sequence.slice();while(c.autoSequence&&route.length<c.maxSwitches+1){const e=order[(route.length-1)%order.length];if(e!==route.at(-1))route.push(e);else{const next=order[(route.length)%order.length];route.push(next);}}
  // Reserve final visits for explicitly required silo/artifact Virtue TE.
  if(c.autoSequence)for(const e of [3,2])if(c.floors[e]>S.teByEgg(initial,c)[e]&&!route.includes(e)&&route.length>1)route[route.length-(e===3?2:1)]=e;
  const fixed={...c,autoSequence:false,sequence:route};let n=initial;
  for(let stage=0;stage<route.length;stage++){
   if(stage){try{n=buy(n,fixed,{type:'shift',egg:route[stage]});}catch{break;}}
   for(let step=0;step<(n.egg===0?2400:n.egg===2?1:256);step++){
    if(Date.now()>deadline||cancelled())return;
    if(saleOnly&&n.egg===0&&at(c,n.t).sale!==.3){const r0=stats(n,c),researches=candidates(n,fixed).filter(a=>a.type==='research');const cheap=researches.some(a=>price(n,fixed,a)<=n.cash+r0.eventEarning*3600);if(researches.length&&!cheap){const sale=c.calendar.find(e=>e.t>n.t+1e-6&&e.sale===.3);if(sale&&sale.t<S.visitDeadline(n,c))n=advance(n,c,sale.t,'Reserve cash for the Friday research discount');}}
    if(step%20===0){consider(finishHere(n,c));consider(tail(n,c));}
    const r=stats(n,c);const deliverySets=S.artifactChoices(n,c),collectionRate=Math.max(...deliverySets.map(set=>stats({...n,set},c).delivery));let chosen=null,score=0,readyChoice=null;
    for(const a of candidates(n,fixed)){const gain=rateGain(n,fixed,a),cost=price(n,fixed,a);const wait=Math.max(0,cost-n.cash)/Math.max(1e-300,r.eventEarning);if(!Number.isFinite(wait)||n.t+wait>c.end)continue;
     let collectionGain=0;if(n.r.reduce((sum,l)=>sum+l,0)>=1390&&(gain.deliver>0||gain.future>0)){const after=S.mutate(n,fixed,a);if(a.type==='research'&&D.research[a.i].id==='micro_coupling'){const length=stats(after,c).trainLength;for(const v of after.v)if(v.id===11)v.cars=length;}collectionGain=Math.max(...S.artifactChoices(after,c).map(set=>stats({...after,set},c).delivery))/Math.max(1,collectionRate)-1;}let value=Math.log1p(Math.max(0,gain.deliver,collectionGain))*4+Math.log1p(Math.max(0,gain.earn))+Math.log1p(Math.max(0,gain.future))*.1;
     if(a.type==='research'){const higherLocked=D.research.some((r,i)=>r.tier>D.research[a.i].tier&&!S.isUnlocked(n,i));value+=higherLocked&&n.r.reduce((sum,l)=>sum+l,0)<1390?.03:.00001;}const estimate=value/(1+wait/60+cost/Math.max(1,r.eventEarning*3600));if(estimate>score){const ready=afford(n,fixed,a);if(ready){score=estimate;chosen=a;readyChoice=ready;}}}
    // Keep a sale-aware route as well as a buy-now route. If buying before
    // Friday cannot earn back the extra price by the sale, preserve that cash.
    if(chosen?.type==='research'&&saleOnly&&n.r.reduce((sum,l)=>sum+l,0)>=1390&&readyChoice.t-n.t>3600&&at(c,readyChoice.t).sale!==.3){
     const sale=c.calendar.find(e=>e.t>readyChoice.t+1e-6&&e.sale===.3);
     if(sale&&sale.t<c.end){try{
      const held=advance(n,c,sale.t,'Preserve cash for the Friday research sale');
      const invested=buy(readyChoice,{...fixed,actionsSeconds:0},chosen,false);
      const early=advance(invested,c,sale.t,'Compare research return before the sale',false);
      if(held.cash-price(held,c,chosen)>early.cash){const saleReady=afford(held,fixed,chosen);if(saleReady)readyChoice=saleReady;}
     }catch{}}
    }
    // Leave the starter farm once further research needs a long wait;
    // upgrade physical bottlenecks on their own Virtues, then return to research.
    if(readyChoice&&readyChoice.t-n.t>(n.r.reduce((sum,l)=>sum+l,0)<1390?3600:maxUpgradeWait))break;
    if(!chosen)break;try{const ready=readyChoice;if(!ready)break;if(reached(ready,c)){consider(ready);break;}const waited=ready.t-n.t;n=buy(ready,fixed,chosen);if(waited>3600){consider(finishHere(n,c));consider(tail(n,c));}if(step%20===0)collect(n);}catch{break;}
   }
   consider(finishHere(n,c));consider(tail(n,c));collect(n);
  }
 }
}
async function solve(raw,options={},progress=()=>{},cancelled=()=>false){
 const {s:initial,c}=S.prepare(raw,{enforceOpeningCaps:true,oneStartingSilo:true});c.c1MaxMinutes=E.maximum(c.c1MaxMinutes);c.k1MaxMinutes=E.maximum(c.k1MaxMinutes);const width=S.number(options.width??32,'Search width',4,512,true);const branches=S.number(options.branches??12,'Branch count',4,56,true);const maxDepth=S.number(options.maxDepth??700,'Search depth',1,3000,true);const maxMs=S.number(options.maxMs??45000,'Search time',100,600000);
 const feasibility=F.assess(initial,c);if(feasibility.impossible)throw Error(F.message(feasibility,c));
 let best=null,baseline=tail(initial,c);const started=Date.now(),bests=[];let explored=0;
 function consider(s){if(!s||!reached(s,c))return;const shifts=s.stage;const old=bests[shifts];if(W.better(s,old))bests[shifts]=s;if(W.better(s,best))best=s;}
 if(c.strategy!=='wasmegg'){consider(baseline);consider(finishHere(initial,c));}else if(reached(initial,c))consider(initial);let beam=[initial];
 let waitingRoutesCompared=0,openingSearch=null;
 const compareSales=raw.plan?.saleComparisonVersion===1&&c.strategy==='wasmegg'&&!reached(initial,c),saleBests=new Map(),saleErrors=new Map();
 if(T.canCompare(initial,c)&&!reached(initial,c)){let stagedError='';const policies=c.earningsMode==='offline'&&stats(initial,c).offline>stats(initial,c).online&&!options.disableOfflineBatches?[null,'short-online','all-waits']:[null];
  const c1Budgets=options.disableOpeningSearch?[c.c1MaxMinutes]:E.budgets(c.c1MaxMinutes),k1Budgets=options.disableOpeningSearch?[c.k1MaxMinutes]:E.budgets(c.k1MaxMinutes);
  openingSearch={c1Budgets,k1Budgets,combinationsCompared:0,totalCombinations:c1Budgets.length*k1Budgets.length,uniqueRoutesCompared:0,stepMinutes:c.openingStepMinutes};
  const suffixes=policies.map(()=>new Map()),openings=policies.map(()=>new Map()),seen=new Set();
  async function compareOpening(c1MaxMinutes,k1MaxMinutes){
   await new Promise(resolve=>setTimeout(resolve,0));if(cancelled())return;
   const key=c1MaxMinutes+':'+k1MaxMinutes;if(seen.has(key))return;seen.add(key);
   for(const [policyIndex,batchMode]of policies.entries()){
    if(!openings[policyIndex].has(c1MaxMinutes))openings[policyIndex].set(c1MaxMinutes,{});
    const stagedCache={opening:openings[policyIndex].get(c1MaxMinutes),suffixes:suffixes[policyIndex]},stageConfig={...c,c1MaxMinutes,k1MaxMinutes,batchOffline:!!batchMode,batchMode};
    for(let sales=1;sales<=c.stagedSales;sales++){if(cancelled())break;
     try{let candidate=T.run(initial,stageConfig,sales,completionGoals,phase=>{
      progress({depth:0,explored,elapsedMs:Date.now()-started,bestSeconds:best?best.t-c.start:null,beam:1,researchSales:sales,phase:'openings',openingCompared:openingSearch.combinationsCompared,openingTotal:openingSearch.totalCombinations,openingBudget:{c1MaxMinutes,k1MaxMinutes},stage:phase,phaseLabel:'C1 ≤'+c1MaxMinutes+' min · K1 ≤'+k1MaxMinutes+' min · '+phase+(batchMode?' · '+(batchMode==='all-waits'?'combined offline breaks':'offline batches'):'')});
      if(cancelled())throw Error('Cancelled');
     },stagedCache);
     explored+=history(candidate).length;waitingRoutesCompared++;if(!stagedCache.reusedSuffix)openingSearch.uniqueRoutesCompared++;
     candidate={...candidate,routeStrategy:'Optimized Sequence',researchSales:sales,waitingPolicy:batchMode==='all-waits'?'Compare combined online and offline purchase waits':batchMode?'Compare short online purchase batches':'Compare individual purchases'};consider(candidate);if(W.better(candidate,saleBests.get(sales)))saleBests.set(sales,candidate);
     }catch(e){stagedError=e.message;saleErrors.set(sales,e.message);if(!stagedCache.prefix)break;}
     await new Promise(resolve=>setTimeout(resolve,0));
    }
   }
   if(!cancelled())openingSearch.combinationsCompared++;
  }
  // Visit every independent pair. No time-based pruning can evict a route
  // merely because a larger ceiling has added new candidates to this grid.
  for(const c1MaxMinutes of c1Budgets){for(const k1MaxMinutes of k1Budgets){if(cancelled())break;await compareOpening(c1MaxMinutes,k1MaxMinutes);}if(cancelled())break;}
  openingSearch.complete=!cancelled()&&openingSearch.combinationsCompared===openingSearch.totalCombinations;
  if(c.strategy==='wasmegg'&&!best)throw Error((stagedError||'No feasible Wasmegg stage plan found.')+' '+require('./assumption-notices.cjs').startingGear(initial,c));}

 const searchStarted=Date.now();let termination=c.strategy==='wasmegg'?(openingSearch?.complete?'staged route comparison':'opening comparison stopped'):options.seedOnly?'rebuild route search':'depth limit';
 if(c.strategy!=='wasmegg'){const seed=beam.at(-1);seedCycles(seed,c,consider,searchStarted+Math.min(maxMs*.8,16000),cancelled,n=>beam.push(n));beam=beam.filter(n=>!best||n.t<best.t);const bins=new Map();for(const n of beam){const k=n.stage+'|'+n.egg;const a=bins.get(k)||[];a.push(n);bins.set(k,a);}beam=[];for(const a of bins.values()){a.sort((x,y)=>rank(x,c)-rank(y,c));beam.push(...a.slice(0,Math.max(1,Math.floor(width/bins.size))));}beam=beam.slice(0,width);}
 for(let depth=0;!options.seedOnly&&c.strategy!=='wasmegg'&&depth<maxDepth;depth++){
  if(cancelled()){termination='cancelled';break;}if(Date.now()-searchStarted>maxMs){termination='time limit';break;}
  const next=[],groups=new Map();
  function add(n){if(!n||n.t>S.visitDeadline(n,c))return;if(reached(n,c)){consider(n);return;}if(best&&n.t>=best.t-1e-6)return;const k=key(n),arr=groups.get(k)||[];if(arr.some(a=>dominates(a,n,c)))return;for(let i=arr.length-1;i>=0;i--)if(dominates(n,arr[i],c))arr.splice(i,1);arr.push(n);groups.set(k,arr);}
  for(const s of beam){explored++;consider(finishHere(s,c));
   if(depth%10===0)consider(tail(s,c));
   const departures=c.autoSequence&&s.stage<c.maxSwitches?[0,4,1,3,2].filter(e=>e!==s.egg):!c.autoSequence&&s.stage+1<c.sequence.length?[c.sequence[s.stage+1]]:[];for(const egg of departures){try{add(buy(s,c,{type:'shift',egg}));}catch{}}
   const r=stats(s,c);const all=candidates(s,c);const scores=all.map(a=>{
    const gain=rateGain(s,c,a),cost=price(s,c,a),wait=Math.max(0,cost-s.cash)/Math.max(1e-300,r.eventEarning);
    // Score immediate delivery, earnings acceleration, and bottleneck headroom.
    let score=(gain.deliver*4+Math.max(gain.earn,gain.research||0)+gain.future*.08)/(1+wait/3600+cost/Math.max(1,r.eventEarning*86400));
    if(a.type==='research'&&D.research[a.i].categories.includes('fleet_size'))score+=.00001/(1+wait);
    return {a,score,cost,wait,gain};
   }).sort((a,b)=>b.score-a.score);
   const chosen=scores.slice(0,branches).map(x=>x.a);
   // Preserve inexpensive tier-unlock filler as well as production researches.
   if(s.egg===0){const cheap=scores.filter(x=>x.a.type==='research').sort((a,b)=>a.cost-b.cost).slice(0,3);for(const x of cheap)if(!chosen.includes(x.a))chosen.push(x.a);}
   for(const a of chosen){try{const n=afford(s,c,a);if(!n)continue;if(reached(n,c)){consider(finishHere(s,c));consider(n);continue;}if(best&&n.t>=best.t)continue;add(buy(n,c,a));}catch(e){if(options.throwErrors)throw e;}}
   // Keep ordinary purchases and compare accumulated waits for successive
   // research levels/cars with one offline break funding a purchase batch.
   if(!options.disableOfflineBatches)for(const a of chosen.slice(0,3)){if(!['research','car','silo'].includes(a.type))continue;try{const actions=Array(64).fill(a);for(const compare of [B.compareShortOnline,B.compare]){const batched=compare(s,c,actions);if(batched)add(batched.s);}}catch(e){if(options.throwErrors)throw e;}}
   // Waiting through an event lets the search preserve cash for Friday rather than
   // spending it at the first possible instant. Keep both the next boundary and next sale.
   const ev=at(c,s.t);const times=new Set([ev.next]);const sale=c.calendar.find(e=>e.t>s.t+1e-6&&e.sale===.3);if(sale)times.add(sale.t);
   for(const t of times)if(t<=S.visitDeadline(s,c)&&(!best||t<best.t))add(advance(s,c,t,'Wait for the weekly event boundary'));
   // TE milestones are strategic departure times even when rates/costs do not change.
   const te=teByEgg(s,c);if(te[s.egg]<98&&r.delivery>0){for(const jump of [1,3,8]){const target=Math.min(98,te[s.egg]+jump);const dt=Math.max(0,D.te[target-1]-s.eggs[s.egg])/r.delivery+.001;const t=s.t+dt;if(t<=S.visitDeadline(s,c)&&(!best||t<best.t))add(advance(s,c,t,'Reach '+target+' '+S.NAME[s.egg]+' TE before reassessing'));}}
  }
  for(const arr of groups.values())for(const n of arr)next.push(n);
  if(!next.length){termination='search exhausted';break;}
  // Stratify by sequence position to retain both research-intensive and early-switch paths.
  const byStage=new Map();for(const n of next){n.rank=rank(n,c);const arr=byStage.get(n.stage+'|'+n.egg)||[];arr.push(n);byStage.set(n.stage+'|'+n.egg,arr);}
  beam=[];const quota=Math.max(1,Math.floor(width/byStage.size));const stageGroups=[...byStage.values()];for(const arr of stageGroups)arr.sort((a,b)=>a.rank-b.rank||a.t-b.t);stageGroups.sort((a,b)=>a[0].rank-b[0].rank);for(const arr of stageGroups){if(beam.length>=width)break;beam.push(...arr.splice(0,Math.min(quota,width-beam.length)));}
  const rest=[...byStage.values()].flat().sort((a,b)=>a.rank-b.rank);beam.push(...rest.slice(0,Math.max(0,width-beam.length)));beam=beam.slice(0,width);
  if(depth%5===0){progress({depth,explored,elapsedMs:Date.now()-started,bestSeconds:best?best.t-c.start:null,beam:beam.length});await new Promise(resolve=>setTimeout(resolve,0));}
 }
 if(c.strategy!=='wasmegg')for(const s of beam){consider(finishHere(s,c));consider(tail(s,c));}
 if(!best&&stats(initial,c).delivery===0&&!c.initialPhysicalPurchases)throw Error('This farm has no egg production. Enter your existing habs and vehicles, or use Start from scratch to begin with the free Coop and Trike.');
 if(!best&&c.maxSwitches>0&&S.shiftCost(initial)>initial.soul)throw Error('No feasible plan found: the next switch costs '+formatNumber(S.shiftCost(initial))+' Soul Eggs but the farm has '+formatNumber(initial.soul)+'. Enter your actual Soul Eggs, or use a target reachable on the current Virtue.');
 if(!best)throw Error('No feasible plan found within the search and planning limits. '+(require('./assumption-notices.cjs').startingGear(initial,c)||'Check C1/K1 maximum times, planning days, search effort, or allowed switches.'));
 function finalize(best){
  const constraints={enforceOpeningCaps:true,oneStartingSilo:true},simplified=best.routeStrategy?{s:best,actions:history(best)}:simplify(raw,history(best),constraints);const actions=simplified.actions.map((a,i)=>i===0?{...a,initialSiloRule:'one'}:a);const checked=replay(raw,actions,false,constraints);const finalStats=stats(checked.s,checked.c);best={...simplified.s,stage:best.stage,routeStrategy:best.routeStrategy,researchSales:best.researchSales,waitingPolicy:best.waitingPolicy,openingBudgets:best.openingBudgets,fromIncumbent:best.fromIncumbent};
  let frontier=bests.filter(Boolean).map(s=>({switches:s.stage,seconds:s.t-c.start,soulCost:s.lost})).sort((a,b)=>a.switches-b.switches);
  // Remove solutions dominated by fewer switches and no longer completion time.
  frontier=frontier.filter((x,i,arr)=>!arr.some((y,j)=>j!==i&&y.switches<=x.switches&&y.seconds<=x.seconds&&(y.switches<x.switches||y.seconds<x.seconds)));
  const result={version:1,initialSiloRule:'one',openingTimeLimits:true,objective:'Minimum time to claimed + pending TE target in this ascension',method:best.routeStrategy||'Heuristic beam search; fastest plan found, not a proof of global optimality',researchSales:best.researchSales||null,waitingPolicy:best.waitingPolicy||'Compare individual purchases and offline batches',waitingRoutesCompared,openingSearch,openingBudgets:best.openingBudgets||null,termination:cancelled()?'cancelled with best plan':termination,explored,elapsedMs:Date.now()-started,start:c.start,end:best.t,seconds:best.t-c.start,switches:best.stage,soulCost:best.lost,target:c.target,finalTE:teByEgg(best,c),pendingTE:totalTE(best,c)-c.claimedTotal,finalCash:best.cash,finalStats,actions,frontier,baselineSeconds:baseline?baseline.t-c.start:null,sourceCommit:D.commit,validatedReplay:true,artifactRecommendations:best.artifactRecommendations||null,artifactSets:S.recordedArtifactSets(actions),shipPlan:Ships.summary(actions)};
  return {...result,summary:U.summarize(raw,result)};
 }
 if(compareSales){
  const entries=SalePlans.COUNTS.map(sales=>{
   const candidate=saleBests.get(sales);
   if(candidate){try{return {researchSales:sales,status:'complete',plan:finalize(candidate)};}catch(e){saleErrors.set(sales,e.message);}}
   return {researchSales:sales,status:cancelled()?'not-completed':'unavailable',error:cancelled()?'Search stopped before a complete plan was found.':saleErrors.get(sales)||'No feasible plan found within the opening and planning limits.'};
  });
  const available=entries.filter(e=>e.status==='complete');
  if(!available.length)throw Error('No research-sale plan passed replay validation.');
  const chosen=available.reduce((a,b)=>W.better(saleBests.get(b.researchSales),saleBests.get(a.researchSales))?b:a);
  return SalePlans.select({researchSalePlans:entries},chosen.researchSales);
 }
 return finalize(best);
}
module.exports={solve,replay,finishHere,tail,candidates,rateGain,simplify,seedCycles,completionGoals};
