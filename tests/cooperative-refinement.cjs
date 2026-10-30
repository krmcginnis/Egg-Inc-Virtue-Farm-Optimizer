'use strict';
const assert=require('node:assert/strict'),Q=require('../src/cooperative-refinement.cjs'),{SearchPool}=require('../src/search-pool.cjs'),R=require('../src/route-solver.cjs');
async function run(){
 const visited=[],states=[],parent={context:'original',route:'original',cancelled:()=>false,consider:s=>states.push([s,parent.context,parent.route])};
 const jobs=['a','b'].map(id=>({id,kind:id,level:0,run:async(end,c)=>{c.context=id;c.route=id;for(let i=0;i<5;i++){visited.push(id+i);c.consider(i);await c.yield();}}}));
 const found=await Q.run({jobs:()=>jobs,control:parent,deadline:Date.now()+2000,maxSliceMs:1,yield:()=>new Promise(r=>setTimeout(r,2))});
 assert.equal(found.termination,'exhausted');assert.equal(found.completedJobs,2);assert.ok(found.resumedSlices>0);assert.equal(visited.length,10);assert.equal(new Set(visited).size,10);assert.ok(states.every(([s,c,r])=>c===r&&['a','b'].includes(c)));assert.equal(parent.context,'original');
 let finished=false;const partial=await Q.run({jobs:()=>[{id:'stop',kind:'x',level:0,run:async(end,c)=>{try{while(!c.cancelled())await c.yield();}finally{finished=true;}}}],control:parent,deadline:Date.now()+2000,maxJobs:1,maxSliceMs:1,yield:()=>new Promise(r=>setTimeout(r,2))});
 assert.equal(partial.termination,'limit');assert.equal(partial.completedJobs,0);assert.ok(finished,'abandoned stacks unwind before returning');
 const fake=[],pool=new SearchPool(()=>{const w={postMessage:m=>w.last=m,terminate(){}};fake.push(w);return w;},{workers:2});
 pool.receive(0,{type:'task-claim',id:1,key:'partial'});assert.equal(fake[0].last.taskReply.granted,true);
 pool.receive(0,{type:'task-release',key:'partial',complete:false});assert.equal(pool.tasks.get('partial').complete,false);
 pool.receive(1,{type:'task-claim',id:2,key:'partial'});assert.equal(fake[1].last.taskReply.granted,false);assert.equal(fake[1].last.taskReply.complete,false);
 pool.receive(0,{type:'task-claim',id:3,key:'partial'});assert.equal(fake[0].last.taskReply.granted,true);assert.equal(pool.taskStats.resumed,1);
 pool.receive(0,{type:'task-release',key:'partial',complete:true});assert.equal(pool.tasks.get('partial').complete,true);pool.terminate();
 const levels=new Set(),many=[];for(let level=0;level<3;level++)for(let root=0;root<12;root++)many.push({id:root+':'+level,kind:'packages',level,run:async()=>{levels.add(level);}});
 const covered=await Q.run({jobs:()=>many,control:parent,deadline:Date.now()+1000,maxJobs:3});assert.deepEqual([...levels].sort(),[0,1,2]);assert.equal(covered.jobs,3);
 // Keep this wiring check separate from the expensive investment regression:
 // that pass can legitimately consume a short budget before adaptive work.
 const raw=require('./research-sale-plans.cjs').fixture();
 Object.assign(raw.plan,{strategy:'user',autoSequence:false,sequence:'C I',target:101,floors:[20,21,20,20,20],ships:{mode:'none'},sleep:{enabled:false}});
 const result=await R.solve(raw,{maxMs:5000,width:32,deepSearch:true}),paid=R.replay(raw,result.actions,true);
 assert.ok(require('../src/simulator.cjs').reached(paid.s,paid.c));assert.equal(paid.s.t,result.end);assert.equal(result.switches,1);assert.equal(result.search.effectiveWidth,32);assert.ok(result.search.adaptive);
 console.log('PASS resumable refinement: cursor retention without repeated steps, scoped paid context, safe stop cleanup, exclusive partial-job ownership, and deep solver replay.');
}
module.exports={run};if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
