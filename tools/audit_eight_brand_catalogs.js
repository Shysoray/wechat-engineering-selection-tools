const fs = require("fs")
const path = require("path")
const { fittingMappings } = require("../packageFitting/fittingDatabase")

const ROOT = path.resolve(__dirname, "..")
const OUTPUT_DIR = path.join(ROOT, "outputs", "tube_fitting_audit")
const REPORT_PATH = path.join(OUTPUT_DIR, "eight_brand_catalog_reaudit.md")
const JSON_PATH = path.join(OUTPUT_DIR, "eight_brand_catalog_reaudit.json")

const sourceCatalogs = {
  VIGOUR: {
    role: "target",
    pages: ["tmp/catalog_extract/VIGOUR_VUPS.json"],
    summaryKeys: ["VIGOUR VUPS"]
  },
  Swagelok: {
    role: "source",
    pages: ["tmp/catalog_extract/Swagelok_VCR.json", "tmp/catalog_extract/Swagelok_Weld.json"],
    summaryKeys: ["Swagelok VCR"]
  },
  FUJIKIN: {
    role: "source",
    pages: ["tmp/catalog_extract/Fujikin_UJR.json"],
    text: "tmp/tube_fitting_audit/pdf_text/fujikin_new_v.txt",
    summaryKeys: ["Fujikin UJR", "fujikin_new_v"]
  },
  UNILOK: {
    role: "source",
    text: "tmp/tube_fitting_audit/pdf_text/unilok.txt",
    summaryKeys: ["unilok"]
  },
  JSK: {
    role: "source",
    pages: ["tmp/catalog_extract/JSK_VCR.json", "tmp/catalog_extract/JSK_Micro.json"],
    text: "tmp/tube_fitting_audit/pdf_text/jsk.txt",
    summaryKeys: ["JSK VCR", "JSK Micro", "jsk"]
  },
  "TK-Fujikin": {
    role: "source",
    text: "tmp/tube_fitting_audit/pdf_text/tk_fujikin.txt",
    summaryKeys: ["tk_fujikin"]
  },
  FITOK: {
    role: "source",
    structured: "data/fitokCatalogModels.json",
    summaryKeys: ["fitok"]
  },
  SUPERLOK: {
    role: "source",
    text: "tmp/tube_fitting_audit/pdf_text/superlok.txt",
    summaryKeys: ["superlok"]
  }
}

function readJsonIfExists(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  if (!fs.existsSync(fullPath)) return null
  return JSON.parse(fs.readFileSync(fullPath, "utf8"))
}

function readTextIfExists(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  if (!fs.existsSync(fullPath)) return ""
  return fs.readFileSync(fullPath, "utf8")
}

function normalizeModel(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[‐‑‒–—－]/g, "-")
    .replace(/×/g, "X")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9.#]/g, "")
}

function stripVigourOptions(model) {
  let current = String(model || "")
  let changed = true
  while (changed) {
    changed = false
    for (const suffix of ["-SLV", "-BA", "-P"]) {
      if (current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length)
        changed = true
      }
    }
  }
  return current
}

function containsModel(normalizedText, model) {
  return normalizedText.includes(normalizeModel(model))
}

function optionAwareVigourHit(normalizedText, model) {
  if (!model) return false
  if (containsModel(normalizedText, model)) return true
  const stripped = stripVigourOptions(model)
  return stripped !== model && containsModel(normalizedText, stripped)
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function itemText(item) {
  return `${item.productLabel || ""} ${item.productName || ""} ${item.productCode || ""}`
}

const familyRules = [
  {
    name: "Female gland target family",
    matches: (item) => /female gland/i.test(itemText(item)),
    valid: (item) => /^V[VW]R-FG/.test(item.vigourModel || "")
  },
  {
    name: "Male or long gland target family",
    matches: (item) =>
      !/female gland|short gland/i.test(itemText(item)) && /male gland|male sleeve|long gland/i.test(itemText(item)),
    valid: (item) => /^(?:VVR-MG|HVVR-[BH]?MG|HVVR-HG)/.test(item.vigourModel || "")
  },
  {
    name: "Female nut target family",
    matches: (item) => /female nut|\bFN\b|HFN/i.test(itemText(item)),
    valid: (item) => /^H?VVR-FN/.test(item.vigourModel || "")
  },
  {
    name: "Male nut target family",
    matches: (item) => !/female nut|\bFN\b|HFN/i.test(itemText(item)) && /male nut|\bMN\b/i.test(itemText(item)),
    valid: (item) => /^H?VVR-MN/.test(item.vigourModel || "")
  },
  {
    name: "Cap target family",
    matches: (item) => /\bcap\b|\bCP\b/i.test(itemText(item)),
    valid: (item) => /^VVR-C/.test(item.vigourModel || "")
  },
  {
    name: "Plug target family",
    matches: (item) => /\bplug\b|\bPG\b/i.test(itemText(item)),
    valid: (item) => /^VVR-P/.test(item.vigourModel || "")
  }
]

const pdfSummary = readJsonIfExists("tmp/tube_fitting_audit/pdf_text_summary.json") || {}
const catalogExtractSummary = readJsonIfExists("tmp/catalog_extract/summary.json") || {}
const fitokStructuredModels = readJsonIfExists("data/fitokCatalogModels.json")

function readPagesText(relativePaths = []) {
  return relativePaths.map((relativePath) => {
    const pages = readJsonIfExists(relativePath)
    if (!Array.isArray(pages)) return ""
    return pages.map((page) => page.text || "").join("\n")
  }).join("\n")
}

function sourceCatalogText(config) {
  return [
    readPagesText(config.pages || []),
    config.text ? readTextIfExists(config.text) : ""
  ].join("\n")
}

const normalizedCatalogTexts = Object.fromEntries(
  Object.entries(sourceCatalogs).map(([brand, config]) => [
    brand,
    normalizeModel(sourceCatalogText(config))
  ])
)

function fitokSourceHit(sourceModel) {
  if (!fitokStructuredModels?.source) return false
  const normalizedSource = normalizeModel(sourceModel)
  const allModels = Object.values(fitokStructuredModels.source).flatMap((entry) => entry.models || [])
  return allModels.some((basicModel) => normalizedSource.includes(normalizeModel(basicModel)))
}

function catalogSources(config) {
  if (config.structured === "data/fitokCatalogModels.json" && fitokStructuredModels?.source) {
    return Object.entries(fitokStructuredModels.source).map(([series, entry]) => ({
      key: `FITOK ${series}`,
      path: `/Users/maybe/Downloads/${entry.file}`,
      pages: "-"
    }))
  }
  return (config.summaryKeys || []).map((key) => ({
    key,
    path: catalogExtractSummary[key]?.path || pdfSummary[key]?.path || "",
    pages: catalogExtractSummary[key]?.pages || pdfSummary[key]?.pages || null
  })).filter((item) => item.path || item.pages)
}

const byBrand = {}
fittingMappings.forEach((item) => {
  byBrand[item.brand] ||= []
  byBrand[item.brand].push(item)
})

const brandReports = {}
Object.keys(sourceCatalogs).forEach((brand) => {
  const items = byBrand[brand] || []
  const sourceText = normalizedCatalogTexts[brand] || ""
  const vigourText = normalizedCatalogTexts.VIGOUR || ""
  const sourceModels = uniqueBy(items, (item) => item.sourceModel)
  const targets = uniqueBy(
    items.filter((item) => item.vigourModel && !item.noMatch),
    (item) => item.vigourModel
  )
  const sourceHits = brand === "VIGOUR"
    ? 0
    : sourceModels.filter((item) => brand === "FITOK" ? fitokSourceHit(item.sourceModel) : containsModel(sourceText, item.sourceModel)).length
  const targetHits = targets.filter((item) => optionAwareVigourHit(vigourText, item.vigourModel)).length
  const familyConflicts = items
    .filter((item) => item.vigourModel && !item.noMatch)
    .flatMap((item) =>
      familyRules
        .filter((rule) => rule.matches(item) && !rule.valid(item))
        .map((rule) => ({
          rule: rule.name,
          sourceModel: item.sourceModel,
          vigourModel: item.vigourModel,
          product: item.productLabel || item.productName || item.productCode || ""
        }))
    )

  brandReports[brand] = {
    role: sourceCatalogs[brand].role,
    catalogSources: catalogSources(sourceCatalogs[brand]),
    mappingRows: items.length,
    uniqueSourceModels: sourceModels.length,
    sourceExactHits: sourceHits,
    sourceExactHitRate: sourceModels.length ? +(sourceHits / sourceModels.length * 100).toFixed(1) : null,
    uniqueVigourTargets: targets.length,
    vigourTargetCatalogHits: targetHits,
    vigourTargetCatalogHitRate: targets.length ? +(targetHits / targets.length * 100).toFixed(1) : null,
    noMatchRows: items.filter((item) => item.noMatch || !item.vigourModel).length,
    materialWarnings: items.filter((item) => item.materialMatched === false).length,
    finishWarnings: items.filter((item) => item.finishMatched === false || item.treatmentMatched === false).length,
    specialWarnings: items.filter((item) => item.specialFeatureMatched === false).length,
    dimensionConfirmationRows: items.filter((item) => item.dimensionConfirmation).length,
    familyConflictCount: familyConflicts.length,
    familyConflicts: familyConflicts.slice(0, 30),
    noMatchSamples: items
      .filter((item) => item.noMatch || !item.vigourModel)
      .slice(0, 12)
      .map((item) => item.sourceModel),
    warningSamples: items
      .filter((item) =>
        item.materialMatched === false ||
        item.finishMatched === false ||
        item.treatmentMatched === false ||
        item.specialFeatureMatched === false
      )
      .slice(0, 12)
      .map((item) => ({
        sourceModel: item.sourceModel,
        vigourModel: item.vigourModel,
        materialMatched: item.materialMatched,
        finishMatched: item.finishMatched,
        treatmentMatched: item.treatmentMatched,
        specialFeatureMatched: item.specialFeatureMatched
      }))
  }
})

const accidentModels = [
  { brand: "FUJIKIN", sourceModel: "UJR-6.35MS-L28-AW", target: /^VVR-FG/ },
  { brand: "FUJIKIN", sourceModel: "UJR-6.35MS-L28-AW-316LM", target: /^VVR-FG/ },
  { brand: "FUJIKIN", sourceModel: "UJR-9.52MS-L28.5-AW", target: /^VVR-FG/ },
  { brand: "FUJIKIN", sourceModel: "UJR-9.52MS-L28.5-AW-316LM", target: /^VVR-FG/ },
  { brand: "FUJIKIN", sourceModel: "UJR-12.7MS-L28.5-AW", target: /^VVR-FG/ },
  { brand: "FUJIKIN", sourceModel: "UJR-12.7MS-L28.5-AW-316LM", target: /^VVR-FG/ },
  { brand: "Swagelok", sourceModel: "6LV-4-HVCR-1-6TB7", target: /^HVVR-MG4-TB6-SLV$/ },
  { brand: "Swagelok", sourceModel: "316L-4-HVCR-1A6", target: /^HVVR-AHG4-TW6$/ },
  { brand: "Swagelok", sourceModel: "6LV-4-HVCR-61-6TB7", target: /^HVVR-BMG4-TB6-SLV$/ }
]
const accidentCheck = accidentModels.map(({ brand, sourceModel, target }) => {
  const matches = fittingMappings.filter((item) => item.brand === brand && item.sourceModel === sourceModel)
  return {
    brand,
    sourceModel,
    vigourModels: matches.map((item) => item.vigourModel),
    ok: matches.length === 1 && target.test(matches[0].vigourModel)
  }
})

const report = {
  generatedAt: new Date().toISOString(),
  brands: brandReports,
  accidentCheck,
  summary: {
    sourceBrands: Object.keys(byBrand).sort(),
    targetBrand: "VIGOUR",
    mappingRows: fittingMappings.length,
    familyConflicts: Object.values(brandReports).reduce((sum, report) => sum + report.familyConflictCount, 0),
    noMatchRows: Object.values(brandReports).reduce((sum, report) => sum + report.noMatchRows, 0),
    warningRows: Object.values(brandReports).reduce(
      (sum, report) => sum + report.materialWarnings + report.finishWarnings + report.specialWarnings,
      0
    )
  }
}

function pct(value) {
  return value === null ? "-" : `${value}%`
}

function mdTable(rows) {
  return rows.map((row) => `| ${row.join(" | ")} |`).join("\n")
}

const lines = []
lines.push("# 八品牌管接头目录复盘报告")
lines.push("")
lines.push(`生成时间：${report.generatedAt}`)
lines.push("")
lines.push("## 结论摘要")
lines.push("")
lines.push(`- 覆盖品牌：VIGOUR 目标目录 + ${report.summary.sourceBrands.join("、")} 来源品牌。`)
lines.push(`- 当前小程序对标库共 ${report.summary.mappingRows} 条来源品牌映射。`)
lines.push(`- 高置信产品家族冲突：${report.summary.familyConflicts} 条。`)
lines.push(`- 暂无 VIGOUR 候选/无匹配：${report.summary.noMatchRows} 条。`)
lines.push(`- 材质、表面处理或特殊结构提示总数：${report.summary.warningRows} 条。`)
lines.push("")
lines.push("## 目录来源")
lines.push("")
lines.push(mdTable([
  ["品牌", "角色", "PDF 页数", "目录路径"],
  ["---", "---", "---", "---"],
  ...Object.entries(brandReports).map(([brand, item]) => [
    brand,
    item.role === "target" ? "目标目录" : "来源目录",
    item.catalogSources.map((source) => source.pages || "-").join(" / ") || "-",
    item.catalogSources.map((source) => source.path).join("；") || "未找到"
  ])
]))
lines.push("")
lines.push("## 品牌级核查结果")
lines.push("")
lines.push(mdTable([
  ["品牌", "映射行", "唯一来源型号", "来源目录命中", "唯一 VIGOUR 候选", "VIGOUR 目录命中", "无匹配", "家族冲突", "尺寸复核"],
  ["---", "---:", "---:", "---:", "---:", "---:", "---:", "---:", "---:"],
  ...Object.entries(brandReports).map(([brand, item]) => [
    brand,
    item.mappingRows,
    item.uniqueSourceModels || "-",
    brand === "VIGOUR" ? "-" : `${item.sourceExactHits}/${item.uniqueSourceModels} (${pct(item.sourceExactHitRate)})`,
    item.uniqueVigourTargets,
    `${item.vigourTargetCatalogHits}/${item.uniqueVigourTargets} (${pct(item.vigourTargetCatalogHitRate)})`,
    item.noMatchRows,
    item.familyConflictCount,
    item.dimensionConfirmationRows
  ])
]))
lines.push("")
lines.push("## 本次严重事故回归")
lines.push("")
accidentCheck.forEach((item) => {
  lines.push(`- ${item.ok ? "[OK]" : "[FAIL]"} ${item.brand} ${item.sourceModel} -> ${item.vigourModels.join(", ") || "无结果"}`)
})
lines.push("")
lines.push("## 需要人工复核的风险说明")
lines.push("")
lines.push("- 来源目录命中率不是准确率：很多型号由目录订购规则组合生成，PDF 可能不逐条列出所有材质/工艺变体。低命中率代表需要抽样核对规则来源。")
lines.push("- VIGOUR 目录命中采用 option-aware 逻辑：允许 `-SLV`、`-BA`、`-P` 这类目录说明允许的后缀组合回落到基础型号。")
lines.push("- 尺寸复核行表示型号功能/名义管径可生成候选；1/8、1/4、3/8、1/2、3/4、1 in 及其毫米写法属于等值管径，不作为差异，但长度、壁厚、焊接端尺寸、中心距或特殊孔径仍需样本图纸确认。")
lines.push("- 无匹配行不得在正式替代中使用；只能作为“品牌型号已识别但暂无 VIGOUR 对应”的反馈。")
lines.push("")
lines.push("## 每品牌样本风险")
lines.push("")
Object.entries(brandReports).forEach(([brand, item]) => {
  lines.push(`### ${brand}`)
  lines.push("")
  lines.push(`- 无匹配样本：${item.noMatchSamples.length ? item.noMatchSamples.join("、") : "无"}`)
  lines.push(`- 家族冲突样本：${item.familyConflicts.length ? item.familyConflicts.map((x) => `${x.sourceModel}->${x.vigourModel}`).join("、") : "无"}`)
  lines.push(`- 材质/表面/特殊结构提示样本：${item.warningSamples.length ? item.warningSamples.map((x) => `${x.sourceModel}->${x.vigourModel}`).join("、") : "无"}`)
  lines.push("")
})

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`)

console.log(`wrote ${path.relative(ROOT, REPORT_PATH)}`)
console.log(`wrote ${path.relative(ROOT, JSON_PATH)}`)
console.log(JSON.stringify(report.summary, null, 2))
