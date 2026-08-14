#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { allFittingMappings } = require("../packageFitting/mappingRepository")
const { normalizeModelText } = require("../utils/fittingModelSignature")
const { dimensionEvidenceStatuses } = require("../packageFitting/fittingEvidencePolicy")
const {
  sourceEvidenceAlias,
  targetEvidenceAlias,
  mappingEvidenceKey
} = require("../packageFitting/fittingEvidenceKeys")

const root = path.resolve(__dirname, "..")
const evidenceDir = path.join(root, "data/fitting-evidence")
const outputDir = path.join(root, "outputs/fitting_dimension_audit")

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(evidenceDir, filename), "utf8"))
}

function fileDigest(filename) {
  return crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex")
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function writeCsv(filename, fields, rows) {
  const content = [
    fields.join(","),
    ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))
  ].join("\n") + "\n"
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, filename), `\ufeff${content}`, "utf8")
}

function stableEvidenceId(item) {
  const identity = [item.brand, normalizeModelText(item.sourceModel), item.vigourModel || ""].join("|")
  return `map:${crypto.createHash("sha256").update(identity).digest("hex").slice(0, 16)}`
}

function occurrenceId(record) {
  const occurrence = record && record.occurrences && record.occurrences[0]
  if (!occurrence) return ""
  const pages = occurrence.pdfPages || [occurrence.pdfPage]
  return `${occurrence.sourceId}:p${pages.filter(Boolean).join("-")}`
}

function occurrencePages(record) {
  const occurrence = record && record.occurrences && record.occurrences[0]
  if (!occurrence) return []
  const pages = occurrence.pdfPages || [occurrence.pdfPage]
  return pages.filter(Boolean).map((page) => `${path.basename(occurrence.pdfPath)}#page=${page}`)
}

function canonicalTarget(model) {
  return targetEvidenceAlias(model)
}

function modelIndex(records) {
  const index = new Map()
  records.forEach((record) => {
    const canonical = record.brand === "VIGOUR"
      ? targetEvidenceAlias(record.canonicalModel)
      : normalizeModelText(record.canonicalModel)
    const key = `${record.brand}|${canonical}`
    const existing = index.get(key)
    if (existing && record.brand === "VIGOUR") {
      index.set(key, {
        ...existing,
        dimensions: {
          ...(existing.dimensions || {}),
          ...(record.dimensions || {})
        },
        occurrences: Array.from(new Set([
          ...(existing.occurrences || []),
          ...(record.occurrences || [])
        ].map((occurrence) => JSON.stringify(occurrence)))).map((occurrence) => JSON.parse(occurrence))
      })
      return
    }
    if (!existing || (record.dimensions && Object.keys(record.dimensions).length && !Object.keys(existing.dimensions || {}).length)) {
      index.set(key, record)
    }
  })
  return index
}

function comparisonRecord(comparison) {
  const sourceValue = Number(comparison.sourceValue)
  const targetValue = Number(comparison.targetValue)
  const absoluteDifference = Number(comparison.absoluteDifference)
  const hasTolerance = comparison.tolerance !== null
    && comparison.tolerance !== undefined
    && comparison.tolerance !== ""
    && Number.isFinite(Number(comparison.tolerance))
  return {
    dimension: comparison.dimension,
    label: comparison.label || comparison.dimension,
    sourceValue,
    targetValue,
    unit: comparison.unit,
    absoluteDifference,
    relativeDifferencePercent: sourceValue === 0
      ? null
      : Number((absoluteDifference / Math.abs(sourceValue) * 100).toFixed(4)),
    tolerance: hasTolerance ? Number(comparison.tolerance) : null,
    matched: hasTolerance && typeof comparison.matched === "boolean" ? comparison.matched : null,
    required: comparison.required !== false,
    sourceEvidenceId: comparison.sourceEvidenceId || "",
    targetEvidenceId: comparison.targetEvidenceId || ""
  }
}

const IGNORED_DIMENSION_KEYS = new Set(["catalogP"])

function dimensionsFor(record) {
  if (!record || !record.dimensions) return []
  return Object.entries(record.dimensions).filter(([key, value]) => (
    !IGNORED_DIMENSION_KEYS.has(key)
    && Number.isFinite(Number(value.normalizedMm))
    && Number(value.normalizedMm) > 0
    && Number(value.normalizedMm) <= 500
  ))
}

function sourceRecordFor(item, sourceIndex) {
  return sourceIndex.get(`${item.brand}|${sourceEvidenceAlias(item.brand, item.sourceModel)}`)
}

function targetRecordsFor(item, targetIndex) {
  return String(item.vigourModel || "")
    .split(/\s*\/\s*/)
    .map((model) => targetIndex.get(`VIGOUR|${targetEvidenceAlias(model)}`))
    .filter(Boolean)
}

function targetRecordFor(item, targetIndex) {
  const records = targetRecordsFor(item, targetIndex)
  return records.sort((left, right) => dimensionsFor(right).length - dimensionsFor(left).length)[0]
}

function targetFamilyCode(value) {
  const text = String(value || "").split(/\s*\/\s*/)[0].toUpperCase()
  if (/^HVVR-?MG/.test(text)) return "HMG"
  if (/^VVR-?MG.*-TW/.test(text)) return "MGW"
  const match = text.match(/^(?:HVVR|VVR|VMW|VTW|SS-V)-?([A-Z]+)/)
  return match ? match[1] : "UNKNOWN"
}

function comparisonGroup(item, sourceRecord, targetRecord) {
  return [
    item.brand,
    item.productCode || item.productLabel || "unclassified",
    targetFamilyCode(item.vigourModel),
    sourceRecord ? sourceRecord.family : "source-unclassified",
    targetRecord ? targetRecord.family : "target-unclassified"
  ].join("|")
}

function explicitDimensionPairs(group) {
  const [brand, product, targetCode, sourceFamily, targetFamily] = group.split("|")
  const pairs = []
  if (brand === "FUJIKIN" && product === "UJL" && ["UE", "RE"].includes(targetCode)) {
    pairs.push(["catalogL", "catalogH"], ["catalogL1", "catalogM"], ["catalogA", "catalogF"])
  }
  if (brand === "FUJIKIN" && ["UJX", "UJT"].includes(product) && ["UT", "RT", "CU", "TB"].includes(targetCode)) {
    pairs.push(
      ["catalogL", "catalogL"],
      ["catalogL1", "catalogH"],
      ["catalogL2", "catalogM"],
      ["catalogA", "catalogF"]
    )
  }
  if (brand === "JSK" && ["E", "T", "CT", "TB"].includes(product)) {
    pairs.push(
      ["catalogL", "catalogL"],
      ["catalogA", "catalogH"],
      ["catalogB", "catalogM"],
      ["catalogF", "catalogF"]
    )
  }
  if (brand === "TK-Fujikin" && product === "LG" && targetCode === "MG") {
    pairs.push(
      ["catalogD", "tubeOutsideDiameter"],
      ["catalogT", "wallThickness"],
      ["catalogB", "insertionLength"],
      ["catalogL", "overallLength"]
    )
  }
  if (brand === "TK-Fujikin" && product === "SG" && targetCode === "FG") {
    pairs.push(
      ["catalogD", "tubeOutsideDiameter"],
      ["catalogT", "wallThickness"],
      ["catalogB", "insertionLength"],
      ["catalogL", "overallLength"]
    )
  }
  if (brand === "FITOK" && product === "G" && targetCode === "FG") {
    pairs.push(["catalogL", "overallLength"], ["catalogB", "insertionLength"])
  }
  if (brand === "FITOK" && product === "N" && targetCode === "FN") {
    pairs.push(["catalogL", "catalogL"], ["catalogE", "catalogD"], ["catalogG", "catalogF"])
  }
  if (brand === "FITOK" && product === "R" && targetCode === "MU") {
    pairs.push(["catalogEX", "catalogEX"])
  }
  if (brand === "FITOK" && product.includes("Female Connector") && targetCode === "FC") {
    pairs.push(
      ["catalogL", "catalogL"], ["catalogB", "catalogB"],
      ["catalogC", "catalogI"], ["catalogE", "catalogD1"],
      ["catalogF", "catalogW"]
    )
  }
  if (brand === "FITOK" && product.includes("Male Elbow") && targetCode === "ME") {
    pairs.push(
      ["catalogL", "catalogE"], ["catalogC", "catalogI"],
      ["catalogE", "catalogD"], ["catalogF", "catalogW"]
    )
  }
  if (brand === "FUJIKIN" && product === "H" && targetCode === "MC") {
    pairs.push(
      ["tubeOutsideDiameter", "catalogA"], ["catalogD", "catalogD"],
      ["catalogB", "catalogF"], ["catalogL", "catalogL"]
    )
  }
  if (brand === "FUJIKIN" && product === "L" && targetCode === "MUE") {
    pairs.push(["catalogD", "catalogD"], ["catalogL", "catalogL"])
  }
  if (brand === "FUJIKIN" && product === "MS" && targetCode === "MG") {
    pairs.push(["tubeOutsideDiameter", "tubeOutsideDiameter"])
  }
  if (brand === "FUJIKIN" && product === "N-HF" && targetCode === "FN") {
    pairs.push(["catalogD", "catalogD"], ["catalogB", "catalogF"])
  }
  if (brand === "FUJIKIN" && product === "S" && targetCode === "MG") {
    pairs.push(["tubeOutsideDiameter", "tubeOutsideDiameter"])
  }
  if (brand === "JSK" && product === "R" && targetCode === "RU") {
    pairs.push(["catalogL", "catalogL"])
  }
  if (brand === "SUPERLOK" && ["SLG", "RSLG"].includes(product) && targetCode === "MG") {
    pairs.push(["catalogL", "overallLength"])
  }
  if (brand === "SUPERLOK" && product === "MWG" && targetCode === "MG") {
    pairs.push(
      ["catalogD", "tubeOutsideDiameter"],
      ["catalogB", "insertionLength"],
      ["catalogL", "overallLength"]
    )
  }
  if (brand === "SUPERLOK" && product === "T" && targetCode === "RT") {
    pairs.push(["catalogL", "catalogL"], ["catalogF", "catalogF"], ["catalogA", "catalogH"])
  }
  if (brand === "SUPERLOK" && product === "UT" && targetCode === "MUT") {
    pairs.push(
      ["catalogL", "catalogL"], ["catalogE", "catalogD"],
      ["catalogF", "catalogF"], ["catalogA", "catalogH"]
    )
  }
  if (brand === "SUPERLOK" && product.includes("Reducer") && targetCode === "TO") {
    pairs.push(["catalogD1", "tubeOutsideDiameter"])
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "MG") {
    pairs.push(["catalogA", "overallLength"])
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "MGW") {
    pairs.push(["catalogA", "catalogL"], ["catalogC", "catalogL1"], ["catalogE", "catalogD"])
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "HMG") {
    pairs.push(
      ["catalogA", "catalogL"], ["catalogB", "catalogL1"],
      ["catalogC", "catalogT"], ["catalogE", "catalogD"],
      ["catalogE1", "catalogD1"], ["catalogF", "catalogF"]
    )
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "GK") {
    pairs.push(["catalogE", "catalogD1"], ["catalogT", "catalogD"])
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "AHG") {
    pairs.push(
      ["catalogA", "catalogL"], ["catalogB", "catalogL1"],
      ["catalogC", "catalogT"], ["catalogD", "catalogT1"],
      ["catalogE", "catalogD"], ["catalogE1", "catalogD1"],
      ["catalogF", "catalogF"]
    )
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "BMG") {
    pairs.push(
      ["catalogA", "catalogL"], ["catalogC", "catalogL1"],
      ["catalogB", "catalogT"], ["catalogE", "catalogD"],
      ["catalogE1", "catalogD1"], ["catalogF", "catalogF"],
      ["catalogF1", "catalogF1"]
    )
  }
  if (brand === "Swagelok" && product === "unclassified" && targetCode === "RMU") {
    pairs.push(["catalogA", "catalogL"], ["catalogE", "catalogD"], ["catalogE1", "catalogD1"])
  }
  if (brand === "TK-Fujikin" && product === "SWLG" && targetCode === "MG") {
    pairs.push(["catalogL", "overallLength"])
  }
  if (brand === "TK-Fujikin" && product === "ALG" && targetCode === "MG") {
    pairs.push(
      ["catalogB", "insertionLength"], ["catalogD", "wallThickness"],
      ["catalogL", "overallLength"]
    )
  }
  if (brand === "TK-Fujikin" && product === "ASG" && targetCode === "FG") {
    pairs.push(
      ["catalogB", "insertionLength"], ["catalogD", "wallThickness"],
      ["catalogL", "overallLength"]
    )
  }
  if (brand === "TK-Fujikin" && ["MN", "FN"].includes(product) && targetCode === product) {
    pairs.push(["catalogL", "catalogL"])
  }
  if (brand === "TK-Fujikin" && product === "R" && targetCode === "RU") {
    pairs.push(["catalogL", "catalogL"])
  }
  if (brand === "UNILOK" && product === "CLRE" && targetCode === "RLE") {
    pairs.push(["catalogL", "catalogL"], ["catalogF", "catalogF"])
  }
  if (brand === "UNILOK" && product === "CLRT" && targetCode === "RLT") {
    pairs.push(["catalogL", "catalogH"], ["catalogF", "catalogF"])
  }
  if (brand === "UNILOK" && product === "CLT" && targetCode === "LT") {
    pairs.push(["catalogL", "catalogH"], ["catalogF", "catalogF"])
  }
  if (brand === "UNILOK" && product === "CMRU" && targetCode === "RU") {
    pairs.push(["catalogL", "catalogL"])
  }
  if (brand === "UNILOK" && product === "CMT" && targetCode === "UT") {
    pairs.push(["catalogA", "catalogL"], ["catalogL", "catalogH"], ["catalogF", "catalogF"])
  }
  if (brand === "UNILOK" && product === "CDFRU" && targetCode === "FU") {
    pairs.push(["catalogA", "catalogL"], ["catalogF", "catalogF"])
  }
  if (brand === "UNILOK" && product === "CDMRU" && targetCode === "RMU") {
    pairs.push(["catalogA", "catalogL"], ["catalogE", "catalogD"])
  }
  if (brand === "UNILOK" && product === "CRA" && targetCode === "RA") {
    pairs.push(["catalogA", "catalogL"], ["catalogB", "catalogT"], ["catalogE", "catalogD"])
  }
  if (brand === "Swagelok" && sourceFamily === "tube_fitting" && targetFamily === "VHPS") {
    pairs.push(
      ["tubeOutsideDiameter", "tubeOutsideDiameter"],
      ["catalogA", "catalogL"],
      ["catalogD", "catalogI"],
      ["catalogE", "catalogD"],
      ["catalogF", "catalogW"]
    )
  }
  if (brand === "UNILOK" && sourceFamily === "tube_fitting" && targetFamily === "VHPS") {
    pairs.push(
      ["tubeOutsideDiameter", "tubeOutsideDiameter"],
      ["catalogE", "catalogD"],
      ["catalogH", "catalogW"],
      ["catalogF", "catalogI"],
      ["catalogI", "catalogN"],
      ["catalogL", "catalogL"]
    )
  }
  return new Set(pairs.map(([sourceKey, targetKey]) => `${sourceKey}>${targetKey}`))
}

function learnDimensionCrosswalks(items, sourceIndex, targetIndex) {
  const observations = new Map()
  items.forEach((item) => {
    if (!item.vigourModel || item.noMatch) return
    const sourceRecord = sourceRecordFor(item, sourceIndex)
    const targetRecord = targetRecordFor(item, targetIndex)
    const sourceDimensions = dimensionsFor(sourceRecord)
    const targetDimensions = dimensionsFor(targetRecord)
    if (!sourceDimensions.length || !targetDimensions.length) return
    const group = comparisonGroup(item, sourceRecord, targetRecord)
    const groupStats = observations.get(group) || new Map()
    sourceDimensions.forEach(([sourceKey, sourceDimension]) => {
      targetDimensions.forEach(([targetKey, targetDimension]) => {
        const sourceValue = Number(sourceDimension.normalizedMm)
        const targetValue = Number(targetDimension.normalizedMm)
        const difference = Math.abs(sourceValue - targetValue)
        const scale = Math.max(sourceValue, targetValue, 1)
        const key = `${sourceKey}>${targetKey}`
        const stat = groupStats.get(key) || {
          sourceKey,
          targetKey,
          count: 0,
          close: 0,
          relativeDifferenceTotal: 0
        }
        const explicitPair = explicitDimensionPairs(group).has(key)
        stat.count += 1
        stat.relativeDifferenceTotal += difference / scale
        if (difference <= Math.max(explicitPair ? 0.2 : 2, scale * (explicitPair ? 0.05 : 0.12))) {
          stat.close += 1
        }
        groupStats.set(key, stat)
      })
    })
    observations.set(group, groupStats)
  })

  const crosswalks = new Map()
  observations.forEach((stats, group) => {
    const explicitPairs = explicitDimensionPairs(group)
    const candidates = Array.from(stats.values()).map((stat) => ({
      ...stat,
      explicit: explicitPairs.has(`${stat.sourceKey}>${stat.targetKey}`),
      sameLabel: stat.sourceKey === stat.targetKey,
      closeRatio: stat.close / stat.count,
      meanRelativeDifference: stat.relativeDifferenceTotal / stat.count
    })).filter((stat) => (
      explicitPairs.size
        ? stat.explicit
        : (
          stat.sameLabel
          || (stat.count >= 2 && stat.closeRatio >= 0.6 && stat.meanRelativeDifference <= 0.2)
        )
    )).sort((left, right) => (
      Number(right.explicit) - Number(left.explicit)
      || Number(right.sameLabel) - Number(left.sameLabel)
      || right.closeRatio - left.closeRatio
      || right.count - left.count
      || left.meanRelativeDifference - right.meanRelativeDifference
      || left.sourceKey.localeCompare(right.sourceKey)
      || left.targetKey.localeCompare(right.targetKey)
    ))
    const usedSource = new Set()
    const usedTarget = new Set()
    const selected = []
    candidates.forEach((candidate) => {
      if (usedSource.has(candidate.sourceKey) || usedTarget.has(candidate.targetKey)) return
      usedSource.add(candidate.sourceKey)
      usedTarget.add(candidate.targetKey)
      selected.push(candidate)
    })
    if (selected.length) crosswalks.set(group, selected)
  })
  return crosswalks
}

function catalogDimensionLabel(sourceKey, sourceDimension, targetKey, targetDimension, brand) {
  const sourceLabel = sourceDimension.catalogLabel || sourceKey.replace(/^catalog/, "")
  const targetLabel = targetDimension.catalogLabel || targetKey.replace(/^catalog/, "")
  if (sourceKey === targetKey) return `目录尺寸 ${sourceLabel}`
  return `${brand} 尺寸 ${sourceLabel} ↔ VIGOUR ${targetLabel}`
}

function catalogComparisons(item, sourceRecord, targetRecord, crosswalks) {
  const sourceDimensions = Object.fromEntries(dimensionsFor(sourceRecord))
  const targetDimensions = Object.fromEntries(dimensionsFor(targetRecord))
  const pairs = crosswalks.get(comparisonGroup(item, sourceRecord, targetRecord)) || []
  return pairs.map(({ sourceKey, targetKey }) => {
    const sourceDimension = sourceDimensions[sourceKey]
    const targetDimension = targetDimensions[targetKey]
    if (!sourceDimension || !targetDimension) return null
    const sourceValue = Number(sourceDimension.normalizedMm)
    const targetValue = Number(targetDimension.normalizedMm)
    const absoluteDifference = Number(Math.abs(sourceValue - targetValue).toFixed(6))
    return {
      dimension: `${sourceKey}:${targetKey}`,
      label: catalogDimensionLabel(sourceKey, sourceDimension, targetKey, targetDimension, item.brand),
      sourceValue,
      targetValue,
      unit: "mm",
      absoluteDifference,
      relativeDifferencePercent: sourceValue === 0
        ? null
        : Number((absoluteDifference / Math.abs(sourceValue) * 100).toFixed(4)),
      tolerance: null,
      matched: null,
      required: false,
      sourceEvidenceId: occurrenceId(sourceRecord),
      targetEvidenceId: occurrenceId(targetRecord)
    }
  }).filter(Boolean)
}

function runtimeEvidenceModule(evidenceByKey) {
  const strings = []
  const stringIds = new Map()
  const stringId = (value) => {
    const text = String(value || "")
    if (!stringIds.has(text)) {
      stringIds.set(text, strings.length)
      strings.push(text)
    }
    return stringIds.get(text)
  }
  const compact = Object.create(null)
  Object.entries(evidenceByKey).sort(([left], [right]) => left.localeCompare(right)).forEach(([key, evidence]) => {
    compact[key] = [
      stringId(evidence.dimensionEvidenceStatus),
      stringId(evidence.dimensionEvidenceReason),
      stringId(evidence.familyRule),
      stringId(evidence.sourceEvidenceId),
      stringId(evidence.targetEvidenceId),
      (evidence.evidencePages || []).map(stringId),
      (evidence.dimensionComparisons || []).map((comparison) => [
        stringId(comparison.dimension),
        stringId(comparison.label),
        comparison.sourceValue,
        comparison.targetValue,
        stringId(comparison.unit),
        comparison.absoluteDifference,
        comparison.relativeDifferencePercent,
        comparison.tolerance,
        comparison.matched === true ? 1 : comparison.matched === false ? 0 : 2,
        comparison.required === false ? 0 : 1,
        stringId(comparison.sourceEvidenceId),
        stringId(comparison.targetEvidenceId)
      ])
    ]
  })
  return [
    "// Generated by tools/build_fitting_dimension_comparisons.js.",
    `const S=${JSON.stringify(strings)}`,
    `const R=${JSON.stringify(compact)}`,
    "function getDimensionEvidence(key){const r=R[key];if(!r)return null;return{dimensionEvidenceStatus:S[r[0]],dimensionEvidenceReason:S[r[1]],familyRule:S[r[2]],sourceEvidenceId:S[r[3]],targetEvidenceId:S[r[4]],evidencePages:r[5].map(i=>S[i]),dimensionComparisons:r[6].map(c=>({dimension:S[c[0]],label:S[c[1]],sourceValue:c[2],targetValue:c[3],unit:S[c[4]],absoluteDifference:c[5],relativeDifferencePercent:c[6],tolerance:c[7],matched:c[8]===1?true:c[8]===0?false:null,required:Boolean(c[9]),sourceEvidenceId:S[c[10]],targetEvidenceId:S[c[11]]}))}}",
    "module.exports={getDimensionEvidence}",
    ""
  ].join("\n")
}

function catalogEvidenceStatus(item, sourceRecord) {
  if (sourceRecord) return "catalog_exact"
  if (["catalog_exact", "catalog_rule"].includes(item.sourceEvidenceStatus)) {
    return item.sourceEvidenceStatus
  }
  if (item.sourceAuditStatus || item.dataSource) return "catalog_rule_generated"
  return "runtime_without_catalog_evidence"
}

function main() {
  const sourceCatalog = readJson("source-catalog-models.json")
  const targetCatalog = readJson("vigour-catalog-models.json")
  const sourceRegistry = readJson("catalog-sources.json")
  const sourceIndex = modelIndex(sourceCatalog.records)
  const targetIndex = modelIndex(targetCatalog.records)
  const crosswalks = learnDimensionCrosswalks(allFittingMappings, sourceIndex, targetIndex)
  const sourceDocumentsByBrand = new Map()
  const targetDocuments = []
  sourceRegistry.documents.forEach((document) => {
    if (document.role === "target") {
      targetDocuments.push(document)
      return
    }
    const documents = sourceDocumentsByBrand.get(document.businessBrand) || []
    documents.push(document)
    sourceDocumentsByBrand.set(document.businessBrand, documents)
  })
  const unresolvedPages = (documents) => documents.map((document) => (
    `${document.source}#pages=1-${document.pages}:needs_page_localization`
  ))
  const runtimeSourceKeys = new Set()
  const mappingEvidence = []
  const runtimeAudit = []
  const mappingAudit = []
  const manualReview = []
  const familyCoverage = new Map()
  const normalizedSources = new Map()
  const runtimeIdentities = new Set()
  const runtimeEvidenceByKey = Object.create(null)

  allFittingMappings.forEach((item) => {
    const normalizedSource = normalizeModelText(item.sourceModel)
    runtimeIdentities.add(`${item.brand}|${normalizedSource}|${item.vigourModel || ""}`)
    const sourceKey = `${item.brand}|${sourceEvidenceAlias(item.brand, item.sourceModel)}`
    runtimeSourceKeys.add(sourceKey)
    const sourceRecord = sourceRecordFor(item, sourceIndex)
    const targetRecord = targetRecordFor(item, targetIndex)
    const evidenceId = stableEvidenceId(item)
    const approvedComparisons = ["within_tolerance", "out_of_tolerance"].includes(item.dimensionEvidenceStatus)
      ? (item.dimensionComparisons || []).filter((comparison) => (
        comparison.tolerance !== null
        && comparison.tolerance !== undefined
        && Number.isFinite(Number(comparison.tolerance))
      )).map(comparisonRecord)
      : []
    const inferredComparisons = catalogComparisons(item, sourceRecord, targetRecord, crosswalks)
    const comparisons = approvedComparisons.length ? approvedComparisons : inferredComparisons
    const sourceHasDimensions = dimensionsFor(sourceRecord).length > 0
    const targetHasDimensions = dimensionsFor(targetRecord).length > 0
    const status = approvedComparisons.length
      ? item.dimensionEvidenceStatus
      : (!item.vigourModel || item.noMatch) ? "not_comparable"
        : comparisons.length ? "needs_manual_review"
          : !sourceHasDimensions ? "source_missing"
            : !targetHasDimensions ? "target_missing"
              : "needs_manual_review"
    const familyRule = approvedComparisons.length
      ? (item.familyRule || "face_seal_gland.v1")
      : comparisons.length ? "catalog_dimension_alignment.v1" : "non_gland_family.unconfirmed.v1"
    const reason = approvedComparisons.length
      ? (item.dimensionEvidenceReason || (
        status === "within_tolerance" ? "所有必比尺寸均在公差内" : "至少一项必比尺寸超出公差"
      ))
      : comparisons.length
        ? `已从双方目录建立 ${comparisons.length} 项同语义尺寸实值差异；该产品族公差尚未确认`
        : status === "not_comparable" ? "没有可比较的目标型号或结构不可比"
          : status === "source_missing" ? "来源目录未列出或尚无法可靠读取该型号的适用尺寸"
            : status === "target_missing" ? "VIGOUR 目录未列出或尚无法可靠读取该目标型号的适用尺寸"
              : "双方目录已有尺寸，但表头语义仍无法可靠对齐"
    if (!dimensionEvidenceStatuses.has(status)) {
      throw new Error(`Mapping has invalid dimension evidence status: ${JSON.stringify({ evidenceId, status })}`)
    }
    if (status === "within_tolerance" && (!comparisons.length || comparisons.some((entry) => entry.required && !entry.matched))) {
      throw new Error(`Green dimension status lacks complete passing evidence: ${evidenceId}`)
    }
    const sourcePages = occurrencePages(sourceRecord)
    const targetPages = occurrencePages(targetRecord)
    const evidencePages = Array.from(new Set([
      ...(item.evidencePages || []),
      ...(sourcePages.length ? sourcePages : unresolvedPages(sourceDocumentsByBrand.get(item.brand) || [])),
      ...(item.vigourModel
        ? (targetPages.length ? targetPages : unresolvedPages(targetDocuments))
        : [])
    ]))
    const record = {
      evidenceId,
      brand: item.brand,
      sourceModel: item.sourceModel,
      vigourModel: item.vigourModel || "",
      familyRule,
      comparisons,
      status,
      reason,
      sourceEvidenceId: item.sourceEvidenceId || occurrenceId(sourceRecord) || `catalog-route:${item.brand}:needs_page_localization`,
      targetEvidenceId: item.targetEvidenceId || occurrenceId(targetRecord) || (item.vigourModel ? "catalog-route:VIGOUR:needs_page_localization" : ""),
      evidencePages
    }
    mappingEvidence.push(record)
    if (item.vigourModel && !item.noMatch) {
      const overlay = {
        dimensionComparisons: comparisons,
        dimensionEvidenceStatus: status,
        dimensionEvidenceReason: reason,
        familyRule,
        sourceEvidenceId: record.sourceEvidenceId,
        targetEvidenceId: record.targetEvidenceId,
        evidencePages
      }
      const overlayKey = mappingEvidenceKey(item)
      const existing = runtimeEvidenceByKey[overlayKey]
      const existingScore = existing ? existing.dimensionComparisons.length + (
        existing.dimensionEvidenceStatus === "within_tolerance" ? 100 : 0
      ) : -1
      const score = comparisons.length + (status === "within_tolerance" ? 100 : 0)
      if (!existing || score > existingScore) runtimeEvidenceByKey[overlayKey] = overlay
    }

    const sourceStatus = catalogEvidenceStatus(item, sourceRecord)
    runtimeAudit.push({
      audit_type: sourceStatus === "runtime_without_catalog_evidence" ? "runtime_without_catalog_evidence" : "runtime_catalog_join",
      brand: item.brand,
      source_model: item.sourceModel,
      normalized_model: normalizedSource,
      vigour_model: item.vigourModel || "",
      catalog_evidence_status: sourceStatus,
      source_evidence_id: record.sourceEvidenceId,
      pdf_pages: evidencePages.join(";"),
      dimension_status: status,
      next_action: sourceStatus === "runtime_without_catalog_evidence"
        ? "回查品牌目录页；未证实前不得进入绿色结果"
        : "按尺寸证据状态处理"
    })

    const problemTypes = []
    if (sourceStatus === "runtime_without_catalog_evidence") problemTypes.push("runtime_without_catalog_evidence")
    if (status !== "within_tolerance" && item.vigourModel) problemTypes.push(status)
    if (!item.vigourModel || item.noMatch) problemTypes.push("catalog_no_target")
    mappingAudit.push({
      evidence_id: evidenceId,
      brand: item.brand,
      source_model: item.sourceModel,
      vigour_model: item.vigourModel || "",
      product_family: item.productCode || item.productLabel || "unclassified",
      catalog_status: sourceStatus,
      dimension_status: status,
      comparison_count: comparisons.length,
      required_failure_count: comparisons.filter((entry) => entry.required && !entry.matched).length,
      issues: problemTypes.join(";"),
      reason: record.reason,
      evidence_pages: evidencePages.join(";")
    })

    if (item.vigourModel && status !== "within_tolerance") {
      manualReview.push({
        evidence_id: evidenceId,
        brand: item.brand,
        source_model: item.sourceModel,
        vigour_model: item.vigourModel,
        reason_code: status,
        reason: record.reason,
        source_pages: evidencePages.join(";"),
        next_action: status === "out_of_tolerance"
          ? "复核超差尺寸及目标结构；确认前保持 amber"
          : comparisons.length
            ? "双方目录实值和差值已全部列出；确认产品族公差后才可判定绿色"
            : "从已注册 MD 表格提取适用尺寸；列错位时回查所列 PDF 页",
        green_blocked: "yes"
      })
    }

    const family = item.productCode || item.productLabel || "unclassified"
    const familyKey = `${item.brand}|${family}`
    const aggregate = familyCoverage.get(familyKey) || {
      brand: item.brand,
      product_family: family,
      runtime_records: 0,
      target_records: 0,
      within_tolerance: 0,
      out_of_tolerance: 0,
      not_comparable: 0,
      source_missing: 0,
      target_missing: 0,
      needs_manual_review: 0
    }
    aggregate.runtime_records += 1
    if (item.vigourModel) aggregate.target_records += 1
    aggregate[status] += 1
    familyCoverage.set(familyKey, aggregate)

    const collisionKey = `${item.brand}|${normalizedSource}`
    const rawModels = normalizedSources.get(collisionKey) || new Set()
    rawModels.add(item.sourceModel)
    normalizedSources.set(collisionKey, rawModels)
  })

  const catalogOnly = []
  sourceCatalog.records.forEach((record) => {
    const key = `${record.brand}|${normalizeModelText(record.canonicalModel)}`
    if (runtimeSourceKeys.has(key)) return
    const occurrence = record.occurrences && record.occurrences[0]
    catalogOnly.push({
      audit_type: "catalog_missing_in_runtime",
      brand: record.brand,
      source_model: record.catalogModel,
      normalized_model: normalizeModelText(record.canonicalModel),
      vigour_model: "",
      catalog_evidence_status: "catalog_exact",
      source_evidence_id: occurrenceId(record),
      pdf_pages: occurrencePages(record).join(";"),
      dimension_status: Object.keys(record.dimensions || {}).length ? "source_only" : "not_extracted",
      next_action: "确认是否应新增运行时型号；低置信度 token 先回查 PDF"
    })
  })

  normalizedSources.forEach((rawModels, key) => {
    if (rawModels.size <= 1) return
    const [brand, normalized] = key.split("|")
    mappingAudit.push({
      evidence_id: "",
      brand,
      source_model: Array.from(rawModels).join(" / "),
      vigour_model: "",
      product_family: "",
      catalog_status: "normalization_collision",
      dimension_status: "needs_manual_review",
      comparison_count: 0,
      required_failure_count: 0,
      issues: "normalization_collision",
      reason: `不同原始型号归一到 ${normalized}`,
      evidence_pages: ""
    })
  })

  const excludedAuditPath = path.join(root, "outputs/tube_fitting_audit/tube_fitting_source_evidence_audit.json")
  const excludedCandidates = []
  if (fs.existsSync(excludedAuditPath)) {
    const excludedAudit = JSON.parse(fs.readFileSync(excludedAuditPath, "utf8"))
    const seenExcluded = new Set()
    ;(excludedAudit.excludedRows || []).forEach((excluded) => {
      const normalizedSource = normalizeModelText(excluded.sourceModel)
      const identity = `${excluded.brand}|${normalizedSource}|${excluded.vigourModel || ""}`
      if (runtimeIdentities.has(identity) || seenExcluded.has(identity)) return
      seenExcluded.add(identity)
      const documents = sourceDocumentsByBrand.get(excluded.brand) || []
      const pages = [
        ...unresolvedPages(documents),
        ...(excluded.vigourModel ? unresolvedPages(targetDocuments) : [])
      ]
      const evidenceId = `excluded:${crypto.createHash("sha256").update(identity).digest("hex").slice(0, 16)}`
      excludedCandidates.push(excluded)
      runtimeAudit.push({
        audit_type: "runtime_removed_missing_catalog_evidence",
        brand: excluded.brand,
        source_model: excluded.sourceModel,
        normalized_model: normalizedSource,
        vigour_model: excluded.vigourModel || "",
        catalog_evidence_status: "runtime_without_catalog_evidence",
        source_evidence_id: `catalog-route:${excluded.brand}:needs_page_localization`,
        pdf_pages: pages.join(";"),
        dimension_status: "needs_manual_review",
        next_action: "已从搜索库排除；回查所列品牌目录并确认真实订购号"
      })
      mappingAudit.push({
        evidence_id: evidenceId,
        brand: excluded.brand,
        source_model: excluded.sourceModel,
        vigour_model: excluded.vigourModel || "",
        product_family: "workbook_candidate",
        catalog_status: "runtime_removed_missing_catalog_evidence",
        dimension_status: "needs_manual_review",
        comparison_count: 0,
        required_failure_count: 0,
        issues: "runtime_without_catalog_evidence",
        reason: excluded.reason,
        evidence_pages: pages.join(";")
      })
      manualReview.push({
        evidence_id: evidenceId,
        brand: excluded.brand,
        source_model: excluded.sourceModel,
        vigour_model: excluded.vigourModel || "",
        reason_code: "runtime_without_catalog_evidence",
        reason: "工作簿候选未在已注册品牌目录中证实，已从运行时搜索库排除",
        source_pages: pages.join(";"),
        next_action: "逐页回查品牌目录；证实型号、结构和目标后才可恢复",
        green_blocked: "yes"
      })
    })
  }

  const evidencePayload = {
    schemaVersion: 1,
    summary: {
      runtimeMappingCount: mappingEvidence.length,
      targetMappingCount: mappingEvidence.filter((record) => record.vigourModel).length,
      classifiedPercent: 100,
      numericDifferenceMappingCount: mappingEvidence.filter((record) => record.comparisons.length).length,
      numericComparisonCount: mappingEvidence.reduce((total, record) => total + record.comparisons.length, 0),
      numericDifferenceMappingCountByBrand: Object.fromEntries(
        Array.from(new Set(mappingEvidence.map((record) => record.brand))).sort().map((brand) => [
          brand,
          mappingEvidence.filter((record) => record.brand === brand && record.comparisons.length).length
        ])
      ),
      statusCounts: Object.fromEntries(Array.from(dimensionEvidenceStatuses).sort().map((status) => [
        status,
        mappingEvidence.filter((record) => record.status === status).length
      ]))
    },
    records: mappingEvidence
  }
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(
    path.join(root, "utils/fittingDimensionEvidence.js"),
    runtimeEvidenceModule(runtimeEvidenceByKey),
    "utf8"
  )
  fs.writeFileSync(
    path.join(evidenceDir, "mapping-dimension-evidence.json"),
    `${JSON.stringify(evidencePayload, null, 2)}\n`,
    "utf8"
  )
  writeCsv("catalog-runtime-model-audit.csv", [
    "audit_type", "brand", "source_model", "normalized_model", "vigour_model",
    "catalog_evidence_status", "source_evidence_id", "pdf_pages", "dimension_status", "next_action"
  ], [...runtimeAudit, ...catalogOnly])
  writeCsv("mapping-audit.csv", [
    "evidence_id", "brand", "source_model", "vigour_model", "product_family", "catalog_status",
    "dimension_status", "comparison_count", "required_failure_count", "issues", "reason", "evidence_pages"
  ], mappingAudit)
  writeCsv("brand-family-coverage.csv", [
    "brand", "product_family", "runtime_records", "target_records", "within_tolerance", "out_of_tolerance",
    "not_comparable", "source_missing", "target_missing", "needs_manual_review"
  ], Array.from(familyCoverage.values()).sort((a, b) => (
    a.brand.localeCompare(b.brand) || a.product_family.localeCompare(b.product_family)
  )))
  writeCsv("dimension-semantic-crosswalk.csv", [
    "group", "source_dimension", "target_dimension", "alignment_method", "sample_count", "close_ratio", "mean_relative_difference"
  ], Array.from(crosswalks.entries()).flatMap(([group, pairs]) => pairs.map((pair) => ({
    group,
    source_dimension: pair.sourceKey,
    target_dimension: pair.targetKey,
    alignment_method: pair.explicit
      ? "catalog_diagram_crosswalk"
      : pair.sameLabel ? "same_catalog_label" : "recurring_numeric_alignment",
    sample_count: pair.count,
    close_ratio: pair.closeRatio.toFixed(4),
    mean_relative_difference: pair.meanRelativeDifference.toFixed(6)
  }))))
  writeCsv("manual-review-queue.csv", [
    "evidence_id", "brand", "source_model", "vigour_model", "reason_code", "reason",
    "source_pages", "next_action", "green_blocked"
  ], manualReview)

  const generatedArtifacts = [
    "data/fitting-evidence/source-catalog-models.json",
    "data/fitting-evidence/vigour-catalog-models.json",
    "data/fitting-evidence/mapping-dimension-evidence.json",
    "utils/fittingDimensionEvidence.js"
  ].map((relativePath) => {
    const absolutePath = path.join(root, relativePath)
    return {
      path: relativePath,
      bytes: fs.statSync(absolutePath).size,
      sha256: fileDigest(absolutePath)
    }
  })
  const generationAuditSource = path.join(root, "outputs/tube_fitting_audit/fitting_generation_audit.json")
  const generationAudit = {
    schemaVersion: 1,
    deterministicInputs: true,
    runtimeMappingCount: evidencePayload.summary.runtimeMappingCount,
    targetMappingCount: evidencePayload.summary.targetMappingCount,
    numericDifferenceMappingCount: evidencePayload.summary.numericDifferenceMappingCount,
    numericComparisonCount: evidencePayload.summary.numericComparisonCount,
    semanticCrosswalkCount: Array.from(crosswalks.values()).reduce((total, pairs) => total + pairs.length, 0),
    runtimeEvidenceOverlayCount: Object.keys(runtimeEvidenceByKey).length,
    artifacts: generatedArtifacts,
    upstreamTubeGenerationAuditSha256: fs.existsSync(generationAuditSource)
      ? fileDigest(generationAuditSource)
      : ""
  }
  fs.writeFileSync(
    path.join(outputDir, "generation-audit.json"),
    `${JSON.stringify(generationAudit, null, 2)}\n`,
    "utf8"
  )
  console.log(JSON.stringify({
    ...evidencePayload.summary,
    catalogOnlyCount: catalogOnly.length,
    excludedCandidateCount: excludedCandidates.length,
    manualReviewCount: manualReview.length,
    familyCount: familyCoverage.size,
    semanticCrosswalkCount: Array.from(crosswalks.values()).reduce((total, pairs) => total + pairs.length, 0),
    runtimeEvidenceOverlayCount: Object.keys(runtimeEvidenceByKey).length,
    mappingsWithNumericDifferences: mappingEvidence.filter((record) => record.comparisons.length).length
  }, null, 2))
}

if (require.main === module) main()

module.exports = {
  modelIndex,
  sourceRecordFor,
  targetRecordFor,
  learnDimensionCrosswalks,
  catalogComparisons,
  comparisonGroup
}
