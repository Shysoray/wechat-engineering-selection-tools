import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / "data/fitting-evidence/source-catalog-models.json").read_text(encoding="utf-8"))
target = json.loads((ROOT / "data/fitting-evidence/vigour-catalog-models.json").read_text(encoding="utf-8"))

assert source["summary"]["recordCount"] == len(source["records"])
assert target["summary"]["recordCount"] == len(target["records"])
assert source["summary"]["recordCount"] > 5000
assert target["summary"]["recordCount"] > 3000
assert {record["brand"] for record in source["records"]} == {
    "FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"
}
for record in source["records"] + target["records"]:
    assert record["canonicalModel"]
    assert record["occurrences"]
    occurrence = record["occurrences"][0]
    assert occurrence["pageTextPath"]
    assert occurrence.get("pdfPage") or occurrence.get("pdfPages")
    assert occurrence["extractionMethod"] in {
        "page_text", "manual_verified", "pdf_table", "pdf_coordinates", "pdf_text_line",
        "pdf_visual_ocr", "pdf_visual_ocr_layout", "pdf_text_layout"
    }

print("Fitting catalog model extraction coverage passed")
