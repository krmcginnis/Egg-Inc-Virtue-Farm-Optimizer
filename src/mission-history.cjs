'use strict';
const Ships=require('./ships.cjs');
const statuses={EXPLORING:10,RETURNED:15,ANALYZING:16,COMPLETE:20,ARCHIVED:25,ABORTED:30};
const key=m=>m.ship+':'+m.duration;
function read(backup,time){
 const db=backup.artifactsDb,reset=backup.virtue?.resets??0;
 if(!db||!Number.isSafeInteger(reset)||reset<0)return null;
 const records=new Map();let omitted=0;
 for(const m of [...(db.missionArchive||[]),...(db.missionInfos||[])]){
  if(m.type!==1&&m.type!=='VIRTUE'||(m.resetIndex??0)!==reset)continue;
  const status=typeof m.status==='string'?statuses[m.status]:m.status;
  if(![10,15,16,20,25,30].includes(status))continue; // Fueling/ready is not sent.
  const ship=typeof m.ship==='string'?m.ship:Ships.DATA.ships[Number(m.ship??0)]?.id,duration=typeof m.durationType==='string'?m.durationType:['SHORT','LONG','EPIC','TUTORIAL'][Number(m.durationType??0)];
  let launch=Number(m.startTimeDerived)||0;
  if(!launch&&status===10&&time>0&&Number(m.durationSeconds)>0&&Number(m.secondsRemaining)>=0)launch=time+Number(m.secondsRemaining)-Number(m.durationSeconds);
  if(!m.identifier||!Ships.MAP[ship]||!['SHORT','LONG','EPIC','TUTORIAL'].includes(duration)||status===30&&launch<=0){omitted++;continue;}
  const prior=records.get(m.identifier),returnAt=launch>0&&Number(m.durationSeconds)>0?launch+Number(m.durationSeconds):0;
  const record={identifier:m.identifier,ship,duration,launch,active:status===10&&(!returnAt||returnAt>time)};
  // Archive and active lists may contain the same mission. Keep one identity,
  // carrying a usable launch date from either copy and the latest status.
  records.set(m.identifier,{...record,launch:record.launch||prior?.launch||0});
 }
 return {version:1,resetIndex:reset,observedAt:time,archiveIncluded:Array.isArray(db.missionArchive),omitted,records:[...records.values()]};
}
function summarize(current,{start=null,initial=null}={}){
 const history=current?.importInfo?.virtueMissionHistory;
 if(history?.version!==1||!Array.isArray(history.records))return null;
 if(current.importInfo.virtueResetIndex!==undefined&&history.resetIndex!==current.importInfo.virtueResetIndex)return null;
 if(initial?.importInfo?.virtueResetIndex!==undefined&&history.resetIndex!==initial.importInfo.virtueResetIndex)return null;
 if(history.observedAt!==current.importInfo.timestamp)return null;
 const previous=new Set((initial?.farm?.shipFlights||[]).map(m=>m.identifier).filter(Boolean)),seen=new Set(),groups=new Map();let total=0,active=0,undated=0;
 for(const m of history.records){
  if(!m.identifier||seen.has(m.identifier)||!Ships.MAP[m.ship]||!['SHORT','LONG','EPIC','TUTORIAL'].includes(m.duration))continue;seen.add(m.identifier);
  if(start!==null){if(!(m.launch>0)){undated++;continue;}if(m.launch<start||m.launch>history.observedAt||previous.has(m.identifier))continue;}
  total++;if(m.active)active++;
  const id=key(m),group=groups.get(id)||{ship:m.ship,duration:m.duration,label:Ships.mission(m.ship,m.duration).label,count:0,active:0};group.count++;if(m.active)group.active++;groups.set(id,group);
 }
 return {total,active,returned:total-active,groups:[...groups.values()],incomplete:!history.archiveIncluded||history.omitted>0||undated>0,undated};
}
function counts(raw,result,current,rows){
 const summary=summarize(current,{start:result.start,initial:raw});if(!summary)return null;
 const stock=new Map(summary.groups.map(g=>[key(g),g.count])),launched={};
 // Match real launches to the original ordered mission obligations, even if
 // a player sent a later visit's ships early. Prepared ships never enter stock.
 for(const row of rows.filter(r=>r.action.type==='ship-run'))launched[row.index]=(row.action.batches||[]).map(b=>{const id=key(b),n=Math.min(b.count,stock.get(id)||0);stock.set(id,(stock.get(id)||0)-n);return n;});
 return {summary,launched};
}
module.exports={read,summarize,counts};
