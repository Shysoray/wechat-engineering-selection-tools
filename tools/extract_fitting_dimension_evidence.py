#!/usr/bin/env python3
"""Extract traceable model candidates and verified dimension seeds from catalog MD."""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

from fitting_catalog_registry import DATA_OUTPUT, build_registry, write_outputs
from fitting_dimension_catalog import (
    extract_pdf_dimension_records,
    extract_ocr_dimension_records,
    merge_dimension_records,
    source_alias,
    target_alias,
)


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_DIR = ROOT / "data/fitting-evidence"
AUDIT_DIR = ROOT / "outputs/fitting_dimension_audit"
MANUAL_OVERRIDES = EVIDENCE_DIR / "manual-overrides.json"
SOURCE_OUTPUT = EVIDENCE_DIR / "source-catalog-models.json"
TARGET_OUTPUT = EVIDENCE_DIR / "vigour-catalog-models.json"
MAPPING_INPUT = EVIDENCE_DIR / "mapping-dimension-evidence.json"
SCANNED_OCR_INPUT = EVIDENCE_DIR / "scanned-catalog-ocr.tsv"

PAGE_MARKER = re.compile(r"^## PDF 第\s*(\d+)\s*页\s*$", re.M)
TOKEN_PATTERN = re.compile(r"(?<![A-Z0-9])([A-Z][A-Z0-9./#-]{2,79})(?![A-Z0-9])", re.I)
UNICODE_DASHES = str.maketrans("‐‑‒–—﹘﹣－", "--------")
BAD_WORDS = {
    "HTTP", "HTTPS", "WWW", "TABLE", "FIGURE", "PAGE", "CONTENTS", "INCH", "METRIC",
    "MATERIAL", "DIMENSION", "PRESSURE", "TEMPERATURE", "ORDERING", "EXAMPLE", "CATALOG",
}
HIGH_CONFIDENCE_PREFIXES = {
    "Swagelok": ("SS-", "6LV-", "316L-"),
    "UNILOK": ("U", "C"),
    "FITOK": ("SS-", "6L-", "6LV-", "6LW-"),
    "FUJIKIN": ("UJR-", "UJ-", "VU"),
    "JSK": ("J", "S"),
    "SUPERLOK": ("S", "C"),
    "TK-Fujikin": ("S", "T"),
    "VIGOUR": ("VVR-", "VMW-", "SS-V"),
}

PRIMARY_TARGET_CATALOGS = {
    "VIGOUR VUPS接头目录 英文-26.8.6.pdf",
    "VIGOUR VHPS接头目录 英文-26.8.7.pdf",
}
SCANNED_SOURCE_FILES = {
    "Fujikin-UJR接头系列.pdf": "fujikin_ocr/",
    "JSK-Micro fitting.pdf": "jsk_micro/",
    "JSK-VCR.pdf": "jsk_vcr/",
    "UHP-WELD-CLEAN-FITTINGS (2).pdf": "superlok_uhp_ocr/",
    "WELD & METAL SEAL FITTINGS (2).pdf": "tk_ocr/",
    "VIGOUR VUPS接头目录 英文-26.8.6.pdf": "vups_ocr/",
}


def normalize_model(value: str) -> str:
    return re.sub(r"\s+", "", value.upper().translate(UNICODE_DASHES)).strip(".-")


def page_sections(text: str) -> list[tuple[int, str]]:
    matches = list(PAGE_MARKER.finditer(text))
    sections = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections.append((int(match.group(1)), text[match.end():end]))
    return sections


def candidate_rejection(model: str) -> str:
    if not any(character.isdigit() for character in model):
        return "no_digit"
    if len(model) < 4:
        return "too_short"
    if any(word in model for word in BAD_WORDS):
        return "heading_or_prose"
    if re.fullmatch(r"[A-Z]?\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)+", model):
        return "dimension_range"
    if re.fullmatch(r"(?:MM|IN|PSI|BAR)-?\d+", model):
        return "unit_value"
    if model.count("-") >= 8 and len(model) > 50:
        return "concatenated_columns"
    return ""


def confidence_for(brand: str, model: str) -> str:
    prefixes = HIGH_CONFIDENCE_PREFIXES.get(brand, ())
    if model.startswith(prefixes) and ("-" in model or re.fullmatch(r"[A-Z]{1,8}\d+[A-Z0-9]*", model)):
        return "high"
    return "medium"


def source_payload(document: dict, page: int, confidence: str) -> dict:
    return {
        "sourceId": document["sourceId"],
        "mdPath": document["mdPath"],
        "pageTextPath": document["pageTextPath"],
        "pdfPath": document["pdfPath"],
        "pdfPage": page,
        "tableLabel": "page_text token",
        "rowKey": "",
        "extractionMethod": "page_text",
        "confidence": confidence,
    }


def extract_records(registry: dict) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    records_by_role: dict[str, dict[tuple[str, str], dict]] = {
        "source": {},
        "target": {},
    }
    artifacts = {}
    document_stats = []

    for document in registry["documents"]:
        role = document["role"]
        brand = document["businessBrand"]
        text = Path(document["pageTextPath"]).read_text(encoding="utf-8", errors="replace")
        accepted = 0
        rejected = 0
        for page, page_text in page_sections(text):
            for match in TOKEN_PATTERN.finditer(page_text.upper().translate(UNICODE_DASHES)):
                raw = match.group(1).strip(".-")
                model = normalize_model(raw)
                reason = candidate_rejection(model)
                if reason:
                    rejected += 1
                    artifact_key = (document["sourceId"], page, model, reason)
                    artifacts[artifact_key] = {
                        "source_id": document["sourceId"],
                        "source": document["source"],
                        "brand": brand,
                        "pdf_page": page,
                        "raw_token": raw,
                        "normalized_token": model,
                        "reason": reason,
                        "action": "不得进入运行时搜索库；必要时回查原 PDF",
                    }
                    continue
                accepted += 1
                key = (brand, model)
                confidence = confidence_for(brand, model)
                existing = records_by_role[role].get(key)
                occurrence = source_payload(document, page, confidence)
                if existing:
                    if not any(
                        item["sourceId"] == occurrence["sourceId"] and item["pdfPage"] == page
                        for item in existing["occurrences"]
                    ):
                        existing["occurrences"].append(occurrence)
                    continue
                records_by_role[role][key] = {
                    "brand": brand,
                    "catalogModel": raw,
                    "canonicalModel": model,
                    "family": document["catalogFamily"],
                    "material": "",
                    "finish": "",
                    "dimensions": {},
                    "missingDimensions": {"allApplicable": "not_extracted"},
                    "occurrences": [occurrence],
                }
        document_stats.append({
            "source_id": document["sourceId"],
            "source": document["source"],
            "brand": brand,
            "catalog_family": document["catalogFamily"],
            "role": role,
            "pages": document["pages"],
            "accepted_model_tokens": accepted,
            "rejected_tokens": rejected,
            "structured_dimension_records": 0,
            "status": "pagewise_extracted",
        })

    return (
        list(records_by_role["source"].values()),
        list(records_by_role["target"].values()),
        list(artifacts.values()),
        document_stats,
    )


def add_verified_dimension_records(
    registry: dict,
    source_records: list[dict],
    target_records: list[dict],
    stats: list[dict],
) -> None:
    manual = json.loads(MANUAL_OVERRIDES.read_text(encoding="utf-8"))
    source_evidence = manual["sourceEvidence"]
    target_evidence = manual["targetEvidence"]
    for record in manual["sourceRecords"]:
        product, size = record["key"].split("|", 1)
        source_records.append({
            "brand": "UNILOK",
            "catalogModel": f"{product}-{size}",
            "canonicalModel": f"{product}-{size}",
            "family": "face_seal_gland",
            "material": "",
            "finish": "",
            "dimensions": {
                "overallLength": {"value": record["overallLengthMm"], "unit": "mm", "normalizedMm": record["overallLengthMm"]},
                "insertionLength": {"value": record["insertionLengthMm"], "unit": "mm", "normalizedMm": record["insertionLengthMm"]},
                "wallThickness": {"value": record["wallThicknessIn"], "unit": "in", "normalizedMm": round(record["wallThicknessIn"] * 25.4, 6)},
            },
            "missingDimensions": {},
            "occurrences": [{
                "sourceId": "catalog:UNILOK-VCR:p6",
                **source_evidence,
            }],
        })
    for record in manual["targetRecords"]:
        tube_match = re.search(r"-TB(\d+)(?:-|$)", record["model"])
        tube_code = tube_match.group(1) if tube_match else None
        wall = manual["targetWallThicknessByTubeCodeIn"].get(tube_code) if tube_code else None
        tube_od = manual["targetTubeOutsideDiameterByTubeCodeIn"].get(tube_code) if tube_code else None
        dimensions = {
            "overallLength": {"value": record["overallLengthMm"], "unit": "mm", "normalizedMm": record["overallLengthMm"]},
            "insertionLength": {"value": record["insertionLengthMm"], "unit": "mm", "normalizedMm": record["insertionLengthMm"]},
        }
        if tube_od is not None:
            dimensions["tubeOutsideDiameter"] = {
                "value": tube_od,
                "unit": "in",
                "normalizedMm": round(tube_od * 25.4, 6),
            }
        if wall is not None:
            dimensions["wallThickness"] = {"value": wall, "unit": "in", "normalizedMm": round(wall * 25.4, 6)}
        target_records.append({
            "brand": "VIGOUR",
            "catalogModel": record["model"],
            "canonicalModel": record["model"],
            "family": "face_seal_gland",
            "material": "",
            "finish": "",
            "dimensions": dimensions,
            "missingDimensions": {},
            "occurrences": [{
                "sourceId": "catalog:VIGOUR-VUPS:p3-4",
                **target_evidence,
            }],
        })
    documents = {document["source"]: document for document in registry["documents"]}
    for record in manual.get("verifiedCatalogRecords", []):
        document = documents[record["source"]]
        role = record["role"]
        brand = record["brand"]
        raw_model = record["model"]
        canonical_model = (
            target_alias(raw_model)
            if role == "target"
            else source_alias(brand, raw_model)
        )
        dimensions = {}
        for key, value in record["dimensionsMm"].items():
            label = key.removeprefix("catalog")
            dimensions[key] = {
                "value": value,
                "unit": "mm",
                "normalizedMm": value,
                "rawValue": str(value),
                "catalogLabel": label,
                "dimensionKey": key,
            }
        destination = target_records if role == "target" else source_records
        destination.append({
            "brand": brand,
            "catalogModel": raw_model,
            "canonicalModel": canonical_model,
            "family": document["catalogFamily"],
            "material": "",
            "finish": "",
            "dimensions": dimensions,
            "missingDimensions": {},
            "occurrences": [{
                "sourceId": document["sourceId"],
                "mdPath": document["mdPath"],
                "pageTextPath": document["pageTextPath"],
                "pdfPath": document["pdfPath"],
                "pdfPage": record["pdfPage"],
                "tableLabel": record.get("tableLabel", "manually verified dimensional row"),
                "rowKey": raw_model,
                "extractionMethod": "manual_verified",
                "confidence": "high",
            }],
        })
    for row in stats:
        if row["source"] == "UNILOK-VCR.pdf":
            row["structured_dimension_records"] = len(manual["sourceRecords"])
        elif row["source"] == "VIGOUR VUPS英文目录-26.8.7.pdf":
            row["structured_dimension_records"] = len(manual["targetRecords"])


def runtime_aliases() -> dict[str, set[str]]:
    aliases: dict[str, set[str]] = defaultdict(set)
    if not MAPPING_INPUT.exists():
        return aliases
    payload = json.loads(MAPPING_INPUT.read_text(encoding="utf-8"))
    for record in payload.get("records", []):
        brand = record.get("brand", "")
        source_model = record.get("sourceModel", "")
        if brand and source_model:
            aliases[brand].add(source_alias(brand, source_model))
        for target_model in re.split(r"\s*/\s*", record.get("vigourModel", "")):
            if target_model:
                aliases["VIGOUR"].add(target_alias(target_model))
    return aliases


def add_pdf_dimension_records(
    registry: dict,
    source_records: list[dict],
    target_records: list[dict],
    stats: list[dict],
) -> None:
    aliases = runtime_aliases()
    by_source = {row["source"]: row for row in stats}
    for document in registry["documents"]:
        brand = document["businessBrand"]
        if document["role"] == "target" and document["source"] not in PRIMARY_TARGET_CATALOGS:
            continue
        document_aliases = aliases.get(brand, set())
        if not document_aliases:
            continue
        filename_fragment = SCANNED_SOURCE_FILES.get(document["source"])
        if filename_fragment:
            if not SCANNED_OCR_INPUT.exists():
                raise FileNotFoundError(
                    f"Missing offline OCR evidence for scanned catalog: {SCANNED_OCR_INPUT}"
                )
            extracted = extract_ocr_dimension_records(
                document,
                document_aliases,
                SCANNED_OCR_INPUT,
                filename_fragment,
            )
        else:
            extracted = extract_pdf_dimension_records(document, document_aliases)
        if document["role"] == "target":
            target_records.extend(extracted)
        else:
            source_records.extend(extracted)
        by_source[document["source"]]["structured_dimension_records"] += len(extracted)
        by_source[document["source"]]["status"] = (
            "pdf_dimensions_extracted" if extracted else "no_runtime_dimension_rows_found"
        )


def dedupe_records(records: list[dict]) -> list[dict]:
    deduped = {}
    for record in records:
        key = (record["brand"], record["canonicalModel"], record["family"])
        existing = deduped.get(key)
        if not existing:
            deduped[key] = record
            continue
        existing_dimensions = existing.get("dimensions", {})
        record_dimensions = record.get("dimensions", {})
        if len(record_dimensions) > len(existing_dimensions):
            record["occurrences"] = [
                *record.get("occurrences", []),
                *(
                    occurrence for occurrence in existing.get("occurrences", [])
                    if occurrence not in record.get("occurrences", [])
                ),
            ]
            deduped[key] = record
            existing = record
        else:
            for dimension, value in record_dimensions.items():
                existing_dimensions.setdefault(dimension, value)
            existing["occurrences"].extend(
                occurrence for occurrence in record["occurrences"]
                if occurrence not in existing["occurrences"]
            )
    return sorted(deduped.values(), key=lambda item: (item["brand"], item["canonicalModel"], item["family"]))


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("\n", encoding="utf-8")
        return
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, records: list[dict], kind: str) -> None:
    payload = {
        "schemaVersion": 1,
        "kind": kind,
        "summary": {
            "recordCount": len(records),
            "recordsWithDimensions": sum(bool(record["dimensions"]) for record in records),
            "recordsWithoutDimensions": sum(not record["dimensions"] for record in records),
        },
        "records": records,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    registry = build_registry()
    write_outputs(registry)
    source_records, target_records, artifacts, stats = extract_records(registry)
    add_pdf_dimension_records(registry, source_records, target_records, stats)
    add_verified_dimension_records(registry, source_records, target_records, stats)
    source_records = merge_dimension_records(dedupe_records(source_records))
    target_records = merge_dimension_records(dedupe_records(target_records))
    write_json(SOURCE_OUTPUT, source_records, "source_catalog_models")
    write_json(TARGET_OUTPUT, target_records, "vigour_catalog_models")
    write_csv(AUDIT_DIR / "parser-artifacts.csv", artifacts)
    write_csv(AUDIT_DIR / "dimension-extraction-audit.csv", stats)
    print(json.dumps({
        "sourceModels": len(source_records),
        "targetModels": len(target_records),
        "sourceDimensions": sum(bool(record["dimensions"]) for record in source_records),
        "targetDimensions": sum(bool(record["dimensions"]) for record in target_records),
        "parserArtifacts": len(artifacts),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
