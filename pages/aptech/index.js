const { matchModels } = require("./utils/aptechModelMatcher")
const { filterBatchResults, hasMeaningfulState } = require("../../utils/uiPresentation")
const { saveToolState, readToolState, clearToolState } = require("./utils/sessionState")

const exampleText = [
  "AP4000SM 2PW MV6 MV6",
  "AZ3550S 2PW FV4 FV4 IPC",
  "WB-AP4000SM 2PW MV6 MV6"
].join("\n")

const mappingHeader = "原始型号\t状态\tAPTech候选\tVIGOUR型号\t复制状态\t复核说明"

function aptechResultKind(result) {
  const candidate = result && result.candidates && result.candidates[0]
  if (!candidate) return "missing"
  return candidate.copySafe ? "exact" : "candidate"
}

function aptechSalesLine(result) {
  const candidate = result && result.candidates && result.candidates[0]
  if (!candidate) return ["", "未识别型号｜请检查品牌和订购号"].join("\t")
  if (candidate.copySafe && candidate.vigourModel) return [candidate.vigourModel, ""].join("\t")

  const reviewReason = candidate.reviewNote
    || (candidate.vigourModel ? "人工复核" : "暂无 VIGOUR 候选型号｜人工复核")
  return ["", `待确认｜${reviewReason}`].join("\t")
}

function aptechMappingRow(result) {
  const candidate = result && result.candidates && result.candidates[0]
  if (!candidate) {
    return [
      result.input,
      result.status || "数据库中未找到",
      "数据库中未找到",
      "暂时没有匹配产品，请联系工厂确认",
      "不可复制",
      "请检查品牌和订购号"
    ].join("\t")
  }

  return [
    result.input,
    result.status || "",
    candidate.sourceModel || "",
    candidate.vigourModel || "暂时没有匹配产品，请联系工厂确认",
    candidate.copySafe ? "可复制" : "需确认",
    candidate.reviewNote || (candidate.copySafe ? "" : "人工复核")
  ].join("\t")
}

function emptySummary() {
  return { total: 0, exact: 0, candidate: 0, missing: 0 }
}

function presentCandidateUi(candidate = {}) {
  const verified = Boolean(candidate.copySafe)
  const scoreText = verified
    ? `${candidate.matchType} · ${candidate.score}%`
    : candidate.score === 100
      ? "规则完整 · 建议核实"
      : `${candidate.matchType} · ${candidate.score}% · 建议核实`

  return {
    ...candidate,
    scoreText,
    scoreTone: verified ? "verified" : "review",
    actionText: verified ? "复制" : "建议核实"
  }
}

function presentResults(results) {
  return results.map((result, index) => {
    const kind = aptechResultKind(result)
    const resultKey = `${index}-${result.input}`
    return {
      ...result,
      candidates: (result.candidates || []).map((candidate, candidateIndex) => ({
        ...presentCandidateUi(candidate),
        candidateKey: [
          resultKey,
          candidateIndex,
          candidate.sourceModel || "",
          candidate.vigourModel || ""
        ].join("|")
      })),
      resultKey,
      kind,
      kindText: kind === "exact" ? "精确" : kind === "candidate" ? "待确认" : "未识别"
    }
  })
}

function buildMatchState(inputText, resultFilter = "all") {
  const text = String(inputText || "")
  const safeFilter = ["all", "exact", "candidate", "missing"].includes(resultFilter)
    ? resultFilter
    : "all"
  if (!text.trim()) {
    return {
      results: [],
      visibleResults: [],
      summary: emptySummary(),
      resultFilter: safeFilter
    }
  }

  const results = presentResults(matchModels(text))
  const summary = results.reduce((accumulator, result) => {
    accumulator[result.kind] += 1
    return accumulator
  }, emptySummary())
  summary.total = results.length

  return {
    results,
    visibleResults: filterBatchResults(results, safeFilter),
    summary,
    resultFilter: safeFilter
  }
}

Page({
  data: {
    inputText: "",
    results: [],
    visibleResults: [],
    summary: emptySummary(),
    resultFilter: "all",
    resultStale: false,
    isMatching: false,
    isExample: false,
    engineeringNotesOpen: false
  },

  onLoad(options = {}) {
    const query = options.query ? decodeURIComponent(options.query) : ""
    const restored = query ? null : readToolState("aptech")
    if (restored) {
      const hadMatchedResults = restored.hasMatched === true
        || (Array.isArray(restored.results) && restored.results.length > 0)
      this.setData({
        inputText: restored.inputText || "",
        ...buildMatchState(hadMatchedResults ? restored.inputText : "", restored.resultFilter),
        resultStale: false,
        isMatching: false,
        isExample: Boolean(restored.isExample),
        engineeringNotesOpen: Boolean(restored.engineeringNotesOpen)
      })
      return
    }

    if (query || options.mode === "batch") {
      this.setData({
        inputText: query,
        results: [],
        visibleResults: [],
        summary: emptySummary(),
        resultFilter: "all"
      })
    }
  },

  onHide() {
    saveToolState("aptech", {
      inputText: this.data.inputText,
      hasMatched: Boolean(this.data.results.length),
      resultFilter: this.data.resultFilter,
      isExample: this.data.isExample,
      engineeringNotesOpen: this.data.engineeringNotesOpen
    })
  },

  onUnload() {
    this.onHide()
  },

  onInput(event) {
    this.setData({
      inputText: event.detail.value,
      resultStale: Boolean(this.data.results.length),
      isExample: false
    })
  },

  loadExample() {
    this.setData({
      inputText: exampleText,
      results: [],
      visibleResults: [],
      summary: emptySummary(),
      resultFilter: "all",
      resultStale: false,
      isExample: true
    })
  },

  clearAll() {
    const hasContent = hasMeaningfulState({
      inputText: this.data.inputText,
      results: this.data.results
    })
    if (!hasContent) {
      this.performClear()
      return
    }

    wx.showModal({
      title: "确认重置",
      content: "将清空当前输入和全部匹配结果。",
      confirmColor: "#ed2b2e",
      success: (result) => {
        if (result.confirm) this.performClear()
      }
    })
  },

  performClear() {
    clearToolState("aptech")
    this.setData({
      inputText: "",
      results: [],
      visibleResults: [],
      summary: emptySummary(),
      resultFilter: "all",
      resultStale: false,
      isExample: false,
      engineeringNotesOpen: false
    })
  },

  runMatch() {
    if (!String(this.data.inputText || "").trim()) {
      wx.showToast({ title: "请先输入型号", icon: "none" })
      return
    }

    this.setData({ isMatching: true })
    const matchState = buildMatchState(this.data.inputText, "all")

    this.setData({
      ...matchState,
      resultStale: false,
      isMatching: false
    })
    if (matchState.results.length) wx.pageScrollTo({ selector: ".aptech-result-anchor", duration: 260 })
  },

  setResultFilter(event) {
    const resultFilter = event.currentTarget.dataset.filter || "all"
    this.setData({
      resultFilter,
      visibleResults: filterBatchResults(this.data.results, resultFilter)
    })
  },

  copyAllVigour() {
    if (this.data.resultStale) {
      wx.showToast({ title: "请先重新匹配", icon: "none" })
      return
    }
    const lines = this.data.results.map(aptechSalesLine)
    this.copyText(lines.join("\n"), "已复制销售结果")
  },

  copyAllMappings() {
    if (this.data.resultStale) {
      wx.showToast({ title: "请先重新匹配", icon: "none" })
      return
    }
    const lines = [mappingHeader].concat(this.data.results.map(aptechMappingRow))
    this.copyText(lines.join("\n"), "已复制完整对照")
  },

  copyModel(event) {
    const model = event.currentTarget.dataset.model
    const copySafe = event.currentTarget.dataset.copySafe
    if (!model) return
    if (copySafe !== "true" && copySafe !== true) {
      wx.showToast({ title: "候选需人工确认", icon: "none" })
      return
    }
    this.copyText(model, "型号已复制")
  },

  toggleEngineeringNotes() {
    this.setData({ engineeringNotesOpen: !this.data.engineeringNotesOpen })
  },

  copyText(data, title) {
    if (!data) return
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title, icon: "success" })
      }
    })
  }
})

module.exports = {
  mappingHeader,
  aptechResultKind,
  aptechSalesLine,
  aptechMappingRow,
  presentCandidateUi,
  buildMatchState
}
