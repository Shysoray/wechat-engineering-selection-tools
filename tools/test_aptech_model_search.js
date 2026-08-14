const { matchOne } = require("../pages/aptech/utils/aptechModelMatcher")
const aptechSearchDatabase = require("../pages/aptech/utils/aptechSearchDatabase")
const { generateAptechCandidate } = require("../pages/aptech/utils/aptechRuleGenerator")
const { normalizeAptechTarget } = require("../pages/aptech/utils/aptechTargetCorrections")
const { tokenizeAptechModel } = require("../pages/aptech/utils/aptechTokenizer")
const { auditGeneratedAptechCandidate } = require("../pages/aptech/utils/aptechStructuredParser")

function normalizeExpectedVigourModel(value, sourceModel) {
  const corrected = normalizeAptechTarget(value, sourceModel)
  const parts = String(corrected || "").split("-")
  if (
    /^VDV\d+UC/.test(parts[0] || "") &&
    ["PC", "PO", "M"].includes(parts[1]) &&
    parts[2] === "A"
  ) {
    return [parts[0], parts[1], ...parts.slice(3)].join("-")
  }
  if (parts[0] === "VSR") {
    if (/^AZ10/.test(sourceModel || "") && /^100UC/.test(parts[1] || "")) {
      parts[1] = parts[1]
        .replace("100UCSLV", "100UBS")
        .replace("100UCSHP", "100UBSH")
        .replace("100UC", "100UB")
    }
    if (/^(?:AP|AZ)10/.test(sourceModel || "") && /^100/.test(parts[1] || "") && parts[2] === "10") {
      parts[2] = "20"
    }
    const isVc2OutletCorrection = (
      (/^(?:AP|AZ)1101/.test(sourceModel || "") || /^(?:AP|AZ)1402[A-Z]*A(?:\s|$)/.test(sourceModel || ""))
      && /^410/.test(parts[1] || "")
    )
    if (isVc2OutletCorrection) {
      parts[2] = "20"
      parts[3] = "VC2"
    }
    const normalizedParts = isVc2OutletCorrection ? parts.filter((part, index) => part !== "VC2" || index === 3) : parts
    const withoutHr = normalizedParts.filter((part) => part !== "HR")
    const isVsr910Or911 = /^91[01]/.test(withoutHr[1] || "")
    const hasInlet200 = withoutHr[2] === "200"
    if (isVsr910Or911 && hasInlet200 && !withoutHr.includes("VS")) {
      return [...withoutHr, "VS"].join("-")
    }
    return withoutHr.join("-")
  }
  return corrected
}

function assertTopMatch(input, expectedSourceModel, expectedVigourModel) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top) {
    throw new Error(`${input}: expected APTech candidate, received none (${result.status})`)
  }
  if (top.brand !== "APTech") {
    throw new Error(`${input}: expected APTech brand, received ${top.brand}`)
  }
  if (top.sourceModel !== expectedSourceModel) {
    throw new Error(`${input}: expected source ${expectedSourceModel}, received ${top.sourceModel}`)
  }
  if (top.vigourModel !== expectedVigourModel) {
    throw new Error(`${input}: expected ${expectedVigourModel}, received ${top.vigourModel}`)
  }
}

function assertRuleTopMatch(input, expectedVigourModel) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top) {
    throw new Error(`${input}: expected rule-generated APTech candidate, received none (${result.status})`)
  }
  if (top.matchType !== "规则生成") {
    throw new Error(`${input}: expected rule-generated top match, received ${top.matchType}`)
  }
  if (top.sourceModel !== input) {
    throw new Error(`${input}: expected generated source ${input}, received ${top.sourceModel}`)
  }
  if (top.vigourModel !== expectedVigourModel) {
    throw new Error(`${input}: expected ${expectedVigourModel}, received ${top.vigourModel}`)
  }
}

function assertGeneratedTopMatch(input, expectedVigourModel) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top) {
    throw new Error(`${input}: expected generated APTech candidate, received none (${result.status})`)
  }
  if (top.matchType !== "规则生成") {
    throw new Error(`${input}: expected generated top match, received ${top.matchType}`)
  }
  if (top.vigourModel !== expectedVigourModel) {
    throw new Error(`${input}: expected ${expectedVigourModel}, received ${top.vigourModel}`)
  }
}

function assertCopyPolicy(input, expectedCopySafe, expectedPolicyLevel) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top) {
    throw new Error(`${input}: expected APTech candidate, received none (${result.status})`)
  }
  if (top.copySafe !== expectedCopySafe) {
    throw new Error(`${input}: expected copySafe ${expectedCopySafe}, received ${top.copySafe}`)
  }
  if (top.policyLevel !== expectedPolicyLevel) {
    throw new Error(`${input}: expected policy ${expectedPolicyLevel}, received ${top.policyLevel}`)
  }
}

function assertSingleConfirmed(input, expectedVigourModel) {
  const result = matchOne(input)
  if (result.candidates.length !== 1) {
    throw new Error(`${input}: expected one candidate, received ${result.candidates.length}`)
  }
  const top = result.candidates[0]
  if (top.matchType !== "规则生成" || top.vigourModel !== expectedVigourModel) {
    throw new Error(`${input}: expected unique rule target ${expectedVigourModel}, received ${top.vigourModel}`)
  }
  if (!top.copySafe || top.policyLevel !== "confirmed") {
    throw new Error(`${input}: expected confirmed copy-safe result, received ${top.policyLevel}`)
  }
}

function assertSingleManual(input) {
  const result = matchOne(input)
  if (result.candidates.length !== 1) {
    throw new Error(`${input}: expected one manual candidate, received ${result.candidates.length}`)
  }
  const top = result.candidates[0]
  if (
    top.matchType !== "需人工确认" ||
    top.vigourModel ||
    top.copySafe ||
    top.policyLevel !== "manual"
  ) {
    throw new Error(`${input}: expected one blocked manual result, received ${top.policyLevel}`)
  }
}

function assertReviewNote(input, requiredParts, forbiddenParts = []) {
  const result = matchOne(input)
  const top = result.candidates[0]
  if (!top) throw new Error(`${input}: expected APTech candidate, received none`)

  requiredParts.forEach((part) => {
    if (!top.reviewNote.includes(part)) {
      throw new Error(`${input}: expected review note to include ${part}, received ${top.reviewNote}`)
    }
  })
  forbiddenParts.forEach((part) => {
    if (top.reviewNote.includes(part)) {
      throw new Error(`${input}: expected review note to exclude ${part}, received ${top.reviewNote}`)
    }
  })
}

function assertNoReliableRule(input) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top) {
    throw new Error(`${input}: expected blocked APTech candidate, received none (${result.status})`)
  }
  if (top.matchType !== "需人工确认") {
    throw new Error(`${input}: expected manual review block, received ${top.matchType}`)
  }
  if (top.vigourModel) {
    throw new Error(`${input}: expected no generated VIGOUR model, received ${top.vigourModel}`)
  }
}

function assertNoCandidates(input) {
  const result = matchOne(input)
  if (result.candidates.length) {
    throw new Error(`${input}: expected no candidates, received ${result.candidates[0].sourceModel}`)
  }
  if (result.level !== "missing") {
    throw new Error(`${input}: expected missing result, received ${result.level}`)
  }
}

function assertFuzzyBlocked(input, expectedReason) {
  const result = matchOne(input)
  if (result.level !== "missing" || result.candidates.length) {
    throw new Error(`${input}: expected fuzzy search to be blocked, received ${result.level}`)
  }
  if (
    !result.status.includes(expectedReason) ||
    !result.status.includes("禁止") ||
    !result.status.includes("模糊匹配")
  ) {
    throw new Error(`${input}: expected blocked reason ${expectedReason}, received ${result.status}`)
  }
}

function assertTopVigourPrefix(input, expectedPrefix) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top) {
    throw new Error(`${input}: expected APTech candidate, received none (${result.status})`)
  }
  if (!top.vigourModel || !top.vigourModel.startsWith(expectedPrefix)) {
    throw new Error(`${input}: expected VIGOUR prefix ${expectedPrefix}, received ${top.vigourModel}`)
  }
}

function assertTopVigourModel(input, expectedVigourModel) {
  const result = matchOne(input)
  const top = result.candidates[0]

  if (!top || top.vigourModel !== expectedVigourModel) {
    throw new Error(`${input}: expected ${expectedVigourModel}, received ${top && top.vigourModel}`)
  }
}

function assertCorrectedTarget(inputTarget, sourceModel, expectedTarget) {
  const actual = normalizeAptechTarget(inputTarget, sourceModel)
  if (actual !== expectedTarget) {
    throw new Error(`${sourceModel}: expected corrected ${expectedTarget}, received ${actual}`)
  }
}

assertCorrectedTarget(
  "VDV32UCSLV-M-A-MV4-MV4-P",
  "AP3625SM 2PW MV4 MV4 1/4 INCH",
  "VDV40UCSLV-M-A-MV4-MV4-P"
)

assertCorrectedTarget(
  "VSR-210UCSLV-200-7-2P-FV4-FV4-HR",
  "AP1210SM 2PW FV4 FV4 HR",
  "VSR-210UCSLV-200-7-2P-FV4-FV4-VS"
)

assertCorrectedTarget(
  "VSR-210UCSLV-200-7-2P-FV4-FV4",
  "AP1210SM 2PW FV4 FV4",
  "VSR-210UCSLV-117-7-2P-FV4-FV4"
)

assertCorrectedTarget(
  "VSR-100UCSLV-20-7-2P-FV4-FV4",
  "AP1010S 2PW FV4 FV4",
  "VSR-100UCSLV-250-7-2P-FV4-FV4"
)

assertCorrectedTarget(
  "VSR-100UCSLV-250-7-4P-FV4-P-P-FV4",
  "AP1010S 4PW FV4 FV4 1 V3",
  "VSR-100UCSLV-20-7-4P-FV4-P-P-FV4"
)

assertCorrectedTarget(
  "VSR-100UCSLV-20-7-4P-FV4-P-P-FV4",
  "AP1010S 4PW FV4 FV4 10 V3",
  "VSR-100UCSLV-250-7-4P-FV4-P-P-FV4"
)

assertCorrectedTarget(
  "VSR-210UCSLV-200-7-2P-FV8-FV8-HR-VS",
  "AZ1210S 2PW FV8 FV8 HR",
  "VSR-210UBS-200-7-2P-FV8-FV8"
)

assertCorrectedTarget(
  "VSR-910UBS-200-7-2P-FV16-FV16-VS",
  "AP9010S 2PW FV16 FV16",
  "VSR-910UBS-117-7-2P-FV16-FV16"
)

assertCorrectedTarget(
  "VSR-910UBS-200-7-2P-FV16-FV16-VS",
  "AP9110S 2PW FV16 FV16",
  "VSR-910UBS-55-7-2P-FV16-FV16"
)

assertCorrectedTarget(
  "VDV38UCSLV-M-A-MV12-MV12-P",
  "AP3125S 2PW MV12 MV12 1/2 INCH",
  "VDV38UCSLV-M-A-MV12-MV12-H-P"
)

assertCorrectedTarget(
  "VDV38UCSLV-M-A-FV8-FV8-P",
  "AP3150SM 2PW FV8 FV8 1/2 INCH",
  "VDV38UCSLV-M-A-FV8-FV8-M-P"
)

assertCorrectedTarget(
  "VDV38UCSLV-M-A-MV12-MV12-VS-LO-P",
  "AP3125S 2PW MV12 MV12 VS LO 1/2 INCH",
  "VDV38UCSLV-M-A-MV12-MV12-VS-H-LO-P"
)

assertRuleTopMatch(
  "AZ1510S 2PW FV4 FV4",
  "VSR-510UBS-250-7-2P-FV4-FV4"
)

assertNoReliableRule("AP502S 2PW FV4 FV4 P")

assertNoReliableRule("AP506SM 2P FA HF")

assertRuleTopMatch(
  "AP1002S 2PW FV4 FV4",
  "VSR-100UCSLV-250-2-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1015S 2PW FV4 FV4",
  "VSR-100UCSLV-250-10-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AZ1002S 2PW FV4 FV4",
  "VSR-100UBS-250-2-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AZ1015S 2PW FV4 FV4",
  "VSR-100UBS-250-10-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AZ1015SHP 2PW FV4 FV4",
  "VSR-100UBSH-250-10-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1010S 4PW FV4 FV4 2 H",
  "VSR-100UCSLV-20-7-4P-FV4-P-P-FV4"
)

assertRuleTopMatch(
  "AP1010S 4PW FV4 FV4 40 H",
  "VSR-100UCSLV-250-7-4P-FV4-P-P-FV4"
)

assertRuleTopMatch(
  "AZ1010S 4PW FV4 FV4 0 0",
  "VSR-100UBS-250-7-4P-FV4-P-P-FV4"
)

assertRuleTopMatch(
  "AP1101SHP 2PW FV4 FV4",
  "VSR-410UCSHP-20-VC2-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AZ1101SHP 2PW FV4 FV4",
  "VSR-410UBSH-20-VC2-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1402TSA 2PW FV4 FV4",
  "VSR-410UCSLV-20-VC2-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1215SM 2PW FV8 FV8",
  "VSR-210UCSLV-117-10-2P-FV8-FV8"
)

assertRuleTopMatch(
  "AP1210S 2PW FV4 FV4 HR",
  "VSR-210UCSLV-200-7-2P-FV4-FV4-VS"
)

assertRuleTopMatch(
  "AP1210SM 2PW FV4 FV4",
  "VSR-210UCSLV-117-7-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1210SM 2PW FV4 FV4 VS",
  "VSR-210UCSLV-117-7-2P-FV4-FV4-VS"
)

assertRuleTopMatch(
  "AP1210SM 2PW FV4 FV4 HR VS",
  "VSR-210UCSLV-200-7-2P-FV4-FV4-VS"
)

assertRuleTopMatch(
  "AZ1210S 2PW FV8 FV8",
  "VSR-210UBS-117-7-2P-FV8-FV8"
)

assertRuleTopMatch(
  "AZ1210S 2PW FV8 FV8 HR",
  "VSR-210UBS-200-7-2P-FV8-FV8"
)

assertRuleTopMatch(
  "AP1210S 2PW FV8 FV8 FC",
  "VSR-210UCSLV-20-7-2P-FV8-FV8-FC"
)

assertNoReliableRule("AZ1215S 2PW FV12 FV12 FC")

assertNoReliableRule("AP1210S 3PW FV8 FV8 IV4 FC")

assertNoReliableRule("AZ1510S 2PW FV4 FV4 109 VS")

assertRuleTopMatch(
  "AZ1510S 4PW FV4 FV4 0 0",
  "VSR-510UBS-250-7-4P-FV4-P-P-FV4"
)

assertRuleTopMatch(
  "AP1515S 2PW FV4 FV4",
  "VSR-510UCSLV-250-10-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1302SM 2PW FV8 FV8",
  "VSR-210UBS-200-2-2P-FV8-FV8-HF"
)

assertRuleTopMatch(
  "AP1310S 2PW FV8 FV8",
  "VSR-210UBS-200-7-2P-FV8-FV8-HF"
)

assertRuleTopMatch(
  "AZ1315S 2PW FV8 FV8",
  "VSR-210UBS-200-10-2P-FV8-FV8-HF"
)

assertRuleTopMatch(
  "AP1225S 2PW FV8 MV8 HR PS25",
  "VSR-210UCSLV-200-P17-2P-FV8-MV8-VS"
)

assertNoReliableRule("AP1215S 2PW FV8 MV8 HR PS25")
assertNoReliableRule("AZ1225S 2PW FV8 MV8 HR PS25")

assertRuleTopMatch(
  "AP1406TS 2PW FV4 FV4",
  "VSR-410UCSLV-200-4-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1606S 2PW FV4 FV4",
  "VSR-610UCSLV-250-4-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP1902SM 2PW FV4 FV4",
  "VSR-510UCSLV-250-2-2P-FV4-FV4-HF"
)

assertRuleTopMatch(
  "AP9010S 2PW FV8 FV8",
  "VSR-910UBS-117-7-2P-FV8-FV8"
)

assertRuleTopMatch(
  "AP9010S 2PW FV16 FV16 HR",
  "VSR-910UBS-200-7-2P-FV16-FV16-VS"
)

assertRuleTopMatch(
  "AP9030S 2PW FV12 FV12",
  "VSR-911UBS-117-P21-2P-FV12-FV12"
)

assertRuleTopMatch(
  "AP9030S2PWFV12FV12VSHR",
  "VSR-911UBS-200-P21-2P-FV12-FV12-VS"
)

assertRuleTopMatch(
  "AP9110SM 2PW FV12 FV12",
  "VSR-910UBS-55-7-2P-FV12-FV12"
)

assertRuleTopMatch(
  "AP9115S 2PW FV16 FV16",
  "VSR-910UBS-55-10-2P-FV16-FV16"
)

assertRuleTopMatch(
  "AP9110S 2PW FV16 FV16 VS",
  "VSR-910UBS-55-7-2P-FV16-FV16-VS"
)

assertRuleTopMatch(
  "KT9L0S 2PW FV4 FV4",
  "VSR-930UBS-400-170-2P-FV4-FV4-X"
)

assertRuleTopMatch(
  "KT9F1S 2PW FV4 FV4",
  "VSR-930UBS-400-35-2P-FV4-FV4"
)

assertNoCandidates("ZZ9010S 2PW FV16 FV16")

assertRuleTopMatch(
  "AZ9202S 2PW FV12 FV12",
  "VSR-920UBS-20-2-2P-FV12-FV12"
)

assertRuleTopMatch(
  "AZ9210S 3PW FV16 FV16 L",
  "VSR-920UBS-20-7-3P-FV16-P-FV16"
)

assertRuleTopMatch(
  "AP70S MV4 MV6 MV4",
  "VVG-S-MV4-MV6-MV4-EP"
)

assertRuleTopMatch(
  "AP71S MV4 MV6 MV4 CB009",
  "VVGV1S-MV4-MV6-MV4-05"
)

assertRuleTopMatch(
  "AP72550S 3PWA MV4 MV6 FV4 CB009",
  "VVGV2S-PC-B-MV4-MV6-FV4-05"
)

assertRuleTopMatch(
  "AP74050SM MV4 FV4",
  "VEFS1-SLV-MV4-FV4-050-P"
)

assertRuleTopMatch(
  "AP74BV350SM MV8 FV8",
  "VEFS2-S-V-MV8-FV8-350-P"
)

assertSingleConfirmed(
  "AP74B V350 SM MV8 FV8",
  "VEFS2-S-V-MV8-FV8-350-P"
)

assertSingleConfirmed(
  "AP74B V500 SM MV8 FV8",
  "VEFS2-S-V-MV8-FV8-500-P"
)

assertSingleConfirmed(
  "AP74B V2600 SM MV12 FV12",
  "VEFS2-S-V-MV12-FV12-2600-P"
)

assertSingleConfirmed(
  "AP74B H350 SM MV8 FV8",
  "VEFS2-S-H-MV8-FV8-350-P"
)

assertSingleConfirmed(
  "AP 74 B V2600 SM MV12 FV12",
  "VEFS2-S-V-MV12-FV12-2600-P"
)

assertSingleManual("AP74B V2600 SM MV8 FV8")
assertSingleManual("AP74B V6000 SM MV24 FV24")

assertRuleTopMatch(
  "AP 1010 S 2PW FV4 FV4",
  "VSR-100UCSLV-250-7-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AZ 1010 S 2PW FV4 FV4",
  "VSR-100UBS-250-7-2P-FV4-FV4"
)

assertRuleTopMatch(
  "AP 3125 S 2PW MV12 MV12",
  "VDV38UCSLV-M-RMV12-RMV12-H-P"
)

assertRuleTopMatch(
  "KT9 L0 S 2PW FV4 FV4",
  "VSR-930UBS-400-170-2P-FV4-FV4-X"
)

assertRuleTopMatch(
  "AP 71 S MV4 TW6 MV4 CB009",
  "VVGV1S-MV4-TW6-MV4-05"
)

assertRuleTopMatch(
  "AP64S FV4 MV4",
  "VUCV-S-FV4-MV4"
)

assertNoReliableRule("AP2702S 2PW FV8 FV8")

assertNoReliableRule("AP10PASHP 2PW FV4 FV4")

assertRuleTopMatch(
  "AP1710S 2PW FV4 FV4",
  "VSR-710UCSLV-250-7-2P-FV4-FV4"
)

assertNoReliableRule("AP4000SM 2PW MV6 MV6")

assertNoReliableRule("WB-AP4000SM 2PW MV6 MV6")

assertNoReliableRule("AZ4141S 2PW FV8 FV8 IPC")

assertRuleTopMatch(
  "AP3000S 2PW FV4 FV4",
  "VDV33UCSLV-PC-FV4-FV4-P"
)

assertRuleTopMatch(
  "AP3000S 2PWC FV4 FV4",
  "VDV33UCSLV-PC-A-FV4-FV4-P"
)

assertRuleTopMatch(
  "AP3125S 2PW MV12 MV12",
  "VDV38UCSLV-M-RMV12-RMV12-H-P"
)

assertRuleTopMatch(
  "AP3125S 2PW MV12 MV12 VS",
  "VDV38UCSLV-M-RMV12-RMV12-VS-H-P"
)

assertRuleTopMatch(
  "AP3100S 2PW MV8 MV8",
  "VDV38UCSLV-M-RMV8-RMV8-H-P"
)

assertRuleTopMatch(
  "AP3130S 2PW FV4 FV4",
  "VDV38UCSLV-PC-HFV4-HFV4-H-P"
)

assertRuleTopMatch(
  "AP3102S 2PW MV12 MV12",
  "VDV38UCSLV-M-RMV12-RMV12-M-P"
)

assertRuleTopMatch(
  "AP3113S 2PW MV8 MV8",
  "VDV38UCSLV-PC-RMV8-RMV8-M-P"
)

assertRuleTopMatch(
  "AP3150SM 2PW FV8 FV8",
  "VDV38UCSLV-M-FV8-FV8-M-P"
)

assertRuleTopMatch(
  "AP3157SM 2PW TW8 TW8",
  "VDV38UCSLV-M-TW8-TW8-M-P"
)

assertNoReliableRule("AP3157SM 2PW TW8 TW8 VS LO")

assertRuleTopMatch(
  "AP3550HM 3PWD FV4 FV4 FV4",
  "VDV32UCSLV-PO-C-FV4-FV4-FV4-P"
)

assertRuleTopMatch(
  "AP3600S 2PW FV4 FV4",
  "VDV32UCSLV-M-FV4-FV4-P"
)

assertRuleTopMatch(
  "AP3625SM 2PW MV4 MV4",
  "VDV40UCSLV-M-MV4-MV4-P"
)

assertGeneratedTopMatch(
  "AP3625SM2PWMV4MV4",
  "VDV40UCSLV-M-MV4-MV4-P"
)

assertRuleTopMatch(
  "AP3650SM 2PW MV4 MV4",
  "VDV32UCSLV-M-MV4-MV4-P"
)

assertTopVigourModel(
  "AZ3625S 2PW TW4 MV4",
  "VDV32UCSLV-M-TW4-MV4-P"
)

assertRuleTopMatch(
  "AP4600S 2PWC TW4 FV4",
  "VDV42UCSLV-M-A-TW4-FV4-P"
)

assertNoReliableRule("AZ3600S 2PW MV6 MV6")

assertTopVigourPrefix(
  "AP3000S 2PW FV4 FV4",
  "VDV33"
)

assertNoCandidates("AP3800S FV12 FV12")

assertTopVigourModel(
  "AP3800SM MV12 MV12 00",
  "VDV37UCSLV-M-RMV12-RMV12-P"
)

assertTopVigourModel(
  "AP3800SM MV12 MV12 00 VS",
  "VDV37UCSLV-M-RMV12-RMV12-VS-P"
)

assertGeneratedTopMatch(
  "AP4625SM2PWFV4FV4",
  "VDV42UCSLV-M-FV4-FV4-P"
)

assertGeneratedTopMatch(
  "AP3550SM3PWDFV4FV4FV4",
  "VDV32UCSLV-PO-C-FV4-FV4-FV4-P"
)

assertGeneratedTopMatch(
  "AP1402TSMA2PWFV4FV4",
  "VSR-410UCSLV-20-VC2-2P-FV4-FV4"
)

assertCopyPolicy("AP502S 2PW FV4 FV4 P", false, "blocked")
assertCopyPolicy("AP1001S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AZ1015S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AP1020SM 2PW FV4 FV4", false, "blocked")
assertCopyPolicy("AP1030S 2PW FV4 FV4", false, "blocked")
assertCopyPolicy("AZ1050S 2PW FV4 MV4", false, "blocked")
assertCopyPolicy("AP1101S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AZ1102S 2PW FV4 MV4 ABSOLUTE", false, "blocked")
assertCopyPolicy("AP1402TSMA 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AP1402TSMA2PWFV4FV4", true, "confirmed")
assertCopyPolicy("AP1402TSM2PWFV4FV4", true, "confirmed")
assertCopyPolicy("AP1410TS 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AZ1410TS 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AP1415TS 2PW FV4 FV4 HR", false, "blocked")
assertCopyPolicy("AP1406TSHA 2PW TW4 TW4", false, "blocked")
assertCopyPolicy("AP9010S 2PW FV16 FV16", true, "confirmed")
assertCopyPolicy("AP9030S 2PW FV12 FV12 HR", true, "confirmed")
assertFuzzyBlocked("AP9101S 2PW FV4 FV4", "压力代码不在该系列有效范围")
assertFuzzyBlocked("AP9100S MV16 MV16", "AP9100 是系列基号")
assertFuzzyBlocked("AP9100S 2PW MV16 MV16", "AP9100 是系列基号")
assertFuzzyBlocked("AP 9100 S MV16 MV16", "AP9100 是系列基号")
assertFuzzyBlocked("AP9110S MV16 MV16", "缺少 2P/3P/4P 流路字段")
assertFuzzyBlocked("AP9110S 2PW MV16", "流路数量与接口字段不一致")
assertFuzzyBlocked("AP1102S 2PW FV4 FV4", "压力代码不在该系列有效范围")
;[
  "AP500S FV4 FV4",
  "AP1000S FV4 FV4",
  "AP1100S FV4 FV4",
  "AP1200S FV8 FV8",
  "AP1300S FV8 FV8",
  "AP1400S FV4 FV4",
  "AP1500S FV4 FV4",
  "AP1600S FV4 FV4",
  "AP1700S FV4 FV4",
  "AP1900S FV4 FV4",
  "AP9000S FV16 FV16",
  "AZ9200S FV16 FV16"
].forEach((input) => assertFuzzyBlocked(input, "是系列基号"))
;[
  "AP9999S 2PW FV4 FV4",
  "AZ9999S 2PW FV4 FV4",
  "WB-AP9999S 2PW FV4 FV4",
  "AP72551S 3PW MV4 TW6 MV4 CB009"
].forEach((input) => assertFuzzyBlocked(input, "未通过目录或规则验证"))
assertCopyPolicy("AP1001S 2PW FV4 FV4 CUSTOM", false, "blocked")
assertCopyPolicy("AP9030S 2PW FV12 FV12 HR CUSTOM", false, "blocked")
assertCopyPolicy("AP3125S 2PW MV12 MV12 CUSTOM", false, "blocked")
assertCopyPolicy("AP1210S 2PW FV8 FV8 CUSTOM", false, "blocked")
assertCopyPolicy("AP1302S 2PW FV8 FV8", true, "confirmed")
assertCopyPolicy("AZ1315S 2PW FV8 FV8", true, "confirmed")
assertCopyPolicy("AP1520SM 2PW FV4 FV4 109", false, "blocked")
assertCopyPolicy("AP1502S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AZ1502S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AP1601S 2PW FV4 FV4", false, "blocked")
assertCopyPolicy("AP1702S 2PW FV4 FV4", false, "blocked")
assertCopyPolicy("AP1902S 2PW FV4 FV4", true, "confirmed")
assertFuzzyBlocked("AZ1902S 2PW FV4 FV4", "未通过目录或规则验证")
assertCopyPolicy("AZ9202S 2PW FV12 FV12", true, "confirmed")
assertCopyPolicy("AZ9210S 3PW FV16 FV16 L", true, "confirmed")
assertCopyPolicy("AZ9215S 2PW FV16 FV16 CUSTOM", false, "blocked")
assertCopyPolicy("AP3550SM 2PW FV4 FV4 CB009", false, "blocked")
assertCopyPolicy("AP3000S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AP3550SM 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("AP3625SM 2PW MV4 MV4", true, "confirmed")
assertCopyPolicy("AZ3625S 2PW TW4 MV4", true, "confirmed")
assertCopyPolicy("AP4000SM 2PW MV6 MV6", false, "blocked")
assertCopyPolicy("AP4141S 2PW FV8 FV8", false, "blocked")
assertCopyPolicy("AP3700S FV8 FV8 00 1/2 INCH", false, "candidate")
assertCopyPolicy("AZ3700S FV8 FV8 0 0 IPC 1/2 INCH", false, "candidate")
assertCopyPolicy("AP3800S MV12 MV12 00 VS 1/2 INCH", false, "candidate")
assertCopyPolicy("AP3800SM MV12 MV12 00", true, "confirmed")
assertCopyPolicy("AP3900S MV12 MV12 00 1/2 INCH", false, "candidate")
assertCopyPolicy("AP4150SM 2PW FV8 TW8 1/2 INCH", false, "blocked")
assertCopyPolicy("AZ4157S 2PW TW6 TW6 1/2 INCH", false, "blocked")
assertCopyPolicy("AP3708S FV8 MV8 00 1/2 INCH", false, "blocked")
assertCopyPolicy("AZ9600S 2PW MV16 MV16 00 1 INCH", false, "blocked")
assertCopyPolicy("AP3810SM FV8 FV8 0 1/2 INCH", false, "blocked")
assertCopyPolicy("AP3850SM FV8 FV8 B 1/2 INCH", false, "blocked")
assertCopyPolicy("AP3800SM MV12 MV12 00 CUSTOM", false, "blocked")
assertNoCandidates("AP4150SM 2PW FV8 TW8 CUSTOM")
assertCopyPolicy("AP4540SM 2PW FV8 FV8", false, "blocked")
assertCopyPolicy("AP4625SM2PWFV4FV4", true, "confirmed")
assertCopyPolicy("AP4625SM 2PW FV4 FV4 CUSTOM", false, "blocked")
assertCopyPolicy("AP3125S 2PW MV12 MV12", true, "confirmed")
assertCopyPolicy("AP1225S 2PW FV8 MV8 HR PS25", true, "confirmed")
assertCopyPolicy("AP1210S 2PW FV8 FV8", true, "confirmed")
assertCopyPolicy("AP1210S 2PW FV8 FV8 HF", true, "confirmed")
assertCopyPolicy("AZ1210S 2PW FV8 FV8 HR", true, "confirmed")
assertCopyPolicy("AP1210S 2PW FV8 FV8 FC", true, "confirmed")
assertCopyPolicy("AZ1215S 2PW FV12 FV12 FC", false, "blocked")
assertCopyPolicy("AP1210S 3PW FV8 FV8 IV4 FC", false, "blocked")
assertCopyPolicy("AP1225S 2PW FV8 FV8 FC", false, "blocked")
assertCopyPolicy("AP1210S 2PW FV4 FV4 FC", false, "blocked")
assertCopyPolicy("AP1210S 2PW FV8 FV8 FC HF", false, "blocked")
assertCopyPolicy("AP1202S 2PW FV8 FV8 HR", false, "blocked")
assertCopyPolicy("AP70S MV4 MV6 MV4", false, "blocked")
assertCopyPolicy("AP71S MV4 MV6 MV4 CB009", false, "blocked")
assertCopyPolicy("AP71S MV4 TW6 MV4 CB009", true, "confirmed")
assertCopyPolicy("AP71S MV4 TW6 MV4 CB009 NP", false, "blocked")
assertCopyPolicy("AP72550S 3PWA MV4 MV6 FV4 CB009", false, "blocked")
assertCopyPolicy("AP72540S 3PW MV4 TW6 MV4 CB009", true, "confirmed")
assertCopyPolicy("AP72540S 3PW FV4 MV4 MV4 VS", false, "blocked")
assertCopyPolicy("AP72550S 3PW MV4 MV6 FV4 CB009 NP", false, "blocked")
assertCopyPolicy("AP64S FV4 MV4", false, "blocked")
assertCopyPolicy("AP74050SM MV4 FV4", false, "blocked")
assertCopyPolicy("KT9L0S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("KT9F1S 2PW FV4 FV4", true, "confirmed")
assertCopyPolicy("KT9L0S 2PW FV4 FV4 CUSTOM", false, "manual")
assertReviewNote(
  "AP1225S 2PW FV8 MV8 HR PS25",
  [],
  ["Cv", "需确认", "目录未定义", "只适用"]
)
const ps25Evidence = matchOne("AP1225S 2PW FV8 MV8 HR PS25").candidates[0].parseAudit.supplementalEvidence
if (
  ps25Evidence.length !== 1
  || ps25Evidence[0].id !== "AP1225_PS25"
  || ps25Evidence[0].vigourCode !== "P17"
) {
  throw new Error("AP1225 PS25 must retain its confirmed PRESET 250 PSI supplemental evidence")
}
assertReviewNote(
  "AP1030S 2PW FV4 FV4",
  ["21", "超过", "10 bar"]
)
assertReviewNote(
  "AZ1102S 2PW FV4 MV4 ABSOLUTE",
  ["仅定义 1101", "不是有效目录型号"]
)
assertReviewNote(
  "AP1225S 2PW FV8 FV8 FC",
  ["FC", "不允许组合"]
)
assertReviewNote(
  "AP1210S 2PW FV4 FV4 FC",
  ["FC", "1/2 或 3/4 英寸"]
)
assertReviewNote(
  "AP1210S 2PW FV8 FV8 FC HF",
  ["FC", "HF", "不允许组合"]
)
assertReviewNote(
  "AP1202S 2PW FV8 FV8 HR",
  ["HR", "不允许组合"]
)

assertNoReliableRule("AP12255H 2PW FV8 F8")

let generatedCount = 0
let catalogCorrectionCount = 0
aptechSearchDatabase.forEach((row) => {
  const generated = generateAptechCandidate(row[1])
  if (!generated) return
  generatedCount += 1
  const expectedVigourModel = normalizeExpectedVigourModel(row[2], row[1])
  if (generated.vigourModel !== expectedVigourModel) {
    catalogCorrectionCount += 1
  }
  const audit = auditGeneratedAptechCandidate(row[1], generated.vigourModel)
  const topologyIssues = audit.blockingIssues.filter((issue) => (
    issue.includes("孔位拓扑")
    || issue.includes("VIGOUR 流路")
    || issue.includes("VIGOUR 目标需要")
    || issue.includes("接口孔位顺序")
  ))
  const invalidSourceTopology = audit.blockingIssues.some((issue) => (
    issue.includes("目录不支持流路")
    || issue.includes("目录不支持接口")
    || issue.includes("目录无法识别字段")
  ))
  if (!invalidSourceTopology && topologyIssues.length) {
    throw new Error(`${row[1]}: generated target violates catalog topology: ${topologyIssues.join("；")}`)
  }
})

if (generatedCount < 700) {
  throw new Error(`Expected at least 700 APTech rule-generated rows, checked ${generatedCount}`)
}
if (!catalogCorrectionCount) {
  throw new Error("Expected catalog-backed generation to correct at least one legacy database target")
}

let corrected1200Count = 0
aptechSearchDatabase.forEach((row) => {
  const tokens = tokenizeAptechModel(row[1])
  if (!/^(?:AP|AZ)12(?:0[1-9]|1\d|2[0-5])/.test(tokens[0] || "")) return
  if (!/^VSR-210UC/.test(row[2] || "")) return

  corrected1200Count += 1
  const target = normalizeAptechTarget(row[2], row[1])
  const parts = target.split("-")
  const hasHr = tokens.includes("HR")
  const hasFc = tokens.includes("FC")
  const isAz = /^AZ/.test(tokens[0] || "")
  const vsCount = parts.filter((part) => part === "VS").length
  const expectedInlet = hasFc ? "20" : (hasHr ? "200" : "117")

  if (parts[2] !== expectedInlet) {
    throw new Error(`${row[1]}: expected inlet ${expectedInlet}, received ${parts[2]}`)
  }
  if (isAz && !/^210UB/.test(parts[1] || "")) {
    throw new Error(`${row[1]}: AZ1200 target must use VSR-210UB, received ${target}`)
  }
  if (!isAz && !/^210UC/.test(parts[1] || "")) {
    throw new Error(`${row[1]}: AP1200 target must use VSR-210UC, received ${target}`)
  }
  if (!isAz && hasHr && !hasFc && vsCount !== 1) {
    throw new Error(`${row[1]}: AP1200 HR target must contain exactly one VS, received ${target}`)
  }
  if (isAz && vsCount !== (tokens.includes("VS") ? 1 : 0)) {
    throw new Error(`${row[1]}: AZ1200 must retain only explicit VS, received ${target}`)
  }
  if (!hasHr && tokens.includes("VS") && vsCount !== 1) {
    throw new Error(`${row[1]}: explicit VS must be retained, received ${target}`)
  }
  if (hasFc && parts.filter((part) => part === "FC").length !== 1) {
    throw new Error(`${row[1]}: FC target must contain exactly one FC, received ${target}`)
  }
})

if (corrected1200Count < 300) {
  throw new Error(`Expected at least 300 AP/AZ1200 pressure checks, checked ${corrected1200Count}`)
}

function strippedDimensionInput(value) {
  return String(value || "")
    .replace(/\s+(?:1\/4|3\/8|1\/2|3\/4|1)\s*INCH$/i, "")
    .replace(/\s+(?:1\/4|3\/8|1\/2|3\/4|1)$/i, "")
    .trim()
}

function isDiaphragmRow(row) {
  return /^VDV\d+UC/.test(row[2] || "")
}

let strippedDiaphragmCount = 0
aptechSearchDatabase.forEach((row) => {
  if (!isDiaphragmRow(row)) return
  const input = strippedDimensionInput(row[1])
  if (input === row[1]) return

  strippedDiaphragmCount += 1
  const result = matchOne(input)
  const top = result.candidates[0]
  const generated = generateAptechCandidate(input)
  const expectedVigourModel = generated
    ? generated.vigourModel
    : normalizeExpectedVigourModel(row[2], row[1])
  const audit = auditGeneratedAptechCandidate(input, expectedVigourModel)
  if (audit.blockingIssues.length) {
    if (!top || top.matchType !== "需人工确认" || top.vigourModel) {
      throw new Error(`${input}: catalog-invalid stripped input must hide the VIGOUR target`)
    }
    return
  }
  if (!top || top.vigourModel !== expectedVigourModel) {
    throw new Error(`${input}: stripped diaphragm lookup generated ${top && top.vigourModel}, expected ${expectedVigourModel}`)
  }
})

if (strippedDiaphragmCount < 1000) {
  throw new Error(`Expected at least 1000 stripped diaphragm checks, checked ${strippedDiaphragmCount}`)
}

let missingDiaphragmPortCount = 0
aptechSearchDatabase.forEach((row) => {
  if (!isDiaphragmRow(row)) return
  const sourceTokens = tokenizeAptechModel(row[1])
  const portIndex = sourceTokens.findIndex((token, index) => index > 0 && /^(?:2P(?:W[ABC]?)?|3PW[D-J]?|4PW[K-N])$/.test(token))
  if (portIndex < 0) return
  if (sourceTokens.slice(1).some((token) => /^(?:AP|AZ)\d/.test(token))) return

  const withoutPort = [...sourceTokens]
  withoutPort.splice(portIndex, 1)
  const input = strippedDimensionInput(withoutPort.join(" "))
  const result = matchOne(input)
  missingDiaphragmPortCount += 1
  if (result.level !== "missing" || result.candidates.length) {
    throw new Error(`${input}: missing diaphragm flow field must not return fuzzy candidates`)
  }
})

if (missingDiaphragmPortCount < 1000) {
  throw new Error(`Expected at least 1000 missing-port diaphragm checks, checked ${missingDiaphragmPortCount}`)
}

const missingPortInputs = new Set()
aptechSearchDatabase.forEach((row) => {
  if (!/^VSR-/.test(row[2] || "")) return

  const tokens = tokenizeAptechModel(row[1])
  if (!/^(?:AP|AZ)\d{3,4}[A-Z]*$/.test(tokens[0] || "")) return

  const portIndex = tokens.findIndex((token, index) => index > 0 && /^\dP[A-Z]*$/.test(token))
  if (portIndex < 0) return

  tokens.splice(portIndex, 1)
  missingPortInputs.add(tokens.join(" "))
})

missingPortInputs.forEach((input) => {
  const result = matchOne(input)
  if (result.level !== "missing" || result.candidates.length) {
    throw new Error(`${input}: missing regulator flow field must not return fuzzy candidates`)
  }
})

if (missingPortInputs.size < 1000) {
  throw new Error(`Expected at least 1000 missing-port regulator checks, checked ${missingPortInputs.size}`)
}

const vdv38WorkPressure = {
  3100: "H",
  3102: "M",
  3113: "M",
  3125: "H",
  3130: "H",
  3150: "M",
  3157: "M"
}
const vdvConnection = /^(?:FV|MV|TW|IV)\d+$|^CONN\?$/
let vdv38PressureCount = 0

aptechSearchDatabase.forEach((row) => {
  if (!/^VDV38UC/.test(row[2] || "")) return

  vdv38PressureCount += 1
  const sourceMatch = row[1].match(/^AP(\d{4})/)
  const expectedPressure = sourceMatch ? vdv38WorkPressure[Number(sourceMatch[1])] : ""
  const parts = row[2].split("-")
  let lastConnectionIndex = -1
  parts.forEach((part, index) => {
    if (vdvConnection.test(part)) lastConnectionIndex = index
  })

  let pressureIndex = lastConnectionIndex + 1
  if (parts[pressureIndex] === "VS") pressureIndex += 1
  if (!expectedPressure || parts[pressureIndex] !== expectedPressure) {
    throw new Error(`${row[1]}: expected VDV38 pressure ${expectedPressure}, received ${row[2]}`)
  }
})

if (vdv38PressureCount < 30) {
  throw new Error(`Expected at least 30 VDV38 pressure checks, checked ${vdv38PressureCount}`)
}

console.log("APTech model search regression passed")
