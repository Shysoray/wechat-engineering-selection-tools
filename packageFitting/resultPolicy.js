const { statusTexts, noteTexts, getDisplayModelLabel } = require("./mappingRepository")

const unilokGlandProductCodes = new Set([
  "CMGS", "CMGL", "CSGS", "CSGL", "CLGS", "CLGL", "CSGWS", "CLGWS", "CLGRWS"
])

function uniqueTexts(values) {
  return [...new Set(values.filter(Boolean))]
}

function isFiniteDimension(value) {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value))
}

function formatDimension(value, digits) {
  return Number(value).toFixed(digits)
}

function dimensionComparisonRow(item, config) {
  const values = [
    item[config.sourceKey],
    item[config.targetKey],
    item[config.differenceKey],
    item[config.toleranceKey]
  ]
  if (!values.every(isFiniteDimension)) return null

  const difference = Number(item[config.differenceKey])
  const tolerance = Number(item[config.toleranceKey])
  const explicitMatched = config.matchedKey ? item[config.matchedKey] : undefined
  const matched = typeof explicitMatched === "boolean"
    ? explicitMatched
    : difference <= tolerance + 1e-9

  return {
    key: config.key,
    label: config.label,
    sourceText: formatDimension(item[config.sourceKey], config.digits),
    targetText: formatDimension(item[config.targetKey], config.digits),
    differenceText: formatDimension(difference, config.digits),
    toleranceText: formatDimension(tolerance, config.digits),
    unit: config.unit,
    matched,
    tone: matched ? "success" : "warning",
    statusText: matched ? "公差内" : "超出公差"
  }
}

function dimensionComparisonPresentation(item) {
  const rawComparisons = Array.isArray(item.dimensionComparisons)
    ? item.dimensionComparisons
    : []
  const dimensionComparisons = rawComparisons.map((comparison) => {
    const digits = comparison.unit === "in" ? 3 : 2
    const difference = Number(comparison.absoluteDifference)
    const toleranceConfirmed = comparison.tolerance !== null
      && comparison.tolerance !== undefined
      && comparison.tolerance !== ""
      && Number.isFinite(Number(comparison.tolerance))
    const tolerance = toleranceConfirmed ? Number(comparison.tolerance) : null
    const matched = toleranceConfirmed && typeof comparison.matched === "boolean"
      ? comparison.matched
      : null
    return {
      key: comparison.dimension,
      label: comparison.label || comparison.dimension,
      sourceText: formatDimension(comparison.sourceValue, digits),
      targetText: formatDimension(comparison.targetValue, digits),
      differenceText: formatDimension(difference, digits),
      toleranceText: toleranceConfirmed ? formatDimension(tolerance, digits) : "待确认",
      toleranceConfirmed,
      unit: comparison.unit,
      matched,
      required: comparison.required !== false,
      tone: matched === true ? "success" : "warning",
      statusText: matched === true ? "公差内" : matched === false ? "超出公差" : "差值已计算"
    }
  }).sort((left, right) => Number(left.matched === true) - Number(right.matched === true))
  const exceededCount = dimensionComparisons.filter((comparison) => comparison.matched === false).length
  const status = item.dimensionEvidenceStatus || (dimensionComparisons.length
    ? (exceededCount ? "out_of_tolerance" : "within_tolerance")
    : "needs_manual_review")
  const statusPresentation = {
    within_tolerance: ["success", `${dimensionComparisons.length} 项均在公差内`, ""],
    out_of_tolerance: ["warning", `${exceededCount} 项超出公差`, "超差项已优先显示，请按目录页码复核"],
    source_missing: ["warning", "源目录尺寸缺失", "目录尺寸未建立：源品牌目录缺少适用尺寸"],
    target_missing: ["warning", "VIGOUR 尺寸缺失", "目录尺寸未建立：VIGOUR 目录缺少适用尺寸"],
    needs_manual_review: [
      "warning",
      dimensionComparisons.length ? `${dimensionComparisons.length} 项尺寸差值已列出` : "目录尺寸未建立",
      item.dimensionEvidenceReason || "适用尺寸或产品族公差规则尚未完成复核"
    ],
    not_comparable: ["warning", "不可直接比较", item.dimensionEvidenceReason || "结构不同或该尺寸不可直接比较"]
  }[status] || ["warning", "目录尺寸未建立", "尺寸证据状态异常，请人工复核"]
  const evidencePages = Array.isArray(item.evidencePages) ? item.evidencePages : []

  return {
    dimensionComparisons,
    hasDimensionComparison: Boolean(item.vigourModel && !item.noMatch),
    dimensionComparisonTone: statusPresentation[0],
    dimensionComparisonSummary: statusPresentation[1],
    dimensionComparisonMissingText: statusPresentation[2],
    dimensionEvidencePageSummary: evidencePages.join("；")
  }
}

function inferredMissingParameters(candidate) {
  const parameters = [...(candidate.missingParameters || [])]
  if (candidate.materialMatched === false) parameters.push("材质")
  if (candidate.treatmentMatched === false) parameters.push("清洗工艺")
  if (candidate.finishMatched === false) parameters.push("表面处理")
  if (candidate.specialFeatureMatched === false && !candidate.advisoryModel) parameters.push("特殊结构")
  if (candidate.vigourModel && candidate.dimensionEvidenceStatus !== "within_tolerance") {
    parameters.push((candidate.dimensionComparisons || []).length ? "尺寸公差" : "尺寸证据")
  } else if (candidate.dimensionConfirmation) {
    parameters.push("尺寸")
  }
  return uniqueTexts(parameters)
}

function candidateSalesCopyRecord(candidate, kind = "exact") {
  const model = candidate.advisoryModel || candidate.vigourModel || ""
  if (!model) return null
  if (kind === "candidate") {
    return {
      status: "待确认",
      model: "",
      missingParameters: ["原始型号"],
      nextAction: "模糊候选仅供屏幕核对，请补全原始型号",
      compactText: "待确认｜模糊候选仅供屏幕核对，请补全原始型号"
    }
  }

  const missingParameters = inferredMissingParameters(candidate)
  const exceededDimensions = (candidate.dimensionComparisons || [])
    .filter((comparison) => comparison.matched === false)
    .map((comparison) => comparison.label || comparison.dimension)
    .join("、")
  const needsConfirmation = Boolean(
    candidate.advisoryModel
    || candidate.salesStatus === "needs_confirmation"
    || missingParameters.length
    || (candidate.matchWarnings || []).length
  )
  if (needsConfirmation) {
    const nextAction = candidate.nextAction
      || (missingParameters.length ? `请确认${missingParameters.join("、")}` : "请核对型号参数")
    return {
      status: "待确认",
      model,
      missingParameters,
      nextAction,
      dimensionEvidenceStatus: candidate.dimensionEvidenceStatus || "needs_manual_review",
      dimensionSummary: candidate.dimensionComparisonSummary || "目录尺寸未建立",
      exceededDimensions,
      evidencePages: candidate.dimensionEvidencePageSummary || "",
      compactText: `待确认｜${model}｜${nextAction}${candidate.dimensionComparisonSummary ? `｜${candidate.dimensionComparisonSummary}` : ""}`
    }
  }

  return {
    status: "已匹配",
    model,
    missingParameters: [],
    nextAction: "",
    dimensionEvidenceStatus: candidate.dimensionEvidenceStatus || "within_tolerance",
    dimensionSummary: candidate.dimensionComparisonSummary || "",
    exceededDimensions,
    evidencePages: candidate.dimensionEvidencePageSummary || "",
    compactText: model
  }
}

function enrichResult(item, fields, kind = "exact") {
  const matchWarnings = []
  if (item.swagelokMaterialAlias) {
    const inputMaterial = item.inputMaterialCode
      ? `输入材质 ${item.inputMaterialCode} 已按 Swagelok SS（316 SS）结构匹配`
      : "输入缺少材质前缀，当前按 Swagelok SS（316 SS）结构匹配"
    matchWarnings.push({
      level: "warning",
      text: `${inputMaterial}；正式订购号为 ${item.sourceModel}，请确认材质及订购前缀`
    })
  }
  if (item.fitokBasicOrderingAlias) {
    matchWarnings.push({
      level: item.noMatch ? "error" : "warning",
      text: item.noMatch
        ? "FITOK 基础订购号已识别，但该加长/特殊腿长结构暂无 VIGOUR 精确型号"
        : `FITOK 基础订购号缺少材质/清洗工艺等参数，请补充 SS/6L/6LV/6LW 前缀与 F2/F3 后缀后确认${item.fitokBasicHasProcessPAlternative ? "；若选择 F3 工艺，VIGOUR 可能对应 -P 版本" : ""}`
    })
  }
  if (item.unilokBaseOrderingAlias) {
    matchWarnings.push({
      level: "warning",
      text: `原始型号缺少${(item.missingParameters || []).join("/")}，当前输出标准候选 ${item.vigourModel || item.advisoryModel}；材料工艺待确认${item.canonicalSourceModel ? `，参考完整订购码 ${item.canonicalSourceModel}` : ""}`
    })
  }
  if (item.unilokSlFinishAlias) {
    matchWarnings.push({
      level: "warning",
      text: `UNILOK ${item.materialCode}-${item.finishCode} 已按普通 316L 标准候选处理${item.canonicalSourceModel ? `，参考库内订购码 ${item.canonicalSourceModel}` : ""}`
    })
  }
  if (item.materialMatched === false) {
    matchWarnings.push({
      level: "error",
      text: `材质不匹配：${item.brand} ${item.materialLabel}，VIGOUR 候选为 ${item.targetMaterialLabel || "标准材质"}`
    })
  }
  if (item.treatmentMatched === false) {
    const sourceTreatment = item.processLabel || item.treatmentLabel || "所选处理"
    matchWarnings.push({
      level: "error",
      text: `工艺/表面处理未匹配：${item.brand} ${sourceTreatment}，VIGOUR 候选为 ${item.targetTreatmentLabel || "标准处理"}`
    })
  }
  if (item.finishMatched === false) {
    matchWarnings.push({
      level: "error",
      text: `表面处理未匹配：${item.brand} ${item.finishLabel}，VIGOUR 候选为 ${item.targetFinishLabel || "标准处理"}`
    })
  }
  if (item.specialFeatureMatched === false) {
    matchWarnings.push({
      level: "error",
      text: `特殊结构未完全匹配：${item.specialFeatureLabel || "源型号特殊参数"}，当前仅提供 ${item.targetFeatureLabel || "最近 VIGOUR 候选"}`
    })
  }
  if (item.vigourModel && item.dimensionEvidenceStatus !== "within_tolerance") {
    const hasNumericDimensions = Array.isArray(item.dimensionComparisons) && item.dimensionComparisons.length > 0
    matchWarnings.push({
      level: "warning",
      text: item.dimensionEvidenceStatus === "out_of_tolerance"
        ? "尺寸匹配需额外确认：至少一项目录必比尺寸超出公差，请按证据页码复核"
        : hasNumericDimensions
          ? `尺寸差值已列出：${item.dimensionEvidenceReason || "产品族公差规则尚未确认"}`
          : `目录尺寸未建立：${item.dimensionEvidenceReason || "适用尺寸证据或产品族公差规则尚未闭环"}`
    })
  }

  const dimensionPresentation = dimensionComparisonPresentation(item)
  const salesRecord = candidateSalesCopyRecord({ ...item, ...dimensionPresentation, matchWarnings }, kind)
  const salesNeedsConfirmation = Boolean(salesRecord && salesRecord.status === "待确认")
  const displayVigourModel = kind === "candidate"
    ? (item.advisoryModel || item.vigourModel || "")
    : salesRecord ? salesRecord.model : ""
  return {
    ...item,
    ...dimensionPresentation,
    matchKind: kind,
    hasVigourModel: Boolean(item.vigourModel),
    copyAllowed: Boolean(salesRecord && salesRecord.status === "已匹配" && item.vigourModel && !item.noMatch),
    salesNeedsConfirmation,
    reviewCopyAllowed: kind !== "candidate" && salesNeedsConfirmation,
    displayVigourModel,
    advisoryCopyText: salesNeedsConfirmation ? salesRecord.compactText : "",
    sourceModelText: getDisplayModelLabel(item.brand, item.sourceModel),
    status: item.statusText || statusTexts[item.s] || "",
    note: item.noteText || noteTexts[item.n] || "",
    matchWarnings,
    specs: fields.map((field) => {
      const code = item[field.key]
      const labelKey = field.key.replace("Code", "Label")
      return {
        label: field.label,
        value: item[labelKey] ? `${code} - ${item[labelKey]}` : code
      }
    })
  }
}

function salesCopyRecord(result) {
  if (result.components && result.components.length) {
    const componentRecords = result.components.map((component) => salesCopyRecord(component))
    if (result.components.every((component) => component.kind === "missing")) {
      return {
        status: "未识别型号",
        model: "",
        missingParameters: [],
        nextAction: "请检查品牌和订购号",
        compactText: "未识别型号｜请检查品牌和订购号"
      }
    }

    const model = componentRecords.map((record) => record.model || "[未识别型号]").join(" + ")
    if (componentRecords.every((record) => record.status === "已匹配")) {
      return { status: "已匹配", model, missingParameters: [], nextAction: "", compactText: model }
    }
    return {
      status: "待确认",
      model,
      missingParameters: ["原始型号"],
      nextAction: "请检查部分型号",
      compactText: `待确认｜${model}｜请检查部分型号`
    }
  }

  const candidate = result.candidates.find((entry) => entry.vigourModel || entry.advisoryModel)
  const candidateRecord = candidate && candidateSalesCopyRecord(candidate, candidate.matchKind || result.kind)
  if (candidateRecord) return candidateRecord
  if (result.kind === "exact") {
    return {
      status: "无精确型号",
      model: "",
      missingParameters: [],
      nextAction: "请联系工厂确认",
      compactText: "无精确型号｜请联系工厂确认"
    }
  }
  return {
    status: "未识别型号",
    model: "",
    missingParameters: [],
    nextAction: result.nextAction || "请检查品牌和订购号",
    compactText: `未识别型号｜${result.nextAction || "请检查品牌和订购号"}`
  }
}

function salesCopyTwoColumnLine(record) {
  const note = record.status === "已匹配"
    ? ""
    : [record.status, record.nextAction, record.dimensionSummary].filter(Boolean).join("｜")
  return [record.model, note].join("\t")
}

function resultPresentation(presentationKind, kindText) {
  const statusTone = { exact: "success", candidate: "warning", missing: "neutral" }[presentationKind]
  return { presentationKind, kindText, statusTone }
}

function classifyExactCandidates(candidates) {
  const hasAnyTarget = candidates.some((candidate) => candidate.hasVigourModel || candidate.displayVigourModel)
  if (!hasAnyTarget) {
    return { ...resultPresentation("missing", "暂无 VIGOUR 精确型号"), reviewRequired: false }
  }
  const unresolvedCandidates = candidates.filter((candidate) => !candidate.copyAllowed)
  if (unresolvedCandidates.length) {
    const reviewCandidate = unresolvedCandidates.find((candidate) => candidate.reviewKindText)
    return {
      ...resultPresentation("candidate", reviewCandidate?.reviewKindText || "精确命中 · 建议核实"),
      reviewRequired: true
    }
  }
  return { ...resultPresentation("exact", "精确匹配"), reviewRequired: false }
}

module.exports = {
  enrichResult,
  dimensionComparisonPresentation,
  inferredMissingParameters,
  candidateSalesCopyRecord,
  salesCopyRecord,
  salesCopyTwoColumnLine,
  resultPresentation,
  classifyExactCandidates
}
