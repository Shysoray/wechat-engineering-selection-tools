import hashlib
import re
from pathlib import Path

from fitting_catalog_registry import build_registry


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


registry = build_registry()
summary = registry["summary"]
assert summary["relevantDocuments"] == 17
assert summary["sourceDocuments"] == 13
assert summary["targetDocuments"] == 4
assert summary["routeCoveragePercent"] == 100.0
assert summary["pageRouteCoveragePercent"] == 100.0
assert summary["sourceBrands"] == [
    "FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"
]

for document in registry["documents"]:
    assert document["businessBrand"] != "未知"
    assert digest(document["pdfPath"]) == document["attachmentSha256"]
    assert digest(document["mdPath"]) == document["documentSha256"]
    assert digest(document["pageTextPath"]) == document["pageTextSha256"]
    page_text = Path(document["pageTextPath"]).read_text(encoding="utf-8", errors="replace")
    page_numbers = [int(value) for value in re.findall(r"^## PDF 第\s*(\d+)\s*页", page_text, re.M)]
    assert page_numbers == list(range(1, document["pages"] + 1)), document["source"]

print("Fitting catalog registry coverage passed")
