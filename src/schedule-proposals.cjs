'use strict';
const S=require('./simulator.cjs'),L=require('./optimizer-legacy.cjs');

// A declared earnings setup can propose an additional purchase order when
// starting gear earns more. It is never equipped by this search. Execute its
// schedule again with the actual starting gear, prices, interactions and ships.
function earningReference(raw){
 const farm=raw.farm,active=farm.activeSet||Object.keys(farm.loadouts||{})[0],current=farm.loadouts?.[active];
 if(!current)return null;
 const now=S.modifiers(S.validateLoadout(current,farm.proPermit===false?2:4));
 for(const [name,slots] of Object.entries(farm.loadouts||{})){
  if(name===active||!/earning/i.test(name))continue;
  const old=S.modifiers(S.validateLoadout(slots,farm.proPermit===false?2:4));
  if(['hab','shipping','laying','research','ihr'].some(k=>old[k]!==now[k]))continue;
  if(old.eggValue>now.eggValue||old.eggValue*old.away>now.eggValue*now.away)continue;
  if(old.eggValue===now.eggValue&&(farm.earningsMode==='online'||old.away===now.away))continue;
  const reference=structuredClone(raw);reference.farm.loadouts[active]=structuredClone(slots);return reference;
 }
 return null;
}
function earningWait(s,c,action){
 const mode=action.earningsMode||'online',r=S.stats(s,c),rate=mode==='offline'?r.offline:r.online;
 let needed=action.cashGained,t=s.t;
 if(!(needed>0)||!Number.isFinite(needed)||!(rate>0))return action.end-action.t;
 for(let i=0;i<c.calendar.length+2&&t<c.end;i++){
  const ev=S.at(c,t),end=Math.min(c.end,ev.next),income=rate*ev.earnings;
  if(needed<=income*(end-t))return Math.max(mode==='offline'?S.offlineMinimum(c):0,t-s.t+needed/income+.001);
  needed-=income*(end-t);t=end;
 }
 throw Error('Proposed earnings wait exceeds the planning limit.');
}
function execute(initial,c,actions,{compress=false,checkpoint=()=>{}}={}){
 let n=initial;
 for(const action of actions){
  checkpoint();
  // Delivery is reallocated from the actual paid build and current progress.
  if(action.type==='wait'&&/^Collect .* (?:share of the Truth Egg target|Truth Egg milestones)/.test(action.reason||'')){
   const end=L.tail(n,c);if(!end)throw Error('Proposed build has no feasible delivery tail.');return end;
  }
  if(action.type==='wait'){
   const duration=action.end-action.t;
   const interaction=/interaction time|Switch overhead/.test(action.reason||'');
   const boundary=c.calendar.some(e=>Number.isFinite(e.t)&&Math.abs(e.t-action.end)<.01);
   const cashWait=!interaction&&!boundary&&action.cashGained>0;
   const end=boundary?Math.max(n.t,action.end):n.t+(compress&&cashWait?earningWait(n,c,action):duration);
   if(end>n.t)n=S.advance(n,c,end,action.reason,true,action.earningsMode||'auto');
  }else{
   if(action.type==='research'&&S.at(c,action.t).sale===.3&&S.at(c,n.t).sale!==.3){
    const sale=c.calendar.find(e=>e.t>=n.t&&e.sale===.3);
    if(!sale||sale.t>=c.researchDeadline)throw Error('Proposed research misses its sale window.');
    n=S.advance(n,c,sale.t,'Preserve the proposed research sale');
   }
   n=S.buy(n,{...c,actionsSeconds:action.type==='ship-run'?c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},action);
  }
 }
 return S.reached(n,c)?n:L.tail(n,c);
}
module.exports={earningReference,earningWait,execute};
