const { fittingMappings } = require("../packageFitting/fittingDatabase")

function find(model) {
  const matches = fittingMappings.filter(
    (item) => item.brand === "TK-Fujikin" && item.sourceModel === model
  )
  if (matches.length !== 1) {
    throw new Error(`Expected one TK-Fujikin mapping for ${model}, found ${matches.length}`)
  }
  return matches[0]
}

function assertMapping(model, expected, finishMatched) {
  const item = find(model)
  if (item.vigourModel !== expected) {
    throw new Error(`${model}: expected ${expected}, received ${item.vigourModel}`)
  }
  if (item.finishMatched !== finishMatched) {
    throw new Error(`${model}: unexpected finishMatched=${item.finishMatched}`)
  }
}

const confirmedBa = {
  S4LG10: "VVR-MG4-TB4-L33-BA",
  S4LG6: "VVR-MG4-TB4-L30-BA",
  S4SG10: "VVR-FG4-TB4-L18-BA",
  S4SG6: "VVR-FG4-TB4-L15-BA",
  S6SG6: "VVR-FG8-TB6-L15-BA",
  S8SG10: "VVR-FG8-TB8-L18-BA",
  S8SG6: "VVR-FG8-TB8-L15-BA",
  S8x4SG10: "VVR-FG8-TB8-L18-BA",
  S8x4SG6: "VVR-FG8-TB8-L15-BA"
}

Object.entries(confirmedBa).forEach(([model, expected]) => {
  assertMapping(model, expected, true)
})

const epPairs = {
  "S4LG10-P": "VVR-MG4-TB4-L33",
  "S4LG6-P": "VVR-MG4-TB4-L30",
  "S4SG10-P": "VVR-FG4-TB4-L18",
  "S4SG6-P": "VVR-FG4-TB4-L15",
  "S6SG6-P": "VVR-FG8-TB6-L15",
  "S8SG10-P": "VVR-FG8-TB8-L18",
  "S8SG6-P": "VVR-FG8-TB8-L15",
  "S8x4SG10-P": "VVR-FG8-TB8-L18",
  "S8x4SG6-P": "VVR-FG8-TB8-L15"
}

Object.entries(epPairs).forEach(([model, expected]) => {
  assertMapping(model, expected, true)
})

const doubleMeltBa = {
  D4LG10: "VVR-MG4-TB4-L33-SLV",
  D4LG6: "VVR-MG4-TB4-L30-SLV",
  D4SG10: "VVR-FG4-TB4-L18-SLV",
  D4SG6: "VVR-FG4-TB4-L15-SLV"
}

Object.entries(doubleMeltBa).forEach(([model, expected]) => {
  assertMapping(model, expected, false)
})

assertMapping("S4SG19", "VVR-FG4-TB4-BA", true)

console.log(
  `TK length BA regression passed: ${Object.keys(confirmedBa).length} BA, `
  + `${Object.keys(epPairs).length} EP, ${Object.keys(doubleMeltBa).length} SLV guards`
)
