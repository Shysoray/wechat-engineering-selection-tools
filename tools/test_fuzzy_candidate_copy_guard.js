const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageDefinition() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = fs.readFileSync(filename, "utf8")
  const localRequire = Module.createRequire(filename)
  let pageDefinition = null
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    { exports: {} },
    {},
    (definition) => { pageDefinition = definition },
    {}
  )
  return pageDefinition
}

function validateInput(pageDefinition, batchInput) {
  const page = {
    data: { batchInput },
    setData(next) {
      this.data = { ...this.data, ...next }
    }
  }
  pageDefinition.refreshBatchValidation.call(page)
  return page.data.batchResults[0]
}

const pageDefinition = loadPageDefinition()
const fuzzy = validateInput(pageDefinition, "SS-81O-9")
if (fuzzy.kind !== "candidate" || !fuzzy.candidates.length) {
  throw new Error(`expected a visible fuzzy candidate, got ${JSON.stringify(fuzzy)}`)
}
if (fuzzy.candidates.some((candidate) => candidate.copyAllowed !== false)) {
  throw new Error(`fuzzy candidates must not be copyable: ${JSON.stringify(fuzzy.candidates)}`)
}
if (fuzzy.candidates.some((candidate) => candidate.reviewCopyAllowed !== false)) {
  throw new Error(`fuzzy candidates must not expose the review-copy action: ${JSON.stringify(fuzzy.candidates)}`)
}
if (!fuzzy.candidates.every((candidate) => candidate.matchWarnings.some((warning) => /仅供核对/.test(warning.text)))) {
  throw new Error(`fuzzy candidates must explain that they are confirmation-only: ${JSON.stringify(fuzzy.candidates)}`)
}

const exact = validateInput(pageDefinition, "SS-4-VCR-2-GR-VS")
if (
  exact.kind !== "exact"
  || exact.presentationKind !== "candidate"
  || exact.candidates.some((candidate) => candidate.copyAllowed !== false)
  || exact.candidates.some((candidate) => candidate.dimensionEvidenceStatus !== "needs_manual_review")
) {
  throw new Error(`exact source hits without dimension evidence must remain amber: ${JSON.stringify(exact)}`)
}

console.log("Fuzzy candidate copy guard regression passed")
