#!/usr/bin/env python3
"""Build the fitting-catalog source registry from the read-only Markdown KB."""

from __future__ import annotations

import csv
import hashlib
import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB_ROOT = Path(
    os.environ.get(
        "FITTING_KB_ROOT",
        "/Users/maybe/Documents/ChatGPT/mark/MarkItDown-KB",
    )
)
MANIFEST = KB_ROOT / "manifest.json"
DATA_OUTPUT = ROOT / "data/fitting-evidence/catalog-sources.json"
AUDIT_DIR = ROOT / "outputs/fitting_dimension_audit"

RELATED_CATEGORIES = {
    "01-卡套接头",
    "02-面密封与VCR",
    "03-焊接接头",
    "04-VIGOUR",
}

# Business routing is intentionally explicit. It corrects catalog front matter
# without changing the read-only knowledge base.
BUSINESS_ROUTES = {
    "6D_Series_Tube_Fittings_ZH.pdf": ("FITOK", "tube_fitting", "source"),
    "SUPERLOK-TUBE-FITTINGS.pdf": ("SUPERLOK", "tube_fitting", "source"),
    "swagelok-卡套.pdf": ("Swagelok", "tube_fitting", "source"),
    "UNILOK-卡套.pdf": ("UNILOK", "tube_fitting", "source"),
    "Face_Seal_Fittings_ZH.pdf": ("FITOK", "face_seal", "source"),
    "Fujikin-UJR接头系列.pdf": ("FUJIKIN", "face_seal", "source"),
    "JSK-VCR.pdf": ("JSK", "face_seal", "source"),
    "Swagelok-VCR-EN.pdf": ("Swagelok", "face_seal", "source"),
    "UNILOK-VCR.pdf": ("UNILOK", "face_seal", "source"),
    "JSK-Micro fitting.pdf": ("JSK", "weld_fitting", "source"),
    "UHP-WELD-CLEAN-FITTINGS (2).pdf": ("SUPERLOK", "weld_fitting", "source"),
    "WELD & METAL SEAL FITTINGS (2).pdf": ("TK-Fujikin", "weld_and_metal_seal", "source"),
    "Weld_Fittings_ZH.pdf": ("FITOK", "weld_fitting", "source"),
    "VIGOUR VUPS接头目录 英文-26.8.6.pdf": ("VIGOUR", "VUPS", "target"),
    "VIGOUR VUPS英文目录-26.8.7.pdf": ("VIGOUR", "VUPS", "target"),
    "VIGOUR VHPS接头目录 英文-26.8.7.pdf": ("VIGOUR", "VHPS", "target"),
    "VIGOUR VHPS英文目录-26.8.7.pdf": ("VIGOUR", "VHPS", "target"),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def table_widths(text: str) -> list[int]:
    widths = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            widths.append(max(0, stripped.count("|") - 1))
    return widths


def extraction_risks(document_text: str, page_text: str, expected_pages: int) -> list[dict]:
    risks = []
    if "\x00" in document_text:
        risks.append({"code": "nul_bytes", "severity": "high", "action": "逐页回查原 PDF"})
    replacement_count = document_text.count("\ufffd") + page_text.count("\ufffd")
    if replacement_count:
        risks.append({
            "code": "encoding_replacement",
            "severity": "high",
            "detail": str(replacement_count),
            "action": "回查原 PDF 并人工确认字符",
        })
    page_numbers = [int(value) for value in re.findall(r"^## PDF 第\s*(\d+)\s*页", page_text, re.M)]
    expected = list(range(1, expected_pages + 1))
    if page_numbers != expected:
        missing = sorted(set(expected) - set(page_numbers))
        risks.append({
            "code": "page_number_gap",
            "severity": "high",
            "detail": ",".join(map(str, missing)) or "order_or_duplicate",
            "action": "修正页码路由后再提取",
        })
    widths = table_widths(document_text)
    if widths and len(set(widths)) > 8:
        risks.append({
            "code": "table_column_drift",
            "severity": "medium",
            "detail": f"{min(widths)}-{max(widths)} columns",
            "action": "不稳定表格转入逐页 PDF 复核",
        })
    spaced_tokens = len(re.findall(r"(?:\b[A-Z]\s+){3,}[A-Z]\b", page_text))
    if spaced_tokens >= 5:
        risks.append({
            "code": "spaced_or_reverse_text",
            "severity": "medium",
            "detail": str(spaced_tokens),
            "action": "结合 PDF 图片确认文字方向与列归属",
        })
    return risks


def build_registry() -> dict:
    if not MANIFEST.exists():
        raise FileNotFoundError(f"Missing fitting knowledge-base manifest: {MANIFEST}")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    documents = []
    unknown_routes = []

    for entry in manifest:
        if entry.get("category") not in RELATED_CATEGORIES:
            continue
        route = BUSINESS_ROUTES.get(entry.get("source"))
        if not route:
            unknown_routes.append(entry.get("source", ""))
            continue
        brand, family, role = route
        document_path = KB_ROOT / entry["document"]
        attachment_path = KB_ROOT / entry["attachment"]
        page_text_path = KB_ROOT / "audit/page-text" / f"{Path(entry['source']).stem}.md"
        for required in (document_path, attachment_path, page_text_path):
            if not required.exists():
                raise FileNotFoundError(f"Missing registered catalog support file: {required}")

        actual_attachment_hash = sha256(attachment_path)
        if actual_attachment_hash != entry.get("sha256"):
            raise ValueError(
                f"Attachment hash mismatch for {entry['source']}: "
                f"manifest={entry.get('sha256')} actual={actual_attachment_hash}"
            )
        document_text = read_text(document_path)
        page_text = read_text(page_text_path)
        risks = extraction_risks(document_text, page_text, int(entry["pages"]))
        documents.append({
            "sourceId": f"catalog:{actual_attachment_hash[:16]}",
            "source": entry["source"],
            "businessBrand": brand,
            "catalogFamily": family,
            "role": role,
            "manifestBrand": entry.get("brand", ""),
            "productType": entry.get("product_type", ""),
            "category": entry["category"],
            "language": entry.get("language", ""),
            "pages": int(entry["pages"]),
            "conversionEngine": entry.get("engine", ""),
            "quality": entry.get("quality", ""),
            "attachmentSha256": actual_attachment_hash,
            "documentSha256": sha256(document_path),
            "pageTextSha256": sha256(page_text_path),
            "mdPath": str(document_path),
            "pageTextPath": str(page_text_path),
            "pdfPath": str(attachment_path),
            "risks": risks,
        })

    if unknown_routes:
        raise ValueError(f"Relevant catalogs without a business route: {unknown_routes}")

    documents.sort(key=lambda item: (item["role"], item["businessBrand"], item["source"]))
    source_brands = sorted({item["businessBrand"] for item in documents if item["role"] == "source"})
    expected_brands = ["FITOK", "FUJIKIN", "JSK", "SUPERLOK", "Swagelok", "TK-Fujikin", "UNILOK"]
    if source_brands != expected_brands:
        raise ValueError(f"Incomplete source-brand coverage: {source_brands}")

    return {
        "schemaVersion": 1,
        "knowledgeBaseRoot": str(KB_ROOT),
        "manifestPath": str(MANIFEST),
        "manifestSha256": sha256(MANIFEST),
        "scope": sorted(RELATED_CATEGORIES),
        "summary": {
            "relevantDocuments": len(documents),
            "sourceDocuments": sum(item["role"] == "source" for item in documents),
            "targetDocuments": sum(item["role"] == "target" for item in documents),
            "sourceBrands": source_brands,
            "routeCoveragePercent": 100.0,
            "pageRouteCoveragePercent": 100.0,
            "riskDocumentCount": sum(bool(item["risks"]) for item in documents),
        },
        "documents": documents,
    }


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_outputs(registry: dict) -> None:
    DATA_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    DATA_OUTPUT.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    coverage_rows = [{
        "source_id": item["sourceId"],
        "source": item["source"],
        "business_brand": item["businessBrand"],
        "catalog_family": item["catalogFamily"],
        "role": item["role"],
        "pages": item["pages"],
        "md_path": item["mdPath"],
        "page_text_path": item["pageTextPath"],
        "pdf_path": item["pdfPath"],
        "attachment_sha256": item["attachmentSha256"],
        "route_status": "classified",
    } for item in registry["documents"]]
    write_csv(
        AUDIT_DIR / "catalog-source-coverage.csv",
        list(coverage_rows[0]),
        coverage_rows,
    )
    risk_rows = []
    for item in registry["documents"]:
        risks = item["risks"] or [{"code": "none", "severity": "none", "action": "无需额外操作"}]
        for risk in risks:
            risk_rows.append({
                "source_id": item["sourceId"],
                "source": item["source"],
                "business_brand": item["businessBrand"],
                "risk": risk["code"],
                "severity": risk["severity"],
                "detail": risk.get("detail", ""),
                "next_action": risk["action"],
            })
    write_csv(
        AUDIT_DIR / "catalog-extraction-risk.csv",
        list(risk_rows[0]),
        risk_rows,
    )


def main() -> None:
    registry = build_registry()
    write_outputs(registry)
    print(json.dumps(registry["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
