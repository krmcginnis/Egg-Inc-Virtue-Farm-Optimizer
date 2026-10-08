'use strict';
const S=require('./simulator.cjs'),Sleep=require('./sleep-schedule.cjs');
// Branch only inside a passive wait, never between payment and its interaction.
// Recompute real cash and delivery for each prefix; no upgrade is granted.
function duringWait(s,c,a){
 if(!c.sleep||a.type!=='wait'||/interaction time|Switch overhead/.test(a.reason||'')||Math.abs(s.t-a.t)>.01)return [];
 const times=[],nights=c.sleep.intervals.filter(p=>p.end>s.t&&p.start<a.end);
 for(const p of [...new Set([nights[0],nights.at(-1)].filter(Boolean))])times.push(p.start-c.shiftSeconds,p.end);
 const sale=c.calendar.find(e=>e.t>s.t&&e.t<a.end&&e.sale!==S.at(c,s.t).sale);if(sale)times.push(sale.t);
 const output=[];
 for(const t of [...new Set(times)].sort((a,b)=>a-b)){
  if(t<=s.t+1e-6||t>=a.end-1e-6||!Sleep.active(c.sleep,t,c.shiftSeconds))continue;
  const mode=a.earningsMode==='offline'&&t-s.t<S.offlineMinimum(c)?'online':a.earningsMode||'auto';
  const n=S.advance(s,c,t,'Compare an awake departure before sleep or at a calendar boundary',true,mode);
  output.push(n);
 }
 return output;
}
function beforePurchase(s,c,ready){
 if(!c.sleep)return [];
 const waits=[];let p=ready.path;while(p&&p!==s.path){if(p.action.type!=='wait')return [];waits.push(p.action);p=p.prev;}
 if(p!==s.path)return [];
 let n=s;const output=[];
 for(const a of waits.reverse()){output.push(...duringWait(n,c,a));n=S.advance(n,c,a.end,a.reason,true,a.earningsMode||'auto');}
 return output;
}
module.exports={duringWait,beforePurchase};
