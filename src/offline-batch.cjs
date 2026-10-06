'use strict';
const S=require('./simulator.cjs');
const W=require('./waiting-objective.cjs');
// Compare a sequence of short online cash waits with one uninterrupted offline
// break. Rates stay at the pre-purchase values for that entire break.
function costOf(s,c,actions,t){let n={...S.clone(s),t},total=0;for(const a of actions){if(!S.allowed(n,c,a))return Infinity;total+=S.price(n,c,a);n=S.mutate(n,c,a);}return total;}
function fundTime(s,c,actions,latest){
 const rate=S.stats(s,c).offline,minimum=s.t+S.offlineMinimum(c);let t=s.t,cash=s.cash;
 while(t<latest){const ev=S.at(c,t),end=Math.min(ev.next,latest),cost=costOf(s,c,actions,t),ready=Math.max(minimum,t+Math.max(0,cost-cash)/(rate*ev.earnings)+.001);
  if(ready<=end)return ready;if(end<=t)break;cash+=(end-t)*rate*ev.earnings;t=end;
 }return null;
}
function compareShortOnline(s,c,actions,deadline=c.end){
 deadline=Math.min(deadline,S.visitDeadline(s,c));
 const r=S.stats(s,c),minimum=S.offlineMinimum(c);if(c.earningsMode!=='offline'||r.offline<=r.online||s.t+minimum>deadline)return null;
 const first=actions[0]&&S.afford(s,c,actions[0]);if(!first||first.t<=s.t||first.path?.action.earningsMode!=='online')return null;
 let online=s,sequence=[],onlineSeconds=0;
 for(const a of actions.slice(0,64)){const ready=S.afford(online,c,a);if(!ready||ready.t+c.actionsSeconds>deadline)break;if(ready.t>online.t&&ready.path?.action.earningsMode==='offline')break;onlineSeconds+=ready.t-online.t;online=S.buy(ready,c,a);sequence.push(a);if(online.t-s.t>=Math.max(300,minimum*2))break;}
 if(sequence.length<2||online.t-s.t<=minimum)return null;
 const times=new Set([s.t+minimum]),funded=fundTime(s,c,sequence,Math.min(deadline,online.t));if(funded)times.add(funded);let best=null;
 for(const to of times){try{let n=S.advance(s,c,to,'One offline break to fund a batch of purchases',true,'offline');for(const a of sequence){const ready=S.afford(n,c,a);if(!ready||ready.t+c.actionsSeconds>deadline){n=null;break;}n=S.buy(ready,c,a);}if(n&&n.t<online.t-1e-6&&(!best||n.t<best.s.t))best={s:n,count:sequence.length,onlineSeconds,secondsSaved:online.t-n.t,breaksSaved:W.offlineBreaks(online)-W.offlineBreaks(n)};}catch{}}
 return best;
}
function compare(s,c,actions,deadline=c.end){
 deadline=Math.min(deadline,S.visitDeadline(s,c));
 if(c.batchMode==='short-online')return compareShortOnline(s,c,actions,deadline);
 const r=S.stats(s,c),minimum=S.offlineMinimum(c);if(c.earningsMode!=='offline'||r.offline<=r.online||s.t+minimum>deadline)return null;
 // Keep the earliest individual schedule as a baseline, whether its waits are
 // online or offline. Combining offline waits matters for fewer check-ins too.
 const first=actions[0]&&S.afford(s,c,actions[0]);if(!first||first.t<=s.t)return null;
 let individual=s,sequence=[],onlineSeconds=0;const prefixes=[];
 for(const a of actions.slice(0,64)){
  const ready=S.afford(individual,c,a);if(!ready||ready.t+c.actionsSeconds>deadline)break;
  if(ready.t>individual.t&&ready.path?.action.earningsMode==='online')onlineSeconds+=ready.t-individual.t;
  individual=S.buy(ready,c,a);sequence.push(a);
  if([2,4,8,16,32,64].includes(sequence.length))prefixes.push({s:individual,actions:sequence.slice(),onlineSeconds});
  if(individual.t-s.t>=Math.max(300,minimum*2))break;
 }
 if(sequence.length<2)return null;
 if(prefixes.at(-1)?.actions.length!==sequence.length)prefixes.push({s:individual,actions:sequence.slice(),onlineSeconds});
 let best=null;
 for(const prefix of prefixes){if(prefix.s.t-s.t<minimum)continue;
 const times=new Set([s.t+minimum]),funded=fundTime(s,c,prefix.actions,Math.min(deadline,prefix.s.t));if(funded)times.add(funded);
 for(const to of times){try{
  let n=S.advance(s,c,to,'One offline break to fund a batch of purchases',true,'offline');
  for(const a of prefix.actions){const ready=S.afford(n,c,a);if(!ready||ready.t+c.actionsSeconds>deadline){n=null;break;}n=S.buy(ready,c,a);}
  if(!n||!W.better(n,prefix.s))continue;
  const secondsSaved=prefix.s.t-n.t,breaksSaved=W.offlineBreaks(prefix.s)-W.offlineBreaks(n);
  if(!best||secondsSaved>best.secondsSaved+1e-6||Math.abs(secondsSaved-best.secondsSaved)<=1e-6&&breaksSaved>best.breaksSaved)best={s:n,count:prefix.actions.length,onlineSeconds:prefix.onlineSeconds,secondsSaved,breaksSaved};
 }catch{}}}
 return best;
}
module.exports={compare,compareShortOnline};
