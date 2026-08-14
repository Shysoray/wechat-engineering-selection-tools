const fs = require("fs")
const path = require("path")

const DEFAULT_OUTPUT_DIR = path.join(__dirname, "..", "tmp", "catalog_evidence_audit")

function normalizeDash(value) {
  return String(value || "")
    .replace(/[‐‑‒–—﹘﹣－]/g, "-")
    .replace(/[×＊*]/g, "X")
}

function normalizeModel(value) {
  return normalizeDash(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9.#/+-]/g, "")
}

function searchableText(value) {
  return normalizeDash(value)
    .toUpperCase()
    .replace(/<BR\s*\/?>/g, " ")
    .replace(/[^A-Z0-9.#/+-]+/g, " ")
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function hasExactModel(catalogText, model) {
  const normalizedModel = normalizeModel(model)
  if (!normalizedModel) return false
  const text = searchableText(catalogText)
  const exactToken = new RegExp(`(^|[^A-Z0-9])${escapeRegex(normalizedModel)}($|[^A-Z0-9])`)
  return exactToken.test(text)
}

function splitModelOptions(value) {
  return String(value || "")
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function classifySourceFamily(row) {
  const brand = row.brand || ""
  const source = normalizeModel(row.sourceModel)
  const product = String(row.productName || row.productLabel || "").toLowerCase()

  if (brand === "Swagelok") {
    if (source.includes("VCR") || product.includes("vcr") || product.includes("face seal")) {
      return "swagelok_vcr"
    }
    if (
      source.startsWith("316L-")
      || product.includes("weld")
      || product.includes("gland")
      || product.includes("gasket")
      || product.includes("micro-fit")
      || /(?:ATW|MATW|MTW|TB|BW)/.test(source)
    ) {
      return "swagelok_weld_or_vcr"
    }
    if (/^SS-\d/.test(source)) return "swagelok_tube"
    return "swagelok_other"
  }

  return `${brand || "unknown"}_unclassified`
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function auditSource(row, sourceFamily, options) {
  const sourceCatalogTextByBrand = options.sourceCatalogTextByBrand || {}
  const sourceCatalogScopeByBrand = options.sourceCatalogScopeByBrand || {}
  const sourceText = sourceCatalogTextByBrand[row.brand]
  if (!sourceText) {
    return {
      status: "source_catalog_unavailable",
      exact: false,
      model: row.sourceModel || ""
    }
  }

  const expectedFamily = sourceCatalogScopeByBrand[row.brand]
  if (expectedFamily && expectedFamily !== sourceFamily) {
    return {
      status: "source_catalog_unavailable_for_family",
      exact: false,
      model: row.sourceModel || "",
      expectedFamily,
      actualFamily: sourceFamily
    }
  }

  const exact = hasExactModel(sourceText, row.sourceModel)
  return {
    status: exact ? "source_exact" : "source_missing",
    exact,
    model: row.sourceModel || ""
  }
}

function auditTarget(row, targetCatalogText) {
  const models = unique(splitModelOptions(row.vigourModel))
  if (!models.length) {
    return {
      status: "target_unavailable",
      exact: false,
      models: [],
      missingModels: []
    }
  }

  const missingModels = models.filter((model) => !hasExactModel(targetCatalogText, model))
  return {
    status: missingModels.length ? "target_missing" : "target_exact",
    exact: missingModels.length === 0,
    models,
    missingModels
  }
}

function overallStatus(sourceEvidence, targetEvidence) {
  if (sourceEvidence.status === "source_catalog_unavailable_for_family") return "source_family_not_in_pilot"
  if (targetEvidence.status === "target_unavailable") return "no_vigour_target"
  if (sourceEvidence.status === "source_exact" && targetEvidence.status === "target_exact") return "catalog_supported"
  if (sourceEvidence.status === "source_missing" && targetEvidence.status === "target_exact") return "target_supported_source_missing"
  if (sourceEvidence.status === "source_exact" && targetEvidence.status === "target_missing") return "source_supported_target_missing"
  if (sourceEvidence.status === "source_catalog_unavailable" && targetEvidence.status === "target_exact") return "target_supported_source_catalog_unavailable"
  if (sourceEvidence.status === "source_catalog_unavailable" && targetEvidence.status === "target_missing") return "catalog_unavailable_target_missing"
  return "catalog_missing"
}

function auditRows(rows, options) {
  const targetCatalogText = options.targetCatalogText || ""
  const auditedRows = rows.map((row) => {
    const sourceFamily = classifySourceFamily(row)
    const sourceEvidence = auditSource(row, sourceFamily, options)
    const targetEvidence = auditTarget(row, targetCatalogText)
    const status = overallStatus(sourceEvidence, targetEvidence)
    return {
      brand: row.brand,
      sourceFamily,
      sourceModel: row.sourceModel || "",
      vigourModel: row.vigourModel || "",
      productName: row.productName || row.productLabel || "",
      noMatch: Boolean(row.noMatch),
      catalogSupplemental: Boolean(row.catalogSupplemental),
      sourceEvidence,
      targetEvidence,
      overallStatus: status,
      needsReview: status !== "catalog_supported"
    }
  })

  const summary = auditedRows.reduce((acc, row) => {
    acc.total += 1
    acc[row.overallStatus] = (acc[row.overallStatus] || 0) + 1
    if (row.sourceEvidence.exact) acc.sourceExact += 1
    if (row.targetEvidence.exact) acc.targetExact += 1
    if (row.needsReview) acc.needsReview += 1
    return acc
  }, {
    total: 0,
    sourceExact: 0,
    targetExact: 0,
    needsReview: 0
  })

  return {
    generatedAt: new Date().toISOString(),
    summary,
    rows: auditedRows
  }
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
}

function loadRuntimeMappings() {
  const { fittingMappings } = require("../packageFitting/fittingDatabase")
  const { fujikinVlokSupplementalMappings } = require("../packageFitting/fujikinVlokSupplementalMappings")
  const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")
  return fittingMappings.concat(fujikinVlokSupplementalMappings, tubeFittingSupplementalMappings)
}

function defaultSwagelokVigourOptions() {
  const root = path.join(__dirname, "..")
  const swagelokOdl = path.join(root, "tmp", "opendataloader_trial", "output", "swagelok_tube.txt")
  const swagelokOld = path.join(root, "tmp", "tube_fitting_audit", "pdf_text", "swagelok.txt")
  const vigourOdl = path.join(root, "tmp", "opendataloader_trial", "output", "vigour_vhps.txt")
  const vigourOld = path.join(root, "tmp", "tube_fitting_audit", "pdf_text", "vigour.txt")

  return {
    sourceCatalogTextByBrand: {
      Swagelok: readIfExists(swagelokOdl) || readIfExists(swagelokOld)
    },
    sourceCatalogScopeByBrand: {
      Swagelok: "swagelok_tube"
    },
    targetCatalogText: readIfExists(vigourOdl) || readIfExists(vigourOld),
    catalogFiles: {
      Swagelok: fs.existsSync(swagelokOdl) ? swagelokOdl : swagelokOld,
      VIGOUR: fs.existsSync(vigourOdl) ? vigourOdl : vigourOld
    }
  }
}

function writeReport(report, outputDir = DEFAULT_OUTPUT_DIR) {
  fs.mkdirSync(outputDir, { recursive: true })
  const jsonPath = path.join(outputDir, "swagelok_vigour_evidence_audit.json")
  const mdPath = path.join(outputDir, "swagelok_vigour_evidence_audit.md")
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))
  fs.writeFileSync(mdPath, renderMarkdown(report))
  const tsvPaths = writeTsvReports(report, outputDir)
  return { jsonPath, mdPath, tsvPaths }
}

function tsvCell(value) {
  return String(value == null ? "" : value).replace(/\t/g, " ").replace(/\r?\n/g, " ")
}

function rowsToTsv(rows) {
  const fields = [
    "brand",
    "sourceFamily",
    "sourceModel",
    "vigourModel",
    "productName",
    "overallStatus",
    "sourceStatus",
    "targetStatus",
    "missingTargetModels",
    "needsReview"
  ]
  const header = fields.join("\t")
  const lines = rows.map((row) => {
    const values = {
      brand: row.brand,
      sourceFamily: row.sourceFamily,
      sourceModel: row.sourceModel,
      vigourModel: row.vigourModel,
      productName: row.productName,
      overallStatus: row.overallStatus,
      sourceStatus: row.sourceEvidence && row.sourceEvidence.status,
      targetStatus: row.targetEvidence && row.targetEvidence.status,
      missingTargetModels: row.targetEvidence ? row.targetEvidence.missingModels.join(" / ") : "",
      needsReview: row.needsReview ? "yes" : "no"
    }
    return fields.map((field) => tsvCell(values[field])).join("\t")
  })
  return `${[header, ...lines].join("\n")}\n`
}

function writeTsvReports(report, outputDir) {
  const groups = {
    catalog_supported: "swagelok_vigour_catalog_supported.tsv",
    target_supported_source_missing: "swagelok_vigour_target_supported_source_missing.tsv",
    no_vigour_target: "swagelok_vigour_no_vigour_target.tsv",
    source_family_not_in_pilot: "swagelok_vigour_source_family_not_in_pilot.tsv"
  }
  return Object.fromEntries(Object.entries(groups).map(([status, filename]) => {
    const filePath = path.join(outputDir, filename)
    fs.writeFileSync(filePath, rowsToTsv(report.rows.filter((row) => row.overallStatus === status)))
    return [status, filePath]
  }))
}

function sampleRows(rows, status, count = 20) {
  return rows
    .filter((row) => row.overallStatus === status)
    .slice(0, count)
    .map((row) => `| ${row.sourceModel} | ${row.vigourModel || "-"} | ${row.productName || "-"} |`)
}

function renderMarkdown(report) {
  const lines = []
  lines.push("# Swagelok + VIGOUR Catalog Evidence Audit")
  lines.push("")
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push("")
  lines.push("## Summary")
  lines.push(`- Total rows: ${report.summary.total}`)
  lines.push(`- Source exact: ${report.summary.sourceExact}`)
  lines.push(`- Target exact: ${report.summary.targetExact}`)
  lines.push(`- Needs review: ${report.summary.needsReview}`)
  lines.push(`- Catalog supported: ${report.summary.catalog_supported || 0}`)
  lines.push(`- Target supported but source missing: ${report.summary.target_supported_source_missing || 0}`)
  lines.push(`- No VIGOUR target: ${report.summary.no_vigour_target || 0}`)
  lines.push("")
  lines.push("## Status Counts")
  Object.keys(report.summary)
    .filter((key) => !["total", "sourceExact", "targetExact", "needsReview"].includes(key))
    .sort()
    .forEach((key) => lines.push(`- ${key}: ${report.summary[key]}`))
  lines.push("")
  lines.push("## Review Samples: target_supported_source_missing")
  lines.push("| Source | VIGOUR | Product |")
  lines.push("| --- | --- | --- |")
  lines.push(...sampleRows(report.rows, "target_supported_source_missing"))
  lines.push("")
  lines.push("## Review Samples: catalog_supported")
  lines.push("| Source | VIGOUR | Product |")
  lines.push("| --- | --- | --- |")
  lines.push(...sampleRows(report.rows, "catalog_supported"))
  lines.push("")
  return `${lines.join("\n")}\n`
}

function runSwagelokVigourAudit() {
  const mappings = loadRuntimeMappings()
  const swagelokRows = mappings.filter((row) => row.brand === "Swagelok")
  const options = defaultSwagelokVigourOptions()
  const report = auditRows(swagelokRows, options)
  report.catalogFiles = options.catalogFiles
  return writeReport(report)
}

if (require.main === module) {
  const output = runSwagelokVigourAudit()
  console.log(JSON.stringify(output, null, 2))
}

module.exports = {
  auditRows,
  hasExactModel,
  normalizeModel,
  classifySourceFamily,
  rowsToTsv,
  splitModelOptions,
  runSwagelokVigourAudit
}
