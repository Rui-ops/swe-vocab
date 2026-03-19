from __future__ import annotations

import json
import tempfile
import unittest
from collections import Counter
from pathlib import Path

from vocab_pipeline.seed import generate_seed_files
from vocab_pipeline.sync import sync_app_data


class SeedAndSyncTests(unittest.TestCase):
    def test_generate_seed_files_creates_large_dataset(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            backbone = root / "backbone.json"
            dictionary = root / "dictionary.json"

            count = generate_seed_files(backbone, dictionary)

            self.assertGreaterEqual(count, 3000)
            self.assertTrue(backbone.exists())
            self.assertTrue(dictionary.exists())
            backbone_entries = json.loads(backbone.read_text(encoding="utf-8"))
            self.assertEqual(len(backbone_entries), count)
            part_counts = Counter(entry["partOfSpeech"] for entry in backbone_entries)
            self.assertGreater(part_counts["noun"], part_counts["phrase"])

    def test_sync_app_data_writes_vocab_packs_and_levels(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            processed_input = root / "vocab_master.json"
            app_data_dir = root / "app-data"
            processed_input.write_text(
                json.dumps(
                    [
                        {
                            "id": "sv_000001",
                            "lemma": "dag",
                            "swedish": "dag",
                            "english": ["day"],
                            "partOfSpeech": "noun",
                            "frequencyRank": 1,
                            "cefrLevel": "A1",
                            "packIds": ["a1_core"],
                            "tags": ["common", "time"],
                            "priority": 5,
                            "sources": [{"name": "seed", "sourceId": "1"}],
                            "normalizedKey": "dag|noun",
                            "isPhrase": False,
                        },
                        {
                            "id": "sv_000002",
                            "lemma": "förstå",
                            "swedish": "förstå",
                            "english": ["understand"],
                            "partOfSpeech": "verb",
                            "frequencyRank": 2,
                            "cefrLevel": "B2",
                            "packIds": ["b2_core"],
                            "tags": ["common"],
                            "priority": 3,
                            "sources": [{"name": "seed", "sourceId": "2"}],
                            "normalizedKey": "forsta|verb",
                            "isPhrase": False,
                        },
                    ]
                ),
                encoding="utf-8",
            )

            count = sync_app_data(processed_input, app_data_dir)

            self.assertEqual(count, 2)
            self.assertTrue((app_data_dir / "vocab_master.json").exists())
            self.assertTrue((app_data_dir / "packs.json").exists())
            self.assertTrue((app_data_dir / "levels.json").exists())
            app_entries = json.loads((app_data_dir / "vocab_master.json").read_text(encoding="utf-8"))
            self.assertEqual({pack_id for entry in app_entries for pack_id in entry["packIds"]}, {"a1_core", "b2_core"})

    def test_sync_app_data_replaces_previous_pack_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            processed_input = root / "vocab_master.json"
            app_data_dir = root / "app-data"
            processed_input.write_text(
                json.dumps(
                    [
                        {
                            "id": "sv_000010",
                            "lemma": "bok",
                            "swedish": "bok",
                            "english": ["book"],
                            "partOfSpeech": "noun",
                            "frequencyRank": 10,
                            "cefrLevel": "A1",
                            "packIds": ["a1_core"],
                            "tags": ["common"],
                            "priority": 5,
                            "sources": [{"name": "seed", "sourceId": "10"}],
                            "normalizedKey": "bok|noun",
                            "isPhrase": False,
                        }
                    ]
                ),
                encoding="utf-8",
            )
            app_data_dir.mkdir(parents=True)
            (app_data_dir / "packs.json").write_text(
                json.dumps(
                    [
                        {"id": "conversation_chunks", "title": "Old Pack"},
                        {"id": "a1_core", "title": "Old A1 Pack"},
                    ]
                ),
                encoding="utf-8",
            )

            sync_app_data(processed_input, app_data_dir)

            packs = json.loads((app_data_dir / "packs.json").read_text(encoding="utf-8"))
            self.assertEqual([pack["id"] for pack in packs], ["a1_core"])


if __name__ == "__main__":
    unittest.main()
