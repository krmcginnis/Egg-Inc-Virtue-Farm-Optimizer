'use strict';
const S=require('./simulator.cjs');
// Exact multiple-choice DP for a RELAXED problem: upgrades are free, production
// is uninterrupted, and each egg has the same optimistic delivery ceiling.
// This table does not choose actual purchases or grant them to a real state.
class Patterns{
 constructor(limit=128){this.limit=limit;this.tables=new Map();this.hits=0;this.misses=0;}
 required(s,c,available){
  const te=S.teByEgg(s,c),minimum=te.map((n,i)=>Math.max(n,c.floors[i])),needed=Math.max(c.target,minimum.reduce((a,b)=>a+b,0));
  const key=JSON.stringify([s.eggs,te,c.floors,needed,[...available].sort()]);
  if(this.tables.has(key)){this.hits++;return this.tables.get(key);}
  this.misses++;let costs=new Float64Array(needed+1);costs.fill(Infinity);costs[0]=0;
  for(let egg=0;egg<5;egg++){
   const next=new Float64Array(needed+1);next.fill(Infinity);
   const max=available.has(egg)?98:te[egg];
   for(let total=0;total<=needed;total++)if(Number.isFinite(costs[total]))for(let goal=minimum[egg];goal<=max;goal++){
    const to=Math.min(needed,total+goal),cost=costs[total]+(goal>te[egg]?Math.max(0,S.D.te[goal-1]-s.eggs[egg]):0);
    if(cost<next[to])next[to]=cost;
   }
   costs=next;
  }
  const result=costs[needed];if(this.tables.size>=this.limit)this.tables.delete(this.tables.keys().next().value);this.tables.set(key,result);return result;
 }
}
module.exports={Patterns};
