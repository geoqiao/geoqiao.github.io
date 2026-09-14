"""Geo's real-browser contract; run after building output (see theme/README.md)."""

import os
import re
import unittest
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class GeoThemeBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT / "output"))
        )
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        engine = os.getenv("GEO_BROWSER", "chromium")
        # Full Chromium exercises native background-tab navigation; headless shell
        # does not reliably finish Ctrl/Cmd-click navigations on macOS.
        cls.browser = getattr(cls.playwright, engine).launch(
            **({"channel": "chromium"} if engine == "chromium" else {})
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    @contextmanager
    def page(self, **options):
        context = self.browser.new_context(viewport={"width": 1440, "height": 1000}, **options)
        page = context.new_page()
        page.set_default_timeout(4000)
        try:
            page.goto(self.origin)
            yield page
        finally:
            context.close()

    def test_card_preview_and_navigation(self):
        with self.page() as page:
            deck = page.locator("[data-project-deck]")
            expect(deck).to_have_class(re.compile("deck-enhanced"))
            card = page.locator(".deck-card").last
            destination = card.get_attribute("href")
            with page.context.expect_page() as popup:
                card.click(modifiers=["ControlOrMeta"])
            popup.value.bring_to_front()
            expect(popup.value).to_have_url(self.origin + destination)
            popup.value.close()
            page.bring_to_front()
            expect(card).to_have_attribute("aria-expanded", "false")
            card.click()
            expect(card).to_have_attribute("aria-expanded", "true")
            self.assertEqual(page.url, self.origin + "/")
            expect(page.locator(".deck-details").last).to_be_visible()
            card.click()
            page.wait_for_url(self.origin + destination)
            expect(page.locator("main")).to_be_visible()

    def test_switch_keyboard_dismiss_and_reinitialization(self):
        with self.page() as page:
            page.add_script_tag(url=self.origin + "/templates/Geo/static/js/home.js")
            cards = page.locator(".deck-card")
            cards.last.focus()
            page.keyboard.press("Enter")
            expect(cards.last).to_have_attribute("aria-expanded", "true")
            cards.first.click()
            expect(cards.first).to_have_attribute("aria-expanded", "true")
            expect(cards.last).to_have_attribute("aria-expanded", "false")
            page.get_by_role("button", name="Close project preview").click()
            expect(cards.first).to_be_focused()
            expect(cards.first).to_have_attribute("aria-expanded", "false")
            cards.first.press("Enter")
            page.keyboard.press("Escape")
            expect(cards.first).to_have_attribute("aria-expanded", "false")

    def test_mobile_reduced_motion_and_resize(self):
        with self.page() as page:
            cards = page.locator(".deck-card")
            for width in (390, 768, 999, 1000, 1440, 1920):
                page.set_viewport_size({"width": width, "height": 1000})
                self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), width)
            page.set_viewport_size({"width": 1440, "height": 1000})
            cards.last.click()
            page.set_viewport_size({"width": 390, "height": 844})
            expect(page.locator("[data-project-deck]")).not_to_have_class(re.compile("deck-enhanced"))
            self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 390)
            destination = cards.first.get_attribute("href")
            cards.first.click()
            page.wait_for_url(self.origin + destination)
        with self.page(reduced_motion="reduce") as page:
            self.assertEqual(page.locator(".deck-list").evaluate("e => getComputedStyle(e).display"), "grid")
            self.assertEqual(page.locator(".deck-card").first.evaluate("e => getComputedStyle(e).transform"), "none")
            expect(page.locator(".deck-details").first).to_be_visible()
            card = page.locator(".deck-card").first
            destination = card.get_attribute("href")
            card.click()
            page.wait_for_url(self.origin + destination)

    def test_no_script_and_failed_home_script_keep_links(self):
        for disabled in (True, False):
            with self.subTest(java_script_disabled=disabled), self.page(java_script_enabled=not disabled) as page:
                if not disabled:
                    page.route("**/static/js/home.js", lambda route: route.abort())
                    page.reload()
                card = page.locator(".deck-card").first
                expect(page.locator(".deck-details").first).to_be_visible()
                destination = card.get_attribute("href")
                card.click()
                page.wait_for_url(self.origin + destination)

    def test_home_navigation_search_and_appearance(self):
        with self.page(color_scheme="light") as page:
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.reload()
            page.get_by_role("button", name="Dark mode", exact=True).click()
            expect(page.locator("html")).to_have_attribute("data-theme", "dark")
            page.reload()
            expect(page.locator("html")).to_have_attribute("data-theme", "dark")
            page.get_by_role("button", name="Search", exact=True).click()
            expect(page.get_by_role("dialog")).to_be_visible()
            page.get_by_role("dialog").locator("input").fill("Python")
            expect(page.get_by_role("dialog").get_by_role("link").first).to_be_visible()
            page.keyboard.press("Escape")
            page.locator(".annotation-link").first.click()
            expect(page.locator("main")).to_be_visible()
            self.assertEqual(errors, [])

    def test_search_focus_across_navigation_breakpoint(self):
        with self.page() as page:
            page.goto(self.origin + "/blog/")
            navigation = page.locator("#site-navigation")
            menu = page.get_by_role("button", name="Menu", exact=True)
            search = page.get_by_role("button", name="Search", exact=True)
            navigation.get_by_role("link").first.focus()
            page.keyboard.press("ControlOrMeta+k")
            page.set_viewport_size({"width": 800, "height": 1000})
            page.keyboard.press("Escape")
            expect(menu).to_be_focused()

            menu.press("Enter")
            expect(navigation).to_be_visible()
            navigation.get_by_role("link").first.focus()
            page.keyboard.press("ControlOrMeta+k")
            expect(navigation).not_to_be_visible()
            page.keyboard.press("Escape")
            expect(menu).to_be_focused()

            menu.press("ControlOrMeta+k")
            page.set_viewport_size({"width": 1440, "height": 1000})
            page.keyboard.press("Escape")
            expect(search).to_be_focused()

    def test_search_escape_preserves_project_preview(self):
        with self.page() as page:
            card = page.locator(".deck-card").last
            card.focus()
            card.press("Enter")
            expect(card).to_have_attribute("aria-expanded", "true")
            page.keyboard.press("ControlOrMeta+k")
            expect(page.get_by_role("dialog")).to_be_visible()
            page.keyboard.press("Escape")
            expect(page.get_by_role("dialog")).not_to_be_visible()
            expect(card).to_have_attribute("aria-expanded", "true")
            expect(card).to_be_focused()
            page.keyboard.press("Escape")
            expect(card).to_have_attribute("aria-expanded", "false")

    def test_navigation_layout_and_keyboard_disclosure(self):
        with self.page() as page:
            controls = (".search-toggle", ".theme-toggle")
            home_positions = [page.locator(selector).bounding_box() for selector in controls]
            for path in ("/blog/", "/projects/", "/tags/", "/about/"):
                with self.subTest(path=path):
                    page.goto(self.origin + path)
                    for selector, home_box in zip(controls, home_positions):
                        box = page.locator(selector).bounding_box()
                        for dimension in ("x", "y", "width", "height"):
                            self.assertAlmostEqual(box[dimension], home_box[dimension], delta=1)
                    navigation = page.locator("#site-navigation")
                    expect(navigation.locator('[aria-current="page"]')).to_have_count(1)
                    box = navigation.bounding_box()
                    self.assertLess(box["x"] + box["width"], page.locator("main").bounding_box()["x"])

            page.set_viewport_size({"width": 800, "height": 1000})
            menu = page.get_by_role("button", name="Menu", exact=True)
            expect(navigation).not_to_be_visible()
            menu.press("Enter")
            expect(menu).to_have_attribute("aria-expanded", "true")
            navigation.get_by_role("link").first.focus()
            page.keyboard.press("Escape")
            expect(menu).to_be_focused()
            expect(navigation).not_to_be_visible()
            page.set_viewport_size({"width": 1440, "height": 1000})
            expect(navigation.locator('[aria-current="page"]')).to_be_focused()
            page.set_viewport_size({"width": 800, "height": 1000})
            expect(menu).to_be_focused()

        with self.page(java_script_enabled=False) as page:
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(self.origin + "/blog/")
            expect(page.locator("#site-navigation")).to_be_visible()
            page.locator("#site-navigation").get_by_role("link", name="Projects", exact=True).click()
            expect(page).to_have_url(self.origin + "/projects/")

    def test_appearance_palettes_with_and_without_scripts(self):
        palettes = {
            "light": ("#a72f6a", "#ead6e0", ["#416eaa", "#328052", "#8953a7"]),
            "dark": ("#4faf90", "#203d32", ["#416eaa", "#328052", "#8953a7"]),
        }
        light_highlights = {}
        for scripts in (True, False):
            for scheme, (accent, selection, notes) in palettes.items():
                with self.subTest(scripts=scripts, scheme=scheme), self.page(
                    java_script_enabled=scripts, color_scheme=scheme
                ) as page:
                    def palette():
                        return page.locator("html").evaluate("""element => {
                            const style = getComputedStyle(element);
                            return ['--accent', '--selection'].map(name => style.getPropertyValue(name).trim());
                        }""")

                    self.assertEqual(palette(), [accent, selection])
                    self.assertEqual(page.locator(".annotation-link").evaluate_all("""elements =>
                        elements.map(element => getComputedStyle(element).getPropertyValue('--note').trim())
                    """), notes)
                    for width in (390, 1440):
                        page.set_viewport_size({"width": width, "height": 1000})
                        highlights = page.locator(".annotation-word").evaluate_all("""elements =>
                            elements.map(element => getComputedStyle(element).backgroundImage)
                        """)
                        self.assertEqual(len(set(highlights)), 3)
                        if scheme == "light":
                            light_highlights[scripts, width] = highlights
                        else:
                            self.assertEqual(highlights, light_highlights[scripts, width])
                    page.goto(self.origin + "/blog/")
                    self.assertEqual(palette(), [accent, selection])

    def test_runtime_motion_change_and_scroll_interrupt(self):
        with self.page() as page:
            deck = page.locator("[data-project-deck]")
            card = page.locator(".deck-card").last
            card.focus()
            card.press("Enter")
            page.get_by_role("button", name="Close project preview").focus()
            page.emulate_media(reduced_motion="reduce")
            expect(deck).not_to_have_class(re.compile("deck-enhanced"))
            expect(card).to_be_focused()
            expect(page.locator(".deck-details").last).to_be_visible()
            self.assertIsNone(card.get_attribute("aria-expanded"))
            page.emulate_media(reduced_motion="no-preference")
            expect(deck).to_have_class(re.compile("deck-enhanced"))
            card.press("Enter")
            # Let opening assistance finish, then interrupt the closing glide.
            page.wait_for_timeout(550)
            page.keyboard.press("Escape")
            page.keyboard.press("Home")
            page.wait_for_function("window.scrollY === 0")
            page.wait_for_timeout(550)
            self.assertEqual(page.evaluate("window.scrollY"), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
