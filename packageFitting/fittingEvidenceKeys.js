const { normalizeModelText } = require("../utils/fittingModelSignature")

function stripRepeatedSuffixes(value, suffixes) {
  let result = value
  let previous = ""
  const pattern = new RegExp(`-(?:${suffixes.join("|")})(?=-|$)`, "g")
  while (result !== previous) {
    previous = result
    result = result.replace(pattern, "")
  }
  return result
}

function sourceEvidenceAlias(brand, value) {
  let text = String(value || "").toUpperCase().trim()
  if (brand === "FITOK") {
    text = text.replace(/^(?:SS|6L|6LV|6LW)(?=-)/, "").replace(/-(?:F2|F3)$/, "")
  } else if (brand === "FUJIKIN") {
    text = text
      .replace(/-S#T(?=-|$)/g, "-S")
      .replace(/-(?:APN|APM)(?=-|$)/g, "")
      .replace(/-(?:BK|FD|PS|UP|STD)$/, "")
      .replace(/-(?:316LM|SUS316L|FS9)$/, "")
  } else if (brand === "JSK") {
    text = text.replace(/(?:BA|EP)$/, "")
  } else if (brand === "SUPERLOK") {
    text = text.replace(/^(?:SM|DM)(?=\d)/, "").replace(/-(?:P|SP)$/, "")
  } else if (brand === "Swagelok") {
    text = text.replace(/^(?:SS|316L|6LV)-/, "").replace(/-VS$/, "")
  } else if (brand === "TK-Fujikin") {
    text = text.replace(/^[SD](?=\d)/, "").replace(/-(?:P|SP)$/, "")
  } else if (brand === "UNILOK") {
    text = text.replace(/-(?:SM|DM)-(?:EP|BA)$/, "").replace(/-(?:SL|NI|SS|BR|CS)$/, "")
  }
  return normalizeModelText(text).replace(/[^A-Z0-9]/g, "")
}

function targetEvidenceAlias(value) {
  const first = String(value || "").split(/\s*\/\s*/)[0].trim()
  return normalizeModelText(stripRepeatedSuffixes(first, ["SLV", "BA", "P", "BL"]))
    .replace(/[^A-Z0-9]/g, "")
}

function mappingEvidenceKey(item) {
  return [
    item.brand || "",
    sourceEvidenceAlias(item.brand, item.sourceModel),
    targetEvidenceAlias(item.vigourModel)
  ].join("|")
}

module.exports = {
  sourceEvidenceAlias,
  targetEvidenceAlias,
  mappingEvidenceKey
}
