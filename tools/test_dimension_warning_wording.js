const { enrichResult } = require("../packageFitting/resultPolicy")

const result = enrichResult({
  brand: "TEST",
  sourceModel: "TEST-1",
  vigourModel: "TARGET-1",
  dimensionConfirmation: true,
  dimensionEvidenceStatus: "needs_manual_review",
  dimensionEvidenceReason: "适用目录尺寸尚未提取"
}, [])
const warningText = result.matchWarnings.find((warning) => warning.text.includes("目录尺寸未建立"))?.text || ""

if (!warningText) throw new Error("Dimension confirmation warning text was not found")

if (warningText.includes("外径")) {
  throw new Error(`Dimension warning should not flag nominal OD equivalents as differences: ${warningText}`)
}

if (!warningText.includes("适用目录尺寸尚未提取")) {
  throw new Error(`Dimension warning should expose the evidence failure reason: ${warningText}`)
}

console.log("Dimension warning wording regression passed")
