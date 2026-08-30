#!/usr/bin/env python3
"""Build the public VPS runtime archive from the repository worktree."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import tarfile
from pathlib import Path

ROOT_FILES = ("index.html", "styles.css")
APP_FILES = ("index.html", "styles.css", "app.js", "sw.js", "manifest.webmanifest")
FORBIDDEN = re.compile(r"(?:tiny-clue-box|family-0[1-9]\.webp)", re.IGNORECASE)


def collect(repo: Path) -> list[Path]:
    files = [repo / name for name in ROOT_FILES]
    apps = repo / "apps"
    for app in sorted(path for path in apps.iterdir() if path.is_dir()):
        for name in APP_FILES:
            path = app / name
            if not path.is_file():
                raise SystemExit(f"missing runtime file: {path.relative_to(repo)}")
            files.append(path)

    for path in files:
        if not path.is_file():
            raise SystemExit(f"missing runtime file: {path.relative_to(repo)}")
        rel = path.relative_to(repo).as_posix()
        if FORBIDDEN.search(rel):
            raise SystemExit(f"forbidden runtime path: {rel}")

    root_html = (repo / "index.html").read_text(encoding="utf-8")
    if "styles.css" not in root_html:
        raise SystemExit("root index.html does not reference styles.css")
    if FORBIDDEN.search(root_html):
        raise SystemExit("forbidden photo-clue reference in root index.html")
    return files


def build(repo: Path, output: Path) -> dict[str, object]:
    files = collect(repo)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(output, "w:gz") as archive:
        for path in files:
            archive.add(path, arcname=path.relative_to(repo).as_posix(), recursive=False)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    return {
        "archive": str(output),
        "files": len(files),
        "bytes": output.stat().st_size,
        "sha256": digest,
        "root_css_included": (repo / "styles.css") in files,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="dist/parent-kids-mini-apps-runtime.tar.gz")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    print(json.dumps(build(repo, repo / args.output), ensure_ascii=False))


if __name__ == "__main__":
    main()
