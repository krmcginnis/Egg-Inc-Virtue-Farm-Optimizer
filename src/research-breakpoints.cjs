'use strict';
const S=require('./simulator.cjs');
const tiers=[...new Map(S.D.research.map((r,i)=>[r.tier,i])).values()];
function signature(s,c){
 const stats=S.stats(s,c);let tier=1;
 for(const i of tiers)if(S.isUnlocked(s,i))tier=Math.max(tier,S.D.research[i].tier);
 return {tier,slots:stats.slots,cars:stats.trainLength,bottleneck:stats.laying<=stats.shipping?'laying':'shipping',sale:S.at(c,s.t).sale};
}
function select(states,c,limit=12){
 if(!states.length)return [];
 const events=[];let previous=signature(states[0],c);
 for(let i=1;i<states.length;i++){
  const next=signature(states[i],c);
  if(Object.keys(next).some(key=>next[key]!==previous[key]))events.push([states[i],states[i-1]]);
  previous=next;
 }
 // Preserve the latest useful structural departures, then test the decision
 // BEFORE paying for another cash wait. All anchors are complete paid states.
 const original=[...new Set([states.at(-1),...events.reverse().flat(),states[0]])];
 const chosen=new Set(original.slice(0,Math.min(4,limit))),waits=[];
 for(let i=1;i<states.length;i++){
  const action=states[i].path?.action;
  if(states[i].stage===states[i-1].stage&&action?.type==='wait'&&
   !/interaction time|Switch overhead/.test(action.reason||'')&&action.cashGained>0&&
   action.end-action.t>=Math.max(600,c.offlineMinSeconds))
   waits.push({state:states[i-1],seconds:action.end-action.t});
 }
 waits.sort((a,b)=>b.seconds-a.seconds||b.state.t-a.state.t);
 for(const state of [...waits.map(x=>x.state),...original])if(chosen.size<limit)chosen.add(state);
 // Keep the existing leading departures first, then prioritize later paid
 // before-wait states. Do not let several cheap early openings exhaust a
 // slower browser worker's slice before it tests the stronger paid prefixes.
 return [...new Set([...original.slice(0,Math.min(2,limit)),...waits.map(x=>x.state).filter(s=>chosen.has(s)).sort((a,b)=>b.t-a.t),...chosen])];
}
module.exports={signature,select};
