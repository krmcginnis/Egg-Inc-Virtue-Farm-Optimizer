'use strict';
const DATA=require('./ship-data.json');
const Sleep=require('./sleep-schedule.cjs');
const EGGS=['curiosity','integrity','humility','resilience','kindness'];
const RECIPE=[175e12,9e12,0,140e12,175e12];
const TANKS=[2e9,200e9,10e12,100e12,200e12,300e12,400e12,500e12];
// Standard tank rates (Egg Inc. Wiki/Fuel_Tank); auxiliary boosts can be entered explicitly.
const OUTPUTS=[300e6,12e9,180e9,3e12,4.5e12,6e12,7.5e12,9e12];
function rateFor(capacity){return OUTPUTS[TANKS.indexOf(capacity)]??300e6;}
const MAP=Object.fromEntries(DATA.ships.map(s=>[s.id,s]));
function mission(id,duration,ftl=0){const ship=MAP[id],m=ship?.missions.find(x=>x.id===duration);if(!m)throw Error('Select a valid ship and mission length.');return {...m,ship:id,label:m.name+' '+ship.name,cost:ship.gemCost,seconds:m.seconds*(ship.ftl?1-.01*ftl:1),fuel:EGGS.map(e=>m.fuel[e]||0)};}
function needed(missions){const out=Array(5).fill(0);for(const m of missions)for(let i=0;i<5;i++)out[i]+=m.count*m.fuel[i];return out;}
function maximum(m,capacity,stored,reserved=Array(5).fill(0)){
 const per=m.fuel.reduce((a,b,i)=>a+(i===2?0:b),0);if(!per)return null;
 let lo=0,hi=Math.floor(capacity/per)+1;
 const fits=n=>stored.reduce((sum,x,i)=>sum+(i===2?x:Math.max(x,reserved[i]+n*m.fuel[i])),0)<=capacity+Math.max(1,capacity)*1e-12;
 if(!fits(0))return 0;
 while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(fits(mid))lo=mid;else hi=mid;}return lo;
}
function prepare(f,p,number){
 const tank=f.fuelTank||{},capacity=number(tank.capacity??2e9,'Fuel tank capacity',0,500e12),output=number(tank.outputPerMinute??rateFor(capacity),'Tank output per minute',1),stored=EGGS.map(e=>number(tank.amounts?.[e]??0,e+' tank fuel'));
 if(stored.reduce((a,b)=>a+b,0)>capacity+Math.max(1,capacity)*1e-12)throw Error('Stored fuel exceeds the fuel tank capacity.');
 const raw=p.ships||{},mode=raw.mode||'legacy',ftl=number(mode==='legacy'?(raw.ftlLevel??f.epic?.afx_mission_time??0):(f.epic?.afx_mission_time??0),'FTL Drive Upgrades',0,60,true),slots=number(raw.slots??3,'Available mission slots',1,3,true);
 if(!['legacy','efficient-two-visits','custom-first-visit','custom-two-visits','none'].includes(mode))throw Error('Select a valid ship setup.');
 if(mode==='efficient-two-visits'){if(capacity<499e12)throw Error('The efficient fleet setup requires a 500T fuel tank. Select another setup if your tank is smaller.');const hen={...mission('HENERPRISE','EPIC',ftl),count:7},corvette=mission('CORELLIHEN_CORVETTE','SHORT',ftl);return {mode,enabled:true,visits:2,capacity,outputPerSecond:output/60,stored,missions:[hen],corvette,targets:RECIPE.slice(),fuel:needed([hen]),count:7,slots:3,ftl};}
 if(mode==='custom-two-visits'){
  if(!Array.isArray(raw.visits)||raw.visits.length!==2)throw Error('Enter ship plans for H1 and H2.');
  let stock=stored.slice();const runs=raw.visits.map((visit,index)=>{
   if(!Array.isArray(visit.missions??[])||(visit.missions?.length||0)>8)throw Error('Use at most eight mission groups per Humility visit.');
   const missions=(visit.missions||[]).filter(x=>x.ship).map(x=>({...mission(x.ship,x.duration||'EPIC',ftl),count:x.count===null||x.count===''?null:number(x.count??3,'H'+(index+1)+' launch count',1,1000000,true)}));
   const automatic=missions.filter(m=>m.count===null);if(automatic.length>1)throw Error('Only one mission group per Humility visit can use Tank Maximum.');
   const reserved=needed(missions.filter(m=>m.count!==null));
   if(automatic.length){const m=automatic[0],n=maximum(m,capacity,stock,reserved);if(n===null)throw Error('Humility-only missions need a launch count.');if(!n)throw Error('H'+(index+1)+': the tank cannot support another mission of this type.');m.count=n;}
   const fuel=needed(missions),targets=fuel.map((x,i)=>i===2?0:x),count=missions.reduce((n,m)=>n+m.count,0);
   if(count>1000000)throw Error('Use at most one million launches per Humility visit.');
   if(targets.reduce((a,b)=>a+b,0)>capacity+Math.max(1,capacity)*1e-12)throw Error('H'+(index+1)+' planned ships need more tank space than is available. Lower launch counts.');
   const before=stock.slice();stock=stock.map((v,i)=>i===2?v:Math.max(0,v-fuel[i]));
   return {mode,enabled:count>0,visit:index+1,capacity,outputPerSecond:output/60,stored:before,stockAfter:stock.slice(),missions,targets,fuel,count,slots,ftl,respectFlights:true};
  });
  const visits=runs[1].count?2:runs[0].count?1:0,count=runs.reduce((n,r)=>n+r.count,0);
  return {mode,enabled:count>0,visits,runs,capacity,outputPerSecond:output/60,stored,missions:runs.flatMap(r=>r.missions),targets:runs[0].targets,fuel:runs[0].fuel.map((n,i)=>n+runs[1].fuel[i]),count,slots,ftl};
 }
 if(mode==='none')return {mode,enabled:false,visits:0,capacity,outputPerSecond:output/60,stored,missions:[],targets:Array(5).fill(0),fuel:Array(5).fill(0),count:0,slots,ftl};
 if(!Array.isArray(raw.missions??[]))throw Error('Ship missions must be a list.');
 if((raw.missions?.length||0)>8)throw Error('Use at most eight ship mission groups.');
 const missions=(raw.missions||[]).filter(x=>x.ship).map(x=>({...mission(x.ship,x.duration||'EPIC',ftl),count:x.count===null||x.count===''?null:number(x.count??3,'Ship launch count',1,1000000,true)}));
 const automatic=missions.filter(m=>m.count===null);if(automatic.length>1)throw Error('Only one mission group can use Tank Maximum; enter counts for the other groups.');
 const reserved=needed(missions.filter(m=>m.count!==null));
 if(automatic.length){const m=automatic[0],n=maximum(m,capacity,stored,reserved);if(n===null)throw Error('Humility-only missions need a launch count; their fuel is produced on Humility.');if(!n)throw Error('The fuel tank cannot support another mission of this type.');m.count=n;}
 const fuel=needed(missions),targets=fuel.map((x,i)=>i===2?0:x);
 if(stored.reduce((sum,x,i)=>sum+Math.max(x,targets[i]),0)>capacity+Math.max(1,capacity)*1e-12)throw Error('Planned ships need more tank space than is available. Lower launch counts or adjust stored fuel.');
 const count=missions.reduce((a,m)=>a+m.count,0);if(count>1000000)throw Error('Use at most one million launches per run.');
 return {mode,visits:count>0?1:0,enabled:count>0,capacity,outputPerSecond:output/60,stored,missions,targets,fuel,count,slots,ftl};
}
function store(start,c,amount,log=true){
 const S=require('./simulator.cjs');start=S.interactionReady(start,c,0,log);if(!(amount>0)||!Number.isFinite(amount)||start.egg===2)throw Error('Fuel storage requires a positive amount on a non-Humility farm.');
 if(!c.ships?.enabled||start.shipsDone)throw Error('Fuel storage is not part of this ship plan.');
 if(start.fuel.reduce((a,b)=>a+b,0)+amount>c.ships.capacity+Math.max(1,c.ships.capacity)*1e-12)throw Error('Fuel tank would overflow.');
 const targets=collectionTargets(start,c);
 if(start.fuel[start.egg]+amount>targets[start.egg]+Math.max(1,targets[start.egg])*1e-12)throw Error('Fuel storage exceeds the planned mission requirements.');
 const rate=S.stats(start,c).laying,seconds=c.sleep?S.productionEnd(start,c,amount/rate)-start.t:amount/rate;if(!(rate>0)||!Number.isFinite(seconds)||start.t+seconds>c.end)throw Error('Cannot collect required ship fuel within the planning limit.');
 S.checkVisitTime(start,c,start.t+seconds);let n=S.clone(start);n.t+=seconds;n.fuel[n.egg]+=amount;
 // Full egg diversion: tank filling generates neither delivered TE nor gems.
 if(log)n=S.record(n,{type:'fuel',t:start.t,end:n.t,egg:n.egg,amount,rate,cost:0,bank:n.cash,eggsGained:0,cashGained:0,phase:start.phase||start.path?.action.phase,visit:(start.shipRuns||0)+1,...(c.sleep?{siloEmptySeconds:seconds-Sleep.productiveSeconds(c.sleep,start.t,n.t,S.stats(start,c).siloHours*3600)}:{})});return n;
}
function runFor(s,c){return c.ships.mode==='custom-two-visits'?(c.ships.runs[s.shipRuns||0]||{count:0,missions:[],targets:Array(5).fill(0),fuel:Array(5).fill(0)}):c.ships;}
function collectionTargets(s,c){const run=runFor(s,c);return run.collectionTargets||run.targets;}
function configureRoute(c){
 if(c.autoSequence||c.ships.mode!=='custom-two-visits'||c.ships.visits!==2)return;
 const firstH=c.sequence.indexOf(2),secondH=c.sequence.indexOf(2,firstH+1),between=c.sequence.slice(firstH+1,secondH),[first,second]=c.ships.runs;
 // If there is no refill stop before H2, collect its fuel before H1 and
 // reserve it alongside the fuel that H1 will actually consume.
 const carry=second.targets.map((amount,egg)=>between.includes(egg)?0:amount);
 first.collectionTargets=first.targets.map((amount,egg)=>amount+carry[egg]);
 const total=first.collectionTargets.reduce((a,b)=>a+b,0);
 if(total>c.ships.capacity+Math.max(1,c.ships.capacity)*1e-12){let excess=total-c.ships.capacity;const eggs=[];for(const {amount,egg}of carry.map((amount,egg)=>({amount,egg})).sort((a,b)=>b.amount-a.amount)){if(excess<=0)break;excess-=amount;eggs.push(egg);}const names=require('./simulator.cjs').NAME,sources=eggs.map(egg=>names[egg]),details=eggs.map(egg=>'H1 consumes '+format(first.fuel[egg])+' '+names[egg]+'; H2 needs another '+format(second.fuel[egg])+'.').join(' ');throw Error('This switch sequence needs '+format(total)+' stored fuel before H1, exceeding the '+format(c.ships.capacity)+' tank. '+details+' Launches free tank space, but this sequence has no refill stop for that fuel before H2. Refill '+sources.join(', ')+' between H1 and H2, or lower the planned launch counts.');}
 second.stored=second.stored.map((amount,egg)=>Math.max(amount,carry[egg]));
 first.stockAfter=second.stored.slice();
}
function ready(s,c){return runFor(s,c).targets.every((n,i)=>s.fuel[i]+Math.max(1,n)*1e-12>=n);}
function pending(s,c){return !!c.ships?.enabled&&!s.shipsDone&&(s.shipRunStage??-1)!==s.stage;}
function trim(s,c,log=true){
 if(!['efficient-two-visits','custom-two-visits'].includes(c.ships?.mode)||s.shipsDone)return s;
 const targets=collectionTargets(s,c),removed=Array(5).fill(0);
 if(c.ships.mode==='efficient-two-visits')s.fuel.forEach((n,i)=>removed[i]=Math.max(0,n-targets[i]));
 else{let excess=s.fuel.reduce((sum,n,i)=>sum+Math.max(n,targets[i]),0)-c.ships.capacity;
  // Keep unused inventory whenever it fits. Only discard the surplus that
  // prevents the current visit's required fuels from fitting in the tank.
  const next=c.ships.runs[(s.shipRuns||0)+1],order=[0,1,2,3,4].sort((a,b)=>(a===2?-1:b===2?1:((next?.targets[a]||0)>0)-((next?.targets[b]||0)>0)||s.fuel[b]-s.fuel[a]));
  for(const i of order){if(excess<=Math.max(1,c.ships.capacity)*1e-12)break;removed[i]=Math.min(Math.max(0,s.fuel[i]-targets[i]),excess);excess-=removed[i];}
 }
 if(!removed.some(n=>n>0))return s;const S=require('./simulator.cjs');s=S.interactionReady(s,c,0,log);const n=S.clone(s);n.fuel=n.fuel.map((v,i)=>v-removed[i]);
 return log?S.record(n,{type:'fuel-dump',t:s.t,egg:s.egg,removed,phase:s.phase,visit:(s.shipRuns||0)+1}):n;
}
function beforeShift(s,c,log=true){if(!c.ships?.enabled||s.shipsDone||s.egg===2)return s;
 // Automatic routing may return after upgrading. Do not require an opening
 // farm to fill the tank before it can leave under its C1/K1 time limit.
 if(c.enforceOpeningCaps&&c.autoSequence&&s.openingFirst&&s.stage<c.maxSwitches-1)return s;
 // On a fixed route, fill at the final visit to this fuel egg before the
 // upcoming launch. Filling the starter C1/K1 farm can consume the horizon
 // before its hab, shipping and research upgrades have been purchased.
 if(!c.autoSequence){const nextH=c.sequence.indexOf(2,s.stage+1);if(nextH>=0&&c.sequence.slice(s.stage+1,nextH).includes(s.egg))return s;}
 // The staged route collects after the last upgrade visit for each fuel egg.
 if(c.stagedShips&&(c.ships.mode==='custom-two-visits'||!(s.shipRuns>0))&&['C1','K1','C2'].includes(s.phase||s.path?.action.phase))return s;
 s=trim(s,c,log);const amount=Math.max(0,collectionTargets(s,c)[s.egg]-s.fuel[s.egg]);return amount>0?store(s,c,amount,log):s;
}
function legacyLaunch(start,c,log=true){
 const S=require('./simulator.cjs'),plan=c.ships;
 if(!plan?.enabled||start.shipsDone)return start;if(start.egg!==2)throw Error('Ships can launch only on Humility.');
 for(let i=0;i<5;i++)if(i!==2&&start.fuel[i]+Math.max(1,plan.targets[i])*1e-12<plan.targets[i])throw Error('Collect '+EGGS[i]+' fuel before the first Humility visit.');
 if((Math.ceil(plan.count/plan.slots)-1)*Math.min(...plan.missions.map(m=>m.seconds))>c.end-start.t)throw Error('Planned ship returns exceed the planning limit. Reduce launches or increase the planning days.');
 let n=S.clone(start),onlineSeconds=0,offlineSeconds=0,offlineBreaks=0,fuelSeconds=0,transferSeconds=0,returnWaitSeconds=0,fundingSeconds=0,interactionSeconds=0,firstLaunch=null;
 const launchOrder=c.shipLaunchOrder??'entered';if(!['entered','optimized'].includes(launchOrder))throw Error('Unrecognized ship launch order.');
 const schedule={...plan,launchOrder},slots=Array(plan.slots).fill(start.t),missions=reservedJobs(schedule);
 const physicalSlots=plan.respectFlights&&(start.shipFlights||[]).length>plan.slots?[...start.shipFlights].sort((a,b)=>a.returnAt-b.returnAt||a.slot-b.slot).slice(0,plan.slots).map(f=>f.slot):Array.from({length:plan.slots},(_,i)=>i+1);
 const batches=[],inFlight=[],launches=[],waits=[],interactions=[];let forcedOfflineSeconds=0;
 if(plan.respectFlights)for(const f of start.shipFlights||[]){inFlight[f.slot-1]={...f};const index=physicalSlots.indexOf(f.slot);if(index>=0)slots[index]=Math.max(start.t,f.returnAt);}
 function wait(to,reason,forceOnline=false){if(to<=n.t)return;
  const dt=to-n.t,r=S.stats(n,c),mode=!forceOnline&&c.earningsMode==='offline'&&dt>=S.offlineMinimum(c)&&r.offline>r.online?'offline':'online';
  const from=n.t;n=S.advance(n,c,to,reason,false,mode);const sleepSeconds=Sleep.seconds(c.sleep,from,to),forced=mode==='online'?sleepSeconds:0;forcedOfflineSeconds+=forced;if(reason==='Wait for an earlier ship to return'||/^Sleep hours/.test(reason))waits.push({start:from,end:to,seconds:dt,mode,reason,...(c.sleep?{sleepSeconds,forcedOfflineSeconds:forced}:{})});if(mode==='offline'){offlineSeconds+=dt;offlineBreaks++;}else onlineSeconds+=dt;
 }
 function interact(type,duration=0){
  const ready=Sleep.nextActive(c.sleep,n.t,duration);wait(ready,'Sleep hours; resume ship interactions at wake time');
  if(c.sleep){Sleep.assertActive(c.sleep,n.t,duration);interactions.push({type,t:n.t,end:n.t+duration});}
  if(duration){wait(n.t+duration,type==='collect'?'Collect returned ship':'Launch ship',true);interactionSeconds+=duration;}
 }
 for(let index=0;index<plan.count;index++){
  // New plans finish mission rows in input order. Historical replay retains
  // the old optimized schedule, including its reserved final slots.
  const m=nextMission(missions,schedule,index);
  const slot=slots.indexOf(Math.min(...slots)),physicalSlot=physicalSlots[slot];const release=Math.max(n.t,slots[slot]);returnWaitSeconds+=release-n.t;wait(release,'Wait for an earlier ship to return');
  if(plan.respectFlights?!!inFlight[physicalSlot-1]:index>=plan.slots)interact('collect',c.actionsSeconds);
  const fundingStart=n.t,ready=S.afford(n,{...c,sleepReplay:false},{type:'ship-cost',ship:m.ship,duration:m.id});if(!ready)throw Error('Cannot afford planned ships within the planning limit.');
  if(ready.t>n.t){if(c.sleep){for(let path=ready.path;path&&path!==n.path;path=path.prev){const a=path.action;if(a.type!=='wait')continue;const dt=a.end-a.t;waits.push({start:a.t,end:a.end,seconds:dt,mode:a.earningsMode,reason:a.reason,sleepSeconds:a.sleepSeconds||0,forcedOfflineSeconds:a.forcedOfflineSeconds||0});if(a.earningsMode==='offline'){offlineSeconds+=dt;offlineBreaks++;}else {onlineSeconds+=dt;forcedOfflineSeconds+=a.forcedOfflineSeconds||0;}}}else{const a=ready.path.action,dt=ready.t-n.t;waits.push({start:n.t,end:ready.t,seconds:dt,mode:a.earningsMode,reason:'Earn gems for the next ship'});if(a.earningsMode==='offline'){offlineSeconds+=dt;offlineBreaks++;}else onlineSeconds+=dt;}}
  n={...ready,path:n.path,depth:n.depth};fundingSeconds+=n.t-fundingStart;interact('fuel-start');n.cash=Math.max(0,n.cash-m.cost);
  // The farm and tank fuel in parallel. Stored Humility flows first; the
  // tank then supplies the other eggs while any remaining Humility is produced.
  const rate=S.stats(n,c).laying,tankRate=plan.outputPerSecond,humility=m.fuel[2];
 let first=Math.min(n.fuel[2]/tankRate,humility/(tankRate+rate)),unfilled=humility-first*(tankRate+rate);
 if(c.sleep){let time=n.t,tank=n.fuel[2],needed=humility;const coverage=S.stats(n,c).siloHours*3600;
  while(tank>0&&needed>Math.max(1,humility)*1e-12){const end=Math.min(Sleep.productionBoundary(c.sleep,time,coverage),time+tank/tankRate),combined=tankRate+(Sleep.producing(c.sleep,time,coverage)?rate:0),dt=Math.min(end-time,needed/combined);if(!(dt>0))break;needed-=combined*dt;tank=Math.max(0,tank-tankRate*dt);time+=dt;}
  first=time-n.t;unfilled=needed;
 }
 const storedHumility=Math.min(n.fuel[2],first*tankRate);n.fuel[2]-=storedHumility;
 const remainingHumility=unfilled<=Math.max(1,humility)*1e-12?0:unfilled;
 const farmTime=remainingHumility?(c.sleep?S.productionEnd({...n,t:n.t+first},c,remainingHumility/rate)-(n.t+first):remainingHumility/rate):0;
  if(!Number.isFinite(farmTime))throw Error('The Humility farm cannot produce ship fuel.');
  const dt=first+farmTime,foreign=m.fuel.reduce((sum,x,i)=>sum+(i===2?0:x),0),transfer=foreign/tankRate;
  if(n.t+dt>c.end)throw Error('Ship fueling exceeds the planning limit.');n.t+=dt;fuelSeconds+=dt;
  for(let i=0;i<5;i++)if(i!==2){if(n.fuel[i]+Math.max(1,m.fuel[i])*1e-12<m.fuel[i])throw Error('Not enough stored ship fuel.');n.fuel[i]=Math.max(0,n.fuel[i]-m.fuel[i]);}
  wait(n.t+Math.max(0,transfer-farmTime),'Finish transferring stored eggs into the ship',true);transferSeconds+=first+transfer;
  interact('launch',c.actionsSeconds);
  const t=n.t,returnAt=t+m.seconds;slots[slot]=returnAt;m.remaining--;if(firstLaunch===null)firstLaunch=t;
  const group=launchOrder==='entered'?{groupIndex:m.groupIndex}:{},key=m.ship+':'+m.id+(launchOrder==='entered'?':'+m.groupIndex:'');let batch=batches.find(x=>x.key===key);if(!batch){batch={key,...group,label:m.label,ship:m.ship,duration:m.id,count:0,firstLaunch:t,lastLaunch:t,missionSeconds:m.seconds};batches.push(batch);}batch.count++;batch.lastLaunch=t;
  launches.push({...group,label:m.label,ship:m.ship,duration:m.id,slot:physicalSlot,t,returnAt});inFlight[physicalSlot-1]={slot:physicalSlot,ship:m.ship,duration:m.id,launch:t,returnAt};
 }
 n.shipsDone=true;n.shipFlights=inFlight.filter(x=>x&&x.returnAt>n.t);
 const action={type:'ship-run',launchOrder,phase:'H1',t:start.t,end:n.t,egg:2,count:plan.count,batches,launches,waits,slots:plan.slots,firstLaunch,lastLaunch:n.t,finalReturns:n.shipFlights,fuel:plan.fuel.slice(),fuelSeconds,transferSeconds,returnWaitSeconds,fundingSeconds,onlineSeconds:onlineSeconds-interactionSeconds-forcedOfflineSeconds,offlineSeconds:offlineSeconds+forcedOfflineSeconds,offlineBreaks,interactionSeconds,cost:plan.missions.reduce((a,m)=>a+m.cost*m.count,0),bank:n.cash,eggsGained:n.eggs[2]-start.eggs[2],cashGained:n.cash-start.cash,...(c.sleep?{interactions,sleepSeconds:Sleep.seconds(c.sleep,start.t,n.t),siloEmptySeconds:n.t-start.t-Sleep.productiveSeconds(c.sleep,start.t,n.t,S.stats(start,c).siloHours*3600)}:{})};
 return log?S.record(n,action):n;
}
function summary(actions){const runs=actions.filter(a=>a.type==='ship-run');if(!runs.length)return null;return {...runs[0],count:runs.reduce((a,r)=>a+r.count,0),runs,fueling:actions.filter(a=>a.type==='fuel').map(a=>({egg:a.egg,amount:a.amount,seconds:a.end-a.t,t:a.t,end:a.end,visit:a.visit})),departure:runs.at(-1).end};}
const format=require('./number-format.cjs').format;
module.exports={runFor,collectionTargets,configureRoute,plannedVisits,anticipatedDelivery,ready,pending,trim,RECIPE,format,rateFor,OUTPUTS,DATA,EGGS,TANKS,MAP,mission,needed,maximum,prepare,store,beforeShift,launch,summary};

function launch(start,c,log=true){
 if(!pending(start,c))return start;
 start=require('./simulator.cjs').interactionReady(start,c,0,log);
 if(c.ships.mode==='custom-two-visits')return customLaunch(start,c,log);
 if(c.ships.mode!=='efficient-two-visits')return legacyLaunch(start,c,log);
 const S=require('./simulator.cjs'),plan=c.ships;
 if(start.egg!==2)throw Error('Ships can launch only on Humility.');
 start=trim(start,c,log);
 for(let i=0;i<5;i++)if(start.fuel[i]+Math.max(1,plan.targets[i])*1e-12<plan.targets[i])throw Error('Collect '+EGGS[i]+' fuel before Humility visit '+((start.shipRuns||0)+1)+'.');
 const hen=plan.missions[0],corvette=plan.corvette;
 function engine(state,initialSlots,initialFlights){
  let n=S.clone(state),slots=initialSlots.slice(),flights=initialFlights.map(x=>x?{...x}:null),launches=[],waits=[],parts=[],interactions=[];
  function wait(to,reason,forceOnline=false){if(to<=n.t)return;const from=n.t,r=S.stats(n,c),mode=!forceOnline&&c.earningsMode==='offline'&&to-from>=S.offlineMinimum(c)&&r.offline>r.online?'offline':'online';n=S.advance(n,c,to,reason,false,mode);waits.push({start:from,end:to,seconds:to-from,mode,reason,...(c.sleep?{sleepSeconds:Sleep.seconds(c.sleep,from,to),forcedOfflineSeconds:mode==='online'?Sleep.seconds(c.sleep,from,to):0}:{})});}
  function one(m,slot,notBefore=0){wait(Math.max(slots[slot],notBefore,n.t),'Wait for an earlier ship to return');if(flights[slot]){
   wait(Sleep.nextActive(c.sleep,n.t,c.actionsSeconds),'Sleep hours; resume ship interactions at wake time');
   if(c.sleep)interactions.push({type:'collect',t:n.t,end:n.t+c.actionsSeconds});
   if(c.actionsSeconds)wait(n.t+c.actionsSeconds,'Collect returned ship',true);
  }
   const single={...plan,mode:'legacy',visits:1,count:1,slots:1,missions:[{...m,count:1}],targets:m.fuel.map((v,i)=>i===2?0:v),fuel:m.fuel.slice()},oldPath=n.path,oldDepth=n.depth;
   const result=legacyLaunch({...n,shipsDone:false},{...c,ships:single},true),part=result.path.action;
   n={...result,path:oldPath,depth:oldDepth,shipsDone:false};parts.push(part);
   const flight={...part.launches[0],slot:slot+1};launches.push(flight);slots[slot]=flight.returnAt;flights[slot]={slot:slot+1,ship:m.ship,duration:m.id,launch:flight.t,returnAt:flight.returnAt};return flight;
  }
  return {one,wait,get state(){return n;},get slots(){return slots;},get flights(){return flights;},launches,waits,parts,interactions};
 }
 let slots=Array(3).fill(start.t),flights=Array(3).fill(null);
 for(const f of start.shipFlights||[])if(f.returnAt>start.t){const slot=(f.slot||1)-1;slots[slot]=f.returnAt;flights[slot]=f;}
 const prefix=engine(start,slots,flights);
 for(let i=0;i<3;i++)prefix.one(hen,prefix.slots.indexOf(Math.min(...prefix.slots)));
 const middle=prefix.slots.indexOf(Math.min(...prefix.slots));prefix.one(hen,middle);
 const anchor=prefix.slots[middle],gapSlots=[0,1,2].filter(i=>i!==middle);
 // Four Henerprises use one returning lane; two lanes are available for
 // Corvettes. The final three Henerprises are the flights we do not await.
 // Start the first two final Henerprises just before the middle one returns.
 const rate=S.stats(prefix.state,c).laying;
 const henFill=Math.max(hen.fuel[2]/rate,hen.fuel.reduce((a,v,i)=>a+(i===2?0:v),0)/plan.outputPerSecond)+c.actionsSeconds*2;
 const finalStart=Math.max(prefix.state.t,Math.max(...gapSlots.map(i=>prefix.slots[i])),anchor-2*henFill);
 function finish(state,slotTimes,active){const e=engine(state,slotTimes,active);for(const slot of gapSlots)e.one(hen,slot,finalStart);e.one(hen,middle,anchor);return e;}
 const baseline=finish(prefix.state,prefix.slots,prefix.flights),deadline=baseline.state.t;
 let current=prefix,corvettes=0;
 // Optional launches must return before their lane is reserved and leave the
 // final Henerprise departure no later than the same schedule without them.
 for(let guard=0;guard<1000;guard++){
  const slot=gapSlots.reduce((a,b)=>current.slots[a]<=current.slots[b]?a:b);
  if(Math.max(current.state.t,current.slots[slot])+corvette.seconds>=finalStart||current.state.fuel[1]+1<corvette.fuel[1])break;
  const candidate=engine(current.state,current.slots,current.flights);
  try{const f=candidate.one(corvette,slot);if(f.returnAt>finalStart+1e-5)break;const final=finish(candidate.state,candidate.slots,candidate.flights);if(final.state.t>deadline+.01)break;}catch{break;}
  prefix.launches.push(...candidate.launches);prefix.waits.push(...candidate.waits);prefix.parts.push(...candidate.parts);prefix.interactions.push(...candidate.interactions);current=candidate;corvettes++;
 }
 const final=finish(current.state,current.slots,current.flights),n=S.clone(final.state),visit=(start.shipRuns||0)+1;
 const parts=prefix.parts.concat(final.parts),pauses=prefix.waits.concat(final.waits),launches=prefix.launches.concat(final.launches);
 const value=k=>parts.reduce((sum,a)=>sum+(a[k]||0),0);
 const batches=[hen,corvette].map(m=>{const list=launches.filter(x=>x.ship===m.ship);return {key:m.ship+':'+m.id,label:m.label,ship:m.ship,duration:m.id,count:list.length,firstLaunch:list[0]?.t,lastLaunch:list.at(-1)?.t,missionSeconds:m.seconds};}).filter(m=>m.count);
 n.shipRuns=visit;n.shipRunStage=n.stage;n.shipsDone=visit>=plan.visits;n.shipFlights=final.flights.filter(f=>f&&f.returnAt>n.t);
 const fuel=needed(batches.map(m=>({...mission(m.ship,m.duration,plan.ftl),count:m.count})));
 const action={type:'ship-run',phase:visit===1?'H1':'H2',visit,t:start.t,end:n.t,egg:2,count:launches.length,batches,launches,waits:pauses.concat(parts.flatMap(p=>p.waits)).sort((a,b)=>a.start-b.start),slots:3,firstLaunch:launches[0].t,lastLaunch:n.t,finalReturns:n.shipFlights,fuel,
  fuelSeconds:value('fuelSeconds'),transferSeconds:value('transferSeconds'),returnWaitSeconds:pauses.filter(p=>p.reason==='Wait for an earlier ship to return').reduce((a,p)=>a+p.seconds,0),fundingSeconds:value('fundingSeconds'),
   onlineSeconds:value('onlineSeconds')+pauses.filter(p=>p.mode==='online'&&p.reason!=='Collect returned ship').reduce((a,p)=>a+p.seconds-(p.forcedOfflineSeconds||0),0),offlineSeconds:value('offlineSeconds')+pauses.reduce((a,p)=>a+(p.mode==='offline'?p.seconds:p.forcedOfflineSeconds||0),0),offlineBreaks:value('offlineBreaks')+pauses.filter(p=>p.mode==='offline').length,
  interactionSeconds:value('interactionSeconds')+pauses.filter(p=>p.reason==='Collect returned ship').reduce((a,p)=>a+p.seconds,0),cost:value('cost'),bank:n.cash,eggsGained:n.eggs[2]-start.eggs[2],cashGained:n.cash-start.cash,...(c.sleep?{interactions:[...prefix.interactions,...final.interactions,...parts.flatMap(p=>p.interactions||[])].sort((a,b)=>a.t-b.t),sleepSeconds:Sleep.seconds(c.sleep,start.t,n.t),siloEmptySeconds:n.t-start.t-Sleep.productiveSeconds(c.sleep,start.t,n.t,S.stats(start,c).siloHours*3600)}:{})};
 return log?S.record(n,action):n;
}

function customLaunch(start,c,log=true){
 const S=require('./simulator.cjs'),run=runFor(start,c),visit=(start.shipRuns||0)+1;
 if(start.egg!==2)throw Error('Ships can launch only on Humility.');
 let n,action;
 if(run.count){
  n=legacyLaunch(start,{...c,ships:run},true);
  if(c.shipLaunchOrder==='optimized'&&run.missions.length>1&&run.count>run.slots&&run.count<=5000){try{const alternative=legacyLaunch(start,{...c,ships:{...run,reserveFinal:true}},true);if(alternative.t<n.t-1e-6||Math.abs(alternative.t-n.t)<=1e-6&&alternative.eggs[2]>n.eggs[2])n=alternative;}catch{}}
  action={...n.path.action,phase:'H'+visit,visit};
  n={...n,path:start.path,depth:start.depth};
 }else{n=S.clone(start);action={type:'ship-visit',t:start.t,egg:2,phase:'H'+visit,visit,count:0};}
 n.shipRuns=visit;n.shipRunStage=n.stage;n.shipsDone=!c.ships.runs.slice(visit).some(r=>r.count>0);
 return log?S.record(n,action):n;
}
function plannedVisits(raw,actions=[]){
 if(raw?.mode==='custom-two-visits')return structuredClone(raw.visits);
 if(raw?.mode==='efficient-two-visits')return [0,1].map(i=>({missions:actions.filter(a=>a.type==='ship-run')[i]?.batches?.map(m=>({ship:m.ship,duration:m.duration,count:m.count}))||[{ship:'HENERPRISE',duration:'EPIC',count:7},{ship:'CORELLIHEN_CORVETTE',duration:'SHORT',count:46}]}));
 return [{missions:raw?.mode==='none'?[]:structuredClone(raw?.missions||[])},{missions:[]}];
}
function reservedJobs(plan){const jobs=plan.missions.map((m,groupIndex)=>({...m,groupIndex,remaining:m.count,reserve:0}));if(plan.reserveFinal){let slots=Math.min(plan.slots,plan.count);for(const m of [...jobs].sort((a,b)=>b.seconds-a.seconds)){m.reserve=Math.min(m.count,slots);slots-=m.reserve;}}return jobs;}
function nextMission(jobs,plan,index){if(plan.launchOrder==='entered')return jobs.find(m=>m.remaining>0);const remaining=plan.count-index,prefix=plan.reserveFinal&&remaining>plan.slots,available=jobs.filter(m=>prefix?m.remaining>m.reserve:m.remaining>0);return available.reduce((a,b)=>plan.reserveFinal||remaining<=plan.slots?(a.seconds>=b.seconds?a:b):(a.seconds<=b.seconds?a:b));}
function abstractDeparture(run,reserveFinal){const plan={...run,reserveFinal},jobs=reservedJobs(plan),slots=Array(run.slots).fill(0);let departure=0;for(let i=0;i<run.count;i++){const m=nextMission(jobs,plan,i),slot=slots.indexOf(Math.min(...slots));departure=slots[slot];slots[slot]=departure+m.seconds;m.remaining--;}return departure;}
// Exact return-only departure for rows in input order. Batch equal-duration
// cycles so Tank Maximum estimates don't iterate over a million launches.
function orderedDeparture(run){
 const slots=Array(run.slots).fill(0);let departure=0;
 for(const m of run.missions){let remaining=m.count;while(remaining){
  const first=Math.min(...slots),last=Math.max(...slots);
  if(remaining>slots.length&&last-first<m.seconds){const cycles=Math.floor((remaining-1)/slots.length);for(let i=0;i<slots.length;i++)slots[i]+=cycles*m.seconds;remaining-=cycles*slots.length;continue;}
  const slot=slots.indexOf(first),next=Math.min(...slots.filter((_,i)=>i!==slot)),count=Math.min(remaining,Math.max(1,Math.ceil((next-first)/m.seconds)));
  departure=first+(count-1)*m.seconds;slots[slot]+=count*m.seconds;remaining-=count;
 }}return departure;
}
function anticipatedDelivery(s,c){
 if(c.ships?.mode!=='custom-two-visits'||s.shipsDone||s.shipRuns!==1)return 0;
 const S=require('./simulator.cjs'),run=runFor(s,c);let departure=0;
 if(c.shipLaunchOrder!=='optimized')departure=orderedDeparture(run);
 else if(run.count<=5000)departure=Math.min(abstractDeparture(run,false),abstractDeparture(run,true));
 else{const jobs=reservedJobs({...run,reserveFinal:true}),longest=jobs.reduce((n,m)=>n+m.reserve*m.seconds,0);departure=Math.max(0,(jobs.reduce((n,m)=>n+m.count*m.seconds,0)-longest)/run.slots);}
 const stats=S.stats(s,c),delivery=Math.max(0,departure-run.fuel[2]/stats.laying)*stats.delivery;
 return Number.isFinite(delivery)?delivery:0;
}
