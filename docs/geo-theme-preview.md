# Geo local preview

Geo is the site's independent theme, initially based on Quiet. It owns its templates, assets, and interaction code and does not track future Quiet changes. Quiet remains escaping's built-in default.

This preview was prepared on `design/geo-theme` on 2026-09-14. It is local only; no public deployment was performed.

## Try it

Run `bash scripts/preview_geo.sh` from the repository, then open <http://localhost:8765>. See the [theme guide](../theme/README.md) for requirements, rebuilding, and implementation details.

- On a wide desktop, click a project card to lift it, then click again to open its project. Click another card to switch; Close, Escape, or clicking outside dismisses the preview.
- The introduction has drawn arrows, handwritten notes, and animated link highlights.
- Narrow screens show a swipeable row with direct links. Reduced motion uses a static grid. Links and descriptions also work without JavaScript.
- Light and dark appearance, search, project pages, article pages, and existing content routes are retained.
- Inner pages use top navigation beneath a compact name-and-controls row. Their search and appearance controls match Home's position exactly; the homepage layout is unchanged. All six navigation links remain visible on mobile.

## Captured preview

These screenshots show the actual locally generated site:

![Geo homepage with handwritten notes in dark appearance](images/geo-home-dark.png)

![Fanned project cards](images/geo-deck-dark.png)

![Selected project card lifted above the others](images/geo-deck-open-dark.png)

[Mobile homepage screenshot](images/geo-home-mobile.png)

The revised inner-page header:

![Blog with top navigation and controls aligned to Home](images/geo-blog-header-light.png)

[Dark appearance](images/geo-blog-header-dark.png) · [Mobile header](images/geo-blog-header-mobile.png)

## Validation

- Generated the real Issues-backed site with the production-pinned escaping compiler, `9b16dbbea2dd2dd2a38e742198b0f7300f0404eb`.
- Generated and validated all 31 legacy slug redirects.
- Passed all 18 existing site tests.
- Passed all five browser cases against the final output in full Chromium and WebKit: project selection/navigation, modifier links, keyboard controls, reinitialization, resizing, mobile/reduced-motion layouts, script fallbacks, search, and persisted appearance.
- Checked desktop and mobile screenshots, intermediate widths, image loading, JavaScript/shell syntax, and whitespace errors.
- After the header revision, reran all 18 site tests and both five-case browser suites. Checked Home, Blog, Projects, Tags, and About at 320, 390, 768, and 1440px: control positions match and no document overflow occurs. Also checked article navigation, search focus restoration, and usable navigation with JavaScript disabled.
- A separate review found no actionable reproducible problems. It also checked scroll interruption and changing motion preferences interactively; these edge cases are not fully asserted by the automated suite.

Project artwork is local and documented in [cover provenance and regeneration](theme-covers.md). No Kieran custom source or artwork was copied.
