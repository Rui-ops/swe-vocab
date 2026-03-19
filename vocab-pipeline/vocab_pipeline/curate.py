from __future__ import annotations

from copy import deepcopy
from typing import Any


def _priority_from_rank(frequency_rank: int | None, rules: dict[str, Any]) -> int:
    if frequency_rank is None:
        return int(rules["fallbackPriority"])

    for band in rules["rankBands"]:
        if frequency_rank <= int(band["maxRank"]):
            return int(band["priority"])

    return int(rules["fallbackPriority"])


def _merge_unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            merged.append(value)
    return merged


def curate_entries(
    entries: list[dict[str, Any]],
    rules: dict[str, Any],
    manual_inputs: dict[str, Any],
) -> list[dict[str, Any]]:
    exclusions = set(str(value) for value in manual_inputs["exclusions"])
    curated_examples = {str(item["id"]): item for item in manual_inputs["curated_examples"]}
    custom_pack_assignments = {
        str(item["id"]): [str(pack_id) for pack_id in item["packIds"]]
        for item in manual_inputs["custom_pack_assignments"]
    }
    manual_overrides = {str(item["id"]): item for item in manual_inputs["manual_overrides"]}

    curated: list[dict[str, Any]] = []
    cefr_core_packs = rules["pack_rules"]["cefrCorePacks"]
    tag_to_pack_ids = rules["pack_rules"]["tagToPackIds"]
    pos_tags = rules["tag_rules"]["partOfSpeechTags"]
    priority_tags = rules["tag_rules"]["priorityTags"]

    for index, entry in enumerate(entries, start=1):
        if entry["id"] in exclusions or entry["normalizedKey"] in exclusions:
            continue

        next_entry = deepcopy(entry)
        next_entry["id"] = f"sv_{index:06d}"
        next_entry["priority"] = _priority_from_rank(
            next_entry.get("frequencyRank"), rules["priority_rules"]
        )

        derived_tags = list(next_entry["tags"])
        derived_tags.extend(pos_tags.get(next_entry["partOfSpeech"], []))
        derived_tags.extend(priority_tags.get(str(next_entry["priority"]), []))
        next_entry["tags"] = _merge_unique_strings(derived_tags)

        derived_packs = list(next_entry["packIds"])
        cefr_pack = cefr_core_packs.get(next_entry["cefrLevel"])
        if cefr_pack:
            derived_packs.append(cefr_pack)
        for tag in next_entry["tags"]:
            derived_packs.extend(tag_to_pack_ids.get(tag, []))
        if next_entry["id"] in custom_pack_assignments:
            derived_packs.extend(custom_pack_assignments[next_entry["id"]])
        next_entry["packIds"] = _merge_unique_strings(derived_packs)

        example_override = curated_examples.get(next_entry["id"]) or curated_examples.get(
            next_entry["normalizedKey"]
        )
        if example_override:
            if example_override.get("exampleSv"):
                next_entry["exampleSv"] = str(example_override["exampleSv"])
            if example_override.get("exampleEn"):
                next_entry["exampleEn"] = str(example_override["exampleEn"])

        overrides = manual_overrides.get(next_entry["id"]) or manual_overrides.get(
            next_entry["normalizedKey"]
        )
        if overrides:
            for key, value in overrides.items():
                if key == "id":
                    continue
                next_entry[key] = value

        curated.append(next_entry)

    return curated
