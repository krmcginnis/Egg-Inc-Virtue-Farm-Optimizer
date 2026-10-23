'use strict';
// Only the run's shift anchor and allowance are retained, never its farm or EID.
const KEY='virtue-optimizer.run-shifts.v1';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const valid=record=>record?.version===1&&integer(record.startShiftCount)&&integer(record.totalShiftBudget)&&integer(record.observedShiftCount)&&record.observedShiftCount>=record.startShiftCount&&Array.isArray(record.claimed)&&record.claimed.length===5&&record.claimed.every(integer)&&Number.isFinite(record.observedAt)&&record.observedAt>=0&&(record.resetIndex===undefined||integer(record.resetIndex));
function identity(raw){
 const f=raw?.farm;
 if(!integer(f?.shiftCount)||!Array.isArray(f.claimed)||f.claimed.length!==5||!f.claimed.every(integer))return null;
 return {shiftCount:f.shiftCount,claimed:f.claimed.slice(),resetIndex:raw.importInfo?.virtueResetIndex};
}
function status(raw,record=raw?.runShifts){
 const id=identity(raw);
 if(!id||!valid(record)||record.startShiftCount>id.shiftCount||JSON.stringify(id.claimed)!==JSON.stringify(record.claimed))return null;
 if(integer(id.resetIndex)&&integer(record.resetIndex)&&id.resetIndex!==record.resetIndex)return null;
 const used=id.shiftCount-record.startShiftCount;
 return {record,used,remaining:Math.max(0,record.totalShiftBudget-used),overBudget:used>record.totalShiftBudget};
}
function create(raw,used,total){
 const id=identity(raw);
 if(!id||!integer(used)||used>id.shiftCount)throw Error('Shifts used this run must be a whole number between zero and the lifetime shift count.');
 if(!integer(total))throw Error('Total run shift limit must be a nonnegative whole number.');
 const time=Number(raw.importInfo?.timestamp);
 return {version:1,startShiftCount:id.shiftCount-used,totalShiftBudget:total,claimed:id.claimed,...(integer(id.resetIndex)?{resetIndex:id.resetIndex}:{}),observedShiftCount:id.shiftCount,observedAt:Number.isFinite(time)&&time>0?time:0};
}
function observe(raw,record){
 if(!valid(record))return null;
 const time=Number(raw.importInfo?.timestamp)||0;
 if(time>0&&record?.observedAt>0&&time<record.observedAt)throw Error('This backup is older than the last run shift check. Sync the game and load a newer backup.');
 const known=status(raw,record);
 if(!known)return null;
 if(raw.farm.shiftCount<record.observedShiftCount)return null;
 return create(raw,known.used,record.totalShiftBudget);
}
function fromPlan(raw){
 const known=status(raw);if(known)return known.record;
 const prior=raw?.plan?.continuation;
 // A plan generated midway through a run is not evidence of zero shifts used.
 // Only saved run/continuation metadata, or a zero lifetime count, establishes it.
 if(!prior&&raw?.farm?.shiftCount!==0)return null;
 if(prior&&(!integer(prior.consumedShifts)||!integer(prior.totalShiftBudget)))return null;
 try{return create(raw,prior?.consumedShifts??0,prior?.totalShiftBudget??raw.plan.maxShifts??raw.plan.maxSwitches??12);}catch{return null;}
}
function apply(raw,record){
 const next=structuredClone(raw),known=status(raw,record);
 if(known){next.runShifts=structuredClone(record);next.plan.maxShifts=known.remaining;delete next.plan.maxSwitches;}
 else delete next.runShifts;
 return next;
}
function load(storage,eid){
 try{const data=JSON.parse(storage.getItem(KEY)),record=data?.version===1?data.accounts?.[eid]:null;return valid(record)?record:null;}catch{return null;}
}
function save(storage,eid,record){
 if(!/^EI\d{16}$/.test(eid))return false;
 try{
  let data;try{data=JSON.parse(storage.getItem(KEY));}catch{}
  if(data?.version!==1||!data.accounts||typeof data.accounts!=='object')data={version:1,accounts:{}};
  if(record){
   if(!valid(record))return false;
   const previous=data.accounts[eid];
   // Undoing a UI reset must not make an older backup look newly acceptable.
   if(valid(previous)&&previous.startShiftCount===record.startShiftCount&&JSON.stringify(previous.claimed)===JSON.stringify(record.claimed)&&previous.resetIndex===record.resetIndex)record={...record,observedShiftCount:Math.max(previous.observedShiftCount,record.observedShiftCount),observedAt:Math.max(previous.observedAt,record.observedAt)};
   data.accounts[eid]=record;
  }else delete data.accounts[eid];
  storage.setItem(KEY,JSON.stringify(data));return true;
 }catch{return false;}
}
module.exports={KEY,status,create,observe,fromPlan,apply,load,save};
