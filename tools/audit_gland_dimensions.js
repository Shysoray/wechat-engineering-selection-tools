const fs = require("fs")
const path = require("path")
const { fittingMappings } = require("../packageFitting/fittingDatabase")

const OUTPUT_DIR = path.join(__dirname, "../outputs/tube_fitting_audit")

const OPTION_SUFFIXES = ["-SLV-P", "-SLV", "-BA", "-P"]

const VIGOUR_GLAND_DIMENSIONS = {
  "VVR-FG2-TB2": { family: "short", tubeOd: "1/8", wallIn: 0.028, l1Mm: 19.1, d1Mm: 1.8, lMm: 27.4 },
  "VVR-FG4-TB4": { family: "short", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 27.9 },
  "VVR-FG4-TB4-L18": { family: "short", tubeOd: "1/4", wallIn: 0.035, l1Mm: 9.6, d1Mm: 4.6, lMm: 18.3 },
  "VVR-FG4-TB4-L15": { family: "short", tubeOd: "1/4", wallIn: 0.035, l1Mm: 6.4, d1Mm: 4.6, lMm: 15.2 },
  "VVR-FG8-TB4": { family: "short", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 28.4 },
  "VVR-FG8-TB4-L15": { family: "short", tubeOd: "1/4", wallIn: 0.035, l1Mm: 6.4, d1Mm: 4.6, lMm: 15.7 },
  "VVR-FG8-TB4-L19": { family: "short", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 19.4 },
  "VVR-FG8-TB6": { family: "short", tubeOd: "3/8", wallIn: 0.035, l1Mm: 19.1, d1Mm: 7.9, lMm: 28.4 },
  "VVR-FG8-TB6-L15": { family: "short", tubeOd: "3/8", wallIn: 0.035, l1Mm: 6.4, d1Mm: 7.9, lMm: 15.7 },
  "VVR-FG8-TB8": { family: "short", tubeOd: "1/2", wallIn: 0.049, l1Mm: 19.1, d1Mm: 10.2, lMm: 28.4 },
  "VVR-FG8-TB8-L18": { family: "short", tubeOd: "1/2", wallIn: 0.049, l1Mm: 9.6, d1Mm: 10.2, lMm: 18.8 },
  "VVR-FG8-TB8-L15": { family: "short", tubeOd: "1/2", wallIn: 0.049, l1Mm: 6.4, d1Mm: 10.2, lMm: 15.7 },
  "VVR-FG12-TB12": { family: "short", tubeOd: "3/4", wallIn: 0.065, l1Mm: 20.6, d1Mm: 15.7, lMm: 32.0 },
  "VVR-FG16-TB16": { family: "short", tubeOd: "1", wallIn: 0.065, l1Mm: 19.1, d1Mm: 22.1, lMm: 38.6 },

  "VVR-MG2-TB2": { family: "long", tubeOd: "1/8", wallIn: 0.028, l1Mm: 19.1, d1Mm: 1.8, lMm: 36.1 },
  "VVR-MG4-TB2": { family: "long", tubeOd: "1/8", wallIn: 0.022, l1Mm: 7.1, d1Mm: 4.6, lMm: 33.3 },
  "VVR-MG4-TB4": { family: "long", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 43.2 },
  "VVR-MG4-TB4-L33": { family: "long", tubeOd: "1/4", wallIn: 0.035, l1Mm: 9.6, d1Mm: 4.6, lMm: 33.5 },
  "VVR-MG4-TB4-L30": { family: "long", tubeOd: "1/4", wallIn: 0.035, l1Mm: 6.4, d1Mm: 4.6, lMm: 30.5 },
  "VVR-MG8-TB4": { family: "long", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 45.5 },
  "VVR-MG8-TB4-L32": { family: "long", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 32.7 },
  "VVR-MG8-TB4-L37": { family: "long", tubeOd: "1/4", wallIn: 0.035, l1Mm: 19.1, d1Mm: 4.6, lMm: 37.4 },
  "VVR-MG8-TB6": { family: "long", tubeOd: "3/8", wallIn: 0.035, l1Mm: 19.1, d1Mm: 7.9, lMm: 45.5 },
  "VVR-MG8-TB6-L32": { family: "long", tubeOd: "3/8", wallIn: 0.035, l1Mm: 6.4, d1Mm: 7.9, lMm: 32.8 },
  "VVR-MG8-TB8": { family: "long", tubeOd: "1/2", wallIn: 0.049, l1Mm: 19.1, d1Mm: 10.2, lMm: 45.5 },
  "VVR-MG8-TB8-L35": { family: "long", tubeOd: "1/2", wallIn: 0.049, l1Mm: 9.6, d1Mm: 10.2, lMm: 35.8 },
  "VVR-MG8-TB8-L32": { family: "long", tubeOd: "1/2", wallIn: 0.049, l1Mm: 6.4, d1Mm: 10.2, lMm: 32.8 },
  "VVR-MG12-TB12": { family: "long", tubeOd: "3/4", wallIn: 0.065, l1Mm: 19.1, d1Mm: 16.5, lMm: 51.6 },
  "VVR-MG16-TB16": { family: "long", tubeOd: "1", wallIn: 0.065, l1Mm: 19.1, d1Mm: 22.1, lMm: 58.9 },

  "HVVR-HG4-TB6-L15": { family: "high-flow", tubeOd: "3/8", wallIn: 0.035, l1Mm: 10.4, dMm: 6.4, d1Mm: 7.9, lMm: 15.2 },
  "HVVR-HG4-TB6-L30": { family: "high-flow", tubeOd: "3/8", wallIn: 0.035, l1Mm: 25.4, dMm: 6.4, d1Mm: 7.9, lMm: 30.2 },
  "HVVR-HG4-TB6-L33": { family: "high-flow", tubeOd: "3/8", wallIn: 0.035, l1Mm: 28.4, dMm: 6.4, d1Mm: 7.9, lMm: 33.3 },
  "HVVR-MG4-TB6": { family: "high-flow-body", tubeOd: "3/8", l1Mm: 19.1, dMm: 6.4, d1Mm: 7.9, lMm: 42.7 },
}

const SWAGELOK_LENGTHS = {
  "6LV-2-VCR-3S-2TB7": { family: "short", lMm: 27.4, l1Mm: 19.1 },
  "6LV-4-VCR-3S-2TB7": { family: "short", lMm: 27.9, l1Mm: 19.1 },
  "6LV-4-VCR-3S-4TB2": { family: "short", lMm: 15.2, l1Mm: 6.4 },
  "6LV-4-VCR-3S-4TB3": { family: "short", lMm: 18.3, l1Mm: 9.6 },
  "6LV-4-VCR-3S-4TB7": { family: "short", lMm: 27.9, l1Mm: 19.1 },
  "6LV-8-VCR-3S-4TB7": { family: "short", lMm: 28.4, l1Mm: 19.1 },
  "6LV-8-VCR-3S-6TB2": { family: "short", lMm: 15.7, l1Mm: 6.4 },
  "6LV-8-VCR-3S-6TB7": { family: "short", lMm: 28.4, l1Mm: 19.1 },
  "6LV-8-VCR-3S-8TB2": { family: "short", lMm: 15.7, l1Mm: 6.4 },
  "6LV-8-VCR-3S-8TB3": { family: "short", lMm: 18.8, l1Mm: 9.6 },
  "6LV-8-VCR-3S-8TB7": { family: "short", lMm: 28.4, l1Mm: 19.1 },

  "6LV-2-VCR-3-2TB7": { family: "long", lMm: 36.1, l1Mm: 19.1 },
  "6LV-4-VCR-3-4TB2": { family: "long", lMm: 30.5, l1Mm: 6.4 },
  "6LV-4-VCR-3-4TB3": { family: "long", lMm: 33.5, l1Mm: 9.6 },
  "6LV-4-VCR-3-4TB7": { family: "long", lMm: 43.2, l1Mm: 19.1 },
  "6LV-8-VCR-3-4TB7": { family: "long", lMm: 45.7, l1Mm: 19.1 },
  "6LV-8-VCR-3-6TB2": { family: "long", lMm: 32.8, l1Mm: 6.4 },
  "6LV-8-VCR-3-6TB7": { family: "long", lMm: 45.5, l1Mm: 19.1 },
  "6LV-8-VCR-3-8TB2": { family: "long", lMm: 32.8, l1Mm: 6.4 },
  "6LV-8-VCR-3-8TB3": { family: "long", lMm: 35.8, l1Mm: 9.6 },
  "6LV-8-VCR-3-8TB7": { family: "long", lMm: 45.5, l1Mm: 19.1 },
  "6LV-12-VCR-3-12TB7": { family: "long", lMm: 51.6, l1Mm: 19.1 },
  "6LV-16-VCR-3-16TB7": { family: "long", lMm: 58.9, l1Mm: 19.1 },
}

const TK_LENGTHS = {
  SG6: { family: "short", lMm: 15.2, l1Mm: 6.4 },
  SG10: { family: "short", lMm: 18.3, l1Mm: 9.6 },
  SG19: { family: "short", lMm: 27.9, l1Mm: 19.1 },
  LG6: { family: "long", lMm: 30.5, l1Mm: 6.4 },
  LG10: { family: "long", lMm: 33.5, l1Mm: 9.6 },
  LG19: { family: "long", lMm: 43.2, l1Mm: 19.1 },
}

const UNILOK_LENGTHS = {
  CSGS: { family: "short", lMm: 18.3, l1Mm: 9.6 },
  CSGL: { family: "long", lMm: 33.5, l1Mm: 9.6 },
}

function stripOptions(model) {
  let current = model || ""
  let changed = true
  while (changed) {
    changed = false
    for (const suffix of OPTION_SUFFIXES) {
      if (current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length)
        changed = true
      }
    }
  }
  return current
}

function vigourDimensions(model) {
  const base = stripOptions(model)
  return VIGOUR_GLAND_DIMENSIONS[base] ? { ...VIGOUR_GLAND_DIMENSIONS[base], model: base } : null
}

function fujikinSourceDimensions(item) {
  const variant = `${item.variantLabel || ""} ${item.variantCode || ""}`
  const labelLength = /nearest|VIGOUR/i.test(variant) ? null : variant.match(/L(\d+(?:\.\d+)?)/i)
  const modelLength = item.sourceModel.match(/-L(\d+(?:\.\d+)?)/i)
  const length = labelLength ? Number(labelLength[1]) : modelLength ? Number(modelLength[1]) : null
  if (!length) return null
  const familyText = `${item.productName || ""} ${item.productLabel || ""}`
  return {
    family: /high flow/i.test(familyText) || /^UJR-\d+(?:\.\d+)?X\d+(?:\.\d+)?MS-/i.test(item.sourceModel)
      ? "high-flow"
      : /female|short tube butt/i.test(familyText)
        ? "short"
        : "long",
    lMm: length,
    source: "FUJIKIN catalog dimension label",
  }
}

function swagelokSourceDimensions(item) {
  const key = item.sourceModel.replace(/P$/, "")
  const dims = SWAGELOK_LENGTHS[key]
  return dims ? { ...dims, source: "Swagelok VCR gland dimension table" } : null
}

function tkSourceDimensions(item) {
  const match = item.sourceModel.match(/^[SD](?:\d+x?)?(\d+)?(SG|LG)(6|10|19)(?:-P)?$/i)
  if (!match) return null
  const key = `${match[2].toUpperCase()}${match[3]}`
  const dims = TK_LENGTHS[key]
  return dims ? { ...dims, source: "TK-Fujikin gland length code table" } : null
}

function unilokSourceDimensions(item) {
  const match = item.sourceModel.match(/^(CSGS|CSGL)-/i)
  if (!match) return null
  const dims = UNILOK_LENGTHS[match[1].toUpperCase()]
  return dims ? { ...dims, source: "UNILOK gland length family table" } : null
}

function sourceDimensions(item) {
  if (item.brand === "FUJIKIN") return fujikinSourceDimensions(item)
  if (item.brand === "Swagelok") return swagelokSourceDimensions(item)
  // TK-Fujikin and UNILOK have exact catalog dimensions, but those tables are
  // not structured here yet. Do not infer total length from G/L code alone.
  return null
}

function isGland(item) {
  const text = `${item.productName || ""} ${item.productLabel || ""} ${item.vigourModel || ""}`
  return /gland/i.test(text) && /(?:VVR|HVVR)-(?:FG|MG|HG|BMG)/.test(item.vigourModel || "")
}

function compare(item) {
  const source = sourceDimensions(item)
  const target = vigourDimensions(item.vigourModel)
  if (!source || !target) return null
  const delta = Number((target.lMm - source.lMm).toFixed(2))
  return {
    brand: item.brand,
    sourceModel: item.sourceModel,
    vigourModel: item.vigourModel,
    sourceFamily: source.family,
    targetFamily: target.family,
    sourceLengthMm: source.lMm,
    targetLengthMm: target.lMm,
    deltaMm: delta,
    sourceL1Mm: source.l1Mm || null,
    targetL1Mm: target.l1Mm || null,
    targetBaseModel: target.model,
    status: source.family !== target.family && !target.family.startsWith(source.family)
      ? "family_mismatch"
      : Math.abs(delta) <= 0.3
        ? "length_match"
        : "length_difference",
    sourceBasis: source.source,
  }
}

function assertCase(results, sourceModel, expectedTarget, expectedStatus) {
  const matches = results.filter((item) => item.sourceModel === sourceModel)
  if (!matches.length) throw new Error(`${sourceModel}: no comparable dimension result`)
  if (!matches.some((item) => item.vigourModel === expectedTarget && item.status === expectedStatus)) {
    throw new Error(`${sourceModel}: expected ${expectedTarget} / ${expectedStatus}, got ${JSON.stringify(matches)}`)
  }
}

const glandRows = fittingMappings.filter(isGland)
const comparable = glandRows.map(compare).filter(Boolean)
const differences = comparable.filter((item) => item.status !== "length_match")
const familyMismatches = comparable.filter((item) => item.status === "family_mismatch")

assertCase(comparable, "UJR-6.35MS-L28-AW", "VVR-FG4-TB4", "length_match")
assertCase(comparable, "UJR-9.52MS-L28.5-AW", "VVR-FG8-TB6", "length_match")
assertCase(comparable, "6LV-4-VCR-3S-4TB2", "VVR-FG4-TB4-L15-SLV", "length_match")
assertCase(comparable, "6LV-4-VCR-3-4TB2", "VVR-MG4-TB4-L30-SLV", "length_match")

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
const summary = {
  generatedAt: new Date().toISOString(),
  scope: "Tube butt weld gland dimensions, first-pass comparable audit",
  totalGlandMappings: glandRows.length,
  comparableRows: comparable.length,
  lengthMatches: comparable.filter((item) => item.status === "length_match").length,
  lengthDifferences: differences.length,
  familyMismatches: familyMismatches.length,
  unsupportedRows: glandRows.length - comparable.length,
}

const report = { summary, differences, samples: comparable.slice(0, 80) }
fs.writeFileSync(path.join(OUTPUT_DIR, "gland_dimension_audit.json"), `${JSON.stringify(report, null, 2)}\n`)

const lines = [
  "# Gland Dimension Audit",
  "",
  `Generated at: ${summary.generatedAt}`,
  "",
  "## Summary",
  "",
  `- Total gland mappings: ${summary.totalGlandMappings}`,
  `- Comparable rows in first pass: ${summary.comparableRows}`,
  `- Length matches within 0.3 mm: ${summary.lengthMatches}`,
  `- Length differences: ${summary.lengthDifferences}`,
  `- Family mismatches: ${summary.familyMismatches}`,
  `- Rows pending source dimension extraction: ${summary.unsupportedRows}`,
  "",
  "## Differences",
  "",
]
if (!differences.length) {
  lines.push("- None in comparable first-pass rows.")
} else {
  for (const item of differences.slice(0, 80)) {
    lines.push(`- ${item.brand} ${item.sourceModel} -> ${item.vigourModel}: source ${item.sourceLengthMm} mm, target ${item.targetLengthMm} mm, delta ${item.deltaMm} mm, status ${item.status}`)
  }
}
lines.push("")
lines.push("## Comparable Samples")
lines.push("")
for (const item of comparable.slice(0, 60)) {
  lines.push(`- ${item.brand} ${item.sourceModel} -> ${item.vigourModel}: ${item.sourceLengthMm} mm vs ${item.targetLengthMm} mm (${item.deltaMm} mm), ${item.status}`)
}
fs.writeFileSync(path.join(OUTPUT_DIR, "gland_dimension_audit.md"), `${lines.join("\n")}\n`)

console.log(JSON.stringify(summary, null, 2))
