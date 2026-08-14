const fs = require("fs")
const path = require("path")
const Module = require("module")

const { normalizeModelText } = require("../utils/fittingModelSignature")
const { mappingFamilyKey } = require("../packageFitting/fuzzySafety")

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

const {
  allFittingMappings,
  buildSearchIndex,
  exactItemsForInput,
  fuzzyCandidatesForInput,
  batchResultForInput
} = loadPageInternals()
const searchIndex = buildSearchIndex("")

const dangerousInputs = [
  "SS-1010--12",
  "D12LG-P",
  "DM12E",
  "6L--FR12-F3",
  "TMC-4-4",
  "SS-CM-FL4-NS",
  "SS-810-1-4R"
]

dangerousInputs.forEach((input, index) => {
  const fuzzy = fuzzyCandidatesForInput(input, searchIndex)
  if (input === "TMC-4-4") {
    if (fuzzy.items.length) {
      throw new Error(`${input}: removed unverified catalog candidate leaked into fuzzy results`)
    }
    const removedResult = batchResultForInput(input, `danger:${index}`, searchIndex)
    if (removedResult.presentationKind !== "missing") {
      throw new Error(`${input}: removed unverified candidate must remain missing: ${JSON.stringify(removedResult)}`)
    }
    return
  }
  if (fuzzy.items.length || !fuzzy.blocked) {
    throw new Error(`${input}: damaged hard fields must be blocked, got ${JSON.stringify(fuzzy)}`)
  }

  const result = batchResultForInput(input, `danger:${index}`, searchIndex)
  if (result.presentationKind !== "missing" || !/关键结构/.test(result.kindText)) {
    throw new Error(`${input}: blocked input needs a clear missing-fields result, got ${JSON.stringify(result)}`)
  }
})

const safeOcr = fuzzyCandidatesForInput("SS-81O-9", searchIndex)
if (!safeOcr.items.some((entry) => entry.item.sourceModel === "SS-810-9")) {
  throw new Error(`safe numeric OCR correction should remain visible, got ${JSON.stringify(safeOcr)}`)
}

function removeProductCharacter(value) {
  const normalized = normalizeModelText(value)
  const preferred = [...normalized].findIndex((char, index) => index > 1 && /[A-Z]/.test(char))
  if (preferred < 0) return ""
  return normalized.slice(0, preferred) + normalized.slice(preferred + 1)
}

const familySamples = new Map()
allFittingMappings
  .filter((item) => item.vigourModel && !item.noMatch)
  .forEach((item) => {
    const family = mappingFamilyKey(item)
    if (!familySamples.has(family)) familySamples.set(family, item)
  })

let mutationCount = 0
for (const item of familySamples.values()) {
  const mutated = removeProductCharacter(item.sourceModel)
  if (!mutated || exactItemsForInput(mutated, searchIndex).length) continue
  const fuzzy = fuzzyCandidatesForInput(mutated, searchIndex)
  if (fuzzy.items.length) {
    throw new Error(
      `${item.brand} ${item.sourceModel}: deleted product character returned ${JSON.stringify(fuzzy.items)}`
    )
  }
  mutationCount += 1
}

if (mutationCount < 200) {
  throw new Error(`Mutation coverage is unexpectedly low: ${mutationCount}`)
}

console.log(`Fitting fuzzy mutation safety passed for ${mutationCount} product-family samples`)
