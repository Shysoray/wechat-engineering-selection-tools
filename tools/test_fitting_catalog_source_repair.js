const { fittingMappings } = require("../packageFitting/fittingDatabase")
const {
  tubeFittingSupplementalMappings,
  catalogNoMatchModelsByBrand
} = require("../packageFitting/tubeFittingSupplementalDatabase")
const {
  buildSearchIndex,
  exactItemsForInput,
  fuzzyCandidatesForInput
} = require("../packageFitting/matchingEngine")
const { enrichResult } = require("../packageFitting/resultPolicy")
const { normalizeModelText } = require("../utils/fittingModelSignature")

function mainRows(sourceModel, brand) {
  const normalized = normalizeModelText(sourceModel)
  return fittingMappings.filter((item) => (
    item.brand === brand && normalizeModelText(item.sourceModel) === normalized
  ))
}

const malformedSwagelokModels = [
  "SS-10-VCR-113", "SS-10-VCR-411", "SS-12-VCR-111", "SS-12-VCR-415",
  "SS-16-VCR-113", "SS-16-VCR-415", "SS-2-VCR-17", "SS-2-VCR-43",
  "SS-4-VCR-13", "SS-8-VCR-111", "SS-8-VCR-415", "SS-8-VCR-BP15",
  "SS-4-VCR-4-.54NC1", "SS-4-VCR-6-DF-23", "SS-4-VCR-7-2VCRF5",
  "SS-4-VCR-7-8VCRF11", "SS-8-VCR-7-4VCRF15", "SS-4-VCR-A1-4M13",
  "SS-8-VCR-A1-4M15", "SS-8-VCR-6-DM-415"
]
malformedSwagelokModels.forEach((sourceModel) => {
  if (mainRows(sourceModel, "Swagelok").length) {
    throw new Error(`PDF table artifact leaked into Swagelok runtime data: ${sourceModel}`)
  }
})

const restoredSwagelokModels = [
  "SS-10-VCR-1", "SS-10-VCR-4", "SS-8-VCR-BP", "SS-4-VCR-4-.54NC",
  "SS-4-VCR-6-DF-2", "SS-8-VCR-6-DF-4", "SS-2-VCR-7-4VCRF",
  "SS-4-VCR-7-2VCRF", "SS-4-VCR-7-8VCRF", "SS-8-VCR-7-4VCRF",
  "SS-4-VCR-A1-4M", "SS-8-VCR-A1-4M"
]
restoredSwagelokModels.forEach((sourceModel) => {
  if (!mainRows(sourceModel, "Swagelok").length) {
    throw new Error(`Catalog model missing after Swagelok extraction repair: ${sourceModel}`)
  }
})

const invalidUnilokPrefixes = [
  "CSGL-02-", "CLGS-02-", "CLE-12L22.5-", "CLE-16L23.3-",
  "CLRE-1204L22.5-", "CLRE-1206L22.5-", "CLRE-1208L22.5-",
  "CLT-12L22.5-", "CLT-16L23.3-", "CLRU-1612L22.5-"
]
invalidUnilokPrefixes.forEach((prefix) => {
  const leaked = fittingMappings.find((item) => item.brand === "UNILOK" && item.sourceModel.startsWith(prefix))
  if (leaked) throw new Error(`UNILOK dimension text leaked into ordering number: ${leaked.sourceModel}`)
})
if (mainRows("CLRU-1208-EP", "UNILOK").length) {
  throw new Error("Material-less UNILOK alias CLRU-1208-EP must not be generated")
}

const auditedRows = tubeFittingSupplementalMappings.filter((item) => (
  item.brand === "Swagelok" || item.brand === "UNILOK"
))
;["SS-12M0-1-M16X1", "SS-6M0-1-M10X1", "SS-6M0-1-M12X1"].forEach((sourceModel) => {
  const leaked = tubeFittingSupplementalMappings.find((item) => (
    item.brand === "Swagelok" && item.sourceModel === sourceModel
  ))
  if (leaked) {
    throw new Error(`Partial Swagelok thread token was mistaken for a full catalog model: ${sourceModel}`)
  }
})
const unverified = auditedRows.find((item) => (
  !["catalog_exact", "catalog_rule"].includes(item.sourceEvidenceStatus)
  || item.searchEligible === false
))
if (unverified) {
  throw new Error(`Catalog-gated row has invalid evidence metadata: ${JSON.stringify(unverified)}`)
}
if (tubeFittingSupplementalMappings.some((item) => (
  item.brand === "UNILOK" && item.sourceModel.includes("URBT/URRT-")
))) {
  throw new Error("Combined URBT/URRT source model must be split into independent ordering numbers")
}

const duplicateTarget = tubeFittingSupplementalMappings.find((item) => {
  const parts = String(item.vigourModel || "").split(/\s*\/\s*/).filter(Boolean)
  return parts.length > 1 && new Set(parts).size !== parts.length
})
if (duplicateTarget) {
  throw new Error(`Duplicate multi-target model was not collapsed: ${JSON.stringify(duplicateTarget)}`)
}
const structuredPair = tubeFittingSupplementalMappings.find((item) => item.vigourModels?.length > 1)
if (!structuredPair || structuredPair.vigourModel !== structuredPair.vigourModels.join(" / ")) {
  throw new Error("True multi-target rows must expose a canonical vigourModels array")
}

const searchIndex = buildSearchIndex("")
function exact(input, brand) {
  return exactItemsForInput(input, searchIndex).filter((item) => item.brand === brand)
}
function expectUsable(input, brand, target) {
  const hit = exact(input, brand).find((item) => item.vigourModel === target && !item.noMatch)
  if (!hit) throw new Error(`${input}: expected ${target}, got ${JSON.stringify(exact(input, brand))}`)
}
function expectUnknown(input, brand) {
  const rows = exact(input, brand)
  if (rows.length) throw new Error(`${input}: expected no exact source record, got ${JSON.stringify(rows)}`)
}
function expectGuard(input, brand) {
  const rows = exact(input, brand)
  if (!rows.length || rows.some((item) => !item.noMatch || item.vigourModel)) {
    throw new Error(`${input}: expected catalog no-match guard, got ${JSON.stringify(rows)}`)
  }
  if (fuzzyCandidatesForInput(input, searchIndex).items.length) {
    throw new Error(`${input}: catalog no-match guard fell through to fuzzy candidates`)
  }
}

expectUsable("UU-M06-SS", "UNILOK", "SS-VU-6M")
expectUsable("UMC-M0604R-SS", "UNILOK", "SS-VMC-6M-R4")
expectUnknown("UU-M6-SS", "UNILOK")
expectUnknown("UMC-M604R-SS", "UNILOK")
expectUsable("URBT-1612-SS", "UNILOK", "SS-VRT-16-T12")
expectUsable("URRT-1612-SS", "UNILOK", "SS-VRT-16-T12")
expectUnknown("URBT/URRT-1612-SS", "UNILOK")
expectUnknown("UMC-1004N-SS", "UNILOK")
expectUnknown("SS-6M0-1-M10X1", "Swagelok")
expectGuard("UFNS-02-SS", "UNILOK")
expectGuard("SS-2-TA-1-2", "Swagelok")
expectGuard("SS-6M0-1-M10X1.0RS", "Swagelok")
expectGuard("SS-10-VCR-2-VS", "Swagelok")

;[
  ["CGT-04-SL", "VVR-GK-G4"],
  ["CPG-08-SL", "VVR-P8"]
].forEach(([sourceModel, targetModel]) => {
  const row = exact(sourceModel, "UNILOK").find((item) => item.vigourModel === targetModel)
  const result = row && enrichResult(row, [])
  if (
    !result
    || !result.dimensionConfirmation
    || result.copyAllowed
    || !result.salesNeedsConfirmation
    || !["needs_manual_review", "source_missing", "target_missing"].includes(result.dimensionEvidenceStatus)
  ) {
    throw new Error(`${sourceModel}: accessory without dimension evidence must render amber, got ${JSON.stringify(result)}`)
  }
})

const expectedDirectAccessoryCounts = {
  CCP: 4,
  CPG: 4,
  CGT: 8,
  CGTR: 8,
  CGTB: 8,
  CFN: 4,
  CMN: 4,
  CHFN: 1,
  CHMN: 1
}
Object.entries(expectedDirectAccessoryCounts).forEach(([productCode, expectedCount]) => {
  const rows = fittingMappings.filter((item) => (
    item.brand === "UNILOK"
    && item.productCode === productCode
    && item.vigourModel
    && !item.noMatch
  ))
  if (rows.length !== expectedCount) {
    throw new Error(`${productCode}: expected ${expectedCount} direct catalog accessories, got ${rows.length}`)
  }
  const unsafe = rows
    .map((item) => enrichResult(item, []))
    .find((item) => !item.dimensionConfirmation || item.copyAllowed || !item.salesNeedsConfirmation)
  if (unsafe) {
    throw new Error(`${productCode}: accessory family without dimension evidence must remain amber, got ${JSON.stringify(unsafe)}`)
  }
})

;[
  "CSGS-0806-DM-EP",
  "CSGS-0804-DM-EP"
].forEach((sourceModel) => {
  const row = exact(sourceModel, "UNILOK")[0]
  const result = row && enrichResult(row, [])
  if (!result || !result.dimensionConfirmation || result.copyAllowed || !result.salesNeedsConfirmation) {
    throw new Error(`${sourceModel}: non-identical gland dimensions must remain amber, got ${JSON.stringify(result)}`)
  }
  if (!result.matchWarnings.some((warning) => /超出公差/.test(warning.text))) {
    throw new Error(`${sourceModel}: gland warning must explain the catalog tolerance failure`)
  }
})

const toleranceMatchedGlands = [
  "CMGS-04", "CMGS-0804", "CMGS-0806", "CMGS-08",
  "CMGL-04", "CMGL-0806", "CMGL-08",
  "CSGS-04", "CSGS-08",
  "CSGL-04", "CSGL-08",
  "CLGS-04", "CLGS-0804", "CLGS-0806", "CLGS-08", "CLGS-12", "CLGS-16",
  "CLGL-04", "CLGL-0804", "CLGL-0806", "CLGL-08", "CLGL-16"
]
toleranceMatchedGlands.forEach((baseModel) => {
  ;["SM", "DM"].forEach((material) => {
    const sourceModel = `${baseModel}-${material}-EP`
    const row = exact(sourceModel, "UNILOK")[0]
    const result = row && enrichResult(row, [])
    if (
      !result
      || result.dimensionEvidenceStatus !== "within_tolerance"
      || result.totalLengthDifferenceMm > 1.0
      || result.wallThicknessDifferenceIn > 0.005
      || result.insertionLengthDifferenceMm > 1.0
      || !result.insertionLengthMatched
      || !result.wallThicknessMatched
      || result.dimensionConfirmation
      || !result.copyAllowed
    ) {
      throw new Error(`${sourceModel}: catalog dimensions within tolerance must render green, got ${JSON.stringify(result)}`)
    }
  })
})

const insertionMismatch = enrichResult(exact("CLGL-12-DM-EP", "UNILOK")[0], [])
if (
  insertionMismatch.totalLengthDifferenceMm > 1.0
  || insertionMismatch.insertionLengthMatched
  || !insertionMismatch.dimensionConfirmation
  || insertionMismatch.copyAllowed
) {
  throw new Error(`CLGL-12-DM-EP: total-length tolerance must not hide an insertion-length mismatch: ${JSON.stringify(insertionMismatch)}`)
}

const dimensionDisplayWithinTolerance = enrichResult(exact("CSGS-04-DM-EP", "UNILOK")[0], [])
if (
  !dimensionDisplayWithinTolerance.hasDimensionComparison
  || dimensionDisplayWithinTolerance.dimensionComparisonTone !== "success"
  || dimensionDisplayWithinTolerance.dimensionComparisonSummary !== "3 项均在公差内"
  || dimensionDisplayWithinTolerance.dimensionComparisons.length !== 3
  || dimensionDisplayWithinTolerance.dimensionComparisons[0].differenceText !== "0.65"
  || dimensionDisplayWithinTolerance.dimensionComparisons[1].differenceText !== "0.004"
) {
  throw new Error(`CSGS-04-DM-EP: dimension deltas must be visible and formatted: ${JSON.stringify(dimensionDisplayWithinTolerance.dimensionComparisons)}`)
}

const dimensionDisplayExceeded = enrichResult(exact("CSGS-0806-DM-EP", "UNILOK")[0], [])
if (
  dimensionDisplayExceeded.dimensionComparisonTone !== "warning"
  || dimensionDisplayExceeded.dimensionComparisonSummary !== "2 项超出公差"
  || !dimensionDisplayExceeded.dimensionComparisons.some((item) => (
    item.key === "overallLength" && item.differenceText === "3.75" && !item.matched
  ))
  || !dimensionDisplayExceeded.dimensionComparisons.some((item) => (
    item.key === "insertionLength" && item.differenceText === "3.60" && !item.matched
  ))
) {
  throw new Error(`CSGS-0806-DM-EP: exceeded dimension deltas must be explicit: ${JSON.stringify(dimensionDisplayExceeded.dimensionComparisons)}`)
}

const gasketDimensionDisplay = enrichResult(exact("CGT-04-SL", "UNILOK")[0], [])
if (
  !gasketDimensionDisplay.hasDimensionComparison
  || gasketDimensionDisplay.dimensionComparisons.length !== 3
  || gasketDimensionDisplay.dimensionComparisonTone !== "warning"
  || !gasketDimensionDisplay.dimensionComparisons.some((item) => (
    item.key === "catalogE:catalogD1" && item.differenceText === "0.00"
  ))
) {
  throw new Error(`CGT-04-SL: all comparable gasket dimensions, including zero delta, must render amber: ${JSON.stringify(gasketDimensionDisplay)}`)
}

const fiveEighthsGasket = exact("SS-10-VCR-2-VS", "Swagelok")[0]
if (fiveEighthsGasket.vigourModel === "VVR-GK-G2") {
  throw new Error("5/8 Swagelok gasket must never be downgraded to 1/8 VIGOUR VVR-GK-G2")
}
if (!catalogNoMatchModelsByBrand.Swagelok.length || !catalogNoMatchModelsByBrand.UNILOK.length) {
  throw new Error("Catalog inventories must retain compact no-match guards for uncovered models")
}

console.log(`Fitting catalog source repair passed: ${auditedRows.length} evidenced rows, ${catalogNoMatchModelsByBrand.Swagelok.length + catalogNoMatchModelsByBrand.UNILOK.length} catalog guards`)
