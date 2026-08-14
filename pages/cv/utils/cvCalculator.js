const pressureUnits = [
  { label: "MPa", value: "mpaA" },
  { label: "bar", value: "barA" },
  { label: "kPa", value: "kpaA" },
  { label: "PSIA", value: "psia" },
  { label: "PSIG", value: "psig" }
]

const gasFlowUnits = [
  { label: "SCFM", value: "scfm" },
  { label: "std L/min", value: "stdLMin" },
  { label: "std m3/h", value: "stdM3H" },
  { label: "std m3/min", value: "stdM3Min" }
]

const liquidFlowUnits = [
  { label: "gpm", value: "gpm" },
  { label: "L/h", value: "lH" },
  { label: "L/min", value: "lMin" },
  { label: "L/s", value: "lS" },
  { label: "m3/h", value: "m3H" }
]

const temperatureUnits = [
  { label: "℃", value: "c" },
  { label: "℉", value: "f" },
  { label: "K", value: "k" }
]

const gasMediaOptions = [
  { label: "空气", value: "air", sg: 1 },
  { label: "氮气", value: "nitrogen", sg: 0.967 },
  { label: "氩气", value: "argon", sg: 1.38 },
  { label: "二氧化碳", value: "carbonDioxide", sg: 1.52 },
  { label: "氢气", value: "hydrogen", sg: 0.0696 },
  { label: "氦气", value: "helium", sg: 0.138 },
  { label: "氨气", value: "ammonia", sg: 0.597 },
  { label: "甲烷", value: "methane", sg: 0.554 },
  { label: "乙炔", value: "acetylene", sg: 0.906 }
]

const liquidMediaOptions = [
  { label: "水", value: "water", sg: 1 },
  { label: "海水", value: "seaWater", sg: 1.025 },
  { label: "丙酮", value: "acetone", sg: 0.79 },
  { label: "乙醇", value: "ethanol", sg: 0.789 },
  { label: "甲醇", value: "methanol", sg: 0.792 },
  { label: "苯", value: "benzene", sg: 0.879 },
  { label: "汽油", value: "gasoline", sg: 0.72 },
  { label: "煤油", value: "kerosene", sg: 0.82 }
]

function toNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function round(value, digits) {
  const scale = Math.pow(10, digits)
  return Math.round(value * scale) / scale
}

function pressureToPsi(value, unit) {
  const numberValue = toNumber(value)
  if (numberValue === null) return null
  if (unit === "mpaA") return numberValue * 145.0377377
  if (unit === "barA") return numberValue * 14.50377377
  if (unit === "kpaA") return numberValue * 0.1450377377
  if (unit === "psig") return numberValue + 14.6959
  return numberValue
}

function psiToPressure(value, unit) {
  if (unit === "mpaA") return value / 145.0377377
  if (unit === "barA") return value / 14.50377377
  if (unit === "kpaA") return value / 0.1450377377
  if (unit === "psig") return value - 14.6959
  return value
}

function convertPressure(value, from, to) {
  const psia = pressureToPsi(value, from)
  return psia === null ? null : psiToPressure(psia, to)
}

function psiToMpa(value) {
  return value / 145.0377377
}

function flowToGpm(value, unit) {
  const numberValue = toNumber(value)
  if (numberValue === null) return null
  if (unit === "lH") return numberValue / 227.1247
  if (unit === "lMin") return numberValue / 3.785411784
  if (unit === "lS") return (numberValue * 60) / 3.785411784
  if (unit === "m3H") return numberValue * 4.402867
  return numberValue
}

function gpmToFlow(value, unit) {
  if (unit === "lH") return value * 227.1247
  if (unit === "lMin") return value * 3.785411784
  if (unit === "lS") return (value * 3.785411784) / 60
  if (unit === "m3H") return value / 4.402867
  return value
}

function convertLiquidFlow(value, from, to) {
  const gpm = flowToGpm(value, from)
  return gpm === null ? null : gpmToFlow(gpm, to)
}

function flowToScfm(value, unit) {
  const numberValue = toNumber(value)
  if (numberValue === null) return null
  if (unit === "stdLMin") return numberValue / 28.3168466
  if (unit === "stdM3H") return numberValue / 1.6990108
  if (unit === "stdM3Min") return numberValue * 35.3146667
  return numberValue
}

function scfmToFlow(value, unit) {
  if (unit === "stdLMin") return value * 28.3168466
  if (unit === "stdM3H") return value * 1.6990108
  if (unit === "stdM3Min") return value / 35.3146667
  return value
}

function convertGasFlow(value, from, to) {
  const scfm = flowToScfm(value, from)
  return scfm === null ? null : scfmToFlow(scfm, to)
}

function temperatureToRankine(value, unit) {
  const numberValue = toNumber(value)
  if (numberValue === null) return null
  if (unit === "c") return (numberValue * 9) / 5 + 491.67
  if (unit === "k") return numberValue * 1.8
  return numberValue + 459.67
}

function rankineToTemperature(value, unit) {
  if (unit === "c") return ((value - 491.67) * 5) / 9
  if (unit === "k") return value / 1.8
  return value - 459.67
}

function convertTemperature(value, from, to) {
  const rankine = temperatureToRankine(value, from)
  return rankine === null ? null : rankineToTemperature(rankine, to)
}

function validateBase(form) {
  const p1 = pressureToPsi(form.p1, form.pressureUnit)
  const p2 = pressureToPsi(form.p2, form.pressureUnit)
  const sg = toNumber(form.sg)
  const errors = []

  if (!form.pressureUnit) errors.push("请选择压力单位")
  if (p1 === null || p1 <= 0) errors.push("请输入有效的进口压力 P1")
  if (p2 === null || p2 <= 0) errors.push("请输入有效的出口压力 P2")
  if (p1 !== null && p2 !== null && p1 <= p2) errors.push("进口压力 P1 必须大于出口压力 P2")
  if (sg === null || sg <= 0) errors.push("请输入有效的相对比重")

  return { p1, p2, sg, errors }
}

function gasFactor(p1, p2, sg, tempR) {
  const pressureRatio = (p1 - p2) / p1
  const limitedRatio = Math.min(pressureRatio, 0.5)
  const expansion = pressureRatio >= 0.5 ? 0.667 : 1 - (2 * pressureRatio) / 3
  const factor = 1360 * p1 * expansion * Math.sqrt(limitedRatio / (sg * tempR))
  return { factor, isCritical: pressureRatio >= 0.5 }
}

function calculateCv(form) {
  const base = validateBase(form)
  const errors = base.errors.slice()
  const cv = toNumber(form.cv)
  const flowUnit = form.mediaType === "gas" ? form.gasFlowUnit : form.liquidFlowUnit
  const flow = form.mediaType === "gas" ? flowToScfm(form.flow, flowUnit) : flowToGpm(form.flow, flowUnit)

  if (!flowUnit) errors.push("请选择流量单位")
  if (form.mode === "cv" && (flow === null || flow <= 0)) errors.push("计算 Cv 时必须输入有效流量")
  if (form.mode === "flow" && (cv === null || cv <= 0)) errors.push("计算流量时必须输入有效 Cv")

  if (form.mediaType === "gas") {
    const tempR = temperatureToRankine(form.temperature, form.temperatureUnit)
    if (!form.temperatureUnit) errors.push("请选择温度单位")
    if (tempR === null || tempR <= 0) errors.push("请输入有效温度")
    if (errors.length) return { errors, result: null }

    const gas = gasFactor(base.p1, base.p2, base.sg, tempR)
    const factor = gas.factor / 60
    const value = form.mode === "cv" ? flow / factor : scfmToFlow(cv * factor, flowUnit)
    const pressure = pressureSummary(form)

    return {
      errors: [],
      result: {
        value: round(value, 4),
        label: form.mode === "cv" ? "Cv 值" : "流量值",
        unit: form.mode === "cv" ? "" : getUnitLabel(gasFlowUnits, flowUnit),
        p1Pressure: pressure.p1,
        p2Pressure: pressure.p2,
        pressureDrop: pressure.pressureDrop,
        pressureUnit: pressure.unit,
        flowState: gas.isCritical ? "临界流/阻塞流估算" : "亚临界流估算"
      }
    }
  }

  if (errors.length) return { errors, result: null }

  const deltaP = base.p1 - base.p2
  const value = form.mode === "cv"
    ? flow * Math.sqrt(base.sg / deltaP)
    : gpmToFlow(cv * Math.sqrt(deltaP / base.sg), flowUnit)
  const pressure = pressureSummary(form)

  return {
    errors: [],
    result: {
      value: round(value, 4),
      label: form.mode === "cv" ? "Cv 值" : "流量值",
      unit: form.mode === "cv" ? "" : getUnitLabel(liquidFlowUnits, flowUnit),
      p1Pressure: pressure.p1,
      p2Pressure: pressure.p2,
      pressureDrop: pressure.pressureDrop,
      pressureUnit: pressure.unit,
      flowState: "液体不可压缩流估算"
    }
  }
}

function getUnitLabel(options, value) {
  const option = options.find((item) => item.value === value)
  return option ? option.label : ""
}

function pressureSummary(form) {
  const p1 = toNumber(form.p1)
  const p2 = toNumber(form.p2)

  return {
    p1: round(p1, 4),
    p2: round(p2, 4),
    pressureDrop: round(p1 - p2, 4),
    unit: getUnitLabel(pressureUnits, form.pressureUnit)
  }
}

module.exports = {
  pressureUnits,
  gasFlowUnits,
  liquidFlowUnits,
  temperatureUnits,
  gasMediaOptions,
  liquidMediaOptions,
  convertPressure,
  convertGasFlow,
  convertLiquidFlow,
  convertTemperature,
  calculateCv
}
