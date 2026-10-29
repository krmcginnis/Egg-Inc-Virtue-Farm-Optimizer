'use strict';
const MAX_SLOWDOWN=.05,EPSILON=1e-6;
const OBJECTIVE='Fewest shifts within 5% of the fastest completion time found to the TE target; then faster completion, silo coverage up to eight silos, fewer earning breaks, and fewer purchases';
const planOf=entry=>entry.plan;
function fastest(entries,read=planOf){
 return entries.reduce((best,entry)=>{const a=read(entry),b=best&&read(best);return !b||a.seconds<b.seconds||a.seconds===b.seconds&&a.switches<b.switches?entry:best;},null);
}
// This is a set-wide preference, not a pairwise comparator. Comparing each
// plan with the previous recommendation would compound the 5% allowance.
// Search/pruning still keeps the fastest paid candidate for EACH shift count.
function rank(entries,read=planOf){
 const reference=fastest(entries,read);if(!reference)return [];
 const limit=read(reference).seconds*(1+MAX_SLOWDOWN);
 const eligible=entry=>read(entry).seconds<=limit+EPSILON;
 return entries.slice().sort((a,b)=>{
  const ae=eligible(a),be=eligible(b),ap=read(a),bp=read(b);
  if(ae!==be)return ae?-1:1;
  return ae?ap.switches-bp.switches||ap.seconds-bp.seconds:ap.seconds-bp.seconds||ap.switches-bp.switches;
 });
}
function shortlist(entries,read=planOf){
 const ordered=rank(entries,read);
 // Preserve both the recommendation and its true fastest reference before
 // applying the three-card limit, even when many shift counts qualify.
 return [...new Set([ordered[0],fastest(entries,read),...ordered])].filter(Boolean).slice(0,3);
}
function create(entries){
 const shiftPlans=shortlist(entries);
 if(!shiftPlans.length)throw Error('No complete shift-count plan is available.');
 return select({shiftPlans},shiftPlans[0].switches);
}
function select(result,switches){
 const entry=result.shiftPlans?.find(x=>x.switches===switches);
 if(!entry)throw Error('That shift-count plan is not available.');
 return {...entry.plan,objective:OBJECTIVE,shiftPlans:result.shiftPlans,selectedSwitches:switches,recommendedSwitches:rank(result.shiftPlans)[0].switches,shiftComparisonVersion:1};
}
function validate(result){
 if(result.shiftPlans===undefined)return;
 const plans=result.shiftPlans,counts=new Set();
 if(result.shiftComparisonVersion!==1||!Array.isArray(plans)||plans.length<1||plans.length>3)throw Error('Invalid shift-count comparison.');
 for(const entry of plans){if(!entry||!Number.isInteger(entry.switches)||entry.switches<0||entry.switches>30||counts.has(entry.switches)||entry.plan?.switches!==entry.switches||!Array.isArray(entry.plan.actions)||entry.plan.shiftPlans||entry.plan.researchSalePlans)throw Error('Invalid shift-count plan.');counts.add(entry.switches);}
 if(!counts.has(result.selectedSwitches)||!counts.has(result.recommendedSwitches))throw Error('The selected or recommended shift-count plan is missing.');
}
function replay(config,result,replayOne){
 if(result.shiftPlans===undefined)return replayOne(config,result);
 validate(result);const entries=result.shiftPlans.map(entry=>({...entry,plan:replayOne(config,entry.plan)}));
 return select({...result,shiftPlans:entries},result.selectedSwitches);
}
module.exports={MAX_SLOWDOWN,OBJECTIVE,fastest,rank,shortlist,create,select,validate,replay};
