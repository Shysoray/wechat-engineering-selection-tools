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

const exactPlug = exactItemsForInput("SS-810-P", searchIndex)
if (!exactPlug.some((item) => item.brand === "Swagelok" && item.vigourModel === "SS-VP-08")) {
  throw new Error(`SS-810-P should exact-match the tube fitting plug, got ${JSON.stringify(exactPlug)}`)
}

const exactIsoParallel = exactItemsForInput("SS-810-7-6-RJ", searchIndex)
if (!exactIsoParallel.some((item) => item.brand === "Swagelok" && item.sourceModel === "SS-810-7-6RJ" && item.vigourModel === "SS-VFC-08-G6")) {
  throw new Error(`SS-810-7-6-RJ should exact-match SS-810-7-6RJ, got ${JSON.stringify(exactIsoParallel)}`)
}

const exactIsoTapered = exactItemsForInput("SS-400-1-4-RT", searchIndex)
if (!exactIsoTapered.some((item) => item.brand === "Swagelok" && item.sourceModel === "SS-400-1-4RT" && item.vigourModel === "SS-VMC-04-R4")) {
  throw new Error(`SS-400-1-4-RT should exact-match SS-400-1-4RT, got ${JSON.stringify(exactIsoTapered)}`)
}

const exactNoMatchAlias = exactItemsForInput("SS-810-7-4-RJ", searchIndex)
if (!exactNoMatchAlias.length || !exactNoMatchAlias.every((item) => item.brand === "Swagelok" && (item.noMatch || !item.vigourModel))) {
  throw new Error(`SS-810-7-4-RJ should exact-match the Swagelok no-match guard, got ${JSON.stringify(exactNoMatchAlias)}`)
}

const fuzzyElbow = fuzzyCandidatesForInput("SS-81O-9", searchIndex).items
if (!fuzzyElbow.length || fuzzyElbow[0].item.sourceModel !== "SS-810-9") {
  throw new Error(`SS-81O-9 should safely recognize the OCR form of SS-810-9, got ${JSON.stringify(fuzzyElbow)}`)
}
if (fuzzyElbow.some((entry) => !entry.item.sourceModel.startsWith("SS-810-"))) {
  throw new Error(`Swagelok tube fuzzy candidates should stay within SS-810 scope, got ${JSON.stringify(fuzzyElbow)}`)
}

const incompleteThread = fuzzyCandidatesForInput("SS-810-1-4R", searchIndex)
if (incompleteThread.items.length || !incompleteThread.blocked) {
  throw new Error(`Incomplete thread suffix must be blocked instead of guessed, got ${JSON.stringify(incompleteThread)}`)
}

console.log("Tube fitting fuzzy scope OK")
