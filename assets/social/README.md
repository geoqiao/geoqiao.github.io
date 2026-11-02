# Shared social image

`og-flat.png` is the approved 1200×630 Open Graph sharing image for geoqiao.me.
It is a site-owned asset, not an escaping package resource or generated page.

X uses a separate `summary` card with the existing 256×256 profile avatar.
`Base.astro` derives an absolute `twitter:image` URL from `profile.avatar` and
uses the author name for its alternative text. Open Graph retains
`seo.social_image` and `seo.social_image_alt`; other platforms choose their own
layout when displaying that image.

The image uses a large dark signature on a rose-pink background, with a small
green terminal stroke. It contains no text. The artwork was generated through
Codex image generation using the owner's existing personal mark as an identity
reference, then exported at 1200×630. The flat direction was approved by the
site owner. No specific image-model version is claimed.

`og.png` preserves the previous notebook/toolbox card for historical references.

The Site Config references the PNG through an immutable, full-commit GitHub raw
URL. Commit and push a replacement first, verify the URL returns the exact PNG
bytes, then update `seo.social_image` and its alternative text in a later commit.
Preserve the referenced commit in merged history; do not squash it away.

Astro does not download the image or copy this directory into `dist/`.
Old share previews may stay cached by third-party platforms after a deployment.
