'use strict';
const D=require('./game-data.json');
// Only the research vector is cached. Cash, time, gear, events and farm
// calibration remain live inputs to stats. Each prepared farm owns its cache;
// spread contexts share it only within that prepared simulation.
const owners=new WeakMap();
// Identity bookkeeping must not travel with structured-cloned contexts. The
// numeric memo remains cloneable; a cloned cache lazily gets fresh identities.
function identities(cache){if(!cache.arrays)Object.defineProperty(cache,'arrays',{value:new WeakMap()});return cache.arrays;}
function create(limit=2048){const cache={values:new Map(),limit,hits:0,misses:0};identities(cache);return cache;}
function same(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
function inherit(source,copy){const known=owners.get(source);if(known){identities(known.cache).set(copy,known.entry);owners.set(copy,known);}}
function calculate(levels){
 const out={eggValue:1,layMult:1,habMult:1,portalMult:1,shipMult:1,hoverMult:1,loopMult:1,slots:4,lowerTier:[]},tiers=[];
 for(let i=0;i<D.research.length;i++){
  const r=D.research[i],l=levels[i];tiers[r.tier]=(tiers[r.tier]||0)+l;if(!l)continue;
  const k=r.categories.split(','),v=r.levels_compound==='multiplicative'?r.per_level**l:1+r.per_level*l;
  if(k.includes('egg_value'))out.eggValue*=v;if(k.includes('egg_laying_rate'))out.layMult*=v;
  if(k.includes('hab_capacity')){if(r.id==='wormhole_dampening')out.portalMult*=v;else out.habMult*=v;}
  if(k.includes('shipping_capacity')){if(r.id==='hover_upgrades')out.hoverMult*=v;else if(r.id==='hyper_portalling')out.loopMult*=v;else out.shipMult*=v;}
  if(k.includes('fleet_size')&&r.id!=='micro_coupling')out.slots+=l*r.per_level;
 }
 let sum=0;for(let tier=1;tier<=D.tierUnlock.length;tier++){out.lowerTier[tier]=sum;sum+=tiers[tier]||0;}
 return out;
}
function get(levels,cache){
 if(!cache)return calculate(levels);
 const arrays=identities(cache),prior=arrays.get(levels);if(prior&&same(prior.levels,levels)){cache.hits++;return prior.value;}
 const key=levels.join(',');let value=cache.values.get(key);
 if(value)cache.hits++;else{cache.misses++;value=calculate(levels);
  if(cache.values.size>=cache.limit)cache.values.delete(cache.values.keys().next().value);
  cache.values.set(key,value);
 }
 const entry={levels:levels.slice(),value};arrays.set(levels,entry);owners.set(levels,{cache,entry});return value;
}
module.exports={create,calculate,get,inherit};
