const audit = require("../outputs/tube_fitting_audit/fitting_generation_audit.json")
const { fittingMappings } = require("../packageFitting/fittingDatabase")
const {
  buildSearchIndex,
  exactItemsForInput,
  fuzzyCandidatesForInput
} = require("../packageFitting/matchingEngine")

const summary = audit.summary || {}
if (summary.mappingCount !== fittingMappings.length) {
  throw new Error(`generation audit is stale: ${summary.mappingCount} !== ${fittingMappings.length}`)
}
if (summary.recordedSkippedSourceCount !== 0 || audit.recordedSkippedSources.length !== 0) {
  throw new Error(`catalog inputs must not be silently dropped: ${JSON.stringify(audit.recordedSkippedSources.slice(0, 10))}`)
}

const guardedRows = fittingMappings.filter((item) => item.sourceAuditStatus === "catalog_input_guarded")
if (!guardedRows.length) {
  throw new Error("generation audit guards are missing from the runtime database")
}

const searchIndex = buildSearchIndex("")
guardedRows.forEach((item) => {
  if (!item.noMatch || item.vigourModel || item.selectionEligible !== false) {
    throw new Error(`audited catalog guard is unsafe: ${JSON.stringify(item)}`)
  }
  const hits = exactItemsForInput(item.sourceModel, searchIndex)
  if (!hits.length || hits.some((hit) => hit.vigourModel && !hit.noMatch)) {
    throw new Error(`audited catalog guard is not exact: ${JSON.stringify(item)}`)
  }
})

for (const sourceModel of [
  "6LV-2MW",
  "6L-AW-HFR4-TB6",
  "UJR-H-3.2B",
  "SM12BHU"
]) {
  const hits = exactItemsForInput(sourceModel, searchIndex)
  if (!hits.length || hits.some((item) => item.vigourModel && !item.noMatch)) {
    throw new Error(`known previously skipped catalog model is not guarded: ${sourceModel}`)
  }
  if (fuzzyCandidatesForInput(sourceModel, searchIndex).items.length) {
    throw new Error(`known no-match guard must not fall through to fuzzy candidates: ${sourceModel}`)
  }
}

console.log(
  `Fitting generation audit passed: ${fittingMappings.length} mappings, `
  + `${guardedRows.length} generated guards, zero recorded skips`
)
