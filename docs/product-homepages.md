# Geo product homepages

Projects keeps the existing catalog layout. Project names, About entries, search results and Home cards open four independently styled homepages: pi-tools, escaping, md2xarticle and paseo-stuff. oh-my-share, BTW and Pet are omitted from this presentation.

## Ownership and build

The page templates belong to this site's Geo theme and use escaping Theme API 4; the generator has no Geo-specific code.

- `config.yaml` `projects:`: the complete catalog, including the repository-free md2xarticle website (explicit `slug`). escaping validates repositories, links, images, fallback metadata and unique slugs.
- `config.yaml` `pages.extra`: `/projects/{slug}/` rendered from `projects/{slug}.html` for each project. escaping adds these routes to search and the sitemap, sets each project's `page`, and validates all links before the staged output publication.
- `theme/projects/<slug>.html`: approved standalone layouts and concise copy. These use only `static/landing/landing.css`, not Geo's blog stylesheet.
- `theme/static/landing/`: original media, Inter font, and the small controller for screenshots, actual video, copying and fullscreen previews.
- `theme/static/images/projects/paseo-stuff-logo.svg`: the shared purple `p+` mark for Projects, About and the product homepage.

Adding a project requires a matching `theme/projects/<slug>.html`; otherwise the build fails. Upgrading escaping requires `escpe theme check` and the browser suite against the new version.

Use `bash scripts/preview_geo.sh --build-only` and serve `output/` as the HTTP root. The site helper uses `scripts/serve_preview.py`, bound to loopback, with HTTP byte-range support so the original recording can seek like it does on Pages. The browser suite uses the same handler. Production metadata keeps `https://geoqiao.me` for canonical, Open Graph, Twitter and sitemap URLs.

## Media provenance

The implemented pages preserve the approved product-landings-v2 prototype. Product capabilities were checked against the relevant project READMEs before integration.

| Media | Source and treatment |
| --- | --- |
| pi-ask screenshots | Original `pi-tools/packages/pi-ask/docs/media/feature-{single-select,multi-select,preview-pane}.png`; buttons switch actual screenshots |
| pi-ask recording | Original README terminal recording, 1182 × 656, 54.78 seconds; actual playback controls |
| pi-usage | Original `pi-tools` dashboard screenshot; visual crop with a link to the full image |
| escaping | Live `https://geoqiao.me/` iframe; full-screen and external-open actions |
| Article Studio | Original standalone editor from md2xarticle, embedded using an escaped `srcdoc` include; editor bytes remain unchanged within Jinja raw delimiters |
| Table / Mermaid | PNGs actually exported by that original editor; no reconstructed UI |
| Activity | Crop of the plugin's real renderer comparison preview, with synthetic data; not a live Paseo capture |
| Math | Original synthetic React Native Web renderer preview, retaining its component-preview label |
| md2xarticle Home cover | Actual original-editor browser capture at 1180 × 885, resized to 1000 × 750 WebP |
| Inter | `https://rsms.me/inter/font-files/InterVariable.woff2`; OFL license alongside the font |

The md2xarticle website denies iframe embedding. The original self-contained editor is included in `theme/projects/article-studio.html`, outside `static/`: it is an embedded document, not an unregistered output page. Do not rename it to evade HTML validation or strip the site's framing headers. Its dependencies and third-party notices are part of the original file. The page is approximately 5.3 MB before compression because this editor is bundled; other product pages do not load it. The original standalone editor's release behavior, persistence and browser requirements still apply.

Product and font licenses are retained under `theme/static/landing/`. DeepSeek and MaKa are typographic headings, not newly invented product UI. The `p+` is Geo's project mark, not an official Paseo endorsement.

## Verification and limits

Catalog validation, route registration and staged-output preservation are escaping's own tested behavior. The browser suite covers catalog navigation, shared logos, search destinations, responsive pages, actual screenshots/video/copying, the original editor's live preview and fullscreen. Existing navigation, appearance and Home-card tests still run.

The editor does not publish to X from these checks. X draft creation requires the companion and Articles access, with final publication inside X. RPC support requires a client implementing Pi's portable interactions; the full TUI form is not promised in RPC. Activity requires Full detail; Math targets Paseo 0.9; MaKa remains experimental. Native Pi/Paseo and phone-device acceptance are outside this site change.
