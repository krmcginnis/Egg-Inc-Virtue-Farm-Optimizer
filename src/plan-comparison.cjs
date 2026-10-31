'use strict';
const S=require('./simulator.cjs'),Rates=require('./shift-rates.cjs');
// Reconstruct capacity and shift costs from the farm and recorded actions;
// neither a saved summary nor final-only stats describe the whole plan.
function metrics(raw,plan){
 const actions=plan.actions,effective=plan.solverVersion>=2?{...raw,plan:{...raw.plan,solverVersion:2}}:raw;
 const {s,c}=S.prepare(effective,{artifactReplay:true,artifactSets:S.recordedArtifactSets(actions),oneStartingSilo:plan.initialSiloRule==='one'||actions.some(a=>a.initialSiloRule==='one')});
 const group={firstIndex:0,lastIndex:actions.length-1,start:plan.start,end:plan.end};
 Rates.attach([group],actions,s,c);
 let soul=s.soul,shiftCount=s.shiftCount,soulCost=0;
 for(const a of actions)if(a.type==='shift'){const cost=S.shiftCost({soul,shiftCount});soulCost+=cost;soul-=cost;shiftCount++;}
 return {seconds:plan.seconds,end:plan.end,maxLaying:group.maxRates.laying,maxShipping:group.maxRates.shipping,soulCost};
}
function difference(value,baseline,lowerIsBetter=false){
 if(!Number.isFinite(value)||!Number.isFinite(baseline)||value<0||baseline<0)return null;
 const direction=Math.sign(value-baseline);
 return {percent:baseline===0?(direction===0?0:null):(value-baseline)/baseline*100,direction,better:direction===0?null:(lowerIsBetter?direction<0:direction>0)};
}
module.exports={metrics,difference};
