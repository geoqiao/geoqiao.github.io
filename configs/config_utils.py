import yaml

CONFIG_FILE = "./configs/config.yaml"


def load_config():
    with open(CONFIG_FILE, "r") as file:
        config = yaml.safe_load(file)
    return config


# def get_config_value(key, default=None):
#     """
#     Get a configuration value by key, supporting nested keys.

#     Args:
#         key (str): Configuration key, e.g. 'blog.title' or 'github.token'.
#         default (any, optional): Default value if the key is not found.

#     Returns:
#         any: Configuration value or default value if the key is not found.
#     """
#     config = load_config()
#     keys = key.split(".")
#     value = config
#     for k in keys:
#         if isinstance(value, dict) and k in value:
#             value = value[k]
#         else:
#             return default
#     return value
