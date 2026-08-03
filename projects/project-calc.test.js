const assert = require("node:assert/strict");
const { calculateProduction } = require("./project-calc.js");

const defaults = {
  ratedSpeed: 100,
  shiftHours: 8,
  downtimePercent: 10,
  efficiencyPercent: 80,
  sticksPerPack: 20,
  packsPerCarton: 10,
  cartonsPerCase: 50
};

assert.deepEqual(calculateProduction(defaults), {
  availableMinutes: 432,
  sticks: 691200,
  completePacks: 34560,
  completeCartons: 3456,
  completeCases: 69,
  remainingCartons: 6
});

assert.deepEqual(calculateProduction({ ...defaults, downtimePercent: 0 }), {
  availableMinutes: 480,
  sticks: 768000,
  completePacks: 38400,
  completeCartons: 3840,
  completeCases: 76,
  remainingCartons: 40
});

assert.deepEqual(calculateProduction({ ...defaults, efficiencyPercent: 0 }), {
  availableMinutes: 432,
  sticks: 0,
  completePacks: 0,
  completeCartons: 0,
  completeCases: 0,
  remainingCartons: 0
});

assert.deepEqual(calculateProduction({ ...defaults, efficiencyPercent: 100 }), {
  availableMinutes: 432,
  sticks: 864000,
  completePacks: 43200,
  completeCartons: 4320,
  completeCases: 86,
  remainingCartons: 20
});

assert.deepEqual(calculateProduction({
  ...defaults,
  ratedSpeed: 1.23,
  shiftHours: 1,
  downtimePercent: 0,
  efficiencyPercent: 100
}), {
  availableMinutes: 60,
  sticks: 1460,
  completePacks: 73,
  completeCartons: 7,
  completeCases: 0,
  remainingCartons: 7
});

assert.throws(function () {
  calculateProduction({ ...defaults, ratedSpeed: -1 });
}, /greater than zero/);
assert.throws(function () {
  calculateProduction({ ...defaults, downtimePercent: 101 });
}, /between 0% and 100%/);
assert.throws(function () {
  calculateProduction({ ...defaults, efficiencyPercent: 101 });
}, /between 0% and 100%/);
assert.throws(function () {
  calculateProduction({ ...defaults, packsPerCarton: 2.5 });
}, /whole numbers/);

console.log("project-calc tests: PASS");
