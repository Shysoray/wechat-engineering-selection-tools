function stripInjectedNoise(value) {
  const chars = [...value]
  return chars
    .filter((char, index) => {
      if (char === ".") {
        return /\d/.test(chars[index - 1] || "") && /\d/.test(chars[index + 1] || "")
      }
      return !/[_/·|+~#:;,，、；]/.test(char)
    })
    .join("")
}

function normalizeModelText(value) {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/[‐‑‒–—﹘﹣－]/g, "-")
    .replace(/[×＊*]/g, "X")
    .replace(/\s+/g, "")
    .trim()

  return stripInjectedNoise(normalized)
}

const TUBE_FITTING_PREFIXES = {
  FUJIKIN: ["VUW"],
  JSK: ["BHU", "CP", "FC", "FE", "FS", "MC", "ME", "MRT", "PC", "PG", "RC", "RU", "UC", "UE", "UN", "URT", "UT"],
  "TK-Fujikin": ["TBU", "TC", "TFC", "TFE", "TFS", "TMC", "TME", "TMRT", "TP", "TPC", "TR", "TRU", "TRUT", "TU", "TUC", "TUE", "TUT"],
  SUPERLOK: ["SBHU", "SC", "SFC", "SFE", "SFS", "SMC", "SME", "SMRT", "SP", "SPC", "SR", "SRU", "SRUT", "SU", "SUC", "SUE", "SUT"],
  UNILOK: ["UBU", "UC", "UEU", "UFC", "UFE", "UFS", "UMC", "UME", "UMRT", "UP", "UPC", "UR", "URBT", "URU", "UU", "UUC", "UUT"]
}

function tubeFittingBrandFromPrefix(value) {
  const prefix = (value.match(/^[A-Z]+/) || [""])[0]
  return Object.entries(TUBE_FITTING_PREFIXES).find(([, prefixes]) => (
    prefixes.includes(prefix) || (prefix.startsWith("VUW") && prefixes.includes("VUW"))
  ))?.[0] || ""
}

function modelSafetySignature(value) {
  const normalized = normalizeModelText(value)
  const parts = normalized.split("-")
  const compact = normalized.replace(/-/g, "")

  const swagelokTube = normalized.match(/^SS-([0-9]+(?:[A-Z][0-9]*)?)-/)
  if (swagelokTube) {
    return { brand: "Swagelok", profile: "tube", prefix: swagelokTube[1] }
  }

  const hasOrderingPrefix = (
    /^(?:6LV|6LW|6L)-(?:[A-Z]|\d+(?:-[A-Z0-9]+)+)/.test(normalized)
    || /^SS-[A-Z]/.test(normalized)
  )
  if (hasOrderingPrefix) {
    const hardTokens = parts.filter((token) => /^(?:M?TB|FR|FL|NS)\d+$/.test(token))
    return {
      brand: "FITOK",
      profile: "ordering",
      family: parts[1] || "",
      hardTokens
    }
  }

  if (/^UJ[RLSTX]-/.test(normalized)) {
    return { brand: "FUJIKIN", profile: "uj", family: parts[0], primary: parts[1] || "" }
  }

  const jskTubeWeld = compact.match(/^W(RLE|RLT|RLU|LT|LE)(\d+)([SV])(?:BA|EP)?$/)
  if (jskTubeWeld) {
    return {
      brand: "JSK",
      profile: "tube-weld",
      family: jskTubeWeld[1],
      size: jskTubeWeld[2],
      material: jskTubeWeld[3]
    }
  }

  const superlokWeld = compact.match(/^((?:DM|SM)\d+(?:X\d+)?)([A-Z]+?)(?:\d|$)/)
  if (superlokWeld) {
    return { brand: "SUPERLOK", profile: "weld", base: superlokWeld[1], product: superlokWeld[2] }
  }

  const tkTube = normalized.match(/^TMC-([A-Z0-9.]+)-([A-Z0-9.]+)/)
  if (tkTube) {
    const secondEnd = (tkTube[2].match(/^\d+/) || [""])[0]
    return { brand: "TK-Fujikin", profile: "tmc", firstEnd: tkTube[1], secondEnd }
  }

  const unilokConnector = normalized.match(/^UMC-([A-Z]?\d+[A-Z]*)/)
  if (unilokConnector) {
    return { brand: "UNILOK", profile: "umc", descriptor: unilokConnector[1] }
  }

  const tubeFittingBrand = tubeFittingBrandFromPrefix(normalized)
  if (tubeFittingBrand) {
    return { brand: tubeFittingBrand, profile: "tube-catalog", prefix: (normalized.match(/^[A-Z]+/) || [""])[0] }
  }

  return null
}

function isRecognizedFittingModel(value) {
  return Boolean(modelSafetySignature(value))
}

module.exports = {
  stripInjectedNoise,
  normalizeModelText,
  modelSafetySignature,
  isRecognizedFittingModel
}
