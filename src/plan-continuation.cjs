'use strict';
const S=require('./simulator.cjs'),P=require('./plan-progress.cjs'),R=require('./route-solver.cjs'),O=require('./optimizer.cjs');
const Ships=require('./ships.cjs'),L=require('./optimizer-legacy.cjs'),Strategy=require('./planning-strategy.cjs'),ShiftPlans=require('./shift-plans.cjs');
const paid=new Set(['research','hab','vehicle','car','silo','set']);
function sourceKey(request){return JSON.stringify([request.config,request.result.start,request.result.end,request.result.target,request.result.actions,request.progress]);}
function prepare(request,{now=Date.now()/1000}={}){
 const {config:original,result,progress}=request;
 if(!progress?.snapshot)throw Error('Check this plan with a current farm snapshot before reoptimizing.');
 const matched=progress.planKey===P.key(result),confirmed=matched&&Array.isArray(progress.confirmed)?progress.confirmed:[],launched=matched?(progress.launched||{}):{};
 const report=P.compare(original,result,progress.snapshot,{confirmed,launched,now});
 if(report.status!=='matched')throw Error('The snapshot does not match this plan. Check a current farm from the same ascension before reoptimizing.');
 const start=S.number(request.start??now,'Remaining plan start',1);
 if(start<now-300)throw Error('The remaining search must start at the current PC time. Check the farm again before reoptimizing.');
 if(report.time&&report.time>start+1)throw Error('The backup time is ahead of the PC clock. Sync the game and check the time before reoptimizing.');
 const prior=original.plan.continuation;
 const totalShiftBudget=S.number(prior?.totalShiftBudget??result.switches??result.actions.filter(a=>a.type==='shift').length,'Original shift budget',0,30,true);
 const alreadyUsed=S.number(prior?.consumedShifts??0,'Already used shifts',0,totalShiftBudget,true);
 const consumedShifts=alreadyUsed+report.stage,remainingShiftBudget=totalShiftBudget-consumedShifts;
 if(remainingShiftBudget<0)throw Error('The farm has already used the original plan’s shift budget.');
 const route=[S.EGGS[report.egg],...report.rows.filter(row=>row.stage>report.stage&&row.action.type==='shift').map(row=>S.EGGS[row.action.egg])];
 const runs=[];
 for(const row of report.rows.filter(row=>row.action.type==='ship-run')){
  const a=row.action;
  if(!Array.isArray(a.batches)||a.batches.length>8||a.batches.reduce((n,b)=>n+b.count,0)!==a.count)throw Error('The saved launch batches need review before continuing.');
  let counts=confirmed.includes(row.index)?a.batches.map(b=>b.count):launched[row.index];
  if(counts!==undefined&&(!Array.isArray(counts)||counts.length!==a.batches.length||counts.some((n,i)=>!Number.isInteger(n)||n<0||n>a.batches[i].count)))throw Error('Already-launched counts must be whole numbers between zero and the planned batch count.');
  if(row.stage<=report.stage&&counts===undefined)throw Error('Confirm already-launched counts for '+(a.phase||'Humility visit '+(a.visit||runs.length+1))+' before reoptimizing. Include active flights and earlier launches.');
  if(row.stage>report.stage&&counts?.some(n=>n>0))throw Error('A later Humility visit cannot already have launched ships. Check the visit and launch counts.');
  counts=counts||a.batches.map(()=>0);
  const missions=a.batches.map((b,i)=>({ship:b.ship,duration:b.duration,count:b.count-counts[i]})).filter(m=>m.count>0);
  runs.push({index:row.index,stage:row.stage,label:a.phase||'H'+(a.visit||runs.length+1),missions,launched:counts.reduce((n,x)=>n+x,0),remaining:missions.reduce((n,m)=>n+m.count,0)});
 }
 const remaining=runs.filter(run=>run.remaining>0);
 if(remaining.length>2)throw Error('Use at most two remaining Humility launch visits.');
 const current=structuredClone(progress.snapshot),config={...current,plan:{...structuredClone(original.plan),start,target:result.target,solverVersion:2,strategyVersion:2,maxShifts:remainingShiftBudget,maxSwitches:remainingShiftBudget,sequence:route,autoSequence:Strategy.automatic(original.plan),ships:remaining.length?{mode:'custom-two-visits',slots:original.plan.ships?.slots??3,visits:[0,1].map(i=>({missions:remaining[i]?.missions||[]}))}:{mode:'none'},continuation:{version:1,totalShiftBudget,consumedShifts,remainingShiftBudget,snapshotTime:report.time}}};
 delete config.draftInputs;
 // Keep the exact target, floors, sleep/display zone and account/farm values.
 // No completed purchase, past income, fuel transfer or launch is simulated again.
 S.prepare(config);
 return {config,report,route,runs,remainingLaunches:remaining.reduce((n,r)=>n+r.remaining,0),totalShiftBudget,consumedShifts,remainingShiftBudget,sourceKey:sourceKey(request),originalEnd:result.end,snapshotTime:report.time};
}
function verified(config,result){
 return ShiftPlans.replay(config,result,(raw,plan)=>{
  const {s,c}=O.replay(raw,plan.actions,true,{enforceOpeningCaps:plan.openingTimeLimits===true,oneStartingSilo:plan.initialSiloRule==='one'});
  if(s.stage>config.plan.maxShifts||Math.abs(s.t-plan.end)>.01||plan.target!==c.target)throw Error('Remaining plan failed its target, time or shift-budget replay.');
  return {...plan,actions:S.history(s),start:c.start,end:s.t,seconds:s.t-c.start,switches:s.stage,soulCost:s.lost,researchDeadline:c.researchDeadline??plan.researchDeadline,finalTE:S.teByEgg(s,c),pendingTE:S.totalTE(s,c)-c.claimedTotal,finalCash:s.cash,finalStats:S.stats(s,c),validatedReplay:true};
 });
}
function packageState(config,state,c,route){
 let actions=S.history(state);if(!actions.length)actions=[{type:'wait',t:c.start,end:c.start,egg:state.egg,reason:'Target already reached',earningsMode:'online'}];
 actions=actions.map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:route,researchSales:3}});
 return verified(config,{version:1,solverVersion:2,initialSiloRule:'one',openingTimeLimits:false,target:c.target,start:c.start,end:state.t,seconds:state.t-c.start,switches:state.stage,actions,route,researchSales:3,researchDeadline:c.researchDeadline,method:'Original remaining route, paid and retimed from the checked farm',termination:'Original route continuation',explored:0,frontier:[]});
}
function baseline(prepared,{checkpoint=()=>{}}={}){
 const {config,route,report,runs}=prepared;
 if(runs.some(run=>run.stage<report.stage&&run.remaining>0))throw Error('An earlier visit has unlaunched ships; completing them requires a different remaining route.');
 const {s,c}=R.prepare(config,route,3);let n=s;
 const context={...c,shipReplay:true,sleepReplay:false,deferShips:true};
 for(const row of report.rows.filter(row=>row.stage>=report.stage)){
  checkpoint();if(S.reached(n,c))break;
  const a=row.action;
  if(a.type==='shift'&&row.stage===report.stage)continue; // Arrival is already reflected in the snapshot.
  if(a.type==='wait'){
   // Funding, interaction and sleep waits are recomputed by real purchases.
   // Retain future event-aligned departures; delivery is allocated from the
   // current paid farm, rather than replaying eggs already earned.
   if(/^(Collect .*Truth Egg|Deliver enough eggs)/.test(a.reason||'')){const end=L.tail(n,c);if(!end)throw Error('The original route cannot finish from this farm.');n=end;break;}
   if(c.calendar.some(e=>Number.isFinite(e.t)&&Math.abs(e.t-a.end)<.01)&&a.end>n.t)n=S.advance(n,c,a.end,a.reason,true,'auto');
   continue;
  }
  if(paid.has(a.type)&&['present','superseded'].includes(row.status))continue;
  if(a.type==='research'){
   while(n.r[a.i]<a.to){checkpoint();const ready=S.afford(n,context,{type:'research',i:a.i});if(!ready)throw Error('Remaining research cannot be funded on the original route.');n=S.buy(ready,context,{type:'research',i:a.i});}
  }else if(a.type==='silo'){
   while(n.silos<row.siloTarget){checkpoint();const ready=S.afford(n,context,{type:'silo'});if(!ready)throw Error('Remaining silos cannot be funded on the original route.');n=S.buy(ready,context,{type:'silo'});}
  }else if(a.type==='fuel'){
   if(!c.ships.enabled||n.shipsDone)continue;
   n=Ships.trim(n,context);const amount=Math.max(0,Ships.collectionTargets(n,c)[n.egg]-n.fuel[n.egg]);if(amount>Math.max(1,Ships.collectionTargets(n,c)[n.egg])*1e-12)n=S.buy(n,context,{type:'fuel',amount});
  }else if(a.type==='fuel-dump'){
   if(c.ships.enabled&&!n.shipsDone)n=Ships.trim(n,context);
  }else if(a.type==='ship-run'){
   if(runs.find(run=>run.index===row.index)?.remaining)n=Ships.launch(n,context);
  }else if(a.type==='ship-visit')continue;
  else if(paid.has(a.type)||a.type==='shift'){
   if(a.type==='set'&&a.set===n.set)continue;
   if(a.type==='set'&&!c.loadouts[a.set])throw Error('The original artifact setup is unavailable in this snapshot.');
   const ready=S.afford(n,context,a);if(!ready)throw Error('A remaining purchase cannot be funded on the original route.');n=S.buy(ready,context,a);
  }else throw Error('Unsupported remaining action: '+a.type);
 }
 if(!S.reached(n,c)){const end=L.tail(n,c);if(!end)throw Error('The original route cannot finish within its remaining shift budget.');n=end;}
 return packageState(config,n,c,route);
}
async function search(request,options={},progress=()=>{},cancelled=()=>false){
 const prepared=prepare(request),deadline=Date.now()+Math.min(5000,Math.max(100,Number(options.maxMs??90000)*.1));
 progress({phase:'route-search',stage:'Original Route',explored:0,bestSeconds:null});
 let originalRoute=null,baselineError='';
 try{originalRoute=baseline(prepared,{checkpoint:()=>{if(cancelled()||Date.now()>deadline)throw Error('Original route comparison interrupted.');}});}catch(e){baselineError=e.message;}
 const result=await O.solve(prepared.config,{...options,incumbent:originalRoute?{config:prepared.config,result:originalRoute}:undefined},progress,cancelled);
 const checked=verified(prepared.config,result);
 if(originalRoute&&checked.end>originalRoute.end+.01)throw Error('The remaining search discarded its validated original-route candidate.');
 return {...prepared,report:undefined,result:checked,baseline:originalRoute,baselineError};
}
module.exports={prepare,baseline,verified,search,sourceKey};
