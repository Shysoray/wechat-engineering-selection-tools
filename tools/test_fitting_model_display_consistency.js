const {
  getDisplayModelLabel,
  modelOptionsForBrand
} = require("../packageFitting/mappingRepository")
const { enrichResult } = require("../packageFitting/resultPolicy")

const rawModel = "UJL-6.35M-AW-S#T"
const expectedLabel = "UJL-6.35M-AW-S"
const item = {
  brand: "FUJIKIN",
  sourceModel: rawModel,
  vigourModel: "VMW-UE4"
}

const options = modelOptionsForBrand([item], item.brand)
const result = enrichResult(item, [])

if (getDisplayModelLabel(item.brand, rawModel) !== expectedLabel) {
  throw new Error("FUJIKIN public display normalization changed unexpectedly")
}
if (options.length !== 1 || options[0].value !== rawModel || options[0].label !== expectedLabel) {
  throw new Error(`selector must retain the raw value and expose the normalized label: ${JSON.stringify(options)}`)
}
if (result.sourceModel !== rawModel || result.sourceModelText !== expectedLabel) {
  throw new Error(`result must retain the raw model and share the selector label: ${JSON.stringify(result)}`)
}
if (getDisplayModelLabel("Swagelok", "SS-4-VCR-2") !== "SS-4-VCR-2") {
  throw new Error("display normalization must not rewrite unrelated brands")
}

console.log("Fitting model display consistency passed")
