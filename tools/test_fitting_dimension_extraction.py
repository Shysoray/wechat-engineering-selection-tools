import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / "data/fitting-evidence/source-catalog-models.json").read_text(encoding="utf-8"))
target = json.loads((ROOT / "data/fitting-evidence/vigour-catalog-models.json").read_text(encoding="utf-8"))
source_dimensions = [record for record in source["records"] if record["dimensions"]]
target_dimensions = [record for record in target["records"] if record["dimensions"]]

assert len(source_dimensions) >= 3900
assert len(target_dimensions) >= 1100
assert set(Counter(record["brand"] for record in source_dimensions)) == {
    "FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"
}
for record in source_dimensions + target_dimensions:
    assert not record["missingDimensions"]
    for value in record["dimensions"].values():
        assert value["value"] > 0
        assert value["unit"] in {"mm", "in"}
        assert 0 < value["normalizedMm"] <= 500
    occurrence = record["occurrences"][0]
    assert occurrence["extractionMethod"] in {
        "manual_verified", "pdf_table", "pdf_coordinates", "pdf_text_line",
        "pdf_visual_ocr", "pdf_visual_ocr_layout", "pdf_text_layout"
    }
    assert occurrence["confidence"] in {"high", "medium"}

assert all(
    not any(value.get("value") is None for value in record["dimensions"].values())
    for record in source_dimensions + target_dimensions
)

def record(records, canonical):
    return next(item for item in records if item["canonicalModel"] == canonical)

assert record(source["records"], "AGFR4TB412")["dimensions"]["catalogL"]["normalizedMm"] == 43.7
assert record(source["records"], "12VCR1")["dimensions"]["catalogA"]["normalizedMm"] == 55.6
assert record(target["records"], "SSVU04")["dimensions"]["catalogL"]["normalizedMm"] == 40.89
assert record(target["records"], "VMWUE4")["dimensions"]["catalogH"]["normalizedMm"] == 10.4
print("Fitting dimension extraction evidence passed")
