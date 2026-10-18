'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{Worker}=require('node:worker_threads');
const {SearchPool,count}=require('../src/search-pool.cjs'),R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs');
function factory(){
 const sandbox={};vm.runInNewContext(fs.readFileSync(require.resolve('../worker-source.js'),'utf8'),sandbox);
 const code="const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=m=>parentPort.postMessage(m);parentPort.on('message',data=>self.onmessage({data}));\n"+sandbox.VIRTUE_WORKER_SOURCE;
 const native=new Worker(code,{eval:true}),wrapper={postMessage:data=>native.postMessage(data),terminate:()=>native.terminate()};
 native.on('message',data=>wrapper.onmessage?.({data}));native.on('error',error=>wrapper.onerror?.(error));return wrapper;
}
async function run(){
 assert.equal(count(2),1);assert.equal(count(4),2);assert.equal(count(undefined),1);
 const fake=[];const pool=new SearchPool(()=>{if(fake.length===2)throw Error('No memory');const worker={messages:[],postMessage(m){this.messages.push(m);},terminate(){this.stopped=true;}};fake.push(worker);return worker;},{workers:4});
 assert.equal(pool.workers.length,2);
 const test=require('./purchase-economics.cjs').capacityPlan();let reply;pool.onmessage=({data})=>reply=data;pool.postMessage({config:test.raw,options:{maxMs:3000}});
 assert.equal(fake[0].messages[0].options.absoluteDeadline,fake[1].messages[0].options.absoluteDeadline);assert.equal(fake[1].messages[0].options.portfolioVariant,1);
 pool.receive(0,{type:'task-claim',id:1,key:'same-work'});pool.receive(1,{type:'task-claim',id:2,key:'same-work'});
 assert.equal(fake[0].messages.at(-1).taskReply.granted,true);assert.equal(fake[1].messages.at(-1).taskReply.granted,false);
 pool.receive(0,{type:'task-release',key:'same-work'});pool.receive(1,{type:'task-claim',id:3,key:'same-work'});assert.equal(fake[1].messages.at(-1).taskReply.granted,false);
 pool.receive(1,{type:'task-claim',id:4,key:'failed-work'});
 pool.receive(0,{type:'candidate',candidate:{config:test.raw,result:{...test.plan,end:test.plan.end+1}}});assert.equal(pool.best.size,0);
 pool.receive(0,{type:'candidate',candidate:{config:test.raw,result:test.plan}});assert.equal(pool.best.size,1);assert.ok(fake[1].messages.some(m=>m.seed));
 const foreign=structuredClone(test.raw);foreign.farm.cash+=1;pool.receive(1,{type:'candidate',candidate:{config:foreign,result:test.plan}});assert.equal(pool.best.size,1);
 pool.postMessage({cancel:true});assert.ok(fake.every(w=>w.messages.at(-1).cancel));
 pool.receive(1,{type:'error',error:'Simulated sibling failure'});assert.equal(reply,undefined);pool.receive(0,{type:'result',result:test.plan});assert.ok(reply.result.validatedReplay);assert.equal(reply.result.end,test.plan.end);assert.ok(reply.result.search.parallel.rejected>=2);pool.terminate();assert.ok(fake.every(w=>w.stopped));
 assert.equal(pool.taskStats.releasedOnFailure,1);assert.equal(pool.tasks.has('failed-work'),false);assert.equal(pool.taskStats.duplicatesAvoided,1);
 async function execute(request,stop=false){
  const search=new SearchPool(factory,{workers:stop?4:2});
  try{return await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{search.terminate();reject(Error('Parallel worker test timed out'));},30000);
   search.onmessage=({data})=>{if(data.type==='progress')return;clearTimeout(timeout);resolve(data);};search.postMessage(request);
   if(stop)setTimeout(()=>search.postMessage({cancel:true}),400);
  });}finally{search.terminate();}
 }
 const request={config:test.raw,options:{maxMs:5000,width:4,incumbent:{config:test.raw,result:test.plan}}};
 for(const stop of [false,true]){
  const data=await execute(request,stop);assert.equal(data.type,'result',data.error);assert.ok(data.result.end<=test.plan.end+.01);assert.equal(data.result.search.parallel.workers,stop?4:2);if(!stop)assert.ok(data.result.explored>0);
  for(const {plan} of data.result.shiftPlans){const paid=R.replay(test.raw,plan.actions,true);assert.ok(S.reached(paid.s,paid.c));assert.equal(paid.s.t,plan.end);}
 }
 const remaining=require('./search-refinements.cjs').savedAlternatives(),continued=await execute({continuation:remaining,options:{maxMs:5000,width:4}});
 assert.equal(continued.type,'continuation',continued.error);assert.equal(continued.continuation.sourceKey,require('../src/plan-continuation.cjs').sourceKey(remaining));
 require('../src/plan-continuation.cjs').verified(continued.continuation.config,continued.continuation.result);
 assert.ok(continued.continuation.result.search.parallel.verified>0);
 console.log('PASS search pool: independent real workers, shared paid/replayed winners, common deadline, resource fallback, foreign/invalid candidate rejection, failed sibling recovery, cancellation and continuation source identity.');
}
module.exports={run,factory};if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
