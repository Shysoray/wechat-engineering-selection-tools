const { fittingMappings } = require("../packageFitting/fittingDatabase")

const expected = {
  "UJR-6.35MS-L28-AW": "VVR-FG4-TB4",
  "UJR-6.35MS-L28-AW-316LM": "VVR-FG4-TB4-SLV",
  "UJR-9.52MS-L28.5-AW": "VVR-FG8-TB6",
  "UJR-9.52MS-L28.5-AW-316LM": "VVR-FG8-TB6-SLV",
  "UJR-12.7MS-L28.5-AW": "VVR-FG8-TB8",
  "UJR-12.7MS-L28.5-AW-316LM": "VVR-FG8-TB8-SLV"
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
  if (/^VVR-MG/.test(item.vigourModel)) {
    throw new Error(`${sourceModel}: female/short gland must not map to male gland ${item.vigourModel}`)
  }
})

console.log("FUJIKIN short/female gland family regression passed")
