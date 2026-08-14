const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const {
  CATALOG_METADATA,
  DIAPHRAGM_CATALOG_SERIES,
  DIAPHRAGM_PORT_TOPOLOGIES,
  REGULATOR_CATALOG_SERIES
} = require("../pages/aptech/utils/aptechCatalogConstraints")

const DEFAULT_SOURCE_PATH = "/Users/maybe/Documents/ChatGPT/mark/MarkItDown-KB/audit/page-text/S100-88-ProcessGas.md"

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function frontMatterValue(markdown, name) {
  const match = String(markdown || "").match(new RegExp(`^${name}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]*))$`, "m"))
  return match ? String(match[1] || match[2] || match[3] || "").trim() : ""
}

function parsePageText(markdown) {
  const pages = new Map()
  const marker = /^## PDF 第 (\d+) 页\s*$/gm
  const matches = [...String(markdown || "").matchAll(marker)]

  matches.forEach((match, index) => {
    const page = Number(match[1])
    const start = match.index + match[0].length
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length
    pages.set(page, markdown.slice(start, end).trim())
  })

  return pages
}

function asciiTokenPresent(text, token) {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const source = String(text || "").toUpperCase()
  return new RegExp(`(^|[^A-Z0-9])${escaped}(?=$|[^A-Z0-9])`, "m").test(source)
    || source.includes(String(token).toUpperCase())
}

function modelTokenPresent(text, brand, number, fixedSuffixPrefix = "") {
  const token = `${brand}${number}${fixedSuffixPrefix || ""}`
  return String(text || "").toUpperCase().includes(token)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function regulatorEvidenceCodes(series) {
  return unique([
    ...(series.materials || []),
    ...(series.roughness || []),
    ...(series.ports || []),
    ...(series.connections || []),
    ...(series.gauges || []),
    ...(series.seats || []),
    ...(series.options || []),
    ...(series.bonnetOptions || []),
    ...(series.handleOptions || [])
  ])
}

function auditCatalogSource(sourcePath = DEFAULT_SOURCE_PATH) {
  const resolvedPath = path.resolve(sourcePath)
  const markdown = fs.readFileSync(resolvedPath, "utf8")
  const pages = parsePageText(markdown)
  const errors = []
  const warnings = []

  const actualHash = sha256(markdown)
  if (actualHash !== CATALOG_METADATA.pageTextSha256) {
    errors.push(`Markdown SHA-256 不一致：${actualHash}`)
  }

  const declaredPages = Number(frontMatterValue(markdown, "pages"))
  if (declaredPages !== CATALOG_METADATA.pageTextPages || pages.size !== declaredPages) {
    errors.push(`页数不一致：声明 ${declaredPages}，解析 ${pages.size}，预期 ${CATALOG_METADATA.pageTextPages}`)
  }

  const extractionMethod = frontMatterValue(markdown, "extraction_method")
  if (extractionMethod !== CATALOG_METADATA.pageTextExtractionMethod) {
    errors.push(`文本提取方式不一致：${extractionMethod || "未声明"}`)
  }

  if (!String(pages.get(1) || "").includes(CATALOG_METADATA.catalogNumber)) {
    errors.push(`首页未找到目录版本 ${CATALOG_METADATA.catalogNumber}`)
  }

  REGULATOR_CATALOG_SERIES.forEach((series) => {
    const pageText = pages.get(series.pdfPage)
    if (!pageText) {
      errors.push(`${series.id} 缺少 PDF 第 ${series.pdfPage} 页原文`)
      return
    }

    series.numbers.forEach((number) => {
      if (!modelTokenPresent(pageText, series.brand, number, series.fixedSuffixPrefix)) {
        errors.push(`${series.id} 第 ${series.pdfPage} 页未找到目录型号 ${series.brand}${number}${series.fixedSuffixPrefix || ""}`)
      }
    })

    // Ordering tables and their material/detail tables span a two-page spread.
    const evidenceText = `${pageText}\n${pages.get(series.pdfPage + 1) || ""}`
    const missingCodes = regulatorEvidenceCodes(series).filter((code) => !asciiTokenPresent(evidenceText, code))
    if (missingCodes.length) {
      errors.push(`${series.id} 第 ${series.pdfPage} 页缺少字段代码：${missingCodes.join("、")}`)
    }

    const invalidMappings = (series.mappingNumbers || []).filter((number) => !series.numbers.includes(number))
    if (invalidMappings.length) {
      errors.push(`${series.id} 映射白名单含目录外型号：${invalidMappings.join("、")}`)
    }
  })

  DIAPHRAGM_CATALOG_SERIES.forEach((series) => {
    const pageText = pages.get(series.pdfPage)
    if (!pageText) {
      errors.push(`${series.id} 缺少 PDF 第 ${series.pdfPage} 页原文`)
      return
    }

    series.numbers.forEach((number) => {
      if (!modelTokenPresent(pageText, series.brand, number)) {
        errors.push(`${series.id} 第 ${series.pdfPage} 页未找到目录型号 ${series.brand}${number}`)
      }
    })

    const evidenceCodes = unique([
      ...(series.materials || []),
      ...(series.roughness || []),
      ...(series.connections || []),
      ...(series.allowedSelections || [])
    ])
    const evidenceText = `${pageText}\n${pages.get(series.pdfPage + 1) || ""}`
    const missingCodes = evidenceCodes.filter((code) => !asciiTokenPresent(evidenceText, code))
    if (missingCodes.length) {
      errors.push(`${series.id} 第 ${series.pdfPage} 页缺少字段代码：${missingCodes.join("、")}`)
    }

    if (!pageText.includes("型式表示方法")) {
      warnings.push(`${series.id} 第 ${series.pdfPage} 页文本层未提取到“型式表示方法”，需以 PDF 版面复核`)
    }
  })

  Object.entries(DIAPHRAGM_PORT_TOPOLOGIES).forEach(([brand, topology]) => {
    const pageText = pages.get(topology.pdfPage)
    if (!pageText) {
      errors.push(`${brand} 隔膜阀缺少 PDF 第 ${topology.pdfPage} 页孔位拓扑原文`)
      return
    }
    const missingPorts = topology.ports.filter((code) => !asciiTokenPresent(pageText, code))
    if (missingPorts.length) {
      errors.push(`${brand} 隔膜阀孔位拓扑缺少：${missingPorts.join("、")}`)
    }
  })

  return {
    ok: errors.length === 0,
    sourcePath: resolvedPath,
    sha256: actualHash,
    pageCount: pages.size,
    regulatorSeriesCount: REGULATOR_CATALOG_SERIES.length,
    diaphragmSeriesCount: DIAPHRAGM_CATALOG_SERIES.length,
    portTopologyCount: Object.keys(DIAPHRAGM_PORT_TOPOLOGIES).length,
    errors,
    warnings
  }
}

module.exports = {
  DEFAULT_SOURCE_PATH,
  auditCatalogSource,
  parsePageText
}
