import json
import re
from pathlib import Path

import pdfplumber


CATALOGS = {
    "L": Path("/Users/maybe/Downloads/fitok L_Series_Tube_Butt_Weld_Fittings_EN.pdf"),
    "M": Path("/Users/maybe/Downloads/FITOK M_Series_Micro_Weld_Fittings_EN.pdf"),
    "FR": Path("/Users/maybe/Downloads/fitok FR_Series_Face_Seal_Fittings_EN.pdf"),
}
OUTPUT = Path("data/fitokCatalogModels.json")
MODEL_PATTERN = re.compile(r"(?<![A-Z0-9])-[A-Z]+[0-9]*(?:-[A-Z0-9.]+)+")


def extract_models(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        text = "\n".join(page.extract_text(x_tolerance=2, y_tolerance=3) or "" for page in pdf.pages)

    models = set()
    for match in MODEL_PATTERN.finditer(text):
        model = match.group(0).rstrip(".")
        if model.endswith(("-F2", "-F3")):
            continue
        if model in ("-FC-01", "-FC-02", "-FC-03"):
            continue
        models.add(model)
    return sorted(models)


def main():
    output = {
        "source": {
            series: {
                "file": path.name,
                "models": extract_models(path),
            }
            for series, path in CATALOGS.items()
        }
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts = {series: len(entry["models"]) for series, entry in output["source"].items()}
    print(json.dumps(counts, ensure_ascii=False))


if __name__ == "__main__":
    main()
