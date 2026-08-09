# Dean Kruger Flagship Portfolio master biography.

A static, local-first cyber-industrial portfolio for Dean Kruger, aligned to the approved Portfolio1 reference with one shared grid, six capability blocks, six authored featured systems, six Experience Highlights cards and six Additional Engineering Work cards.

## Run locally

From this directory:

```sh
python3 -m http.server 8082 --bind 127.0.0.1
```

Open `http://127.0.0.1:8082/`. Use the same server for direct route and refresh checks such as `http://127.0.0.1:8082/projects/` and `http://127.0.0.1:8082/projects/qr-traceability/`. The site uses only relative HTML, CSS, JavaScript and local media assets, so it remains compatible with GitHub Pages and offline hosting.

## Project hub and case studies

`projects/index.html` is the public project hub. It links to six static case-study routes:

- `projects/btc-production-intelligence/`
- `projects/industrial-integration/`
- `projects/qr-traceability/`
- `projects/android-operations/`
- `projects/production-calculator/`
- `projects/legend-investigations/`

The shared project page stylesheet and interaction layer live in `projects/project-pages.css` and `projects/project-pages.js`. The QR lookup and production calculator are deliberately local, synthetic demonstrations; they do not call a backend or private API. The calculator uses the representative packs/minute model documented on its case-study page, and `projects/project-calc.test.js` provides the arithmetic regression check. `projects/CASE_STUDY_EVIDENCE_METHOD.md` describes the public evidence and privacy method.

Run `python3 projects/check-links.py` to scan every HTML page for broken local paths, missing fragment IDs, placeholder links, localhost references and accidental absolute filesystem paths.

## Visual system

- `index.html` contains the single-page sections, accessible navigation, brand marks, six capability cards, six featured systems, compact technology tags and a semantic seven-node data-flow diagram.
- `style.css` contains the cyber-industrial tokens, shared page grid, responsive card layouts, contained authored artwork zones, focus states and reduced-motion rules.
- `app.js` contains navigation state, canvas atmosphere, the precomputed animated globe, terminal sequence and reveal behaviour.
- `assets/icons/capabilities/` contains the local capability line-art icon system.
- `assets/illustrations/` contains the hero network and local decorative illustration artwork.
- `assets/projects/` contains the authored Featured Projects source artwork and optimized WebP/PNG web derivatives.
- `assets/projects/case-studies/web/` contains the descriptive, contained WebP/PNG runtime derivatives used by the project hub and six case-study heroes.
- `assets/projects/case-studies/screenshots/` contains only cropped, sanitised and labelled WebP/PNG screenshot derivatives with captions; raw operational screenshots remain outside the public runtime.
- `SVG/project_images/` contains the authored WebP/PNG artwork used by the six Additional Engineering Work cards.
- `assets/logos/dean-mark.svg` is the primary DK / Dean Kruger mark; `assets/ui/favicon.svg` is the compact favicon-compatible variant.
- `assets/BTC.ico` is the original BTC Control System logo used in BTC project cards.
- `assets/legend-logo.png` is the original Legend Projects logo used in Legend project cards.
- `assets/favicon.ico` and `assets/ui/favicon.svg` are declared as project favicon variants.
- `assets/portraits/` contains the local profile source and square WebP/PNG web derivatives.
- `assets/backgrounds/` and `assets/textures/` contain local atmospheric layers.

## Responsive and motion behaviour

The hero globe is contained inside its visual region. On mobile, the globe occupies a dedicated upper zone, the terminal sits below it and the four-cell metric strip remains inside the same panel. Featured projects use three columns on wide screens, two on tablet and one on mobile. The six-card Experience Highlights section uses two columns on desktop and one on mobile. The seven-node data-flow diagram compresses to one column while preserving source-to-decision order.

The globe uses precomputed geometry and a small fixed route set. Its animation pauses when the page or hero is not visible, restarts when the page returns, and reduces work on low-power/mobile devices. `prefers-reduced-motion` disables decorative motion and reveal transitions.

## Accessibility

Important content remains selectable HTML text. Decorative images and SVGs are hidden from assistive technology, authored project artwork has meaningful alt text and PNG fallbacks, the data-flow diagram has a semantic node description and accessible labels, visible focus outlines are retained, and touch targets remain approximately 44px or larger for primary controls.

The current Legend Systems CV application at `/cv/` is the canonical public CV;
the standalone deployment is available at
`https://dk4never.github.io/legend-systems-cv/`. Portfolio artwork remains
local and offline-compatible.

## Validation matrix

The visual pass targets:

- Desktop: 1920x1080, 1440x900, 1366x768
- Tablet: 1024x768, 768x1024
- Mobile: 320x568, 375x812, 390x844

Core rendering has no external runtime dependency or CDN request. Visual screenshot validation uses local Chromium and Firefox smoke tests and does not replace testing in every target browser.
