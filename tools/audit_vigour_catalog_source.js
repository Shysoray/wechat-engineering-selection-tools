const { auditVigourCatalogSource } = require("./vigour_catalog_source")

const result = auditVigourCatalogSource(process.argv[2])

console.log(`VIGOUR 目录文本：${result.sourcePath}`)
console.log(`SHA-256：${result.sha256}`)
console.log(`页数：${result.pageCount}`)
console.log(`VDV 系列：${result.vdvSeriesCount}`)

console.log(`已结构化订货规则系列：${result.orderingSeriesCount}`)
console.log(`流路拓扑：${result.flowCircuitCount}`)
result.errors.forEach((error) => console.error(`ERROR ${error}`))

if (!result.ok) process.exitCode = 1
