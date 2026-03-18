from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .config import load_default_rules, load_manual_inputs
from .curate import curate_entries
from .export import export_outputs, write_attribution_files
from .merge import merge_entries


def load_json_entries(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"{path} must contain a JSON array")
    return payload


def merge_and_export(
    backbone_input: Path,
    dictionary_input: Path,
    processed_dir: Path,
    config_dir: Path,
    raw_dir: Path,
    project_root: Path,
) -> int:
    backbone_entries = load_json_entries(backbone_input)
    dictionary_entries = load_json_entries(dictionary_input)
    rules = load_default_rules(config_dir)
    manual_inputs = load_manual_inputs(raw_dir)

    merged_entries = merge_entries(backbone_entries, dictionary_entries)
    curated_entries = curate_entries(merged_entries, rules, manual_inputs)
    source_names = [
        source["name"]
        for entry in curated_entries
        for source in entry.get("sources", [])
        if isinstance(source, dict) and "name" in source
    ]

    export_outputs(curated_entries, processed_dir, source_names)
    write_attribution_files(project_root, source_names)
    return len(curated_entries)

