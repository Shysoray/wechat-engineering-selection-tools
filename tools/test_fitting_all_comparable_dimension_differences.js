const fs = require("fs")
const path = require("path")
const { allFittingMappings } = require("../packageFitting/mappingRepository")
const {
  modelIndex,
  sourceRecordFor,
  targetRecordFor,
  learnDimensionCrosswalks,
  catalogComparisons
} = require("./build_fitting_dimension_comparisons")

const root = path.resolve(__dirname, "..")
const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data/fitting-evidence/source-catalog-models.json"), "utf8"))
const targetCatalog = JSON.parse(fs.readFileSync(path.join(root, "data/fitting-evidence/vigour-catalog-models.json"), "utf8"))
const mappingEvidence = JSON.parse(fs.readFileSync(path.join(root, "data/fitting-evidence/mapping-dimension-evidence.json"), "utf8"))
const sourceIndex = modelIndex(sourceCatalog.records)
const targetIndex = modelIndex(targetCatalog.records)
const crosswalks = learnDimensionCrosswalks(allFittingMappings, sourceIndex, targetIndex)
const evidenceByIdentity = new Map(mappingEvidence.records.map((record) => [
  [record.brand, record.sourceModel, record.vigourModel || ""].join("|"),
  record
]))
const counts = Object.create(null)

allFittingMappings.forEach((item) => {
  if (!item.vigourModel || item.noMatch) return
  const comparisons = catalogComparisons(
    item,
    sourceRecordFor(item, sourceIndex),
    targetRecordFor(item, targetIndex),
    crosswalks
  )
  if (!comparisons.length) return
  const identity = [item.brand, item.sourceModel, item.vigourModel].join("|")
  const evidence = evidenceByIdentity.get(identity)
  if (!evidence || !evidence.comparisons.length) {
    throw new Error(`Comparable catalog dimensions are not displayed: ${identity}`)
  }
  if (
    ["within_tolerance", "out_of_tolerance"].includes(evidence.status)
    && evidence.comparisons.some((comparison) => comparison.required)
  ) {
    counts[item.brand] = (counts[item.brand] || 0) + 1
    return
  }
  const displayedPairs = new Set(evidence.comparisons.map((comparison) => comparison.dimension))
  comparisons.forEach((comparison) => {
    if (!displayedPairs.has(comparison.dimension)) {
      throw new Error(`Comparable dimension pair was omitted: ${identity}|${comparison.dimension}`)
    }
  })
  counts[item.brand] = (counts[item.brand] || 0) + 1
})

for (const brand of ["FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"]) {
  if (!counts[brand]) throw new Error(`No comparable dimensions were closed for ${brand}`)
}

console.log(`All comparable fitting dimensions are displayed: ${JSON.stringify(counts)}`)
