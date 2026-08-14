const { brandFields, statusTexts, noteTexts, fittingMappings } = require("./fittingDatabase")
const { fujikinVlokSupplementalMappings } = require("./fujikinVlokSupplementalMappings")
const {
  tubeFittingSupplementalMappings,
  catalogNoMatchModelsByBrand
} = require("./tubeFittingSupplementalDatabase")
const { normalizeModelText } = require("../utils/fittingModelSignature")
const { normalizeDimensionEvidence } = require("./fittingEvidencePolicy")
const { getDimensionEvidence } = require("../utils/fittingDimensionEvidence")
const { mappingEvidenceKey } = require("./fittingEvidenceKeys")

const defaultSelection = {
  brand: "",
  materialCode: "",
  vcrCode: "",
  connectionCode: "",
  tubeCode: "",
  seriesCode: "",
  productCode: "",
  sizeCode: "",
  finishCode: "",
  variantCode: "",
  treatmentCode: "",
  processCode: "",
  sourceModel: ""
}

function mappingMergeIdentity(item) {
  return [
    item.brand || "",
    normalizeModelText(item.sourceModel),
    item.vigourModel || item.advisoryModel || "",
    item.noMatch ? "no-match" : "match"
  ].join("|")
}

function mappingSafetyMetadata(item) {
  return JSON.stringify({
    noMatch: Boolean(item.noMatch),
    advisoryModel: item.advisoryModel || "",
    materialMatched: item.materialMatched,
    treatmentMatched: item.treatmentMatched,
    finishMatched: item.finishMatched,
    specialFeatureMatched: item.specialFeatureMatched,
    dimensionConfirmation: Boolean(item.dimensionConfirmation),
    salesStatus: item.salesStatus || "",
    missingParameters: [...(item.missingParameters || [])].sort()
  })
}

function mergeMappingSources(...sources) {
  const seen = new Map()
  const merged = []
  sources.forEach((source) => {
    source.forEach((item) => {
      const identity = mappingMergeIdentity(item)
      if (seen.has(identity)) {
        if (mappingSafetyMetadata(seen.get(identity)) !== mappingSafetyMetadata(item)) {
          throw new Error(`Conflicting fitting mapping safety metadata: ${identity}`)
        }
        return
      }
      seen.set(identity, item)
      merged.push(item)
    })
  })
  return merged
}

const allFittingMappings = mergeMappingSources(
  fittingMappings,
  fujikinVlokSupplementalMappings,
  tubeFittingSupplementalMappings
).map((item) => normalizeDimensionEvidence({
  ...item,
  ...(getDimensionEvidence(mappingEvidenceKey(item)) || {})
}))

function getBrandFields(brand) {
  return brandFields[brand] || []
}

function uniqueOptions(items, field) {
  const seen = Object.create(null)
  return items
    .filter((item) => item[field])
    .map((item) => ({
      value: item[field],
      label: `${item[field]}${item[`${field.replace("Code", "")}Label`] ? ` - ${item[`${field.replace("Code", "")}Label`]}` : ""}`
    }))
    .filter((option) => {
      if (seen[option.value]) return false
      seen[option.value] = true
      return true
    })
}

function getDisplayModelLabel(brand, sourceModel) {
  if (brand !== "FUJIKIN") return sourceModel
  return sourceModel
    .replace(/-S#T(?=-|$)/g, "-S")
    .replace(/-(?:APN|APM)(?=-|$)/g, "")
}

const getSelectorModelLabel = getDisplayModelLabel

function modelOptionsForBrand(items, brand) {
  return uniqueOptions(items, "sourceModel").map((option) => ({
    ...option,
    label: getDisplayModelLabel(brand, option.value)
  }))
}

function filterMappings(selection, fields, stopField) {
  const stopIndex = fields.findIndex((field) => field.key === stopField)
  return allFittingMappings.filter((item) => {
    if (item.selectionEligible === false) return false
    if (selection.brand && item.brand !== selection.brand) return false
    if (!stopField && selection.sourceModel && item.sourceModel !== selection.sourceModel) return false
    return fields.every((field, index) => {
      if (stopIndex >= 0 && index >= stopIndex) return true
      return !selection[field.key] || item[field.key] === selection[field.key]
    })
  })
}

function getFieldValueText(selection, field) {
  return selection[field.key] || field.placeholder
}

module.exports = {
  statusTexts,
  noteTexts,
  defaultSelection,
  allFittingMappings,
  catalogNoMatchModelsByBrand,
  mappingMergeIdentity,
  mappingSafetyMetadata,
  mergeMappingSources,
  getBrandFields,
  uniqueOptions,
  getDisplayModelLabel,
  getSelectorModelLabel,
  modelOptionsForBrand,
  filterMappings,
  getFieldValueText
}
