# Geo

Geo is geoqiao.me's own design. Its starting point was Quiet, escaping's built-in theme, at escaping commit `9b16dbbea2dd2dd2a38e742198b0f7300f0404eb`; this is historical provenance, not an upstream to track.

The site is an [Astro](https://astro.build/) project in this repository. escaping only exports the published Issues as Markdown (`escaping-site export`, [content export v1](https://github.com/geoqiao/escaping/blob/main/docs/contracts/content-export-v1.md)); everything a reader or a crawler receives is built here:

- `src/lib/content.ts` reads the export (`content/`, which the workflow commits, or `CONTENT_DIR`); `src/lib/config.ts` reads `config.yaml`.
- `src/lib/markdown.ts` renders Issue bodies: GitHub-flavored Markdown, an HTML allowlist, and code colors at build time. `tests/markdown.test.mjs` guards the allowlist.
- `src/lib/site.ts` derives tags, Blog pages, the sitemap order and the old-address redirects.
- `src/pages/` writes the pages, `atom.xml`, `sitemap.xml`, `robots.txt` and `search.json`; `src/pages/[...file].ts` writes the product pages and the old-address pages.
- `src/integrations/check-links.mjs` fails the build when a page links to an address of this site that was not built.
- `src/pages/[...file].ts` writes `_redirects` from `config.yaml` `redirects`: each old address, with or without its closing slash, moves permanently (301) to its page in one step. `src/integrations/slash-redirects.mjs` then adds a line for each page, so that an address without its closing slash moves permanently (301) to the page.
- `src/site.config.ts` holds the presentation choices: featured posts, the escaping footer link, comment colors.
- `public/assets/` is published as `/assets/` unchanged. `public/assets/escaping/` is a copy of escaping's comments and Mermaid scripts (escaping v0.5.1); the site owns it now.

The design's MIT notice, inherited from Quiet, is [geo-license.txt](geo-license.txt).

Every address the site had under escaping's own renderer is kept. `node scripts/compare-sites.mjs <old> <new>` compares two builds page by page (head metadata, visible text, links and resources).

## Design and source

- `src/layouts/Base.astro` and `src/components/HeaderControls.astro`: inner pages use a narrow text navigation list in the left margin, with search and appearance directly below it; the whole rail stays in place while scrolling. Home keeps them at the top right of the reading column. With a mouse, the two controls are 36px and sit side by side as one group; touch keeps 44px targets. At 1080px and below, navigation collapses into a Menu control at the top left; the compact header stays available while scrolling. Without JavaScript, navigation links remain visible in the page.
- `src/components/Intro.astro`: the personal introduction and three handwritten navigation notes. Decorative notes are hidden from screen readers; destination words remain normal links.
- `src/pages/index.astro`: identity, featured writing (`featuredPosts` in `src/site.config.ts`), the five newest posts, and the project section.
- `src/components/ProjectDeck.astro`: real project links with optional desktop previews.
- `public/assets/css/geo.css`: Geo's shared palette, Spectral typefaces, left navigation, and top controls.
- `public/assets/css/home.css`: annotation choreography, homepage layout, card fan, and responsive/reduced-motion layouts.
- `public/assets/js/home.js`: one selected card, switch/dismiss/navigation behavior, measured positioning, and interruptible scroll assistance. It loads only on Home.
- `public/assets/js/appearance.js` and `site.js`: use Geo's own `geo-theme` preference key. `site.js` also handles the compact navigation disclosure, Escape/outside dismissal, and focus when crossing the navigation breakpoint.
- `src/components/ProjectEntry.astro`: a text-led Projects catalog and a compact, correctly nested project list on About. Project logos are 48px on desktop, 40px on narrow screens, and 32px on About.
- `src/pages/tags/`: an alphabetical topic index with counts and compact article listings.
- `public/assets/css/syntax.css`: code colors. Each token carries Xcode's light color and GitHub's dark color; the stylesheet picks one.
- `public/assets/images/projects/`: local [homepage covers](theme-covers.md) and [project logos](theme-logos.md).

Dark mode uses a green accent drawn from the green stroke in the profile mark (`#4faf90`) for tags, navigation markers, general links, and focus outlines. Light mode uses its original pink accent (`#a72f6a`) and pale pink selection. Homepage annotation notes, arrows, link highlights, and hover colors keep their blue/green/purple hues in both appearances; dark mode uses lighter shades of them (`#6f9ad6`, `#4fa874`, `#b087cf`) so they stay readable. Mobile retains the colored link highlights while hiding the decorative notes and arrows. The shared palette belongs to `geo.css`; `home.css` owns the annotation colors. Both support system appearance without JavaScript and neutral print colors.

The homepage takes visual inspiration from kieran.build. The annotation SVG paths, animation styles, and card controller were implemented for Geo. No Kieran imagery or custom source files were copied. Spectral and Shantell Sans are self-hosted from Fontsource 5.3.0; OFL notices are alongside the font files.

Project content lives under `projects:` in `config.yaml`. `image` supplies the shared Projects/About/product-page logo; paseo-stuff uses the purple `p+` mark. The homepage deck retains its existing interaction and screenshot covers, and opens each product homepage. The Projects catalog retains its layout and links to `/projects/<slug>/`. Assets use `/assets/…` paths.

Each project has a product page at `/projects/<slug>/`, written from `src/project-pages/<slug>.html`. Every project in `config.yaml` therefore needs its own file there; the build fails without it. The pages are listed in search and the sitemap. md2xarticle is a website-only project with an explicit `slug`. Maintenance, media provenance and compatibility limits are documented in [product homepages](product-homepages.md).

## Local preview

Requirements: Git, uv, Node.js 24 with pnpm, and GitHub CLI authenticated for read access to the site's Issues (or a `GITHUB_TOKEN` environment variable). The helper reads the escaping version from the production workflow (`uvx escaping-site@X.Y.Z`) and runs that package from PyPI the same way. `ESCAPING_SOURCE=/path/to/escaping` uses a local checkout instead. No hosting action is part of the helper.

From the site repository:

```sh
bash scripts/preview_geo.sh
```

Open **http://localhost:8765**. A numeric argument selects another port. Stop the terminal with Ctrl-C. If a preview is already running, rebuild in a second terminal and refresh the browser:

```sh
bash scripts/preview_geo.sh --build-only
```

The helper runs `escaping-site export` into `build/content/` (its own export; it leaves the committed `content/` alone), then `pnpm build` into `dist/`, and serves `dist/` as the document root. `pnpm dev` gives a live-reloading preview of design changes from the committed `content/`; it does not serve the old-address pages. `PROJECT_METADATA=offline` builds without asking GitHub for the projects' language and topics. Production canonical URLs intentionally stay `https://geoqiao.me/`; the local server does not change content identity. Generated output and local environments are ignored by Git.

## Interaction contract

On a wide screen with a fine pointer and normal motion, the deck fans out. First click/Enter selects and lifts a card; the next activation follows its link. Another card changes the preview. Close, Escape, or a click outside the cards dismisses it. Cmd/Ctrl-click and middle-click keep ordinary link behavior. An explicit Close returns focus to the selected card.

Below 1000 CSS pixels, cards use a swipeable row. Wide touch-only screens use a flat grid. Both open projects with one activation. Reduced motion uses a static grid and disables animated annotations, backgrounds, and assisted scrolling. Without JavaScript, or if Home's script fails, full cards and links remain usable. Fewer than three cards also stays a normal grid.

The retreat distance is measured from the complete selected card so its description does not overlap the row behind it. Wheel/touch/manual scroll keys interrupt scrolling; resizing or changing motion preferences closes or repositions the preview as appropriate.

## Checks

Build before running browser checks:

```sh
pnpm test
pnpm check
uv run --no-project --python 3.14 --with pyyaml==6.0.3 python -m unittest discover -s tests -v
uv run --no-project --python 3.14 --with playwright==1.62.0 python tests/browser/test_geo_theme.py
GEO_BROWSER=webkit uv run --no-project --python 3.14 --with playwright==1.62.0 python tests/browser/test_geo_theme.py
git diff --check
```

If browser executables are missing, install them using `uv run --no-project --python 3.14 --with playwright==1.62.0 playwright install chromium webkit`.

The browser suite exercises the real generated site: article code colors, diagrams, contents and comment binding, an old-address page, selection and navigation, keyboard dismissal/switching, repeated initialization, responsive navigation and focus, control alignment, runtime motion changes, interrupted scrolling, no-JavaScript/failed-script fallback, search, and persisted appearance. It also checks the distinct light/dark palettes with and without scripts. Visually inspect annotation placement, covers, both color schemes, long article pages, and intermediate widths when changing the design. Browser checks are separate from the existing dependency-light production unittest discovery.
