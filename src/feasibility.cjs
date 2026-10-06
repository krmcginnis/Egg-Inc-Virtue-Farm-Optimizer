'use strict';
const S=require('./simulator.cjs');
// Conservative upper bounds: free instant equipment/upgrades, best loadout effect
// for each stat independently, continuous 2x earnings, minimum research prices,
// no cash lost on switching, and no physical or other research spending.
// A failure under these grants proves failure within the entered time horizon.
function assess(initial,c){
 const base=S.teByEgg(initial,c),initialTE=base.reduce((a,b)=>a+b,0),needed=Math.max(0,c.target-initialTE,c.floors.reduce((sum,n,i)=>sum+Math.max(0,n-base[i]),0));
 if(!needed&&base.every((n,i)=>n>=c.floors[i]))return {impossible:false,initialTE};
 const upper=S.clone(initial);upper.r=S.D.research.map(r=>r.levels);upper.h=[18,18,18,18];upper.v=Array.from({length:17},()=>({id:11,cars:10}));
 let boundContext=c;
 if(c.artifactModel){
  const owned=require('./artifact-optimizer.cjs').optimisticModifiers(c.artifactModel),effects=[owned,...Object.values(c.mods)],optimistic=Object.fromEntries(Object.keys(owned).map(k=>[k,(k==='research'?Math.min:Math.max)(...effects.map(m=>m[k]))]));
  boundContext={...c,mods:{optimistic}};upper.set='optimistic';
 }
 const mods=Object.values(boundContext.mods),discount=(1-.05*c.epic.cheaper_research)*c.col.researchCost*c.researchCostScale*Math.min(...mods.map(m=>m.research))*.3;
 let maxDelivery=0,budget=Infinity;
 for(let iteration=0;iteration<64;iteration++){
  let eggValue=0;maxDelivery=0;for(const set of Object.keys(boundContext.mods)){upper.set=set;const r=S.stats(upper,boundContext);maxDelivery=Math.max(maxDelivery,r.delivery);eggValue=Math.max(eggValue,r.eggValue);}
  let income=maxDelivery*eggValue*1.1**c.claimedTotal*c.col.earnings*c.video*c.earningsScale*2;
  if(c.earningsMode==='offline')income*=c.col.awayEarnings*Math.max(...mods.map(m=>m.away))*(c.pro?1:.5);
  budget=initial.cash+income*(c.end-c.start);if(!Number.isFinite(budget)||!Number.isFinite(maxDelivery))return {impossible:false,inconclusive:true};
  let changed=false;for(let i=0;i<upper.r.length;i++){let spent=0,cap=initial.r[i];for(let level=initial.r[i];level<upper.r[i];level++){spent+=Math.ceil(S.D.research[i].virtue_prices[level]*discount);if(spent>budget*(1+1e-12))break;cap=level+1;}if(cap<upper.r[i]){changed=true;upper.r[i]=cap;}}
  if(!changed)break;
 }
 // Recompute after the final caps, including the iteration-limit case.
 maxDelivery=0;for(const set of Object.keys(boundContext.mods)){upper.set=set;maxDelivery=Math.max(maxDelivery,S.stats(upper,boundContext).delivery);}
 function required(floors){let dp=Array(needed+1).fill(Infinity);dp[0]=0;for(let egg=0;egg<5;egg++){const next=Array(needed+1).fill(Infinity),min=Math.max(0,floors[egg]-base[egg]);for(let total=0;total<=needed;total++)if(Number.isFinite(dp[total]))for(let k=min;k<=Math.min(98-base[egg],needed-total);k++){const cost=k?Math.max(0,S.D.te[base[egg]+k-1]-initial.eggs[egg]):0;next[total+k]=Math.min(next[total+k],dp[total]+cost);}dp=next;}return dp;}
 const targetCost=required(c.floors)[needed],capacity=maxDelivery*(c.end-c.start),costs=required([0,0,0,0,0]);let upperTE=initialTE;for(let k=0;k<=needed;k++)if(costs[k]<=capacity*(1+1e-10))upperTE=initialTE+k;
 return {impossible:targetCost>capacity*(1+1e-10),initialTE,upperTE,minimumEggs:targetCost,deliveryCeiling:maxDelivery,eggCapacity:capacity,cashCeiling:budget,horizonDays:(c.end-c.start)/86400,allEpicZero:Object.values(c.epic).every(n=>n===0),researchCaps:upper.r};
}
function message(report,c){return 'Under the entered farm settings, '+c.target+' TE cannot be reached within '+report.horizonDays+' days. Even an optimistic calculation with instant equipment, continuous 2× earnings and minimum research prices permits at most '+report.upperTE+' total TE.'+(report.allEpicZero?' All Epic Research levels are zero. Epic Research persists across ascensions; enter your owned levels even for a fresh Virtue farm.':'')+' Review those inputs, increase the planning days, or lower the target.';}
module.exports={assess,message};
