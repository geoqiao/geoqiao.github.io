# Shared social image

`og.png` is the approved 1200×630 site-wide sharing card for geoqiao.me.
It is a site-owned asset, not an escaping package resource or generated page.

The artwork combines a hand-drawn notebook/toolbox illustration from native Codex
image generation, the existing personal avatar mark, and locally typeset text:

- `Geo Qiao` — Source Serif 4
- `AI 工作流 · Python 实践 · 个人项目` — Songti SC Regular
- `geoqiao.me` — Helvetica Neue

The image model was not returned by the generation tool; no specific image-model
version is claimed. The final design was reviewed and approved by the site owner.
Font binaries and intermediate concepts are not distributed here.

The Site Config references the PNG through an immutable, full-commit GitHub raw
URL. Commit and push a replacement first, verify the URL returns the exact PNG
bytes, then update `seo.social_image` and its alternative text in a later commit.
Preserve the referenced commit in merged history; do not squash it away.

The compiler does not download the image or copy this directory into `output/`.
Old share previews may stay cached by third-party platforms after a deployment.
