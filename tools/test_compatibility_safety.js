const assert = require("assert")
const { materialOptions, msdsGases } = require("../pages/compatibility/utils/msdsDatabase")
const { validateCompatibilityDatabase } = require("../pages/compatibility/utils/compatibilityModel")
const { saveToolState, readToolState, clearToolState } = require("../pages/compatibility/utils/sessionState")

let pageDefinition = null
global.Page = (definition) => {
  pageDefinition = definition
}
global.wx = { showModal() {} }

const compatibilityPage = require("../pages/compatibility/index")

assert.deepStrictEqual(validateCompatibilityDatabase(materialOptions, msdsGases), [])

for (const gas of msdsGases) {
  const view = compatibilityPage.buildGasView(gas)
  view.hazardCards.forEach((card) => {
    if (card.value === "需确认") assert.strictEqual(card.levelClass, "neutral", `${gas.formula}/${card.label} must not look safe`)
  })
  view.materialStatuses.forEach((material) => {
    assert.notStrictEqual(material.status, "conflict", `${gas.formula}/${material.code} contains conflicting statuses`)
    assert(["filter", "seat", "other"].includes(material.role), `${gas.formula}/${material.code} is missing a component role`)
  })
}

for (const formula of ["BCl3", "C2HF5", "C4F6", "C5F8"]) {
  const gas = msdsGases.find((item) => item.formula === formula)
  const missingCards = compatibilityPage.buildGasView(gas).hazardCards.filter((card) => card.value === "需确认")
  assert(missingCards.length > 0, `${formula} should contain missing hazard values`)
  missingCards.forEach((card) => assert.strictEqual(card.levelClass, "neutral", `${formula}/${card.label} must not look safe`))
}

const acetylene = msdsGases.find((gas) => gas.formula === "C2H2")
const acetyleneLimits = compatibilityPage.buildDetailGroups(acetylene)[2].items[0]
assert.strictEqual(acetyleneLimits.value, "2.5% / 100%")
assert.strictEqual(compatibilityPage.formatValue("-", "ppm"), "需确认")
assert.strictEqual(compatibilityPage.formatValue("未建立", "ppm"), "需确认")

const malformedView = compatibilityPage.buildGasView({
  id: "malformed",
  formula: "X",
  cnName: "测试",
  enName: "Test",
  compatibilityConfidence: "unknown"
})
assert(malformedView.hazardCards.every((card) => card.levelClass === "neutral"))
assert.strictEqual(malformedView.detailGroups[1].items[0].value, "需确认 / 需确认 / 需确认")

const conflictStatuses = compatibilityPage.buildMaterialStatuses({
  formula: "X",
  compatibilityConfidence: "verified",
  compatibleMaterials: ["SS"],
  incompatibleMaterials: ["SS"]
})
assert.strictEqual(conflictStatuses.find((item) => item.code === "SS").status, "conflict")

const tma = msdsGases.find((gas) => gas.formula === "Al(CH3)3")
assert.strictEqual(compatibilityPage.buildMaterialStatuses(tma).find((item) => item.code === "SS").status, "unverified")

clearToolState("compatibility")
saveToolState("compatibility", {
  selectedGasId: "carbon-monoxide",
  selectedGas: { id: "stale", materialStatuses: [{ status: "compatible" }] },
  searchKeyword: "CO",
  searchResults: [{ formula: "stale" }],
  expandedGroups: ["基础信息"],
  engineeringNotesOpen: true
})
const context = {
  data: JSON.parse(JSON.stringify(pageDefinition.data)),
  setData(patch) {
    Object.assign(this.data, patch)
  }
}
pageDefinition.onLoad.call(context)
assert.strictEqual(context.data.selectedGas.id, "carbon-monoxide")
assert.notStrictEqual(context.data.selectedGas.id, "stale")
assert(context.data.searchResults.some((item) => item.formula === "CO"))
pageDefinition.onHide.call(context)
const saved = readToolState("compatibility")
assert.strictEqual(saved.selectedGasId, "carbon-monoxide")
assert.strictEqual(Object.prototype.hasOwnProperty.call(saved, "selectedGas"), false)
assert.strictEqual(Object.prototype.hasOwnProperty.call(saved, "searchResults"), false)

let componentDefinition = null
global.Component = (definition) => {
  componentDefinition = definition
}
require("../components/option-sheet/index")
const componentContext = {
  data: {
    keyword: "co",
    visibleOptions: [{ originalIndex: 3, option: { label: "CO", value: "CO" } }]
  },
  setData(patch) {
    Object.assign(this.data, patch)
  },
  triggerEvent(name, detail) {
    this.lastEvent = { name, detail }
  }
}
componentDefinition.methods.selectOption.call(componentContext, { currentTarget: { dataset: { index: 0 } } })
assert.strictEqual(componentContext.data.keyword, "")
assert.deepStrictEqual(componentContext.lastEvent, {
  name: "select",
  detail: { index: 3, option: { label: "CO", value: "CO" } }
})

clearToolState("compatibility")
console.log("Compatibility safety checks passed")
