'use strict';
const DEFAULT_ROUTE=require('./default-route.cjs');
const E=require('./opening-search.cjs'),S=require('./simulator.cjs'),O=require('./optimizer.cjs');
const Strategy=require('./planning-strategy.cjs');
module.exports=function nextAscension(config,result){
 const verified=O.replay(config,result.actions,false,{enforceOpeningCaps:result.openingTimeLimits===true,oneStartingSilo:result.initialSiloRule==='one'?true:undefined}),s=verified.s,claimed=S.teByEgg(s,verified.c),total=claimed.reduce((a,b)=>a+b,0);
 if(total>=490)throw Error('All 490 Truth Eggs are already available.');
 const next=structuredClone(config);next.label='Next ascension — immediate start';
 next.farm={...next.farm,virtue:'curiosity',cash:0,claimed,delivered:s.eggs.slice(),soulEggs:s.soul,shiftCount:s.shiftCount,research:{},habs:[0,null,null,null],vehicles:Array.from({length:17},(_,i)=>({id:i===0?0:null,cars:1})),silos:1,shipFlights:s.shipFlights.filter(f=>f.returnAt>s.t),fuelTank:{...(next.farm.fuelTank||{}),capacity:verified.c.ships.capacity,outputPerMinute:verified.c.ships.outputPerSecond*60,amounts:Object.fromEntries(S.EGGS.map((egg,i)=>[egg,s.fuel[i]]))}};
 if(result.actions.some(a=>a.type==='set'&&a.loadout)){next.farm.loadouts={...next.farm.loadouts,current:structuredClone(verified.c.loadouts[s.set])};next.farm.activeSet='current';}
 if(!config.farm.fuelTank&&!verified.c.ships.enabled)delete next.farm.fuelTank;
 const strategy=Strategy.selected(config.plan);
 next.plan={...next.plan,strategy,strategyVersion:2,c1MaxMinutes:E.maximum(verified.c.c1MaxMinutes),k1MaxMinutes:E.maximum(verified.c.k1MaxMinutes),start:s.t,target:Math.min(490,total+10),floors:Array(5).fill(0),maxSwitches:verified.c.maxSwitches,autoSequence:strategy!=='user',initialPhysicalPurchases:false,sequence:strategy==='user'?structuredClone(config.plan.sequence):[...DEFAULT_ROUTE]};
 delete next.plan.openingStepMinutes;
 S.prepare(next);return next;
};
