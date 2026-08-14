const fs = require("fs")
const path = require("path")
const Module = require("module")
const { fittingMappings } = require("../packageFitting/fittingDatabase")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { buildSearchIndex, exactItemsForInput, batchResultForInput }`
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

const { buildSearchIndex, exactItemsForInput, batchResultForInput } = loadPageInternals()
const searchIndex = buildSearchIndex("")
const expected = {
  "SS-4-HVCR-1SR": ["HVVR-FN4", "1SR", "Female nut, SR variant"],
  "SS-4-HVCR-4SR": ["HVVR-MN4", "4SR", "Male nut, SR variant"]
}

for (const [sourceModel, [vigourModel, connectionCode, connectionLabel]] of Object.entries(expected)) {
  const rows = exactItemsForInput(sourceModel, searchIndex)
  if (rows.length !== 1) {
    throw new Error(`${sourceModel}: expected one exact result, got ${JSON.stringify(rows)}`)
  }
  const row = rows[0]
  if (
    row.brand !== "Swagelok"
    || row.sourceModel !== sourceModel
    || row.vigourModel !== vigourModel
    || row.connectionCode !== connectionCode
    || row.connectionLabel !== connectionLabel
    || row.noMatch
    || row.dimensionConfirmation !== true
  ) {
    throw new Error(`${sourceModel}: invalid high-flow nut mapping ${JSON.stringify(row)}`)
  }

  const result = batchResultForInput(sourceModel, sourceModel, searchIndex)
  if (
    result.kind !== "exact"
    || result.presentationKind !== "candidate"
    || result.kindText !== "精确命中 · 建议核实"
    || result.candidates.length !== 1
    || result.candidates[0].copyAllowed
    || !result.candidates[0].matchWarnings.some((warning) => (
      warning.text.includes("目录尺寸未建立") || warning.text.includes("尺寸差值已列出")
    ))
  ) {
    throw new Error(`${sourceModel}: unsafe page presentation ${JSON.stringify(result)}`)
  }
}

const glandAliases = {
  "6LV-4-HVCR-3-1-.60SR": ["6LV-4-HVCR-3-.60SR", "HVVR-HG4-TB6-L15-SLV"],
  "6LV-4-HVCR-3-1-0.60SR": ["6LV-4-HVCR-3-.60SR", "HVVR-HG4-TB6-L15-SLV"],
  "6LV-4-HVCR-3-1-1.19SR": ["6LV-4-HVCR-3-1.19SR", "HVVR-HG4-TB6-L30-SLV"],
  "6LV-4-HVCR-3-1-1.31SR": ["6LV-4-HVCR-3-1.31SR", "HVVR-HG4-TB6-L33-SLV"]
}

for (const [input, [sourceModel, vigourModel]] of Object.entries(glandAliases)) {
  const rows = exactItemsForInput(input, searchIndex)
  if (
    rows.length !== 1
    || rows[0].brand !== "Swagelok"
    || rows[0].sourceModel !== sourceModel
    || rows[0].vigourModel !== vigourModel
    || rows[0].connectionCode !== "3"
    || rows[0].dimensionConfirmation !== true
  ) {
    throw new Error(`${input}: invalid controlled HVCR gland alias ${JSON.stringify(rows)}`)
  }

  const result = batchResultForInput(input, input, searchIndex)
  if (
    result.kind !== "exact"
    || result.presentationKind !== "candidate"
    || result.candidates.length !== 1
    || result.candidates[0].copyAllowed
  ) {
    throw new Error(`${input}: unsafe controlled alias presentation ${JSON.stringify(result)}`)
  }
}

const bodyMappings = {
  "6LV-4-HVCR-1-6TB7": {
    vigourModel: "HVVR-MG4-TB6-SLV",
    connectionCode: "1-TBW",
    connectionLabel: "High-flow tube butt weld body",
    tubeCode: "6TB7"
  },
  "316L-4-HVCR-1A6": {
    vigourModel: "HVVR-AHG4-TW6",
    connectionCode: "1-ATW",
    connectionLabel: "High-flow automatic tube weld body",
    tubeCode: "6TW"
  },
  "6LV-4-HVCR-61-6TB7": {
    vigourModel: "HVVR-BMG4-TB6-SLV",
    connectionCode: "61",
    connectionLabel: "Bulkhead connector",
    tubeCode: "6TB7"
  }
}

for (const [sourceModel, expectedBody] of Object.entries(bodyMappings)) {
  const rows = exactItemsForInput(sourceModel, searchIndex)
  if (
    rows.length !== 1
    || rows[0].brand !== "Swagelok"
    || rows[0].sourceModel !== sourceModel
    || rows[0].vigourModel !== expectedBody.vigourModel
    || rows[0].connectionCode !== expectedBody.connectionCode
    || rows[0].connectionLabel !== expectedBody.connectionLabel
    || rows[0].tubeCode !== expectedBody.tubeCode
    || rows[0].noMatch
    || rows[0].dimensionConfirmation !== true
  ) {
    throw new Error(`${sourceModel}: invalid HVCR body mapping ${JSON.stringify(rows)}`)
  }

  const result = batchResultForInput(sourceModel, sourceModel, searchIndex)
  if (
    result.kind !== "exact"
    || result.presentationKind !== "candidate"
    || result.candidates.length !== 1
    || result.candidates[0].copyAllowed
  ) {
    throw new Error(`${sourceModel}: invalid HVCR body presentation ${JSON.stringify(result)}`)
  }
}

const fullCatalogMatrix = {
  "6LV-4-HVCR-3-.60SR": "HVVR-HG4-TB6-L15-SLV",
  "6LV-4-HVCR-3-1.19SR": "HVVR-HG4-TB6-L30-SLV",
  "6LV-4-HVCR-3-1.31SR": "HVVR-HG4-TB6-L33-SLV",
  "6LV-4-HVCR-1-6TB7": "HVVR-MG4-TB6-SLV",
  "316L-4-HVCR-1A6": "HVVR-AHG4-TW6",
  "6LV-4-HVCR-61-6TB7": "HVVR-BMG4-TB6-SLV",
  "SS-4-HVCR-9": "HVVR-UE4",
  "SS-4-HVCR-T": "HVVR-UT4",
  "SS-4-HVCR-1": "HVVR-FN4",
  "SS-4-HVCR-1SR": "HVVR-FN4",
  "SS-4-HVCR-4SR": "HVVR-MN4"
}

for (const [sourceModel, vigourModel] of Object.entries(fullCatalogMatrix)) {
  const rows = exactItemsForInput(sourceModel, searchIndex)
  if (rows.length !== 1 || rows[0].noMatch || rows[0].vigourModel !== vigourModel) {
    throw new Error(`${sourceModel}: incomplete HVCR catalog matrix ${JSON.stringify(rows)}`)
  }
}

for (const [input, expectedTarget] of Object.entries({
  "6LV-4-HVCR-1-6TB7P": "HVVR-MG4-TB6-SLV-P",
  "6LV-4-HVCR-1-6TB7-P": "HVVR-MG4-TB6-SLV-P",
  "6LV-4-HVCR-61-6TB7P": "HVVR-BMG4-TB6-SLV-P",
  "6LV-4-HVCR-3-1.19SRP": "HVVR-HG4-TB6-L30-SLV-P"
})) {
  const result = batchResultForInput(input, input, searchIndex)
  if (
    result.kind !== "exact"
    || result.candidates.length !== 1
    || result.candidates[0].vigourModel !== expectedTarget
  ) {
    throw new Error(`${input}: invalid HVCR process suffix mapping ${JSON.stringify(result)}`)
  }
}

for (const unsafeVariant of [
  "6LV-4-HVCR-1-8TB7",
  "316L-4-HVCR-1A8",
  "6LV-4-HVCR-61-8TB7",
  "6LV-4-HVCR-1-6TB8",
  "6LV-8-HVCR-1-6TB7"
]) {
  const result = batchResultForInput(unsafeVariant, unsafeVariant, searchIndex)
  if (result.presentationKind !== "missing" || result.candidates.length) {
    throw new Error(`${unsafeVariant}: unsafe HVCR structural variant was matched ${JSON.stringify(result)}`)
  }
}

const unknownLength = "6LV-4-HVCR-3-1-1.20SR"
if (exactItemsForInput(unknownLength, searchIndex).length) {
  throw new Error(`${unknownLength}: unknown HVCR length must not receive a controlled alias`)
}
const unknownResult = batchResultForInput(unknownLength, unknownLength, searchIndex)
if (unknownResult.presentationKind !== "missing") {
  throw new Error(`${unknownLength}: unknown HVCR length must remain blocked`)
}

for (const artifact of ["316L-4-HVCR-1A65", "6LV-4-HVCR-1-6TB75", "6LV-4-HVCR-61-6TB73", "SS-4-HVCR-4SR5", "SS-4-HVCR-91", "SS-4-HVCR-T1"]) {
  if (fittingMappings.some((item) => item.brand === "Swagelok" && item.sourceModel === artifact)) {
    throw new Error(`PDF table artifact leaked into runtime database: ${artifact}`)
  }
}

console.log("Swagelok HVCR high-flow nut checks passed")
