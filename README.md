# ZIP Brand Assets

Brand colour, typography, and logo guide for Zero Invasive Predators and its sub-brands.

Use it locally as a designer tool (edit colours, CMYK, contrast, tints), or deploy a **read-only** site to GitHub Pages for people working in Microsoft Office, Google Docs, Canva, and similar tools.

---

## Brands

| Abbreviation | Full name | Folder / id |
|---|---|---|
| ZIP | Zero Invasive Predators | `zip` |
| PFSW | Predator Free South Westland | `pfsw` |
| TMAP | Te Manahuna Aoraki Project | `tmap` |
| PFR | Predator Free Rakiura | `pfr` |

---

## Features

- **Sidebar navigation** — jump between brands and sections: Logos → Colours → Typography → Pairings
- **Simple / Designer mode** — toggle at the bottom of the sidebar (saved in `localStorage`; defaults to Simple)
  - **Simple** — everyday colours, logos, typography, AA pairings; hides CMYK, tints/shades, detailed contrast ratios, and colour editing
  - **Designer** — full colour tools (CMYK profile toggle, accessibility panels, tint/shade scales) plus editing when running locally
- **Logos** — configurable assets with custom names, light/dark/any preview backgrounds, and forced PNG download
- **Colours** — name, hex copy; optional CMYK, accessibility, and tint scales in Designer
- **Designer-only colours** — mark swatches with `"designerOnly": true` to hide them (and their pairings) in Simple mode
- **Acceptable pairings** — auto grid of text/background combinations that pass WCAG AA, with a short usage note (override per brand via `usage.pairings`)
- **Typography** — 2-column grid of **brand fonts** (ideal) vs **fallback fonts** (Microsoft / when unavailable); copyable names; samples styled per weight
- **Usage blurbs** — short guidance under colours and typography per brand; wrap words in `*asterisks*` for **bold**

All brand metadata lives in [`data/brands.json`](data/brands.json).

---

## Requirements

- [Node.js](https://nodejs.org) v18 or later

---

## Local use (designer)

```bash
npm install
npm start
```

Open [http://localhost:3001](http://localhost:3001).

In **Designer** mode (sidebar switch), you can add/edit/delete colours. Changes are written to `data/brands.json` via the Express API.

Fonts, usage blurbs, logo paths, and `designerOnly` flags are edited in `data/brands.json` (not in the UI).

---

## Editing brand data

Each brand in `data/brands.json` looks like:

```json
{
  "id": "zip",
  "name": "Zero Invasive Predators",
  "abbr": "ZIP",
  "usage": {
    "colors": "Use *Ocean teal* and Pacific blue as primary brand colours…",
    "typography": "…",
    "pairings": "Optional override — otherwise a default AA contrast note is shown."
  },
  "fonts": [
    {
      "role": "Headings",
      "sample": "…",
      "ideal": {
        "name": "Proxima Nova",
        "google": null,
        "cssVar": "--font-family-proxima-nova",
        "fallback": "Arial, sans-serif",
        "weights": [
          { "display": 700, "visual": "Bold" }
        ]
      },
      "fallback": {
        "name": "Aptos Display",
        "cssVar": "--font-family-aptos-display",
        "fallback": "Arial, sans-serif",
        "weights": [
          { "display": 700, "visual": "Bold" }
        ]
      }
    }
  ],
  "logos": [
    {
      "name": "Logo • Light backgrounds",
      "file": "logos/zip/zip-logo-light.png",
      "background": "light"
    },
    {
      "name": "Tohu • Any background",
      "file": "logos/pfsw/pfsw-tohu.png",
      "background": "any"
    }
  ],
  "colors": [
    {
      "name": "Ocean teal",
      "hex": "#3abeac",
      "cmyk": { "c": 68, "m": 0, "y": 40, "k": 0 }
    }
  ]
}
```

### Typography

Each entry in `fonts` is one **role** (e.g. Headings, Body) with a shared `sample` string and two faces:

| Field | Purpose |
|---|---|
| `ideal` | Brand font for Adobe, Canva, Squarespace, etc. |
| `fallback` | Office / Microsoft-facing alternative when the brand font isn’t available |

Shown as a 2-column grid: **Brand fonts (where available)** | **Fallback fonts (for Microsoft apps, or where not available)**.

Per face:

- `name` — label shown and copied to the clipboard
- `cssVar` — optional CSS variable from [`public/styles/type.css`](public/styles/type.css) (Adobe Fonts / Typekit)
- `google` — optional Google Fonts family id (use `+` for spaces, e.g. `"Open+Sans"`); set `null` when using Typekit or system fonts
- `fallback` — CSS `font-family` stack if the face fails to load (not the Office font card)
- `weights` — list of `{ "display": 700, "visual": "Bold" }`
  - `display` — CSS `font-weight` applied to that sample (not shown in the UI)
  - `visual` — label above the sample (e.g. Regular, Medium, Bold)

Add Typekit kits and family variables in `public/styles/type.css` (imported first via `style.css`).

### Colours

- `name`, `hex` (required)
- `cmyk` — optional official brand values; otherwise Designer mode can approximate from ICC profiles
- `designerOnly: true` — hidden in Simple mode (including pairings); still visible in Designer with a badge

```json
{
  "name": "Waxgill green",
  "hex": "#98d666",
  "designerOnly": true
}
```

### Logos

`logos` is an array of assets. Each entry has: 

| Field | Purpose |
|---|---|
| `name` | Label under the preview (e.g. `"Tohu • Any background"`) |
| `file` | Path under `public/` (e.g. `"logos/zip/zip-logo-light.png"`) |
| `background` | Preview chrome: `"light"`, `"dark"`, or `"any"` (checkerboard) |

Drop PNGs into brand folders. Filenames are usually prefixed with the brand id:

```
public/logos/{brand-id}/
  {brand-id}-logo-light.png
  {brand-id}-logo-dark.png
  {brand-id}-brandmark-light.png
  …
```

Example: `public/logos/zip/zip-logo-light.png`.

See also [`public/logos/README.md`](public/logos/README.md). Missing files show a placeholder until you add them.

---

## Build & GitHub Pages

The live site is **static and read-only** (no colour editing).

```bash
npm run build
```

This writes a static site to `dist/`:

- copies `public/`
- copies `data/brands.json` → `dist/data/brands.json`
- writes `dist/config.js` with `{ static: true, basePath }`

`BASE_PATH` defaults to `/zip-brand-asset-manager` (project Pages URL). Override if your repo name differs:

```bash
BASE_PATH=/my-repo-name npm run build
```

### Enable Pages

1. Push to `main` (workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. After the workflow succeeds, the site is at `https://<user>.github.io/<repo>/`

The workflow sets `BASE_PATH` from the repository name automatically.

---

## Project structure

```
zip-brand-asset-manager/
├── server.js                      # Express — local API + static files
├── scripts/build.js               # Static export for GitHub Pages
├── data/brands.json               # Source of truth
├── public/
│   ├── index.html
│   ├── main.js
│   ├── config.js                  # Local: { static: false }
│   ├── style.css                  # Imports styles/* (type.css first)
│   ├── styles/
│   │   ├── type.css               # Typekit + --font-family-* variables
│   │   ├── base.css               # Tokens, spacers, mode visibility
│   │   ├── layout.css             # Shell, sidebar, header
│   │   ├── colors.css             # Colour cards, CMYK, scales
│   │   └── sections.css           # Typography, logos, pairings
│   ├── logos/{brand-id}/
│   ├── profiles/                  # ICC profiles for CMYK (Designer)
│   └── vendor/
└── .github/workflows/deploy.yml
```

---

## ICC profiles & licences

CMYK approximation (Designer mode) uses [jsColorEngine](https://github.com/glennwilton/jsColorEngine) (Mozilla Public License 2.0) with:

- **CoatedFOGRA39.icc** — ISO 12647-2 coated stock. Provided by VIGC with permission of X-Rite.
- **USWebCoatedSWOP.icc** — US Web Coated SWOP v2. Distributed by Adobe Systems.

---

## Licence

Internal use — Zero Invasive Predators.
