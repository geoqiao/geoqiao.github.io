from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPOSITORY_ROOT / "scripts" / "render_slug_redirects.py"


class RenderSlugRedirectsTests(unittest.TestCase):
    def run_script(
        self, output: Path, redirects: list[dict[str, str]]
    ) -> subprocess.CompletedProcess[str]:
        mapping = output.parent / "redirects.json"
        mapping.write_text(
            json.dumps(
                {
                    "origin": "https://geoqiao.me",
                    "redirects": redirects,
                }
            ),
            encoding="utf-8",
        )
        return subprocess.run(  # noqa: S603 - fixed test command
            [
                sys.executable,
                str(SCRIPT),
                "--map",
                str(mapping),
                "--output",
                str(output),
            ],
            cwd=REPOSITORY_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_cli_renders_compatible_page_for_migrated_slug(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            target = output / "blog" / "new-english-slug" / "index.html"
            target.parent.mkdir(parents=True)
            target.write_text("new canonical page", encoding="utf-8")

            result = self.run_script(
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            redirect = output / "blog" / "old-pinyin-slug" / "index.html"
            html = redirect.read_text(encoding="utf-8")
            self.assertIn(
                '<link rel="canonical" href="https://geoqiao.me/blog/new-english-slug/">',
                html,
            )
            self.assertIn(
                'content="0; url=https://geoqiao.me/blog/new-english-slug/"', html
            )
            self.assertIn('href="https://geoqiao.me/blog/new-english-slug/"', html)
            self.assertIn("created=1 skipped=0", result.stdout)

    def test_cli_leaves_current_canonical_page_untouched_before_cutover(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            source = output / "blog" / "old-pinyin-slug" / "index.html"
            source.parent.mkdir(parents=True)
            source.write_text("current canonical page", encoding="utf-8")

            result = self.run_script(
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

    def test_cli_fails_when_neither_side_exists(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "output"
            output.mkdir()

            result = self.run_script(
                output,
                [{"from": "/blog/old-pinyin-slug/", "to": "/blog/new-english-slug/"}],
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("neither source nor target exists", result.stderr)


if __name__ == "__main__":
    unittest.main()
