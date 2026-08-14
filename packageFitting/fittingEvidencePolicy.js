const dimensionEvidenceStatuses = new Set([
  "within_tolerance",
  "out_of_tolerance",
  "not_comparable",
  "source_missing",
  "target_missing",
  "needs_manual_review"
])

const legacyStatusMap = {
  catalog_within_tolerance: "within_tolerance",
  catalog_dimension_difference: "out_of_tolerance"
}

function integerScaleForUnit(unit) {
  return unit === "in" ? 1000000 : 1000
}

function withinScaledTolerance(sourceValue, targetValue, tolerance, unit) {
  const scale = integerScaleForUnit(unit)
  const source = Math.round(Number(sourceValue) * scale)
  const target = Math.round(Number(targetValue) * scale)
  const limit = Math.round(Number(tolerance) * scale)
  return Math.abs(source - target) <= limit
}

function normalizeComparison(comparison) {
  const hasTolerance = comparison.tolerance !== null
    && comparison.tolerance !== undefined
    && comparison.tolerance !== ""
    && Number.isFinite(Number(comparison.tolerance))
  return {
    ...comparison,
    tolerance: hasTolerance ? Number(comparison.tolerance) : null,
    matched: hasTolerance
      ? withinScaledTolerance(
        comparison.sourceValue,
        comparison.targetValue,
        comparison.tolerance,
        comparison.unit
      )
      : null
  }
}

function legacyComparisons(item) {
  const configs = [
    ["overallLength", "总长", "sourceTotalLengthMm", "targetTotalLengthMm", "totalLengthDifferenceMm", "totalLengthToleranceMm", "mm", null],
    ["wallThickness", "管壁厚", "sourceWallThicknessIn", "targetWallThicknessIn", "wallThicknessDifferenceIn", "wallThicknessToleranceIn", "in", "wallThicknessMatched"],
    ["insertionLength", "插入长度", "sourceInsertionLengthMm", "targetInsertionLengthMm", "insertionLengthDifferenceMm", "insertionLengthToleranceMm", "mm", "insertionLengthMatched"]
  ]
  return configs.map((config) => {
    const [dimension, label, sourceKey, targetKey, differenceKey, toleranceKey, unit, matchedKey] = config
    const values = [item[sourceKey], item[targetKey], item[differenceKey], item[toleranceKey]]
    if (!values.every((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)))) {
      return null
    }
    const difference = Number(item[differenceKey])
    const tolerance = Number(item[toleranceKey])
    return {
      dimension,
      label,
      sourceValue: Number(item[sourceKey]),
      targetValue: Number(item[targetKey]),
      absoluteDifference: difference,
      tolerance,
      unit,
      matched: matchedKey && typeof item[matchedKey] === "boolean"
        ? item[matchedKey]
        : difference <= tolerance + 1e-9,
      required: true,
      sourceEvidenceId: item.sourceEvidenceId || "",
      targetEvidenceId: item.targetEvidenceId || ""
    }
  }).filter(Boolean)
}

function normalizeDimensionEvidence(item) {
  const comparisons = Array.isArray(item.dimensionComparisons) && item.dimensionComparisons.length
    ? item.dimensionComparisons.map(normalizeComparison)
    : legacyComparisons(item).map(normalizeComparison)
  let status = legacyStatusMap[item.dimensionEvidenceStatus] || item.dimensionEvidenceStatus
  let reason = item.dimensionEvidenceReason || ""
  let familyRule = item.familyRule || ""

  if (!status) {
    if (!item.vigourModel || item.noMatch) {
      status = "not_comparable"
      reason = "当前记录没有可比较的 VIGOUR 目标型号"
      familyRule = "not_applicable.no_target.v1"
    } else {
      status = "needs_manual_review"
      reason = "源品牌与 VIGOUR 的适用目录尺寸尚未建立完整比较证据"
      familyRule = "non_gland_family.unconfirmed.v1"
    }
  }
  if (!dimensionEvidenceStatuses.has(status)) {
    throw new Error(`Unsupported fitting dimension evidence status: ${status}`)
  }
  if (["within_tolerance", "out_of_tolerance"].includes(status) && comparisons.length) {
    if (comparisons.some((comparison) => comparison.required !== false && typeof comparison.matched !== "boolean")) {
      throw new Error(`Fitting dimension verdict lacks a confirmed tolerance: ${status}`)
    }
    const computedStatus = comparisons.some((comparison) => comparison.required !== false && !comparison.matched)
      ? "out_of_tolerance"
      : "within_tolerance"
    if (computedStatus !== status) {
      throw new Error(`Fitting dimension status conflicts with its comparisons: ${status}/${computedStatus}`)
    }
  }
  const needsConfirmation = Boolean(item.vigourModel && status !== "within_tolerance")
  return {
    ...item,
    dimensionComparisons: comparisons,
    dimensionEvidenceStatus: status,
    dimensionEvidenceReason: reason,
    familyRule,
    dimensionConfirmation: Boolean(item.dimensionConfirmation || needsConfirmation)
  }
}

module.exports = {
  dimensionEvidenceStatuses,
  integerScaleForUnit,
  withinScaledTolerance,
  normalizeComparison,
  legacyComparisons,
  normalizeDimensionEvidence
}
