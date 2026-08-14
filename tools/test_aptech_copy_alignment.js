const fs = require("fs")
const { saveToolState, clearToolState } = require("../pages/aptech/utils/sessionState")

let pageDefinition = null
let clipboard = ""

global.Page = (definition) => {
  pageDefinition = definition
}

global.wx = {
  setClipboardData({ data, success }) {
    clipboard = data
    if (success) success()
  },
  showToast() {},
  showModal({ success }) {
    success({ confirm: true })
  },
  pageScrollTo() {}
}

const { aptechResultKind, presentCandidateUi, buildMatchState } = require("../pages/aptech/index.js")

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: ${JSON.stringify({ actual, expected })}`)
  }
}

if (typeof presentCandidateUi !== "function") {
  throw new Error("APTech candidate presentation helper is required")
}

const generatedCandidateUi = presentCandidateUi({
  matchType: "规则生成",
  score: 100,
  copySafe: false
})
assertEqual(generatedCandidateUi.scoreText, "规则完整 · 建议核实", "generated 100% score wording")
assertEqual(generatedCandidateUi.scoreTone, "review", "generated 100% score tone")
assertEqual(generatedCandidateUi.actionText, "建议核实", "generated candidate action wording")

const verifiedCandidateUi = presentCandidateUi({
  matchType: "精确匹配",
  score: 100,
  copySafe: true
})
assertEqual(verifiedCandidateUi.scoreText, "精确匹配 · 100%", "verified score wording")
assertEqual(verifiedCandidateUi.scoreTone, "verified", "verified score tone")
assertEqual(verifiedCandidateUi.actionText, "复制", "verified action wording")

const confirmedState = buildMatchState("AP1210S 2PW FV8 MV8 HR")
assertEqual(confirmedState.results[0].kind, "exact", "confirmed complete rule must render green")
assertEqual(confirmedState.summary.exact, 1, "confirmed complete rule exact summary")
if (!confirmedState.results[0].candidates.every((candidate) => candidate.candidateKey)) {
  throw new Error("APTech candidates require stable unique keys")
}

const pendingState = buildMatchState("AP1406TSHA 2PW TW4 TW4")
assertEqual(pendingState.results[0].kind, "candidate", "unconfirmed series must remain amber")
assertEqual(pendingState.summary.candidate, 1, "unconfirmed series candidate summary")

const restoredContext = {
  data: JSON.parse(JSON.stringify(pageDefinition.data)),
  setData(patch) {
    Object.assign(this.data, patch)
  }
}
saveToolState("aptech", {
  inputText: "AP1210S 2PW FV8 MV8 HR",
  results: [{
    input: "AP1210S 2PW FV8 MV8 HR",
    status: "候选需人工确认",
    candidates: [{
      sourceModel: "AP1210S 2PW FV8 MV8 HR",
      vigourModel: "VSR-210UCSLV-200-7-2P-FV8-MV8-VS",
      copySafe: false,
      policyLevel: "blocked",
      reviewNote: "旧规则提示"
    }],
    kind: "candidate",
    kindText: "待确认"
  }],
  visibleResults: [],
  summary: { total: 1, exact: 0, candidate: 1, missing: 0 },
  resultFilter: "all",
  resultStale: false,
  isExample: false,
  engineeringNotesOpen: false
})
pageDefinition.onLoad.call(restoredContext, {})
assertEqual(restoredContext.data.results[0].kind, "exact", "restored results must use current safety rules")
assertEqual(
  restoredContext.data.results[0].candidates[0].copySafe,
  true,
  "restored confirmed model must become copy safe"
)
clearToolState("aptech")

const results = [
  {
    input: "AP4000SM 2PW MV6 MV6",
    status: "精确匹配",
    candidates: [{
      sourceModel: "AP4000SM 2PW MV6 MV6",
      vigourModel: "VDV40UCSLV-PC-A-MV6-MV6-P",
      copySafe: true,
      reviewNote: ""
    }]
  },
  {
    input: "AP4000SM 2PW MV6 MV8",
    status: "可能匹配",
    candidates: [{
      sourceModel: "AP4000SM 2PW MV6 MV6",
      vigourModel: "VDV40UCSLV-PC-A-MV6-MV6-P",
      copySafe: false,
      reviewNote: "模糊候选不能作为确定对照"
    }]
  },
  {
    input: "UNKNOWN-APTECH-MODEL",
    status: "数据库中未找到",
    candidates: []
  }
]

results.forEach((result) => {
  result.kind = aptechResultKind(result)
})

const context = {
  data: { results },
  copyText: pageDefinition.copyText
}

pageDefinition.copyAllVigour.call(context)
const salesLines = clipboard.split("\n")
assertEqual(salesLines.length, 3, "sales rows")
assertEqual(salesLines[0], "VDV40UCSLV-PC-A-MV6-MV6-P\t", "exact sales row")
assertEqual(
  salesLines[1],
  "\t待确认｜模糊候选不能作为确定对照",
  "candidate sales row"
)
assertEqual(salesLines[2], "\t未识别型号｜请检查品牌和订购号", "missing sales row")
salesLines.forEach((line, index) => {
  if (line.split("\t").length !== 2) {
    throw new Error(`APTech sales row ${index + 1} must contain exactly two columns: ${JSON.stringify(line)}`)
  }
})

pageDefinition.copyAllMappings.call(context)
const fullLines = clipboard.split("\n")
assertEqual(fullLines.length, 4, "header plus full rows")
assertEqual(
  fullLines[0],
  "原始型号\t状态\tAPTech候选\tVIGOUR型号\t复制状态\t复核说明",
  "full mapping header"
)

const filteredContext = {
  data: { results, visibleResults: results, resultFilter: "all", resultStale: false },
  setData(patch) {
    Object.assign(this.data, patch)
  },
  copyText: pageDefinition.copyText
}
pageDefinition.setResultFilter.call(filteredContext, { currentTarget: { dataset: { filter: "candidate" } } })
assertEqual(filteredContext.data.visibleResults.length, 1, "candidate screen filter")
pageDefinition.copyAllVigour.call(filteredContext)
assertEqual(clipboard.split("\n").length, 3, "screen filter cannot change sales rows")

const wxml = fs.readFileSync("pages/aptech/index.wxml", "utf8")
for (const contract of [
  'bindtap="runMatch"',
  "visibleResults",
  'bindtap="copyAllVigour"',
  'bindtap="copyAllMappings"',
  "复制销售结果",
  "复制完整对照",
  'wx:key="candidateKey"'
]) {
  if (!wxml.includes(contract)) throw new Error(`missing APTech UI contract: ${contract}`)
}

const wxss = fs.readFileSync("pages/aptech/index.wxss", "utf8")
if (!/\.mapping-card\s*\{[^}]*flex-direction:\s*column[^}]*align-items:\s*stretch/s.test(wxss)) {
  throw new Error("APTech mapping cards must stack long models above their actions to prevent overlap")
}
if (!/\.mapping-card\s*>\s*view\s*\{[^}]*width:\s*100%/s.test(wxss)) {
  throw new Error("APTech mapping model rows must own the full card width")
}
if (!wxml.includes("candidate-score--{{candidate.scoreTone}}") || !wxml.includes("{{candidate.scoreText}}")) {
  throw new Error("APTech score display must use safety-aware presentation data")
}
if (!wxml.includes("{{candidate.actionText}}")) {
  throw new Error("APTech mapping action must use the candidate safety wording")
}
if (!/\.candidate-score--verified\s*\{[^}]*color:\s*var\(--color-success\)/s.test(wxss)) {
  throw new Error("verified APTech scores must use the shared success green")
}
if (!/\.candidate-score--review\s*\{[^}]*color:\s*var\(--color-warning\)/s.test(wxss)) {
  throw new Error("rule-generated APTech scores must retain the shared review color")
}
if (wxss.includes("SFMono-Regular") || wxss.includes("monospace")) {
  throw new Error("APTech inputs and model rows must use the same system font as the rest of the interface")
}
if (!/\.aptech-page\s+\.ui-result-code\s*\{[^}]*font-family:\s*inherit/s.test(wxss)) {
  throw new Error("APTech VIGOUR result codes must override the shared monospace presentation")
}

console.log("APTech copy alignment contract passed")
