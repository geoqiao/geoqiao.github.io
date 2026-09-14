# Geo project cover assets

These four assets are screenshot-led covers for the local Geo theme. They were generated on 2026-09-14 from public project documentation, the public `geoqiao.me` site, and one existing local plugin-preview artifact. Each output is opaque sRGB WebP at 1000×750 (4:3), rendered at `COVER_QUALITY=80`.

| File | Bytes | Source and crop | Composition choice |
| --- | ---: | --- | --- |
| `theme/static/images/projects/pi-tools.webp` | 38,908 | `pi-tools` commit `23cc59ce08bdc9cb56974fd3d51120313e833532`, [`packages/pi-usage/docs/media/pi-usage-dashboard.png`](https://github.com/geoqiao/pi-tools/blob/23cc59ce08bdc9cb56974fd3d51120313e833532/packages/pi-usage/docs/media/pi-usage-dashboard.png), source 1440×1932; top crop `1440×1080+0+0` | Full dashboard viewport inside a cool blue matte and rounded screenshot window. The UI is the real Pi Usage documentation dashboard. |
| `theme/static/images/projects/escaping.webp` | 24,092 | [`https://geoqiao.me/`](https://geoqiao.me/) captured 2026-09-14 at a 1440×1000 CSS viewport; crop `960×720+240+0` | The public homepage hero and article list fill the screenshot window. The source capture is retained in `.scratch/theme-covers/source/escaping-home-1440x1000.png`. |
| `theme/static/images/projects/oh-my-share.webp` | 28,124 | `oh-my-share` README at commit `dee76d7aa8adff7f9fcb4c3c3b67c6f47757c0ff`; the documented `bars XNAS:AAPL`, `quote XNAS:AAPL`, and `search Apple --market us` examples | A code-native terminal window. `README / example` is visible in the title bar; the receipt is the README's documented example, line-wrapped for the cover, with its `/Users/you` and `<uuid>` placeholders preserved. This is an example rendition, not live market output. |
| `theme/static/images/projects/paseo-stuff.webp` | 26,494 | Existing local artifact `/Users/geoqiao/self_project/paseo-stuff/docs/images/agent-activity-spacing-dark.png`, 1489×1017, SHA-256 `42eec55c199f20c9a3f7329117b87afc611c7d97ec1c910f3cdfd39777c0651b`; the complete source is letterboxed with `xMidYMid meet` | Full documented Readable Agent Activity comparison preview in the dark screenshot window. The artifact itself labels its messages synthetic and says there is no daemon connection or real tool execution; no personal conversation was used. |

The three screenshot compositions share the same window geometry: canvas 1000×750, inner window `x=18 y=14 width=964 height=723`, 20px corner radius, and a 2px project-tinted outline. The Pi Usage and escaping crops fill that window. The wider Paseo source is fit without cropping so the left heading and comparison panels remain intact. The Oh My Share terminal uses a 916×678 rounded window with a restrained three-dot title bar and only documented public command text. No Kieran artwork or image-generation output was used.

The final asset checksums are:

| File | SHA-256 |
| --- | --- |
| `pi-tools.webp` | `2f450bdd721f3a4e180abd907ae481fd0aa836cbb0e326bbb469427a7e4ca35b` |
| `escaping.webp` | `a1d4ddee2a8b887721d34223199c730ff07013374b20d8eba70edbead287aeda` |
| `oh-my-share.webp` | `c9e42c958d392e9c23c51857f0928b734bec8bd7ca696c704b1987d9c2e163ef` |
| `paseo-stuff.webp` | `3c637f0224b2325d748df7b38c8837173576750595f9036af53fa9bd99f55a43` |

## Regeneration

From the repository root, refresh the public-site capture at the same viewport, then render all four covers:

```sh
mkdir -p .scratch/theme-covers/source
playwright-cli open https://geoqiao.me/
playwright-cli resize 1440 1000
playwright-cli screenshot --filename=.scratch/theme-covers/source/escaping-home-1440x1000.png
node scripts/capture_theme_covers.mjs
```

The renderer is intentionally dependency-light. It reads the source repositories, makes the fixed source crops in `.scratch/theme-covers/source/`, writes inspectable SVG compositions to `.scratch/theme-covers/compositions/`, and writes the four WebP files under `theme/static/images/projects/`. The escaping capture is the only source that needs to be refreshed manually; the other inputs are local files.

Override source locations or the ImageMagick settings when working on another checkout:

```sh
PI_USAGE_SOURCE=/path/to/pi-usage-dashboard.png \
PASEO_ACTIVITY_SOURCE=/path/to/agent-activity-spacing-dark.png \
ESCAPING_CAPTURE=.scratch/theme-covers/source/escaping-home-1440x1000.png \
MAGICK_BIN=magick \
COVER_FONT=/System/Library/Fonts/Menlo.ttc \
COVER_QUALITY=80 \
node scripts/capture_theme_covers.mjs
```

The renderer is [scripts/capture_theme_covers.mjs](../scripts/capture_theme_covers.mjs). It does not fetch market data or run image generation.
