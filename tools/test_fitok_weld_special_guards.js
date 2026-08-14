const fs = require("fs")
const path = require("path")
const Module = require("module")

const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { buildSearchIndex, exactItemsForInput, enrichResult }`
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

const { buildSearchIndex, exactItemsForInput, enrichResult } = loadPageInternals()
const searchIndex = buildSearchIndex("")

function exactRows(input) {
  return exactItemsForInput(input, searchIndex).map((item) => enrichResult(item, []))
}

function assertNoUsableVigour(input) {
  const rows = exactRows(input)
  if (!rows.length) {
    throw new Error(`${input}: expected an exact FITOK guard row, got none`)
  }
  const usable = rows.filter((item) => item.vigourModel && !item.noMatch)
  if (usable.length) {
    throw new Error(`${input}: special weld length must not expose usable VIGOUR targets, got ${JSON.stringify(usable)}`)
  }
  if (!rows.every((item) => item.brand === "FITOK" && item.noMatch)) {
    throw new Error(`${input}: expected FITOK no-match guard rows, got ${JSON.stringify(rows)}`)
  }
  if (input.startsWith("-") && rows.length !== 1) {
    throw new Error(`${input}: FITOK basic no-match alias should be aggregated into one guard row, got ${JSON.stringify(rows)}`)
  }
  if (input.startsWith("-") && rows[0].sourceModelText !== input) {
    throw new Error(`${input}: FITOK basic no-match alias should display the input basic ordering number, got ${rows[0].sourceModelText}`)
  }
}

[
  "-WT1-TB4-45",
  "SS-WL1-TB4-3",
  "SS-WT1-TB4-45",
  "SS-WT1-TB4-98",
  "6L-WL1-TB4-3",
  "6L-WT1-TB4-45",
  "6L-WT1-TB4-98",
  "6LV-WT1-TB4-45-F3",
  "6LW-WT1-TB4-98-F3",
].forEach(assertNoUsableVigour);

function assertNoUsableExtendedBrandVigour(brand, input) {
  const rows = exactRows(input)
  if (!rows.length) {
    throw new Error(`${input}: expected an exact ${brand} guard row, got none`)
  }
  const usable = rows.filter((item) => item.brand === brand && item.vigourModel && !item.noMatch)
  if (usable.length) {
    throw new Error(`${input}: extended weld structure must not expose usable VIGOUR targets, got ${JSON.stringify(usable)}`)
  }
  if (!rows.some((item) => item.brand === brand && item.noMatch)) {
    throw new Error(`${input}: expected a ${brand} no-match guard row, got ${JSON.stringify(rows)}`)
  }
}

function assertCatalogArtifactAbsent(brand, input) {
  const sourceRows = tubeFittingSupplementalMappings.filter((item) => (
    item.brand === brand && item.sourceModel === input
  ))
  if (sourceRows.length) {
    throw new Error(`${input}: PDF dimension text must not be retained as a ${brand} ordering number`)
  }
  const rows = exactRows(input).filter((item) => item.brand === brand)
  if (rows.length) {
    throw new Error(`${input}: catalog artifact must not resolve as an exact ${brand} source row`)
  }
}

[
  "S4EX11",
  "S4EXE29",
  "S4EXT25",
  "D4EXT50-P",
].forEach((input) => assertNoUsableExtendedBrandVigour("TK-Fujikin", input));

[
  "CLE-12L22.5-SM-EP",
  "CLE-16L23.3-DM-BA",
  "CLRE-1204L22.5-SM-EP",
  "CLT-12L22.5-DM-EP",
  "CLRU-1612L22.5-SM-BA",
].forEach((input) => assertCatalogArtifactAbsent("UNILOK", input));

const swagelokLongGland = exactRows("6LV-8-VCR-3-8TB3")
const swagelokLongGlandHit = swagelokLongGland.find(
  (item) => item.brand === "Swagelok" && item.vigourModel === "VVR-MG8-TB8-L35-SLV" && !item.noMatch
)
if (!swagelokLongGlandHit) {
  throw new Error(`6LV-8-VCR-3-8TB3 should map to length-matched L35, got ${JSON.stringify(swagelokLongGland)}`)
}

[
  "UJR-9.52MS-L19-AW-S",
  "UJR-9.52MS-L37-AW-S",
  "UJR-12.7MS-L37-AW-S",
  "UJR-6.35X9.52MS-L28.5-APM",
].forEach((input) => assertNoUsableExtendedBrandVigour("FUJIKIN", input));

const standardFitok = exactRows("SS-WT1-TB4")
const standardHit = standardFitok.find((item) => item.brand === "FITOK" && item.vigourModel === "VMW-UT4" && !item.noMatch)
if (!standardHit) {
  throw new Error(`SS-WT1-TB4 should still map to standard VMW-UT4, got ${JSON.stringify(standardFitok)}`)
}
if (standardHit.matchWarnings.some((warning) => /材质不匹配/.test(warning.text))) {
  throw new Error(`316 SS and 316L should not be flagged as a material mismatch, got ${JSON.stringify(standardHit.matchWarnings)}`)
}

const basicStandardFitok = exactRows("-WT1-TB4")
if (basicStandardFitok.length !== 1) {
  throw new Error(`-WT1-TB4 should aggregate FITOK material/process variants into one result, got ${JSON.stringify(basicStandardFitok)}`)
}
const basicStandardHit = basicStandardFitok.find((item) => item.brand === "FITOK" && item.vigourModel === "VMW-UT4" && !item.noMatch)
if (!basicStandardHit) {
  throw new Error(`-WT1-TB4 should identify FITOK basic ordering number and offer VMW-UT4, got ${JSON.stringify(basicStandardFitok)}`)
}
if (basicStandardHit.sourceModelText !== "-WT1-TB4") {
  throw new Error(`-WT1-TB4 should display the input basic ordering number, got ${basicStandardHit.sourceModelText}`)
}
if (!basicStandardHit.matchWarnings.some((warning) => /基础订购号缺少材质\/清洗工艺等参数/.test(warning.text))) {
  throw new Error(`-WT1-TB4 should warn about incomplete FITOK ordering number, got ${JSON.stringify(basicStandardHit.matchWarnings)}`)
}
if (!basicStandardHit.matchWarnings.some((warning) => /F3.*-P/.test(warning.text))) {
  throw new Error(`-WT1-TB4 should mention F3 may use the -P VIGOUR version, got ${JSON.stringify(basicStandardHit.matchWarnings)}`)
}

const basicElbowFitok = exactRows("-WV1-TB4")
if (basicElbowFitok.length !== 1) {
  throw new Error(`-WV1-TB4 should aggregate FITOK material/process variants into one result, got ${JSON.stringify(basicElbowFitok)}`)
}
const basicElbowHit = basicElbowFitok[0]
if (basicElbowHit.brand !== "FITOK" || basicElbowHit.vigourModel !== "VMW-VE4-R45" || basicElbowHit.noMatch) {
  throw new Error(`-WV1-TB4 should identify one FITOK VMW-VE4-R45 candidate, got ${JSON.stringify(basicElbowFitok)}`)
}
if (!basicElbowHit.matchWarnings.some((warning) => /基础订购号缺少材质\/清洗工艺等参数/.test(warning.text) && /F3.*-P/.test(warning.text))) {
  throw new Error(`-WV1-TB4 should show one concise incomplete-order warning including F3/-P, got ${JSON.stringify(basicElbowHit.matchWarnings)}`)
}

const tubeAliasRows = exactRows("-CM-FL4-NS4")
if (tubeAliasRows.some((item) => item.brand === "FITOK")) {
  throw new Error(`FITOK basic alias must not apply to tube fitting supplemental rows, got ${JSON.stringify(tubeAliasRows)}`)
}

const tubeFittingControls = [
  ["FITOK", "SS-CM-FL4-NS4", "SS-VMC-04-M4"],
  ["UNILOK", "UEU-08-SS", "SS-VUE-08"],
  ["Swagelok", "SS-400-1-2RT", "SS-VMC-04-R2"],
]

tubeFittingControls.forEach(([brand, sourceModel, vigourModel]) => {
  const hit = tubeFittingSupplementalMappings.find(
    (item) => item.brand === brand && item.sourceModel === sourceModel && item.vigourModel === vigourModel && !item.noMatch
  )
  if (!hit) {
    throw new Error(`Tube fitting supplemental control changed: ${brand} ${sourceModel} -> ${vigourModel}`)
  }
})

console.log("FITOK weld special guard regression passed")
