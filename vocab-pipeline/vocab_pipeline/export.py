from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from .schema import validate_entry


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def export_outputs(
    entries: list[dict[str, Any]],
    processed_dir: Path,
    source_names: list[str],
) -> None:
    for entry in entries:
        errors = validate_entry(entry)
        if errors:
            joined_errors = "; ".join(errors)
            raise ValueError(f"cannot export invalid entry {entry.get('id')}: {joined_errors}")

    _write_json(processed_dir / "vocab_master.json", entries)
    _write_csv(processed_dir / "vocab_master.csv", entries)
    _export_packs(processed_dir / "packs", entries)
    _export_levels(processed_dir / "levels", entries)
    _write_json(processed_dir / "source_manifest.json", _build_source_manifest(source_names, entries))


def write_attribution_files(output_dir: Path, source_names: list[str]) -> None:
    attribution_lines = ["# Attribution", ""]
    attribution_lines.extend(f"- {source_name}" for source_name in sorted(set(source_names)))
    attribution_lines.append("")
    attribution_lines.append("Source-specific attribution text should be filled in once the real data sources are selected.")
    (output_dir / "ATTRIBUTION.md").write_text("\n".join(attribution_lines) + "\n", encoding="utf-8")

    license_lines = [
        "# License Notes",
        "",
        "This scaffold records source names and expects source-specific redistribution notes to be added",
        "once the production frequency and dictionary datasets are finalized.",
        "",
    ]
    (output_dir / "LICENSE_NOTES.md").write_text("\n".join(license_lines), encoding="utf-8")


def _write_csv(path: Path, entries: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "id",
        "lemma",
        "swedish",
        "english",
        "partOfSpeech",
        "frequencyRank",
        "cefrLevel",
        "packIds",
        "tags",
        "priority",
        "exampleSv",
        "exampleEn",
        "phonetic",
        "audioUrl",
        "notes",
        "normalizedKey",
        "isPhrase",
        "sources",
    ]

    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for entry in entries:
            writer.writerow(
                {
                    **entry,
                    "english": " | ".join(entry["english"]),
                    "packIds": " | ".join(entry["packIds"]),
                    "tags": " | ".join(entry["tags"]),
                    "sources": json.dumps(entry["sources"], ensure_ascii=False),
                }
            )


def _export_packs(packs_dir: Path, entries: list[dict[str, Any]]) -> None:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for entry in entries:
        for pack_id in entry["packIds"]:
            grouped.setdefault(pack_id, []).append(entry)

    for pack_id, pack_entries in grouped.items():
        _write_json(packs_dir / f"{pack_id}.json", pack_entries)


def _export_levels(levels_dir: Path, entries: list[dict[str, Any]]) -> None:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for entry in entries:
        grouped.setdefault(entry["cefrLevel"], []).append(entry)

    for cefr_level, level_entries in grouped.items():
        _write_json(levels_dir / f"{cefr_level}.json", level_entries)


def _build_source_manifest(source_names: list[str], entries: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "sources": [
            {
                "name": source_name,
                "type": "pending",
                "notes": "Fill in source URL, license, and acquisition details.",
            }
            for source_name in sorted(set(source_names))
        ],
        "entryCount": len(entries),
    }

