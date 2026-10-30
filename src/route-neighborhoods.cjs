'use strict';
const Route=require('./switch-sequence.cjs');
// Local order/visit changes supplement the bounded global route portfolio.
// All proposals are subsequently prepared, paid, completed and replayed.
function proposals(route,start,maxShifts){
 const output=[],seen=new Set([JSON.stringify(route)]);
 function add(proposed,into=output){try{const normalized=Route.normalize(proposed,start,{required:true}),key=JSON.stringify(normalized);if(normalized.length-1<=maxShifts&&!seen.has(key)){seen.add(key);into.push(normalized);}}catch{}}
 for(let i=1;i<route.length;i++){
  add(route.filter((_,j)=>i!==j));
  if(i+1<route.length){const swapped=route.slice();[swapped[i],swapped[i+1]]=[swapped[i+1],swapped[i]];add(swapped);}
  if(i>1&&['kindness','integrity','resilience'].includes(route[i])){const earlier=route.slice(),[egg]=earlier.splice(i,1);earlier.splice(Math.max(1,i-2),0,egg);add(earlier);}
 }
 const growing=[];
 if(route.length-1<maxShifts){
  const byEgg=['H','C','K','I','R'].map(egg=>{
   const proposals=[];
   for(let at=1;at<=route.length;at++)add([...route.slice(0,at),egg,...route.slice(at)],proposals);
   return proposals;
  });
  for(let i=0;byEgg.some(group=>i<group.length);i++)for(const group of byEgg)if(group[i])growing.push(group[i]);
 }
 // The adaptive search samples a bounded prefix. Mix growth with the existing
 // edits, rather than putting every insertion beyond the sampled range.
 const mixed=[];for(let i=0;i<Math.max(output.length,growing.length);i++){if(growing[i])mixed.push(growing[i]);if(output[i])mixed.push(output[i]);}
 return mixed;
}
module.exports={proposals};
