const { getAp31Vdv38Rule } = require("./aptechTargetCorrections")
const { tokenizeAptechModel } = require("./aptechTokenizer")

const KNOWN_PORT = /^\dP(?:W[A-Z]?)?$/
const KNOWN_CONNECTION = /^(?:FV|MV|TW|IV)\d+$/
const KNOWN_GAUGE = /^(?:0|00|1|2|4|10|40|H|L|V3|MPA)$/
const KNOWN_OPTION = /^(?:HF|FC|VS|HR|P|TF|FA|KL|ABSOLUTE|IPC|IPO|IS|LO|LOTOC|PF|PA|NP|CR)$/
const KNOWN_BLEED = /^(?:CB005|CB009|CBO09|CB013|CB023)$/

const SERIES_CONFIRMATIONS = Object.freeze([
  { id: "AP_PA", source: /^(?:AP|AZ)(?:10|12|14|15|90|91)PA/, status: "manual", note: "PA 气动减压阀尚无已确认的 VIGOUR 等效系列" },
  { id: "AP500", source: /^AP5(?:01|02|06|10|15)/, target: /^VSR-50UC/, status: "confirmed" },
  { id: "AP_AZ1000", source: /^(?:AP|AZ)(?:1001|1002|1006|1010|1015)/, target: /^VSR-100U[BC]/, status: "confirmed" },
  { id: "AP_AZ1000_EXT", source: /^(?:AP|AZ)10/, target: /^VSR-100U[BC]/, status: "blocked", note: "AP/AZ1020、1030、1050 的出口压力约 14/21/35 bar，超过 VSR-100/1000 目录上限 10 bar" },
  { id: "AP1101", source: /^AP1101/, target: /^VSR-410UC.*-20-VC2-/, status: "confirmed" },
  { id: "AZ1101", source: /^AZ1101/, target: /^VSR-410UB.*-20-VC2-/, status: "confirmed" },
  { id: "AP_AZ1100", source: /^(?:AP|AZ)11/, target: /^VSR-410U[BC]/, status: "blocked", note: "APTech AP/AZ1100 目录仅定义 1101；1102 等连续压力档不是有效目录型号" },
  { id: "AP_AZ1200", source: /^(?:AP|AZ)12(?:0[1-9]|1\d|2[0-5])/, target: /^VSR-210U[BC]/, status: "candidate", note: "AP/AZ1200 由压力、Cv、HR/HF/FC 和接口组合策略逐项判定" },
  { id: "AP_AZ1300", source: /^(?:AP|AZ)13(?:02|06|10|15)/, target: /^VSR-210UB/, status: "confirmed" },
  { id: "AP_AZ1300_EXT", source: /^(?:AP|AZ)13/, target: /^VSR-210UB/, status: "blocked", note: "AP/AZ1300 原厂有效压力档仅 1302、1306、1310、1315，其它连续编号不放行" },
  { id: "AP1402A", source: /^AP1402[A-Z]*A/, target: /^VSR-410UC.*-20-VC2-/, status: "confirmed" },
  { id: "AZ1402A", source: /^AZ1402[A-Z]*A/, target: /^VSR-410UB.*-20-VC2-/, status: "confirmed" },
  { id: "AP_AZ1400", source: /^(?:AP|AZ)14/, target: /^VSR-410U[BC]/, status: "ap1400", note: "AP/AZ1400 由标准入口、HR 和 A 负压组合逐项判定" },
  { id: "AP1500", source: /^AP15(?:02|06|10|15)/, target: /^VSR-510UC/, status: "confirmed" },
  { id: "AP1500_EXT", source: /^AP15/, target: /^VSR-510UC/, status: "blocked", note: "AP1500 原厂有效压力档仅 1502、1506、1510、1515；1520 的 14 bar 也超过 VSR-510 上限 10 bar" },
  { id: "AZ1500", source: /^AZ15(?:02|06|10|15)/, target: /^VSR-510UB/, status: "confirmed" },
  { id: "AP1600", source: /^AP16/, target: /^VSR-610UC/, status: "blocked", note: "AP1600 与 VSR-610 的流量/Cv 等效关系尚未确认" },
  { id: "AP1700", source: /^AP17/, target: /^VSR-710UC/, status: "blocked", note: "AP1700 的双级结构、压力代码及 NT/HR/HF 选项尚未确认" },
  { id: "AP1900", source: /^AP19(?:01|02|06|10|15)/, target: /^VSR-510UC.*-HF(?:-|$)/, status: "confirmed" },
  { id: "AP1900_EXT", source: /^AP19/, target: /^VSR-510UC.*-HF(?:-|$)/, status: "blocked", note: "AP1900 原厂有效压力档仅 1901、1902、1906、1910、1915，其它连续编号不放行" },
  { id: "AZ1900", source: /^AZ19(?:01|02|06|10|15)/, target: /^VSR-510UB.*-HF(?:-|$)/, status: "confirmed" },
  { id: "AP9000", source: /^AP90(?:0[1-9]|1[0-5])/, target: /^VSR-910UB/, status: "confirmed" },
  { id: "AP9030", source: /^AP9030/, target: /^VSR-911UB/, status: "confirmed" },
  { id: "AP9100", source: /^AP91(?:0[1-9]|1[0-5])/, target: /^VSR-910UB/, status: "confirmed" },
  { id: "AZ9200", source: /^AZ92(?:02|06|10|15)/, target: /^VSR-920UB.*-20-(?:2|4|7|10)-/, status: "confirmed" },
  { id: "AP9OPA", source: /^AP9OPA/, status: "manual", note: "AP9OPA 是疑似 OCR/气动特殊系列，必须人工确认原始订购号" },
  { id: "AP2700", source: /^(?:AP|AZ)27/, status: "manual", note: "AP/AZ2700 尚无已确认的 VIGOUR 双级中流量对应系列" },
  { id: "AP31", source: /^AP31/, target: /^VDV38UC/, status: "ap31" },
  { id: "AP30", source: /^(?:AP|AZ)30/, target: /^VDV33UC/, status: "confirmed" },
  { id: "AP35", source: /^(?:AP|AZ)35/, target: /^VDV32UC/, status: "confirmed" },
  { id: "AP36", source: /^(?:AP|AZ)36/, target: /^VDV(?:32|33|40)UC/, status: "ap36" },
  { id: "AP37", source: /^(?:AP|AZ)3700/, target: /^VDV37UC.*-PC(?:-|$)/, status: "confirmed" },
  { id: "AP3708", source: /^(?:AP|AZ)3708/, target: /^VDV37UC/, status: "blocked", note: "AP3708 是常开气动阀；VDV37-PC 是常闭动作，结构不等效" },
  { id: "AZ9600", source: /^AZ9600/, target: /^VDV37UC/, status: "blocked", note: "AZ9600 为 Cv 10、3/4–1 inch 大流量阀；VDV37 为 Cv 2.8，流通能力不等效" },
  { id: "AP37_EXT", source: /^(?:AP|AZ)37/, target: /^VDV37UC/, status: "candidate", note: "其它 AP/AZ37 扩展型号尚未完成目录等效确认" },
  { id: "AP38_39", source: /^(?:AP|AZ)(?:3800|3900)/, target: /^VDV37UC.*-M(?:-|$)/, status: "confirmed" },
  { id: "AP38_39_EXT", source: /^(?:AP|AZ)(?:38|39)/, target: /^VDV37UC/, status: "blocked", note: "当前 APTech 标准目录仅列 AP3800/AP3900；3810、3850 等旧版或特殊动作号禁止自动确认" },
  { id: "AP32_40_4141", source: /^(?:(?:AP|AZ)(?:32|40)|(?:AP|AZ)4141)/, target: /^VDV40UC/, status: "confirmed" },
  { id: "AP415X", source: /^(?:AP|AZ)415(?:0|7)/, target: /^VDV46UC.*-M(?:-|$)/, status: "confirmed" },
  { id: "AP41", source: /^(?:AP|AZ)41/, target: /^VDV(?:40|46)UC/, status: "blocked", note: "AP/AZ41 manifold 与 VDV40/46 的边界尚未确认" },
  { id: "AP44_45", source: /^(?:AP|AZ)(?:44|45)/, target: /^VDV42UC/, status: "confirmed" },
  { id: "AP46", source: /^(?:AP|AZ)46/, target: /^VDV42UC/, status: "confirmed" },
  { id: "AP71", source: /^AP71/, target: /^VVGV1/, status: "ap71", note: "AP71 由 vent 接口、NP/CR 密封和 bleed 档位逐项判定" },
  { id: "AP72", source: /^AP72/, target: /^VVGV2/, status: "ap72", note: "AP72 由动作、vent 接口、VS/NP 和低 N2 消耗选项逐项判定" },
  { id: "AP7", source: /^AP(?:70|7[A-Z])/, target: /^VVG/, status: "blocked", note: "AP7/AP70 与 VVG 的真空性能接近，但接口尺寸/顺序和 EP 字段未完整映射；禁止生成 VVG 目录不存在的 MV6/FV6 连接代码" },
  { id: "AP64", source: /^AP64/, target: /^VUCV/, status: "blocked", note: "AP64 对应 VUCV/VUC/VCVH 的系列边界及 FV4 支持尚未确认" },
  { id: "AP74B", source: /^AP74B/, target: /^VEFS2-S-[HV]-/, status: "ap74b", note: "AP74B 由流量档、方向和接口尺寸逐项判定" },
  { id: "AP74", source: /^AP74/, target: /^VEFS1/, status: "blocked", note: "AP74 小流量系列的完整目录等效范围尚未确认" },
  { id: "KT9", source: /^KT9/, target: /^VSR-930UBS-400-(?:35|170)-/, status: "confirmed", note: "KT9F/KT9L 与 VSR-930 的 400 bar 工程等效关系已确认" }
])

function firstToken(value) {
  const normalized = String(value || "").trim().toUpperCase()
  const token = tokenizeAptechModel(normalized)[0]
  return String(token || "").replace(/^WB-/, "")
}

function unconfirmedOptionTokens(sourceModel, options = {}) {
  const tokens = tokenizeAptechModel(sourceModel).slice(1)
  return tokens.filter((token) => {
    if (KNOWN_PORT.test(token) || KNOWN_CONNECTION.test(token)) return false
    if (KNOWN_GAUGE.test(token) || KNOWN_OPTION.test(token)) return false
    if (options.allowBleed && KNOWN_BLEED.test(token)) return false
    if (token === "INCH" || /^\d+\/\d+$/.test(token)) return false
    if (options.allowPs25 && token === "PS25") return false
    return true
  })
}

function ap74bSourceInfo(sourceModel) {
  const tokens = tokenizeAptechModel(sourceModel)
  let match = String(tokens[0] || "").match(/^AP74B([HV])(\d+)([A-Z]*)$/)
  let connectionIndex = 1

  if (!match && tokens[0] === "AP74B") {
    const directionFlow = String(tokens[1] || "").match(/^([HV])(\d+)$/)
    if (!directionFlow || !/^[A-Z]+$/.test(tokens[2] || "")) return null
    match = ["", directionFlow[1], directionFlow[2], tokens[2]]
    connectionIndex = 3
  }
  if (!match) return null

  return {
    direction: match[1],
    flow: match[2],
    suffix: match[3],
    connections: tokens.slice(connectionIndex).filter((token) => KNOWN_CONNECTION.test(token))
  }
}

function seriesConfirmation(sourceModel, vigourModel) {
  const source = firstToken(sourceModel)
  const target = String(vigourModel || "").toUpperCase()
  const record = SERIES_CONFIRMATIONS.find((item) => item.source.test(source))
  if (!record) return null

  if (record.target && !record.target.test(target)) {
    return {
      id: record.id,
      policyLevel: "blocked",
      copySafe: false,
      reviewNote: `${record.id} 生成结果落入未批准的 VIGOUR 系列，禁止作为确定型号`
    }
  }

  if (record.status === "ap74b") {
    const info = ap74bSourceInfo(sourceModel)
    const sizeByFlow = {
      "225": "8",
      "350": "8",
      "500": "8",
      "950": "8",
      "1100": "12",
      "1650": "12",
      "2600": "12",
      "3000": "16",
      "4000": "16"
    }
    const requiredSize = info ? sizeByFlow[info.flow] : ""
    const validConnections = info
      && info.connections.length === 2
      && info.connections.every((connection) => new RegExp(`^(?:FV|MV|TW)${requiredSize}$`).test(connection))
    if (!info || info.suffix !== "SM" || !requiredSize || !validConnections) {
      return {
        id: record.id,
        policyLevel: "blocked",
        copySafe: false,
        reviewNote: "AP74B 流量档、SM 字段或接口尺寸不在已确认的 VEFS2 对应范围"
      }
    }
    const expectedTarget = `VEFS2-S-${info.direction}-${info.connections[0]}-${info.connections[1]}-${info.flow}-P`
    return target === expectedTarget
      ? { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
      : { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: `AP74B 应唯一对应 ${expectedTarget}` }
  }

  const confirmedLike = ["confirmed", "ap31", "ap36", "ap1400", "ap71", "ap72"].includes(record.status)
  const structurallyValid = /^(?:AP|AZ)\d{3,4}[A-Z]*$/.test(source)
    || (record.status === "ap71" && /^AP71S6?$/.test(source))
    || (record.status === "ap72" && /^AP(?:72540|72550|72600|72625|72650)[A-Z]*$/.test(source))
    || (record.id === "KT9" && /^KT9[FL][01]S$/.test(source))
  if (confirmedLike && !structurallyValid) {
    return {
      id: record.id,
      policyLevel: "candidate",
      copySafe: false,
      reviewNote: `未确认型号编码：${source}`
    }
  }

  const unknownTokens = confirmedLike
    ? unconfirmedOptionTokens(sourceModel, { allowBleed: ["ap71", "ap72"].includes(record.status) })
    : []
  if (unknownTokens.length) {
    return {
      id: record.id,
      policyLevel: "candidate",
      copySafe: false,
      reviewNote: `未确认扩展字段：${unknownTokens.join("、")}`
    }
  }

  if (record.status === "ap31") {
    const numberMatch = source.match(/^AP(31\d{2})/)
    const rule = numberMatch ? getAp31Vdv38Rule("AP", Number(numberMatch[1])) : null
    const pressureMatched = rule && target.split("-").includes(rule.workPressure)
    return pressureMatched
      ? { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
      : { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP31 型号或高压 H/M 字段未在确认表中" }
  }

  if (record.status === "ap36") {
    const match = source.match(/^(AP|AZ)(36\d{2})/)
    const brand = match ? match[1] : ""
    const number = match ? Number(match[2]) : 0
    const expectedSeries = brand === "AP" && number === 3625
      ? "VDV40UC"
      : number === 3624
        ? "VDV33UC"
        : "VDV32UC"
    return target.startsWith(expectedSeries)
      ? { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
      : { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: `AP/AZ36 应对应 ${expectedSeries}，当前生成系列不一致` }
  }

  if (record.status === "ap1400") {
    const match = source.match(/^(AP|AZ)(14(?:02|06|10|15))([A-Z]*)/)
    if (!match) {
      return { id: record.id, policyLevel: "candidate", copySafe: false, reviewNote: "AP/AZ1400 扩展压力档尚未确认" }
    }
    if (tokenizeAptechModel(sourceModel).includes("HR")) {
      return { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP/AZ1400 HR 入口约 207 bar，超过 VSR-410 目录上限 200 bar" }
    }
    if (match[3].includes("A")) {
      return { id: record.id, policyLevel: "candidate", copySafe: false, reviewNote: "仅 1402…A 的 VC2 负压组合已确认，其余 A 组合需工程确认" }
    }
    const expectedSeries = match[1] === "AZ" ? "VSR-410UB" : "VSR-410UC"
    const expectedOutlet = { "1402": "2", "1406": "4", "1410": "7", "1415": "10" }[match[2]]
    const expectedTarget = new RegExp(`^${expectedSeries}.*-200-${expectedOutlet}-`)
    return expectedTarget.test(target)
      ? { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
      : { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: `AP/AZ1400 标准型号应对应 ${expectedSeries}-200-${expectedOutlet}` }
  }

  if (record.status === "ap71") {
    const tokens = tokenizeAptechModel(sourceModel)
    if (source !== "AP71S") {
      return { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP71S6 或其它材料扩展未在 VVGV1 材料表中确认" }
    }
    if (tokens.some((token) => token === "NP" || token === "CR")) {
      return { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP71 NP/CR 为 Neoprene/polychloroprene，不能映射为 VVGV1 的 FKM/FFKM" }
    }
    const connections = tokens.slice(1).filter((token) => KNOWN_CONNECTION.test(token)).slice(0, 3)
    const connectionMatched = connections.length === 3
      && connections[0] === "MV4"
      && connections[1] === "TW6"
      && /^(?:FV4|MV4|TW4)$/.test(connections[2])
    return connectionMatched
      ? { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
      : { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP71 的 1/4 或 3/8 face-seal vent 在 VVGV1 目录无同尺寸接口；仅 TW6 vent 可直接等效" }
  }

  if (record.status === "ap72") {
    const tokens = tokenizeAptechModel(sourceModel)
    if (source.includes("L")) {
      return { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP72L 为 20 slpm 低耗氮型，VVGV2 固定约 60 slpm，无完整等效" }
    }
    if (tokens.some((token) => ["VS", "NP", "CR"].includes(token))) {
      return { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP72 的 VS/NP/CR 阀座或密封选项在 VVGV2 订货字段中无完整映射" }
    }
    if (tokens.includes("CB005")) {
      return { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP72 目录 bleed 仅支持 CB009/CB013/CB023，CB005 组合不放行" }
    }
    const connections = tokens.slice(1).filter((token) => KNOWN_CONNECTION.test(token))
    const connectionMatched = connections.length >= 3
      && /^(?:FV4|MV4)$/.test(connections[0])
      && /^(?:FV4|MV4|TW6)$/.test(connections[1])
      && /^(?:FV4|MV4|TW4)$/.test(connections[2])
      && (connections.length < 4 || /^(?:FV4|MV4|TW4)$/.test(connections[3]))
    return connectionMatched
      ? { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
      : { id: record.id, policyLevel: "blocked", copySafe: false, reviewNote: "AP72 的 FV6/MV6 vent 在 VVGV2 目录无同尺寸接口，禁止生成不存在的连接代码" }
  }

  if (record.status === "confirmed") {
    return { id: record.id, policyLevel: "confirmed", copySafe: true, reviewNote: "" }
  }

  return {
    id: record.id,
    policyLevel: record.status,
    copySafe: false,
    reviewNote: record.note
  }
}

module.exports = { SERIES_CONFIRMATIONS, seriesConfirmation, unconfirmedOptionTokens }
