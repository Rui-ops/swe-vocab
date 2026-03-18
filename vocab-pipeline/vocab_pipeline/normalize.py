from __future__ import annotations

import json
import unicodedata
from pathlib import Path
from typing import Any

from .schema import SourceRecord, VocabularyEntry, validate_entry


def normalize_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFC", value).strip().split())


def slugify_lemma(value: str) -> str:
    normalized = normalize_text(value).casefold()
    return "".join(character for character in normalized if character.isalnum())


def normalize_source_rows(rows: list[dict[str, Any]], source_name: str) -> list[dict[str, Any]]:
    normalized_entries: list[dict[str, Any]] = []

    for index, row in enumerate(rows, start=1):
        lemma = normalize_text(str(row.get("lemma", "")))
        swedish = normalize_text(str(row.get("swedish", lemma)))
        part_of_speech = str(row.get("partOfSpeech", "other")).strip() or "other"
        english_values = row.get("english", [])

        if isinstance(english_values, str):
            english = [normalize_text(english_values)] if english_values.strip() else []
        else:
            english = [normalize_text(str(value)) for value in english_values if str(value).strip()]

        entry = VocabularyEntry(
            id=str(row.get("id") or f"{source_name}_{index:06d}"),
            lemma=lemma,
            swedish=swedish,
            english=english,
            partOfSpeech=part_of_speech,
            frequencyRank=row.get("frequencyRank"),
            cefrLevel=str(row.get("cefrLevel", "unknown")),
            packIds=[str(value) for value in row.get("packIds", [])],
            tags=[str(value) for value in row.get("tags", [])],
            priority=int(row.get("priority", 3)),
            sources=[
                SourceRecord(
                    name=source_name,
                    sourceId=str(row.get("sourceId") or row.get("id") or index),
                )
            ],
            exampleSv=normalize_text(str(row["exampleSv"])) if row.get("exampleSv") else None,
            exampleEn=normalize_text(str(row["exampleEn"])) if row.get("exampleEn") else None,
            phonetic=row.get("phonetic"),
            audioUrl=row.get("audioUrl"),
            notes=str(row.get("notes", "")),
            normalizedKey=f"{slugify_lemma(lemma)}|{part_of_speech}",
            isPhrase=bool(row.get("isPhrase", part_of_speech == "phrase")),
        )
        payload = entry.to_dict()
        errors = validate_entry(payload)
        if errors:
            joined_errors = "; ".join(errors)
            raise ValueError(f"row {index} failed validation: {joined_errors}")
        normalized_entries.append(payload)

    return normalized_entries


def normalize_json_file(input_path: Path, output_path: Path, source_name: str) -> int:
    rows = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError("input JSON must contain a list of source rows")

    normalized_entries = normalize_source_rows(rows, source_name=source_name)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(normalized_entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return len(normalized_entries)

