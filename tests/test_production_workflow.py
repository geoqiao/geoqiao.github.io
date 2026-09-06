"""Keep the production install/build/upload boundary explicit (uses locked PyYAML)."""

import unittest
from pathlib import Path

import yaml


class ProductionWorkflowTests(unittest.TestCase):
    def test_locked_install_and_required_checks_gate_upload(self):
        root = Path(__file__).resolve().parents[1]
        workflow = yaml.safe_load((root / ".github/workflows/pages.yml").read_text())
        jobs = workflow["jobs"]
        self.assertEqual(set(jobs), {"build", "deploy"})
        build = jobs["build"]
        self.assertNotIn("if", build)  # Branch builds remain available.
        self.assertEqual(build["permissions"], {"contents": "read", "issues": "read"})
        self.assertRegex(build["env"]["ESCAPING_SHA"], r"^[0-9a-f]{40}$")
        self.assertEqual(build["env"]["UV_PROJECT_ENVIRONMENT"], "${{ runner.temp }}/compiler-venv")
        self.assertEqual(jobs["deploy"]["if"], "github.ref == 'refs/heads/main'")
        self.assertEqual(jobs["deploy"]["needs"], "build")
        self.assertEqual(jobs["deploy"]["permissions"], {"pages": "write", "id-token": "write"})
        steps = build["steps"]
        names = [step["name"] for step in steps]
        required = [
            "Set up Python 3.14", "Install locked noneditable compiler",
            "Test site migration tooling", "Generate site from the site Config",
            "Render and validate final Pages artifact", "Upload Pages artifact",
        ]
        positions = [names.index(name) for name in required]
        self.assertEqual(positions, sorted(positions))
        self.assertFalse(build.get("continue-on-error", False))
        for step in steps:
            self.assertNotIn("if", step)  # Default success(), never always().
            self.assertFalse(step.get("continue-on-error", False))
        by_name = {step["name"]: step for step in steps}
        self.assertEqual(by_name["Checkout pinned escaping compiler"]["with"]["ref"], "${{ env.ESCAPING_SHA }}")
        install = by_name[required[1]]["run"]
        self.assertIn('bash compiler/starter/.github/scripts/install.sh', install)
        self.assertIn('"$GITHUB_WORKSPACE/compiler" "$ESCAPING_SHA" 3.14', install)
        self.assertIn("set -euo pipefail", install)
        for name in (required[2], required[4]):
            self.assertTrue(by_name[name]["run"].startswith('"$UV_PROJECT_ENVIRONMENT/bin/python"'))
        compile_step = by_name[required[3]]
        self.assertEqual(compile_step["env"], {"GITHUB_TOKEN": "${{ github.token }}"})
        self.assertEqual(compile_step["run"].split(), [
            '"$UV_PROJECT_ENVIRONMENT/bin/escpe"', "--config", '"$GITHUB_WORKSPACE/config.yaml"',
        ])
        self.assertEqual(by_name[required[5]]["with"]["path"], "output")
        self.assertNotRegex("\n".join(s.get("run", "") for s in steps), r"uv run|python3(?:\s|$)")
        self.assertEqual(yaml.safe_load((root / "config.yaml").read_text())["paths"]["output"], "output")


if __name__ == "__main__":
    unittest.main()
