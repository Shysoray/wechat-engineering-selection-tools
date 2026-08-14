const { generateAptechDiaphragmCandidate } = require("./aptechDiaphragmRuleGenerator")
const { tokenizeAptechModel } = require("./aptechTokenizer")
const { REGULATOR_CATALOG_SERIES } = require("./aptechCatalogConstraints")

const PRESSURE_CODES = {
  "01": "V0.7",
  "02": "2",
  "06": "4",
  "10": "7",
  "15": "10",
  "20": "14",
  "30": "P21",
  "25": "P17"
}

function catalogMappingNumbers(id) {
  const catalog = REGULATOR_CATALOG_SERIES.find((series) => series.id === id)
  return catalog ? catalog.mappingNumbers : []
}

const REGULATOR_SERIES = [
  { numbers: catalogMappingNumbers("AP500"), base: 500, vigour: "VSR-50UC", inlet: "10", brands: ["AP"], allowHr: false, ap500SurfaceOnlyWithGPort: true },
  { numbers: catalogMappingNumbers("AP1000"), base: 1000, vigour: "VSR-100UC", inlet: "250", lowGaugeInlet: "20", brands: ["AP"] },
  { numbers: catalogMappingNumbers("AZ1000"), base: 1000, vigour: "VSR-100UB", inlet: "250", lowGaugeInlet: "20", brands: ["AZ"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP1100"), base: 1100, vigour: "VSR-410UC", inlet: "200", brands: ["AP"], fixedOptions: ["VC2"] },
  { numbers: catalogMappingNumbers("AZ1100"), base: 1100, vigour: "VSR-410UB", inlet: "200", brands: ["AZ"], fixedOptions: ["VC2"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP1200"), base: 1200, vigour: "VSR-210UC", inlet: "117", hrInlet: "200", fcInlet: "20", brands: ["AP"], allowFc: true },
  { numbers: catalogMappingNumbers("AZ1200"), base: 1200, vigour: "VSR-210UB", inlet: "117", hrInlet: "200", fcInlet: "20", brands: ["AZ"], materialMode: "UB", allowFc: true },
  { numbers: catalogMappingNumbers("AP1300"), base: 1300, vigour: "VSR-210UB", inlet: "200", brands: ["AP"], fixedOptions: ["HF"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AZ1300"), base: 1300, vigour: "VSR-210UB", inlet: "200", brands: ["AZ"], fixedOptions: ["HF"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP1400T"), base: 1400, vigour: "VSR-410UC", inlet: "200", brands: ["AP"] },
  { numbers: catalogMappingNumbers("AZ1400T"), base: 1400, vigour: "VSR-410UB", inlet: "200", brands: ["AZ"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP1500"), base: 1500, vigour: "VSR-510UC", inlet: "250", brands: ["AP"] },
  { numbers: catalogMappingNumbers("AZ1500"), base: 1500, vigour: "VSR-510UB", inlet: "250", brands: ["AZ"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP1600"), base: 1600, vigour: "VSR-610UC", inlet: "250", brands: ["AP"] },
  { numbers: catalogMappingNumbers("AP1900"), base: 1900, vigour: "VSR-510UC", inlet: "250", brands: ["AP"], fixedOptions: ["HF"] },
  { numbers: catalogMappingNumbers("AP1700"), base: 1700, vigour: "VSR-710UC", inlet: "250", brands: ["AP"] },
  { numbers: catalogMappingNumbers("AP9000").filter((number) => number === 9010), base: 9000, vigour: "VSR-910UB", inlet: "117", hrInlet: "200", brands: ["AP"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP9000").filter((number) => number === 9030), base: 9000, vigour: "VSR-911UB", inlet: "117", hrInlet: "200", brands: ["AP"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AP9000").filter((number) => number >= 9100), base: 9100, vigour: "VSR-910UB", inlet: "55", brands: ["AP"], materialMode: "UB" },
  { numbers: catalogMappingNumbers("AZ9200"), base: 9200, vigour: "VSR-920UB", inlet: "20", brands: ["AZ"], materialMode: "UB" }
]

const PORT_TOKEN = /^\dP[A-Z]*$/
const CONNECTION_TOKEN = /^(?:F|M|T|I)V\d+$|^TW\d+$|^MV\d+$|^FV\d+$/
const GAUGE_OR_OPTION_PORT_TOKEN = /^(?:0|1|2|4|10|40|H|L|V3|MPA)$/
const BLEED_CODES = {
  CB005: "03",
  CB009: "05",
  CBO09: "05",
  CB013: "08",
  CB023: "15"
}

const MANUAL_REVIEW_SERIES = [
  /^(?:AP|AZ)27\d+[A-Z]*$/,
  /^(?:AP|AZ)(?:10|12|14|15|90|91)PA[A-Z]*$/,
  /^AP9OPA[A-Z]*$/
]

function normalizeModelText(value) {
  const raw = String(value || "")
  const normalized = typeof raw.normalize === "function" ? raw.normalize("NFKC") : raw
  return normalized
    .toUpperCase()
    .replace(/[‐‑‒–—―−﹘﹣－_]/g, "-")
    .replace(/[×✕✖＊*]/g, "X")
    .replace(/[，、；;|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value) {
  return tokenizeAptechModel(value)
}

function modelInfo(token) {
  const match = String(token || "").match(/^(AP|AZ)(\d{3,4})([A-Z]*)$/)
  if (!match) return null
  return {
    brand: match[1],
    number: Number(match[2]),
    suffix: match[3] || ""
  }
}

function pressureCode(number, base) {
  const delta = String(number - base).padStart(2, "0")
  return PRESSURE_CODES[delta] || ""
}

function usesVc2Outlet(info, series) {
  if (!/^VSR-410U[BC]$/.test(series.vigour)) return false
  if (info.number === 1101) return true
  return info.number === 1402 && /A/.test(info.suffix)
}

function regulatorOutlet(info, series) {
  if (usesVc2Outlet(info, series)) return "VC2"
  return pressureCode(info.number, series.base)
}

function hasLowPressureInletGauge(tokens) {
  const portIndex = tokens.findIndex((token) => token === "4PW")
  if (portIndex < 0) return false
  return /^(?:V3|L|1|H|2)$/.test(tokens[portIndex + 3] || "")
}

function regulatorInlet(series, outlet, tokens) {
  if (outlet === "VC2") return "20"
  if (series.fcInlet && tokens.includes("FC")) return series.fcInlet
  if (series.hrInlet && tokens.includes("HR")) return series.hrInlet
  if (series.lowGaugeInlet && hasLowPressureInletGauge(tokens)) return series.lowGaugeInlet
  return series.inlet
}

function regulatorSeriesFor(info) {
  return REGULATOR_SERIES.find((series) => (
    series.numbers.includes(info.number)
    && series.brands.includes(info.brand)
  ))
}

function regulatorFamilySeriesFor(info) {
  if (!info) return []
  return REGULATOR_SERIES.filter((series) => (
    series.brands.includes(info.brand)
    && info.number >= series.base
    && info.number < series.base + 100
  ))
}

function regulatorFuzzyBlockReason(input) {
  const tokens = tokenize(input)
  const info = modelInfo(tokens[0])
  const familySeries = regulatorFamilySeriesFor(info)
  if (!familySeries.length) return ""

  const series = regulatorSeriesFor(info)
  const outlet = series ? regulatorOutlet(info, series) : ""
  if (!series || !outlet) {
    const base = familySeries[0].base
    if (info.number === base) {
      return `无效订货型号：${info.brand}${base} 是系列基号，不是有效压力档，已禁止模糊匹配`
    }
    return `无效订货型号：${tokens[0]} 的压力代码不在该系列有效范围，已禁止模糊匹配`
  }

  const portIndex = tokens.findIndex((token, index) => index > 0 && PORT_TOKEN.test(token))
  if (portIndex < 0) {
    return "型号字段不完整：缺少 2P/3P/4P 流路字段，已禁止模糊匹配"
  }

  if (!mapPorts(tokens[portIndex], tokens, portIndex + 1)) {
    return "型号字段不完整：流路数量与接口字段不一致，已禁止模糊匹配"
  }

  return "型号字段组合无法生成可靠对照，已禁止模糊匹配"
}

function materializedSeries(vigourSeries, suffix, materialMode) {
  if (materialMode === "UB") {
    if (/SH/.test(suffix)) return `${vigourSeries}SH`
    if (/S|H/.test(suffix)) return `${vigourSeries}S`
    return vigourSeries
  }
  if (/SH/.test(suffix)) return `${vigourSeries}SHP`
  if (/S|H/.test(suffix)) return `${vigourSeries}SLV`
  return vigourSeries
}

function surfaceOptions(suffix, series, portToken, remainingTokens) {
  const isAp500FaceSealPort = portToken === "2P" && remainingTokens.includes("FA")
  if (/A|L/.test(suffix)) return []
  if (series.ap500SurfaceOnlyWithGPort && !/G/.test(portToken) && !isAp500FaceSealPort) return []
  if (series.ap500SurfaceOnlyWithGPort && !remainingTokens.includes("MPA") && !isAp500FaceSealPort) return []
  if (/X/.test(suffix)) return ["R5"]
  if (/V/.test(suffix)) return ["R7"]
  return []
}

function portValue(token) {
  if (CONNECTION_TOKEN.test(token)) return token
  if (GAUGE_OR_OPTION_PORT_TOKEN.test(token)) return "P"
  return ""
}

function takePortValues(tokens, startIndex, count) {
  const values = []
  let index = startIndex
  while (index < tokens.length && values.length < count) {
    const value = portValue(tokens[index])
    if (!value) break
    values.push(value)
    index += 1
  }
  return { values, nextIndex: index }
}

function mapPorts(portToken, tokens, startIndex) {
  const portCountMatch = portToken.match(/^(\d)P/)
  const portCount = portCountMatch ? Number(portCountMatch[1]) : 0
  if (!portCount) return null

  if (portToken === "2P" && tokens[startIndex] === "FA") {
    return { modelParts: ["2P"], nextIndex: startIndex }
  }

  const { values, nextIndex } = takePortValues(tokens, startIndex, portCount)
  if (values.length !== portCount) return null

  if (portCount === 2) {
    return { modelParts: ["2P", values[0], values[1]], nextIndex }
  }

  if (portCount === 3) {
    return { modelParts: ["3P", values[0], values[2], values[1]], nextIndex }
  }

  if (portCount === 4) {
    return { modelParts: ["4P", values[0], values[2], values[3], values[1]], nextIndex }
  }

  if (portCount === 5) {
    return { modelParts: ["5P", values[0], values[1], values[2], values[3], values[4]], nextIndex }
  }

  return null
}

function requiresVespelSeat(seriesModel, inlet) {
  if (inlet !== "200") return false
  return /^VSR-91[01]/.test(seriesModel) || /^VSR-210UC/.test(seriesModel)
}

function trailingOptions(tokens, startIndex, series, suffix, portToken, seriesModel, inlet, outlet) {
  const flags = {}
  const remainingTokens = tokens.slice(startIndex)
  const fixedTailOptions = (series.fixedOptions || []).filter((option) => !["HR", "HF", "VS", outlet].includes(option))

  ;(series.fixedOptions || []).forEach((option) => {
    flags[option] = true
  })
  remainingTokens.forEach((token) => {
    if (token === "HF") flags.HF = true
    if (token === "FC" && series.allowFc) flags.FC = true
    if (token === "VS") flags.VS = true
  })
  if (requiresVespelSeat(seriesModel, inlet)) flags.VS = true

  return [
    ...surfaceOptions(suffix, series, portToken, remainingTokens),
    flags.HF ? "HF" : "",
    flags.FC ? "FC" : "",
    flags.VS ? "VS" : "",
    ...fixedTailOptions
  ].filter(Boolean)
}

function manualReviewCandidate(input) {
  const tokens = tokenize(input)
  if (!tokens.length) return null
  if (!MANUAL_REVIEW_SERIES.some((pattern) => pattern.test(tokens[0]))) return null

  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: "",
    noMatch: true,
    score: 100,
    matchType: "需人工确认"
  }
}

function kt9ManualReviewCandidate(input) {
  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: "",
    noMatch: true,
    score: 100,
    matchType: "需人工确认"
  }
}

function generateKt9Candidate(input) {
  const tokens = tokenize(input)
  if (tokens.length < 4) return null

  const match = String(tokens[0] || "").match(/^KT9([DFL])([01])S$/)
  if (!match) return null

  const outlet = { F: "35", L: "170" }[match[1]]
  if (!outlet) return kt9ManualReviewCandidate(input)

  const portIndex = tokens.findIndex((token, index) => index > 0 && PORT_TOKEN.test(token))
  if (portIndex < 0 || !/W/.test(tokens[portIndex])) return kt9ManualReviewCandidate(input)

  const portMapping = mapPorts(tokens[portIndex], tokens, portIndex + 1)
  if (!portMapping || !["2P", "3P", "4P"].includes(portMapping.modelParts[0])) {
    return kt9ManualReviewCandidate(input)
  }

  const remaining = tokens.slice(portMapping.nextIndex)
  const supportedOptions = new Set(["HF", "VS", "P"])
  if (remaining.some((token) => !supportedOptions.has(token))) return kt9ManualReviewCandidate(input)

  const hasHf = remaining.includes("HF")
  const hasVs = hasHf || remaining.includes("VS")
  const modelParts = [
    "VSR-930UBS",
    "400",
    outlet,
    ...portMapping.modelParts,
    hasHf ? "HF" : "",
    hasVs ? "VS" : "",
    match[2] === "0" ? "X" : "",
    remaining.includes("P") ? "P" : ""
  ].filter(Boolean)

  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: modelParts.join("-"),
    noMatch: false,
    score: 100,
    matchType: "规则生成"
  }
}

function generateRegulatorCandidate(input) {
  const tokens = tokenize(input)
  if (tokens.length < 4) return null

  const info = modelInfo(tokens[0])
  if (!info) return null

  const series = regulatorSeriesFor(info)
  if (!series) return null

  const outlet = regulatorOutlet(info, series)
  if (!outlet) return null

  const portIndex = tokens.findIndex((token, index) => index > 0 && PORT_TOKEN.test(token))
  if (portIndex < 0) return null

  const portMapping = mapPorts(tokens[portIndex], tokens, portIndex + 1)
  if (!portMapping) return null

  const seriesModel = materializedSeries(series.vigour, info.suffix, series.materialMode)
  const inlet = regulatorInlet(series, outlet, tokens)
  const modelParts = [
    seriesModel,
    inlet,
    outlet,
    ...portMapping.modelParts,
    ...trailingOptions(tokens, portMapping.nextIndex, series, info.suffix, tokens[portIndex], seriesModel, inlet, outlet)
  ]

  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: modelParts.join("-"),
    noMatch: false,
    score: 100,
    matchType: "规则生成"
  }
}

function vacuumGeneratorInfo(token) {
  const ap72Match = String(token || "").match(/^AP(72540|72550|72600|72625|72650)([A-Z]*)(?:\d*)$/)
  if (ap72Match) {
    const action = ["72540", "72550"].includes(ap72Match[1]) ? "PC" : "M"
    return {
      family: "AP72",
      action,
      material: ap72Match[2].includes("S") ? "S" : ""
    }
  }

  const ap71Match = String(token || "").match(/^AP(71)([A-Z]*)(?:\d*)$/)
  if (ap71Match) {
    return {
      family: "AP71",
      material: ap71Match[2].includes("S") ? "S" : ""
    }
  }

  const ap7Match = String(token || "").match(/^AP(70|7)([A-Z]*)(?:\d*)$/)
  if (ap7Match) {
    return {
      family: "AP7",
      material: ap7Match[2].includes("S") ? "S" : ""
    }
  }

  return null
}

function connectionValues(tokens, startIndex) {
  return tokens
    .slice(startIndex)
    .filter((token) => CONNECTION_TOKEN.test(token))
}

function bleedOption(tokens) {
  const token = tokens.find((item) => Object.prototype.hasOwnProperty.call(BLEED_CODES, item))
  return token ? BLEED_CODES[token] : ""
}

function generateVacuumGeneratorCandidate(input) {
  const tokens = tokenize(input)
  if (tokens.length < 4) return null

  const info = vacuumGeneratorInfo(tokens[0])
  if (!info) return null

  if (info.family === "AP7") {
    const portIndex = tokens.findIndex((token, index) => index > 0 && PORT_TOKEN.test(token))
    const startIndex = portIndex > 0 ? portIndex + 1 : 1
    const values = connectionValues(tokens, startIndex).slice(0, 3)
    if (values.length !== 3) return null

    const material = info.material ? [info.material] : []
    return {
      brand: "APTech",
      sourceModel: normalizeModelText(input),
      vigourModel: ["VVG", ...material, ...values, "EP"].join("-"),
      noMatch: false,
      score: 100,
      matchType: "规则生成"
    }
  }

  if (info.family === "AP71") {
    const values = connectionValues(tokens, 1).slice(0, 3)
    if (values.length !== 3) return null

    const bleed = bleedOption(tokens)
    return {
      brand: "APTech",
      sourceModel: normalizeModelText(input),
      vigourModel: [`VVGV1${info.material}`, ...values, bleed].filter(Boolean).join("-"),
      noMatch: false,
      score: 100,
      matchType: "规则生成"
    }
  }

  const portIndex = tokens.findIndex((token, index) => index > 0 && PORT_TOKEN.test(token))
  if (portIndex < 0) return null

  const circuit = {
    "3PW": "A",
    "3PWA": "B",
    "4PW": "C"
  }[tokens[portIndex]]
  if (!circuit) return null

  const expectedConnectionCount = tokens[portIndex] === "4PW" ? 4 : 3
  const values = connectionValues(tokens, portIndex + 1).slice(0, expectedConnectionCount)
  if (values.length !== expectedConnectionCount) return null

  const bleed = bleedOption(tokens)
  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: [`VVGV2${info.material}`, info.action, circuit, ...values, bleed].filter(Boolean).join("-"),
    noMatch: false,
    score: 100,
    matchType: "规则生成"
  }
}

const AP74B_CONNECTION_SIZE_BY_FLOW = Object.freeze({
  "225": "8",
  "350": "8",
  "500": "8",
  "950": "8",
  "1100": "12",
  "1650": "12",
  "2600": "12",
  "3000": "16",
  "4000": "16"
})

function flowSwitchManualReviewCandidate(input) {
  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: "",
    noMatch: true,
    score: 100,
    matchType: "需人工确认"
  }
}

function excessFlowSwitchInfo(tokens) {
  const first = String(tokens[0] || "")
  const smallMatch = first.match(/^AP74(002|005|010|025|050|100)([A-Z]*)$/)
  if (smallMatch) {
    return {
      family: "AP74",
      flow: smallMatch[1],
      suffix: smallMatch[2],
      connectionIndex: 1
    }
  }

  const separatedSmall = first === "AP74"
    ? String(tokens[1] || "").match(/^(002|005|010|025|050|100)$/)
    : null
  if (separatedSmall && /^[A-Z]+$/.test(tokens[2] || "")) {
    return {
      family: "AP74",
      flow: separatedSmall[1],
      suffix: tokens[2],
      connectionIndex: 3
    }
  }

  const largeMatch = first.match(/^AP74B([HV])(\d+)([A-Z]*)$/)
  if (largeMatch) {
    return {
      family: "AP74B",
      direction: largeMatch[1],
      flow: largeMatch[2],
      suffix: largeMatch[3],
      connectionIndex: 1
    }
  }

  const separatedLarge = first === "AP74B"
    ? String(tokens[1] || "").match(/^([HV])(\d+)$/)
    : null
  if (separatedLarge && /^[A-Z]+$/.test(tokens[2] || "")) {
    return {
      family: "AP74B",
      direction: separatedLarge[1],
      flow: separatedLarge[2],
      suffix: tokens[2],
      connectionIndex: 3
    }
  }

  return null
}

function generateExcessFlowSwitchCandidate(input) {
  const tokens = tokenize(input)
  if (tokens.length < 3) return null

  const info = excessFlowSwitchInfo(tokens)
  if (!info) return null

  const values = connectionValues(tokens, info.connectionIndex).slice(0, 2)
  if (values.length !== 2) return flowSwitchManualReviewCandidate(input)

  if (info.family === "AP74B") {
    const requiredSize = AP74B_CONNECTION_SIZE_BY_FLOW[info.flow]
    const connectionsMatch = requiredSize
      && values.every((value) => new RegExp(`^(?:FV|MV|TW)${requiredSize}$`).test(value))
    if (info.suffix !== "SM" || !connectionsMatch) return flowSwitchManualReviewCandidate(input)
  }

  const modelParts = info.family === "AP74"
    ? ["VEFS1", "SLV", ...values, info.flow, "P"]
    : ["VEFS2", "S", info.direction, ...values, info.flow, "P"]

  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: modelParts.join("-"),
    noMatch: false,
    score: 100,
    matchType: "规则生成"
  }
}

function generateCheckValveCandidate(input) {
  const tokens = tokenize(input)
  if (tokens.length < 3) return null

  const match = String(tokens[0] || "").match(/^AP64([A-Z]*)$/)
  if (!match) return null

  const values = connectionValues(tokens, 1).slice(0, 2)
  if (values.length !== 2) return null

  const suffix = match[1] || ""
  const material = /H/.test(suffix) ? "H" : "S"

  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: ["VUCV", material, ...values].join("-"),
    noMatch: false,
    score: 100,
    matchType: "规则生成"
  }
}

function generateAptechCandidate(input) {
  return (
    manualReviewCandidate(input)
    || generateKt9Candidate(input)
    || generateRegulatorCandidate(input)
    || generateAptechDiaphragmCandidate(input)
    || generateVacuumGeneratorCandidate(input)
    || generateExcessFlowSwitchCandidate(input)
    || generateCheckValveCandidate(input)
  )
}

module.exports = {
  generateAptechCandidate,
  normalizeModelText,
  regulatorFuzzyBlockReason
}
