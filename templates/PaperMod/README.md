PaperMod Jinja2 theme

How to use:
- Update `configs/config.yaml`:
  theme:
    path: "templates/PaperMod"

Templates provided:
- `base.html`, `index.html`, `post.html`, `about.html`

Variables main.py provides to templates:
- index: `issues`, `blog_title`, `github_name`, `meta_description`, `google_search_verification` (and `author_name` if present in config)
- post: `issue`, `html_body`, `blog_title`, `github_name`, `meta_description`

Notes:
- The theme uses `/templates/default_theme/static/css/prism.css` for syntax highlighting. You can replace it by copying your preferred `prism.css` into `/templates/PaperMod/static/css/` and updating `base.html`.
- Utterances comments are configured to use `{{ github_name }}/{{ github_name }}.github.io`. If your comments repository differs, edit `post.html` accordingly.