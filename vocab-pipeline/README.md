# Vocabulary Pipeline

Python-based ingestion and export scaffold for the Swedish vocab app.

## Lean V1 Goal

- generate and maintain one app-ready Swedish vocabulary library of 3,000+ entries
- merge one backbone input with one enrichment input when needed
- export one app-ready JSON dataset the app can consume directly
- keep manual overrides and validation simple and reproducible

## Directory layout

- `vocab_pipeline/`: internal package with schema, normalization, and validation helpers
- `data/raw/`: original source files and manual overrides
- `data/intermediate/`: normalized records before merge
- `data/processed/`: final app-ready outputs
- `scripts/`: stage-specific entrypoints
- `config/`: field mappings and rule configuration
- `tests/`: pipeline validation tests

## Quick start

Normalize a raw JSON array into canonical intermediate entries:

```bash
cd vocab-pipeline
PYTHONPATH=. python3 -m vocab_pipeline.cli normalize-json \
  --input data/raw/example.json \
  --output data/intermediate/example.normalized.json \
  --source-name example_source
```

Generate the large seed source files used for the current pipeline-backed library:

```bash
cd vocab-pipeline
PYTHONPATH=. python3 -m vocab_pipeline.cli generate-seed \
  --backbone-output data/raw/seed/backbone_seed.json \
  --dictionary-output data/raw/seed/dictionary_seed.json
```

Validate a normalized file independently:

```bash
cd vocab-pipeline
PYTHONPATH=. python3 -m vocab_pipeline.cli validate-json \
  --input data/intermediate/example.normalized.json
```

Run the scaffold tests:

```bash
cd vocab-pipeline
PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'
```

Merge two normalized source files and export app-ready outputs:

```bash
cd vocab-pipeline
PYTHONPATH=. python3 -m vocab_pipeline.cli merge-export \
  --backbone-input data/intermediate/backbone.normalized.json \
  --dictionary-input data/intermediate/dictionary.normalized.json \
  --processed-dir data/processed \
  --config-dir config \
  --raw-dir data/raw \
  --project-root .
```

Sync the generated master dataset into the app:

```bash
cd vocab-pipeline
PYTHONPATH=. python3 -m vocab_pipeline.cli sync-app-data \
  --processed-input data/processed/vocab_master.json \
  --app-data-dir ../app/public/data
```

## Canonical item schema

Required fields:

- `id`
- `lemma`
- `swedish`
- `english`
- `partOfSpeech`
- `frequencyRank`
- `cefrLevel`
- `packIds`
- `tags`
- `priority`
- `sources`

Recommended fields:

- `exampleSv`
- `exampleEn`
- `phonetic`
- `audioUrl`
- `notes`
- `normalizedKey`
- `isPhrase`

The scaffold currently enforces:

- required field presence
- controlled CEFR and part-of-speech sets
- numeric frequency ranks when present
- non-empty provenance records
- priority bounds from `1` to `5`

## Config scaffold

The initial config files are templates, not final source-specific rules:

- `config/field_mappings/*.json`: starter field maps for backbone and dictionary-style sources
- `config/pack_rules/default_pack_rules.json`: CEFR and tag-driven pack assignment defaults
- `config/tag_rules/default_tag_rules.json`: starter tag generation rules
- `config/priority_rules/default_priority_rules.json`: fallback priority bands
- `config/cefr_levels.json` and `config/parts_of_speech.json`: controlled vocabulary lists

## Required v1 output

- `data/processed/vocab_master.json`

## Secondary outputs

- `data/processed/vocab_master.csv`
- `data/processed/packs/*.json`
- `data/processed/levels/*.json`
- `data/processed/source_manifest.json`
- `ATTRIBUTION.md`
- `LICENSE_NOTES.md`

## Current milestone status

The pipeline already supports the lean v1 path:

- normalization into canonical JSON
- validation of app-ready entries
- merge by `normalizedKey`
- simple manual overrides and exclusions
- export of one app-ready dataset plus secondary files
- reproducible generation of a 3,634-entry seed-backed dataset
- sync of processed app data into the frontend

Do not expand configuration or export complexity unless it directly improves the current 3,000+ app dataset.
