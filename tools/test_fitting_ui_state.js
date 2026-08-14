const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageDefinition(wxOverrides = {}) {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = fs.readFileSync(filename, "utf8")
  const localRequire = Module.createRequire(filename)
  let pageDefinition = null
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    { exports: {} },
    {},
    (definition) => { pageDefinition = definition },
    { pageScrollTo() {}, showToast() {}, showModal() {}, ...wxOverrides }
  )
  return pageDefinition
}

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: ${JSON.stringify({ actual, expected })}`)
  }
}

function findCopyableReviewButtons(markup) {
  const buttonElements = markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || []
  return buttonElements.filter((button) => {
    const openingTagMatch = button.match(/^<button\b[^>]*>/)
    if (!openingTagMatch) return false

    const openingTag = openingTagMatch[0]
    const classMatch = openingTag.match(/\bclass="([^"]*)"/)
    const classes = classMatch ? classMatch[1].split(/\s+/) : []
    return classes.includes("mapping-card") &&
      classes.includes("mapping-card--warning") &&
      openingTag.includes('bindtap="copyVigourModel"')
  })
}

function findCopyableExactButtons(markup) {
  const buttonElements = markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || []
  return buttonElements.filter((button) => {
    const openingTagMatch = button.match(/^<button\b[^>]*>/)
    if (!openingTagMatch) return false

    const openingTag = openingTagMatch[0]
    const classMatch = openingTag.match(/\bclass="([^"]*)"/)
    const classes = classMatch ? classMatch[1].split(/\s+/) : []
    return classes.includes("mapping-card") &&
      !classes.includes("mapping-card--warning") &&
      openingTag.includes('bindtap="copyVigourModel"') &&
      openingTag.includes('data-review="false"')
  })
}

const clipboardValues = []
const copyToasts = []
const page = loadPageDefinition({
  setClipboardData({ data, success }) {
    clipboardValues.push(data)
    success()
  },
  showToast(options) { copyToasts.push(options) }
})
if (typeof page.runBatchValidation !== "function") {
  throw new Error("runBatchValidation is required")
}

const malformedQueryContext = {
  data: { ...page.data },
  setData(next) { this.data = { ...this.data, ...next } }
}
page.onLoad.call(malformedQueryContext, { query: "%" })
assertEqual(malformedQueryContext.data.batchInput, "%", "malformed route query must not crash the page")

const context = {
  data: {
    ...page.data,
    batchInput: "",
    batchResults: [],
    visibleBatchResults: [],
    batchFilter: "all",
    batchSummary: { total: 0, exact: 0, candidate: 0, missing: 0 }
  },
  allBrandSearchIndex: null,
  setData(next) { this.data = { ...this.data, ...next } },
  refreshBatchValidation: page.refreshBatchValidation,
  scrollToResult() {}
}

page.onBatchInput.call(context, { detail: { value: [
  "SS-4-VCR-2-GR-VS",
  "SS-81O-9",
  "NOT-A-MODEL"
].join("\n") } })
assertEqual(context.data.batchResults.length, 0, "typing must not auto-match")

page.runBatchValidation.call(context)
assertEqual(context.data.batchResults.length, 3, "button submits")

page.setBatchFilter.call(context, { currentTarget: { dataset: { filter: "candidate" } } })
assertEqual(context.data.visibleBatchResults.length, 2, "candidate screen filter includes exact hits blocked by missing dimension evidence")

const delimiterContext = {
  data: {
    ...page.data,
    batchInput: "SS-4-VCR-2-GR-VS;SS-8-VCR-6-DM",
    batchResults: [],
    visibleBatchResults: [],
    batchFilter: "all",
    batchSummary: { total: 0, exact: 0, candidate: 0, missing: 0 }
  },
  allBrandSearchIndex: null,
  setData(next) { this.data = { ...this.data, ...next } },
  refreshBatchValidation: page.refreshBatchValidation,
  scrollToResult() {}
}
page.runBatchValidation.call(delimiterContext)
assertEqual(delimiterContext.data.batchResults.length, 2, "ASCII semicolon splits batch input")
delimiterContext.data.batchInput = "SS-4-VCR-2-GR-VS；SS-8-VCR-6-DM"
page.runBatchValidation.call(delimiterContext)
assertEqual(delimiterContext.data.batchResults.length, 2, "Chinese semicolon splits batch input")

const overflowContext = {
  data: {
    ...page.data,
    batchInput: Array.from({ length: 101 }, () => "SS-4-VCR-2-GR-VS").join("\n"),
    batchResults: [],
    visibleBatchResults: [],
    batchFilter: "all",
    batchSummary: { total: 0, exact: 0, candidate: 0, missing: 0 },
    batchOverflowCount: 0
  },
  allBrandSearchIndex: null,
  setData(next) { this.data = { ...this.data, ...next } },
  refreshBatchValidation: page.refreshBatchValidation,
  scrollToResult() {}
}
page.runBatchValidation.call(overflowContext)
assertEqual(overflowContext.data.batchResults.length, 0, "overflow input must not be partially processed")
assertEqual(overflowContext.data.batchOverflowCount, 1, "overflow count is visible to the UI")

const reviewContext = {
  data: {
    ...page.data,
    batchInput: "",
    batchResults: [],
    visibleBatchResults: [],
    batchFilter: "all",
    batchSummary: { total: 0, exact: 0, candidate: 0, missing: 0 }
  },
  allBrandSearchIndex: null,
  setData(next) { this.data = { ...this.data, ...next } },
  refreshBatchValidation: page.refreshBatchValidation,
  scrollToResult() {}
}
page.onBatchInput.call(reviewContext, { detail: { value: "6LV-4-VCR-3S-4TB2" } })
page.runBatchValidation.call(reviewContext)
const reviewResult = reviewContext.data.batchResults[0]
assertEqual(reviewResult.kind, "exact", "recognized source model remains an exact database hit")
assertEqual(reviewResult.reviewRequired, true, "unconfirmed exact target must use warning presentation")
assertEqual(reviewResult.presentationKind, "candidate", "review target uses candidate presentation category")
assertEqual(reviewResult.kindText, "精确命中 · 建议核实", "review state wording")
assertEqual(reviewResult.candidates[0].displayVigourModel, "VVR-FG4-TB4-L15-SLV", "full review model remains available")
assertEqual(reviewResult.candidates[0].copyAllowed, false, "review model is not directly copyable")
assertEqual(reviewContext.data.batchSummary, { total: 1, exact: 0, candidate: 1, missing: 0 }, "review summary uses warning count")
page.setBatchFilter.call(reviewContext, { currentTarget: { dataset: { filter: "candidate" } } })
assertEqual(reviewContext.data.visibleBatchResults.length, 1, "review result appears in pending filter")

const modelCopyCalls = []
const modelCopyContext = {
  copyText(value, title) { modelCopyCalls.push({ value, title }) }
}
page.copyVigourModel.call(modelCopyContext, {
  currentTarget: { dataset: { model: "VVR-FN8", review: false } }
})
page.copyVigourModel.call(modelCopyContext, {
  currentTarget: { dataset: { model: "VVR-FN8", review: "false" } }
})
page.copyVigourModel.call(modelCopyContext, {
  currentTarget: { dataset: { model: "VVR-FG4-TB4-L15-SLV", review: true } }
})
page.copyVigourModel.call(modelCopyContext, {
  currentTarget: { dataset: { model: "VVR-FG4-TB4-L15-SLV", review: "true" } }
})
assertEqual(modelCopyCalls, [
  { value: "VVR-FN8", title: "型号已复制" },
  { value: "VVR-FN8", title: "型号已复制" },
  { value: "VVR-FG4-TB4-L15-SLV", title: "待确认型号已复制，请核实规格" },
  { value: "VVR-FG4-TB4-L15-SLV", title: "待确认型号已复制，请核实规格" }
], "boolean and serialized exact and review copy feedback")

clipboardValues.length = 0
copyToasts.length = 0
page.copyVigourModel.call(page, {
  currentTarget: { dataset: { model: "VVR-FN8", review: false } }
})
page.copyVigourModel.call(page, {
  currentTarget: { dataset: { model: "VVR-FG4-TB4-L15-SLV", review: true } }
})
assertEqual(clipboardValues, ["VVR-FN8", "VVR-FG4-TB4-L15-SLV"], "model clipboard writes")
assertEqual(copyToasts, [
  { title: "型号已复制", icon: "success" },
  { title: "待确认型号已复制，请核实规格", icon: "none" }
], "exact and review clipboard success toasts")

let copied = ""
const copyContext = {
  data: context.data,
  copyText(value) { copied = value }
}
page.copyBatchSales.call(copyContext)
assertEqual(copied.split("\n").length, 3, "copy ignores screen filter")

const wxml = fs.readFileSync(path.resolve("packageFitting/pages/index.wxml"), "utf8")
for (const contract of ["runBatchValidation", "visibleBatchResults", "复制销售结果", "复制完整对照"]) {
  if (!wxml.includes(contract)) throw new Error(`missing fitting UI contract: ${contract}`)
}
if (!wxml.includes("batchOverflowCount")) {
  throw new Error("batch overflow must have a visible UI notice")
}
if ((wxml.match(/hasDimensionComparison/g) || []).length !== 2) {
  throw new Error("batch and condition-selection results must both render catalog dimension comparisons")
}
for (const contract of ["尺寸差异 / DIMENSION DELTA", "dimension.sourceText", "dimension.targetText", "dimension.differenceText", "dimension.toleranceText"]) {
  if (!wxml.includes(contract)) throw new Error(`missing dimension comparison UI contract: ${contract}`)
}
if (!wxml.includes('ui-status-{{item.statusTone}}">{{item.kindText}}')) {
  throw new Error("condition-selection result status must use the shared result classification")
}
if (!wxml.includes("picker-field {{activeFields.length ? '' : 'picker-field--wide'}}")) {
  throw new Error("brand selector must span the full row before condition fields are available")
}
if (!/picker-field picker-field--wide \{\{selection\.brand \? '' : 'picker-field--disabled'\}\}[^>]*disabled="\{\{!selection\.brand\}\}"/s.test(wxml)) {
  throw new Error("source-model selector must remain full width and visibly disabled until a brand is selected")
}
const reviewButtons = findCopyableReviewButtons(wxml)
const passiveReviewShape = `
  <button class="batch-submit" bindtap="runBatchValidation">提交</button>
  <view wx:if="{{candidate.salesNeedsConfirmation}}" class="mapping-card mapping-card--warning">待确认</view>
  <button wx:elif="{{candidate.copyAllowed}}" class="mapping-card" bindtap="copyVigourModel">复制</button>
`
const passiveReviewFalsePositives = findCopyableReviewButtons(passiveReviewShape)
if (passiveReviewFalsePositives.length !== 0) {
  throw new Error("review button matcher must not cross button boundaries around a passive warning view")
}
if (reviewButtons.length !== 2) {
  throw new Error(`both review result regions must use copyable warning buttons: ${reviewButtons.length}`)
}
for (const branch of [
  'wx:if="{{candidate.salesNeedsConfirmation && candidate.reviewCopyAllowed && candidate.displayVigourModel}}"',
  'wx:elif="{{item.salesNeedsConfirmation && item.reviewCopyAllowed && item.displayVigourModel}}"'
]) {
  if (!reviewButtons.some((button) => button.includes(branch))) {
    throw new Error(`review result branch is not a bounded copyable button: ${branch}`)
  }
}
if (!reviewButtons.every((button) => button.includes('data-review="true"') && button.includes("复制并核实"))) {
  throw new Error("review copy marker or action wording missing")
}
if (!wxml.includes('wx:elif="{{candidate.displayVigourModel}}"') || !wxml.includes("仅供核对")) {
  throw new Error("fuzzy candidate must render as a non-copyable review card")
}
const exactButtons = findCopyableExactButtons(wxml)
const passiveExactShape = `
  <button class="batch-submit" bindtap="runBatchValidation">提交</button>
  <view class="mapping-card" data-review="false">精确型号</view>
  <button class="unrelated" bindtap="copyVigourModel">复制</button>
`
const passiveExactFalsePositives = findCopyableExactButtons(passiveExactShape)
if (passiveExactFalsePositives.length !== 0) {
  throw new Error("exact button matcher must not cross button boundaries around a passive mapping view")
}
if (exactButtons.length !== 2) {
  throw new Error(`both exact result regions must use copyable mapping buttons: ${exactButtons.length}`)
}
for (const branch of [
  'wx:elif="{{candidate.hasVigourModel && candidate.copyAllowed}}"',
  'wx:if="{{item.hasVigourModel && item.copyAllowed}}"'
]) {
  if (!exactButtons.some((button) => button.includes(branch))) {
    throw new Error(`exact result branch is not a copyable mapping button: ${branch}`)
  }
}

const wxss = fs.readFileSync(path.resolve("packageFitting/pages/index.wxss"), "utf8")
if (!/\.mapping-card\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s.test(wxss)) {
  throw new Error("mapping cards must stack model and action to prevent native scroll-view overlap")
}
if (!/\.candidate-list\s*,\s*\.candidate-row\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s.test(wxss)) {
  throw new Error("candidate containers must fill the result card before mapping buttons can stretch")
}
const allCopyableMappingButtons = [...reviewButtons, ...exactButtons]
if (!allCopyableMappingButtons.every((button) => /\bclass="[^"]*\bmapping-card--button\b/.test(button))) {
  throw new Error("all exact and review result buttons must use the native-button stretch class")
}
if (!allCopyableMappingButtons.every((button) => /\bclass="[^"]*\bmapping-card__content\b/.test(button))) {
  throw new Error("all exact and review result buttons must use a classed full-width content wrapper")
}
const nativeMappingButtonRule = wxss.match(/\.mapping-card\.mapping-card--button\s*\{([^}]*)\}/s)
if (!nativeMappingButtonRule ||
    !/align-self:\s*stretch;/.test(nativeMappingButtonRule[1]) ||
    !/width:\s*100%;/.test(nativeMappingButtonRule[1]) ||
    !/max-width:\s*100%;/.test(nativeMappingButtonRule[1]) ||
    !/margin:\s*0;/.test(nativeMappingButtonRule[1])) {
  throw new Error("native mapping buttons must use a compound class selector that overrides WeChat's injected 184px width")
}
if (/button\.mapping-card\s*\{/.test(wxss)) {
  throw new Error("page WXSS must not use unsupported tag-name selectors for mapping buttons")
}
if (!/\.mapping-card__content\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s.test(wxss) ||
    /\.mapping-card\s*>\s*view\s*\{/.test(wxss)) {
  throw new Error("mapping content width must use a supported class selector")
}
if (/SFMono-Regular|Liberation Mono|monospace/.test(wxss)) {
  throw new Error("fitting UI must use the same font family as the rest of the app")
}
if (!/\.fitting-page\s+\.ui-result-code\s*\{[^}]*font-family:\s*inherit;/s.test(wxss)) {
  throw new Error("result model text must inherit the page font")
}
if (!/\.picker-field\.picker-field--wide\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*margin:\s*0;/s.test(wxss)) {
  throw new Error("full-row condition selectors must override the native fixed button width")
}
if (!/\.select-reset\.ui-button-secondary\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*margin:/s.test(wxss)) {
  throw new Error("condition reset action must share the same full-width alignment")
}
const warningRule = wxss.match(/\.mapping-card--warning\s*\{([^}]*)\}/s)
if (!warningRule || /\b(width|min-height|height|padding|display|flex-direction|align-items|justify-content)\s*:/.test(warningRule[1])) {
  throw new Error("warning mapping card must inherit the shared size skeleton")
}

console.log("Fitting UI state contract passed")
