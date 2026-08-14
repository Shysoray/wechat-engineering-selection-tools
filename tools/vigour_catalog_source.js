const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const {
  APTECH_TO_VIGOUR_FLOW,
  VDV_CATALOG_SERIES,
  VIGOUR_CATALOG_METADATA,
  VIGOUR_FLOW_CIRCUITS
} = require("../pages/aptech/utils/vigourCatalogConstraints")
const { parsePageText } = require("./aptech_catalog_source")

const DEFAULT_VIGOUR_SOURCE_PATH = "/Users/maybe/Documents/ChatGPT/mark/MarkItDown-KB/audit/page-text/VIGOUR VUPS英文目录-26.8.7.md"

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function frontMatterValue(markdown, name) {
  const match = String(markdown || "").match(new RegExp(`^${name}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]*))$`, "m"))
  return match ? String(match[1] || match[2] || match[3] || "").trim() : ""
}

function auditVigourCatalogSource(sourcePath = DEFAULT_VIGOUR_SOURCE_PATH) {
  const resolvedPath = path.resolve(sourcePath)
  const markdown = fs.readFileSync(resolvedPath, "utf8")
  const pages = parsePageText(markdown)
  const errors = []
  const actualHash = sha256(markdown)

  if (actualHash !== VIGOUR_CATALOG_METADATA.pageTextSha256) {
    errors.push(`Markdown SHA-256 不一致：${actualHash}`)
  }
  const declaredPages = Number(frontMatterValue(markdown, "pages"))
  if (declaredPages !== VIGOUR_CATALOG_METADATA.pageTextPages || pages.size !== declaredPages) {
    errors.push(`页数不一致：声明 ${declaredPages}，解析 ${pages.size}，预期 ${VIGOUR_CATALOG_METADATA.pageTextPages}`)
  }
  if (frontMatterValue(markdown, "extraction_method") !== VIGOUR_CATALOG_METADATA.pageTextExtractionMethod) {
    errors.push("VIGOUR 文本提取方式与固定元数据不一致")
  }

  VDV_CATALOG_SERIES.forEach((series) => {
    const [firstPage, lastPage] = series.pdfPages
    const text = Array.from({ length: lastPage - firstPage + 1 }, (_, index) => pages.get(firstPage + index) || "").join("\n")
    if (!text.includes(`${series.id}UB`) && !text.includes(`${series.id}UC`)) {
      errors.push(`${series.id} 在 PDF 第 ${firstPage}-${lastPage} 页未找到目录系列标题`)
    }
    if (series.ordering) {
      series.ordering.variants.forEach((variant) => {
        if (!text.includes(`${series.id}${variant}`)) {
          errors.push(`${series.id} 在 PDF 第 ${firstPage}-${lastPage} 页缺少 ${variant} 订货型号`)
        }
      })
      series.ordering.connections.forEach((connection) => {
        if (!text.includes(connection)) {
          errors.push(`${series.id} 在 PDF 第 ${firstPage}-${lastPage} 页缺少接口 ${connection}`)
        }
      })
    }
  })

  const flowPage = pages.get(VIGOUR_CATALOG_METADATA.flowCircuitPdfPage) || ""
  Object.keys(VIGOUR_FLOW_CIRCUITS).filter(Boolean).forEach((code) => {
    if (!flowPage.includes(`“${code}” Type`) && !flowPage.includes(`"${code}" Type`)) {
      errors.push(`VIGOUR 流路图第 ${VIGOUR_CATALOG_METADATA.flowCircuitPdfPage} 页缺少 ${code} 型`)
    }
  })
  Object.entries(APTECH_TO_VIGOUR_FLOW).forEach(([sourceCode, targetCode]) => {
    if (!Object.prototype.hasOwnProperty.call(VIGOUR_FLOW_CIRCUITS, targetCode)) {
      errors.push(`${sourceCode} 映射到未定义的 VIGOUR 流路 ${targetCode}`)
    }
  })

  return {
    ok: errors.length === 0,
    sourcePath: resolvedPath,
    sha256: actualHash,
    pageCount: pages.size,
    vdvSeriesCount: VDV_CATALOG_SERIES.length,
    orderingSeriesCount: VDV_CATALOG_SERIES.filter((series) => series.ordering).length,
    flowCircuitCount: Object.keys(VIGOUR_FLOW_CIRCUITS).length,
    errors
  }
}

module.exports = {
  DEFAULT_VIGOUR_SOURCE_PATH,
  auditVigourCatalogSource
}
