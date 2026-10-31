'use strict';
const S=require('./simulator.cjs');
const Guide=require('./quick-guide.cjs');
const Fuel=require('./fuel-display.cjs');
const manualTypes=new Set(['fuel','fuel-dump','ship-run','ship-visit','wait']);
const interaction=a=>a.type==='wait'&&/^(Purchase interaction time|Switch overhead)/.test(a.reason||'');
const calendarWaits=new Set(['Wait for the Friday research sale','Wait for double earnings','Wait for the weekly event boundary','Preserve cash for the Friday research sale','Preserve the proposed research sale','Compare research purchases during the next sale','Compare departure at a weekly event boundary']);
const clockWait=a=>a.type==='wait'&&(calendarWaits.has(a.reason)||/^Sleep hours; resume (?:ship )?interactions at wake time$/.test(a.reason||''));
function key(result){return JSON.stringify([result.start,result.end,result.target,result.actions]);}
function snapshot(raw){
 // Farm validation must not depend on unfinished target, route or sleep inputs.
 // Observation time comes from the backup, never the editable plan start.
 const claimed=raw?.farm?.claimed||[];
 return S.prepare({...raw,plan:{start:1,maxDays:1,target:claimed.reduce((n,x)=>n+Number(x),0),solverVersion:2,strategy:'auto',autoSequence:true,maxShifts:0,ships:{mode:'none'}}},{artifactReplay:true});
}
function gear(slots){return JSON.stringify((slots||[]).filter(x=>x.artifactId).map(x=>[x.artifactId,(x.stones||[]).filter(Boolean).sort()]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));}
function compare(raw,result,current,{confirmed=[],launched={},now=Date.now()/1000}={}){
 const base=snapshot(raw),live=snapshot(current),s=live.s;
 const time=Number(current.importInfo?.timestamp)||null;
 if(time&&(!Number.isFinite(time)||!Number.isFinite(new Date(time*1000).getTime())))throw Error('The snapshot timestamp is invalid. Use a current farm backup.');
 const warnings=[],rows=[],visits=[{egg:base.s.egg,stage:0}],goal={silos:base.s.silos};
 if(result.initialSiloRule==='one'||result.actions.some(a=>a.initialSiloRule==='one'))goal.silos=Math.max(1,goal.silos);
 const startingSilos=goal.silos;
 let stage=0;
 for(const [index,a] of result.actions.entries()){
  if(a.type==='shift'){stage++;visits.push({egg:a.egg,stage});}
  if(a.type==='silo')goal.silos++;
  rows.push({index,stage,action:a,siloTarget:goal.silos,displayHidden:Fuel.hidden(a,base.c.ships.capacity)});
 }
 const offset=s.shiftCount-base.s.shiftCount,visit=visits[offset],te=S.teByEgg(s,live.c),totalTE=te.reduce((n,x)=>n+x,0);
 const report={status:'matched',stage:offset,egg:s.egg,time,totalTE,target:result.target,fuelCapacity:base.c.ships.capacity,rows:[],warnings,confirmedPurchases:0,purchaseCount:0,next:null,targetReached:totalTE>=result.target&&(raw.plan.floors||[]).every((n,i)=>te[i]>=n)};
 if(live.c.claimed.some((n,i)=>n!==base.c.claimed[i])){
  report.status=live.c.claimedTotal>=result.target&&(raw.plan.floors||[]).every((n,i)=>live.c.claimed[i]>=n)?'claimed-target':'mismatch';warnings.push('Claimed Truth Eggs changed. This snapshot belongs to a different ascension; the saved visit sequence cannot be matched.');
 }else if(!visit||visit.egg!==s.egg){report.status='mismatch';warnings.push('The current Virtue and lifetime shift count do not match this plan. Check that this is the same account and ascension.');}
 // Remaining plans start at the PC time, using a previously checked backup.
 // That same backup (or a newer one) remains valid after applying the plan.
 // Bind the continuation timestamp to the actual saved starting snapshot;
 // unrelated/malformed metadata must not loosen ordinary freshness checks.
 const continuation=raw.plan?.continuation,sourceTime=Number(raw.importInfo?.timestamp);
 const remainingStart=continuation?.version===1&&Number.isFinite(continuation.snapshotTime)&&continuation.snapshotTime>0&&continuation.snapshotTime===sourceTime&&sourceTime<=result.start;
 const earliest=remainingStart?sourceTime:result.start;
 if(time&&time<earliest){report.status='mismatch';warnings.push(remainingStart?'This backup is older than the starting farm snapshot for this remaining plan. Sync the game and check a newer backup.':'This backup predates the plan start. Sync the game and check a newer backup.');}
 if(time&&time>now+300){report.status='mismatch';warnings.push('The backup timestamp is in the future. Check the backup time before following this plan.');}
 if(s.eggs.some((n,i)=>n+Math.max(1,base.s.eggs[i])*1e-12<base.s.eggs[i])){report.status='mismatch';warnings.push('Lifetime delivered eggs are below the saved starting values. Check the account and ascension.');}
 if(!time)warnings.push('No snapshot timestamp was supplied. Visit and purchase checks use the entered farm values; calendar timing cannot be checked.');
 const supplied=new Set((Array.isArray(confirmed)?confirmed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<rows.length));
 const equips=rows.filter(row=>row.stage===offset&&row.action.type==='set');
 const matchedEquip=equips.filter(row=>gear(row.action.loadout||base.c.loadouts[row.action.set])===gear(live.c.loadouts[s.set])).at(-1);
 for(const row of rows){
  const a=row.action;let done=false,checkable=true;
  switch(a.type){
   case 'research':done=s.r[a.i]>=a.to;break;
   case 'hab':done=s.h[a.slot]!==null&&s.h[a.slot]>=a.id;break;
   case 'vehicle':done=s.v[a.slot].id!==null&&s.v[a.slot].id>=a.id;break;
   case 'car':done=s.v[a.slot].id===11&&s.v[a.slot].cars>=a.toCars;break;
   case 'silo':done=s.silos>=row.siloTarget;break;
   case 'set':checkable=false;done=!!matchedEquip&&row.stage===offset&&row.index===matchedEquip.index;break;
   default:checkable=false;
  }
  if(checkable){report.purchaseCount++;if(done)report.confirmedPurchases++;}
  row.status=done?'present':interaction(a)?'interaction':row.stage<offset?'earlier':row.stage>offset?'later':'pending';
  if(manualTypes.has(a.type)&&!interaction(a)&&supplied.has(row.index))row.status='confirmed';
  if(a.type==='ship-run'){
   const counts=launched?.[row.index],valid=Array.isArray(counts)&&counts.length===a.batches?.length&&counts.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=a.batches[i].count);
   row.launchesReviewed=valid||supplied.has(row.index);
   row.remainingLaunches=supplied.has(row.index)?0:a.count-(valid?counts.reduce((n,x)=>n+x,0):0);
   row.remainingBatches=(a.batches||[]).map((b,i)=>({...b,count:supplied.has(row.index)?0:b.count-(valid?counts[i]:0)})).filter(b=>b.count>0);
   if(valid&&row.remainingLaunches===0)row.status='confirmed';
  }
  if(a.type==='set'&&matchedEquip&&row.stage===offset&&row.index<matchedEquip.index)row.status='superseded';
  if(a.type==='wait'&&report.targetReached&&/^(Collect .*Truth Egg|Deliver enough eggs)/.test(a.reason||''))row.status='target-met';
  row.canConfirm=manualTypes.has(a.type)&&!interaction(a)&&!row.displayHidden&&(row.stage===offset||a.type==='ship-run'&&row.stage<offset);
  if(a.type==='research'&&!done)row.remainingFrom=s.r[a.i];
  if(a.type==='car'&&!done)row.remainingFromCars=s.v[a.slot].cars;
  report.rows.push(row);
 }
 // A reached visit does not prove the earlier route was followed or upgrades paid.
 const missed=report.rows.filter(r=>r.stage<offset&&['research','hab','vehicle','car','silo'].includes(r.action.type)&&r.status!=='present');
 const baselineMissing=base.s.r.some((n,i)=>s.r[i]<n)||base.s.h.some((n,i)=>n!==null&&(s.h[i]===null||s.h[i]<n))||base.s.v.some((v,i)=>v.id!==null&&(s.v[i].id===null||s.v[i].id<v.id||v.id===11&&s.v[i].id===11&&s.v[i].cars<v.cars))||s.silos<startingSilos;
 if((missed.length||baselineMissing)&&report.status!=='claimed-target'){report.status='mismatch';warnings.push('Earlier required upgrades are missing from this snapshot. Review the farm and remaining route before continuing.');}
 if(report.rows.some(row=>row.stage<offset&&!row.displayHidden&&['fuel','fuel-dump','ship-run','ship-visit'].includes(row.action.type)&&row.status!=='confirmed'))warnings.push('Earlier fuel transfers or launch batches have not been confirmed. Reaching this visit does not prove they were completed; review the original walkthrough.');
 if(report.status==='matched'){
  const active=report.rows.filter(row=>row.stage===offset&&!row.displayHidden&&row.action.type!=='shift'&&row.status!=='interaction');
  // Calendar and wake-time conditions can be checked from the backup clock.
  // The PC clock alone does not advance progress, and elapsed resource waits
  // still need observed purchases, delivered eggs, or manual confirmation.
  for(const row of active)if(row.status==='pending'&&time&&clockWait(row.action)&&Number.isFinite(row.action.end)&&row.action.end>=row.action.t&&time>=row.action.end){row.status='elapsed';row.canConfirm=false;}
  for(const [i,row] of active.entries()){
   if(['present','confirmed','superseded','target-met','elapsed'].includes(row.status))continue;
   if(row.action.type==='wait'&&['Go offline, then return to collect earnings','Accumulate cash online','One offline break to fund a batch of purchases'].includes(row.action.reason)){
    // A funding wait needs no extra confirmation once its following purchase
    // is observed. Resource and delivery waits still need evidence.
    const following=[];
    for(const next of active.slice(i+1)){
     if(Guide.visibleWait(next.action)&&(next.status!=='elapsed'||following.length))break;
     if(next.action.type!=='wait')following.push(next);
    }
    if(following.length&&following.every(r=>['present','confirmed','superseded'].includes(r.status))){row.status='superseded';continue;}
   }
   report.next=row;break;
  }
  if(!report.next){const next=report.rows.find(row=>row.stage===offset+1&&row.action.type==='shift');report.next=next||null;}
 }
 return report;
}
function nextGroup(report,current){
 if(report.status!=='matched'||!report.next||report.next.action.type==='shift')return null;
 const remaining=report.rows.filter(row=>row.stage===report.stage&&!row.displayHidden&&row.index>=report.next.index&&!['present','confirmed','superseded','target-met','elapsed'].includes(row.status));
 const actions=remaining.map(row=>{
  const a=row.action;
  if(a.type==='research')return {...a,from:row.remainingFrom??a.from};
  if(a.type==='car')return {...a,fromCars:row.remainingFromCars??a.fromCars};
  if(a.type==='ship-run'&&row.remainingLaunches!==a.count)return {...a,count:row.remainingLaunches,batches:row.remainingBatches};
  return a;
 });
 if(!actions.length)return null;
 return Guide.build(actions,{start:actions[0].t,end:Math.max(...actions.map(a=>a.end??a.t)),silos:current.farm.silos??1,fuelCapacity:report.fuelCapacity})[0]||null;
}
module.exports={compare,key,snapshot,nextGroup};
