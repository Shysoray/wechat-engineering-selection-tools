const MAX_BATCH_MODELS = 100

function splitModelInput(value) {
  return String(value || "")
    .split(/\r?\n|[,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function compoundInputParts(input) {
  const parts = String(input || "")
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 1 ? parts : []
}

function batchInputLimit(value) {
  const inputs = splitModelInput(value)
  return {
    inputs,
    overflowCount: Math.max(0, inputs.length - MAX_BATCH_MODELS)
  }
}

module.exports = {
  MAX_BATCH_MODELS,
  splitModelInput,
  compoundInputParts,
  batchInputLimit
}
