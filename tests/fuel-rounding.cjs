'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),R=require('../src/route-solver.cjs'),Ships=require('../src/ships.cjs'),C=require('../src/plan-continuation.cjs'),F=require('../src/fuel-display.cjs'),G=require('../src/quick-guide.cjs'),U=require('../src/shift-summary.cjs'),P=require('../src/plan-progress.cjs');
function fixture(){
 const config=require('./research-sale-plans.cjs').fixture(),sequence=['curiosity','humility','curiosity','resilience','kindness','integrity','humility'];
 config.farm.fuelTank={capacity:500e12,amounts:{curiosity:174.794135e12,integrity:9e12,humility:0,resilience:140.106303e12,kindness:175.099562e12}};
 Object.assign(config.plan,{solverVersion:2,strategy:'user',autoSequence:false,sequence,maxShifts:6,maxSwitches:6,target:100,ships:{mode:'efficient-two-visits'},sleep:{enabled:false}});
 const {s,c}=R.prepare(config,sequence,3);let n=Ships.beforeShift(s,c);
 for(const egg of sequence.slice(1)){n=S.buy(n,c,{type:'shift',egg:S.EGGS.indexOf(egg)});n=egg==='humility'?Ships.launch(n,c):Ships.beforeShift(n,c);}
 const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{version:2,sequence,researchSales:3}});
 const result=C.verified(config,{version:1,solverVersion:2,initialSiloRule:'one',target:c.target,start:c.start,end:n.t,seconds:n.t-c.start,switches:n.stage,actions,researchDeadline:c.researchDeadline,actualResearchSales:0,frontier:[],explored:0,method:'Synthetic fuel rounding fixture',termination:'complete'});
 return {version:1,config,result};
}
function run(){
 for(const [n,expected] of [[0,0],[499999999999,0],[.5e12,1e12],[1.49e12,1e12],[1.5e12,2e12]])assert.equal(F.amount(n),expected);
 assert.equal(F.format(12.6e12),'13T');assert.equal(F.format(205865e6,200e9),'205.865B','small tanks retain useful sub-trillion steps');
 const mixed={type:'fuel-dump',removed:[106303e6,1.51e12,0,99562e6,0]};assert.equal(F.activity(mixed).value,'2T Integrity');
 const doc=fixture(),original=JSON.stringify(doc),summary=U.summarize(doc.config,doc.result),first=summary.shifts[0];
 assert.equal(doc.result.actions[1].amount,205865e6);assert.equal(first.quickGuide.length,0,'the reported discard/fill and one-second break disappear without an empty group');assert.ok(first.activities.every(a=>a.kind!=='fuel'));assert.equal(first.displayFuelSeconds,0);assert.ok(first.fuelSeconds>0,'hidden collection time stays in exact accounting');
 const visible=summary.shifts.flatMap(s=>s.quickGuide.flatMap(g=>g.activities)).filter(a=>a.kind==='fuel');assert.ok(visible.length>0);assert.ok(visible.every(a=>!/[BMK]|\.\d/.test(a.value)));
 const larger=G.build([{type:'fuel',t:10,end:40,egg:0,amount:1.49e12}],{start:10,end:40});assert.equal(larger[0].activities[0].value,'1T');assert.equal(larger[0].afterBreak.seconds,30);
 const backup=structuredClone(doc.config);backup.importInfo={timestamp:doc.result.start};
 const progress=P.compare(doc.config,doc.result,backup,{now:doc.result.start+1});assert.equal(progress.next.index,2);assert.equal(progress.next.action.type,'shift');assert.ok(progress.rows.slice(0,2).every(r=>r.displayHidden&&!r.canConfirm));assert.equal(P.nextGroup(progress,backup),null);
 const replay=R.replay(doc.config,doc.result.actions,true);assert.equal(replay.s.t,doc.result.end);assert.ok(S.reached(replay.s,replay.c));assert.equal(JSON.stringify(doc),original,'display rounding never edits paid actions, fuel or dates');
 console.log('PASS fuel display: nearest 1T boundaries, zero/mixed discards, hidden tiny fills and breaks, retained substantial waits/small-tank fuel, progress skip, exact immutable fuel and full paid replay.');
}
module.exports={fixture,run};if(require.main===module)run();
