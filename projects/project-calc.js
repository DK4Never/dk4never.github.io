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
    if (downtimePercent < 0 || downtimePercent > 100 || efficiencyPercent < 0 || efficiencyPercent > 100) {
      throw new Error("Downtime and efficiency must be between 0% and 100%.");
    }
    if (![sticksPerPack, packsPerCarton, cartonsPerCase].every(Number.isInteger)) {
      throw new Error("Packaging conversion values must be whole numbers.");
    }

    var availableMinutes = shiftHours * 60 * (1 - downtimePercent / 100);
    var effectivePacks = ratedSpeed * availableMinutes * efficiencyPercent / 100;
    var completePacks = Math.floor(effectivePacks);
    var sticks = completePacks * sticksPerPack;
    var completeCartons = Math.floor(completePacks / packsPerCarton);
    var completeCases = Math.floor(completeCartons / cartonsPerCase);
    var remainingCartons = completeCartons % cartonsPerCase;

    return {
      availableMinutes: Number(availableMinutes.toFixed(2)),
      sticks: sticks,
      completePacks: completePacks,
      completeCartons: completeCartons,
      completeCases: completeCases,
      remainingCartons: remainingCartons
    };
  }

  return { calculateProduction: calculateProduction };
}));
