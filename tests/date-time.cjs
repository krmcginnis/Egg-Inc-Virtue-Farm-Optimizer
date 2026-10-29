'use strict';
const assert=require('node:assert/strict'),D=require('../src/date-time.cjs');
for(const zone of ['UTC','America/Los_Angeles','Europe/London','Asia/Kolkata'])for(const t of ['2026-10-28T00:00:00Z','2026-10-28T12:15:00Z','2026-10-29T01:30:00Z','2026-11-01T09:30:00Z'])for(const compact of [false,true]){
 const value=D.timestamp(Date.parse(t)/1000,zone,{compact});assert.ok(!/\b(?:AM|PM)\b/.test(value));assert.ok(!/\b24:\d\d/.test(value));assert.match(value,/\b(?:[01]\d|2[0-3]):[0-5]\d\b/);
 const expected=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'short',day:'numeric',weekday:compact?undefined:'short',hour:'2-digit',minute:'2-digit',second:compact?undefined:'2-digit',hourCycle:'h23',timeZoneName:'short'}).format(new Date(t));assert.equal(value,expected);
}
assert.match(D.timestamp(Date.parse('2026-10-28T00:00:00Z')/1000,'UTC'),/00:00:00/);
for(const value of ['2026-10-28 00:00','2026-10-28 23:59','2026-10-28T18:30'])assert.equal(D.localInput(D.parseLocal(value)),value.replace('T',' '));
for(const value of ['2026-10-28 24:00','2026-10-28 18:60','2026-02-30 12:00','10/28/2026 6:30 PM','broken'])assert.ok(Number.isNaN(D.parseLocal(value)));
console.log('PASS 24-hour dates: midnight/noon/evening, seconds/compact output, selected zones and DST, local input round trips, and invalid times/dates.');
