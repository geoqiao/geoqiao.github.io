from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

from scripts.render_slug_redirects import _redirect_html

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPOSITORY_ROOT / "scripts" / "render_slug_redirects.py"
SMOKE_FILES = (
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


class _HTMLProbe(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tags: list[str] = []
        self.attributes: list[tuple[str, dict[str, str]]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tags.append(tag)
        self.attributes.append((tag, {name: value or "" for name, value in attrs}))


class RenderSlugRedirectsTests(unittest.TestCase):
    def seed_site_artifact(self, output: Path) -> None:
        for relative in SMOKE_FILES:
            path = output / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"site artifact: {relative}", encoding="utf-8")

    def write_mapping(
        self,
        root: Path,
        redirects: list[dict[str, str]],
        *,
        origin: str = "https://geoqiao.me",
    ) -> Path:
        mapping = root / "redirects.json"
        mapping.write_text(
            json.dumps({"origin": origin, "redirects": redirects}),
            encoding="utf-8",
        )
        return mapping

    def run_script(
        self,
        root: Path,
        output: Path,
        redirects: list[dict[str, str]],
        *,
        origin: str = "https://geoqiao.me",
    ) -> subprocess.CompletedProcess[str]:
        mapping = self.write_mapping(root, redirects, origin=origin)
        return subprocess.run(  # noqa: S603 - fixed test command
            [
                sys.executable,
                str(SCRIPT),
                "--map",
                str(mapping),
                "--output",
                str(output.relative_to(root)),
                "--repository-root",
                str(root),
            ],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_cli_renders_and_validates_compatible_page_for_migrated_slug(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)
            target = output / "blog" / "new-english-slug" / "index.html"
            target.parent.mkdir(parents=True)
            target.write_text("new canonical page", encoding="utf-8")

            result = self.run_script(
                root,
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            redirect = output / "blog" / "old-pinyin-slug" / "index.html"
            text = redirect.read_text(encoding="utf-8")
            expected_url = "https://geoqiao.me/blog/new-english-slug/"
            self.assertEqual(text, _redirect_html(expected_url))
            self.assertIn("created=1 skipped=0", result.stdout)
            self.assertIn("final artifact entries=", result.stdout)

    def test_cli_changes_only_the_planned_redirect_paths(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)
            target = output / "blog" / "new-english-slug" / "index.html"
            target.parent.mkdir(parents=True)
            target.write_text("new canonical page", encoding="utf-8")
            before = {
                path.relative_to(output): path.read_bytes()
                for path in output.rglob("*")
                if path.is_file()
            }

            result = self.run_script(
                root,
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            after = {
                path.relative_to(output): path.read_bytes()
                for path in output.rglob("*")
                if path.is_file()
            }
            redirect = Path("blog/old-pinyin-slug/index.html")
            self.assertEqual(set(after), {*before, redirect})
            for path, content in before.items():
                self.assertEqual(after[path], content)

    def test_cli_leaves_current_canonical_page_untouched_before_cutover(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)
            source = output / "blog" / "old-pinyin-slug" / "index.html"
            source.parent.mkdir(parents=True)
            source.write_text("current canonical page", encoding="utf-8")

            result = self.run_script(
                root,
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                source.read_text(encoding="utf-8"), "current canonical page"
            )
            self.assertFalse(
                (output / "blog" / "new-english-slug" / "index.html").exists()
            )
            self.assertIn("created=0 skipped=1", result.stdout)

    def test_cli_fails_without_overwriting_when_both_pages_exist(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)
            source = output / "blog" / "old-pinyin-slug" / "index.html"
            target = output / "blog" / "new-english-slug" / "index.html"
            source.parent.mkdir(parents=True)
            target.parent.mkdir(parents=True)
            source.write_text("source sentinel", encoding="utf-8")
            target.write_text("target sentinel", encoding="utf-8")

            result = self.run_script(
                root,
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("both source and target canonical pages exist", result.stderr)
            self.assertEqual(source.read_text(encoding="utf-8"), "source sentinel")
            self.assertEqual(target.read_text(encoding="utf-8"), "target sentinel")

    def test_cli_fails_when_neither_side_exists(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)

            result = self.run_script(
                root,
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("neither source nor target exists", result.stderr)

    def test_cli_rejects_artifact_symlinks(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)
            outside = root / "outside.txt"
            outside.write_text("outside sentinel", encoding="utf-8")
            link = output / "unexpected-link"
            try:
                os.symlink(outside, link)
            except OSError as exc:  # pragma: no cover - platform capability
                self.skipTest(f"symlinks unavailable: {exc}")

            result = self.run_script(root, output, [])

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("artifact contains a symbolic link", result.stderr)
            self.assertEqual(outside.read_text(encoding="utf-8"), "outside sentinel")

    def test_cli_rejects_output_escape(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            outside = root.parent / f"{root.name}-outside"
            outside.mkdir()
            self.addCleanup(outside.rmdir)
            mapping = self.write_mapping(root, [])

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--map",
                    str(mapping),
                    "--output",
                    f"../{outside.name}",
                    "--repository-root",
                    str(root),
                ],
                cwd=root,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("contained repository-relative path", result.stderr)
            self.assertEqual(list(outside.iterdir()), [])

    def test_cli_requires_final_site_smoke_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            output.mkdir()

            result = self.run_script(root, output, [])

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("required site artifact is not a regular file", result.stderr)

    def test_redirect_html_escapes_untrusted_attribute_content(self) -> None:
        target = 'https://example.test/blog/new/?q="><script>alert(1)</script>&x=1'

        document = _redirect_html(target)
        probe = _HTMLProbe()
        probe.feed(document)

        self.assertNotIn("script", probe.tags)
        self.assertNotIn("<script>alert(1)</script>", document)
        canonical = next(
            attrs["href"]
            for tag, attrs in probe.attributes
            if tag == "link" and attrs.get("rel") == "canonical"
        )
        refresh = next(
            attrs["content"]
            for tag, attrs in probe.attributes
            if tag == "meta" and attrs.get("http-equiv") == "refresh"
        )
        link = next(attrs["href"] for tag, attrs in probe.attributes if tag == "a")
        self.assertEqual(canonical, target)
        self.assertEqual(refresh, f"0; url={target}")
        self.assertEqual(link, target)

    def test_cli_rejects_unsafe_origin(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            self.seed_site_artifact(output)

            result = self.run_script(
                root,
                output,
                [],
                origin='https://example.test"onload="alert(1)',
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("origin must be an HTTPS origin", result.stderr)


if __name__ == "__main__":
    unittest.main()
