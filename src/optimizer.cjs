'use strict';
// Preserved v0.8.23 implementation; historical timelines still use its replay.
const Legacy=require('./optimizer-legacy.cjs'),Solver=require('./route-solver.cjs');
module.exports={...Legacy,solve:Solver.solve,replay:Solver.replay};
