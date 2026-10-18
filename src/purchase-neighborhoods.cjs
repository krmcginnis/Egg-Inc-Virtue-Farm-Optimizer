'use strict';
const S=require('./simulator.cjs'),E=require('./purchase-economics.cjs');
// Large-neighborhood destroy/repair proposals: change several related choices,
// remove their dependent purchases, then fund and complete the remaining plan.
// Adaptive refinement scores the operators by verified gain per elapsed time.
function proposals(initial,c,actions,{limit=12,maxProposals=48,checkpoint=()=>{}}={}){
 const groups=new Map(),stages=[];let stage=initial.stage;
 for(let index=0;index<actions.length;index++){
  const a=actions[index];if(a.type==='shift')stage++;stages[index]=stage;if(!E.purchase(a))continue;
  const role=a.type==='research'?S.D.research[a.i].categories:a.type,key=stage+':'+role;
  if(!groups.has(key))groups.set(key,{indices:[],cost:0,type:a.type,stage});
  const group=groups.get(key);group.indices.push(index);group.cost+=a.cost||0;
 }
 const anchors=[...groups.values()].filter(g=>g.indices.length>1).sort((a,b)=>b.cost-a.cost).slice(0,limit),output=[],seen=new Set();
 function add(kind,root,edited){
  checkpoint();if(output.length>=maxProposals||!E.coherent(initial,c,edited,checkpoint))return;
  const key=JSON.stringify(edited.filter(a=>a.type!=='wait').map(a=>[a.type,a.i,a.from,a.slot,a.id,a.fromCars,a.egg,a.t]));
  if(seen.has(key))return;seen.add(key);output.push({kind,type:root.type,actions:edited});
 }
 function omit(root,indices){const removed=E.closure(initial,c,actions,indices,{checkpoint});if(removed)add('omit-block',root,actions.filter((_,i)=>!removed.has(i)));}
 for(let gi=0;gi<anchors.length;gi++){
  checkpoint();const group=anchors[gi];omit(group,group.indices);
  const paired=anchors.slice(gi+1).find(x=>x.stage===group.stage);if(paired)omit(group,[...group.indices,...paired.indices]);
  const first=group.indices[0],last=group.indices.at(-1),earning=actions.findIndex((a,i)=>i>last&&stages[i]===group.stage&&E.purchase(a)&&a.after?.earning>a.before?.earning*(1+1e-12));
  const egg=group.type==='research'?0:group.type==='hab'?1:group.type==='silo'?3:4;
  const nextVisit=actions.findIndex((a,i)=>i>last&&a.type==='shift'&&a.egg===egg),targets=[earning<0?-1:earning+1,nextVisit<0?-1:nextVisit+1];
  for(const target of targets.filter(t=>t>first)){
   const removed=E.closure(initial,c,actions,group.indices,{stop:target,checkpoint});if(!removed)continue;
   const block=actions.filter((a,i)=>i<target&&removed.has(i));if(block.some(a=>a.type!==group.type))continue;
   add('relocate-block',group,[...actions.slice(0,target).filter((_,i)=>!removed.has(i)),...block,...actions.slice(target)]);
  }
 }
 return output;
}
module.exports={proposals};
