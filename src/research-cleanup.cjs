'use strict';
const S=require('./simulator.cjs'),Totals=require('./research-totals.cjs'),Economics=require('./purchase-economics.cjs');
// Classify effects against all modeled research multipliers, including dormant
// habitat/vehicle capacity. A zero gain on today's farm is not proof of no use.
const zero=S.D.research.map(()=>0),base=Totals.calculate(zero);
const productive=S.D.research.map((r,i)=>{
 const levels=zero.slice();levels[i]=1;const changed=Totals.calculate(levels);
 return r.id==='micro_coupling'||Object.keys(base).some(k=>k!=='lowerTier'&&base[k]!==changed[k]);
});
function affectsFarm(i){return productive[i]===true;}
function proposal(initial,c,actions,{checkpoint=()=>{}}={}){
 const candidates=actions.flatMap((a,i)=>a.type==='research'&&!affectsFarm(a.i)?[i]:[]);
 if(!candidates.length)return null;
 const coherent=drop=>Economics.coherent(initial,c,actions.filter((_,i)=>!drop.has(i)),checkpoint);
 let drop=new Set(candidates);
 if(!coherent(drop)){
  drop=new Set();
  // Remove suffix levels first, retaining every prerequisite actually needed
  // by a subsequent research/vehicle/hab purchase, including on later visits.
  for(const index of candidates.slice().reverse()){
   checkpoint();const trial=new Set(drop);trial.add(index);if(coherent(trial))drop=trial;
  }
 }
 if(!drop.size)return null;
 let cost=0,levels=0;
 const kept=actions.flatMap((a,i)=>{
  if(drop.has(i)){cost+=a.cost||0;levels+=Math.max(1,(a.to??1)-(a.from??0));return [];}
  // Permit an original-clock fallback without phantom purchase interactions.
  // The preferred paid retiming removes these obsolete waits entirely.
  if(a.type==='wait'&&drop.has(i-1)&&a.reason==='Purchase interaction time')return [{...a,reason:'Wait for the next scheduled step'}];
  return [a];
 });
 if(!kept.length)kept.push({type:'wait',t:initial.t,end:initial.t,egg:initial.egg,earningsMode:'online',reason:'Target already reached'});
 return {actions:kept,levels,cost};
}
module.exports={affectsFarm,proposal};
