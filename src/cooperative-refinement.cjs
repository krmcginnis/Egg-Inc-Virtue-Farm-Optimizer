'use strict';
// Keep each async comparison's stack alive between
// complete paid trials; a slice pauses at yield rather than discarding its cursor.
function scope(parent,pause,stopped){
 let context=parent.context,route=parent.route;
 return new Proxy({}, {
  get(_,key){
   if(key==='context')return context;if(key==='route')return route;
   if(key==='yield')return pause;if(key==='cancelled')return ()=>stopped()||parent.cancelled();
   if(key==='consider')return state=>{
    if(stopped())return;const oldContext=parent.context,oldRoute=parent.route;
    parent.context=context;parent.route=route;
    try{parent.consider(state);}finally{parent.context=oldContext;parent.route=oldRoute;}
   };
   return parent[key];
  },
  set(_,key,value){if(key==='context')context=value;else if(key==='route')route=value;else parent[key]=value;return true;}
 });
}
async function run({jobs,control,deadline,cancelled=()=>false,quality=()=>({revision:0,best:Infinity}),progress=()=>{},yield:pause=()=>Promise.resolve(),claim,release,maxJobs=120,maxSliceMs=5000}){
 const done=new Set(),pending=new Map(),holders=new Map(),kinds=new Map(),coverage=new Map(),retry=new Map();
 let slices=0,skipped=0,resumed=0,completedJobs=0,failedJobs=0,termination='exhausted';
 function holder(job){
  const h={stopped:false,complete:false,resume:null,reject:null,signal:null,promise:null};
  const suspend=()=>new Promise((resolve,reject)=>{if(h.stopped)return reject(Error('Comparison stopped'));h.resume=resolve;h.reject=reject;h.signal(false);});
  h.control=scope(control,suspend,()=>h.stopped);
  h.advance=()=>new Promise(resolve=>{
   h.signal=resolve;
   if(h.promise){const resume=h.resume;h.resume=h.reject=null;resume();}
   else h.promise=Promise.resolve().then(()=>job.run(deadline,h.control)).then(()=>{h.complete=true;h.exhausted=!h.stopped&&!cancelled()&&Date.now()<deadline;h.signal(true);},error=>{h.error=error;h.complete=true;h.exhausted=false;h.signal(true);});
  });
  return h;
 }
 try{while(slices<maxJobs){
  if(cancelled()){termination='cancelled';break;}if(Date.now()>=deadline){termination='budget';break;}
  for(const job of jobs())if(!done.has(job.id)&&!pending.has(job.id))pending.set(job.id,job);
  if(!pending.size)break;
  const available=[...pending.values()].filter(job=>(retry.get(job.id)||0)<=Date.now());
  if(!available.length){await new Promise(r=>setTimeout(r,20));await pause();continue;}
  const priority=job=>{const h=kinds.get(job.kind);return !h?1e9-job.level:(1+h.improvements+Math.log1p(h.gainSeconds))/(10+h.elapsedMs)/(1+job.level*.25);};
  // Explore every family/depth before cheap new winners get another turn.
  // Within a coverage tier, resume an existing cursor before starting over.
  const covered=job=>coverage.get(job.kind+':'+job.level)||0;
  available.sort((a,b)=>covered(a)-covered(b)||Number(holders.has(b.id))-Number(holders.has(a.id))||priority(b)-priority(a)||a.level-b.level||(b.priority||0)-(a.priority||0)||a.id.localeCompare(b.id));
  const job=available[0];
  if(claim){const answer=await claim(job);if(!(answer===true||answer?.granted)){
   if(answer===false||answer?.complete){done.add(job.id);pending.delete(job.id);skipped++;}else retry.set(job.id,Date.now()+100);
   await pause();continue;
  }}
  let h=holders.get(job.id);if(h)resumed++;else{h=holder(job);holders.set(job.id,h);}
  const before=quality(),start=Date.now(),until=Math.min(deadline,start+maxSliceMs);progress(job);
  do{await h.advance();await pause();}while(!h.complete&&!cancelled()&&Date.now()<until);
  const after=quality(),record=kinds.get(job.kind)||{calls:0,elapsedMs:0,improvements:0,gainSeconds:0};
  record.calls++;record.elapsedMs+=Date.now()-start;record.improvements+=Number(after.revision>before.revision);record.gainSeconds+=Math.max(0,Number.isFinite(before.best)?before.best-after.best:0);kinds.set(job.kind,record);
  slices++;const family=job.kind+':'+job.level;coverage.set(family,(coverage.get(family)||0)+1);
  if(h.complete){done.add(job.id);pending.delete(job.id);holders.delete(job.id);if(h.exhausted)completedJobs++;if(h.error&&!h.stopped&&!cancelled()&&Date.now()<deadline)failedJobs++;}
  release?.(job,!!h.exhausted);
 }}finally{
  // Release suspended stacks on stop; no comparison can run after the solver
  // returns its best result. Worker ownership handles unfinished-job recovery.
  for(const h of holders.values())if(!h.complete){h.stopped=true;h.reject?.(Error('Comparison stopped'));}
  await Promise.allSettled([...holders.values()].map(h=>h.promise));
 }
 if(slices===maxJobs)termination='limit';
 return {jobs:slices,completedJobs,resumedSlices:resumed,failedJobs,skipped,pending:pending.size,termination,coverage:Object.fromEntries(coverage),kinds:Object.fromEntries(kinds)};
}
module.exports={scope,run};
