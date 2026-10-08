'use strict';
const S=require('./simulator.cjs'),I=require('./plan-incumbents.cjs'),Schedules=require('./schedule-proposals.cjs');
function compatible(raw,old){
 try{
  const active=raw.farm.activeSet||Object.keys(raw.farm.loadouts||{})[0];
  if(!active||!old?.farm.loadouts?.[active]||!raw.farm.loadouts?.[active])return false;
  const comparison=structuredClone(raw);comparison.farm.loadouts[active]=structuredClone(old.farm.loadouts[active]);
  if(I.key(comparison)!==I.key(old))return false;
  const limit=raw.farm.proPermit===false?2:4;
  const now=S.modifiers(S.validateLoadout(raw.farm.loadouts[active],limit)),before=S.modifiers(S.validateLoadout(old.farm.loadouts[active],limit));
  if(['hab','shipping','laying','research','ihr'].some(k=>now[k]!==before[k]))return false;
  return now.eggValue>=before.eggValue&&now.eggValue*now.away>=before.eggValue*before.away&&
   (now.eggValue>before.eggValue||now.eggValue*now.away>before.eggValue*before.away);
 }catch{return false;}
}
// Changed inputs never receive an old replay state. A strictly earnings-only
// upgrade may propose an order, which must be paid and replayed from scratch.
function adapt(raw,incumbent,{prepare,replay,checkpoint=()=>{}}){
 if(!incumbent?.result||!compatible(raw,incumbent.config))return [];
 const output=[],templates=[],active=raw.farm.activeSet||Object.keys(raw.farm.loadouts)[0];
 const entries=incumbent.result.shiftPlans||[{plan:incumbent.result}];
 if(!Array.isArray(entries))return [];
 for(const entry of entries)try{
  checkpoint();const plan=entry?.plan,marker=plan?.actions?.[0]?.routeSearch;
  if(plan?.solverVersion!==2||marker?.version!==2)continue;
  const old=replay(incumbent.config,plan.actions);
  if(old.s.t!==plan.end||old.s.stage!==plan.switches||plan.seconds!==old.s.t-old.c.start)continue;
  const route=marker.sequence;
  const actions=plan.actions.map(a=>a.type==='set'&&a.set===active&&a.loadout?{...a,loadout:raw.farm.loadouts[active]}:a);
  // First reevaluate every unchanged calendar timeline with the actual new
  // earnings. Preserve shift-count alternatives before compressing any waits.
  const verified=replay(raw,actions,true);
  if(verified.s.t<=plan.end+1e-6&&verified.s.stage<=plan.switches&&S.reached(verified.s,verified.c)){
   output.push({state:verified.s,context:verified.c,route,count:marker.researchSales});
   templates.push({plan,route,actions,marker});
  }
 }catch{try{checkpoint();}catch{break;}}
 for(const {plan,route,actions,marker} of templates)try{
   checkpoint();const sets=S.recordedArtifactSets(actions);delete sets[active];
   const {s,c}=prepare(raw,route,marker.researchSales,{artifactReplay:true,artifactSets:sets});
   // Preserve research permissions and the entered route for replay, but
   // prevent delivery reallocation from adding trips beyond the old finish.
   const state=Schedules.execute(s,{...c,sequence:c.sequence.slice(0,plan.switches+1),maxSwitches:plan.switches,end:Math.min(c.end,plan.end+1e-5)},actions,{compress:true,retime:true,checkpoint});
   if(!state||state.stage>plan.switches||state.t>plan.end+1e-6)continue;
   const checked=S.history(state).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:{...marker,sequence:route}});
   const verified=replay(raw,checked,true);
   if(verified.s.t!==state.t||!S.reached(verified.s,verified.c))continue;
   output.push({state:verified.s,context:verified.c,route,count:marker.researchSales});
 }catch{try{checkpoint();}catch{break;}}
 return output;
}
module.exports={compatible,adapt};
