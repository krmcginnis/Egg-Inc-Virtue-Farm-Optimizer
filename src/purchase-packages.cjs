'use strict';
const S=require('./simulator.cjs'),L=require('./optimizer-legacy.cjs');
const W=require('./waiting-objective.cjs');
const productive=/egg_value|egg_laying_rate|hab_capacity|shipping_capacity|fleet_size/;
function key(s){return JSON.stringify([s.t,s.cash,s.r,s.h,s.v,s.silos,s.set,s.eggs,s.fuel,s.shipFlights,W.offlineBreaks(s)]);}
function choices(s,c,limit){
 const before=S.stats(s,c),groups=new Map();
 for(const a of L.candidates(s,c)){
  if(!S.allowed(s,c,a)||a.type==='set')continue;
  const research=a.type==='research'?S.D.research[a.i]:null;
  if(research&&!productive.test(research.categories)&&!S.D.research.some((r,i)=>r.tier>research.tier&&productive.test(r.categories)&&!S.isUnlocked(s,i)))continue;
  const next=S.mutate(s,c,a),after=S.stats(next,c),cost=S.price(s,c,a);
  const income=Math.max(0,Math.log(after.earning/Math.max(1e-300,before.earning)));
  const capacity=Math.max(0,Math.log(after.laying/Math.max(1e-300,before.laying)))+Math.max(0,Math.log(after.shipping/Math.max(1e-300,before.shipping)));
  const unlock=(after.slots-before.slots)+(after.trainLength-before.trainLength);
  const engine=a.type==='vehicle'&&a.id===11?Math.max(0,after.trainLength-1):0;
  const group=research?(productive.test(research.categories)?research.categories:'tier-prerequisite'):a.type;
  const score=(income*4+capacity+unlock*.03+engine*.02+(research&&!productive.test(research.categories)?.01:0))/(1+cost/Math.max(1,before.eventEarning*3600));
  const entries=groups.get(group)||[];entries.push({a,cost,score});groups.set(group,entries);
 }
 for(const group of groups.values())group.sort((a,b)=>b.score-a.score||a.cost-b.cost);
 const ordered=[...groups.values()].sort((a,b)=>b[0].score-a[0].score||a[0].cost-b[0].cost);
 const output=[];
 for(let rank=0;output.length<limit;rank++){
  let found=false;for(const group of ordered)if(group[rank]&&output.length<limit){output.push(group[rank].a);found=true;}
  if(!found)break;
 }
 return output;
}
function select(entries,start,c,limit=6){
 const unique=[...new Map(entries.map(x=>[key(x.state),x])).values()];
 const before=S.stats(start,c),rank=x=>{
  const r=S.stats(x.state,c),seconds=60+x.state.t-start.t;
  return (Math.log(r.earning/Math.max(1e-300,before.earning))*4+Math.log(r.delivery/Math.max(1e-300,before.delivery))*4+
   Math.log(r.laying/Math.max(1e-300,before.laying))*.2+Math.log(r.shipping/Math.max(1e-300,before.shipping))*.2)/seconds;
 };
 const early=unique.slice().sort((a,b)=>a.state.t-b.state.t||b.state.cash-a.state.cash),productive=unique.slice().sort((a,b)=>rank(b)-rank(a)||a.state.t-b.state.t);
 const chosen=new Set();for(let i=0;i<unique.length&&chosen.size<limit;i++)for(const x of [productive[i],early[i]])if(chosen.size<limit)chosen.add(x);
 return [...chosen];
}
// A bounded search over NEW paid combinations, including complementary zero-
// gain levels, tier fillers, fleet/engine/car chains and physical purchases.
// Only actual afford/buy states enter the beam; projections rank choices only.
function grow(start,c,{maxDepth=3,width=6,branchWidth=8,maxNodes=128,checkpoint=()=>{},keepCompletedOnStop=false}={}){
 if(S.reached(start,c))return {candidates:[],nodes:0};
 const local=start.egg===0?{...c,end:Math.min(c.end,c.researchDeadline??c.end)}:c;
 let beam=[{state:start,actions:[]}],nodes=0;const candidates=[];
 try{for(let depth=0;depth<maxDepth&&beam.length;depth++){
  const expanded=[];
  for(const entry of beam)for(const a of choices(entry.state,local,branchWidth)){
   checkpoint();if(nodes++>=maxNodes)return {candidates:select(candidates,start,c,12),nodes:maxNodes,truncated:true};
   try{
    const ready=S.afford(entry.state,local,a,checkpoint);if(!ready||ready.t+local.actionsSeconds>local.end)continue;
    const next={state:S.buy(ready,local,a),actions:[...entry.actions,a]};expanded.push(next);candidates.push(next);
   }catch{}
  }
  beam=select(expanded,start,c,width);
  // Keep candidates of each package length, not just the longest purchase.
 }}catch(error){if(!keepCompletedOnStop)throw error;return {candidates:select(candidates,start,c,12),nodes,interrupted:true};}
 return {candidates:select(candidates,start,c,12),nodes};
}
module.exports={choices,select,grow};
