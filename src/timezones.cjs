"use strict";
const Defaults = require("./ui-defaults.cjs");
const automatic = "automatic";
function resolve(selection) { return !selection || selection === automatic ? Defaults.timezone() : selection; }
function offset(zone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {timeZone:zone,timeZoneName:"longOffset"}).formatToParts(date);
  return parts.find(p=>p.type === "timeZoneName").value.replace("GMT","UTC");
}
const common = {
 "UTC":"UTC",
 "America/Los_Angeles":"Pacific (Los Angeles)",
 "America/Denver":"Mountain (Denver)",
 "America/Phoenix":"Arizona (Phoenix)",
 "America/Chicago":"Central (Chicago)",
 "America/New_York":"Eastern (New York)",
 "America/Anchorage":"Alaska (Anchorage)",
 "Pacific/Honolulu":"Hawaii (Honolulu)",
 "America/Halifax":"Atlantic (Halifax)",
 "America/St_Johns":"Newfoundland",
 "America/Sao_Paulo":"Brazil (São Paulo)",
 "Europe/London":"United Kingdom (London)",
 "Europe/Paris":"Central Europe (Paris)",
 "Europe/Helsinki":"Eastern Europe (Helsinki)",
 "Africa/Johannesburg":"South Africa",
 "Asia/Dubai":"United Arab Emirates (Dubai)",
 "Asia/Kolkata":"India",
 "Asia/Kathmandu":"Nepal",
 "Asia/Bangkok":"Thailand (Bangkok)",
 "Asia/Shanghai":"China (Shanghai)",
 "Asia/Tokyo":"Japan (Tokyo)",
 "Australia/Perth":"Western Australia (Perth)",
 "Australia/Adelaide":"Central Australia (Adelaide)",
 "Australia/Sydney":"Eastern Australia (Sydney)",
 "Pacific/Auckland":"New Zealand (Auckland)",
 "Pacific/Chatham":"Chatham Islands"
};
function label(zone) { return zone==="UTC"?"UTC":offset(zone)+" · "+(common[zone]||zone.replaceAll("_"," ")); }
function choices() {
  // Keep common regional rules (including DST), plus the user's actual PC zone.
  // The form appends uncommon saved selections without changing their identity.
  return [automatic,...new Set([...Object.keys(common),Defaults.timezone()])];
}
module.exports = {automatic,resolve,label,choices};
