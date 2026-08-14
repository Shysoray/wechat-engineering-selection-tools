const PORT_CODES = [
  "5PWCS",
  "4PWN",
  "4PWM",
  "4PWL",
  "4PWK",
  "4PW",
  "3PWJ",
  "3PWH",
  "3PWG",
  "3PWF",
  "3PWE",
  "3PWD",
  "3PWC",
  "3PWB",
  "3PWA",
  "3PW",
  "2PWC",
  "2PWB",
  "2PWA",
  "2PW",
  "5P",
  "4P",
  "3P",
  "2P"
]

const CONNECTION_PREFIXES = ["FV", "MV", "TW", "IV", "TV", "FS", "SF"]
const CONNECTION_SIZES = ["16", "12", "10", "8", "6", "4", "3", "2", "1"]
const OPTION_CODES = [
  "ABSOLUTE",
  "LOTOC",
  "PS25",
  "CB023",
  "CB013",
  "CB009",
  "CB005",
  "CBO09",
  "IPC",
  "IPO",
  "ISH",
  "HD",
  "PK",
  "M0",
  "0B",
  "MB",
  "SC",
  "BP",
  "FI",
  "HF",
  "HR",
  "VS",
  "TF",
  "FC",
  "NF",
  "NT",
  "PA",
  "PF",
  "IS",
  "LO",
  "KL",
  "C",
  "P"
]

function normalizeModelText(value) {
  const raw = String(value || "")
  const normalized = typeof raw.normalize === "function" ? raw.normalize("NFKC") : raw
  return normalized
    .toUpperCase()
    .replace(/[‐‑‒–—―−﹘﹣－_]/g, "-")
    .replace(/[×✕✖＊*]/g, "X")
    .replace(/(\d+\s*\/\s*\d+)\s*["″]/g, "$1 INCH")
    .replace(/\s*\/\s*/g, "/")
    .replace(/[，、；;|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function startsWithAny(value, codes) {
  return codes.find((code) => value.startsWith(code)) || ""
}

function connectionAtStart(value) {
  const prefix = CONNECTION_PREFIXES.find((item) => value.startsWith(item))
  if (!prefix) return ""

  const rest = value.slice(prefix.length)
  const size = CONNECTION_SIZES.find((item) => rest.startsWith(item))
  if (!size) return ""

  const suffix = rest.slice(size.length, size.length + 1) === "S" ? "S" : ""
  return `${prefix}${size}${suffix}`
}

function firstCodeIndex(value, startIndex) {
  let best = null

  PORT_CODES.forEach((code) => {
    const index = value.indexOf(code, startIndex)
    if (index < 0) return
    if (!best || index < best.index || (index === best.index && code.length > best.code.length)) {
      best = { index, code, type: "port" }
    }
  })

  for (let index = startIndex; index < value.length; index += 1) {
    const connection = connectionAtStart(value.slice(index))
    if (!connection) continue
    if (!best || index < best.index || (index === best.index && connection.length > best.code.length)) {
      best = { index, code: connection, type: "connection" }
    }
    break
  }

  return best
}

function splitCompactSegment(value) {
  const tokens = []
  let rest = value

  while (rest) {
    const port = startsWithAny(rest, PORT_CODES)
    if (port) {
      tokens.push(port)
      rest = rest.slice(port.length)
      continue
    }

    const connection = connectionAtStart(rest)
    if (connection) {
      tokens.push(connection)
      rest = rest.slice(connection.length)
      continue
    }

    const faceSeal = rest.match(/^(?:FA|FB|FD)/)
    if (faceSeal) {
      tokens.push(faceSeal[0])
      rest = rest.slice(faceSeal[0].length)
      continue
    }

    const option = startsWithAny(rest, OPTION_CODES)
    if (option) {
      tokens.push(option)
      rest = rest.slice(option.length)
      continue
    }

    const zeros = rest.match(/^0{2,}/)
    if (zeros) {
      tokens.push(...zeros[0].split(""))
      rest = rest.slice(zeros[0].length)
      continue
    }

    const fraction = rest.match(/^\d+\/\d+/)
    if (fraction) {
      tokens.push(fraction[0])
      rest = rest.slice(fraction[0].length)
      continue
    }

    const number = rest.match(/^\d+/)
    if (number) {
      tokens.push(number[0])
      rest = rest.slice(number[0].length)
      continue
    }

    tokens.push(rest)
    break
  }

  return tokens
}

function splitCompactToken(token) {
  const value = String(token || "")
  if (!value) return []
  if (/^(?:AP|AZ)\d{2,4}PA[A-Z]*$/.test(value) || /^AP9OPA[A-Z]*$/.test(value)) return [value]

  const directPort = startsWithAny(value, PORT_CODES)
  if (directPort) return splitCompactSegment(value)

  const directConnection = connectionAtStart(value)
  if (directConnection) {
    const rest = value.slice(directConnection.length)
    if (!rest) return [value]
    if (
      startsWithAny(rest, PORT_CODES) ||
      connectionAtStart(rest) ||
      /^(?:FA|FB|FD)/.test(rest) ||
      startsWithAny(rest, OPTION_CODES)
    ) {
      return splitCompactSegment(value)
    }
    return [value]
  }

  const splitPoint = firstCodeIndex(value, 3)
  if (!splitPoint || splitPoint.index <= 0) return [value]

  const modelToken = value.slice(0, splitPoint.index)
  const restTokens = splitCompactSegment(value.slice(splitPoint.index))
  return [modelToken, ...restTokens]
}

function mergeModelSuffixTokens(tokens) {
  const merged = []

  for (let index = 0; index < tokens.length; index += 1) {
    let token = tokens[index]
    let next = tokens[index + 1]

    if (/^(?:AP|AZ)$/.test(token) && /^\d{2,5}$/.test(next || "")) {
      token = `${token}${next}`
      index += 1
      next = tokens[index + 1]

      if (token === "AP74" && next === "B") {
        token = "AP74B"
        index += 1
        next = tokens[index + 1]
      } else if (next === "PA") {
        token = `${token}PA`
        index += 1
        next = tokens[index + 1]
      }
    }

    if (token === "KT9" && /^[DFL][01]$/.test(next || "") && tokens[index + 2] === "S") {
      merged.push(`${token}${next}S`)
      index += 2
      continue
    }

    if (token === "AP74B" && /^[HV]\d+$/.test(next || "") && /^[A-Z]+$/.test(tokens[index + 2] || "")) {
      merged.push(`${token}${next}${tokens[index + 2]}`)
      index += 2
      continue
    }

    if (token === "AP74" && /^(?:002|005|010|025|050|100)$/.test(next || "") && /^[A-Z]+$/.test(tokens[index + 2] || "")) {
      merged.push(`${token}${next}${tokens[index + 2]}`)
      index += 2
      continue
    }

    if (
      /^(?:(?:AP|AZ)\d{2,5}|(?:AP|AZ)\d{2,4}PA)$/.test(token) &&
      /^[A-Z]{1,5}$/.test(next || "") &&
      !startsWithAny(next, PORT_CODES) &&
      !connectionAtStart(next)
    ) {
      merged.push(`${token}${next}`)
      index += 1
      continue
    }
    merged.push(token)
  }

  return merged
}

function tokenizeAptechModel(value) {
  const rawTokens = normalizeModelText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .flatMap(splitCompactToken)

  return mergeModelSuffixTokens(rawTokens)
}

module.exports = {
  normalizeModelText,
  tokenizeAptechModel
}
