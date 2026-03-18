from __future__ import annotations

from copy import deepcopy
from typing import Any


def _merge_unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            merged.append(value)
    return merged


def merge_entries(
    backbone_entries: list[dict[str, Any]],
    dictionary_entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    merged_by_key: dict[str, dict[str, Any]] = {}

    for entry in backbone_entries:
        merged_by_key[entry["normalizedKey"]] = deepcopy(entry)

    for entry in dictionary_entries:
        key = entry["normalizedKey"]
        if key not in merged_by_key:
            merged_by_key[key] = deepcopy(entry)
            continue

        current = merged_by_key[key]
        current["english"] = _merge_unique_strings(current["english"] + entry["english"])
        current["packIds"] = _merge_unique_strings(current["packIds"] + entry["packIds"])
        current["tags"] = _merge_unique_strings(current["tags"] + entry["tags"])
        current["sources"] = current["sources"] + entry["sources"]

        if not current.get("exampleSv") and entry.get("exampleSv"):
            current["exampleSv"] = entry["exampleSv"]
        if not current.get("exampleEn") and entry.get("exampleEn"):
            current["exampleEn"] = entry["exampleEn"]
        if not current.get("phonetic") and entry.get("phonetic"):
            current["phonetic"] = entry["phonetic"]
        if not current.get("audioUrl") and entry.get("audioUrl"):
            current["audioUrl"] = entry["audioUrl"]
        if not current.get("notes") and entry.get("notes"):
            current["notes"] = entry["notes"]

        current["frequencyRank"] = current.get("frequencyRank") or entry.get("frequencyRank")
        if current.get("cefrLevel") == "unknown" and entry.get("cefrLevel") != "unknown":
            current["cefrLevel"] = entry["cefrLevel"]

    return list(merged_by_key.values())

