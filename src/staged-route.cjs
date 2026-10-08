'use strict';
// Wasmegg stage proposals (source commit 9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67)
// are executed with this app's prices, permissions, interaction time and offline rules.
const S=require('./simulator.cjs'),A=require('./artifact-optimizer.cjs'),R=require('./wasmegg-stage-engine.cjs'),B=require('./offline-batch.cjs'),W=require('./waiting-objective.cjs'),Ships=require('./ships.cjs'),Route=require('./switch-sequence.cjs');
const Sleep=require('./sleep-schedule.cjs');
const fleet=['vehicle_reliablity','excoskeletons','traffic_management','egg_loading_bots','autonomous_vehicles'];
const tiers=new Map(R.allPossibleTiers.map(t=>[t.afx_id+':'+t.afx_level,t]));
function refLoadout(slots){return (slots||[]).filter(x=>x.artifactId).map(slot=>{const a=S.AMAP[slot.artifactId],t=tiers.get(a.afxId+':'+a.afxLevel);return {...slot,stones:(slot.stones||[]).slice(),artifactId:t.family.id+'-'+t.tier_number+'-'+a.rarity};});}
function objects(values){return Object.fromEntries(S.EGGS.map((e,i)=>[e,values[i]]));}
// Research ROI must predict the same owned delivery gear that H1 can equip.
// These maxed physical purchases are projections only; step() still pays for
// each actual purchase on its permitted egg. Reconsider artifact structures
// after research changes rather than freezing a previous winning structure.
function proposalDelivery(s,c,options={}){
 const n=S.clone(s),ctx={...c,epic:options.epicResearchLevels||c.epic,col:options.colleggtibleModifiers||c.col};
 if(options.commonResearch)n.r=S.D.research.map((r,i)=>options.commonResearch[r.id]??s.r[i]);
 if(options.assumeMaxHabsVehicles){
  n.h=n.h.map(()=>S.D.habs.length-1);
  const r=S.stats(n,ctx);n.v=n.v.map((v,i)=>({id:i<r.slots?S.D.vehicles.length-1:null,cars:r.trainLength}));
 }
 return refLoadout(A.bestDelivery(c.artifactModel,S.stats(n,ctx)).loadout);
}
function adapt(s,c){
 const sets=S.artifactChoices(s,c),earning=sets.reduce((a,b)=>(c.artifactModel?S.earningScore(s,c,b)>S.earningScore(s,c,a):S.stats({...s,set:b},c).earning>S.stats({...s,set:a},c).earning)?b:a,s.set),delivery=sets.reduce((a,b)=>S.stats({...s,set:b},c).delivery>S.stats({...s,set:a},c).delivery?b:a,s.set),ev=S.at(c,s.t);
 const state={currentEgg:S.EGGS[s.egg],shiftCount:s.shiftCount,te:c.claimedTotal,soulEggs:s.soul,bankValue:s.cash,habIds:s.h,vehicles:s.v.map(v=>({vehicleId:v.id,trainLength:v.cars})),researchLevels:Object.fromEntries(S.D.research.map((r,i)=>[r.id,s.r[i]])),siloCount:s.silos,tankLevel:0,artifactLoadout:refLoadout(c.loadouts[s.set]),activeArtifactSet:s.set===delivery?'elr':'earnings',artifactSets:{earnings:refLoadout(c.loadouts[earning]),elr:refLoadout(c.loadouts[delivery])},fuelTankAmounts:objects(Array(5).fill(0)),eggsDelivered:objects(s.eggs),teEarned:objects(c.claimed),population:1,lastStepTime:s.t-c.start,activeSales:{research:ev.sale===.3,hab:false,vehicle:false},earningsBoost:{active:ev.earnings===2,multiplier:2}};
 const unique=new Map();for(const slot of Object.values(c.loadouts).flat())if(slot.artifactId)unique.set(JSON.stringify(slot),slot);
 const inventoryItems=[...unique.values()].map((slot,i)=>{const a=S.AMAP[slot.artifactId];return {itemId:i+1,quantity:1,artifact:{spec:{name:a.afxId,level:a.afxLevel,rarity:a.rarity},stones:(slot.stones||[]).filter(Boolean).map(id=>{const st=S.SMAP[id];return {name:st.afxId,level:st.afxLevel,rarity:0};})}};});
 const owned=c.artifactModel?.inventory.map((x,i)=>{const item=x.kind==='stone'?S.SMAP[x.id]:S.AMAP[x.id];return {itemId:i+1,quantity:x.quantity,artifact:{spec:{name:item.afxId,level:item.afxLevel,rarity:item.rarity||0},stones:x.stones.map(id=>{const st=S.SMAP[id];return {name:st.afxId,level:st.afxLevel,rarity:0};})}};});
 const farm={habs:s.h.map(id=>id??S.D.habs.length),vehicles:s.v.map(v=>v.id??S.D.vehicles.length),trainLength:s.v.map(v=>v.cars),commonResearch:S.D.research.map((r,i)=>({id:r.id,level:s.r[i]}))};
 // The reference vehicle planner calls Bust Unions "cheaper_vehicles".
 // Translate only at this boundary; actual prices and saved Epic IDs stay canonical.
 const epicResearchLevels={...c.epic,cheaper_vehicles:c.epic.bust_unions};
 return {state,context:{epicResearchLevels,colleggtibleModifiers:c.col,ascensionStartTime:c.start,planStartOffset:0,assumeDoubleEarnings:c.video===2,deferForEarningsMode:false,rawBackup:{farms:[farm],...(c.artifactModel?{plannerDelivery:options=>proposalDelivery(s,c,options)}:{}),game:{permitLevel:c.pro?1:0},virtue:{eovEarned:c.claimed},artifactsDb:{virtueAfxDb:{inventoryItems:owned||inventoryItems},artifactStatus:[]}}}};
}
function tag(s,base,phase){const actions=[];for(let p=s.path;p&&p!==base;p=p.prev)actions.push(p.action);let path=base;for(const a of actions.reverse())path={prev:path,action:{...a,phase:a.phase||phase}};return {...s,path,phase};}
function proposalPurchase(p){const x=p.payload||{};switch(p.type){case 'buy_research':return {type:'research',i:S.RMAP[x.researchId]};case 'buy_hab':return {type:'hab',slot:x.slotIndex,id:x.habId};case 'buy_vehicle':return {type:'vehicle',slot:x.slotIndex,id:x.vehicleId};case 'buy_train_car':return {type:'car',slot:x.slotIndex};case 'buy_silo':return {type:'silo'};default:return null;}}
function step(start,c,phase,egg,runner,limit=Infinity,buildEnd){
 let n=start;let deadline=Math.min(c.end,phase!=='C3'&&(buildEnd===undefined||c.sleepBudget)?Sleep.activeDeadline(c.sleep,start.t,limit):start.t+limit);const base=start.path;
 function shifted(before){if(Number.isFinite(limit))deadline=Math.min(c.end,c.sleep&&(buildEnd===undefined||c.sleepBudget)?Sleep.activeDeadline(c.sleep,n.t-c.shiftSeconds,limit):deadline+(n.t-before-c.shiftSeconds));}
 if(phase==='C1'&&n.egg!==egg){const before=n.t;n=S.buy(n,c,{type:'shift',egg});shifted(before);}
 const {state,context}=adapt(n,c);let proposal=runner?runner(state,context,buildEnd):{actions:[]};
 if(n.egg!==egg){const before=n.t;n=S.buy(n,c,{type:'shift',egg});shifted(before);}
 // The historical R recipe aims for 24 hours. With scheduled sleep, seed
 // only paid coverage for the longest remaining night within the horizon.
 // The general search can still compare other silo counts and R durations.
 if(c.sleep&&phase==='R1'){
  const perSilo=(60+6*c.epic.silo_capacity)*60,needed=Math.ceil(Sleep.requiredCoverage(c.sleep,n.t,c.end)/perSilo);
  const count=Math.max(0,Math.min(c.pro?10:2,needed)-n.silos);
  proposal={actions:Array.from({length:count},()=>({type:'buy_silo'}))};
 }
 let couplingCheckpoint=null;
 for(let pi=0;pi<proposal.actions.length;pi++){const p=proposal.actions[pi],a=proposalPurchase(p);
  // Use actual event boundaries. Generic cash waits are replaced by afford().
  if(p.type==='wait_for_research_sale'||p.type==='wait_for_earnings_boost'){
   const field=p.type==='wait_for_research_sale'?'sale':'earnings',value=field==='sale'?.3:2;
   if(S.at(c,n.t)[field]!==value){const event=c.calendar.find(e=>e.t>n.t&&e[field]===value);if(!event||event.t>deadline)break;n=S.advance(n,c,event.t,field==='sale'?'Wait for the Friday research sale':'Wait for double earnings');}
  }
  if(!a)continue;
  if(phase==='C2'&&!couplingCheckpoint&&fleet.every(id=>n.r[S.RMAP[id]]===S.D.research[S.RMAP[id]].levels)&&!fleet.includes(S.D.research[a.i]?.id))couplingCheckpoint=n;
  if(!S.allowed(n,c,a))continue;
  if(c.batchOffline){const ahead=[],indices=[];for(let j=pi;j<proposal.actions.length&&ahead.length<64;j++){const q=proposal.actions[j];if(['wait_for_research_sale','wait_for_earnings_boost'].includes(q.type))break;const x=proposalPurchase(q);if(!x)continue;
   // Preserve C2's rollback point between fleet and coupling purchases.
   if(phase==='C2'&&x.type==='research'&&fleet.includes(S.D.research[a.i]?.id)!==fleet.includes(S.D.research[x.i]?.id))break;
   ahead.push(x);indices.push(j);}
   const batched=B.compare(n,c,ahead,deadline);if(batched){n=batched.s;pi=indices[batched.count-1];continue;}}
  const ready=S.afford(n,c,a);if(!ready||ready.t+(a.type==='shift'?c.shiftSeconds:c.actionsSeconds)>deadline)break;n=S.buy(ready,c,a);
 }
 if(phase==='C2'&&couplingCheckpoint&&n.r[S.RMAP.micro_coupling]===couplingCheckpoint.r[S.RMAP.micro_coupling])n=couplingCheckpoint;
 // Uncapped physical stages must really finish, including any proposal truncation.
 if(phase==='I1')for(let slot=0;slot<4;slot++)if(n.h[slot]!==18){const a={type:'hab',slot,id:18},ready=S.afford(n,c,a);if(!ready)throw Error('Cannot complete Chicken Universes within the planning limit.');n=S.buy(ready,c,a);}
 if(phase==='K2'||phase==='K3')for(let slot=0;slot<S.stats(n,c).slots;slot++){
  if(phase==='K2'&&n.v[slot].id!==11){const a={type:'vehicle',slot,id:11},ready=S.afford(n,c,a);if(!ready)throw Error('Cannot max vehicles within the planning limit.');n=S.buy(ready,c,a);}
  while(n.v[slot].id===11&&n.v[slot].cars<S.stats(n,c).trainLength){const a={type:'car',slot},ready=S.afford(n,c,a);if(!ready)throw Error('Cannot max train cars within the planning limit.');n=S.buy(ready,c,a);}
 }
 if(n.t>deadline+1e-6)throw Error(phase+' exceeded its time limit.');
 return tag(n,base,phase);
}
function milestone(start,c,id,deadline){let n=start;const i=S.RMAP[id],target=S.D.research[i];for(let guard=0;n.r[i]<target.levels&&guard<3000;guard++){
 let a={type:'research',i};if(!S.isUnlocked(n,i)){const before=S.stats(n,c);let best=null,score=-1;for(let j=0;j<S.D.research.length;j++){const r=S.D.research[j],x={type:'research',i:j};if(r.tier>=target.tier||!S.allowed(n,c,x))continue;const cost=S.price(n,c,x),gain=S.stats(S.mutate(n,c,x),c).earning/Math.max(1,before.earning)-1,value=(.05+Math.log1p(Math.max(0,gain)))/(1+cost/Math.max(1,before.eventEarning));if(value>score){best=x;score=value;}}if(!best)break;a=best;}
 const ready=S.afford(n,c,a);if(!ready||ready.t+c.actionsSeconds>deadline)break;n=S.buy(ready,c,a);
 }return n;}
function waitGoal(n,c,goal,phase){const base=n.path,te=S.teByEgg(n,c)[n.egg];if(goal>te){const r=S.stats(n,c),dt=(c.sleep?S.productionEnd(n,c,Math.max(0,S.D.te[goal-1]-n.eggs[n.egg])/r.delivery)-n.t:Math.max(0,S.D.te[goal-1]-n.eggs[n.egg])/r.delivery)+.001;if(!Number.isFinite(dt)||n.t+dt>c.end)throw Error('Staged route exceeds the planning limit.');n=S.advance(n,c,n.t+dt,'Collect '+S.NAME[n.egg]+' share of the Truth Egg target');}return tag(n,base,phase);}
// Share purchase rules with fixed routes only when their upgrade visits match.
// The final TE visits may be reordered or omitted; never insert a fixed visit.
function supportsFixed(initial,c){
 if(c.autoSequence)return false;
 const offset=initial.egg===0?0:1,route=c.sequence.slice(offset),tail=route.slice(9);
 return [[0,4,1,0,4,3,0,2,4],[0,1,4,0,4,3,0,2,4]].some(prefix=>prefix.every((egg,i)=>route[i]===egg))&&tail.length<=4&&new Set(tail).size===tail.length&&tail.every(egg=>[0,1,3,2].includes(egg));
}
function canCompare(initial,c){return c.autoSequence?c.strategy==='wasmegg'||c.maxSwitches>=Route.defaultSwitches(S.EGGS[initial.egg]):supportsFixed(initial,c);}
function run(initial,c,saleCount,goalsFor,checkpoint=()=>{},cache={}){
 c={...c,stagedShips:true};
 if(S.reached(initial,c))return initial;
 const requiredSwitches=Route.defaultSwitches(S.EGGS[initial.egg]);
 if(c.autoSequence&&c.maxSwitches<requiredSwitches)throw Error('The full Wasmegg route requires '+requiredSwitches+' new switches from '+S.NAME[initial.egg]+'. Maximum New Switches is '+c.maxSwitches+'. Increase it or enter a shorter User Selected Sequence.');
 if(!c.autoSequence&&!supportsFixed(initial,c))throw Error('This fixed route uses different upgrade visits from the shared stage planner.');
 const opening=cache.opening||{},suffixes=cache.suffixes;cache.reusedSuffix=false;
 let n=cache.prefix;if(!n){if(!opening.c1){opening.c1=step(initial,c,'C1',0,(s,ctx)=>R.runC1(s,ctx,c.c1MaxMinutes*60),c.c1MaxMinutes*60);opening.speculative=null;try{opening.speculative=step(opening.c1,c,'I1',1,R.runI1);}catch{}}n=opening.c1;checkpoint('C1',n);
 const speculative=opening.speculative;
 if(c.autoSequence?speculative&&speculative.t-n.t<3600:c.sequence[n.stage+1]===1){n=speculative||step(n,c,'I1',1,R.runI1);checkpoint('I1',n);n=step(n,c,'K1',4,(s,ctx)=>R.runK1(s,ctx,c.k1MaxMinutes*60),c.k1MaxMinutes*60);}else{n=step(n,c,'K1',4,(s,ctx)=>R.runK1(s,ctx,c.k1MaxMinutes*60),c.k1MaxMinutes*60);checkpoint('K1',n);n=step(n,c,'I1',1,R.runI1);}checkpoint('opening',n);
 let c2Start=n.t;const c2Base=n.path;n=step(n,c,'C2',0,R.runC2,14400);const c2Shift=S.history(n).findLast(a=>a.type==='shift'&&a.phase==='C2');if(c2Shift)c2Start=c2Shift.t; for(const id of fleet)n=milestone(n,c,id,Math.min(c.end,Sleep.activeDeadline(c.sleep,c2Start,14400)));if(!fleet.every(id=>n.r[S.RMAP[id]]===S.D.research[S.RMAP[id]].levels))throw Error('Cannot finish fleet research within the C2 budget.');const gc=n;n=milestone(n,c,'micro_coupling',Math.min(c.end,Sleep.activeDeadline(c.sleep,c2Start,14400)));if(n.r[S.RMAP.micro_coupling]===gc.r[S.RMAP.micro_coupling])n=gc;n=tag(n,c2Base,'C2');checkpoint('C2',n);n=step(n,c,'K2',4,R.runK2);checkpoint('K2',n);n=step(n,c,'R1',3,R.runR1,3600);checkpoint('R1',n);cache.prefix=n;}
 // Exact, complete states only: differing cash, event time, delivered eggs or
 // offline-break count cannot share a continuation. Every stored prefix was
 // generated under a pair of budgets within the user's ceilings.
 const suffixKey=JSON.stringify([c.autoSequence,c.sequence,saleCount,n.t,n.cash,n.soul,n.shiftCount,n.lost,n.stage,n.egg,n.r,n.h,n.v,n.eggs,n.set,n.silos,n.fuel,n.shipsDone,n.shipRuns,n.shipRunStage,n.shipFlights,W.offlineBreaks(n)]);
 if(suffixes?.has(suffixKey)){cache.reusedSuffix=true;checkpoint('Reusing equivalent opening',n);return suffixes.get(suffixKey);}
 const ends=c.calendar.filter((e,i)=>e.t>c.start&&e.sale===1&&i>0&&c.calendar[i-1].sale===.3).map(e=>e.t),buildEnd=Math.min(c.end,Math.max(n.t,ends[saleCount-1]||c.end));
 n=step(n,c,'C3',0,(s,ctx)=>R.runC3(s,ctx,buildEnd),buildEnd-n.t,buildEnd);checkpoint('C3',n);
 const firstHumPhase=c.ships?.mode==='custom-two-visits'&&c.ships.enabled?'H'+((n.shipRuns||0)+1):'H1',lastHumPhase='H'+(Number(firstHumPhase.slice(1))+1);n=step(n,{...c,deferShips:true},firstHumPhase,2,null);const base=n.path;const finalFleet=S.clone(n);for(const v of finalFleet.v)if(v.id===11)v.cars=S.stats(n,c).trainLength;const set=S.artifactChoices(finalFleet,c).reduce((a,b)=>S.stats({...finalFleet,set:b},c).delivery>S.stats({...finalFleet,set:a},c).delivery?b:a,n.set);if(c.artifactModel)n={...n,artifactRecommendations:{earnings:c.earningLoadout,delivery:c.loadouts[set],basis:'C3 research and cars unlocked for K3'}};if(set!==n.set)n=S.buy(n,{...c,deferShips:true},S.artifactAction(set,c));if(Ships.pending(n,c))n=Ships.launch(n,c);n=tag(n,base,firstHumPhase);checkpoint(firstHumPhase,n);
 n=step(n,c,'K3',4,null);const goals=goalsFor(n,c.autoSequence?{...c,autoSequence:true,maxSwitches:n.stage+4}:c);if(!goals)throw Error('No TE distribution satisfies the staged route.');n=waitGoal(n,c,goals[4],'K3');
 const finalVisits=c.autoSequence?[["C4",0],["I2",1],["R2",3],[lastHumPhase,2]]:c.sequence.slice(n.stage+1).map(egg=>[{0:'C4',1:'I2',3:'R2',2:lastHumPhase}[egg],egg]);
 for(const [phase,egg] of finalVisits){n=step(n,c,phase,egg,null);n=waitGoal(n,c,goals[egg],phase);checkpoint(phase,n);}
 if(!S.reached(n,c))throw Error('The staged route missed the target.');n={...n,openingBudgets:{c1MaxMinutes:c.c1MaxMinutes,k1MaxMinutes:c.k1MaxMinutes}};suffixes?.set(suffixKey,n);return n;
}
module.exports={run,step,adapt,supportsFixed,canCompare};
