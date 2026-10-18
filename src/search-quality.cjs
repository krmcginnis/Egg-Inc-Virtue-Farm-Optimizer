'use strict';
const S=require('./simulator.cjs'),Bounds=require('./search-bounds.cjs');
const contexts=new WeakMap();
function measure(raw,result){
 try{
  const key=JSON.stringify([raw.farm,raw.plan]);let prepared=contexts.get(raw);
  if(!prepared||prepared.key!==key){prepared={key,...S.prepare({...raw,plan:{...raw.plan,solverVersion:2}},{oneStartingSilo:true})};contexts.set(raw,prepared);}
  const {s,c}=prepared;
  // This root relaxation covers ALL routes permitted by the inputs, including
  // routes never proposed by the bounded optimizer. Do not use the retained
  // beam/frontier as if it covered the whole decision space.
  const bound=Bounds.analyze(s,c,result.end),lowerSeconds=Math.max(0,bound.lower-c.start-.02);
  if(!Number.isFinite(lowerSeconds)||lowerSeconds>result.seconds+.01)return {status:'unavailable',reason:'The model bound could not be reconciled with the replayed plan.'};
  return {version:1,status:'bounded-under-model',lowerSeconds:Math.min(result.seconds,lowerSeconds),upperSeconds:result.seconds,gapSeconds:Math.max(0,result.seconds-lowerSeconds),
   scope:c.autoSequence?'All routes within the entered shift allowance; modeled game rules':'The entered route; modeled game rules',
   basis:'Exact relaxed milestone allocation, deadline funding and tier bounds, strongest compatible owned/configured delivery gear; no fuel diversion or production downtime',
   numericalMargins:{rates:1e-10,budget:1e-9,bracketSeconds:.25,timeSeconds:.02},globalOptimalityProven:false,
   oneDayEarlier:Bounds.deadline(s,c,result.end-86400).impossible?'ruled-out-under-model':'not-ruled-out'};
 }catch{return {status:'unavailable',reason:'No reliable model bound is available for these inputs.'};}
}
function describe(quality,format){
 if(quality?.status!=='bounded-under-model')return 'Global optimality has not been verified.';
 return 'Best plan: '+format(Math.ceil(quality.upperSeconds))+'. Optimistic minimum: '+format(Math.floor(quality.lowerSeconds))+'. At most '+format(Math.ceil(quality.gapSeconds))+' of improvement remains under the model. This minimum relaxes funding, upgrade timing, and production downtime. Global optimality has not been verified.';
}
module.exports={measure,describe};
