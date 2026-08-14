const fs = require("fs")
const { msdsGases } = require("../pages/compatibility/utils/msdsDatabase")

const wxml = fs.readFileSync("pages/compatibility/index.wxml", "utf8")
const wxss = fs.readFileSync("pages/compatibility/index.wxss", "utf8")
for (const contract of [
  "app-header",
  "search-input",
  "material-status",
  "toggleDetailGroup",
  "工程说明",
  "Engineering Notes"
]) {
  if (!wxml.includes(contract)) throw new Error(`missing compatibility UI contract: ${contract}`)
}
if (/SFMono-Regular|Liberation Mono|monospace/.test(wxss)) {
  throw new Error("compatibility UI must use the same font family as the rest of the app")
}
for (const selector of ["search-result__formula", "gas-meta", "material-code"]) {
  const pattern = new RegExp(`\\.${selector}\\s*\\{[^}]*font-family:\\s*inherit;`, "s")
  if (!pattern.test(wxss)) throw new Error(`${selector} must inherit the page font`)
}

let pageDefinition = null
global.Page = (definition) => {
  pageDefinition = definition
}
global.wx = {
  showModal({ success }) {
    success({ confirm: true })
  }
}

const compatibilityPage = require("../pages/compatibility/index.js")

const context = {
  data: JSON.parse(JSON.stringify(pageDefinition.data)),
  setData(patch) {
    Object.assign(this.data, patch)
  }
}

const tmaIndex = msdsGases.findIndex((gas) => gas.formula === "Al(CH3)3")
if (tmaIndex < 0) throw new Error("TMA fixture is missing")
pageDefinition.onSearchResultTap.call(context, { currentTarget: { dataset: { index: tmaIndex } } })

const statuses = context.data.selectedGas.materialStatuses.map((item) => item.status)
const expected = ["unverified", "unknown", "unknown", "conditional", "restricted"]
if (JSON.stringify(statuses) !== JSON.stringify(expected)) {
  throw new Error(`TMA status order changed: ${JSON.stringify({ statuses, expected })}`)
}

const piCompatibleFormulas = [
  "C2H2", "Ar", "CO2", "CO", "Si2H6", "C2H4", "C3F8", "He",
  "H2", "CH4", "N2", "N2O", "O2", "PH3", "SiH4", "Xe"
]
for (const formula of piCompatibleFormulas) {
  const gas = msdsGases.find((item) => item.formula === formula)
  if (!gas) throw new Error(`PI compatibility fixture is missing: ${formula}`)
  const piStatus = compatibilityPage.buildMaterialStatuses(gas).find((item) => item.code === "VESPEL")
  if (!gas.sourceBackedCompatibleMaterials?.includes("VESPEL")) {
    throw new Error(`PI source-backed compatibility missing: ${formula}`)
  }
  if (piStatus?.status !== "documented") {
    throw new Error(`PI compatibility status is not source-documented: ${formula}`)
  }
}

const tma = msdsGases[tmaIndex]
if (!tma.restrictedMaterials?.includes("VESPEL")) {
  throw new Error("TMA must remain restricted for PI / Vespel")
}

const co = msdsGases.find((gas) => gas.formula === "CO")
const coStatuses = compatibilityPage.buildMaterialStatuses(co)
if (coStatuses.find((item) => item.code === "Ni")?.status !== "incompatible") {
  throw new Error("CO must remain incompatible with Ni")
}
if (coStatuses.find((item) => item.code === "VESPEL")?.status !== "documented") {
  throw new Error("CO must be source-documented for Vespel SP-1 per PN-453")
}

const selectedBefore = JSON.stringify(context.data.selectedGas)
context.toggleDetailGroup = pageDefinition.toggleDetailGroup
pageDefinition.toggleDetailGroup.call(context, { currentTarget: { dataset: { title: "基础信息" } } })
if (!context.data.expandedGroups.includes("基础信息")) throw new Error("detail group did not expand")
if (JSON.stringify(context.data.selectedGas) !== selectedBefore) {
  throw new Error("detail expansion must not mutate selected gas data")
}
pageDefinition.toggleDetailGroup.call(context, { currentTarget: { dataset: { title: "基础信息" } } })
if (context.data.expandedGroups.includes("基础信息")) throw new Error("detail group did not collapse")

console.log("Compatibility UI contract passed")
