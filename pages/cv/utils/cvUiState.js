const {
  pressureUnits,
  gasFlowUnits,
  liquidFlowUnits,
  temperatureUnits,
  gasMediaOptions,
  liquidMediaOptions
} = require("./cvCalculator")

const DEFAULT_CV_UNITS = {
  pressureUnit: "barA", pressureUnitIndex: 1,
  gasFlowUnit: "stdLMin", gasFlowUnitIndex: 1,
  liquidFlowUnit: "lMin", liquidFlowUnitIndex: 2,
  temperatureUnit: "c", temperatureUnitIndex: 0
}

function normalizePair(target, options, valueKey, indexKey, fallbackValue) {
  const restoredIndex = options.findIndex((option) => option.value === target[valueKey])
  const fallbackIndex = options.findIndex((option) => option.value === fallbackValue)
  const index = restoredIndex >= 0 ? restoredIndex : fallbackIndex
  target[valueKey] = options[index].value
  target[indexKey] = index
}

function normalizeCvUnits(form) {
  const normalized = { ...(form || {}) }
  normalizePair(normalized, pressureUnits, "pressureUnit", "pressureUnitIndex", "barA")
  normalizePair(normalized, gasFlowUnits, "gasFlowUnit", "gasFlowUnitIndex", "stdLMin")
  normalizePair(normalized, liquidFlowUnits, "liquidFlowUnit", "liquidFlowUnitIndex", "lMin")
  normalizePair(normalized, temperatureUnits, "temperatureUnit", "temperatureUnitIndex", "c")
  return normalized
}

function normalizeMediaIndex(options, index) {
  if (index === -1) return -1
  return optionForIndex(options, index) ? index : -1
}

function normalizeCvMedia(form) {
  const normalized = { ...(form || {}) }
  const gasMediaIndex = normalizeMediaIndex(gasMediaOptions, normalized.gasMediaIndex)
  const liquidMediaIndex = normalizeMediaIndex(liquidMediaOptions, normalized.liquidMediaIndex)
  const gasIndexChanged = gasMediaIndex !== normalized.gasMediaIndex
  const liquidIndexChanged = liquidMediaIndex !== normalized.liquidMediaIndex

  normalized.gasMediaIndex = gasMediaIndex
  normalized.liquidMediaIndex = liquidMediaIndex
  if ((normalized.mediaType === "gas" && gasIndexChanged) ||
      (normalized.mediaType === "liquid" && liquidIndexChanged)) {
    normalized.sg = ""
  }

  return { cvTool: normalized, mediaIndexChanged: gasIndexChanged || liquidIndexChanged }
}

function sameNumber(left, right) {
  const a = Number(left)
  const b = Number(right)
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9
}

function optionForIndex(options, index) {
  return Number.isInteger(index) && index >= 0 && index < options.length ? options[index] : null
}

function buildCvResultContext(form) {
  const isGas = form.mediaType === "gas"
  const options = isGas ? gasMediaOptions : liquidMediaOptions
  const index = isGas ? form.gasMediaIndex : form.liquidMediaIndex
  const medium = optionForIndex(options, index)
  const sgDisplay = String(form.sg === undefined ? "" : form.sg).trim()
  const isCustomSg = Boolean(medium) && !sameNumber(sgDisplay, medium.sg)
  const mediaDisplay = medium
    ? isCustomSg
      ? `${medium.label} · 自定义 SG ${sgDisplay}`
      : `${medium.label} · ${isGas ? "GAS" : "LIQUID"}`
    : isGas ? "自定义气体" : "自定义液体"
  const temperatureOption = temperatureUnits.find((option) => option.value === form.temperatureUnit)
  return {
    mediaDisplay,
    mediaTypeLabel: isGas ? "GAS" : "LIQUID",
    sgDisplay,
    isCustomSg,
    isGas,
    temperatureDisplay: isGas && form.temperature !== ""
      ? `${form.temperature} ${temperatureOption ? temperatureOption.label : ""}`.trim()
      : ""
  }
}

module.exports = {
  DEFAULT_CV_UNITS,
  normalizeCvUnits,
  normalizeCvMedia,
  optionForIndex,
  buildCvResultContext
}
