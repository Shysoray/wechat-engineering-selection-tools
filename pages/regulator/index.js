const {
  defaultSelection,
  fieldConfigs,
  isSelectionComplete,
  selectPressureRegulator
} = require("./utils/pressureRegulatorSelector")
const { normalizeRegulatorSelection } = require("./utils/regulatorUiState")
const { hasMeaningfulState } = require("../../utils/uiPresentation")
const { saveToolState, readToolState, clearToolState } = require("./utils/sessionState")

const groupMetadata = {
  media: { title: "介质与结构", english: "Media & Construction" },
  pressure: { title: "压力范围", english: "Pressure Range" },
  flowConnection: { title: "流量与接口", english: "Flow & Connections" }
}

const fieldGroup = {
  structure: "media",
  material: "media",
  media: "media",
  inletPressure: "pressure",
  outletPressure: "pressure",
  flow: "flow",
  panelMount: "connection",
  port: "connection",
  inletConnector: "connection",
  inletGauge: "connection",
  outletGauge: "connection",
  outletConnector: "connection"
}

const segmentedFields = ["structure", "material", "panelMount", "port", "media"]

const exampleSelection = {
  structure: "SINGLE_DIAPHRAGM",
  material: "UBS",
  panelMount: "BOTTOM",
  inletPressure: "20",
  outletPressure: "2",
  port: "4P",
  inletConnector: "FV4",
  inletGauge: "P",
  outletGauge: "P",
  outletConnector: "FV4",
  flow: "10",
  media: "BULK"
}

function isGaugeDisabled(selection, key) {
  return (
    (selection.port === "2P" && (key === "inletGauge" || key === "outletGauge")) ||
    (selection.port === "3P" && key === "inletGauge")
  )
}

function buildDisplayFields(selection) {
  return fieldConfigs.map((field) => {
    const isDisabled = isGaugeDisabled(selection, field.key)
    const option = field.input ? null : field.options.find((item) => item.value === selection[field.key])
    return {
      ...field,
      group: fieldGroup[field.key] || "connection",
      segmented: segmentedFields.includes(field.key),
      displayOptions: field.input
        ? []
        : field.options.map((item) => ({ ...item, selected: item.value === selection[field.key] })),
      valueText: field.input
        ? selection[field.key]
        : isDisabled
          ? `${selection.port} 不适用`
          : option
            ? option.label
            : field.placeholder,
      isPlaceholder: field.input ? !selection[field.key] : !option && !isDisabled,
      isDisabled
    }
  })
}

function buildFieldGroups(selection) {
  const fields = buildDisplayFields(selection)
  return [
    {
      key: "media",
      ...groupMetadata.media,
      fields: fields.filter((field) => field.group === "media")
    },
    {
      key: "pressure",
      ...groupMetadata.pressure,
      fields: fields.filter((field) => field.group === "pressure")
    },
    {
      key: "flowConnection",
      ...groupMetadata.flowConnection,
      fields: fields.filter((field) => field.group === "flow" || field.group === "connection")
    }
  ]
}

function buildSelectionProgress(selection) {
  const activeFields = buildDisplayFields(selection).filter((field) => !field.isDisabled)
  const completed = activeFields.filter((field) => !field.isPlaceholder).length
  const total = activeFields.length
  const percent = total ? Math.round((completed / total) * 100) : 0
  return {
    completed,
    total,
    percent,
    label: completed === total ? "条件已完整" : `已完成 ${completed}/${total}`
  }
}

function presentResult(result) {
  if (!result) return null
  return {
    ...result,
    coreSpecs: result.specs.slice(0, 4),
    moreSpecs: result.specs.slice(4)
  }
}

Page({
  data: {
    selection: { ...defaultSelection },
    fieldGroups: buildFieldGroups(defaultSelection),
    selectionProgress: buildSelectionProgress(defaultSelection),
    errors: [],
    result: null,
    stepNotice: "请完善减压阀工况条件",
    actionNotices: [],
    isExample: false,
    resultDetailsOpen: false,
    engineeringNotesOpen: false,
    optionSheet: {
      visible: false,
      title: "",
      field: "",
      options: []
    }
  },

  onLoad() {
    const restored = readToolState("regulator")
    if (!restored) return
    const selection = restored.selection || defaultSelection
    this.setData({
      ...restored,
      selection,
      fieldGroups: buildFieldGroups(selection),
      selectionProgress: buildSelectionProgress(selection),
      optionSheet: { visible: false, title: "", field: "", options: [] }
    })
  },

  onHide() {
    saveToolState("regulator", {
      selection: this.data.selection,
      errors: this.data.errors,
      result: this.data.result,
      stepNotice: this.data.stepNotice,
      actionNotices: this.data.actionNotices,
      isExample: this.data.isExample,
      resultDetailsOpen: this.data.resultDetailsOpen,
      engineeringNotesOpen: this.data.engineeringNotesOpen
    })
  },

  onUnload() {
    this.onHide()
  },

  chooseField(event) {
    const key = event.currentTarget.dataset.field
    const field = fieldConfigs.find((item) => item.key === key)
    if (!field || field.input || isGaugeDisabled(this.data.selection, key)) return
    this.setData({
      optionSheet: {
        visible: true,
        title: field.title,
        field: key,
        options: field.options
      }
    })
  },

  chooseSegmentOption(event) {
    const field = event.currentTarget.dataset.field
    const value = event.currentTarget.dataset.value
    if (!field || !value) return
    this.applySelectionChange(field, value, true)
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field
    this.applySelectionChange(field, event.detail.value, false)
  },

  applySelectionChange(field, value, autoSelect) {
    const hadResult = Boolean(this.data.result)
    const normalized = normalizeRegulatorSelection(
      { ...this.data.selection, [field]: value },
      field,
      fieldConfigs
    )
    const selection = normalized.selection
    const actionNotices = normalized.notices.slice()
    if (hadResult) actionNotices.unshift("条件已变化，旧结果已清除")

    this.setData({
      selection,
      fieldGroups: buildFieldGroups(selection),
      selectionProgress: buildSelectionProgress(selection),
      errors: [],
      result: null,
      resultDetailsOpen: false,
      actionNotices,
      stepNotice: this.getStepNotice(selection),
      isExample: false
    }, () => {
      if (autoSelect && isSelectionComplete(selection)) this.selectModel(selection)
    })
  },

  onFieldBlur() {
    if (isSelectionComplete(this.data.selection)) this.selectModel()
  },

  onOptionSelect(event) {
    const detailIndex = event.detail && event.detail.index
    const index = Number(detailIndex !== undefined ? detailIndex : event.currentTarget.dataset.index)
    const option = this.data.optionSheet.options[index]
    const field = this.data.optionSheet.field
    if (!option || !field) return
    this.closeOptionSheet()
    this.applySelectionChange(field, option.value, true)
  },

  selectModel(selectionOverride) {
    const selection = { ...(selectionOverride || this.data.selection) }
    const selectionResult = selectPressureRegulator(selection)
    const result = presentResult(selectionResult.result)
    this.setData({
      errors: selectionResult.errors,
      result,
      actionNotices: [],
      stepNotice: selectionResult.errors.length ? "当前组合需要调整" : "已生成 VIGOUR 候选型号"
    })
    if (result) this.scrollToResult()
  },

  scrollToResult() {
    wx.pageScrollTo({ selector: ".result-anchor", duration: 240 })
  },

  copyVigourModel(event) {
    const model = event.currentTarget.dataset.model
    if (!model) return
    wx.setClipboardData({
      data: model,
      success() {
        wx.showToast({ title: "型号已复制", icon: "success" })
      }
    })
  },

  getStepNotice(selection) {
    const pendingField = fieldConfigs.find((field) => !selection[field.key])
    if (pendingField) return `继续选择${pendingField.label}`
    if (isSelectionComplete(selection)) return "条件完整，正在生成型号"
    return "请完善减压阀工况条件"
  },

  loadExample() {
    const selection = { ...exampleSelection }
    this.setData({
      selection,
      fieldGroups: buildFieldGroups(selection),
      selectionProgress: buildSelectionProgress(selection),
      errors: [],
      result: null,
      actionNotices: [],
      stepNotice: "示例工况已填写",
      isExample: true,
      resultDetailsOpen: false
    }, () => this.selectModel(selection))
  },

  reset() {
    const hasContent = hasMeaningfulState({ selection: this.data.selection, result: this.data.result })
    if (!hasContent) {
      this.performReset()
      return
    }
    wx.showModal({
      title: "确认重置",
      content: "将清空全部工况条件和选型结果。",
      confirmColor: "#ed2b2e",
      success: (result) => {
        if (result.confirm) this.performReset()
      }
    })
  },

  performReset() {
    clearToolState("regulator")
    this.setData({
      selection: { ...defaultSelection },
      fieldGroups: buildFieldGroups(defaultSelection),
      selectionProgress: buildSelectionProgress(defaultSelection),
      errors: [],
      result: null,
      stepNotice: "请完善减压阀工况条件",
      actionNotices: [],
      isExample: false,
      resultDetailsOpen: false,
      engineeringNotesOpen: false,
      optionSheet: { visible: false, title: "", field: "", options: [] }
    })
  },

  toggleResultDetails() {
    this.setData({ resultDetailsOpen: !this.data.resultDetailsOpen })
  },

  toggleEngineeringNotes() {
    this.setData({ engineeringNotesOpen: !this.data.engineeringNotesOpen })
  },

  closeOptionSheet() {
    this.setData({ optionSheet: { visible: false, title: "", field: "", options: [] } })
  }
})

module.exports = { fieldGroup, exampleSelection, buildDisplayFields, buildFieldGroups, buildSelectionProgress, presentResult }
