'use strict';
const units = [[1e12, 'T', 0], [1e9, 'B', 1], [1e6, 'M', 1], [1e3, 'K', 1]];
// Fuel quantities use shorter labels; stored/input values retain full precision.
module.exports = function formatFuel(value) {
  if (!Number.isFinite(value)) return '—';
  for (let i = 0; i < units.length; i++) {
    const [unit, suffix, digits] = units[i];
    if (Math.abs(value) < unit) continue;
    const scaled = value / unit;
    if (i > 0 && Math.abs(Number(scaled.toFixed(digits))) >= 1000) {
      const [larger, nextSuffix, nextDigits] = units[i - 1];
      return (value / larger).toFixed(nextDigits) + nextSuffix;
    }
    return scaled.toFixed(digits) + suffix;
  }
  return String(Math.round(value));
};
