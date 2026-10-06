# Geo product homepages

Projects keeps the existing catalog layout. Project names, About entries, search results and Home cards open four independently styled homepages: pi-tools, escaping, md2xarticle and paseo-stuff. oh-my-share, BTW and Pet are omitted from this presentation.

## Ownership and build

The pages belong to this site and are written by `src/pages/[...file].ts`; escaping has no part in them.

- `config.yaml` `projects:`: the complete catalog, including the repository-free md2xarticle website (explicit `slug`).
- `src/project-pages/<slug>.html`: approved standalone layouts and concise copy, published at `/projects/<slug>/`. They are whole HTML documents with `{{ project.title }}`, `{{ project.summary }}`, `{{ project.image }}`, `{{ page.path }}`, `{{ page.url }}`, `{{ site.title }}` and `{{ site.author }}` placeholders; an unknown placeholder fails the build. These use only `/assets/landing/landing.css`, not Geo's blog stylesheet.
- `public/assets/landing/`: original media, Inter font, and the small controller for screenshots, actual video, copying and fullscreen previews.
- `public/assets/images/projects/paseo-stuff-logo.svg`: the shared purple `p+` mark for Projects, About and the product homepage.

Adding a project requires a matching `src/project-pages/<slug>.html`; otherwise the build fails.

Use `bash scripts/preview_geo.sh --build-only` and serve `dist/` as the HTTP root. The site helper uses `scripts/serve_preview.py`, bound to loopback, with HTTP byte-range support so the original recording can seek like it does on Pages. The browser suite uses the same handler. Production metadata keeps `https://geoqiao.me` for canonical, Open Graph, Twitter and sitemap URLs.

## Media provenance

The implemented pages preserve the approved product-landings-v2 prototype. Product capabilities were checked against the relevant project READMEs before integration.

| Media | Source and treatment |
| --- | --- |
| pi-ask screenshots | Original `pi-tools/packages/pi-ask/docs/media/feature-{single-select,multi-select,preview-pane}.png`; buttons switch actual screenshots |
| pi-ask recording | Original README terminal recording, 1182 × 656, 54.78 seconds; actual playback controls |
| pi-usage | Original `pi-tools` dashboard screenshot; visual crop with a link to the full image |
| escaping | Live `https://geoqiao.me/` iframe; full-screen and external-open actions |
| Article Studio | Actual original-editor browser capture at 1180 × 885, resized to 1000 × 750 WebP; opens md2xarticle.com |
| Table / Mermaid | PNGs actually exported by that original editor; no reconstructed UI |
| Activity | Crop of the plugin's real renderer comparison preview, with synthetic data; not a live Paseo capture |
| Math | Original synthetic React Native Web renderer preview, retaining its component-preview label |
| Inter | `https://rsms.me/inter/font-files/InterVariable.woff2`; OFL license alongside the font |

The md2xarticle website denies iframe embedding (`X-Frame-Options: DENY`), so its homepage here shows the editor capture `public/assets/images/projects/md2xarticle.webp`, which opens `https://md2xarticle.com/`. The site once published a copy of the editor at `/projects/md2xarticle/studio/`; a line in `config.yaml` `redirects` moves that address to md2xarticle.com with a 301.

Product and font licenses are retained under `public/assets/landing/`. DeepSeek and MaKa are typographic headings, not newly invented product UI. The `p+` is Geo's project mark, not an official Paseo endorsement.

## Verification and limits

The build checks that every project has its page and that every link to this site resolves. The browser suite covers catalog navigation, shared logos, search destinations, responsive pages, actual screenshots/video/copying, and the editor capture's link. Existing navigation, appearance and Home-card tests still run.

X draft creation requires the companion and Articles access, with final publication inside X. RPC support requires a client implementing Pi's portable interactions; the full TUI form is not promised in RPC. Activity requires Full detail; Math targets Paseo 0.9; MaKa remains experimental. Native Pi/Paseo and phone-device acceptance are outside this site change.
