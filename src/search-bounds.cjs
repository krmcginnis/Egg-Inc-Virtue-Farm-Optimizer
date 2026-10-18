'use strict';
const S=require('./simulator.cjs'),Artifacts=require('./artifact-optimizer.cjs');
const owned=new WeakMap();
function remaining(s,c){return c.autoSequence?[0,1,2,3,4]:c.sequence.slice(s.stage);}
function ceiling(s,c){
 const visits=remaining(s,c),n=S.clone(s);
 if(s.t<(c.researchDeadline??Infinity)&&visits.some((egg,i)=>egg===0&&s.stage+i<(c.finalCStage??Infinity)))n.r=S.D.research.map(r=>r.levels);
 if(visits.includes(1))n.h=[18,18,18,18];
 if(visits.includes(4)){const r=S.stats(n,c);n.v=n.v.map((_,i)=>({id:i<r.slots?11:null,cars:r.trainLength}));}
 let context=c;
 if(visits.includes(2)){
  const effects=Object.values(c.mods);
  if(c.artifactModel){if(!owned.has(c.artifactModel))owned.set(c.artifactModel,Artifacts.optimisticModifiers(c.artifactModel));effects.push(owned.get(c.artifactModel));}
  const mods=Object.fromEntries(Object.keys(c.mods[s.set]).map(key=>[key,Math.max(...effects.map(m=>m[key]))]));
  n.set='optimistic-bound';context={...c,mods:{...c.mods,[n.set]:mods}};
 }
 // Instant free legal upgrades, independently strongest owned gear, no fuel
 // diversion, and uninterrupted production can only improve actual delivery.
 return S.stats(n,context).delivery;
}
function requiredEggs(s,c){
 const te=S.teByEgg(s,c),floors=te.map((n,i)=>Math.max(n,c.floors[i]));let cost=0;
 for(let egg=0;egg<5;egg++)if(floors[egg]>te[egg])cost+=Math.max(0,S.D.te[floors[egg]-1]-s.eggs[egg]);
 const needed=Math.max(0,c.target-floors.reduce((a,b)=>a+b,0)),marginals=[];
 for(let egg=0;egg<5;egg++)for(let next=floors[egg]+1;next<=98;next++){
  const previous=next===te[egg]+1?s.eggs[egg]:S.D.te[next-2];marginals.push(Math.max(0,S.D.te[next-1]-previous));
 }
 // Ignoring prefix dependencies between milestones is a relaxation, including
 // if a future dataset has nonconvex increments. Never assume greedy optimality.
 marginals.sort((a,b)=>a-b);if(needed>marginals.length)return Infinity;
 for(let i=0;i<needed;i++)cost+=marginals[i];return cost;
}
function earliest(s,c){
 const amount=requiredEggs(s,c);if(amount===0)return s.t;
 const rate=ceiling(s,c);if(!Number.isFinite(rate))return s.t;
 if(!(rate>0))return Infinity;
 return s.t+amount*(1-1e-10)/(rate*(1+1e-10));
}
function minimumStage(s,c){
 if(c.autoSequence)return s.stage;
 const possible=S.teByEgg(s,c);let h=s.egg===2;
 for(let stage=s.stage;stage<c.sequence.length;stage++){
  const egg=c.sequence[stage];possible[egg]=98;h||=egg===2;
  if(possible.reduce((a,b)=>a+b,0)>=c.target&&possible.every((n,i)=>n>=c.floors[i])&&(!c.ships?.enabled||s.shipsDone||h))return stage;
 }
 return Infinity;
}
module.exports={ceiling,requiredEggs,earliest,minimumStage};
