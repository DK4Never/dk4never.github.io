(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.deanCalculateProduction = factory().calculateProduction;
  }
}(typeof self !== "undefined" ? self : this, function () {
  function calculateProduction(input) {
    var ratedSpeed = Number(input.ratedSpeed);
    var shiftHours = Number(input.shiftHours);
    var downtimePercent = Number(input.downtimePercent);
    var efficiencyPercent = Number(input.efficiencyPercent);
    var sticksPerPack = Number(input.sticksPerPack);
    var packsPerCarton = Number(input.packsPerCarton);
    var cartonsPerCase = Number(input.cartonsPerCase);

    var values = [ratedSpeed, shiftHours, downtimePercent, efficiencyPercent, sticksPerPack, packsPerCarton, cartonsPerCase];
    if (values.some(function (value) { return !Number.isFinite(value); })) {
      throw new Error("Enter numbers in every field.");
    }
    if (ratedSpeed <= 0 || shiftHours <= 0 || sticksPerPack <= 0 || packsPerCarton <= 0 || cartonsPerCase <= 0) {
      throw new Error("Rate, shift and conversion values must be greater than zero.");
    }
    if (downtimePercent < 0 || downtimePercent > 100 || efficiencyPercent <= 0 || efficiencyPercent > 100) {
      throw new Error("Downtime must be 0–100% and efficiency must be greater than 0% up to 100%.");
    }

    var availableMinutes = shiftHours * 60 * (1 - downtimePercent / 100);
    var sticks = Math.floor(ratedSpeed * availableMinutes * efficiencyPercent / 100);
    var packs = Math.floor(sticks / sticksPerPack);
    var cartons = Math.floor(packs / packsPerCarton);
    var cases = Math.floor(cartons / cartonsPerCase);

    return {
      availableMinutes: Math.floor(availableMinutes),
      sticks: sticks,
      packs: packs,
      cartons: cartons,
      cases: cases
    };
  }

  return { calculateProduction: calculateProduction };
}));
