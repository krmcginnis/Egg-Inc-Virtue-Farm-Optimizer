'use strict';
const S=require('./simulator.cjs'),W=require('./waiting-objective.cjs');

// One cache per solve: never reuse a previous farm, plan, or interrupted run.
// Keys use exact values, not rounded times, cash bands, or research totals.
class Checkpoints {
 constructor({maxEntries=256,maxActions=40000}={}){
  this.entries=new Map();this.models=new WeakMap();this.nextModel=0;
  this.maxEntries=maxEntries;this.maxActions=maxActions;this.actions=0;
  this.hits=0;this.misses=0;this.evictions=0;
 }
 key(s,c,operation,localPurchases=false){
  let model=null;
  if(c.artifactModel){if(!this.models.has(c.artifactModel))this.models.set(c.artifactModel,++this.nextModel);model=this.models.get(c.artifactModel);}
  const {path,depth,...state}=s;
  // Local recipes stay on the same C, K, or I. They neither shift nor launch
  // ships, so identical openings can be shared across different route endings.
  // General continuations must match the entire route and mission context.
  if(localPurchases&&![0,1,4].includes(s.egg))throw Error('Only local C, K, and I purchases can share route-independent checkpoints.');
  const context={start:c.start,end:c.end,claimed:c.claimed,epic:c.epic,col:c.col,
   pro:c.pro,video:c.video,earningsMode:c.earningsMode,earningsScale:c.earningsScale,
   researchCostScale:c.researchCostScale,offlineMinSeconds:c.offlineMinSeconds,
   actionsSeconds:c.actionsSeconds,shiftSeconds:c.shiftSeconds,calendar:c.calendar,
   routeResearchRule:c.routeResearchRule,researchDeadline:c.researchDeadline,
   researchAllowed:s.stage<c.finalCStage,enforceOpeningCaps:c.enforceOpeningCaps,
   c1MaxMinutes:c.c1MaxMinutes,k1MaxMinutes:c.k1MaxMinutes,
   batchOffline:c.batchOffline,batchMode:c.batchMode,model,
   loadouts:model?null:c.loadouts,currentGear:c.loadouts[s.set],
   ...(localPurchases?{}:{sequence:c.sequence,autoSequence:c.autoSequence,maxSwitches:c.maxSwitches,
    finalCStage:c.finalCStage,finalResearchStage:c.finalResearchStage,lastVisits:c.lastVisits,
    target:c.target,floors:c.floors,ships:c.ships,stagedShips:c.stagedShips,
    deferShips:c.deferShips,shipReplay:c.shipReplay})};
  return JSON.stringify([operation,state,W.offlineBreaks(s),context]);
 }
 run(s,c,operation,compute,checkpoint=()=>{},localPurchases=false,keepCompletedOnStop=false){
  checkpoint();const key=this.key(s,c,operation,localPurchases),entry=this.entries.get(key);
  if(entry){
   this.hits++;this.entries.delete(key);this.entries.set(key,entry);
   const data=structuredClone(entry.data);
   for(const [name,slots] of Object.entries(data.sets)){
    if(c.loadouts[name]&&JSON.stringify(c.loadouts[name])!==JSON.stringify(slots))throw Error('Checkpoint artifact set differs from its recorded gear.');
    c.loadouts[name]=slots;c.mods[name]=S.modifiers(slots);
   }
   let path=s.path;for(const action of data.actions)path={prev:path,action};
   checkpoint();return {...data.state,path,depth:s.depth+data.depth};
  }
  this.misses++;const n=compute();
  try{checkpoint();}catch(error){
   // A synchronous recipe may complete just after its time slice. Keep its
   // valid paid result for this search, but never cache a stopped operation.
   if(keepCompletedOnStop&&n)return n;throw error;
  }
  if(!n)return n;
  const actions=[];let p=n.path;for(;p&&p!==s.path;p=p.prev)actions.push(p.action);
  if(p!==s.path)throw Error('Checkpoint result does not extend its paid starting path.');
  actions.reverse();
  if(actions.length>this.maxActions||this.maxEntries<=0)return n;
  const {path,depth,...state}=n,sets=S.recordedArtifactSets(actions);
  if(c.loadouts[n.set])sets[n.set]=c.loadouts[n.set];
  const data=structuredClone({state,actions,sets,depth:n.depth-s.depth});
  while(this.entries.size&&(this.entries.size>=this.maxEntries||this.actions+actions.length>this.maxActions)){
   const oldest=this.entries.keys().next().value;this.actions-=this.entries.get(oldest).count;this.entries.delete(oldest);this.evictions++;
  }
  this.entries.set(key,{data,count:actions.length});this.actions+=actions.length;
  return n;
 }
 summary(){return {hits:this.hits,misses:this.misses,entries:this.entries.size,actions:this.actions,evictions:this.evictions};}
}
module.exports={Checkpoints};
