'use strict';
const S=require('./simulator.cjs'),Schedules=require('./schedule-proposals.cjs');
const TARGET=8;
function preferred(a,b){return Math.min(TARGET,a.silos??0)>Math.min(TARGET,b.silos??0);}
function improve(initial,c,state,{checkpoint=()=>{}}={}){
 const target=Math.min(TARGET,c.pro?10:2);
 if(state.silos>=target)return state;
 const actions=S.history(state),visits=[];let stage=initial.stage,egg=initial.egg;
 if(egg===3)visits.push(stage);
 for(const a of actions)if(a.type==='shift'){stage++;egg=a.egg;if(egg===3)visits.push(stage);}
 let best=state;
 // Add comfort purchases only on existing R visits. Reexecute the paid plan
 // and reallocate delivery; staying longer on R can replace a later TE wait.
 // Acceptance preserves both the completion time and the number of shifts.
 for(const visit of visits)for(let desired=target;desired>state.silos;desired--){
  try{
   checkpoint();let inserted=false;
   const extra=desired-state.silos,phase='R'+c.sequence.slice(0,visit+1).filter(e=>e===3).length;
   const context={...c,end:Math.min(c.end,state.t+1e-5)};
   const candidate=Schedules.execute(initial,context,actions,{retime:true,checkpoint,reallocate:n=>n.stage>=visit,beforeAction(n,a){
    const delivery=Schedules.deliveryWait(a);
    if(inserted||n.stage!==visit||n.egg!==3||a.type!=='shift'&&!delivery)return n;
    inserted=true;
    for(let i=0;i<extra;i++){
     checkpoint();const base=n.path,ready=S.afford(n,{...context,shipReplay:true,sleepReplay:false},{type:'silo'});
     if(!ready)throw Error('Comfort silo cannot be funded within the existing finish time.');
     n=S.buy(ready,{...context,shipReplay:true,sleepReplay:false},{type:'silo',phase});
     const added=[];for(let p=n.path;p&&p!==base;p=p.prev)added.push(p.action);
     let path=base;for(const action of added.reverse())path={prev:path,action:{...action,phase}};n={...n,path};
    }
    return n;
   }});
   checkpoint();
   const faster=candidate&&candidate.t<best.t-1e-6,tied=candidate&&Math.abs(candidate.t-best.t)<=1e-6;
   if(inserted&&candidate&&S.reached(candidate,c)&&candidate.stage===state.stage&&candidate.silos>state.silos&&candidate.t<=state.t+1e-6&&(faster||tied&&preferred(candidate,best))){
    best={...candidate,artifactRecommendations:candidate.artifactRecommendations||state.artifactRecommendations,siloComfort:{target,startingSilos:initial.silos,previousSilos:state.silos,finalSilos:candidate.silos,added:candidate.silos-state.silos}};
   }
  }catch(error){try{checkpoint();}catch{return best;}}
 }
 return best;
}
module.exports={TARGET,preferred,improve};
