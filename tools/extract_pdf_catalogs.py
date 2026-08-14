import json
import re
from pathlib import Path

import pdfplumber


PDFS = {
    "VIGOUR VUPS": "/Users/maybe/Library/Containers/com.tencent.WeWorkMac/Data/WeDrive/上海皓固/产品目录/VUPS 接头目录/VIGOUR VUPS接头目录 英文-26.5.28.pdf",
    "Swagelok VCR": "/Users/maybe/Desktop/陆杲/PDF/Swagelok-VCR-EN.pdf",
    "JSK Micro": "/Users/maybe/Desktop/陆杲/文件/JSK-Micro fitting.pdf",
    "JSK VCR": "/Users/maybe/Desktop/陆杲/文件/JSK-VCR.pdf",
    "Fujikin UJR": "/Users/maybe/Desktop/陆杲/文件/目录资料类/Fujikin/Fujikin-UJR接头系列.pdf",
}

KEYWORDS = re.compile(
    r"ordering|order|part\s*number|model|material|gasket|nut|body|union|female|male|"
    r"size|tube|pipe|vcr|micro|face\s*seal|fitting|connect|connection|catalog|"
    r"订购|型号|材质|尺寸",
    re.IGNORECASE,
)


def clean(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text or "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def main() -> None:
    out_dir = Path("tmp/catalog_extract")
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {}
    for name, pdf_path in PDFS.items():
        path = Path(pdf_path)
        item = {"path": str(path), "pages": 0, "matches": []}
        all_pages = []
        with pdfplumber.open(path) as pdf:
            item["pages"] = len(pdf.pages)
            for idx, page in enumerate(pdf.pages, start=1):
                text = clean(page.extract_text(x_tolerance=1.5, y_tolerance=3) or "")
                all_pages.append({"page": idx, "text": text})
                if KEYWORDS.search(text):
                    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
                    hit_lines = [ln for ln in lines if KEYWORDS.search(ln)]
                    context = "\n".join(lines[:80])
                    item["matches"].append(
                        {
                            "page": idx,
                            "hit_lines": hit_lines[:20],
                            "preview": context[:3500],
                        }
                    )
        safe = re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_")
        (out_dir / f"{safe}.json").write_text(
            json.dumps(all_pages, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        summary[name] = item
    (out_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2)[:20000])


if __name__ == "__main__":
    main()
