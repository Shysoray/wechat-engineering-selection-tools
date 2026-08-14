const { materialOptions, msdsGases } = require("./utils/msdsDatabase")
const { hasMeaningfulState } = require("../../utils/uiPresentation")
const { saveToolState, readToolState, clearToolState } = require("./utils/sessionState")
const { normalizeMaterialCompatibility, buildCompatibilitySummary } = require("./utils/compatibilityModel")

const MISSING_TEXT_VALUES = new Set(["-", "--", "n/a", "na", "nl", "未建立", "未确认"])

function isMissingValue(value) {
  if (value === "" || value === null || value === undefined) return true
  return typeof value === "string" && MISSING_TEXT_VALUES.has(value.trim().toLowerCase())
}

function formatValue(value, unit) {
  if (isMissingValue(value)) return "需确认"
  return unit ? `${value} ${unit}` : `${value}`
}

function formatLimitPercent(value) {
  if (isMissingValue(value)) return "需确认"
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return `${value}`
  const percentage = numericValue >= 0 && numericValue <= 1 ? numericValue * 100 : numericValue
  return `${Number(percentage.toFixed(3))}%`
}

function getSeverityClass(value) {
  if (isMissingValue(value)) return "neutral"
  const score = Number(value)
  if (Number.isNaN(score)) return "neutral"
  if (score >= 4) return "critical"
  if (score >= 2) return "warning"
  if (score >= 1) return "caution"
  return "safe"
}

function buildMaterialStatuses(gas) {
  return normalizeMaterialCompatibility(gas, materialOptions)
}

function buildDetailGroups(gas) {
  const cylinderPressure = gas.cylinderPressure || {}
  const limits = gas.limits || {}
  return [
    {
      title: "基础信息",
      items: [
        { label: "CAS No.", value: formatValue(gas.cas) },
        { label: "状态", value: `${formatValue(gas.state)} · ${formatValue(gas.stateNote)}` },
        { label: "摩尔质量", value: formatValue(gas.molarMass, "g/mol") },
        { label: "对空气比重", value: formatValue(gas.airSpecificGravity) }
      ]
    },
    {
      title: "钢瓶与流量",
      items: [
        { label: "钢瓶/源瓶压力", value: gas.pressureText || `${formatValue(cylinderPressure.psig, "psig")} / ${formatValue(cylinderPressure.bar, "bar")} / ${formatValue(cylinderPressure.mpa, "MPa")}` },
        { label: "气体→N2", value: formatValue(gas.n2Factor) },
        { label: "N2→气体", value: formatValue(gas.fromN2Factor) },
        { label: "常用接头", value: formatValue(gas.cylinderConnections) }
      ]
    },
    {
      title: "暴露与燃烧限值",
      items: [
        { label: "LFL / UFL", value: `${formatLimitPercent(limits.lfl)} / ${formatLimitPercent(limits.ufl)}` },
        { label: "自燃温度", value: formatValue(limits.autoIgnitionF, "°F") },
        { label: "LC50", value: formatValue(limits.lc50, "ppm") },
        { label: "IDLH", value: formatValue(limits.idlh, "ppm") },
        { label: "TLV-TWA", value: formatValue(limits.tlvTwa, "ppm") },
        { label: "OSHA PEL/STEL", value: formatValue(limits.osha, "ppm") }
      ]
    }
  ]
}

function buildGasView(gas) {
  const hazards = gas.hazards || {}
  const materialStatuses = buildMaterialStatuses(gas)
  return {
    ...gas,
    materialStatuses,
    detailGroups: buildDetailGroups(gas),
    hazardCards: [
      { label: "健康", value: formatValue(hazards.health), levelClass: getSeverityClass(hazards.health) },
      { label: "可燃", value: formatValue(hazards.flammability), levelClass: getSeverityClass(hazards.flammability) },
      { label: "反应", value: formatValue(hazards.reactivity), levelClass: getSeverityClass(hazards.reactivity) }
    ],
    processText: formatValue(gas.processes),
    exhaustText: formatValue(gas.exhaustTreatment),
    noteText: formatValue(gas.notes),
    sourceText: formatValue(gas.source),
    compatibleText: buildCompatibilitySummary(materialStatuses),
    compatibilityBasisText: formatValue(gas.compatibilityBasis)
  }
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
}

function getSearchScore(gas, keyword) {
  const fields = [
    normalizeSearchText(gas.formula),
    normalizeSearchText(gas.cnName),
    normalizeSearchText(gas.enName),
    normalizeSearchText(gas.cas)
  ]

  if (fields[0] === keyword) return 100
  if (fields[1] === keyword) return 95
  if (fields[2] === keyword) return 90
  if (fields[3] === keyword) return 85
  if (fields.some((field) => field.startsWith(keyword))) return 60
  if (fields.some((field) => field.includes(keyword))) return 30
  return 0
}

function buildSearchResults(gases, searchKeyword) {
  const keyword = normalizeSearchText(searchKeyword)
  if (!keyword) return []
  return gases
    .map((gas, index) => ({ index, gas, score: getSearchScore(gas, keyword) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 8)
    .map((item) => ({
      index: item.index,
      cnName: item.gas.cnName,
      enName: item.gas.enName,
      formula: item.gas.formula,
      cas: item.gas.cas
    }))
}

function buildExpandedGroupMap(expandedGroups) {
  return expandedGroups.reduce((map, item) => {
    map[item] = true
    return map
  }, {})
}

Page({
  data: {
    gases: msdsGases,
    gasNames: msdsGases.map((gas) => `${gas.cnName} / ${gas.formula}`),
    gasOptions: msdsGases.map((gas) => ({ label: `${gas.cnName} / ${gas.formula}`, value: gas.formula })),
    selectedIndex: 0,
    selectedGas: null,
    searchKeyword: "",
    searchResults: [],
    expandedGroups: [],
    expandedGroupMap: {},
    isExample: false,
    engineeringNotesOpen: false,
    optionSheet: { visible: false, title: "", options: [] }
  },

  onLoad() {
    const restored = readToolState("compatibility")
    if (!restored) return
    const restoredGasId = restored.selectedGasId || (restored.selectedGas && restored.selectedGas.id)
    const selectedIndex = this.data.gases.findIndex((gas) => gas.id === restoredGasId)
    const selectedGas = selectedIndex >= 0 ? buildGasView(this.data.gases[selectedIndex]) : null
    const searchKeyword = typeof restored.searchKeyword === "string" ? restored.searchKeyword : ""
    const expandedGroups = selectedGas && Array.isArray(restored.expandedGroups) ? restored.expandedGroups : []
    this.setData({
      selectedIndex: selectedIndex >= 0 ? selectedIndex : 0,
      selectedGas,
      searchKeyword,
      searchResults: buildSearchResults(this.data.gases, searchKeyword),
      expandedGroups,
      expandedGroupMap: buildExpandedGroupMap(expandedGroups),
      isExample: Boolean(selectedGas && restored.isExample && selectedGas.formula === "Al(CH3)3"),
      engineeringNotesOpen: Boolean(restored.engineeringNotesOpen),
      optionSheet: { visible: false, title: "", options: [] }
    })
  },

  onHide() {
    saveToolState("compatibility", {
      selectedGasId: this.data.selectedGas ? this.data.selectedGas.id : "",
      searchKeyword: this.data.searchKeyword,
      expandedGroups: this.data.expandedGroups,
      isExample: this.data.isExample,
      engineeringNotesOpen: this.data.engineeringNotesOpen
    })
  },

  onUnload() {
    this.onHide()
  },

  onSearchInput(event) {
    const searchKeyword = event.detail.value

    if (!normalizeSearchText(searchKeyword)) {
      this.setData({
        searchKeyword,
        searchResults: [],
        isExample: false
      })
      return
    }

    const searchResults = buildSearchResults(this.data.gases, searchKeyword)

    this.setData({
      searchKeyword,
      searchResults,
      isExample: false
    })
  },

  onSearchResultTap(event) {
    const selectedIndex = Number(event.currentTarget.dataset.index)
    const gas = this.data.gases[selectedIndex]
    if (!gas) return

    this.setData({
      selectedIndex,
      selectedGas: buildGasView(gas),
      searchKeyword: "",
      searchResults: [],
      expandedGroups: [],
      expandedGroupMap: {},
      isExample: false
    })
  },

  onGasChange(event) {
    const selectedIndex = Number(event.detail.value)
    const gas = this.data.gases[selectedIndex]
    if (!gas) return

    this.setData({
      selectedIndex,
      selectedGas: buildGasView(gas),
      searchKeyword: "",
      searchResults: [],
      expandedGroups: [],
      expandedGroupMap: {},
      isExample: false
    })
  },

  chooseGasFromList() {
    this.setData({
      optionSheet: {
        visible: true,
        title: "选择气体",
        options: this.data.gasOptions
      }
    })
  },

  onGasOptionSelect(event) {
    const detailIndex = event.detail && event.detail.index
    const selectedIndex = Number(detailIndex !== undefined ? detailIndex : event.currentTarget.dataset.index)
    const gas = this.data.gases[selectedIndex]
    if (!gas) return
    this.setData({
      selectedIndex,
      selectedGas: buildGasView(gas),
      searchKeyword: "",
      searchResults: [],
      expandedGroups: [],
      expandedGroupMap: {},
      isExample: false,
      optionSheet: { visible: false, title: "", options: [] }
    })
  },

  closeOptionSheet() {
    this.setData({ optionSheet: { visible: false, title: "", options: [] } })
  },

  toggleDetailGroup(event) {
    const title = event.currentTarget.dataset.title
    if (!title) return
    const expandedGroups = this.data.expandedGroups.includes(title)
      ? this.data.expandedGroups.filter((item) => item !== title)
      : this.data.expandedGroups.concat(title)
    const expandedGroupMap = buildExpandedGroupMap(expandedGroups)
    this.setData({ expandedGroups, expandedGroupMap })
  },

  loadExample() {
    const selectedIndex = this.data.gases.findIndex((gas) => gas.formula === "Al(CH3)3")
    const gas = this.data.gases[selectedIndex]
    if (!gas) return
    this.setData({
      selectedIndex,
      selectedGas: buildGasView(gas),
      searchKeyword: "",
      searchResults: [],
      expandedGroups: [],
      expandedGroupMap: {},
      isExample: true
    })
  },

  toggleEngineeringNotes() {
    this.setData({ engineeringNotesOpen: !this.data.engineeringNotesOpen })
  },

  reset() {
    const hasContent = hasMeaningfulState({
      selectedGas: this.data.selectedGas,
      searchKeyword: this.data.searchKeyword
    })
    if (!hasContent) {
      this.performReset()
      return
    }
    wx.showModal({
      title: "确认重置",
      content: "将清空当前气体、搜索和展开状态。",
      confirmColor: "#ed2b2e",
      success: (result) => {
        if (result.confirm) this.performReset()
      }
    })
  },

  performReset() {
    clearToolState("compatibility")
    this.setData({
      selectedIndex: 0,
      selectedGas: null,
      searchKeyword: "",
      searchResults: [],
      expandedGroups: [],
      expandedGroupMap: {},
      isExample: false,
      engineeringNotesOpen: false,
      optionSheet: { visible: false, title: "", options: [] }
    })
  }
})

module.exports = {
  isMissingValue,
  formatValue,
  formatLimitPercent,
  getSeverityClass,
  buildMaterialStatuses,
  buildDetailGroups,
  buildGasView,
  normalizeSearchText,
  getSearchScore,
  buildSearchResults
}
