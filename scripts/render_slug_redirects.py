#!/usr/bin/env python3
"""Render and validate site-owned compatibility pages for Blog slug migrations."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

_BLOG_ROUTE = re.compile(r"^/blog/([a-z0-9]+(?:-[a-z0-9]+)*)/$")
_SITE_SMOKE_FILES = (
    "index.html",
    "about/index.html",
    "blog/index.html",
    "ideas/index.html",
    "projects/index.html",
    "tags/index.html",
    "atom.xml",
    "sitemap.xml",
    "robots.txt",
    "templates/geoqiao.me/static/css/style.css",
    "templates/geoqiao.me/static/images/favicon.png",
    "templates/geoqiao.me/static/js/comments.js",
    "templates/geoqiao.me/static/js/theme.js",
)


@dataclass(frozen=True)
class _Redirect:
    source_route: str
    target_route: str
    source: Path
    target: Path
    target_url: str


@dataclass(frozen=True)
class _TreeEntry:
    kind: str
    digest: str = ""


def _origin(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("origin must be a string")
    parsed = urlsplit(value)
    try:
        hostname = parsed.hostname
        parsed.port
    except ValueError as exc:
        raise ValueError("origin must contain a valid HTTPS host") from exc
    if (
        parsed.scheme != "https"
        or not parsed.netloc
        or hostname is None
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
        or html.escape(parsed.netloc, quote=True) != parsed.netloc
        or any(character.isspace() for character in parsed.netloc)
    ):
        raise ValueError("origin must be an HTTPS origin without a path")
    return f"https://{parsed.netloc}"


def _output_path(output: Path, route: object) -> Path:
    if not isinstance(route, str):
        raise ValueError("redirect routes must be strings")
    match = _BLOG_ROUTE.fullmatch(route)
    if match is None:
        raise ValueError(f"invalid Blog redirect route: {route!r}")
    return output / "blog" / match.group(1) / "index.html"


def _redirect_html(target_url: str) -> str:
    escaped = html.escape(target_url, quote=True)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page moved</title>
  <link rel="canonical" href="{escaped}">
  <meta http-equiv="refresh" content="0; url={escaped}">
</head>
<body>
  <p>This page moved to <a href="{escaped}">{escaped}</a>.</p>
</body>
</html>
"""


def _resolve_output(output: Path, repository_root: Path) -> Path:
    if output.is_absolute() or not output.parts or ".." in output.parts:
        raise ValueError("output must be a contained repository-relative path")

    try:
        root = repository_root.resolve(strict=True)
    except OSError as exc:
        raise ValueError(f"repository root is unavailable: {repository_root}") from exc
    if not root.is_dir():
        raise ValueError(f"repository root is not a directory: {repository_root}")

    candidate = root
    for component in output.parts:
        candidate /= component
        if candidate.is_symlink():
            raise ValueError(f"output path contains a symbolic link: {candidate}")
    try:
        resolved = candidate.resolve(strict=True)
        resolved.relative_to(root)
    except (OSError, ValueError) as exc:
        raise ValueError(
            f"output directory is unavailable or escapes repository: {output}"
        ) from exc
    if resolved == root or not resolved.is_dir():
        raise ValueError(f"output directory does not exist: {output}")
    return resolved


def _file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _snapshot_tree(output: Path) -> dict[str, _TreeEntry]:
    snapshot: dict[str, _TreeEntry] = {}

    def visit(directory: Path) -> None:
        try:
            entries = sorted(os.scandir(directory), key=lambda entry: entry.name)
        except OSError as exc:
            raise ValueError(f"cannot inspect artifact directory: {directory}") from exc
        for entry in entries:
            path = Path(entry.path)
            relative = path.relative_to(output).as_posix()
            if entry.is_symlink():
                raise ValueError(f"artifact contains a symbolic link: {relative}")
            if entry.is_dir(follow_symlinks=False):
                snapshot[relative] = _TreeEntry("directory")
                visit(path)
            elif entry.is_file(follow_symlinks=False):
                snapshot[relative] = _TreeEntry("file", _file_digest(path))
            else:
                raise ValueError(f"artifact contains a non-file entry: {relative}")

    visit(output)
    return snapshot


def _load_redirects(mapping_path: Path, output: Path) -> list[_Redirect]:
    data = json.loads(mapping_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("redirect map must be a JSON object")
    origin = _origin(data.get("origin"))
    redirects = data.get("redirects")
    if not isinstance(redirects, list):
        raise ValueError("redirects must be a list")

    result: list[_Redirect] = []
    seen_sources: set[str] = set()
    seen_targets: set[str] = set()
    for entry in redirects:
        if not isinstance(entry, dict) or set(entry) != {"from", "to"}:
            raise ValueError("each redirect requires exactly 'from' and 'to'")
        source_route = entry["from"]
        target_route = entry["to"]
        if not isinstance(source_route, str) or not isinstance(target_route, str):
            raise ValueError("redirect routes must be strings")
        if source_route == target_route:
            raise ValueError(f"redirect source equals target: {source_route!r}")
        if source_route in seen_sources:
            raise ValueError(f"duplicate redirect source: {source_route!r}")
        if target_route in seen_targets:
            raise ValueError(f"duplicate redirect target: {target_route!r}")
        seen_sources.add(source_route)
        seen_targets.add(target_route)
        result.append(
            _Redirect(
                source_route=source_route,
                target_route=target_route,
                source=_output_path(output, source_route),
                target=_output_path(output, target_route),
                target_url=f"{origin}{target_route}",
            )
        )
    return result


def _require_regular_file(path: Path, label: str) -> None:
    if not path.is_file() or path.is_symlink():
        raise ValueError(f"{label} is not a regular file: {path}")


def _validate_smoke_artifacts(output: Path) -> None:
    for relative in _SITE_SMOKE_FILES:
        _require_regular_file(output / relative, "required site artifact")


def _validate_redirect_artifacts(redirects: list[_Redirect]) -> tuple[int, int]:
    created = 0
    skipped = 0
    for redirect in redirects:
        if redirect.target.exists():
            _require_regular_file(
                redirect.target,
                f"redirect target {redirect.target_route!r}",
            )
            _require_regular_file(
                redirect.source,
                f"rendered redirect {redirect.source_route!r}",
            )
            expected = _redirect_html(redirect.target_url)
            try:
                actual = redirect.source.read_text(encoding="utf-8")
            except UnicodeError as exc:
                raise ValueError(
                    f"redirect HTML is not valid UTF-8: {redirect.source_route!r}"
                ) from exc
            if actual != expected:
                raise ValueError(
                    f"redirect HTML is not the safe expected document: "
                    f"{redirect.source_route!r}"
                )
            created += 1
        elif redirect.source.exists():
            _require_regular_file(
                redirect.source,
                f"pre-cutover canonical source {redirect.source_route!r}",
            )
            skipped += 1
        else:
            raise ValueError(
                f"neither source nor target exists: "
                f"{redirect.source_route!r} -> {redirect.target_route!r}"
            )
    return created, skipped


def _validate_expected_changes(
    before: dict[str, _TreeEntry],
    after: dict[str, _TreeEntry],
    expected_additions: dict[str, _TreeEntry],
) -> None:
    changed = sorted(
        relative for relative, entry in before.items() if after.get(relative) != entry
    )
    if changed:
        raise ValueError(
            "redirect rendering changed or removed existing artifacts: "
            + ", ".join(changed)
        )

    additions = set(after) - set(before)
    expected = set(expected_additions)
    if additions != expected:
        unexpected = sorted(additions - expected)
        missing = sorted(expected - additions)
        details = []
        if unexpected:
            details.append(f"unexpected={unexpected}")
        if missing:
            details.append(f"missing={missing}")
        raise ValueError(
            "redirect rendering produced an unexpected artifact delta: "
            + "; ".join(details)
        )
    mismatched = sorted(
        relative
        for relative, entry in expected_additions.items()
        if after.get(relative) != entry
    )
    if mismatched:
        raise ValueError(
            "redirect artifacts differ from their expected content: "
            + ", ".join(mismatched)
        )


def render_redirects(
    mapping_path: Path,
    output_path: Path,
    repository_root: Path,
) -> tuple[int, int, int]:
    output = _resolve_output(output_path, repository_root)
    before = _snapshot_tree(output)
    _validate_smoke_artifacts(output)
    redirects = _load_redirects(mapping_path, output)

    plans: list[_Redirect | None] = []
    for redirect in redirects:
        if redirect.target.exists():
            _require_regular_file(
                redirect.target,
                f"redirect target {redirect.target_route!r}",
            )
            if redirect.source.exists():
                raise ValueError(
                    f"both source and target canonical pages exist: "
                    f"{redirect.source_route!r}"
                )
            if redirect.source.parent.exists():
                raise ValueError(
                    f"redirect source directory already exists: "
                    f"{redirect.source_route!r}"
                )
            plans.append(redirect)
        elif redirect.source.exists():
            _require_regular_file(
                redirect.source,
                f"pre-cutover canonical source {redirect.source_route!r}",
            )
            plans.append(None)
        else:
            raise ValueError(
                f"neither source nor target exists: "
                f"{redirect.source_route!r} -> {redirect.target_route!r}"
            )

    expected_additions: dict[str, _TreeEntry] = {}
    for plan in plans:
        if plan is None:
            continue
        content = _redirect_html(plan.target_url)
        plan.source.parent.mkdir(parents=False, exist_ok=False)
        with plan.source.open("x", encoding="utf-8", newline="\n") as stream:
            stream.write(content)
        parent_relative = plan.source.parent.relative_to(output).as_posix()
        source_relative = plan.source.relative_to(output).as_posix()
        expected_additions[parent_relative] = _TreeEntry("directory")
        expected_additions[source_relative] = _TreeEntry(
            "file", hashlib.sha256(content.encode("utf-8")).hexdigest()
        )

    after = _snapshot_tree(output)
    _validate_smoke_artifacts(output)
    created, skipped = _validate_redirect_artifacts(redirects)
    _validate_expected_changes(before, after, expected_additions)
    return created, skipped, len(after)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--map", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--repository-root", default=Path.cwd(), type=Path)
    args = parser.parse_args()
    try:
        created, skipped, entries = render_redirects(
            args.map,
            args.output,
            args.repository_root,
        )
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(
            f"redirect rendering or artifact validation failed: {exc}", file=sys.stderr
        )
        return 1
    print(
        f"slug redirects: created={created} skipped={skipped}; "
        f"final artifact entries={entries}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
