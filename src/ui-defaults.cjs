"use strict";
const blankFarm = require("./blank-farm.cjs");
const targetMode = "claimed-plus-40";
function timezone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) { new Intl.DateTimeFormat("en-US", {timeZone:zone}).format(); return zone; }
  } catch { }
  return "America/Los_Angeles";
}
function target(claimed) {
  if (claimed.length !== 5 || claimed.some(n => !Number.isInteger(n) || n < 0 || n > 98)) return null;
  return Math.min(490, claimed.reduce((sum,n) => sum+n,0)+40);
}
function freshFarm(start) {
  const farm = blankFarm(start);
  Object.assign(farm.plan, {saleComparisonVersion:1, target:40, targetMode, eventTimezone:timezone(), eventTimezoneMode:"automatic", autoTeAllocation:true, manualFloors:Array(5).fill(0)});
  return farm;
}
module.exports = {timezone,target,targetMode,freshFarm};
