import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from scripts.prepare_attachment_migration import prepare_bodies


class AttachmentMigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.path = "assets/issues/20/image.png"
        self.data = b"original image bytes"
        target = self.root / self.path
        target.parent.mkdir(parents=True)
        target.write_bytes(self.data)
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        subprocess.run(["git", "-C", str(self.root), "add", "."], check=True)
        subprocess.run(
            [
                "git",
                "-C",
                str(self.root),
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.com",
                "-c",
                "commit.gpgsign=false",
                "commit",
                "-qm",
                "original",
            ],
            check=True,
        )
        commit = subprocess.check_output(
            ["git", "-C", str(self.root), "rev-parse", "HEAD"], text=True
        ).strip()
        self.url = "https://github.com/user-attachments/assets/old-image"
        self.manifest = {
            "repository": "geoqiao/geoqiao.github.io",
            "commit": commit,
            "assets": [
                {
                    "issue_number": 20,
                    "old_url": self.url,
                    "path": self.path,
                    "sha256": hashlib.sha256(self.data).hexdigest(),
                    "size": len(self.data),
                }
            ],
        }
        self.issue = {
            "number": 20,
            "title": "中文标题",
            "labels": [{"name": "published"}],
            "body": f'---\r\nslug: unchanged\r\n---\n正文\r\n<img src="{self.url}" alt="原图">',
        }

    def test_preview_changes_only_attachment_url_and_never_mutates_backup(self):
        before = self.issue["body"]
        result = prepare_bodies(self.root, [self.issue], self.manifest)
        new_url = f"https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/{self.manifest['commit']}/{self.path}"
        self.assertEqual(result, {20: before.replace(self.url, new_url)})
        self.assertEqual(self.issue["body"], before)
        self.assertEqual(self.issue["title"], "中文标题")
        backup, mapping = self.root / "backup.json", self.root / "map.json"
        backup.write_text(json.dumps([[self.issue]]))
        mapping.write_text(json.dumps(self.manifest))
        output = self.root / "preview"
        command = [
            sys.executable,
            str(
                Path(__file__).resolve().parents[1]
                / "scripts/prepare_attachment_migration.py"
            ),
            "--backup",
            str(backup),
            "--map",
            str(mapping),
            "--output",
            str(output),
            "--repository-root",
            str(self.root),
        ]
        subprocess.run(command, check=True, capture_output=True)
        expected = result[20].encode("utf-8")
        self.assertEqual((output / "20.md").read_bytes(), expected)
        self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
        self.assertEqual((output / "20.md").read_bytes(), expected)

    def test_changed_body_and_tampered_bytes_fail_closed(self):
        for changed in ("body", "file"):
            with self.subTest(changed=changed):
                issue = dict(self.issue)
                (self.root / self.path).write_bytes(self.data)
                if changed == "body":
                    issue["body"] = "author has replaced the image"
                else:
                    (self.root / self.path).write_bytes(b"not the committed image")
                with self.assertRaises(ValueError):
                    prepare_bodies(self.root, [issue], self.manifest)

    def test_moving_ref_and_path_escape_are_rejected(self):
        for change in ("ref", "path"):
            with self.subTest(change=change):
                manifest = {
                    **self.manifest,
                    "assets": [dict(self.manifest["assets"][0])],
                }
                if change == "ref":
                    manifest["commit"] = "main"
                else:
                    manifest["assets"][0]["path"] = "../outside.png"
                with self.assertRaises(ValueError):
                    prepare_bodies(self.root, [self.issue], manifest)


if __name__ == "__main__":
    unittest.main()
