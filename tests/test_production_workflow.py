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
        self.assertNotIn("if", build)  # Branch builds remain available.
        self.assertEqual(build["permissions"], {"contents": "read", "issues": "read", "pages": "read"})
        steps = build["steps"]
        for step in steps:
            self.assertNotIn("if", step)  # Default success(), never always().
            self.assertFalse(step.get("continue-on-error", False))
            if uses := step.get("uses", ""):
                self.assertRegex(uses, r"@[0-9a-f]{40}$")  # Full commit SHAs only.
        by_name = {step["name"]: step for step in steps}
        required = [
            "Test site migration tooling", "Build the site", "Upload Pages artifact",
        ]
        positions = [list(by_name).index(name) for name in required]
        self.assertEqual(positions, sorted(positions))
        site = by_name["Build the site"]
        self.assertEqual((site["id"], site["with"]), ("site", {"config": "config.yaml"}))
        self.assertRegex(site["uses"], r"^geoqiao/escaping@[0-9a-f]{40}$")
        output = "${{ steps.site.outputs.output }}"
        self.assertEqual(by_name["Upload Pages artifact"]["with"]["path"], output)
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
