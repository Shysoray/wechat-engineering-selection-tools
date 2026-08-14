const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { buildSearchIndex, exactItemsForInput, fuzzyCandidatesForInput, normalizeModelText }`
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

function assertNoExact(input, forbiddenSource) {
  const exact = exactItemsForInput(input, searchIndex)
  if (exact.some((item) => item.brand === "FUJIKIN" && item.sourceModel === forbiddenSource)) {
    throw new Error(`${input} must not exact-match ${forbiddenSource}, got ${JSON.stringify(exact)}`)
  }
}

function assertNoFuzzy(input, forbiddenSource) {
  const fuzzy = fuzzyCandidatesForInput(input, searchIndex).items
  if (fuzzy.some((entry) => entry.item.brand === "FUJIKIN" && entry.item.sourceModel === forbiddenSource)) {
    throw new Error(`${input} must not fuzzy-match ${forbiddenSource}, got ${JSON.stringify(fuzzy)}`)
  }
}

function assertExact(input, expectedSource, expectedVigour) {
  const exact = exactItemsForInput(input, searchIndex)
  if (!exact.some((item) => item.brand === "FUJIKIN" && item.sourceModel === expectedSource && item.vigourModel === expectedVigour)) {
    throw new Error(`${input} should exact-match ${expectedSource} -> ${expectedVigour}, got ${JSON.stringify(exact)}`)
  }
}

assertExact("VUWG-1.6AN-V", "VUWG-1.6AN-V", "SS-VFC-01-F2")
assertExact("VUW-1.6SR-V", "VUW-1.6SR-V", "SS-VFF-01 / SS-VBF-01")

assertNoExact("VUWG-16AN-V", "VUWG-1.6AN-V")
assertNoExact("VUW-16SR-V", "VUW-1.6SR-V")
assertNoFuzzy("VUWG-16AN-V", "VUWG-1.6AN-V")
assertNoFuzzy("VUW-16SR-V", "VUW-1.6SR-V")
assertNoFuzzy("VUWG-16AN-V", "VUWG-16DN-V")
assertNoFuzzy("VUWH-16AN-V", "VUWH-16CN-V")

assertNoFuzzy("VUW-4.8N-V", "VUW-4.8SR-V")
assertNoFuzzy("VUW-A-19.05E-V", "VUWTS-19.05E-V")
assertNoFuzzy("VUWR-19.05X15.88-V", "VUWF-19.05X15.88-T/C-V")

console.log("Fujikin V-LOK risk guards OK")
