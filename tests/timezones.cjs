"use strict";
const assert=require('node:assert/strict'),S=require('../src/simulator.cjs'),Zones=require('../src/timezones.cjs'),Defaults=require('../src/ui-defaults.cjs');
const start=Date.parse('2026-10-01T00:00:00Z')/1000,end=start+40*86400;
const zones=Zones.choices();assert.equal(zones[0],'automatic');assert.ok(zones.length<=28);assert.equal(new Set(zones).size,zones.length);assert.ok(zones.includes(Defaults.timezone()));assert.ok(zones.includes('Asia/Kathmandu'));assert.ok(zones.includes('Pacific/Chatham'));assert.ok(zones.includes('America/Phoenix'));
for(const zone of zones.slice(1))assert.ok(Zones.label(zone).startsWith('UTC'));
assert.match(Zones.label('America/Los_Angeles'),/Pacific/);assert.match(Zones.label('Etc/GMT-14'),/UTC\+14:00/);assert.match(Zones.label('Asia/Tehran'),/Tehran/);
assert.equal(Zones.resolve('automatic'),Defaults.timezone());assert.equal(Zones.resolve('Asia/Kolkata'),'Asia/Kolkata');assert.equal(Defaults.freshFarm(start).plan.eventTimezoneMode,'automatic');
for(const [zone,boundary]of [['Asia/Kolkata','2026-10-02T03:30:00Z'],['Asia/Kathmandu','2026-10-02T03:15:00Z'],['Pacific/Chatham','2026-10-01T19:15:00Z'],['America/Los_Angeles','2026-10-02T16:00:00Z'],['Etc/GMT-14','2026-10-01T19:00:00Z']]) {
  const calendar=S.calendar(start,end,zone),c={calendar},t=Date.parse(boundary)/1000;
  assert.equal(S.at(c,t-1).sale,1,zone+' sale starts too early');assert.equal(S.at(c,t).sale,.3,zone+' sale starts late');assert.equal(S.at(c,t+86400-1).sale,.3);assert.equal(S.at(c,t+86400).sale,1);
}
// Pacific boundaries follow the November daylight saving transition.
const pacific=S.calendar(start,end,'America/Los_Angeles');assert.ok(pacific.some(e=>e.sale===.3 && e.t===Date.parse('2026-11-06T17:00:00Z')/1000));
for(const zone of ['Asia/Kathmandu','America/Los_Angeles','Etc/GMT+12'])for(const event of S.calendar(start,end,zone).filter(e=>e.t>start&&Number.isFinite(e.t))) {
 const local=new Intl.DateTimeFormat('en',{timeZone:zone,hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date(event.t*1000));
 assert.equal(+local.find(x=>x.type==='hour').value,9);assert.equal(+local.find(x=>x.type==='minute').value,0);
}
console.log('PASS compact regional choices, Automatic/PC timezone, friendly labels, uncommon saved-zone support, half/quarter-hour and fixed UTC event boundaries, and daylight saving.');
