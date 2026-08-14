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

function assertExact(input, vigourModel) {
  const item = exactItem(input)
  if (item.brand !== "Swagelok" || item.vigourModel !== vigourModel || item.noMatch) {
    throw new Error(`${input}: expected ${vigourModel}, got ${JSON.stringify(item)}`)
  }
}

function assertNoMatch(input) {
  const item = exactItem(input)
  if (item.brand !== "Swagelok" || !item.noMatch || item.vigourModel) {
    throw new Error(`${input}: expected Swagelok no-match guard, got ${JSON.stringify(item)}`)
  }
  if (fuzzyCandidatesForInput(input, searchIndex).items.length) {
    throw new Error(`${input}: exact no-match guard must not fall through to fuzzy candidates`)
  }
}

assertExact("SS-4-VCR-2-GR-VS", "VVR-GKR-G4")
assertExact("SS-8-VCR-2-GR-VS", "VVR-GKR-G8")
assertExact("NI-12-VCR-2-GR-VS", "VVR-GKR-G12-NI")
assertExact("NI-16-VCR-2-GR-VS", "VVR-GKR-G16-NI")

assertNoMatch("SS-10-VCR-2")
assertNoMatch("SS-10-VCR-2-VS")
assertNoMatch("SS-4-VCR-2-ZC-VS")
assertNoMatch("SS-8-VCR-2-ZC-VS")
assertNoMatch("CU-4-VCR-2-GR-VS")

const guardedInput = "SS-4-VCR-2-GR-VSX"
const guardedCandidates = fuzzyCandidatesForInput(guardedInput, searchIndex).items
if (guardedCandidates.some((entry) => {
  const item = entry.item
  return item.materialCode !== "SS"
    || item.vcrCode !== "4-VCR"
    || item.connectionCode !== "2-GR"
    || item.tubeCode !== "VS"
})) {
  throw new Error(`${guardedInput}: fuzzy candidates changed a VCR gasket hard field: ${JSON.stringify(guardedCandidates)}`)
}

console.log("Swagelok VCR gasket safety regression passed")
