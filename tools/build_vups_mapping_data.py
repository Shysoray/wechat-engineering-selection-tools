import json
import re
from pathlib import Path


EXTRACT_DIR = Path("tmp/catalog_extract")
OUT_DIR = Path("tmp/vups_mapping")
SIZE_MAP = {
    "1": ("1/16", 1.58),
    "2": ("1/8", 3.17),
    "4": ("1/4", 6.35),
    "6": ("3/8", 9.52),
    "8": ("1/2", 12.70),
    "10": ("5/8", 15.87),
    "12": ("3/4", 19.05),
    "16": ("1", 25.40),
}


PRODUCTS = {
    "FG": ("Face Seal", "Female gland, short tube butt weld", "Gland"),
    "MG": ("Face Seal", "Male gland / male weld gland", "Gland"),
    "MTA": ("Face Seal", "Tube adapter", "Gland"),
    "BG": ("Face Seal", "Blind gland", "Gland"),
    "TFC": ("Face Seal", "Tube fitting connector", "Body"),
    "TFBC": ("Face Seal", "Tube fitting bulkhead connector", "Body"),
    "RMU": ("Face Seal", "Male reducing union", "Body"),
    "MBU": ("Face Seal", "Male bulkhead union", "Body"),
    "MBC": ("Face Seal", "Male NPT bulkhead connector", "Body"),
    "TBBC": ("Face Seal", "Tube butt weld bulkhead connector", "Body"),
    "MC": ("Face Seal", "Straight thread O-ring seal male connector", "Body"),
    "MUC": ("Face Seal", "Union cross", "Body"),
    "FLC": ("Face Seal", "Fitting lock device", "Accessory"),
    "FN": ("Face Seal", "Female nut", "Nut"),
    "MN": ("Face Seal", "Male nut", "Nut"),
    "C": ("Face Seal", "Cap", "Accessory"),
    "P": ("Face Seal", "Plug", "Accessory"),
    "GT": ("Face Seal", "Gasket", "Gasket"),
    "GR": ("Face Seal", "Gasket with retainer", "Gasket"),
    "GL": ("Face Seal", "Flow-limiting gasket", "Gasket"),
    "HFG": ("High-flow Face Seal", "High-flow female gland", "Gland"),
    "HMBU": ("High-flow Face Seal", "High-flow male bulkhead union", "Body"),
    "HMN": ("High-flow Face Seal", "High-flow male nut", "Nut"),
    "HFN": ("High-flow Face Seal", "High-flow female nut", "Nut"),
    "ME": ("Micro Weld", "Micro elbow", "Micro Weld"),
    "MT": ("Micro Weld", "Micro tee", "Micro Weld"),
    "MCX": ("Micro Weld", "Micro cross", "Micro Weld"),
    "ME45": ("Micro Weld", "45 degree union elbow", "Micro Weld"),
    "TWLE": ("Tube Butt Weld", "Long elbow", "Tube Butt Weld"),
    "TWLT": ("Tube Butt Weld", "Long tee", "Tube Butt Weld"),
    "TWRU": ("Tube Butt Weld", "Reducing long union", "Tube Butt Weld"),
    "WM": ("Weld Assembly", "Welded assembly", "Weld Assembly"),
    "WE": ("Weld Assembly", "Welded elbow", "Weld Assembly"),
    "WT": ("Weld Assembly", "Welded tee", "Weld Assembly"),
}


def load_pages(name):
    with (EXTRACT_DIR / name).open(encoding="utf-8") as f:
        return json.load(f)


def material_from_model(model):
    if model.startswith("NI-"):
        return "Nickel"
    if "-SLV" in model:
        return "316L secondary remelt"
    if model.startswith("SS-"):
        return "316L stainless steel"
    return "316L"


def finish_from_model(model):
    if model.endswith("-BA") or "-BA-" in model:
        return "BA, Ra < 0.4 per VIGOUR note"
    if model.endswith("-EP") or "-EP-" in model:
        return "EP"
    return ""


def process_from_model(model):
    return "VS001A / UHP P option" if model.endswith("-P") else "VS001B default"


def split_model(model):
    parts = model.split("-")
    prefix = parts[0]
    raw_product = parts[1] if len(parts) > 1 else ""
    product = raw_product
    product_match = re.match(r"([A-Z]+)(\d*)$", raw_product)
    if product_match:
        product = product_match.group(1)
    size_code = ""
    m = re.search(r"(\d+)", raw_product)
    if m:
        size_code = m.group(1)
    elif len(parts) > 2:
        m = re.search(r"(\d+)", parts[2])
        if m:
            size_code = m.group(1)
    size_in, size_mm = SIZE_MAP.get(size_code, ("", ""))
    series = prefix
    category, product_name, product_group = PRODUCTS.get(product, ("", product, ""))
    if prefix == "HVVR":
        category = "High-flow Face Seal"
        high_flow_products = {
            "HG": ("High-flow tube butt weld gland", "Gland"),
            "MG": ("High-flow tube butt weld body", "Body"),
            "AHG": ("High-flow automatic tube weld body", "Body"),
            "BMG": ("High-flow tube butt weld bulkhead body", "Body"),
            "UE": ("High-flow union elbow", "Body"),
            "UT": ("High-flow union tee", "Body"),
        }
        product_name, product_group = high_flow_products.get(
            product, (product_name, product_group)
        )
    elif prefix == "VMW":
        category = "Micro Weld"
    elif prefix == "VTW":
        category = "Tube Butt Weld"
    elif prefix == "VWR":
        category = "Weld Assembly"
    return {
        "series": series,
        "product_code": product,
        "product_category": category,
        "product_group": product_group,
        "product_name": product_name,
        "size_code": size_code,
        "vfs_size_in": size_in,
        "vfs_size_mm": size_mm,
    }


def extract_vigour_models():
    pages = load_pages("VIGOUR_VUPS.json")
    pat = re.compile(r"\b(?:VVR|HVVR|VMW|VTW|VWR)-[A-Z0-9][A-Z0-9.-]*(?:-[A-Z0-9.]+)*\b")
    rows = []
    seen = set()
    for page in pages:
        text = page["text"]
        for match in pat.finditer(text):
            model = match.group(0).rstrip(".")
            if model in seen:
                continue
            seen.add(model)
            info = split_model(model)
            suffixes = []
            for suffix in ("SLV", "BA", "P"):
                if model.endswith(f"-{suffix}") or f"-{suffix}-" in model:
                    suffixes.append(suffix)
            rows.append(
                {
                    "vigour_model": model,
                    "brand": "VIGOUR",
                    **info,
                    "material": material_from_model(model),
                    "surface_finish": finish_from_model(model),
                    "process_spec": process_from_model(model),
                    "option_suffix": ", ".join(suffixes),
                    "source": f"VIGOUR VUPS catalog p{page['page']}",
                }
            )
    return sorted(rows, key=lambda r: (r["series"], r["product_code"], r["size_code"], r["vigour_model"]))


def rule_rows():
    size_rows = [
        ("1", "1/16", 1.58, "VIGOUR VVR/VUPS size code", "", "", "Swagelok VCR often uses 1 for 1/16 where listed"),
        ("2", "1/8", 3.17, "VIGOUR VVR/VUPS size code", "2", "2", ""),
        ("4", "1/4", 6.35, "VIGOUR VVR/VUPS size code", "4", "4", ""),
        ("6", "3/8", 9.52, "VIGOUR VVR/VUPS size code", "6", "6", ""),
        ("8", "1/2", 12.70, "VIGOUR VVR/VUPS size code", "8", "8", ""),
        ("10", "5/8", 15.87, "VIGOUR VVR/VUPS size code", "10", "", "Swagelok includes 5/8 nuts/gaskets; JSK TOM rule page lists 2,4,6,8,12,16"),
        ("12", "3/4", 19.05, "VIGOUR VVR/VUPS size code", "12", "12", ""),
        ("16", "1", 25.40, "VIGOUR VVR/VUPS size code", "16", "16", ""),
    ]
    product_rows = [
        ("Face Seal", "Female gland, short tube butt weld", "FG", "6LV-{size}-VCR-3S-{tube}TB*", "TSG", "Swagelok short tube butt weld gland maps to VIGOUR FG; JSK SG is female gland."),
        ("Face Seal", "Male gland, long tube butt weld", "MG", "6LV-{size}-VCR-3-{tube}TB*", "TLG", "Swagelok long tube butt weld gland maps to VIGOUR MG; JSK LG is male gland."),
        ("Face Seal", "Male weld gland", "MG ... TW", "SS-{size}-VCR-3-{tube}MTW", "TMG", "VIGOUR uses MG with TW suffix for male weld gland."),
        ("Face Seal", "Tube adapter", "MTA", "SS-{size}-VCR-3-{tube}TA", "TTA", "Equivalent by VFS/VCR size and tube size."),
        ("Face Seal", "Blind gland", "BG", "SS-{size}-VCR-3-BL", "TBG", "Blind gland / blind gasket terms must be checked by component type."),
        ("Face Seal", "Tube fitting connector", "TFC", "SS-{size}-VCR-6-*", "TTFC", "Use when the non-VCR side is a tube fitting connector."),
        ("Face Seal", "Male NPT bulkhead connector", "MBC", "SS-{size}-VCR-A1-*M", "TMCR/TMCN", "Map by thread standard PT/NPT/ST and VFS size."),
        ("Face Seal", "Male reducing union", "RMU", "SS-{size}-VCR-3-*TSW / reducing", "", "Use for reducing VFS sizes only."),
        ("Face Seal", "Male bulkhead union", "MBU", "SS-{size}-VCR-A1-*M or body bulkhead", "TBU", "Confirm fixed-thread/rotating-nut assembly requirements."),
        ("Face Seal", "Union cross", "MUC", "SS-{size}-VCR-CS", "TUC", "Equivalent by all ports same VFS size."),
        ("Face Seal", "Female nut", "FN", "SS-{size}-VCR-1", "TFN", "Nut material/plating differs by brand; confirm plating/process."),
        ("Face Seal", "Male nut", "MN", "SS-{size}-VCR-4", "TMN", "Use standard male nut unless short/split nut is specified."),
        ("Face Seal", "Cap", "C", "SS-{size}-VCR-CP", "TCP", "Cap maps by VFS size."),
        ("Face Seal", "Plug", "P", "SS-{size}-VCR-P", "TPG", "Plug maps by VFS size."),
        ("Face Seal", "Gasket", "GT", "{material}-{size}-VCR-2", "TGT", "Map by gasket material: NI/SS/CU and retained/nonretained style."),
        ("Face Seal", "Gasket with retainer", "GR", "{material}-{size}-VCR-2-GR", "TGR", "Copper side-load retainer availability may differ."),
        ("High-flow Face Seal", "High-flow glands/nuts", "HFG/HMN/HFN", "SS-4-HVCR-*", "THLG/THMN/THFN", "High-flow only maps to HVCR/HVVR families."),
        ("Micro Weld", "Micro elbow", "ME", "", "ME", "JSK Micro ME maps to VIGOUR VMW-ME by tube OD, material, finish."),
        ("Micro Weld", "Micro tee", "MT", "", "MT", "JSK Micro MT maps to VIGOUR VMW-MT by tube OD, material, finish."),
        ("Micro Weld", "Micro cross", "MCX", "", "CT", "JSK CT cross maps to VIGOUR VMW-MCX where offered."),
        ("Tube Butt Weld", "Long elbow", "TWLE", "", "LE", "JSK forged long elbow maps to VIGOUR VTW-TWLE by tube OD."),
        ("Tube Butt Weld", "Long tee", "TWLT", "", "LT", "JSK forged tee maps to VIGOUR VTW-TWLT by tube OD."),
        ("Tube Butt Weld", "Reducing long union", "TWRU", "", "LR/SR", "Map by large and small tube OD."),
    ]
    rules = []
    for row in size_rows:
        rules.append(
            {
                "rule_type": "Size code",
                "category": "",
                "product_name": "",
                "vigour_code": row[0],
                "vigour_size_in": row[1],
                "vigour_size_mm": row[2],
                "swagelok_code_or_pattern": row[4],
                "jsk_code_or_pattern": row[5],
                "mapping_note": row[6],
                "source": "VIGOUR VUPS p1-p31; Swagelok VCR p4-p18; JSK designations p18/p26",
            }
        )
    for row in product_rows:
        rules.append(
            {
                "rule_type": "Product code",
                "category": row[0],
                "product_name": row[1],
                "vigour_code": row[2],
                "vigour_size_in": "",
                "vigour_size_mm": "",
                "swagelok_code_or_pattern": row[3],
                "jsk_code_or_pattern": row[4],
                "mapping_note": row[5],
                "source": "VIGOUR VUPS catalog; Swagelok VCR catalog; JSK Micro/TOM Joint catalog",
            }
        )
    return rules


def mapping_examples():
    examples = [
        ("Swagelok", "6LV-4-VCR-3S-4TB7", "Face Seal", "Female gland, short tube butt weld", "316L VAR / UHP", "1/4", "1/4 tube butt weld", "VVR-FG4-TB4-P", "Series candidate", "Same VCR/VFS size and tube butt weld function; confirm length TB7 vs VIGOUR standard/short L options."),
        ("Swagelok", "6LV-4-VCR-3-4TB7", "Face Seal", "Male gland, long tube butt weld", "316L VAR / UHP", "1/4", "1/4 tube butt weld", "VVR-MG4-TB4-P", "Series candidate", "Same function; add -BA or -SLV if material/finish requirement demands it."),
        ("Swagelok", "SS-4-VCR-1", "Face Seal", "Female nut", "316 SS", "1/4", "", "VVR-FN4", "Direct by size/function", "Confirm plating and material spec before final substitution."),
        ("Swagelok", "SS-4-VCR-4", "Face Seal", "Male nut", "316 SS", "1/4", "", "VVR-MN4", "Direct by size/function", "Confirm standard vs short/split nut variant."),
        ("Swagelok", "SS-4-VCR-CP", "Face Seal", "Cap", "316 SS", "1/4", "", "VVR-C4", "Direct by size/function", "Cap maps by VFS size."),
        ("Swagelok", "SS-4-VCR-P", "Face Seal", "Plug", "316 SS", "1/4", "", "VVR-P4", "Direct by size/function", "Plug maps by VFS size."),
        ("Swagelok", "SS-4-VCR-2-GR-VS", "Face Seal", "Gasket with retainer", "316L SS", "1/4", "Unplated retainer gasket", "VVR-GR4-SS", "Series candidate", "Map material and retained style; verify exact VIGOUR gasket suffix."),
        ("JSK", "T LG 4 S 19 BA", "Face Seal", "Male gland", "Single melt 316L, BA", "1/4", "Standard gland type 19", "VVR-MG4-TB4-BA", "Rule-generated candidate", "JSK positions: Series/Product/Size/Material/Gland Type/Finish."),
        ("JSK", "T SG 4 V 10 EP", "Face Seal", "Female gland", "Double melt, EP", "1/4", "Short gland type 10", "VVR-FG4-TB4-SLV", "Rule-generated candidate", "VIGOUR catalog lists -SLV for secondary remelt; EP finish suffix should be confirmed if required."),
        ("JSK", "T FN 8 S BA", "Face Seal", "Female nut", "Single melt 316L, BA", "1/2", "", "VVR-FN8", "Rule-generated candidate", "Finish often applies to wetted components; confirm nut finish requirement."),
        ("JSK", "M E 4 S EP", "Micro Weld", "Micro elbow", "Single melt 316L, EP", "1/4", "", "VMW-ME4-EP", "Series candidate", "JSK Micro fitting maps to VIGOUR VMW series where same OD exists."),
        ("JSK", "M T 8 V BA", "Micro Weld", "Micro tee", "Double melt, BA", "1/2", "", "VMW-MT8-SLV-BA", "Series candidate", "Use -SLV for VIM/VAR if VIGOUR confirms secondary remelt suffix on VMW."),
    ]
    cols = ["source_brand", "source_model_or_rule", "product_category", "product_name", "material", "size", "connection_detail", "vigour_model_candidate", "match_status", "notes"]
    return [dict(zip(cols, row)) for row in examples]


def source_notes():
    return [
        {"source": "VIGOUR VUPS", "file": "VIGOUR VUPS接头目录 英文-26.5.28.pdf", "pages": "1-35", "notes": "Primary VIGOUR target catalog. Face Seal VVR, HVVR, Micro Weld VMW, Tube Butt Weld VTW, Weld Assembly VWR."},
        {"source": "Swagelok VCR", "file": "Swagelok-VCR-EN.pdf", "pages": "4-18", "notes": "Reference brand rules and model patterns for VCR metal gasket face seal fittings."},
        {"source": "JSK Micro", "file": "JSK-Micro fitting.pdf", "pages": "18-24", "notes": "Reference JSK Micro/automatic tube weld designations: series, product, size, material, finishing."},
        {"source": "JSK TOM Joint", "file": "JSK-VCR.pdf", "pages": "26-33", "notes": "Reference JSK TOM Joint metal seal designation system."},
    ]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        "vigour_models": extract_vigour_models(),
        "rules": rule_rows(),
        "mapping_examples": mapping_examples(),
        "source_notes": source_notes(),
    }
    (OUT_DIR / "vups_mapping_data.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: len(v) for k, v in data.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
