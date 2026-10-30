'use strict';
const {SearchPool}=require('./search-pool.cjs'),Plans=require('./shift-plans.cjs');
const R=require('./route-solver.cjs'),S=require('./simulator.cjs'),Verify=require('./plan-verification.cjs');
const PURCHASE_CHECK_MS=300000;
// Merge search islands first, then check the final choices, outside the route
// search deadline. Retain per-count winners and check every available final comparison.
class EvaluatedSearch{
 constructor(factory,{purchaseCheckMs=PURCHASE_CHECK_MS,dispose=()=>{},...options}={}){
  this.factory=factory;this.purchaseCheckMs=purchaseCheckMs;this.dispose=dispose;
  this.pool=new SearchPool(factory,options);this.phase='search';this.checkers=new Set();this.checks=new Map();this.progress=new Map();this.closed=false;this.stopped=false;this.peakCheckWorkers=0;
  this.pool.onmessage=event=>this.receiveSearch(event.data);
 }
 postMessage(data){
  if(this.closed)return;
  if(data.cancel){this.stopped=true;if(this.phase==='search')this.pool.postMessage(data);else for(const job of this.checkers)job.worker.postMessage(data);return;}
  this.request=data;this.pool.postMessage({...data,options:{...data.options,disableExactRefinement:true}});
 }
 receiveSearch(data){
  if(this.closed)return;
  if(data.type==='progress'){this.onmessage?.({data});return;}
  const result=data.type==='continuation'?data.continuation.result:data.result;
  if(!result||!['result','continuation'].includes(data.type)||result.solverVersion!==2){this.emit(data);return;}
  this.envelope=data;this.config=data.continuation?.config||this.request.config;this.specified=result.specifiedSwitches;
  this.plans=new Map([...this.pool.best.values()].map(({plan})=>[plan.switches,{switches:plan.switches,plan:{...plan,search:result.search,explored:result.explored,elapsedMs:result.elapsedMs}}]));
  for(const entry of result.shiftPlans||[{switches:result.switches,plan:result}])this.plans.set(entry.switches,entry);
  this.phase='purchases';this.checkStarted=Date.now();this.checkDeadline=this.checkStarted+this.purchaseCheckMs;
  this.nextChecks();
 }
 pair(){return Plans.shortlist([...this.plans.values()],undefined,this.specified);}
 report(job,p={}){
  if(job)this.progress.set(job.switches,p.explored||0);
  const pair=this.pair(),done=pair.filter(e=>this.checks.get(e.switches)?.status==='complete').length;
  this.onmessage?.({data:{type:'progress',progress:{phase:'purchase-evaluation',stage:job?job.switches+' shifts · '+(p.stage||'Preparing purchase groups'):'Checking final plan purchases',checkedPlans:done,planCount:pair.length,explored:[...this.progress.values()].reduce((a,b)=>a+b,0),bestSeconds:Math.min(...pair.map(e=>e.plan.seconds),p.bestSeconds??Infinity)}}});
 }
 nextChecks(){
  if(this.closed||this.checkers.size)return;
  const pending=this.pair().filter(entry=>!this.checks.has(entry.switches));
  if(this.stopped||!pending.length){this.finish();return;}
  this.report();
  if(this.closed)return;
  if(this.stopped){this.finish();return;}
  const jobs=[];
  for(const entry of pending.slice(0,Math.min(2,this.pool.workers.length))){
   try{jobs.push({worker:this.factory(),switches:entry.switches,plan:entry.plan});}catch{break;}
  }
  if(!jobs.length){
   for(const entry of pending)this.checks.set(entry.switches,{status:'error',error:'A purchase-check worker could not start.'});
   this.finish();return;
  }
  this.peakCheckWorkers=Math.max(this.peakCheckWorkers,jobs.length);
  // A worker fallback reserves time for the remaining plans. Later replacement
  // choices get the remaining budget, with a minimum cancellable work slice.
  const maxMs=Math.max(100,(this.checkDeadline-Date.now())/Math.ceil(pending.length/jobs.length));
  for(const job of jobs){
   this.checkers.add(job);
   job.worker.onmessage=({data})=>this.receiveCheck(job,data);
   job.worker.onerror=error=>this.receiveCheck(job,{type:'error',error:error.message||'Purchase-check worker failed.'});
  }
  for(const job of jobs)try{job.worker.postMessage({verification:{config:this.config,result:job.plan},options:{maxMs,absoluteDeadline:Date.now()+maxMs}});}catch(error){this.receiveCheck(job,{type:'error',error:error.message});}
 }
 receiveCheck(job,data){
  if(this.closed||!this.checkers.has(job))return;
  if(data.type==='progress'){this.report(job,data.progress);return;}
  let status;
  try{
   if(data.type!=='verification')throw Error(data.error||'Purchase check did not return a result.');
   const plan=data.result,{s,c}=R.replay(this.config,plan.actions,true),old=R.replay(this.config,job.plan.actions,true).s;
   const verification=Verify.checkpoint(this.config,plan.verification);
   if(!verification||!S.reached(s,c)||s.t!==plan.end||s.stage!==job.switches||plan.seconds!==s.t-c.start||plan.target!==c.target||R.better(old,s))throw Error('The purchase-check result failed replay or made the plan worse.');
   const checked={...plan,validatedReplay:true,finalTE:S.teByEgg(s,c),finalCash:s.cash,finalStats:S.stats(s,c)};delete checked.shiftPlans;delete checked.summary;
   this.plans.set(job.switches,{switches:job.switches,plan:checked});
   this.progress.set(job.switches,verification.examined);
   status={status:verification.complete?'complete':'paused',completedBlocks:verification.completedBlocks,totalBlocks:verification.totalBlocks,examined:verification.examined};
  }catch(error){status={status:'error',error:error.message};}
  this.checks.set(job.switches,status);this.checkers.delete(job);job.worker.terminate();
  // Wait for the cohort before reranking. If a cheaper-shift plan becomes the
  // fastest, check the new exact-one-fewer choice rather than returning it raw.
  this.nextChecks();
 }
 finish(){
  const entries=this.pair(),plans=entries.map(e=>({switches:e.switches,...(this.checks.get(e.switches)||{status:'not-started'})}));
  const evaluation={version:1,status:plans.every(p=>p.status==='complete')?'complete':this.stopped?'paused':'partial',budgetMs:this.purchaseCheckMs,elapsedMs:Date.now()-this.checkStarted,workers:this.peakCheckWorkers,attemptedPlans:this.checks.size,plans};
  const result=Plans.create(entries.map(e=>({...e,plan:{...e.plan,automaticPurchaseCheck:this.checks.get(e.switches)||{status:'not-started'},purchaseEvaluation:evaluation}})),this.specified);
  this.emit(this.envelope.type==='continuation'?{...this.envelope,continuation:{...this.envelope.continuation,result}}:{...this.envelope,result});
 }
 emit(data){if(this.closed)return;this.terminate();this.onmessage?.({data});}
 terminate(){if(this.closed)return;this.closed=true;this.pool.terminate();for(const job of this.checkers)job.worker.terminate();this.checkers.clear();this.dispose();}
}
module.exports={EvaluatedSearch,PURCHASE_CHECK_MS};
