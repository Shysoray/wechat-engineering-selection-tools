import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from fitting_dimension_catalog import measurement, numeric_tokens  # noqa: E402


assert numeric_tokens("1 5/16") == [1.3125]
assert measurement("5/16", "in_mm")["normalizedMm"] == 7.9375
assert measurement("1.72 (43.7)", "in_mm")["normalizedMm"] == 43.7
assert measurement("43.7 (1.72)", "mm_in")["normalizedMm"] == 43.7
assert measurement("2 .19 (55 .6)", "in_mm")["normalizedMm"] == 55.6
assert measurement(".16 1.61 40.89", "in_mm")["normalizedMm"] == 40.89

print("Fitting dimension unit parsing passed")
