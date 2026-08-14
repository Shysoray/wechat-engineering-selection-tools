const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { buildSearchIndex, fuzzyCandidatesForInput }`
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

const { buildSearchIndex, fuzzyCandidatesForInput } = loadPageInternals()
const searchIndex = buildSearchIndex("")

const unsafeInputs = [
  ["FITOK", "6L-WT2-MTB1-MTB12-MTB6"],
  ["FITOK", "6LV-WU2-T16-TB8-F3"],
  ["FITOK", "SS-CM-ML6-NS12"],
  ["FUJIKIN", "UJR-19.05-316LM-PS"],
  ["FUJIKIN", "UJR-JP-9.2-FS9-UP"],
  ["JSK", "W RLE 2 S BA"],
  ["JSK", "TTFB4SBA"],
  ["SUPERLOK", "DM8X4G19-P"],
  ["SUPERLOK", "SMC-1M-6G"],
  ["Swagelok", "SS-60-11-8"],
  ["Swagelok", "316L-1TB7-3"],
  ["TK-Fujikin", "TMC-2M-16N"],
  ["TK-Fujikin", "S16AG19-P"],
  ["TK-Fujikin", "TME-1M-4P"],
  ["UNILOK", "UMC-M106N-SS"],
  ["UNILOK", "UME-M108N-SS"],
  ["UNILOK", "UFC-M108G-SS"]
]

unsafeInputs.forEach(([brand, input]) => {
  const candidates = fuzzyCandidatesForInput(input, searchIndex).items
  if (candidates.length) {
    throw new Error(`${brand} ${input}: hard-field damage must not return fuzzy candidates, got ${JSON.stringify(candidates)}`)
  }
})

console.log("Fitting fuzzy hard-field regression passed")
