from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from vocab_pipeline.normalize import normalize_json_file
from vocab_pipeline.schema import validate_entry
from vocab_pipeline.validate import validate_json_file


class SchemaTests(unittest.TestCase):
    def test_validate_entry_accepts_valid_payload(self) -> None:
        payload = {
            "id": "sv_000001",
            "lemma": "dag",
            "swedish": "dag",
            "english": ["day"],
            "partOfSpeech": "noun",
            "frequencyRank": 190,
            "cefrLevel": "A1",
            "packIds": ["a1_core"],
            "tags": ["common"],
            "priority": 5,
            "sources": [{"name": "source", "sourceId": "1"}],
        }
        self.assertEqual(validate_entry(payload), [])

    def test_normalize_and_validate_json_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            input_path = Path(directory) / "raw.json"
            output_path = Path(directory) / "normalized.json"
            input_path.write_text(
                json.dumps(
                    [
                        {
                            "lemma": " dag ",
                            "english": [" day "],
                            "partOfSpeech": "noun",
                            "frequencyRank": 190,
                            "cefrLevel": "A1",
                            "packIds": ["a1_core"],
                            "tags": ["common"],
                            "priority": 5,
                        }
                    ]
                ),
                encoding="utf-8",
            )

            count = normalize_json_file(input_path, output_path, source_name="test_source")
            self.assertEqual(count, 1)
            self.assertEqual(validate_json_file(output_path), [])


if __name__ == "__main__":
    unittest.main()

