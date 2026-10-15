'use strict';
const assert=require('node:assert/strict'),G=require('../src/quick-guide.cjs');
const actions=[
 {type:'research',i:0,from:0,to:1,t:100},
 {type:'wait',t:100,end:101,reason:'Purchase interaction time',earningsMode:'online'},
 {type:'wait',t:101,end:161,reason:'One offline break to fund a batch of purchases',earningsMode:'offline'},
 {type:'research',i:1,from:0,to:1,t:161},
 {type:'research',i:0,from:1,to:2,t:161},
 {type:'wait',t:161,end:281,reason:'One offline break to fund a batch of purchases',earningsMode:'offline'},
 {type:'research',i:1,from:1,to:2,t:281},
 {type:'wait',t:281,end:341,reason:'Collect Truth Eggs',earningsMode:'offline'}
];
const before=structuredClone(actions),steps=G.build(actions,{start:100,end:341});
assert.equal(steps.length,4);assert.equal(steps[0].break,null);assert.equal(steps[0].activities[0].value,'0 → 1');
assert.equal(steps[1].start,101);assert.equal(steps[1].purchaseStart,161);assert.equal(steps[1].break.seconds,60);assert.equal(steps[1].activities.length,2);assert.equal(steps[1].end,161);
assert.equal(steps[2].break.seconds,120);assert.equal(steps[2].activities[0].value,'1 → 2');
assert.equal(steps[3].break.reason,'Collect Truth Eggs');assert.equal(steps[3].activities.length,0);assert.equal(steps[3].end,341);
assert.deepEqual(actions,before);
const leading=G.build(actions.slice(2,5),{start:101,end:161});assert.equal(leading.length,1);assert.equal(leading[0].activities.length,2);assert.equal(leading[0].break.start,101);
const consecutive=G.build([{type:'wait',t:0,end:60,reason:'Sleep',sleepSeconds:60,earningsMode:'offline'},{type:'wait',t:60,end:120,reason:'Fund research',earningsMode:'offline'},{type:'research',i:0,from:0,to:1,t:120}],{start:0,end:120});assert.equal(consecutive.length,2);assert.equal(consecutive[0].break.end,60);assert.equal(consecutive[1].break.start,60);assert.equal(consecutive[1].activities.length,1);
const fuel=G.build([{type:'wait',t:0,end:60,reason:'Wait',earningsMode:'offline'},{type:'fuel',t:60,end:100,egg:0,amount:100}],{start:0,end:100});assert.equal(fuel.length,1);assert.equal(fuel[0].break.mode,'offline');assert.equal(fuel[0].afterBreak.mode,'fuel');assert.equal(fuel[0].end,100);
assert.equal(G.build([{type:'wait',t:0,end:60,reason:'Collect eggs',earningsMode:'offline'}],{start:0,end:60})[0].break.seconds,60);
assert.ok(!G.visibleWait({type:'wait',t:0,end:3,reason:'Purchase interaction time',earningsMode:'online'}));
console.log('PASS funding breaks precede their batches; leading, trailing, consecutive, fuel and interaction waits keep exact ordering and immutable actions.');
