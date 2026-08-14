const { fittingMappings } = require("../packageFitting/fittingDatabase")

const expected = {
  "UJR-6.35X9.52MS-L33-APN": "HVVR-HG4-TB6-L33",
  "UJR-6.35X9.52N": "HVVR-FN4"
}

Object.entries(expected).forEach(([sourceModel, vigourModel]) => {
  const matches = fittingMappings.filter(
    (item) => item.brand === "FUJIKIN" && item.sourceModel === sourceModel
  )
  if (matches.length !== 1) {
    throw new Error(`${sourceModel}: expected one mapping, received ${matches.length}`)
  }

  const item = matches[0]
  if (item.vigourModel !== vigourModel) {
    throw new Error(`${sourceModel}: expected ${vigourModel}, received ${item.vigourModel}`)
  }
  if (/-(?:APN|APM)(?:-|$)/.test(sourceModel) && item.specialFeatureMatched !== false) {
    throw new Error(`${sourceModel}: APN/APM must require special-feature confirmation`)
  }
  if (!item.dimensionConfirmation) {
    throw new Error(`${sourceModel}: dimensions must require confirmation`)
  }
})

const unsupported = fittingMappings.find(
  (item) => item.brand === "FUJIKIN" && item.sourceModel === "UJR-6.35X9.52MS-L28.5-APM"
)
if (!unsupported || !unsupported.noMatch || unsupported.vigourModel) {
  throw new Error(`UJR-6.35X9.52MS-L28.5-APM: expected special-length no-match guard, got ${JSON.stringify(unsupported)}`)
}

console.log("FUJIKIN high-flow gland regression passed")
