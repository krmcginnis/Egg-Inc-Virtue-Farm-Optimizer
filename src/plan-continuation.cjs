'use strict';
const S=require('./simulator.cjs'),P=require('./plan-progress.cjs'),R=require('./route-solver.cjs'),O=require('./optimizer.cjs');
const Ships=require('./ships.cjs'),L=require('./optimizer-legacy.cjs'),Strategy=require('./planning-strategy.cjs'),ShiftPlans=require('./shift-plans.cjs');
const Artifacts=require('./artifact-optimizer.cjs');
const RunShifts=require('./run-shifts.cjs');
const paid=new Set(['research','hab','vehicle','car','silo','set']);
function restoreArtifactSet(action,c){
 if(c.loadouts[action.set])return;
 // Automatic sets have immutable content names, generated only when a search
 // visits that branch. A fresh continuation has not registered those names yet.
 // Recover the recorded gear, checking today's inventory rather than assuming
 // that every artifact and stone from the original plan is still available.
 const recorded=S.recordedArtifactSets([action])[action.set];
 if(!recorded)throw Error('The original artifact setup is unavailable in this snapshot.');
 const slots=S.validateLoadout(recorded,c.pro?4:2);
 let available;
 if(c.artifactModel){
  const artifacts=new Map(),stones=new Map();
  for(const item of c.artifactModel.inventory){
   if(item.kind==='stone')stones.set(item.id,(stones.get(item.id)||0)+item.quantity);
   else{artifacts.set(item.id,(artifacts.get(item.id)||0)+item.quantity);for(const id of item.stones)stones.set(id,(stones.get(id)||0)+item.quantity);}
  }
  available=slots.filter(slot=>slot.artifactId).every(slot=>{
   const count=artifacts.get(slot.artifactId)||0;artifacts.set(slot.artifactId,count-1);if(count<1)return false;
   return slot.stones.filter(Boolean).every(id=>{const count=stones.get(id)||0;stones.set(id,count-1);return count>=1;});
  });
 }else{
  // Manual farms allow their configured sets, including equivalent slot and
  // socket orderings, without adding unconfigured gear from an older plan.
  const key=loadout=>Artifacts.signature(loadout.filter(slot=>slot.artifactId).map(slot=>({artifactId:slot.artifactId,stones:slot.stones.filter(Boolean).slice().sort()})).sort((a,b)=>a.artifactId.localeCompare(b.artifactId)));
  available=Object.values(c.loadouts).some(loadout=>key(loadout)===key(slots));
 }
 if(!available)throw Error('The original artifact setup needs artifacts or stones that are unavailable in this snapshot.');
 c.loadouts[action.set]=slots;c.mods[action.set]=S.modifiers(slots);
}
// Other saved alternatives are search seeds. The selected plan, checked farm
// and progress remain authoritative; retain compatibility with saved proposals.
function sourceKey(request){return JSON.stringify([request.config,request.result.start,request.result.end,request.result.target,request.result.actions,request.progress]);}
function prepare(request,{now=Date.now()/1000,budget=null}={}){
 const {config:original,result,progress}=request;
 if(!progress?.snapshot)throw Error('Check this plan with a current farm snapshot before reoptimizing.');
 const matched=progress.planKey===P.key(result),confirmed=matched&&Array.isArray(progress.confirmed)?progress.confirmed:[],launched=matched?(progress.launched||{}):{};
 const report=P.compare(original,result,progress.snapshot,{confirmed,launched,now});
 if(report.status!=='matched')throw Error('The snapshot does not match this plan. Check a current farm from the same ascension before reoptimizing.');
 const start=S.number(request.start??now,'Remaining plan start',1);
 if(start<now-300)throw Error('The remaining search must start at the current PC time. Check the farm again before reoptimizing.');
 if(report.time&&report.time>start+1)throw Error('The backup time is ahead of the PC clock. Sync the game and check the time before reoptimizing.');
 const prior=original.plan.continuation;
 const run=RunShifts.status(original);
 const totalShiftBudget=S.number(budget?.total??prior?.totalShiftBudget??run?.record.totalShiftBudget??result.switches??result.actions.filter(a=>a.type==='shift').length,'Original shift budget',0,Number.MAX_SAFE_INTEGER,true);
 const alreadyUsed=S.number(budget?.usedBefore??prior?.consumedShifts??run?.used??0,'Already used shifts',0,totalShiftBudget,true);
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
 const current=structuredClone(progress.snapshot),automatic=Strategy.automatic(original.plan),slots=original.plan.ships?.slots??3;
 let launchVisits=remaining.map(run=>({missions:run.missions})),consolidatedLaunchVisits=false;
 if(remaining.length===2&&route.filter(egg=>egg==='humility').length===1){
  const missions=[];for(const m of remaining.flatMap(run=>run.missions)){const last=missions.at(-1);if(last?.ship===m.ship&&last.duration===m.duration)last.count+=m.count;else missions.push({...m});}
  try{
   Ships.prepare(current.farm,{ships:{mode:'custom-two-visits',slots,visits:[{missions},{missions:[]}]}},S.number);
   launchVisits=[{missions}];consolidatedLaunchVisits=true;
  }catch(e){if(!automatic)throw Error('Unlaunched ships remain from an earlier Humility visit and cannot all fit in the one remaining launch visit: '+e.message+' Add another H to the remaining route or use Automatic Planning within the remaining shift budget.');}
 }
 if(remaining.length&&remainingShiftBudget===0&&report.egg!==2)throw Error('Ships still need to launch, but no shifts remain to reach Humility. Review the launch counts and shift allowance.');
 // A completed current H is not a launch opportunity when the remaining fuel
 // must be collected on the way to the next H. Keep that empty visit explicit.
 if(report.egg===2&&launchVisits.length===1&&remaining[0]?.stage>report.stage&&route.slice(1).includes('humility')){
  const next=Ships.prepare(current.farm,{ships:{mode:'custom-two-visits',slots,visits:[launchVisits[0],{missions:[]}]}},S.number);
  if(next.targets.some((amount,i)=>amount>next.stored[i]+Math.max(1,amount)*1e-12))launchVisits=[{missions:[]},launchVisits[0]];
 }
 const config={...current,plan:{...structuredClone(original.plan),start,target:result.target,solverVersion:2,strategyVersion:2,maxShifts:remainingShiftBudget,maxSwitches:remainingShiftBudget,sequence:route,autoSequence:automatic,ships:remaining.length?{mode:'custom-two-visits',slots,visits:[0,1].map(i=>({missions:launchVisits[i]?.missions||[]}))}:{mode:'none'},continuation:{version:1,totalShiftBudget,consumedShifts,remainingShiftBudget,snapshotTime:report.time}}};
 if(current.runShifts||run)config.runShifts=RunShifts.create(config,consumedShifts,totalShiftBudget);
 delete config.draftInputs;
 // Keep the exact target, floors, sleep/display zone and account/farm values.
 // No completed purchase, past income, fuel transfer or launch is simulated again.
 S.prepare(config);
 return {config,report,route,runs,consolidatedLaunchVisits,remainingLaunches:remaining.reduce((n,r)=>n+r.remaining,0),totalShiftBudget,consumedShifts,remainingShiftBudget,sourceKey:sourceKey(request),originalEnd:result.end,snapshotTime:report.time};
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
 if(n.egg===2&&c.ships.mode==='custom-two-visits'&&c.ships.enabled&&c.ships.runs[0].count===0)n=Ships.launch(n,context);
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
   if(a.type==='set')restoreArtifactSet(a,c);
   const ready=S.afford(n,context,a);if(!ready)throw Error('A remaining purchase cannot be funded on the original route.');n=S.buy(ready,context,a);
  }else throw Error('Unsupported remaining action: '+a.type);
 }
 if(!S.reached(n,c)){const end=L.tail(n,c);if(!end)throw Error('The original route cannot finish within its remaining shift budget.');n=end;}
 return packageState(config,n,c,route);
}
function visits(raw,result,through){return [raw.farm.virtue,...result.actions.filter(a=>a.type==='shift').slice(0,through).map(a=>S.EGGS[a.egg])];}
function launchRows(result){let stage=0;return result.actions.flatMap((action,index)=>{if(action.type==='shift')stage++;return action.type==='ship-run'?[{action,index,stage}]:[];});}
function batchKey(action){return JSON.stringify(action.batches?.map(b=>[b.ship,b.duration,b.count]));}
function alternativeProgress(request,plan,stage){
 const source=launchRows(request.result).filter(r=>r.stage<=stage),target=launchRows(plan).filter(r=>r.stage<=stage),progress=request.progress;
 const launched={};
 for(let i=0;i<Math.max(source.length,target.length);i++){
  const a=source[i],b=target[i];
  // Past launch reviews are meaningful only for the same visited H and
  // ordered mission batches. Never borrow counts from a future/different H.
  if(!a||!b||a.stage!==b.stage||batchKey(a.action)!==batchKey(b.action))throw Error('Saved alternative has incompatible reviewed launch batches.');
  const counts=progress.confirmed?.includes(a.index)?a.action.batches.map(x=>x.count):progress.launched?.[a.index];
  if(!Array.isArray(counts))throw Error('Saved alternative needs an independent launch review.');
  launched[b.index]=counts.slice();
 }
 return {snapshot:progress.snapshot,confirmed:[],launched,planKey:P.key(plan)};
}
function alternatives(request,prepared,{checkpoint=()=>{}}={}){
 const output=[];
 try{ShiftPlans.validate(request.result);}catch{return output;}
 const selected=request.result.selectedSwitches??request.result.switches;
 for(const entry of request.result.shiftPlans||[]){
  try{checkpoint();}catch{break;}if(entry.switches===selected)continue;
  try{
   const plan=verified(request.config,entry.plan);
   if(plan.target!==request.result.target||JSON.stringify(visits(request.config,plan,prepared.report.stage))!==JSON.stringify(visits(request.config,request.result,prepared.report.stage)))continue;
   const progress=alternativeProgress(request,plan,prepared.report.stage),other=prepare({...request,result:plan,progress},{now:request.start,budget:{total:prepared.totalShiftBudget,usedBefore:prepared.consumedShifts-prepared.report.stage}});
   if(other.remainingShiftBudget!==prepared.remainingShiftBudget||other.consumedShifts!==prepared.consumedShifts||JSON.stringify(other.config.plan.ships)!==JSON.stringify(prepared.config.plan.ships))continue;
   // The shared farm/target/mission context stays authoritative. Automatic
   // alternatives may have their own suffix; fixed user routes remain fixed.
   const candidate=baseline({...other,config:prepared.config},{checkpoint});
   output.push({sourceSwitches:entry.switches,remainingSwitches:candidate.switches,end:candidate.end,plan:candidate});
  }catch{try{checkpoint();}catch{break;}}
 }
 return output;
}
async function search(request,options={},progress=()=>{},cancelled=()=>false){
 const prepared=prepare(request),deadline=Math.min(options.absoluteDeadline??Infinity,Date.now()+Math.min(5000,Math.max(100,Number(options.maxMs??90000)*.1)));
 progress({phase:'route-search',stage:'Original Route',explored:0,bestSeconds:null});
 let originalRoute=null,baselineError='';
 try{originalRoute=baseline(prepared,{checkpoint:()=>{if(cancelled()||Date.now()>deadline)throw Error('Original route comparison interrupted.');}});}catch(e){baselineError=e.message;}
 let retained=[];
 if(!options.disableSavedAlternatives)try{retained=alternatives(request,prepared,{checkpoint:()=>{if(cancelled()||Date.now()>deadline)throw Error('Saved alternative comparison interrupted.');}});}catch{}
 const result=await O.solve(prepared.config,{...options,incumbent:originalRoute?{config:prepared.config,result:originalRoute}:undefined,incumbents:retained.map(x=>({config:prepared.config,result:x.plan}))},progress,cancelled);
 const checked=verified(prepared.config,result);
 if(originalRoute&&checked.end>originalRoute.end+.01)throw Error('The remaining search discarded its validated original-route candidate.');
 return {...prepared,report:undefined,result:checked,baseline:originalRoute,baselineError,retainedAlternatives:retained.map(({plan,...summary})=>summary)};
}
module.exports={prepare,baseline,verified,search,alternatives,sourceKey};
