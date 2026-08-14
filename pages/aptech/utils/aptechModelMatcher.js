const searchMappings = require("./aptechSearchDatabase")
const { generateAptechCandidate, regulatorFuzzyBlockReason } = require("./aptechRuleGenerator")
const { normalizeAptechTarget } = require("./aptechTargetCorrections")
const { tokenizeAptechModel } = require("./aptechTokenizer")
const { seriesConfirmation, unconfirmedOptionTokens } = require("./aptechSeriesConfirmation")
const { auditGeneratedAptechCandidate } = require("./aptechStructuredParser")

const OCR_GROUPS = [
  ["0", "O", "Q"],
  ["1", "I", "L"],
  ["2", "Z"],
  ["5", "S"],
  ["6", "G"],
  ["8", "B"]
]

const DIAPHRAGM_CONNECTION = /^(?:F|M|T|I)V\d+$|^TW\d+$|^MV\d+$|^FV\d+$/

function normalizeText(value) {
  const raw = String(value || "")
  const normalized = typeof raw.normalize === "function" ? raw.normalize("NFKC") : raw
  return normalized
    .toUpperCase()
    .replace(/[‐‑‒–—―−﹘﹣－_]/g, "-")
    .replace(/[×✕✖＊*]/g, "X")
    .replace(/[，、；;|]+/g, "-")
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function compactText(value) {
  return normalizeText(value).replace(/[^A-Z0-9]/g, "")
}

function normalizedTokens(value) {
  const raw = String(value || "")
  const normalized = typeof raw.normalize === "function" ? raw.normalize("NFKC") : raw
  return normalized
    .toUpperCase()
    .replace(/[‐‑‒–—―−﹘﹣－_]/g, "-")
    .replace(/[×✕✖＊*]/g, "X")
    .replace(/[，、；;|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
}

function sizeStrippedAliases(value) {
  const tokens = normalizedTokens(value)
  const aliases = []

  if (tokens[tokens.length - 1] === "INCH") {
    const withoutInch = tokens.slice(0, -1)
    if (withoutInch.length) aliases.push(compactText(withoutInch.join(" ")))
    if (/^\d+(?:\/\d+)?$/.test(withoutInch[withoutInch.length - 1] || "")) {
      aliases.push(compactText(withoutInch.slice(0, -1).join(" ")))
    }
  } else if (/^\d+(?:\/\d+)?(?:\")?$/.test(tokens[tokens.length - 1] || "")) {
    aliases.push(compactText(tokens.slice(0, -1).join(" ")))
  }

  if (/^PS\d+$/i.test(tokens[tokens.length - 1] || "")) {
    aliases.push(compactText(tokens.slice(0, -1).join(" ")))
  }

  return [...new Set(aliases.filter(Boolean))]
}

function firstToken(value) {
  return tokenizeAptechModel(value)[0] || normalizedTokens(value)[0] || ""
}

function diaphragmGroup(value) {
  const token = firstToken(value).replace(/^WB-/, "")
  if (/^(?:AP|AZ)30/.test(token)) return "DIAPHRAGM_AP30"
  if (/^(?:AP|AZ)35/.test(token)) return "DIAPHRAGM_AP35"
  if (/^(?:AP|AZ)36/.test(token)) return "DIAPHRAGM_AP36"
  if (/^(?:AP|AZ)46/.test(token)) return "DIAPHRAGM_AP46"
  if (/^(?:AP|AZ)(?:44|45)/.test(token)) return "DIAPHRAGM_AP45"
  if (/^(?:AP|AZ)37|^AZ96/.test(token)) return "DIAPHRAGM_AP37"
  if (/^(?:AP|AZ)(?:38|39)/.test(token)) return "DIAPHRAGM_AP38"
  if (/^(?:AP|AZ)31/.test(token)) return "DIAPHRAGM_AP31"
  if (/^(?:AP|AZ)(?:32|40)|^(?:AP|AZ)4141/.test(token)) return "DIAPHRAGM_AP40"
  if (/^(?:AP|AZ)41/.test(token)) return "DIAPHRAGM_AP41"
  return ""
}

function diaphragmHardFieldsMatch(query, sourceModel) {
  const queryTokens = tokenizeAptechModel(query)
  const sourceTokens = tokenizeAptechModel(sourceModel)
  if (queryTokens.includes("VS") !== sourceTokens.includes("VS")) return false

  const queryConnections = queryTokens.filter((token) => DIAPHRAGM_CONNECTION.test(token))
  if (!queryConnections.length) return true

  const sourceConnections = sourceTokens.filter((token) => DIAPHRAGM_CONNECTION.test(token))
  return queryConnections.length === sourceConnections.length
    && queryConnections.every((token, index) => token === sourceConnections[index])
}

function normalizeVigourDisplayModel(value, sourceModel) {
  const corrected = normalizeAptechTarget(value, sourceModel)
  const parts = String(corrected || "").split("-")
  if (
    /^VDV\d+UC/.test(parts[0] || "") &&
    ["PC", "PO", "M"].includes(parts[1]) &&
    parts[2] === "A"
  ) {
    return [parts[0], parts[1], ...parts.slice(3)].join("-")
  }
  return corrected
}

function targetFamily(value) {
  const model = String(value || "")
  if (!model) return "NO_MATCH"
  if (model.startsWith("VSR-")) return "VSR"
  if (model.startsWith("VDV")) return "VDV"
  if (model.startsWith("VVG")) return "VVG"
  if (model.startsWith("VEFS")) return "VEFS"
  if (model.startsWith("VUCV")) return "VUCV"
  return "OTHER"
}

function sourceSeriesToken(value) {
  return firstToken(value).replace(/^WB-/, "")
}

function isStructuredApAzModel(value) {
  return /^(?:AP|AZ)\d{3,5}[A-Z]*$/.test(sourceSeriesToken(value))
}

function apAz1200Policy(candidate) {
  const tokens = tokenizeAptechModel(candidate.sourceModel)
  const source = tokens[0] || ""
  const match = source.match(/^(?:AP|AZ)(12\d{2})/)
  const number = match ? Number(match[1]) : 0
  const supportedNumbers = new Set([1202, 1206, 1210, 1215, 1225])
  const hrNumbers = new Set([1210, 1215, 1225])

  if (!supportedNumbers.has(number)) {
    return {
      policyLevel: "blocked",
      copySafe: false,
      reviewNote: "该 AP/AZ1200 出口压力代码尚未确认，禁止作为确定型号"
    }
  }

  if (tokens.includes("FC")) {
    if (tokens.includes("HR") || tokens.includes("HF")) {
      return {
        policyLevel: "blocked",
        copySafe: false,
        reviewNote: "FC 与 HR/HF 是目录不允许组合，禁止作为确定型号"
      }
    }
    if (![1210, 1215].includes(number)) {
      return {
        policyLevel: "blocked",
        copySafe: false,
        reviewNote: "该出口压力与 FC 是目录不允许组合，禁止作为确定型号"
      }
    }
    const processConnections = tokens.filter((token) => DIAPHRAGM_CONNECTION.test(token)).slice(0, 2)
    if (processConnections.length < 2 || processConnections.some((token) => !/(?:8|12)$/.test(token))) {
      return {
        policyLevel: "blocked",
        copySafe: false,
        reviewNote: "FC 仅允许 1/2 或 3/4 英寸接口，禁止作为确定型号"
      }
    }
  }

  if (tokens.includes("HR") && !hrNumbers.has(number)) {
    return {
      policyLevel: "blocked",
      copySafe: false,
      reviewNote: "该出口压力与 HR 是目录不允许组合，禁止作为确定型号"
    }
  }

  const unknownTokens = unconfirmedOptionTokens(candidate.sourceModel, { allowPs25: number === 1225 })
  if (unknownTokens.length) {
    return {
      policyLevel: "candidate",
      copySafe: false,
      reviewNote: `未确认扩展字段：${unknownTokens.join("、")}`
    }
  }

  return {
    policyLevel: "confirmed",
    copySafe: true,
    reviewNote: ""
  }
}

function policyForCandidate(candidate, resultLevel) {
  if (!candidate || candidate.noMatch || !candidate.vigourModel) {
    return {
      policyLevel: "manual",
      copySafe: false,
      reviewNote: "无可靠 VIGOUR 候选，需人工确认"
    }
  }

  if (resultLevel === "fuzzy" || resultLevel === "uncertain") {
    return {
      policyLevel: "fuzzy",
      copySafe: false,
      reviewNote: "模糊候选不能作为确定对照"
    }
  }

  const source = sourceSeriesToken(candidate.sourceModel)
  const family = targetFamily(candidate.vigourModel)

  if (/^(?:AP|AZ)12(?:0[1-9]|1\d|2[0-5])/.test(source) && family === "VSR") {
    return apAz1200Policy(candidate)
  }

  const confirmation = seriesConfirmation(candidate.sourceModel, candidate.vigourModel)
  if (confirmation) return confirmation

  return {
    policyLevel: "candidate",
    copySafe: false,
    reviewNote: "标准候选，字段或非标内容需确认"
  }
}

function withCandidatePolicy(candidate, resultLevel, auditSourceModel = "") {
  const shouldAudit = candidate
    && candidate.vigourModel
    && resultLevel !== "fuzzy"
    && resultLevel !== "uncertain"
  const parseAudit = shouldAudit
    ? auditGeneratedAptechCandidate(auditSourceModel || candidate.sourceModel, candidate.vigourModel)
    : null
  const basePolicy = policyForCandidate(candidate, resultLevel)

  if (!parseAudit) {
    return {
      ...candidate,
      ...basePolicy
    }
  }

  const parseNotes = [...parseAudit.blockingIssues, ...parseAudit.reviewIssues]
  const reviewNote = [basePolicy.reviewNote, ...parseNotes].filter(Boolean).join("；")
  let policy = basePolicy

  if (parseAudit.blockingIssues.length && !["manual", "fuzzy"].includes(basePolicy.policyLevel)) {
    policy = { policyLevel: "blocked", copySafe: false, reviewNote }
  } else if (
    parseAudit.reviewIssues.length
    && basePolicy.policyLevel === "confirmed"
  ) {
    policy = { policyLevel: "candidate", copySafe: false, reviewNote }
  } else if (parseNotes.length && !basePolicy.copySafe) {
    policy = { ...basePolicy, reviewNote }
  }

  return {
    ...candidate,
    ...(parseAudit.blockingIssues.length
      ? { vigourModel: "", noMatch: true, matchType: "需人工确认" }
      : {}),
    parseAudit,
    ...policy
  }
}

function statusForPolicy(defaultStatus, candidate) {
  if (!candidate) return defaultStatus
  if (candidate.policyLevel === "confirmed") return defaultStatus
  if (candidate.policyLevel === "candidate") return "标准候选，字段需确认"
  if (candidate.policyLevel === "blocked") return "候选需人工确认"
  if (candidate.policyLevel === "manual") return "需人工确认"
  return defaultStatus
}

function splitInput(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .split(/[\n\t,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function sameOcrGroup(a, b) {
  return OCR_GROUPS.some((group) => group.includes(a) && group.includes(b))
}

function editDistance(a, b) {
  const left = compactText(a)
  const right = compactText(b)
  const rows = Array.from({ length: left.length + 1 }, () => [])

  for (let i = 0; i <= left.length; i += 1) rows[i][0] = i
  for (let j = 0; j <= right.length; j += 1) rows[0][j] = j

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = left[i - 1] === right[j - 1]
        ? 0
        : (sameOcrGroup(left[i - 1], right[j - 1]) ? 0.3 : 1)
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + substitution
      )
    }
  }

  return rows[left.length][right.length]
}

function similarity(query, candidate) {
  const queryCompact = compactText(query)
  const candidateCompact = compactText(candidate)
  const longest = Math.max(queryCompact.length, candidateCompact.length, 1)
  let score = 1 - editDistance(queryCompact, candidateCompact) / longest

  const prefixLength = Math.min(4, queryCompact.length, candidateCompact.length)
  if (prefixLength >= 2 && queryCompact.slice(0, prefixLength) === candidateCompact.slice(0, prefixLength)) {
    score += 0.08
  }
  if (
    queryCompact.length >= 5 &&
    (queryCompact.includes(candidateCompact) || candidateCompact.includes(queryCompact))
  ) {
    score += 0.06
  }
  return Math.max(0, Math.min(1, score))
}

function makeSearchRows() {
  const seen = {}
  const rows = []

  searchMappings.forEach((item) => {
    const brand = item[0]
    const sourceModel = item[1]
    const vigourModel = item[2] || ""
    const noMatch = item[3] === 1
    const key = [brand, sourceModel, vigourModel].join("|")
    if (seen[key]) return
    seen[key] = true
    rows.push({
      brand,
      sourceModel,
      vigourModel,
      noMatch,
      normalized: normalizeText(sourceModel),
      compact: compactText(sourceModel),
      aliases: sizeStrippedAliases(sourceModel),
      diaphragmGroup: diaphragmGroup(sourceModel)
    })
  })

  return rows
}

const SEARCH_ROWS = makeSearchRows()

function presentCandidate(row, score, matchType, resultLevel, auditSourceModel) {
  return withCandidatePolicy({
    brand: row.brand,
    sourceModel: row.sourceModel,
    vigourModel: normalizeVigourDisplayModel(row.vigourModel, row.sourceModel),
    noMatch: row.noMatch,
    score: Math.round(score * 100),
    matchType
  }, resultLevel, auditSourceModel)
}

function matchOne(input) {
  const normalized = normalizeText(input)
  const compact = compactText(input)
  const generated = generateAptechCandidate(input)

  if (generated) {
    const candidate = withCandidatePolicy(generated, "generated")
    return {
      input,
      status: generated.noMatch ? "需人工确认" : statusForPolicy("规则生成候选", candidate),
      level: "generated",
      copySafe: candidate.copySafe,
      candidates: [candidate]
    }
  }

  const exact = SEARCH_ROWS.filter((row) => row.sourceModel === input)
  if (exact.length) {
    const candidates = exact.slice(0, 5).map((row) => presentCandidate(row, 1, "精确匹配", "exact", input))
    return {
      input,
      status: statusForPolicy("精确匹配", candidates[0]),
      level: "exact",
      copySafe: Boolean(candidates[0] && candidates[0].copySafe),
      candidates
    }
  }

  const normalizedMatches = SEARCH_ROWS.filter((row) => row.normalized === normalized)
  if (normalizedMatches.length) {
    const candidates = normalizedMatches.slice(0, 5).map((row) => presentCandidate(row, 1, "格式归一化", "normalized", input))
    return {
      input,
      status: statusForPolicy("格式归一化匹配", candidates[0]),
      level: "normalized",
      copySafe: Boolean(candidates[0] && candidates[0].copySafe),
      candidates
    }
  }

  const compactMatches = SEARCH_ROWS.filter((row) => row.compact === compact)
  if (compactMatches.length) {
    const candidates = compactMatches.slice(0, 5).map((row) => presentCandidate(row, 0.98, "符号忽略", "normalized", input))
    return {
      input,
      status: statusForPolicy("符号忽略匹配", candidates[0]),
      level: "normalized",
      copySafe: Boolean(candidates[0] && candidates[0].copySafe),
      candidates
    }
  }

  const aliasMatches = SEARCH_ROWS.filter((row) => row.aliases.includes(compact))
  if (aliasMatches.length) {
    const candidates = aliasMatches.slice(0, 5).map((row) => presentCandidate(row, 0.99, "规则归一化", "normalized", input))
    return {
      input,
      status: statusForPolicy("规则归一化匹配", candidates[0]),
      level: "normalized",
      copySafe: Boolean(candidates[0] && candidates[0].copySafe),
      candidates
    }
  }

  const regulatorBlockReason = regulatorFuzzyBlockReason(input)
  if (regulatorBlockReason) {
    return {
      input,
      status: regulatorBlockReason,
      level: "missing",
      copySafe: false,
      candidates: []
    }
  }

  if (isStructuredApAzModel(input)) {
    return {
      input,
      status: "订货号未通过目录或规则验证，已禁止跨型号模糊匹配",
      level: "missing",
      copySafe: false,
      candidates: []
    }
  }

  const inputDiaphragmGroup = diaphragmGroup(input)
  if (inputDiaphragmGroup) {
    const diaphragmFuzzy = SEARCH_ROWS
      .filter((row) => row.diaphragmGroup === inputDiaphragmGroup)
      .filter((row) => diaphragmHardFieldsMatch(input, row.sourceModel))
      .map((row) => ({ row, score: similarity(input, row.sourceModel) }))
      .filter((item) => item.score >= 0.62)
      .sort((a, b) => b.score - a.score || a.row.sourceModel.localeCompare(b.row.sourceModel))
      .slice(0, 5)

    if (diaphragmFuzzy.length) {
      const level = diaphragmFuzzy[0].score >= 0.82 ? "fuzzy" : "uncertain"
      const candidates = diaphragmFuzzy.map(({ row, score }) => presentCandidate(row, score, "同系列模糊候选", level))
      return {
        input,
        status: diaphragmFuzzy[0].score >= 0.82 ? "同系列可能匹配" : "同系列低置信度候选",
        level,
        copySafe: false,
        candidates
      }
    }

    return {
      input,
      status: "隔膜阀同系列未找到可靠候选",
      level: "missing",
      candidates: []
    }
  }

  const sourceToken = sourceSeriesToken(input)
  if (!/^(?:AP|AZ)/.test(sourceToken) && !/^WB-/.test(firstToken(input))) {
    return {
      input,
      status: "数据库中未找到",
      level: "missing",
      candidates: []
    }
  }

  const fuzzy = SEARCH_ROWS
    .map((row) => ({ row, score: similarity(input, row.sourceModel) }))
    .filter((item) => item.score >= 0.62)
    .sort((a, b) => b.score - a.score || a.row.sourceModel.localeCompare(b.row.sourceModel))
    .slice(0, 5)

  if (!fuzzy.length) {
    return {
      input,
      status: "数据库中未找到",
      level: "missing",
      candidates: []
    }
  }

  return {
    input,
    status: fuzzy[0].score >= 0.82 ? "可能匹配" : "低置信度候选",
    level: fuzzy[0].score >= 0.82 ? "fuzzy" : "uncertain",
    copySafe: false,
    candidates: fuzzy.map(({ row, score }) => presentCandidate(row, score, "模糊候选", fuzzy[0].score >= 0.82 ? "fuzzy" : "uncertain"))
  }
}

function matchModels(value) {
  return splitInput(value).map(matchOne)
}

module.exports = {
  normalizeText,
  compactText,
  splitInput,
  similarity,
  matchOne,
  matchModels
}
