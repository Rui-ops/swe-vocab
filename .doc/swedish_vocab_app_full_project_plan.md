# Swedish Vocabulary App — Full Project Plan

## Overview

This project is a **phone-first Swedish vocabulary web app** with a supporting **data ingestion pipeline**.

The goal is to build a focused vocabulary product that helps users improve:

- active recall
- conversation-ready vocabulary
- daily review habits

The project should stay intentionally narrow.
It is **not** meant to become a full language-learning platform in v1.

The plan combines:

1. the **product/app plan**
2. the **vocabulary data pipeline plan**

---

## Project Goal

Build a **phone-first Swedish vocabulary web app** that helps users improve **active recall** and **conversation-ready vocabulary** through short daily review sessions.

The first version should be:

- simple
- mobile-friendly
- free to host
- compatible with static deployment
- usable without backend or cloud services

The app should allow users to:

- choose their level
- study vocabulary packs
- review words in short daily sessions
- practice Swedish → English and English → Swedish recall
- save progress locally on the device

---

## Product Vision

A lightweight Swedish vocabulary app that feels fast, focused, and practical on phone.

The app should help users move words from:

- “I vaguely recognize this”
- to
- “I can actually recall and use this”

Core philosophy:

- prioritize useful vocabulary
- support repeated review
- optimize for recall, not passive exposure
- keep the user flow short and frictionless

---

## Core Product Principles

1. **Vocabulary-first**  
   The app focuses on words, phrases, chunks, and light usage support.

2. **Recall over browsing**  
   The main interaction is remembering, revealing, and rating recall.

3. **Phone-first**  
   The UX should be comfortable on a small screen and suitable for short daily sessions.

4. **Simple over clever**  
   v1 should prefer clarity and robustness over advanced features.

5. **No backend in v1**  
   Content is static, progress is local.

6. **Designed to grow later**  
   The structure should allow future additions like audio, import/export, and better review logic.

---

## Target Users

### Primary
Swedish learners around **A2 to B2**, especially users who want better conversation flow.

### Secondary
Users who want:

- a lightweight daily vocab tool
- level-based learning
- simple review without a full course structure

---

## Product Boundaries

### Included product direction
This app is:

- a vocabulary trainer
- level-based
- recall-focused
- phone-friendly
- static-hosting friendly

### Explicitly not the product in v1
This app is not:

- a full Swedish course
- a grammar-heavy learning platform
- an AI tutor
- a social/community product
- a cloud-sync product
- a classroom/teacher tool

---

## MVP Scope

### Included in v1
- level selection
- vocabulary packs
- Home screen
- Study session flow
- Swedish → English mode
- English → Swedish mode
- Reveal answer flow
- Easy / Hard / Wrong rating
- simple review scheduling
- local progress saving
- Progress screen
- Settings screen

### Nice if manageable
- example sentences
- pack detail page
- basic filtering by level/pack

### Explicitly postponed
- audio
- import/export
- cloud sync
- user accounts
- AI features
- grammar lessons
- sentence gap tests
- streaks/gamification
- placement test

---

## Core User Flow

### First-time user
1. Open app
2. Choose level
3. Choose goal or default study mode
4. Land on Home
5. Start first study session

### Returning user
1. Open app
2. See due review and new items
3. Tap Start Study
4. Complete short session
5. See summary
6. Leave and return later

---

## Main Screens

### 1. Home
Shows:
- selected level
- due review count
- new item count
- start study button

### 2. Study Session
Card flow:
- show prompt
- reveal answer
- mark Easy / Hard / Wrong

### 3. Session Summary
Shows:
- studied count
- easy / hard / wrong totals

### 4. Packs
Shows:
- available packs
- level
- progress

### 5. Progress
Shows:
- sessions completed
- items seen
- learning count
- mastered count

### 6. Settings
Lets user change:
- level
- active test modes
- daily new item count
- daily review limit

---

## Study Logic Summary

Each item has a state:

- new
- learning
- review
- mastered

A study session includes:

- due review items
- a few new items
- retry items for wrong answers

User studies by:

1. seeing a prompt
2. trying to recall
3. revealing answer
4. rating recall:
   - Easy
   - Hard
   - Wrong

The app schedules the next review based on that rating.

Wrong items may reappear once near the end of the same session.

---

## Technical Direction — App

### App type
Static mobile web app

### Deployment target
Free static hosting

### Storage
Local browser storage

### Content format
Static JSON files for:
- levels
- packs
- vocabulary items
- test modes

### Saved local data
- app settings
- user progress
- session history

---

## Data Pipeline Purpose

Build a data ingestion and processing pipeline for the Swedish vocabulary app.

The goal is **not** to handwrite thousands of vocabulary entries manually.
Instead, the pipeline should:

1. import trusted Swedish vocabulary/frequency data sources
2. normalize and merge entries into a single app-ready library
3. enrich entries with English translations, examples, and optional phonetic/audio metadata
4. export a clean master dataset plus pack-level subsets for the app

The pipeline should support generating an initial **3,000–3,500 entry app library** focused on common, useful Swedish vocabulary for learners.

---

## Data Pipeline Goals

Create a reproducible pipeline that produces:

- a clean master Swedish vocabulary library
- app-ready JSON and CSV exports
- level-based and topic-based pack files
- attribution metadata for source compliance

The pipeline should be modular, reproducible, and easy to extend later.

---

## Data Strategy

### Backbone source
Use a frequency-ranked Swedish learner-oriented source as the backbone for:

- lemma
- rank
- CEFR level if available
- part of speech
- example information if available

### Enrichment source
Use a Swedish-English lexical source as the enrichment layer for:

- English translations
- example sentences
- phonetics
- optional audio URLs

### Optional future enrichment
Later the pipeline may incorporate:

- phrase/multi-word expression sources
- learner-frequency sources
- manual curation files
- custom pack mappings

---

## Data Pipeline Non-Goals

The pipeline should not try to:

- generate a full Swedish dictionary
- include every rare or obscure word
- solve grammar teaching
- produce perfect translations for every sense automatically
- fully automate semantic curation without review

The output is for a practical vocabulary app, not for lexicographic completeness.

---

## Data Deliverables

### Raw input area
- `data/raw/...`

### Intermediate normalized data
- `data/intermediate/...`

### Final processed outputs
- `data/processed/vocab_master.json`
- `data/processed/vocab_master.csv`
- `data/processed/packs/*.json`
- `data/processed/levels/*.json` (optional)

### Metadata and compliance
- `data/processed/source_manifest.json`
- `ATTRIBUTION.md`
- `LICENSE_NOTES.md`

---

## Recommended Project Structure

```text
project/
├── app/
│   ├── src/
│   ├── public/
│   └── package.json
├── vocab-pipeline/
│   ├── data/
│   │   ├── raw/
│   │   ├── intermediate/
│   │   └── processed/
│   │       ├── packs/
│   │       └── levels/
│   ├── scripts/
│   │   ├── ingest/
│   │   ├── normalize/
│   │   ├── merge/
│   │   ├── curate/
│   │   ├── export/
│   │   └── validate/
│   ├── config/
│   │   ├── field_mappings/
│   │   ├── pack_rules/
│   │   ├── tag_rules/
│   │   └── priority_rules/
│   ├── tests/
│   ├── ATTRIBUTION.md
│   ├── LICENSE_NOTES.md
│   └── README.md
└── README.md
```

---

## App Data Model

Each final vocabulary item should follow a consistent schema.

### Required fields
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

### Strongly recommended fields
- `exampleSv`
- `exampleEn`
- `phonetic`
- `audioUrl`
- `notes`
- `normalizedKey`
- `isPhrase`

### Example output item
```json
{
  "id": "sv_000001",
  "lemma": "dag",
  "swedish": "dag",
  "english": ["day"],
  "partOfSpeech": "noun",
  "frequencyRank": 190,
  "cefrLevel": "A1",
  "packIds": ["a1_core", "daily_life"],
  "tags": ["common", "time"],
  "priority": 5,
  "exampleSv": "god dag",
  "exampleEn": "good day",
  "phonetic": null,
  "audioUrl": null,
  "notes": "",
  "normalizedKey": "dag|noun",
  "isPhrase": false,
  "sources": ["frequency_source", "dictionary_source"]
}
```

---

## Source Handling Requirements

### 1. Frequency backbone ingestion
The pipeline should ingest a frequency-ranked Swedish source and extract at minimum:
- surface form or lemma
- CEFR level if present
- part of speech if present
- rank/frequency indicator
- any source example or usage metadata

### 2. Dictionary enrichment ingestion
The pipeline should ingest a Swedish-English dictionary-style source and extract where available:
- translation(s)
- example sentence(s)
- phonetic transcription
- audio URL or audio reference
- inflection metadata if useful

### 3. Manual override layer
The pipeline should support manual correction files for:
- translation fixes
- pack assignment fixes
- tag corrections
- priority overrides
- exclusion list

Suggested files:
- `data/raw/manual/manual_overrides.json`
- `data/raw/manual/exclusions.json`
- `data/raw/manual/custom_pack_assignments.json`

---

## Normalization Rules

### Text normalization
- trim whitespace
- normalize Unicode consistently
- normalize case where appropriate
- preserve original Swedish display form
- remove obvious duplicate spacing/punctuation errors

### Lemma normalization
- create a stable normalized merge key
- ideally use lemma + part of speech as the merge key
- preserve original source values separately if helpful

### Part of speech normalization
Map source-specific POS labels into a controlled internal set:
- noun
- verb
- adjective
- adverb
- pronoun
- preposition
- conjunction
- interjection
- phrase
- other

### CEFR normalization
Normalize CEFR values into a controlled set:
- A1
- A2
- B1
- B1+
- B2
- C1
- unknown

If a source lacks CEFR, the pipeline may infer a provisional level from rank ranges or leave it as `unknown` for later assignment.

---

## Merge Logic

### Merge key preference
Use a stable merge key such as:
- `normalized_lemma + part_of_speech`

### Merge priority
When data conflicts:
1. manual overrides win
2. backbone source owns `frequencyRank`
3. most trusted lexical source owns `english`
4. preserve alternate values when possible instead of discarding silently

### Translation handling
Translations should support multiple values.

### Duplicate handling
The pipeline should detect and resolve:
- exact duplicate lemmas
- duplicate entries with different source spellings
- homographs with different parts of speech
- entries duplicated across packs

Homographs with different POS should remain separate if meaning differs.

---

## Curation Rules for the App Library

The first curated app-ready library should target **3,000–3,500 entries**.

### Suggested distribution
- A1: 500
- A2: 700
- B1: 900
- B1+: 500
- B2 core/conversation: 400–900

### Prioritization principles
Prefer words that are:
- frequent
- useful in daily life
- useful in conversation
- useful across multiple contexts
- valuable for learners at A2–B2

Deprioritize words that are:
- too rare
- highly domain-specific
- archaic
- obscure proper nouns
- low-value duplicates

---

## Pack Assignment Rules

Each entry should support one or more `packIds`.

### Core pack examples
- `a1_core`
- `a2_core`
- `b1_core`
- `b1plus_conversation`
- `b2_core`

### Topic pack examples
- `daily_life`
- `time_and_schedule`
- `feelings_and_reactions`
- `common_verbs`
- `work_and_study`
- `conversation_chunks`

### Pack assignment strategy
Packs may be assigned by:
- CEFR level
- tags
- part of speech
- manual mapping rules
- frequency thresholds

---

## Tagging Rules

Each entry should support multiple tags.

### Example tags
- `common`
- `conversation`
- `daily_life`
- `time`
- `feelings`
- `work`
- `study`
- `verb`
- `abstract`
- `spoken`
- `high_priority`

---

## Priority Rules

Each entry should have a `priority` value from 1–5.

### Suggested meaning
- `5` = extremely important/common
- `4` = very useful/high-value
- `3` = useful general vocabulary
- `2` = secondary/lower urgency
- `1` = low priority / optional

Priority may be based on:
- frequency rank
- CEFR level relevance
- conversation usefulness
- manual overrides

---

## Export Requirements

The pipeline should export at least:

### 1. Master JSON
- `data/processed/vocab_master.json`

### 2. Master CSV
- `data/processed/vocab_master.csv`

### 3. Pack JSON files
Examples:
- `data/processed/packs/b1_core.json`
- `data/processed/packs/b1plus_conversation.json`

### 4. Optional level JSON files
Examples:
- `data/processed/levels/A1.json`
- `data/processed/levels/B1.json`

---

## Validation Requirements

Add validation scripts to check:
- required fields exist
- `id` values are unique
- `normalizedKey` values are consistent
- `frequencyRank` is numeric when present
- `cefrLevel` values are valid
- no empty `swedish` values
- no duplicate pack IDs inside one entry
- source provenance is present

Validation should fail loudly on critical schema problems.

---

## Source Provenance Requirements

Every entry should preserve provenance.

Example:
```json
"sources": [
  {
    "name": "frequency_source",
    "sourceId": "12345"
  },
  {
    "name": "dictionary_source",
    "sourceId": "abcde"
  }
]
```

This helps with:
- debugging merges
- future reprocessing
- attribution compliance

---

## Compliance and Attribution

The pipeline must preserve source attribution and make it easy to satisfy source license obligations.

Required outputs:
- `ATTRIBUTION.md`
- `LICENSE_NOTES.md`
- `source_manifest.json`

These should document:
- source names
- source URLs or acquisition details
- license notes
- fields derived from each source
- any redistribution or share-alike concerns

---

## Unified Milestones

### Milestone 1 — Product skeleton
**Goal:** Define the app structure and create the basic project scaffold.

**Deliverables:**
- project structure
- routing/navigation
- placeholder screens
- static sample data
- local storage utility

**Success criteria:**
- app opens on phone
- user can navigate between screens
- settings/progress can be saved locally

### Milestone 2 — Core study flow
**Goal:** Implement the actual vocabulary training loop.

**Deliverables:**
- study session screen
- reveal-answer interaction
- Easy / Hard / Wrong actions
- session summary
- support for both test modes

**Success criteria:**
- user can complete a study session end to end
- item results are recorded correctly

### Milestone 3 — Review engine
**Goal:** Add useful scheduling and progress tracking.

**Deliverables:**
- item states: new / learning / review / mastered
- next review date logic
- daily session builder
- wrong-item retry in same session

**Success criteria:**
- due items are selected correctly
- easy/hard/wrong changes future review timing
- progress feels persistent and logical

### Milestone 4 — Data ingestion scaffold
**Goal:** Create the initial vocabulary pipeline foundation.

**Deliverables:**
- raw data directories
- ingestion scripts for primary sources
- pipeline README
- common schema definitions

**Success criteria:**
- source data can be imported reproducibly
- normalized intermediate files can be generated

### Milestone 5 — Merge, curation, and exports
**Goal:** Produce the first app-ready vocabulary library.

**Deliverables:**
- source merge logic
- duplicate handling
- pack assignment rules
- tag generation
- top 3,000–3,500 entry export
- JSON/CSV outputs
- validation scripts
- attribution files

**Success criteria:**
- app-ready vocab library is generated reproducibly
- entries are normalized and deduplicated
- outputs validate successfully

### Milestone 6 — Packs and level filtering in app
**Goal:** Make content selection practical in the app.

**Deliverables:**
- pack list screen
- pack detail or pack summary
- level-based filtering
- enabled/disabled packs in settings or pack screen

**Success criteria:**
- user can control which content enters study sessions
- sessions respect chosen level and packs

### Milestone 7 — Progress and usability polish
**Goal:** Make the app pleasant and usable as a daily tool.

**Deliverables:**
- progress screen
- better mobile layout
- empty states
- loading/error handling
- improved home dashboard

**Success criteria:**
- app feels coherent on phone
- progress is understandable
- daily use feels smooth

### Milestone 8 — Content expansion
**Goal:** Prepare the first meaningful production content set.

**Deliverables:**
- initial pack set
- prioritization of vocab items
- B1/B1+ focused seed content
- examples where possible

**Success criteria:**
- enough vocabulary exists for real daily use
- content structure scales cleanly

---

## Practical Build Order

Suggested execution order:

1. scaffold app + navigation
2. add static sample vocab data
3. build local storage layer
4. build study card flow
5. add session result handling
6. add review scheduling
7. scaffold pipeline repo and ingestion scripts
8. add normalization and merge logic
9. export first app-ready packs
10. wire real vocab data into app
11. add Home / Progress / Packs improvements
12. polish mobile UX

---

## Suggested First Release Definition

A first public/personal usable release should include:

- onboarding with level selection
- at least 2–4 vocab packs
- both recall modes
- local progress saving
- daily review flow
- simple progress overview
- mobile-friendly layout
- initial app-ready curated vocabulary set generated through the pipeline

That is enough to validate the concept.

---

## Codex Handoff Prompt Draft

Build a phone-first Swedish vocabulary web app as a static site, together with a vocabulary data pipeline.

### App requirements
- level selection
- vocabulary packs
- two test modes: Swedish→English and English→Swedish
- reveal-answer card flow
- Easy / Hard / Wrong rating
- simple review scheduling
- local progress saving
- Home, Study, Packs, Progress, Settings screens

### Data pipeline requirements
- do not handwrite thousands of entries manually
- ingest a trusted Swedish frequency-ranked source as the backbone
- ingest a Swedish-English dictionary-style source for translations/examples/audio metadata
- normalize, merge, and enrich the data into one app-ready schema
- preserve source provenance and attribution
- export a master JSON, master CSV, and pack-level JSON files
- generate an initial curated 3,000–3,500 entry app library

### Technical constraints
- no backend
- no user accounts
- no cloud sync
- static JSON content for the app
- local browser storage
- modular, scriptable pipeline
- include validation scripts
- include attribution/license notes
- mobile-first responsive UI

### Product intent
The product is a Swedish vocabulary app focused on:
- active recall
- common useful vocabulary
- level-based learning
- conversation-ready usage

It is not trying to be a full dictionary or full language course.

---

## Success Criteria

The overall project is successful when:

- the app works smoothly on phone as a static web app
- users can complete short daily vocabulary sessions
- progress persists locally
- a clean 3,000–3,500 entry app-ready vocabulary library can be generated reproducibly
- entries are normalized and deduplicated
- outputs validate successfully
- source attribution is preserved clearly

