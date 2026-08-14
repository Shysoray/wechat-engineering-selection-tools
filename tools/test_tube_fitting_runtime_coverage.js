const fs = require("fs")

const { fittingMappings } = require("../packageFitting/fittingDatabase")
const { fujikinVlokSupplementalMappings } = require("../packageFitting/fujikinVlokSupplementalMappings")
const { tubeFittingSupplementalMappings } = require("../packageFitting/tubeFittingSupplementalDatabase")

const allMappings = fittingMappings.concat(fujikinVlokSupplementalMappings, tubeFittingSupplementalMappings)

function normalize(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[‐‑‒–—﹘﹣－]/g, "-")
    .replace(/\s+/g, "")
    .trim()
}

function exactRows(sourceModel, brand) {
  const key = normalize(sourceModel)
  return allMappings.filter((item) => (
    (!brand || item.brand === brand)
    && normalize(item.sourceModel) === key
  ))
}

function expectVigour(sourceModel, brand, expectedVigour) {
  const rows = exactRows(sourceModel, brand)
  const hit = rows.find((item) => item.vigourModel === expectedVigour && !item.noMatch)
  if (!hit) {
    throw new Error(`${brand} ${sourceModel}: expected ${expectedVigour}, got ${JSON.stringify(rows)}`)
  }
  return hit
}

function expectNoVigour(sourceModel, brand) {
  const rows = exactRows(sourceModel, brand)
  if (!rows.length) {
    throw new Error(`${brand} ${sourceModel}: expected a recognized no-match row`)
  }
  if (!rows.every((item) => item.noMatch || !item.vigourModel)) {
    throw new Error(`${brand} ${sourceModel}: expected no usable VIGOUR model, got ${JSON.stringify(rows)}`)
  }
}

[
  ["SS-400-1-2RT", "Swagelok", "SS-VMC-04-R2"],
  ["SS-400-2-4RT", "Swagelok", "SS-VME-04-R4"],
  ["SS-810-P", "Swagelok", "SS-VP-08"],
  ["SS-810-3", "Swagelok", "SS-VUT-08"],
  ["SS-810-9", "Swagelok", "SS-VUE-08"],
  ["SS-1610-1-16RT", "Swagelok", "SS-VMC-16-R16"],
  ["VUWL-12.7-V", "FUJIKIN", "SS-VUE-08"],
  ["UP-08-SS", "UNILOK", "SS-VP-08"],
  ["PG 8 - SS", "JSK", "SS-VP-08"],
  ["D12CP", "TK-Fujikin", "VVR-C12"],
  ["SS-TP-FL8", "FITOK", "SS-VP-08"],
  ["SP - 8", "SUPERLOK", "SS-VP-08"]
].forEach(([sourceModel, brand, expectedVigour]) => {
  expectVigour(sourceModel, brand, expectedVigour)
})

const plug = expectVigour("SS-810-P", "Swagelok", "SS-VP-08")
if (plug.vigourModel.endsWith("-P")) {
  throw new Error("SS-810-P is a tube fitting plug, not a semiconductor process suffix")
}

expectNoVigour("SS-400-3-4TTF", "Swagelok")
expectNoVigour("SS-1610-3-16-8", "Swagelok")

const repositorySource = fs.readFileSync("packageFitting/mappingRepository.js", "utf8")
if (!repositorySource.includes("tubeFittingSupplementalMappings")) {
  throw new Error("packageFitting/mappingRepository.js must include tubeFittingSupplementalMappings in allFittingMappings")
}

console.log("Tube fitting runtime coverage OK")
