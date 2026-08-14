const assert = require("assert")

const { auditGeneratedAptechCandidate } = require("../pages/aptech/utils/aptechStructuredParser")
const { generateAptechDiaphragmCandidate } = require("../pages/aptech/utils/aptechDiaphragmRuleGenerator")
const { matchOne } = require("../pages/aptech/utils/aptechModelMatcher")
const {
  APTECH_TO_VIGOUR_FLOW,
  expectedVigourFlowCircuit,
  parseVigourVdvModel
} = require("../pages/aptech/utils/vigourCatalogConstraints")
const { auditVigourCatalogSource } = require("./vigour_catalog_source")

assert.strictEqual(auditVigourCatalogSource().ok, true)
assert.deepStrictEqual(APTECH_TO_VIGOUR_FLOW, {
  "2P": "", "2PW": "", "2PWA": "B", "2PWB": "K", "2PWC": "A",
  "3PWD": "C", "3PWE": "D", "3PWF": "E", "3PWG": "F", "3PWH": "G", "3PWJ": "H",
  "4PWK": "I", "4PWL": "J", "4PWM": "L", "4PWN": "M"
})

const cases = [
  ["AP3650S 2PW FV4 FV4", ""],
  ["AP3650S 2PWA FV4 FV4", "B"],
  ["AP3650S 2PWB FV4 FV4", "K"],
  ["AP3650S 2PWC FV4 FV4", "A"],
  ["AP3650S 3PWD FV4 MV4 TW4", "C"],
  ["AP3650S 3PWJ FV4 MV4 TW4", "H"],
  ["AP3650S 4PWK FV4 MV4 TW4 FV4", "I"],
  ["AP3650S 4PWN FV4 MV4 TW4 FV4", "M"]
]

cases.forEach(([sourceModel, expectedCircuit]) => {
  const candidate = generateAptechDiaphragmCandidate(sourceModel)
  assert(candidate, `${sourceModel} should generate a target`)
  assert.strictEqual(parseVigourVdvModel(candidate.vigourModel).flowCircuit, expectedCircuit)
  assert.strictEqual(expectedVigourFlowCircuit(sourceModel.split(" ")[1]), expectedCircuit)
  const audit = auditGeneratedAptechCandidate(sourceModel, candidate.vigourModel)
  assert.deepStrictEqual(audit.blockingIssues, [], `${sourceModel}: ${audit.blockingIssues.join("；")}`)
})

const wrongCircuit = auditGeneratedAptechCandidate(
  "AP3650S 2PWB FV4 FV4",
  "VDV32UCSLV-M-B-FV4-FV4-P"
)
assert(wrongCircuit.blockingIssues.some((issue) => issue.includes("孔位拓扑不等效")))

const wrongCount = auditGeneratedAptechCandidate(
  "AP3650S 3PWD FV4 MV4 TW4",
  "VDV32UCSLV-M-C-FV4-MV4-P"
)
assert(wrongCount.blockingIssues.some((issue) => issue.includes("3 个接口字段")))

const invalidAzPort = matchOne("AZ3650S 2PWB MV4 MV4")
assert.strictEqual(invalidAzPort.candidates[0].policyLevel, "blocked")
assert.strictEqual(invalidAzPort.candidates[0].vigourModel, "")
assert(invalidAzPort.candidates[0].reviewNote.includes("目录不支持流路 2PWB"))

const fixedPurge = generateAptechDiaphragmCandidate("AP3700SM MV12 MV12 MB IPC")
assert.strictEqual(fixedPurge.vigourModel, "VDV37UCSLV-PC-RMV12-RMV12-P1-P2-IS-P")
assert.deepStrictEqual(
  auditGeneratedAptechCandidate("AP3700SM MV12 MV12 MB IPC", fixedPurge.vigourModel).blockingIssues,
  []
)

const fixedManual = generateAptechDiaphragmCandidate("AP3900S MV12 MV12 00")
assert.strictEqual(fixedManual.vigourModel, "VDV37UCSLV-M-RMV12-RMV12-LO-P")
assert.strictEqual(parseVigourVdvModel(fixedManual.vigourModel).flowCircuit, "")

const highPressure = generateAptechDiaphragmCandidate("AP3125S 2PW FV4 MV12")
assert.strictEqual(highPressure.vigourModel, "VDV38UCSLV-M-HFV4-RMV12-H-P")
assert.deepStrictEqual(
  auditGeneratedAptechCandidate("AP3125S 2PW FV4 MV12", highPressure.vigourModel).blockingIssues,
  []
)

const invalidTargetConnection = auditGeneratedAptechCandidate(
  "AP4000S 2PW MV6 MV6",
  "VDV40UCSLV-PC-MV6-MV6-P"
)
assert(invalidTargetConnection.blockingIssues.some((issue) => issue.includes("VDV40 目录不支持接口 MV6")))

const invalidFixedCircuit = auditGeneratedAptechCandidate(
  "AP3800S MV12 MV12 00",
  "VDV37UCSLV-M-A-RMV12-RMV12-P"
)
assert(invalidFixedCircuit.blockingIssues.some((issue) => issue.includes("VDV37 目录不支持流路 A")))

const invalidCompoundTarget = matchOne("AP4150SM 2PW FV8 TW8 1/2 INCH")
assert.strictEqual(invalidCompoundTarget.candidates[0].policyLevel, "blocked")
assert.strictEqual(invalidCompoundTarget.candidates[0].vigourModel, "")
assert(invalidCompoundTarget.candidates[0].reviewNote.includes("VDV46 为复合阀订货结构"))

const missingDiaphragmPort = matchOne("AP3650S FV4 FV4")
assert.strictEqual(missingDiaphragmPort.level, "missing")
assert.deepStrictEqual(missingDiaphragmPort.candidates, [])

console.log("APTech/VIGOUR diaphragm port topology regression passed")
