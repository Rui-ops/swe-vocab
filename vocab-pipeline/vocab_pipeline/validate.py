from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .schema import validate_entry


def validate_json_file(input_path: Path) -> list[str]:
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]]

    if isinstance(payload, list):
      entries = payload
    else:
      raise ValueError("validation input must be a JSON array")

    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_keys: set[str] = set()

    for index, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict):
            errors.append(f"entry {index} must be an object")
            continue

        entry_errors = validate_entry(entry)
        errors.extend(f"entry {index}: {message}" for message in entry_errors)

        entry_id = entry.get("id")
        if isinstance(entry_id, str):
            if entry_id in seen_ids:
                errors.append(f"entry {index}: duplicate id {entry_id}")
            seen_ids.add(entry_id)

        normalized_key = entry.get("normalizedKey")
        if isinstance(normalized_key, str):
            key = f"{normalized_key}|{entry.get('id')}"
            if key in seen_keys:
                errors.append(f"entry {index}: duplicate normalized key instance {normalized_key}")
            seen_keys.add(key)

    return errors

