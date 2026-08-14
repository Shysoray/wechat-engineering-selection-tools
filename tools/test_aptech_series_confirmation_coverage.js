const searchMappings = require("../pages/aptech/utils/aptechSearchDatabase")
const {
  SERIES_CONFIRMATIONS,
  seriesConfirmation,
  unconfirmedOptionTokens
} = require("../pages/aptech/utils/aptechSeriesConfirmation")

const ids = SERIES_CONFIRMATIONS.map((item) => item.id)
if (new Set(ids).size !== ids.length) {
  throw new Error("APTech series confirmation ids must be unique")
}

const uncovered = []
searchMappings.forEach((row) => {
  const sourceModel = String(row[1] || "")
  const source = sourceModel.replace(/^WB-/, "").split(/\s+/)[0]
  if (!/^(?:AP|AZ|KT9)/.test(source)) return
  if (!seriesConfirmation(sourceModel, row[2])) uncovered.push(sourceModel)
})

if (uncovered.length) {
  throw new Error(`APTech series confirmation coverage missing: ${uncovered.slice(0, 20).join(", ")}`)
}

for (const input of [
  "AP1001S 2PW FV4 FV4 CUSTOM",
  "AP9030S 2PW FV12 FV12 HR UNKNOWN",
  "AP3125S 2PW MV12 MV12 SPECIAL"
]) {
  if (!unconfirmedOptionTokens(input).length) {
    throw new Error(`${input}: unknown extension token must be reported`)
  }
}

if (unconfirmedOptionTokens("AP1225S 2PW FV8 MV8 HR PS25", { allowPs25: true }).length) {
  throw new Error("confirmed AP1225 PS25 token must not be reported as unknown")
}

console.log(`APTech series confirmation coverage passed: ${SERIES_CONFIRMATIONS.length} explicit policy rows`)
