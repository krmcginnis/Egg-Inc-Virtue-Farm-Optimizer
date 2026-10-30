'use strict';
const assert=require('assert/strict'),Routes=require('../src/automatic-routes.cjs'),Nearby=require('../src/route-neighborhoods.cjs'),Normalize=require('../src/switch-sequence.cjs'),R=require('../src/route-solver.cjs'),S=require('../src/simulator.cjs');
const fixture=require('./research-sale-plans.cjs').fixture;
function run(){
 const raw=fixture();Object.assign(raw.plan,{strategy:'wasmegg',strategyVersion:2,autoSequence:true,maxShifts:6,ships:{mode:'none'},sleep:{enabled:false}});
 const expected=Normalize.normalize('C H K C R H I','curiosity'),routes=Routes.generate(raw);
 assert.ok(routes.some(route=>JSON.stringify(route)===JSON.stringify(expected)),'an unseeded current-farm search considers the six-shift gear/build cycle');
 assert.ok(routes.some(route=>route.length-1===5),'shorter choices remain available');
 assert.ok(!raw.plan.continuation);
 const untouched=structuredClone(raw);untouched.farm.research={};untouched.plan.maxShifts=12;
 const standard=Routes.generate(untouched),developed=Routes.generate({...raw,plan:{...raw.plan,maxShifts:12}});
 assert.ok(standard.length<=14,'the original fresh-ascension portfolio is unchanged');
 assert.ok(standard.every(route=>developed.some(next=>JSON.stringify(route)===JSON.stringify(next))),'compact additions retain every established proposal');
 for(const virtue of S.EGGS)for(const maxShifts of [0,1,2,3,4,5,6,7,8,10,12]){
  const config=structuredClone(raw);config.farm.virtue=virtue;config.plan.maxShifts=maxShifts;
  const proposals=Routes.generate(config);assert.ok(proposals.length<=23);
  if(maxShifts===6)assert.ok(proposals.some(route=>route.length-1===6),'six-shift coverage for every starting Virtue');
  assert.equal(new Set(proposals.map(r=>r.join(' '))).size,proposals.length);
  for(const route of proposals){assert.equal(route[0],virtue);assert.ok(route.length-1<=maxShifts);assert.ok(route.every((egg,i)=>i===0||egg!==route[i-1]));}
 }
 // Neighborhood refinement can spend a spare shift, while its bounded prefix
 // still includes deletions/reorders. A fully used allowance never grows.
 const source=Normalize.normalize('C K C R H I','curiosity'),nearby=Nearby.proposals(source,'curiosity',6);
 assert.ok(nearby.slice(0,9).some(route=>JSON.stringify(route)===JSON.stringify(expected)));
 assert.ok(nearby.slice(0,9).some(route=>route.length<source.length));
 assert.ok(Nearby.proposals(source,'curiosity',5).every(route=>route.length<=source.length));
 assert.equal(new Set(nearby.map(r=>r.join(' '))).size,nearby.length);
 const manual=structuredClone(raw);Object.assign(manual.plan,{strategy:'user',autoSequence:false,sequence:source});assert.deepEqual(R.routes(manual),[source]);
 const continuation=structuredClone(raw);Object.assign(continuation.plan,{sequence:expected,continuation:{version:1}});assert.deepEqual(R.routes(continuation)[0],expected,'the paid original suffix remains first');
 // An unseeded solve pays for the extra visit and can return a real six-shift
 // completion. The target/floors prevent it from finishing before the tail.
 const full=structuredClone(raw);full.plan.floors=[21,21,21,21,21];full.plan.target=105;full.farm.cash=1e100;
 const {s,c}=R.prepare(full,expected,3),end=R.seedRoute(s,c,180);assert.ok(end);assert.equal(end.stage,6);assert.ok(S.reached(end,c));
 const actions=S.history(end).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence:expected,researchSales:3}});
 const paid=R.replay(full,actions,true);assert.equal(paid.s.t,end.t);assert.equal(paid.s.stage,6);
 process.stdout.write('PASS automatic route coverage: unseeded compact gear/build cycles, bounded distinct routes across starts/allowances, growing neighborhoods within limits, preserved manual/continuation routes, and independently paid six-shift completion.\n');
}
module.exports={run};if(require.main===module)run();
