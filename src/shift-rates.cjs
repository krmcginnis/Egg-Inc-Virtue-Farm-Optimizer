'use strict';
const S=require('./simulator.cjs');
// Peak farm capacity during the recorded visit, using the selected earnings
// mode and weekly events. Fuel diversion does not change farm capacity. Keep
// each event paired with the upgrades/gear actually present at that time.
function attach(shifts,actions,initial,c){
 let state=S.clone(initial),farmRates=S.stats(state,c);
 for(const shift of shifts){
  const peak={earning:0,shipping:0,laying:0,delivery:0};
  function include(start,end=start){
   let multiplier=S.at(c,start).earnings;
   for(const event of c.calendar)if(event.t>start&&event.t<end)multiplier=Math.max(multiplier,event.earnings);
   peak.earning=Math.max(peak.earning,farmRates.earning*multiplier);
   peak.shipping=Math.max(peak.shipping,farmRates.shipping);
   peak.laying=Math.max(peak.laying,farmRates.laying);
   peak.delivery=Math.max(peak.delivery,farmRates.delivery);
  }
  for(let i=shift.firstIndex;i<=shift.lastIndex;i++){
   const action=actions[i];state.t=action.t;
   if(action.type==='shift'){
    state=S.mutate(state,c,action);farmRates=S.stats(state,c);
   }
   include(action.t,action.end??action.t);
   if(['research','hab','vehicle','car','silo','set'].includes(action.type)){
    state=S.mutate(state,c,action);farmRates=S.stats(state,c);include(action.t);
   }
   state.t=action.end??action.t;
  }
  if(shift.lastIndex<shift.firstIndex)include(shift.start,shift.end);
  shift.maxRates=peak;
 }
}
module.exports={attach};
