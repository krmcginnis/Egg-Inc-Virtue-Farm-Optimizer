'use strict';
const S=require('./simulator.cjs'),W=require('./waiting-objective.cjs');
function actionKey(a){return JSON.stringify([a.type,a.i,a.slot,a.id,a.set]);}
function stateKey(s){const {path,depth,...paid}=s;return JSON.stringify([paid,W.offlineBreaks(s)]);}
function pair(start,c,a,b){
 if(!['research','hab','vehicle','car','silo'].includes(a.type)||!['research','hab','vehicle','car','silo'].includes(b.type)||actionKey(a)===actionKey(b))return false;
 try{
  // Reject productive pairs cheaply. Their intermediate earnings/delivery
  // usually differ, so they cannot be reordered on structural grounds alone.
  const before=S.stats(start,c);
  for(const action of [a,b]){if(!S.allowed(start,c,action))return false;const after=S.stats(S.mutate(start,c,action),c);if(after.online!==before.online||after.offline!==before.offline||after.delivery!==before.delivery)return false;}
  const run=actions=>actions.reduce((s,a)=>{const ready=S.afford(s,c,a);if(!ready)throw Error('Unfunded ordering');return S.buy(ready,c,a);},start);
  // Exact equality includes cash, event time, fuel, ship state and egg totals.
  // Near-equal floating point states are deliberately NOT merged.
  return stateKey(run([a,b]))===stateKey(run([b,a]));
 }catch{return false;}
}
module.exports={actionKey,stateKey,pair};
