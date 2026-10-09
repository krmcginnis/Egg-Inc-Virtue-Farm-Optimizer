'use strict';
const S=require('./simulator.cjs'),L=require('./optimizer-legacy.cjs'),W=require('./waiting-objective.cjs');
const B=require('./offline-batch.cjs');
const Ships=require('./ships.cjs'),Plans=require('./research-sale-plans.cjs'),Route=require('./switch-sequence.cjs');
const Staged=require('./staged-route.cjs');
const Recipes=require('./wasmegg-stage-engine.cjs');
const Strategy=require('./planning-strategy.cjs'),Summary=require('./shift-summary.cjs'),F=require('./feasibility.cjs');
const Automatic=require('./automatic-routes.cjs'),ShiftPlans=require('./shift-plans.cjs');
const {Checkpoints}=require('./search-checkpoints.cjs'),Lookahead=require('./purchase-lookahead.cjs');
const Breakpoints=require('./research-breakpoints.cjs'),Incumbents=require('./plan-incumbents.cjs');
const Sleep=require('./sleep-schedule.cjs');
const Schedules=require('./schedule-proposals.cjs');
const Comfort=require('./silo-comfort.cjs');
const CalendarDepartures=require('./calendar-departures.cjs');
const EarningsIncumbents=require('./earnings-incumbents.cjs');
function better(a,b){if(!a)return false;if(!b)return true;if(a.t<b.t-1e-6)return true;if(a.t>b.t+1e-6)return false;if(a.stage!==b.stage)return a.stage<b.stage;if(Comfort.preferred(a,b))return true;if(Comfort.preferred(b,a))return false;return W.offlineBreaks(a)<W.offlineBreaks(b);}
const VERSION=2,letters=['C','I','H','R','K'];

function routes(raw){
 if(!Strategy.automatic(raw.plan||{}))return [Route.normalize(raw.plan?.sequence,raw.farm.virtue,{required:true})];
 return Automatic.generate(raw);
}
function presetRoutes(raw){
 const primary=Route.normalize(undefined,raw.farm.virtue),alternate=primary.slice(),firstC=alternate.indexOf('curiosity');
 if(alternate[firstC+1]==='kindness'&&alternate[firstC+2]==='integrity')
  [alternate[firstC+1],alternate[firstC+2]]=[alternate[firstC+2],alternate[firstC+1]];
 const endingOnH=r=>[...r.slice(0,-3),'integrity','resilience','humility'];
 return [primary,endingOnH(primary),alternate,endingOnH(alternate)].filter((r,i,a)=>a.findIndex(x=>JSON.stringify(x)===JSON.stringify(r))===i);
}
function saleDeadline(c,count){
 const ends=c.calendar.filter((e,i)=>Number.isFinite(e.t)&&e.t>c.start&&e.sale===1&&i>0&&c.calendar[i-1].sale===.3);
 return Math.min(c.end,ends[count-1]?.t??c.end);
}
function prepare(raw,route,count,options={}){
 const input={...raw,plan:{...raw.plan,solverVersion:VERSION,saleComparisonVersion:1,strategy:'user',strategyVersion:2,autoSequence:false,sequence:route}};
 const prepared=S.prepare(input,{...options,enforceOpeningCaps:false,oneStartingSilo:true}),c=prepared.c;
 c.routeResearchRule=true;c.finalCStage=c.sequence.lastIndexOf(0);c.researchDeadline=saleDeadline(c,count);
 c.finalResearchStage=c.sequence.slice(0,Math.max(0,c.finalCStage)).lastIndexOf(0);c.researchSales=count;
 c.lastVisits=S.EGGS.map((_,e)=>c.sequence.lastIndexOf(e));
 return {...prepared,input};
}
function researchContext(s,c){return s.egg===0?{...c,end:Math.min(c.end,c.researchDeadline)}:c;}
function phase(s,c){return letters[s.egg]+c.sequence.slice(0,s.stage+1).filter(e=>e===s.egg).length;}
function visitWeight(c,stage){const egg=c.sequence[stage];return egg===0&&stage<c.finalCStage?8:egg===4?4:egg===1?3:1;}
function future(s,c,egg){return c.sequence.slice(s.stage+1).includes(egg);}
function projected(s,c,preserve=-1){
 const n=S.clone(s);
 // For a physical purchase, retain capacity that future research can use,
 // including when this is the route's only I or K. These are scoring bounds,
 // never free upgrades in an actual continuation.
 if(preserve>=0&&s.t<c.researchDeadline&&c.sequence.slice(s.stage+1,c.finalCStage).includes(0))n.r=S.D.research.map(r=>r.levels);
 // Capacity is projected only if this route still permits buying it.
 if(preserve!==1&&future(s,c,1))n.h=[18,18,18,18];
 const r=S.stats(n,c);
 if(preserve!==4&&future(s,c,4))n.v=n.v.map((v,i)=>i<r.slots?{id:11,cars:r.trainLength}:v);
 return S.stats(n,c);
}
function scored(s,c,policy='balanced'){
 const preserve=s.egg===1||s.egg===4?s.egg:-1,now=S.stats(s,c),potential=projected(s,c,preserve),moreResearch=s.stage<=c.finalResearchStage;
 const deliveryVisit=c.lastVisits[s.egg]===s.stage;
 return L.candidates(s,c).filter(a=>S.allowed(s,c,a)).map(a=>{
  const n=S.mutate(s,c,a),after=S.stats(n,c),later=projected(n,c,preserve);
  const cost=S.price(s,c,a),wait=Math.max(0,cost-s.cash)/Math.max(1e-300,now.eventEarning);
  const income=Math.max(0,Math.log(after.earning/Math.max(1e-300,now.earning)));
  const delivery=Math.max(0,Math.log(after.delivery/Math.max(1e-300,now.delivery)));
  const capacity=Math.max(0,Math.log(later.delivery/Math.max(1e-300,potential.delivery)));
  const buyingPower=a.type==='set'?Math.max(0,Math.log((after.earning/after.researchMult)/(now.earning/now.researchMult))):income;
  const r=a.type==='research'?S.D.research[a.i]:null;
  const unlock=r&&S.D.research.some((x,i)=>x.tier>r.tier&&!S.isUnlocked(s,i))?.025:0;
  const fleet=r&&r.categories.includes('fleet_size')&&future(s,c,4)?.05:0;
  let value=(moreResearch?buyingPower*3:delivery*5)+capacity*(moreResearch?1:3)+unlock+fleet;
  if(policy==='income')value+=buyingPower*5;
  if(policy==='fleet')value+=fleet*5+capacity*2;
  if(policy==='cheap')value=(.01+income+delivery+unlock)/(1+cost/Math.max(1,now.eventEarning*60));
  // Final visits have delivery value, not speculative earnings value. A
  // Hyperloop engine also has value when later cars in this SAME visit help.
  if(deliveryVisit&&s.egg!==0){
   let finalRate=after.delivery;
   if(a.type==='vehicle'&&a.id===11){const filled=S.clone(n);filled.v[a.slot].cars=after.trainLength;finalRate=S.stats(filled,c).delivery;}
   value=Math.max(capacity,Math.max(0,Math.log(finalRate/Math.max(1e-300,now.delivery))))*5;
   if(a.type==='set'&&Ships.pending(s,c))value+=buyingPower;
  }
  if(a.type==='silo'&&c.sleep){
   const span=c.end-s.t,availableBefore=Sleep.productiveSeconds(c.sleep,s.t,c.end,now.siloHours*3600),availableAfter=Sleep.productiveSeconds(c.sleep,s.t,c.end,after.siloHours*3600);
   if(span>0)value+=5*Math.log(availableAfter/Math.max(1e-300,availableBefore));
  }
  const score=value/(1+wait/60+cost/Math.max(1,now.eventEarning*3600));
  return {a,score,cost,wait};
 }).filter(x=>Number.isFinite(x.score)&&x.score>0).sort((a,b)=>b.score-a.score||a.cost-b.cost);
}
function complete(s,c){return S.reached(s,c);}
function finish(s,c){try{return L.tail(s,c);}catch{return null;}}
function estimate(s,c){
 const r=S.stats(s,c),te=S.teByEgg(s,c),available=new Set(c.sequence.slice(s.stage));
 let missing=Math.max(0,c.target-te.reduce((a,b)=>a+b,0)),mandatory=0,thresholds=[];
 for(let e=0;e<5;e++){
  const floor=Math.max(te[e],c.floors[e]);if(floor>te[e]&&!available.has(e))return Infinity;
  if(floor>te[e]){mandatory+=Math.max(0,S.D.te[floor-1]-s.eggs[e]);missing-=floor-te[e];}
  if(available.has(e))for(let n=floor+1;n<=98;n++)thresholds.push(Math.max(0,S.D.te[n-1]-(n===te[e]+1?s.eggs[e]:S.D.te[n-2])));
 }
 thresholds.sort((a,b)=>a-b);if(thresholds.length<missing)return Infinity;
 return s.t-c.start+(mandatory+thresholds.slice(0,Math.max(0,missing)).reduce((a,b)=>a+b,0))/Math.max(1e-300,r.delivery);
}
function stateKey(s){return JSON.stringify([s.stage,s.r,s.h,s.v,s.set,s.silos,s.shipsDone,s.shipRuns,s.shipRunStage,s.shipFlights]);}
function dominates(a,b,c){
 // Compare at the same calendar instant so sale-aligned cash/progress is
 // not discarded merely because another state was reached earlier.
 if(a.t>b.t+1e-6||a.soul<b.soul||W.offlineBreaks(a)>W.offlineBreaks(b))return false;
 let aligned=a;try{if(a.t<b.t)aligned=S.advance(a,c,b.t,'Dominance comparison',false);}catch{return false;}
 return aligned.cash+Math.max(1,b.cash)*1e-12>=b.cash&&aligned.eggs.every((n,i)=>n+Math.max(1,b.eggs[i])*1e-12>=b.eggs[i])&&aligned.fuel.every((n,i)=>n+Math.max(1,b.fuel[i])*1e-12>=b.fuel[i]);
}
function prune(states,c,width){
 const buckets=new Map();
 for(const s of states){const key=stateKey(s),same=buckets.get(key)||[];if(same.some(x=>dominates(x,s,c)))continue;buckets.set(key,same.filter(x=>!dominates(s,x,c)).concat(s));}
 const all=[...buckets.values()].flat(),chosen=new Set();
 const orderings=[s=>estimate(s,c),s=>s.t-c.start,
  s=>-(S.stats(s,c).earning/S.stats(s,c).researchMult)/(1+(s.t-c.start)/86400),
  s=>-projected(s,c).delivery/(1+(s.t-c.start)/86400)];
 const quota=Math.max(1,Math.floor(width/orderings.length));
 for(const rank of orderings){const ranked=all.map(s=>({s,value:rank(s)})).sort((a,b)=>a.value-b.value);for(const x of ranked.slice(0,quota))chosen.add(x.s);}
 for(const s of all.map(s=>({s,value:estimate(s,c)})).sort((a,b)=>a.value-b.value).map(x=>x.s)){if(chosen.size>=width)break;chosen.add(s);}
 return [...chosen].slice(0,width);
}
function tag(s,base,label){
 const actions=[];for(let p=s.path;p&&p!==base;p=p.prev)actions.push(p.action);
 let path=base;for(const action of actions.reverse())path={prev:path,action:{...action,phase:action.phase==='Candidate'?label:action.phase||label}};
 return {...s,path};
}
function recipe(s,c,kind,limit=Infinity,cache,checkpoint=()=>{},forcePhysical=true){
 const runner=kind==='C1'?(s,ctx)=>Recipes.runC1(s,ctx,limit):kind==='K1'?(s,ctx)=>Recipes.runK1(s,ctx,limit):
  kind==='C3'?(s,ctx)=>Recipes.runC3(s,ctx,c.researchDeadline):Recipes['run'+kind];
 const run=()=>Staged.step(s,c.sleep&&kind!=='C3'?{...c,sleepBudget:true}:c,forcePhysical&&['I1','K2'].includes(kind)?kind:'Candidate',s.egg,runner,limit,c.researchDeadline);
 return cache?cache.run(s,c,['recipe',kind,limit,forcePhysical],run,checkpoint,true,true):run();
}
function seedRoute(initial,c,minutes,checkpoint=()=>{},cache){
 let stopped=false,interruption;
 const check=()=>{if(stopped)throw interruption;try{checkpoint();}catch(error){stopped=true;interruption=error;throw error;}};
 const run=()=>seedRouteUncached(initial,c,minutes,check,cache);
 return cache?cache.run(initial,c,['continuation',minutes],run,check,false,true):run();
}
function seedRouteUncached(initial,c,minutes,checkpoint,cache){
 // A paid, replayable starting candidate for every route. These sampled
 // departures do not constrain the subsequent search's visit durations.
 const timing=typeof minutes==='number'?{research:minutes,vehicles:minutes}:minutes;
 c={...c,stagedShips:false,batchOffline:c.earningsMode==='offline',batchMode:'all-waits'};let n=initial,best=null;
 try{for(let stage=initial.stage;stage<c.sequence.length;stage++){
  checkpoint();if(complete(n,c))return better(n,best)?n:best;
  const base=n.path,label=phase(n,c),first=c.sequence.slice(0,stage).every(e=>e!==n.egg);
  if(n.egg===0&&stage<c.finalCStage&&n.t<c.researchDeadline){
   const local=researchContext(n,c);
   if(first)n=recipe(n,local,'C1',timing.research*60,cache,checkpoint);
   if(stage===c.finalResearchStage&&n.t<c.researchDeadline)n=recipe(n,local,'C3',c.researchDeadline-n.t,cache,checkpoint);
   else if(!first)n=recipe(n,local,'C2',14400,cache,checkpoint);
  }else if(n.egg===1)n=recipe(n,c,'I1',Infinity,cache,checkpoint);
  else if(n.egg===4)n=recipe(n,c,first?'K1':'K2',first?timing.vehicles*60:Infinity,cache,checkpoint);
  else if(n.egg===3&&c.sleep){
   // A silo is a production upgrade when sleep outlasts current coverage.
   // Seed a paid coverage build; the beam still compares shorter R visits.
   const longest=Sleep.requiredCoverage(c.sleep,n.t,c.end),until=Math.min(c.end,Sleep.activeDeadline(c.sleep,n.t,3600));
   while(S.stats(n,c).siloHours*3600<longest&&S.allowed(n,c,{type:'silo'})){
    checkpoint();const a={type:'silo'},ready=S.afford(n,c,a);if(!ready||ready.t+c.actionsSeconds>until)break;n=S.buy(ready,c,a);
   }
  }
  else if(n.egg===2){
   const projected=S.clone(n);if(!timing.currentGear&&future(n,c,4))for(const v of projected.v)if(v.id===11)v.cars=S.stats(n,c).trainLength;
   const set=S.artifactChoices(projected,c).reduce((a,b)=>S.stats({...projected,set:b},c).delivery>S.stats({...projected,set:a},c).delivery?b:a,n.set);
   if(set!==n.set)n=S.buy(n,{...c,deferShips:true},S.artifactAction(set,c));
   if(Ships.pending(n,c))n=Ships.launch(n,c);
  }
  const actions=[];for(let p=n.path;p&&p!==base;p=p.prev)actions.push(p.action);let path=base;for(const action of actions.reverse())path={prev:path,action:{...action,phase:label}};n={...n,path,phase:label};
  // Compare delivery now with paying for later gear/physical upgrades. A
  // feasible tail is a candidate, not a reason to abandon the upgrade route.
  if(stage>=c.finalResearchStage){const end=finish(n,c);if(better(end,best))best=end;}
  if(stage+1<c.sequence.length)n=S.buy(n,c,{type:'shift',egg:c.sequence[stage+1]});
 }}catch(error){if(best)return best;throw error;}
 const end=complete(n,c)?n:finish(n,c);return better(end,best)?end:best;
}
function openingDepartures(initial,c,actions){
 let n=initial,last=initial;const states=[initial],checkpoints=[30*60,60*60,180*60,360*60,12*3600,86400,3*86400,7*86400];let index=0;
 for(const action of actions){
  if(action.type==='shift')break;
  try{
   if(action.type==='wait'){states.push(...CalendarDepartures.duringWait(n,c,action));n=S.advance(n,c,action.end,action.reason,true,action.earningsMode||'auto');}
   else n=S.buy(n,{...c,actionsSeconds:0,shiftSeconds:0,shipReplay:true},action);
   // Only depart after complete purchase interactions. Keep the last paid
   // state before each sampling time, without pretending it earned extra cash.
   if(action.type==='wait'||c.actionsSeconds===0){
    while(index<checkpoints.length&&n.t-c.start>=checkpoints[index]){states.push(last);index++;}
    last=n;
   }
  }catch{break;}
 }
 states.push(last);return [...new Set(states)];
}
async function compareDepartures(states,c,deadline,control,preferred=[]){
 const trials=[...new Set([...preferred,...prune(states,c,8)])],ranked=[];
 for(const state of trials){
  if(control.cancelled()||Date.now()>=deadline)break;
  let best=null;
  // The next physical visit must be compared too: shortening C1 while
  // accidentally shortening K1 can conceal the benefit of moving research.
  for(const minutes of [60,180]){
   if(control.cancelled()||Date.now()>=deadline)break;
   try{
    let next=state;
    if(state.stage+1<c.sequence.length&&!complete(state,c))next=S.buy(state,c,{type:'shift',egg:c.sequence[state.stage+1]});
    const end=seedRoute(next,c,minutes,()=>{if(control.cancelled()||Date.now()>=deadline)throw Error('Continuation interrupted');},control.checkpoints);
    control.continuationsCompared++;
    if(end){control.consider(end);if(better(end,best))best=end;}
   }catch{}
   await control.yield();
  }
  if(best)ranked.push({state,end:best});
 }
 ranked.sort((a,b)=>better(a.end,b.end)?-1:better(b.end,a.end)?1:0);
 return ranked;
}

async function unlockDepartures(states,c,deadline,control){
 if(!control.lookahead)return [];
 const proposed=[];
 for(const state of Lookahead.anchors(states,c)){
  if(control.cancelled()||Date.now()>=deadline)break;
  try{
   const result=Lookahead.chains(state,c,{checkpoint:()=>{if(control.cancelled()||Date.now()>=deadline)throw Error('Purchase lookahead interrupted');}});
   control.lookaheadNodes+=result.nodes;control.lookaheadChains+=result.candidates.length;
   for(const candidate of result.candidates)proposed.push(tag(candidate.state,state.path,phase(state,c)));
  }catch{}
  await control.yield();
 }
 return proposed;
}

function purchasePrefixes(initial,c,actions,include){
 let n=initial;const states=[initial];
 for(const action of actions){
  if(action.type==='wait'){states.push(...CalendarDepartures.duringWait(n,c,action).filter(include));n=S.advance(n,c,action.end,action.reason,true,action.earningsMode||'auto');}
  else n=S.buy(n,{...c,actionsSeconds:action.type==='ship-run'?c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},action);
  // Wait records include the full purchase interaction. Never branch from
  // an instant between paying and completing that interaction.
  if(include(n)&&(action.type==='wait'||c.actionsSeconds===0&&action.type!=='shift'))states.push(n);
 }
 return states.filter(include);
}
function researchPrefixes(initial,c,actions){return purchasePrefixes(initial,c,actions,n=>n.egg===0&&n.stage<c.finalCStage);}
async function compareResearchBreakpoints(raw,item,count,deadline,control){
 const states=researchPrefixes(item.initial,item.c,S.history(item.state)).filter(n=>n.stage===0);
 const anchors=Breakpoints.select(states,item.c);
 control.breakpointAnchors+=anchors.length;
 for(const vehicles of [120,180])for(const state of anchors){
  if(control.cancelled()||Date.now()>=deadline)return;
  try{
   const check=()=>{if(control.cancelled()||Date.now()>=deadline)throw Error('Breakpoint comparison interrupted');};
   const candidate=Staged.supportsFixed(item.initial,item.c)?Staged.run(item.initial,{...item.c,enforceOpeningCaps:true,c1MaxMinutes:(state.t-item.c.start)/60,k1MaxMinutes:vehicles,batchOffline:item.c.earningsMode==='offline',batchMode:'all-waits'},count,L.completionGoals,check,{opening:{c1:state,speculative:null}}):seedRoute(S.buy(state,item.c,{type:'shift',egg:item.c.sequence[state.stage+1]}),item.c,{research:180,vehicles},check,control.checkpoints);
   control.breakpointComparisons++;control.consider(candidate);
   if(candidate)for(const end of completionAlternatives(raw,{state:candidate,context:item.c,route:item.route,count},[candidate.stage-1,candidate.stage-2],check))control.consider(end);
  }catch{}
  await control.yield();
 }
}
function physicalPrefixes(initial,c,actions){return purchasePrefixes(initial,c,actions,n=>[1,4].includes(n.egg)&&n.stage<c.finalResearchStage);}
async function comparePurchaseChains(states,c,deadline,control){
 if(!control.lookahead)return;
 const anchors=Lookahead.anchors(states,c);
 for(let i=0;i<anchors.length;i++){
  if(control.cancelled()||Date.now()>=deadline)break;
  const end=Date.now()+Math.max(1,(deadline-Date.now())/(anchors.length-i));
  const chains=await unlockDepartures([anchors[i]],c,Math.min(end,Date.now()+Math.max(1,(end-Date.now())*.25)),control);
  // Keep separate economic and delivery candidates, then judge the actual
  // completed route. Compare leaving now with continuing research on this C.
  for(const state of prune(chains,c,4))for(const leave of [false,true]){
   if(control.cancelled()||Date.now()>=end)break;
   try{
    let next=state;if(leave&&state.stage+1<c.sequence.length)next=S.buy(state,c,{type:'shift',egg:c.sequence[state.stage+1]});
    const result=seedRoute(next,c,180,()=>{if(control.cancelled()||Date.now()>=end)throw Error('Unlock continuation interrupted');},control.checkpoints);
    control.lookaheadComparisons++;control.continuationsCompared++;if(result)control.consider(result);
   }catch{}
   await control.yield();
  }
 }
}

// Rank investment checkpoints by the delivery they can support after the
// route's remaining paid physical/gear visits. This is only a selection
// heuristic; every candidate below must complete the real remaining route.
function deliveryPotential(s,c){
 const n=S.clone(s);
 if(future(s,c,1))n.h=[18,18,18,18];
 if(future(s,c,4)){const r=S.stats(n,c);n.v=n.v.map((v,i)=>({id:i<r.slots?11:null,cars:r.trainLength}));}
 const sets=future(s,c,2)?S.artifactChoices(n,c):[n.set];
 return Math.max(...sets.map(set=>S.stats({...n,set},c).delivery));
}
function deliveryEstimate(s,c){
 const elapsed=s.t-c.start,remaining=estimate(s,c)-elapsed;
 if(!Number.isFinite(remaining))return Infinity;
 return elapsed+remaining*S.stats(s,c).delivery/Math.max(1e-300,deliveryPotential(s,c));
}
async function comparePhysicalInvestments(states,c,deadline,control){
 const groups=new Map();for(const n of states){const group=groups.get(n.stage)||[];group.push(n);groups.set(n.stage,group);}
 // Work backward: fleet capacity just before research directly determines
 // buying power there. Earlier I/K alternatives remain separate comparisons.
 const visits=[...groups.values()].reverse();
 for(let i=0;i<visits.length;i++){
  if(control.cancelled()||Date.now()>=deadline)break;
  const candidates=visits[i].slice(),end=Date.now()+Math.max(1,(deadline-Date.now())/(visits.length-i));
  const last=candidates.at(-1),local={...c,end:Math.min(c.end,c.researchDeadline)};
  if(last.t<local.end){
   const traceEnd=Date.now()+Math.max(1,(end-Date.now())*.15);
   candidates.push(...await trace(last,local,'fleet',false,traceEnd,control));
  }
  const ranked=candidates.map(state=>({state,value:deliveryEstimate(state,c)})).sort((a,b)=>a.value-b.value);
  // Earliest, last paid, best projected delivery, and beam diversity. Never
  // discard all the shorter investments in favor of a fully maxed farm.
  const trials=[...new Set([candidates[0],last,...ranked.slice(0,2).map(x=>x.state),...prune(candidates,c,4)])].slice(0,6);
  for(const state of trials){
   if(control.cancelled()||Date.now()>=end)break;
   for(const minutes of [180,60]){
    if(control.cancelled()||Date.now()>=end)break;
    try{
     const next=S.buy(state,c,{type:'shift',egg:c.sequence[state.stage+1]});
     const completed=seedRoute(next,c,minutes,()=>{if(control.cancelled()||Date.now()>=end)throw Error('Physical continuation interrupted');},control.checkpoints);
     control.physicalComparisons++;control.continuationsCompared++;if(completed)control.consider(completed);
    }catch{}
    await control.yield();
   }
  }
 }
}
async function compareDeliveryResearch(states,c,deadline,control){
 const final=states.filter(n=>n.stage===c.finalResearchStage);if(!final.length)return;
 const ranked=final.map(state=>({state,value:deliveryEstimate(state,c)})).sort((a,b)=>a.value-b.value);
 const anchors=[...new Set([final.at(-1),...ranked.slice(0,2).map(x=>x.state),
  ...c.calendar.filter(e=>e.sale===.3).map(e=>final.find(n=>n.t>=e.t)).filter(Boolean)])].slice(0,6);
 for(let ai=0;ai<anchors.length;ai++){
  if(control.cancelled()||Date.now()>=deadline)break;
  const state=anchors[ai],end=Date.now()+Math.max(1,(deadline-Date.now())/(anchors.length-ai)),local={...c,end:Math.min(c.end,c.researchDeadline)};
  const production=S.D.research.map((r,i)=>({r,i})).filter(({r,i})=>
   ['egg_laying_rate','hab_capacity','shipping_capacity','fleet_size'].some(k=>r.categories.includes(k))&&S.allowed(state,local,{type:'research',i}));
  const rate=deliveryPotential(state,c),upgrades=production.map(({i})=>{
   const a={type:'research',i},gain=deliveryPotential(S.mutate(state,c,a),c)/Math.max(1e-300,rate)-1;
   return {a,gain,cost:S.price(state,local,a)};
  }).filter(x=>x.gain>0).sort((a,b)=>b.gain/(1+b.cost/Math.max(1,S.stats(state,c).eventEarning*86400))-a.gain/(1+a.cost/Math.max(1,S.stats(state,c).eventEarning*86400)));
  const trials=[state];
  for(const {a} of upgrades.slice(0,4))try{
   const ready=S.afford(state,local,a);if(ready&&ready.t+local.actionsSeconds<=local.end)trials.push(tag(S.buy(ready,local,a),state.path,phase(state,c)));
  }catch{}
  // Compare finishing the build now and each paid production upgrade. Income
  // alone cannot justify spending gems that could improve months of delivery.
  for(const n of trials)for(const currentGear of [false,true]){
   if(control.cancelled()||Date.now()>=end)break;
   try{
    const next=S.buy(n,c,{type:'shift',egg:c.sequence[n.stage+1]});
    const completed=seedRoute(next,c,{research:180,vehicles:180,currentGear},()=>{if(control.cancelled()||Date.now()>=end)throw Error('Delivery research continuation interrupted');},control.checkpoints);
    control.deliveryResearchComparisons++;control.continuationsCompared++;if(completed)control.consider(completed);
   }catch{}
   await control.yield();
  }
 }
}

function completionAlternatives(raw,item,counts,checkpoint=()=>{}){
 const c=item.context,actions=S.history(item.state);
 let n=prepare(raw,item.route,item.count,{artifactReplay:true,artifactSets:c.loadouts}).s;
 const prefixes=new Map(),remember=()=>{
  const entry=prefixes.get(n.stage)||{first:n};entry.last=n;prefixes.set(n.stage,entry);
 };
 remember();let purchase=false;
 for(const action of actions){
  checkpoint();
  if(action.type==='wait'){
   n=S.advance(n,c,action.end,action.reason,true,action.earningsMode||'auto');
   if(purchase){remember();prefixes.get(n.stage).build=n;purchase=false;}
  }else{
   if(action.type==='shift')remember();
   n=S.buy(n,{...c,actionsSeconds:action.type==='ship-run'?c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},action);
   purchase=['shift','research','hab','vehicle','car','silo','set'].includes(action.type);
   if(!purchase||c.actionsSeconds===0&&action.type!=='shift'||action.type==='shift'&&c.shiftSeconds===0){remember();purchase=false;}
  }
 }
 remember();const output=[];
 for(const shifts of counts){
  checkpoint();if(shifts<0||shifts>=c.sequence.length)continue;
  // Reallocate delivery across the remaining visits of a shorter ending.
  // Research, gear, vehicles, fuel, missions, and elapsed time stay paid.
  const shorter={...c,sequence:c.sequence.slice(0,shifts+1),maxSwitches:shifts};let best=null;
  for(const entry of prefixes.values())for(const state of new Set([entry.first,entry.build,entry.last].filter(Boolean))){
   checkpoint();if(state.stage>shifts||state.stage<=c.finalResearchStage)continue;
   const end=finish(state,shorter);if(better(end,best))best=end;
  }
  if(best&&complete(best,c))output.push(best);
 }
 return output;
}

async function trace(start,c,policy,saleAware,deadline,control){
 let n=start,output=[start];const base=start.path,label=phase(start,c),local=researchContext(start,c);
 for(let step=0;step<4000;step++){
  if(control.cancelled()||Date.now()>=deadline)break;
  if(step%32===0){await control.yield();if(control.cancelled())break;}
  const choice=scored(n,local,policy)[0];if(!choice)break;
  if(saleAware&&n.egg===0&&S.at(c,n.t).sale!==.3&&choice.wait>3600){
   const sale=c.calendar.find(e=>e.t>n.t&&e.sale===.3);
   if(sale&&sale.t<local.end)try{n=S.advance(n,local,sale.t,'Compare research purchases during the next sale');output.push(tag(n,base,label));}catch{break;}
  }
  let changed=false,executed=0;const before=n,batch=choice.a.type==='research'?8:choice.a.type==='car'?4:1;
  for(let i=0;i<batch;i++){
   try{const ready=S.afford(n,local,choice.a);if(!ready)break;output.push(...CalendarDepartures.beforePurchase(n,local,ready).map(x=>tag(x,base,label)));const next=S.buy(ready,local,choice.a);if(next.t>c.end)break;n=next;changed=true;executed++;control.explored++;}catch{break;}
  }
  if(!changed)break;
  if(executed>1&&c.earningsMode==='offline')try{const offline=B.compare(before,local,Array(executed).fill(choice.a),local.end);if(offline?.count===executed&&W.better(offline.s,n))n=offline.s;}catch{}
  if(step<12||step%4===0||S.reached(n,c))output.push(tag(n,base,label));
  if(S.reached(n,c)){control.consider(tag(n,base,label));break;}
 }
 output.push(tag(n,base,label));return output;
}
async function visit(start,c,deadline,control){
 const rays=[],proposed=[],label=phase(start,c);
 // Shared game-specific purchase chains are candidates on ANY entered route,
 // not a separate solver. Retain their intermediate departure points too.
 const generators=[];
 if(start.egg===0&&start.stage<c.finalCStage&&start.t<c.researchDeadline){
  const first=c.sequence.slice(0,start.stage).every(e=>e!==0);
  if(first)generators.push(['C1',180*60]);
  if(start.stage===c.finalResearchStage)generators.push(['C3',c.researchDeadline-start.t]);
  else if(!first)generators.push(['C2',14400]);
 }else if(start.egg===1)generators.push(['I1',Infinity]);
 else if(start.egg===4){const first=c.sequence.slice(0,start.stage).every(e=>e!==4);generators.push(first?['K1',180*60]:['K2',Infinity]);}
 for(const [kind,limit] of generators){
  if(control.cancelled()||Date.now()>=deadline)break;
  try{
   const candidate=recipe(start,researchContext(start,c),kind,limit,control.checkpoints,()=>{if(control.cancelled())throw Error('Recipe interrupted');},false);
   let n=start,seen=0;const actions=[];for(let p=candidate.path;p&&p!==start.path;p=p.prev)actions.push(p.action);
   for(const a of actions.reverse()){
    if(a.type==='wait'){proposed.push(...CalendarDepartures.duringWait(n,c,a).map(x=>tag(x,start.path,label)));n=S.advance(n,c,a.end,a.reason,true,a.earningsMode||'auto');}
    else n=S.buy(n,{...c,shiftSeconds:0,actionsSeconds:0,shipReplay:true},a);
    control.explored++;
    seen++;if((a.type==='wait'||c.actionsSeconds===0)&&(seen%16===0||S.reached(n,c)))proposed.push(tag(n,start.path,label));
   }
   proposed.push(tag(candidate,start.path,label));
  }catch{}
  await control.yield();
 }
 const compareLater=start.egg===0&&start.stage<c.finalCStage&&c.sequence.slice(start.stage+1).some(e=>e===1||e===4);
 // Reserve CPU for the cost of the rest of the route, rather than spending
 // the entire visit slice ranking only the current farm's upgrade potential.
 const traceDeadline=compareLater?Date.now()+Math.max(1,(deadline-Date.now())*.55):deadline;
 for(const policy of ['balanced','income','fleet','cheap']){
  if(control.cancelled()||Date.now()>=traceDeadline)break;
  const slice=Math.max(1,(traceDeadline-Date.now())/(4-rays.length));
  rays.push(await trace(start,c,policy,policy==='fleet',Math.min(traceDeadline,Date.now()+slice),control));
 }
 let departures=[start,...proposed,...rays.flat()];
 for(const state of prune(departures,c,4)){
  const event=S.at(c,state.t).next;
  if(Number.isFinite(event)&&event<c.end)try{departures.push(S.advance(state,c,event,'Compare departure at a weekly event boundary'));}catch{}
 }
 const chainDeadline=Date.now()+Math.max(0,(deadline-Date.now())*.2);
 const chains=await unlockDepartures(departures,c,chainDeadline,control);departures.push(...chains);
 const preferred=chains.length?prune(chains,c,4).slice(0,2):[];
 const continuations=compareLater?await compareDepartures(departures,c,deadline,control,preferred):[];
 // Preserve prefixes whose paid continuations finish sooner even when they
 // currently earn less. Keep other candidates for the broader beam search.
 return [...new Set([...continuations.slice(0,Math.max(1,Math.floor(control.width/2))).map(x=>x.state),...prune(departures,c,control.width)])].slice(0,control.width);
}
function validateRoute(raw,route){
 if(Strategy.automatic(raw.plan||{})){if(!Array.isArray(route)||route[0]!==raw.farm.virtue||route.length-1>Automatic.limit(raw)||route.some((e,i)=>!S.EGGS.includes(e)||i>0&&e===route[i-1]))throw Error('Saved solver route exceeds the shift ceiling or contains invalid visits.');}
 else if(JSON.stringify(Route.normalize(raw.plan?.sequence,raw.farm.virtue,{required:true}))!==JSON.stringify(route))throw Error('Saved solver route differs from the selected sequence.');
}
function replay(raw,actions,record=false,options={}){
 const marker=actions[0]?.routeSearch;if(!marker){const input={...raw,plan:{...raw.plan}};delete input.plan.solverVersion;return L.replay(input,actions,record,options);}
 if(marker.version!==VERSION||!Plans.COUNTS.includes(marker.researchSales))throw Error('Invalid route-search rules.');
 validateRoute(raw,marker.sequence);
 const {s:initial,c}=prepare(raw,marker.sequence,marker.researchSales,{artifactReplay:true,artifactSets:S.recordedArtifactSets(actions)});let s=initial;
 for(let index=0;index<actions.length;index++){const action=actions[index];
  const overhead=action.type==='shift'?c.shiftSeconds:['research','hab','vehicle','car','silo','set'].includes(action.type)?c.actionsSeconds:0;
  if(c.sleep&&!['wait','ship-run'].includes(action.type))Sleep.assertActive(c.sleep,action.t,overhead);
  if(overhead>0){const next=actions[index+1];if(next?.type!=='wait'||next.earningsMode!=='online'||Math.abs(next.t-action.t)>.01||next.end+1e-6<action.t+overhead)throw Error('Timeline omits required interaction time.');}
  if(Math.abs(action.t-s.t)>.01)throw Error('Timeline action has inconsistent time.');
  if(action.type==='research'&&action.t+c.actionsSeconds>c.researchDeadline+1e-6)throw Error('Research interaction exceeds its sale window.');
  if(action.type==='wait')s=S.advance(s,c,action.end,action.reason,record,action.earningsMode||'auto');
  else {
   const shipCheck=!!c.sleep&&action.type==='ship-run',base=s.path;
   s=S.buy(s,{...c,actionsSeconds:action.type==='ship-run'?c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},action,record||shipCheck);
   if(shipCheck){const actual=s.path.action;
    if(Math.abs(action.end-s.t)>.01||JSON.stringify(action.interactions)!==JSON.stringify(actual.interactions)||JSON.stringify(action.launches)!==JSON.stringify(actual.launches))throw Error('Ship interaction schedule differs from its sleep-aware replay.');
    if(!record)s={...s,path:base,depth:s.depth-1};
   }
  }
 }
 if(!complete(s,c))throw Error('Replayed plan did not reach the requested target.');
 if(record){let verified=S.history(s);if(!verified.length)verified=[actions[0]];s={...s,path:null};for(let i=0;i<verified.length;i++){const a=verified[i],original=actions.find(x=>x.type===a.type&&Math.abs(x.t-a.t)<.01);s=S.record(s,{...a,...(original?.phase?{phase:original.phase}:{}),...(i===0?{routeSearch:marker,initialSiloRule:'one'}:{})});}}
 return {s,c};
}
function usedSales(actions,c){
 const windows=new Set();
 for(const a of actions)if(a.type==='research'&&S.at(c,a.t).sale===.3){
  let beginning=c.start;for(let i=0;i<c.calendar.length&&c.calendar[i].t<=a.t;i++)if(c.calendar[i].sale===.3&&(i===0||c.calendar[i-1].sale!==.3))beginning=c.calendar[i].t;windows.add(beginning);
 }
 return windows.size;
}
async function compareResearchOrders(raw,item,deadline,control){
 const actions=S.history(item.state),stages=[];let stage=0;
 for(const a of actions){if(a.type==='shift')stage++;if(a.type==='research'&&!stages.includes(stage))stages.push(stage);}
 if(!stages.length)return;
 // Compare the whole build, earlier-C combinations, and each C separately.
 // A poor final-C reorder must not hide a useful opening, or replace its baseline.
 const proposed=[stages,...stages.slice(1).map((_,i)=>stages.slice(0,stages.length-1-i)),...stages.map(stage=>[stage])];
 const seen=new Set(),masks=proposed.filter(mask=>{const key=mask.join(',');if(seen.has(key))return false;seen.add(key);return true;});
 for(const mask of masks){
  if(control.cancelled()||Date.now()>=deadline)break;
  const checkpoint=()=>{if(control.cancelled()||Date.now()>=deadline)throw Error('Research-order comparison interrupted');};
  try{
   const {s,c}=prepare(raw,item.route,item.count,{artifactReplay:true,artifactSets:S.recordedArtifactSets(actions)});
   const state=Schedules.execute(s,c,actions,{earningsFirst:mask,compress:true,retime:true,checkpoint});
   if(!state)continue;
   const marked=S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:VERSION,sequence:item.route,researchSales:item.count}});
   const verified=replay(raw,marked,true);
   if(verified.s.t!==state.t)throw Error('Research-order replay differs from its paid continuation.');
   control.researchOrderComparisons++;
   control.context=verified.c;control.route=item.route;control.consider(verified.s);
  }catch{try{checkpoint();}catch{break;}}
  await control.yield();
 }
}
function finalize(raw,best,c,route,count,control,termination){
 let actions=S.history(best);
 if(!actions.length)actions=[{type:'wait',t:c.start,end:c.start,egg:best.egg,reason:'Target already reached',earningsMode:'online'}];
 actions=actions.map((a,i)=>i===0?{...a,initialSiloRule:'one',routeSearch:{version:VERSION,sequence:route,researchSales:count}}:a);
 const checked=replay(raw,actions,false),s=checked.s;
 const result={version:1,solverVersion:VERSION,initialSiloRule:'one',openingTimeLimits:false,
  objective:'Minimum completion time to the TE target; equal times favor fewer shifts, then silo coverage up to eight silos',method:'Bounded farm-order, purchase, and departure search; fastest plans found, not a proof of global optimality',
  researchSales:count,actualResearchSales:usedSales(actions,c),researchDeadline:c.researchDeadline,route:route.slice(),
  termination,explored:control.explored,elapsedMs:Date.now()-control.started,start:c.start,end:s.t,seconds:s.t-c.start,switches:s.stage,soulCost:s.lost,target:c.target,
  finalTE:S.teByEgg(s,c),pendingTE:S.totalTE(s,c)-c.claimedTotal,finalCash:s.cash,finalStats:S.stats(s,c),actions,
  frontier:[{switches:s.stage,seconds:s.t-c.start,soulCost:s.lost}],sourceCommit:S.D.commit,validatedReplay:true,
  artifactRecommendations:best.artifactRecommendations||null,...(best.siloComfort?{siloComfort:best.siloComfort}:{}),artifactSets:S.recordedArtifactSets(actions),shipPlan:Ships.summary(actions),search:{automaticVisitTiming:true,routesCompared:control.routesCompared,statesExamined:control.explored,continuationsCompared:control.continuationsCompared,
   checkpoints:control.checkpoints?.summary(),lookaheadNodes:control.lookaheadNodes,lookaheadChains:control.lookaheadChains,lookaheadComparisons:control.lookaheadComparisons,
   openingComparisons:control.openingComparisons,conservativeComparisons:control.conservativeComparisons,physicalComparisons:control.physicalComparisons,deliveryResearchComparisons:control.deliveryResearchComparisons,researchOrderComparisons:control.researchOrderComparisons,recoveryComparisons:control.recoveryComparisons,breakpointAnchors:control.breakpointAnchors,breakpointComparisons:control.breakpointComparisons,retainedPlans:control.retainedPlans,earningsAdaptations:control.earningsAdaptations}};
 return {...result,summary:Summary.summarize(raw,result)};
}
async function solve(raw,options={},progress=()=>{},cancelled=()=>false){
 if(options.legacySolver===true){const input=structuredClone(raw);delete input.plan.solverVersion;return L.solve(input,options,progress,cancelled);}
 const incumbents=Incumbents.restore(raw,options.incumbent,replay);
 if(Strategy.automatic(raw.plan||{}))Automatic.limit(raw);
 const routeOptions=options.returnComparisons===true&&Strategy.automatic(raw.plan||{})?presetRoutes(raw):routes(raw),started=Date.now(),maxMs=S.number(options.maxMs??90000,'Search time',100,600000);
 const width=Math.min(16,S.number(options.width??12,'Search width',4,512,true));
 const entries=[],byShift=new Map(),byRoute=new Map(),searchContexts=[],control={started,width,explored:0,routesCompared:0,continuationsCompared:0,
  checkpoints:options.disableCheckpoints?null:new Checkpoints(),lookahead:!options.disableLookahead,lookaheadNodes:0,lookaheadChains:0,lookaheadComparisons:0,
  openingComparisons:0,conservativeComparisons:0,physicalComparisons:0,deliveryResearchComparisons:0,researchOrderComparisons:0,recoveryComparisons:0,breakpointAnchors:0,breakpointComparisons:0,retainedPlans:0,earningsAdaptations:0,
  cancelled,yield:()=>new Promise(r=>setTimeout(r,0))};let recommended=null,overall=null,retained=null;
 for(const count of options.returnComparisons===true?Plans.COUNTS:[3]){
  if(cancelled()&&!incumbents.some(item=>item.count===count)){entries.push({researchSales:count,status:'not-completed',error:'Search stopped before this sale option completed.'});continue;}
  const deadline=started+maxMs*count/3*(options.returnComparisons===true?1:.72);let best=null,bestContext=null,bestRoute=null,lastError='';
  control.consider=state=>{
   if(!state||!complete(state,control.context))return;
   const item={state,context:control.context,route:control.route,count},previous=byShift.get(state.stage);
   if(better(state,previous?.state))byShift.set(state.stage,item);
   // A slightly faster H-ending plan must not erase an I-ending purchase
   // path that can supply a valid shorter shift-count comparison.
   const routeKey=JSON.stringify([count,control.route]);if(better(state,byRoute.get(routeKey)?.state))byRoute.set(routeKey,item);
   if(better(state,best)){best=state;bestContext=control.context;bestRoute=control.route;}
  };
  for(const item of incumbents)if(item.count===count){control.context=item.context;control.route=item.route;control.consider(item.state);control.retainedPlans++;}
  if(!options.disableResearchOrder&&!cancelled()&&incumbents.length){
   const orderDeadline=Math.min(deadline,started+Math.min(5000,maxMs*.08));
   const prior=incumbents.filter(item=>item.count===count).sort((a,b)=>a.state.t-b.state.t).slice(0,1);
   for(const item of prior)await compareResearchOrders(raw,item,orderDeadline,control);
  }
  if(!incumbents.length&&!cancelled()&&options.returnComparisons!==true&&!options.disableEarningsAdaptation){
   const adaptationDeadline=Math.min(started+maxMs*.05,started+4500);
   const adapted=EarningsIncumbents.adapt(raw,options.incumbent,{prepare,replay,checkpoint:()=>{if(cancelled()||Date.now()>=adaptationDeadline)throw Error('Earnings schedule comparison interrupted');}});
   for(const item of adapted)if(item.count===count){control.context=item.context;control.route=item.route;control.consider(item.state);control.earningsAdaptations++;}
  }
  const contexts=[];
  // Exclude impossible proposals before dividing CPU time; otherwise routes
  // that cannot satisfy fuel/floors consume a share of every earlier slice.
  for(const route of routeOptions){try{const {s:initial,c}=prepare(raw,route,count),report=F.assess(initial,c);if(report.impossible)throw Error(F.message(report,c));contexts.push({route,initial,c});}catch(e){lastError=e.message;}}
  searchContexts.push(...contexts.map(item=>({...item,count})));
  const sampled=new Set();
  if(options.returnComparisons!==true&&!options.disableLegacyBaseline&&!options.disableOpeningPortfolio&&maxMs>=5000){
   // Reserve a shared opening portfolio BEFORE the thin route beams. One
   // expensive first candidate must not hide every other C1/K1 combination.
   // Both physical orders get the same trials, interleaved for fairness.
   const openings=(Strategy.automatic(raw.plan||{})?contexts.filter(x=>Staged.supportsFixed(x.initial,x.c)&&x.route.at(-1)==='integrity').slice(0,2):contexts.slice(0,1));
   const openingDeadline=Math.min(deadline,started+maxMs*.4);
   const reference=Schedules.earningReference(raw),item=openings[0];
   if(reference&&item&&!options.disableScheduleProposals&&Date.now()<openingDeadline){
    const proposed=prepare(reference,item.route,count),opening={};
    control.context=item.c;control.route=item.route;
    for(const [c1MaxMinutes,k1MaxMinutes] of [[180,180],[180,120]]){
     if(cancelled()||Date.now()>=openingDeadline)break;
     try{
      const check=()=>{if(cancelled()||Date.now()>=openingDeadline)throw Error('Schedule proposal interrupted');};
      const candidate=Staged.supportsFixed(proposed.s,proposed.c)?Staged.run(proposed.s,{...proposed.c,enforceOpeningCaps:true,c1MaxMinutes,k1MaxMinutes,batchOffline:proposed.c.earningsMode==='offline',batchMode:'all-waits'},count,L.completionGoals,check,{opening}):seedRoute(proposed.s,proposed.c,{research:c1MaxMinutes,vehicles:k1MaxMinutes},check);
      if(!candidate)continue;
      const actions=S.history(candidate);for(const [key,slots] of Object.entries(S.recordedArtifactSets(actions))){
       if(item.c.loadouts[key]&&JSON.stringify(item.c.loadouts[key])!==JSON.stringify(slots))throw Error('Proposed artifact snapshot conflicts with actual gear.');
       item.c.loadouts[key]=slots;item.c.mods[key]=S.modifiers(slots);
      }
      for(const compress of [false,true]){
       if(cancelled()||Date.now()>=openingDeadline)break;
       const executed=Schedules.execute(item.initial,item.c,actions,{compress,checkpoint:()=>{if(cancelled()||Date.now()>=openingDeadline)throw Error('Schedule execution interrupted');}});
       if(!executed)continue;
       const checked=S.history(executed).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:VERSION,sequence:item.route,researchSales:count}});
       replay(raw,checked);control.conservativeComparisons++;control.consider(executed);
      }
     }catch{}
     await control.yield();
    }
   }
   const openingCaches=new Map();
   for(const [c1MaxMinutes,k1MaxMinutes] of [[180,180],[180,120],[60,60],[30,30],[60,180],[180,60],[300,300]])for(const item of openings){
    if(cancelled()||Date.now()>=openingDeadline)break;
    control.context=item.c;control.route=item.route;
    progress({phase:'route-search',stage:'Opening',phaseLabel:'Comparing research, habs, and vehicles',explored:control.explored,elapsedMs:Date.now()-started});await control.yield();
    try{
     let cache=openingCaches.get(item);if(!cache){cache=new Map();openingCaches.set(item,cache);}
     const opening=cache.get(c1MaxMinutes)||{};cache.set(c1MaxMinutes,opening);
     const check=()=>{if(cancelled()||Date.now()>=openingDeadline)throw Error('Opening portfolio interrupted');};
     const candidate=Staged.supportsFixed(item.initial,item.c)?Staged.run(item.initial,{...item.c,enforceOpeningCaps:true,c1MaxMinutes,k1MaxMinutes,batchOffline:item.c.earningsMode==='offline',batchMode:'all-waits'},count,L.completionGoals,check,{opening}):seedRoute(item.initial,item.c,{research:c1MaxMinutes,vehicles:k1MaxMinutes},check,control.checkpoints);
     if(!candidate)continue;
     control.openingComparisons++;control.consider(candidate);sampled.add(item);
     if(c1MaxMinutes===180&&k1MaxMinutes===120&&!options.disableResearchBreakpoints){
      progress({phase:'route-search',stage:'Opening',phaseLabel:'Comparing research breakpoints before cash waits',explored:control.explored,elapsedMs:Date.now()-started});
      // Use this actual paid opening, not a different route's global winner.
      await compareResearchBreakpoints(raw,{...item,state:candidate},count,openingDeadline,control);
     }
    }catch{}
   }
  }
  for(const item of contexts){
   if(cancelled())break;
   const {route,initial,c}=item;
   control.context=c;control.route=route;control.routesCompared++;
   if(retained&&JSON.stringify(retained.route)===JSON.stringify(route)){Object.assign(c.loadouts,retained.context.loadouts);Object.assign(c.mods,retained.context.mods);control.consider(retained.state);}
   if(S.reached(initial,c)){control.consider(initial);continue;}
   const routeDeadline=Math.min(deadline,Date.now()+Math.max(1,(deadline-Date.now())/(contexts.length-contexts.indexOf(item))));
   // The old stage recipe is only a feasible baseline when the route matches.
   // It never substitutes a route, sets visit limits on the new search, or
   // seeds from an earlier saved plan. General routes need no stage recipe.
   if(!sampled.has(item)&&!options.disableLegacyBaseline&&Staged.supportsFixed(initial,c)&&Date.now()<routeDeadline){
    const baselineDeadline=Math.min(routeDeadline,Date.now()+Math.max(1,(routeDeadline-Date.now())*.35));
    let firstBaseline=true;
    for(const [c1MaxMinutes,k1MaxMinutes] of [[180,180],[60,60],[30,30],[300,300],[60,180],[180,60]]){
     if(cancelled()||Date.now()>=baselineDeadline)break;
     const candidateDeadline=firstBaseline?routeDeadline:baselineDeadline;firstBaseline=false;
     const cache={};
     for(const saleCount of options.returnComparisons===true?[count]:[3,1,2])try{const baseline=Staged.run(initial,{...c,enforceOpeningCaps:true,c1MaxMinutes,k1MaxMinutes,batchOffline:c.earningsMode==='offline',batchMode:'all-waits'},saleCount,L.completionGoals,()=>{if(cancelled()||Date.now()>candidateDeadline)throw Error('Baseline interrupted');},cache);control.consider(baseline);}catch{}
    }
   }
   if(!sampled.has(item)&&!Staged.supportsFixed(initial,c)&&Date.now()<routeDeadline){
    const seedDeadline=Date.now()+Math.max(1,(routeDeadline-Date.now())*.55);
    for(const minutes of [180,60,30]){
     if(cancelled()||Date.now()>=seedDeadline)break;
     try{control.consider(seedRoute(initial,c,minutes,()=>{if(cancelled()||Date.now()>seedDeadline)throw Error('Candidate interrupted');},control.checkpoints));}catch(e){lastError=e.message;}
    }
   }
   let beam=[initial];
   for(let stage=0;stage<c.sequence.length&&beam.length;stage++){
    if(cancelled())break;
    progress({phase:'route-search',researchSales:count,stage:phase(beam[0],c),explored:control.explored,elapsedMs:Date.now()-started,bestSeconds:best?best.t-c.start:null,routeIndex:control.routesCompared,phaseLabel:'Purchases and departure timing',...(options.diagnostics?{beam:beam.map(n=>({t:(n.t-c.start)/86400,levels:n.r.reduce((a,b)=>a+b,0),rate:S.stats(n,c).delivery,income:S.stats(n,c).earning,h:n.h,vehicles:n.v.filter(v=>v.id!==null).length}))}:{})});await control.yield();
    const remainingWeight=c.sequence.slice(stage).reduce((sum,_,i)=>sum+visitWeight(c,stage+i),0);
    const stageDeadline=Date.now()+Math.max(1,(routeDeadline-Date.now())*visitWeight(c,stage)/remainingWeight),expanded=[];
    for(let i=0;i<beam.length;i++){
     const n=beam[i];if(complete(n,c)){control.consider(n);continue;}
     control.consider(L.finishHere(n,c));const tail=finish(n,c);if(tail)control.consider(tail);
     const stateDeadline=Date.now()+Math.max(1,(stageDeadline-Date.now())/(beam.length-i));
     const departures=!S.reached(n,c)&&Date.now()<stageDeadline?await visit(n,c,stateDeadline,control):[n];
     for(const departure of departures){
      control.consider(departure);control.consider(L.finishHere(departure,c));const completed=finish(departure,c);if(completed)control.consider(completed);
      if(stage+1<c.sequence.length&&!complete(departure,c))try{const next=S.buy(departure,c,{type:'shift',egg:c.sequence[stage+1]});expanded.push(tag(next,departure.path,phase(next,c)));}catch(e){lastError=e.message;}
     }
    }
    beam=prune(expanded,c,width);
   }
  }
  if(best){retained={state:best,route:bestRoute,context:bestContext};const plan=finalize(raw,best,bestContext,bestRoute,count,control,cancelled()?'cancelled with best plan':Date.now()>=deadline?'computation budget reached':'route comparison complete');entries.push({researchSales:count,status:'complete',plan});if(better(best,overall)){overall=best;recommended=count;}}
  else entries.push({researchSales:count,status:cancelled()?'not-completed':'unavailable',error:lastError||'No feasible plan found within the route and search budget. This is not proof that the route is impossible.'});
 }
 // Refine completed alternatives with a reserved budget. Thin per-route
 // beams must not consume all CPU before a costly opening can be compared
 // with shifting earlier and doing its remaining research after K/I.
 if(options.returnComparisons!==true&&!cancelled()){
  const alternatives=[...byShift.values()].sort((a,b)=>better(a.state,b.state)?-1:better(b.state,a.state)?1:0).slice(0,3);
  for(let i=0;i<alternatives.length;i++){
   const item=alternatives[i];if(Date.now()>=started+maxMs*.95||cancelled())break;
   const {s:initial}=prepare(raw,item.route,item.count),c=item.context;
   control.context=c;control.route=item.route;
   const actions=S.history(item.state),prefixes=openingDepartures(initial,c,actions);
   const share=i===0&&alternatives.length>1?.6:1/(alternatives.length-i);
   const refineDeadline=Date.now()+Math.max(1,(started+maxMs*.95-Date.now())*share);
   if(!options.disableResearchOrder){
    progress({phase:'route-search',stage:'Research order',phaseLabel:'Comparing earnings-first Curiosity research',explored:control.explored,elapsedMs:Date.now()-started});
    await compareResearchOrders(raw,item,Math.min(refineDeadline,Date.now()+Math.max(1,(refineDeadline-Date.now())*.25)),control);
    control.context=c;control.route=item.route;
   }
   progress({phase:'route-search',stage:phase(initial,c),phaseLabel:'Comparing complete departure continuations',explored:control.explored,elapsedMs:Date.now()-started,bestSeconds:Math.min(...[...byShift.values()].map(x=>x.state.t-c.start)),routeIndex:control.routesCompared});
   const investment=!options.disableInvestmentRefinement,remaining=refineDeadline-Date.now();
   const openingDeadline=investment?Date.now()+Math.max(1,remaining*.2):control.lookahead?Date.now()+Math.max(1,remaining*.65):refineDeadline;
   await compareDepartures(prefixes,c,openingDeadline,control);
   if(investment&&Date.now()<refineDeadline&&!cancelled()){
    let current=byShift.get(item.state.stage)||item;control.context=current.context;control.route=current.route;
    let fresh=prepare(raw,current.route,current.count,{artifactReplay:true,artifactSets:current.context.loadouts});
    const physical=physicalPrefixes(fresh.s,current.context,S.history(current.state));
    const physicalDeadline=Date.now()+Math.max(1,(refineDeadline-Date.now())*.4);
    progress({phase:'route-search',stage:'Investments',phaseLabel:'Comparing hab and fleet departure timing',elapsedMs:Date.now()-started,explored:control.explored});
    await comparePhysicalInvestments(physical,current.context,physicalDeadline,control);
    current=byShift.get(item.state.stage)||item;control.context=current.context;control.route=current.route;
    fresh=prepare(raw,current.route,current.count,{artifactReplay:true,artifactSets:current.context.loadouts});
    const research=researchPrefixes(fresh.s,current.context,S.history(current.state));
    const deliveryDeadline=control.lookahead?Date.now()+Math.max(1,(refineDeadline-Date.now())*.85):refineDeadline;
    progress({phase:'route-search',stage:'Delivery',phaseLabel:'Comparing final research and delivery gear',elapsedMs:Date.now()-started,explored:control.explored});
    await compareDeliveryResearch(research,current.context,deliveryDeadline,control);
   }
   if(control.lookahead&&Date.now()<refineDeadline&&!cancelled()){
    // Use the current winner after departure refinement, not an outdated
    // purchase path. Replay only this search's paid actions into checkpoints.
    const current=byShift.get(item.state.stage)||item;control.context=current.context;control.route=current.route;
    const fresh=prepare(raw,current.route,current.count,{artifactReplay:true,artifactSets:current.context.loadouts});
    const research=researchPrefixes(fresh.s,current.context,S.history(current.state));
    progress({phase:'route-search',stage:'Research',phaseLabel:'Comparing research unlock chains',elapsedMs:Date.now()-started,explored:control.explored});
    await comparePurchaseChains(research,current.context,refineDeadline,control);
   }
  }
  // Recover missing neighboring shift counts before returning comparisons.
  // A thin beam failing to find one is not evidence that it is impossible.
  const highest=Math.max(...byShift.keys()),missing=[highest-1,highest-2].filter(n=>n>=0&&!byShift.has(n));
  if(missing.length){
   const sources=[...new Set([...byShift.values(),...byRoute.values()])].sort((a,b)=>a.state.stage-b.state.stage||(better(a.state,b.state)?-1:1));
   for(const item of sources){
    const pending=missing.filter(n=>!byShift.has(n));if(cancelled()||!pending.length)break;control.context=item.context;control.route=item.route;
    try{for(const end of completionAlternatives(raw,item,pending,()=>{if(cancelled()||Date.now()>=started+maxMs)throw Error('Completion comparison interrupted');})){control.consider(end);}}
    catch{}
   }
   // A completed long route may require its last H for ships, so it cannot
   // supply every shorter comparison. Give missing counts a fresh paid build
   // on their own proposed route instead of treating a beam miss as impossible.
   for(const shifts of missing){
    if(byShift.has(shifts)||cancelled()||Date.now()>=started+maxMs)continue;
    const candidates=searchContexts.filter(x=>x.route.length-1===shifts||x.route.length-2===shifts)
     .sort((a,b)=>Math.abs(a.route.length-1-shifts)-Math.abs(b.route.length-1-shifts));
    for(const item of candidates){
     if(byShift.has(shifts)||cancelled()||Date.now()>=started+maxMs)break;
     control.context=item.c;control.route=item.route;
     try{
      const end=seedRoute(item.initial,item.c,180,()=>{if(cancelled()||Date.now()>=started+maxMs)throw Error('Missing-count build interrupted');},control.checkpoints);
      control.recoveryComparisons++;if(end)control.consider(end);
      if(end&&!byShift.has(shifts))for(const shorter of completionAlternatives(raw,{state:end,context:item.c,route:item.route,count:item.count},[shifts],()=>{if(cancelled()||Date.now()>=started+maxMs)throw Error('Missing-count tail interrupted');}))control.consider(shorter);
     }catch{}
    }
   }
  }
 }
 if(!recommended)throw Error(entries.find(e=>e.error)?.error||'No feasible plan found within the route and search budget.');
 if(options.returnComparisons!==true){
  const top=[...byShift.values()].sort((a,b)=>better(a.state,b.state)?-1:better(b.state,a.state)?1:0).slice(0,3);
  if(!cancelled()){
   // Keep the main search budget intact; cap final comfort comparisons at 5 s.
   const comfortDeadline=Date.now()+Math.min(5000,maxMs*.05);
   progress({phase:'route-search',stage:'Silos',phaseLabel:'Checking extra silo coverage without delaying completion',elapsedMs:Date.now()-started,explored:control.explored});
   for(const item of top){
    if(cancelled()||Date.now()>=comfortDeadline)break;
    const fresh=prepare(raw,item.route,item.count,{artifactReplay:true,artifactSets:item.context.loadouts});
    item.state=Comfort.improve(fresh.s,item.context,item.state,{checkpoint:()=>{if(cancelled()||Date.now()>=comfortDeadline)throw Error('Silo comfort comparison interrupted');}});
    await control.yield();
   }
   top.sort((a,b)=>better(a.state,b.state)?-1:better(b.state,a.state)?1:0);
  }
  const shiftPlans=top.map(item=>({switches:item.state.stage,plan:finalize(raw,item.state,item.context,item.route,item.count,control,cancelled()?'cancelled with best plans':'route comparison complete')}));
  return ShiftPlans.select({shiftPlans,recommendedSwitches:shiftPlans[0].switches},shiftPlans[0].switches);
 }
 const chosen=Plans.select({researchSalePlans:entries,recommendedResearchSales:recommended},recommended);
 return chosen;
}
module.exports={VERSION,recipe,seedRoute,openingDepartures,researchPrefixes,physicalPrefixes,compareResearchBreakpoints,comparePhysicalInvestments,compareDeliveryResearch,compareResearchOrders,deliveryPotential,compareDepartures,comparePurchaseChains,completionAlternatives,unlockDepartures,better,routes,presetRoutes,prepare,saleDeadline,scored,projected,dominates,prune,replay,solve};
