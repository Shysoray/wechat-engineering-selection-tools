const fs = require("fs")
const path = require("path")
const payload = JSON.parse(fs.readFileSync(path.resolve("data/fitting-evidence/mapping-dimension-evidence.json"), "utf8"))
const { dimensionEvidenceStatuses } = require("../packageFitting/fittingEvidencePolicy")

if (payload.schemaVersion !== 1 || payload.records.length !== 14167) {
  throw new Error(`Unexpected mapping evidence envelope: ${JSON.stringify(payload.summary)}`)
}
const identities = new Set()
payload.records.forEach((record) => {
  for (const field of ["evidenceId", "brand", "sourceModel", "familyRule", "status", "reason"]) {
    if (!record[field]) throw new Error(`Missing ${field}: ${JSON.stringify(record)}`)
  }
  if (!dimensionEvidenceStatuses.has(record.status)) throw new Error(`Invalid status: ${record.status}`)
  if (!Array.isArray(record.comparisons) || !Array.isArray(record.evidencePages)) {
    throw new Error(`Invalid evidence arrays: ${record.evidenceId}`)
  }
  if (identities.has(record.evidenceId)) throw new Error(`Duplicate evidence ID: ${record.evidenceId}`)
  identities.add(record.evidenceId)
  if (record.status === "within_tolerance" && (
    !record.comparisons.length || record.comparisons.some((item) => item.required && !item.matched)
  )) throw new Error(`Unsafe green evidence: ${record.evidenceId}`)
})

console.log("Fitting dimension evidence schema passed")
