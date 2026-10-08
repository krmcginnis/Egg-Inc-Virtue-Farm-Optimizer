"use strict";
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),Zones=require('../src/timezones.cjs'),Defaults=require('../src/ui-defaults.cjs');
const start=Date.parse('2026-10-01T00:00:00Z')/1000,end=start+40*86400;
const zones=Zones.choices();assert.equal(zones[0],'automatic');assert.ok(zones.length<=28);assert.equal(new Set(zones).size,zones.length);assert.ok(zones.includes(Defaults.timezone()));assert.ok(zones.includes('Asia/Kathmandu'));assert.ok(zones.includes('Pacific/Chatham'));assert.ok(zones.includes('America/Phoenix'));
for(const zone of zones.slice(1))assert.ok(Zones.label(zone).startsWith('UTC'));
assert.match(Zones.label('America/Los_Angeles'),/Pacific/);assert.match(Zones.label('Etc/GMT-14'),/UTC\+14:00/);assert.match(Zones.label('Asia/Tehran'),/Tehran/);
assert.equal(Zones.resolve('automatic'),Defaults.timezone());assert.equal(Zones.resolve('Asia/Kolkata'),'Asia/Kolkata');assert.equal(Defaults.freshFarm(start).plan.eventTimezoneMode,'automatic');
const calendar=S.calendar(start,end),pacific=new Intl.DateTimeFormat('en',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'numeric',hourCycle:'h23'});
for(const zone of [...zones.slice(1),'Asia/Tehran','Etc/GMT-14','Etc/GMT+12']) {
 const raw=require('../src/blank-farm.cjs')(start);Object.assign(raw.plan,{maxDays:40,eventTimezone:zone,sleep:{enabled:true,start:'23:00',end:'07:00',timezone:'UTC'}});
 const {c}=S.prepare(raw);assert.equal(c.zone,zone);assert.equal(c.sleep.timezone,zone);assert.equal(c.calendar,calendar,'selected sleep/display zone must not move game events');
 // Old callers supplying a zone also cannot override the fixed game calendar.
 assert.equal(S.calendar(start,end,zone),calendar);
 assert.ok(!require('../src/assumption-notices.cjs').notices(S.prepare(raw).s,c).some(n=>n.includes('Event schedule override')));
}
// Explicit UTC oracles cover both weekly events before and after spring/fall DST.
for(const [friday,monday]of [['2026-03-06T17:00:00Z','2026-03-09T16:00:00Z'],['2026-10-02T16:00:00Z','2026-10-05T16:00:00Z'],['2026-10-30T16:00:00Z','2026-11-02T17:00:00Z'],['2026-12-04T17:00:00Z','2026-12-07T17:00:00Z']]) {
 const begin=Date.parse(friday)/1000-86400,finish=Date.parse(monday)/1000+2*86400,c={calendar:S.calendar(begin,finish)};
 for(const [date,field,active]of [[friday,'sale',.3],[monday,'earnings',2]]) {
  const t=Date.parse(date)/1000;
  assert.equal(S.at(c,t-1)[field],1);assert.equal(S.at(c,t)[field],active);assert.equal(S.at(c,t+1)[field],active);
  assert.equal(S.at(c,t+86400-1)[field],active);assert.equal(S.at(c,t+86400)[field],1);assert.equal(S.at(c,t+86400+1)[field],1);
  assert.equal(S.at({calendar:S.calendar(t+3600,finish)},t+3600)[field],active,'starts during an active event');
 }
}
for(const event of calendar.filter(e=>e.t>start&&Number.isFinite(e.t))) {
 const local=pacific.formatToParts(new Date(event.t*1000));
 assert.equal(+local.find(x=>x.type==='hour').value,9);assert.equal(+local.find(x=>x.type==='minute').value,0);
}
const invalid=Defaults.freshFarm(start);invalid.plan.eventTimezone='Invalid/Zone';assert.throws(()=>S.prepare(invalid),/time zone/i);
console.log('PASS compact/Automatic timezone choices, selected sleep zone, fixed 09:00 Pacific event starts/ends, active-event starts, and PST/PDT transitions independent of all selected zones.');
