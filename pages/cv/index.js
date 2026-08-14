const {
  pressureUnits,
  gasFlowUnits,
  liquidFlowUnits,
  temperatureUnits,
  gasMediaOptions,
  liquidMediaOptions,
  convertPressure,
  convertGasFlow,
  convertLiquidFlow,
  convertTemperature,
  calculateCv
} = require("./utils/cvCalculator")
const { hasMeaningfulState } = require("../../utils/uiPresentation")
const { saveToolState, readToolState, clearToolState } = require("./utils/sessionState")
const {
  DEFAULT_CV_UNITS,
  normalizeCvUnits,
  normalizeCvMedia,
  optionForIndex,
  buildCvResultContext
} = require("./utils/cvUiState")

const defaultCvTool = {
  mode: "cv",
  mediaType: "gas",
  p1: "",
  p2: "",
  ...DEFAULT_CV_UNITS,
  flow: "",
  temperature: "",
  gasMediaIndex: -1,
  liquidMediaIndex: -1,
  sg: "",
  cv: ""
}

const exampleCvTool = {
  ...defaultCvTool,
  p1: "0.8",
  p2: "0.2",
  pressureUnit: "mpaA",
  pressureUnitIndex: 0,
  flow: "100",
  gasFlowUnit: "stdLMin",
  gasFlowUnitIndex: 1,
  liquidFlowUnit: "lMin",
  liquidFlowUnitIndex: 2,
  temperature: "20",
  temperatureUnit: "c",
  temperatureUnitIndex: 0,
  gasMediaIndex: 0,
  sg: "1"
}

function formatConverted(value) {
  if (value === null || !Number.isFinite(Number(value))) return ""
  return Number(Number(value).toFixed(6)).toString()
}

function fieldErrorsFor(errors) {
  const fieldErrors = {}
  ;(errors || []).forEach((message) => {
    if (message.includes("压力单位")) fieldErrors.pressureUnit = message
    else if (message.includes("进口压力")) fieldErrors.p1 = message
    else if (message.includes("出口压力")) fieldErrors.p2 = message
    else if (message.includes("流量单位")) fieldErrors.flowUnit = message
    else if (message.includes("流量")) fieldErrors.flow = message
    else if (message.includes("Cv")) fieldErrors.cv = message
    else if (message.includes("相对比重")) fieldErrors.sg = message
    else if (message.includes("温度单位")) fieldErrors.temperatureUnit = message
    else if (message.includes("温度")) fieldErrors.temperature = message
  })
  return fieldErrors
}

Page({
  data: {
    pressureUnits,
    gasFlowUnits,
    liquidFlowUnits,
    temperatureUnits,
    gasMediaOptions,
    liquidMediaOptions,
    cvTool: { ...defaultCvTool },
    cvErrors: [],
    fieldErrors: {},
    cvResult: null,
    actionNotice: "",
    mediaContextHighlight: false,
    isExample: false,
    engineeringNotesOpen: false,
    optionSheet: {
      visible: false,
      title: "",
      options: []
    }
  },

  onLoad() {
    const restored = readToolState("cv")
    if (!restored) return
    const normalized = normalizeCvMedia(normalizeCvUnits({ ...defaultCvTool, ...(restored.cvTool || {}) }))
    this.setData({
      ...restored,
      cvTool: normalized.cvTool,
      cvResult: normalized.mediaIndexChanged ? null : (restored.cvResult || null),
      actionNotice: "",
      mediaContextHighlight: false,
      optionSheet: { visible: false, title: "", options: [] }
    })
  },

  onHide() {
    saveToolState("cv", {
      cvTool: this.data.cvTool,
      cvErrors: this.data.cvErrors,
      fieldErrors: this.data.fieldErrors,
      cvResult: this.data.cvResult,
      isExample: this.data.isExample,
      engineeringNotesOpen: this.data.engineeringNotesOpen
    })
  },

  onUnload() {
    this.onHide()
    if (this.autoCalculateTimer) clearTimeout(this.autoCalculateTimer)
    if (this.noticeTimer) clearTimeout(this.noticeTimer)
    if (this.mediaFeedbackTimer) clearTimeout(this.mediaFeedbackTimer)
  },

  onCvInput(event) {
    const field = event.currentTarget.dataset.field
    const cvTool = { ...this.data.cvTool, [field]: event.detail.value }
    this.setData({ cvTool, isExample: false, actionNotice: "" })
    this.scheduleAutoCalculate()
  },

  onCvModeChange(event) {
    const mode = event.currentTarget.dataset.mode
    if (!mode || mode === this.data.cvTool.mode) return
    this.setData({
      cvTool: { ...this.data.cvTool, mode },
      cvResult: null,
      cvErrors: [],
      fieldErrors: {},
      isExample: false
    })
    this.scheduleAutoCalculate()
  },

  onCvMediaTypeChange(event) {
    const mediaType = event.currentTarget.dataset.type
    if (!mediaType || mediaType === this.data.cvTool.mediaType) return
    const mediaIndex = mediaType === "gas" ? this.data.cvTool.gasMediaIndex : this.data.cvTool.liquidMediaIndex
    const mediaOptions = mediaType === "gas" ? gasMediaOptions : liquidMediaOptions
    const mediaOption = optionForIndex(mediaOptions, mediaIndex)
    const indexKey = mediaType === "gas" ? "gasMediaIndex" : "liquidMediaIndex"
    const sg = mediaOption ? mediaOption.sg.toString() : ""
    this.setData({
      cvTool: { ...this.data.cvTool, mediaType, [indexKey]: mediaOption ? mediaIndex : -1, sg },
      cvResult: null,
      cvErrors: [],
      fieldErrors: {},
      actionNotice: "",
      mediaContextHighlight: false,
      isExample: false
    }, () => this.autoCalculate())
  },

  choosePressureUnit() {
    this.chooseOption("选择压力单位", pressureUnits, (index, option) => {
      const oldUnit = this.data.cvTool.pressureUnit
      const cvTool = {
        ...this.data.cvTool,
        pressureUnitIndex: index,
        pressureUnit: option.value
      }
      if (oldUnit) {
        if (cvTool.p1 !== "") cvTool.p1 = formatConverted(convertPressure(cvTool.p1, oldUnit, option.value))
        if (cvTool.p2 !== "") cvTool.p2 = formatConverted(convertPressure(cvTool.p2, oldUnit, option.value))
      }
      this.applyUnitChange(cvTool, oldUnit)
    })
  },

  chooseGasFlowUnit() {
    this.chooseOption("选择气体流量单位", gasFlowUnits, (index, option) => {
      const oldUnit = this.data.cvTool.gasFlowUnit
      const cvTool = {
        ...this.data.cvTool,
        gasFlowUnitIndex: index,
        gasFlowUnit: option.value
      }
      if (oldUnit && cvTool.flow !== "") {
        cvTool.flow = formatConverted(convertGasFlow(cvTool.flow, oldUnit, option.value))
      }
      this.applyUnitChange(cvTool, oldUnit)
    })
  },

  chooseLiquidFlowUnit() {
    this.chooseOption("选择液体流量单位", liquidFlowUnits, (index, option) => {
      const oldUnit = this.data.cvTool.liquidFlowUnit
      const cvTool = {
        ...this.data.cvTool,
        liquidFlowUnitIndex: index,
        liquidFlowUnit: option.value
      }
      if (oldUnit && cvTool.flow !== "") {
        cvTool.flow = formatConverted(convertLiquidFlow(cvTool.flow, oldUnit, option.value))
      }
      this.applyUnitChange(cvTool, oldUnit)
    })
  },

  chooseTemperatureUnit() {
    this.chooseOption("选择温度单位", temperatureUnits, (index, option) => {
      const oldUnit = this.data.cvTool.temperatureUnit
      const cvTool = {
        ...this.data.cvTool,
        temperatureUnitIndex: index,
        temperatureUnit: option.value
      }
      if (oldUnit && cvTool.temperature !== "") {
        cvTool.temperature = formatConverted(convertTemperature(cvTool.temperature, oldUnit, option.value))
      }
      this.applyUnitChange(cvTool, oldUnit)
    })
  },

  applyUnitChange(cvTool, oldUnit) {
    this.setData({
      cvTool,
      actionNotice: oldUnit ? "已按相同物理量换算" : "",
      mediaContextHighlight: false,
      isExample: false
    })
    if (oldUnit) this.clearActionNotice()
    this.scheduleAutoCalculate()
  },

  chooseGasMedia() {
    this.chooseOption("选择气体介质", gasMediaOptions, (index, option) => {
      this.applyMediaSelection("gas", index, option)
    })
  },

  chooseLiquidMedia() {
    this.chooseOption("选择液体介质", liquidMediaOptions, (index, option) => {
      this.applyMediaSelection("liquid", index, option)
    })
  },

  applyMediaSelection(mediaType, index, option) {
    const indexKey = mediaType === "gas" ? "gasMediaIndex" : "liquidMediaIndex"
    const cvTool = { ...this.data.cvTool, mediaType, [indexKey]: index, sg: option.sg.toString() }
    this.setData({
      cvTool,
      cvResult: null,
      cvErrors: [],
      fieldErrors: {},
      actionNotice: "",
      mediaContextHighlight: false,
      isExample: false
    }, () => {
      this.autoCalculate()
      if (!this.data.cvResult) return
      this.setData({
        actionNotice: `介质已切换为${option.label}，SG ${option.sg}，结果已更新`,
        mediaContextHighlight: true
      })
      this.clearMediaContextFeedback()
    })
  },

  clearMediaContextFeedback() {
    if (this.noticeTimer) clearTimeout(this.noticeTimer)
    if (this.mediaFeedbackTimer) clearTimeout(this.mediaFeedbackTimer)
    this.mediaFeedbackTimer = setTimeout(() => this.setData({
      actionNotice: "",
      mediaContextHighlight: false
    }), 2200)
  },

  chooseOption(title, options, onSelect) {
    this.optionSelectHandler = onSelect
    this.setData({ optionSheet: { visible: true, title, options } })
  },

  onOptionSelect(event) {
    const detailIndex = event.detail && event.detail.index
    const index = Number(detailIndex !== undefined ? detailIndex : event.currentTarget.dataset.index)
    const option = this.data.optionSheet.options[index]
    if (this.optionSelectHandler && option) this.optionSelectHandler(index, option)
    this.closeOptionSheet()
  },

  closeOptionSheet() {
    this.setData({ optionSheet: { visible: false, title: "", options: [] } })
  },

  scheduleAutoCalculate() {
    if (this.autoCalculateTimer) clearTimeout(this.autoCalculateTimer)
    this.autoCalculateTimer = setTimeout(() => this.autoCalculate(), 160)
  },

  hasRequiredInputs() {
    const form = this.data.cvTool
    const flowUnit = form.mediaType === "gas" ? form.gasFlowUnit : form.liquidFlowUnit
    const targetValue = form.mode === "cv" ? form.flow : form.cv
    const gasReady = form.mediaType !== "gas" || (form.temperature !== "" && form.temperatureUnit)

    return Boolean(
      form.p1 !== "" &&
      form.p2 !== "" &&
      form.pressureUnit &&
      targetValue !== "" &&
      flowUnit &&
      form.sg !== "" &&
      gasReady
    )
  },

  autoCalculate() {
    if (!this.hasRequiredInputs()) {
      this.setData({ cvErrors: [], fieldErrors: {}, cvResult: null })
      return
    }

    const form = { ...this.data.cvTool }
    const calculation = calculateCv(form)
    this.setData({
      cvErrors: calculation.errors,
      fieldErrors: fieldErrorsFor(calculation.errors),
      cvResult: calculation.result
        ? { ...calculation.result, context: buildCvResultContext(form) }
        : null
    })
  },

  loadExample() {
    if (this.autoCalculateTimer) clearTimeout(this.autoCalculateTimer)
    this.setData({
      cvTool: { ...exampleCvTool },
      cvErrors: [],
      fieldErrors: {},
      cvResult: null,
      actionNotice: "",
      isExample: true
    })
    this.scheduleAutoCalculate()
  },

  reset() {
    const hasContent = hasMeaningfulState({
      p1: this.data.cvTool.p1,
      p2: this.data.cvTool.p2,
      flow: this.data.cvTool.flow,
      cv: this.data.cvTool.cv,
      result: this.data.cvResult
    })
    if (!hasContent) {
      this.performReset()
      return
    }

    wx.showModal({
      title: "确认重置",
      content: "将清空当前工况和计算结果。",
      confirmColor: "#ed2b2e",
      success: (result) => {
        if (result.confirm) this.performReset()
      }
    })
  },

  performReset() {
    if (this.autoCalculateTimer) clearTimeout(this.autoCalculateTimer)
    clearToolState("cv")
    this.setData({
      cvTool: { ...defaultCvTool },
      cvErrors: [],
      fieldErrors: {},
      cvResult: null,
      actionNotice: "已清空输入",
      mediaContextHighlight: false,
      isExample: false,
      engineeringNotesOpen: false,
      optionSheet: { visible: false, title: "", options: [] }
    })
    this.clearActionNotice()
  },

  toggleEngineeringNotes() {
    this.setData({ engineeringNotesOpen: !this.data.engineeringNotesOpen })
  },

  clearActionNotice() {
    if (this.mediaFeedbackTimer) clearTimeout(this.mediaFeedbackTimer)
    if (this.noticeTimer) clearTimeout(this.noticeTimer)
    this.noticeTimer = setTimeout(() => this.setData({ actionNotice: "" }), 1400)
  }
})

module.exports = { defaultCvTool, exampleCvTool, formatConverted, fieldErrorsFor }
