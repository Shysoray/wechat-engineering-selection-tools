const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")
const { buildSearchIndex, exactItemsForInput, fuzzyCandidatesForInput } = require("../packageFitting/matchingEngine")
const { enrichResult } = require("../packageFitting/resultPolicy")

const usableRows = tubeFittingSupplementalMappings.filter((item) => item.vigourModel && !item.noMatch)
const directRows = usableRows.filter((item) => !item.dimensionConfirmation && item.specialFeatureMatched !== false)
if (!directRows.length) {
  throw new Error("supplemental generation must preserve genuinely direct catalog matches")
}
const unprovenResult = enrichResult(directRows[0], [])
if (unprovenResult.copyAllowed || unprovenResult.dimensionComparisonSummary !== "目录尺寸未建立") {
  throw new Error(`supplemental target without dimension evidence must remain amber: ${JSON.stringify(unprovenResult)}`)
}

const noMatchBrands = new Set(
  tubeFittingSupplementalMappings
    .filter((item) => item.noMatch || !item.vigourModel)
    .map((item) => item.brand)
)
if (noMatchBrands.size <= 1) {
  throw new Error(`known no-match guards must be retained for every affected brand: ${JSON.stringify([...noMatchBrands])}`)
}

const nonSwagelokGuard = tubeFittingSupplementalMappings.find((item) => (
  item.brand !== "Swagelok" && (item.noMatch || !item.vigourModel)
))
const searchIndex = buildSearchIndex("")
const guardedExact = exactItemsForInput(nonSwagelokGuard.sourceModel, searchIndex)
if (!guardedExact.length || guardedExact.some((item) => item.vigourModel && !item.noMatch)) {
  throw new Error(`non-Swagelok no-match guard is not exact: ${JSON.stringify(nonSwagelokGuard)}`)
}
if (fuzzyCandidatesForInput(nonSwagelokGuard.sourceModel, searchIndex).items.length) {
  throw new Error(`known no-match guard must not fall through to fuzzy candidates: ${JSON.stringify(nonSwagelokGuard)}`)
}

const traceableRow = tubeFittingSupplementalMappings.find((item) => (
  item.sourceAuditStatus
  && item.noteText
  && item.dataSource
  && item.selectionEligible === false
))
if (!traceableRow) {
  throw new Error("supplemental rows must retain audit status, note, source, and explicit selection eligibility")
}

console.log(`Tube fitting generation safety passed: ${directRows.length} direct rows, ${noMatchBrands.size} no-match brands`)
