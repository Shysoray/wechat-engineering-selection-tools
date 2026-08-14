const { withinScaledTolerance } = require("../packageFitting/fittingEvidencePolicy")

for (const [difference, expected] of [[0, true], [0.999, true], [1, true], [1.001, false]]) {
  if (withinScaledTolerance(10, 10 + difference, 1, "mm") !== expected) {
    throw new Error(`Overall length boundary failed: ${difference}`)
  }
}
for (const [difference, expected] of [[0, true], [0.004, true], [0.005, true], [0.006, false]]) {
  if (withinScaledTolerance(0.05, 0.05 + difference, 0.005, "in") !== expected) {
    throw new Error(`Wall thickness boundary failed: ${difference}`)
  }
}
for (const [difference, expected] of [[0, true], [1, true], [1.001, false]]) {
  if (withinScaledTolerance(20, 20 + difference, 1, "mm") !== expected) {
    throw new Error(`Insertion boundary failed: ${difference}`)
  }
}

console.log("Fitting integer tolerance boundaries passed")
