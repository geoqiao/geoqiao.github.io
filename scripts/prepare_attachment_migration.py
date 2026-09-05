"""Preview the explicit September 2026 attachment migration; never write to GitHub.

Input is a `gh api --paginate --slurp repos/.../issues?state=all` backup.
This handles only the reviewed HTML image references in the migration map.
It is not a general Markdown uploader or synchronizer.
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import subprocess
from pathlib import Path

REPOSITORY = "geoqiao/geoqiao.github.io"


def prepare_bodies(root: Path, issues: list[dict], manifest: dict) -> dict[int, str]:
    root = root.resolve()
    commit = manifest["commit"]
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Attachment revision must be a full commit SHA")
    bodies = {issue["number"]: issue["body"] for issue in issues}
    proposed: dict[int, str] = {}
    for asset in manifest["assets"]:
        number, relative = asset["issue_number"], asset["path"]
        if not re.fullmatch(rf"assets/issues/{number}/[a-zA-Z0-9._-]+", relative):
            raise ValueError(f"Unsafe attachment path: {relative}")
        target = root / relative
        if target.resolve() != target:
            raise ValueError(f"Symlink attachment path: {relative}")
        data = target.read_bytes()
        committed = subprocess.check_output(
            ["git", "-C", str(root), "show", f"{commit}:{relative}"]
        )
        if (
            data != committed
            or len(data) != asset["size"]
            or hashlib.sha256(data).hexdigest() != asset["sha256"]
        ):
            raise ValueError(f"Attachment bytes differ: {relative}")
        body = proposed.get(number, bodies[number])
        old = f'src="{asset["old_url"]}"'
        if body.count(old) != 1:
            raise ValueError(
                f"Issue #{number}: expected exactly one reviewed image reference"
            )
        new = (
            f'src="https://raw.githubusercontent.com/{REPOSITORY}/{commit}/{relative}"'
        )
        proposed[number] = body.replace(old, new, 1)
    return proposed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backup", type=Path, required=True)
    parser.add_argument("--map", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--repository-root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    args = parser.parse_args()
    issues = [
        issue
        for page in json.loads(args.backup.read_text())
        for issue in page
        if "pull_request" not in issue
    ]
    manifest = json.loads(args.map.read_text())
    if manifest["repository"] != REPOSITORY:
        raise ValueError("Migration repository mismatch")
    proposed = prepare_bodies(args.repository_root, issues, manifest)
    # Exclusive output: previous backups and previews must never be overwritten.
    args.output.mkdir(parents=True, exist_ok=False)
    diffs = []
    checksums = {}
    for issue in issues:
        number = issue["number"]
        if number not in proposed:
            continue
        body = proposed[number]
        (args.output / f"{number}.md").write_bytes(body.encode("utf-8"))
        checksums[str(number)] = {
            "before_sha256": hashlib.sha256(issue["body"].encode()).hexdigest(),
            "after_sha256": hashlib.sha256(body.encode()).hexdigest(),
        }
        diffs.extend(
            difflib.unified_diff(
                issue["body"].splitlines(keepends=True),
                body.splitlines(keepends=True),
                fromfile=f"issue-{number}-before",
                tofile=f"issue-{number}-proposed",
            )
        )
    (args.output / "changes.diff").write_text("".join(diffs), encoding="utf-8")
    (args.output / "checksums.json").write_text(json.dumps(checksums, indent=2) + "\n")
    print(f"Prepared {len(proposed)} Issue bodies in {args.output}; no GitHub writes.")


if __name__ == "__main__":
    main()
