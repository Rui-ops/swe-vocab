from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_json_file(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_default_rules(config_dir: Path) -> dict[str, Any]:
    return {
        "pack_rules": load_json_file(config_dir / "pack_rules" / "default_pack_rules.json"),
        "tag_rules": load_json_file(config_dir / "tag_rules" / "default_tag_rules.json"),
        "priority_rules": load_json_file(
            config_dir / "priority_rules" / "default_priority_rules.json"
        ),
    }


def load_manual_inputs(raw_dir: Path) -> dict[str, Any]:
    manual_dir = raw_dir / "manual"
    return {
        "manual_overrides": load_json_file(manual_dir / "manual_overrides.json"),
        "curated_examples": load_json_file(manual_dir / "curated_examples.json"),
        "exclusions": load_json_file(manual_dir / "exclusions.json"),
        "custom_pack_assignments": load_json_file(manual_dir / "custom_pack_assignments.json"),
    }
