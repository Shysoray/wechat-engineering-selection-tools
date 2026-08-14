import re
import os
from functools import lru_cache
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB_ROOT = Path(
    os.environ.get(
        "FITTING_KB_ROOT",
        "/Users/maybe/Documents/ChatGPT/mark/MarkItDown-KB",
    )
)

CATALOG_SOURCE_NAMES = {
    "Swagelok": "Swagelok 卡套/VCR Markdown 目录",
    "UNILOK": "UNILOK 卡套/VCR Markdown 目录",
    "FITOK": "FITOK 6D/Face Seal/Weld Markdown 目录",
    "FUJIKIN": "FUJIKIN UJR Markdown 目录",
    "JSK": "JSK VCR/Micro fitting Markdown 目录",
    "SUPERLOK": "SUPERLOK 卡套/UHP Weld Markdown 目录",
    "TK-Fujikin": "TK-Fujikin Weld & Metal Seal Markdown 目录",
}

BRAND_DOCUMENTS = {
    "Swagelok": ("swagelok-卡套.md", "Swagelok-VCR-EN.md"),
    "UNILOK": ("UNILOK-卡套.md", "UNILOK-VCR.md"),
    "FITOK": ("6D_Series_Tube_Fittings_ZH.md", "Face_Seal_Fittings_ZH.md", "Weld_Fittings_ZH.md"),
    "FUJIKIN": ("Fujikin-UJR接头系列.md",),
    "JSK": ("JSK-VCR.md", "JSK-Micro fitting.md"),
    "SUPERLOK": ("SUPERLOK-TUBE-FITTINGS.md", "UHP-WELD-CLEAN-FITTINGS (2).md"),
    "TK-Fujikin": ("WELD & METAL SEAL FITTINGS (2).md",),
}

SWAGELOK_RULE_EVIDENCE_MODELS = {
    "SS-600-1-6STDE",
    "SS-2003-1BL",
    "SS-2004-1WC",
    "SS-600-2-6STDE",
    "SS-2400-6BM",
    "SS-200-6CP",
}

SWAGELOK_FIRST_TOKENS = {
    "2", "3", "4", "5", "6", "8", "10", "12", "16", "18", "20", "24", "32",
    "100", "200", "300", "400", "500", "600", "810", "1010", "1210", "1410",
    "1610", "1810", "2000", "2400", "3200",
    "2M0", "3M0", "4M0", "6M0", "8M0", "10M0", "12M0", "14M0", "15M0", "16M0",
    "18M0", "20M0", "22M0", "25M0", "28M0", "30M0", "32M0", "38M0", "50M0",
}

MATERIAL_SUFFIXES = {"SS", "BR", "CS"}


def normalize_model(value):
    return (
        str(value or "")
        .upper()
        .translate(str.maketrans("‐‑‒–—﹘﹣－", "--------"))
        .replace(" ", "")
        .replace("\t", "")
        .strip()
    )


def normalize_catalog_text(value):
    return str(value or "").upper().translate(str.maketrans("‐‑‒–—﹘﹣－", "--------"))


@lru_cache(maxsize=16)
def searchable_catalog_text(text):
    normalized = normalize_catalog_text(text)
    return " " + re.sub(r"[^A-Z0-9.#-]+", " ", normalized) + " "


@lru_cache(maxsize=16)
def catalog_tokens(text):
    tokens = searchable_catalog_text(text).split()
    return frozenset(tokens + [token.rstrip(".-") for token in tokens])


def catalog_contains_model(text, model):
    key = normalize_model(model)
    if not key:
        return False
    tokens = catalog_tokens(text)
    if key in tokens:
        return True
    if key.startswith("SS-"):
        return key[2:] in tokens
    return False


def load_catalog_text(brand):
    names = BRAND_DOCUMENTS.get(brand)
    if not names:
        raise KeyError(f"No Markdown catalog route for brand: {brand}")
    paths = []
    for name in names:
        docs_matches = list((KB_ROOT / "docs").glob(f"**/{name}"))
        page_path = KB_ROOT / "audit/page-text" / name
        if len(docs_matches) != 1 or not page_path.exists():
            raise FileNotFoundError(
                f"Missing or ambiguous {brand} Markdown catalog route: {name} "
                f"docs={docs_matches} page={page_path}"
            )
        paths.extend([docs_matches[0], page_path])
    return "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in paths
    )


def strip_unilok_material(model):
    normalized = normalize_model(model)
    parts = normalized.split("-")
    if parts and parts[-1] in MATERIAL_SUFFIXES:
        return "-".join(parts[:-1])
    return normalized


def canonicalize_unilok_model(model, size_code=""):
    normalized = normalize_model(model)
    size = normalize_model(size_code)
    # The workbook collapsed the leading zero from one-digit metric tube sizes
    # (M6 -> M06). UNILOK's printed ordering table always keeps that zero.
    if re.fullmatch(r"[2-9]M", size):
        normalized = re.sub(
            r"^((?:URBT/URRT|[A-Z]+)-)M([2-9])",
            lambda match: f"{match.group(1)}M0{match.group(2)}",
            normalized,
            count=1,
        )
    normalized = re.sub(r"M([2-9])(?=M)", r"M0\1", normalized)
    normalized = re.sub(r"M([2-9])(?=-(?:SS|BR|CS)$)", r"M0\1", normalized)
    return normalized


def split_unilok_source_models(model):
    normalized = normalize_model(model)
    prefix = "URBT/URRT-"
    if not normalized.startswith(prefix):
        return [normalized]
    suffix = normalized[len(prefix):]
    return [f"URBT-{suffix}", f"URRT-{suffix}"]


def unilok_catalog_base_models(text):
    models = set()
    pattern = re.compile(r"(?<![A-Z0-9])(U[A-Z]{1,8}-(?:M)?[A-Z0-9]+(?:-[A-Z0-9]+)*)(?![A-Z0-9])")
    for match in pattern.finditer(normalize_catalog_text(text)):
        model = strip_unilok_material(match.group(1))
        if any(character.isdigit() for character in model):
            models.add(model)
    return models


def swagelok_catalog_models(text):
    normalized = normalize_catalog_text(text)
    models = set(SWAGELOK_RULE_EVIDENCE_MODELS)

    for match in re.finditer(
        r"(?<![A-Z0-9])((?:SS|6LV|316L)-[A-Z0-9.]+(?:-[A-Z0-9.]+)+)(?![A-Z0-9])",
        normalized,
    ):
        model = match.group(1).rstrip(".")
        if any(character.isdigit() for character in model):
            models.add(model)

    for match in re.finditer(
        r"(?<![A-Z0-9])(-[A-Z0-9.]+(?:-[A-Z0-9.]+)+)(?![A-Z0-9])",
        normalized,
    ):
        basic = match.group(1).rstrip(".")
        first = basic[1:].split("-", 1)[0]
        if first not in SWAGELOK_FIRST_TOKENS:
            continue
        if any(word in basic for word in ("CANNOT", "DIM")):
            continue
        models.add(f"SS{basic}")
    return models


def catalog_inventory(brand, text=None):
    catalog_text = load_catalog_text(brand) if text is None else text
    if brand == "Swagelok":
        return swagelok_catalog_models(catalog_text)
    if brand == "UNILOK":
        return unilok_catalog_base_models(catalog_text)
    normalized = normalize_catalog_text(catalog_text)
    models = set()
    for match in re.finditer(
        r"(?<![A-Z0-9])([A-Z0-9][A-Z0-9./#-]{3,79})(?![A-Z0-9])",
        normalized,
    ):
        model = match.group(1).strip(".-")
        if "-" not in model or not any(character.isdigit() for character in model):
            continue
        if re.fullmatch(r"\d+(?:\.\d+)?-\d+(?:\.\d+)?", model):
            continue
        if any(word in model for word in ("HTTP", "WWW", "PAGE", "FIGURE", "TABLE")):
            continue
        models.add(model)
    return models


def model_family_tokens(model):
    normalized = normalize_model(model)
    tokens = []
    for part in normalized.split("-"):
        letters = "".join(re.findall(r"[A-Z]+", part))
        if len(letters) >= 2:
            tokens.append(letters)
    prefix = re.match(r"^(?:SS|6L|6LV|6LW)?-?([A-Z]{2,10})", normalized)
    if prefix:
        tokens.append(prefix.group(1))
    return list(dict.fromkeys(tokens))


def source_evidence_status(brand, model, catalog_text=None):
    if brand not in CATALOG_SOURCE_NAMES:
        return "unverified"
    text = load_catalog_text(brand) if catalog_text is None else catalog_text
    normalized = normalize_model(model)
    if brand == "Swagelok":
        if catalog_contains_model(text, normalized):
            return "catalog_exact"
        if normalized in SWAGELOK_RULE_EVIDENCE_MODELS:
            return "catalog_rule"
        return "unverified"
    base = strip_unilok_material(normalized)
    if brand == "UNILOK":
        return "catalog_exact" if catalog_contains_model(text, base) else "unverified"
    if catalog_contains_model(text, normalized):
        return "catalog_exact"
    searchable = searchable_catalog_text(text)
    family_tokens = model_family_tokens(normalized)
    if any(f" {token} " in searchable for token in family_tokens):
        return "catalog_rule"
    return "unverified"


def normalized_target_models(value):
    result = []
    for raw_part in re.split(r"\s*/\s*", str(value or "").strip()):
        part = raw_part.strip()
        if part and part not in result:
            result.append(part)
    return result
