# Geo project logos

Projects and About use small identity images instead of screenshot covers. These three WebP files reuse the projects' existing artwork, downloaded from the pinned sources below on 2026-09-14. All are 128×128 sRGB; escaping retains transparency. Their combined size is 6,418 bytes.

| Asset | Source | Bytes |
| --- | --- | ---: |
| `pi-tools-logo.webp` | [Existing pi-tools icon](https://raw.githubusercontent.com/geoqiao/geoqiao/0e114158f698e754cf1bd840ecbf264ef67e2dc5/assets/pi-tools-icon.png) | 2,578 |
| `escaping-logo.webp` | [Existing escaping logo](https://raw.githubusercontent.com/geoqiao/escaping/3b0b8d568462cf9ac81d9bef2dbba683ce57ec39/docs/assets/escaping-logo.png) | 2,674 |
| `oh-my-share-logo.webp` | [Existing oh-my-share logo](https://raw.githubusercontent.com/geoqiao/oh-my-share/dee76d7aa8adff7f9fcb4c3c3b67c6f47757c0ff/docs/assets/oh-my-share-logo.png) | 1,166 |

The icon for pi-tools was resized directly. Excess transparent padding around escaping and white padding around oh-my-share were trimmed before centering the original marks on square canvases. No new logo design or image generation was used.

Paseo-stuff now uses `paseo-stuff-logo.svg`: the approved prototype's white `p+` on a purple (`#7a48d6`) rounded square. It is a site-owned project mark, not an official Paseo logo. Its glyphs are vector paths, so rendering does not depend on installed fonts. Projects, About and the dedicated homepage use this same file. `md2xarticle.svg` comes from the product's original editor. These additions use no image generation.

To reproduce the conversions after downloading the linked originals:

```sh
magick pi-tools.png -resize 128x128 -strip -quality 88 pi-tools-logo.webp
magick escaping-logo.png -trim +repage -resize 100x100 -background none -gravity center -extent 128x128 -strip -quality 90 escaping-logo.webp
magick oh-my-share-logo.png -fuzz 10% -trim +repage -resize 100x100 -background white -gravity center -extent 128x128 -strip -quality 90 oh-my-share-logo.webp
```

Place the results in `theme/static/images/projects/`. `theme/projects.yaml` selects active logos through `image`. The homepage deck selects its own [screenshot covers](theme-covers.md) independently. The earlier oh-my-share logo remains a historical asset but is no longer selected or displayed.
