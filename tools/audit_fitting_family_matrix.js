const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadAllMappings() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { allFittingMappings }`
  const localRequire = Module.createRequire(filename)
  const testModule = { exports: {} }
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    testModule,
    testModule.exports,
    () => {},
    {}
  )
  return testModule.exports.allFittingMappings
}

function targetFamily(model) {
  const [namespace = "", product = ""] = String(model || "").split("-")
  const family = product.replace(/\d.*$/, "")
  return namespace && family ? `${namespace}-${family}` : model || "NO_TARGET"
}

function sourceFamily(item) {
  const product = item.productCode || item.productLabel || item.productName || "UNKNOWN"
  return `${item.brand}|${product}`
}

function stableProductText(item) {
  return [item.productCode, item.productLabel, item.productName]
    .filter(Boolean)
    .join(" / ")
}

const allMappings = loadAllMappings()
const groups = new Map()

allMappings
  .filter((item) => item.vigourModel && !item.noMatch)
  .forEach((item) => {
    const key = sourceFamily(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })

const mixedFamilies = [...groups.entries()].flatMap(([key, items]) => {
  const targetFamilies = new Map()
  items.forEach((item) => {
    const family = targetFamily(item.vigourModel)
    if (!targetFamilies.has(family)) targetFamilies.set(family, [])
    targetFamilies.get(family).push(item)
  })
  if (targetFamilies.size <= 1) return []

  return [{
    key,
    product: stableProductText(items[0]),
    targetFamilies: [...targetFamilies.entries()].map(([family, familyItems]) => ({
      family,
      count: familyItems.length,
      samples: familyItems.slice(0, 3).map((item) => `${item.sourceModel} -> ${item.vigourModel}`)
    }))
  }]
})

const report = {
  totalMappings: allMappings.length,
  sourceFamilyCount: groups.size,
  mixedTargetFamilyCount: mixedFamilies.length,
  mixedFamilies
}

console.log(JSON.stringify(report, null, 2))
