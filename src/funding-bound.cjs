'use strict';
const S=require('./simulator.cjs'),Artifacts=require('./artifact-optimizer.cjs');
const optimistic=new WeakMap();
function gear(c,visits,s){
 if(!visits.includes(2))return c.mods[s.set];
 const effects=Object.values(c.mods);
 if(c.artifactModel){if(!optimistic.has(c.artifactModel))optimistic.set(c.artifactModel,Artifacts.optimisticModifiers(c.artifactModel));effects.push(optimistic.get(c.artifactModel));}
 return Object.fromEntries(Object.keys(c.mods[s.set]).map(k=>[k,k==='research'?Math.min(...effects.map(m=>m[k])):Math.max(...effects.map(m=>m[k]))]));
}
// A deadline-dependent relaxation, not an assumed purchase sequence. Even if
// ALL optimistic income could be banked on one farm, a level costing more than
// that budget cannot be bought by the deadline. Shrinking only impossible
// levels can then lower that optimistic income again (a monotone fixed point).
function at(s,c,end,visits){
 const n=S.clone(s),research=s.t<(c.researchDeadline??Infinity)&&visits.some((e,i)=>e===0&&(c.autoSequence||s.stage+i<(c.finalCStage??Infinity)));
 if(research)n.r=S.D.research.map(r=>r.levels);
 if(visits.includes(1))n.h=[18,18,18,18];
 if(visits.includes(4))n.v=n.v.map(()=>({id:11,cars:10}));
 const modifiers=gear(c,visits,s),context={...c,mods:{...c.mods,'funding-bound':modifiers}};n.set='funding-bound';
 const minimumDiscount=(1-.05*c.epic.cheaper_research)*c.col.researchCost*modifiers.research*c.researchCostScale*.3;
 let iterations=0,budget=Infinity;
 for(;research&&iterations<32;iterations++){
  const rates=S.stats(n,context),income=Math.max(rates.online,rates.offline)*2;
  // Prices are rounded UP by the simulator. Rounding down and inflating the
  // budget makes the relaxation conservative at large floating point values.
  budget=(s.cash+Math.max(0,Math.min(end,c.researchDeadline??end)-s.t)*income)*(1+1e-9)+1;
  if(!Number.isFinite(budget))break;
  let changed=false;
  for(let i=0;i<n.r.length;i++){
   let cost=0,cap=s.r[i];
   for(let level=s.r[i];level<n.r[i];level++){
    cost+=Math.max(0,Math.floor(S.D.research[i].virtue_prices[level]*minimumDiscount*(1-1e-10))-1);
    if(cost>budget)break;cap=level+1;
   }
   if(cap<n.r[i]){n.r[i]=cap;changed=true;}
  }
  for(let i=0;i<n.r.length;i++)if(n.r[i]>s.r[i]&&!S.isUnlocked(n,i)){n.r[i]=s.r[i];changed=true;}
  if(!changed)break;
 }
 let delivery=S.stats(n,context).delivery;
 if(visits.includes(2)){
  // The income budget may combine incompatible gear (an upper bound), but
  // tighten the final delivery ceiling to compatible owned/configured sets.
  delivery=0;for(const set of Object.keys(c.mods))delivery=Math.max(delivery,S.stats({...n,set},c).delivery);
  if(c.artifactModel)delivery=Math.max(delivery,Artifacts.bestDelivery(c.artifactModel,S.stats(n,context)).delivery);
 }
 return {delivery,levels:n.r,budget,iterations};
}
function possible(s,c,end,amount,visits){
 if(end<s.t)return {possible:false,delivery:0};
 const bound=at(s,c,end,visits);
 return {...bound,possible:amount===0||amount*(1-1e-10)<=Math.max(0,end-s.t)*bound.delivery*(1+1e-10)};
}
function lower(s,c,upper,amount,visits,initial=s.t){
 if(amount===0||!Number.isFinite(upper)||upper<=initial)return initial;
 if(!possible(s,c,upper,amount,visits).possible)return Math.max(initial,upper);
 let lo=initial,hi=upper;
 for(let i=0;i<32&&hi-lo>.25;i++){const mid=lo+(hi-lo)/2;if(possible(s,c,mid,amount,visits).possible)hi=mid;else lo=mid;}
 // Only the ruled-out side of the bracket is a lower bound.
 return lo;
}
module.exports={at,possible,lower};
