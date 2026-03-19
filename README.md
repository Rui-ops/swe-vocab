# Swedish Vocab App

Phone-first Swedish vocabulary learning app with a supporting vocabulary ingestion pipeline.

## Structure

- `app/`: React + Vite + TypeScript static web app
- `vocab-pipeline/`: Python-based data ingestion and export scaffold

## App

```bash
cd app
npm install
npm run dev
```

## GitHub Pages

This repo is configured to deploy the app to GitHub Pages from the `main` branch.

Expected Pages URL:

```text
https://rui-ops.github.io/swe-vocab/
```

To enable it in GitHub:

1. Open the repository settings.
2. Go to `Settings -> Pages`.
3. Under `Build and deployment`, choose `GitHub Actions`.
4. Push to `main` or run the `Deploy GitHub Pages` workflow manually.

Lean v1 target:

- one daily review loop
- 30 new words per local day from one fixed daily pack
- Swedish -> English as the primary study direction
- simple local review scheduling
- local progress persistence

Current app status:

- phone-first shell
- Home, Study, Session Summary, Progress, and Settings as the primary flow
- pipeline-backed `app/public/data/vocab_master.json` with 3,634 generated entries
- CEFR core packs across `A1`, `A2`, `B1`, and `B2`
- deterministic review engine with retry-once behavior
- calendar-day daily packs that stay fixed for the whole local day
- typed local storage persistence for settings, progress, and session history

## Pipeline

See [vocab-pipeline/README.md](/home/ruizhi/Mmmsk/swe-vocab/vocab-pipeline/README.md) for the lean pipeline flow. The main v1 target is one app-ready JSON dataset and the repo currently ships a generated 3,634-entry library.
