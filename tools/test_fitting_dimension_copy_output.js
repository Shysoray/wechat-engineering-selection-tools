const fs = require("fs")
const path = require("path")
const pageSource = fs.readFileSync(path.resolve("packageFitting/pages/index.js"), "utf8")
const policySource = fs.readFileSync(path.resolve("packageFitting/resultPolicy.js"), "utf8")

for (const column of ["尺寸证据状态", "尺寸差异摘要", "超差项", "证据页码摘要"]) {
  if (!pageSource.includes(column)) throw new Error(`Missing full-copy column: ${column}`)
}
for (const field of ["dimensionEvidenceStatus", "dimensionSummary", "exceededDimensions", "evidencePages"]) {
  if (!policySource.includes(field)) throw new Error(`Missing copy evidence field: ${field}`)
}
if (!policySource.includes("record.dimensionSummary")) {
  throw new Error("Amber sales copy must include the dimension summary")
}

console.log("Fitting dimension copy output contract passed")
