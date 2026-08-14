const { fittingMappings } = require("../packageFitting/fittingDatabase")
const { fujikinVlokSupplementalMappings } = require("../packageFitting/fujikinVlokSupplementalMappings")
const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")

const textFor = (item) => `${item.productLabel || ""} ${item.productName || ""} ${item.productCode || ""}`
const has = (item, pattern) => pattern.test(textFor(item))
const usable = (item) => item.vigourModel && !item.noMatch
const allMappings = fittingMappings.concat(fujikinVlokSupplementalMappings, tubeFittingSupplementalMappings)

function isHighFlowItem(item) {
  const sourceModel = String(item.sourceModel || "")
  const productCode = String(item.productCode || "")
  return (
    /high[ -]?flow|\bHVCR\b/i.test(textFor(item))
    || /-HVCR-|^TH(?:FN|MN|LG)/.test(sourceModel)
    || /^(?:N-HF|MS-HF|HFN|HMN|HLG|CHFN|CHMN|CHG)$/.test(productCode)
  )
}

const familyRules = [
  {
    name: "Swagelok high-flow tube butt weld body must map to HVVR-MG",
    matches: (item) => /^6LV-4-HVCR-1-\d+TB7P?$/.test(item.sourceModel || ""),
    valid: (model) => /^HVVR-MG4-TB6(?:-|$)/.test(model)
  },
  {
    name: "Swagelok high-flow automatic weld body must map to HVVR-AHG",
    matches: (item) => /^316L-4-HVCR-1A\d+P?$/.test(item.sourceModel || ""),
    valid: (model) => /^HVVR-AHG4-TW6(?:-|$)/.test(model)
  },
  {
    name: "Swagelok high-flow bulkhead body must map to HVVR-BMG",
    matches: (item) => /^6LV-4-HVCR-61-\d+TB7P?$/.test(item.sourceModel || ""),
    valid: (model) => /^HVVR-BMG4-TB6(?:-|$)/.test(model)
  },
  {
    name: "Swagelok high-flow gland must map to HVVR-HG",
    matches: (item) => /^6LV-4-HVCR-3-/.test(item.sourceModel || ""),
    valid: (model) => /^HVVR-HG4-TB6-L(?:15|30|33)(?:-|$)/.test(model)
  },
  {
    name: "high-flow female nut must map to HVVR-FN",
    matches: (item) => isHighFlowItem(item) && has(item, /female nut|\bFN\b|HFN/i),
    valid: (model) => /^HVVR-FN/.test(model)
  },
  {
    name: "high-flow male nut must map to HVVR-MN",
    matches: (item) => (
      isHighFlowItem(item)
      && !has(item, /female nut|\bFN\b|HFN/i)
      && has(item, /male nut|\bMN\b|HMN/i)
    ),
    valid: (model) => /^HVVR-MN/.test(model)
  },
  {
    name: "female gland must map to FG",
    matches: (item) => has(item, /female gland/i),
    valid: (model) => /^V[VW]R-FG/.test(model)
  },
  {
    name: "explicit male/long gland must map to MG/HG",
    matches: (item) =>
      !has(item, /female gland|short gland/i) && has(item, /male gland|male sleeve|long gland/i),
    valid: (model) => /^(?:VVR-MG|HVVR-[BH]?MG|HVVR-HG)/.test(model)
  },
  {
    name: "female nut must map to FN",
    matches: (item) => !isHighFlowItem(item) && has(item, /female nut|\bFN\b/i),
    valid: (model) => /^H?VVR-FN/.test(model)
  },
  {
    name: "male nut must map to MN",
    matches: (item) => !isHighFlowItem(item) && !has(item, /female nut|\bFN\b/i) && has(item, /male nut|\bMN\b/i),
    valid: (model) => /^H?VVR-MN/.test(model)
  },
  {
    name: "cap must map to C",
    matches: (item) => has(item, /\bcap\b|\bCP\b/i),
    valid: (model) => /^(?:VVR-C|SS-VC)/.test(model)
  },
  {
    name: "plug must map to P",
    matches: (item) => has(item, /\bplug\b|\bPG\b/i),
    valid: (model) => /^(?:VVR-P|SS-VP)/.test(model)
  }
]

const tubeSupplementalFamilyPatterns = {
  "外螺纹连接（Male Connector）": /^SS-VMC/,
  "内螺纹连接（Female Connector）": /^SS-VFC/,
  "外螺纹弯头（Male Elbow）": /^SS-VME/,
  "内螺纹弯头（Female Elbow）": /^SS-VFE/,
  "联合弯头（Union Elbow）": /^SS-VUE/,
  "联合三通/变径三通": /^SS-V(?:UT|RT)/,
  "联合四通（Union Cross）": /^SS-VUC/,
  "联合接头/变径联合接头": /^SS-V(?:U|RU)/,
  "穿板联合接头（Bulkhead Union）": /^SS-VBU/,
  "堵帽（Cap）": /^SS-VC/,
  "堵头（Plug）": /^SS-VP/,
  "端口连接器（Port Connector）": /^SS-VPC/,
  "变径接头/管柄接头（Reducer）": /^SS-VTO/,
  "卡套组件": /^SS-VFF/
}

const failures = []

allMappings.filter(usable).forEach((item) => {
  familyRules.forEach((rule) => {
    if (rule.matches(item) && !rule.valid(item.vigourModel)) {
      failures.push(`${rule.name}: ${item.brand} ${item.sourceModel} -> ${item.vigourModel}`)
    }
  })

  if (item.tubeFittingSupplemental) {
    const expectedPattern = tubeSupplementalFamilyPatterns[item.productLabel]
    if (expectedPattern && !expectedPattern.test(item.vigourModel)) {
      failures.push(`tube fitting family mismatch: ${item.brand} ${item.sourceModel} -> ${item.vigourModel}`)
    }
  }
})

if (failures.length) {
  throw new Error(`Fitting family consistency failures:\n${failures.join("\n")}`)
}

console.log("Fitting family consistency regression passed")
