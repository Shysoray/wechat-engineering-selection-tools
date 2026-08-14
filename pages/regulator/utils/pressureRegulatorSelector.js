const materialOptions = [
  { value: "UBS", label: "316L EP" },
  { value: "UCSLV", label: "316L VIM VAR" }
]

const panelMountOptions = [
  { value: "BOTTOM", label: "底装 / 不带面板安装", code: "" },
  { value: "PANEL", label: "面板安装", code: "P" }
]

const structureOptions = [
  { value: "SINGLE_DIAPHRAGM", label: "单级膜片减压阀" },
  { value: "TWO_STAGE_DIAPHRAGM", label: "双级膜片减压阀" },
  { value: "HIGH_PRESSURE_PISTON", label: "高压活塞减压阀" }
]

const seriesRules = [
  {
    value: "50",
    label: "VSR-50",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    materials: ["S", "SHP", "SLV"],
    inletPressures: ["10"],
    outletPressures: ["V0.7", "V2", "V4", "V7", "0.7", "2", "4", "7"],
    ports: ["2P", "3P"],
    connections: ["FV4", "MV4", "TW4"],
    inletGaugePorts: {},
    outletGaugePorts: { "3P": 2 },
    flowOptions: ["STD", "HF"],
    flowCapacity: { STD: 15, HF: 30 },
    standardFlow: "标准 15 slpm",
    highFlow: "HF 30 slpm",
    notes: ["V 负压选项只能表显负压，不能主动调负压。"]
  },
  {
    value: "100",
    label: "VSR-100",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    materials: ["S", "SHP", "SLV", "SH", "H"],
    inletPressures: ["20", "250"],
    outletPressures: ["V0.7", "V2", "V4", "V7", "V10", "0.7", "2", "4", "7", "10"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW4", "TW6"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD", "HF"],
    flowCapacity: { STD: 30, HF: 120 },
    standardFlow: "标准 30 slpm",
    highFlow: "HF 120 slpm",
    notes: ["0.7 或 V0.7 出口压力时，入口压力只能选 20=300 psig。", "250=3500 psig 属高压入口，建议确认并优先 VS=Vespel。"]
  },
  {
    value: "1000",
    label: "VSR-1000",
    type: "UB/UC 单级膜片",
    sameAs: "100"
  },
  {
    value: "210",
    label: "VSR-210",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    tiedDiaphragm: true,
    materials: ["S", "SHP", "SLV", "SH"],
    inletPressures: ["20", "117", "200"],
    outletPressures: ["V2", "V4", "V7", "V10", "2", "4", "7", "10", "P17"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "FV6", "FV8", "FV12", "MV4", "MV6", "MV8", "MV12", "TW4", "TW6", "TW8", "TW12"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD", "HF", "FC"],
    flowCapacity: { STD: 800, HF: 1000, FC: 1500 },
    standardFlow: "标准 800 slpm",
    highFlow: "HF 1000 slpm",
    forceCompFlow: "FC 1500 slpm",
    notes: ["3/4 in 连接最大 2400 psig。", "FC 仅 1/2 或 3/4 连接且入口压力 <=300 psig。", "P17 为 800 psig 入口预设 250 psig。"]
  },
  {
    value: "410",
    label: "VSR-410",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    tiedDiaphragm: true,
    materials: ["S", "SLV", "SH"],
    inletPressures: ["20", "160", "200"],
    outletPressures: ["VC2", "V2", "V4", "V7", "V10", "2", "4", "7", "10"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "FV6", "FV8", "MV4", "MV6", "MV8", "TW4", "TW6", "TW8"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD"],
    flowCapacity: { STD: 400 },
    standardFlow: "标准 400 slpm",
    notes: ["VC2 入口最大 300 psig。", "入口 200=3000 psig 不适用于 VC2/V2/V4/2/4。"]
  },
  {
    value: "510",
    label: "VSR-510",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    tiedDiaphragm: true,
    materials: ["S", "SHP", "SLV", "H"],
    inletPressures: ["20", "250"],
    outletPressures: ["V2", "V4", "V7", "V10", "2", "4", "7", "10"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW4", "TW6"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD", "HF"],
    flowCapacity: { STD: 30, HF: 120 },
    standardFlow: "标准 30 slpm",
    highFlow: "HF 120 slpm",
    notes: ["250=3500 psig 属高压入口，建议确认并优先 VS=Vespel。"]
  },
  {
    value: "610",
    label: "VSR-610",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    materials: ["S", "SLV", "SH"],
    inletPressures: ["20", "250"],
    outletPressures: ["V1", "V2", "V4", "V7", "1", "2", "4", "7"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "FV6", "FV8", "MV4", "MV6", "MV8", "TW4", "TW6", "TW8"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD"],
    flowCapacity: { STD: 100 },
    standardFlow: "标准 100 slpm",
    notes: ["Cv=0.13，无 HF 项。", "250=3500 psig 属高压入口，建议确认并优先 VS=Vespel。"]
  },
  {
    value: "710",
    label: "VSR-710",
    type: "UB/UC 双级膜片",
    structure: "TWO_STAGE_DIAPHRAGM",
    tiedDiaphragm: true,
    materials: ["S", "SHP", "SLV"],
    inletPressures: ["250"],
    outletPressures: ["V2", "V4", "V7", "2", "4", "7"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW4", "TW6"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD"],
    flowCapacity: { STD: 0 },
    capacityBasis: "cv",
    capacityReference: "Cv=0.05",
    standardFlow: "Cv=0.05",
    notes: ["双级结构，供压效应更低。", "250=3500 psig 属高压入口，建议确认并优先 VS=Vespel。"]
  },
  {
    value: "910",
    label: "VSR-910",
    type: "UB 单级膜片 bulk gas",
    structure: "SINGLE_DIAPHRAGM",
    materials: ["S"],
    inletPressures: ["55", "117", "200"],
    outletPressures: ["V2", "V4", "V7", "V10", "2", "4", "7", "10"],
    ports: ["2P", "3P"],
    connections: ["FV8", "FV12", "FV16", "MV8", "MV12", "MV16", "TW8", "TW12", "TW16", "MV4"],
    inletGaugePorts: {},
    outletGaugePorts: { "3P": 3 },
    flowOptions: ["STD"],
    flowCapacity: { STD: 2000 },
    standardFlow: "标准 2000 slpm；55 bar 入口约 5000 slpm",
    notes: ["200=3000 psig 时必须选择 VS=Vespel。"]
  },
  {
    value: "911",
    label: "VSR-911",
    type: "UB 单级膜片 bulk gas，300 psig preset",
    structure: "SINGLE_DIAPHRAGM",
    tiedDiaphragm: true,
    materials: ["S"],
    inletPressures: ["55", "117", "200"],
    outletPressures: ["P21"],
    ports: ["2P", "3P"],
    connections: ["FV8", "FV12", "FV16", "MV8", "MV12", "MV16", "TW8", "TW12", "TW16", "MV4"],
    inletGaugePorts: {},
    outletGaugePorts: { "3P": 3 },
    flowOptions: ["STD"],
    flowCapacity: { STD: 2000 },
    standardFlow: "标准 2000 slpm",
    notes: ["200=3000 psig 时必须选择 VS=Vespel。", "P21 为 800 psig 入口下预设 300 psig。"]
  },
  {
    value: "920",
    label: "VSR-920",
    type: "UB/UC 单级膜片",
    structure: "SINGLE_DIAPHRAGM",
    tiedDiaphragm: true,
    materials: ["S"],
    inletPressures: ["20"],
    outletPressures: ["V2", "V4", "V7", "V10", "2", "4", "7", "10"],
    ports: ["2P", "3P"],
    connections: ["FV12", "MV12", "FV16", "MV16", "FV4", "MV4", "TW12", "TW16"],
    inletGaugePorts: {},
    outletGaugePorts: { "3P": 2 },
    flowOptions: ["STD"],
    flowCapacity: { STD: 2000 },
    standardFlow: "标准 2000 slpm",
    notes: ["标准阀座 PFA，VS=Vespel 可选；入口仅 20=300 psig。"]
  },
  {
    value: "930",
    label: "VSR-930",
    type: "UB 高压活塞",
    structure: "HIGH_PRESSURE_PISTON",
    materials: ["S"],
    inletPressures: ["400"],
    outletPressures: ["35", "170"],
    ports: ["2P", "3P", "4P"],
    connections: ["FV4", "MV4", "TW4"],
    inletGaugePorts: { "4P": 2 },
    outletGaugePorts: { "3P": 2, "4P": 3 },
    flowOptions: ["STD", "HF"],
    flowCapacity: { STD: 0, HF: 0 },
    capacityBasis: "cv",
    capacityReference: "标准阀芯；HF Cv=0.15",
    standardFlow: "标准阀芯，流量需按工况复核",
    highFlow: "HF=Cv0.15",
    notes: ["400=5800 psig 高压入口，建议默认按 VS=Vespel 确认。", "HF=Cv0.15 时必须使用 VS=Vespel。"]
  }
]

function resolvedSeriesRules() {
  const byValue = {}
  seriesRules.forEach((rule) => {
    byValue[rule.value] = rule
  })

  return seriesRules.map((rule) => {
    if (!rule.sameAs) return rule
    return {
      ...byValue[rule.sameAs],
      value: rule.value,
      label: rule.label,
      type: rule.type,
      sameAs: undefined
    }
  })
}

const regulatorSeries = resolvedSeriesRules()

const inletPressureOptions = [
  { value: "10", label: "10 - 150 psig" },
  { value: "20", label: "20 - 300 psig" },
  { value: "55", label: "55 - 800 psig" },
  { value: "117", label: "117 - 1700 psig" },
  { value: "160", label: "160 - 2300 psig" },
  { value: "200", label: "200 - 3000 psig" },
  { value: "250", label: "250 - 3500 psig" },
  { value: "400", label: "400 - 5800 psig" }
]

const outletPressureOptions = [
  { value: "V0.7", label: "V0.7 - Vac to 10 psig" },
  { value: "V1", label: "V1 - Vac to 10 psig" },
  { value: "V2", label: "V2 - Vac to 30 psig" },
  { value: "V4", label: "V4 - Vac to 60 psig" },
  { value: "V7", label: "V7 - Vac to 100 psig" },
  { value: "V10", label: "V10 - Vac to 150 psig" },
  { value: "VC2", label: "VC2 - -12.5 to 30 psig" },
  { value: "0.7", label: "0.7 - to 10 psig" },
  { value: "1", label: "1 - to 10 psig" },
  { value: "2", label: "2 - to 30 psig" },
  { value: "4", label: "4 - to 60 psig" },
  { value: "7", label: "7 - to 100 psig" },
  { value: "10", label: "10 - to 150 psig" },
  { value: "P17", label: "P17 - Preset 250 psig" },
  { value: "P21", label: "P21 - Preset 300 psig" },
  { value: "35", label: "35 - 25 to 500 psig" },
  { value: "170", label: "170 - 100 to 2500 psig" }
]

const portOptions = [
  { value: "2P", label: "2P - 2 孔" },
  { value: "3P", label: "3P - 3 孔" },
  { value: "4P", label: "4P - 4 孔" }
]

const connectorOptions = [
  { value: "FV4", label: "FV4 - Face Seal Female" },
  { value: "MV4", label: "MV4 - Face Seal Male" },
  { value: "TW4", label: "TW4 - 1/4 tube weld" },
  { value: "FV6", label: "FV6 - 3/8 VFS female" },
  { value: "MV6", label: "MV6 - 3/8 VFS male" },
  { value: "TW6", label: "TW6 - 3/8 tube weld" },
  { value: "FV8", label: "FV8 - 1/2 VFS female" },
  { value: "MV8", label: "MV8 - 1/2 VFS male" },
  { value: "TW8", label: "TW8 - 1/2 tube weld" },
  { value: "FV12", label: "FV12 - 3/4 VFS female" },
  { value: "MV12", label: "MV12 - 3/4 VFS male" },
  { value: "TW12", label: "TW12 - 3/4 tube weld" },
  { value: "FV16", label: "FV16 - 1 in VFS female" },
  { value: "MV16", label: "MV16 - 1 in VFS male" },
  { value: "TW16", label: "TW16 - 1 in tube weld" }
]

const gaugeOptions = [
  { value: "P", label: "P - bar/psi 表 焊接接头", code: "P" },
  { value: "IP", label: "IP - bar/psi 表 挖孔接头", code: "IP" },
  { value: "IFV4", label: "IFV4 - Face Seal Female 挖孔", code: "IFV4" },
  { value: "FV4", label: "FV4 - Face Seal Female", code: "FV4" },
  { value: "MV4", label: "MV4 - Face Seal Male", code: "MV4" }
]

const mediaOptions = [
  { value: "BULK", label: "大宗气体" },
  { value: "CO2_N2O", label: "CO2/N2O" },
  { value: "TOXIC_CORROSIVE", label: "毒腐气体" }
]

const fieldConfigs = [
  {
    key: "structure",
    label: "减压阀结构",
    title: "选择减压阀结构",
    placeholder: "请选择减压阀结构",
    options: structureOptions
  },
  {
    key: "material",
    label: "材料",
    title: "选择材料",
    placeholder: "请选择材料",
    options: materialOptions
  },
  {
    key: "panelMount",
    label: "面板安装",
    title: "选择面板安装",
    placeholder: "请选择面板安装",
    options: panelMountOptions
  },
  {
    key: "inletPressure",
    label: "进口压力",
    title: "选择进口压力",
    placeholder: "请选择进口压力",
    options: inletPressureOptions
  },
  {
    key: "outletPressure",
    label: "出口压力",
    title: "选择出口压力",
    placeholder: "请选择出口压力",
    options: outletPressureOptions
  },
  {
    key: "port",
    label: "产品孔位",
    title: "选择产品孔位",
    placeholder: "请选择孔位",
    options: portOptions
  },
  {
    key: "inletConnector",
    label: "进气接头",
    title: "选择进气接头",
    placeholder: "请选择进气接头",
    options: connectorOptions
  },
  {
    key: "inletGauge",
    label: "进气压力表",
    title: "选择进气压力表",
    placeholder: "请选择进气压力表",
    options: gaugeOptions
  },
  {
    key: "outletGauge",
    label: "出气压力表",
    title: "选择出气压力表",
    placeholder: "请选择出气压力表",
    options: gaugeOptions
  },
  {
    key: "outletConnector",
    label: "出气接头",
    title: "选择出气接头",
    placeholder: "请选择出气接头",
    options: connectorOptions
  },
  {
    key: "flow",
    label: "流量",
    placeholder: "请输入流量（slpm）",
    input: true
  },
  {
    key: "media",
    label: "介质",
    title: "选择介质",
    placeholder: "请选择介质",
    options: mediaOptions
  }
]

const defaultSelection = fieldConfigs.reduce((selection, field) => {
  selection[field.key] = ""
  return selection
}, {})

function getOptionLabel(field, value) {
  if (field.input) return value
  if (field.key === "inletGauge" || field.key === "outletGauge") {
    if (value === "NONE") return "2P 不适用"
  }
  const option = field.options.find((item) => item.value === value)
  return option ? option.label : value
}

function getOptionCode(options, value) {
  const option = options.find((item) => item.value === value)
  return option && option.code !== undefined ? option.code : value
}

function getSelectionSpecs(selection) {
  return fieldConfigs.map((field) => ({
    label: field.label,
    value: selection[field.key] ? getOptionLabel(field, selection[field.key]) : "未选择"
  }))
}

function isSelectionComplete(selection) {
  return fieldConfigs.every((field) => selection[field.key])
}

function getMaterialCode(material) {
  if (material === "UBS") return "S"
  if (material === "UCSLV") return "SLV"
  return material
}

function getFlowValue(selection) {
  const flow = Number(selection.flow)
  return Number.isFinite(flow) ? flow : NaN
}

function getPressureRating(code) {
  const pressureMap = {
    "10": 150,
    "20": 300,
    "55": 800,
    "117": 1700,
    "160": 2300,
    "200": 3000,
    "250": 3500,
    "400": 5800
  }
  return pressureMap[code] || 0
}

function getMatchedInletPressure(selection, rule) {
  const selectedPressure = getPressureRating(selection.inletPressure)
  if (!selectedPressure) return ""

  return rule.inletPressures
    .filter((code) => getPressureRating(code) >= selectedPressure)
    .sort((a, b) => getPressureRating(a) - getPressureRating(b))[0] || ""
}

function getMatchedFlowOption(selection, rule) {
  const flow = getFlowValue(selection)
  if (!Number.isFinite(flow) || flow <= 0) return ""

  if (rule.capacityBasis === "cv") return "STD"

  const order = ["STD", "HF", "FC"]
  return order.find((option) => {
    if (!rule.flowOptions.includes(option)) return false
    const capacity = rule.flowCapacity ? rule.flowCapacity[option] : 0
    return capacity > 0 && flow <= capacity
  }) || ""
}

function getMatchedFlowCapacity(selection, rule) {
  const matchedFlowOption = getMatchedFlowOption(selection, rule)
  return matchedFlowOption && rule.flowCapacity ? rule.flowCapacity[matchedFlowOption] || 0 : 0
}

function validateRule(selection, rule) {
  const errors = []
  const warnings = []
  const materialCode = getMaterialCode(selection.material)
  const flow = getFlowValue(selection)
  const matchedInletPressure = getMatchedInletPressure(selection, rule)
  const matchedFlowOption = getMatchedFlowOption(selection, rule)

  if (rule.structure !== selection.structure) errors.push(`${rule.label} 不属于当前选择的减压阀结构`)
  if (!rule.materials.includes(materialCode)) errors.push(`${rule.label} 不支持当前材料 ${selection.material}`)
  if (!matchedInletPressure) errors.push(`${rule.label} 入口压力范围不覆盖当前进口压力代码 ${selection.inletPressure}`)
  if (!rule.outletPressures.includes(selection.outletPressure)) errors.push(`${rule.label} 不支持当前出口压力代码 ${selection.outletPressure}`)
  if (!rule.ports.includes(selection.port)) errors.push(`${rule.label} 不支持当前孔位 ${selection.port}`)
  if (!rule.connections.includes(selection.inletConnector)) errors.push(`${rule.label} 不支持当前进气接头 ${selection.inletConnector}`)
  if (!rule.connections.includes(selection.outletConnector)) errors.push(`${rule.label} 不支持当前出气接头 ${selection.outletConnector}`)
  if (!Number.isFinite(flow) || flow <= 0) errors.push("请输入有效的流量数值")
  if (Number.isFinite(flow) && flow > 0 && !matchedFlowOption) errors.push(`${rule.label} 推荐流量范围不覆盖 ${selection.flow} slpm`)
  if (selection.media === "TOXIC_CORROSIVE" && !rule.tiedDiaphragm) {
    errors.push(`${rule.label} 非 tied-diaphragm 型号，不用于毒腐气体优先选型`)
  }

  if (selection.inletGauge !== "NONE" && !rule.inletGaugePorts[selection.port]) {
    errors.push(`${rule.label} 的 ${selection.port} 无独立进气压力表孔位`)
  }

  if (selection.outletGauge !== "NONE" && !rule.outletGaugePorts[selection.port]) {
    errors.push(`${rule.label} 的 ${selection.port} 无独立出气压力表孔位`)
  }

  if (["100", "1000"].includes(rule.value) && ["0.7", "V0.7"].includes(selection.outletPressure) && matchedInletPressure !== "20") {
    errors.push(`${rule.label} 选择 0.7/V0.7 出口压力时，进口压力只能选 20=300 psig`)
  }

  if (rule.value === "410" && matchedInletPressure === "200" && ["VC2", "V2", "V4", "2", "4"].includes(selection.outletPressure)) {
    errors.push("VSR-410 的 200=3000 psig 入口不适用于 VC2/V2/V4/2/4 出口压力")
  }

  if (rule.value === "410" && selection.outletPressure === "VC2" && matchedInletPressure !== "20") {
    errors.push("VSR-410 的 VC2 入口最大 300 psig，请选择 20=300 psig")
  }

  if (rule.value === "210" && matchedFlowOption === "FC") {
    const fcConnections = ["FV8", "MV8", "TW8", "FV12", "MV12", "TW12"]
    if (!fcConnections.includes(selection.inletConnector) || !fcConnections.includes(selection.outletConnector)) {
      errors.push("VSR-210 的 FC 仅适用于 1/2 或 3/4 连接")
    }
    if (matchedInletPressure !== "20") {
      errors.push("VSR-210 的 FC 入口压力需 <=300 psig，请选择 20=300 psig")
    }
  }

  if (rule.value === "210" && matchedInletPressure === "200" && ["FV12", "MV12", "TW12"].some((code) => [selection.inletConnector, selection.outletConnector].includes(code))) {
    warnings.push("VSR-210 的 3/4 in 连接最大 2400 psig，当前入口 200=3000 psig 需复核。")
  }

  if (["100", "1000", "510", "610", "710"].includes(rule.value) && matchedInletPressure === "250") {
    warnings.push(`${rule.label} 的 250=3500 psig 属高压入口，目录未标明强制 VS，但建议确认并优先 VS=Vespel。`)
  }

  if (selection.media === "TOXIC_CORROSIVE") {
    warnings.push(`${rule.label} 已按毒腐气体要求匹配 tied-diaphragm 系列。`)
  }

  if (selection.media === "CO2_N2O") {
    warnings.push("CO2/N2O 介质强制选择 VS=Vespel，已自动加入 VS 后缀。")
  }

  if (selection.outletPressure.indexOf("V") === 0) {
    warnings.push("V 负压选项只能表显负压，不能主动调负压。")
  }

  if (selection.outletPressure === "P17") {
    warnings.push("P17 为 800 psig 入口预设 250 psig。")
  }

  if (selection.outletPressure === "P21") {
    warnings.push("P21 为 800 psig 入口下预设 300 psig。")
  }

  if (["910", "911"].includes(rule.value) && matchedInletPressure === "200") {
    warnings.push(`${rule.label} 的 200=3000 psig 入口必须选择 VS=Vespel，已自动加入 VS 后缀。`)
  }

  if (rule.value === "930") {
    warnings.push("VSR-930 为 400=5800 psig 高压入口，建议默认按 VS=Vespel 确认。")
    warnings.push("VSR-930 当前输出标准阀芯候选；HF 为 Cv=0.15，需结合实际气体、压力和流量另行确认。")
  }

  if (rule.capacityBasis === "cv") {
    warnings.push(`${rule.label} 目录按 ${rule.capacityReference} 标注，当前输入流量不能直接与 slpm 容量比较，需进行 Cv 工况核算。`)
  }

  return { errors, warnings }
}

function getPortCode(selection, rule, position) {
  const inletGaugePort = rule.inletGaugePorts[selection.port]
  const outletGaugePort = rule.outletGaugePorts[selection.port]

  if (position === 1) return selection.inletConnector
  if (position === Number(selection.port.replace("P", ""))) return selection.outletConnector
  if (position === inletGaugePort) return getOptionCode(gaugeOptions, selection.inletGauge)
  if (position === outletGaugePort) return getOptionCode(gaugeOptions, selection.outletGauge)
  return "PLUG"
}

function getExtraOptions(selection, rule) {
  const extras = []
  const matchedFlowOption = getMatchedFlowOption(selection, rule)
  const matchedInletPressure = getMatchedInletPressure(selection, rule)

  if (matchedFlowOption === "HF") extras.push("HF")
  if (matchedFlowOption === "FC") extras.push("FC")

  if (["910", "911"].includes(rule.value) && matchedInletPressure === "200") extras.push("VS")
  if (rule.value === "930" && matchedFlowOption === "HF") extras.push("VS")
  if (selection.media === "CO2_N2O") extras.push("VS")

  return extras.filter((item, index) => extras.indexOf(item) === index)
}

function getFlowText(selection, rule) {
  const matchedFlowOption = getMatchedFlowOption(selection, rule)
  if (matchedFlowOption === "HF") return rule.highFlow || "HF 高流量"
  if (matchedFlowOption === "FC") return rule.forceCompFlow || "FC Force compensation"
  return rule.standardFlow || "标准流量"
}

function getRegulatingStructureText(rule) {
  if (rule.structure === "HIGH_PRESSURE_PISTON") return "High-pressure piston"
  if (rule.structure === "TWO_STAGE_DIAPHRAGM") return rule.tiedDiaphragm ? "Two-stage tied diaphragm" : "Two-stage diaphragm"
  return rule.tiedDiaphragm ? "Tied diaphragm" : "Standard diaphragm"
}

function buildModel(selection, rule) {
  const panelCode = getOptionCode(panelMountOptions, selection.panelMount)
  const materialCode = selection.material.replace("UB", `UB${panelCode}`).replace("UC", `UC${panelCode}`)
  const seriesMaterial = `${rule.value}${materialCode}`
  const matchedInletPressure = getMatchedInletPressure(selection, rule)
  const portCount = Number(selection.port.replace("P", ""))
  const portCodes = []

  for (let position = 1; position <= portCount; position += 1) {
    portCodes.push(getPortCode(selection, rule, position))
  }

  const extras = getExtraOptions(selection, rule)

  return [
    `VSR-${seriesMaterial}`,
    matchedInletPressure,
    selection.outletPressure,
    selection.port,
    ...portCodes,
    ...extras
  ].join("-")
}

function getClosestErrors(failedMatches) {
  return failedMatches
    .filter((item) => item.validation.errors.length)
    .sort((a, b) => a.validation.errors.length - b.validation.errors.length)
    .slice(0, 3)
    .map((item) => `${item.rule.label}：${item.validation.errors.join("；")}`)
}

function selectPressureRegulator(selection) {
  const missingErrors = fieldConfigs
    .filter((field) => !selection[field.key])
    .map((field) => `请选择${field.label}`)

  if (missingErrors.length) {
    return {
      errors: missingErrors,
      result: null
    }
  }

  const checkedRules = regulatorSeries
    .map((rule) => ({
      rule,
      validation: validateRule(selection, rule)
    }))

  const matches = checkedRules
    .filter((item) => !item.validation.errors.length)
    .sort((a, b) => {
      const capacityA = getMatchedFlowCapacity(selection, a.rule)
      const capacityB = getMatchedFlowCapacity(selection, b.rule)
      if (capacityA !== capacityB) return capacityA - capacityB
      return regulatorSeries.indexOf(a.rule) - regulatorSeries.indexOf(b.rule)
    })

  if (!matches.length) {
    return {
      errors: [
        "未匹配到符合当前压力、流量和选项的 VIGOUR 减压阀系列",
        ...getClosestErrors(checkedRules)
      ],
      result: null
    }
  }

  const { rule, validation } = matches[0]

  return {
    errors: [],
    result: {
      vigourModel: buildModel(selection, rule),
      status: validation.warnings.length ? "需复核" : "可选候选",
      specs: [
        ...getSelectionSpecs(selection),
        { label: "自动匹配系列", value: rule.label },
        { label: "系列类型", value: rule.type },
        { label: "调压结构", value: getRegulatingStructureText(rule) },
        { label: "推荐流量", value: getFlowText(selection, rule) }
      ],
      note: validation.warnings.join("；")
    }
  }
}

module.exports = {
  defaultSelection,
  fieldConfigs,
  getSelectionSpecs,
  isSelectionComplete,
  regulatorSeries,
  selectPressureRegulator
}
