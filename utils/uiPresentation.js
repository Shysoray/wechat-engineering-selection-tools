const { normalizeModelText, isRecognizedFittingModel } = require("./fittingModelSignature")

function classifyQuickModel(value) {
  const normalized = normalizeModelText(value).replace(/^WB-/, "")
  if (/^(?:AP|AZ)\d/.test(normalized)) return "aptech"
  if (isRecognizedFittingModel(normalized)) return "fitting"
  return "ambiguous"
}

function filterBatchResults(results, filter) {
  const source = Array.isArray(results) ? results : []
  if (!filter || filter === "all") return source.slice()
  return source.filter((item) => (item.presentationKind || item.kind) === filter)
}

function hasMeaningfulState(value) {
  if (Array.isArray(value)) return value.some(hasMeaningfulState)
  if (value && typeof value === "object") return Object.values(value).some(hasMeaningfulState)
  return value !== "" && value !== null && value !== undefined && value !== false
}

module.exports = { classifyQuickModel, filterBatchResults, hasMeaningfulState }
