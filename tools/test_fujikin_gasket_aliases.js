const fs = require("fs")
const path = require("path")
const vm = require("vm")
const { createRequire } = require("module")
const pagePath = path.resolve(__dirname, "../packageFitting/pages/index.js")
const pageRequire = createRequire(pagePath)
const pageCode = fs.readFileSync(pagePath, "utf8")
const sandbox = {
  console,
  require: pageRequire,
  module: { exports: {} },
  exports: {},
  Page() {},
  wx: {}
}

vm.runInNewContext(
  `${pageCode}\nmodule.exports = { buildSearchIndex, exactItemsForInput };`,
  sandbox,
  { filename: pagePath }
)

const { buildSearchIndex, exactItemsForInput } = sandbox.module.exports
const index = buildSearchIndex("")

function assertExact(input, expectedModel) {
  const matches = exactItemsForInput(input, index)
  if (!matches.length) {
    throw new Error(`${input}: expected exact match, received none`)
  }
  const usable = matches.find((item) => item.brand === "FUJIKIN" && item.vigourModel === expectedModel)
  if (!usable) {
    throw new Error(`${input}: expected ${expectedModel}, received ${matches.map((item) => item.vigourModel).join(", ")}`)
  }
}

assertExact("UJR-6.35G-NI-0.5", "VVR-GK-G4-NI-DM-0.5")
assertExact("UJR-6.35G-NI-0.1", "VVR-GK-G4-NI-DM-0.1")
assertExact("UJR-6.35G-NI-0.05", "VVR-GK-G4-NI-DM-0.05")
assertExact("UJR-9.52G-NI-0.5", "VVR-GK-G8-NI-DM-0.5")
assertExact("UJR-6.35G-NI-0", "VVR-GK-G4-NI")
assertExact("UJR-9.52G-NI-0", "VVR-GK-G8-NI")
assertExact("UJR-6.35N#A", "VVR-FN4")

console.log("FUJIKIN gasket alias regression passed")
