const {
  DEFAULT_CV_UNITS,
  normalizeCvUnits,
  buildCvResultContext
} = require("../pages/cv/utils/cvUiState")
const { saveToolState, readToolState, clearToolState } = require("../pages/cv/utils/sessionState")
const fs = require("fs")

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: ${JSON.stringify({ actual, expected })}`)
  }
}

assertEqual(DEFAULT_CV_UNITS, {
  pressureUnit: "barA",
  pressureUnitIndex: 1,
  gasFlowUnit: "stdLMin",
  gasFlowUnitIndex: 1,
  liquidFlowUnit: "lMin",
  liquidFlowUnitIndex: 2,
  temperatureUnit: "c",
  temperatureUnitIndex: 0
}, "engineering defaults")

assertEqual(normalizeCvUnits({ pressureUnit: "broken" }).pressureUnit, "barA", "invalid unit fallback")
assertEqual(normalizeCvUnits({ pressureUnit: "psig" }).pressureUnitIndex, 4, "restored index repair")

const nitrogen = {
  mediaType: "gas",
  gasMediaIndex: 1,
  liquidMediaIndex: -1,
  sg: "0.967",
  temperature: "20",
  temperatureUnit: "c"
}
assertEqual(buildCvResultContext(nitrogen).mediaDisplay, "氮气 · GAS", "standard gas")
assertEqual(buildCvResultContext({ ...nitrogen, sg: "1.0" }).mediaDisplay, "氮气 · 自定义 SG 1.0", "custom gas")
assertEqual(buildCvResultContext({ ...nitrogen, gasMediaIndex: -1 }).mediaDisplay, "自定义气体", "manual gas")
assertEqual(buildCvResultContext({ mediaType: "liquid", liquidMediaIndex: 0, sg: "1.0" }).temperatureDisplay, "", "liquid temperature")

let pageDefinition = null
global.Page = (definition) => { pageDefinition = definition }
global.wx = { pageScrollTo() {}, showModal() {} }
const pageExports = require("../pages/cv/index.js")

assertEqual(pageExports.defaultCvTool.pressureUnit, "barA", "page pressure default")
assertEqual(pageExports.defaultCvTool.gasFlowUnit, "stdLMin", "page gas flow default")
assertEqual(pageExports.defaultCvTool.liquidFlowUnit, "lMin", "page liquid flow default")
assertEqual(pageExports.defaultCvTool.temperatureUnit, "c", "page temperature default")

function createPageContext(data = {}) {
  return {
    data: {
      ...pageDefinition.data,
      ...data,
      cvTool: { ...pageExports.defaultCvTool, ...(data.cvTool || {}) }
    },
    setData(patch, callback) {
      this.data = { ...this.data, ...patch }
      if (callback) callback()
    },
    autoCalculate: pageDefinition.autoCalculate,
    hasRequiredInputs: pageDefinition.hasRequiredInputs
  }
}

const restorationRegressionFailures = []
function runRestorationRegression(label, test) {
  try {
    test()
  } catch (error) {
    restorationRegressionFailures.push(`${label}: ${error.message}`)
  }
}

clearToolState("cv")
saveToolState("cv", {
  cvTool: { mediaType: "gas", gasMediaIndex: pageDefinition.data.gasMediaOptions.length, liquidMediaIndex: 0, sg: "9.9" },
  cvResult: { value: "stale gas result" },
  actionNotice: "legacy transient notice"
})
const restoredGasContext = createPageContext()
pageDefinition.onLoad.call(restoredGasContext)
runRestorationRegression("gas index", () => {
  assertEqual(restoredGasContext.data.cvTool.gasMediaIndex, -1, "positive out-of-range restored gas index")
})
runRestorationRegression("gas SG", () => {
  assertEqual(restoredGasContext.data.cvTool.sg, "", "invalid active gas clears SG")
})
runRestorationRegression("gas result", () => {
  assertEqual(restoredGasContext.data.cvResult, null, "normalized gas index clears restored result")
})
runRestorationRegression("notice load", () => {
  assertEqual(restoredGasContext.data.actionNotice, "", "legacy transient notice cleared on load")
})

clearToolState("cv")
saveToolState("cv", {
  cvTool: { mediaType: "liquid", gasMediaIndex: 0, liquidMediaIndex: pageDefinition.data.liquidMediaOptions.length + 4, sg: "8.8" },
  cvResult: { value: "stale liquid result" }
})
const restoredLiquidContext = createPageContext()
pageDefinition.onLoad.call(restoredLiquidContext)
runRestorationRegression("liquid index", () => {
  assertEqual(restoredLiquidContext.data.cvTool.liquidMediaIndex, -1, "positive out-of-range restored liquid index")
})
runRestorationRegression("liquid SG", () => {
  assertEqual(restoredLiquidContext.data.cvTool.sg, "", "invalid active liquid clears SG")
})
runRestorationRegression("liquid result", () => {
  assertEqual(restoredLiquidContext.data.cvResult, null, "normalized liquid index clears restored result")
})

const unsafeSwitchContext = createPageContext({
  cvTool: { mediaType: "liquid", gasMediaIndex: pageDefinition.data.gasMediaOptions.length + 2, liquidMediaIndex: 0, sg: "1" },
  cvResult: { value: "stale switch result" }
})
runRestorationRegression("safe media switch", () => {
  pageDefinition.onCvMediaTypeChange.call(unsafeSwitchContext, { currentTarget: { dataset: { type: "gas" } } })
  assertEqual(unsafeSwitchContext.data.cvTool.mediaType, "gas", "safe invalid-index media switch type")
  assertEqual(unsafeSwitchContext.data.cvTool.gasMediaIndex, -1, "safe invalid-index media switch normalization")
  assertEqual(unsafeSwitchContext.data.cvTool.sg, "", "safe invalid-index media switch SG")
  assertEqual(unsafeSwitchContext.data.cvResult, null, "safe invalid-index media switch result")
})

clearToolState("cv")
const transientNoticeContext = createPageContext({ actionNotice: "do not persist" })
pageDefinition.onHide.call(transientNoticeContext)
const savedTransientState = readToolState("cv")
runRestorationRegression("notice save", () => {
  assertEqual(Object.prototype.hasOwnProperty.call(savedTransientState, "actionNotice"), false, "transient notice omitted from save")
})
clearToolState("cv")

if (restorationRegressionFailures.length) {
  throw new Error(`Cv restoration regressions:\n${restorationRegressionFailures.join("\n")}`)
}

const context = {
  data: {
    ...pageDefinition.data,
    cvTool: {
      ...pageExports.defaultCvTool,
      mode: "flow", p1: "1", p2: "0.8", cv: "1", temperature: "20",
      gasMediaIndex: 0, sg: "1"
    },
    cvResult: { value: "old" }
  },
  setData(patch, callback) {
    this.data = { ...this.data, ...patch }
    if (callback) callback()
  },
  chooseOption: pageDefinition.chooseOption,
  applyMediaSelection: pageDefinition.applyMediaSelection,
  autoCalculate: pageDefinition.autoCalculate,
  hasRequiredInputs: pageDefinition.hasRequiredInputs,
  clearMediaContextFeedback: pageDefinition.clearMediaContextFeedback
}

const nativeSetTimeout = global.setTimeout
const nativeClearTimeout = global.clearTimeout
const timers = new Map()
let nextTimerId = 1
const fakeSetTimeout = (callback) => {
  const id = nextTimerId++
  timers.set(id, { callback, cancelled: false })
  return id
}
const fakeClearTimeout = (id) => {
  const timer = timers.get(id)
  if (timer) timer.cancelled = true
}
global.setTimeout = fakeSetTimeout
global.clearTimeout = fakeClearTimeout
try {
  pageDefinition.clearActionNotice.call(context)
  const staleNoticeTimer = context.noticeTimer
  pageDefinition.chooseGasMedia.call(context)
  context.optionSelectHandler(4, pageDefinition.data.gasMediaOptions[4])
  const staleTimer = timers.get(staleNoticeTimer)
  if (staleTimer && !staleTimer.cancelled) staleTimer.callback()
} finally {
  global.setTimeout = nativeSetTimeout
  global.clearTimeout = nativeClearTimeout
}
assertEqual(context.data.cvTool.sg, "0.0696", "hydrogen SG")
assertEqual(context.data.cvResult.context.mediaDisplay, "氢气 · GAS", "switched result snapshot")
if (!context.data.actionNotice.includes("氢气") || !context.data.actionNotice.includes("结果已更新")) {
  throw new Error(`medium notice incomplete: ${context.data.actionNotice}`)
}
assertEqual(context.data.mediaContextHighlight, true, "medium highlight")

context.data.cvTool = { ...context.data.cvTool, sg: "1.0" }
pageDefinition.autoCalculate.call(context)
assertEqual(context.data.cvResult.context.mediaDisplay, "氢气 · 自定义 SG 1.0", "edited SG snapshot")

const gasCvResult = context.data.cvResult
global.setTimeout = fakeSetTimeout
global.clearTimeout = fakeClearTimeout
try {
  pageDefinition.chooseLiquidMedia.call(context)
  context.optionSelectHandler(1, pageDefinition.data.liquidMediaOptions[1])
} finally {
  global.setTimeout = nativeSetTimeout
  global.clearTimeout = nativeClearTimeout
}
assertEqual(context.data.cvTool.mediaType, "liquid", "liquid media type")
assertEqual(context.data.cvTool.liquidMediaIndex, 1, "sea water index")
assertEqual(context.data.cvTool.sg, "1.025", "sea water SG")
if (!context.data.cvResult || context.data.cvResult === gasCvResult || !context.data.cvResult.context) {
  throw new Error("liquid selection did not calculate a new result context")
}
assertEqual(context.data.cvResult.context.mediaDisplay, "海水 · LIQUID", "liquid result snapshot")
assertEqual(context.data.cvResult.context.temperatureDisplay, "", "liquid result omits temperature")
if (!context.data.actionNotice.includes("海水") || !context.data.actionNotice.includes("结果已更新")) {
  throw new Error(`liquid notice incomplete: ${context.data.actionNotice}`)
}
assertEqual(context.data.mediaContextHighlight, true, "liquid medium highlight")

const cvWxml = fs.readFileSync("pages/cv/index.wxml", "utf8")
const cvWxss = fs.readFileSync("pages/cv/index.wxss", "utf8")
if (!/class="current-context"/.test(cvWxml) ||
    !/current-context__value/.test(cvWxml) ||
    !/current-context__state \{\{cvResult \? 'is-ready' : ''\}\}/.test(cvWxml) ||
    !/结果已更新/.test(cvWxml)) {
  throw new Error("Cv controls must keep the active medium and calculation state visible")
}
if (!/\.current-context\s*\{[^}]*display:\s*grid;/s.test(cvWxss)) {
  throw new Error("Cv current context must use a stable compact layout")
}
if (!/\.segment\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*border:\s*1rpx solid transparent;[^}]*background:\s*#fafaf8;/s.test(cvWxss)) {
  throw new Error("Cv segmented choices must keep equal visible left and right surfaces")
}
if (!/\.segment\.active\s*\{[^}]*border-color:\s*var\(--color-ink\);/s.test(cvWxss) ||
    !/\.segment-group--media \.segment\.active\s*\{[^}]*border-color:\s*var\(--color-brand\);/s.test(cvWxss)) {
  throw new Error("Cv active segments must change color without changing geometry")
}

console.log("Cv UI state contract passed")
