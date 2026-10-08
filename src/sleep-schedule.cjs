'use strict';
const DAY=86400,cache=new Map();
function minutes(value,label){
 if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error(label+' must use HH:MM.');
 const [h,m]=value.split(':').map(Number);return h*60+m;
}
function compile(raw,start,end,fallbackZone){
 if(!raw||raw.enabled===false)return undefined;
 if(raw.enabled!==true)throw Error('Sleep schedule enabled must be true or false.');
 const begin=minutes(raw.start,'Sleep start'),finish=minutes(raw.end,'Wake time');
 if(begin===finish)throw Error('Sleep start and wake time must differ.');
 const zone=raw.timezone||fallbackZone,key=JSON.stringify([start,end,begin,finish,zone]);
 if(cache.has(key))return cache.get(key);
 let format;try{format=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});}catch{throw Error('Choose a valid sleep timezone.');}
 function civil(t){const p=Object.fromEntries(format.formatToParts(new Date(t*1000)).map(x=>[x.type,x.value]));return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)/1000;}
 function resolve(local,last=false){
  const offsets=[...new Set([-36*3600,0,36*3600].map(dt=>{const t=local+dt;return civil(t)-t;}))];
  const proposed=offsets.map(offset=>local-offset),matches=proposed.filter(t=>civil(t)===local);
  if(matches.length)return last?Math.max(...matches):Math.min(...matches);
  // A skipped spring-forward clock time moves to the first valid local minute.
  let lo=Math.floor(Math.min(...proposed)/60)-1,hi=Math.ceil(Math.max(...proposed)/60)+1;
  while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(civil(mid*60)>=local)hi=mid;else lo=mid;}
  return hi*60;
 }
 const intervals=[];
 for(let day=Math.floor(start/DAY)*DAY-2*DAY;day<=end+2*DAY;day+=DAY){
  const a=resolve(day+begin*60),b=resolve(day+(finish<begin?DAY:0)+finish*60,true);
  if(b>a&&b>start&&a<end+DAY)intervals.push({start:a,end:b});
 }
 intervals.sort((a,b)=>a.start-b.start);
 const merged=[];for(const interval of intervals){const last=merged.at(-1);if(last&&interval.start<=last.end)last.end=Math.max(last.end,interval.end);else merged.push({...interval});}
 const schedule={start:raw.start,end:raw.end,timezone:zone,intervals:merged};
 merged.forEach(Object.freeze);Object.freeze(merged);Object.freeze(schedule);
 if(cache.size>=4)cache.delete(cache.keys().next().value);cache.set(key,schedule);return schedule;
}
function forPlan(plan,start,end){return compile(plan.sleep&&{...plan.sleep,timezone:plan.eventTimezone||'America/Los_Angeles'},start,end);}
function index(schedule,t){let lo=0,hi=schedule.intervals.length;while(lo<hi){const mid=(lo+hi)>>1;if(schedule.intervals[mid].end<=t)lo=mid+1;else hi=mid;}return lo;}
function nextActive(schedule,t,duration=0){
 if(!schedule)return t;
 for(let i=index(schedule,t);i<schedule.intervals.length;i++){
  const interval=schedule.intervals[i];
  if(t<interval.start&&(duration===0||t+duration<=interval.start+1e-7))return t;
  if(t<interval.end&&(t>=interval.start||t+duration>interval.start+1e-7))t=interval.end;
 }
 return t;
}
function active(schedule,t,duration=0){return nextActive(schedule,t,duration)===t;}
function assertActive(schedule,t,duration=0){if(!active(schedule,t,duration))throw Error('Interaction overlaps scheduled sleep hours.');}
function boundary(schedule,t){if(!schedule)return Infinity;const interval=schedule.intervals[index(schedule,t)];return !interval?Infinity:t<interval.start?interval.start:interval.end;}
function sleeping(schedule,t){if(!schedule)return false;const interval=schedule.intervals[index(schedule,t)];return !!interval&&t>=interval.start;}
function seconds(schedule,start,end){if(!schedule)return 0;let total=0;for(let i=index(schedule,start);i<schedule.intervals.length;i++){const p=schedule.intervals[i];if(p.start>=end)break;total+=Math.max(0,Math.min(end,p.end)-Math.max(start,p.start));}return total;}
function activeDeadline(schedule,start,seconds){
 if(!schedule||!Number.isFinite(seconds))return start+seconds;
 let t=start,remaining=seconds;
 for(let i=index(schedule,t);i<schedule.intervals.length;i++){
  const interval=schedule.intervals[i],awake=Math.max(0,interval.start-t);
  if(remaining<=awake)return t+remaining;
  remaining-=awake;t=Math.max(t,interval.end);
 }
 return t+remaining;
}
// Silos are filled before bed. During sleep they cannot be refilled; once
// coverage expires, farm production resumes only at wake time. Awake periods
// retain the existing model's routine-refill assumption.
function producing(schedule,t,coverage){if(!schedule)return true;const p=schedule.intervals[index(schedule,t)];return !p||t<p.start||t<p.start+coverage;}
function productionBoundary(schedule,t,coverage){
 if(!schedule)return Infinity;const p=schedule.intervals[index(schedule,t)];
 if(!p)return Infinity;if(t<p.start)return p.start;
 return t<p.start+coverage?Math.min(p.end,p.start+coverage):p.end;
}
function productiveSeconds(schedule,start,end,coverage){
 let lost=0;if(schedule)for(let i=index(schedule,start);i<schedule.intervals.length;i++){const p=schedule.intervals[i];if(p.start>=end)break;lost+=Math.max(0,Math.min(end,p.end)-Math.max(start,p.start+coverage));}
 return Math.max(0,end-start-lost);
}
function requiredCoverage(schedule,start,end){
 let longest=0;if(schedule)for(let i=index(schedule,start);i<schedule.intervals.length;i++){const p=schedule.intervals[i];if(p.start>=end)break;longest=Math.max(longest,Math.min(end,p.end)-p.start);}
 return longest;
}
function productionEnd(schedule,start,seconds,coverage){
 if(!schedule||!Number.isFinite(seconds))return start+seconds;
 let t=start,remaining=seconds;
 for(let i=index(schedule,t);i<schedule.intervals.length;i++){
  const p=schedule.intervals[i],produced=Math.max(0,Math.min(p.end,p.start+coverage)-t);
  if(remaining<=produced)return t+remaining;
  remaining-=produced;t=Math.max(t,p.end);
 }
 return t+remaining;
}
module.exports={compile,forPlan,minutes,nextActive,active,assertActive,boundary,sleeping,seconds,activeDeadline,producing,productionBoundary,productiveSeconds,productionEnd,requiredCoverage};
