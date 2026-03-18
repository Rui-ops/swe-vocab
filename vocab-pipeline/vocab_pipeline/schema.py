from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

VALID_CEFR_LEVELS = {"A1", "A2", "B1", "B1+", "B2", "C1", "unknown"}
VALID_PARTS_OF_SPEECH = {
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "phrase",
    "other",
}


@dataclass(slots=True)
class SourceRecord:
    name: str
    sourceId: str


@dataclass(slots=True)
class VocabularyEntry:
    id: str
    lemma: str
    swedish: str
    english: list[str]
    partOfSpeech: str
    frequencyRank: int | None
    cefrLevel: str
    packIds: list[str]
    tags: list[str]
    priority: int
    sources: list[SourceRecord]
    exampleSv: str | None = None
    exampleEn: str | None = None
    phonetic: str | None = None
    audioUrl: str | None = None
    notes: str = ""
    normalizedKey: str | None = None
    isPhrase: bool = False

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["sources"] = [asdict(source) for source in self.sources]
        return payload


def validate_entry(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    required_fields = [
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
        "sources",
    ]

    for field_name in required_fields:
        if field_name not in payload:
            errors.append(f"missing required field: {field_name}")

    if errors:
        return errors

    if not isinstance(payload["id"], str) or not payload["id"].strip():
        errors.append("id must be a non-empty string")
    if not isinstance(payload["lemma"], str) or not payload["lemma"].strip():
        errors.append("lemma must be a non-empty string")
    if not isinstance(payload["swedish"], str) or not payload["swedish"].strip():
        errors.append("swedish must be a non-empty string")
    if not isinstance(payload["english"], list) or not payload["english"]:
        errors.append("english must be a non-empty list")
    if payload["partOfSpeech"] not in VALID_PARTS_OF_SPEECH:
        errors.append("partOfSpeech must use the controlled internal set")
    if payload["cefrLevel"] not in VALID_CEFR_LEVELS:
        errors.append("cefrLevel must use the controlled internal set")
    if payload["frequencyRank"] is not None and not isinstance(payload["frequencyRank"], int):
        errors.append("frequencyRank must be an integer or null")
    if not isinstance(payload["packIds"], list):
        errors.append("packIds must be a list")
    if not isinstance(payload["tags"], list):
        errors.append("tags must be a list")
    if not isinstance(payload["priority"], int) or payload["priority"] not in {1, 2, 3, 4, 5}:
        errors.append("priority must be an integer from 1 to 5")
    if not isinstance(payload["sources"], list) or not payload["sources"]:
        errors.append("sources must be a non-empty list")
    else:
        for index, source in enumerate(payload["sources"]):
            if not isinstance(source, dict):
                errors.append(f"sources[{index}] must be an object")
                continue
            if not isinstance(source.get("name"), str) or not source["name"].strip():
                errors.append(f"sources[{index}].name must be a non-empty string")
            if not isinstance(source.get("sourceId"), str) or not source["sourceId"].strip():
                errors.append(f"sources[{index}].sourceId must be a non-empty string")

    return errors

