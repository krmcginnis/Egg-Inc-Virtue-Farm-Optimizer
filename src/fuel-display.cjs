'use strict';
const S=require('./simulator.cjs'),Ships=require('./ships.cjs');
const TRILLION=1e12;
// Presentation only: keep exact recorded fuel and timing for replay. Tanks
// smaller than 1T still need their original sub-trillion instructions.
function amount(value,capacity=Infinity){return capacity<TRILLION?value:Math.round(value/TRILLION)*TRILLION;}
function format(value,capacity=Infinity){const rounded=amount(value,capacity);return capacity<TRILLION?Ships.format(rounded):(rounded/TRILLION)+'T';}
function activity(action,capacity=Infinity){
 if(action.type==='fuel')return amount(action.amount,capacity)>0?{kind:'fuel',label:(action.visit>1?'Refill ':'Store ')+S.NAME[action.egg]+' Fuel',value:format(action.amount,capacity)}:null;
 if(action.type==='fuel-dump'){
  const removed=action.removed?.map((n,i)=>amount(n,capacity)>0?format(n,capacity)+' '+S.NAME[i]:'').filter(Boolean);
  return removed&&!removed.length?null:{kind:'fuel',label:'Set Tank Limits; Discard Excess',value:removed?.join(' · ')||''};
 }
 return null;
}
function hidden(action,capacity=Infinity){return ['fuel','fuel-dump'].includes(action.type)&&!activity(action,capacity);}
module.exports={amount,format,activity,hidden};
