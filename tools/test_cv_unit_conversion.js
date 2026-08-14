const calc = require("../pages/cv/utils/cvCalculator")
const fs = require("fs")

function near(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: ${actual} != ${expected}`)
  }
}

near(calc.convertPressure(1, "mpaA", "barA"), 10, 1e-8, "MPa to bar")
near(calc.convertPressure(0, "psig", "psia"), 14.6959, 1e-8, "gauge to absolute")
near(
  calc.convertGasFlow(calc.convertGasFlow(100, "stdLMin", "scfm"), "scfm", "stdLMin"),
  100,
  1e-6,
  "gas round trip"
)
near(
  calc.convertLiquidFlow(calc.convertLiquidFlow(10, "lMin", "gpm"), "gpm", "lMin"),
  10,
  1e-6,
  "liquid round trip"
)
near(
  calc.convertTemperature(calc.convertTemperature(20, "c", "f"), "f", "c"),
  20,
  1e-6,
  "temperature round trip"
)

const baseForm = {
  mode: "cv",
  mediaType: "gas",
  p1: "0.8",
  p2: "0.2",
  pressureUnit: "mpaA",
  flow: "100",
  gasFlowUnit: "stdLMin",
  liquidFlowUnit: "",
  temperature: "20",
  temperatureUnit: "c",
  sg: "1",
  cv: ""
}

const mpaResult = calc.calculateCv(baseForm)
const barResult = calc.calculateCv({
  ...baseForm,
  p1: String(calc.convertPressure(baseForm.p1, "mpaA", "barA")),
  p2: String(calc.convertPressure(baseForm.p2, "mpaA", "barA")),
  pressureUnit: "barA"
})

if (mpaResult.errors.length || barResult.errors.length) {
  throw new Error(`equivalent form validation failed: ${JSON.stringify({ mpaResult, barResult })}`)
}
near(mpaResult.result.value, barResult.result.value, 1e-8, "equivalent physical Cv")

const cvWxss = fs.readFileSync("pages/cv/index.wxss", "utf8")
if (/SFMono-Regular|Liberation Mono|monospace/.test(cvWxss)) {
  throw new Error("Cv UI must use the same font family as the rest of the app")
}
if (!/\.result-value\s*\{[^}]*font-family:\s*inherit;/s.test(cvWxss)) {
  throw new Error("Cv result value must inherit the page font")
}

const cvWxml = fs.readFileSync("pages/cv/index.wxml", "utf8")
if (!cvWxml.includes('class="unit-toolbar')) throw new Error("central unit toolbar missing")
for (const handler of ["choosePressureUnit", "chooseGasFlowUnit", "chooseLiquidFlowUnit", "chooseTemperatureUnit"]) {
  if (!cvWxml.includes(`bindtap="${handler}"`)) throw new Error(`missing unit action: ${handler}`)
}
if (!cvWxml.includes("cvResult.context.mediaDisplay") || !cvWxml.includes("cvResult.context.sgDisplay")) {
  throw new Error("result medium snapshot missing")
}
if (!/\.unit-toolbar\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:/s.test(cvWxss)) {
  throw new Error("unit toolbar grid missing")
}
if (!/\.unit-control\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;[^}]*text-align:\s*center;/s.test(cvWxss)) {
  throw new Error("unit control content must stack vertically")
}
const unitControlCss = cvWxss.match(/\.unit-control\s*\{([^}]*)\}/s)
if (
  !unitControlCss ||
  !/(?:^|;)\s*width:\s*100%;/.test(unitControlCss[1]) ||
  !/(?:^|;)\s*max-width:\s*100%;/.test(unitControlCss[1])
) {
  throw new Error("unit controls must stay within their grid tracks")
}
if (!/\.result-meta__item--media\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s.test(cvWxss)) {
  throw new Error("full-width result medium missing")
}
for (const label of ["计算介质 / MEDIA", "相对比重", "工作温度", "P1", "P2 / ΔP", "流态"]) {
  if (!cvWxml.includes(`class="result-meta__label">${label}</text>`)) {
    throw new Error(`result metadata label class missing: ${label}`)
  }
}
if (!/\.result-meta__label\s*\{[^}]*color:\s*#8f8f8f;[^}]*font-size:\s*17rpx;/s.test(cvWxss)) {
  throw new Error("result metadata label style missing")
}
if (cvWxss.includes("text:first-child")) {
  throw new Error("result metadata tag selector is not component-compatible")
}

console.log("Cv unit conversion contract passed")
