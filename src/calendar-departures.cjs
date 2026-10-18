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
function fractions(s,c,a,parts=[.5]){
 if(a.type!=='wait'||a.end-a.t<Math.max(600,c.offlineMinSeconds||60)||/interaction time|Switch overhead/.test(a.reason||'')||Math.abs(s.t-a.t)>.01)return [];
 const times=parts.map(part=>a.t+(a.end-a.t)*part);
 for(const event of c.calendar)if(event.t>a.t&&event.t<a.end)times.push(event.t);
 const output=[];for(let t of [...new Set(times)].sort((a,b)=>a-b)){
  t=Sleep.nextActive(c.sleep,t,c.shiftSeconds);if(t<=s.t+1e-6||t>=a.end-1e-6)continue;
  const mode=a.earningsMode==='offline'&&t-s.t<S.offlineMinimum(c)?'online':a.earningsMode||'auto';
  output.push(S.advance(s,c,t,'Compare a refined paid departure',true,mode));
 }
 return output;
}
function critical(s,c,a,{limit=12}={}){
 if(a.type!=='wait'||/interaction time|Switch overhead/.test(a.reason||'')||Math.abs(s.t-a.t)>.01||s.stage+1>=c.sequence.length)return [];
 const times=new Set(),add=t=>{if(Number.isFinite(t)&&t>s.t+1e-6&&t<a.end-1e-6)times.add(t);},r=S.stats(s,c);
 // Milestone times use the simulator's exact production integration, including
 // silo exhaustion during sleep. Fractional waits need not land on these.
 const current=S.teByEgg(s,c)[s.egg],goals=new Set([current+1,c.floors[s.egg]]);
 for(let goal=current+1;goal<=98;goal++)if(S.D.te[goal-1]>s.eggs[s.egg]){
  const t=S.productionEnd(s,c,Math.max(0,S.D.te[goal-1]-s.eggs[s.egg])/Math.max(1e-300,r.delivery),a.end);
  if(Number.isFinite(t)&&t<a.end)goals.add(goal);else break;
 }
 for(const goal of goals)if(goal>current&&goal<=98)add(S.productionEnd(s,c,Math.max(0,S.D.te[goal-1]-s.eggs[s.egg])/Math.max(1e-300,r.delivery),a.end));
 // Finishing a switch just before a sale/sleep boundary differs from starting
 // it on that boundary. Include both legal sides of discontinuities.
 for(const e of c.calendar)if(e.t>s.t&&e.t<=a.end+c.shiftSeconds){add(e.t-c.shiftSeconds-.001);add(e.t);}
 for(const p of c.sleep?.intervals||[]){add(p.start-c.shiftSeconds-.001);add(p.end);add(p.start+r.siloHours*3600);}
 // Also compare actual affordability thresholds for alternative purchases,
 // rather than assuming that the next recorded purchase is the only choice.
 const L=require('./optimizer-legacy.cjs'),candidates=L.candidates(s,c).filter(x=>S.allowed(s,c,x)).sort((x,y)=>S.price(s,c,x)-S.price(s,c,y)).slice(0,8);
 for(const action of candidates)try{const n=S.afford(s,{...c,end:Math.min(c.end,a.end)},action);if(n)add(n.t);}catch{}
 let ordered=[...times].sort((x,y)=>x-y);
 if(ordered.length>limit){const chosen=new Set([ordered[0],ordered.at(-1)]);for(let i=1;chosen.size<limit&&i<limit;i++)chosen.add(ordered[Math.round(i*(ordered.length-1)/(limit-1))]);ordered=[...chosen].sort((x,y)=>x-y);}
 const output=[];for(const t of ordered){
  if(!Sleep.active(c.sleep,t,c.shiftSeconds))continue;
  const mode=a.earningsMode==='offline'&&t-s.t<S.offlineMinimum(c)?'online':a.earningsMode||'auto';
  output.push(S.advance(s,c,t,'Compare a calculated milestone, funding or calendar departure',true,mode));
 }
 return output;
}
module.exports={duringWait,beforePurchase,fractions,critical};
