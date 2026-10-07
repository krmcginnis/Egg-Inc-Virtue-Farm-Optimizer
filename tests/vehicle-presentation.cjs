"use strict";
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),U=require('../src/shift-summary.cjs'),blank=require('../src/blank-farm.cjs');
const raw=blank(1791244800);Object.assign(raw.farm,{virtue:'kindness',cash:1e60,soulEggs:1e30,claimed:Array(5).fill(10),research:Object.fromEntries(S.D.research.map(r=>[r.id,r.levels]))});Object.assign(raw.plan,{target:50,strategy:'user',autoSequence:false,maxSwitches:0,sequence:['kindness'],actionSeconds:0});
const {s,c}=S.prepare(raw);let n=s;for(const [slot,id]of [[0,11],[1,9],[2,2]])n=S.buy(n,c,{type:'vehicle',slot,id});n=S.advance(n,c,n.t+10,'Collect eggs');
const actions=S.history(n),before=structuredClone(actions),summary=U.summarize(raw,{start:c.start,end:n.t,actions});
const names=items=>items.filter(a=>a.label==='Vehicles').map(a=>a.value);
assert.deepEqual(names(summary.shifts[0].activities),['1 × Pickup','1 × Hover Semi','1 × Hyperloop Train']);assert.deepEqual(names(summary.shifts[0].quickGuide[0].activities),names(summary.shifts[0].activities));assert.deepEqual(actions,before);assert.deepEqual(actions.filter(a=>a.type==='vehicle').map(a=>a.id),[11,9,2]);
console.log('PASS slower vehicles first in summary/quick guide; purchase order remains unchanged.');
