'use strict';
const Bounds=require('./search-bounds.cjs'),W=require('./waiting-objective.cjs');
// Bounded recovery of paid states discarded by the beam. This is inspired by
// beam-stack/limited-discrepancy search; the finite reserve is not completeness.
class Reserve{
 constructor(limit=96){this.limit=limit;this.items=[];this.seen=new Set();this.next=0;this.added=0;this.dropped=0;}
 add(states,c,route,count){for(const state of states){
  const {path,depth,...paid}=state,key=JSON.stringify([route,count,paid,W.offlineBreaks(state)]);if(this.seen.has(key))continue;
  this.seen.add(key);let bound;try{bound=Bounds.earliest(state,c);}catch{bound=state.t;}
  this.items.push({id:++this.next,state,context:c,route,count,bound});this.added++;
 }
 this.items.sort((a,b)=>a.bound-b.bound||a.state.t-b.state.t||a.id-b.id);
 if(this.items.length>this.limit){this.dropped+=this.items.length-this.limit;this.items.length=this.limit;}
 // Keys cannot grow beyond the search itself; cap stale deduplication as well.
 if(this.seen.size>this.limit*16)this.seen=new Set(this.items.map(x=>{const {path,depth,...s}=x.state;return JSON.stringify([x.route,x.count,s,W.offlineBreaks(x.state)]);}));
 }
 peek(limit=4){return this.items.slice(0,limit);}
 take(id){const index=this.items.findIndex(x=>x.id===id);return index<0?null:this.items.splice(index,1)[0];}
 summary(){return {added:this.added,pending:this.items.length,dropped:this.dropped};}
}
module.exports={Reserve};
