'use strict';
const Route=require('./switch-sequence.cjs');
// Local order/visit changes supplement the bounded global route portfolio.
// All proposals are subsequently prepared, paid, completed and replayed.
function proposals(route,start,maxShifts){
 const output=[],seen=new Set([JSON.stringify(route)]);
 function add(proposed){try{const normalized=Route.normalize(proposed,start,{required:true}),key=JSON.stringify(normalized);if(normalized.length-1<=maxShifts&&!seen.has(key)){seen.add(key);output.push(normalized);}}catch{}}
 for(let i=1;i<route.length;i++){
  add(route.filter((_,j)=>i!==j));
  if(i+1<route.length){const swapped=route.slice();[swapped[i],swapped[i+1]]=[swapped[i+1],swapped[i]];add(swapped);}
  if(i>1&&['kindness','integrity','resilience'].includes(route[i])){const earlier=route.slice(),[egg]=earlier.splice(i,1);earlier.splice(Math.max(1,i-2),0,egg);add(earlier);}
 }
 return output;
}
module.exports={proposals};
