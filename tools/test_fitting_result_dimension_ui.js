const fs = require("fs")
const path = require("path")
const { enrichResult } = require("../packageFitting/resultPolicy")

const missing = enrichResult({
  brand: "TEST",
  sourceModel: "SOURCE",
  vigourModel: "TARGET",
  dimensionEvidenceStatus: "source_missing",
  dimensionEvidenceReason: "源目录未列出尺寸",
  dimensionComparisons: []
}, [])
if (!missing.hasDimensionComparison || missing.dimensionComparisonSummary !== "源目录尺寸缺失" || missing.copyAllowed) {
  throw new Error(`Target missing-evidence UI must stay visible and amber: ${JSON.stringify(missing)}`)
}

const zero = enrichResult({
  brand: "TEST",
  sourceModel: "SOURCE",
  vigourModel: "TARGET",
  dimensionEvidenceStatus: "within_tolerance",
  dimensionComparisons: [
    { dimension: "overallLength", label: "总长", sourceValue: 10, targetValue: 10, absoluteDifference: 0, tolerance: 1, unit: "mm", required: true }
  ]
}, [])
if (zero.dimensionComparisons[0].differenceText !== "0.00" || !zero.copyAllowed) {
  throw new Error(`Zero difference must remain explicit and green: ${JSON.stringify(zero)}`)
}

const informational = enrichResult({
  brand: "TEST",
  sourceModel: "SOURCE",
  vigourModel: "TARGET",
  dimensionEvidenceStatus: "needs_manual_review",
  dimensionEvidenceReason: "双方目录实值已对齐，公差待确认",
  dimensionComparisons: [
    { dimension: "catalogA:catalogH", label: "来源 A ↔ VIGOUR H", sourceValue: 10, targetValue: 10.4, absoluteDifference: 0.4, tolerance: null, matched: null, unit: "mm", required: false }
  ]
}, [])
if (
  informational.dimensionComparisonSummary !== "1 项尺寸差值已列出"
  || informational.dimensionComparisons[0].differenceText !== "0.40"
  || informational.dimensionComparisons[0].statusText !== "差值已计算"
  || informational.dimensionComparisons[0].toleranceConfirmed
  || !informational.matchWarnings.some((warning) => warning.text.includes("尺寸差值已列出"))
) {
  throw new Error(`Informational catalog differences must display without a false gap/tolerance: ${JSON.stringify(informational)}`)
}

const wxml = fs.readFileSync(path.resolve("packageFitting/pages/index.wxml"), "utf8")
for (const contract of ["dimensionComparisonMissingText", "dimensionEvidencePageSummary", "差 {{dimension.differenceText}}"]) {
  if (!wxml.includes(contract)) throw new Error(`Missing dimension UI contract: ${contract}`)
}

console.log("Fitting result dimension UI passed")
