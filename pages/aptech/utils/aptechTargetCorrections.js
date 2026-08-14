const { tokenizeAptechModel } = require("./aptechTokenizer")

const AP31_VDV38_RULES = Object.freeze({
  3100: Object.freeze({ action: "M", workPressure: "H" }),
  3102: Object.freeze({ action: "M", workPressure: "M" }),
  3113: Object.freeze({ action: "PC", workPressure: "M" }),
  3125: Object.freeze({ action: "M", workPressure: "H" }),
  3130: Object.freeze({ action: "PC", workPressure: "H" }),
  3150: Object.freeze({ action: "M", workPressure: "M" }),
  3157: Object.freeze({ action: "M", workPressure: "M" })
})

const VDV_CONNECTION = /^(?:FV|MV|TW|IV)\d+$|^CONN\?$/

function getAp31Vdv38Rule(brand, number) {
  return brand === "AP" ? AP31_VDV38_RULES[number] || null : null
}

function sourceInfo(token) {
  const match = String(token || "").match(/^(AP|AZ)(\d{4})/)
  return match
    ? { brand: match[1], number: Number(match[2]) }
    : { brand: "", number: 0 }
}

function isApAz1200(source) {
  return ["AP", "AZ"].includes(source.brand)
    && source.number >= 1201
    && source.number <= 1225
}

function apAz1000Inlet(source, tokens) {
  if (!["AP", "AZ"].includes(source.brand) || source.number < 1001 || source.number > 1015) return ""
  const portIndex = tokens.findIndex((token) => token === "4PW")
  const inletGauge = portIndex < 0 ? "" : tokens[portIndex + 3] || ""
  return /^(?:V3|L|1|H|2)$/.test(inletGauge) ? "20" : "250"
}

function ap9000Inlet(source, tokens) {
  if (source.brand !== "AP") return ""
  if (source.number === 9010 || source.number === 9030) {
    return tokens.includes("HR") ? "200" : "117"
  }
  if (source.number === 9110 || source.number === 9115) return "55"
  return ""
}

function dedupeVs(parts) {
  let hasVs = false
  return parts.filter((part) => {
    if (part !== "VS") return true
    if (hasVs) return false
    hasVs = true
    return true
  })
}

function normalizeAzMaterial(parts, source) {
  if (source.brand !== "AZ" || parts[0] !== "VSR") return parts
  if (
    (source.number >= 1101 && source.number <= 1115)
    || (source.number >= 1401 && source.number <= 1415)
    || (source.number >= 1501 && source.number <= 1515)
    || (source.number >= 1901 && source.number <= 1915)
  ) {
    parts[1] = String(parts[1] || "")
      .replace(/UCSLV$/, "UBS")
      .replace(/UCSHP$/, "UBSH")
      .replace(/UC$/, "UB")
  }
  return parts
}

function insertBeforeOption(parts, option, beforeOption) {
  const withoutOption = parts.filter((part) => part !== option)
  const beforeIndex = withoutOption.indexOf(beforeOption)
  if (beforeIndex < 0) return [...withoutOption, option]
  withoutOption.splice(beforeIndex, 0, option)
  return withoutOption
}

function normalizeVdv38Pressure(parts, source) {
  const rule = getAp31Vdv38Rule(source.brand, source.number)
  const workPressure = rule ? rule.workPressure : ""
  if (!workPressure || !/^VDV38UC/.test(parts[0] || "")) return parts

  let lastConnectionIndex = -1
  parts.forEach((part, index) => {
    if (VDV_CONNECTION.test(part)) lastConnectionIndex = index
  })
  if (lastConnectionIndex < 0) return parts

  let pressureIndex = lastConnectionIndex + 1
  if (parts[pressureIndex] === "VS") pressureIndex += 1

  if (["H", "M"].includes(parts[pressureIndex])) {
    parts[pressureIndex] = workPressure
  } else {
    parts.splice(pressureIndex, 0, workPressure)
  }
  return parts
}

function normalizeAptechTarget(vigourModel, sourceModel) {
  const tokens = tokenizeAptechModel(sourceModel)
  const source = sourceInfo(tokens[0])
  const parts = String(vigourModel || "").split("-")
  normalizeAzMaterial(parts, source)

  if (source.brand === "AP" && source.number === 3625 && /^VDV32UC/.test(parts[0] || "")) {
    parts[0] = parts[0].replace(/^VDV32UC/, "VDV40UC")
  }

  normalizeVdv38Pressure(parts, source)

  const correctedAp1000Inlet = apAz1000Inlet(source, tokens)
  if (correctedAp1000Inlet && parts[0] === "VSR" && /^100U[BC]/.test(parts[1] || "")) {
    parts[2] = correctedAp1000Inlet
  }

  const correctedAp9000Inlet = ap9000Inlet(source, tokens)
  if (correctedAp9000Inlet && parts[0] === "VSR" && /^91[01]UB/.test(parts[1] || "")) {
    const hasVs = tokens.includes("VS")
    parts[2] = correctedAp9000Inlet
    const corrected = parts.filter((part) => part !== "HR" && (hasVs || correctedAp9000Inlet === "200" || part !== "VS"))
    if (correctedAp9000Inlet === "200" && !corrected.includes("VS")) corrected.push("VS")
    return dedupeVs(corrected).join("-")
  }

  if (isApAz1200(source) && parts[0] === "VSR" && /^210U[BC]/.test(parts[1] || "")) {
    const hasHr = tokens.includes("HR")
    const hasFc = tokens.includes("FC")
    const hasVs = tokens.includes("VS")
    if (source.brand === "AZ") {
      parts[1] = parts[1]
        .replace("210UCSLV", "210UBS")
        .replace("210UCSHP", "210UBSH")
        .replace("210UC", "210UB")
    }
    parts[2] = hasFc ? "20" : (hasHr ? "200" : "117")
    let corrected = parts.filter((part) => part !== "HR" && (source.brand !== "AZ" || hasVs || part !== "VS"))
    if (hasFc) corrected = insertBeforeOption(corrected, "FC", "VS")
    if (!hasFc && source.brand === "AP" && hasHr && !corrected.includes("VS")) corrected.push("VS")
    return dedupeVs(corrected).join("-")
  }

  if (source.brand === "AZ" && source.number >= 9201 && source.number <= 9215 && parts[0] === "VSR") {
    parts[1] = String(parts[1] || "").replace(/^910UB/, "920UB")
    parts[2] = "20"
    const hasVs = tokens.includes("VS")
    return dedupeVs(parts.filter((part) => hasVs || part !== "VS")).join("-")
  }

  return parts.join("-")
}

module.exports = {
  normalizeAptechTarget,
  getAp31Vdv38Rule
}
