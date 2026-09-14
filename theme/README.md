# Geo

Geo is geoqiao.me's independent, site-owned theme. Its starting point was Quiet at escaping commit `9b16dbbea2dd2dd2a38e742198b0f7300f0404eb`; this is historical provenance, not an upstream to track. Geo has its own design, behavior, files, and maintenance decisions. There is no inheritance, synchronization, or obligation to adopt future Quiet changes. Quiet remains escaping's default built-in theme.

The integration contract is **escaping Theme API 2**. All required page templates and static assets are owned here. The compiler continues to supply validated content, routes, search/feed output, and the shared comments and Mermaid resources.

## Design and source

- `intro.html`: the personal introduction and three handwritten navigation notes. Decorative notes are hidden from screen readers; destination words remain normal links.
- `home.html`: identity, featured/recent writing, and the project section.
- `project-deck.html`: real project links with optional desktop previews.
- `static/css/geo.css`: Geo's shared palette and Spectral typefaces.
- `static/css/home.css`: annotation choreography, homepage layout, card fan, and responsive/reduced-motion layouts.
- `static/js/home.js`: one selected card, switch/dismiss/navigation behavior, measured positioning, and interruptible scroll assistance. It loads only on Home.
- `static/js/appearance.js` and `site.js`: use Geo's own `geo-theme` preference key.
- `static/images/projects/`: four local project covers, with [source and regeneration notes](../docs/theme-covers.md).

The homepage takes visual inspiration from kieran.build. The annotation SVG paths, animation styles, and card controller were implemented for Geo. No Kieran imagery or custom source files were copied. Spectral and Shantell Sans are self-hosted from Fontsource 5.3.0; OFL notices are alongside the font files. Existing Source Serif 4/Manrope assets and notices came with the initial theme copy.

Project content stays in `config.yaml`, using existing `projects[].image`, `summary`, `language`, and links. The cards open the matching anchor in the local Projects catalog. Cover image URLs use `/templates/Geo/static/images/projects/…`. No new compiler/config fields or external runtime dependencies were added.

## Local preview

Requirements: Git, uv, and GitHub CLI authenticated for read access to the site's Issues (or a `GITHUB_TOKEN` environment variable). The helper reads the compiler SHA from the production workflow, checks out that version in `.scratch/geo/compiler`, and installs its locked noneditable Python 3.14 environment outside the compiler source. No hosting action is part of the helper.

From the site repository:

```sh
bash scripts/preview_geo.sh
```

Open **http://localhost:8765**. A numeric argument selects another port. Stop the terminal with Ctrl-C. If a preview is already running, rebuild in a second terminal and refresh the browser:

```sh
bash scripts/preview_geo.sh --build-only
```

The helper generates and validates the real site, then renders and validates all 31 legacy slug redirects. It serves `output/` as the document root. Production canonical URLs intentionally stay `https://geoqiao.me/`; the local server does not change content identity. Generated output and local environments are ignored by Git.

If changing the compiler pin later, preserve the existing `.scratch/geo` directory under another name and let the helper prepare a fresh compiler/runtime. Do not reuse an environment installed from a different pin. This task's initial runtime was installed by the same pinned installer; `.scratch/geo/install.log` records its exact identity.

## Interaction contract

On a wide screen with a fine pointer and normal motion, the deck fans out. First click/Enter selects and lifts a card; the next activation follows its link. Another card changes the preview. Close, Escape, or a click outside the cards dismisses it. Cmd/Ctrl-click and middle-click keep ordinary link behavior. An explicit Close returns focus to the selected card.

Below 1000 CSS pixels, cards use a swipeable row. Wide touch-only screens use a flat grid. Both open projects with one activation. Reduced motion uses a static grid and disables animated annotations, backgrounds, and assisted scrolling. Without JavaScript, or if Home's script fails, full cards and links remain usable. Fewer than three cards also stays a normal grid.

The retreat distance is measured from the complete selected card so its description does not overlap the row behind it. Wheel/touch/manual scroll keys interrupt scrolling; resizing or changing motion preferences closes or repositions the preview as appropriate.

## Checks

Build before running browser checks:

```sh
uv run --no-project --python .scratch/geo/runtime/bin/python python -m unittest discover -s tests -v
uv run --no-project --python 3.14 --with playwright==1.62.0 python tests/browser/test_geo_theme.py
GEO_BROWSER=webkit uv run --no-project --python 3.14 --with playwright==1.62.0 python tests/browser/test_geo_theme.py
git diff --check
```

If browser executables are missing, install them using `uv run --no-project --python 3.14 --with playwright==1.62.0 playwright install chromium webkit`.

The browser suite exercises the real generated site: selection and navigation, keyboard dismissal/switching, repeated initialization, mobile and reduced motion, no-JavaScript/failed-script fallback, search, and persisted appearance. Visually inspect annotation placement, covers, both color schemes, long article pages, and intermediate widths when changing the design. Browser checks are separate from the existing dependency-light production unittest discovery.
