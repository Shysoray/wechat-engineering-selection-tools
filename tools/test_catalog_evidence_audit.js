const assert = require("assert")

const {
  auditRows,
  hasExactModel,
  rowsToTsv,
  splitModelOptions
} = require("./catalog_evidence_audit")

function run() {
  assert.strictEqual(
    hasExactModel("Example: SS-400-1-4BQ", "SS-400-1-4"),
    false,
    "model evidence must not treat longer suffix variants as exact hits"
  )

  assert.strictEqual(
    hasExactModel("SS-810-7-4RJ SS-810-7-6RJ SS-810-7-8RJ", "SS-810-7-6RJ"),
    true,
    "model evidence should match complete model tokens inside catalog rows"
  )

  assert.deepStrictEqual(
    splitModelOptions("SS-VFF-04 / SS-VBF-04"),
    ["SS-VFF-04", "SS-VBF-04"],
    "slash-separated VIGOUR targets should be audited independently"
  )

  const rows = [
    {
      brand: "Swagelok",
      sourceModel: "SS-400-1-4",
      vigourModel: "SS-VMC-04-M4 / SS-VMC-04-M6",
      productName: "Male Connector"
    },
    {
      brand: "Swagelok",
      sourceModel: "SS-400-1-4BQ",
      vigourModel: "SS-VMC-04-M4",
      productName: "Male Connector"
    },
    {
      brand: "Swagelok",
      sourceModel: "316L-4-ATW-3",
      vigourModel: "VWR-FT4",
      productName: "Automatic tube weld"
    }
  ]

  const report = auditRows(rows, {
    sourceCatalogTextByBrand: {
      Swagelok: "SS-400-1-4 SS-810-7-6RJ"
    },
    sourceCatalogScopeByBrand: {
      Swagelok: "swagelok_tube"
    },
    targetCatalogText: "SS-VMC-04-M4\nSS-VMC-04-M6"
  })

  assert.strictEqual(report.rows[0].sourceEvidence.status, "source_exact")
  assert.strictEqual(report.rows[0].targetEvidence.status, "target_exact")
  assert.strictEqual(report.rows[0].overallStatus, "catalog_supported")
  assert.strictEqual(report.rows[1].sourceEvidence.status, "source_missing")
  assert.strictEqual(report.rows[1].overallStatus, "target_supported_source_missing")
  assert.strictEqual(report.rows[2].sourceFamily, "swagelok_weld_or_vcr")
  assert.strictEqual(report.rows[2].sourceEvidence.status, "source_catalog_unavailable_for_family")
  assert.strictEqual(report.rows[2].overallStatus, "source_family_not_in_pilot")

  const tsv = rowsToTsv(report.rows.slice(0, 1))
  assert.ok(tsv.startsWith("brand\tsourceFamily\tsourceModel\tvigourModel\tproductName\toverallStatus"))
  assert.ok(tsv.includes("Swagelok\tswagelok_tube\tSS-400-1-4\tSS-VMC-04-M4 / SS-VMC-04-M6"))
}

run()
console.log("catalog evidence audit tests passed")
