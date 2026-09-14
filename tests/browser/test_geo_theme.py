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


if __name__ == "__main__":
    unittest.main(verbosity=2)
