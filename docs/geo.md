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
- `public/assets/` is published as `/assets/` unchanged. `public/assets/escaping/` is a copy of escaping's comments script (escaping v0.5.1); the site owns it now. Mermaid diagrams are drawn at build time by `src/lib/diagram.ts` (beautiful-mermaid, pinned and patched in `patches/`), so no diagram script is shipped.

The design's MIT notice, inherited from Quiet, is [geo-license.txt](geo-license.txt).

Every address the site had under escaping's own renderer is kept. `node scripts/compare-sites.mjs <old> <new>` compares two builds page by page (head metadata, visible text, links and resources).

## Design and source

- `src/layouts/Base.astro` and `src/components/HeaderControls.astro`: inner pages use a narrow text navigation list in the left margin, with search and appearance directly below it; the whole rail stays in place while scrolling. Home keeps them at the top right of the reading column. With a mouse, the two controls are 36px and sit side by side as one group; touch keeps 44px targets. At 1080px and below, navigation collapses into a Menu control at the top left; the compact header stays available while scrolling. Without JavaScript, navigation links remain visible in the page.
- `src/components/Intro.astro`: the personal introduction and three handwritten navigation notes. Decorative notes are hidden from screen readers; destination words remain normal links.
- `src/pages/index.astro` renders the introduction, project grid, featured writing (`featuredPosts` in `src/site.config.ts`), and five newest posts in that order.
- `public/assets/css/geo.css`: Geo's shared palette, Spectral and JetBrains Mono typefaces, left navigation, and top controls.
- `public/assets/css/home.css` controls the handwritten annotations, homepage spacing, and responsive project grid.
- `public/assets/js/appearance.js` and `site.js`: use Geo's own `geo-theme` preference key. `site.js` also handles the compact navigation disclosure, Escape/outside dismissal, and focus when crossing the navigation breakpoint.
- `src/components/ProjectEntry.astro`: a text-led Projects catalog and a compact, correctly nested project list on About. Project logos are 48px on desktop, 40px on narrow screens, and 32px on About.
- `src/pages/tags/`: an alphabetical topic index with counts and compact article listings.
- `public/assets/css/syntax.css`: code colors. Each token carries Xcode's light color and GitHub's dark color; the stylesheet picks one.
- `public/assets/images/projects/` holds local [project logos](theme-logos.md) and [historical covers](theme-covers.md).

Dark mode uses a green accent drawn from the green stroke in the profile mark (`#4faf90`) for tags, navigation markers, general links, and focus outlines. Light mode uses its original pink accent (`#a72f6a`) and pale pink selection. Homepage annotation notes, arrows, link highlights, and hover colors keep their blue/green/purple hues in both appearances; dark mode uses lighter shades of them (`#6f9ad6`, `#4fa874`, `#b087cf`) so they stay readable. Mobile retains the colored link highlights while hiding the decorative notes and arrows. The shared palette belongs to `geo.css`; `home.css` owns the annotation colors. Both support system appearance without JavaScript and neutral print colors.

Light appearance uses a white canvas (`#ffffff`) with neutral light-gray panels (`#f6f6f7`). Link and annotation colors retain their existing palettes. The appearance initializer is inlined from its source before styles load.

Comments load within 300px of the viewport, with a GitHub link available if the embed fails. WebKit iframe handling is scoped to the comments container. Markdown images backed by immutable repository attachments or public assets receive missing dimensions at build time, preserving authored sizing and source URLs without downloading remote images.

The homepage takes visual inspiration from kieran.build. The annotation SVG paths and animation styles were implemented for Geo. No Kieran imagery or custom source files were copied. Spectral, Shantell Sans, JetBrains Mono (5.3.0) and Noto Serif SC (5.3.1) are self-hosted from Fontsource; OFL notices are alongside the font files. Noto Serif SC follows Spectral in an article's own headings only (`.article-heading h1` and `.post-content` h1–h3). It is subset at build time (`src/lib/title-font.ts`, `subset-font`) from Fontsource's `chinese-simplified` 600 file to the characters of each article's headings, written to `/assets/fonts/title/<slug>-<hash>.woff2` (5–22 KB), preloaded and declared in an inline `@font-face` in the page head. There is no font stylesheet and an article without Chinese headings loads nothing. A character outside the font falls back to Songti SC.

Project content lives under `projects:` in `config.yaml`. The homepage grid uses the catalog's order and links. Optional `home_title` and `home_summary` fields supply shorter homepage copy and default to `title` and `summary`. `image` supplies the shared Projects, About, and product-page logo.

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

The homepage grid uses one column below 400px of available space, two from 400px, and three from 560px. On hover-capable devices, hovering a project link dims the other projects while keeping any keyboard-focused link at full opacity. Keyboard focus highlights the active link and shows an outline. Reduced motion disables the transitions and arrow movement. Each project opens with one activation and works with JavaScript disabled.

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

The browser suite exercises the generated site's project grid, article code colors, diagrams, contents and comment binding, an old-address page, responsive navigation and focus, control alignment, runtime motion changes, search, and persisted appearance. It also checks the distinct light and dark palettes with and without scripts. Visually inspect annotation placement, the project grid, both color schemes, long article pages, and intermediate widths when changing the design. Browser checks run separately from the Python unit tests.
