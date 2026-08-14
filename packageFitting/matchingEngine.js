const { normalizeModelText } = require("../utils/fittingModelSignature")
const { isSafeFuzzyTextPair, candidatesShareOneFamily } = require("./fuzzySafety")
const {
  allFittingMappings,
  catalogNoMatchModelsByBrand,
  getSelectorModelLabel
} = require("./mappingRepository")
const { inferredMissingParameters } = require("./resultPolicy")
function normalizeRelaxedModelText(value) {
  return normalizeModelText(value).replace(/\./g, "")
}

function numericTokens(value) {
  return normalizeModelText(value).match(/\d+(?:\.\d+)?/g) || []
}

function hasDecimalCollision(input, candidate) {
  const inputTokens = numericTokens(input)
  const candidateTokens = numericTokens(candidate)
  if (inputTokens.length !== candidateTokens.length) return false

  return inputTokens.some((inputToken, index) => {
    const candidateToken = candidateTokens[index]
    if (inputToken === candidateToken) return false
    return inputToken.replace(/\./g, "") === candidateToken.replace(/\./g, "")
  })
}

function safeRelaxedExactItemsForInput(input, searchIndex) {
  const relaxedItems = searchIndex.relaxedExact[normalizeRelaxedModelText(input)] || []
  return relaxedItems.filter((item) => !hasDecimalCollision(input, item.sourceModel))
}

function withoutTerminalVLokSuffix(value) {
  return value.endsWith("-V") ? value.slice(0, -2) : ""
}

function withoutFujikinThermoelement(value) {
  return value.replace(/-T\/?C(?=-|$)/g, "")
}

function fujikinDigitZeroAlias(value) {
  return value.replace(/-O(?=-|$)/g, "-0")
}

function fujikinSharpATypeAlias(value) {
  return value.replace(/(UJR-\d+(?:\.\d+)?N)A(?=-|$)/g, "$1")
}

function fujikinSharpAInputAlias(value) {
  return value.replace(/(UJR-\d+(?:\.\d+)?N)(?=-|$)/g, "$1A")
}

function withSeparatedTerminalAlphaSuffix(value) {
  return value.replace(/-(\d+)([A-Z]+)$/, "-$1-$2")
}

function swagelokHvcrGlandAliasKeys(value) {
  const match = value.match(/^6LV-4-HVCR-3-(60|1\.19|1\.31)SR$/)
  if (!match) return []

  const length = match[1]
  const keys = [`6LV-4-HVCR-3-1-${length}SR`]
  if (length === "60") keys.push("6LV-4-HVCR-3-1-0.60SR")
  return keys
}

function modelMatchKeys(brand, sourceModel) {
  const source = normalizeModelText(sourceModel)
  const display = normalizeModelText(getSelectorModelLabel(brand, sourceModel))
  const keys = [source, display]

  ;[source, display].forEach((key) => {
    if (key.endsWith("-SS")) keys.push(key.slice(0, -3))
  })

  if (brand === "Swagelok" && /^SS-\d/.test(source)) {
    ;[source, display].forEach((key) => {
      const separated = withSeparatedTerminalAlphaSuffix(key)
      if (separated !== key) keys.push(separated)
    })
  }

  if (brand === "Swagelok") {
    keys.push(...swagelokHvcrGlandAliasKeys(source))
  }

  if (brand === "FUJIKIN") {
    const sourceWithoutVLokSuffix = withoutTerminalVLokSuffix(source)
    const displayWithoutVLokSuffix = withoutTerminalVLokSuffix(display)
    const sourceWithoutThermoelement = withoutFujikinThermoelement(source)
    const displayWithoutThermoelement = withoutFujikinThermoelement(display)
    const sourceWithoutOR = source.replace(/-OR(?=-|$)/g, "")
    const displayWithoutOR = display.replace(/-OR(?=-|$)/g, "")
    keys.push(
      source.replace(/-S#T(?=-|$)/g, "-S"),
      source.replace(/#A(?=-|$)/g, ""),
      display.replace(/#A(?=-|$)/g, ""),
      fujikinSharpATypeAlias(source),
      fujikinSharpATypeAlias(display),
      fujikinSharpAInputAlias(source),
      fujikinSharpAInputAlias(display),
      fujikinDigitZeroAlias(source),
      fujikinDigitZeroAlias(display),
      sourceWithoutVLokSuffix,
      displayWithoutVLokSuffix,
      sourceWithoutThermoelement,
      displayWithoutThermoelement,
      withoutTerminalVLokSuffix(sourceWithoutThermoelement),
      withoutTerminalVLokSuffix(displayWithoutThermoelement),
      sourceWithoutOR,
      displayWithoutOR,
      withoutTerminalVLokSuffix(sourceWithoutOR),
      withoutTerminalVLokSuffix(displayWithoutOR)
    )
  }

  if (brand === "TK-Fujikin" && source.endsWith("-P")) {
    keys.push(source.slice(0, -2) + "P")
  }

  return [...new Set(keys.filter(Boolean))]
}

function fitokBasicOrderingKeys(item) {
  if (item.brand !== "FITOK" || item.tubeFittingSupplemental || item.catalogSupplemental) return []
  if (!["M", "L", "FR"].includes(item.seriesCode)) return []

  const normalized = normalizeModelText(item.sourceModel)
  const match = normalized.match(/^(?:6LV|6LW|6L|SS)(-.+)$/)
  if (!match) return []

  const key = match[1]
  const keys = [key]
  const withoutProcess = key.replace(/-F[23]$/, "")
  if (withoutProcess !== key) keys.push(withoutProcess)
  return [...new Set(keys)]
}

function fitokBasicOrderingSortScore(item) {
  let score = 0
  if (item.vigourModel && !item.noMatch) score += 100
  if (item.vigourModel && !/-P$/.test(item.vigourModel)) score += 30
  if (item.processCode === "STD") score += 10
  if (item.materialCode === "SS") score += 5
  if (item.materialCode === "6L") score += 4
  if (!item.sourceModel.includes("-F")) score += 2
  return score
}

function aggregateFitokBasicOrderingItems(input, items) {
  if (!items.length) return []
  const normalized = normalizeModelText(input)
  const sorted = [...items].sort((left, right) => fitokBasicOrderingSortScore(right) - fitokBasicOrderingSortScore(left))
  const primary = sorted[0]
  const hasProcessPAlternative = sorted.some((item) => (
    item.vigourModel
    && !item.noMatch
    && item.vigourModel !== primary.vigourModel
    && /-P$/.test(item.vigourModel)
    && item.processCode === "F3"
  ))

  return [{
    ...primary,
    sourceModel: normalized,
    fitokBasicOrderingAlias: true,
    fitokBasicAggregated: true,
    fitokBasicHasProcessPAlternative: hasProcessPAlternative,
    specialFeatureMatched: primary.noMatch ? undefined : primary.specialFeatureMatched,
    salesStatus: primary.noMatch ? "no_exact_model" : "needs_confirmation",
    advisoryModel: primary.noMatch ? "" : primary.vigourModel,
    missingParameters: primary.noMatch ? [] : ["材质", "清洗工艺"],
    nextAction: primary.noMatch ? "请联系工厂确认" : "缺材质、清洗工艺"
  }]
}

function unilokBaseOrderingKeys(item) {
  if (item.brand !== "UNILOK") return []
  const normalized = normalizeModelText(item.sourceModel)
  const withoutMaterialFinish = normalized.replace(/-(?:SM|DM)-(?:EP|BA)$/, "")
  if (withoutMaterialFinish !== normalized) return [withoutMaterialFinish]
  const withoutMaterial = normalized.replace(/-(?:SL|NI)$/, "")
  return withoutMaterial !== normalized ? [withoutMaterial] : []
}

function aggregateUnilokBaseOrderingItems(input, items) {
  if (!items.length) return []
  const normalized = normalizeModelText(input)
  const score = (item) => {
    let value = 0
    if (item.vigourModel && !item.noMatch) value += 100
    if (!/-SLV(?:-|$)/.test(item.vigourModel || "")) value += 30
    if (!/-NI(?:-|$)/.test(item.vigourModel || "")) value += 20
    if (item.materialCode === "SM" || item.materialCode === "SL") value += 12
    if (item.materialCode === "DM" || item.materialCode === "NI") value -= 4
    if (item.finishCode === "EP" || item.finishCode === "STD") value += 8
    if (item.finishCode === "BA") value -= 4
    if (item.finishMatched !== false) value += 3
    return value
  }
  const primary = [...items].sort((left, right) => score(right) - score(left))[0]
  const needsFinish = items.some((item) => /-(?:SM|DM)-(?:EP|BA)$/.test(normalizeModelText(item.sourceModel)))
  const missingParameters = needsFinish ? ["材质", "表面处理"] : ["材质"]
  return [{
    ...primary,
    unilokBaseOrderingAlias: true,
    sourceModel: normalized,
    canonicalSourceModel: primary.sourceModel,
    inputSourceModel: normalized,
    advisoryModel: primary.noMatch ? "" : primary.vigourModel,
    missingParameters,
    salesStatus: "needs_confirmation",
    nextAction: `原始型号缺少${missingParameters.join("、")}，材料工艺待确认`,
    reviewKindText: `型号缺少${missingParameters.join("、")}`
  }]
}

function deriveUnilokSlFinishAliasItems(input, searchIndex) {
  const normalized = normalizeModelText(input)
  const match = normalized.match(/^(.+)-SL-(EP|BA)$/)
  if (!match) return []

  const canonical = `${match[1]}-SM-${match[2]}`
  const canonicalItems = searchIndex.exact[canonical] || []
  return canonicalItems
    .filter((item) => item.brand === "UNILOK")
    .map((item) => ({
      ...item,
      sourceModel: normalized,
      canonicalSourceModel: item.sourceModel,
      materialCode: "SL",
      materialLabel: "316L Stainless Steel",
      materialMatched: !/-SLV(?:-|$)/.test(item.vigourModel || ""),
      unilokSlFinishAlias: true
    }))
}

function withSemiconductorProcess(model) {
  if (!model || model.endsWith("-P")) return model
  return `${model}-P`
}

function swagelokProcessBase(normalized) {
  if (!normalized.startsWith("6LV-")) return ""
  if (/(?:P6P|PP)$/.test(normalized)) return ""
  if (normalized.endsWith("-P")) return normalized.slice(0, -2)
  if (normalized.endsWith("P")) return normalized.slice(0, -1)
  return ""
}

function hasUnsupportedSwagelokProcess(input) {
  const normalized = normalizeModelText(input)
  return (
    normalized.startsWith("6LV-")
    && /(?:P6P|PP|-?SC06|-?SC11)$/.test(normalized)
  )
}

function deriveSwagelokProcessItems(input, searchIndex) {
  const normalized = normalizeModelText(input)
  const baseInput = swagelokProcessBase(normalized)
  if (!baseInput) return []
  const baseItems = searchIndex.exact[baseInput]
    || searchIndex.relaxedExact[baseInput.replace(/\./g, "")]
    || []

  return baseItems
    .filter((item) => (
      item.brand === "Swagelok"
      && !item.noMatch
      && item.vigourModel
      && !["P", "CP"].includes(item.connectionCode)
    ))
    .map((item) => ({
      ...item,
      sourceModel: `${item.sourceModel}P`,
      vigourModel: withSemiconductorProcess(item.vigourModel),
      finishCode: "P",
      finishLabel: "Swagelok SC-01 ultrahigh-purity process",
      finishMatched: true,
      targetFinishLabel: "VIGOUR semiconductor process (-P)"
    }))
}

function deriveFujikinFlowLimitingGasketItems(input, searchIndex) {
  const normalized = normalizeModelText(input)
  const match = normalized.match(/^UJR-(3\.2|6\.35|9\.52|19\.05)G-NI-(\d+\.\d+)$/)
  if (!match) return []

  const [, sizeText, orifice] = match
  const baseModel = `UJR-${sizeText}G-NI-O`
  const baseItems = searchIndex.exact[baseModel] || []

  return baseItems
    .filter((item) => item.brand === "FUJIKIN" && item.vigourModel && !item.noMatch)
    .map((item) => ({
      ...item,
      sourceModel: normalized,
      vigourModel: `${item.vigourModel}-DM-${orifice}`,
      status: "Catalog-derived flow-limiting gasket candidate",
      note: "按 FUJIKIN UJR 限流垫片订购码和 VIGOUR 通配孔径型号生成；孔径、材质和尺寸需结合双方样本复核。",
      productLabel: "Flow-limiting gasket",
      variantCode: `NI-DM-${orifice}`,
      variantLabel: `Nickel flow-limiting gasket, ${orifice} orifice`,
      materialMatched: true,
      treatmentMatched: true,
      targetMaterialLabel: "Nickel",
      specialFeatureMatched: true,
      specialFeatureLabel: `Flow-limiting orifice ${orifice}`,
      targetFeatureLabel: `${item.vigourModel}-DM-${orifice}`,
      dimensionConfirmation: true
    }))
}

function swagelokVcrMaterialAlias(input) {
  const normalized = normalizeModelText(input)
  const explicitMaterial = normalized.match(/^(316L|316SS|316)-(\d+-(?:H?VCR)-.+)$/)
  if (explicitMaterial) {
    return {
      canonicalModel: `SS-${explicitMaterial[2]}`,
      inputMaterialCode: explicitMaterial[1]
    }
  }

  const missingMaterial = normalized.match(/^(\d+-(?:H?VCR)-.+)$/)
  if (!missingMaterial) return null
  return {
    canonicalModel: `SS-${missingMaterial[1]}`,
    inputMaterialCode: ""
  }
}

function deriveSwagelokVcrMaterialAliasItems(input, searchIndex) {
  const alias = swagelokVcrMaterialAlias(input)
  if (!alias) return []

  return (searchIndex.exact[alias.canonicalModel] || [])
    .filter((item) => (
      item.brand === "Swagelok"
      && normalizeModelText(item.sourceModel) === alias.canonicalModel
      && item.vigourModel
      && !item.noMatch
    ))
    .map((item) => {
      const inheritedMissingParameters = inferredMissingParameters(item).filter((parameter) => parameter !== "材质")
      const missingParameters = [...new Set([...inheritedMissingParameters, "材质"])]
      const materialAction = "请确认普通316不锈钢材质及原厂订购前缀"
      const inheritedAction = item.nextAction
        || (inheritedMissingParameters.length ? `请确认${inheritedMissingParameters.join("、")}` : "")
      return {
        ...item,
        swagelokMaterialAlias: true,
        inputMaterialCode: alias.inputMaterialCode,
        missingParameters,
        salesStatus: "needs_confirmation",
        nextAction: inheritedAction ? `${inheritedAction}；${materialAction}` : materialAction,
        reviewKindText: "结构匹配 · 材质待确认"
      }
    })
}

function exactItemsForInput(input, searchIndex) {
  const normalized = normalizeModelText(input)
  const directItems = searchIndex.exact[normalized] || []
  if (directItems.length) return directItems
  const relaxedItems = safeRelaxedExactItemsForInput(input, searchIndex)
  if (relaxedItems.length) return relaxedItems
  const guardedItems = (searchIndex.catalogNoMatchExact || {})[normalized] || []
  if (guardedItems.length) return guardedItems
  const swagelokMaterialAliasItems = deriveSwagelokVcrMaterialAliasItems(input, searchIndex)
  if (swagelokMaterialAliasItems.length) return swagelokMaterialAliasItems
  const unilokSlFinishAliasItems = deriveUnilokSlFinishAliasItems(input, searchIndex)
  if (unilokSlFinishAliasItems.length) return unilokSlFinishAliasItems
  const fitokBasicItems = aggregateFitokBasicOrderingItems(input, searchIndex.fitokBasicExact[normalized] || [])
  if (fitokBasicItems.length) return fitokBasicItems
  const unilokBaseItems = aggregateUnilokBaseOrderingItems(input, searchIndex.unilokBaseExact[normalized] || [])
  if (unilokBaseItems.length) return unilokBaseItems
  const fujikinFlowLimitingItems = deriveFujikinFlowLimitingGasketItems(input, searchIndex)
  if (fujikinFlowLimitingItems.length) return fujikinFlowLimitingItems
  return deriveSwagelokProcessItems(input, searchIndex)
}

function bigrams(value) {
  const text = ` ${value} `
  const result = []
  for (let index = 0; index < text.length - 1; index += 1) {
    result.push(text.slice(index, index + 2))
  }
  return result
}

function similarityScore(input, candidate) {
  if (!input || !candidate) return 0
  if (input === candidate) return 1

  const left = bigrams(input)
  const rightCounts = {}
  bigrams(candidate).forEach((part) => {
    rightCounts[part] = (rightCounts[part] || 0) + 1
  })

  let overlap = 0
  left.forEach((part) => {
    if (!rightCounts[part]) return
    overlap += 1
    rightCounts[part] -= 1
  })

  const dice = (2 * overlap) / (left.length + Object.values(rightCounts).reduce((sum, count) => sum + count, 0) + overlap)
  const prefix = input.slice(0, 3) === candidate.slice(0, 3) ? 0.12 : 0
  const lengthPenalty = Math.min(Math.abs(input.length - candidate.length) / Math.max(input.length, candidate.length), 0.35)
  return Math.min(0.99, Math.max(0, dice + prefix - lengthPenalty))
}

function fuzzyCandidatesForInput(input, searchIndex) {
  if (hasUnsupportedSwagelokProcess(input)) return { items: [], crossSeries: false }
  if (exactItemsForInput(input, searchIndex).some((item) => item.noMatch || !item.vigourModel)) {
    return { items: [], crossSeries: false }
  }

  const normalized = normalizeModelText(input)
  const rankCandidates = (entries, threshold) => entries
    .map(({ key, item, scope }) => ({
      item,
      scope,
      score: similarityScore(normalized, key)
    }))
    .filter((entry) => entry.score >= threshold)
    .reduce((best, entry) => {
      const identity = `${entry.item.brand}:${entry.item.sourceModel}:${entry.item.vigourModel || ""}`
      if (!best[identity] || entry.score > best[identity].score) {
        best[identity] = entry
      }
      return best
    }, {})

  const sortCandidates = (entries) => Object.values(entries)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.item.sourceModel.length - right.item.sourceModel.length
    })
    .slice(0, 3)

  const safeEntries = searchIndex.models.filter(({ key }) => isSafeFuzzyTextPair(input, key))
  const safeCandidates = sortCandidates(rankCandidates(safeEntries, 0.8))
  if (safeCandidates.length && candidatesShareOneFamily(safeCandidates)) {
    return { items: safeCandidates, crossSeries: false, blocked: false }
  }

  const inputStem = normalized.replace(/-/g, "").slice(0, 2)
  const unsafeNearCandidates = sortCandidates(rankCandidates(
    searchIndex.models.filter(({ key }) => key.replace(/-/g, "").startsWith(inputStem)),
    0.68
  ))

  if (safeCandidates.length || unsafeNearCandidates.length) {
    return {
      items: [],
      crossSeries: false,
      blocked: true,
      reason: "型号存在相近记录，但产品类型、尺寸或关键订购字段不完整/不一致，已停止自动推荐"
    }
  }

  return { items: [], crossSeries: false, blocked: false }
}

function buildSearchIndex(brand) {
  const exact = {}
  const relaxedExact = {}
  const fitokBasicExact = {}
  const unilokBaseExact = {}
  const models = []
  const seenModels = {}
  const catalogNoMatchExact = {}

  allFittingMappings
    .filter((item) => (!brand || item.brand === brand) && item.searchEligible !== false)
    .forEach((item) => {
      modelMatchKeys(item.brand, item.sourceModel).forEach((key) => {
        if (!exact[key]) exact[key] = []
        exact[key].push(item)

        const relaxedKey = key.replace(/\./g, "")
        if (!relaxedExact[relaxedKey]) relaxedExact[relaxedKey] = []
        relaxedExact[relaxedKey].push(item)
      })
      fitokBasicOrderingKeys(item).forEach((key) => {
        if (!fitokBasicExact[key]) fitokBasicExact[key] = []
        fitokBasicExact[key].push(item)
      })
      unilokBaseOrderingKeys(item).forEach((key) => {
        if (!unilokBaseExact[key]) unilokBaseExact[key] = []
        unilokBaseExact[key].push(item)
      })
      const identity = `${item.brand}:${item.sourceModel}`
      if (!seenModels[identity] && item.vigourModel && !item.noMatch) {
        seenModels[identity] = true
        modelMatchKeys(item.brand, item.sourceModel).forEach((key) => {
          models.push({
            key,
            item
          })
        })
      }
    })

  Object.entries(catalogNoMatchModelsByBrand || {}).forEach(([guardBrand, sourceModels]) => {
    if (brand && guardBrand !== brand) return
    sourceModels.forEach((sourceModel) => {
      const item = {
        brand: guardBrand,
        sourceModel,
        productLabel: "目录实录型号",
        productName: "目录实录型号",
        statusText: "暂无 VIGOUR 精确型号",
        noteText: "原厂目录存在该型号，但当前 VIGOUR 目录没有已验证的精确对应，禁止模糊替代。",
        directoryStatus: "无目录精确型号",
        sourceAuditStatus: "catalog_exact_no_target",
        sourceEvidenceStatus: "catalog_exact",
        sourceCatalog: `${guardBrand} tube-fitting catalog`,
        dataSource: "catalog no-match guard",
        noMatch: true,
        selectionEligible: false,
        searchEligible: true,
        catalogGuard: true
      }
      modelMatchKeys(guardBrand, sourceModel).forEach((key) => {
        if (!catalogNoMatchExact[key]) catalogNoMatchExact[key] = []
        catalogNoMatchExact[key].push(item)
      })
    })
  })

  return { exact, relaxedExact, fitokBasicExact, unilokBaseExact, catalogNoMatchExact, models }
}

module.exports = {
  normalizeRelaxedModelText,
  modelMatchKeys,
  exactItemsForInput,
  fuzzyCandidatesForInput,
  buildSearchIndex,
  similarityScore,
  hasUnsupportedSwagelokProcess
}
