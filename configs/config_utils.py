from pathlib import Path

import yaml


class Config:
    CONFIG_FILE = Path("./configs/config.yaml")

    def __init__(self):
        config_loaded = Config.load_config()
        self.blog_title = config_loaded["blog"]["title"]
        self.github_name = config_loaded["github"]["name"]
        self.meta_description = config_loaded["blog"]["description"]
        self.theme_path = config_loaded["theme"]["path"]
        self.google_search_verification = config_loaded["GoogleSearchConsole"][
            "content"
        ]

    @classmethod
    def load_config(cls) -> dict:
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
