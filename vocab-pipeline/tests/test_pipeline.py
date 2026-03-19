from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from vocab_pipeline.pipeline import merge_and_export


class PipelineTests(unittest.TestCase):
    def test_merge_and_export_generates_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            processed_dir = root / "processed"
            config_dir = root / "config"
            raw_dir = root / "raw"
            (config_dir / "pack_rules").mkdir(parents=True)
            (config_dir / "tag_rules").mkdir(parents=True)
            (config_dir / "priority_rules").mkdir(parents=True)
            (raw_dir / "manual").mkdir(parents=True)

            (config_dir / "pack_rules" / "default_pack_rules.json").write_text(
                json.dumps(
                    {
                        "cefrCorePacks": {"A1": "a1_core", "A2": "a2_core"},
                        "tagToPackIds": {"conversation": ["conversation_chunks"]},
                    }
                ),
                encoding="utf-8",
            )
            (config_dir / "tag_rules" / "default_tag_rules.json").write_text(
                json.dumps(
                    {
                        "partOfSpeechTags": {"phrase": ["conversation"]},
                        "priorityTags": {"5": ["high_priority"], "4": ["useful"]},
                    }
                ),
                encoding="utf-8",
            )
            (config_dir / "priority_rules" / "default_priority_rules.json").write_text(
                json.dumps(
                    {
                        "rankBands": [{"maxRank": 500, "priority": 5}],
                        "fallbackPriority": 2,
                    }
                ),
                encoding="utf-8",
            )
            (raw_dir / "manual" / "manual_overrides.json").write_text("[]", encoding="utf-8")
            (raw_dir / "manual" / "exclusions.json").write_text("[]", encoding="utf-8")
            (raw_dir / "manual" / "custom_pack_assignments.json").write_text("[]", encoding="utf-8")

            backbone_path = root / "backbone.json"
            dictionary_path = root / "dictionary.json"
            backbone_path.write_text(
                json.dumps(
                    [
                        {
                            "id": "backbone-1",
                            "lemma": "dag",
                            "swedish": "dag",
                            "english": ["day"],
                            "partOfSpeech": "noun",
                            "frequencyRank": 190,
                            "cefrLevel": "A1",
                            "packIds": [],
                            "tags": [],
                            "priority": 3,
                            "sources": [{"name": "backbone", "sourceId": "1"}],
                            "normalizedKey": "dag|noun",
                            "isPhrase": False,
                        }
                    ]
                ),
                encoding="utf-8",
            )
            dictionary_path.write_text(
                json.dumps(
                    [
                        {
                            "id": "dictionary-1",
                            "lemma": "dag",
                            "swedish": "dag",
                            "english": ["daytime"],
                            "partOfSpeech": "noun",
                            "frequencyRank": None,
                            "cefrLevel": "unknown",
                            "packIds": [],
                            "tags": ["conversation"],
                            "priority": 3,
                            "sources": [{"name": "dictionary", "sourceId": "1"}],
                            "normalizedKey": "dag|noun",
                            "isPhrase": False,
                            "exampleSv": "god dag",
                            "exampleEn": "good day",
                        }
                    ]
                ),
                encoding="utf-8",
            )

            count = merge_and_export(
                backbone_input=backbone_path,
                dictionary_input=dictionary_path,
                processed_dir=processed_dir,
                config_dir=config_dir,
                raw_dir=raw_dir,
                project_root=root,
            )

            self.assertEqual(count, 1)
            master_entries = json.loads((processed_dir / "vocab_master.json").read_text(encoding="utf-8"))
            self.assertEqual(master_entries[0]["id"], "sv_000001")
            self.assertEqual(master_entries[0]["english"], ["day", "daytime"])
            self.assertIn("a1_core", master_entries[0]["packIds"])
            self.assertIn("conversation_chunks", master_entries[0]["packIds"])
            self.assertTrue((processed_dir / "vocab_master.csv").exists())
            self.assertTrue((processed_dir / "packs" / "a1_core.json").exists())
            self.assertTrue((processed_dir / "levels" / "A1.json").exists())
            self.assertTrue((processed_dir / "source_manifest.json").exists())
            self.assertTrue((root / "ATTRIBUTION.md").exists())
            self.assertTrue((root / "LICENSE_NOTES.md").exists())

    def test_merge_and_export_replaces_stale_generated_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            processed_dir = root / "processed"
            config_dir = root / "config"
            raw_dir = root / "raw"
            (processed_dir / "packs").mkdir(parents=True)
            (processed_dir / "levels").mkdir(parents=True)
            (processed_dir / "packs" / "conversation_chunks.json").write_text("[]", encoding="utf-8")
            (processed_dir / "levels" / "C1.json").write_text("[]", encoding="utf-8")
            (config_dir / "pack_rules").mkdir(parents=True)
            (config_dir / "tag_rules").mkdir(parents=True)
            (config_dir / "priority_rules").mkdir(parents=True)
            (raw_dir / "manual").mkdir(parents=True)

            (config_dir / "pack_rules" / "default_pack_rules.json").write_text(
                json.dumps({"cefrCorePacks": {"A1": "a1_core"}, "tagToPackIds": {}}),
                encoding="utf-8",
            )
            (config_dir / "tag_rules" / "default_tag_rules.json").write_text(
                json.dumps({"partOfSpeechTags": {}, "priorityTags": {}}),
                encoding="utf-8",
            )
            (config_dir / "priority_rules" / "default_priority_rules.json").write_text(
                json.dumps({"rankBands": [{"maxRank": 500, "priority": 5}], "fallbackPriority": 2}),
                encoding="utf-8",
            )
            (raw_dir / "manual" / "manual_overrides.json").write_text("[]", encoding="utf-8")
            (raw_dir / "manual" / "exclusions.json").write_text("[]", encoding="utf-8")
            (raw_dir / "manual" / "custom_pack_assignments.json").write_text("[]", encoding="utf-8")

            backbone_path = root / "backbone.json"
            dictionary_path = root / "dictionary.json"
            backbone_path.write_text(
                json.dumps(
                    [
                        {
                            "id": "backbone-1",
                            "lemma": "dag",
                            "swedish": "dag",
                            "english": ["day"],
                            "partOfSpeech": "noun",
                            "frequencyRank": 190,
                            "cefrLevel": "A1",
                            "packIds": [],
                            "tags": [],
                            "priority": 3,
                            "sources": [{"name": "backbone", "sourceId": "1"}],
                            "normalizedKey": "dag|noun",
                            "isPhrase": False,
                        }
                    ]
                ),
                encoding="utf-8",
            )
            dictionary_path.write_text("[]", encoding="utf-8")

            merge_and_export(
                backbone_input=backbone_path,
                dictionary_input=dictionary_path,
                processed_dir=processed_dir,
                config_dir=config_dir,
                raw_dir=raw_dir,
                project_root=root,
            )

            self.assertFalse((processed_dir / "packs" / "conversation_chunks.json").exists())
            self.assertFalse((processed_dir / "levels" / "C1.json").exists())
            self.assertTrue((processed_dir / "packs" / "a1_core.json").exists())
            self.assertTrue((processed_dir / "levels" / "A1.json").exists())


if __name__ == "__main__":
    unittest.main()
