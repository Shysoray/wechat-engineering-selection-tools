const { auditCatalogSource } = require("./aptech_catalog_source")

const sourcePath = process.argv[2]
const result = auditCatalogSource(sourcePath)

console.log(`APTech 目录文本：${result.sourcePath}`)
console.log(`SHA-256：${result.sha256}`)
console.log(`页数：${result.pageCount}`)
console.log(`减压阀系列：${result.regulatorSeriesCount}`)
console.log(`隔膜阀系列：${result.diaphragmSeriesCount}`)
console.log(`孔位拓扑表：${result.portTopologyCount}`)

result.warnings.forEach((warning) => console.warn(`WARN ${warning}`))
result.errors.forEach((error) => console.error(`ERROR ${error}`))

if (!result.ok) process.exitCode = 1
