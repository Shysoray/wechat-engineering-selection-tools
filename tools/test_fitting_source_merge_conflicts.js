const { fittingMappings } = require("../packageFitting/fittingDatabase")
const { fujikinVlokSupplementalMappings } = require("../packageFitting/fujikinVlokSupplementalMappings")
const {
  tubeFittingSupplementalMappings,
  suppressedFujikinVlokDuplicateCount
} = require("../packageFitting/tubeFittingSupplementalDatabase")
const { normalizeModelText } = require("../utils/fittingModelSignature")
const { mergeMappingSources } = require("../packageFitting/mappingRepository")

function mappingIdentity(item) {
  return [
    item.brand || "",
    normalizeModelText(item.sourceModel),
    item.vigourModel || item.advisoryModel || "",
    item.noMatch ? "no-match" : "match"
  ].join("|")
}

if (suppressedFujikinVlokDuplicateCount <= 0) {
  throw new Error("FUJIKIN V-Lok authoritative-source suppression is not active")
}

const seen = new Map()
const duplicates = []
;[
  ["main", fittingMappings],
  ["fujikin-vlok", fujikinVlokSupplementalMappings],
  ["tube-fitting", tubeFittingSupplementalMappings]
].forEach(([source, rows]) => {
  rows.forEach((item) => {
    const identity = mappingIdentity(item)
    if (seen.has(identity)) {
      duplicates.push(`${identity} (${seen.get(identity)} / ${source})`)
      return
    }
    seen.set(identity, source)
  })
})

if (duplicates.length) {
  throw new Error(`Conflicting runtime fitting sources remain:\n${duplicates.slice(0, 20).join("\n")}`)
}

let conflictDetected = false
try {
  mergeMappingSources(
    [{ brand: "TEST", sourceModel: "A-1", vigourModel: "V-1", dimensionConfirmation: false }],
    [{ brand: "TEST", sourceModel: "A-1", vigourModel: "V-1", dimensionConfirmation: true }]
  )
} catch (error) {
  conflictDetected = /Conflicting fitting mapping safety metadata/.test(error.message)
}
if (!conflictDetected) {
  throw new Error("runtime source merge must reject conflicting safety metadata")
}

console.log(`Fitting source merge conflict audit passed; suppressed ${suppressedFujikinVlokDuplicateCount} FUJIKIN V-Lok duplicates`)
