const fs = require("fs")
const path = require("path")
const { allFittingMappings } = require("../packageFitting/mappingRepository")
const { normalizeModelText } = require("../utils/fittingModelSignature")
const {
  modelIndex,
  sourceRecordFor,
  targetRecordFor
} = require("./build_fitting_dimension_comparisons")

const root = path.resolve(__dirname, "..")
const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data/fitting-evidence/source-catalog-models.json"), "utf8"))
const targetCatalog = JSON.parse(fs.readFileSync(path.join(root, "data/fitting-evidence/vigour-catalog-models.json"), "utf8"))
const mappingEvidence = JSON.parse(fs.readFileSync(path.join(root, "data/fitting-evidence/mapping-dimension-evidence.json"), "utf8"))
const sourceIndex = modelIndex(sourceCatalog.records)
const targetIndex = modelIndex(targetCatalog.records)
const evidenceByIdentity = new Map(mappingEvidence.records.map((record) => [
  [record.brand, normalizeModelText(record.sourceModel), record.vigourModel || ""].join("|"),
  record
]))

function hasDimensions(record) {
  return Boolean(record && Object.entries(record.dimensions || {}).some(([key, value]) => (
    key !== "catalogP"
    && Number.isFinite(Number(value.normalizedMm))
    && Number(value.normalizedMm) > 0
    && Number(value.normalizedMm) <= 500
  )))
}

const coveredByBrand = Object.create(null)
for (const item of allFittingMappings) {
  if (!item.vigourModel || item.noMatch) continue
  const sourceRecord = sourceRecordFor(item, sourceIndex)
  const targetRecord = targetRecordFor(item, targetIndex)
  if (!hasDimensions(sourceRecord) || !hasDimensions(targetRecord)) continue
  const identity = [item.brand, normalizeModelText(item.sourceModel), item.vigourModel].join("|")
  const evidence = evidenceByIdentity.get(identity)
  if (!evidence || !evidence.comparisons.length) {
    throw new Error(`Family semantic gap remains although both catalog rows have dimensions: ${identity}`)
  }
  if (evidence.reason === "双方目录已有尺寸，但表头语义仍无法可靠对齐") {
    throw new Error(`Generic semantic-gap reason must not survive the full-family audit: ${identity}`)
  }
  coveredByBrand[item.brand] = (coveredByBrand[item.brand] || 0) + 1
}

for (const brand of ["FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"]) {
  if (!coveredByBrand[brand]) throw new Error(`No closed semantic family coverage for ${brand}`)
}

console.log(`All source/target rows with dimensions have a displayed family crosswalk: ${JSON.stringify(coveredByBrand)}`)
