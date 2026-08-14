const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { buildSearchIndex, exactItemsForInput, fuzzyCandidatesForInput }`
  const localRequire = Module.createRequire(filename)
  const testModule = { exports: {} }
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    testModule,
    testModule.exports,
    () => {},
    {}
  )
  return testModule.exports
}

const { buildSearchIndex, exactItemsForInput, fuzzyCandidatesForInput } = loadPageInternals()
const searchIndex = buildSearchIndex("")

function exactItem(input) {
  const items = exactItemsForInput(input, searchIndex)
  if (items.length !== 1) {
    throw new Error(`${input}: expected one exact result, got ${JSON.stringify(items)}`)
  }
  return items[0]
}

function assertOrificeRequired(input, size) {
  const item = exactItem(input)
  const expectedAdvisory = `VVR-MU${size}-DM-[孔径]`
  if (item.brand !== "Swagelok" || !item.noMatch || item.vigourModel) {
    throw new Error(`${input}: expected guarded advisory result, got ${JSON.stringify(item)}`)
  }
  if (
    item.advisoryModel !== expectedAdvisory
    || item.salesStatus !== "needs_confirmation"
    || JSON.stringify(item.missingParameters) !== JSON.stringify(["限流孔径"])
    || item.nextAction !== "请确认限流孔径"
  ) {
    throw new Error(`${input}: advisory fields invalid: ${JSON.stringify(item)}`)
  }
  if (item.specialFeatureMatched !== false || !/孔径/.test(item.specialFeatureLabel || "")) {
    throw new Error(`${input}: expected an orifice warning, got ${JSON.stringify(item)}`)
  }
  if (fuzzyCandidatesForInput(input, searchIndex).items.length) {
    throw new Error(`${input}: guarded advisory result must not fall through to fuzzy candidates`)
  }
}

;["2", "4", "8", "12", "16"].forEach((size) => {
  assertOrificeRequired(`SS-${size}-VCR-6-DM`, size)
})

const restricted = exactItem("6LV-4-VCR-6-DM-010P")
if (restricted.noMatch || restricted.vigourModel !== "VVR-MU4-DM-010-P") {
  throw new Error(`6LV-4-VCR-6-DM-010P: expected exact restrictor mapping, got ${JSON.stringify(restricted)}`)
}

const unsupported = exactItem("6LV-4-VCR-6-DM-065P")
if (!unsupported.noMatch || unsupported.vigourModel) {
  throw new Error(`6LV-4-VCR-6-DM-065P: expected unsupported-orifice guard, got ${JSON.stringify(unsupported)}`)
}

console.log("Swagelok flow restrictor orifice guard regression passed")
