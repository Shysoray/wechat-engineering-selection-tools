const {
  fieldConfigs,
  regulatorSeries,
  selectPressureRegulator
} = require("../pages/regulator/utils/pressureRegulatorSelector")
const { normalizeRegulatorSelection } = require("../pages/regulator/utils/regulatorUiState")
const fs = require("fs")

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: ${JSON.stringify({ actual, expected })}`)
  }
}

const expectedSeriesStructures = {
  50: "SINGLE_DIAPHRAGM",
  100: "SINGLE_DIAPHRAGM",
  1000: "SINGLE_DIAPHRAGM",
  210: "SINGLE_DIAPHRAGM",
  410: "SINGLE_DIAPHRAGM",
  510: "SINGLE_DIAPHRAGM",
  610: "SINGLE_DIAPHRAGM",
  710: "TWO_STAGE_DIAPHRAGM",
  910: "SINGLE_DIAPHRAGM",
  911: "SINGLE_DIAPHRAGM",
  920: "SINGLE_DIAPHRAGM",
  930: "HIGH_PRESSURE_PISTON"
}

assertEqual(regulatorSeries.length, Object.keys(expectedSeriesStructures).length, "regulator series matrix size")
regulatorSeries.forEach((rule) => {
  assertEqual(rule.structure, expectedSeriesStructures[rule.value], `${rule.label} structure`)
  for (const requiredField of ["materials", "inletPressures", "outletPressures", "ports", "connections", "flowOptions"]) {
    if (!Array.isArray(rule[requiredField]) || !rule[requiredField].length) {
      throw new Error(`${rule.label} requires a non-empty ${requiredField} catalog rule`)
    }
  }
})

const vsr710 = regulatorSeries.find((rule) => rule.value === "710")
const vsr930 = regulatorSeries.find((rule) => rule.value === "930")
if (!vsr710.type.includes("双级膜片") || vsr710.capacityBasis !== "cv") {
  throw new Error("VSR-710 must remain a two-stage diaphragm Cv-rated series")
}
if (!vsr930.type.includes("高压活塞") || vsr930.inletPressures.join(",") !== "400") {
  throw new Error("VSR-930 must remain the dedicated 400-code high-pressure piston series")
}

const completeSelection = {
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

const before = { ...completeSelection }
const { selection: after, notices } = normalizeRegulatorSelection(
  { ...before, port: "2P" },
  "port",
  fieldConfigs
)
assertEqual(after.inletGauge, "NONE", "2P clears inlet gauge")
assertEqual(after.outletGauge, "NONE", "2P clears outlet gauge")
assertEqual(after.material, before.material, "compatible material remains")
assertEqual(after.inletConnector, before.inletConnector, "compatible inlet connection remains")
assertEqual(after.outletConnector, before.outletConnector, "compatible outlet connection remains")
if (!notices.some((text) => text.includes("入口压力表口"))) {
  throw new Error("reset reason is required")
}

const baseline = selectPressureRegulator(completeSelection)
assertEqual(
  baseline.result && baseline.result.vigourModel,
  "VSR-100UBS-20-2-4P-FV4-P-P-FV4",
  "business baseline"
)

let pageDefinition = null
global.Page = (definition) => {
  pageDefinition = definition
}
global.wx = {
  pageScrollTo() {},
  setClipboardData() {},
  showToast() {},
  showModal({ success }) {
    success({ confirm: true })
  }
}

const regulatorPageExports = require("../pages/regulator/index.js")

assertEqual(
  regulatorPageExports.buildSelectionProgress(completeSelection),
  { completed: 12, total: 12, percent: 100, label: "条件已完整" },
  "complete regulator progress"
)

const context = {
  data: {
    selection: { ...completeSelection },
    result: baseline.result,
    optionSheet: { visible: false, title: "", field: "", options: [] }
  },
  setData(patch, callback) {
    Object.assign(this.data, patch)
    if (callback) callback()
  },
  getStepNotice: pageDefinition.getStepNotice,
  applySelectionChange: pageDefinition.applySelectionChange,
  selectModel: pageDefinition.selectModel,
  scrollToTop() {},
  scrollToResult() {}
}

pageDefinition.onFieldInput.call(context, {
  currentTarget: { dataset: { field: "flow" } },
  detail: { value: "12" }
})
assertEqual(context.data.result, null, "editing invalidates old result")

pageDefinition.onFieldBlur.call(context)
if (!context.data.result) throw new Error("complete selection should auto-select on blur")

const regulatorWxml = fs.readFileSync("pages/regulator/index.wxml", "utf8")
const regulatorWxss = fs.readFileSync("pages/regulator/index.wxss", "utf8")
if (!regulatorWxml.includes("field-block--segmented")) {
  throw new Error("segmented regulator fields need a full-width layout hook")
}
if (!regulatorWxml.includes("field.key === 'flow' ? '请输入流量' : field.placeholder")) {
  throw new Error("flow input must leave room for the separately rendered slpm unit")
}
if (!/\.field-block--segmented\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s.test(regulatorWxss)) {
  throw new Error("segmented regulator fields must span the group width so long option labels cannot overlap")
}
if (!regulatorWxml.includes('wx:if="{{result.status !== \'需复核\'}}"')) {
  throw new Error("only confirmed regulator results may expose direct model copy")
}
if (!/<view\s+wx:else\s+class="model-card model-card--warning">[\s\S]*?建议核实[\s\S]*?<\/view>/s.test(regulatorWxml)) {
  throw new Error("review-only regulator results need a non-interactive verification card")
}
if (!/\.model-card\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s.test(regulatorWxss)) {
  throw new Error("regulator model cards must stack model and action to prevent clipping")
}
if (!/<button[^>]*class="model-card model-card--button"[^>]*bindtap="copyVigourModel"/.test(regulatorWxml)) {
  throw new Error("copyable regulator model must use the full-width native-button sizing hook")
}
if (!/\.model-card\.model-card--button\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*margin:\s*0;/s.test(regulatorWxss)) {
  throw new Error("native regulator model button must fill the result card width")
}
if (!/\.model-card--warning\s*\{[^}]*background:\s*#fff8e8;/s.test(regulatorWxss)) {
  throw new Error("review-only regulator model needs warning styling")
}
if (!/<text\s+class="ui-result-code result-code"\s+user-select="true">\{\{result\.vigourModel\}\}<\/text>/.test(regulatorWxml)) {
  throw new Error("regulator model must remain fully visible and selectable instead of hiding its suffix in horizontal scroll")
}
if (!/\.result-code\s*\{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s.test(regulatorWxss)) {
  throw new Error("long regulator models must wrap inside the result card")
}
if (!/\.model-card\s*\{[^}]*border:\s*1rpx\s+solid\s+#d9d6d0;[^}]*background:\s*#fafaf8;/s.test(regulatorWxss)) {
  throw new Error("confirmed regulator model card must use the neutral result surface")
}
if (/SFMono-Regular|Liberation Mono|monospace/.test(regulatorWxss)) {
  throw new Error("regulator UI must use the same font family as the rest of the app")
}
if (!/\.regulator-page\s+\.ui-result-code\s*\{[^}]*font-family:\s*inherit;/s.test(regulatorWxss)) {
  throw new Error("regulator result model must inherit the page font")
}
if (!/class="selection-progress"/.test(regulatorWxml) ||
    !/selectionProgress\.label/.test(regulatorWxml) ||
    !/selectionProgress\.percent/.test(regulatorWxml)) {
  throw new Error("regulator intro must show concise selection progress")
}
if (!/\.selection-progress__track\s*\{[^}]*overflow:\s*hidden;/s.test(regulatorWxss) ||
    !/\.selection-progress__bar\s*\{[^}]*background:\s*var\(--color-brand\);/s.test(regulatorWxss)) {
  throw new Error("regulator selection progress needs a contained visual track")
}

console.log("Regulator UI state contract passed")
