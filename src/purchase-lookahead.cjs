'use strict';
const S=require('./simulator.cjs'),B=require('./offline-batch.cjs'),W=require('./waiting-objective.cjs');
const productive=/egg_value|egg_laying_rate|hab_capacity|shipping_capacity|fleet_size/;

function nextUnlock(s){
 for(let tier=2;tier<=S.D.tierUnlock.length;tier++){
  const bought=S.D.research.reduce((sum,r,i)=>sum+(r.tier<tier?s.r[i]:0),0),missing=S.D.tierUnlock[tier-1]-bought;
  if(missing>0)return {tier,missing};
 }
 return null;
}
function purchase(s,c,a){
 const ready=S.afford(s,c,a);if(!ready||ready.t+c.actionsSeconds>c.end)return null;
 return S.buy(ready,c,a);
}
function available(s,c,tier,branchWidth){
 const actions=S.D.research.flatMap((r,i)=>r.tier<tier&&S.allowed(s,c,{type:'research',i})?[{type:'research',i}]:[]);
 if(actions.length<=branchWidth)return actions;
 const before=S.stats(s,c),ranked=actions.map(a=>{
  const after=S.stats(S.mutate(s,c,a),c),cost=S.price(s,c,a);
  const gain=Math.max(0,Math.log(after.earning/Math.max(1e-300,before.earning)));
  return {a,cost,value:gain/(1+cost/Math.max(1,before.eventEarning*60))};
 });
 const cheap=ranked.slice().sort((a,b)=>a.cost-b.cost||a.a.i-b.a.i),income=ranked.slice().sort((a,b)=>b.value-a.value||a.cost-b.cost);
 const chosen=new Map();
 for(let i=0;chosen.size<branchWidth&&i<ranked.length;i++)for(const item of [cheap[i],income[i]]){
  if(chosen.size<branchWidth)chosen.set(item.a.i,item.a);
 }
 return [...chosen.values()];
}
function keep(states,c,width,start){
 // Only identical paid states are merged. Different cash or event timing
 // remains a separate candidate, even when research levels are the same.
 const unique=new Map();for(const s of states){const key=JSON.stringify([s.t,s.cash,s.r,s.eggs,W.offlineBreaks(s)]);if(!unique.has(key))unique.set(key,s);}
 const all=[...unique.values()];if(all.length<=width)return all;
 const early=all.slice().sort((a,b)=>a.t-b.t||b.cash-a.cash),income=all.slice().sort((a,b)=>
  S.stats(b,c).earning/(60+b.t-start.t)-S.stats(a,c).earning/(60+a.t-start.t)||a.t-b.t);
 const chosen=new Set();for(let i=0;chosen.size<width&&i<all.length;i++)for(const s of [early[i],income[i]])if(chosen.size<width)chosen.add(s);
 return [...chosen];
}
function chains(start,c,{maxPrerequisites=16,width=4,branchWidth=4,maxNodes=1024,checkpoint=()=>{}}={}){
 const unlock=nextUnlock(start),output=[];let nodes=0;
 if(start.egg!==0||!unlock||unlock.missing>maxPrerequisites||start.stage>=c.finalCStage||start.t>=c.researchDeadline)return {candidates:output,nodes};
 const local={...c,end:Math.min(c.end,c.researchDeadline)},targets=S.D.research.flatMap((r,i)=>r.tier===unlock.tier&&productive.test(r.categories)?[i]:[]);
 let beam=[start];
 for(let depth=0;depth<unlock.missing&&beam.length;depth++){
  const expanded=[];
  for(const s of beam)for(const a of available(s,local,unlock.tier,branchWidth)){
   checkpoint();if(nodes++>=maxNodes)return {candidates:output,nodes,truncated:true};
   try{const n=purchase(s,local,a);if(n)expanded.push(n);}catch{}
  }
  beam=keep(expanded,local,width,start);
 }
 for(const s of beam)for(const i of targets){
  checkpoint();if(nodes++>=maxNodes)return {candidates:output,nodes,truncated:true};
  try{
   let n=purchase(s,local,{type:'research',i});if(!n)continue;
   const actions=[];for(let p=n.path;p&&p!==start.path;p=p.prev)if(p.action.type==='research')actions.push({type:'research',i:p.action.i});actions.reverse();
   if(c.earningsMode==='offline'){
    const batch=B.compare(start,local,actions,local.end);
    if(batch?.count===actions.length&&W.better(batch.s,n))n=batch.s;
   }
   output.push({state:n,tier:unlock.tier,research:i,prerequisites:unlock.missing});
  }catch{}
 }
 return {candidates:output,nodes};
}
function anchors(states,c,limit=4){
 const byTier=new Map();
 for(const state of states){
  if(state.egg!==0||state.stage>=c.finalCStage||state.t>=c.researchDeadline)continue;
  const unlock=nextUnlock(state);if(!unlock||unlock.missing>16)continue;
  const old=byTier.get(unlock.tier);
  if(!old||unlock.missing<old.missing||unlock.missing===old.missing&&state.t<old.state.t)byTier.set(unlock.tier,{state,...unlock});
 }
 return [...byTier.values()].sort((a,b)=>b.tier-a.tier).slice(0,limit).map(x=>x.state);
}
module.exports={nextUnlock,chains,anchors};
