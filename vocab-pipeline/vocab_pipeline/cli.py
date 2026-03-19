from __future__ import annotations

import argparse
from pathlib import Path

from .normalize import normalize_json_file
from .pipeline import merge_and_export
from .seed import generate_seed_files
from .sync import sync_app_data
from .validate import validate_json_file


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Swedish vocab pipeline scaffold")
    subparsers = parser.add_subparsers(dest="command", required=True)

    normalize_parser = subparsers.add_parser("normalize-json", help="Normalize a raw JSON source file")
    normalize_parser.add_argument("--input", required=True, type=Path)
    normalize_parser.add_argument("--output", required=True, type=Path)
    normalize_parser.add_argument("--source-name", required=True)

    validate_parser = subparsers.add_parser("validate-json", help="Validate a normalized JSON file")
    validate_parser.add_argument("--input", required=True, type=Path)

    seed_parser = subparsers.add_parser("generate-seed", help="Generate a large seed vocabulary dataset")
    seed_parser.add_argument("--backbone-output", required=True, type=Path)
    seed_parser.add_argument("--dictionary-output", required=True, type=Path)

    export_parser = subparsers.add_parser(
        "merge-export", help="Merge normalized sources and export app-ready outputs"
    )
    export_parser.add_argument("--backbone-input", required=True, type=Path)
    export_parser.add_argument("--dictionary-input", required=True, type=Path)
    export_parser.add_argument("--processed-dir", required=True, type=Path)
    export_parser.add_argument("--config-dir", required=True, type=Path)
    export_parser.add_argument("--raw-dir", required=True, type=Path)
    export_parser.add_argument("--project-root", required=True, type=Path)

    sync_parser = subparsers.add_parser(
        "sync-app-data", help="Copy processed vocab output into the app data directory"
    )
    sync_parser.add_argument("--processed-input", required=True, type=Path)
    sync_parser.add_argument("--app-data-dir", required=True, type=Path)

    return parser


def main() -> int:
    args = build_parser().parse_args()

    if args.command == "normalize-json":
        count = normalize_json_file(args.input, args.output, args.source_name)
        print(f"normalized {count} rows into {args.output}")
        return 0

    if args.command == "validate-json":
        errors = validate_json_file(args.input)
        if errors:
            for error in errors:
                print(error)
            return 1
        print(f"validated {args.input}")
        return 0

    if args.command == "generate-seed":
        count = generate_seed_files(args.backbone_output, args.dictionary_output)
        print(f"generated {count} seed entries")
        return 0

    if args.command == "merge-export":
        count = merge_and_export(
            backbone_input=args.backbone_input,
            dictionary_input=args.dictionary_input,
            processed_dir=args.processed_dir,
            config_dir=args.config_dir,
            raw_dir=args.raw_dir,
            project_root=args.project_root,
        )
        print(f"exported {count} curated entries into {args.processed_dir}")
        return 0

    if args.command == "sync-app-data":
        count = sync_app_data(args.processed_input, args.app_data_dir)
        print(f"synced {count} entries into {args.app_data_dir}")
        return 0

    raise ValueError(f"unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
