const MATERIAL_ROLES = {
  SS: { role: "filter", roleLabel: "过滤元件 / FILTER" },
  Ni: { role: "filter", roleLabel: "过滤元件 / FILTER" },
  H: { role: "filter", roleLabel: "过滤元件 / FILTER" },
  PCTFE: { role: "seat", roleLabel: "阀座与密封 / SEAT & SEAL" },
  VESPEL: { role: "seat", roleLabel: "阀座与密封 / SEAT & SEAL" }
}

const CONFIDENCE_LEVELS = new Set(["verified", "provisional", "mixed", "unknown"])

function toCodeSet(value) {
  return new Set(Array.isArray(value) ? value : [])
}

function getRole(materialCode) {
  return MATERIAL_ROLES[materialCode] || { role: "other", roleLabel: "应用位置需确认" }
}

function getSpecificNote(gas, mapName, materialCode, fallback) {
  const notes = gas[mapName] || {}
  return notes[materialCode] || fallback
}

function buildConflictStatus(material, activeStatuses) {
  return {
    ...material,
    ...getRole(material.code),
    status: "conflict",
    statusText: "数据冲突",
    statusEn: "DATA CONFLICT",
    evidenceLabel: "数据校验失败",
    note: `同一材质同时存在多个状态：${activeStatuses.join("、")}。禁止据此选型，需先修正数据库。`
  }
}

function normalizeMaterialCompatibility(gas, materialOptions) {
  const compatible = toCodeSet(gas.compatibleMaterials)
  const incompatible = toCodeSet(gas.incompatibleMaterials)
  const conditional = toCodeSet(gas.conditionalMaterials)
  const restricted = toCodeSet(gas.restrictedMaterials)
  const sourceBacked = toCodeSet(gas.sourceBackedCompatibleMaterials)

  return materialOptions.map((material) => {
    const role = getRole(material.code)
    const activeStatuses = []
    if (compatible.has(material.code)) activeStatuses.push("兼容")
    if (incompatible.has(material.code)) activeStatuses.push("禁配")
    if (conditional.has(material.code)) activeStatuses.push("有条件")
    if (restricted.has(material.code)) activeStatuses.push("慎用")

    if (activeStatuses.length > 1) return buildConflictStatus(material, activeStatuses)

    if (incompatible.has(material.code)) {
      return {
        ...material,
        ...role,
        status: "incompatible",
        statusText: "禁配",
        statusEn: "INCOMPATIBLE",
        evidenceLabel: "明确不兼容记录",
        note: getSpecificNote(gas, "incompatibleMaterialNotes", material.code, gas.incompatibilityBasis || "已有资料明确提示不兼容")
      }
    }

    if (restricted.has(material.code)) {
      return {
        ...material,
        ...role,
        status: "restricted",
        statusText: "慎用",
        statusEn: "RESTRICTED",
        evidenceLabel: "限制使用记录",
        note: getSpecificNote(gas, "restrictedMaterialNotes", material.code, "需设备及材料供应商专项确认")
      }
    }

    if (conditional.has(material.code)) {
      return {
        ...material,
        ...role,
        status: "conditional",
        statusText: "有条件",
        statusEn: "CONDITIONAL",
        evidenceLabel: "受控工况初筛",
        note: getSpecificNote(gas, "conditionalMaterialNotes", material.code, "仅限经供应商确认的受控工况")
      }
    }

    if (sourceBacked.has(material.code) && !compatible.has(material.code)) {
      return buildConflictStatus(material, ["资料列入", "未登记为兼容"])
    }

    if (sourceBacked.has(material.code)) {
      return {
        ...material,
        ...role,
        status: "documented",
        statusText: "资料列入",
        statusEn: "DOCUMENTED",
        evidenceLabel: "厂商资料列入，非工况放行",
        note: getSpecificNote(gas, "materialCompatibilityNotes", material.code, "已有厂商资料列入，仍须结合实际工况确认")
      }
    }

    if (compatible.has(material.code) && gas.compatibilityConfidence === "verified") {
      return {
        ...material,
        ...role,
        status: "compatible",
        statusText: "推荐",
        statusEn: "RECOMMENDED",
        evidenceLabel: "兼容表记录",
        note: getSpecificNote(gas, "materialCompatibilityNotes", material.code, gas.compatibilityBasis || "整合表列为推荐兼容材质")
      }
    }

    if (compatible.has(material.code)) {
      return {
        ...material,
        ...role,
        status: "unverified",
        statusText: "初筛",
        statusEn: "UNVERIFIED",
        evidenceLabel: gas.compatibilityConfidence === "mixed" ? "混合证据" : "工程初筛",
        note: getSpecificNote(gas, "materialCompatibilityNotes", material.code, gas.compatibilityBasis || "尚未获得逐项供应商确认")
      }
    }

    return {
      ...material,
      ...role,
      status: "unknown",
      statusText: "未确认",
      statusEn: "UNKNOWN",
      evidenceLabel: "无直接记录",
      note: "未列入推荐材质，不代表已确认不兼容"
    }
  })
}

function buildCompatibilitySummary(statuses) {
  const meaningful = statuses.filter((item) => item.status !== "unknown")
  if (!meaningful.length) return "暂无直接材质记录，全部需要供应商确认"
  return meaningful.map((item) => `${item.code} ${item.statusText}`).join("；")
}

function validateCompatibilityDatabase(materialOptions, gases) {
  const errors = []
  const validCodes = new Set(materialOptions.map((material) => material.code))
  const seen = { id: new Set(), formula: new Set(), cas: new Set() }
  const statusFields = ["compatibleMaterials", "incompatibleMaterials", "conditionalMaterials", "restrictedMaterials"]

  gases.forEach((gas) => {
    for (const field of ["id", "formula"]) {
      const value = String(gas[field] || "").trim()
      if (!value) {
        errors.push(`${gas.formula || gas.id || "未知气体"}: 缺少 ${field}`)
      } else if (seen[field].has(value)) {
        errors.push(`${gas.formula || gas.id}: ${field} 重复 (${value})`)
      } else {
        seen[field].add(value)
      }
    }
    const cas = String(gas.cas || "").trim()
    if (cas && seen.cas.has(cas)) {
      errors.push(`${gas.formula || gas.id}: cas 重复 (${cas})`)
    } else if (cas) {
      seen.cas.add(cas)
    }

    if (!CONFIDENCE_LEVELS.has(gas.compatibilityConfidence)) {
      errors.push(`${gas.formula}: compatibilityConfidence 非法 (${gas.compatibilityConfidence})`)
    }

    const owners = Object.create(null)
    statusFields.forEach((field) => {
      const values = Array.isArray(gas[field]) ? gas[field] : []
      values.forEach((code) => {
        if (!validCodes.has(code)) errors.push(`${gas.formula}: 未知材质代码 ${code}`)
        owners[code] = owners[code] || []
        owners[code].push(field)
      })
    })
    Object.keys(owners).forEach((code) => {
      if (owners[code].length > 1) errors.push(`${gas.formula}/${code}: 状态冲突 ${owners[code].join(", ")}`)
    })

    const compatible = toCodeSet(gas.compatibleMaterials)
    for (const code of gas.sourceBackedCompatibleMaterials || []) {
      if (!compatible.has(code)) errors.push(`${gas.formula}/${code}: 有来源记录但未登记为兼容`)
      if (!getSpecificNote(gas, "materialCompatibilityNotes", code, "")) errors.push(`${gas.formula}/${code}: 缺少逐材质来源说明`)
    }

    for (const field of ["cylinderPressure", "limits", "hazards"]) {
      if (!gas[field] || typeof gas[field] !== "object") errors.push(`${gas.formula}: 缺少 ${field} 对象`)
    }
  })

  return errors
}

module.exports = {
  MATERIAL_ROLES,
  normalizeMaterialCompatibility,
  buildCompatibilitySummary,
  validateCompatibilityDatabase
}
