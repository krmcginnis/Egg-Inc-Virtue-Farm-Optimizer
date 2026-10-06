'use strict';
const Ships=require('./ships.cjs');
const STATUS={EXPLORING:10,RETURNED:15,ANALYZING:16,FUELING:0,PREPARE_TO_LAUNCH:5};
// Virtue and home missions are separate. Slots are interchangeable, so assign
// stable slot numbers to the active Virtue flights rather than guessing IDs.
module.exports=function importMissions(backup,backupTime,now,warnings){
 const db=backup.artifactsDb||{},seen=new Set(),flights=[];
 const nested=db.virtueAfxDb?.fuelingMission;
 const missions=[...(db.missionInfos||[]),...(db.fuelingMission?[db.fuelingMission]:[]),...(nested?[{...nested,type:nested.type??1}]:[])];
 let fueling=false;
 for(const m of missions){
  if(m.type!==1&&m.type!=='VIRTUE')continue;
  const status=typeof m.status==='string'?STATUS[m.status]:m.status??0;
  if(status===0||status===5)fueling=true;
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
 if(fueling)warnings.push('A Virtue mission is being fueled or prepared. Finish or cancel it before following the planned launches; it is not added to your entered ship schedule.');
 if(flights.length)warnings.push(flights.length+' existing Virtue ship'+(flights.length===1?'':'s')+' imported. Returned ships are collected when a planned launch needs their slot.');
 return flights;
};
