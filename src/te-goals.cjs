'use strict';
const D=require('./game-data.json');
// Dense, exact multiple-choice DP. Active-state order and strict-cost updates
// preserve the old allocator's tie decisions without string keys or per-edge
// goal-array copies. This allocates eggs, never speculative purchases.
function allocate(te,eggs,minimum,needed,available,visitLimit,currentEgg){
 const stride=visitLimit+1,size=(needed+1)*stride;
 let costs=new Float64Array(size);costs.fill(Infinity);costs[0]=0;let active=[0];const parents=[],amounts=[];
 for(let egg=0;egg<5;egg++){
  const next=new Float64Array(size);next.fill(Infinity);const nextActive=[],parent=new Int32Array(size),amount=new Int16Array(size);
  for(const id of active){const total=Math.floor(id/stride),visits=id%stride,max=available.has(egg)?Math.min(98-te[egg],needed-total):0;
   for(let k=minimum[egg];k<=max;k++){
    const count=visits+Number(k>0&&egg!==currentEgg);if(count>visitLimit)continue;
    const cost=costs[id]+(k?Math.max(0,D.te[te[egg]+k-1]-eggs[egg]):0),to=(total+k)*stride+count;
    if(cost<next[to]){if(next[to]===Infinity)nextActive.push(to);next[to]=cost;parent[to]=id;amount[to]=k;}
   }
  }
  costs=next;active=nextActive;parents.push(parent);amounts.push(amount);
 }
 let best=-1,bestCost=Infinity,leastVisits=Infinity;
 for(const id of active)if(Math.floor(id/stride)===needed){const visits=id%stride;if(costs[id]<bestCost||costs[id]===bestCost&&visits<leastVisits){best=id;bestCost=costs[id];leastVisits=visits;}}
 if(best<0)return null;
 const goals=te.slice();for(let egg=4;egg>=0;egg--){goals[egg]+=amounts[egg][best];best=parents[egg][best];}return goals;
}
module.exports={allocate};
