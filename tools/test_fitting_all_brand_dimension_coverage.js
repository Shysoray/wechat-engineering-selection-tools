const fs = require("fs")
const path = require("path")
const payload = JSON.parse(fs.readFileSync(path.resolve("data/fitting-evidence/mapping-dimension-evidence.json"), "utf8"))
const expectedBrands = ["FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"]
const allowed = new Set([
  "within_tolerance", "out_of_tolerance", "not_comparable",
  "source_missing", "target_missing", "needs_manual_review"
])

for (const brand of expectedBrands) {
  const records = payload.records.filter((record) => record.brand === brand)
  if (!records.length || records.some((record) => !allowed.has(record.status))) {
    throw new Error(`Incomplete ${brand} dimension classification`)
  }
  const targets = records.filter((record) => record.vigourModel)
  if (!targets.length || targets.some((record) => record.status === "not_comparable")) {
    throw new Error(`${brand} target mapping lacks a comparison status`)
  }
  const numeric = targets.filter((record) => record.comparisons.length)
  if (!numeric.length || payload.summary.numericDifferenceMappingCountByBrand[brand] !== numeric.length) {
    throw new Error(`${brand} numeric dimension differences are not fully accounted for`)
  }
  if (numeric.some((record) => record.comparisons.some((comparison) => (
    !Number.isFinite(Number(comparison.sourceValue))
    || !Number.isFinite(Number(comparison.targetValue))
    || !Number.isFinite(Number(comparison.absoluteDifference))
  )))) {
    throw new Error(`${brand} contains a non-numeric catalog comparison`)
  }
}
if (payload.summary.classifiedPercent !== 100 || payload.summary.targetMappingCount !== 10765) {
  throw new Error(`Runtime coverage regression: ${JSON.stringify(payload.summary)}`)
}

const aligned = payload.records.filter((record) => record.familyRule === "catalog_dimension_alignment.v1")
if (!aligned.length || aligned.some((record) => !record.comparisons.length)) {
  throw new Error("A catalog-aligned mapping is missing its displayed numeric differences")
}
if (payload.summary.numericDifferenceMappingCount !== payload.records.filter((record) => record.comparisons.length).length) {
  throw new Error("Numeric difference summary does not match the full mapping evidence set")
}

console.log("All-brand fitting dimension coverage passed")
