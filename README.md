# ZIP Brand Assets

A simple brand colour manager for Zero Invasive Predators and its sub-brands.

Lets you set, view, and copy brand colours, check colour accessibility against WCAG standards, and generate tint/shade scales for any colour in the palette.

---

## Brands

| Abbreviation | Full name |
|---|---|
| ZIP | Zero Invasive Predators |
| PFSW | Predator Free South Westland |
| TMAP | Te Manahuna Aoraki Project |
| PFR | Predator Free Rakiura |

---

## Features

- **Add and manage colours** — name each colour and set it with a hex input or colour picker
- **Copy to clipboard** — click any swatch, hex code, or CMYK values to copy them instantly
- **CMYK values** — each colour card shows CMYK values; enter official values from brand guidelines when adding/editing a colour, or get an ICC-profile-based approximation automatically. Official values are badged **Brand**; approximated values are badged **Approx.** with a soft-proof swatch showing the gamut-mapped colour
- **CMYK profile toggle** — switch between FOGRA39 (ISO Coated v2, common Australasian/European default) and SWOP v2 (US Web Coated) in the top-right; the toggle only affects approximated values; official brand-spec CMYK is profile-independent
- **Accessibility checker** — expand any colour to see WCAG contrast ratios against white, black, and other colours in the same brand palette; results are labelled AA, AA Large, and AAA
- **Tints & shades** — expand any colour to generate a full 50–950 scale using the OKLCH colour space for smooth, perceptually uniform gradients; each stop is copyable

Colour data is saved to `data/brands.json`.

---

## Requirements

- [Node.js](https://nodejs.org) v18 or later

---

## Getting started

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Then open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Project structure

```
zip-brand/
├── server.js          # Express server — static files + API
├── data/
│   ├── brands.json    # Colour data (edited via the UI)
│   └── profiles/      # Source ICC profiles (not served directly)
└── public/
    ├── index.html
    ├── main.js
    ├── style.css
    ├── profiles/      # ICC profiles served statically
    │   ├── CoatedFOGRA39.icc
    │   └── USWebCoatedSWOP.icc
    └── vendor/
        └── jsColorEngineWeb.js
```

---

## ICC profiles & licences

CMYK approximation uses [jsColorEngine](https://github.com/glennwilton/jsColorEngine) (Mozilla Public License 2.0) with two ICC profiles:

- **CoatedFOGRA39.icc** — ISO 12647-2 coated stock profile. Provided by VIGC with permission of X-Rite. May be used, embedded, exchanged, and shared without restriction.
- **USWebCoatedSWOP.icc** — US Web Coated SWOP v2. Distributed by Adobe Systems.

---

## Hosting

The app is a standard Node/Express server. To deploy it:

1. Push the repository to your host of choice (Render, Railway, Fly.io, etc.)
2. Set the `PORT` environment variable if required — the app defaults to `3001`
3. Make sure `data/brands.json` is included or use persistent storage if the host has an ephemeral filesystem

---

## Licence

Internal use — Zero Invasive Predators.
