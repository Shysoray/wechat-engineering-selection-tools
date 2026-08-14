#!/usr/bin/env python3
"""Compatibility entry point for the JS runtime-mapping comparison builder."""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools/build_fitting_dimension_comparisons.js"


def find_node() -> str:
    configured = os.environ.get("NODE_BINARY")
    if configured and Path(configured).is_file():
        return configured
    system_node = shutil.which("node")
    if system_node:
        return system_node
    bundled = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
    if bundled.is_file():
        return str(bundled)
    raise FileNotFoundError("Node.js is required; set NODE_BINARY to its executable path")


def main() -> None:
    subprocess.run([find_node(), str(SCRIPT)], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
