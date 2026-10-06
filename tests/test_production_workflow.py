"""Keep the production export/check/commit boundary explicit (uses PyYAML)."""

import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]


class ProductionWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.workflow = yaml.safe_load((ROOT / ".github/workflows/content.yml").read_text())

    def test_content_lifecycle_events_trigger_rebuilds(self):
        # PyYAML's YAML 1.1 loader reads the unquoted Actions `on` key as True.
        events = set(self.workflow[True]["issues"]["types"])
        self.assertTrue({
            "opened", "edited", "labeled", "unlabeled", "closed", "reopened",
            "deleted", "transferred",
        }.issubset(events), events)

    def test_checks_gate_the_content_commit_and_skipped_issues_are_reported(self):
        self.assertEqual(self.workflow["permissions"], {})
        jobs = self.workflow["jobs"]
        # Cloudflare publishes on the push; this workflow never deploys.
        self.assertEqual(set(jobs), {"build"})
        build = jobs["build"]
        # Branch builds remain available; Issue events build only for the repository's own members.
        self.assertEqual(build["if"], "github.event_name != 'issues' || contains(fromJSON('[\"OWNER\",\"MEMBER\",\"COLLABORATOR\"]'), github.event.issue.author_association)")
        self.assertEqual(build["permissions"], {"contents": "write", "issues": "read"})
        steps = build["steps"]
        for step in steps:
            self.assertNotIn("if", step)  # Default success(), never always().
            self.assertFalse(step.get("continue-on-error", False))
            if uses := step.get("uses", ""):
                self.assertRegex(uses, r"@[0-9a-f]{40}$")  # Full commit SHAs only.
        by_name = {step["name"]: step for step in steps}
        required = [
            "Test site migration tooling", "Export the content", "Install site dependencies",
            "Test the Markdown allowlist", "Build the site", "Commit the content",
            "Report skipped Issues",
        ]
        positions = [list(by_name).index(name) for name in required]
        self.assertEqual(positions, sorted(positions))
        content = by_name["Export the content"]
        self.assertEqual(content["id"], "content")
        # One exact escaping version; exit status 2 (some Issues skipped) still builds the rest.
        self.assertRegex(content["run"], r"uvx --python 3\.14 escaping-site@\d+\.\d+\.\d+ export --config config\.yaml --output content \|\| status=\$\?\n")
        self.assertIn('if [ "$status" -eq 2 ]; then exit 0; fi\nexit "$status"', content["run"])
        self.assertEqual(content["env"], {"GITHUB_TOKEN": "${{ github.token }}"})
        # The lockfile decides what is installed; the site reads the directory the export wrote.
        self.assertEqual(by_name["Install site dependencies"]["run"], "pnpm install --frozen-lockfile")
        site = by_name["Build the site"]
        self.assertEqual(site["run"], "pnpm build")
        self.assertEqual(site["env"]["CONTENT_DIR"], "${{ steps.content.outputs.output }}")
        # Only main commits the content, only when it changed, and only the content folder.
        commit = by_name["Commit the content"]["run"]
        self.assertIn('if [ "$GITHUB_REF" != "refs/heads/main" ]; then', commit)
        self.assertIn("git add --all content\nif git diff --cached --quiet; then", commit)
        self.assertNotIn("--force", commit)
        self.assertFalse(steps[0]["with"]["persist-credentials"])
        # Skipped Issues fail the run only after everything else was committed.
        report = by_name["Report skipped Issues"]
        self.assertEqual(report["env"], {"SKIPPED": "${{ steps.content.outputs.skipped-issues }}"})
        self.assertIn('if [ -z "$SKIPPED" ]; then exit 0; fi', report["run"])
        self.assertTrue(re.search(r"exit 1\s*$", report["run"]))
        self.assertNotRegex("\n".join(s.get("run", "") for s in steps), r"python3(?:\s|$)")


if __name__ == "__main__":
    unittest.main()
