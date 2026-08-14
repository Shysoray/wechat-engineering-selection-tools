const { normalizeDimensionEvidence } = require("../packageFitting/fittingEvidencePolicy")

const within = normalizeDimensionEvidence({
  brand: "TEST",
  sourceModel: "SOURCE",
  vigourModel: "TARGET",
  dimensionEvidenceStatus: "within_tolerance",
  dimensionComparisons: [
    { dimension: "overallLength", sourceValue: 10, targetValue: 11, tolerance: 1, unit: "mm", required: true },
    { dimension: "wallThickness", sourceValue: 0.039, targetValue: 0.034, tolerance: 0.005, unit: "in", required: true }
  ]
})
if (within.dimensionComparisons.some((item) => !item.matched) || within.dimensionConfirmation) {
  throw new Error(`Closed tolerance boundary must pass: ${JSON.stringify(within)}`)
}

const exceeded = normalizeDimensionEvidence({
  brand: "TEST",
  sourceModel: "SOURCE",
  vigourModel: "TARGET",
  dimensionEvidenceStatus: "out_of_tolerance",
  dimensionComparisons: [
    { dimension: "overallLength", sourceValue: 10, targetValue: 11.001, tolerance: 1, unit: "mm", required: true },
    { dimension: "insertionLength", sourceValue: 10, targetValue: 10, tolerance: 1, unit: "mm", required: true }
  ]
})
if (exceeded.dimensionComparisons[0].matched || !exceeded.dimensionConfirmation) {
  throw new Error(`Any required dimension failure must block green: ${JSON.stringify(exceeded)}`)
}

console.log("Fitting dimension calculation passed")
