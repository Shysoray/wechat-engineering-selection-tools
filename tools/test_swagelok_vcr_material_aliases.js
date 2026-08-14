const fs = require("fs")
const path = require("path")
const Module = require("module")
const { fittingMappings } = require("../packageFitting/fittingDatabase")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = {
  buildSearchIndex,
  exactItemsForInput,
  batchResultForInput,
  salesCopyRecord,
  salesCopyTwoColumnLine
}`
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

const {
  buildSearchIndex,
  exactItemsForInput,
  batchResultForInput,
  salesCopyRecord,
  salesCopyTwoColumnLine
} = loadPageInternals()
const searchIndex = buildSearchIndex("")

function exact(input) {
  return exactItemsForInput(input, searchIndex)
}

function assertMaterialAlias(input, inputMaterialCode) {
  const rows = exact(input)
  if (rows.length !== 1) {
    throw new Error(`${input}: expected one controlled material alias, got ${JSON.stringify(rows)}`)
  }
  const row = rows[0]
  if (
    row.brand !== "Swagelok"
    || row.sourceModel !== "SS-16-VCR-1"
    || row.vigourModel !== "VVR-FN16"
    || !row.swagelokMaterialAlias
    || row.inputMaterialCode !== inputMaterialCode
    || row.salesStatus !== "needs_confirmation"
    || !row.missingParameters.includes("材质")
  ) {
    throw new Error(`${input}: unexpected controlled material alias ${JSON.stringify(row)}`)
  }
}

assertMaterialAlias("316L-16-VCR-1", "316L")
assertMaterialAlias("316-16-VCR-1", "316")
assertMaterialAlias("316SS-16-VCR-1", "316SS")
assertMaterialAlias("316 SS-16-VCR-1", "316SS")
assertMaterialAlias("16-VCR-1", "")

const hvcrAlias = exact("316L-4-HVCR-1")
if (
  hvcrAlias.length !== 1
  || hvcrAlias[0].sourceModel !== "SS-4-HVCR-1"
  || hvcrAlias[0].vigourModel !== "HVVR-FN4"
  || !hvcrAlias[0].swagelokMaterialAlias
) {
  throw new Error(`HVCR material alias must use the canonical SS record: ${JSON.stringify(hvcrAlias)}`)
}

const aliasResult = batchResultForInput("316L-16-VCR-1", "alias", searchIndex)
if (
  aliasResult.kind !== "exact"
  || aliasResult.presentationKind !== "candidate"
  || aliasResult.kindText !== "结构匹配 · 材质待确认"
  || aliasResult.candidates.length !== 1
) {
  throw new Error(`material alias must be presented as one review candidate: ${JSON.stringify(aliasResult)}`)
}

const aliasCandidate = aliasResult.candidates[0]
if (
  aliasCandidate.copyAllowed
  || !aliasCandidate.salesNeedsConfirmation
  || aliasCandidate.sourceModelText !== "SS-16-VCR-1"
  || aliasCandidate.displayVigourModel !== "VVR-FN16"
  || !aliasCandidate.matchWarnings.some((warning) => (
    warning.level === "warning"
    && warning.text.includes("正式订购号为 SS-16-VCR-1")
    && warning.text.includes("请确认材质")
  ))
) {
  throw new Error(`material alias review presentation is incomplete: ${JSON.stringify(aliasCandidate)}`)
}

const aliasSalesCopy = salesCopyRecord(aliasResult)
if (
  aliasSalesCopy.status !== "待确认"
  || aliasSalesCopy.model !== "VVR-FN16"
  || !aliasSalesCopy.compactText.includes("请确认尺寸公差")
  || !aliasSalesCopy.compactText.includes("普通316不锈钢材质")
  || !aliasSalesCopy.compactText.includes("尺寸差值已列出")
) {
  throw new Error(`material alias sales copy is unsafe: ${JSON.stringify(aliasSalesCopy)}`)
}
const aliasSalesLine = salesCopyTwoColumnLine(aliasSalesCopy)
if (!aliasSalesLine.startsWith("VVR-FN16\t待确认｜") || !aliasSalesLine.includes("尺寸差值已列出")) {
  throw new Error(`material alias sales row must stay one-to-one and two-column: ${JSON.stringify(aliasSalesLine)}`)
}

const dimensionAliasResult = batchResultForInput("316L-16-VCR-2-VS-BL", "dimension-alias", searchIndex)
const dimensionAliasCopy = salesCopyRecord(dimensionAliasResult)
if (
  dimensionAliasCopy.model !== "VVR-GK-G16-BL"
  || !dimensionAliasCopy.missingParameters.includes("材质")
  || !dimensionAliasCopy.missingParameters.some((parameter) => ["尺寸证据", "尺寸公差"].includes(parameter))
  || !dimensionAliasCopy.nextAction.includes("确认尺寸")
  || !dimensionAliasCopy.nextAction.includes("普通316不锈钢材质")
) {
  throw new Error(`material alias must preserve existing review parameters: ${JSON.stringify(dimensionAliasCopy)}`)
}

const officialSs = exact("SS-16-VCR-1")
if (
  officialSs.length !== 1
  || officialSs[0].vigourModel !== "VVR-FN16"
  || officialSs[0].swagelokMaterialAlias
) {
  throw new Error(`official SS ordering number must stay exact: ${JSON.stringify(officialSs)}`)
}

const officialSsResult = batchResultForInput("SS-16-VCR-1", "official", searchIndex)
if (officialSsResult.presentationKind !== "candidate" || officialSsResult.kindText !== "精确命中 · 建议核实") {
  throw new Error(`official SS result without dimensions must stay amber: ${JSON.stringify(officialSsResult)}`)
}

const protectedPrefixes = new Set(["SS", "316L", "6LV", "NI", "CU"])
const protectedModels = [...new Set(fittingMappings
  .filter((row) => (
    row.brand === "Swagelok"
    && /-H?VCR-/.test(row.sourceModel)
    && protectedPrefixes.has(row.sourceModel.split("-")[0])
  ))
  .map((row) => row.sourceModel))]

protectedModels.forEach((model) => {
  const rows = exact(model)
  if (!rows.length || rows.some((row) => row.swagelokMaterialAlias)) {
    throw new Error(`${model}: official material-prefixed record must stay direct ${JSON.stringify(rows)}`)
  }
  if (!rows.some((row) => row.sourceModel === model)) {
    throw new Error(`${model}: direct lookup lost its official record ${JSON.stringify(rows)}`)
  }
})

const official316L = exact("316L-12-VCR-3-18MA")
if (
  official316L.length !== 1
  || official316L[0].sourceModel !== "316L-12-VCR-3-18MA"
  || official316L[0].swagelokMaterialAlias
) {
  throw new Error(`official 316L VCR ordering number must win before aliases: ${JSON.stringify(official316L)}`)
}

const officialWeld = exact("316L-4-ATW-3")
if (
  officialWeld.length !== 1
  || officialWeld[0].sourceModel !== "316L-4-ATW-3"
  || officialWeld[0].swagelokMaterialAlias
) {
  throw new Error(`official 316L weld ordering number must be unaffected: ${JSON.stringify(officialWeld)}`)
}

for (const input of [
  "6LV-16-VCR-1",
  "NI-16-VCR-1",
  "CU-16-VCR-1",
  "SUS316-16-VCR-1",
  "316L-16-VCR-1-X"
]) {
  const rows = exact(input)
  if (rows.some((row) => row.swagelokMaterialAlias || row.sourceModel === "SS-16-VCR-1")) {
    throw new Error(`${input}: hard/unsupported material prefix must not borrow SS alias ${JSON.stringify(rows)}`)
  }
}

const fitok = exact("6L-WT1-TB4")
if (!fitok.length || fitok.some((row) => row.swagelokMaterialAlias)) {
  throw new Error(`FITOK ordering logic must be unaffected: ${JSON.stringify(fitok)}`)
}

const tubeFitting = exact("SS-CM-FL4-NS4")
if (!tubeFitting.length || tubeFitting.some((row) => row.swagelokMaterialAlias)) {
  throw new Error(`tube fitting logic must be unaffected: ${JSON.stringify(tubeFitting)}`)
}

console.log("Swagelok VCR material alias regression passed")
