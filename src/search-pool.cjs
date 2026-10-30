'use strict';
const R=require('./route-solver.cjs'),S=require('./simulator.cjs'),ShiftPlans=require('./shift-plans.cjs');
const Incumbents=require('./plan-incumbents.cjs');
const ShiftLimits=require('./shift-limits.cjs');
function count(cores){return Number(cores)>=4?2:1;}
// Independent search islands exchange only complete paid/replayed winners.
class SearchPool{
 constructor(factory,{workers=count(globalThis.navigator?.hardwareConcurrency)}={}){
  this.workers=[];this.best=new Map();this.done=new Set();this.responses=[];this.verified=0;this.rejected=0;this.contributors=new Set();this.closed=false;
  this.tasks=new Map();this.taskStats={claimed:0,duplicatesAvoided:0,completed:0,resumed:0,releasedOnFailure:0};
  for(let i=0;i<Math.max(1,Math.min(4,Math.floor(Number(workers))||1));i++)try{const worker=factory();this.workers.push(worker);worker.onmessage=({data})=>this.receive(i,data);worker.onerror=error=>this.receive(i,{type:'error',error:error.message||'Search worker failed.'});}catch(error){if(!this.workers.length)throw error;break;}
 }
 postMessage(data){
  if(data.cancel){for(const worker of this.workers)worker.postMessage(data);return;}
  this.request=data;if(data.config){this.configKey=Incumbents.key(data.config);this.config=data.config;}this.started=Date.now();this.deadline=this.started+Number(data.options?.maxMs??90000);
  for(let i=0;i<this.workers.length;i++)this.workers[i].postMessage({...data,options:{...data.options,absoluteDeadline:this.deadline,portfolioVariant:i,compactResults:true,shareCandidates:true,coordinateTasks:this.workers.length>1&&data.options?.coordinateTasks!==false}});
 }
 accept(candidate,source){
  if(!candidate?.config||!candidate.result)return false;
  const key=Incumbents.key(candidate.config);if(this.configKey&&key!==this.configKey){this.rejected++;return false;}
  let added=false;
  for(const entry of candidate.result.shiftPlans||[{plan:candidate.result}])try{
   const plan=entry.plan,{s,c}=R.replay(candidate.config,plan.actions,true);
   if(!S.reached(s,c)||s.t!==plan.end||s.stage!==plan.switches||plan.seconds!==s.t-c.start||plan.target!==c.target)throw Error('Shared plan failed replay.');
   this.configKey=key;this.config=candidate.config;this.verified++;
   const previous=this.best.get(s.stage),checked={...plan,validatedReplay:true,finalTE:S.teByEgg(s,c),finalCash:s.cash,finalStats:S.stats(s,c)};
   delete checked.shiftPlans;
   if(!R.better(s,previous?.state)){if(previous&&!R.better(previous.state,s)&&plan.termination!=='Shared search candidate')this.best.set(s.stage,{state:s,plan:checked});continue;}
   this.best.set(s.stage,{state:s,plan:checked});this.contributors.add(source);added=true;
   for(let i=0;i<this.workers.length;i++)if(i!==source&&!this.done.has(i))this.workers[i].postMessage({seed:{config:this.config,result:checked}});
  }catch{this.rejected++;}
  return added;
 }
 receive(index,data){
  if(this.closed||this.done.has(index))return;
  if(data.type==='task-claim'){
   const task=this.tasks.get(data.key),resuming=task?.owner===index&&!task.complete&&task.paused,granted=typeof data.key==='string'&&(!task||resuming);
   if(resuming){task.paused=false;this.taskStats.resumed++;}
   else if(granted){this.tasks.set(data.key,{owner:index,complete:false,paused:false,declined:new Set()});this.taskStats.claimed++;}
   else if(task&&!task.declined.has(index)){task.declined.add(index);this.taskStats.duplicatesAvoided++;}
   this.workers[index].postMessage({taskReply:{id:data.id,granted,complete:!!task?.complete}});return;
  }
  if(data.type==='task-release'){const task=this.tasks.get(data.key);if(task?.owner===index&&!task.complete){if(data.complete===false)task.paused=true;else{task.complete=true;this.taskStats.completed++;}}return;}
  if(data.type==='progress'){if(index===0)this.onmessage?.({data:{...data,progress:{...data.progress,workers:this.workers.length}}});return;}
  if(data.type==='candidate'){this.accept(data.candidate,index);return;}
  this.responses.push(data);
  if(data.type==='result')this.accept({config:this.request.config,result:data.result},index);
  if(data.type==='continuation')this.accept({config:data.continuation.config,result:data.continuation.result},index);
  this.done.add(index);this.workers[index].terminate();
  for(const [key,task] of this.tasks)if(task.owner===index&&!task.complete){this.tasks.delete(key);this.taskStats.releasedOnFailure++;}
  if(this.done.size!==this.workers.length)return;
  if(!this.best.size){this.onmessage?.({data:this.responses.find(x=>x.suggestion)||this.responses[0]||{type:'error',error:'No complete plan found.'}});return;}
  const specified=this.config.plan.shiftComparisonVersion===2?ShiftLimits.specified(this.config):undefined;
  const entries=ShiftPlans.shortlist([...this.best.values()],undefined,specified);
  const islands=this.responses.map(x=>x.result?.search||x.continuation?.result?.search).filter(Boolean).map(s=>({variant:s.portfolioVariant||0,states:s.statesExamined||0,economics:s.purchaseEconomicsComparisons||0,packages:s.packageComparisons||0,researchInvestments:s.researchInvestmentComparisons||0,researchInvestmentReplays:s.researchInvestmentReplays||0,researchInvestmentPasses:s.researchInvestmentPasses||0,timings:s.additionalTimingComparisons||0,fineTimings:s.fineTimingComparisons||0,calculatedTimings:s.calculatedTimingComparisons||0,routes:s.routeNeighborhoodComparisons||0,recovered:s.reservedComparisons||0,imports:s.sharedImports||0,boundChecks:s.boundChecks||0,boundPruned:s.boundPruned||0}));
  const parallel={workers:this.workers.length,contributors:this.contributors.size,verified:this.verified,rejected:this.rejected,tasks:{...this.taskStats},islands};
  const total=key=>islands.reduce((sum,island)=>sum+island[key],0),totals={statesExamined:total('states'),purchaseEconomicsComparisons:total('economics'),packageComparisons:total('packages'),researchInvestmentComparisons:total('researchInvestments'),researchInvestmentReplays:total('researchInvestmentReplays'),researchInvestmentPasses:total('researchInvestmentPasses'),additionalTimingComparisons:total('timings'),fineTimingComparisons:total('fineTimings'),calculatedTimingComparisons:total('calculatedTimings'),routeNeighborhoodComparisons:total('routes'),reservedComparisons:total('recovered'),sharedImports:total('imports'),boundChecks:total('boundChecks'),boundPruned:total('boundPruned')};
  const shiftPlans=entries.map(({plan})=>({switches:plan.switches,plan:{...plan,explored:totals.statesExamined,elapsedMs:Date.now()-this.started,search:{...plan.search,...totals,parallel}}}));
  const result=ShiftPlans.create(shiftPlans,specified);
  const continuation=this.responses.find(x=>x.type==='continuation')?.continuation;
  if(this.request.continuation&&!continuation){this.onmessage?.({data:this.responses.find(x=>x.type==='error')||{type:'error',error:'The remaining plan could not be verified.'}});return;}
  this.onmessage?.({data:continuation?{type:'continuation',continuation:{...continuation,result}}:{type:'result',result}});
 }
 terminate(){this.closed=true;for(const worker of this.workers)worker.terminate();}
}
module.exports={SearchPool,count};
