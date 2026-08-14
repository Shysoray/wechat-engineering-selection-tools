const CATALOG_METADATA = Object.freeze({
  document: "S100-88-ProcessGas.pdf",
  catalogNumber: "CAT.S100-88D",
  revisionDate: "2024-06-11",
  sha256: "58499a6a548f1027b75f6f9e6373191525c0ea0222ec51d096fbf99584db2b30",
  pageTextDocument: "S100-88-ProcessGas.md",
  pageTextSha256: "5830ab9f91d69ce2503ba6b3ad0d290a5ba5375e3f0320180619aa33ca4059e5",
  pageTextPages: 253,
  pageTextExtractionMethod: "PDF 原生文本层",
  pageOffset: 1
})

const APTECH_SUPPLEMENTAL_RULES = Object.freeze({
  AP1225_PS25: Object.freeze({
    id: "AP1225_PS25",
    source: "工程确认的 APTECH 隐藏代码",
    sourceModel: "AP1225",
    token: "PS25",
    meaning: "PRESET 250 PSI",
    vigourCode: "P17"
  })
})

const AP_MATERIALS = ["SHP", "SH", "S", "H"]
const AZ_MATERIALS = ["SHP", "S"]
const AP_ROUGHNESS = ["M", "V", "X"]
const AZ_ROUGHNESS = ["Q"]
const STANDARD_PORTS = ["2PW", "3PW", "4PW"]
const STANDARD_GAUGES = ["0", "V3", "L", "1", "H", "2", "4", "10", "40"]

function connectionCodes(sizes) {
  return sizes.flatMap((size) => [`FV${size}`, `MV${size}`, `TW${size}`])
}

function regulatorSeries(definition) {
  return Object.freeze({
    family: "regulator",
    pdfPage: definition.catalogPage + CATALOG_METADATA.pageOffset,
    materials: definition.brand === "AZ" ? AZ_MATERIALS : AP_MATERIALS,
    roughness: definition.brand === "AZ" ? AZ_ROUGHNESS : AP_ROUGHNESS,
    ports: STANDARD_PORTS,
    gauges: STANDARD_GAUGES,
    seats: [],
    options: [],
    bonnetOptions: [],
    handleOptions: [],
    ...definition
  })
}

const REGULATOR_CATALOG_SERIES = Object.freeze([
  regulatorSeries({
    id: "AP500", brand: "AP", catalogPage: 41,
    numbers: [501, 502, 506, 510, 515], mappingNumbers: [501, 502, 506, 510, 515],
    materials: ["SH", "S"], roughness: AP_ROUGHNESS,
    ports: ["2PW", "3PWG"], connections: connectionCodes(["4"]),
    gauges: ["V3", "L", "1", "H", "2"], seats: ["TF", "VS"],
    options: ["FI", "HF", "HR"], finalAFor: [501]
  }),
  regulatorSeries({
    id: "AP1000", brand: "AP", catalogPage: 43,
    numbers: [1001, 1002, 1006, 1010, 1015, 1030], mappingNumbers: [1001, 1002, 1006, 1010, 1015],
    connections: connectionCodes(["4", "6"]), seats: ["VS", "TF"], options: ["HF"],
    bonnetOptions: ["P", "SC"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1100", brand: "AP", catalogPage: 45,
    numbers: [1101], mappingNumbers: [1101], connections: connectionCodes(["4", "6"]),
    seats: ["TF"], bonnetOptions: ["P", "SC"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1500", brand: "AP", catalogPage: 47,
    numbers: [1502, 1506, 1510, 1515], mappingNumbers: [1502, 1506, 1510, 1515],
    connections: connectionCodes(["4", "6"]), seats: ["VS", "TF"], options: ["HF"],
    bonnetOptions: ["P", "SC"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1600", brand: "AP", catalogPage: 49,
    numbers: [1601, 1602, 1606, 1610], mappingNumbers: [1601, 1602, 1606, 1610],
    materials: ["SH", "S"], connections: connectionCodes(["4", "6"]), seats: ["VS"],
    bonnetOptions: ["P"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1900", brand: "AP", catalogPage: 51,
    numbers: [1901, 1902, 1906, 1910, 1915], mappingNumbers: [1901, 1902, 1906, 1910, 1915],
    materials: ["SH", "S"], connections: connectionCodes(["4", "6", "8"]), seats: ["VS"],
    options: ["HF"], bonnetOptions: ["P"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1400T", brand: "AP", catalogPage: 53,
    numbers: [1402, 1406, 1410, 1415], mappingNumbers: [1402, 1406, 1410, 1415],
    fixedSuffixPrefix: "T", finalAFor: [1402], materials: ["SH", "S"],
    connections: connectionCodes(["4", "6", "8"]), seats: ["VS"], options: ["HR"],
    bonnetOptions: ["P", "SC"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1200", brand: "AP", catalogPage: 55,
    numbers: [1202, 1206, 1210, 1215, 1225], mappingNumbers: [1202, 1206, 1210, 1215, 1225],
    materials: ["SHP", "SH", "S"], connections: connectionCodes(["4", "6", "8", "12"]),
    seats: ["VS"], options: ["HF", "FC", "HR"], bonnetOptions: ["P", "SC"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP1300", brand: "AP", catalogPage: 57,
    numbers: [1302, 1306, 1310, 1315], mappingNumbers: [1302, 1306, 1310, 1315],
    materials: ["SHP", "S"], ports: ["2PW", "3PW"],
    connections: connectionCodes(["4", "6", "8", "12"]),
    gauges: ["0", "V3", "L", "1", "H", "2", "4"], seats: ["TF"],
    bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP9000", brand: "AP", catalogPage: 59,
    numbers: [9010, 9030, 9110, 9115], mappingNumbers: [9010, 9030, 9110, 9115],
    materials: ["S"], roughness: ["M"], ports: ["2PW", "3PW"],
    connections: connectionCodes(["8", "12", "16"]), gauges: ["0", "V3", "L", "1", "H", "4"],
    seats: ["VS"], options: ["HR"]
  }),
  regulatorSeries({
    id: "AP1700", brand: "AP", catalogPage: 63,
    numbers: [1702, 1706, 1710, 1720], mappingNumbers: [1702, 1706, 1710, 1720],
    materials: ["SH", "S"], ports: ["2PW", "3PW", "3PWQ", "4PW", "5PWQ"],
    connections: connectionCodes(["4", "6"]), seats: ["VS"], options: ["HF", "HR", "NT"],
    bonnetOptions: ["P", "SC"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AP2700", brand: "AP", catalogPage: 65,
    numbers: [2702, 2706, 2710, 2712], mappingNumbers: [],
    materials: ["SH", "S"], ports: ["2PW", "3PW", "3PWQ", "4PW", "5PWQ"],
    connections: connectionCodes(["4", "6"]), seats: ["VS"],
    bonnetOptions: ["P"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ1000", brand: "AZ", catalogPage: 85,
    numbers: [1001, 1002, 1006, 1010, 1015, 1030], mappingNumbers: [1001, 1002, 1006, 1010, 1015],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW6"],
    gauges: ["0", "V3", "L", "1", "H", "2", "4", "40"],
    seats: ["VS", "TF"], options: ["HF"],
    bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ1100", brand: "AZ", catalogPage: 87,
    numbers: [1101], mappingNumbers: [1101],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW6"],
    gauges: ["0", "V3", "L", "1", "H", "2", "4"],
    seats: ["TF"], bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ1500", brand: "AZ", catalogPage: 89,
    numbers: [1502, 1506, 1510, 1515], mappingNumbers: [1502, 1506, 1510, 1515],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW6"],
    gauges: ["0", "V3", "L", "1", "H", "2", "40"],
    seats: ["VS"], options: ["HF", "HR"],
    bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ1400T", brand: "AZ", catalogPage: 91,
    numbers: [1402, 1406, 1410, 1415], mappingNumbers: [1402, 1406, 1410, 1415],
    fixedSuffixPrefix: "T", finalAFor: [1402], materials: ["S"],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "FV8", "MV8", "TW8"],
    gauges: ["0", "V3", "L", "1", "H", "2", "4", "40"],
    seats: ["VS"], options: ["HR"], bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ1200", brand: "AZ", catalogPage: 93,
    numbers: [1202, 1206, 1210, 1215, 1225], mappingNumbers: [1202, 1206, 1210, 1215, 1225],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "FV8", "MV8", "TW8"],
    gauges: ["0", "V3", "L", "1", "H", "2", "4", "40"],
    seats: ["VS"], options: ["HF", "FC", "HR"],
    bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ1300", brand: "AZ", catalogPage: 95,
    numbers: [1302, 1306, 1310, 1315], mappingNumbers: [1302, 1306, 1310, 1315],
    materials: ["S"], ports: ["2PW", "3PW"],
    connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "FV8", "MV8", "TW8"],
    gauges: ["0", "V3", "L", "1", "H", "2"], seats: ["TF"],
    bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  }),
  regulatorSeries({
    id: "AZ9200", brand: "AZ", catalogPage: 97,
    numbers: [9202, 9206, 9210, 9215], mappingNumbers: [9202, 9206, 9210, 9215],
    materials: ["S"], roughness: [], ports: ["2PW", "3PW"],
    connections: connectionCodes(["12", "16"]), gauges: ["0", "V3", "L", "1", "H"],
    bonnetOptions: ["P", "BP"], handleOptions: ["KL"]
  })
])

const AP_MULTI_PORTS = [
  "2PW", "2PWA", "2PWB", "2PWC",
  "3PWD", "3PWE", "3PWF", "3PWG", "3PWH", "3PWJ",
  "4PWK", "4PWL", "4PWM", "4PWN"
]
const AZ_MULTI_PORTS = [
  "2PW", "2PWA", "2PWC",
  "3PWD", "3PWE", "3PWF", "3PWG", "3PWH",
  "4PWM"
]
const DIAPHRAGM_PORT_TOPOLOGIES = Object.freeze({
  AP: Object.freeze({
    catalogPage: 179,
    pdfPage: 180,
    seriesPrefixes: ["30", "32", "35", "36", "40", "45", "46"],
    ports: AP_MULTI_PORTS
  }),
  AZ: Object.freeze({
    catalogPage: 207,
    pdfPage: 208,
    seriesPrefixes: ["35", "36", "45", "46"],
    ports: AZ_MULTI_PORTS
  })
})
const FIXED_MULTI_PORTS = ["2PW", "3PWD", "3PWE", "3PWF", "4PWM"]
const SMALL_CONNECTIONS = connectionCodes(["4", "6"])
const LARGE_CONNECTIONS = ["FV4", "MV4", "TW6", "FV8", "MV8", "TW8", "FV12", "MV12", "TW12"]
const PURGE_CONNECTIONS = ["TW6", "FV8", "MV8", "TW8", "FV12", "MV12", "TW12"]

function diaphragmSeries(id, brand, catalogPage, numbers, mode, schema = {}) {
  return Object.freeze({
    id,
    brand,
    family: "diaphragm",
    catalogPage,
    pdfPage: catalogPage + CATALOG_METADATA.pageOffset,
    numbers,
    mode,
    materials: brand === "AZ" ? ["S"] : ["S", "H"],
    roughness: brand === "AZ" ? [] : AP_ROUGHNESS,
    ports: [],
    connections: [],
    allowedSelections: [],
    optionApplicability: {},
    fixedLayout: false,
    ...schema
  })
}

const DIAPHRAGM_CATALOG_SERIES = Object.freeze([
  diaphragmSeries("AP3500", "AP", 145, [3542, 3540, 3550, 3580], "pneumatic", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "IPC", "IPO"],
    optionApplicability: { IPC: [3550, 3580], IPO: [3550, 3580] }
  }),
  diaphragmSeries("AP4500", "AP", 147, [4542, 4540, 4550, 4580], "pneumatic", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "IPC", "IPO"],
    optionApplicability: { IPC: [4550, 4580], IPO: [4550, 4580] }
  }),
  diaphragmSeries("AP3000", "AP", 149, [3000, 3002, 3004, 3007, 3080], "pneumatic", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "PK", "IS"],
    optionApplicability: { PK: [3004, 3007], IS: [3007] }
  }),
  diaphragmSeries("AP4000", "AP", 151, [4000], "pneumatic", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "IS"]
  }),
  diaphragmSeries("AP4141", "AP", 153, [4141], "pneumatic", {
    materials: ["S"], ports: FIXED_MULTI_PORTS,
    connections: ["FV4", "MV4", "TW6", "FV8", "MV8", "TW8"], allowedSelections: ["VS"]
  }),
  diaphragmSeries("AP3130", "AP", 155, [3113, 3130], "pneumatic", {
    roughness: ["M"], ports: ["2PW"], connections: LARGE_CONNECTIONS,
    allowedSelections: ["VS", "IS"]
  }),
  diaphragmSeries("AP3700", "AP", 157, [3700, 3708], "pneumatic", {
    materials: ["S"], fixedLayout: true, connections: PURGE_CONNECTIONS,
    allowedSelections: ["VS", "HD", "M0", "0B", "MB", "C", "IPC", "IPO"]
  }),
  diaphragmSeries("AP3571", "AP", 159, [3571, 4571], "pneumatic", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "P"]
  }),
  diaphragmSeries("AP3200", "AP", 161, [3200, 3202], "pneumatic", {
    materials: ["S"], ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["IS"]
  }),
  diaphragmSeries("AP3600", "AP", 163, [3600, 3625, 3650, 3652, 3657, 3659], "manual", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "P", "ISH"],
    optionApplicability: { P: [3600, 3625, 3650, 3657], ISH: [3650] }
  }),
  diaphragmSeries("AP4600", "AP", 165, [4600, 4625, 4650, 4652, 4657, 4659], "manual", {
    ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["VS", "P", "ISH", "HR"],
    optionApplicability: {
      P: [4600, 4625, 4650, 4657], ISH: [4650], HR: [4600, 4625, 4650, 4657]
    }
  }),
  diaphragmSeries("AP3604", "AP", 167, [3604, 3624, 3627], "manual", {
    materials: ["S"], ports: AP_MULTI_PORTS, connections: ["FV4", "MV4", "TW4"],
    allowedSelections: ["VS", "PK", "P"], optionApplicability: { VS: [3604, 3624] }
  }),
  diaphragmSeries("AP4150", "AP", 169, [4150, 4157], "manual", {
    materials: ["S"], ports: FIXED_MULTI_PORTS,
    connections: ["FV4", "MV4", "TW6", "FV8", "MV8", "TW8"],
    allowedSelections: ["VS", "ISH"], optionApplicability: { ISH: [4150] }
  }),
  diaphragmSeries("AP3100", "AP", 171, [3100, 3102, 3125, 3150, 3157], "manual", {
    roughness: ["M"], ports: ["2PW"], connections: LARGE_CONNECTIONS,
    allowedSelections: ["VS", "ISH"], optionApplicability: { ISH: [3150] }
  }),
  diaphragmSeries("AP3800", "AP", 173, [3800, 3900], "manual", {
    materials: ["S"], fixedLayout: true, connections: PURGE_CONNECTIONS,
    allowedSelections: ["VS", "HD", "M0", "0B", "MB", "C"]
  }),
  diaphragmSeries("AP3260", "AP", 175, [3225, 3260, 3262], "manual", {
    materials: ["S"], ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS, allowedSelections: ["P"]
  }),
  diaphragmSeries("AP3672", "AP", 177, [3672, 3675, 4675], "manual", {
    materials: ["S"], ports: AP_MULTI_PORTS, connections: SMALL_CONNECTIONS
  }),
  diaphragmSeries("AZ3500", "AZ", 181, [3542, 3540, 3550, 3580], "pneumatic", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: SMALL_CONNECTIONS,
    allowedSelections: ["VS", "IPC", "IPO"], optionApplicability: { IPC: [3550, 3580], IPO: [3550, 3580] }
  }),
  diaphragmSeries("AZ4500", "AZ", 183, [4542, 4540, 4550, 4580], "pneumatic", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "TW8"],
    allowedSelections: ["VS", "IPC", "IPO"], optionApplicability: { IPC: [4550, 4580], IPO: [4550, 4580] }
  }),
  diaphragmSeries("AZ3000", "AZ", 185, [3000, 3002, 3004, 3007, 3080], "pneumatic", {
    ports: ["2P", "2PW"], connections: SMALL_CONNECTIONS,
    allowedSelections: ["VS", "PK", "IS", "P"], optionApplicability: { PK: [3004, 3007], IS: [3007] }
  }),
  diaphragmSeries("AZ4000", "AZ", 187, [4000], "pneumatic", {
    ports: ["2P", "2PW"], connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "TW8"],
    allowedSelections: ["VS", "IS", "P"]
  }),
  diaphragmSeries("AZ4141", "AZ", 189, [4141], "pneumatic", {
    ports: FIXED_MULTI_PORTS, connections: ["FV4", "MV4", "TW6", "FV8", "MV8", "TW8"],
    allowedSelections: ["VS"]
  }),
  diaphragmSeries("AZ3700", "AZ", 191, [3700, 3708], "pneumatic", {
    fixedLayout: true, connections: PURGE_CONNECTIONS,
    allowedSelections: ["VS", "HD", "M0", "0B", "MB", "C", "IPC", "IPO"]
  }),
  diaphragmSeries("AZ3571", "AZ", 193, [3571, 4571], "pneumatic", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "TW8"],
    allowedSelections: ["VS", "P"]
  }),
  diaphragmSeries("AZ3600", "AZ", 195, [3600, 3625, 3650, 3652, 3657, 3659], "manual", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: SMALL_CONNECTIONS,
    allowedSelections: ["VS", "P", "ISH"],
    optionApplicability: { P: [3600, 3625, 3650, 3657], ISH: [3650] }
  }),
  diaphragmSeries("AZ4600", "AZ", 197, [4600, 4625, 4650, 4652, 4657, 4659], "manual", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "TW8"],
    allowedSelections: ["VS", "P", "ISH", "HR"],
    optionApplicability: {
      P: [4600, 4625, 4650, 4657], ISH: [4650], HR: [4600, 4625, 4650, 4657]
    }
  }),
  diaphragmSeries("AZ3604", "AZ", 199, [3604, 3624, 3627], "manual", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: ["FV4", "MV4", "TW4"],
    allowedSelections: ["VS", "PK", "P"], optionApplicability: { VS: [3604, 3624] }
  }),
  diaphragmSeries("AZ4150", "AZ", 201, [4150, 4157], "manual", {
    ports: FIXED_MULTI_PORTS, connections: ["FV4", "MV4", "TW6", "FV8", "MV8", "TW8"],
    allowedSelections: ["VS", "ISH"], optionApplicability: { ISH: [4150] }
  }),
  diaphragmSeries("AZ3800", "AZ", 203, [3800, 3900], "manual", {
    fixedLayout: true, connections: PURGE_CONNECTIONS,
    allowedSelections: ["VS", "HD", "M0", "0B", "MB", "C"]
  }),
  diaphragmSeries("AZ3672", "AZ", 205, [3672, 3675, 4675], "manual", {
    ports: ["2P", ...AZ_MULTI_PORTS], connections: ["FV4", "MV4", "FV6", "MV6", "TW6", "TW8"]
  })
])

const ACCESSORY_CATALOG_SERIES = Object.freeze([
  { id: "AP64", catalogPage: 231, pattern: /^AP64[A-Z]*$/ },
  { id: "AP7_AP70", catalogPage: 233, pattern: /^AP(?:7|70)[A-Z]*$/ },
  { id: "AP71", catalogPage: 235, pattern: /^AP71[A-Z0-9]*$/ },
  { id: "AP72", catalogPage: 237, pattern: /^AP72[A-Z0-9]*$/ },
  { id: "AP74", catalogPage: 239, pattern: /^AP74(?!B)[A-Z0-9]*$/ },
  { id: "AP74B", catalogPage: 241, pattern: /^AP74B[A-Z0-9]*$/ }
].map((item) => Object.freeze({
  ...item,
  family: "accessory",
  pdfPage: item.catalogPage + CATALOG_METADATA.pageOffset
})))

function findRegulatorCatalogSeries(brand, number) {
  return REGULATOR_CATALOG_SERIES.find((series) => (
    series.brand === brand && series.numbers.includes(number)
  )) || null
}

function findDiaphragmCatalogSeries(brand, number) {
  return DIAPHRAGM_CATALOG_SERIES.find((series) => (
    series.brand === brand && series.numbers.includes(number)
  )) || null
}

function findAccessoryCatalogSeries(token) {
  const source = String(token || "").replace(/^WB-/, "")
  return ACCESSORY_CATALOG_SERIES.find((series) => series.pattern.test(source)) || null
}

function parseCatalogSuffix(series, number, suffix) {
  let remaining = String(suffix || "")
  const fields = { fixedPrefix: "", material: "", roughness: "", negativeAdjustment: false }

  if (series.fixedSuffixPrefix) {
    if (!remaining.startsWith(series.fixedSuffixPrefix)) {
      return { fields, unparsed: remaining, issue: `缺少目录固定后缀 ${series.fixedSuffixPrefix}` }
    }
    fields.fixedPrefix = series.fixedSuffixPrefix
    remaining = remaining.slice(series.fixedSuffixPrefix.length)
  }

  const material = [...series.materials].sort((a, b) => b.length - a.length).find((code) => remaining.startsWith(code))
  if (material) {
    fields.material = material
    remaining = remaining.slice(material.length)
  }

  const roughness = series.roughness.find((code) => remaining.startsWith(code))
  if (roughness) {
    fields.roughness = roughness
    remaining = remaining.slice(roughness.length)
  }

  if ((series.finalAFor || []).includes(number) && remaining === "A") {
    fields.negativeAdjustment = true
    remaining = ""
  }

  return {
    fields,
    unparsed: remaining,
    issue: material ? "" : "目录要求明确材质代码"
  }
}

module.exports = {
  ACCESSORY_CATALOG_SERIES,
  APTECH_SUPPLEMENTAL_RULES,
  CATALOG_METADATA,
  DIAPHRAGM_PORT_TOPOLOGIES,
  DIAPHRAGM_CATALOG_SERIES,
  REGULATOR_CATALOG_SERIES,
  findAccessoryCatalogSeries,
  findDiaphragmCatalogSeries,
  findRegulatorCatalogSeries,
  parseCatalogSuffix
}
