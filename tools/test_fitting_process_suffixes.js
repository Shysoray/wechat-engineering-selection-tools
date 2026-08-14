const path = require("path")
const fs = require("fs")
const vm = require("vm")

const root = path.resolve(__dirname, "..")
const pagePath = path.join(root, "packageFitting/pages/index.js")
const databasePath = path.join(root, "packageFitting/fittingDatabase.js")

function loadPage() {
  let page
  const sandbox = {
    require(modulePath) {
      return require(path.resolve(path.dirname(pagePath), modulePath))
    },
    Page(config) {
      page = config
    },
    wx: {},
    console,
    setTimeout,
    clearTimeout
  }

  vm.runInNewContext(fs.readFileSync(pagePath, "utf8"), sandbox)
  page.data = JSON.parse(JSON.stringify(page.data))
  page.setData = function setData(values) {
    Object.assign(this.data, values)
  }
  page.onLoad.call(page)
  return page
}

function validate(page, input) {
  page.setData({ batchInput: input })
  page.refreshBatchValidation.call(page)
  return page.data.batchResults[0]
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const page = loadPage()
const { fittingMappings } = require(databasePath)
const officialModels = [...new Set(fittingMappings.map((item) => item.sourceModel))]

officialModels.forEach((sourceModel) => {
  const result = validate(page, sourceModel)
  assert(result.kind === "exact", `Official model is not exact: ${sourceModel}`)
})

const swagelokItems = fittingMappings.filter((item) => item.brand === "Swagelok")
const storedModels = new Set(swagelokItems.map((item) => item.sourceModel))
const derivedModels = swagelokItems
  .filter((item) => (
    item.sourceModel.startsWith("6LV-")
    && !item.sourceModel.endsWith("P")
    && !item.noMatch
    && item.vigourModel
    && !["P", "CP"].includes(item.connectionCode)
    && !storedModels.has(`${item.sourceModel}P`)
    && !item.sourceModel.endsWith("P6")
  ))
  .map((item) => ({
    sourceModel: item.sourceModel,
    expected: `${item.vigourModel}-P`
  }))

derivedModels.forEach(({ sourceModel, expected }) => {
  ;[`${sourceModel}P`, `${sourceModel}-P`].forEach((input) => {
    const result = validate(page, input)
    assert(result.kind === "exact", `Derived P model is not exact: ${input}`)
    assert(
      result.candidates.some((candidate) => candidate.vigourModel === expected),
      `Derived P target is invalid: ${input}`
    )
  })
})

const blockedModels = [
  "6LV-4MW-6-2P6P",
  "6LV-4-VCR-3S-4TB3PP",
  "6LV-4MW-6-2SC06",
  "6LV-4MW-6-2-SC06",
  "6LV-4MW-6-2SC11",
  "6LV-4MW-6-2-SC11"
]

blockedModels.forEach((input) => {
  const result = validate(page, input)
  assert(result.kind === "missing", `Unsupported process was not blocked: ${input}`)
})

const references = {
  "6LV-4-VCR-3S-4TB3P": "VVR-FG4-TB4-L18-SLV-P",
  "6LV-4-VCR-3S-4TB3-P": "VVR-FG4-TB4-L18-SLV-P",
  "6LV-4-VCR-3S-4TB3": "VVR-FG4-TB4-L18-SLV",
  "SS-4-VCR-P": "VVR-P4",
  "SS-4-VCR-CP": "VVR-C4",
  "6LV-4MW-6-2P6": "VMW-RU4-2-SLV"
}

Object.entries(references).forEach(([input, expected]) => {
  const result = validate(page, input)
  assert(result.kind === "exact", `Reference model is not exact: ${input}`)
  assert(
    result.candidates.some((candidate) => candidate.vigourModel === expected),
    `Reference target is invalid: ${input}`
  )
})

console.log(
  `Process suffix regression passed: ${officialModels.length} official, `
  + `${derivedModels.length * 2} derived, ${blockedModels.length} blocked, `
  + `${Object.keys(references).length} references`
)
