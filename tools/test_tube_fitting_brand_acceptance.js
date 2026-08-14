const fs = require("fs")
const path = require("path")
const Module = require("module")

const { fittingMappings } = require("../packageFitting/fittingDatabase")
const { fujikinVlokSupplementalMappings } = require("../packageFitting/fujikinVlokSupplementalMappings")
const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")
const { normalizeModelText } = require("../utils/fittingModelSignature")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { allFittingMappings, buildSearchIndex, exactItemsForInput, fuzzyCandidatesForInput, batchResultForInput }`
  const localRequire = Module.createRequire(filename)
  const testModule = { exports: {} }
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    testModule,
    testModule.exports,
    () => {},
    {}
  )
  return testModule.exports
}

const requiredBrands = ["Swagelok", "UNILOK", "JSK", "TK-Fujikin", "FITOK", "SUPERLOK", "FUJIKIN"]
const counts = requiredBrands.reduce((summary, brand) => {
  const rows = tubeFittingSupplementalMappings
    .concat(brand === "FUJIKIN" ? fujikinVlokSupplementalMappings : [])
    .filter((item) => item.brand === brand)
  summary[brand] = {
    total: rows.length,
    usable: rows.filter((item) => item.vigourModel && !item.noMatch).length,
  }
  return summary
}, {})

const missingBrands = requiredBrands.filter((brand) => !counts[brand].total)
if (missingBrands.length) {
  throw new Error(`Missing tube fitting supplemental brands: ${missingBrands.join(", ")}`)
}

const unusableBrands = requiredBrands
  .filter((brand) => brand !== "Swagelok")
  .filter((brand) => counts[brand].usable < (brand === "TK-Fujikin" ? 40 : 100))
if (unusableBrands.length) {
  throw new Error(`Unexpectedly low usable mappings: ${JSON.stringify(counts)}`)
}

const {
  allFittingMappings,
  buildSearchIndex,
  exactItemsForInput,
  fuzzyCandidatesForInput,
  batchResultForInput
} = loadPageInternals()
const searchIndex = buildSearchIndex("")

const exactCases = [
  ["Swagelok", "SS-400-1-2RT", "SS-VMC-04-R2"],
  ["Swagelok", "SS-810-P", "SS-VP-08"],
  ["Swagelok", "SS-200-R-4", "SS-VTO-02-TB04"],
  ["Swagelok", "SS-400-R-4", "SS-VTO-04-TB04"],
  ["UNILOK", "UMC-0404N-SS", "SS-VMC-04-M4"],
  ["UNILOK", "UEU-08-SS", "SS-VUE-08"],
  ["UNILOK", "UUT-08-SS", "SS-VUT-08"],
  ["UNILOK", "UP-08-SS", "SS-VP-08"],
  ["UNILOK", "CMTB-04-SL-EP", "VMW-TB4"],
  ["UNILOK", "CMC-04-SL-EP", "VMW-CU4"],
  ["UNILOK", "CFN-08-SL", "VVR-FN8"],
  ["UNILOK", "CHFN-04-SL", "HVVR-FN4"],
  ["UNILOK", "CHMN-04-SL", "HVVR-MN4"],
  ["JSK", "MC 4 - 4N - SS", "SS-VMC-04-M4"],
  ["JSK", "UE 8 - SS", "SS-VUE-08"],
  ["JSK", "UT 8 - SS", "SS-VUT-08"],
  ["JSK", "PG 8 - SS", "SS-VP-08"],
  ["TK-Fujikin", "D12ALG19", "VVR-MG12-TB12-SLV"],
  ["TK-Fujikin", "D12CP", "VVR-C12"],
  ["TK-Fujikin", "D12E6", "VMW-UE12-SLV"],
  ["TK-Fujikin", "D12FN", "VVR-FN12"],
  ["FITOK", "SS-CM-FL4-NS4", "SS-VMC-04-M4"],
  ["FITOK", "SS-LU-FL8", "SS-VUE-08"],
  ["FITOK", "SS-TTT-FL8", "SS-VUT-08"],
  ["FITOK", "SS-TP-FL8", "SS-VP-08"],
  ["SUPERLOK", "SMC - 4 - 4N", "SS-VMC-04-M4"],
  ["SUPERLOK", "SUE - 8", "SS-VUE-08"],
  ["SUPERLOK", "SUT - 8", "SS-VUT-08"],
  ["SUPERLOK", "SP - 8", "SS-VP-08"],
  ["FUJIKIN", "VUWH-6.35BN-T/C-V", "SS-VMC-04-M4"],
  ["FUJIKIN", "VUWH-6.35BN-V", "SS-VMC-04-M4"],
  ["FUJIKIN", "VUWL-12.7-V", "SS-VUE-08"],
  ["FUJIKIN", "VUWT-12.7-V", "SS-VUT-08"],
  ["FUJIKIN", "VUWJP-12.7-V", "SS-VP-08"],
]

exactCases.forEach(([brand, sourceModel, expectedVigour]) => {
  const rows = exactItemsForInput(sourceModel, searchIndex)
  const hit = rows.find((item) => item.brand === brand && item.vigourModel === expectedVigour && !item.noMatch)
  if (!hit) {
    throw new Error(`${brand} ${sourceModel}: expected ${expectedVigour}, got ${JSON.stringify(rows)}`)
  }
})

;["CFN-08-SL", "CHFN-04-SL", "CHMN-04-SL"].forEach((sourceModel) => {
  const rows = exactItemsForInput(sourceModel, searchIndex)
  const hit = rows.find((item) => item.brand === "UNILOK" && item.vigourModel && !item.noMatch)
  if (!hit || !hit.dimensionConfirmation || hit.dimensionEvidenceStatus !== "needs_manual_review") {
    throw new Error(`UNILOK nut/accessory ${sourceModel} must remain amber until its dimensions are established: ${JSON.stringify(rows)}`)
  }
})

const runtimeIdentities = new Set()
allFittingMappings.forEach((item) => {
  const identity = [
    item.brand,
    normalizeModelText(item.sourceModel),
    item.vigourModel || item.advisoryModel || "",
    item.noMatch ? "no-match" : "match"
  ].join("|")
  if (runtimeIdentities.has(identity)) {
    throw new Error(`Duplicate runtime mapping identity: ${identity}`)
  }
  runtimeIdentities.add(identity)
})

const rowsBySource = new Map()
allFittingMappings.forEach((item) => {
  const key = normalizeModelText(item.sourceModel)
  if (!rowsBySource.has(key)) rowsBySource.set(key, [])
  rowsBySource.get(key).push(item)
})

const expectedTone = {
  exact: "success",
  candidate: "warning",
  missing: "neutral"
}

let auditedInputCount = 0
rowsBySource.forEach((rows, input) => {
  const result = batchResultForInput(input, `audit:${auditedInputCount}:${input}`, searchIndex)
  const presentationKind = result.presentationKind || result.kind
  const hasRecognizedTarget = rows.some((item) => (
    (item.vigourModel && !item.noMatch) || item.advisoryModel
  ))
  auditedInputCount += 1

  if (hasRecognizedTarget && presentationKind === "missing") {
    throw new Error(`Recognized target shown as missing: ${input}`)
  }
  if (!hasRecognizedTarget && presentationKind !== "missing") {
    throw new Error(`No-target input shown as ${presentationKind}: ${input}`)
  }
  if (result.statusTone !== expectedTone[presentationKind]) {
    throw new Error(`Status tone mismatch for ${input}: ${presentationKind}/${result.statusTone}`)
  }
  if (presentationKind === "exact" && result.candidates.some((candidate) => !candidate.copyAllowed)) {
    throw new Error(`Exact success contains unresolved candidate: ${input}`)
  }

  const candidateKeys = result.candidates.map((candidate) => candidate.candidateKey)
  if (candidateKeys.some((key) => !key) || new Set(candidateKeys).size !== candidateKeys.length) {
    throw new Error(`Candidate keys are missing or duplicated: ${input}`)
  }
})

if (auditedInputCount < 10000) {
  throw new Error(`Unexpectedly small full-library audit: ${auditedInputCount}`)
}

const fuzzyCases = [
  ["JSK", "MC4-4N-SS", "MC 4 - 4N - SS"],
  ["SUPERLOK", "SMC-4-4N", "SMC - 4 - 4N"],
]

const blockedIncompleteCases = [
  ["FITOK", "SS-CM-FL4-NS"],
]

const catalogExcludedCases = [
  ["TK-Fujikin", "TMC-4-4"]
]

const suffixAliasCases = [
  ["UNILOK", "UMC-0404N", "SS-VMC-04-M4"],
  ["JSK", "MC 4 - 4N", "SS-VMC-04-M4"],
]

suffixAliasCases.forEach(([brand, input, expectedVigour]) => {
  const rows = exactItemsForInput(input, searchIndex)
  const hit = rows.find((item) => item.brand === brand && item.vigourModel === expectedVigour && !item.noMatch)
  if (!hit) {
    throw new Error(`${brand} suffix alias ${input}: expected ${expectedVigour}, got ${JSON.stringify(rows)}`)
  }
})

const unilokMissingMaterialFinishRows = exactItemsForInput("CSGS-0806", searchIndex)
if (
  unilokMissingMaterialFinishRows.length !== 1
  || unilokMissingMaterialFinishRows[0].vigourModel !== "VVR-FG8-TB6-L15"
  || unilokMissingMaterialFinishRows[0].canonicalSourceModel !== "CSGS-0806-SM-EP"
  || !unilokMissingMaterialFinishRows.every((item) => item.unilokBaseOrderingAlias && item.salesStatus === "needs_confirmation")
) {
  throw new Error(`UNILOK missing material/finish alias CSGS-0806 invalid: ${JSON.stringify(unilokMissingMaterialFinishRows)}`)
}

const unilokBaseKeys = new Set()
fittingMappings
  .filter((item) => item.brand === "UNILOK")
  .forEach((item) => {
    const base = item.sourceModel
      .replace(/-(?:SM|DM)-(?:EP|BA)$/, "")
      .replace(/-(?:SL|NI)$/, "")
    if (base !== item.sourceModel) unilokBaseKeys.add(base)
  })

const missingUnilokBaseKeys = [...unilokBaseKeys].filter((base) => {
  const rows = exactItemsForInput(base, searchIndex)
  return !rows.some((item) => item.brand === "UNILOK" && item.unilokBaseOrderingAlias && item.salesStatus === "needs_confirmation")
})

if (missingUnilokBaseKeys.length) {
  throw new Error(`UNILOK base ordering aliases missing: ${missingUnilokBaseKeys.slice(0, 20).join(", ")}`)
}

const missingUnilokSlFinishAliases = fittingMappings
  .filter((item) => item.brand === "UNILOK" && item.vigourModel && !item.noMatch && /-SM-(?:EP|BA)$/.test(item.sourceModel))
  .map((item) => ({
    alias: item.sourceModel.replace("-SM-", "-SL-"),
    canonical: item.sourceModel,
    expectedVigour: item.vigourModel
  }))
  .filter(({ alias, expectedVigour }) => {
    const rows = exactItemsForInput(alias, searchIndex)
    return !rows.some((item) => item.brand === "UNILOK" && item.unilokSlFinishAlias && item.vigourModel === expectedVigour)
  })

if (missingUnilokSlFinishAliases.length) {
  throw new Error(`UNILOK SL finish aliases missing: ${JSON.stringify(missingUnilokSlFinishAliases.slice(0, 20))}`)
}

const vigourTubeText = fs.readFileSync(path.resolve("tmp/tube_fitting_audit/pdf_text/vigour.txt"), "utf8")
const vigourVtoModels = new Set([...vigourTubeText.matchAll(/SS-VTO-[A-Z0-9]+-TB[A-Z0-9]+/g)].map((match) => match[0]))

function swagelokReducerToVto(model) {
  const match = model.match(/^SS-(\d+)(M0)?-R-(\d+M?)$/)
  if (!match) return ""
  const [, leftRaw, metricMarker, rightRaw] = match
  const leftCode = metricMarker ? `${Number(leftRaw)}M` : leftRaw.padStart(4, "0").slice(0, -2).padStart(2, "0")
  const rightCode = rightRaw.endsWith("M") ? rightRaw : rightRaw.padStart(2, "0")
  return `SS-VTO-${leftCode}-TB${rightCode}`
}

const missingSwagelokVtoReducers = tubeFittingSupplementalMappings
  .filter((item) => item.brand === "Swagelok" && /^SS-\d+(?:M0)?-R-\d+M?$/.test(item.sourceModel))
  .map((item) => ({ sourceModel: item.sourceModel, expectedVigour: swagelokReducerToVto(item.sourceModel) }))
  .filter(({ expectedVigour }) => vigourVtoModels.has(expectedVigour))
  .filter(({ sourceModel, expectedVigour }) => {
    const rows = exactItemsForInput(sourceModel, searchIndex)
    return !rows.some((item) => item.brand === "Swagelok" && item.vigourModel === expectedVigour && !item.noMatch)
  })

if (missingSwagelokVtoReducers.length) {
  throw new Error(`Swagelok VTO reducer mappings missing: ${JSON.stringify(missingSwagelokVtoReducers.slice(0, 20))}`)
}

fuzzyCases.forEach(([brand, input, expectedSource]) => {
  const result = fuzzyCandidatesForInput(input, searchIndex)
  const hit = result.items.find((entry) => entry.item.brand === brand && entry.item.sourceModel === expectedSource)
  if (!hit) {
    throw new Error(`${brand} fuzzy ${input}: expected ${expectedSource}, got ${JSON.stringify(result.items)}`)
  }
})

blockedIncompleteCases.forEach(([brand, input]) => {
  const result = fuzzyCandidatesForInput(input, searchIndex)
  if (result.items.length || !result.blocked) {
    throw new Error(`${brand} incomplete hard fields should be blocked, got ${JSON.stringify(result)}`)
  }
})

catalogExcludedCases.forEach(([brand, input]) => {
  const result = fuzzyCandidatesForInput(input, searchIndex)
  if (result.items.length) {
    throw new Error(`${brand} catalog-unverified input leaked into fuzzy candidates: ${JSON.stringify(result)}`)
  }
})

console.log("Tube fitting brand acceptance OK")
