"""Keep the production build/validate/upload boundary explicit (uses PyYAML)."""

import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]


class ProductionWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.workflow = yaml.safe_load((ROOT / ".github/workflows/pages.yml").read_text())

    def test_content_lifecycle_events_trigger_rebuilds(self):
        # PyYAML's YAML 1.1 loader reads the unquoted Actions `on` key as True.
        events = set(self.workflow[True]["issues"]["types"])
        self.assertTrue({
            "opened", "edited", "labeled", "unlabeled", "closed", "reopened",
            "deleted", "transferred",
        }.issubset(events), events)

    def test_checks_gate_upload_and_deploy_reports_skipped_issues(self):
        self.assertEqual(self.workflow["permissions"], {})
        jobs = self.workflow["jobs"]
        self.assertEqual(set(jobs), {"build", "deploy"})
        build = jobs["build"]
        # Branch builds remain available; Issue events build only for the repository's own members.
        self.assertEqual(build["if"], "github.event_name != 'issues' || contains(fromJSON('[\"OWNER\",\"MEMBER\",\"COLLABORATOR\"]'), github.event.issue.author_association)")
        self.assertEqual(build["permissions"], {"contents": "read", "issues": "read"})
        steps = build["steps"]
        for step in steps:
            self.assertNotIn("if", step)  # Default success(), never always().
            self.assertFalse(step.get("continue-on-error", False))
            if uses := step.get("uses", ""):
                self.assertRegex(uses, r"@[0-9a-f]{40}$")  # Full commit SHAs only.
        by_name = {step["name"]: step for step in steps}
        required = [
            "Test site migration tooling", "Export the content", "Install site dependencies",
            "Test the Markdown allowlist", "Build the site", "Upload Pages artifact",
        ]
        positions = [list(by_name).index(name) for name in required]
        self.assertEqual(positions, sorted(positions))
        content = by_name["Export the content"]
        self.assertEqual(content["id"], "content")
        # One exact escaping version; exit status 2 (some Issues skipped) still builds the rest.
        self.assertRegex(content["run"], r"uvx --python 3\.14 escaping-site@\d+\.\d+\.\d+ export --config config\.yaml \|\| status=\$\?\n")
        self.assertIn('if [ "$status" -eq 2 ]; then exit 0; fi\nexit "$status"', content["run"])
        self.assertEqual(content["env"], {"GITHUB_TOKEN": "${{ github.token }}"})
        # The lockfile decides what is installed; the site reads the directory the export wrote.
        self.assertEqual(by_name["Install site dependencies"]["run"], "pnpm install --frozen-lockfile")
        site = by_name["Build the site"]
        self.assertEqual(site["run"], "pnpm build")
        self.assertEqual(site["env"]["CONTENT_DIR"], "${{ steps.content.outputs.output }}")
        self.assertEqual(by_name["Upload Pages artifact"]["with"]["path"], "dist")
        self.assertEqual(
            self.workflow["jobs"]["build"]["outputs"]["skipped-issues"],
            "${{ steps.content.outputs.skipped-issues }}",
        )
        self.assertNotRegex("\n".join(s.get("run", "") for s in steps), r"python3(?:\s|$)")

        deploy = jobs["deploy"]
        self.assertEqual(deploy["if"], "github.ref == 'refs/heads/main'")
        self.assertEqual(deploy["needs"], "build")
        self.assertEqual(deploy["permissions"], {"pages": "write", "id-token": "write"})
        report = deploy["steps"][-1]
        self.assertEqual(report["if"], "needs.build.outputs.skipped-issues != ''")
        self.assertTrue(re.search(r"exit 1\s*$", report["run"]))


if __name__ == "__main__":
    unittest.main()
