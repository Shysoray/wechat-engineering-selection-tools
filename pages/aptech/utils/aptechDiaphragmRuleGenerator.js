const { tokenizeAptechModel } = require("./aptechTokenizer")
const { getAp31Vdv38Rule } = require("./aptechTargetCorrections")
const {
  APTECH_TO_VIGOUR_FLOW,
  expectedVigourConnection
} = require("./vigourCatalogConstraints")

const PORT_TOKEN = /^(?:2P(?:W[ABC]?)?|3PW[D-J]?|4PW[K-N])$/
const CONNECTION_TOKEN = /^(?:F|M|T|I)V\d+$|^TW\d+$|^MV\d+$|^FV\d+$/

const CIRCUIT_CODES = {
  ...APTECH_TO_VIGOUR_FLOW,
  "3PW": ""
}

const DIAPHRAGM_SERIES_NUMBERS = Object.freeze({
  VDV33_PC: new Set([3000, 3002, 3004, 3080]),
  VDV40_PC: new Set([3200, 3202, 3260, 3262, 4000, 4141]),
  VDV32_PC: new Set([3540, 3542, 3571]),
  VDV32_PO: new Set([3550, 3580]),
  VDV42_PC: new Set([4540, 4542, 4571]),
  VDV42_PO: new Set([4550, 4580]),
  VDV32_M: new Set([3600, 3650, 3652, 3657, 3659]),
  VDV42_M: new Set([4600, 4625, 4650, 4652, 4657, 4659])
})

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
  const match = String(token || "").match(/^(AP|AZ)(\d{4,5})([A-Z0-9]*)$/)
  if (!match) return null

  return {
    brand: match[1],
    number: Number(match[2].slice(0, 4)),
    suffix: match[3] || ""
  }
}

function seriesRule(info) {
  const number = info.number
  const ap31Rule = getAp31Vdv38Rule(info.brand, number)

  if (ap31Rule) {
    return { series: "VDV38UC", ...ap31Rule }
  }
  if ([3700, 3708].includes(number)) {
    return { series: "VDV37UC", action: "PC", fixedPurgeLayout: true }
  }
  if ([3800, 3900].includes(number)) {
    return { series: "VDV37UC", action: "M", fixedPurgeLayout: true, lockout: number === 3900 }
  }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV33_PC.has(number)) return { series: "VDV33UC", action: "PC" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV40_PC.has(number)) return { series: "VDV40UC", action: "PC" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV32_PC.has(number)) return { series: "VDV32UC", action: "PC" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV32_PO.has(number)) return { series: "VDV32UC", action: "PO" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV42_PC.has(number)) return { series: "VDV42UC", action: "PC" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV42_PO.has(number)) return { series: "VDV42UC", action: "PO" }
  if (info.brand === "AP" && number === 3625) return { series: "VDV40UC", action: "M" }
  if (number === 3624) return { series: "VDV33UC", action: "M" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV32_M.has(number)) return { series: "VDV32UC", action: "M" }
  if (DIAPHRAGM_SERIES_NUMBERS.VDV42_M.has(number)) return { series: "VDV42UC", action: "M" }

  return null
}

function portCount(portToken) {
  const match = portToken.match(/^(\d)P/)
  return match ? Number(match[1]) : 0
}

function portValue(token) {
  if (CONNECTION_TOKEN.test(token)) return token
  if (/^(?:FA|FB|FD)$/.test(token)) return "CONN?"
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

  if (values.length === 1 && values[0] === "CONN?" && count === 2) {
    values.push("CONN?")
  }

  return { values, nextIndex: index }
}

function mapPorts(portToken, tokens, startIndex) {
  const circuit = CIRCUIT_CODES[portToken]
  const count = portCount(portToken)
  if (circuit === undefined || !count) return null

  const { values, nextIndex } = takePortValues(tokens, startIndex, count)
  if (values.length !== count) return null

  return {
    circuit,
    values,
    nextIndex
  }
}

function optionParts(tokens, startIndex, suffix) {
  const remainingTokens = tokens.slice(startIndex)
  const flags = {
    vs: remainingTokens.includes("VS"),
    pa: remainingTokens.some((token) => token === "PF" || token === "PA"),
    is: remainingTokens.some((token) => token === "IS" || token === "IPC" || token === "IPO"),
    lo: remainingTokens.some((token) => token === "LO" || token === "LOTOC"),
    r5: /X/.test(suffix),
    r7: /V/.test(suffix)
  }

  return [
    flags.vs ? "VS" : "",
    flags.pa ? "PA" : "",
    flags.lo ? "LO" : "",
    flags.is ? "IS" : "",
    flags.r5 ? "R5" : "",
    flags.r7 ? "R7" : ""
  ].filter(Boolean)
}

function fixedPurgeSelection(tokens, startIndex) {
  const first = tokens[startIndex]
  const second = tokens[startIndex + 1]
  if (first === "00") return { parts: [], nextIndex: startIndex + 1 }
  if (first === "0" && second === "0") return { parts: [], nextIndex: startIndex + 2 }
  if (first === "M0") return { parts: ["P1"], nextIndex: startIndex + 1 }
  if (first === "0B") return { parts: ["P2"], nextIndex: startIndex + 1 }
  if (first === "MB") return { parts: ["P1", "P2"], nextIndex: startIndex + 1 }
  return null
}

function generateFixedPurgeCandidate(input, tokens, info, rule) {
  const { values, nextIndex } = takePortValues(tokens, 1, 2)
  if (values.length !== 2) return null

  const purge = fixedPurgeSelection(tokens, nextIndex)
  if (!purge) return null

  const seriesId = rule.series.replace(/UC$/, "")
  const connections = values.map((connection) => expectedVigourConnection(seriesId, connection))
  const options = optionParts(tokens, purge.nextIndex, info.suffix)
  if (rule.lockout && !options.includes("LO")) {
    const indicatorIndex = options.indexOf("IS")
    options.splice(indicatorIndex < 0 ? options.length : indicatorIndex, 0, "LO")
  }

  return {
    brand: "APTech",
    sourceModel: normalizeModelText(input),
    vigourModel: [`${rule.series}SLV`, rule.action, ...connections, ...purge.parts, ...options, "P"].join("-"),
    noMatch: false,
    score: 100,
    matchType: "规则生成"
  }
}

function optionsWithWorkPressure(options, workPressure) {
  if (!workPressure) return options

  const seatOptions = options.filter((option) => option === "VS")
  const remainingOptions = options.filter((option) => option !== "VS")
  return [...seatOptions, workPressure, ...remainingOptions]
}

function generateAptechDiaphragmCandidate(input) {
  const tokens = tokenize(input)
  if (tokens.length < 4) return null

  const info = modelInfo(tokens[0])
  if (!info) return null

  const rule = seriesRule(info)
  if (!rule) return null

  if (rule.fixedPurgeLayout) {
    return generateFixedPurgeCandidate(input, tokens, info, rule)
  }

  const portIndex = tokens.findIndex((token, index) => index > 0 && PORT_TOKEN.test(token))
  if (portIndex < 0) return null

  const portMapping = mapPorts(tokens[portIndex], tokens, portIndex + 1)
  if (!portMapping) return null

  const options = optionParts(tokens, portMapping.nextIndex, info.suffix)

  const seriesId = rule.series.replace(/UC$/, "")
  const mappedConnections = portMapping.values.map((connection) => (
    expectedVigourConnection(seriesId, connection)
  ))
  const modelParts = [
    `${rule.series}SLV`,
    rule.action,
    ...(portMapping.circuit ? [portMapping.circuit] : []),
    ...mappedConnections,
    ...optionsWithWorkPressure(options, rule.workPressure),
    "P"
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

module.exports = {
  generateAptechDiaphragmCandidate
}
