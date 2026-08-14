const { normalizeModelText, tokenizeAptechModel } = require("./aptechTokenizer")
const {
  APTECH_SUPPLEMENTAL_RULES,
  CATALOG_METADATA,
  findAccessoryCatalogSeries,
  findDiaphragmCatalogSeries,
  findRegulatorCatalogSeries,
  parseCatalogSuffix
} = require("./aptechCatalogConstraints")
const {
  VIGOUR_FLOW_CIRCUITS,
  expectedVigourConnection,
  expectedVigourFlowCircuit,
  parseVigourVdvModel
} = require("./vigourCatalogConstraints")

const PORT_TOKEN = /^(\d)P([A-Z]*)$/
const CONNECTION_TOKEN = /^(FV|MV|TW|IV|TV|FS|SF)(\d+)(S?)$/
const GAUGE_TOKEN = /^(?:0|00|1|2|4|10|40|H|L|V3)$/
const DIMENSION_TOKEN = /^\d+\/\d+$/
const OPTION_TOKENS = new Set([
  "HF", "FC", "VS", "HR", "P", "TF", "FA", "FB", "FD", "KL", "ABSOLUTE",
  "IPC", "IPO", "IS", "LO", "LOTOC", "PF", "PA", "NP", "CR", "PS25",
  "CB005", "CB009", "CBO09", "CB013", "CB023", "NF", "NT", "FI", "SC", "BP", "MPA",
  "ISH", "HD", "PK", "M0", "0B", "MB", "C"
])

const BLEED_TARGETS = Object.freeze({
  CB005: "03",
  CB009: "05",
  CBO09: "05",
  CB013: "08",
  CB023: "15"
})

function sourceIdentity(token) {
  const source = String(token || "").replace(/^WB-/, "")
  const kt9 = source.match(/^KT9([DFL])([01])S$/)
  if (kt9) {
    return {
      token: source,
      brand: "APTech",
      prefix: "KT9",
      number: null,
      suffix: `${kt9[1]}${kt9[2]}S`,
      catalog: null,
      externalEvidence: true
    }
  }

  const accessory = findAccessoryCatalogSeries(source)
  if (accessory) {
    return {
      token: source,
      brand: "AP",
      prefix: "AP",
      number: null,
      suffix: "",
      catalog: {
        id: accessory.id,
        family: accessory.family,
        catalogPage: accessory.catalogPage,
        pdfPage: accessory.pdfPage,
        document: CATALOG_METADATA.document
      },
      suffixFields: {},
      suffixIssues: []
    }
  }

  const ap74Composite = source.match(/^(AP|AZ)74B[HV]\d+SM$/)
  if (ap74Composite) {
    return {
      token: source,
      brand: ap74Composite[1],
      prefix: ap74Composite[1],
      number: 74,
      suffix: "B"
    }
  }

  const match = source.match(/^(AP|AZ)(\d{2,5})([A-Z]*)$/)
  if (!match) return null
  const brand = match[1]
  const number = Number(match[2])
  const suffix = match[3] || ""
  const series = findRegulatorCatalogSeries(brand, number)
    || findDiaphragmCatalogSeries(brand, number)
  const suffixResult = series ? parseCatalogSuffix(series, number, suffix) : null
  const suffixIssues = []
  if (suffixResult && suffixResult.issue) suffixIssues.push(suffixResult.issue)
  if (suffixResult && suffixResult.unparsed) {
    suffixIssues.push(`目录未定义的型号后缀：${suffixResult.unparsed}`)
  }

  return {
    token: source,
    brand,
    prefix: brand,
    number,
    suffix,
    catalog: series
      ? {
        id: series.id,
        family: series.family,
        catalogPage: series.catalogPage,
        pdfPage: series.pdfPage,
        document: CATALOG_METADATA.document
      }
      : null,
    suffixFields: suffixResult ? suffixResult.fields : {},
    suffixIssues
  }
}

function classifyToken(token) {
  const port = String(token || "").match(PORT_TOKEN)
  if (port) return { kind: "port", portCount: Number(port[1]), circuit: port[2] || "" }

  const connection = String(token || "").match(CONNECTION_TOKEN)
  if (connection) {
    return {
      kind: "connection",
      connectionType: connection[1],
      connectionSize: connection[2],
      connectionSuffix: connection[3] || ""
    }
  }

  if (GAUGE_TOKEN.test(token)) return { kind: "gauge" }
  if (DIMENSION_TOKEN.test(token)) return { kind: "dimension" }
  if (token === "INCH") return { kind: "unit" }
  if (OPTION_TOKENS.has(token)) return { kind: "option" }
  if (/^\d+(?:\.\d+)?$/.test(token)) return { kind: "number" }
  return { kind: "unknown" }
}

function familyFromTarget(target) {
  const value = String(target || "")
  if (value.startsWith("VSR-")) return "regulator"
  if (value.startsWith("VDV")) return "diaphragm"
  if (value.startsWith("VVGV1")) return "vacuum-stage-1"
  if (value.startsWith("VVGV2")) return "vacuum-stage-2"
  if (value.startsWith("VVG")) return "vacuum-generator"
  if (value.startsWith("VEFS")) return "excess-flow-switch"
  if (value.startsWith("VUCV")) return "check-valve"
  return "unknown"
}

function catalogSeriesForIdentity(identity) {
  if (!identity || identity.number === null) return null
  return findRegulatorCatalogSeries(identity.brand, identity.number)
    || findDiaphragmCatalogSeries(identity.brand, identity.number)
}

function buildStructuredSelection(identity, tokenRecords) {
  const series = catalogSeriesForIdentity(identity)
  const port = tokenRecords.find((item) => item.kind === "port") || null
  const connectionRecords = tokenRecords.filter((item) => item.kind === "connection")
  const gaugeRecords = tokenRecords.filter((item) => item.kind === "gauge")
  const optionRecords = tokenRecords.filter((item) => item.kind === "option")
  const optionValues = optionRecords.map((item) => item.token)
  const seats = new Set(series && series.seats ? series.seats : ["VS", "TF", "PK"])
  const performance = new Set(series && series.options ? series.options : ["HF", "FC", "HR"])
  const bonnet = new Set(series && series.bonnetOptions ? series.bonnetOptions : ["P", "SC", "BP"])
  const handles = new Set(series && series.handleOptions ? series.handleOptions : ["KL"])

  return {
    catalogSeries: series ? series.id : (identity && identity.catalog ? identity.catalog.id : ""),
    modelNumber: identity ? identity.number : null,
    material: identity && identity.suffixFields ? identity.suffixFields.material || "" : "",
    roughness: identity && identity.suffixFields ? identity.suffixFields.roughness || "" : "",
    negativeAdjustment: Boolean(identity && identity.suffixFields && identity.suffixFields.negativeAdjustment),
    port: port ? { code: port.token, count: port.portCount, circuit: port.circuit } : null,
    processConnections: connectionRecords.map((item) => ({
      code: item.token,
      type: item.connectionType,
      sizeCode: item.connectionSize
    })),
    gaugePorts: gaugeRecords.map((item) => item.token),
    pressureDisplay: optionValues.includes("MPA") ? "MPA" : "",
    seatOptions: optionValues.filter((token) => seats.has(token)),
    performanceOptions: optionValues.filter((token) => performance.has(token)),
    bonnetOptions: optionValues.filter((token) => bonnet.has(token)),
    handleOptions: optionValues.filter((token) => handles.has(token)),
    indicatorOptions: optionValues.filter((token) => ["IS", "ISH", "IPC", "IPO"].includes(token)),
    purgeOptions: optionValues.filter((token) => ["C", "M0", "0B", "MB"].includes(token)),
    diaphragmMaterial: optionValues.includes("HD") ? "HD" : "",
    lockoutOptions: optionValues.filter((token) => ["LO", "LOTOC"].includes(token)),
    bleedOptions: optionValues.filter((token) => Object.prototype.hasOwnProperty.call(BLEED_TARGETS, token)),
    dimensions: tokenRecords.filter((item) => item.kind === "dimension").map((item) => ({
      value: item.token,
      unit: tokenRecords[item.index + 1] && tokenRecords[item.index + 1].token === "INCH" ? "INCH" : ""
    })),
    rawOptions: optionValues
  }
}

function parseAptechStructuredModel(value) {
  const normalizedInput = normalizeModelText(value)
  const tokens = tokenizeAptechModel(value)
  const identity = sourceIdentity(tokens[0])
  const tokenRecords = tokens.map((token, index) => ({
    index,
    token,
    ...(index === 0 ? { kind: "model" } : classifyToken(token))
  }))

  const selection = buildStructuredSelection(identity, tokenRecords)

  return {
    version: 1,
    normalizedInput,
    tokens,
    identity,
    selection,
    tokenRecords,
    ports: tokenRecords.filter((item) => item.kind === "port"),
    connections: tokenRecords.filter((item) => item.kind === "connection"),
    options: tokenRecords.filter((item) => item.kind === "option"),
    gauges: tokenRecords.filter((item) => item.kind === "gauge"),
    dimensions: tokenRecords.filter((item) => item.kind === "dimension"),
    unknown: tokenRecords.filter((item) => item.kind === "unknown")
  }
}

function targetSegments(target) {
  return new Set(String(target || "").split("-").filter(Boolean))
}

function consumeConnectionRecords(parsed, consumed, count, startIndex) {
  const records = parsed.tokenRecords
    .filter((item) => item.index >= startIndex && item.kind === "connection")
    .slice(0, count)
  records.forEach((item) => consumed.set(item.index, "connection"))
  return records
}

function consumeFixedDiaphragmLayout(parsed, consumed, blockingIssues) {
  const connections = consumeConnectionRecords(parsed, consumed, 2, 1)
  if (connections.length !== 2) {
    blockingIssues.push(`固定两通阀需要 2 个配管接口，实际解析到 ${connections.length} 个`)
    return
  }

  const nextIndex = Math.max(...connections.map((item) => item.index)) + 1
  const first = parsed.tokenRecords[nextIndex]
  const second = parsed.tokenRecords[nextIndex + 1]
  if (first && first.token === "00") {
    consumed.set(first.index, "purge-port-default")
  } else if (first && second && first.token === "0" && second.token === "0") {
    consumed.set(first.index, "purge-port-default")
    consumed.set(second.index, "purge-port-default")
  }
}

function consumeDimensionAnnotations(parsed, consumed) {
  parsed.dimensions.forEach((item) => {
    consumed.set(item.index, "catalog-size-annotation")
    const unit = parsed.tokenRecords[item.index + 1]
    if (unit && unit.kind === "unit") consumed.set(unit.index, "dimension-unit")
  })
}

function consumePortLayout(parsed, consumed, blockingIssues, targetFamily) {
  if (!parsed.ports.length) return null
  if (parsed.ports.length > 1) {
    blockingIssues.push(`存在多个流路字段：${parsed.ports.map((item) => item.token).join("、")}`)
    return null
  }

  const port = parsed.ports[0]
  consumed.set(port.index, "port")
  const expectedCount = port.portCount
  let cursor = port.index + 1

  if (expectedCount === 2 && parsed.tokens[cursor] === "FA") {
    consumed.set(cursor, "face-seal-port")
    if (targetFamily === "diaphragm") {
      blockingIssues.push("FA 接口尚未解析为可订购的 VIGOUR 连接代码")
    }
    return { token: port.token, count: expectedCount, values: ["FA"] }
  }

  const values = []
  while (cursor < parsed.tokenRecords.length && values.length < expectedCount) {
    const record = parsed.tokenRecords[cursor]
    if (record.kind !== "connection" && record.kind !== "gauge") break
    consumed.set(record.index, record.kind === "connection" ? "connection" : "port-placeholder")
    values.push(record.token)
    cursor += 1
  }

  if (values.length !== expectedCount) {
    blockingIssues.push(`流路 ${port.token} 需要 ${expectedCount} 个接口字段，实际解析到 ${values.length} 个`)
  }

  return { token: port.token, count: expectedCount, values }
}

function optionMappedToTarget(token, family, segments, target) {
  if (["HF", "FC", "VS"].includes(token)) return segments.has(token)
  if (token === "HR") return segments.has("200")
  if (token === "PS25" && family === "regulator") return segments.has("P17")
  if (["IPC", "IPO", "IS"].includes(token)) return segments.has("IS")
  if (["PF", "PA"].includes(token)) return segments.has("PA")
  if (["LO", "LOTOC"].includes(token)) return segments.has("LO")
  if (token === "M0") return segments.has("P1") && !segments.has("P2")
  if (token === "0B") return segments.has("P2") && !segments.has("P1")
  if (token === "MB") return segments.has("P1") && segments.has("P2")
  if (Object.prototype.hasOwnProperty.call(BLEED_TARGETS, token)) return segments.has(BLEED_TARGETS[token])
  if (token === "P" && /^VSR-930/.test(target)) return segments.has("P")
  if (token === "FA" && family === "regulator") return true
  return false
}

function addOptionConflicts(parsed, blockingIssues) {
  const optionValues = parsed.options.map((item) => item.token)
  const optionSet = new Set(optionValues)
  const duplicates = optionValues.filter((token, index) => optionValues.indexOf(token) !== index)
  if (duplicates.length) {
    blockingIssues.push(`选项重复：${[...new Set(duplicates)].join("、")}`)
  }
  if (optionSet.has("IPC") && optionSet.has("IPO")) {
    blockingIssues.push("IPC 与 IPO 动作选项互相冲突")
  }
  if (optionSet.has("FC") && (optionSet.has("HF") || optionSet.has("HR"))) {
    blockingIssues.push("FC 与 HF/HR 选项互相冲突")
  }
}

function catalogSelectionIssues(parsed, catalogSeries, port, blockingIssues) {
  if (!catalogSeries) return

  if (catalogSeries.family === "diaphragm") {
    const allowedSelections = new Set(catalogSeries.allowedSelections || [])
    parsed.options.forEach((item) => {
      if (!allowedSelections.has(item.token)) {
        blockingIssues.push(`${catalogSeries.id} 目录未定义选项 ${item.token}`)
      }
      const allowedNumbers = catalogSeries.optionApplicability
        ? catalogSeries.optionApplicability[item.token]
        : null
      if (allowedNumbers && !allowedNumbers.includes(parsed.identity.number)) {
        blockingIssues.push(`${item.token} 不适用于 ${parsed.identity.brand}${parsed.identity.number}`)
      }
    })

    const optionSet = new Set(parsed.options.map((item) => item.token))
    const material = parsed.identity && parsed.identity.suffixFields
      ? parsed.identity.suffixFields.material
      : ""
    if (material === "H" && optionSet.has("VS")) {
      blockingIssues.push("Ni-Cr-Mo 合金阀体不能与 VS 聚酰亚胺阀座组合")
    }
    return
  }

  if (catalogSeries.family !== "regulator") return

  const allowedOptions = new Set([
    ...(catalogSeries.seats || []),
    ...(catalogSeries.options || []),
    ...(catalogSeries.bonnetOptions || []),
    ...(catalogSeries.handleOptions || []),
    "MPA"
  ])
  const optionSet = new Set(parsed.options.map((item) => item.token))
  const confirmedAp1225Ps25 = (
    catalogSeries.id === "AP1200"
    && parsed.identity.brand === "AP"
    && parsed.identity.number === 1225
    && optionSet.has("PS25")
  )
  parsed.options.forEach((item) => {
    if (!allowedOptions.has(item.token) && !(item.token === "PS25" && confirmedAp1225Ps25)) {
      blockingIssues.push(`${catalogSeries.id} 目录未定义选项 ${item.token}`)
    }
  })

  parsed.gauges.forEach((item) => {
    if (!(catalogSeries.gauges || []).includes(item.token)) {
      blockingIssues.push(`${catalogSeries.id} 目录未定义压力表代码 ${item.token}`)
    }
  })

  if (port) {
    const portRecords = parsed.tokenRecords.slice(
      parsed.ports[0].index + 1,
      parsed.ports[0].index + 1 + port.count
    )
    portRecords.forEach((record, index) => {
      const expectedKind = index < 2 ? "connection" : "gauge"
      if (record && record.kind !== expectedKind) {
        blockingIssues.push(`${port.token} 的第 ${index + 1} 个端口字段应为${expectedKind === "connection" ? "配管接口" : "压力表代码"}`)
      }
    })
    if (parsed.connections.length > 2) {
      blockingIssues.push(`${catalogSeries.id} 的入口/出口配管接口不能超过 2 个`)
    }
  }

  const material = parsed.identity && parsed.identity.suffixFields
    ? parsed.identity.suffixFields.material
    : ""
  if (optionSet.has("VS") && material && material !== "S") {
    blockingIssues.push(`材质 ${material} 不能与 VS 聚酰亚胺阀座组合`)
  }
  if (optionSet.has("MPA")) {
    const hasGauge = parsed.gauges.some((item) => item.token !== "0")
    if (!hasGauge) blockingIssues.push("选择 MPA 显示时必须同时选择压力表")
  }

  if (catalogSeries.id === "AP500") {
    if (parsed.identity.number === 515 && !optionSet.has("HR")) {
      blockingIssues.push("AP515 目录要求同时选择 HR")
    }
    if (parsed.identity.number === 501 && parsed.identity.suffixFields.negativeAdjustment) {
      if (optionSet.has("VS") || optionSet.has("HF")) {
        blockingIssues.push("AP501 负压调节型不能选择 VS 或 HF")
      }
    }
  }

  if (["AP1200", "AZ1200"].includes(catalogSeries.id)) {
    if (optionSet.has("FC") && ![1210, 1215].includes(parsed.identity.number)) {
      blockingIssues.push(`${catalogSeries.id} 的 FC 只适用于 1210 和 1215`)
    }
    if (optionSet.has("HR") && ![1210, 1215, 1225].includes(parsed.identity.number)) {
      blockingIssues.push(`${catalogSeries.id} 的 HR 只适用于 1210、1215 和 1225`)
    }
    if (optionSet.has("PS25") && !confirmedAp1225Ps25) {
      blockingIssues.push("PS25 隐藏代码仅已确认用于 AP1225（PRESET 250 PSI / VIGOUR P17）")
    }
    if (optionSet.has("FC")) {
      const allowedSizes = catalogSeries.id === "AP1200" ? new Set(["8", "12"]) : new Set(["8"])
      const processConnections = parsed.connections.slice(0, 2)
      if (processConnections.length !== 2 || processConnections.some((item) => !allowedSizes.has(item.connectionSize))) {
        blockingIssues.push(`${catalogSeries.id} 的 FC 仅允许目录规定的 1/2${catalogSeries.id === "AP1200" ? " 或 3/4" : ""} 接口`)
      }
    }
    if (parsed.identity.number === 1225 && optionSet.has("KL")) {
      blockingIssues.push(`${catalogSeries.id.replace("1200", "1225")} 不支持 KL`)
    }
  }

  if (["AP1400T", "AZ1400T"].includes(catalogSeries.id)) {
    if (optionSet.has("HR") && [1402, 1406].includes(parsed.identity.number)) {
      blockingIssues.push(`${catalogSeries.id} 的 1402/1406 压力档不支持 HR`)
    }
  }
}

function auditGeneratedAptechCandidate(sourceModel, vigourModel, options = {}) {
  const parsed = parseAptechStructuredModel(sourceModel)
  const family = familyFromTarget(vigourModel)
  const consumed = new Map()
  const blockingIssues = []

  if (parsed.identity) consumed.set(0, "model")
  else blockingIssues.push("无法解析 APTech 来源型号")

  if (parsed.identity && !parsed.identity.catalog && !parsed.identity.externalEvidence) {
    blockingIssues.push(`来源型号未在 ${CATALOG_METADATA.catalogNumber} 目录中定义`)
  }
  if (parsed.identity && parsed.identity.suffixIssues && parsed.identity.suffixIssues.length) {
    blockingIssues.push(...parsed.identity.suffixIssues)
  }

  if (/\?|--|-$/.test(String(vigourModel || ""))) {
    blockingIssues.push("VIGOUR 目标型号包含占位符或空字段")
  }

  addOptionConflicts(parsed, blockingIssues)

  const catalogSeries = catalogSeriesForIdentity(parsed.identity)
  if (catalogSeries && parsed.ports.length) {
    parsed.ports.forEach((item) => {
      if (catalogSeries.ports && !catalogSeries.ports.includes(item.token)) {
        blockingIssues.push(`${catalogSeries.id} 目录不支持流路 ${item.token}`)
      }
    })
  }
  if (catalogSeries && catalogSeries.connections) {
    parsed.connections.forEach((item) => {
      if (!catalogSeries.connections.includes(item.token)) {
        blockingIssues.push(`${catalogSeries.id} 目录不支持接口 ${item.token}`)
      }
    })
  }
  if (parsed.unknown.length) {
    blockingIssues.push(`目录无法识别字段：${parsed.unknown.map((item) => item.token).join("、")}`)
  }

  let port = null
  if (["regulator", "diaphragm", "vacuum-stage-2"].includes(family)) {
    if (family === "diaphragm" && catalogSeries && catalogSeries.fixedLayout) {
      if (parsed.ports.length) {
        blockingIssues.push(`${catalogSeries.id} 目录采用固定入口/出口布局，不接受流路代码 ${parsed.ports[0].token}`)
      }
      consumeFixedDiaphragmLayout(parsed, consumed, blockingIssues)
    } else if (family === "diaphragm" && catalogSeries && !parsed.ports.length) {
      blockingIssues.push(`${catalogSeries.id} 目录要求明确孔位代码`)
      consumeFixedDiaphragmLayout(parsed, consumed, blockingIssues)
    } else if (family === "diaphragm" && !parsed.ports.length) {
      consumeFixedDiaphragmLayout(parsed, consumed, blockingIssues)
    } else {
      port = consumePortLayout(parsed, consumed, blockingIssues, family)
    }
  } else if (family === "vacuum-generator") {
    if (parsed.ports.length === 1) consumed.set(parsed.ports[0].index, "port")
    consumeConnectionRecords(parsed, consumed, 3, 1)
  } else if (family === "vacuum-stage-1") {
    consumeConnectionRecords(parsed, consumed, 3, 1)
  } else if (["excess-flow-switch", "check-valve"].includes(family)) {
    consumeConnectionRecords(parsed, consumed, 2, 1)
  }

  catalogSelectionIssues(parsed, catalogSeries, port, blockingIssues)
  consumeDimensionAnnotations(parsed, consumed)

  let targetCatalog = null
  if (family === "diaphragm") {
    targetCatalog = parseVigourVdvModel(vigourModel)
    if (!targetCatalog.series) {
      blockingIssues.push("VIGOUR 目标隔膜阀系列未在 VUPS 目录中定义")
    }

    const targetOrdering = targetCatalog.series && targetCatalog.series.ordering
    if (targetOrdering) {
      if (!targetOrdering.variants.includes(targetCatalog.variant)) {
        blockingIssues.push(`VIGOUR ${targetCatalog.series.id} 目录未定义材质型号 ${targetCatalog.head}`)
      }
      if (targetOrdering.schema === "compound-valve") {
        blockingIssues.push(`VIGOUR ${targetCatalog.series.id} 为复合阀订货结构，不能按普通两通阀型号生成`)
      } else if (!targetOrdering.actuators.includes(targetCatalog.actuator)) {
        blockingIssues.push(`VIGOUR ${targetCatalog.series.id} 目录不支持执行器 ${targetCatalog.actuator || "缺失"}`)
      }
      if (!targetOrdering.flowCircuits.includes(targetCatalog.flowCircuit)) {
        blockingIssues.push(`VIGOUR ${targetCatalog.series.id} 目录不支持流路 ${targetCatalog.flowCircuit || "标准直通"}`)
      }
      const invalidTargetConnections = targetCatalog.connections.filter((connection) => (
        !targetOrdering.connections.includes(connection)
      ))
      if (invalidTargetConnections.length) {
        blockingIssues.push(
          `VIGOUR ${targetCatalog.series.id} 目录不支持接口 ${[...new Set(invalidTargetConnections)].join("、")}`
        )
      }
    }

    const sourcePortCode = port ? port.token : ""
    const expectedCircuit = sourcePortCode ? expectedVigourFlowCircuit(sourcePortCode) : ""
    if (sourcePortCode && expectedCircuit === null) {
      blockingIssues.push(`APTech 孔位 ${sourcePortCode} 尚无 VIGOUR 目录拓扑映射`)
    } else if (sourcePortCode && targetCatalog.flowCircuit !== expectedCircuit) {
      blockingIssues.push(
        `孔位拓扑不等效：${sourcePortCode} 应对应 VIGOUR ${expectedCircuit || "标准直通"}，实际为 ${targetCatalog.flowCircuit || "标准直通"}`
      )
    }

    const expectedPortCount = port ? port.count : 2
    const targetCircuit = VIGOUR_FLOW_CIRCUITS[targetCatalog.flowCircuit]
    if (targetCircuit && targetCircuit.portCount !== expectedPortCount) {
      blockingIssues.push(`VIGOUR 流路 ${targetCatalog.flowCircuit || "标准直通"} 的端口数与 APTech 不一致`)
    }
    if (targetCatalog.connections.length !== expectedPortCount) {
      blockingIssues.push(`VIGOUR 目标需要 ${expectedPortCount} 个接口字段，实际解析到 ${targetCatalog.connections.length} 个`)
    }

    const sourceConnections = parsed.connections.slice(0, expectedPortCount).map((item) => item.token)
    const expectedTargetConnections = sourceConnections.map((connection) => (
      expectedVigourConnection(targetCatalog.series && targetCatalog.series.id, connection)
    ))
    if (
      sourceConnections.length === expectedPortCount
      && targetCatalog.connections.length === expectedPortCount
      && expectedTargetConnections.some((connection, index) => connection !== targetCatalog.connections[index])
    ) {
      blockingIssues.push(
        `接口孔位顺序不一致：APTech ${sourceConnections.join("/")}，VIGOUR 应为 ${expectedTargetConnections.join("/")}，实际为 ${targetCatalog.connections.join("/")}`
      )
    }
  }

  const segments = targetSegments(vigourModel)
  parsed.options.forEach((record) => {
    if (consumed.has(record.index)) return
    if (optionMappedToTarget(record.token, family, segments, vigourModel)) {
      consumed.set(record.index, "mapped-option")
    }
  })

  const unconsumedRecords = parsed.tokenRecords.filter((record) => record.index > 0 && !consumed.has(record.index))
  const unconsumedTokens = unconsumedRecords.map((record) => record.token)
  const reviewIssues = []
  const supplementalEvidence = (
    parsed.identity
    && parsed.identity.brand === "AP"
    && parsed.identity.number === 1225
    && parsed.options.some((item) => item.token === "PS25")
    && targetSegments(vigourModel).has(APTECH_SUPPLEMENTAL_RULES.AP1225_PS25.vigourCode)
  ) ? [APTECH_SUPPLEMENTAL_RULES.AP1225_PS25] : []

  const invalidStructuralRecords = unconsumedRecords.filter((record) => (
    ["port", "connection", "gauge", "number", "unknown"].includes(record.kind)
  ))
  if (invalidStructuralRecords.length) {
    blockingIssues.push(`字段位置或数量不符合目录：${invalidStructuralRecords.map((item) => item.token).join("、")}`)
  }

  if (!blockingIssues.length && unconsumedTokens.length) {
    reviewIssues.push(`未完成字段映射：${unconsumedTokens.join("、")}`)
  }
  if (!blockingIssues.length && parsed.dimensions.length) {
    reviewIssues.push(`目录尺寸字段已解析，VIGOUR 尺寸等效待验证：${parsed.dimensions.map((item) => `${item.token} INCH`).join("、")}`)
  }

  return {
    version: 1,
    family,
    source: parsed.identity,
    selection: parsed.selection,
    catalogEvidence: parsed.identity && parsed.identity.catalog,
    supplementalEvidence,
    targetCatalogEvidence: targetCatalog && targetCatalog.series
      ? {
        id: targetCatalog.series.id,
        document: "VIGOUR VUPS英文目录-26.8.7.pdf",
        pdfPages: targetCatalog.series.pdfPages,
        flowCircuitPdfPage: 74
      }
      : null,
    port,
    connections: parsed.connections.map((item) => item.token),
    options: parsed.options.map((item) => item.token),
    dimensions: parsed.dimensions.map((item) => item.token),
    consumedTokens: parsed.tokenRecords.filter((item) => consumed.has(item.index)).map((item) => item.token),
    unconsumedTokens,
    blockingIssues,
    reviewIssues,
    complete: blockingIssues.length === 0 && reviewIssues.length === 0
  }
}

module.exports = {
  auditGeneratedAptechCandidate,
  parseAptechStructuredModel
}
