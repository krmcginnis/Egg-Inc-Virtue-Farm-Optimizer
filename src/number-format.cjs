'use strict';
const suffixes = [[1e51,'Sd'],[1e48,'Qd'],[1e45,'qd'],[1e42,'Td'],[1e39,'D'],[1e36,'U'],[1e33,'d'],[1e30,'N'],[1e27,'o'],[1e24,'S'],[1e21,'s'],[1e18,'Q'],[1e15,'q'],[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']];
function decimal(value, grouped = true) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && (Math.abs(value) < .001 || Math.abs(value) >= 1e21)) return value.toExponential(3);
  return grouped ? value.toLocaleString('en-US', {maximumFractionDigits:3}) : String(Number(value.toFixed(3)));
}
function format(value) {
  if (!Number.isFinite(value)) return '—';
  for (let i = 0; i < suffixes.length; i++) {
    const [unit, suffix] = suffixes[i];
    if (Math.abs(value) < unit) continue;
    // Carry a rounded coefficient into the next unit, rather than displaying 1000K.
    const scaled = value / unit;
    if (i > 0 && Math.abs(Number(scaled.toFixed(3))) >= 1000) return (value / suffixes[i-1][0]).toFixed(3) + suffixes[i-1][1];
    return (Math.abs(scaled) >= 1e21 ? scaled.toExponential(3) : scaled.toFixed(3)) + suffix;
  }
  return decimal(value);
}
module.exports = {format, decimal};
