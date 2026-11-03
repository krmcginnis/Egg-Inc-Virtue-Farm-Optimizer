'use strict';
const virtue=m=>m.type===1||m.type==='VIRTUE';
const live=m=>[0,5,10,15,16,'FUELING','PREPARE_TO_LAUNCH','EXPLORING','RETURNED','ANALYZING'].includes(m.status??0);
function read(backup){
 const db=backup.artifactsDb||{},reset=backup.virtue?.resets??0,nested=db.virtueAfxDb?.fuelingMission;
 // Current live records and the Virtue-only fueling pad supply their scope.
 // Queued mission metadata can retain defaults until launch; the current
 // Virtue-only pad supplies both its mission type and reset scope.
 const active=(db.missionInfos||[]).map(m=>virtue(m)&&live(m)?{...m,resetIndex:m.resetIndex??reset}:m);
 const pending=[...(nested?[{...nested,type:1,resetIndex:reset}]:[]),...(db.fuelingMission?[{...db.fuelingMission,resetIndex:db.fuelingMission.resetIndex??reset}]:[])];
 return {active,pending,archive:db.missionArchive||[],reset};
}
module.exports={read};
