'use strict';
const S=require('./simulator.cjs'),R=require('./route-solver.cjs'),Schedules=require('./schedule-proposals.cjs'),Finite=require('./finite-purchases.cjs'),Incumbents=require('./plan-incumbents.cjs'),Quality=require('./search-quality.cjs');
const Bounds=require('./search-bounds.cjs');
const Ships=require('./ships.cjs');
function definitions(actions,size=5){
 const blocks=[];let run=[];
 const flush=()=>{for(let offset=0;offset<run.length;offset+=size){const part=run.slice(offset,offset+size);if(part.length>1){let first=part[0];while(first>0&&actions[first-1].type==='wait'&&!/interaction time|Switch overhead/.test(actions[first-1].reason||'')&&!Schedules.deliveryWait(actions[first-1]))first--;blocks.push({first,last:part.at(-1),actions:part.map(i=>actions[i])});}}run=[];};
 for(let i=0;i<actions.length;i++){const a=actions[i];if(['research','hab','vehicle','car','silo'].includes(a.type))run.push(i);else if(a.type!=='wait')flush();}flush();return blocks;
}
function prefix(raw,source,end){
 const marker=source[0].routeSearch,{s,c}=R.prepare(raw,marker.sequence,marker.researchSales,{artifactReplay:true,artifactSets:S.recordedArtifactSets(source)});let n=s;
 for(const a of source.slice(0,end))n=a.type==='wait'?S.advance(n,c,a.end,a.reason,true,a.earningsMode||'auto'):S.buy(n,{...c,actionsSeconds:a.type==='ship-run'?c.actionsSeconds:0,shiftSeconds:0,shipReplay:true},a);
 return {s:n,c};
}
function checkpoint(raw,saved){
 try{
  if(saved?.version!==1||saved.configKey!==Incumbents.key(raw)||!Array.isArray(saved.source)||!Array.isArray(saved.blocks)||!Number.isInteger(saved.index)||saved.index<0||!Number.isInteger(saved.examined)||saved.examined<0||!Number.isFinite(saved.sourceEnd))return null;
  const count=definitions(saved.source).length;
  if(saved.totalBlocks!==count||saved.completedBlocks!==saved.index||saved.index>count||saved.blocks.length>count||saved.index>saved.blocks.length||saved.complete!==(saved.index===count))return null;
  for(let i=0;i<saved.blocks.length;i++){const b=saved.blocks[i];if(b?.version!==1||!Array.isArray(b.pool)||!Array.isArray(b.frontier)||!Array.isArray(b.seen)||!Number.isInteger(b.examined)||b.examined<0||b.pool.some(x=>!Number.isInteger(x.count)||x.count<1)||b.pool.reduce((n,x)=>n+x.count,0)>8||b.frontier.some(order=>!Array.isArray(order)||order.some(id=>!Number.isInteger(id)||id<0||id>=b.pool.length))||i<saved.index&&!b.complete)return null;}
  return saved;
 }catch{return null;}
}
async function search(raw,result,{maxMs=300000,absoluteDeadline=Infinity}={},progress=()=>{},cancelled=()=>false){
 R.replay(raw,result.actions,true);
 const key=Incumbents.key(raw),saved=checkpoint(raw,result.verification);
 const session=saved?structuredClone(saved):{version:1,configKey:key,source:result.actions,sourceEnd:result.end,blocks:[],index:0,passes:0,examined:0};
 R.replay(raw,session.source,true);
 let definitionsNow=definitions(session.source);const deadline=Math.min(absoluteDeadline,Date.now()+Math.max(100,Math.min(600000,maxMs))),pause=()=>new Promise(r=>setTimeout(r,0));
 let best=result,bestState=R.replay(raw,result.actions,true).s;
 const accept=(n,c)=>{
  if(!S.reached(n,c)||!R.better(n,bestState))return;
  const actions=S.history(n).map((a,i)=>i?a:{...a,initialSiloRule:'one',routeSearch:session.source[0].routeSearch}),paid=R.replay(raw,actions,true);
  const sales=new Set();for(const a of actions)if(a.type==='research'&&S.at(c,a.t).sale===.3){let start=c.start;for(const event of c.calendar)if(event.t<=a.t&&event.sale===.3)start=event.t;sales.add(start);}
  bestState=paid.s;best={...best,actions,end:paid.s.t,seconds:paid.s.t-paid.c.start,switches:paid.s.stage,soulCost:paid.s.lost,finalTE:S.teByEgg(paid.s,paid.c),pendingTE:S.totalTE(paid.s,paid.c)-paid.c.claimedTotal,finalCash:paid.s.cash,finalStats:S.stats(paid.s,paid.c),shipPlan:Ships.summary(actions),actualResearchSales:sales.size,frontier:[{switches:paid.s.stage,seconds:paid.s.t-paid.c.start,soulCost:paid.s.lost}],validatedReplay:true};
  delete best.summary;delete best.shiftPlans;delete best.selectedSwitches;delete best.recommendedSwitches;delete best.shiftComparisonVersion;
 };
 while(session.index<definitionsNow.length&&Date.now()<deadline&&!cancelled()){
  const definition=definitionsNow[session.index],{s,c}=prefix(raw,session.source,definition.first),suffix=session.source.slice(definition.last+1);
  let local=session.blocks[session.index];if(!local)local=session.blocks[session.index]=Finite.fresh(definition.actions);
  if(JSON.stringify(local.pool)!==JSON.stringify(Finite.pool(definition.actions)))throw Error('Verification checkpoint differs from its source purchases.');
  const before=local.examined;
  await Finite.run(s,c,local,{deadline,cancelled,pause,canImprove:n=>!Bounds.deadline(n,c,bestState.t+.01).impossible,progress:()=>progress({phase:'verification',stage:'Purchase block '+(session.index+1)+' / '+definitionsNow.length,explored:session.examined+local.examined-before,bestSeconds:best.seconds}),
   evaluate:(n,check)=>{
    let winner=null;for(const preserveCalendar of [true,false])try{check();const end=Schedules.execute(n,c,suffix,{retime:true,recomputeFunding:true,preserveCalendar,checkpoint:check});if(R.better(end,winner))winner=end;}catch{check();}
    return winner;
   },consider:n=>accept(n,c)});
  session.examined+=local.examined-before;if(!local.complete)break;session.index++;
  if(session.index===definitionsNow.length&&best.end<session.sourceEnd-1e-6){session.source=best.actions;session.sourceEnd=best.end;session.blocks=[];session.index=0;session.passes++;definitionsNow=definitions(session.source);}
 }
 session.complete=session.index===definitionsNow.length;session.scope='All subsets and legal orders in each declared block of up to five purchases; earliest-affordable execution; fixed source route and suffix; preserve/retime calendar policies';
 session.totalBlocks=definitionsNow.length;session.completedBlocks=session.index;
 // Keep all alternate shift-count plans, replacing only an improved winner.
 if(result.shiftPlans){const entries=result.shiftPlans.map(entry=>entry.switches===best.switches?{...entry,plan:{...best,shiftPlans:undefined}}:entry);best={...best,shiftPlans:entries,selectedSwitches:best.switches,recommendedSwitches:result.recommendedSwitches,shiftComparisonVersion:1};}
 const verification={...session,globalOptimalityProven:false};
 best={...best,optimality:Quality.measure(raw,best),verification,termination:cancelled()?'verification paused with best plan':session.complete?'declared purchase blocks exhausted':'verification budget reached'};
 if(best.shiftPlans)best.shiftPlans=best.shiftPlans.map(entry=>entry.switches===best.switches?{...entry,plan:{...entry.plan,optimality:best.optimality,verification,termination:best.termination}}:entry);
 return best;
}
module.exports={definitions,prefix,checkpoint,search};
