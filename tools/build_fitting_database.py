import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp/vups_mapping/vups_mapping_data.json"
SWAGELOK_SOURCE = ROOT / "tmp/catalog_extract/Swagelok_VCR.json"
SWAGELOK_WELD_SOURCE = ROOT / "tmp/catalog_extract/Swagelok_Weld.json"
FITOK_CATALOG_SOURCE = ROOT / "data/fitokCatalogModels.json"
OUTPUT = ROOT / "packageFitting/fittingDatabase.js"
AUDIT_OUTPUT = ROOT / "outputs/tube_fitting_audit/fitting_generation_audit.json"

GENERATION_SKIP_EVENTS = []


def reset_generation_audit():
    GENERATION_SKIP_EVENTS.clear()


def record_generation_skip(stage, brand, source_model, reason, target_model=""):
    if not stage or not brand or not source_model or not reason:
        raise ValueError("Generation skip audit requires stage, brand, source model, and reason")
    GENERATION_SKIP_EVENTS.append(
        {
            "stage": stage,
            "brand": brand,
            "sourceModel": source_model,
            "targetModel": target_model,
            "reason": reason,
        }
    )

SIZE_LABELS = {
    "1": "1/16",
    "2": "1/8",
    "4": "1/4",
    "6": "3/8",
    "8": "1/2",
    "10": "5/8",
    "12": "3/4",
    "16": "1",
}

SWAGELOK_PRODUCT = {
    "FG": ("3S", "Female gland, short tube butt weld"),
    "MG": ("3", "Male gland, long tube butt weld"),
    "MTA": ("3-TA", "Tube adapter"),
    "BG": ("3-BL", "Blind gland"),
    "TFC": ("6", "Tube fitting connector"),
    "TFBC": ("6-BH", "Tube fitting bulkhead connector"),
    "RMU": ("3-R", "Male reducing union"),
    "MBU": ("A1", "Male bulkhead union"),
    "MBC": ("A1", "Male NPT bulkhead connector"),
    "TBBC": ("A1-TB", "Tube butt weld bulkhead connector"),
    "MUC": ("CS", "Union cross"),
    "MUT": ("T", "Union tee"),
    "FN": ("1", "Female nut"),
    "MN": ("4", "Male nut"),
    "C": ("CP", "Cap"),
    "P": ("P", "Plug"),
    "GK": ("2", "Gasket"),
    "GKR": ("2-GR", "Gasket with retainer"),
}

SWAGELOK_CONNECTION_TO_VIGOUR = {
    "3S": "FG",
    "3": "MG",
    "3-TA": "MTA",
    "3-BL": "BG",
    "6": "MU",
    "61": "MBU",
    "61S": "MBU",
    "T": "MUT",
    "9": "MUE",
    "CS": "MUC",
    "CG": "FU",
    "7": "MC",
    "A1": "TFBC",
    "A1S": "TFBC",
    "1": "FN",
    "1-TBW": "MG",
    "1-ATW": "AHG",
    "1SR": "FN",
    "4": "MN",
    "4SR": "MN",
    "CP": "C",
    "P": "P",
    "2": "GK",
    "2-GR": "GKR",
}

SWAGELOK_VCR_EXTRACTION_CORRECTIONS = {
    "SS-10-VCR-113": "SS-10-VCR-1",
    "SS-10-VCR-411": "SS-10-VCR-4",
    "SS-12-VCR-111": "SS-12-VCR-1",
    "SS-12-VCR-415": "SS-12-VCR-4",
    "SS-16-VCR-113": "SS-16-VCR-1",
    "SS-16-VCR-415": "SS-16-VCR-4",
    "SS-2-VCR-17": "SS-2-VCR-1",
    "SS-2-VCR-43": "SS-2-VCR-4",
    "SS-4-VCR-13": "SS-4-VCR-1",
    "SS-8-VCR-111": "SS-8-VCR-1",
    "SS-8-VCR-415": "SS-8-VCR-4",
    "SS-8-VCR-BP15": "SS-8-VCR-BP",
    "SS-4-VCR-4-.54NC1": "SS-4-VCR-4-.54NC",
    "SS-4-VCR-6-DF-23": "SS-4-VCR-6-DF-2",
    "SS-4-VCR-7-2VCRF5": "SS-4-VCR-7-2VCRF",
    "SS-4-VCR-7-8VCRF11": "SS-4-VCR-7-8VCRF",
    "SS-8-VCR-7-4VCRF15": "SS-8-VCR-7-4VCRF",
    "SS-4-VCR-A1-4M13": "SS-4-VCR-A1-4M",
    "SS-8-VCR-A1-4M15": "SS-8-VCR-A1-4M",
    "SS-8-VCR-6-DM-415": "SS-8-VCR-6-DM-4",
}

SWAGELOK_VCR_EXPLICIT_CATALOG_MODELS = {
    "SS-10-VCR-1",
    "SS-10-VCR-4",
    "SS-8-VCR-BP",
    "SS-4-VCR-4-.54NC",
    "SS-4-VCR-6-DF-2",
    "SS-8-VCR-6-DF-4",
    "SS-2-VCR-7-4VCRF",
    "SS-4-VCR-7-2VCRF",
    "SS-4-VCR-7-8VCRF",
    "SS-8-VCR-7-4VCRF",
    "SS-4-VCR-A1-4M",
    "SS-8-VCR-A1-4M",
}

JSK_FACE_SEAL_PRODUCT = {
    "FG": ("SG", "Female gland"),
    "MG": ("LG", "Male gland"),
    "MTA": ("TA", "Tube adapter"),
    "BG": ("BG", "Blind gland"),
    "TFC": ("TFC", "Tube fitting connector"),
    "TFBC": ("TFBC", "Tube fitting bulkhead connector"),
    "RMU": ("RU", "Reducing union"),
    "MBU": ("BU", "Male bulkhead union"),
    "MBC": ("MCN", "Male NPT bulkhead connector"),
    "TBBC": ("TBBC", "Tube butt weld bulkhead connector"),
    "MUC": ("UC", "Union cross"),
    "FN": ("FN", "Female nut"),
    "MN": ("MN", "Male nut"),
    "C": ("CP", "Cap"),
    "P": ("PG", "Plug"),
    "GK": ("GT", "Gasket"),
    "GKR": ("GR", "Gasket with retainer"),
}

JSK_MICRO_PRODUCT = {
    "UE": ("E", "Elbow"),
    "UT": ("T", "Tee"),
    "RE": ("E", "Reducing elbow"),
    "RT": ("T", "Reducing tee"),
    "RU": ("R", "Reducer"),
    "CU": ("CT", "Cross"),
    "TB": ("TB", "Tribow"),
    "VE": ("EF", "45 degree elbow"),
}

JSK_TUBE_WELD_PRODUCT = {
    "LE": ("LE", "Long elbow"),
    "LT": ("LT", "Long tee"),
    "RLE": ("RLE", "Reducing long elbow"),
    "RLT": ("RLT", "Reducing long tee"),
    "RLU": ("RLU", "Reducing long union"),
}

FUJIKIN_SIZE = {
    "3.2": ("2", "2", "1/8 OD"),
    "6.35": ("4", "4", "1/4 OD"),
    "9.52": ("8", "6", "3/8 OD"),
    "12.7": ("8", "8", "1/2 OD"),
    "19.05": ("12", "12", "3/4 OD"),
}

FUJIKIN_MATERIALS = [
    ("SUS316L", "SUS316L special single melt"),
    ("316LM", "SUS316L W secondary melt / low Mn"),
    ("FS9", "Ferrite series special stainless steel"),
]

FUJIKIN_TREATMENTS = [
    ("STD", "Standard / not specified"),
    ("UP", "UP treatment"),
    ("FD", "Fluorinated corrosion resistant treatment"),
    ("PS", "Cr2O3 treatment"),
    ("BK", "BK treatment"),
]

FUJIKIN_UNSUPPORTED_LENGTH_MODELS = {
    "UJR-9.52MS-L19-AW-S",
    "UJR-9.52MS-L37-AW-S",
    "UJR-12.7MS-L37-AW-S",
    "UJR-6.35X9.52MS-L28.5-APM",
}

TK_MATERIALS = [
    ("S", "316L Stainless Steel"),
    ("D", "316L Stainless Steel Remelted / VAR"),
]

TK_FINISHES = [
    ("BA", "BA"),
    ("EP", "EP"),
]

TK_GASKET_PRODUCTS = {"GR", "GT", "GB"}

SUPERLOK_MATERIALS = [
    ("SM", "316L Stainless Steel"),
    ("DM", "316L Stainless Steel VAR"),
]

SUPERLOK_GASKET_MATERIALS = [
    ("SM", "316L Stainless Steel"),
    ("NI", "Nickel"),
]

SUPERLOK_FINISHES = [
    ("BA", "BA"),
    ("EP", "EP"),
]

SUPERLOK_GASKET_FINISHES = [
    ("STD", "Unplated"),
    ("SP", "Silver plated"),
]

UNILOK_MATERIALS = [
    ("SM", "316L Stainless Steel - Single Melting"),
    ("DM", "316L Stainless Steel - Double Melting"),
]

UNILOK_FINISHES = [
    ("BA", "Bright Annealing"),
    ("EP", "Electro Polished"),
]

UNILOK_GASKET_MATERIALS = [
    ("SL", "316L Stainless Steel"),
    ("NI", "Nickel"),
]

UNILOK_NUT_RULES = {
    "CFN": {
        "sizes": ("04", "08", "12", "16"),
        "target_prefix": "VVR-FN",
        "dimension_confirmation": False,
        "target_finish_label": "标准 316L / 无 EP 工艺",
    },
    "CMN": {
        "sizes": ("04", "08", "12", "16"),
        "target_prefix": "VVR-MN",
        "dimension_confirmation": False,
        "target_finish_label": "标准 316L / 无 EP 工艺",
    },
    "CHFN": {
        "sizes": ("04",),
        "target_prefix": "HVVR-FN",
        "dimension_confirmation": False,
        "target_finish_label": "标准 316L / 无 EP 工艺",
    },
    "CHMN": {
        "sizes": ("04",),
        "target_prefix": "HVVR-MN",
        "dimension_confirmation": False,
        "target_finish_label": "标准 316L / 无 EP 工艺",
    },
}

UNILOK_DIRECT_ACCESSORY_PRODUCTS = {
    "CCP", "CPG", "CGT", "CGTR", "CGTB",
} | set(UNILOK_NUT_RULES)

EVIDENCE_DIR = ROOT / "data/fitting-evidence"
FAMILY_COMPARISON_RULES = json.loads(
    (EVIDENCE_DIR / "family-comparison-rules.json").read_text(encoding="utf-8")
)
MANUAL_DIMENSION_EVIDENCE = json.loads(
    (EVIDENCE_DIR / "manual-overrides.json").read_text(encoding="utf-8")
)
GLAND_RULE = next(
    rule
    for rule in FAMILY_COMPARISON_RULES["rules"]
    if rule["ruleId"] == "face_seal_gland.v1"
)
UNILOK_GLAND_LENGTH_TOLERANCE_MM = GLAND_RULE["tolerances"]["overallLength"]["value"]
UNILOK_GLAND_INSERTION_TOLERANCE_MM = GLAND_RULE["tolerances"]["insertionLength"]["value"]
UNILOK_GLAND_WALL_TOLERANCE_IN = GLAND_RULE["tolerances"]["wallThickness"]["value"]
UNILOK_GLAND_SOURCE_RECORDS = {
    tuple(record["key"].split("|", 1)): record
    for record in MANUAL_DIMENSION_EVIDENCE["sourceRecords"]
}
UNILOK_GLAND_SOURCE_DIMENSIONS = {
    key: (record["overallLengthMm"], record["wallThicknessIn"])
    for key, record in UNILOK_GLAND_SOURCE_RECORDS.items()
}
UNILOK_GLAND_SOURCE_INSERTION_MM = {
    key: record["insertionLengthMm"]
    for key, record in UNILOK_GLAND_SOURCE_RECORDS.items()
}
VIGOUR_GLAND_TOTAL_LENGTHS_MM = {
    record["model"]: record["overallLengthMm"]
    for record in MANUAL_DIMENSION_EVIDENCE["targetRecords"]
}
VIGOUR_GLAND_INSERTION_LENGTHS_MM = {
    record["model"]: record["insertionLengthMm"]
    for record in MANUAL_DIMENSION_EVIDENCE["targetRecords"]
}
VIGOUR_GLAND_WALL_THICKNESS_IN = MANUAL_DIMENSION_EVIDENCE[
    "targetWallThicknessByTubeCodeIn"
]

FITOK_MATERIALS = [
    ("SS", "316 SS"),
    ("6L", "316L SS"),
    ("6LV", "316L SS VAR"),
    ("6LW", "316L SS VIM-VAR"),
]

FITOK_PROCESSES = [
    ("STD", "FC-01 Standard cleaning and packaging"),
    ("F2", "FC-02 Special cleaning and packaging"),
    ("F3", "FC-03 UHP, electropolished Ra 5 microin"),
]

FITOK_METRIC_SIZE_MAP = {
    "6": "4",
    "8": "6",
    "10": "6",
    "12": "8",
    "18": "12",
}

FITOK_SPECIAL_MODELS = [
    ("6L-GT-FR2-UP-ID-F2", "VVR-GK-G2-DM", "GT", "Restriction gasket", "2", "1/8", "ID", "孔径未提供"),
    ("6L-GT-FR4-A-UP-ID0.3", "VVR-GKR-G4-DM", "GT", "Restriction gasket retainer assembly", "4", "1/4", "A-UP-ID0.3", "0.3 mm 孔径需确认"),
    ("6L-GT-FR4-UP-05M", "VVR-GKF-G4-0.5", "GT", "Snubber filter gasket", "4", "1/4", "UP-05M", "0.5 micrometre filter"),
    ("6L-GT-FR8-A-UP", "VVR-GKR-G8", "GT", "Gasket retainer assembly", "8", "1/2", "A-UP", "Unplated retainer"),
    ("6LV-R-FR4-040", "VVR-MU4-DM-040", "R", "Flow restrictor", "4", "1/4", "040", "0.040 inch orifice"),
    ("6LV-R-FR4-080", "VVR-MU4-DM-080", "R", "Flow restrictor", "4", "1/4", "080", "0.080 inch orifice"),
    ("6LV-R-FR4-100", "VVR-MU4-DM-100", "R", "Flow restrictor", "4", "1/4", "100", "0.100 inch orifice"),
    ("6LW-GT-FR4-A-UP-ID", "VVR-GKR-G4-DM", "GT", "Restriction gasket retainer assembly", "4", "1/4", "A-UP-ID", "孔径未提供"),
    ("SS-GT-FR4-KN-A-UP-F2", "VVR-GKR-G4", "GT", "Special gasket retainer assembly", "4", "1/4", "KN-A-UP", "KN 特殊结构需确认"),
    ("SS-GT-FR8-UP-R-F3", "VVR-GK-G8-DM", "GT", "Ruby orifice restriction gasket", "8", "1/2", "UP-R", "红宝石孔径未提供"),
]

TK_SIZE_LABELS = {
    "2": "1/8",
    "4": "1/4",
    "6": "3/8 tube / 1/2 head",
    "8": "1/2",
    "12": "3/4",
    "16": "1",
}

TK_FACE_SIZE = {
    "2": ("2", "2"),
    "4": ("4", "4"),
    "6": ("8", "6"),
    "8": ("8", "8"),
    "12": ("12", "12"),
    "16": ("16", "16"),
}

TK_PRODUCT_LABELS = {
    "R": "Reducer",
    "E": "90 degree elbow",
    "HE": "45 degree elbow",
    "EX": "Extended leg elbow",
    "EXE": "Extended leg elbow",
    "T": "Tee",
    "EXT": "Extended tee",
    "CT": "Cross",
    "TB": "Tribow",
    "SG": "Female gland",
    "ASG": "ATW female long gland",
    "SWSG": "Socket weld short gland",
    "LG": "Male gland",
    "ALG": "ATW male long gland",
    "SWLG": "Socket weld long gland",
    "BLG": "Blind gland",
    "MG": "Male weld gland",
    "TA": "Tube adapter",
    "MU": "Double male union",
    "BH": "Bulkhead union",
    "BY": "TBW body",
    "BHY": "TBW bulkhead connector",
    "FU": "Double female reducing union",
    "RA": "Reducing adapter",
    "RB": "Reducing bushing",
    "ME": "Male elbow",
    "UE": "Union elbow",
    "UT": "Union tee",
    "UC": "Union cross",
    "MCK": "Tube fitting connector",
    "BHCK": "Tube fitting bulkhead connector",
    "BHC": "Male bulkhead connector",
    "MC": "Male connector",
    "MCS": "Male connector ST",
    "FC": "Female connector",
    "GR": "Gasket retainer assembly",
    "GT": "Gasket",
    "GB": "Blind gasket",
    "FN": "Female nut",
    "MN": "Male nut",
    "MNS": "Short male nut",
    "PG": "Plug",
    "CP": "Cap",
}

SUPERLOK_PRODUCT_LABELS = {
    **TK_PRODUCT_LABELS,
    "FG": "Female gland",
    "MG": "Male gland",
    "SSG": "Socket weld short gland",
    "SLG": "Socket weld long gland",
    "RSLG": "Reducing socket weld gland",
    "MWG": "Male weld gland",
    "MRU": "Double male reducing union",
    "BHU": "Bulkhead union",
    "TC": "TBW connector",
    "TBHC": "TBW bulkhead connector",
    "FRU": "Double female reducing union",
    "SC": "SUPERLOK tube fitting connector",
    "BHSC": "SUPERLOK tube fitting bulkhead connector",
    "BHMC": "Bulkhead male connector",
    "BGT": "Blind gasket",
    "PGC": "Plug cable type",
    "HTC": "High flow TBW connector",
    "HBHC": "High flow TBW bulkhead connector",
    "WMC": "Welded male connector",
    "WFC": "Welded female connector",
    "WSC": "Welded Lok connector",
    "WFU": "Welded female union",
}

UNILOK_PRODUCT_LABELS = {
    "CME": "Micro Elbow 90°",
    "CMRE": "Reducing Micro Elbow 90°",
    "CMVE": "Micro Elbow 45°",
    "CMT": "Micro Tee",
    "CMRT": "Reducing Micro Tee",
    "CMTB": "Micro Tribow",
    "CMC": "Micro Cross",
    "CMRU": "Reducing Micro Union",
    "CLE": "Long Elbow 90°",
    "CLRE": "Reducing Long Elbow 90°",
    "CLT": "Long Tee",
    "CLRT": "Reducing Long Tee",
    "CLRU": "Reducing Long Union",
    "CMGS": "Micro Gland S",
    "CMGL": "Micro Gland L",
    "CSGS": "Short Gland S",
    "CSGL": "Short Gland L",
    "CLGS": "Long Gland S",
    "CLGL": "Long Gland L",
    "CSGWS": "Socket Weld Short Gland",
    "CLGWS": "Socket Weld Long Gland",
    "CLGRWS": "Reducing Socket Weld Long Gland",
    "CBG": "Blind Gland",
    "CCP": "UCR Cap",
    "CPG": "UCR Plug",
    "CFN": "UCR Female Nut",
    "CMN": "UCR Male Nut",
    "CGT": "UCR Gasket",
    "CGTR": "UCR Gasket Retained",
    "CGTB": "UCR Gasket Blind",
    "CHG": "High Flow Gland",
    "CHA": "High Flow Adapter",
    "CHBA": "High Flow Bulkhead Adapter",
    "CHFN": "High Flow Female Nut",
    "CHMN": "High Flow Male Nut",
    "CDMU": "Double Male Union",
    "CDMRU": "Reducing Double Male Union",
    "CBDMU": "Bulkhead Double Male Union",
    "CEU": "Union Elbow",
    "CUT": "Union Tee",
    "CUC": "Union Cross",
    "CDFRU": "Reducing Double Female Union",
    "CRA": "Reducing Adapter",
    "CRB": "Reducing Bushing",
    "CC": "Coupling",
    "CAWB": "TBW Adapter",
    "CBAWB": "Bulkhead TBW Adapter",
    "CULC": "UNILOK Connector",
    "CBULC": "Bulkhead UNILOK Connector",
}

SWAGELOK_WELD_PRODUCT_LABELS = {
    "3": "Union tee",
    "4": "Union cross",
    "5": "45 degree union elbow",
    "6": "Union / reducing union",
    "6L": "Locator union",
    "9": "90 degree union elbow",
    "91": "Tribow",
}


def label_for_size(code):
    return SIZE_LABELS.get(str(code), str(code))


def load_swagelok_models():
    pages = json.loads(SWAGELOK_SOURCE.read_text(encoding="utf-8"))
    text = "\n".join(page["text"] for page in pages)
    pattern = re.compile(
        r"\b(?:6LV|316L|SS|NI|CU)-\d{1,2}-(?:H?VCR)-[A-Z0-9. -]*[A-Z0-9](?:P)?\b"
    )
    models = set()
    for match in pattern.finditer(text):
        model = normalize_swagelok_catalog_model(re.sub(r"\s+", "", match.group(0)))
        if not model:
            continue
        model = model.replace("..", ".").rstrip(".")
        if "-VCR-" not in model and "-HVCR-" not in model:
            continue
        if re.search(r"[➀➁➂]", model):
            continue
        if re.search(r"-CP-BP\d+$", model):
            continue
        models.add(model)
    models.update(SWAGELOK_VCR_EXPLICIT_CATALOG_MODELS)
    for size in ("2", "4", "8", "12", "16"):
        for connection in ("1", "4", "CP", "P", "2", "T", "9", "CS", "CG"):
            models.add(f"SS-{size}-VCR-{connection}")
        if size != "2":
            models.add(f"SS-{size}-VCR-2-GR")
        models.add(f"NI-{size}-VCR-2")
        if size != "2":
            models.add(f"NI-{size}-VCR-2-GR")
        models.add(f"CU-{size}-VCR-2")
        if size != "2":
            models.add(f"CU-{size}-VCR-2-GR")
    for size in ("4", "8"):
        models.add(f"SS-{size}-VCR-61")
        models.add(f"SS-{size}-VCR-61S")
    # Swagelok publishes gasket basic ordering numbers in tables. They do not
    # carry a material prefix in every cell, so regex extraction alone misses
    # valid material/structure combinations. Keep this catalog matrix explicit.
    for material in ("SS", "NI", "CU"):
        for size in ("2", "4", "8", "10", "12", "16"):
            models.add(f"{material}-{size}-VCR-2")
            models.add(f"{material}-{size}-VCR-2-VS")
        for size in ("4", "8", "12", "16"):
            models.add(f"{material}-{size}-VCR-2-GR")
            models.add(f"{material}-{size}-VCR-2-GR-VS")
    for material in ("SS", "NI"):
        for size in ("4", "8"):
            models.add(f"{material}-{size}-VCR-2-ZC-VS")
    for size in ("2", "4", "8", "12", "16"):
        models.add(f"SS-{size}-VCR-2-VS-BL")
        models.add(f"NI-{size}-VCR-2-VS-BL")
        if size != "2":
            models.add(f"SS-{size}-VCR-2-GR-VS-BL")
            models.add(f"NI-{size}-VCR-2-GR-VS-BL")
    for size in ("2", "4", "8", "12", "16"):
        models.add(f"SS-{size}-VCR-6-DM")
    models.add("SS-4-VCR-6-DM-2")
    models.add("SS-8-VCR-6-DM-4")
    for size, tube_codes in {"4": ("200", "400"), "8": ("600", "810")}.items():
        for tube_code in tube_codes:
            models.add(f"SS-{size}-VCR-6-{tube_code}")
    for orifice in (
        "010", "012", "015", "017", "020", "023", "025", "026", "027",
        "030", "035", "040", "045", "050", "055", "060", "065", "070",
        "075", "080", "085", "090", "093", "095", "100",
    ):
        models.add(f"6LV-4-VCR-6-DM-{orifice}P")
    # The high-flow nut table publishes two female nut variants and one male
    # nut variant. Keep these catalog ordering numbers distinct because SR
    # changes the nut face dimension.
    for connection in ("1", "1SR", "4SR"):
        models.add(f"SS-4-HVCR-{connection}")
    models.add("SS-4-HVCR-9")
    models.add("SS-4-HVCR-T")
    models.add("6LV-4-HVCR-1-6TB7")
    models.add("316L-4-HVCR-1A6")
    models.add("6LV-4-HVCR-61-6TB7")
    return sorted(models)


def normalize_swagelok_catalog_model(model):
    if model in SWAGELOK_VCR_EXTRACTION_CORRECTIONS:
        return SWAGELOK_VCR_EXTRACTION_CORRECTIONS[model]

    flow_restrictor = re.match(r"^(6LV-4-VCR-6-DM-\d{3}P)", model)
    if flow_restrictor:
        return flow_restrictor.group(1)

    tube_fitting_codes = {
        "SS-4-VCR-6-200": "SS-4-VCR-6-200",
        "SS-4-VCR-6-400": "SS-4-VCR-6-400",
        "SS-8-VCR-6-600": "SS-8-VCR-6-600",
        "SS-8-VCR-6-810": "SS-8-VCR-6-810",
    }
    for prefix, canonical in tube_fitting_codes.items():
        if model.startswith(prefix):
            return canonical

    blind_gland = re.match(r"^(SS-\d+-VCR-3-BL)(?:\d.*)?$", model)
    if blind_gland:
        return blind_gland.group(1)

    gasket_dimensions = re.match(r"^(SS-\d+-VCR-2)-\d[\d.]+$", model)
    if gasket_dimensions:
        return gasket_dimensions.group(1)

    nut_dimensions = re.match(r"^(SS-\d+-VCR-[14])-\d[\d.]+$", model)
    if nut_dimensions:
        return nut_dimensions.group(1)

    hvcr_footnote = re.match(r"^(6LV-\d+-HVCR-\d+-\d+TB7)\d+$", model)
    if hvcr_footnote:
        return hvcr_footnote.group(1)

    hvcr_atw_footnote = re.match(r"^(316L-4-HVCR-1A6)\d+$", model)
    if hvcr_atw_footnote:
        return hvcr_atw_footnote.group(1)

    # PDF text extraction can concatenate the first dimension value from the
    # next table column. These are documented catalog rows, not real suffixes.
    hvcr_table_artifacts = {
        "SS-4-HVCR-4SR5": "SS-4-HVCR-4SR",
        "SS-4-HVCR-91": "SS-4-HVCR-9",
        "SS-4-HVCR-T1": "SS-4-HVCR-T",
    }
    if model in hvcr_table_artifacts:
        return hvcr_table_artifacts[model]

    compact_bodies = (
        (r"^(SS-\d+-VCR-CP)\d+$", 1),
        (r"^(SS-\d+-VCR-P)\d+$", 1),
        (r"^(SS-\d+-VCR-T)\d+$", 1),
        (r"^(SS-\d+-VCR-9)\d+$", 1),
        (r"^(SS-\d+-VCR-CS)[\d.]+$", 1),
        (r"^(SS-\d+-VCR-CG)[\d.]+$", 1),
        (r"^(SS-\d+-VCR-6-DM)\d+$", 1),
        (r"^(SS-\d+-VCR-A1-\d{3})\d+$", 1),
    )
    for pattern, group in compact_bodies:
        match = re.match(pattern, model)
        if match:
            return match.group(group)

    female_connector = re.match(r"^(SS-\d+-VCR-7-(?:2|4|6|8|12|16))\d*$", model)
    if female_connector:
        return female_connector.group(1)

    if re.match(r"^(?:6LV|SS)-\d+-VCR-6-(?:DM|DF)(?:-|$)", model):
        allowed = re.fullmatch(r"(?:6LV|SS)-\d+-VCR-6-(?:DM|DF)(?:-\d+)?", model)
        return model if allowed else None
    return model


def load_swagelok_weld_models():
    if not SWAGELOK_WELD_SOURCE.exists():
        return []
    pages = json.loads(SWAGELOK_WELD_SOURCE.read_text(encoding="utf-8"))
    text = "\n".join(page["text"] for page in pages)
    pattern = re.compile(r"\b(?:6LV|316L|SS)-[A-Z0-9][A-Z0-9-]*(?:P6?|SC\d+)?\b")
    models = set()
    for match in pattern.finditer(text):
        model = re.sub(r"\s+", "", match.group(0)).rstrip("-")
        if re.search(r"[➀➁➂]", model):
            continue
        if any(token in model for token in ("MW", "MMW", "TB7", "MTB7", "ATW", "MATW", "ASW", "TSW", "PSW", "MPW")):
            if model.count("-") >= 1:
                models.add(model)
    return sorted(models)


def parse_swagelok_model(model):
    parts = model.split("-")
    if len(parts) < 4:
        return None
    material = parts[0]
    size = parts[1]
    seal = parts[2]
    rest = parts[3:]
    if not size.isdigit() or seal not in ("VCR", "HVCR"):
        return None

    connection = rest[0]
    tube = "标准"
    if seal == "HVCR" and connection == "1" and len(rest) == 2 and re.fullmatch(r"\d+TB7", rest[1]):
        connection = "1-TBW"
        tube = rest[1]
    elif seal == "HVCR" and len(rest) == 1:
        automatic_body = re.fullmatch(r"1A(\d+)", connection)
        if automatic_body:
            connection = "1-ATW"
            tube = f"{automatic_body.group(1)}TW"
    elif len(rest) > 1:
        if connection == "3" and rest[1] in ("TA", "BL"):
            connection = f"{connection}-{rest[1]}"
            tube = "-".join(rest[2:]) or "标准"
        elif connection == "3" and re.fullmatch(r"\d+(?:M)?TA", rest[1]):
            connection = "3-TA"
            tube = rest[1]
        elif connection == "3" and re.fullmatch(r"\d+(?:M)?TW", rest[1]):
            tube = rest[1]
        elif connection in ("2",) and rest[1] == "GR":
            connection = "2-GR"
            tube = "-".join(rest[2:]) or "标准"
        else:
            tube = "-".join(rest[1:])

    if connection == "2-GR" and tube not in ("标准", "VS", "VS-BL"):
        return None

    if tube == "标准" and connection == "3S":
        default_tubes = {
            ("2", "3S"): "2TB7",
        }
        tube = default_tubes.get((size, connection), "")
        if not tube:
            return None

    parsed = {
        "materialCode": material,
        "materialLabel": material_label(material),
        "vcrCode": f"{size}-{seal}",
        "vcrLabel": f"{label_for_size(size)} {seal}",
        "connectionCode": connection,
        "connectionLabel": swagelok_connection_label(connection),
        "tubeCode": tube or "标准",
        "tubeLabel": tube_label(tube),
        "sizeCode": size,
        "seal": seal,
    }
    parsed["sourceModel"] = model
    return parsed


def material_label(code):
    labels = {
        "6LV": "316L VAR / UHP",
        "316L": "316L",
        "SS": "316 SS",
        "NI": "Nickel",
        "CU": "Copper",
    }
    return labels.get(code, code)


def swagelok_material_match(candidate, material_code):
    target_model = candidate["vigour_model"]
    if material_code == "6LV":
        matched = target_model.endswith("-SLV") or "secondary" in candidate.get("material", "")
        return matched, "316L secondary remelt" if matched else candidate.get("material", "316L")
    if material_code == "NI":
        return "-NI" in target_model, "Nickel" if "-NI" in target_model else candidate.get("material", "316L")
    if material_code == "CU":
        return False, candidate.get("material", "316L")
    return True, candidate.get("material", "316L")


def swagelok_requires_process_p(source_model, connection_code):
    return (
        source_model.startswith("6LV-")
        and source_model.endswith("P")
        and connection_code not in ("P", "CP")
    )


def with_semiconductor_process(model):
    return model if model.endswith("-P") else f"{model}-P"


def swagelok_connection_label(code):
    labels = {
        "3S": "Female gland, short tube butt weld",
        "3": "Male gland / weld gland",
        "3-TA": "Tube adapter",
        "3-BL": "Blind gland",
        "6": "Body / tube fitting connector",
        "61": "Bulkhead connector",
        "61S": "Short bulkhead connector",
        "T": "Union tee",
        "9": "Union elbow",
        "CS": "Union cross",
        "CG": "Coupling",
        "7": "Female NPT connector",
        "A1": "Tube fitting bulkhead connector",
        "A1S": "Short tube fitting bulkhead connector",
        "1": "Female nut",
        "1-TBW": "High-flow tube butt weld body",
        "1-ATW": "High-flow automatic tube weld body",
        "1SR": "Female nut, SR variant",
        "4": "Male nut",
        "4SR": "Male nut, SR variant",
        "CP": "Cap",
        "P": "Plug",
        "2": "Gasket",
        "2-GR": "Gasket with retainer",
    }
    return labels.get(code, code)


def tube_label(code):
    if not code or code == "标准":
        return "Standard component"
    metric = re.match(r"(\d+)MTB(\d+)$", code)
    if metric:
        return f"{metric.group(1)} mm tube butt weld, TB{metric.group(2)} length"
    inch = re.match(r"(\d+)TB(\d+)$", code)
    if inch:
        return f"{label_for_size(inch.group(1))} tube butt weld, TB{inch.group(2)} length"
    sr = re.match(r"(\.?\d+(?:\.\d+)?)SR$", code)
    if sr:
        return f"High-flow short radius / length {sr.group(1)}"
    return code


def parse_swagelok_weld_model(model):
    parts = model.split("-")
    if len(parts) < 2:
        return None
    material = parts[0]
    if material not in ("6LV", "316L", "SS"):
        return None

    parsed = {
        "materialCode": material,
        "materialLabel": material_label(material),
        "sourceModel": model,
    }

    first = parts[1]
    if first.endswith("MW") or first.endswith("MMW"):
        size = first.replace("MMW", "").replace("MW", "")
        if len(parts) < 3 or not size.isdigit():
            return None
        family = "MMW" if first.endswith("MMW") else "MW"
        parsed.update(
            {
                "family": family,
                "sizeCode": size,
                "vcrCode": first,
                "vcrLabel": f"{label_for_size(size)} Micro-Fit weld" if family == "MW" else f"{size} mm Micro-Fit weld",
                "connectionCode": parts[2],
                "connectionLabel": weld_product_label(parts[2]),
                "tubeCode": "-".join(parts[3:]) or "标准",
                "tubeLabel": weld_variant_label("-".join(parts[3:])),
            }
        )
        return parsed

    if first.endswith("TB7") or first.endswith("MTB7"):
        size = first.replace("MTB7", "").replace("TB7", "")
        if len(parts) < 3 or not size.isdigit():
            return None
        family = "MTB7" if first.endswith("MTB7") else "TB7"
        parsed.update(
            {
                "family": family,
                "sizeCode": size,
                "vcrCode": first,
                "vcrLabel": f"{label_for_size(size)} tube butt weld" if family == "TB7" else f"{size} mm tube butt weld",
                "connectionCode": parts[2],
                "connectionLabel": weld_product_label(parts[2]),
                "tubeCode": "-".join(parts[3:]) or "标准",
                "tubeLabel": weld_variant_label("-".join(parts[3:])),
            }
        )
        return parsed

    if len(parts) >= 3 and parts[1].isdigit() and parts[2] in (
        "ATW", "MATW", "ASW", "TSW", "PSW", "MPW", "MTW"
    ):
        size = parts[1]
        family = parts[2]
        parsed.update(
            {
                "family": family,
                "sizeCode": size,
                "vcrCode": f"{size}-{family}",
                "vcrLabel": f"{label_for_size(size)} {family}" if family != "MATW" else f"{size} mm ATW",
                "connectionCode": parts[3] if len(parts) > 3 else "标准",
                "connectionLabel": weld_product_label(parts[3] if len(parts) > 3 else "标准"),
                "tubeCode": "-".join(parts[4:]) or "标准",
                "tubeLabel": weld_variant_label("-".join(parts[4:])),
            }
        )
        return parsed

    return None


def weld_product_label(code):
    return SWAGELOK_WELD_PRODUCT_LABELS.get(code, code)


def weld_variant_label(code):
    if not code:
        return "Standard"
    if re.fullmatch(r"\d+(?:M)?(?:-\d+(?:M)?)*", code):
        return f"Reducing / branch size {code}"
    if re.fullmatch(r"\d{5}", code):
        return f"Special length option {code}"
    return code


def model_tail(model, product_code, size_code):
    prefix = f"VVR-{product_code}{size_code}"
    if model.startswith(prefix):
        return model[len(prefix):].lstrip("-")
    prefix = f"HVVR-{product_code}{size_code}"
    if model.startswith(prefix):
        return model[len(prefix):].lstrip("-")
    return ""


def first_tail_token(tail):
    return tail.split("-")[0] if tail else ""


def swagelok_material(row):
    if row["product_code"] in ("FG", "MG", "MTA", "BG") or row["option_suffix"] in ("P", "SLV", "BA"):
        return ("6LV", "316L VAR / UHP")
    return ("SS", "316 SS")


def swagelok_tube(row):
    full_tail = model_tail(row["vigour_model"], row["product_code"], row["size_code"])
    tail = first_tail_token(full_tail)
    length_match = re.search(r"(?:^|-)L(\d+)(?:-|$)", full_tail)
    length_code = length_match.group(1) if length_match else "7"
    if tail.startswith("TB"):
        tube = tail.replace("TB", "")
        return (f"{tube}TB{length_code}", f"{label_for_size(tube)} tube butt weld, TB{length_code} length")
    if tail.startswith("TW"):
        tube = tail.replace("TW", "")
        return (f"{tube}MTW", f"{label_for_size(tube)} male weld gland")
    if tail:
        return (tail, tail)
    return ("标准", "Standard component")


def swagelok_model(row, material_code, vcr_code, connection_code, tube_code):
    if tube_code != "标准":
        return f"{material_code}-{vcr_code}-{connection_code}-{tube_code}"
    return f"{material_code}-{vcr_code}-{connection_code}"


def add_common(row, brand, source_model, vigour_model, status, note):
    return {
        "brand": brand,
        "sourceModel": source_model,
        "vigourModel": vigour_model,
        "status": status,
        "productName": row.get("product_name") or row.get("product_code"),
        "note": note,
    }


def mark_no_match(
    item,
    *,
    note="暂时没有匹配产品，请联系工厂确认。",
    special_feature_label="",
    target_feature_label="VIGOUR 目录暂无精确型号",
):
    item["vigourModel"] = ""
    item["status"] = "暂时无匹配"
    item["note"] = note
    item["noMatch"] = True
    item["dimensionConfirmation"] = False
    if "materialMatched" in item:
        item["materialMatched"] = True
    if "treatmentMatched" in item:
        item["treatmentMatched"] = True
    if "finishMatched" in item:
        item["finishMatched"] = True
    if special_feature_label:
        item["specialFeatureMatched"] = False
        item["specialFeatureLabel"] = special_feature_label
        item["targetFeatureLabel"] = target_feature_label
    return item


def build_guarded_no_match(brand, source_model, reason, **fields):
    item = {
        "brand": brand,
        "sourceModel": source_model,
        "vigourModel": "",
        "status": "暂时无匹配",
        "productName": fields.get("productLabel") or fields.get("productCode") or "目录型号",
        "note": reason,
        "noMatch": True,
        "specialFeatureMatched": False,
        "specialFeatureLabel": "目录型号暂无安全目标",
        "targetFeatureLabel": "VIGOUR 目录暂无精确型号",
        "dimensionConfirmation": False,
        "selectionEligible": False,
        "sourceAuditStatus": "catalog_input_guarded",
        "dataSource": "build_fitting_database.py generation audit",
    }
    item.update({key: value for key, value in fields.items() if value not in (None, "")})
    if item.get("materialCode"):
        item["materialMatched"] = True
    if item.get("treatmentCode") or item.get("processCode"):
        item["treatmentMatched"] = True
    if item.get("finishCode"):
        item["finishMatched"] = True
    return item


def build_swagelok(row):
    if row["series"] not in ("VVR", "HVVR"):
        return None
    if row["option_suffix"]:
        return None
    product = row["product_code"]
    if product not in SWAGELOK_PRODUCT:
        return None

    material_code, material_label = swagelok_material(row)
    seal_code = "HVCR" if row["series"] == "HVVR" else "VCR"
    vcr_code = f"{row['size_code']}-{seal_code}"
    connection_code, connection_label = SWAGELOK_PRODUCT[product]
    tube_code, tube_label = swagelok_tube(row)
    source_model = swagelok_model(row, material_code, vcr_code, connection_code, tube_code)
    item = add_common(
        row,
        "Swagelok",
        source_model,
        row["vigour_model"],
        "Rule-generated candidate",
        "按 VIGOUR 型号、VCR/HVCR 尺寸和 Swagelok 订购码规则生成；最终替代需复核长度、材质与表面处理。",
    )
    item.update(
        {
            "materialCode": material_code,
            "materialLabel": material_label,
            "vcrCode": vcr_code,
            "vcrLabel": f"{label_for_size(row['size_code'])} {seal_code}",
            "connectionCode": connection_code,
            "connectionLabel": connection_label,
            "tubeCode": tube_code,
            "tubeLabel": tube_label,
        }
    )
    return item


def build_vigour_index(rows):
    index = {}
    for row in rows:
        key = (row["series"], row["product_code"], row["size_code"])
        index.setdefault(key, []).append(row)
    for key in index:
        index[key].sort(key=lambda row: (bool(row["option_suffix"]), row["vigour_model"]))
    return index


def choose_vigour_candidate(parsed, vigour_index):
    product = SWAGELOK_CONNECTION_TO_VIGOUR.get(parsed["connectionCode"])
    if not product:
        return None
    if (
        parsed["connectionCode"] in ("1", "4", "CP", "P")
        and parsed["tubeCode"] != "标准"
    ):
        return None
    if parsed["connectionCode"] in ("61", "61S") and parsed["tubeCode"] != "标准":
        product = "TBBC"
    if parsed["connectionCode"] == "6":
        if parsed["tubeCode"] in ("200", "400", "600", "810"):
            product = "TFC"
        elif re.fullmatch(r"DM-\d+", parsed["tubeCode"]):
            product = "RMU"
        else:
            product = "MU"
    if parsed["seal"] == "HVCR" and parsed["connectionCode"] == "3":
        product = "HG"
    if parsed["seal"] == "HVCR":
        hvcr_products = {
            "9": "UE",
            "T": "UT",
            "61": "BMG",
            "61S": "BMG",
        }
        product = hvcr_products.get(parsed["connectionCode"], product)
    series = "HVVR" if parsed["seal"] == "HVCR" else "VVR"
    rows = vigour_index.get((series, product, parsed["sizeCode"]), [])
    if not rows:
        return None

    if product in ("GK", "GKR"):
        is_blind = parsed["tubeCode"] == "VS-BL"
        if parsed["connectionCode"] == "2" and parsed["tubeCode"] not in ("标准", "VS", "VS-BL"):
            return None
        base_model = f"VVR-{product}-G{parsed['sizeCode']}"
        material_token = "NI" if parsed["materialCode"] == "NI" else ""
        base_rows = [row for row in rows if not row["option_suffix"]]
        if is_blind:
            if parsed["materialCode"] == "CU":
                return None
            material_suffix = f"-{material_token}" if material_token else ""
            blind_model = with_blind_suffix(f"{base_model}{material_suffix}")
            return next(
                (row for row in base_rows if row["vigour_model"] == blind_model),
                next(
                    (
                        row
                        for row in base_rows
                        if row["vigour_model"] == f"{base_model}{material_suffix}"
                    ),
                    None,
                ),
            )
        if material_token:
            exact_material_model = f"{base_model}-{material_token}"
            material_rows = [row for row in base_rows if row["vigour_model"] == exact_material_model]
            if material_rows:
                return material_rows[0]
            material_rows = [row for row in base_rows if f"-{material_token}" in row["vigour_model"] and "-DM" not in row["vigour_model"]]
            if material_rows:
                return material_rows[0]
        standard_rows = [row for row in base_rows if row["vigour_model"] == base_model]
        if standard_rows:
            return standard_rows[0]
        standard_rows = [row for row in base_rows if "-NI" not in row["vigour_model"] and "-SP" not in row["vigour_model"] and "-DM" not in row["vigour_model"]]
        return standard_rows[0] if standard_rows else (base_rows[0] if base_rows else rows[0])

    tube = parsed["tubeCode"]
    if product == "MC" and parsed["connectionCode"] == "7":
        thread_size = re.fullmatch(r"\d+", tube)
        exact_model = (
            f"VVR-MC{parsed['sizeCode']}-F{thread_size.group(0)}"
            if thread_size else ""
        )
        return next((row for row in rows if row["vigour_model"] == exact_model), None)
    if product == "TFBC" and parsed["connectionCode"] in ("A1", "A1S"):
        tube_size = {"400": "04", "600": "06", "810": "08"}.get(tube)
        if not tube_size:
            return None
        if parsed["connectionCode"] == "A1S":
            exact_model = f"VVR-TFBC{parsed['sizeCode']}-{tube_size}-L47"
        else:
            exact_model = f"VVR-TFBC{parsed['sizeCode']}-{tube_size}"
        return next((row for row in rows if row["vigour_model"] == exact_model), None)
    if parsed["connectionCode"] == "61S" and product == "MBU":
        short_model = {"4": "VVR-MBU4-L46", "8": "VVR-MBU8-L54"}.get(parsed["sizeCode"])
        return next((row for row in rows if row["vigour_model"] == short_model), None)
    if parsed["connectionCode"] == "61S" and product == "TBBC":
        short_model = f"VVR-TBBC{parsed['sizeCode']}-TB{parsed['sizeCode']}-L49"
        return next((row for row in rows if row["vigour_model"] == short_model), None)
    if product == "MU":
        restrictor_match = re.fullmatch(r"DM-(\d{3})P", tube)
        if restrictor_match:
            exact_model = f"VVR-MU{parsed['sizeCode']}-DM-{restrictor_match.group(1)}"
            uhp_model = f"{exact_model}-P"
            return next(
                (row for row in rows if row["vigour_model"] == uhp_model),
                next((row for row in rows if row["vigour_model"] == exact_model), None),
            )
        if tube in ("标准", "DM"):
            exact_model = f"VVR-MU{parsed['sizeCode']}"
            return next((row for row in rows if row["vigour_model"] == exact_model), None)
        return None
    if product == "RMU":
        reducing_match = re.fullmatch(r"DM-(\d+)", tube)
        exact_model = (
            f"VVR-RMU{parsed['sizeCode']}-{reducing_match.group(1)}"
            if reducing_match else ""
        )
        return next((row for row in rows if row["vigour_model"] == exact_model), None)
    if product == "TFC":
        tube_size = {"200": "02", "400": "04", "600": "06", "810": "08"}.get(tube)
        exact_model = f"VVR-TFC{parsed['sizeCode']}-{tube_size}" if tube_size else ""
        return next((row for row in rows if row["vigour_model"] == exact_model), None)
    if parsed["connectionCode"] == "3" and (
        re.fullmatch(r"\d+MA(?:S)?", tube) or tube.endswith("TSW")
    ):
        return None

    exact_suffix = vigour_length_suffix(parsed, product)
    if exact_suffix:
        exact_rows = [
            row for row in rows
            if row["vigour_model"].removesuffix("-SLV").endswith(exact_suffix)
        ]
        if parsed["materialCode"] == "6LV":
            slv_rows = [row for row in exact_rows if row["vigour_model"].endswith("-SLV")]
            if slv_rows:
                return slv_rows[0]
        if exact_rows:
            return exact_rows[0]

    tube_size_match = re.match(r"(\d+)M?TB", tube or "")
    weld_size_match = re.match(r"(\d+)M?TW", tube or "")
    adapter_size_match = re.match(r"(\d+)M?TA", tube or "")
    if (tube_size_match or weld_size_match or adapter_size_match) and product in ("FG", "MG", "AHG", "MTA", "TBBC"):
        if weld_size_match:
            expected = f"TW{weld_size_match.group(1)}"
        else:
            size_match = tube_size_match or adapter_size_match
            expected = f"TB{size_match.group(1)}"
        exact_rows = [row for row in rows if expected in row["vigour_model"] and not row["option_suffix"]]
        if parsed["materialCode"] == "6LV":
            slv_rows = [row for row in rows if expected in row["vigour_model"] and row["vigour_model"].endswith("-SLV")]
            if slv_rows:
                return slv_rows[0]
        if exact_rows:
            return exact_rows[0]
        return None

    if parsed["materialCode"] == "6LV":
        slv_rows = [row for row in rows if row["vigour_model"].endswith("-SLV")]
        if slv_rows:
            return slv_rows[0]
    base_rows = [row for row in rows if not row["option_suffix"]]
    return base_rows[0] if base_rows else rows[0]


def vigour_length_suffix(parsed, product):
    tube = parsed["tubeCode"]
    if parsed["seal"] == "HVCR" and product == "HG":
        hvcr_lengths = {
            ".60SR": "L15",
            "1.19SR": "L30",
            "1.31SR": "L33",
        }
        length = hvcr_lengths.get(tube)
        return f"-{length}" if length else ""

    match = re.match(r"(\d+)TB(\d+)(P)?$", tube or "")
    if not match:
        return ""

    tube_size = match.group(1)
    length_code = match.group(2)
    if product == "FG":
        length_map = {
            "2": "L15",
            "3": "L18",
        }
    elif product == "MG":
        length_map = {
            "2": "L30",
            "3": "L33",
        }
        if tube_size == "8" and length_code == "3":
            length_map["3"] = "L35"
    else:
        length_map = {}

    length = length_map.get(length_code)
    if length:
        return f"-TB{tube_size}-{length}"
    if length_code == "7":
        return f"-TB{tube_size}"
    return ""


def build_swagelok_catalog_items(vigour_rows):
    vigour_index = build_vigour_index(vigour_rows)
    items = []
    for source_model in load_swagelok_models():
        parsed = parse_swagelok_model(source_model)
        if not parsed:
            items.append(build_guarded_no_match(
                "Swagelok",
                source_model,
                "目录型号无法解析",
            ))
            continue
        candidate = choose_vigour_candidate(parsed, vigour_index)
        if not candidate:
            items.append(build_swagelok_unmatched_item(source_model, parsed))
            continue
        requires_process_p = swagelok_requires_process_p(
            parsed.get("sourceModel", source_model),
            parsed["connectionCode"],
        )
        target_model = (
            with_semiconductor_process(candidate["vigour_model"])
            if requires_process_p
            else candidate["vigour_model"]
        )
        if parsed["tubeCode"] == "VS-BL":
            target_model = with_blind_suffix(target_model)

        item = add_common(
            candidate,
            "Swagelok",
            parsed.get("sourceModel", source_model),
            target_model,
            "Catalog-derived candidate",
            "Swagelok 样本订购号提取生成；若长度或特殊结构在 VIGOUR 中无完全同码，按同尺寸/同功能给出最近候选。",
        )
        item.update(
            {
                "materialCode": parsed["materialCode"],
                "materialLabel": parsed["materialLabel"],
                "vcrCode": parsed["vcrCode"],
                "vcrLabel": parsed["vcrLabel"],
                "connectionCode": parsed["connectionCode"],
                "connectionLabel": parsed["connectionLabel"],
                "tubeCode": parsed["tubeCode"],
                "tubeLabel": parsed["tubeLabel"],
            }
        )
        material_matched, target_material_label = swagelok_material_match(
            candidate, parsed["materialCode"]
        )
        item["materialMatched"] = material_matched
        item["targetMaterialLabel"] = target_material_label
        item["dimensionConfirmation"] = bool(
            re.search(r"(?:^|-)BL|LG$|^\d{5}$|TB7P$", parsed["tubeCode"])
            or parsed["connectionCode"] in ("1SR", "4SR")
        )
        if parsed["tubeCode"] == "VS-BL":
            item["specialFeatureMatched"] = True
            item["specialFeatureLabel"] = "Blind gasket"
            item["targetFeatureLabel"] = target_model
        restrictor_match = re.fullmatch(r"DM-(\d{3})P", parsed["tubeCode"])
        if restrictor_match:
            item["finishCode"] = "P"
            item["finishLabel"] = "Swagelok SC-01 ultrahigh-purity process"
            item["finishMatched"] = True
            item["targetFinishLabel"] = "VIGOUR semiconductor process (-P)"
            item["dimensionConfirmation"] = True
        elif requires_process_p:
            item["finishCode"] = "P"
            item["finishLabel"] = "Swagelok SC-01 ultrahigh-purity process"
            item["finishMatched"] = True
            item["targetFinishLabel"] = "VIGOUR semiconductor process (-P)"
        items.append(item)
    return items


def choose_weld_vigour_candidate(parsed, vigour_index):
    family = parsed["family"]
    code = parsed["connectionCode"]
    size = parsed["sizeCode"]
    variant = parsed["tubeCode"]

    if family in ("MMW", "MTB7", "MATW"):
        return None

    if family == "MW":
        if code == "9":
            product = "RE" if variant != "标准" and not re.fullmatch(r"\d{5}", variant) else "UE"
        elif code == "3":
            product = "RT" if variant != "标准" and not re.fullmatch(r"\d{5}", variant) else "UT"
        elif code == "4":
            product = "CU"
        elif code == "5":
            product = "VE"
        elif code == "6":
            product = "RU"
        elif code == "91":
            product = "TB"
        else:
            return None
        return choose_by_series_product_size(
            "VMW", product, size, variant, vigour_index, parsed["materialCode"]
        )

    if family == "TB7":
        if code == "9":
            product = "RLE" if variant != "标准" else "LE"
        elif code == "3":
            product = "RLT" if variant != "标准" else "LT"
        elif code == "6":
            product = "RLU"
        else:
            return None
        return choose_by_series_product_size(
            "VTW", product, size, variant, vigour_index, parsed["materialCode"]
        )

    if family == "ATW":
        if code == "6" and variant in ("400", "600", "810"):
            exact_models = {
                ("4", "400"): "VWR-FG4-04",
                ("6", "600"): "VWR-FG4-06",
                ("8", "810"): "VWR-FG8-08",
            }
            exact_model = exact_models.get((size, variant))
            if exact_model:
                rows = vigour_index.get(("VWR", "FG", "4" if size in ("4", "6") else "8"), [])
                return next((row for row in rows if row["vigour_model"] == exact_model), None)
        if code in ("6", "6L"):
            product = "FU"
        elif code == "9":
            product = "FE"
        elif code == "3":
            product = "FT"
        else:
            return None
        return choose_by_series_product_size(
            "VWR", product, size, variant, vigour_index, parsed["materialCode"]
        )

    return None


SWAGELOK_NO_MATCH_MODELS = {
    "316L-4-ATW-3-4TB7-4A",
    "316L-8-ATW-6-4",
    "316L-8-ATW-6-6",
    "6LV-4-VCR-3-02205",
    "6LV-4MW-3-03446",
    "6LV-4MW-3-03921",
    "6LV-4MW-9-03442",
    "6LV-4MW-9-03443",
    "6LV-4MW-9-03444",
    "6LV-4MW-9-03445",
    "SS-4-VCR-3-.50LG",
    "SS-4-VCR-3-.75LG",
}

# DM is overloaded in Swagelok ordering codes.  A bare VCR-6-DM body does not
# contain the restrictor orifice code, so it must never be substituted by MU.
SWAGELOK_ORIFICE_REQUIRED_MODELS = {
    f"SS-{size}-VCR-6-DM" for size in ("2", "4", "8", "12", "16")
}


def apply_swagelok_no_match_rules(items):
    for item in items:
        if item["brand"] != "Swagelok":
            continue
        if item["sourceModel"] in SWAGELOK_ORIFICE_REQUIRED_MODELS:
            size = re.match(r"^SS-(\d+)-VCR-6-DM$", item["sourceModel"]).group(1)
            mark_no_match(
                item,
                note=(
                    "已识别为 DM 限流结构，但原型号未提供限流孔径；"
                    "可先按 VIGOUR 限流型号族沟通，报价或下单前必须确认孔径。"
                ),
                special_feature_label="DM 限流结构：孔径未提供",
                target_feature_label=f"VVR-MU{size}-DM-[孔径]",
            )
            item.update(
                {
                    "advisoryModel": f"VVR-MU{size}-DM-[孔径]",
                    "missingParameters": ["限流孔径"],
                    "salesStatus": "needs_confirmation",
                    "nextAction": "请确认限流孔径",
                }
            )
            continue
        if (
            item["sourceModel"] not in SWAGELOK_NO_MATCH_MODELS
            and not (
                item.get("materialMatched") is False
                and item.get("materialCode") not in ("6LV", "316L")
            )
        ):
            continue
        mark_no_match(item)
    return items


def apply_swagelok_slv_suffix(items):
    for item in items:
        if item["brand"] != "Swagelok" or item.get("noMatch"):
            continue
        if item.get("materialCode") != "6LV":
            continue
        if re.fullmatch(r"DM-\d{3}P", item.get("tubeCode", "")):
            continue
        if item["vigourModel"].endswith("-P"):
            base_model = item["vigourModel"][:-2]
            if not base_model.endswith("-SLV"):
                item["vigourModel"] = f"{base_model}-SLV-P"
        elif item["vigourModel"] and not item["vigourModel"].endswith("-SLV"):
            item["vigourModel"] += "-SLV"
        item["materialMatched"] = True
        item["targetMaterialLabel"] = "316L secondary remelt"
        item["note"] = (
            f"{item['note']} 按材质规则在 VIGOUR 型号后追加 -SLV；"
            "正式下单前请向工厂确认该型号的 SLV 可制造性。"
        )
    return items


def choose_by_series_product_size(series, product, size, variant, vigour_index, material_code=""):
    rows = vigour_index.get((series, product, size), [])
    if not rows:
        return None

    variant_nums = re.findall(r"\d+", variant or "")
    if variant_nums:
        exact_rows = []
        for row in rows:
            model_nums = re.findall(r"\d+", row["vigour_model"])
            if all(num in model_nums for num in variant_nums):
                exact_rows.append(row)
        if material_code == "6LV":
            slv_rows = [row for row in exact_rows if row["vigour_model"].endswith("-SLV")]
            if slv_rows:
                return slv_rows[0]
        exact_rows = [row for row in exact_rows if not row["option_suffix"]] or exact_rows
        if exact_rows:
            return exact_rows[0]

    if material_code == "6LV":
        slv_rows = [row for row in rows if row["vigour_model"].endswith("-SLV")]
        if slv_rows:
            return slv_rows[0]
    base_rows = [row for row in rows if not row["option_suffix"]]
    return base_rows[0] if base_rows else rows[0]


def build_swagelok_weld_items(vigour_rows):
    vigour_index = build_vigour_index(vigour_rows)
    items = []
    for source_model in load_swagelok_weld_models():
        parsed = parse_swagelok_weld_model(source_model)
        if not parsed:
            items.append(build_guarded_no_match(
                "Swagelok",
                source_model,
                "焊接目录型号无法解析",
            ))
            continue
        candidate = choose_weld_vigour_candidate(parsed, vigour_index)
        if not candidate:
            items.append(build_swagelok_unmatched_item(source_model, parsed))
            continue
        requires_process_p = swagelok_requires_process_p(source_model, parsed["connectionCode"])
        target_model = (
            with_semiconductor_process(candidate["vigour_model"])
            if requires_process_p
            else candidate["vigour_model"]
        )

        item = add_common(
            candidate,
            "Swagelok",
            source_model,
            target_model,
            "Catalog-derived weld candidate",
            "Swagelok 焊接接头样本订购号提取生成；按 Micro-Fit、Tube Butt Weld、ATW 功能与管径匹配 VIGOUR 焊接系列，异径和特殊长度需复核。",
        )
        item.update(
            {
                "materialCode": parsed["materialCode"],
                "materialLabel": parsed["materialLabel"],
                "vcrCode": parsed["vcrCode"],
                "vcrLabel": parsed["vcrLabel"],
                "connectionCode": parsed["connectionCode"],
                "connectionLabel": parsed["connectionLabel"],
                "tubeCode": parsed["tubeCode"],
                "tubeLabel": parsed["tubeLabel"],
            }
        )
        material_matched, target_material_label = swagelok_material_match(
            candidate, parsed["materialCode"]
        )
        item["materialMatched"] = material_matched
        item["targetMaterialLabel"] = target_material_label
        item["dimensionConfirmation"] = (
            bool(parsed["tubeCode"] != "标准")
            and (
                bool(re.fullmatch(r"\d{5}", parsed["tubeCode"]))
                or (
                    parsed["family"] == "ATW"
                    and parsed["tubeCode"] not in ("400", "600", "810")
                )
            )
        )
        if requires_process_p:
            item["finishCode"] = "P"
            item["finishLabel"] = "Swagelok SC-01 ultrahigh-purity process"
            item["finishMatched"] = True
            item["targetFinishLabel"] = "VIGOUR semiconductor process (-P)"
        items.append(item)
    return items


def build_swagelok_unmatched_item(source_model, parsed):
    return {
        "brand": "Swagelok",
        "sourceModel": source_model,
        "vigourModel": "",
        "status": "暂时无匹配",
        "productName": parsed.get("connectionLabel") or parsed.get("family") or "Swagelok catalog item",
        "note": "暂时没有匹配产品，请联系工厂确认。",
        "materialCode": parsed["materialCode"],
        "materialLabel": parsed["materialLabel"],
        "vcrCode": parsed["vcrCode"],
        "vcrLabel": parsed["vcrLabel"],
        "connectionCode": parsed["connectionCode"],
        "connectionLabel": parsed["connectionLabel"],
        "tubeCode": parsed["tubeCode"],
        "tubeLabel": parsed["tubeLabel"],
        "noMatch": True,
    }


def jsk_material(row):
    if row["option_suffix"] == "SLV" or "secondary" in row["material"]:
        return ("V", "316L VIM/VAR")
    return ("S", "Single melt 316L")


def jsk_finish(row):
    if row["option_suffix"] == "BA":
        return ("BA", "BA finish")
    if row["option_suffix"] == "P":
        return ("EP", "EP / UHP candidate")
    return ("STD", "Standard finish")


def is_jsk_standard_gland_candidate(row):
    product = row["product_code"]
    size = row["size_code"]
    model = row["vigour_model"]
    option = r"(?:-(?:BA|P|SLV))?"

    if product == "FG":
        return re.fullmatch(rf"VVR-FG{size}-TB{size}{option}", model) is not None
    if product == "MG":
        if row["series"] == "HVVR":
            return re.fullmatch(rf"HVVR-MG{size}-TB\d+{option}", model) is not None
        return (
            re.fullmatch(rf"VVR-MG{size}-TB{size}{option}", model) is not None
            or re.fullmatch(rf"VVR-MG{size}-TW{size}{option}", model) is not None
        )
    return True


def build_jsk_face(row):
    if row["series"] not in ("VVR", "HVVR"):
        return None
    product = row["product_code"]
    if product not in JSK_FACE_SEAL_PRODUCT:
        return None
    if product == "BG":
        return None
    if product in ("C", "P") and row["vigour_model"] != f"VVR-{product}{row['size_code']}":
        return None
    if product in ("FN", "MN"):
        expected_model = f"{row['series']}-{product}{row['size_code']}"
        if row["vigour_model"] != expected_model:
            return None
    if product in ("FG", "MG") and not is_jsk_standard_gland_candidate(row):
        return None

    product_code, product_label = JSK_FACE_SEAL_PRODUCT[product]
    material_code, material_label = jsk_material(row)
    finish_code, finish_label = jsk_finish(row)
    gland_type = ""
    if product in ("FG", "MG"):
        tail = first_tail_token(model_tail(row["vigour_model"], product, row["size_code"]))
        if tail.startswith("TW"):
            product_code = "MG"
            product_label = "Male weld gland"
        else:
            gland_type = "10" if product == "FG" else "19"

    series_code = "TH" if row["series"] == "HVVR" else "T"
    source_model = f"{series_code}{product_code}{row['size_code']}{material_code}"
    if gland_type:
        source_model += gland_type
    if finish_code != "STD":
        source_model += finish_code
    item = add_common(
        row,
        "JSK",
        source_model,
        row["vigour_model"],
        "Rule-generated candidate",
        "按 JSK TOM Joint 订购码位置规则生成；请结合样本尺寸和表面处理确认。",
    )
    item.update(
        {
            "seriesCode": series_code,
            "seriesLabel": "High-flow TOM Joint" if row["series"] == "HVVR" else "TOM Joint / Face Seal",
            "productCode": product_code,
            "productLabel": product_label,
            "sizeCode": row["size_code"],
            "sizeLabel": label_for_size(row["size_code"]),
            "materialCode": material_code,
            "materialLabel": material_label,
            "finishCode": finish_code,
            "finishLabel": finish_label,
        }
    )
    return item


def build_jsk_blind_gasket_items(rows):
    items = []
    for size_code in ("2", "4", "8", "12", "16"):
        for material_code, material_label, material_suffix in (
            ("SS", "Silver-plated 316L stainless steel", ""),
            ("NI", "Nickel", "-NI"),
        ):
            base_model = f"VVR-GK-G{size_code}{material_suffix}"
            candidate = find_blind_vigour_candidate(rows, base_model)
            if not candidate:
                items.append(build_guarded_no_match(
                    "JSK",
                    f"TBG{size_code}{material_code}",
                    "缺少 VIGOUR 盲垫片目标型号",
                    productCode="BGT",
                    productLabel="Blind gasket",
                    sizeCode=size_code,
                    sizeLabel=label_for_size(size_code),
                    materialCode=material_code,
                    materialLabel=material_label,
                ))
                continue
            target_model = with_blind_suffix(candidate["vigour_model"])
            item = add_common(
                candidate,
                "JSK",
                f"TBG{size_code}{material_code}",
                target_model,
                "Catalog-derived blind gasket candidate",
                "JSK TBG 为 Blind Gasket，不是 Blind Gland；按盲板后缀 -BL 对应，正式替代前请复核材质和尺寸。",
            )
            item.update(
                {
                    "seriesCode": "T",
                    "seriesLabel": "TOM Joint / Face Seal",
                    "productCode": "BG",
                    "productLabel": "Blind Gasket",
                    "sizeCode": size_code,
                    "sizeLabel": label_for_size(size_code),
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "finishCode": "STD",
                    "finishLabel": "Standard gasket finish",
                    "materialMatched": True,
                    "targetMaterialLabel": "Nickel" if material_code == "NI" else "316L",
                    "specialFeatureMatched": True,
                    "specialFeatureLabel": "Blind gasket",
                    "targetFeatureLabel": target_model,
                    "dimensionConfirmation": True,
                }
            )
            items.append(item)
    return items


def build_jsk_micro(row):
    if row["series"] != "VMW":
        return None
    product = row["product_code"]
    if product not in JSK_MICRO_PRODUCT:
        return None
    if product == "UE" and "-R45" in row["vigour_model"]:
        return None

    product_code, product_label = JSK_MICRO_PRODUCT[product]
    material_code, material_label = jsk_material(row)
    finish_code, finish_label = jsk_finish(row)
    size_code = row["size_code"]
    size_label = label_for_size(size_code)
    reducing_match = re.match(r"VMW-(?:RE|RT|RU)(\d+)-(\d+)(?:-|$)", row["vigour_model"])
    if reducing_match:
        primary_size, secondary_size = reducing_match.groups()
        size_code = f"{primary_size}{secondary_size}"
        size_label = f"{label_for_size(primary_size)} x {label_for_size(secondary_size)}"

    source_model = f"M{product_code}{size_code}{material_code}"
    if finish_code != "STD":
        source_model += finish_code
    item = add_common(
        row,
        "JSK",
        source_model,
        row["vigour_model"],
        "Rule-generated candidate",
        "按 JSK Micro fitting 订购码规则生成；异径端尺寸需按样本再确认。",
    )
    item.update(
        {
            "seriesCode": "M",
            "seriesLabel": "Micro fitting",
            "productCode": product_code,
            "productLabel": product_label,
            "sizeCode": size_code,
            "sizeLabel": size_label,
            "materialCode": material_code,
            "materialLabel": material_label,
            "finishCode": finish_code,
            "finishLabel": finish_label,
        }
    )
    return item


def build_jsk_tube_weld(row):
    if row["series"] != "VTW":
        return None
    product = row["product_code"]
    if product not in JSK_TUBE_WELD_PRODUCT:
        return None

    product_code, product_label = JSK_TUBE_WELD_PRODUCT[product]
    material_code, material_label = jsk_material(row)
    finish_code, finish_label = jsk_finish(row)
    parts = ["W", product_code, row["size_code"], material_code]
    if finish_code != "STD":
        parts.append(finish_code)
    source_model = " ".join(parts)
    item = add_common(
        row,
        "JSK",
        source_model,
        row["vigour_model"],
        "Rule-generated candidate",
        "按 JSK 焊接件功能和管径规则生成；异径件需人工复核小端尺寸。",
    )
    item.update(
        {
            "seriesCode": "W",
            "seriesLabel": "Tube butt weld",
            "productCode": product_code,
            "productLabel": product_label,
            "sizeCode": row["size_code"],
            "sizeLabel": label_for_size(row["size_code"]),
            "materialCode": material_code,
            "materialLabel": material_label,
            "finishCode": finish_code,
            "finishLabel": finish_label,
        }
    )
    return item


def jsk_base_source_model(item):
    source_model = item["sourceModel"]
    if " " not in source_model:
        return re.sub(r"(?:BA|EP|STD)$", "", source_model)

    parts = source_model.split()
    if parts and parts[-1] in ("BA", "EP", "STD"):
        parts = parts[:-1]
    return " ".join(parts)


def expand_jsk_finish_options(items):
    grouped = {}
    for item in items:
        if item["brand"] != "JSK" or item.get("productCode") in ("BG", "FN", "MN"):
            continue
        key = (
            item["seriesCode"],
            item["productCode"],
            item["sizeCode"],
            item["materialCode"],
            jsk_base_source_model(item),
        )
        grouped.setdefault(key, []).append(item)

    expanded = list(items)
    finish_labels = {
        "BA": "BA",
        "EP": "EP",
    }

    for group in grouped.values():
        by_finish = {item["finishCode"]: item for item in group}
        preferred = by_finish.get("STD") or group[0]
        base_source = jsk_base_source_model(preferred)

        for finish_code, finish_label in finish_labels.items():
            if finish_code in by_finish:
                by_finish[finish_code]["finishLabel"] = finish_label
                continue

            candidate = dict(preferred)
            candidate["finishCode"] = finish_code
            candidate["finishLabel"] = finish_label
            separator = "" if " " not in base_source else " "
            candidate["sourceModel"] = f"{base_source}{separator}{finish_code}"
            candidate["status"] = "Rule-generated finish candidate"
            candidate["note"] = (
                f"{preferred['note']} JSK 表面处理 {finish_code} 作为可选项补齐；"
                "若 VIGOUR 目录无完全相同材质/表面处理组合，请按样本或工艺要求复核。"
            )
            expanded.append(candidate)

    normalized = []
    for item in expanded:
        if item["brand"] != "JSK" or item.get("finishCode") == "STD":
            if item["brand"] != "JSK" or item.get("productCode") in ("BG", "FN", "MN"):
                if item["brand"] == "JSK" and item.get("productCode") in ("FN", "MN"):
                    item["finishLabel"] = "Standard 316L / no EP process"
                    item["finishMatched"] = True
                    item["targetFinishLabel"] = "标准 316L / 无 EP 工艺"
                normalized.append(item)
            continue
        candidate = dict(item)
        if candidate.get("finishCode") == "EP" and candidate["vigourModel"].endswith("-P"):
            candidate["vigourModel"] = candidate["vigourModel"][:-2]
        candidate["finishMatched"] = candidate.get("finishCode") == vigour_finish_code(candidate["vigourModel"])
        candidate["targetFinishLabel"] = vigour_finish_label(candidate["vigourModel"])
        normalized.append(candidate)
    return normalized


def find_vigour_model(rows, model):
    for row in rows:
        if row["vigour_model"] == model:
            return row
    return None


def with_blind_suffix(model):
    return model if model.endswith("-BL") else f"{model}-BL"


def find_blind_vigour_candidate(rows, base_model):
    return find_vigour_model(rows, with_blind_suffix(base_model)) or find_vigour_model(
        rows, base_model
    )


def vigour_finish_code(model):
    if re.match(r"^(?:H?VVR)-(?:FN|MN)\d", model):
        return "STD"
    return "BA" if re.search(r"(?:^|-)BA(?:-|$)", model) else "EP"


def vigour_finish_label(model):
    finish_code = vigour_finish_code(model)
    if finish_code == "STD":
        return "标准 316L / 无 EP 工艺"
    return "BA / 未 EP" if finish_code == "BA" else "默认 EP"


def vigour_ba_candidate(rows, model):
    if vigour_finish_code(model) == "STD":
        return None
    base_model = re.sub(r"-(?:P|SLV)$", "", model)
    return find_vigour_model(rows, f"{base_model}-BA")


def fujikin_candidate_for_options(rows, vigour_model, material_code):
    if material_code == "316LM":
        slv_candidate = find_vigour_model(rows, f"{vigour_model}-SLV")
        if slv_candidate:
            return slv_candidate, True

    candidate = find_vigour_model(rows, vigour_model)
    return candidate, material_code == "SUS316L"


def fujikin_model_with_options(base_model, material_code, treatment_code):
    parts = [base_model]
    if material_code != "SUS316L":
        parts.append(material_code)
    if treatment_code != "STD":
        parts.append(treatment_code)
    return "-".join(parts)


def build_fujikin_no_match_items(
    base_model,
    product_code,
    product_label,
    size_code,
    size_label,
    variant_code,
    variant_label,
    reason,
):
    items = []
    for material_code, material_label in FUJIKIN_MATERIALS:
        for treatment_code, treatment_label in FUJIKIN_TREATMENTS:
            items.append(build_guarded_no_match(
                "FUJIKIN",
                fujikin_model_with_options(base_model, material_code, treatment_code),
                reason,
                productCode=product_code,
                productLabel=product_label,
                sizeCode=size_code,
                sizeLabel=size_label,
                variantCode=variant_code,
                variantLabel=variant_label,
                materialCode=material_code,
                materialLabel=material_label,
                treatmentCode=treatment_code,
                treatmentLabel=treatment_label,
            ))
    return items


def fujikin_add_item(items, rows, base_model, vigour_model, product_code, product_label, size_text, variant_code, variant_label):
    is_blind = vigour_model.endswith("-BL")
    catalog_model = vigour_model[:-3] if is_blind else vigour_model
    if is_blind:
        if not find_blind_vigour_candidate(rows, catalog_model):
            face_size, _, size_label = FUJIKIN_SIZE[size_text]
            items.extend(build_fujikin_no_match_items(
                base_model,
                product_code,
                product_label,
                face_size,
                f"{size_text} mm / {size_label}",
                variant_code,
                variant_label,
                "缺少 VIGOUR 盲板目标型号",
            ))
            return
    elif not find_vigour_model(rows, catalog_model):
        face_size, _, size_label = FUJIKIN_SIZE[size_text]
        items.extend(build_fujikin_no_match_items(
            base_model,
            product_code,
            product_label,
            face_size,
            f"{size_text} mm / {size_label}",
            variant_code,
            variant_label,
            "缺少 VIGOUR 基础目标型号",
        ))
        return
    face_size, tube_size, size_label = FUJIKIN_SIZE[size_text]
    for material_code, material_label in FUJIKIN_MATERIALS:
        for treatment_code, treatment_label in FUJIKIN_TREATMENTS:
            candidate, material_matched = fujikin_candidate_for_options(rows, catalog_model, material_code)
            if is_blind and material_code != "316LM":
                candidate = find_blind_vigour_candidate(rows, candidate["vigour_model"]) if candidate else None
            if not candidate:
                source_model = fujikin_model_with_options(base_model, material_code, treatment_code)
                items.append(build_guarded_no_match(
                    "FUJIKIN",
                    source_model,
                    "所选材质缺少 VIGOUR 目标型号",
                    productCode=product_code,
                    productLabel=product_label,
                    sizeCode=FUJIKIN_SIZE[size_text][0],
                    sizeLabel=f"{size_text} mm / {FUJIKIN_SIZE[size_text][2]}",
                    variantCode=variant_code,
                    variantLabel=variant_label,
                    materialCode=material_code,
                    materialLabel=material_label,
                    treatmentCode=treatment_code,
                    treatmentLabel=treatment_label,
                ))
                continue
            source_model = fujikin_model_with_options(base_model, material_code, treatment_code)
            target_model = (
                with_blind_suffix(candidate["vigour_model"])
                if is_blind
                else candidate["vigour_model"]
            )
            item = add_common(
                candidate,
                "FUJIKIN",
                source_model,
                target_model,
                "Catalog-derived candidate",
                "按 FUJIKIN UJR 扫描目录订购码和尺寸表整理；特殊长度、异径、材质和内面处理需结合样本尺寸复核。",
            )
            item.update(
                {
                    "productCode": product_code,
                    "productLabel": product_label,
                    "sizeCode": face_size,
                    "sizeLabel": f"{size_text} mm / {size_label}",
                    "tubeCode": tube_size,
                    "tubeLabel": label_for_size(tube_size),
                    "variantCode": variant_code,
                    "variantLabel": variant_label,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "treatmentCode": treatment_code,
                    "treatmentLabel": treatment_label,
                    "materialMatched": material_matched,
                    "treatmentMatched": treatment_code == "STD",
                    "targetMaterialLabel": candidate.get("material", ""),
                    "targetTreatmentLabel": candidate.get("surface_finish") or candidate.get("process_spec", ""),
                    "dimensionConfirmation": True,
                }
            )
            if is_blind:
                item["specialFeatureMatched"] = True
                item["specialFeatureLabel"] = "Blind gasket"
                item["targetFeatureLabel"] = target_model
            if base_model in FUJIKIN_UNSUPPORTED_LENGTH_MODELS:
                mark_no_match(
                    item,
                    note=(
                        "VIGOUR 目录暂无该 FUJIKIN 特殊长度焊接结构，"
                        "禁止用最近长度候选替代；请联系工厂确认。"
                    ),
                    special_feature_label=variant_code,
                    target_feature_label="无对应 VIGOUR 特殊长度型号",
                )
            items.append(item)


def fujikin_add_catalog_item(
    items,
    rows,
    base_model,
    vigour_model,
    product_code,
    product_label,
    size_code,
    size_label,
    variant_code,
    variant_label,
):
    if not find_vigour_model(rows, vigour_model):
        items.extend(build_fujikin_no_match_items(
            base_model,
            product_code,
            product_label,
            size_code,
            size_label,
            variant_code,
            variant_label,
            "目录规则引用的 VIGOUR 目标型号不存在",
        ))
        return

    normalized_variant = re.sub(r"-(?:APN|APM)$", "", variant_code)
    normalized_variant = normalized_variant.replace("AW-S#T", "AW-S")
    if normalized_variant.endswith("AW-S"):
        normalized_variant_label = "短焊接"
    elif normalized_variant == "AW":
        normalized_variant_label = "标准焊接"
    elif re.search(r"-(?:APN|APM)$", variant_code):
        normalized_variant_label = "特殊长度"
    else:
        normalized_variant_label = variant_label

    for material_code, material_label in FUJIKIN_MATERIALS:
        for treatment_code, treatment_label in FUJIKIN_TREATMENTS:
            candidate, material_matched = fujikin_candidate_for_options(rows, vigour_model, material_code)
            if not candidate:
                items.append(build_guarded_no_match(
                    "FUJIKIN",
                    fujikin_model_with_options(base_model, material_code, treatment_code),
                    "目录型号的所选材质缺少 VIGOUR 目标型号",
                    productCode=product_code,
                    productLabel=product_label,
                    sizeCode=size_code,
                    sizeLabel=size_label,
                    variantCode=normalized_variant,
                    variantLabel=normalized_variant_label,
                    materialCode=material_code,
                    materialLabel=material_label,
                    treatmentCode=treatment_code,
                    treatmentLabel=treatment_label,
                ))
                continue
            item = add_common(
                candidate,
                "FUJIKIN",
                fujikin_model_with_options(base_model, material_code, treatment_code),
                candidate["vigour_model"],
                "Catalog-derived weld candidate",
                "按 FUJIKIN UJ 自动焊接系列型号整理；异径方向、特殊长度和 APN/APM 结构需结合样本尺寸复核。",
            )
            item.update(
                {
                    "productCode": product_code,
                    "productLabel": product_label,
                    "sizeCode": size_code,
                    "sizeLabel": size_label,
                    "variantCode": normalized_variant,
                    "variantLabel": normalized_variant_label,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "treatmentCode": treatment_code,
                    "treatmentLabel": treatment_label,
                    "materialMatched": material_matched,
                    "treatmentMatched": treatment_code == "STD",
                    "targetMaterialLabel": candidate.get("material", ""),
                    "targetTreatmentLabel": candidate.get("surface_finish") or candidate.get("process_spec", ""),
                    "dimensionConfirmation": True,
                }
            )
            if re.search(r"-(?:APN|APM)$", variant_code):
                item["specialFeatureMatched"] = False
                item["specialFeatureLabel"] = variant_code.rsplit("-", 1)[-1]
                item["targetFeatureLabel"] = "VIGOUR 目录中的最近高流量长焊接候选"
            if base_model in FUJIKIN_UNSUPPORTED_LENGTH_MODELS:
                mark_no_match(
                    item,
                    note=(
                        "VIGOUR 目录暂无该 FUJIKIN 特殊长度焊接结构，"
                        "禁止用最近长度候选替代；请联系工厂确认。"
                    ),
                    special_feature_label=variant_code,
                    target_feature_label="无对应 VIGOUR 特殊长度型号",
                )
            items.append(item)


def build_fujikin_uj_weld_items(rows):
    items = []
    catalog_rows = [
        ("UJL-19.05M-AW", "VTW-LE12", "UJL", "Elbow", "12", "19.05 mm", "AW", "Tube butt weld"),
        ("UJT-19.05MX6.35M-AW", "VTW-RLT12-4", "UJT", "Reducing tee", "12x4", "19.05 x 6.35 mm", "AW", "Tube butt weld"),
        ("UJT-19.05M-AW", "VTW-LT12", "UJT", "Equal tee", "12", "19.05 mm", "AW", "Tube butt weld"),
        ("UJL-6.35M-AW-S#T", "VMW-UE4", "UJL", "Micro elbow", "4", "6.35 mm", "AW-S#T", "Micro auto weld"),
        ("UJT-6.35M-AW-S#T", "VMW-UT4", "UJT", "Micro equal tee", "4", "6.35 mm", "AW-S#T", "Micro auto weld"),
        ("UJT-19.05MX9.52M-AW", "VTW-RLT12-6", "UJT", "Reducing tee", "12x6", "19.05 x 9.52 mm", "AW", "Tube butt weld"),
        ("UJT-9.52M-AW-S", "VMW-UT6", "UJT", "Micro equal tee", "6", "9.52 mm", "AW-S", "Micro auto weld"),
        ("UJL-9.52M-AW-S", "VMW-UE6", "UJL", "Micro elbow", "6", "9.52 mm", "AW-S", "Micro auto weld"),
        ("UJL-9.52MX6.35M-AW-S", "VMW-RE6-4", "UJL", "Micro reducing elbow", "6x4", "9.52 x 6.35 mm", "AW-S", "Micro auto weld"),
        ("UJL-12.7MX9.52M-AW-S", "VMW-RE8-6", "UJL", "Micro reducing elbow", "8x6", "12.7 x 9.52 mm", "AW-S", "Micro auto weld"),
        ("UJT-12.7MX9.52M-AW-S", "VMW-RT8-6", "UJT", "Micro reducing tee", "8x6", "12.7 x 9.52 mm", "AW-S", "Micro auto weld"),
        ("UJT-12.7M-AW-S", "VMW-UT8", "UJT", "Micro equal tee", "8", "12.7 mm", "AW-S", "Micro auto weld"),
        ("UJS-12.7MX9.52M-AW-S", "VMW-RU8-6", "UJS", "Micro reducer", "8x6", "12.7 x 9.52 mm", "AW-S", "Micro auto weld"),
        ("UJT-12.7MX6.35M-AW-S", "VMW-RT8-4", "UJT", "Micro reducing tee", "8x4", "12.7 x 6.35 mm", "AW-S", "Micro auto weld"),
        ("UJL-12.7M-AW-S", "VMW-UE8", "UJL", "Micro elbow", "8", "12.7 mm", "AW-S", "Micro auto weld"),
        ("UJT-19.05MX12.7M-AW", "VTW-RLT12-8", "UJT", "Reducing tee", "12x8", "19.05 x 12.7 mm", "AW", "Tube butt weld"),
        ("UJT-9.52MX6.35M-AW-S", "VMW-RT6-4", "UJT", "Micro reducing tee", "6x4", "9.52 x 6.35 mm", "AW-S", "Micro auto weld"),
        ("UJL-12.7MX6.35M-AW-S", "VMW-RE8-4", "UJL", "Micro reducing elbow", "8x4", "12.7 x 6.35 mm", "AW-S", "Micro auto weld"),
        ("UJT-9.52MX6.35M-AW", "VTW-RLT6-4", "UJT", "Reducing tee", "6x4", "9.52 x 6.35 mm", "AW", "Tube butt weld"),
        ("UJT-9.52M-AW", "VTW-LT6", "UJT", "Equal tee", "6", "9.52 mm", "AW", "Tube butt weld"),
        ("UJX-6.35M-AW-S", "VMW-CU4", "UJX", "Micro cross", "4", "6.35 mm", "AW-S", "Micro auto weld"),
        ("UJS-12.7MX6.35M-AW-S", "VMW-RU8-4", "UJS", "Micro reducer", "8x4", "12.7 x 6.35 mm", "AW-S", "Micro auto weld"),
        ("UJS-19.05MX12.7M-AW", "VTW-RLU12-8", "UJS", "Reducer", "12x8", "19.05 x 12.7 mm", "AW", "Tube butt weld"),
        ("UJS-19.05MX6.35M-AW", "VTW-RLU12-4", "UJS", "Reducer", "12x4", "19.05 x 6.35 mm", "AW", "Tube butt weld"),
        ("UJL-19.05MX6.35M-AW", "VTW-RLE12-4", "UJL", "Reducing elbow", "12x4", "19.05 x 6.35 mm", "AW", "Tube butt weld"),
        ("UJL-19.05MX12.7M-AW", "VTW-RLE12-8", "UJL", "Reducing elbow", "12x8", "19.05 x 12.7 mm", "AW", "Tube butt weld"),
        ("UJX-9.52M-AW-S", "VMW-CU6", "UJX", "Micro cross", "6", "9.52 mm", "AW-S", "Micro auto weld"),
        ("UJS-9.52MX6.35M-AW-S", "VMW-RU6-4", "UJS", "Micro reducer", "6x4", "9.52 x 6.35 mm", "AW-S", "Micro auto weld"),
    ]

    ujr_rows = [
        ("UJR-6.35X9.52MS-L33-APN", "HVVR-HG4-TB6-L33", "MS-HF", "High flow long gland", "4x6", "6.35 face x 9.52 tube mm", "L33-APN", "Special length"),
        ("UJR-6.35X9.52N", "HVVR-FN4", "N-HF", "High flow female nut", "4x6", "6.35 face x 9.52 tube mm", "STD", "High flow"),
        ("UJR-C-9.52", "VVR-MN8", "C", "Male nut", "8", "9.52 mm", "STD", "Standard"),
        ("UJR-JC-3.2", "VVR-P2", "JC", "VCR plug", "2", "3.2 mm", "STD", "Standard"),
        ("UJR-JC-9.52", "VVR-P8", "JC", "VCR plug", "8", "9.52 mm", "STD", "Standard"),
        ("UJR-JC-6.35", "VVR-P4", "JC", "VCR plug", "4", "6.35 mm", "STD", "Standard"),
        ("UJR-9.52X6.35MS-AW", "VVR-MG8-TB4", "MS-R", "Reducing long gland", "8x4", "9.52 face x 6.35 tube mm", "AW", "Auto weld long"),
        ("UJR-6.35MS-L28-AW", "VVR-FG4-TB4", "MS", "Short gland", "4", "6.35 mm", "L28-AW", "Female short gland, L27.9"),
        ("UJR-9.52MS-L28.5-AW", "VVR-FG8-TB6", "MS", "Short gland", "8x6", "9.52 mm", "L28.5-AW", "Female short gland, L28.4"),
        ("UJR-12.7MS-L28.5-AW", "VVR-FG8-TB8", "MS", "Short gland", "8", "12.7 mm", "L28.5-AW", "Female short gland, L28.4"),
        ("UJR-12.7MS-L37-AW-S", "VVR-MG8-TB8-L35", "MS", "Micro long gland", "8", "12.7 mm", "L37-AW-S", "Nearest VIGOUR L35"),
        ("UJR-6.35X9.52MS-L28.5-APM", "HVVR-HG4-TB6-L30", "MS-HF", "High flow long gland", "4x6", "6.35 face x 9.52 tube mm", "L28.5-APM", "Special length"),
    ]

    for args in catalog_rows + ujr_rows:
        fujikin_add_catalog_item(items, rows, *args)
    return items


def build_fujikin_ujr_items(rows):
    items = []

    gland_rows = [
        ("UJR-3.2MS", "VVR-MG2-TB2", "MS", "Male sleeve / weld gland", "3.2", "STD", "Standard sleeve"),
        ("UJR-6.35MS-AW-S", "VVR-FG4-TB4-L15", "MS", "Male sleeve / weld gland", "6.35", "AW-S", "Auto weld short, L15"),
        ("UJR-6.35MS-L18-AW-S", "VVR-FG4-TB4-L18", "MS", "Male sleeve / weld gland", "6.35", "L18-AW-S", "Auto weld short, L18"),
        ("UJR-9.52MS-L19-AW-S", "VVR-FG8-TB6-L15", "MS", "Male sleeve / weld gland", "9.52", "L19-AW-S", "Nearest VIGOUR L15"),
        ("UJR-12.7MS-L19-AW-S", "VVR-FG8-TB8-L18", "MS", "Male sleeve / weld gland", "12.7", "L19-AW-S", "Auto weld short, nearest VIGOUR L18"),
        ("UJR-6.35MS-L33-AW-S", "VVR-MG4-TB4-L33", "MS", "Male sleeve / weld gland", "6.35", "L33-AW-S", "Auto weld short, L33"),
        ("UJR-9.52MS-L37-AW-S", "VVR-MG8-TB6-L32", "MS", "Male sleeve / weld gland", "9.52", "L37-AW-S", "Nearest VIGOUR L32"),
        ("UJR-12.7MS-L37-AW-S", "VVR-MG8-TB8-L37", "MS", "Male sleeve / weld gland", "12.7", "L37-AW-S", "Auto weld short, L37"),
        ("UJR-6.35MS-AW", "VVR-MG4-TB4", "MS", "Male sleeve / weld gland", "6.35", "AW", "Auto weld long"),
        ("UJR-9.52MS-AW", "VVR-MG8-TB6", "MS", "Male sleeve / weld gland", "9.52", "AW", "Auto weld long"),
        ("UJR-12.7MS-AW", "VVR-MG8-TB8", "MS", "Male sleeve / weld gland", "12.7", "AW", "Auto weld long"),
        ("UJR-19.05MS-AW", "VVR-MG12-TB12", "MS", "Male sleeve / weld gland", "19.05", "AW", "Auto weld long"),
        ("UJR-3.2S", "VVR-MG2-TB2", "S", "Sleeve", "3.2", "STD", "Standard sleeve"),
        ("UJR-6.35S", "VVR-MG4-TB4", "S", "Sleeve", "6.35", "STD", "Standard sleeve"),
        ("UJR-9.52S", "VVR-MG8-TB6", "S", "Sleeve", "9.52", "STD", "Standard sleeve"),
        ("UJR-12.7S", "VVR-MG8-TB8", "S", "Sleeve", "12.7", "STD", "Standard sleeve"),
        ("UJR-19.05S", "VVR-MG12-TB12", "S", "Sleeve", "19.05", "STD", "Standard sleeve"),
    ]
    for args in gland_rows:
        fujikin_add_item(items, rows, *args)

    body_map = [
        ("F", "Straight union body", "MU", "Straight union"),
        ("L", "Elbow union body", "MUE", "Elbow union"),
        ("T", "Tee union body", "MUT", "Tee union"),
        ("X", "Cross union body", "MUC", "Cross union"),
        ("C", "Male nut", "MN", "Male nut"),
        ("JP", "Union cap", "C", "Cap"),
    ]
    body_sizes = ["3.2", "6.35", "9.52", "12.7", "19.05"]
    for product_code, product_label, vigour_product, variant_label in body_map:
        for size_text in body_sizes:
            face_size = FUJIKIN_SIZE[size_text][0]
            if product_code in ("L", "T", "X") and size_text == "19.05":
                continue
            if product_code == "JP":
                base_model = f"UJR-JP-{size_text}"
            else:
                base_model = f"UJR-{product_code}-{size_text}"
            vigour_model = f"VVR-{vigour_product}{face_size}" if vigour_product != "MUT" else f"VVR-MUT-{face_size}"
            fujikin_add_item(
                items,
                rows,
                base_model,
                vigour_model,
                product_code,
                product_label,
                size_text,
                "STD",
                variant_label,
            )

    accessory_rows = [
        ("UJR-3.2N", "VVR-FN2", "N", "Female nut", "3.2", "STD", "Nut"),
        ("UJR-6.35N", "VVR-FN4", "N", "Female nut", "6.35", "STD", "Nut"),
        ("UJR-9.52N", "VVR-FN8", "N", "Female nut", "9.52", "STD", "Nut"),
        ("UJR-19.05N", "VVR-FN12", "N", "Female nut", "19.05", "STD", "Nut"),
        ("UJR-6.35N-L", "VVR-FN4", "N", "Female nut", "6.35", "L", "Long nut, nearest VIGOUR nut"),
        ("UJR-9.52N-L", "VVR-FN8", "N", "Female nut", "9.52", "L", "Long nut, nearest VIGOUR nut"),
        ("UJR-3.2G-NI-O", "VVR-GK-G2-NI", "G", "Gasket", "3.2", "NI-O", "Nickel gasket"),
        ("UJR-6.35G-O", "VVR-GK-G4", "G", "Gasket", "6.35", "O", "Gasket"),
        ("UJR-6.35G-NI-O", "VVR-GK-G4-NI", "G", "Gasket", "6.35", "NI-O", "Nickel gasket"),
        ("UJR-9.52G-O", "VVR-GK-G8", "G", "Gasket", "9.52", "O", "Gasket"),
        ("UJR-9.52G-NI-O", "VVR-GK-G8-NI", "G", "Gasket", "9.52", "NI-O", "Nickel gasket"),
        ("UJR-19.05G-NI-O", "VVR-GK-G12-NI", "G", "Gasket", "19.05", "NI-O", "Nickel gasket"),
        ("UJR-6.35G-O-BL", "VVR-GK-G4-BL", "G", "Blind gasket", "6.35", "O-BL", "Blind gasket"),
        ("UJR-9.52G-O-BL", "VVR-GK-G8-BL", "G", "Blind gasket", "9.52", "O-BL", "Blind gasket"),
        ("UJR-6.35RE-RG-O", "VVR-GKR-G4", "RE-RG", "Retainer gasket", "6.35", "O", "Retainer gasket"),
        ("UJR-6.35RE-RG-NI-O", "VVR-GKR-G4-NI", "RE-RG", "Retainer gasket", "6.35", "NI-O", "Nickel retainer gasket"),
        ("UJR-9.52RE-RG-O", "VVR-GKR-G8", "RE-RG", "Retainer gasket", "9.52", "O", "Retainer gasket"),
        ("UJR-9.52RE-RG-NI-O", "VVR-GKR-G8-NI", "RE-RG", "Retainer gasket", "9.52", "NI-O", "Nickel retainer gasket"),
        ("UJR-6.35RE-RG-O-BL", "VVR-GKR-G4-BL", "RE-RG", "Retainer blind gasket", "6.35", "O-BL", "Retainer blind gasket"),
        ("UJR-9.52RE-RG-O-BL", "VVR-GKR-G8-BL", "RE-RG", "Retainer blind gasket", "9.52", "O-BL", "Retainer blind gasket"),
    ]
    for args in accessory_rows:
        fujikin_add_item(items, rows, *args)

    thread_variants = {
        "A": ("M2", "PT1/8"),
        "B": ("M4", "PT1/4"),
        "C": ("M6", "PT3/8"),
        "D": ("M8", "PT1/2"),
        "AN": ("M2", "1/8 NPT"),
        "BN": ("M4", "1/4 NPT"),
        "CN": ("M6", "3/8 NPT"),
        "DN": ("M8", "1/2 NPT"),
    }
    for size_text in ("3.2", "6.35", "9.52"):
        face_size = FUJIKIN_SIZE[size_text][0]
        for thread_code, (vigour_thread, thread_label) in thread_variants.items():
            vigour_model = f"VVR-MC{face_size}-{vigour_thread}"
            fujikin_add_item(
                items,
                rows,
                f"UJR-H-{size_text}{thread_code}",
                vigour_model,
                "H",
                "Half union body",
                size_text,
                thread_code,
                thread_label,
            )

    return items


def tk_source_model(base_model, material_code, finish_code):
    suffix = "-P" if finish_code == "EP" else ""
    return f"{material_code}{base_model}{suffix}"


def tk_confirmed_length_ba_model(material_code, product, variant, model):
    if (
        material_code == "S"
        and product in ("SG", "LG")
        and variant in ("6", "10")
        and re.search(r"-L\d+$", model)
    ):
        return f"{model}-BA"
    return ""


def tk_size_label(size_code):
    return TK_SIZE_LABELS.get(size_code, label_for_size(size_code))


def tk_parse_base_model(base_model):
    clean = base_model.replace(" ", "")
    thread_suffix = ""
    if "-" in clean:
        clean, thread_suffix = clean.split("-", 1)
    match = re.match(r"^(\d+)(?:x(\d+))?([A-Z]+)(\d*)$", clean)
    if not match:
        return None
    major, minor, product, variant = match.groups()
    return {
        "major": major,
        "minor": minor or "",
        "product": product,
        "variant": variant,
        "threadSuffix": thread_suffix,
    }


def tk_add_item(items, rows, candidate, base_model, parsed, product_code=None, variant_label=None):
    if not candidate:
        return
    product = product_code or parsed["product"]
    size_code = f"{parsed['major']}x{parsed['minor']}" if parsed["minor"] else parsed["major"]
    size_label = tk_size_label(parsed["major"])
    if parsed["minor"]:
        size_label = f"{tk_size_label(parsed['major'])} x {tk_size_label(parsed['minor'])}"
    variant_code = parsed["variant"] or parsed["threadSuffix"] or "STD"
    if parsed["threadSuffix"] and parsed["variant"]:
        variant_code = f"{parsed['variant']}-{parsed['threadSuffix']}"

    if product in TK_GASKET_PRODUCTS:
        for material_code, material_label, material_suffix in (
            ("US", "UHP stainless gasket", ""),
            ("UN", "UHP nickel gasket", "-NI"),
        ):
            selected = tk_find_exact(rows, f"{candidate['vigour_model']}{material_suffix}") or candidate
            target_model = selected["vigour_model"]
            if product == "GB":
                target_model = with_blind_suffix(target_model)
            item = add_common(
                selected,
                "TK-Fujikin",
                f"{material_code}{base_model}",
                target_model,
                "Catalog-derived candidate",
                "按 TK-Fujikin WELD & METAL SEAL FITTINGS 目录订购码生成；垫片材质、镀层和尺寸需结合样本复核。",
            )
            item.update(
                {
                    "productCode": product,
                    "productLabel": TK_PRODUCT_LABELS.get(product, product),
                    "sizeCode": size_code,
                    "sizeLabel": size_label,
                    "variantCode": variant_code,
                    "variantLabel": variant_label or variant_code,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "finishCode": "STD",
                    "finishLabel": "Standard gasket finish",
                    "materialMatched": ("-NI" in target_model) == (material_code == "UN"),
                    "targetMaterialLabel": selected.get("material", "316L"),
                    "finishMatched": True,
                    "targetFinishLabel": vigour_finish_label(target_model),
                }
            )
            if product == "GB":
                item["specialFeatureMatched"] = True
                item["specialFeatureLabel"] = "Blind gasket"
                item["targetFeatureLabel"] = target_model
            items.append(item)
        return

    finish_options = (
        [("STD", "Standard 316L / no EP process")]
        if product in ("FN", "MN", "MNS")
        else TK_FINISHES
    )
    for material_code, material_label in TK_MATERIALS:
        for finish_code, finish_label in finish_options:
            base_target = candidate["vigour_model"]
            slv_candidate = tk_find_exact(rows, f"{base_target}-SLV")
            selected = candidate
            if material_code == "D" and slv_candidate:
                selected = slv_candidate
            target_model = selected["vigour_model"]
            if finish_code == "BA":
                ba_candidate = vigour_ba_candidate(rows, selected["vigour_model"])
                if ba_candidate:
                    selected = ba_candidate
                    target_model = selected["vigour_model"]
                else:
                    target_model = (
                        tk_confirmed_length_ba_model(
                            material_code,
                            product,
                            parsed["variant"],
                            selected["vigour_model"],
                        )
                        or selected["vigour_model"]
                    )

            target_model = (
                with_blind_suffix(target_model)
                if product == "GB"
                else target_model
            )
            item = add_common(
                selected,
                "TK-Fujikin",
                tk_source_model(base_model, material_code, finish_code),
                target_model,
                "Catalog-derived candidate",
                "按 TK-Fujikin WELD & METAL SEAL FITTINGS 目录订购码生成；尺寸、特殊长度、螺纹和表面处理需结合样本复核。",
            )
            item.update(
                {
                    "productCode": product,
                    "productLabel": TK_PRODUCT_LABELS.get(product, product),
                    "sizeCode": size_code,
                    "sizeLabel": size_label,
                    "variantCode": variant_code,
                    "variantLabel": variant_label or variant_code,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "finishCode": finish_code,
                    "finishLabel": finish_label,
                    "materialMatched": material_code == "S" or "-SLV" in selected["vigour_model"],
                    "targetMaterialLabel": selected.get("material", "316L"),
                    "finishMatched": finish_code == vigour_finish_code(target_model),
                    "targetFinishLabel": vigour_finish_label(target_model),
                }
            )
            if product == "GB":
                item["specialFeatureMatched"] = True
                item["specialFeatureLabel"] = "Blind gasket"
                item["targetFeatureLabel"] = target_model
            items.append(item)


def tk_add_unmatched_items(items, base_model, parsed):
    size_code = f"{parsed['major']}x{parsed['minor']}" if parsed["minor"] else parsed["major"]
    size_label = tk_size_label(parsed["major"])
    if parsed["minor"]:
        size_label = f"{tk_size_label(parsed['major'])} x {tk_size_label(parsed['minor'])}"
    variant_code = parsed["variant"] or parsed["threadSuffix"] or "STD"
    if parsed["threadSuffix"] and parsed["variant"]:
        variant_code = f"{parsed['variant']}-{parsed['threadSuffix']}"

    for material_code, material_label in TK_MATERIALS:
        for finish_code, finish_label in TK_FINISHES:
            items.append(
                {
                    "brand": "TK-Fujikin",
                    "sourceModel": tk_source_model(base_model, material_code, finish_code),
                    "vigourModel": "",
                    "status": "暂时无匹配",
                    "productName": TK_PRODUCT_LABELS.get(parsed["product"], parsed["product"]),
                    "note": "暂时没有匹配产品，请联系工厂确认。",
                    "productCode": parsed["product"],
                    "productLabel": TK_PRODUCT_LABELS.get(parsed["product"], parsed["product"]),
                    "sizeCode": size_code,
                    "sizeLabel": size_label,
                    "variantCode": variant_code,
                    "variantLabel": variant_code,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "finishCode": finish_code,
                    "finishLabel": finish_label,
                    "noMatch": True,
                }
            )


def tk_find_exact(rows, model):
    return find_vigour_model(rows, model)


def tk_choose_weld_candidate(rows, parsed):
    major = parsed["major"]
    minor = parsed["minor"]
    product = parsed["product"]
    variant = parsed["variant"]

    if variant in ("6", "11", "25", "29", "50"):
        if product == "R" and minor:
            return tk_find_exact(rows, f"VMW-RU{major}-{minor}")
        if product == "E" and minor:
            return tk_find_exact(rows, f"VMW-RE{major}-{minor}")
        if product == "T" and minor:
            return tk_find_exact(rows, f"VMW-RT{major}-{minor}")
        if product == "E":
            return tk_find_exact(rows, f"VMW-UE{major}")
        if product == "HE":
            return tk_find_exact(rows, f"VMW-VE{major}-R45")
        if product == "T":
            return tk_find_exact(rows, f"VMW-UT{major}")
        if product == "CT":
            return tk_find_exact(rows, f"VMW-CU{major}")
        if product == "TB":
            return tk_find_exact(rows, f"VMW-TB{major}")

    if variant in ("10", "19", "22", "23"):
        if product == "E" and minor:
            return tk_find_exact(rows, f"VTW-RLE{major}-{minor}")
        if product == "T" and minor:
            return tk_find_exact(rows, f"VTW-RLT{major}-{minor}")
        if product == "R" and minor:
            return tk_find_exact(rows, f"VTW-RLU{major}-{minor}")
        if product == "E":
            return tk_find_exact(rows, f"VTW-LE{major}")
        if product == "T":
            return tk_find_exact(rows, f"VTW-LT{major}")

    return None


def tk_vvr_size(parsed):
    return TK_FACE_SIZE.get(parsed["major"], (parsed["major"], parsed["major"]))


def tk_choose_face_candidate(rows, parsed):
    face_size, tube_size = tk_vvr_size(parsed)
    major = parsed["major"]
    minor = parsed["minor"]
    product = parsed["product"]
    variant = parsed["variant"]
    thread_suffix = parsed["threadSuffix"]

    if product in ("SG", "ASG", "SWSG"):
        length_map = {"6": "L15", "10": "L18"}
        tail = f"-TB{tube_size}"
        if variant in length_map:
            tail = f"{tail}-{length_map[variant]}"
        return tk_find_exact(rows, f"VVR-FG{face_size}{tail}")
    if product in ("LG", "ALG", "SWLG", "MG"):
        length_map = {"6": "L30", "10": "L33"}
        tail = f"-TB{tube_size}"
        if variant in length_map:
            tail = f"{tail}-{length_map[variant]}"
        return tk_find_exact(rows, f"VVR-MG{face_size}{tail}")
    if product == "BLG":
        return tk_find_exact(rows, f"VVR-BG{face_size}")
    if product == "TA":
        return tk_find_exact(rows, f"VVR-MTA{face_size}-TB{tube_size.zfill(2)}")
    if product == "MU":
        if minor:
            minor_face = TK_FACE_SIZE.get(minor, (minor, minor))[0]
            return tk_find_exact(rows, f"VVR-RMU{face_size}-{minor_face}")
        return tk_find_exact(rows, f"VVR-MU{face_size}")
    if product == "BH":
        return tk_find_exact(rows, f"VVR-MBU{face_size}")
    if product in ("BY", "BHY"):
        return tk_find_exact(rows, f"VVR-TBBC{face_size}-TB{tube_size}")
    if product == "FU":
        return tk_find_exact(rows, f"VVR-FU{face_size}")
    if product == "RA":
        return tk_find_exact(rows, f"VVR-RA{major}-{minor}") or tk_find_exact(rows, f"VVR-RA{face_size}-{minor}")
    if product == "RB":
        return tk_find_exact(rows, f"VVR-RB{major}-{minor}") or tk_find_exact(rows, f"VVR-RB{face_size}-{minor}")
    if product == "ME":
        return tk_find_exact(rows, f"VVR-MEC{face_size}-M{tube_size}")
    if product == "UE":
        return tk_find_exact(rows, f"VVR-MUE{face_size}")
    if product == "UT":
        return tk_find_exact(rows, f"VVR-MUT-{face_size}")
    if product == "UC":
        return tk_find_exact(rows, f"VVR-MUC{face_size}")
    if product == "MCK":
        return tk_find_exact(rows, f"VVR-TFC{face_size}-F{tube_size}")
    if product == "BHCK":
        return tk_find_exact(rows, f"VVR-TFBC{face_size}-F{tube_size}")
    if product == "BHC":
        thread_size = TK_FACE_SIZE.get(minor or major, (minor or major, minor or major))[1]
        return tk_find_exact(rows, f"VVR-MBC{face_size}-M{thread_size}")
    if product in ("MC", "MCS", "FC"):
        thread_prefix = "F" if product == "FC" else "M"
        if thread_suffix == "X32":
            thread_prefix = "F"
        return tk_find_exact(rows, f"VVR-MC{face_size}-{thread_prefix}{tube_size}")
    if product == "GR":
        return tk_find_exact(rows, f"VVR-GKR-G{face_size}")
    if product == "GT":
        return tk_find_exact(rows, f"VVR-GK-G{face_size}")
    if product == "GB":
        return tk_find_exact(rows, f"VVR-GK-G{face_size}")
    if product == "HLG":
        return tk_find_exact(rows, "HVVR-HG4-TB6-L33")
    if product == "HFN":
        return tk_find_exact(rows, "HVVR-FN4")
    if product == "HMN":
        return tk_find_exact(rows, "HVVR-MN4")
    if product == "FN":
        return tk_find_exact(rows, f"VVR-FN{face_size}")
    if product in ("MN", "MNS"):
        return tk_find_exact(rows, f"VVR-MN{face_size}")
    if product == "PG":
        suffix = "-L" if thread_suffix == "C" else ""
        return tk_find_exact(rows, f"VVR-P{face_size}{suffix}")
    if product == "CP":
        suffix = "-L" if thread_suffix == "C" else ""
        return tk_find_exact(rows, f"VVR-C{face_size}{suffix}")

    return None


def tk_catalog_base_models():
    models = []
    micro_sizes = ["4", "6", "8", "12"]
    for product, variant in (("E", "6"), ("HE", "6"), ("T", "6"), ("CT", "6"), ("TB", "6")):
        models.extend(f"{size}{product}{variant}" for size in micro_sizes)
    models.extend(["4EX11", "4EXT50", "4EXT25", "4EXE29"])
    for major, minors in {"6": ["4"], "8": ["4", "6"], "12": ["4", "6", "8"]}.items():
        for minor in minors:
            models.extend([f"{major}x{minor}R6", f"{major}x{minor}E6", f"{major}x{minor}T6"])

    forged = {
        "4": ["10", "19"],
        "6": ["10", "19"],
        "8": ["10", "19"],
        "12": ["10", "22"],
        "16": ["23"],
    }
    for size, variants in forged.items():
        for variant in variants:
            models.extend([f"{size}E{variant}", f"{size}T{variant}"])
    for major, minors in {"6": ["4"], "8": ["4", "6"], "12": ["4", "6", "8"], "16": ["4", "8"]}.items():
        variant = {"6": "19", "8": "19", "12": "22", "16": "23"}[major]
        for minor in minors:
            models.extend([f"{major}x{minor}E{variant}", f"{major}x{minor}T{variant}"])
    for major, minors in {"6": ["4"], "8": ["4", "6"], "12": ["4", "6", "8"]}.items():
        for minor in minors:
            models.extend([f"{major}x{minor}R19", f"{major}x{minor}R10"])

    for product in ("SG", "LG"):
        for size in ("2", "12", "16"):
            models.append(f"{size}{product}19")
        for size in ("4", "6", "8"):
            for variant in ("6", "10", "19"):
                models.append(f"{size}{product}{variant}")
        for variant in ("6", "10", "19"):
            models.append(f"8x4{product}{variant}")
    for product in ("ASG", "ALG"):
        for size in ("4", "6", "8", "12", "16"):
            models.append(f"{size}{product}19")
        models.append(f"8x4{product}19")

    models.extend(["4SWSG", "2SWLG", "4SWLG", "6SWLG", "8SWLG", "12SWLG", "16SWLG", "4x2SWLG", "8x4SWLG"])
    for product in ("BLG", "MU", "CG", "FN", "MN", "GT", "GB", "PG", "CP"):
        for size in ("2", "4", "8", "12", "16"):
            models.append(f"{size}{product}")
    models.append("4MNS")
    models.extend(["4x2MU", "8x4MU", "4BH", "8BH", "12BH", "16BH", "4BY19", "6BY19", "8BY19", "12BY19", "4BHY", "8BHY", "12BHY"])
    models.extend(["8x4FU", "2x4RA", "4x8RA", "4x2RB", "8x4RB"])
    for product in ("ME", "MC", "FC"):
        for size in ("2", "4", "6", "8", "12", "16"):
            if product == "ME" and size in ("2", "16"):
                continue
            models.extend([f"{size}{product}", f"{size}{product}-X32"])
    models.extend(["4MCS", "8MCS", "12MCS"])
    for product in ("UE", "UT", "UC"):
        for size in ("4", "8", "12", "16"):
            models.append(f"{size}{product}")
    for product in ("MCK", "BHCK"):
        for size in ("4", "6", "8"):
            models.append(f"{size}{product}")
    models.extend(["4BHC", "8x4BHC", "4GR", "8GR", "12GR", "16GR"])
    models.extend(["4PG-C", "8PG-C", "4CP-C", "8CP-C"])
    models.extend(["4HFN", "4HMN", "6x4HLG"])

    seen = []
    for model in models:
        if model not in seen:
            seen.append(model)
    return seen


def build_tk_fujikin_items(rows):
    items = []
    for base_model in tk_catalog_base_models():
        parsed = tk_parse_base_model(base_model)
        if not parsed:
            items.append(build_guarded_no_match(
                "TK-Fujikin",
                base_model,
                "目录型号无法解析",
            ))
            continue
        candidate = tk_choose_weld_candidate(rows, parsed) or tk_choose_face_candidate(rows, parsed)
        if not candidate:
            tk_add_unmatched_items(items, base_model, parsed)
            continue
        tk_add_item(items, rows, candidate, base_model, parsed)
    return items


def unilok_catalog_models():
    models = []

    def add(product, sizes):
        models.extend((product, size) for size in sizes)

    add("CME", ("02", "04", "06", "08", "12"))
    add("CMRE", ("0402", "0604", "0804", "0806"))
    add("CMVE", ("04", "06", "08"))
    add("CMT", ("02", "04", "06", "08", "12"))
    add("CMRT", ("0402", "0604", "0804", "0806"))
    add("CMTB", ("04", "06", "08"))
    add("CMC", ("04", "06", "08"))
    add("CMRU", ("0402", "0604", "0804", "0806", "1204", "1206", "1208"))
    add("CLE", ("04", "06", "08", "12", "16"))
    add("CLRE", ("0604", "0804", "0806", "1204", "1206", "1208"))
    add("CLT", ("04", "06", "08", "12", "16"))
    add("CLRT", ("0604", "0804", "0806", "1204", "1206", "1208"))
    add("CLRU", ("0604", "0804", "0806", "1204", "1206", "1208", "1604", "1606", "1608", "1612"))

    add("CMGS", ("04", "0804", "0806", "08"))
    add("CMGL", ("04", "0804", "0806", "08"))
    add("CSGS", ("04", "0804", "0806", "08"))
    add("CSGL", ("0402", "04", "0804", "0806", "08"))
    add("CLGS", ("0402", "04", "0804", "0806", "08", "12", "16", "0402-33.5"))
    add("CLGL", ("04", "0804", "0806", "08", "12", "16"))
    add("CSGWS", ("04T",))
    add("CLGWS", ("04", "0806", "08", "12", "16"))
    add("CLGRWS", ("0402", "0804"))
    for product in ("CBG", "CCP", "CPG", "CGT", "CGTR", "CGTB"):
        add(product, ("04", "08", "12", "16"))
    for product, rule in UNILOK_NUT_RULES.items():
        add(product, rule["sizes"])

    add("CHG", ("0406B", "0406B-33.3"))
    add("CHA", ("0406",))
    add("CHBA", ("0406",))

    for product in ("CDMU", "CEU", "CUT", "CUC", "CC"):
        add(product, ("04", "08", "12", "16"))
    add("CDMRU", ("0804",))
    add("CBDMU", ("04", "08"))
    add("CDFRU", ("0804",))
    add("CRA", ("0804",))
    add("CRB", ("0804",))
    add("CAWB", ("04", "0806", "08"))
    add("CBAWB", ("04", "0804", "08"))
    add("CULC", ("0402", "04", "0806", "08"))
    add("CBULC", ("04", "0806", "08"))
    return models


def unilok_size_parts(size_code):
    clean = size_code.split("-", 1)[0].rstrip("BT")
    clean = clean.split("L", 1)[0]
    if len(clean) <= 2:
        return clean.zfill(2), ""
    return clean[:2], clean[2:4]


def unilok_vigour_size(code):
    return str(int(code)) if code else ""


def canonical_vigour_gland_model(model):
    canonical = str(model or "")
    previous = None
    while canonical != previous:
        previous = canonical
        canonical = re.sub(r"-(?:SLV|BA)(?=-|$)", "", canonical)
    return canonical


def within_scaled_tolerance(source, target, tolerance, integer_scale):
    source_scaled = round(float(source) * integer_scale)
    target_scaled = round(float(target) * integer_scale)
    tolerance_scaled = round(float(tolerance) * integer_scale)
    return abs(source_scaled - target_scaled) <= tolerance_scaled


def unilok_gland_dimension_evidence(product, size_code, target_model):
    source_dimensions = UNILOK_GLAND_SOURCE_DIMENSIONS.get((product, size_code))
    canonical_target = canonical_vigour_gland_model(target_model)
    target_length = VIGOUR_GLAND_TOTAL_LENGTHS_MM.get(canonical_target)
    source_insertion = UNILOK_GLAND_SOURCE_INSERTION_MM.get((product, size_code))
    target_insertion = VIGOUR_GLAND_INSERTION_LENGTHS_MM.get(canonical_target)
    tube_match = re.search(r"-TB(\d+)(?:-|$)", canonical_target)
    target_wall = VIGOUR_GLAND_WALL_THICKNESS_IN.get(tube_match.group(1)) if tube_match else None
    if (
        not source_dimensions
        or target_length is None
        or source_insertion is None
        or target_insertion is None
        or target_wall is None
    ):
        return None

    source_length, source_wall = source_dimensions
    length_difference = round(abs(source_length - target_length), 2)
    insertion_difference = round(abs(source_insertion - target_insertion), 2)
    wall_difference = round(abs(source_wall - target_wall), 4)
    wall_matched = within_scaled_tolerance(
        source_wall,
        target_wall,
        UNILOK_GLAND_WALL_TOLERANCE_IN,
        GLAND_RULE["tolerances"]["wallThickness"]["integerScale"],
    )
    length_matched = within_scaled_tolerance(
        source_length,
        target_length,
        UNILOK_GLAND_LENGTH_TOLERANCE_MM,
        GLAND_RULE["tolerances"]["overallLength"]["integerScale"],
    )
    insertion_matched = within_scaled_tolerance(
        source_insertion,
        target_insertion,
        UNILOK_GLAND_INSERTION_TOLERANCE_MM,
        GLAND_RULE["tolerances"]["insertionLength"]["integerScale"],
    )
    dimension_matched = length_matched and insertion_matched and wall_matched
    source_evidence_id = f"source:UNILOK:{product}:{size_code}:p6"
    target_evidence_id = f"target:VIGOUR:{canonical_target}:p3-4"
    return {
        "sourceTotalLengthMm": source_length,
        "targetTotalLengthMm": target_length,
        "totalLengthDifferenceMm": length_difference,
        "totalLengthToleranceMm": UNILOK_GLAND_LENGTH_TOLERANCE_MM,
        "sourceInsertionLengthMm": source_insertion,
        "targetInsertionLengthMm": target_insertion,
        "insertionLengthDifferenceMm": insertion_difference,
        "insertionLengthToleranceMm": UNILOK_GLAND_INSERTION_TOLERANCE_MM,
        "insertionLengthMatched": insertion_matched,
        "sourceWallThicknessIn": source_wall,
        "targetWallThicknessIn": target_wall,
        "wallThicknessDifferenceIn": wall_difference,
        "wallThicknessToleranceIn": UNILOK_GLAND_WALL_TOLERANCE_IN,
        "wallThicknessMatched": wall_matched,
        "dimensionComparisons": [
            {
                "dimension": "overallLength",
                "label": "总长",
                "sourceValue": source_length,
                "targetValue": target_length,
                "absoluteDifference": length_difference,
                "tolerance": UNILOK_GLAND_LENGTH_TOLERANCE_MM,
                "unit": "mm",
                "matched": length_matched,
                "required": True,
                "sourceEvidenceId": source_evidence_id,
                "targetEvidenceId": target_evidence_id,
            },
            {
                "dimension": "wallThickness",
                "label": "管壁厚",
                "sourceValue": source_wall,
                "targetValue": target_wall,
                "absoluteDifference": wall_difference,
                "tolerance": UNILOK_GLAND_WALL_TOLERANCE_IN,
                "unit": "in",
                "matched": wall_matched,
                "required": True,
                "sourceEvidenceId": source_evidence_id,
                "targetEvidenceId": target_evidence_id,
            },
            {
                "dimension": "insertionLength",
                "label": "插入长度",
                "sourceValue": source_insertion,
                "targetValue": target_insertion,
                "absoluteDifference": insertion_difference,
                "tolerance": UNILOK_GLAND_INSERTION_TOLERANCE_MM,
                "unit": "mm",
                "matched": insertion_matched,
                "required": True,
                "sourceEvidenceId": source_evidence_id,
                "targetEvidenceId": target_evidence_id,
            },
        ],
        "familyRule": GLAND_RULE["ruleId"],
        "sourceEvidenceId": source_evidence_id,
        "targetEvidenceId": target_evidence_id,
        "evidencePages": ["UNILOK-VCR.pdf#page=6", "VIGOUR VUPS英文目录-26.8.7.pdf#page=3-4"],
        "dimensionEvidenceStatus": "within_tolerance" if dimension_matched else "out_of_tolerance",
        "dimensionEvidenceReason": (
            "所有必比尺寸均在公差内" if dimension_matched else "至少一项必比尺寸超出公差"
        ),
        "dimensionMatched": dimension_matched,
    }


def choose_unilok_candidate(rows, product, size_code):
    if product in ("CLE", "CLRE", "CLT", "CLRU") and re.search(r"L\d", size_code):
        return None

    major_code, minor_code = unilok_size_parts(size_code)
    major = unilok_vigour_size(major_code)
    minor = unilok_vigour_size(minor_code)
    face = major
    tube = minor or major

    exact = ""
    if product == "CME":
        exact = f"VMW-UE{major}"
    elif product == "CMRE":
        exact = f"VMW-RE{major}-{minor}"
    elif product == "CMVE":
        exact = f"VMW-VE{major}-R45"
    elif product == "CMT":
        exact = f"VMW-UT{major}"
    elif product == "CMRT":
        exact = f"VMW-RT{major}-{minor}"
    elif product == "CMTB":
        exact = f"VMW-TB{major}"
    elif product == "CMC":
        exact = f"VMW-CU{major}"
    elif product == "CMRU":
        exact = f"VMW-RU{major}-{minor}"
    elif product == "CLE":
        exact = f"VTW-LE{major}"
    elif product == "CLRE":
        exact = f"VTW-RLE{major}-{minor}"
    elif product == "CLT":
        exact = f"VTW-LT{major}"
    elif product == "CLRT":
        exact = f"VTW-RLT{major}-{minor}"
    elif product == "CLRU":
        exact = f"VTW-RLU{major}-{minor}"
    elif product in ("CMGS", "CSGS", "CLGS", "CSGWS"):
        length_suffix = {
            ("CMGS", "04"): "-L15",
            ("CMGS", "0804"): "-L15",
            ("CMGS", "0806"): "-L15",
            ("CMGS", "08"): "-L15",
            ("CSGS", "04"): "-L18",
            ("CSGS", "0804"): "-L19",
            ("CSGS", "0806"): "-L15",
            ("CSGS", "08"): "-L18",
        }.get((product, size_code), "")
        exact = f"VVR-FG{face}-TB{tube}{length_suffix}"
    elif product in ("CMGL", "CSGL", "CLGL", "CLGWS", "CLGRWS"):
        length_suffix = {
            ("CMGL", "04"): "-L30",
            ("CMGL", "0804"): "-L32",
            ("CMGL", "0806"): "-L32",
            ("CMGL", "08"): "-L32",
            ("CSGL", "04"): "-L33",
            ("CSGL", "0804"): "-L37",
            ("CSGL", "0806"): "-L32",
            ("CSGL", "08"): "-L35",
        }.get((product, size_code), "")
        exact = f"VVR-MG{face}-TB{tube}{length_suffix}"
    elif product == "CBG":
        exact = f"VVR-BG{face}"
    elif product == "CCP":
        exact = f"VVR-C{face}"
    elif product == "CPG":
        exact = f"VVR-P{face}"
    elif product in UNILOK_NUT_RULES:
        exact = f"{UNILOK_NUT_RULES[product]['target_prefix']}{face}"
    elif product == "CGT":
        exact = f"VVR-GK-G{face}"
    elif product == "CGTR":
        exact = f"VVR-GKR-G{face}"
    elif product == "CGTB":
        exact = f"VVR-GK-G{face}"
    elif product == "CDMU":
        exact = f"VVR-MU{face}"
    elif product == "CDMRU":
        exact = f"VVR-RMU{face}-{minor}"
    elif product == "CBDMU":
        exact = f"VVR-MBU{face}"
    elif product == "CEU":
        exact = f"VVR-MUE{face}"
    elif product == "CUT":
        exact = f"VVR-MUT-{face}"
    elif product == "CUC":
        exact = f"VVR-MUC{face}"
    elif product in ("CDFRU", "CC"):
        exact = f"VVR-FU{face}"
    elif product == "CRA":
        exact = f"VVR-RA{face}-{minor}"
    elif product == "CRB":
        exact = f"VVR-RB{face}-{minor}"
    elif product == "CAWB":
        exact = f"VVR-MTA{face}-TB{tube.zfill(2)}"
    elif product == "CBAWB":
        exact = f"VVR-TBBC{face}-TB{tube}"
    elif product == "CULC":
        exact = f"VVR-TFC{face}-{tube.zfill(2)}"
    elif product == "CBULC":
        exact = f"VVR-TFBC{face}-{tube.zfill(2)}"
    return find_vigour_model(rows, exact) if exact else None


def build_unilok_items(rows):
    items = []
    gasket_products = {"CGT", "CGTR", "CGTB"}
    standard_only_products = {
        "CCP", "CPG",
        "CDMU", "CDMRU", "CBDMU", "CEU", "CUT", "CUC",
        "CDFRU", "CRA", "CRB", "CC", "CAWB", "CBAWB", "CULC", "CBULC",
    } | set(UNILOK_NUT_RULES)
    for product, size_code in unilok_catalog_models():
        base_model = f"{product}-{size_code}"
        candidate = choose_unilok_candidate(rows, product, size_code)
        major_code, minor_code = unilok_size_parts(size_code)
        size_label = label_for_size(unilok_vigour_size(major_code))
        if minor_code:
            size_label += f" x {label_for_size(unilok_vigour_size(minor_code))}"

        if product in gasket_products:
            for material_code, material_label in UNILOK_GASKET_MATERIALS:
                selected = candidate
                if material_code == "NI" and candidate:
                    selected = find_vigour_model(rows, f"{candidate['vigour_model']}-NI") or candidate
                source_model = f"{base_model}-{material_code}"
                if not selected:
                    items.append(build_unilok_unmatched_item(source_model, product, size_code, size_label, material_code, material_label, "STD", "Unplated"))
                    continue
                target_model = (
                    with_blind_suffix(selected["vigour_model"])
                    if product == "CGTB"
                    else selected["vigour_model"]
                )
                item = add_common(selected, "UNILOK", source_model, target_model, "Catalog-derived candidate", "按 UNILOK UCR 目录型号、结构及尺寸对标；正式替代前请复核尺寸和材质。")
                item.update({
                    "productCode": product, "productLabel": UNILOK_PRODUCT_LABELS[product],
                    "sizeCode": size_code, "sizeLabel": size_label,
                    "materialCode": material_code, "materialLabel": material_label,
                    "finishCode": "STD", "finishLabel": "Unplated",
                    "materialMatched": material_code == "SL" or "-NI" in selected["vigour_model"],
                    "targetMaterialLabel": selected.get("material", "316L"),
                    "dimensionConfirmation": product not in UNILOK_DIRECT_ACCESSORY_PRODUCTS,
                })
                if product == "CGTB":
                    item["specialFeatureMatched"] = True
                    item["specialFeatureLabel"] = "Blind gasket"
                    item["targetFeatureLabel"] = target_model
                items.append(item)
            continue

        if product in standard_only_products:
            source_model = f"{base_model}-SL"
            if not candidate:
                items.append(build_unilok_unmatched_item(source_model, product, size_code, size_label, "SL", "316L Stainless Steel", "STD", "Standard"))
                continue
            item = add_common(candidate, "UNILOK", source_model, candidate["vigour_model"], "Catalog-derived candidate", "按 UNILOK UCR 目录型号、结构及尺寸对标；正式替代前请复核尺寸和材质。")
            item.update({
                "productCode": product, "productLabel": UNILOK_PRODUCT_LABELS[product],
                "sizeCode": size_code, "sizeLabel": size_label,
                "materialCode": "SL", "materialLabel": "316L Stainless Steel",
                "finishCode": "STD", "finishLabel": "Standard",
                "materialMatched": True,
                "targetMaterialLabel": candidate.get("material", "316L"),
                "dimensionConfirmation": (
                    product not in UNILOK_DIRECT_ACCESSORY_PRODUCTS
                ),
            })
            if product in UNILOK_NUT_RULES:
                item["finishMatched"] = True
                item["targetFinishLabel"] = UNILOK_NUT_RULES[product]["target_finish_label"]
            items.append(item)
            continue

        materials = UNILOK_MATERIALS
        for material_code, material_label in materials:
            for finish_code, finish_label in UNILOK_FINISHES:
                source_model = f"{base_model}-{material_code}-{finish_code}"
                if not candidate:
                    items.append(build_unilok_unmatched_item(source_model, product, size_code, size_label, material_code, material_label, finish_code, finish_label))
                    continue
                selected = candidate
                target_model = candidate["vigour_model"]
                slv = find_vigour_model(rows, f"{candidate['vigour_model']}-SLV")
                if material_code == "DM":
                    selected = slv or candidate
                    target_model = selected["vigour_model"]
                if finish_code == "BA":
                    ba = vigour_ba_candidate(rows, target_model)
                    if ba:
                        selected = ba
                        target_model = ba["vigour_model"]
                dimension_evidence = unilok_gland_dimension_evidence(product, size_code, target_model)
                item = add_common(selected, "UNILOK", source_model, target_model, "Catalog-derived candidate", "按 UNILOK UCR 目录型号、结构及尺寸对标；正式替代前请复核尺寸、材质与表面处理。")
                item.update({
                    "productCode": product, "productLabel": UNILOK_PRODUCT_LABELS[product],
                    "sizeCode": size_code, "sizeLabel": size_label,
                    "materialCode": material_code, "materialLabel": material_label,
                    "finishCode": finish_code, "finishLabel": finish_label,
                    "materialMatched": material_code == "SM" or "-SLV" in target_model,
                    "targetMaterialLabel": selected.get("material", "316L"),
                    "finishMatched": finish_code == vigour_finish_code(target_model),
                    "targetFinishLabel": vigour_finish_label(target_model),
                    "dimensionConfirmation": not (
                        dimension_evidence and dimension_evidence["dimensionMatched"]
                    ),
                })
                if dimension_evidence:
                    item.update({
                        key: value
                        for key, value in dimension_evidence.items()
                        if key != "dimensionMatched"
                    })
                items.append(item)

    return items


def build_unilok_unmatched_item(source_model, product, size_code, size_label, material_code, material_label, finish_code, finish_label):
    return {
        "brand": "UNILOK",
        "sourceModel": source_model,
        "vigourModel": "",
        "status": "暂时无匹配",
        "productName": UNILOK_PRODUCT_LABELS[product],
        "note": "暂时没有匹配产品，请联系工厂确认。",
        "productCode": product,
        "productLabel": UNILOK_PRODUCT_LABELS[product],
        "sizeCode": size_code,
        "sizeLabel": size_label,
        "materialCode": material_code,
        "materialLabel": material_label,
        "finishCode": finish_code,
        "finishLabel": finish_label,
        "noMatch": True,
    }


def superlok_source_model(base_model, material_code, finish_code, is_gasket):
    if is_gasket:
        suffix = "-SP" if finish_code == "SP" else ""
    else:
        suffix = "-P" if finish_code == "EP" else ""
    return f"{material_code}{base_model}{suffix}"


def build_superlok_no_match_items(base_model, parsed, reason):
    product = parsed["product"]
    is_gasket = product in ("GR", "GT", "BGT")
    is_nut = product in ("FN", "MN", "MNS", "HFN", "HMN")
    materials = SUPERLOK_GASKET_MATERIALS if is_gasket else SUPERLOK_MATERIALS
    finishes = (
        SUPERLOK_GASKET_FINISHES
        if is_gasket
        else [("STD", "Standard 316L / no EP process")]
        if is_nut
        else SUPERLOK_FINISHES
    )
    size_code = f"{parsed['major']}X{parsed['minor']}" if parsed["minor"] else parsed["major"]
    size_label = tk_size_label(parsed["major"])
    if parsed["minor"]:
        size_label = f"{tk_size_label(parsed['major'])} x {tk_size_label(parsed['minor'])}"
    variant_code = parsed["variant"] or parsed["threadSuffix"] or "STD"
    if parsed["threadSuffix"] and parsed["variant"]:
        variant_code = f"{parsed['variant']}-{parsed['threadSuffix']}"

    return [
        build_guarded_no_match(
            "SUPERLOK",
            superlok_source_model(base_model, material_code, finish_code, is_gasket),
            reason,
            productCode=product,
            productLabel=SUPERLOK_PRODUCT_LABELS.get(product, product),
            sizeCode=size_code,
            sizeLabel=size_label,
            variantCode=variant_code,
            variantLabel=variant_code,
            materialCode=material_code,
            materialLabel=material_label,
            finishCode=finish_code,
            finishLabel=finish_label,
        )
        for material_code, material_label in materials
        for finish_code, finish_label in finishes
    ]


def superlok_add_item(items, rows, candidate, base_model, parsed, product_code=None, variant_label=None):
    if not candidate:
        return
    product = product_code or parsed["product"]
    is_gasket = product in ("GR", "GT", "BGT")
    is_nut = product in ("FN", "MN", "MNS", "HFN", "HMN")
    materials = SUPERLOK_GASKET_MATERIALS if is_gasket else SUPERLOK_MATERIALS
    finishes = (
        SUPERLOK_GASKET_FINISHES
        if is_gasket
        else [("STD", "Standard 316L / no EP process")]
        if is_nut
        else SUPERLOK_FINISHES
    )
    size_code = f"{parsed['major']}X{parsed['minor']}" if parsed["minor"] else parsed["major"]
    size_label = tk_size_label(parsed["major"])
    if parsed["minor"]:
        size_label = f"{tk_size_label(parsed['major'])} x {tk_size_label(parsed['minor'])}"
    variant_code = parsed["variant"] or parsed["threadSuffix"] or "STD"
    if parsed["threadSuffix"] and parsed["variant"]:
        variant_code = f"{parsed['variant']}-{parsed['threadSuffix']}"

    for material_code, material_label in materials:
        for finish_code, finish_label in finishes:
            selected = candidate
            target_model = candidate["vigour_model"]
            if not is_gasket and material_code == "DM":
                slv = find_vigour_model(rows, f"{target_model}-SLV")
                if slv:
                    selected = slv
                    target_model = slv["vigour_model"]
            if not is_gasket and not is_nut and finish_code == "BA":
                ba = vigour_ba_candidate(rows, target_model)
                if ba:
                    selected = ba
                    target_model = ba["vigour_model"]
            if product == "BGT":
                material_suffix = "-NI" if material_code == "NI" else ""
                selected = find_blind_vigour_candidate(
                    rows,
                    re.sub(r"-NI$", "", candidate["vigour_model"]) + material_suffix,
                ) or candidate
                target_model = selected["vigour_model"]
            target_model = (
                with_blind_suffix(selected["vigour_model"])
                if product == "BGT"
                else target_model
            )
            item = add_common(
                selected,
                "SUPERLOK",
                superlok_source_model(base_model, material_code, finish_code, is_gasket),
                target_model,
                "Catalog-derived candidate",
                "按 SUPERLOK UHP WELD & METAL SEAL FITTINGS 目录订购码生成；尺寸、螺纹、特殊长度、材质和表面处理需结合样本复核。",
            )
            item.update(
                {
                    "productCode": product,
                    "productLabel": SUPERLOK_PRODUCT_LABELS.get(product, product),
                    "sizeCode": size_code,
                    "sizeLabel": size_label,
                    "variantCode": variant_code,
                    "variantLabel": variant_label or variant_code,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "finishCode": finish_code,
                    "finishLabel": finish_label,
                }
            )
            if not is_gasket:
                item["materialMatched"] = material_code == "SM" or "-SLV" in target_model
                item["targetMaterialLabel"] = selected.get("material", "316L")
            if not is_gasket:
                item["finishMatched"] = finish_code == vigour_finish_code(selected["vigour_model"])
                item["targetFinishLabel"] = vigour_finish_label(selected["vigour_model"])
            if product == "BGT":
                item["specialFeatureMatched"] = True
                item["specialFeatureLabel"] = "Blind gasket"
                item["targetFeatureLabel"] = target_model
            items.append(item)


def superlok_parse_base_model(base_model):
    clean = base_model.replace(" ", "")
    thread_suffix = ""
    if "-" in clean:
        clean, thread_suffix = clean.split("-", 1)
    match = re.match(r"^(\d+)(?:X(\d+))?([A-Z]+)(\d*)$", clean)
    if not match:
        return None
    major, minor, product_part, variant = match.groups()

    known_products = sorted(SUPERLOK_PRODUCT_LABELS, key=len, reverse=True)
    product = ""
    suffix_part = ""
    for known in known_products:
        if product_part.startswith(known):
            product = known
            suffix_part = product_part[len(known):]
            break
    if not product:
        product = product_part

    if suffix_part:
        thread_suffix = suffix_part if not thread_suffix else f"{suffix_part}-{thread_suffix}"

    return {
        "major": major,
        "minor": minor or "",
        "product": product,
        "variant": variant,
        "threadSuffix": thread_suffix,
    }


def superlok_choose_weld_candidate(rows, parsed):
    product = parsed["product"]
    if product == "CR":
        parsed = {**parsed, "product": "CT"}
    return tk_choose_weld_candidate(rows, parsed)


def superlok_choose_face_candidate(rows, parsed):
    product = parsed["product"]
    face_size, tube_size = tk_vvr_size(parsed)
    major = parsed["major"]
    minor = parsed["minor"]
    variant = parsed["variant"]
    thread = parsed["threadSuffix"]

    if product in ("FG", "SSG"):
        mapped = {**parsed, "product": "SG"}
        return tk_choose_face_candidate(rows, mapped)
    if product in ("MG", "MWG", "SLG"):
        mapped = {**parsed, "product": "LG"}
        return tk_choose_face_candidate(rows, mapped)
    if product == "RSLG":
        return tk_find_exact(rows, f"VVR-MG{face_size}-TB{tube_size}")
    if product == "BG":
        return tk_find_exact(rows, f"VVR-BG{face_size}")
    if product == "TA":
        return tk_find_exact(rows, f"VVR-MTA{face_size}-TB{tube_size.zfill(2)}")
    if product == "MU":
        return tk_find_exact(rows, f"VVR-MU{face_size}")
    if product == "MRU":
        minor_face = TK_FACE_SIZE.get(minor, (minor, minor))[0]
        return tk_find_exact(rows, f"VVR-RMU{face_size}-{minor_face}")
    if product == "BHU":
        return tk_find_exact(rows, f"VVR-MBU{face_size}")
    if product in ("TC", "TBHC"):
        return tk_find_exact(rows, f"VVR-TBBC{face_size}-TB{tube_size}")
    if product == "FRU":
        return tk_find_exact(rows, f"VVR-FU{face_size}")
    if product == "RA":
        return tk_find_exact(rows, f"VVR-RA{major}-{minor}") or tk_find_exact(rows, f"VVR-RA{face_size}-{minor}")
    if product == "RB":
        return tk_find_exact(rows, f"VVR-RB{major}-{minor}") or tk_find_exact(rows, f"VVR-RB{face_size}-{minor}")
    if product == "ME":
        return tk_find_exact(rows, f"VVR-MEC{face_size}-M{tube_size}")
    if product == "UE":
        return tk_find_exact(rows, f"VVR-MUE{face_size}")
    if product == "UT":
        return tk_find_exact(rows, f"VVR-MUT-{face_size}")
    if product == "UC":
        return tk_find_exact(rows, f"VVR-MUC{face_size}")
    if product == "SC":
        return tk_find_exact(rows, f"VVR-TFC{face_size}-F{tube_size}")
    if product == "BHSC":
        return tk_find_exact(rows, f"VVR-TFBC{face_size}-F{tube_size}")
    if product == "BHMC":
        minor_size = TK_FACE_SIZE.get(minor or major, (minor or major, minor or major))[1]
        return tk_find_exact(rows, f"VVR-MBC{face_size}-M{minor_size}")
    if product == "MC":
        thread_prefix = "F" if thread == "R" else "M"
        return tk_find_exact(rows, f"VVR-MC{face_size}-{thread_prefix}{tube_size}")
    if product == "FC":
        thread_prefix = "F"
        return tk_find_exact(rows, f"VVR-MC{face_size}-{thread_prefix}{tube_size}")
    if product == "GR":
        return tk_find_exact(rows, f"VVR-GKR-G{face_size}")
    if product == "GT":
        material_suffix = "-NI" if parsed.get("materialCode") == "NI" else ""
        return tk_find_exact(rows, f"VVR-GK-G{face_size}{material_suffix}") or tk_find_exact(rows, f"VVR-GK-G{face_size}")
    if product == "BGT":
        return find_blind_vigour_candidate(rows, f"VVR-GK-G{face_size}")
    if product == "FN":
        return tk_find_exact(rows, f"VVR-FN{face_size}")
    if product in ("MN", "MNS"):
        return tk_find_exact(rows, f"VVR-MN{face_size}")
    if product == "PG":
        return tk_find_exact(rows, f"VVR-P{face_size}")
    if product == "PGC":
        return tk_find_exact(rows, f"VVR-P{face_size}-L")
    if product == "CP":
        return tk_find_exact(rows, f"VVR-C{face_size}")
    if product == "HLG":
        return tk_find_exact(rows, f"HVVR-HG4-L33")
    if product == "HTC":
        return tk_find_exact(rows, f"HVVR-HG4")
    if product == "HBHC":
        return tk_find_exact(rows, f"HVVR-HG4")
    if product == "HFN":
        return tk_find_exact(rows, "HVVR-FN4")
    if product == "HMN":
        return tk_find_exact(rows, "HVVR-MN4")

    return None


def superlok_catalog_base_models():
    models = []
    micro_sizes = ["2", "4", "6", "8", "12"]
    for product, variant in (("E", "6"), ("HE", "6"), ("T", "6"), ("CR", "6"), ("TB", "6")):
        models.extend(f"{size}{product}{variant}" for size in micro_sizes)
    for major, minors in {"4": ["2"], "6": ["4"], "8": ["4", "6"], "12": ["4", "6", "8"]}.items():
        for minor in minors:
            models.extend([f"{major}X{minor}R6", f"{major}X{minor}E6", f"{major}X{minor}T6"])

    forged = {"4": ["10", "19"], "6": ["10", "19"], "8": ["10", "19"], "12": ["10", "22"], "16": ["10", "23"]}
    for size, variants in forged.items():
        for variant in variants:
            models.extend([f"{size}E{variant}", f"{size}T{variant}", f"{size}CR{variant}"])
    for major, minors in {"6": ["4"], "8": ["4", "6"], "12": ["4", "6", "8"], "16": ["4", "6", "8", "12"]}.items():
        variant = {"6": "19", "8": "19", "12": "22", "16": "23"}[major]
        for minor in minors:
            models.extend([f"{major}X{minor}E{variant}", f"{major}X{minor}T{variant}"])
    for major, minors in {"6": ["4"], "8": ["4", "6"], "12": ["4", "6", "8"], "16": ["4", "6", "8", "12"]}.items():
        for minor in minors:
            models.extend([f"{major}X{minor}R19", f"{major}X{minor}R10"])

    for product in ("FG", "MG"):
        for size in ("2", "12", "16"):
            models.append(f"{size}{product}19")
        for size in ("4", "6", "8"):
            for variant in ("6", "10", "19"):
                models.append(f"{size}{product}{variant}")
        for variant in ("6", "10", "19"):
            models.append(f"8X4{product}{variant}")

    models.extend(["4SSG", "2SLG", "4SLG", "6SLG", "8SLG", "12SLG", "16SLG", "4X2RSLG", "8X4RSLG"])
    for product in ("BG", "MU", "CG", "FN", "MN", "GT", "BGT", "PG", "CP"):
        for size in ("2", "4", "8", "12", "16"):
            models.append(f"{size}{product}")
    models.append("4MNS")
    models.extend(["2MWG", "4MWG", "6MWG", "8MWG", "4TA", "6TA", "8TA", "4X2MRU", "8X4MRU"])
    models.extend(["4BHU", "8BHU", "12BHU", "16BHU", "4TC", "6TC", "8TC", "12TC", "4TBHC", "8TBHC", "12TBHC", "8X4FRU"])
    models.extend(["2X4RA", "4X8RA", "4X2RB", "8X4RB"])
    models.extend(["4MEN", "8MEN", "12MEN", "4MER", "8MER", "12MER"])
    for product in ("UE", "UT", "UC"):
        for size in ("4", "8", "12", "16"):
            models.append(f"{size}{product}")
    for product in ("SC", "BHSC"):
        for size in ("4", "8"):
            models.append(f"{size}{product}")
    models.extend(["4BHMCN"])
    for size in ("2", "4", "8", "12", "16"):
        models.extend([f"{size}MCR", f"{size}MCN", f"{size}FCR", f"{size}FCN"])
    models.extend(["4X6MCU", "8X10MCU", "8X6MCU", "12X14MCU"])
    models.extend(["4GR", "8GR", "12GR", "16GR", "4PGC", "8PGC", "4HFN", "4HMN", "4X6HLG", "4X6HTC", "4X6HBHC"])

    seen = []
    for model in models:
        if model not in seen:
            seen.append(model)
    return seen


def fitok_catalog_models():
    data = json.loads(FITOK_CATALOG_SOURCE.read_text(encoding="utf-8"))
    return {
        series: entry["models"]
        for series, entry in data["source"].items()
    }


def fitok_size_from_token(token):
    if token.startswith("MTB"):
        metric_size = token[3:]
        return FITOK_METRIC_SIZE_MAP.get(metric_size), f"M{metric_size}", f"{metric_size} mm"
    if token.startswith("TB"):
        size = token[2:]
        return size, size, label_for_size(size)
    return None, "", ""


def fitok_material_candidate(rows, base_model, material_code, process_code):
    material_required = material_code in ("6LV", "6LW")
    material_model = f"{base_model}-SLV" if material_required else base_model
    material_candidate = find_vigour_model(rows, material_model)
    base_candidate = find_vigour_model(rows, base_model)
    candidate = material_candidate or base_candidate
    material_matched = (
        bool(material_candidate)
        if material_required
        else material_code in ("SS", "6L") and bool(base_candidate)
    )

    process_matched = process_code == "STD"
    if process_code == "F3":
        process_candidate = find_vigour_model(rows, f"{material_model}-P")
        if process_candidate:
            candidate = process_candidate
        process_matched = bool(candidate)
    elif process_code == "F2":
        process_matched = False

    return candidate, material_matched, process_matched


def fitok_full_model(material_code, basic_model, process_code):
    suffix = "" if process_code == "STD" else f"-{process_code}"
    return f"{material_code}{basic_model}{suffix}"


def build_fitok_no_match_items(
    basic_model,
    series_code,
    series_label,
    reason,
    product_code="",
    product_label="",
    size_code="",
    size_label="",
    variant_code="",
    variant_label="",
):
    resolved_product_code = product_code or basic_model.strip("-").split("-", 1)[0]
    resolved_product_label = product_label or resolved_product_code
    items = []
    for material_code, material_label in FITOK_MATERIALS:
        for process_code, process_label in FITOK_PROCESSES:
            if material_code in ("6LV", "6LW") and process_code != "F3":
                continue
            if material_code == "SS" and process_code == "F3":
                continue
            items.append(build_guarded_no_match(
                "FITOK",
                fitok_full_model(material_code, basic_model, process_code),
                reason,
                seriesCode=series_code,
                seriesLabel=series_label,
                productCode=resolved_product_code,
                productLabel=resolved_product_label,
                sizeCode=size_code,
                sizeLabel=size_label,
                variantCode=variant_code or "UNRESOLVED",
                variantLabel=variant_label or "目录型号尚未建立安全映射规则",
                materialCode=material_code,
                materialLabel=material_label,
                processCode=process_code,
                processLabel=process_label,
            ))
    return items


def fitok_add_item(
    items,
    rows,
    basic_model,
    base_vigour_model,
    series_code,
    series_label,
    product_code,
    product_label,
    size_code,
    size_label,
    variant_code,
    variant_label,
):
    if not find_vigour_model(rows, base_vigour_model):
        items.extend(build_fitok_no_match_items(
            basic_model,
            series_code,
            series_label,
            "规则引用的 VIGOUR 基础目标型号不存在",
            product_code,
            product_label,
            size_code,
            size_label,
            variant_code,
            variant_label,
        ))
        return

    special_weld_length = series_code in ("M", "L") and variant_label == "Special leg/length"
    for material_code, material_label in FITOK_MATERIALS:
        for process_code, process_label in FITOK_PROCESSES:
            if material_code in ("6LV", "6LW") and process_code != "F3":
                continue
            if material_code == "SS" and process_code == "F3":
                continue
            candidate, material_matched, process_matched = fitok_material_candidate(
                rows,
                base_vigour_model,
                material_code,
                process_code,
            )
            if not candidate:
                items.append(build_guarded_no_match(
                    "FITOK",
                    fitok_full_model(material_code, basic_model, process_code),
                    "材质/工艺组合缺少 VIGOUR 目标型号",
                    seriesCode=series_code,
                    seriesLabel=series_label,
                    productCode=product_code,
                    productLabel=product_label,
                    sizeCode=size_code,
                    sizeLabel=size_label,
                    variantCode=variant_code,
                    variantLabel=variant_label,
                    materialCode=material_code,
                    materialLabel=material_label,
                    processCode=process_code,
                    processLabel=process_label,
                ))
                continue
            target_model = (
                with_semiconductor_process(candidate["vigour_model"])
                if process_code == "F3"
                else candidate["vigour_model"]
            )
            item = add_common(
                candidate,
                "FITOK",
                fitok_full_model(material_code, basic_model, process_code),
                target_model,
                "Catalog-derived FITOK candidate",
                "按 FITOK FR/M/L 官方目录订购号整理；尺寸、壁厚、长度及清洗/超高纯工艺需结合双方样本复核。",
            )
            item.update(
                {
                    "seriesCode": series_code,
                    "seriesLabel": series_label,
                    "productCode": product_code,
                    "productLabel": product_label,
                    "sizeCode": size_code,
                    "sizeLabel": size_label,
                    "variantCode": variant_code,
                    "variantLabel": variant_label,
                    "materialCode": material_code,
                    "materialLabel": material_label,
                    "processCode": process_code,
                    "processLabel": process_label,
                    "materialMatched": material_matched,
                    "treatmentMatched": process_matched,
                    "targetMaterialLabel": candidate.get("material", ""),
                    "targetTreatmentLabel": (
                        "VS001A / UHP P option"
                        if process_code == "F3"
                        else candidate.get("surface_finish") or candidate.get("process_spec", "")
                    ),
                    "dimensionConfirmation": True,
                }
            )
            if special_weld_length:
                mark_no_match(
                    item,
                    note=(
                        "VIGOUR 目录暂无该加长/特殊腿长焊接结构，禁止用普通焊接型号替代；"
                        "请联系工厂确认。"
                    ),
                    special_feature_label=variant_label,
                    target_feature_label="无对应 VIGOUR 加长/特殊腿长型号",
                )
            items.append(item)


def fitok_parse_weld_model(series_code, basic_model):
    parts = basic_model.lstrip("-").split("-")
    family = parts[0]
    size_tokens = [part for part in parts[1:] if part.startswith(("TB", "MTB"))]
    if not size_tokens:
        return None

    primary, source_size, primary_label = fitok_size_from_token(size_tokens[0])
    secondary_token = size_tokens[-1] if len(set(size_tokens)) > 1 else None
    secondary = None
    secondary_label = ""
    if secondary_token:
        secondary, secondary_source, secondary_label = fitok_size_from_token(secondary_token)
        source_size = f"{source_size}x{secondary_source}"
    if not primary or (secondary_token and not secondary):
        return None

    reducing = secondary is not None and secondary != primary
    if series_code == "M":
        product_map = {
            "WL1": ("RE" if reducing else "UE", "Reducing elbow" if reducing else "90 degree elbow"),
            "WU1": ("RU", "Reducing union"),
            "WT1": ("RT" if reducing else "UT", "Reducing tee" if reducing else "Union tee"),
            "WC1": ("CU", "Union cross"),
            "WV1": ("VE", "45 degree elbow"),
            "WB1": ("TB", "Tribow"),
        }
        vigour_series = "VMW"
    else:
        product_map = {
            "WL2": ("RLE" if reducing else "LE", "Reducing long elbow" if reducing else "Long elbow"),
            "WU2": ("RLU", "Reducing long union"),
            "WT2": ("RLT" if reducing else "LT", "Reducing long tee" if reducing else "Long tee"),
        }
        vigour_series = "VTW"

    product = product_map.get(family)
    if not product:
        return None
    product_code, product_label = product
    target = f"{vigour_series}-{product_code}{primary}"
    if reducing:
        target += f"-{secondary}"
    elif product_code == "VE":
        target += "-R45"

    extra_parts = [part for part in parts[1:] if not part.startswith(("TB", "MTB"))]
    variant_code = "-".join(extra_parts) if extra_parts else "STD"
    variant_label = "Standard"
    if extra_parts:
        variant_label = "Special leg/length"
    size_label = primary_label if not secondary else f"{primary_label} x {secondary_label}"
    return target, product_code, product_label, source_size, size_label, variant_code, variant_label


def fitok_parse_fr_model(basic_model):
    parts = basic_model.lstrip("-").split("-")
    if len(parts) < 2:
        return None
    product = parts[0]
    face_match = re.fullmatch(r"FR(\d+)", parts[1])
    if not face_match:
        return None
    face_size = face_match.group(1)
    size_code = face_size
    size_label = label_for_size(face_size)
    variant_parts = parts[2:]
    target = None
    product_label = ""

    tube_tokens = [part for part in variant_parts if part.startswith(("TB", "MTB"))]
    tube_size = None
    tube_label = ""
    if tube_tokens:
        tube_size, source_tube_size, tube_label = fitok_size_from_token(tube_tokens[0])
        if not tube_size:
            return None
        size_code = f"{face_size}x{source_tube_size}"
        size_label = f"FR {label_for_size(face_size)} x {tube_label}"

    if product in ("G", "AG") and tube_size:
        short_gland = any(part.endswith("S") for part in variant_parts)
        target_product = "FG" if short_gland else "MG"
        target = f"VVR-{target_product}{face_size}-TB{tube_size}"
        product_label = "Short gland" if short_gland else "Long gland"
    elif product == "C":
        target, product_label = f"VVR-C{face_size}", "Cap"
    elif product == "PG":
        target, product_label = f"VVR-P{face_size}", "Plug"
    elif product == "N":
        target, product_label = f"VVR-FN{face_size}", "Female nut"
    elif product == "MN":
        target, product_label = f"VVR-MN{face_size}", "Male nut"
    elif product == "U" and any(part.startswith("FR") for part in variant_parts):
        secondary = next(re.fullmatch(r"FR(\d+)", part).group(1) for part in variant_parts if re.fullmatch(r"FR(\d+)", part))
        target, product_label = f"VVR-RMU{face_size}-{secondary}", "Reducing union"
        size_code = f"{face_size}x{secondary}"
        size_label = f"{label_for_size(face_size)} x {label_for_size(secondary)}"
    elif product == "U" and not variant_parts:
        target, product_label = f"VVR-MU{face_size}", "Union body"
    elif product == "LU":
        target, product_label = f"VVR-MUE{face_size}", "Union elbow"
    elif product == "TTT":
        target, product_label = f"VVR-MUT-{face_size}", "Union tee"
    elif product == "RU":
        secondary = next((re.fullmatch(r"FR(\d+)", part).group(1) for part in variant_parts if re.fullmatch(r"FR(\d+)", part)), None)
        if secondary:
            target, product_label = f"VVR-RMU{face_size}-{secondary}", "Female reducing union"
    elif product == "RA":
        secondary = next((re.fullmatch(r"FR(\d+)", part).group(1) for part in variant_parts if re.fullmatch(r"FR(\d+)", part)), None)
        if secondary:
            target, product_label = f"VVR-RA{face_size}-{secondary}", "Reducing adapter"
    elif product == "RB":
        secondary = next((re.fullmatch(r"FR(\d+)", part).group(1) for part in variant_parts if re.fullmatch(r"FR(\d+)", part)), None)
        if secondary:
            target, product_label = f"VVR-RB{face_size}-{secondary}", "Reducing bushing"
    elif product == "BU":
        target, product_label = f"VVR-MBU{face_size}", "Bulkhead union"
    elif product == "BW" and tube_size:
        target, product_label = f"VVR-TBBC{face_size}-TB{tube_size}", "Bulkhead tube butt weld"
    elif product == "CM":
        thread = next((part for part in variant_parts if part.startswith("NS")), None)
        if thread:
            target, product_label = f"VVR-MC{face_size}-M{thread[2:]}", "Male NPT connector"
    elif product == "CMB":
        thread = next((part for part in variant_parts if part.startswith("NS")), None)
        if thread:
            target, product_label = f"VVR-MBC{face_size}-M{thread[2:]}", "Bulkhead male connector"
    elif product == "U":
        fitting = next((part for part in variant_parts if part.startswith("FL")), None)
        if fitting:
            target, product_label = f"VVR-TFC{face_size}-{fitting[2:].zfill(2)}", "Tube fitting connector"
    elif product == "UB":
        fitting = next((part for part in variant_parts if part.startswith("FL")), None)
        if fitting:
            target, product_label = f"VVR-TFBC{face_size}-{fitting[2:].zfill(2)}", "Bulkhead tube fitting connector"

    if not target:
        return None
    variant_code = "-".join(variant_parts) if variant_parts else "STD"
    return target, product, product_label, size_code, size_label, variant_code, variant_code


def build_fitok_special_items(rows):
    items = []
    for (
        source_model,
        vigour_model,
        product_code,
        product_label,
        size_code,
        size_label,
        variant_code,
        variant_label,
    ) in FITOK_SPECIAL_MODELS:
        candidate = find_vigour_model(rows, vigour_model)
        if not candidate:
            material_code = source_model.split("-", 1)[0]
            process_code = "F3" if source_model.endswith("-F3") else "F2" if source_model.endswith("-F2") else "STD"
            items.append(build_guarded_no_match(
                "FITOK",
                source_model,
                "特殊规则引用的 VIGOUR 目标型号不存在",
                seriesCode="FR",
                seriesLabel="Metal Gasket Face Seal FR Series",
                productCode=product_code,
                productLabel=product_label,
                sizeCode=size_code,
                sizeLabel=size_label,
                variantCode=variant_code,
                variantLabel=variant_label,
                materialCode=material_code,
                materialLabel=dict(FITOK_MATERIALS).get(material_code, material_code),
                processCode=process_code,
                processLabel=dict(FITOK_PROCESSES)[process_code],
            ))
            continue
        material_code = source_model.split("-", 1)[0]
        process_code = "F3" if source_model.endswith("-F3") else "F2" if source_model.endswith("-F2") else "STD"
        process_label = dict(FITOK_PROCESSES)[process_code]
        material_label = dict(FITOK_MATERIALS).get(material_code, material_code)
        target_model = (
            with_semiconductor_process(candidate["vigour_model"])
            if process_code == "F3"
            else candidate["vigour_model"]
        )
        exact_feature = source_model in (
            "6L-GT-FR4-UP-05M",
            "6L-GT-FR8-A-UP",
            "6LV-R-FR4-040",
            "6LV-R-FR4-080",
            "6LV-R-FR4-100",
        )
        item = add_common(
            candidate,
            "FITOK",
            source_model,
            target_model,
            "Catalog-derived FITOK special candidate",
            "按 FITOK FR 特殊垫片和流量限制器目录整理；孔径、过滤精度、材料和特殊结构必须逐项复核。",
        )
        item.update(
            {
                "seriesCode": "FR",
                "seriesLabel": "Metal Gasket Face Seal FR Series",
                "productCode": product_code,
                "productLabel": product_label,
                "sizeCode": size_code,
                "sizeLabel": size_label,
                "variantCode": variant_code,
                "variantLabel": variant_label,
                "materialCode": material_code,
                "materialLabel": material_label,
                "processCode": process_code,
                "processLabel": process_label,
                "materialMatched": material_code == "6L",
                "treatmentMatched": process_code in ("STD", "F3"),
                "targetMaterialLabel": candidate.get("material", ""),
                "targetTreatmentLabel": (
                    "VS001A / UHP P option"
                    if process_code == "F3"
                    else candidate.get("surface_finish") or candidate.get("process_spec", "")
                ),
                "specialFeatureMatched": exact_feature,
                "specialFeatureLabel": variant_label,
                "targetFeatureLabel": target_model,
                "dimensionConfirmation": True,
            }
        )
        items.append(item)
    return items


def build_fitok_items(rows):
    items = []
    catalogs = fitok_catalog_models()
    for series_code in ("M", "L"):
        series_label = "Micro Weld M Series" if series_code == "M" else "Tube Butt Weld L Series"
        for basic_model in catalogs.get(series_code, []):
            parsed = fitok_parse_weld_model(series_code, basic_model)
            if not parsed:
                items.extend(build_fitok_no_match_items(
                    basic_model,
                    series_code,
                    series_label,
                    f"{series_code} 系列目录型号无法解析",
                ))
                continue
            fitok_add_item(items, rows, basic_model, *(
                (parsed[0], series_code, series_label) + parsed[1:]
            ))

    for basic_model in catalogs.get("FR", []):
        parsed = fitok_parse_fr_model(basic_model)
        if not parsed:
            items.extend(build_fitok_no_match_items(
                basic_model,
                "FR",
                "Metal Gasket Face Seal FR Series",
                "FR 系列目录型号无法解析",
            ))
            continue
        fitok_add_item(
            items,
            rows,
            basic_model,
            parsed[0],
            "FR",
            "Metal Gasket Face Seal FR Series",
            *parsed[1:],
        )
    items.extend(build_fitok_special_items(rows))
    return items


def build_superlok_items(rows):
    items = []
    for base_model in superlok_catalog_base_models():
        parsed = superlok_parse_base_model(base_model)
        if not parsed:
            items.append(build_guarded_no_match(
                "SUPERLOK",
                base_model,
                "目录型号无法解析",
            ))
            continue
        candidate = superlok_choose_weld_candidate(rows, parsed) or superlok_choose_face_candidate(rows, parsed)
        if not candidate:
            items.extend(build_superlok_no_match_items(
                base_model,
                parsed,
                "缺少 VIGOUR 目标型号",
            ))
            continue
        superlok_add_item(items, rows, candidate, base_model, parsed)
    return items


def dedupe(items):
    seen = {}
    out = []
    for item in items:
        key = (item["brand"], item["sourceModel"], item["vigourModel"])
        if key in seen:
            safety_fields = (
                "noMatch",
                "advisoryModel",
                "materialMatched",
                "treatmentMatched",
                "finishMatched",
                "specialFeatureMatched",
                "dimensionConfirmation",
                "salesStatus",
                "missingParameters",
            )

            def safety_value(record, field):
                value = record.get(field)
                if isinstance(value, list):
                    return tuple(sorted(value))
                return value

            existing = seen[key]
            conflicts = {
                field: (safety_value(existing, field), safety_value(item, field))
                for field in safety_fields
                if safety_value(existing, field) != safety_value(item, field)
            }
            if conflicts:
                raise ValueError(f"Conflicting duplicate mapping metadata: {key} -> {conflicts}")
            continue
        seen[key] = item
        out.append(item)
    return out


def suppress_redundant_no_match_guards(items):
    matched_sources = {
        (item["brand"], item["sourceModel"])
        for item in items
        if item.get("vigourModel") and not item.get("noMatch")
    }
    return [
        item
        for item in items
        if not item.get("noMatch")
        or (item["brand"], item["sourceModel"]) not in matched_sources
    ]


def apply_length_variant_dimension_confirmation(items):
    for item in items:
        if item.get("noMatch"):
            continue
        target_model = item.get("vigourModel", "")
        if (
            re.search(r"-L\d", target_model)
            and item.get("dimensionEvidenceStatus") != "within_tolerance"
        ):
            item["dimensionConfirmation"] = True
    return items


ALLOWED_DIMENSION_EVIDENCE_STATUSES = set(FAMILY_COMPARISON_RULES["statusVocabulary"])


def apply_dimension_evidence_defaults(items):
    legacy_statuses = {
        "catalog_within_tolerance": "within_tolerance",
        "catalog_dimension_difference": "out_of_tolerance",
    }
    for item in items:
        status = legacy_statuses.get(
            item.get("dimensionEvidenceStatus"),
            item.get("dimensionEvidenceStatus"),
        )
        if not status:
            if item.get("vigourModel") and not item.get("noMatch"):
                status = "needs_manual_review"
                item["dimensionEvidenceReason"] = "源品牌与 VIGOUR 的适用目录尺寸尚未建立完整比较证据"
                item["familyRule"] = "non_gland_family.unconfirmed.v1"
            else:
                status = "not_comparable"
                item["dimensionEvidenceReason"] = "当前记录没有可比较的 VIGOUR 目标型号"
                item["familyRule"] = "not_applicable.no_target.v1"
        if status not in ALLOWED_DIMENSION_EVIDENCE_STATUSES:
            raise ValueError(f"Unsupported dimension evidence status: {status}")
        item["dimensionEvidenceStatus"] = status
        if item.get("vigourModel") and status != "within_tolerance":
            item["dimensionConfirmation"] = True
    return items


def to_js(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def build_generation_audit(items):
    skip_by_key = {
        (
            event["stage"],
            event["brand"],
            event["sourceModel"],
            event["targetModel"],
            event["reason"],
        ): event
        for event in GENERATION_SKIP_EVENTS
    }
    recorded_skips = sorted(
        skip_by_key.values(),
        key=lambda event: (
            event["brand"],
            event["stage"],
            event["sourceModel"],
            event["targetModel"],
        ),
    )
    guarded_by_key = {}
    for item in items:
        if not item.get("noMatch"):
            continue
        key = (item["brand"], item["sourceModel"])
        guarded_by_key[key] = {
            "brand": item["brand"],
            "sourceModel": item["sourceModel"],
            "advisoryModel": item.get("advisoryModel", ""),
            "reason": item.get("note", "暂时没有匹配产品，请联系工厂确认。"),
        }
    guarded_no_matches = sorted(
        guarded_by_key.values(),
        key=lambda item: (item["brand"], item["sourceModel"]),
    )

    def count_by(records, field):
        counts = {}
        for record in records:
            value = record[field]
            counts[value] = counts.get(value, 0) + 1
        return dict(sorted(counts.items()))

    return {
        "schemaVersion": 1,
        "summary": {
            "mappingCount": len(items),
            "matchedMappingCount": sum(not item.get("noMatch") for item in items),
            "guardedNoMatchCount": len(guarded_no_matches),
            "recordedSkippedSourceCount": len(recorded_skips),
            "skipCountByStage": count_by(recorded_skips, "stage"),
            "skipCountByBrand": count_by(recorded_skips, "brand"),
            "noMatchCountByBrand": count_by(guarded_no_matches, "brand"),
            "dimensionStatusCounts": dict(sorted({
                status: sum(item.get("dimensionEvidenceStatus") == status for item in items)
                for status in ALLOWED_DIMENSION_EVIDENCE_STATUSES
            }.items())),
        },
        "recordedSkippedSources": recorded_skips,
        "guardedNoMatches": guarded_no_matches,
    }


def write_generation_audit(items):
    audit = build_generation_audit(items)
    AUDIT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_OUTPUT.write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return audit


def compact_items(items):
    statuses = []
    notes = []
    compacted = []

    def index_for(values, value):
        if value not in values:
            values.append(value)
        return values.index(value)

    for item in items:
        compacted_item = dict(item)
        status = compacted_item.pop("status", "")
        note = compacted_item.pop("note", "")
        compacted_item["s"] = index_for(statuses, status)
        compacted_item["n"] = index_for(notes, note)
        compacted.append(compacted_item)

    return statuses, notes, compacted


def validate_fujikin_cap_plug_mappings(items):
    expected = {
        "UJR-JC-3.2": "VVR-P2",
        "UJR-JC-6.35": "VVR-P4",
        "UJR-JC-9.52": "VVR-P8",
        "UJR-JP-6.35": "VVR-C4",
        "UJR-JP-9.52": "VVR-C8",
    }
    base_mappings = {
        item["sourceModel"]: item["vigourModel"]
        for item in items
        if item["brand"] == "FUJIKIN" and item["sourceModel"] in expected
    }
    if base_mappings != expected:
        raise ValueError(f"FUJIKIN cap/plug mappings invalid: {base_mappings}")

    for item in items:
        if item["brand"] != "FUJIKIN":
            continue
        source_model = item["sourceModel"]
        vigour_model = item["vigourModel"]
        if source_model.startswith("UJR-JC-") and not vigour_model.startswith("VVR-P"):
            raise ValueError(f"FUJIKIN JC external-thread plug mapped outside VVR-P: {source_model} -> {vigour_model}")
        if source_model.startswith("UJR-JP-") and not vigour_model.startswith("VVR-C"):
            raise ValueError(f"FUJIKIN JP internal-thread cap mapped outside VVR-C: {source_model} -> {vigour_model}")


def validate_fujikin_full_mappings(items):
    fujikin_items = [item for item in items if item["brand"] == "FUJIKIN"]
    grouped = {}
    for item in fujikin_items:
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])
    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous FUJIKIN mappings: {ambiguous}")

    expected = {
        "UJR-6.35MS-L28-AW": "VVR-FG4-TB4",
        "UJR-9.52MS-L28.5-AW": "VVR-FG8-TB6",
        "UJR-12.7MS-L28.5-AW": "VVR-FG8-TB8",
        "UJR-6.35X9.52N": "HVVR-FN4",
    }
    actual = {
        item["sourceModel"]: item["vigourModel"]
        for item in fujikin_items
        if item["sourceModel"] in expected
    }
    if actual != expected:
        raise ValueError(f"FUJIKIN reference mappings invalid: {actual}")

    for item in fujikin_items:
        source_model = item["sourceModel"]
        target_model = item["vigourModel"]
        if item.get("noMatch"):
            continue
        if re.match(r"^UJR-(?:6\.35|9\.52|12\.7)MS-L28(?:\.5)?-AW", source_model):
            if not target_model.startswith("VVR-FG"):
                raise ValueError(f"FUJIKIN short/female gland mapped outside VVR-FG: {source_model} -> {target_model}")
        material_code = item.get("materialCode")
        treatment_code = item.get("treatmentCode")
        if material_code == "SUS316L":
            if item.get("materialMatched") is not True or target_model.endswith("-SLV"):
                raise ValueError(f"FUJIKIN SUS316L material mapping invalid: {source_model} -> {target_model}")
        elif material_code == "316LM":
            expected_match = target_model.endswith("-SLV")
            if item.get("materialMatched") is not expected_match:
                raise ValueError(f"FUJIKIN 316LM material flag invalid: {source_model} -> {target_model}")
        elif material_code == "FS9" and item.get("materialMatched") is not False:
            raise ValueError(f"FUJIKIN FS9 mismatch was not flagged: {source_model}")

        expected_treatment_match = treatment_code == "STD"
        if item.get("treatmentMatched") is not expected_treatment_match:
            raise ValueError(f"FUJIKIN treatment flag invalid: {source_model}")


def validate_other_brand_cap_plug_mappings(items):
    for item in items:
        brand = item["brand"]
        source_model = item["sourceModel"]
        vigour_model = item["vigourModel"]

        if brand == "Swagelok":
            connection = item.get("connectionCode")
            if connection == "CP" and not vigour_model.startswith("VVR-C"):
                raise ValueError(f"Swagelok cap mapped outside VVR-C: {source_model} -> {vigour_model}")
            if connection == "P" and not vigour_model.startswith("VVR-P"):
                raise ValueError(f"Swagelok plug mapped outside VVR-P: {source_model} -> {vigour_model}")

        if brand == "JSK" and item.get("productCode") in ("CP", "PG"):
            expected = f"VVR-{'C' if item['productCode'] == 'CP' else 'P'}{item['sizeCode']}"
            if vigour_model != expected:
                raise ValueError(f"JSK standard cap/plug mapped to option variant: {source_model} -> {vigour_model}")

        if brand == "TK-Fujikin" and item.get("productCode") in ("CP", "PG"):
            if item.get("noMatch"):
                continue
            prefix = "C" if item["productCode"] == "CP" else "P"
            cable = "-C" in source_model
            expected = f"VVR-{prefix}{TK_FACE_SIZE.get(item['sizeCode'], (item['sizeCode'], item['sizeCode']))[0]}"
            if cable:
                expected += "-L"
            if vigour_model not in (expected, f"{expected}-P", f"{expected}-SLV"):
                raise ValueError(f"TK-Fujikin cap/plug variant invalid: {source_model} -> {vigour_model}, expected {expected}")

        if brand == "SUPERLOK" and item.get("productCode") in ("CP", "PG", "PGC"):
            prefix = "C" if item["productCode"] == "CP" else "P"
            expected = f"VVR-{prefix}{TK_FACE_SIZE.get(item['sizeCode'], (item['sizeCode'], item['sizeCode']))[0]}"
            if item["productCode"] == "PGC":
                expected += "-L"
            if vigour_model != expected:
                raise ValueError(f"SUPERLOK cap/plug variant invalid: {source_model} -> {vigour_model}, expected {expected}")


def validate_superlok_full_mappings(items):
    family_patterns = {
        "BG": r"^VVR-BG",
        "BGT": r"^VVR-GK-G.+-BL$",
        "BHMC": r"^VVR-MBC",
        "BHSC": r"^VVR-TFBC",
        "BHU": r"^VVR-MBU",
        "CP": r"^VVR-C",
        "CR": r"^VMW-CU",
        "E": r"^(?:VMW-(?:UE|RE)|VTW-(?:LE|RLE))",
        "FC": r"^VVR-MC.+-F",
        "FG": r"^VVR-FG",
        "FN": r"^VVR-FN",
        "FRU": r"^VVR-FU",
        "GR": r"^VVR-GKR",
        "GT": r"^VVR-GK",
        "HE": r"^VMW-VE",
        "HFN": r"^HVVR-FN",
        "HMN": r"^HVVR-MN",
        "MC": r"^VVR-MC",
        "ME": r"^VVR-MEC",
        "MG": r"^VVR-MG",
        "MN": r"^VVR-MN",
        "MNS": r"^VVR-MN",
        "MRU": r"^VVR-RMU",
        "MU": r"^VVR-MU",
        "MWG": r"^VVR-MG",
        "PG": r"^VVR-P",
        "PGC": r"^VVR-P.+-L",
        "R": r"^(?:VMW-RU|VTW-RLU)",
        "RA": r"^VVR-RA",
        "RB": r"^VVR-RB",
        "RSLG": r"^VVR-MG",
        "SC": r"^VVR-TFC",
        "SLG": r"^VVR-MG",
        "SSG": r"^VVR-FG",
        "T": r"^(?:VMW-(?:UT|RT)|VTW-(?:LT|RLT))",
        "TA": r"^VVR-MTA",
        "TB": r"^VMW-TB",
        "TBHC": r"^VVR-TBBC",
        "TC": r"^VVR-TBBC",
        "UC": r"^VVR-MUC",
        "UE": r"^VVR-MUE",
        "UT": r"^VVR-MUT",
    }

    for item in items:
        if item["brand"] != "SUPERLOK" or item.get("noMatch"):
            continue
        product_code = item.get("productCode")
        target_model = item["vigourModel"]
        pattern = family_patterns.get(product_code)
        if not pattern:
            raise ValueError(f"SUPERLOK product family is not validated: {product_code} / {item['sourceModel']}")
        if not re.match(pattern, target_model):
            raise ValueError(
                f"SUPERLOK product family mismatch: {item['sourceModel']} ({product_code}) -> {target_model}"
            )

        material_code = item.get("materialCode")
        if material_code == "SM" and "-SLV" in target_model:
            raise ValueError(f"SUPERLOK SM material mapped to SLV: {item['sourceModel']} -> {target_model}")
        if material_code == "DM":
            expected_match = "-SLV" in target_model
            if item.get("materialMatched") is not expected_match:
                raise ValueError(f"SUPERLOK DM material flag invalid: {item['sourceModel']} -> {target_model}")


def validate_jsk_micro_reference_mappings(items):
    expected = {
        "ME124SEP": "VMW-RE12-4",
        "ME126SEP": "VMW-RE12-6",
        "ME128SEP": "VMW-RE12-8",
        "MEF4SEP": "VMW-VE4-R45",
        "MEF6SEP": "VMW-VE6-R45",
        "MEF8SEP": "VMW-VE8-R45",
        "MEF12SEP": "VMW-VE12-R45",
        "MT124SEP": "VMW-RT12-4",
        "MT126SEP": "VMW-RT12-6",
        "MT128SEP": "VMW-RT12-8",
        "MTB12SEP": "VMW-TB12",
    }
    actual = {
        item["sourceModel"]: item["vigourModel"]
        for item in items
        if item["brand"] == "JSK" and item["sourceModel"] in expected
    }
    if actual != expected:
        raise ValueError(f"JSK Micro reference mappings invalid: {actual}")


def validate_jsk_full_mappings(items):
    jsk_items = [item for item in items if item["brand"] == "JSK"]
    grouped = {}
    for item in jsk_items:
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])
        material_code = item.get("materialCode")
        is_secondary = "-SLV" in item["vigourModel"]
        if material_code == "S" and is_secondary:
            raise ValueError(f"JSK S material mapped to SLV: {item['sourceModel']} -> {item['vigourModel']}")
        if material_code == "V" and not is_secondary:
            raise ValueError(f"JSK V material mapped without SLV: {item['sourceModel']} -> {item['vigourModel']}")
        if item.get("finishCode") in ("EP", "BA"):
            expected_finish_match = item["finishCode"] == vigour_finish_code(item["vigourModel"])
            if item.get("finishMatched") is not expected_finish_match:
                raise ValueError(f"JSK finish flag invalid: {item['sourceModel']} -> {item['vigourModel']}")
        if item.get("finishCode") == "EP" and item["vigourModel"].endswith("-P"):
            raise ValueError(f"JSK EP incorrectly mapped to semiconductor P: {item['sourceModel']} -> {item['vigourModel']}")
    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous JSK mappings: {ambiguous}")


def validate_tk_fujikin_full_mappings(items):
    tk_items = [item for item in items if item["brand"] == "TK-Fujikin"]
    grouped = {}
    for item in tk_items:
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])
        target_model = item["vigourModel"]
        if item.get("noMatch"):
            if target_model or item.get("note") != "暂时没有匹配产品，请联系工厂确认。":
                raise ValueError(f"TK-Fujikin no-match result invalid: {item['sourceModel']}")
            continue
        if item.get("productCode") in TK_GASKET_PRODUCTS and item.get("materialCode") in ("US", "UN"):
            expected_material_match = ("-NI" in target_model) == (item.get("materialCode") == "UN")
        else:
            expected_material_match = item.get("materialCode") == "S" or "-SLV" in target_model
        expected_finish_match = (
            item.get("finishCode") == vigour_finish_code(target_model)
            or (item.get("finishCode") == "STD" and item.get("productCode") in TK_GASKET_PRODUCTS)
        )
        if item.get("materialMatched") is not expected_material_match:
            raise ValueError(f"TK-Fujikin material flag invalid: {item['sourceModel']} -> {target_model}")
        if item.get("finishMatched") is not expected_finish_match:
            raise ValueError(f"TK-Fujikin finish flag invalid: {item['sourceModel']} -> {target_model}")
    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous TK-Fujikin mappings: {ambiguous}")

    confirmed_length_ba = {
        "S4LG10": "VVR-MG4-TB4-L33-BA",
        "S4LG6": "VVR-MG4-TB4-L30-BA",
        "S4SG10": "VVR-FG4-TB4-L18-BA",
        "S4SG6": "VVR-FG4-TB4-L15-BA",
        "S6SG6": "VVR-FG8-TB6-L15-BA",
        "S8SG10": "VVR-FG8-TB8-L18-BA",
        "S8SG6": "VVR-FG8-TB8-L15-BA",
        "S8x4SG10": "VVR-FG8-TB8-L18-BA",
        "S8x4SG6": "VVR-FG8-TB8-L15-BA",
    }
    actual_length_ba = {
        item["sourceModel"]: item["vigourModel"]
        for item in tk_items
        if item["sourceModel"] in confirmed_length_ba
    }
    if actual_length_ba != confirmed_length_ba:
        raise ValueError(f"TK-Fujikin confirmed length BA mappings invalid: {actual_length_ba}")

    malformed_ep_models = [
        item["sourceModel"]
        for item in tk_items
        if item.get("finishCode") == "EP" and not item["sourceModel"].endswith("-P")
    ]
    if malformed_ep_models:
        raise ValueError(f"TK-Fujikin EP suffix must use '-P': {malformed_ep_models[:10]}")


def validate_unilok_full_mappings(items):
    vigour_models = {
        row["vigour_model"]
        for row in json.loads(SOURCE.read_text(encoding="utf-8"))["vigour_models"]
    }
    unilok_items = [item for item in items if item["brand"] == "UNILOK"]
    grouped = {}
    for item in unilok_items:
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])
        target_model = item["vigourModel"]
        if item.get("noMatch"):
            if target_model or item.get("note") != "暂时没有匹配产品，请联系工厂确认。":
                raise ValueError(f"UNILOK no-match result invalid: {item['sourceModel']}")
            continue
        target_in_catalog = target_model in vigour_models or (
            target_model.endswith("-BL") and target_model[:-3] in vigour_models
        )
        if not target_in_catalog:
            raise ValueError(f"UNILOK target is not in VIGOUR catalog: {item['sourceModel']} -> {target_model}")
        if item.get("materialCode") == "SM" and "-SLV" in target_model:
            raise ValueError(f"UNILOK SM material mapped to SLV: {item['sourceModel']} -> {target_model}")
        if item.get("materialCode") == "DM":
            expected_match = "-SLV" in target_model
            if item.get("materialMatched") is not expected_match:
                raise ValueError(f"UNILOK DM material flag invalid: {item['sourceModel']} -> {target_model}")
        if item.get("finishCode") == "EP":
            expected_match = vigour_finish_code(target_model) == "EP"
            if item.get("finishMatched") is not expected_match:
                raise ValueError(f"UNILOK EP finish flag invalid: {item['sourceModel']} -> {target_model}")
    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous UNILOK mappings: {ambiguous}")

    expected_lengths = {
        "CMGS-04-DM-EP": "VVR-FG4-TB4-L15-SLV",
        "CSGS-04-DM-EP": "VVR-FG4-TB4-L18-SLV",
        "CMGS-0804-DM-EP": "VVR-FG8-TB4-L15-SLV",
        "CSGS-0804-DM-EP": "VVR-FG8-TB4-L19-SLV",
        "CSGS-0806-DM-EP": "VVR-FG8-TB6-L15-SLV",
        "CMGS-0806-DM-EP": "VVR-FG8-TB6-L15-SLV",
        "CMGS-08-DM-EP": "VVR-FG8-TB8-L15-SLV",
        "CSGS-08-DM-EP": "VVR-FG8-TB8-L18-SLV",
        "CMGL-04-DM-EP": "VVR-MG4-TB4-L30-SLV",
        "CSGL-04-DM-EP": "VVR-MG4-TB4-L33-SLV",
        "CMGL-0804-DM-EP": "VVR-MG8-TB4-L32-SLV",
        "CSGL-0804-DM-EP": "VVR-MG8-TB4-L37-SLV",
        "CSGL-0806-DM-EP": "VVR-MG8-TB6-L32-SLV",
        "CMGL-0806-DM-EP": "VVR-MG8-TB6-L32-SLV",
        "CMGL-08-DM-EP": "VVR-MG8-TB8-L32-SLV",
        "CSGL-08-DM-EP": "VVR-MG8-TB8-L35-SLV",
    }
    actual_lengths = {
        item["sourceModel"]: item["vigourModel"]
        for item in unilok_items
        if item["sourceModel"] in expected_lengths
    }
    if actual_lengths != expected_lengths:
        raise ValueError(f"UNILOK gland length mappings invalid: {actual_lengths}")


def validate_jsk_face_mappings(items):
    face_items = [
        item
        for item in items
        if item["brand"] == "JSK" and item.get("seriesCode") in ("T", "TH")
    ]
    grouped = {}
    for item in face_items:
        if " " in item["sourceModel"]:
            raise ValueError(f"JSK VCR model is not compact: {item['sourceModel']}")
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])

        material_code = item.get("materialCode")
        is_secondary = "-SLV" in item["vigourModel"]
        if material_code == "S" and is_secondary:
            raise ValueError(
                f"JSK single-melt material mapped to secondary remelt: "
                f"{item['sourceModel']} -> {item['vigourModel']}"
            )
        if material_code == "V" and not is_secondary:
            raise ValueError(
                f"JSK VIM/VAR material mapped outside secondary remelt: "
                f"{item['sourceModel']} -> {item['vigourModel']}"
            )
        if material_code == "S" and item.get("materialLabel") != "Single melt 316L":
            raise ValueError(f"JSK S material label invalid: {item['sourceModel']}")
        if material_code == "V" and item.get("materialLabel") != "316L VIM/VAR":
            raise ValueError(f"JSK V material label invalid: {item['sourceModel']}")

    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous JSK VCR mappings: {ambiguous}")

    blind_expected = {
        f"TBG{size}{material}": with_blind_suffix(
            f"VVR-GK-G{size}{'-NI' if material == 'NI' else ''}"
        )
        for size in ("2", "4", "8", "12", "16")
        for material in ("SS", "NI")
    }
    blind_actual = {
        item["sourceModel"]: item["vigourModel"]
        for item in face_items
        if item.get("productCode") == "BG"
    }
    if blind_actual != blind_expected:
        raise ValueError(f"JSK blind gasket mappings invalid: {blind_actual}")


def validate_swagelok_reference_mappings(items):
    expected = {
        "6LV-4-HVCR-1-6TB7": "HVVR-MG4-TB6-SLV",
        "316L-4-HVCR-1A6": "HVVR-AHG4-TW6",
        "6LV-4-HVCR-61-6TB7": "HVVR-BMG4-TB6-SLV",
        "SS-4-HVCR-1SR": "HVVR-FN4",
        "SS-4-HVCR-4SR": "HVVR-MN4",
        "SS-8-VCR-T": "VVR-MUT-8",
        "SS-8-VCR-61": "VVR-MBU8",
        "SS-4-VCR-CP": "VVR-C4",
        "NI-4-VCR-2-GR-VS": "VVR-GKR-G4-NI",
        "NI-8-VCR-2-GR-VS": "VVR-GKR-G8-NI",
        "SS-4-VCR-6-DM-2": "VVR-RMU4-2",
        "SS-8-VCR-6-DM-4": "VVR-RMU8-4",
        "SS-4-VCR-6-200": "VVR-TFC4-02",
        "SS-4-VCR-6-400": "VVR-TFC4-04",
        "SS-8-VCR-6-600": "VVR-TFC8-06",
        "SS-8-VCR-6-810": "VVR-TFC8-08",
        "SS-4-VCR-61S": "VVR-MBU4-L46",
        "SS-8-VCR-61S": "VVR-MBU8-L54",
        "SS-8-VCR-9": "VVR-MUE8",
        "SS-8-VCR-CS": "VVR-MUC8",
        "SS-8-VCR-CG": "VVR-FU8",
        "316L-4-ATW-6-400": "VWR-FG4-04",
        "316L-6-ATW-6-600": "VWR-FG4-06",
        "316L-8-ATW-6-810": "VWR-FG8-08",
        "SS-4-VCR-3-BL": "VVR-BG4",
        "SS-8-VCR-3-BL": "VVR-BG8",
        "SS-12-VCR-3-BL": "VVR-BG12",
        "SS-16-VCR-3-BL": "VVR-BG16",
        "SS-4-VCR-2-VS-BL": "VVR-GK-G4-BL",
        "SS-4-VCR-2-GR-VS-BL": "VVR-GKR-G4-BL",
        "NI-4-VCR-2-VS-BL": "VVR-GK-G4-NI-BL",
        "NI-4-VCR-2-GR-VS-BL": "VVR-GKR-G4-NI-BL",
    }
    actual = {}
    for source_model, vigour_model in expected.items():
        matches = [
            item["vigourModel"]
            for item in items
            if item["brand"] == "Swagelok" and item["sourceModel"] == source_model
        ]
        if len(matches) != 1:
            raise ValueError(f"Swagelok reference model is not unique: {source_model} -> {matches}")
        actual[source_model] = matches[0]
    if actual != expected:
        raise ValueError(f"Swagelok reference mappings invalid: {actual}")

    by_source = {item["sourceModel"]: item for item in items if item["brand"] == "Swagelok"}
    extracted_artifacts = {
        "316L-4-HVCR-1A65",
        "6LV-4-HVCR-1-6TB75",
        "6LV-4-HVCR-61-6TB73",
        "SS-4-HVCR-4SR5",
        "SS-4-HVCR-91",
        "SS-4-HVCR-T1",
    }
    leaked_artifacts = extracted_artifacts.intersection(by_source)
    if leaked_artifacts:
        raise ValueError(
            f"Swagelok HVCR table dimensions leaked into model codes: "
            f"{sorted(leaked_artifacts)}"
        )

    for source_model in ("SS-4-HVCR-1SR", "SS-4-HVCR-4SR"):
        item = by_source[source_model]
        if (
            item.get("noMatch")
            or item.get("dimensionConfirmation") is not True
            or item.get("connectionCode") not in ("1SR", "4SR")
        ):
            raise ValueError(f"Swagelok HVCR SR mapping invalid: {source_model}")

    hvcr_body_expectations = {
        "6LV-4-HVCR-1-6TB7": ("High-flow tube butt weld body", "1-TBW", "6TB7"),
        "316L-4-HVCR-1A6": ("High-flow automatic tube weld body", "1-ATW", "6TW"),
        "6LV-4-HVCR-61-6TB7": ("High-flow tube butt weld bulkhead body", "61", "6TB7"),
    }
    for source_model, (product_name, connection_code, tube_code) in hvcr_body_expectations.items():
        item = by_source[source_model]
        if (
            item.get("noMatch")
            or item.get("productName") != product_name
            or item.get("connectionCode") != connection_code
            or item.get("tubeCode") != tube_code
            or item.get("dimensionConfirmation") is not False
        ):
            raise ValueError(f"Swagelok HVCR body mapping invalid: {source_model}")

    for source_model in SWAGELOK_ORIFICE_REQUIRED_MODELS:
        item = by_source.get(source_model)
        size = re.match(r"^SS-(\d+)-VCR-6-DM$", source_model).group(1)
        if (
            not item
            or not item.get("noMatch")
            or item.get("vigourModel")
            or item.get("advisoryModel") != f"VVR-MU{size}-DM-[孔径]"
            or item.get("missingParameters") != ["限流孔径"]
            or item.get("salesStatus") != "needs_confirmation"
            or item.get("nextAction") != "请确认限流孔径"
            or item.get("specialFeatureMatched") is not False
        ):
            raise ValueError(f"Swagelok bare DM advisory result invalid: {source_model}")


def validate_swagelok_full_mappings(items):
    swagelok_items = [item for item in items if item["brand"] == "Swagelok"]
    grouped = {}
    for item in swagelok_items:
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])
    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous Swagelok mappings: {ambiguous}")

    for item in swagelok_items:
        source_model = item["sourceModel"]
        target_model = item["vigourModel"]
        if item.get("noMatch"):
            is_orifice_required = source_model in SWAGELOK_ORIFICE_REQUIRED_MODELS
            is_audited_catalog_guard = (
                item.get("sourceAuditStatus") == "catalog_input_guarded"
                and bool(item.get("note"))
            )
            if target_model or (
                not is_orifice_required
                and not is_audited_catalog_guard
                and item.get("note") != "暂时没有匹配产品，请联系工厂确认。"
            ):
                raise ValueError(f"Swagelok no-match result invalid: {source_model}")
            continue
        if re.search(r"(?:MMW|MTB7|MATW)", source_model):
            raise ValueError(f"Unsupported metric Swagelok model was force-mapped: {source_model}")
        if re.search(r"-VCR-3-(?:\d+MA(?:S)?|\d+TSW)$", source_model):
            raise ValueError(f"Unsupported metric/socket gland was force-mapped: {source_model}")
        if item.get("materialCode") == "CU" and item.get("materialMatched") is not False:
            raise ValueError(f"Swagelok copper gasket material mismatch not flagged: {source_model}")
        if item.get("materialCode") == "6LV":
            if re.fullmatch(r"DM-\d{3}P", item.get("tubeCode", "")):
                if "-SLV" in target_model:
                    raise ValueError(
                        f"Swagelok flow restrictor received invented SLV suffix: {source_model} -> {target_model}"
                    )
                continue
            expected_suffix = "-SLV-P" if swagelok_requires_process_p(
                source_model,
                item.get("connectionCode", ""),
            ) else "-SLV"
            if not target_model.endswith(expected_suffix) or item.get("materialMatched") is not True:
                raise ValueError(
                    f"Swagelok 6LV material flag invalid: {source_model} -> {target_model}"
                )
        if item.get("materialCode") == "316L":
            if target_model.endswith("-SLV") or item.get("materialMatched") is not True:
                raise ValueError(
                    f"Swagelok 316L material flag invalid: {source_model} -> {target_model}"
                )

    restrictors = {
        item["sourceModel"]: item
        for item in swagelok_items
        if re.fullmatch(r"6LV-4-VCR-6-DM-\d{3}P", item["sourceModel"])
    }
    if len(restrictors) != 25:
        raise ValueError(f"Swagelok flow restrictor coverage invalid: {len(restrictors)}")
    for source_model, item in restrictors.items():
        orifice = re.search(r"-(\d{3})P$", source_model).group(1)
        target_model = item["vigourModel"]
        if orifice == "065":
            if target_model or not item.get("noMatch"):
                raise ValueError(f"Swagelok 065 restrictor should be no-match: {source_model} -> {target_model}")
            continue
        expected_base = f"VVR-MU4-DM-{orifice}"
        if target_model != f"{expected_base}-P":
            raise ValueError(f"Swagelok restrictor target invalid: {source_model} -> {target_model}")
        if "-SLV" in target_model:
            raise ValueError(f"Swagelok restrictor has invented SLV suffix: {source_model} -> {target_model}")
        if item.get("finishMatched") is not True:
            raise ValueError(f"Swagelok restrictor semiconductor process not applied: {source_model}")

    for item in swagelok_items:
        if item.get("noMatch"):
            continue
        if not swagelok_requires_process_p(item["sourceModel"], item.get("connectionCode", "")):
            continue
        if not item["vigourModel"].endswith("-P") or item.get("finishMatched") is not True:
            raise ValueError(
                f"Swagelok process P not preserved at target suffix: "
                f"{item['sourceModel']} -> {item['vigourModel']}"
            )


def validate_fitok_mappings(items):
    fitok_items = [item for item in items if item["brand"] == "FITOK"]
    if len(fitok_items) < 1200:
        raise ValueError(f"FITOK catalog coverage unexpectedly low: {len(fitok_items)}")

    grouped = {}
    for item in fitok_items:
        grouped.setdefault(item["sourceModel"], set()).add(item["vigourModel"])
    ambiguous = {model: sorted(models) for model, models in grouped.items() if len(models) > 1}
    if ambiguous:
        raise ValueError(f"Ambiguous FITOK mappings: {ambiguous}")

    expected = {
        "6L-WL1-TB4": ("VMW-UE4", True, True),
        "SS-WL1-TB4": ("VMW-UE4", True, True),
        "6L-WL1-TB4-F3": ("VMW-UE4-P", True, True),
        "6LV-WL1-TB4-F3": ("VMW-UE4-SLV-P", True, True),
        "6LW-WT1-TB8-F3": ("VMW-UT8-SLV-P", True, True),
        "6L-WU1-TB8-TB4": ("VMW-RU8-4", True, True),
        "6L-WL2-TB12": ("VTW-LE12", True, True),
        "6LV-G-FR8-TB8-6-F3": ("VVR-MG8-TB8-SLV-P", True, True),
        "6L-N-FR4": ("VVR-FN4", True, True),
        "6L-PG-FR8": ("VVR-P8", True, True),
        "6L-GT-FR4-UP-05M": ("VVR-GKF-G4-0.5", True, True),
        "6L-GT-FR4-A-UP-ID0.3": ("VVR-GKR-G4-DM", True, True),
        "6L-GT-FR8-A-UP": ("VVR-GKR-G8", True, True),
        "6LV-R-FR4-040": ("VVR-MU4-DM-040", False, True),
        "6LV-R-FR4-080": ("VVR-MU4-DM-080", False, True),
        "6LV-R-FR4-100": ("VVR-MU4-DM-100", False, True),
    }
    by_source = {item["sourceModel"]: item for item in fitok_items}
    for source_model, (target, material_matched, treatment_matched) in expected.items():
        item = by_source.get(source_model)
        actual = None if not item else (
            item["vigourModel"],
            item.get("materialMatched"),
            item.get("treatmentMatched"),
        )
        required = (target, material_matched, treatment_matched)
        if actual != required:
            raise ValueError(f"FITOK reference mapping invalid: {source_model} -> {actual}, expected {required}")

    invalid_combinations = [
        item["sourceModel"]
        for item in fitok_items
        if item["sourceModel"] not in {source for source, *_ in FITOK_SPECIAL_MODELS} and (
            item["materialCode"] in ("6LV", "6LW") and item["processCode"] != "F3"
        ) or (
            item["sourceModel"] not in {source for source, *_ in FITOK_SPECIAL_MODELS}
            and item["materialCode"] == "SS"
            and item["processCode"] == "F3"
        )
    ]
    if invalid_combinations:
        raise ValueError(f"FITOK invalid material/process combinations generated: {invalid_combinations[:10]}")

    special_expected = {
        source: with_semiconductor_process(target) if source.endswith("-F3") else target
        for source, target, *_ in FITOK_SPECIAL_MODELS
    }
    special_actual = {
        item["sourceModel"]: item["vigourModel"]
        for item in fitok_items
        if item["sourceModel"] in special_expected
    }
    if special_actual != special_expected:
        raise ValueError(f"FITOK special mappings invalid: {special_actual}")

    for item in fitok_items:
        if item.get("noMatch"):
            continue
        if item.get("processCode") != "F3":
            continue
        if not item["vigourModel"].endswith("-P") or item.get("treatmentMatched") is not True:
            raise ValueError(
                f"FITOK F3 process not mapped to VS001A/P: "
                f"{item['sourceModel']} -> {item['vigourModel']}"
            )
        if (
            item.get("materialCode") in ("6LV", "6LW")
            and item.get("materialMatched") is True
            and not item["vigourModel"].endswith("-SLV-P")
        ):
            raise ValueError(
                f"FITOK remelted F3 suffix order invalid: "
                f"{item['sourceModel']} -> {item['vigourModel']}"
            )


def validate_blind_and_restrictor_mappings(items):
    for item in items:
        if item.get("noMatch"):
            continue
        source_model = item["sourceModel"]
        target_model = item["vigourModel"]
        text = " ".join(
            str(item.get(key, ""))
            for key in ("productLabel", "variantLabel", "specialFeatureLabel")
        ).lower()
        is_blind_gasket = (
            "blind gasket" in text
            or bool(re.search(r"(?:O|VS)-BL(?:-|$)", source_model))
            or item.get("productCode") in ("GB", "BGT", "CGTB")
        )
        if is_blind_gasket:
            if not target_model.endswith("-BL") or "-DM" in target_model:
                raise ValueError(
                    f"Blind gasket must use final BL suffix, not DM: "
                    f"{source_model} -> {target_model}"
                )

        is_restriction_gasket = item["brand"] == "FITOK" and bool(
            re.search(r"-UP-(?:ID|R)", source_model)
        )
        if is_restriction_gasket and (
            "-DM" not in target_model or target_model.endswith("-BL")
        ):
            raise ValueError(
                f"FITOK restriction gasket must use DM structure: "
                f"{source_model} -> {target_model}"
            )


def main():
    reset_generation_audit()
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = data["vigour_models"]
    items = []
    items.extend(build_swagelok_catalog_items(rows))
    items.extend(build_swagelok_weld_items(rows))
    items.extend(build_fujikin_ujr_items(rows))
    items.extend(build_fujikin_uj_weld_items(rows))
    items.extend(build_tk_fujikin_items(rows))
    items.extend(build_unilok_items(rows))
    items.extend(build_superlok_items(rows))
    items.extend(build_fitok_items(rows))
    for row in rows:
        for builder in (build_jsk_face, build_jsk_micro, build_jsk_tube_weld):
            item = builder(row)
            if item:
                items.append(item)
    items.extend(build_jsk_blind_gasket_items(rows))

    items = apply_swagelok_no_match_rules(items)
    items = apply_swagelok_slv_suffix(items)
    items = expand_jsk_finish_options(items)
    items = apply_length_variant_dimension_confirmation(items)
    items = suppress_redundant_no_match_guards(items)
    items = dedupe(sorted(items, key=lambda x: (x["brand"], x["sourceModel"], x["vigourModel"])))
    validate_fujikin_cap_plug_mappings(items)
    validate_fujikin_full_mappings(items)
    validate_other_brand_cap_plug_mappings(items)
    validate_jsk_micro_reference_mappings(items)
    validate_jsk_full_mappings(items)
    validate_jsk_face_mappings(items)
    validate_tk_fujikin_full_mappings(items)
    validate_unilok_full_mappings(items)
    validate_superlok_full_mappings(items)
    validate_fitok_mappings(items)
    validate_swagelok_reference_mappings(items)
    validate_swagelok_full_mappings(items)
    validate_blind_and_restrictor_mappings(items)
    items = apply_dimension_evidence_defaults(items)
    status_texts, note_texts, compacted_items = compact_items(items)
    brand_fields = {
        "Swagelok": [
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "vcrCode", "label": "系列/规格", "placeholder": "请选择系列/规格", "title": "选择系列/规格"},
            {"key": "connectionCode", "label": "接头类型", "placeholder": "请选择接头类型", "title": "选择接头类型"},
            {"key": "tubeCode", "label": "端口/变体", "placeholder": "请选择端口/变体", "title": "选择端口/变体"},
        ],
        "JSK": [
            {"key": "seriesCode", "label": "系列", "placeholder": "请选择系列", "title": "选择系列"},
            {"key": "productCode", "label": "产品", "placeholder": "请选择产品", "title": "选择产品"},
            {"key": "sizeCode", "label": "管径", "placeholder": "请选择管径", "title": "选择管径"},
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "finishCode", "label": "表面处理", "placeholder": "请选择表面处理", "title": "选择表面处理"},
        ],
        "FUJIKIN": [
            {"key": "productCode", "label": "产品", "placeholder": "请选择产品", "title": "选择产品"},
            {"key": "sizeCode", "label": "口径", "placeholder": "请选择口径", "title": "选择口径"},
            {"key": "variantCode", "label": "规格/变体", "placeholder": "请选择规格/变体", "title": "选择规格/变体"},
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "treatmentCode", "label": "内面处理", "placeholder": "请选择内面处理", "title": "选择内面处理"},
        ],
        "TK-Fujikin": [
            {"key": "productCode", "label": "产品", "placeholder": "请选择产品", "title": "选择产品"},
            {"key": "sizeCode", "label": "尺寸", "placeholder": "请选择尺寸", "title": "选择尺寸"},
            {"key": "variantCode", "label": "规格/变体", "placeholder": "请选择规格/变体", "title": "选择规格/变体"},
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "finishCode", "label": "表面处理", "placeholder": "请选择表面处理", "title": "选择表面处理"},
        ],
        "SUPERLOK": [
            {"key": "productCode", "label": "产品", "placeholder": "请选择产品", "title": "选择产品"},
            {"key": "sizeCode", "label": "尺寸", "placeholder": "请选择尺寸", "title": "选择尺寸"},
            {"key": "variantCode", "label": "规格/变体", "placeholder": "请选择规格/变体", "title": "选择规格/变体"},
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "finishCode", "label": "表面处理", "placeholder": "请选择表面处理", "title": "选择表面处理"},
        ],
        "UNILOK": [
            {"key": "productCode", "label": "产品", "placeholder": "请选择产品", "title": "选择产品"},
            {"key": "sizeCode", "label": "尺寸", "placeholder": "请选择尺寸", "title": "选择尺寸"},
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "finishCode", "label": "表面处理", "placeholder": "请选择表面处理", "title": "选择表面处理"},
        ],
        "FITOK": [
            {"key": "seriesCode", "label": "系列", "placeholder": "请选择系列", "title": "选择系列"},
            {"key": "productCode", "label": "产品", "placeholder": "请选择产品", "title": "选择产品"},
            {"key": "sizeCode", "label": "尺寸", "placeholder": "请选择尺寸", "title": "选择尺寸"},
            {"key": "materialCode", "label": "材质", "placeholder": "请选择材质", "title": "选择材质"},
            {"key": "processCode", "label": "工艺", "placeholder": "请选择工艺", "title": "选择工艺"},
        ],
    }
    mapping_fields = list(dict.fromkeys(key for item in compacted_items for key in item))
    string_field_indexes = [
        index
        for index, key in enumerate(mapping_fields)
        if any(isinstance(item.get(key), str) for item in compacted_items)
        and all(item.get(key) is None or isinstance(item.get(key), str) for item in compacted_items)
    ]
    string_field_index_set = set(string_field_indexes)
    mapping_strings = []
    mapping_string_indexes = {}
    mapping_rows = []
    for item in compacted_items:
        row = []
        for index, key in enumerate(mapping_fields):
            value = item.get(key)
            if index in string_field_index_set and isinstance(value, str):
                if value not in mapping_string_indexes:
                    mapping_string_indexes[value] = len(mapping_strings)
                    mapping_strings.append(value)
                value = mapping_string_indexes[value]
            row.append(value)
        while row and row[-1] is None:
            row.pop()
        mapping_rows.append(row)

    content = (
        "const brandFields="
        + to_js(brand_fields)
        + "\nconst statusTexts="
        + to_js(status_texts)
        + "\nconst noteTexts="
        + to_js(note_texts)
        + "\nconst mappingFields="
        + to_js(mapping_fields)
        + "\nconst mappingStringFields="
        + to_js({index: 1 for index in string_field_indexes})
        + "\nconst mappingStrings="
        + to_js(mapping_strings)
        + "\nconst mappingRows="
        + to_js(mapping_rows)
        + "\nconst fittingMappings=mappingRows.map((row)=>{const item={};"
        + "row.forEach((value,index)=>{if(value!==null)item[mappingFields[index]]="
        + "mappingStringFields[index]?mappingStrings[value]:value});"
        + "return item})\nmodule.exports={brandFields,statusTexts,noteTexts,fittingMappings}\n"
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"wrote {OUTPUT} with {len(items)} mappings")
    audit = write_generation_audit(items)
    print(
        f"wrote {AUDIT_OUTPUT} with "
        f"{audit['summary']['recordedSkippedSourceCount']} recorded skips and "
        f"{audit['summary']['guardedNoMatchCount']} no-match guards"
    )
    counts = {}
    for item in items:
        counts[item["brand"]] = counts.get(item["brand"], 0) + 1
    print(json.dumps(counts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
