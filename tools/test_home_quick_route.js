const fs = require("fs")
const path = require("path")
const Module = require("module")

const navigations = []
const wxMock = {
  navigateTo({ url }) { navigations.push(url) },
  showToast() {}
}

function loadPageDefinition() {
  const filename = path.resolve("pages/index/index.js")
  const source = fs.readFileSync(filename, "utf8")
  const localRequire = Module.createRequire(filename)
  let pageDefinition = null
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    { exports: {} },
    {},
    (definition) => { pageDefinition = definition },
    wxMock
  )
  return pageDefinition
}

function createContext(input) {
  const context = {
    data: {
      quickModel: input,
      pendingQuickModel: "",
      chooser: "",
      tools: []
    },
    setData(next) {
      this.data = { ...this.data, ...next }
    },
    navigateToModelTool: page.navigateToModelTool
  }
  return context
}

const page = loadPageDefinition()

const featuredCard = page.data.tools[0]
const projectConfig = JSON.parse(fs.readFileSync(path.resolve("project.config.json"), "utf8"))
const ignoredLocalFiles = new Set(
  (projectConfig.packOptions?.ignore || [])
    .filter((item) => item.type === "file")
    .map((item) => `/${String(item.value).replace(/^\/+/, "")}`)
)
if (!featuredCard?.image?.startsWith("/")) {
  throw new Error("featured homepage card must reference a local image")
}
if (ignoredLocalFiles.has(featuredCard.image)) {
  throw new Error(`featured homepage image must be included in the mini program package: ${featuredCard.image}`)
}

const aptechCard = page.data.tools.find((item) => item.id === "aptech")
const regulatorCard = page.data.tools.find((item) => item.id === "pressure-regulator")
if (!aptechCard || !regulatorCard || aptechCard.image !== regulatorCard.image || !aptechCard.image) {
  throw new Error("APTech and regulator cards must share the approved regulator product image")
}

function assertRoute(input, expected) {
  const context = createContext(input)
  navigations.length = 0
  page.submitQuickModel.call(context)
  if (navigations[0] !== expected) {
    throw new Error(`unexpected route: ${JSON.stringify({ input, actual: navigations[0], expected })}`)
  }
}

assertRoute(
  "AP4000SM 2PW MV6 MV6",
  "/pages/aptech/index?query=AP4000SM%202PW%20MV6%20MV6&source=home"
)
assertRoute(
  "SS-4-VCR-2-GR-VS",
  "/packageFitting/pages/index?query=SS-4-VCR-2-GR-VS&source=home"
)
for (const fittingModel of [
  "VUWL-12.7-V",
  "MC 4 - 4N - SS",
  "TUE-8",
  "SUE - 8",
  "UEU-08-SS"
]) {
  assertRoute(
    fittingModel,
    `/packageFitting/pages/index?query=${encodeURIComponent(fittingModel)}&source=home`
  )
}

const ambiguous = createContext("UNKNOWN-MODEL")
page.submitQuickModel.call(ambiguous)
if (ambiguous.data.chooser !== "single" || ambiguous.data.pendingQuickModel !== "UNKNOWN-MODEL") {
  throw new Error(`ambiguous model must open chooser: ${JSON.stringify(ambiguous.data)}`)
}

page.openBatchChooser.call(ambiguous)
if (ambiguous.data.chooser !== "batch") {
  throw new Error("batch chooser must open")
}

const wxml = fs.readFileSync(path.resolve("pages/index/index.wxml"), "utf8")
for (const contract of ["quick-model-input", "openBatchChooser", "tool-card--featured", "aptech-placeholder"]) {
  if (!wxml.includes(contract)) throw new Error(`missing homepage contract: ${contract}`)
}

for (const accessibilityContract of [
  'aria-label="提交快速型号查询"',
  'aria-role="button"',
  'aria-label="打开{{item.name}}，{{item.desc}}"'
]) {
  if (!wxml.includes(accessibilityContract)) {
    throw new Error(`missing homepage accessibility contract: ${accessibilityContract}`)
  }
}

for (const removed of ["home-title", "更快找到", "正确型号"]) {
  if (wxml.includes(removed)) throw new Error(`obsolete hero title remains: ${removed}`)
}

for (const contract of [
  '<text class="home-kicker">ENGINEERING SELECTION TOOLS</text>',
  '<text class="home-tool-title">选型工具</text>'
]) {
  if (!wxml.includes(contract)) throw new Error(`missing simplified homepage brand copy: ${contract}`)
}

for (const removed of [
  "面向工程师与销售的专业选型工具",
  "Professional tools for confident engineering decisions",
  "home-subtitle",
  "home-subtitle-en"
]) {
  if (wxml.includes(removed)) throw new Error(`obsolete homepage brand description remains: ${removed}`)
}

for (const contract of [
  "brand-lockup",
  "brand-lockup__part--en",
  "brand-lockup__part--cn",
  "vigour-brand-lockup-white.png",
  "tool-card__media",
  "tool-card__image--foreground"
]) {
  if (!wxml.includes(contract)) throw new Error(`missing corrected homepage layout: ${contract}`)
}

for (const removed of ["<text class=\"brand-lockup__cn\"", "brand-lockup__cn-mark"]) {
  if (wxml.includes(removed)) {
    throw new Error(`homepage must use the official horizontal VIGOUR / 皓固 lockup: ${removed}`)
  }
}

if (!fs.existsSync(path.resolve("assets/brand/vigour-brand-lockup-white.png"))) {
  throw new Error("missing official VIGOUR / 皓固 lockup asset")
}

const wxss = fs.readFileSync(path.resolve("pages/index/index.wxss"), "utf8")
for (const contract of [
  ".tool-card__media",
  "flex: 1",
  ".brand-lockup__part--cn",
  "left: -190rpx",
  "width: 74rpx",
  "mix-blend-mode: multiply",
  "grid-template-columns: repeat(2"
]) {
  if (!wxss.includes(contract)) throw new Error(`missing corrected homepage style: ${contract}`)
}

const compactStyleContracts = [
  [/\.home\s*\{[^}]*padding-bottom:\s*calc\(16rpx \+ env\(safe-area-inset-bottom\)\)/s, "compact safe-area bottom spacing"],
  [/\.home-hero\s*\{[^}]*padding:\s*4rpx 4rpx 10rpx/s, "compact hero spacing"],
  [/\.home-kicker\s*\{[^}]*margin-top:\s*7rpx/s, "compact English brand-label spacing"],
  [/\.home-tool-title\s*\{[^}]*display:\s*block[^}]*margin-top:\s*2rpx[^}]*font-size:\s*25rpx[^}]*line-height:\s*1\.25/s, "compact Chinese tool-title spacing"],
  [/\.quick-card\s*\{[^}]*padding:\s*18rpx/s, "compact quick-search spacing"],
  [/\.tools-heading\s*\{[^}]*margin:\s*18rpx 4rpx 10rpx/s, "compact tools heading spacing"],
  [/\.tool-grid\s*\{[^}]*gap:\s*10rpx/s, "compact tool grid spacing"],
  [/\.tool-card\s*\{[^}]*min-height:\s*310rpx[^}]*padding:\s*14rpx/s, "compact standard cards"],
  [/\.tool-card--featured\s*\{[^}]*min-height:\s*216rpx/s, "compact featured card"],
  [/\.tool-card__media\s*\{[^}]*height:\s*112rpx[^}]*margin-top:\s*12rpx/s, "unchanged media size with reduced gap"]
]

for (const [pattern, label] of compactStyleContracts) {
  if (!pattern.test(wxss)) throw new Error(`missing homepage single-screen contract: ${label}`)
}

const featuredMediaRule = wxss.match(/\.tool-card--featured\s+\.tool-card__media\s*\{([^}]*)\}/s)
if (!featuredMediaRule || !/z-index:\s*2\b/.test(featuredMediaRule[1])) {
  throw new Error("featured media must sit explicitly above the red decorative layer")
}

const featuredForegroundRule = wxss.match(/\.tool-card__image--foreground\s*\{([^}]*)\}/s)
if (
  !featuredForegroundRule
  || !/position:\s*relative\b/.test(featuredForegroundRule[1])
  || !/z-index:\s*1\b/.test(featuredForegroundRule[1])
  || !/opacity:\s*1(?:\.0+)?\b/.test(featuredForegroundRule[1])
  || !/mix-blend-mode:\s*normal\b/.test(featuredForegroundRule[1])
) {
  throw new Error("featured product image must be an opaque foreground above its media decoration")
}

if (/@media \(max-width: 360px\)[\s\S]*?\.tool-card__name\s*\{[^}]*font-size:/s.test(wxss)) {
  throw new Error("narrow screens must not shrink tool-card fonts")
}

console.log("Home quick route contract passed")
