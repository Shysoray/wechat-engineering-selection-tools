const fs = require("fs")
const { fittingMappings } = require("../packageFitting/fittingDatabase")
const { fujikinVlokSupplementalMappings } = require("../packageFitting/fujikinVlokSupplementalMappings")
const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")

const catalogPages = JSON.parse(fs.readFileSync("tmp/catalog_extract/VIGOUR_VUPS.json", "utf8"))
const tubeCatalogText = fs.readFileSync("tmp/tube_fitting_audit/pdf_text/vigour.txt", "utf8")
const catalogText = normalize([
  catalogPages.map((page) => page.text || "").join("\n"),
  tubeCatalogText
].join("\n"))

function normalize(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[‐‑‒–—－]/g, "-")
    .replace(/×/g, "X")
    .replace(/\s+/g, "")
}

function stripAllowedOptions(model) {
  let current = String(model || "")
  let changed = true
  while (changed) {
    changed = false
    for (const suffix of ["-SLV", "-BA", "-P"]) {
      if (current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length)
        changed = true
      }
    }
  }
  return current
}

function catalogHas(model) {
  if (!model) return false
  if (catalogText.includes(normalize(model))) return true
  const stripped = stripAllowedOptions(model)
  return stripped !== model && catalogText.includes(normalize(stripped))
}

function isApprovedDerivedTarget(model) {
  return /^VVR-GKR?-G(?:2|4|8|12|16)(?:-NI)?-BL$/.test(model)
}

const missingLengthTargets = []
const unexpectedDerivedTargets = []
const allMappings = fittingMappings.concat(
  fujikinVlokSupplementalMappings,
  tubeFittingSupplementalMappings
)

allMappings.forEach((item) => {
  const targets = String(item.vigourModel || "")
    .split("/")
    .map((target) => target.trim())
    .filter(Boolean)
  if (item.noMatch || !targets.length) return

  targets.forEach((target) => {
    if (catalogHas(target)) return

    if (/-L\d/.test(target)) {
      missingLengthTargets.push(`${item.brand} ${item.sourceModel} -> ${target}`)
      return
    }

    if (!isApprovedDerivedTarget(target)) {
      unexpectedDerivedTargets.push(`${item.brand} ${item.sourceModel} -> ${target}`)
    }
  })
})

if (missingLengthTargets.length) {
  throw new Error(`VIGOUR length targets not listed in catalog:\n${missingLengthTargets.join("\n")}`)
}

if (unexpectedDerivedTargets.length) {
  throw new Error(`Unexpected VIGOUR targets not listed in catalog:\n${unexpectedDerivedTargets.join("\n")}`)
}

console.log("VIGOUR catalog target integrity regression passed")
