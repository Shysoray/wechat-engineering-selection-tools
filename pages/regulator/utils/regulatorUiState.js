const resetLabels = {
  inletGauge: "入口压力表口",
  outletGauge: "出口压力表口"
}

function fieldLabel(field) {
  return resetLabels[field.key] || field.label || field.key
}

function resetField(selection, field, value, reason, notices) {
  if (selection[field.key] === value) return
  selection[field.key] = value
  notices.push(`${reason}，已重置${fieldLabel(field)}`)
}

function normalizeRegulatorSelection(selection, changedField, fieldConfigs) {
  const next = { ...(selection || {}) }
  const configs = Array.isArray(fieldConfigs) ? fieldConfigs : []
  const notices = []
  const changedConfig = configs.find((field) => field.key === changedField)
  const changedLabel = changedField === "port" ? "端口形式" : fieldLabel(changedConfig || { key: changedField })
  const reason = `因${changedLabel}改为 ${next[changedField] || "空"}`
  const inletGauge = configs.find((field) => field.key === "inletGauge") || { key: "inletGauge", label: "进气压力表" }
  const outletGauge = configs.find((field) => field.key === "outletGauge") || { key: "outletGauge", label: "出气压力表" }

  if (next.port === "2P") {
    resetField(next, inletGauge, "NONE", reason, notices)
    resetField(next, outletGauge, "NONE", reason, notices)
  } else if (next.port === "3P") {
    resetField(next, inletGauge, "NONE", reason, notices)
    if (next.outletGauge === "NONE") resetField(next, outletGauge, "", reason, notices)
  } else if (next.port === "4P") {
    if (next.inletGauge === "NONE") resetField(next, inletGauge, "", reason, notices)
    if (next.outletGauge === "NONE") resetField(next, outletGauge, "", reason, notices)
  }

  configs.forEach((field) => {
    if (field.input || !Array.isArray(field.options)) return
    const value = next[field.key]
    const gaugeDisabled = (
      (next.port === "2P" && (field.key === "inletGauge" || field.key === "outletGauge")) ||
      (next.port === "3P" && field.key === "inletGauge")
    )
    if (!value || (value === "NONE" && gaugeDisabled)) return
    if (!field.options.some((option) => option.value === value)) {
      resetField(next, field, "", reason, notices)
    }
  })

  return { selection: next, notices }
}

module.exports = { normalizeRegulatorSelection }
