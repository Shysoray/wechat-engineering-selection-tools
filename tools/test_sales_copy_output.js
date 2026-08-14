const fs = require("fs")
const path = require("path")
const Module = require("module")

function loadPageDefinition() {
  const filename = path.resolve("packageFitting/pages/index.js")
  const source = fs.readFileSync(filename, "utf8")
  const localRequire = Module.createRequire(filename)
  let pageDefinition = null
  new Function("require", "module", "exports", "Page", "wx", source)(
    localRequire,
    { exports: {} },
    {},
    (definition) => { pageDefinition = definition },
    {}
  )
  return pageDefinition
}

const inputs = [
  "SS-4-VCR-2-GR-VS",
  "-WT1-TB4",
  "SS-8-VCR-6-DM",
  "SS-81O-9",
  "SS-10-VCR-2-VS",
  "NOT-A-MODEL",
  "SS-4-VCR-2-GR-VS+SS-8-VCR-2-GR-VS",
  "SS-4-VCR-2-GR-VS+NOT-A-MODEL",
  "NOT-A-MODEL+ALSO-NOT-A-MODEL"
]
const pageDefinition = loadPageDefinition()
const validationPage = {
  data: { batchInput: inputs.join("\n") },
  setData(next) {
    this.data = { ...this.data, ...next }
  }
}
pageDefinition.refreshBatchValidation.call(validationPage)

let copied = ""
const copyPage = {
  data: { batchResults: validationPage.data.batchResults },
  copyText(value) {
    copied = value
  }
}

pageDefinition.copyBatchSales.call(copyPage)
const salesLines = copied.split("\n")
const expectedSalesLines = [
  "VVR-GKR-G4\t待确认｜请确认尺寸公差｜1 项尺寸差值已列出",
  "VMW-UT4\t待确认｜缺材质、清洗工艺｜2 项尺寸差值已列出",
  "VVR-MU8-DM-[孔径]\t待确认｜请确认限流孔径｜不可直接比较",
  "\t待确认｜模糊候选仅供屏幕核对，请补全原始型号",
  "\t无精确型号｜请联系工厂确认",
  "\t未识别型号｜请检查品牌和订购号",
  "VVR-GKR-G4 + VVR-GKR-G8\t待确认｜请检查部分型号",
  "VVR-GKR-G4 + [未识别型号]\t待确认｜请检查部分型号",
  "\t未识别型号｜请检查品牌和订购号"
]
if (JSON.stringify(salesLines) !== JSON.stringify(expectedSalesLines)) {
  throw new Error(`unexpected sales copy: ${JSON.stringify({ salesLines, expectedSalesLines })}`)
}

pageDefinition.copyBatchMapping.call(copyPage)
const comparisonLines = copied.split("\n")
const expectedHeader = "原始型号\t状态\tVIGOUR型号\t缺失参数\t处理建议\t尺寸证据状态\t尺寸差异摘要\t超差项\t证据页码摘要"
const expectedComparisonPrefixes = [
  "SS-4-VCR-2-GR-VS\t待确认\tVVR-GKR-G4\t尺寸公差\t请确认尺寸公差\tneeds_manual_review\t1 项尺寸差值已列出\t",
  "-WT1-TB4\t待确认\tVMW-UT4\t材质、清洗工艺、尺寸公差\t缺材质、清洗工艺\tneeds_manual_review\t2 项尺寸差值已列出\t",
  "SS-8-VCR-6-DM\t待确认\tVVR-MU8-DM-[孔径]\t限流孔径\t补充DM-xxx后确认\tnot_comparable\t不可直接比较\t\t",
  "SS-81O-9\t待确认\t\t原始型号\t模糊候选仅供屏幕核对，请补全原始型号\tnot_comparable\t\t\t",
  "SS-10-VCR-2-VS\t无精确型号\t\t\t请联系工厂确认\tnot_comparable\t\t\t",
  "NOT-A-MODEL\t未识别型号\t\t\t请检查品牌和订购号\tnot_comparable\t\t\t",
  "SS-4-VCR-2-GR-VS+SS-8-VCR-2-GR-VS\t待确认\tVVR-GKR-G4 + VVR-GKR-G8\t原始型号\t请检查部分型号\tnot_comparable\t\t\t",
  "SS-4-VCR-2-GR-VS+NOT-A-MODEL\t待确认\tVVR-GKR-G4 + [未识别型号]\t原始型号\t请检查部分型号\tnot_comparable\t\t\t",
  "NOT-A-MODEL+ALSO-NOT-A-MODEL\t未识别型号\t\t\t请检查品牌和订购号\tnot_comparable\t\t\t"
]
if (
  comparisonLines[0] !== expectedHeader
  || comparisonLines.length !== expectedComparisonPrefixes.length + 1
  || expectedComparisonPrefixes.some((expected, index) => !comparisonLines[index + 1].startsWith(expected))
) {
  throw new Error(`unexpected full comparison: ${JSON.stringify({ comparisonLines, expectedComparisonPrefixes })}`)
}
if (salesLines.length !== inputs.length || comparisonLines.length !== inputs.length + 1) {
  throw new Error(`copy output must contain one data row per input: ${JSON.stringify({ salesLines, comparisonLines, inputs })}`)
}
comparisonLines.slice(1).forEach((line, index) => {
  if (line.split("\t").length !== 9) {
    throw new Error(`comparison row ${index + 1} must contain nine columns: ${JSON.stringify(line)}`)
  }
})

const compoundInputs = inputs.slice(-3)
compoundInputs.forEach((input) => {
  const results = validationPage.data.batchResults.filter((result) => result.input === input)
  const compactLines = salesLines.filter((line, index) => validationPage.data.batchResults[index].input === input)
  const fullRows = comparisonLines.slice(1).filter((line) => line.split("\t")[0] === input)
  if (results.length !== 1 || compactLines.length !== 1 || fullRows.length !== 1) {
    throw new Error(`compound input must stay one-to-one: ${JSON.stringify({ input, results, compactLines, fullRows })}`)
  }
})
if (validationPage.data.batchSummary.total !== inputs.length) {
  throw new Error(`batch summary total must count raw inputs: ${JSON.stringify(validationPage.data.batchSummary)}`)
}

console.log("Sales copy output regression passed")
