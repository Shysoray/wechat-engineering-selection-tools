const { normalizeModelText } = require("../../utils/fittingModelSignature")
const { filterBatchResults, hasMeaningfulState } = require("../../utils/uiPresentation")
const { saveToolState, readToolState, clearToolState } = require("../sessionState")
const {
  MAX_BATCH_MODELS,
  splitModelInput,
  compoundInputParts,
  batchInputLimit
} = require("../batchInput")
const {
  defaultSelection,
  allFittingMappings,
  getBrandFields,
  uniqueOptions,
  getDisplayModelLabel,
  modelOptionsForBrand,
  filterMappings,
  getFieldValueText
} = require("../mappingRepository")
const {
  enrichResult,
  salesCopyRecord,
  salesCopyTwoColumnLine,
  resultPresentation,
  classifyExactCandidates
} = require("../resultPolicy")
const {
  exactItemsForInput,
  fuzzyCandidatesForInput,
  buildSearchIndex
} = require("../matchingEngine")

const batchExampleText = [
  "SS-4-VCR-2-GR-VS",
  "SS-8-VCR-6-DM",
  "SS-10-VCR-2-VS"
].join("\n")

function emptyBatchSummary() {
  return { total: 0, exact: 0, candidate: 0, missing: 0 }
}

function safeDecodeQuery(value) {
  try {
    return decodeURIComponent(String(value || ""))
  } catch (error) {
    return String(value || "")
  }
}


function candidateResultKey(resultKey, item, candidateIndex) {
  return [
    resultKey,
    candidateIndex,
    item.brand || "",
    normalizeModelText(item.sourceModel),
    item.vigourModel || item.displayVigourModel || ""
  ].join("|")
}

function batchResultForInput(input, resultKey, searchIndex) {
  const exactItems = exactItemsForInput(input, searchIndex)
    .sort((left, right) => {
      const leftUsable = Boolean(left.vigourModel && !left.noMatch)
      const rightUsable = Boolean(right.vigourModel && !right.noMatch)
      return Number(rightUsable) - Number(leftUsable)
    })
  if (exactItems.length) {
    const candidates = exactItems
      .slice(0, 5)
      .map((item, candidateIndex) => {
        const candidate = enrichResult(item, getBrandFields(item.brand))
        return {
          ...candidate,
          candidateKey: candidateResultKey(resultKey, candidate, candidateIndex)
        }
      })
    const presentation = classifyExactCandidates(candidates)
    return {
      resultKey,
      input,
      kind: "exact",
      ...presentation,
      candidates
    }
  }

  const fuzzyResult = fuzzyCandidatesForInput(input, searchIndex)
  if (fuzzyResult.items.length) {
    return {
      resultKey,
      input,
      kind: "candidate",
      ...resultPresentation("candidate", fuzzyResult.crossSeries ? "跨系列候选" : "模糊候选"),
      candidates: fuzzyResult.items.map(({ item, score }, candidateIndex) => {
        const candidate = enrichResult(item, getBrandFields(item.brand), "candidate")
        return {
          ...candidate,
          candidateKey: candidateResultKey(resultKey, candidate, candidateIndex),
          similarity: `${Math.round(score * 100)}%`,
          matchWarnings: [
            ...candidate.matchWarnings,
            { level: "warning", text: "模糊候选仅供核对，请补全或更正型号关键参数后确认" }
          ]
        }
      })
    }
  }

  if (fuzzyResult.blocked) {
    return {
      resultKey,
      input,
      kind: "missing",
      ...resultPresentation("missing", "关键结构待补全"),
      missingTitle: "型号关键结构不完整或存在歧义",
      missingCopy: fuzzyResult.reason,
      nextAction: "请补全产品类型、尺寸和订购字段后重新匹配",
      candidates: []
    }
  }

  return {
    resultKey,
    input,
    kind: "missing",
    ...resultPresentation("missing", "数据库中未找到"),
    candidates: []
  }
}

function compoundBatchResult(input, inputIndex, parts, searchIndex) {
  const components = parts.map((part, componentIndex) => (
    batchResultForInput(part, `${inputIndex}.${componentIndex}:${part}`, searchIndex)
  ))
  const allMissing = components.every((component) => component.presentationKind === "missing")
  const allConfirmed = components.every((component) => salesCopyRecord(component).status === "已匹配")
  const kind = allMissing ? "missing" : (allConfirmed ? "exact" : "candidate")
  const kindText = kind === "exact" ? "组合精确匹配" : (kind === "candidate" ? "组合待确认" : "数据库中未找到")

  return {
    resultKey: `${inputIndex}:${input}`,
    input,
    kind,
    ...resultPresentation(kind, kindText),
    components,
    candidates: components.flatMap((component) => component.candidates)
  }
}

function clearAfter(selection, fields, changedField) {
  const next = { ...selection }
  const changedIndex = fields.findIndex((field) => field.key === changedField)

  if (changedField === "brand") {
    Object.keys(defaultSelection).forEach((key) => {
      if (key !== "brand") next[key] = ""
    })
    return next
  }

  if (changedField === "sourceModel" || changedIndex < 0) return next

  fields.forEach((field, index) => {
    if (index > changedIndex) next[field.key] = ""
  })
  next.sourceModel = ""
  return next
}

Page({
  data: {
    toolMode: "check",
    selection: { ...defaultSelection },
    brands: uniqueOptions(allFittingMappings, "brand"),
    activeFields: [],
    fieldOptions: {},
    modelOptions: [],
    sourceModelText: "",
    results: [],
    batchInput: "",
    batchResults: [],
    visibleBatchResults: [],
    batchFilter: "all",
    batchOverflowCount: 0,
    isMatching: false,
    resultStale: false,
    isExample: false,
    engineeringNotesOpen: false,
    batchSummary: {
      total: 0,
      exact: 0,
      candidate: 0,
      missing: 0
    },
    stepNotice: "请选择品牌",
    optionSheet: {
      visible: false,
      title: "",
      field: "",
      options: []
    }
  },

  onLoad(options = {}) {
    const query = options.query ? safeDecodeQuery(options.query) : ""
    const restored = query ? null : readToolState("fitting")
    if (restored) {
      this.setData({
        ...restored,
        optionSheet: { visible: false, title: "", field: "", options: [] }
      })
      return
    }

    if (query || options.mode === "batch") {
      this.setData({
        toolMode: "check",
        batchInput: query,
        batchResults: [],
        visibleBatchResults: [],
        batchSummary: emptyBatchSummary()
      })
    }
  },

  onHide() {
    saveToolState("fitting", {
      toolMode: this.data.toolMode,
      selection: this.data.selection,
      activeFields: this.data.activeFields,
      fieldOptions: this.data.fieldOptions,
      modelOptions: this.data.modelOptions,
      sourceModelText: this.data.sourceModelText,
      results: this.data.results,
      stepNotice: this.data.stepNotice,
      batchInput: this.data.batchInput,
      batchResults: this.data.batchResults,
      visibleBatchResults: this.data.visibleBatchResults,
      batchFilter: this.data.batchFilter,
      batchOverflowCount: this.data.batchOverflowCount,
      batchSummary: this.data.batchSummary,
      resultStale: this.data.resultStale,
      isExample: this.data.isExample,
      engineeringNotesOpen: this.data.engineeringNotesOpen
    })
  },

  onUnload() {
    this.onHide()
  },

  chooseToolMode(event) {
    const mode = event.currentTarget.dataset.mode
    if (!mode || mode === this.data.toolMode) return
    this.setData({ toolMode: mode })
    if (mode === "select" && !this.data.activeFields.length) this.refreshOptions()
  },

  chooseBrand() {
    this.openOptionSheet("brand", "选择品牌", this.data.brands)
  },

  chooseField(event) {
    if (!this.ensureBrand()) return
    const field = event.currentTarget.dataset.field
    const config = this.data.activeFields.find((item) => item.key === field)
    if (!config) return

    this.openOptionSheet(field, config.title, this.data.fieldOptions[field] || [])
  },

  chooseSourceModel() {
    if (!this.ensureBrand()) return
    this.openOptionSheet("sourceModel", "选择品牌型号", this.data.modelOptions)
  },

  openOptionSheet(field, title, options) {
    if (!options.length) {
      wx.showToast({
        title: "暂无可选项",
        icon: "none"
      })
      return
    }

    this.setData({
      optionSheet: {
        visible: true,
        title,
        field,
        options
      }
    })
  },

  onOptionSelect(event) {
    const index = Number(event.detail && event.detail.index !== undefined
      ? event.detail.index
      : event.currentTarget.dataset.index)
    const option = this.data.optionSheet.options[index]
    const field = this.data.optionSheet.field
    if (!option || !field) return

    const activeFields = field === "brand" ? getBrandFields(option.value) : this.data.activeFields
    const selection = clearAfter(
      {
        ...this.data.selection,
        [field]: option.value
      },
      activeFields,
      field
    )

    this.setData({
      selection,
      optionSheet: {
        visible: false,
        title: "",
        field: "",
        options: []
      }
    })
    this.refreshOptions()
  },

  refreshOptions() {
    const selection = { ...this.data.selection }
    const activeFields = getBrandFields(selection.brand)
    const fieldOptions = {}

    activeFields.forEach((field) => {
      const scopedItems = filterMappings(selection, activeFields, field.key)
      fieldOptions[field.key] = uniqueOptions(scopedItems, field.key)
    })

    const modelItems = filterMappings(selection, activeFields, "sourceModel")
    const modelOptions = modelOptionsForBrand(modelItems, selection.brand)
    const isReady = selection.brand && activeFields.every((field) => selection[field.key])
    const selectedModelExists = modelOptions.some((option) => option.value === selection.sourceModel)

    if (selection.sourceModel && !selectedModelExists) {
      selection.sourceModel = ""
    }

    if (isReady && !selection.sourceModel && modelOptions.length === 1) {
      selection.sourceModel = modelOptions[0].value
    }

    const results = isReady
      ? filterMappings(selection, activeFields).map((item) => {
        const result = enrichResult(item, activeFields)
        return {
          ...result,
          ...classifyExactCandidates([result]),
          detailsOpen: false
        }
      })
      : []
    const displayFields = activeFields.map((field) => ({
      ...field,
      valueText: getFieldValueText(selection, field),
      isPlaceholder: !selection[field.key]
    }))

    this.setData({
      selection,
      activeFields: displayFields,
      fieldOptions,
      modelOptions,
      sourceModelText: getDisplayModelLabel(selection.brand, selection.sourceModel),
      results,
      stepNotice: this.getStepNotice(selection, activeFields, results.length)
    })
  },

  getStepNotice(selection, fields, count) {
    if (!selection.brand) return "请选择品牌"

    const pendingField = fields.find((field) => !selection[field.key])
    if (pendingField) return `继续选择${pendingField.label}`
    if (!selection.sourceModel) return `已匹配 ${count} 个品牌型号`
    return "已生成 VIGOUR 对应型号"
  },

  reset() {
    const hasContent = hasMeaningfulState({
      selection: this.data.selection,
      batchInput: this.data.batchInput,
      batchResults: this.data.batchResults
    })
    if (!hasContent) {
      this.performReset()
      return
    }
    wx.showModal({
      title: "确认重置",
      content: "将清空当前条件、输入与结果。",
      confirmColor: "#ed2b2e",
      success: (result) => {
        if (result.confirm) this.performReset()
      }
    })
  },

  performReset() {
    clearToolState("fitting")
    this.setData({
      selection: { ...defaultSelection },
      activeFields: [],
      fieldOptions: {},
      modelOptions: [],
      sourceModelText: "",
      results: [],
      stepNotice: "请选择品牌",
      batchInput: "",
      batchResults: [],
      visibleBatchResults: [],
      batchFilter: "all",
      batchOverflowCount: 0,
      batchSummary: emptyBatchSummary(),
      resultStale: false,
      isExample: false,
      engineeringNotesOpen: false,
      optionSheet: { visible: false, title: "", field: "", options: [] }
    })
  },

  onBatchInput(event) {
    this.setData({
      batchInput: event.detail.value,
      resultStale: Boolean(this.data.batchResults.length),
      batchOverflowCount: 0,
      isExample: false
    })
  },

  loadBatchExample() {
    this.setData({
      toolMode: "check",
      batchInput: batchExampleText,
      batchResults: [],
      visibleBatchResults: [],
      batchSummary: emptyBatchSummary(),
      batchOverflowCount: 0,
      resultStale: false,
      isExample: true
    })
  },

  runBatchValidation() {
    if (!String(this.data.batchInput || "").trim()) {
      wx.showToast({ title: "请先输入型号", icon: "none" })
      return
    }
    const parsed = batchInputLimit(this.data.batchInput)
    if (parsed.overflowCount) {
      this.setData({
        batchResults: [],
        visibleBatchResults: [],
        batchSummary: emptyBatchSummary(),
        batchOverflowCount: parsed.overflowCount,
        resultStale: false
      })
      wx.showToast({ title: `最多支持 ${MAX_BATCH_MODELS} 个型号`, icon: "none" })
      return
    }
    this.setData({ isMatching: true })
    this.refreshBatchValidation(parsed.inputs)
    this.setData({ isMatching: false, resultStale: false })
    if (this.data.batchSummary.total) this.scrollToResult()
  },

  setBatchFilter(event) {
    const batchFilter = event.currentTarget.dataset.filter || "all"
    this.setData({
      batchFilter,
      visibleBatchResults: filterBatchResults(this.data.batchResults, batchFilter)
    })
  },

  clearBatchInput() {
    this.setData({
      batchInput: "",
      batchResults: [],
      visibleBatchResults: [],
      batchSummary: emptyBatchSummary(),
      batchOverflowCount: 0,
      resultStale: false,
      isExample: false
    })
  },

  refreshBatchValidation(parsedInputs) {
    const rawInputs = Array.isArray(parsedInputs) ? parsedInputs : splitModelInput(this.data.batchInput)
    if (rawInputs.length > MAX_BATCH_MODELS) {
      this.setData({
        batchResults: [],
        visibleBatchResults: [],
        batchSummary: emptyBatchSummary(),
        batchOverflowCount: rawInputs.length - MAX_BATCH_MODELS,
        resultStale: false
      })
      return
    }
    if (!rawInputs.length) {
      this.setData({
        batchResults: [],
        visibleBatchResults: [],
        batchSummary: emptyBatchSummary(),
        batchOverflowCount: 0,
        resultStale: false
      })
      return
    }

    if (!this.allBrandSearchIndex) {
      this.allBrandSearchIndex = buildSearchIndex("")
    }

    const batchResults = rawInputs.map((input, inputIndex) => {
      const parts = compoundInputParts(input)
      return parts.length
        ? compoundBatchResult(input, inputIndex, parts, this.allBrandSearchIndex)
        : batchResultForInput(input, `${inputIndex}:${input}`, this.allBrandSearchIndex)
    })
    const summary = { total: rawInputs.length, exact: 0, candidate: 0, missing: 0 }
    batchResults.forEach((result) => { summary[result.presentationKind || result.kind] += 1 })

    this.setData({
      batchResults,
      visibleBatchResults: filterBatchResults(batchResults, this.data.batchFilter),
      batchSummary: summary,
      batchOverflowCount: 0,
      resultStale: false
    })
  },

  scrollToResult() {
    wx.pageScrollTo({ selector: ".batch-result-anchor", duration: 220 })
  },

  toggleEngineeringNotes() {
    this.setData({ engineeringNotesOpen: !this.data.engineeringNotesOpen })
  },

  toggleResultDetails(event) {
    const sourceModel = event.currentTarget.dataset.model
    this.setData({
      results: this.data.results.map((item) => (
        item.sourceModel === sourceModel ? { ...item, detailsOpen: !item.detailsOpen } : item
      ))
    })
  },

  copyBatchSales() {
    const lines = this.data.batchResults.map((result) => salesCopyTwoColumnLine(salesCopyRecord(result)))
    this.copyText(lines.join("\n"), "销售结果已复制")
  },

  copyBatchMapping() {
    const lines = [
      "原始型号\t状态\tVIGOUR型号\t缺失参数\t处理建议\t尺寸证据状态\t尺寸差异摘要\t超差项\t证据页码摘要",
      ...this.data.batchResults.map((result) => {
        const record = salesCopyRecord(result)
        const action = record.missingParameters.includes("限流孔径")
          ? "补充DM-xxx后确认"
          : record.nextAction
        return [
          result.input,
          record.status,
          record.model,
          record.missingParameters.join("、"),
          action,
          record.dimensionEvidenceStatus || "not_comparable",
          record.dimensionSummary || "",
          record.exceededDimensions || "",
          record.evidencePages || ""
        ].join("\t")
      })
    ]
    this.copyText(lines.join("\n"), "完整对照已复制")
  },

  copyText(text, title, icon = "success") {
    if (!text) {
      wx.showToast({ title: "暂无可复制内容", icon: "none" })
      return
    }
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title, icon })
      }
    })
  },

  copyVigourModel(event) {
    const { model, review } = event.currentTarget.dataset
    if (!model) return

    const needsReview = review === true || review === "true"
    this.copyText(
      model,
      needsReview ? "待确认型号已复制，请核实规格" : "型号已复制",
      needsReview ? "none" : "success"
    )
  },

  ensureBrand() {
    if (this.data.selection.brand) return true
    wx.showToast({
      title: "请先选择品牌",
      icon: "none"
    })
    return false
  },

  closeOptionSheet() {
    this.setData({
      optionSheet: {
        visible: false,
        title: "",
        field: "",
        options: []
      }
    })
  },

  noop() {}
})
