'use strict';
const O=require('./optimizer.cjs');
// A failed heuristic search is not proof of impossibility. Offer a separately
// replayed longer-window plan, without silently changing the user's inputs.
async function plan(raw,options={},progress=()=>{},cancelled=()=>false){
 try{return {result:await O.solve(raw,options,progress,cancelled)};}
 catch(error){
  if(cancelled()||!(Number(raw.plan?.maxDays)<366)||!/^No feasible plan found|^Under the entered farm settings/.test(error.message))return {error:error.message};
  progress({phase:'alternative',requestedDays:Number(raw.plan.maxDays)});
  const config=structuredClone(raw);config.plan.maxDays=366;
  try{const result=await O.solve(config,{...options,seedOnly:true,maxMs:20000},()=>{},cancelled);
   if(cancelled())return {error:error.message};
   return {error:error.message,suggestion:{config,result,requestedDays:Number(raw.plan.maxDays)}};
  }catch{return {error:error.message};}
 }
}
module.exports={plan};
