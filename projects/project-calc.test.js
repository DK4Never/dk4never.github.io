const assert = require("node:assert/strict");
const { calculateProduction } = require("./project-calc.js");

const result = calculateProduction({
  ratedSpeed: 100,
  shiftHours: 8,
  downtimePercent: 10,
  efficiencyPercent: 80,
  sticksPerPack: 10,
  packsPerCarton: 10,
  cartonsPerCase: 4
});

assert.deepEqual(result, {
  availableMinutes: 432,
  sticks: 34560,
  packs: 3456,
  cartons: 345,
  cases: 86
});
assert.throws(function () {
  calculateProduction({ ratedSpeed: 0, shiftHours: 8, downtimePercent: 0, efficiencyPercent: 80, sticksPerPack: 10, packsPerCarton: 10, cartonsPerCase: 4 });
}, /greater than zero/);
console.log("project-calc tests: PASS");
