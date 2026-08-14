const { fittingMappings } = require("../packageFitting/fittingDatabase")

const failures = fittingMappings
  .filter((item) => item.vigourModel && !item.noMatch && /-L\d/.test(item.vigourModel))
  .filter((item) => (
    item.dimensionConfirmation !== true
    && item.dimensionEvidenceStatus !== "within_tolerance"
  ))
  .map((item) => `${item.brand} ${item.sourceModel} -> ${item.vigourModel}`)

if (failures.length) {
  throw new Error(`Length-specific VIGOUR targets must require dimension confirmation:\n${failures.join("\n")}`)
}

const invalidToleranceEvidence = fittingMappings
  .filter((item) => item.dimensionEvidenceStatus === "within_tolerance")
  .filter((item) => (
    item.totalLengthDifferenceMm > 1.0
    || item.wallThicknessDifferenceIn > 0.005
    || item.insertionLengthDifferenceMm > 1.0
    || !item.insertionLengthMatched
    || !item.wallThicknessMatched
    || item.dimensionConfirmation
  ))
if (invalidToleranceEvidence.length) {
  throw new Error(`Invalid catalog tolerance exceptions: ${JSON.stringify(invalidToleranceEvidence)}`)
}

console.log("Length variant dimension confirmation regression passed")
