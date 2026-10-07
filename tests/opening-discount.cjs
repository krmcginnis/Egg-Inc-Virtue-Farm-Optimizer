'use strict';
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),T=require('../src/staged-route.cjs'),R=require('../src/wasmegg-stage-engine.cjs'),blank=require('../src/blank-farm.cjs');
function fixture(pro,discount){const raw=blank(1791388800);Object.assign(raw.farm,{proPermit:pro,soulEggs:1e30,claimed:Array(5).fill(20),epic:{bust_unions:discount,epic_egg_laying:20,transportation_lobbyist:30},habs:Array(4).fill(18),research:Object.fromEntries(S.D.research.map(r=>[r.id,r.tier<=10?r.levels:0])),colleggtibles:{vehicleCost:.9}});return raw;}
for(const pro of [false,true])for(const discount of [0,3,10]){
 const raw=fixture(pro,discount),{s,c}=S.prepare(raw),before=structuredClone(c.epic),adapted=T.adapt(s,c);
 assert.equal(adapted.context.epicResearchLevels.cheaper_vehicles,discount);assert.notEqual(adapted.context.epicResearchLevels,c.epic);
 const proposal=R.runK1(adapted.state,adapted.context,7200);let state=S.mutate(s,c,{type:'shift',egg:4}),vehicles=0,cars=0;
 for(const action of proposal.actions){let purchase;if(action.type==='buy_vehicle'){purchase={type:'vehicle',slot:action.payload.slotIndex,id:action.payload.vehicleId};vehicles++;}else if(action.type==='buy_train_car'){purchase={type:'car',slot:action.payload.slotIndex};cars++;}else continue;
  const expected=S.price(state,c,purchase);assert.ok(Math.abs(action.cost-expected)<=Math.max(1,expected)*1e-12,JSON.stringify({discount,purchase,proposed:action.cost,expected}));state=S.mutate(state,c,purchase);
 }
 assert.ok(vehicles&&cars);assert.deepEqual(c.epic,before);
 adapted.context.epicResearchLevels.cheaper_vehicles=999;assert.deepEqual(c.epic,before,'proposal-local aliases never modify account Epic Research');
}
// A missed discount truncates the bounded purchase proposal, even when the
// actual simulator can afford more. Compare the same synthetic farm and budget.
const raw=fixture(true,10),{s,c}=S.prepare(raw),a=T.adapt(s,c),correct=R.runK1(a.state,a.context,7200),wrong=R.runK1(a.state,{...a.context,epicResearchLevels:{...a.context.epicResearchLevels,cheaper_vehicles:0}},7200);
assert.ok(correct.actions.filter(a=>a.type==='buy_vehicle'||a.type==='buy_train_car').length>wrong.actions.filter(a=>a.type==='buy_vehicle'||a.type==='buy_train_car').length);
const actual=T.step(s,{...c,k1MaxMinutes:120,enforceOpeningCaps:true},'K1',4,()=>correct,7200);assert.ok(actual.t-s.t<=7200+1e-5);
const replayed=S.history(actual);let check=s;for(const action of replayed){if(action.type==='wait')check=S.advance(check,c,action.end,action.reason,false,action.earningsMode);else check=S.buy(check,{...c,shiftSeconds:0,actionsSeconds:0},action,false);}assert.deepEqual(check.v,actual.v);assert.ok(Math.abs(check.cash-actual.cash)<=Math.max(1,actual.cash)*1e-12);
console.log('PASS Bust Unions proposal prices for vehicles/cars, both permits and three discount levels; bounded K1 truncation regression, actual 120-minute cap, independent affordability replay and unchanged account data.');
