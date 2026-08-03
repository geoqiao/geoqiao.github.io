#!/usr/bin/env python3
"""Render site-owned compatibility pages for one-time Blog slug migrations."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

_BLOG_ROUTE = re.compile(r"^/blog/([a-z0-9]+(?:-[a-z0-9]+)*)/$")


def _origin(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("origin must be a string")
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.netloc
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
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


def render_redirects(mapping_path: Path, output: Path) -> tuple[int, int]:
    data = json.loads(mapping_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("redirect map must be a JSON object")
    origin = _origin(data.get("origin"))
    redirects = data.get("redirects")
    if not isinstance(redirects, list):
        raise ValueError("redirects must be a list")
    if not output.is_dir():
        raise ValueError(f"output directory does not exist: {output}")

    plans: list[tuple[Path, str] | None] = []
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

        source = _output_path(output, source_route)
        target = _output_path(output, target_route)
        if target.exists():
            if source.exists():
                raise ValueError(
                    f"both source and target canonical pages exist: {source_route!r}"
                )
            plans.append((source, f"{origin}{target_route}"))
        elif source.exists():
            plans.append(None)
        else:
            raise ValueError(
                f"neither source nor target exists: {source_route!r} -> {target_route!r}"
            )

    created = 0
    skipped = 0
    for plan in plans:
        if plan is None:
            skipped += 1
            continue
        source, target_url = plan
        source.parent.mkdir(parents=True, exist_ok=False)
        source.write_text(_redirect_html(target_url), encoding="utf-8")
        created += 1
    return created, skipped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--map", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        created, skipped = render_redirects(args.map, args.output)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"redirect rendering failed: {exc}", file=sys.stderr)
        return 1
    print(f"slug redirects: created={created} skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
