"""Geo-owned project routes use the pinned compiler's normal validation gate."""

import json
import shutil
import tempfile
import unittest
from pathlib import Path

import yaml
from jinja2 import TemplateError
from theme.build import ProjectCatalog, compile_site, publish_site

from escaping.config import Settings
from escaping.theme import ThemeLoader

ROOT = Path(__file__).resolve().parents[1]


class GeoProjectTests(unittest.TestCase):
    def settings(self) -> Settings:
        data = yaml.safe_load((ROOT / "config.yaml").read_text())
        data["site"]["featured_posts"] = []
        data["about"] = {}
        data["projects"] = []
        return Settings.model_validate(data)

    def catalog(self) -> ProjectCatalog:
        return ProjectCatalog.model_validate(
            yaml.safe_load((ROOT / "theme/projects.yaml").read_text())
        )

    def test_real_pages_catalog_search_and_sitemap_share_routes(self) -> None:
        site = compile_site(self.settings(), (), self.catalog())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            publish_site(
                site, ThemeLoader(ROOT).load(self.settings().theme), root, "output"
            )
            output = root / "output"
            search = json.loads((output / "search.json").read_text())
            self.assertEqual(
                [item["url"] for item in search["items"]],
                [p.route.canonical_path for p in site.project_pages],
            )
            catalog = (output / "projects/index.html").read_text()
            for page in site.project_pages:
                self.assertIn(page.route.canonical_path, catalog)
                self.assertIn(
                    page.route.canonical_url, (output / "sitemap.xml").read_text()
                )
                html = (output / page.route.output_path).read_text()
                self.assertIn(
                    f'rel="canonical" href="{page.route.canonical_url}"', html
                )
                self.assertNotIn("noindex", html)
                self.assertNotIn("DESIGN PREVIEW", html)
            self.assertIn("paseo-stuff-logo.svg", catalog)
            self.assertIn("md2xarticle", catalog)
            self.assertNotIn("oh-my-share", catalog)
            self.assertEqual(site.project_pages[2].project.repository, "")

    def test_catalog_rejects_unsafe_or_ambiguous_sources_and_routes(self) -> None:
        valid = {"slug": "demo", "title": "Demo", "website": "https://example.org/"}
        for change in (
            {"slug": "../escape"},
            {"website": "javascript:alert(1)"},
            {"website": ""},
            {"unexpected": True},
        ):
            with self.subTest(change=change), self.assertRaises(ValueError):
                ProjectCatalog.model_validate({"projects": [{**valid, **change}]})
        with self.assertRaises(ValueError):
            ProjectCatalog.model_validate({"projects": [valid, valid]})

    def test_failed_project_render_or_validation_preserves_previous_output(
        self,
    ) -> None:
        settings = self.settings()
        site = compile_site(settings, (), self.catalog())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT / "theme", root / "theme")
            output = root / "output"
            output.mkdir()
            (output / "previous.txt").write_text("keep me")
            theme = ThemeLoader(root).load(settings.theme)
            original = (root / "theme/projects/pi-tools.html").read_text()
            for broken in (
                "{{ undefined_value }}",
                original.replace('href="#install"', 'href="/missing/"', 1),
            ):
                with self.subTest(broken=broken):
                    (root / "theme/projects/pi-tools.html").write_text(broken)
                    with self.assertRaises((TemplateError, ValueError)):
                        publish_site(site, theme, root, "output")
                    self.assertEqual(list(output.iterdir()), [output / "previous.txt"])
                    self.assertEqual((output / "previous.txt").read_text(), "keep me")
                    self.assertFalse(list(root.glob(".output.staging.*")))


if __name__ == "__main__":
    unittest.main()
