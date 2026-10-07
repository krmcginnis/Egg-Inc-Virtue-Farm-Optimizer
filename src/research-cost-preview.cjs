"use strict";
const S = require("./simulator.cjs");
// Display-only total: price each remaining level now, without buying anything
// or mutating the farm. Locked-tier prerequisites and future events are excluded.
module.exports = function remainingResearchCost(state, config, index) {
  const preview = {...state, r: state.r.slice()};
  let total = 0;
  for (let level = state.r[index]; level < S.D.research[index].levels; level++) {
    preview.r[index] = level;
    total += S.price(preview, config, {type:"research", i:index});
  }
  return total;
};
