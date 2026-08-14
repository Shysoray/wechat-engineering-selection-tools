const { normalizeModelText } = require("../utils/fittingModelSignature")

const OCR_DIGIT_SUBSTITUTIONS = {
  O: "0",
  Q: "0",
  I: "1",
  L: "1"
}

function modelParts(value) {
  return normalizeModelText(value).split("-").filter(Boolean)
}

function isSafeNumericOcrPair(inputPart, candidatePart) {
  if (!/^\d+(?:\.\d+)?$/.test(candidatePart) || inputPart.length !== candidatePart.length) {
    return false
  }

  let changed = false
  for (let index = 0; index < candidatePart.length; index += 1) {
    const inputChar = inputPart[index]
    const candidateChar = candidatePart[index]
    if (inputChar === candidateChar) continue
    if (OCR_DIGIT_SUBSTITUTIONS[inputChar] !== candidateChar) return false
    changed = true
  }
  return changed
}

function isSafeFuzzyTextPair(input, candidate) {
  const inputNormalized = normalizeModelText(input)
  const candidateNormalized = normalizeModelText(candidate)
  if (!inputNormalized || !candidateNormalized) return false
  if (inputNormalized === candidateNormalized) return true

  const inputParts = modelParts(inputNormalized)
  const candidateParts = modelParts(candidateNormalized)
  if (inputParts.length !== candidateParts.length) return false

  let hasSafeOcrChange = false
  for (let index = 0; index < candidateParts.length; index += 1) {
    if (inputParts[index] === candidateParts[index]) continue
    if (!isSafeNumericOcrPair(inputParts[index], candidateParts[index])) return false
    hasSafeOcrChange = true
  }
  return hasSafeOcrChange
}

function normalizedProductLabel(item) {
  return String(item.productLabel || item.productName || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
}

function mappingFamilyKey(item) {
  const family = String(item.productCode || "").trim() || normalizedProductLabel(item)
  return `${item.brand || ""}|${family}`
}

function candidatesShareOneFamily(entries) {
  return new Set(entries.map((entry) => mappingFamilyKey(entry.item))).size <= 1
}

module.exports = {
  isSafeFuzzyTextPair,
  mappingFamilyKey,
  candidatesShareOneFamily
}
