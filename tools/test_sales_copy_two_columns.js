const path = require("path")
const fs = require("fs")
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
  "6LV-4-VCR-3S-4TB2",
  "SS-10-VCR-2-VS",
  "NOT-A-MODEL",
  "SS-4-VCR-2-GR-VS+NOT-A-MODEL"
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

const lines = copied.split("\n")
const expected = [
  "VVR-GKR-G4\t待确认｜请确认尺寸公差｜1 项尺寸差值已列出",
  "VVR-FG4-TB4-L15-SLV\t待确认｜请确认尺寸公差｜3 项尺寸差值已列出",
  "\t无精确型号｜请联系工厂确认",
  "\t未识别型号｜请检查品牌和订购号",
  "VVR-GKR-G4 + [未识别型号]\t待确认｜请检查部分型号"
]

if (JSON.stringify(lines) !== JSON.stringify(expected)) {
  throw new Error(`sales copy must separate model and review note: ${JSON.stringify({ lines, expected })}`)
}
if (lines.length !== inputs.length) {
  throw new Error(`sales copy must preserve one row per input: ${JSON.stringify({ lines, inputs })}`)
}
lines.forEach((line, index) => {
  if (line.split("\t").length !== 2) {
    throw new Error(`sales row ${index + 1} must contain exactly two columns: ${JSON.stringify(line)}`)
  }
})

console.log("Two-column sales copy regression passed")
