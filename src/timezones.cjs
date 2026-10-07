"use strict";
const Defaults = require("./ui-defaults.cjs");
const automatic = "automatic";
function resolve(selection) { return !selection || selection === automatic ? Defaults.timezone() : selection; }
function offset(zone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {timeZone:zone,timeZoneName:"longOffset"}).formatToParts(date);
  return parts.find(p=>p.type === "timeZoneName").value.replace("GMT","UTC");
}
function label(zone) { return offset(zone)+" · "+zone.replaceAll("_"," "); }
function choices() {
  const zones = new Set(["UTC", "America/Los_Angeles", "America/New_York", "Asia/Kathmandu", "Asia/Kolkata", Defaults.timezone()]);
  for (const zone of Intl.supportedValuesOf?.("timeZone") || []) zones.add(zone);
  // Include fixed UTC offsets as well as regional zones with daylight saving.
  for (let hours=-12;hours<=14;hours++) if (hours) zones.add("Etc/GMT"+(hours<0 ? "+" : "-")+Math.abs(hours));
  const labels = new Map([...zones].map(zone=>[zone,label(zone)]));
  return [automatic,...[...zones].sort((a,b)=>labels.get(a).localeCompare(labels.get(b)))];
}
module.exports = {automatic,resolve,label,choices};
