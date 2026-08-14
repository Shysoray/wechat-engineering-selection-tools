const {
  classifyQuickModel,
  filterBatchResults,
  hasMeaningfulState
} = require("../utils/uiPresentation")
const {
  saveToolState,
  readToolState,
  clearToolState
} = require("../packageFitting/sessionState")
const { modelSafetySignature } = require("../utils/fittingModelSignature")

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: ${JSON.stringify({ actual, expected })}`)
  }
}

assertEqual(classifyQuickModel("  WB-AP4000SM 2PW MV6 MV6 "), "aptech", "AP prefix")
assertEqual(classifyQuickModel("AZ4141S 2PW FV8 FV8 IPC"), "aptech", "AZ prefix")
assertEqual(classifyQuickModel("SS-4-VCR-2-GR-VS"), "fitting", "conservative fitting signature")
assertEqual(classifyQuickModel("6LV-4-VCR-3S-4TB2"), "fitting", "numeric 6LV fitting family")
assertEqual(classifyQuickModel("6LV-4"), "ambiguous", "incomplete numeric 6LV stays ambiguous")
assertEqual(classifyQuickModel("unknown model"), "ambiguous", "unknown stays ambiguous")
assertEqual(modelSafetySignature("6LV-DM4-FR4").brand, "FITOK", "FITOK signature")
assertEqual(modelSafetySignature("UJR-4.35N").brand, "FUJIKIN", "FUJIKIN signature")
assertEqual(modelSafetySignature("TMC-4-4").brand, "TK-Fujikin", "TK signature")
assertEqual(modelSafetySignature("UMC-4").brand, "UNILOK", "UNILOK signature")

const rows = [{ kind: "exact" }, { kind: "candidate" }, { kind: "missing" }, { kind: "exact", presentationKind: "candidate" }]
assertEqual(filterBatchResults(rows, "all"), rows, "all rows")
assertEqual(filterBatchResults(rows, "candidate"), [rows[1], rows[3]], "candidate presentation rows")
assertEqual(hasMeaningfulState({ input: "", results: [] }), false, "empty state")
assertEqual(hasMeaningfulState({ input: "AP1001S", results: [] }), true, "filled state")

saveToolState("aptech", { inputText: "AP1001S", results: [{ input: "AP1001S" }] })
const restored = readToolState("aptech")
restored.inputText = "mutated"
assertEqual(readToolState("aptech").inputText, "AP1001S", "state is cloned")
clearToolState("aptech")
assertEqual(readToolState("aptech"), null, "state clears")

console.log("UI presentation helpers passed")
