const { fittingMappings } = require("../packageFitting/fittingDatabase")
const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { buildSearchIndex, exactItemsForInput }`
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

function findTk(model) {
  return fittingMappings.filter((item) => item.brand === "TK-Fujikin" && item.sourceModel === model)
}

function assertSingle(model, expectedVigour, expectedProductCode) {
  const matches = findTk(model)
  if (matches.length !== 1) {
    throw new Error(`${model}: expected one TK-Fujikin row, found ${matches.length}`)
  }
  const item = matches[0]
  if (item.vigourModel !== expectedVigour) {
    throw new Error(`${model}: expected ${expectedVigour}, received ${item.vigourModel}`)
  }
  if (item.productCode !== expectedProductCode) {
    throw new Error(`${model}: expected product ${expectedProductCode}, received ${item.productCode}`)
  }
  if (item.noMatch) {
    throw new Error(`${model}: should be a usable mapping`)
  }
}

assertSingle("US4GT", "VVR-GK-G4", "GT")
assertSingle("UN4GT", "VVR-GK-G4-NI", "GT")
assertSingle("US8GT", "VVR-GK-G8", "GT")
assertSingle("UN8GT", "VVR-GK-G8-NI", "GT")
assertSingle("US4GR", "VVR-GKR-G4", "GR")
assertSingle("UN4GR", "VVR-GKR-G4-NI", "GR")
assertSingle("US4GB", "VVR-GK-G4-BL", "GB")
assertSingle("UN4GB", "VVR-GK-G4-NI-BL", "GB")
assertSingle("S4HFN", "HVVR-FN4", "HFN")
assertSingle("S4HMN", "HVVR-MN4", "HMN")
assertSingle("S6x4HLG-P", "HVVR-HG4-TB6-L33", "HLG")

const { buildSearchIndex, exactItemsForInput } = loadPageInternals()
const searchIndex = buildSearchIndex("")
const unExact = exactItemsForInput("UN4GT", searchIndex)
if (!unExact.some((item) => item.brand === "TK-Fujikin" && item.sourceModel === "UN4GT" && item.vigourModel === "VVR-GK-G4-NI")) {
  throw new Error(`UN4GT should exact-match the nickel gasket row, got ${JSON.stringify(unExact)}`)
}
if (unExact.some((item) => item.brand === "TK-Fujikin" && item.sourceModel === "US4GT")) {
  throw new Error(`UN4GT must not alias to the stainless US4GT row, got ${JSON.stringify(unExact)}`)
}

console.log("TK-Fujikin catalog page model regression passed")
