const VIGOUR_CATALOG_METADATA = Object.freeze({
  document: "VIGOUR VUPS英文目录-26.8.7.pdf",
  pdfSha256: "a579af2dc01ebd4aa6c47fe0dc8198f0472dfa5eb0887b8db2a74707109bdcd9",
  pageTextDocument: "VIGOUR VUPS英文目录-26.8.7.md",
  pageTextSha256: "a47521802cdff74e7e69897dd77f385f42a3c4dc429053c366ce1a0741710879",
  pageTextPages: 173,
  pageTextExtractionMethod: "PDF 原生文本层",
  flowCircuitCatalogPage: 71,
  flowCircuitPdfPage: 74
})

const GLOBAL_FLOW_CIRCUITS = Object.freeze(["", "A", "B", "K", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M"])
const SMALL_VDV_CONNECTIONS = Object.freeze(["MV4", "FV4", "RMV4", "TW4", "TW6"])

const VDV_SERIES_ORDERING = Object.freeze({
  VDV32: Object.freeze({
    schema: "flow-circuit",
    variants: ["UB", "UC"],
    actuators: ["M", "PC", "PO"],
    flowCircuits: GLOBAL_FLOW_CIRCUITS,
    connections: ["MV4", "FV4", "TW4", "RMV4", "HFV4", "HRMV4", "TW6", "MV8", "FV8", "TW8", "RMV12", "FV12"]
  }),
  VDV33: Object.freeze({
    schema: "flow-circuit",
    variants: ["UB", "UC"],
    actuators: ["M", "PC", "PO", "HPC"],
    flowCircuits: GLOBAL_FLOW_CIRCUITS,
    connections: ["MV4", "FV4", "TW4", "HFV4", "HRMV4", "TW6", "FV8", "RMV8", "TW8"]
  }),
  VDV40: Object.freeze({
    schema: "flow-circuit",
    variants: ["UB", "UC"],
    actuators: ["M", "PC"],
    flowCircuits: GLOBAL_FLOW_CIRCUITS,
    connections: SMALL_VDV_CONNECTIONS
  }),
  VDV42: Object.freeze({
    schema: "flow-circuit",
    variants: ["UB", "UC"],
    actuators: ["M", "PC", "PO"],
    flowCircuits: GLOBAL_FLOW_CIRCUITS,
    connections: SMALL_VDV_CONNECTIONS
  }),
  VDV37: Object.freeze({
    schema: "fixed-purge",
    variants: ["UB", "UC"],
    actuators: ["M", "PC"],
    flowCircuits: [""],
    connections: ["TW6", "FV8", "RMV8", "TW8", "FV12", "RMV12", "TW12"]
  }),
  VDV38: Object.freeze({
    schema: "fixed-high-pressure",
    variants: ["UB", "UC"],
    actuators: ["M", "PC"],
    flowCircuits: [""],
    connections: ["HRMV4", "HFV4", "RMV8", "FV8", "TW6", "TW8", "RMV12", "FV12", "TW12"]
  }),
  VDV46: Object.freeze({
    schema: "compound-valve",
    variants: ["UB", "UC"],
    actuators: [],
    flowCircuits: [],
    connections: ["FV4", "MV4", "RMV4"]
  })
})

const VDV_CATALOG_SERIES = Object.freeze([
  { id: "VDV32", pdfPages: [46, 51] },
  { id: "VDV33", pdfPages: [52, 59] },
  { id: "VDV40", pdfPages: [60, 63] },
  { id: "VDV42", pdfPages: [64, 69] },
  { id: "VDV52", pdfPages: [70, 74] },
  { id: "VDV22", pdfPages: [75, 75] },
  { id: "VDV36", pdfPages: [76, 79] },
  { id: "VDV46", pdfPages: [80, 83] },
  { id: "VDV48", pdfPages: [84, 87] },
  { id: "VDV37", pdfPages: [88, 93] },
  { id: "VDV38", pdfPages: [94, 99] },
  { id: "VDV39", pdfPages: [100, 101] }
].map((item) => Object.freeze({
  ...item,
  ordering: VDV_SERIES_ORDERING[item.id] || null
})))

const VIGOUR_FLOW_CIRCUITS = Object.freeze({
  "": Object.freeze({ portCount: 2, label: "Standard" }),
  A: Object.freeze({ portCount: 2, label: "A" }),
  B: Object.freeze({ portCount: 2, label: "B" }),
  K: Object.freeze({ portCount: 2, label: "K", bottomInterface: true }),
  C: Object.freeze({ portCount: 3, label: "C" }),
  D: Object.freeze({ portCount: 3, label: "D" }),
  E: Object.freeze({ portCount: 3, label: "E" }),
  F: Object.freeze({ portCount: 3, label: "F" }),
  G: Object.freeze({ portCount: 3, label: "G" }),
  H: Object.freeze({ portCount: 3, label: "H" }),
  I: Object.freeze({ portCount: 4, label: "I" }),
  J: Object.freeze({ portCount: 4, label: "J" }),
  L: Object.freeze({ portCount: 4, label: "L" }),
  M: Object.freeze({ portCount: 4, label: "M" })
})

// APTech and VIGOUR use different topology alphabets and opposite drawing orientation.
const APTECH_TO_VIGOUR_FLOW = Object.freeze({
  "2P": "",
  "2PW": "",
  "2PWA": "B",
  "2PWB": "K",
  "2PWC": "A",
  "3PWD": "C",
  "3PWE": "D",
  "3PWF": "E",
  "3PWG": "F",
  "3PWH": "G",
  "3PWJ": "H",
  "4PWK": "I",
  "4PWL": "J",
  "4PWM": "L",
  "4PWN": "M"
})

const VDV_CONNECTION_TOKEN = /^(?:FV|MV|TW|RMV|HFV|HRMV)\d+$/
const VDV_ACTUATORS = new Set(["M", "PC", "PO"])

const VDV_CONNECTION_EQUIVALENTS = Object.freeze({
  VDV37: Object.freeze({ MV8: "RMV8", MV12: "RMV12" }),
  VDV38: Object.freeze({ FV4: "HFV4", MV4: "HRMV4", MV8: "RMV8", MV12: "RMV12" })
})

function findVdvCatalogSeries(model) {
  const match = String(model || "").match(/^(VDV\d+)/)
  return match ? VDV_CATALOG_SERIES.find((series) => series.id === match[1]) || null : null
}

function parseVigourVdvModel(model) {
  const parts = String(model || "").split("-").filter(Boolean)
  const series = findVdvCatalogSeries(parts[0])
  const variantMatch = series && String(parts[0] || "").match(new RegExp(`^${series.id}(UB|UC)`))
  let cursor = 1
  const actuator = VDV_ACTUATORS.has(parts[cursor]) ? parts[cursor++] : ""
  const hasCircuit = Object.prototype.hasOwnProperty.call(VIGOUR_FLOW_CIRCUITS, parts[cursor])
  const flowCircuit = hasCircuit ? parts[cursor++] : ""
  const connections = parts.filter((part) => VDV_CONNECTION_TOKEN.test(part))

  return {
    model: String(model || ""),
    head: parts[0] || "",
    series,
    variant: variantMatch ? variantMatch[1] : "",
    actuator,
    flowCircuit,
    connections,
    parts,
    optionStartIndex: cursor
  }
}

function expectedVigourFlowCircuit(aptechPortCode) {
  const code = String(aptechPortCode || "")
  return Object.prototype.hasOwnProperty.call(APTECH_TO_VIGOUR_FLOW, code)
    ? APTECH_TO_VIGOUR_FLOW[code]
    : null
}

function expectedVigourConnection(seriesId, aptechConnection) {
  const code = String(aptechConnection || "")
  const mapping = VDV_CONNECTION_EQUIVALENTS[String(seriesId || "")] || {}
  return mapping[code] || code
}

module.exports = {
  APTECH_TO_VIGOUR_FLOW,
  VDV_CATALOG_SERIES,
  VIGOUR_CATALOG_METADATA,
  VIGOUR_FLOW_CIRCUITS,
  expectedVigourConnection,
  expectedVigourFlowCircuit,
  findVdvCatalogSeries,
  parseVigourVdvModel
}
