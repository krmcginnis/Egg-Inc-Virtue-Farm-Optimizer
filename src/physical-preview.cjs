"use strict";
const S = require("./simulator.cjs");
function describe(s,c,kind,slot,id) {
  const current = S.stats(s,c), cost = S.price(s,c,{type:kind,slot,id});
  const candidate = S.clone(s);
  let capacity, cars;
  if (kind === "hab") { candidate.h = [id,null,null,null]; capacity = S.stats(candidate,c).hab; }
  else {
    cars = id === 11 && s.v[slot].id === 11 ? s.v[slot].cars : 1;
    candidate.v = s.v.map(() => ({id:null,cars:1})); candidate.v[0] = {id,cars};
    capacity = S.stats(candidate,c).shipping*3600;
  }
  const seconds = cost <= s.cash ? 0 : current.eventEarning > 0 ? (cost-s.cash)/current.eventEarning : Infinity;
  return {capacity,cost,seconds,cars};
}
module.exports = {describe};
