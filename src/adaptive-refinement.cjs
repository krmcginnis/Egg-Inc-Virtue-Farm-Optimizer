'use strict';
// Spend unused search time on distinct neighborhoods. Successful kinds get
// more attention, while each untried kind receives a turn. Exhausted work ends
// early; this never spins merely to consume a wall-clock budget.
async function run({jobs,deadline,cancelled=()=>false,quality=()=>({revision:0,best:Infinity}),progress=()=>{},yield:pause=()=>Promise.resolve(),claim,release,maxJobs=36,maxSliceMs=5000}){
 const done=new Set(),kinds=new Map(),retry=new Map();let completed=0,skipped=0,termination='exhausted';
 while(completed<maxJobs){
  if(cancelled()){termination='cancelled';break;}
  if(Date.now()>=deadline){termination='budget';break;}
  const all=jobs().filter(job=>!done.has(job.id));if(!all.length)break;
  const pending=all.filter(job=>(retry.get(job.id)||0)<=Date.now());
  if(!pending.length){await new Promise(r=>setTimeout(r,20));await pause();continue;}
  const priority=job=>{const h=kinds.get(job.kind);return !h?1e9-job.level:(1+h.improvements+Math.log1p(h.gainSeconds))/(10+h.elapsedMs)/(1+job.level*.25);};
  pending.sort((a,b)=>priority(b)-priority(a)||a.level-b.level||(b.priority||0)-(a.priority||0)||a.id.localeCompare(b.id));
  const job=pending[0],before=quality(),started=Date.now(),slice=Math.min(maxSliceMs,Math.max(1,(deadline-started)/Math.min(4,pending.length)));
  if(claim){const response=await claim(job),granted=response===true||response?.granted;
   if(!granted){if(response?.complete||response===false){done.add(job.id);skipped++;}else retry.set(job.id,Date.now()+100);await pause();continue;}
  }
  done.add(job.id);
  progress(job);
  try{await job.run(Math.min(deadline,started+slice));}catch{}finally{release?.(job);}
  const after=quality(),record=kinds.get(job.kind)||{calls:0,elapsedMs:0,improvements:0,gainSeconds:0};
  record.calls++;record.elapsedMs+=Date.now()-started;record.improvements+=Number(after.revision>before.revision);record.gainSeconds+=Math.max(0,Number.isFinite(before.best)?before.best-after.best:0);kinds.set(job.kind,record);
  completed++;await pause();
 }
 if(completed===maxJobs)termination='limit';
 return {jobs:completed,skipped,termination,kinds:Object.fromEntries(kinds)};
}
module.exports={run};
