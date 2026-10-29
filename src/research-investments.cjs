'use strict';
const S=require('./simulator.cjs'),Effects=require('./research-cleanup.cjs');

// These are complete paid source states, before research and before leaving
// EACH eligible Curiosity visit. Never insert inside an interaction wait.
function anchors(initial,c,actions,checkpoint=()=>{}){
 const visits=new Map();let n=initial;
 for(let index=0;index<actions.length;index++){
  checkpoint();const a=actions[index],interaction=a.type==='wait'&&/interaction time|Switch overhead/.test(a.reason||'');
  if(n.egg===0&&n.stage<c.finalCStage&&n.t<c.researchDeadline&&!interaction){
   let group=visits.get(n.stage);
   if(!group){group=[];visits.set(n.stage,group);}
   if(!group.length||a.type==='research'||a.type==='shift')group.push({index,state:n});
  }
  n=a.type==='wait'?S.advance(n,c,a.end,a.reason,true,a.earningsMode||'auto'):S.buy(n,{...c,actionsSeconds:a.type==='ship-run'?c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},a);
 }
 // Departure and arrival first, then every intermediate research position.
 // Interleave visits so one large early batch cannot consume the whole pass.
 const groups=[...visits.values()].map(g=>[...new Set([g.at(-1),g[0],...g.slice(1,-1)])]),out=[];
 for(let rank=0;groups.some(g=>g[rank]);rank++)for(const group of groups)if(group[rank])out.push(group[rank]);
 return out;
}
function* proposals(initial,c,actions,{checkpoint=()=>{}}={}){
 for(const {index,state} of anchors(initial,c,actions,checkpoint)){
  const times=[state.t],sale=S.at(c,state.t).sale===.3?null:c.calendar.find(e=>e.t>state.t&&e.t<c.researchDeadline&&e.sale===.3);
  if(sale)times.push(sale.t);
  // Enumerate every legal next productive level. Short-term income, cost,
  // and beam/package rankings cannot remove a candidate from this pass.
  for(let i=0;i<S.D.research.length;i++){
   checkpoint();if(!Effects.affectsFarm(i)||!S.allowed(state,c,{type:'research',i}))continue;
   for(const t of times){
    const action={type:'research',i,from:state.r[i],to:state.r[i]+1,t,egg:0};
    yield {key:index+':'+i+':'+t,stage:state.stage,action,actions:[...actions.slice(0,index),action,...actions.slice(index)]};
   }
  }
 }
}
module.exports={anchors,proposals};
