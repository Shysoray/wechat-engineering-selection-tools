const assert = require("assert")

const { CATALOG_METADATA } = require("../pages/aptech/utils/aptechCatalogConstraints")
const { DEFAULT_SOURCE_PATH, auditCatalogSource, parsePageText } = require("./aptech_catalog_source")

const pages = parsePageText("## PDF 第 1 页\nA\n\n## PDF 第 2 页\nB")
assert.strictEqual(pages.size, 2)
assert.strictEqual(pages.get(1), "A")
assert.strictEqual(pages.get(2), "B")

const result = auditCatalogSource(process.argv[2] || DEFAULT_SOURCE_PATH)
assert.strictEqual(result.sha256, CATALOG_METADATA.pageTextSha256)
assert.strictEqual(result.pageCount, CATALOG_METADATA.pageTextPages)
assert.deepStrictEqual(result.errors, [])

console.log(`APTech catalog source audit passed: ${result.regulatorSeriesCount} regulator series, ${result.diaphragmSeriesCount} diaphragm series`)
