from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


PACK_LABELS = {
    "a1_core": ("A1 Core", "Essential beginner vocabulary."),
    "a2_core": ("A2 Core", "High-value everyday vocabulary."),
    "b1_core": ("B1 Core", "Independent user conversation vocabulary."),
    "b2_core": ("B2 Core", "More flexible and discussion-ready vocabulary."),
}

LEVEL_DESCRIPTIONS = {
    "A1": "First essential words and phrases.",
    "A2": "Default daily-use vocabulary for short recall sessions.",
    "B1": "More flexible and conversation-ready vocabulary.",
    "B2": "Less obvious and more discussion-ready vocabulary.",
}


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sync_app_data(processed_vocab_path: Path, app_data_dir: Path) -> int:
    entries = json.loads(processed_vocab_path.read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("processed vocab input must be a JSON array")

    pack_counts: Counter[str] = Counter()
    pack_levels: dict[str, str] = {}
    pack_tags: dict[str, set[str]] = defaultdict(set)
    level_ids: set[str] = set()

    for entry in entries:
        level = str(entry["cefrLevel"])
        level_ids.add(level)
        for pack_id in entry.get("packIds", []):
            pack_id = str(pack_id)
            pack_counts[pack_id] += 1
            pack_levels.setdefault(pack_id, level)
            for tag in entry.get("tags", []):
                pack_tags[pack_id].add(str(tag))

    packs_payload: list[dict[str, Any]] = []
    for pack_id in sorted(pack_counts):
        label, description = PACK_LABELS.get(
            pack_id,
            (pack_id.replace("_", " ").title(), "Generated pack from pipeline output."),
        )
        packs_payload.append(
            {
                "id": pack_id,
                "title": label,
                "description": description,
                "cefrLevel": pack_levels.get(pack_id, "unknown"),
                "itemCount": pack_counts[pack_id],
                "tags": sorted(pack_tags[pack_id])[:6],
            }
        )

    levels_payload = [
        {
            "id": level_id,
            "label": level_id,
            "description": LEVEL_DESCRIPTIONS.get(level_id, f"Generated {level_id} vocabulary."),
        }
        for level_id in sorted(level_ids)
    ]

    _write_json(app_data_dir / "vocab_master.json", entries)
    _write_json(app_data_dir / "packs.json", packs_payload)
    _write_json(app_data_dir / "levels.json", levels_payload)
    return len(entries)
