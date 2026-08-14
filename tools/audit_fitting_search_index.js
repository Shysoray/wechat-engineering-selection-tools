const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageInternals() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = `${fs.readFileSync(filename, "utf8")}
module.exports = { allFittingMappings, buildSearchIndex }`
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

function mappingSignature(item) {
  return [
    item.brand,
    item.sourceModel,
    item.vigourModel || item.advisoryModel || "NO_TARGET",
    item.noMatch ? "NO_MATCH" : "MATCH"
  ].join("|")
}

function distinctItems(items) {
  return [...new Map(items.map((item) => [mappingSignature(item), item])).values()]
}

function auditIndexMap(indexMap) {
  return Object.entries(indexMap).flatMap(([key, items]) => {
    const rows = distinctItems(items)
    const brands = new Set(rows.map((item) => item.brand))
    const sources = new Set(rows.map((item) => `${item.brand}|${item.sourceModel}`))
    const targets = new Set(rows.map((item) => (
      item.noMatch ? "NO_MATCH" : item.vigourModel || item.advisoryModel || "NO_TARGET"
    )))

    if (brands.size <= 1 && sources.size <= 1 && targets.size <= 1) return []
    return [{ key, rows, brands, sources, targets }]
  })
}

function summarize(collisions) {
  return {
    total: collisions.length,
    crossBrand: collisions.filter((item) => item.brands.size > 1).length,
    multipleSource: collisions.filter((item) => item.sources.size > 1).length,
    multipleTarget: collisions.filter((item) => item.targets.size > 1).length
  }
}

function formatCollision(collision) {
  return `${collision.key} => ${collision.rows.map(mappingSignature).join(" || ")}`
}

const { allFittingMappings, buildSearchIndex } = loadPageInternals()
const searchIndex = buildSearchIndex("")
const exactCollisions = auditIndexMap(searchIndex.exact)
const relaxedCollisions = auditIndexMap(searchIndex.relaxedExact)

const report = {
  totalMappings: allFittingMappings.length,
  exactKeys: Object.keys(searchIndex.exact).length,
  exact: summarize(exactCollisions),
  relaxedExactKeys: Object.keys(searchIndex.relaxedExact).length,
  relaxedExact: summarize(relaxedCollisions)
}

console.log(JSON.stringify(report, null, 2))

if (process.argv.includes("--details")) {
  relaxedCollisions
    .filter((item) => item.targets.size > 1)
    .forEach((item) => console.log(`RELAXED ${formatCollision(item)}`))
}

const unsafeExactCollisions = exactCollisions.filter((item) => item.targets.size > 1)
if (unsafeExactCollisions.length) {
  throw new Error([
    "Exact search aliases resolve to multiple outcomes:",
    ...unsafeExactCollisions.slice(0, 50).map(formatCollision)
  ].join("\n"))
}

console.log("Fitting exact search-index collision audit passed")
