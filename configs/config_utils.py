from pathlib import Path
from typing import Any

import yaml


class Config:
    CONFIG_FILE: Path = Path("./configs/config.yaml")

    def __init__(self) -> None:
        # load config
        config_loaded = Config.load_config()
        # config about blog
        self.blog_title = config_loaded["blog"]["title"]
        self.meta_description = config_loaded["blog"]["description"]
        self.blog_url = config_loaded["blog"]["url"]
        self.author_name = config_loaded["blog"]["author"]["name"]
        self.author_email = config_loaded["blog"]["author"]["email"]
        self.content_dir = Path(config_loaded["blog"]["content_dir"])
        self.blog_dir = Path(config_loaded["blog"]["blog_dir"])
        self.rss_atom_path = config_loaded["blog"]["rss_atom_path"]
        # config about github
        self.github_name = config_loaded["github"]["name"]
        self.github_repo = config_loaded["github"]["repo"]
        # config about Google Search Console
        self.google_search_verification = config_loaded["GoogleSearchConsole"][
            "content"
        ]
        # config about theme
        self.theme_path = config_loaded["theme"]["path"]

    @classmethod
    def load_config(cls) -> dict[str, Any]:
        try:
            with open(cls.CONFIG_FILE, "r") as file:
                config = yaml.safe_load(file)
            return config
        except yaml.YAMLError as e:
            print(f"Error reading YAML file: {e}")
            raise
        except FileNotFoundError:
            print(f"Config file not found: {cls.CONFIG_FILE}")
            raise
