'use strict';
const Ships=require('./ships.cjs');
const Records=require('./mission-records.cjs');
const STATUS={EXPLORING:10,RETURNED:15,ANALYZING:16,FUELING:0,PREPARE_TO_LAUNCH:5};
// Virtue and home missions are separate. Slots are interchangeable, so assign
// stable slot numbers to the active Virtue flights rather than guessing IDs.
module.exports=function importMissions(backup,backupTime,now,warnings){
 const records=Records.read(backup),seen=new Set(),flights=[];
 const missions=[...records.active,...records.pending];
 for(const m of missions){
  if(m.type!==1&&m.type!=='VIRTUE'||(m.resetIndex??0)!==records.reset)continue;
  const status=typeof m.status==='string'?STATUS[m.status]:m.status??0;
  if(![10,15,16].includes(status))continue;
  if(m.identifier&&seen.has(m.identifier))continue;
  if(m.identifier)seen.add(m.identifier);
  const launch=Number(m.startTimeDerived),duration=Number(m.durationSeconds),remaining=Number(m.secondsRemaining);
  let returnAt;
  if(status!==10)returnAt=now;
  else if(launch>0&&Number.isFinite(launch)&&duration>0&&Number.isFinite(duration))returnAt=launch+duration;
  else if(backupTime>0&&Number.isFinite(backupTime)&&remaining>=0&&Number.isFinite(remaining))returnAt=backupTime+remaining;
  else throw Error('An active Virtue ship has no usable return time. Sync the game and retry the import.');
  const ship=typeof m.ship==='string'?m.ship:Ships.DATA.ships[Number(m.ship??0)]?.id;
  const durationType=typeof m.durationType==='string'?m.durationType:['SHORT','LONG','EPIC','TUTORIAL'][Number(m.durationType??0)];
  flights.push({slot:flights.length+1,returnAt,ship,duration:durationType,identifier:m.identifier||undefined,imported:true});
 }
 if(flights.length>3)throw Error('The backup contains more than three active Virtue ships. Sync the game and retry.');
 return flights;
};
function prepared(backup){
 return fuelingMission(backup);
}
function fuelingMission(backup){
 const source=Records.read(backup),records=[...source.pending,...source.active],reset=source.reset;
 const ready=records.filter(m=>(m.ship!==undefined||m.identifier||(m.fuel||[]).length)&&(m.type===1||m.type==='VIRTUE')&&[0,5,'FUELING','PREPARE_TO_LAUNCH'].includes(m.status??0)&&(m.resetIndex??0)===reset);
 if(!ready.length)return null;
 const m=ready[0],ship=typeof m.ship==='string'?m.ship:Ships.DATA.ships[Number(m.ship??0)]?.id,duration=typeof m.durationType==='string'?m.durationType:['SHORT','LONG','EPIC','TUTORIAL'][Number(m.durationType??0)];
 const recipe=Ships.mission(ship,duration).fuel,loaded=Array(5).fill(0),hasFuel=Array.isArray(m.fuel)&&m.fuel.length>0;
 for(const fuel of m.fuel||[]){const egg=typeof fuel.egg==='string'?Ships.EGGS.indexOf(fuel.egg.toLowerCase()):Number(fuel.egg)-50;if(egg<0||egg>4)continue;const amount=Number(fuel.amount??0);if(!Number.isFinite(amount)||amount<0)throw Error('The queued ship has an invalid loaded fuel amount. Sync the game and retry.');loaded[egg]=Math.max(loaded[egg],Math.min(recipe[egg],amount));}
 const reportedReady=m.status===5||m.status==='PREPARE_TO_LAUNCH';
 if(!hasFuel&&reportedReady)recipe.forEach((amount,i)=>loaded[i]=amount);
 const complete=recipe.every((needed,i)=>loaded[i]+Math.max(1,needed)*1e-12>=needed);
 if(complete)recipe.forEach((amount,i)=>loaded[i]=amount);
 if(ready.some(x=>x.identifier&&m.identifier&&x.identifier!==m.identifier))throw Error('The backup contains multiple ready Virtue ships. Sync the game and retry.');
 return {ship,duration,identifier:m.identifier||undefined,status:complete?'PREPARE_TO_LAUNCH':'FUELING',reportedStatus:m.status??0,loadedFuel:loaded};
}
module.exports.prepared=prepared;
module.exports.fueling=fuelingMission;
