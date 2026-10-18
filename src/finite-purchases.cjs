'use strict';
const S=require('./simulator.cjs'),Orders=require('./purchase-order-reduction.cjs');
function pool(actions){
 const groups=new Map();for(const a of actions){
  if(!['research','hab','vehicle','car','silo'].includes(a.type))throw Error('Unsupported exact purchase action.');
  const action=Object.fromEntries(['type','i','slot','id'].filter(k=>a[k]!==undefined).map(k=>[k,a[k]])),key=Orders.actionKey(action),group=groups.get(key)||{action,count:0};group.count++;groups.set(key,group);
 }
 return [...groups.values()];
}
function fresh(actions){return {version:1,pool:pool(actions),frontier:[[]],seen:[],examined:0,reduced:0,feasible:0,complete:false};}
// Complete ONLY for the declared finite multiset: all subsets and legal
// orderings, using earliest-affordable simulator execution, a fixed suffix,
// and the caller's explicitly enumerated calendar policies.
async function run(initial,c,session,{evaluate,consider,deadline=Infinity,cancelled=()=>false,pause=()=>Promise.resolve(),reduce=true,canImprove=()=>true,progress=()=>{}}){
 if(session.version!==1||!Array.isArray(session.frontier)||!Array.isArray(session.seen)||session.pool.reduce((n,x)=>n+x.count,0)>8)throw Error('Invalid finite purchase checkpoint.');
 const seen=new Set(session.seen),check=()=>{if(cancelled()||Date.now()>=deadline)throw Error('Finite purchase search paused');};
 let since=0;
 while(session.frontier.length){
  if(cancelled()||Date.now()>=deadline)break;
  const order=session.frontier.pop(),counts=session.pool.map(()=>0);let n=initial,invalid=false;
  try{
   for(const id of order){check();if(!Number.isInteger(id)||!session.pool[id]||++counts[id]>session.pool[id].count)throw Error('Invalid finite purchase path.');
    try{const action=session.pool[id].action,ready=S.afford(n,c,action,check);if(!ready){invalid=true;break;}n=S.buy(ready,c,action);}catch{check();invalid=true;break;}
   }
   if(invalid)continue;
   const key=JSON.stringify([counts,Orders.stateKey(n)]);
   if(reduce&&seen.has(key)){session.reduced++;continue;}
   const useful=canImprove(n),result=useful?await evaluate(n,check):null;check();
   if(result){session.feasible++;consider(result);}
   const children=[];if(useful)for(let id=0;id<session.pool.length;id++)if(counts[id]<session.pool[id].count&&S.allowed(n,c,session.pool[id].action))children.push([...order,id]);
   if(reduce)seen.add(key);session.examined++;
   // Reverse insertion gives stable, reproducible depth-first enumeration.
   session.frontier.push(...children.reverse());
  }catch(error){if(cancelled()||Date.now()>=deadline){session.frontier.push(order);break;}throw error;}
  if(++since>=16){since=0;progress(session);await pause();}
 }
 session.seen=[...seen];session.complete=session.frontier.length===0;progress(session);return session;
}
module.exports={pool,fresh,run};
