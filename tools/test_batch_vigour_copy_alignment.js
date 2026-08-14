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

const pageDefinition = loadPageDefinition()
const validationPage = {
  data: {
    batchInput: [
      "SS-4-VCR-2-GR-VS",
      "SS-81O-9",
      "SS-10-VCR-2-VS"
    ].join("\n")
  },
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
  "\t待确认｜模糊候选仅供屏幕核对，请补全原始型号",
  "\t无精确型号｜请联系工厂确认"
]
if (lines.length !== validationPage.data.batchResults.length || JSON.stringify(lines) !== JSON.stringify(expected)) {
  throw new Error(`batch sales copy must align one-to-one: ${JSON.stringify({ lines, expected, results: validationPage.data.batchResults })}`)
}

console.log("Batch sales copy alignment regression passed")
