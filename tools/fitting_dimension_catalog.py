"""Extract traceable fitting dimensions from text tables and page coordinates."""

from __future__ import annotations

import math
import re
import csv
from collections import defaultdict
from difflib import SequenceMatcher
from fractions import Fraction
from pathlib import Path

import pdfplumber


DASHES = str.maketrans("‐‑‒–—﹘﹣－", "--------")
MODEL_NOISE = re.compile(r"[^A-Z0-9]")
NUMBER = re.compile(r"(?<![A-Z0-9.])([+-]?(?:\d+-\d+\s*/\s*\d+|\d+\s+\d+\s*/\s*\d+|\d+\s*/\s*\d+|\d+(?:\.\d+)?|\.\d+))(?![A-Z0-9./])")
SIMPLE_LABEL = re.compile(r"^(?:A|B|C|D|E|F|G|H|I|L|N|P|T|W)(?:[1-4])?$", re.I)
MODEL_TOKEN = re.compile(r"[A-Z0-9][A-Z0-9./#×X-]{2,}", re.I)
MEASUREMENT_GROUP = re.compile(
    r"(?<![A-Z0-9.])((?:\d+\s+)?\d+\s*/\s*\d+|[+-]?(?:\d+(?:\.\d+)?|\.\d+))"
    r"(?:\s*\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\))?"
)

LABEL_NAMES = {
    "A": "A", "A1": "A1", "A2": "A2",
    "B": "B", "B1": "B1", "B2": "B2",
    "C": "C", "C1": "C1", "C2": "C2",
    "D": "D", "D1": "D1", "D2": "D2", "D3": "D3", "D4": "D4",
    "E": "E", "E1": "E1", "E2": "E2",
    "F": "F", "F1": "F1", "F2": "F2",
    "G": "G", "G1": "G1", "G2": "G2",
    "H": "H", "H1": "H1", "H2": "H2",
    "I": "I", "I1": "I1", "I2": "I2",
    "L": "L", "L1": "L1", "L2": "L2", "L3": "L3", "L4": "L4",
    "N": "N", "N1": "N1", "N2": "N2",
    "P": "P", "P1": "P1", "P2": "P2",
    "T": "T", "T1": "T1", "T2": "T2",
    "W": "W", "W1": "W1", "W2": "W2",
}


def model_key(value: str) -> str:
    return MODEL_NOISE.sub("", str(value or "").upper().translate(DASHES))


def _strip_suffixes(value: str, suffixes: tuple[str, ...]) -> str:
    previous = None
    while value != previous:
        previous = value
        value = re.sub(rf"-(?:{'|'.join(suffixes)})(?=-|$)", "", value, flags=re.I)
    return value


def source_alias(brand: str, value: str) -> str:
    text = str(value or "").upper().translate(DASHES).strip()
    if brand == "FITOK":
        text = re.sub(r"^(?:SS|6L|6LV|6LW)(?=-)", "", text)
        text = re.sub(r"-(?:F2|F3)$", "", text)
    elif brand == "FUJIKIN":
        text = re.sub(r"-S#T(?=-|$)", "-S", text)
        text = re.sub(r"-(?:APN|APM)(?=-|$)", "", text)
        text = re.sub(r"-(?:BK|FD|PS|UP|STD)$", "", text)
        text = re.sub(r"-(?:316LM|SUS316L|FS9)$", "", text)
    elif brand == "JSK":
        text = re.sub(r"(?:BA|EP)$", "", text)
    elif brand == "SUPERLOK":
        text = re.sub(r"^(?:SM|DM)(?=\d)", "", text)
        text = re.sub(r"-(?:P|SP)$", "", text)
    elif brand == "Swagelok":
        text = re.sub(r"^(?:SS|316L|6LV)-", "", text)
        text = re.sub(r"-VS$", "", text)
    elif brand == "TK-Fujikin":
        text = re.sub(r"^[SD](?=\d)", "", text)
        text = re.sub(r"-(?:P|SP)$", "", text)
    elif brand == "UNILOK":
        text = re.sub(r"-(?:SM|DM)-(?:EP|BA)$", "", text)
        text = re.sub(r"-(?:SL|NI|SS|BR|CS)$", "", text)
    return model_key(text)


def target_alias(value: str) -> str:
    text = str(value or "").split("/", 1)[0].strip()
    return model_key(_strip_suffixes(text, ("SLV", "BA", "P", "BL")))


def alias_for(role: str, brand: str, value: str) -> str:
    return target_alias(value) if role == "target" else source_alias(brand, value)


def parse_fraction(value: str) -> float | None:
    original = value.strip()
    mixed = re.fullmatch(r"([+-]?\d+)\s+(\d+\s*/\s*\d+)", original)
    if mixed:
        try:
            return float(mixed.group(1)) + float(Fraction(mixed.group(2).replace(" ", "")))
        except (ValueError, ZeroDivisionError):
            return None
    cleaned = original.replace(" ", "")
    if not cleaned:
        return None
    try:
        if "/" in cleaned:
            if "-" in cleaned and not cleaned.startswith("-"):
                whole, fraction = cleaned.split("-", 1)
                return float(whole) + float(Fraction(fraction))
            return float(Fraction(cleaned))
        return float(cleaned)
    except (ValueError, ZeroDivisionError):
        return None


def numeric_tokens(raw: str) -> list[float]:
    values = []
    cleaned_raw = re.sub(r"(?<![\d/])(\d+)\s+\.(\d+)", r"\1.\2", str(raw or ""))
    for match in NUMBER.finditer(cleaned_raw):
        value = parse_fraction(match.group(1))
        if value is not None and math.isfinite(value):
            values.append(value)
    return values


def unit_context(header: str, table_text: str, page_text: str) -> str:
    combined = " ".join((header, table_text[:2000], page_text[:4000])).lower()
    combined = re.sub(r"\bin\s*\.\s*\(\s*mm\s*\)", "in.(mm)", combined)
    combined = re.sub(r"\bmm\s*\(\s*in\s*\.\s*\)", "mm(in.)", combined)
    if "mm (in" in combined or "mm(in" in combined:
        return "mm_in"
    if "in. (mm" in combined or "in.(mm" in combined or "inch (mm" in combined:
        return "in_mm"
    if re.search(r"(?:^|\W)(?:in\.|inch)\s+mm(?:$|\W)", header.lower()):
        return "in_mm"
    if re.search(r"dimensions?\s*[,(:]?\s*mm\b", combined):
        return "mm"
    if re.search(r"dimensions?\s*[,(:]?\s*(?:in\.|inch)\b", combined):
        return "in"
    if re.search(r"(?:unit|dimensions?|dimension|\u5355\u4f4d|\u5c3a\u5bf8)[^\n]{0,20}(?:\(|:|\s)\s*mm\b", combined):
        return "mm"
    if re.search(r"(?:^|\W)mm(?:$|\W)", header.lower()):
        return "mm"
    if re.search(r"(?:^|\W)(?:in\.|inch)(?:$|\W)", header.lower()):
        return "in"
    return ""


def measurement(raw: str, context: str) -> dict | None:
    cleaned_raw = re.sub(r"(?<![\d/])(\d+)\s+\.(\d+)", r"\1.\2", str(raw or ""))
    values = numeric_tokens(cleaned_raw)
    if not values:
        return None
    explicit_pair = re.search(
        r"((?:\d+\s+)?\d+\s*/\s*\d+|[+-]?(?:\d+(?:\.\d+)?|\.\d+))"
        r"\s*\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\)",
        cleaned_raw,
    )
    if explicit_pair:
        first = parse_fraction(explicit_pair.group(1))
        second = parse_fraction(explicit_pair.group(2))
        if first is not None and second is not None:
            if abs(first * 25.4 - second) <= max(1.0, second * 0.03):
                return {
                    "value": round(second, 6),
                    "unit": "mm",
                    "normalizedMm": round(second, 6),
                    "rawValue": str(raw or "").strip(),
                }
            if abs(second * 25.4 - first) <= max(1.0, first * 0.03):
                return {
                    "value": round(first, 6),
                    "unit": "mm",
                    "normalizedMm": round(first, 6),
                    "rawValue": str(raw or "").strip(),
                }
    if context == "in_mm":
        parenthetical = re.findall(r"\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\)", cleaned_raw)
        value = float(parenthetical[-1]) if parenthetical else None
        if value is None:
            for source_index, source_value in enumerate(values):
                for target_value in values[source_index + 1:]:
                    if abs(source_value * 25.4 - target_value) <= max(1.0, target_value * 0.03):
                        value = target_value
                        break
                if value is not None:
                    break
        if value is None:
            value = values[0] * 25.4
        unit = "mm"
    elif context == "mm_in":
        value = values[0]
        unit = "mm"
    elif context == "in":
        value = values[0]
        if len(values) >= 3:
            for index in range(1, len(values) - 1):
                if abs(values[index] * 25.4 - values[index + 1]) <= 1.0:
                    value = values[index]
                    break
        unit = "in"
    elif context == "mm":
        value = values[0]
        unit = "mm"
    else:
        return None
    normalized = value * 25.4 if unit == "in" else value
    if not 0 < normalized <= 500:
        return None
    return {
        "value": round(value, 6),
        "unit": unit,
        "normalizedMm": round(normalized, 6),
        "rawValue": str(raw or "").strip(),
    }


def dimension_label(header: str) -> tuple[str, str] | None:
    text = re.sub(r"[\n\r]+", " ", str(header or "")).strip()
    lower = text.lower()
    if any(word in lower for word in ("ordering", "part no", "model", "material", "pressure", "psig", "bar")):
        return None
    if "wall" in lower and "thick" in lower:
        return "wallThickness", "管壁厚"
    if ("tube" in lower and ("o.d" in lower or "od" in lower)) or "管外径" in text:
        suffix = "2" if re.search(r"(?:D|OD)\s*[12]", text, re.I) else ""
        return f"tubeOutsideDiameter{suffix}", f"管外径{suffix}"
    tokens = re.findall(r"(?<![A-Z0-9])([A-Z][1-4]?)(?![A-Z0-9])", text.upper())
    for token in reversed(tokens):
        if token in LABEL_NAMES:
            return f"catalog{token}", LABEL_NAMES[token]
    return None


def _cell_lines(value: str) -> list[str]:
    return [line.strip() for line in str(value or "").splitlines() if line.strip()]


def _segment_cell(value: str, count: int, index: int) -> str:
    lines = _cell_lines(value)
    if count <= 1 or len(lines) <= 1:
        return str(value or "")
    if len(lines) == count:
        return lines[index]
    if len(lines) == count * 2:
        return "\n".join(lines[index * 2:index * 2 + 2])
    return str(value or "")


def _best_alias(raw: str, aliases: set[str], role: str, brand: str) -> str:
    candidates = [alias_for(role, brand, raw), model_key(raw)]
    for candidate in candidates:
        if candidate in aliases:
            return candidate
        trimmed = re.sub(r"(?:NOTE)?\d{1,2}$", "", candidate)
        if trimmed in aliases:
            return trimmed
    return ""


def _line_header_specs(value: str) -> list[tuple[str, str]]:
    text = str(value or "").upper()
    text = re.sub(r"\bL[X×]\b", " L1 ", text)
    text = re.sub(r"\bF[X×]\b", " F1 ", text)
    text = re.sub(r"\bT[X×]\b", " T1 ", text)
    specs = []
    for token in re.findall(r"(?<![A-Z0-9])([A-Z][1-4]?)(?![A-Z0-9])", text):
        if token in LABEL_NAMES and token not in {"P"}:
            spec = (f"catalog{token}", LABEL_NAMES[token])
            if spec not in specs:
                specs.append(spec)
    return specs


def _line_measurements(value: str, context: str) -> list[dict]:
    measurements = []
    for match in MEASUREMENT_GROUP.finditer(str(value or "")):
        raw = match.group(0)
        parsed = measurement(raw, context)
        if parsed:
            measurements.append(parsed)
    return measurements


def extract_text_line_records(document: dict, aliases: set[str]) -> list[dict]:
    """Parse clean PDF text rows before falling back to reconstructed tables/coordinates."""
    records = []
    role = document["role"]
    brand = document["businessBrand"]
    with pdfplumber.open(document["pdfPath"]) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text(x_tolerance=1.5, y_tolerance=3) or ""
            lines = [line.strip() for line in page_text.splitlines() if line.strip()]
            for line_index, line in enumerate(lines):
                matches = []
                for token_match in MODEL_TOKEN.finditer(line):
                    alias = _best_alias(token_match.group(0), aliases, role, brand)
                    if alias:
                        matches.append((token_match, alias))
                if not matches:
                    continue
                header_window = lines[max(0, line_index - 16):line_index]
                header_specs = []
                for header_line in reversed(header_window):
                    candidate_specs = _line_header_specs(header_line)
                    if candidate_specs:
                        header_specs = candidate_specs
                        if len(candidate_specs) >= 2:
                            break
                if not header_specs:
                    continue
                section_text = " ".join(header_window[-12:])
                context = unit_context(section_text, section_text, section_text)
                if not context:
                    continue
                for token_match, alias in matches:
                    values = _line_measurements(line[token_match.end():], context)
                    if not values:
                        continue
                    dimensions = {}
                    for spec, parsed in zip(header_specs, values):
                        key, label = spec
                        dimensions[key] = {
                            **parsed,
                            "catalogLabel": label,
                            "dimensionKey": key,
                        }
                    if dimensions:
                        records.append({
                            "brand": brand,
                            "catalogModel": token_match.group(0),
                            "canonicalModel": alias,
                            "family": document["catalogFamily"],
                            "material": "",
                            "finish": "",
                            "dimensions": dimensions,
                            "missingDimensions": {},
                            "occurrences": [_source(
                                document,
                                page_number,
                                "pdf_text_line",
                                "high",
                                f"line={line_index + 1};model={token_match.group(0)}",
                            )],
                        })
    return records


def _source(document: dict, page: int, method: str, confidence: str, row_key: str) -> dict:
    return {
        "sourceId": document["sourceId"],
        "mdPath": document["mdPath"],
        "pageTextPath": document["pageTextPath"],
        "pdfPath": document["pdfPath"],
        "pdfPage": page,
        "tableLabel": "catalog dimensions",
        "rowKey": row_key,
        "extractionMethod": method,
        "confidence": confidence,
    }


def extract_table_records(document: dict, aliases: set[str]) -> list[dict]:
    records = []
    role = document["role"]
    brand = document["businessBrand"]
    with pdfplumber.open(document["pdfPath"]) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text(x_tolerance=1.5, y_tolerance=3) or ""
            try:
                tables = page.extract_tables()
            except Exception:
                tables = []
            for table_index, table in enumerate(tables):
                if not table:
                    continue
                table_text = "\n".join(" | ".join(str(cell or "") for cell in row) for row in table)
                first_data = None
                matches_by_row = {}
                for row_index, row in enumerate(table):
                    matches = []
                    for column_index, cell in enumerate(row):
                        for line in _cell_lines(cell):
                            matched = _best_alias(line, aliases, role, brand)
                            if matched:
                                matches.append((column_index, line, matched))
                    if matches:
                        matches_by_row[row_index] = matches
                        first_data = row_index if first_data is None else min(first_data, row_index)
                if first_data is None:
                    continue
                headers = []
                width = max(len(row) for row in table)
                for column in range(width):
                    headers.append("\n".join(
                        str(table[row][column] or "")
                        for row in range(first_data)
                        if column < len(table[row]) and table[row][column]
                    ))
                specs = [dimension_label(header) for header in headers]
                next_spec_column = {}
                dimension_columns = [index for index, spec in enumerate(specs) if spec]
                for spec_index, column in enumerate(dimension_columns):
                    if spec_index + 1 < len(dimension_columns):
                        next_spec_column[column] = dimension_columns[spec_index + 1]
                    else:
                        end_column = column + 1
                        while end_column < width:
                            unit_header = re.sub(
                                r"(?:inch|in\.?|mm|\s|[().])",
                                "",
                                headers[end_column],
                                flags=re.I,
                            )
                            if unit_header:
                                break
                            if headers[end_column].strip():
                                end_column += 1
                                continue
                            break
                        next_spec_column[column] = end_column
                for row_index, matches in matches_by_row.items():
                    row = table[row_index]
                    model_column = matches[0][0]
                    model_lines = [entry for entry in matches if entry[0] == model_column]
                    for model_index, (_, raw_model, alias) in enumerate(model_lines):
                        dimensions = {}
                        for column, spec in enumerate(specs):
                            if not spec or column == model_column or column >= len(row):
                                continue
                            key, label = spec
                            end_column = min(next_spec_column.get(column, column + 1), len(row))
                            raw_value = " ".join(
                                _segment_cell(row[value_column], len(model_lines), model_index)
                                for value_column in range(column, end_column)
                                if row[value_column]
                            )
                            context = unit_context(" ".join(headers[column:end_column]), table_text, page_text)
                            parsed = measurement(raw_value, context)
                            if not parsed:
                                continue
                            parsed.update({"catalogLabel": label, "dimensionKey": key})
                            dimensions[key] = parsed
                        if dimensions:
                            records.append({
                                "brand": brand,
                                "catalogModel": raw_model,
                                "canonicalModel": alias,
                                "family": document["catalogFamily"],
                                "material": "",
                                "finish": "",
                                "dimensions": dimensions,
                                "missingDimensions": {},
                                "occurrences": [_source(
                                    document,
                                    page_number,
                                    "pdf_table",
                                    "high",
                                    f"table={table_index + 1};row={row_index + 1}",
                                )],
                            })
    return records


def _simple_word_label(value: str) -> str:
    normalized = str(value or "").upper().replace("₁", "1").replace("₂", "2")
    normalized = re.sub(r"[^A-Z0-9]", "", normalized)
    return normalized if SIMPLE_LABEL.fullmatch(normalized) else ""


def _ocr_word_labels(word: dict) -> list[tuple[str, float, float]]:
    """Return one or more column labels, including labels OCR merged into one box."""
    text = str(word.get("text") or "").upper().replace("₁", "1").replace("₂", "2")
    exact = _simple_word_label(text)
    center_y = word["y"] + word["height"] / 2
    if exact:
        return [(exact, word["x"] + word["width"] / 2, center_y)]
    matches = [
        match for match in re.finditer(r"(?<![A-Z0-9])([A-Z][1-4]?)(?![A-Z0-9])", text)
        if SIMPLE_LABEL.fullmatch(match.group(1))
    ]
    if len(matches) < 2:
        return []
    span = max(len(text), 1)
    return [
        (
            match.group(1),
            word["x"] + word["width"] * ((match.start(1) + match.end(1)) / 2) / span,
            center_y,
        )
        for match in matches
    ]


def extract_coordinate_records(document: dict, aliases: set[str], already_found: set[str]) -> list[dict]:
    records = []
    role = document["role"]
    brand = document["businessBrand"]
    with pdfplumber.open(document["pdfPath"]) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            words = page.extract_words(use_text_flow=False, keep_blank_chars=False, x_tolerance=1, y_tolerance=2)
            page_text = page.extract_text(x_tolerance=1.5, y_tolerance=3) or ""
            default_context = unit_context("", page_text, page_text)
            if not default_context:
                continue
            labels = []
            for word in words:
                label = _simple_word_label(word["text"])
                if label:
                    labels.append((label, (word["x0"] + word["x1"]) / 2, word["top"]))
            for word in words:
                alias = _best_alias(word["text"], aliases, role, brand)
                if not alias or alias in already_found:
                    continue
                same_row = [candidate for candidate in words if abs(candidate["top"] - word["top"]) <= 2.2]
                dimensions = {}
                for candidate in same_row:
                    if candidate is word or not numeric_tokens(candidate["text"]):
                        continue
                    center = (candidate["x0"] + candidate["x1"]) / 2
                    possible = [
                        (label, abs(x - center), top)
                        for label, x, top in labels
                        if top < word["top"] and word["top"] - top <= 180 and abs(x - center) <= 16
                    ]
                    if not possible:
                        continue
                    label = sorted(possible, key=lambda entry: (entry[1], -entry[2]))[0][0]
                    key = f"catalog{label}"
                    parsed = measurement(candidate["text"], default_context)
                    if not parsed:
                        continue
                    parsed.update({"catalogLabel": label, "dimensionKey": key})
                    dimensions[key] = parsed
                if dimensions:
                    records.append({
                        "brand": brand,
                        "catalogModel": word["text"],
                        "canonicalModel": alias,
                        "family": document["catalogFamily"],
                        "material": "",
                        "finish": "",
                        "dimensions": dimensions,
                        "missingDimensions": {},
                        "occurrences": [_source(document, page_number, "pdf_coordinates", "medium", word["text"])],
                    })
                    already_found.add(alias)
    return records


def extract_pdf_dimension_records(document: dict, aliases: set[str]) -> list[dict]:
    line_records = (
        extract_text_line_records(document, aliases)
        if document["role"] == "source" and document["businessBrand"] == "FITOK"
        else []
    )
    table_records = extract_table_records(document, aliases)
    coordinate_records = extract_coordinate_records(document, aliases, set())
    return merge_dimension_records(line_records + table_records + coordinate_records)


def _ocr_alias(raw: str, aliases: set[str], role: str, brand: str) -> str:
    candidate = alias_for(role, brand, raw)
    variants = [candidate]
    variants.extend(candidate[:-count] for count in (1, 2) if len(candidate) > count)
    variants.extend(re.sub(r"[OQ]$", "0", value) for value in list(variants))
    for value in variants:
        if value in aliases:
            return value
    if len(candidate) < 5:
        return ""
    close = [
        alias for alias in aliases
        if abs(len(alias) - len(candidate)) <= 1
        and SequenceMatcher(None, candidate, alias).ratio() >= 0.91
    ]
    return close[0] if len(close) == 1 else ""


def read_vision_ocr(path: Path) -> list[tuple[str, list[dict]]]:
    files = []
    current = None
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.reader(handle, delimiter="\t"):
            if not row:
                continue
            if row[0] == "#FILE":
                current = (row[1], [])
                files.append(current)
                continue
            if current is None or len(row) < 6:
                continue
            current[1].append({
                "x": float(row[0]),
                "y": float(row[1]),
                "width": float(row[2]),
                "height": float(row[3]),
                "confidence": float(row[4]),
                "text": row[5],
            })
    return files


def _ocr_page_number(filename: str) -> int:
    match = re.search(r"(?:page|ocr)-0*(\d+)\.png$", filename)
    return int(match.group(1)) if match else 0


def extract_ocr_dimension_records(
    document: dict,
    aliases: set[str],
    ocr_path: Path,
    filename_fragment: str,
) -> list[dict]:
    records = []
    role = document["role"]
    brand = document["businessBrand"]
    for filename, words in read_vision_ocr(ocr_path):
        if filename_fragment not in filename:
            continue
        page_number = _ocr_page_number(filename)
        labels = [label for word in words for label in _ocr_word_labels(word)]
        default_context = "in_mm" if role == "target" and "VUPS" in document["source"] else "mm"
        for word in words:
            alias = _ocr_alias(word["text"], aliases, role, brand)
            if not alias:
                continue
            center_y = word["y"] + word["height"] / 2
            same_row = [
                candidate for candidate in words
                if abs((candidate["y"] + candidate["height"] / 2) - center_y) <= 0.009
            ]
            dimensions = {}
            confidence = word["confidence"]
            for candidate in same_row:
                if candidate is word or not numeric_tokens(candidate["text"]):
                    continue
                center_x = candidate["x"] + candidate["width"] / 2
                possible = [
                    (label, abs(x - center_x), y)
                    for label, x, y in labels
                    if y > center_y and y - center_y <= 0.18 and abs(x - center_x) <= 0.04
                ]
                if not possible:
                    continue
                label = sorted(possible, key=lambda entry: (entry[1], entry[2] - center_y))[0][0]
                key = f"catalog{label}"
                parsed = measurement(candidate["text"], default_context)
                if not parsed:
                    continue
                parsed.update({"catalogLabel": label, "dimensionKey": key})
                dimensions[key] = parsed
                confidence = min(confidence, candidate["confidence"])
            if not dimensions:
                continue
            records.append({
                "brand": brand,
                "catalogModel": word["text"],
                "canonicalModel": alias,
                "family": document["catalogFamily"],
                "material": "",
                "finish": "",
                "dimensions": dimensions,
                "missingDimensions": {},
                "occurrences": [_source(
                    document,
                    page_number,
                    "pdf_visual_ocr",
                    "high" if confidence >= 0.9 else "medium",
                    word["text"],
                )],
            })
    if brand == "FUJIKIN":
        records = extract_fujikin_layout_records(document, aliases, ocr_path, filename_fragment) + records
    if brand == "SUPERLOK":
        records = extract_superlok_text_layout_records(document, aliases) + records
    if brand == "TK-Fujikin":
        records = extract_tk_gland_layout_records(document, aliases, ocr_path, filename_fragment) + records
    if role == "target" and "VUPS" in document["source"]:
        records = extract_vups_text_layout_records(document, aliases) + records
    return merge_dimension_records(records)


def extract_tk_gland_layout_records(
    document: dict,
    aliases: set[str],
    ocr_path: Path,
    filename_fragment: str,
) -> list[dict]:
    """Recover the complete D/T/B/L layout for TK-Fujikin male/female glands.

    On PDF page 12 the OCR engine intermittently drops the B column header from
    the male-gland table.  The four numeric columns have a stable left-to-right
    layout documented by the page drawings: tube OD D, wall thickness T, weld
    length B and overall length L.  Reading them as a row prevents the missing
    header from suppressing the whole LG family comparison.
    """
    records = []
    gland_model = re.compile(r"^(?:2|4|6|8|12|16|8X4)(?:SG|LG)(?:6|10|19)$")
    for filename, words in read_vision_ocr(ocr_path):
        if filename_fragment not in filename or _ocr_page_number(filename) != 12:
            continue
        for word in words:
            alias = _ocr_alias(word["text"], aliases, document["role"], document["businessBrand"])
            if not alias or not gland_model.fullmatch(alias):
                continue
            center_y = word["y"] + word["height"] / 2
            numeric_cells = []
            for candidate in words:
                if candidate is word:
                    continue
                candidate_y = candidate["y"] + candidate["height"] / 2
                if abs(candidate_y - center_y) > 0.0065:
                    continue
                center_x = candidate["x"] + candidate["width"] / 2
                if not 0.54 <= center_x <= 0.84:
                    continue
                values = numeric_tokens(candidate["text"])
                if len(values) != 1:
                    continue
                numeric_cells.append((center_x, values[0], candidate["text"], candidate["confidence"]))
            numeric_cells.sort(key=lambda item: item[0])
            if len(numeric_cells) != 4:
                continue
            dimensions = {}
            confidence = word["confidence"]
            for label, (_, value, raw_value, value_confidence) in zip(("D", "T", "B", "L"), numeric_cells):
                key = f"catalog{label}"
                dimensions[key] = {
                    "value": round(value, 6),
                    "unit": "mm",
                    "normalizedMm": round(value, 6),
                    "rawValue": raw_value,
                    "catalogLabel": label,
                    "dimensionKey": key,
                }
                confidence = min(confidence, value_confidence)
            records.append({
                "brand": document["businessBrand"],
                "catalogModel": word["text"],
                "canonicalModel": alias,
                "family": document["catalogFamily"],
                "material": "",
                "finish": "",
                "dimensions": dimensions,
                "missingDimensions": {},
                "occurrences": [_source(
                    document,
                    12,
                    "pdf_visual_ocr_layout",
                    "high" if confidence >= 0.9 else "medium",
                    f"{word['text']};columns=D,T,B,L",
                )],
            })
    return records


def extract_superlok_text_layout_records(document: dict, aliases: set[str]) -> list[dict]:
    """Recover complete SUPERLOK rows whose merged PDF cells hide shared values."""
    records = []
    with pdfplumber.open(document["pdfPath"]) as pdf:
        for page_number in (6, 10, 14):
            if page_number > len(pdf.pages):
                continue
            page_text = pdf.pages[page_number - 1].extract_text(x_tolerance=1.5, y_tolerance=3) or ""
            for line in page_text.splitlines():
                model_match = re.search(r"\b(SM[A-Z0-9]+)\b", line, re.I)
                if not model_match:
                    continue
                raw_model = model_match.group(1)
                alias = _best_alias(raw_model, aliases, document["role"], document["businessBrand"])
                if not alias:
                    continue
                values = numeric_tokens(line[model_match.end():])
                assignments = []
                if re.fullmatch(r"SM\d+X\d+T6", raw_model, re.I) and len(values) >= 10:
                    assignments = [
                        ("D1", values[1]), ("D2", values[3]),
                        ("T1", values[4]), ("T2", values[5]),
                        ("A", values[6]), ("B", values[7]),
                        ("F", values[8]), ("L", values[9]),
                    ]
                elif re.fullmatch(r"SM(?:\d+|\d+X\d+R)SLG", raw_model, re.I) and len(values) >= 6:
                    assignments = [
                        ("D", values[2]), ("E", values[3]),
                        ("L", values[4]), ("T1", values[5]),
                    ]
                elif re.fullmatch(r"SM\d+MWG", raw_model, re.I) and len(values) >= 6:
                    assignments = [
                        ("D", values[2]), ("E", values[3]),
                        ("B", values[4]), ("L", values[5]),
                    ]
                elif re.fullmatch(r"SM\d+UT", raw_model, re.I) and len(values) >= 5:
                    assignments = [
                        ("E", values[1]), ("A", values[2]),
                        ("L", values[3]), ("F", values[4]),
                    ]
                if not assignments:
                    continue
                dimensions = {}
                for label, value in assignments:
                    key = f"catalog{label}"
                    dimensions[key] = {
                        "value": round(value, 6),
                        "unit": "mm",
                        "normalizedMm": round(value, 6),
                        "rawValue": str(value),
                        "catalogLabel": label,
                        "dimensionKey": key,
                    }
                records.append({
                    "brand": document["businessBrand"],
                    "catalogModel": raw_model,
                    "canonicalModel": alias,
                    "family": document["catalogFamily"],
                    "material": "",
                    "finish": "",
                    "dimensions": dimensions,
                    "missingDimensions": {},
                    "occurrences": [_source(
                        document,
                        page_number,
                        "pdf_text_layout",
                        "high",
                        raw_model,
                    )],
                })
    return records


def extract_fujikin_layout_records(
    document: dict,
    aliases: set[str],
    ocr_path: Path,
    filename_fragment: str,
) -> list[dict]:
    """Recover page 13/14 UJL/UJX/UJS rows whose scanned headers OCR merges."""
    records = []
    family_specs = {
        "UJL": ["D", "D1", "L", "L1", "A", "B", "C"],
        "UJX": ["D", "D1", "L", "L1", "L2", "A", "B", "C"],
        "UJS": ["D", "D1", "D2", "D3", "L", "L1", "A", "B", "C"],
    }
    for filename, words in read_vision_ocr(ocr_path):
        if filename_fragment not in filename or _ocr_page_number(filename) not in {13, 14}:
            continue
        page_number = _ocr_page_number(filename)
        for word in words:
            alias = _ocr_alias(word["text"], aliases, document["role"], document["businessBrand"])
            family_match = re.match(r"(UJL|UJX|UJS)", alias)
            if not alias or not family_match:
                continue
            family = family_match.group(1)
            specs = list(family_specs[family])
            if family == "UJL" and "X" in alias[len(family):]:
                specs = ["D", "D1", "D2", "D3", "L", "L1", "A", "B", "C"]
            center_y = word["y"] + word["height"] / 2
            left_bound = 0.15 if word["x"] < 0.55 else 0.62
            numeric_cells = []
            for candidate in words:
                if candidate is word:
                    continue
                candidate_y = candidate["y"] + candidate["height"] / 2
                if abs(candidate_y - center_y) > 0.0065:
                    continue
                if not (left_bound <= candidate["x"] < word["x"]):
                    continue
                values = numeric_tokens(candidate["text"])
                for value_index, value in enumerate(values):
                    normalized = (
                        value / 10
                        if (100 < value < 200 or value == 44) and "." not in candidate["text"]
                        else value
                    )
                    numeric_cells.append((
                        candidate["x"] + candidate["width"] * (value_index + 0.5) / max(len(values), 1),
                        normalized,
                        candidate["text"],
                        candidate["confidence"],
                    ))
            numeric_cells.sort(key=lambda item: item[0])
            if len(numeric_cells) < 3:
                continue
            dimensions = {}
            confidence = word["confidence"]
            for label, (_, value, raw_value, value_confidence) in zip(specs, numeric_cells):
                if not 0 < value <= 500:
                    continue
                key = f"catalog{label}"
                dimensions[key] = {
                    "value": round(value, 6),
                    "unit": "mm",
                    "normalizedMm": round(value, 6),
                    "rawValue": raw_value,
                    "catalogLabel": label,
                    "dimensionKey": key,
                }
                confidence = min(confidence, value_confidence)
            if dimensions:
                records.append({
                    "brand": document["businessBrand"],
                    "catalogModel": word["text"],
                    "canonicalModel": alias,
                    "family": document["catalogFamily"],
                    "material": "",
                    "finish": "",
                    "dimensions": dimensions,
                    "missingDimensions": {},
                    "occurrences": [_source(
                        document,
                        page_number,
                        "pdf_visual_ocr_layout",
                        "high" if confidence >= 0.9 else "medium",
                        word["text"],
                    )],
                })
    return records


def extract_vups_text_layout_records(document: dict, aliases: set[str]) -> list[dict]:
    """Recover VMW L/F/H columns from page text where table cells are vertically merged."""
    records = []
    family_prefix_columns = {
        "UE": 2,
        "UT": 2,
        "CU": 2,
        "TB": 2,
        "VE": 2,
        "RE": 4,
        "RT": 4,
    }
    with pdfplumber.open(document["pdfPath"]) as pdf:
        for page_number in range(27, min(30, len(pdf.pages)) + 1):
            page_text = pdf.pages[page_number - 1].extract_text(x_tolerance=1.5, y_tolerance=3) or ""
            lines = [line.strip() for line in page_text.splitlines() if line.strip()]
            pending = None
            for line_index, line in enumerate(lines):
                model_match = re.search(r"\b(VMW-([A-Z]+)[A-Z0-9-]*)\b", line, re.I)
                if model_match:
                    raw_model = model_match.group(1)
                    family = model_match.group(2).upper()
                    alias = _best_alias(raw_model, aliases, document["role"], document["businessBrand"])
                    if alias and family in family_prefix_columns and not raw_model.upper().endswith("-SLV"):
                        inline_values = _line_measurements(line[model_match.end():], "in_mm")
                        pending = (raw_model, alias, family, inline_values, line_index)
                    continue
                if not pending or not re.match(r"^(?:\d|\.)", line):
                    continue
                raw_model, alias, family, inline_values, model_line_index = pending
                values = _line_measurements(line, "in_mm")
                prefix_count = family_prefix_columns[family]
                values = values[prefix_count:]
                if len(values) >= 4 or (values and values[-1]["normalizedMm"] > 200):
                    values = values[:-1]
                dimensions = {}
                if values:
                    assignments = [("L", values[0])]
                    if len(values) >= 3:
                        assignments.extend([("F", values[-2]), ("H", values[-1])])
                    if inline_values:
                        assignments.append(("M", inline_values[0]))
                    for label, parsed in assignments:
                        key = f"catalog{label}"
                        dimensions[key] = {
                            **parsed,
                            "catalogLabel": label,
                            "dimensionKey": key,
                        }
                if dimensions:
                    records.append({
                        "brand": document["businessBrand"],
                        "catalogModel": raw_model,
                        "canonicalModel": alias,
                        "family": document["catalogFamily"],
                        "material": "",
                        "finish": "",
                        "dimensions": dimensions,
                        "missingDimensions": {},
                        "occurrences": [_source(
                            document,
                            page_number,
                            "pdf_text_layout",
                            "high",
                            f"line={model_line_index + 1};model={raw_model}",
                        )],
                    })
                pending = None
    return records


def merge_dimension_records(records: list[dict]) -> list[dict]:
    merged = {}
    for record in records:
        key = (record["brand"], record["canonicalModel"], record["family"])
        existing = merged.get(key)
        if not existing:
            merged[key] = record
            continue
        for dimension, value in record["dimensions"].items():
            current = existing["dimensions"].get(dimension)
            if not current or (
                current.get("unit") == "in"
                and value.get("unit") == "mm"
            ):
                existing["dimensions"][dimension] = value
        for occurrence in record["occurrences"]:
            if occurrence not in existing["occurrences"]:
                existing["occurrences"].append(occurrence)
    for record in merged.values():
        if record["brand"] == "Swagelok" and record["family"] == "tube_fitting":
            dimensions = record["dimensions"]
            tube_dimension = dimensions.get("tubeOutsideDiameter", {})
            imperial_row = (
                0 < dimensions.get("catalogA", {}).get("normalizedMm", 999) < 5
                or (
                    "/" in str(tube_dimension.get("rawValue", ""))
                    and any(
                        0 < dimensions.get(key, {}).get("normalizedMm", 999) < 3
                        for key in ("catalogA", "catalogD", "catalogE", "catalogF")
                    )
                )
            )
            if imperial_row:
                if tube_dimension:
                    fraction_values = [
                        value for value in numeric_tokens(tube_dimension.get("rawValue", ""))
                        if 0 < value <= 2.5
                    ]
                    if fraction_values:
                        value_in = min(fraction_values)
                        tube_dimension.update({
                            "value": round(value_in, 6),
                            "unit": "in",
                            "normalizedMm": round(value_in * 25.4, 6),
                        })
                for key, dimension in dimensions.items():
                    if key == "tubeOutsideDiameter":
                        continue
                    raw_value = str(dimension.get("rawValue", ""))
                    raw_values = numeric_tokens(raw_value)
                    value_in = raw_values[0] if raw_values else None
                    if value_in is not None and 0 < value_in <= 3 and "(" not in raw_value:
                        dimension.update({
                            "value": round(value_in, 6),
                            "unit": "in",
                            "normalizedMm": round(value_in * 25.4, 6),
                        })
    return sorted(merged.values(), key=lambda item: (item["brand"], item["canonicalModel"], item["family"]))
