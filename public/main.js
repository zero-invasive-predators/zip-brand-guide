// ─── Colour utilities ────────────────────────────────────────────────────────

function hexToLinearRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b].map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
}

function linearRGBToOKLAB([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToLinearRGB([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearRGBToHex(rgb) {
  return (
    "#" +
    rgb
      .map((c) => {
        const srgb =
          c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        return Math.max(0, Math.min(255, Math.round(srgb * 255)))
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

function hexToOKLAB(hex) {
  return linearRGBToOKLAB(hexToLinearRGB(hex));
}

function oklabToHex(lab) {
  return linearRGBToHex(oklabToLinearRGB(lab));
}

function oklabToOKLCH([L, a, b]) {
  const C = Math.sqrt(a * a + b * b);
  const H = Math.atan2(b, a) * (180 / Math.PI);
  return [L, C, H < 0 ? H + 360 : H];
}

function oklchToOKLAB([L, C, H]) {
  const hRad = H * (Math.PI / 180);
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

function generateScale(hex) {
  const lab = hexToOKLAB(hex);
  const [L, C, H] = oklabToOKLCH(lab);

  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const standardLightness = [
    0.98, 0.9423, 0.8904, 0.8233, 0.7376, 0.6393, 0.5132, 0.4045, 0.3145,
    0.2525, 0.12,
  ];

  const canonicalIdx = standardLightness.reduce(
    (best, l, i) =>
      Math.abs(l - L) < Math.abs(standardLightness[best] - L) ? i : best,
    0,
  );

  const matchedStandardL = standardLightness[canonicalIdx];

  return steps.map((step, i) => {
    if (i === canonicalIdx) {
      return { step, hex, canonical: true };
    }

    const currentStandardL = standardLightness[i];
    const relativePosition =
      (currentStandardL - matchedStandardL) /
      (currentStandardL > matchedStandardL
        ? 0.95 - matchedStandardL
        : matchedStandardL - 0.05);

    const newL = Math.max(
      0.02,
      Math.min(
        0.98,
        L +
          relativePosition *
            (currentStandardL > matchedStandardL ? 0.98 - L : L - 0.02),
      ),
    );

    let newC;
    if (newL > L) {
      const ratio = (1 - newL) / Math.max(0.001, 1 - L);
      newC = C * Math.pow(Math.max(0, ratio), 0.75);
    } else {
      const ratio = newL / Math.max(0.001, L);
      newC = C * Math.pow(Math.max(0, ratio), 0.8);
    }

    const newLab = oklchToOKLAB([newL, Math.max(0, newC), H]);
    return { step, hex: oklabToHex(newLab), canonical: false };
  });
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToLinearRGB(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagBadges(ratio) {
  const aa = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  const aaa = ratio >= 7;
  const aaaLarge = ratio >= 4.5;
  return { aa, aaLarge, aaa, aaaLarge, ratio };
}

function isValidHex(val) {
  return /^#[0-9a-fA-F]{6}$/.test(val);
}

function autoForeground(hex) {
  return relativeLuminance(hex) > 0.179 ? "#000000" : "#ffffff";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape HTML, then turn *emphasis* into <strong>. */
function formatUsageNote(str) {
  return escapeHtml(str).replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
}

// ─── Config & asset paths ────────────────────────────────────────────────────

const APP = window.APP_CONFIG || { static: false, basePath: "" };

function assetUrl(path) {
  const clean = String(path || "").replace(/^\//, "");
  const base = (APP.basePath || "").replace(/\/$/, "");
  return base ? `${base}/${clean}` : clean;
}

// ─── CMYK ────────────────────────────────────────────────────────────────────

let cmykReady = false;
const transforms = {};

async function initCMYK() {
  try {
    if (typeof jsColorEngine === "undefined") return;

    const srgbProfile = new jsColorEngine.Profile();
    srgbProfile.load("*srgb");

    const profileFiles = {
      fogra39: assetUrl("profiles/CoatedFOGRA39.icc"),
      swop: assetUrl("profiles/USWebCoatedSWOP.icc"),
    };

    for (const [key, url] of Object.entries(profileFiles)) {
      const cmykProfile = new jsColorEngine.Profile();
      await cmykProfile.loadPromise(url);

      const rgb2cmyk = new jsColorEngine.Transform();
      rgb2cmyk.create(
        srgbProfile,
        cmykProfile,
        jsColorEngine.eIntent.perceptual,
      );

      const cmyk2rgb = new jsColorEngine.Transform();
      cmyk2rgb.create(cmykProfile, srgbProfile, jsColorEngine.eIntent.relative);

      transforms[key] = { rgb2cmyk, cmyk2rgb };
    }
    cmykReady = true;
  } catch (e) {
    console.warn("CMYK engine failed to initialise:", e);
  }
}

function approximateCMYK(hex, profileKey) {
  if (!cmykReady) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const out = transforms[profileKey].rgb2cmyk.transform(
    jsColorEngine.color.RGB(r, g, b),
  );
  return { c: out.C, m: out.M, y: out.Y, k: out.K };
}

function cmykToHex(cmyk, profileKey) {
  if (!cmykReady) return null;
  const out = transforms[profileKey].cmyk2rgb.transform(
    jsColorEngine.color.CMYK(cmyk.c, cmyk.m, cmyk.y, cmyk.k),
  );
  const h = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return "#" + h(out.R) + h(out.G) + h(out.B);
}

function getDisplayCMYK(color, profileKey) {
  if (color.cmyk) return { values: color.cmyk, source: "official" };
  if (!cmykReady) return null;
  const values = approximateCMYK(color.hex, profileKey);
  return values ? { values, source: "approximated" } : null;
}

// ─── State ───────────────────────────────────────────────────────────────────

let brands = [];
let canEdit = false;
let editingBrandId = null;
let editingColorIndex = null;
let activeProfile = localStorage.getItem("cmykProfile") || "swop";
let viewMode = localStorage.getItem("viewMode") || "simple";
const loadedGoogleFonts = new Set();

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchBrands() {
  const url = APP.static ? assetUrl("data/brands.json") : "/api/brands";
  const res = await fetch(url);
  const data = await res.json();
  brands = data.brands;
}

async function saveBrandColors(brandId, colors) {
  await fetch(`/api/brands/${brandId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colors }),
  });
}

async function detectEditCapability() {
  if (APP.static) {
    canEdit = false;
    return;
  }
  // Local Express exposes a write API; static hosts do not.
  try {
    const res = await fetch("/api/brands", { method: "GET" });
    canEdit = res.ok;
  } catch {
    canEdit = false;
  }
}

function showEditControls() {
  return canEdit && viewMode === "designer";
}

function isDesignerOnlyColor(color) {
  return Boolean(color?.designerOnly);
}

/** Colours visible in the current mode, with original indices for edit/delete. */
function colorsForMode(colors = []) {
  return colors
    .map((color, index) => ({ color, index }))
    .filter(
      ({ color }) => viewMode === "designer" || !isDesignerOnlyColor(color),
    );
}

// ─── Google Fonts ────────────────────────────────────────────────────────────

function ensureGoogleFont(font) {
  if (!font?.google || loadedGoogleFonts.has(font.google)) return;
  loadedGoogleFonts.add(font.google);
  const weights =
    normalizeWeights(font.weights)
      .map((w) => w.display)
      .join(";") || "400";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

function fontFamilyStack(font) {
  // Prefer a CSS variable from styles/type.css (Adobe Fonts / Typekit, etc.)
  if (font.cssVar) {
    const name = font.cssVar.startsWith("--")
      ? font.cssVar
      : `--${font.cssVar}`;
    return `var(${name})`;
  }
  const fallback = font.fallback || "Arial, sans-serif";
  return `'${font.name}', ${fallback}`;
}

/** Normalize weights to { display: number, visual: string }[]. */
function normalizeWeights(weights) {
  if (!Array.isArray(weights) || !weights.length) return [];
  const VISUAL = {
    100: "Thin",
    200: "Extra Light",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "Semibold",
    700: "Bold",
    800: "Extra Bold",
    900: "Black",
  };
  return weights
    .map((w) => {
      if (w && typeof w === "object") {
        const display = Number(w.display ?? w.css ?? w.value);
        const visual =
          w.visual || w.label || VISUAL[display] || String(display);
        return { display, visual };
      }
      const display = Number(w);
      return { display, visual: VISUAL[display] || String(display) };
    })
    .filter((w) => !Number.isNaN(w.display));
}

function renderWeightSamples(font, sample) {
  const stack = fontFamilyStack(font);
  const weights = normalizeWeights(font.weights);
  const list = weights.length ? weights : [{ display: 400, visual: "Regular" }];

  return list
    .map(
      (w) => `
    <div class="font-sample-row">
      <span class="font-weight-visual">${escapeHtml(w.visual)}</span>
      <p class="font-sample" style="font-family:${stack};font-weight:${w.display}">${escapeHtml(sample || "Sample text")}</p>
    </div>
  `,
    )
    .join("");
}

// ─── Pairings ────────────────────────────────────────────────────────────────

function collectAaPairings(colors) {
  const pairs = [];
  const seen = new Set();

  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue;
      const fg = colors[i];
      const bg = colors[j];
      const key = `${fg.hex}|${bg.hex}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const ratio = contrastRatio(fg.hex, bg.hex);
      if (wcagBadges(ratio).aa) {
        pairs.push({
          fgName: fg.name,
          bgName: bg.name,
          fg: fg.hex,
          bg: bg.hex,
          ratio,
        });
      }
    }
  }

  pairs.sort((a, b) => b.ratio - a.ratio);
  return pairs;
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function renderBadge(pass, label) {
  return `<span class="badge ${pass ? "badge-pass" : "badge-fail"}">${label}</span>`;
}

function renderContrastRow(label, hex1, hex2) {
  const ratio = contrastRatio(hex1, hex2);
  const { aa, aaLarge } = wcagBadges(ratio);
  return `
    <div class="contrast-row">
      <span class="contrast-swatch" style="background:${hex2};color:${hex1}">Aa</span>
      <span class="contrast-label">${escapeHtml(label)}</span>
      <span class="contrast-ratio">${ratio.toFixed(2)}:1</span>
      ${renderBadge(aa, "AA")}
      ${renderBadge(aaLarge, "AA Large")}
    </div>`;
}

function renderAccessibilityPanel(color, allColors) {
  const others = allColors.filter((c) => c.hex !== color.hex);
  const paletteNames = allColors.map((c) => c.name.toLowerCase());
  const hasNamedWhite = paletteNames.includes("white");
  const hasNamedBlack = paletteNames.includes("black");

  const pairs = [];
  if (!hasNamedWhite) {
    pairs.push({
      label: `${color.name} on white`,
      hex1: color.hex,
      hex2: "#ffffff",
    });
    pairs.push({
      label: `White on ${color.name.toLowerCase()}`,
      hex1: "#ffffff",
      hex2: color.hex,
    });
  }
  if (!hasNamedBlack) {
    pairs.push({
      label: `${color.name} on black`,
      hex1: color.hex,
      hex2: "#000000",
    });
    pairs.push({
      label: `Black on ${color.name.toLowerCase()}`,
      hex1: "#000000",
      hex2: color.hex,
    });
  }
  others.forEach((other) => {
    pairs.push({
      label: `${color.name} on ${other.name.toLowerCase()}`,
      hex1: color.hex,
      hex2: other.hex,
    });
  });

  pairs.sort(
    (a, b) => contrastRatio(b.hex1, b.hex2) - contrastRatio(a.hex1, a.hex2),
  );
  const rows = pairs
    .map((p) => renderContrastRow(p.label, p.hex1, p.hex2))
    .join("");
  return `
    <details class="panel designer-only">
      <summary>Accessibility</summary>
      <div class="panel-body contrast-grid">
        <div class="contrast-header">
          <span></span><span>Pair</span><span>Ratio</span><span>AA</span><span>AA Lg</span>
        </div>
        ${rows}
      </div>
    </details>`;
}

function renderScalePanel(hex) {
  const scale = generateScale(hex);
  const swatches = scale
    .map(({ step, hex: sh, canonical }) => {
      const fg = autoForeground(sh);
      return `
      <button class="scale-swatch copy-btn${canonical ? " scale-canonical" : ""}" data-hex="${sh}" style="background:${sh};color:${fg}" title="Copy ${sh}">
        <span class="scale-step">${step}</span>
        <span class="scale-hex">${sh}</span>
      </button>`;
    })
    .join("");
  return `
    <details class="panel designer-only">
      <summary>Tints &amp; shades</summary>
      <div class="panel-body scale-row">${swatches}</div>
    </details>`;
}

function renderCMYKRow(color) {
  const display = getDisplayCMYK(color, activeProfile);
  if (!display) return "";

  const { values: v, source } = display;
  const cmykStr = `${v.c} ${v.m} ${v.y} ${v.k}`;

  let badge,
    softproof = "";
  const profileLabel = activeProfile === "fogra39" ? "FOGRA39" : "SWOP v2";
  if (source === "official") {
    const proofHex = cmykToHex(v, activeProfile);
    if (proofHex) {
      softproof = `<span class="cmyk-softproof" style="background:${proofHex}" title="Press preview (${profileLabel})"></span>`;
    }
    badge = `<span class="cmyk-badge cmyk-badge--official">Brand</span>`;
  } else {
    const proofHex = cmykToHex(v, activeProfile);
    if (proofHex) {
      softproof = `<span class="cmyk-softproof" style="background:${proofHex}" title="Soft proof (${profileLabel})"></span>`;
    }
    badge = `<span class="cmyk-badge cmyk-badge--approx">Approx.</span>`;
  }

  return `
    <div class="cmyk-row designer-only">
      <button class="copy-btn cmyk-copy" data-hex="${cmykStr}" title="Copy CMYK">
        <span class="cmyk-values">C ${v.c}&ensp;M ${v.m}&ensp;Y ${v.y}&ensp;K ${v.k}</span>
      </button>
      ${badge}${softproof}
    </div>`;
}

function renderColorCard(color, index, brandId, allColors) {
  const fg = autoForeground(color.hex);

  let swatchChip = "";
  const display = getDisplayCMYK(color, activeProfile);
  if (display) {
    const proofHex = cmykToHex(display.values, activeProfile);
    if (proofHex) {
      const profileLabel = activeProfile === "fogra39" ? "FOGRA39" : "SWOP v2";
      const chipTitle =
        display.source === "official"
          ? `Press preview (${profileLabel})`
          : `Soft proof (${profileLabel})`;
      swatchChip = `<span class="swatch-cmyk-chip designer-only" style="background:${proofHex}" title="${chipTitle}"></span>`;
    }
  }

  const actions = showEditControls()
    ? `
        <div class="color-actions edit-only">
          <button class="btn-icon edit-color" data-brand="${brandId}" data-index="${index}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon delete-color" data-brand="${brandId}" data-index="${index}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>`
    : "";

  const designerBadge = isDesignerOnlyColor(color)
    ? `<span class="designer-only-badge" title="Hidden in Simple mode">Designer</span>`
    : "";

  return `
    <div class="color-card${isDesignerOnlyColor(color) ? " color-card--designer-only" : ""}" data-brand="${brandId}" data-index="${index}">
      <button class="swatch copy-btn" data-hex="${color.hex}" style="background:${color.hex}" aria-label="Copy ${color.hex}">
        <span class="copy-hint" style="color:${fg}">Copy</span>
        ${swatchChip}
      </button>
      <div class="color-info">
        <div class="color-name-row">
          <span class="color-name">${escapeHtml(color.name)}</span>
          ${designerBadge}
        </div>
        <button class="copy-btn hex-label" data-hex="${color.hex}">${color.hex}</button>
        ${renderCMYKRow(color)}
        ${actions}
      </div>
      ${renderAccessibilityPanel(color, allColors)}
      ${renderScalePanel(color.hex)}
    </div>`;
}

function renderFontCard(font, sample, role, variant) {
  if (!font) return '<div class="font-card font-card--empty"></div>';

  ensureGoogleFont(font);
  const variantClass =
    variant === "fallback" ? "font-card--fallback" : "font-card--ideal";

  return `
    <div class="font-card ${variantClass}">
      <div class="font-meta">
        <span class="font-role">${escapeHtml(role || "Font")}</span>
        ${escapeHtml(font.name)}
      </div>
      <div class="font-samples">${renderWeightSamples(font, sample)}</div>
    </div>`;
}

function renderTypography(brand) {
  const fonts = brand.fonts || [];
  if (!fonts.length) {
    return `
      <section class="brand-section" id="brand-${brand.id}-typography">
        <h3 class="section-heading">Typography</h3>
        <p class="empty-state">No fonts defined yet</p>
      </section>`;
  }

  const pairs = fonts
    .map((pair) => {
      // Support legacy flat font objects during transition
      if (pair.ideal || pair.fallback) {
        const sample =
          pair.sample || pair.ideal?.sample || pair.fallback?.sample || "";
        const role = pair.role || "";
        return `
        ${renderFontCard(pair.ideal, sample, role, "ideal")}
        ${renderFontCard(pair.fallback, sample, role, "fallback")}`;
      }
      return `
      ${renderFontCard(pair, pair.sample, pair.role, "ideal")}
      <div class="font-card font-card--empty"></div>`;
    })
    .join("");

  const blurb = brand.usage?.typography
    ? `<p class="usage-blurb">${formatUsageNote(brand.usage.typography)}</p>`
    : "";

  return `
    <section class="brand-section" id="brand-${brand.id}-typography">
      <h3 class="section-heading">Typography</h3>
      <div class="fonts-pair-grid">
        <p class="fonts-col-label fonts-col-label--ideal">Brand fonts <span>(where available)</span></p>
        <p class="fonts-col-label fonts-col-label--fallback">Fallback fonts <span>(for Microsoft apps, or where not available)</span></p>
        ${pairs}
      </div>
      ${blurb}
    </section>`;
}

function renderLogos(brand) {
  const logos = Array.isArray(brand.logos) ? brand.logos : [];

  if (!logos.length) {
    return `
      <section class="brand-section" id="brand-${brand.id}-logos">
        <h3 class="section-heading">Logos</h3>
        <p class="empty-state">No logos defined yet</p>
      </section>`;
  }

  const cards = logos
    .map((logo) => {
      const path = logo.file || logo.src || "";
      const name = logo.name || "Logo";
      const background = (logo.background || "light").toLowerCase();
      const href = path ? assetUrl(path) : "";
      const filename = path ? path.split("/").pop() : "";
      const previewClass =
        background === "dark"
          ? "logo-preview--dark"
          : background === "any"
            ? "logo-preview--any"
            : "logo-preview--light";

      const preview = path
        ? `<img src="${href}" alt="${escapeHtml(brand.abbr)} ${escapeHtml(name)}" loading="lazy" onerror="this.outerHTML='<span class=\\'logo-placeholder\\'>Add PNG to repo</span>'">`
        : `<span class="logo-placeholder">Add PNG to repo</span>`;

      const download = path
        ? `<a class="btn-ghost logo-download" href="${href}" download="${filename}">Download</a>`
        : `<span class="btn-ghost logo-download" aria-disabled="true">Download</span>`;

      return `
      <div class="logo-card">
        <div class="logo-preview ${previewClass}">${preview}</div>
        <div class="logo-footer">
          <span class="logo-label">${escapeHtml(name)}</span>
          ${download}
        </div>
      </div>`;
    })
    .join("");

  return `
    <section class="brand-section" id="brand-${brand.id}-logos">
      <h3 class="section-heading">Logos</h3>
      <div class="logos-grid">${cards}</div>
    </section>`;
}

function renderPairings(brand) {
  const visible = colorsForMode(brand.colors || []).map(({ color }) => color);
  const pairs = collectAaPairings(visible);
  const chips = pairs.length
    ? pairs
        .map(
          (p) => `
        <div class="pairing-chip" style="background:${p.bg};color:${p.fg}">
          <span class="pairing-sample">Aa</span>
          <span class="pairing-label">${escapeHtml(p.fgName)} on ${escapeHtml(p.bgName)}</span>
        </div>`,
        )
        .join("")
    : '<p class="empty-state">No AA pairings in this palette</p>';

  const defaultBlurb =
    "Make sure you use the above combinations for any text and background combinations. This helps make sure that all text is readbable and accessible to all.";
  const blurbText = brand.usage?.pairings || defaultBlurb;
  const blurb = `<p class="usage-blurb">${formatUsageNote(blurbText)}</p>`;

  return `
    <section class="brand-section" id="brand-${brand.id}-pairings">
      <h3 class="section-heading">Acceptable pairings</h3>
      <div class="pairings-grid">${chips}</div>
      ${blurb}
    </section>`;
}

function renderBrand(brand) {
  const visible = colorsForMode(brand.colors || []);
  // Accessibility panels (Designer) still compare against the full palette
  const colorCards = visible.length
    ? visible
        .map(({ color, index }) =>
          renderColorCard(color, index, brand.id, brand.colors),
        )
        .join("")
    : '<p class="empty-state">No colours yet</p>';

  const addBtn = showEditControls()
    ? `<button class="btn-primary add-color edit-only" data-brand="${brand.id}">+ Add colour</button>`
    : "";

  const colorsBlurb = brand.usage?.colors
    ? `<p class="usage-blurb">${formatUsageNote(brand.usage.colors)}</p>`
    : "";

  return `
    <section class="brand-card" id="brand-${brand.id}">
      <div class="brand-header">
        <div class="brand-title">
          <span class="brand-abbr">${escapeHtml(brand.abbr)}</span>
          <h2 class="brand-name">${escapeHtml(brand.name)}</h2>
        </div>
        ${addBtn}
      </div>
      ${renderLogos(brand)}
      <div class="brand-section" id="brand-${brand.id}-colours">
        <h3 class="section-heading">Colours</h3>
        <div class="colors-grid">${colorCards}</div>
        ${colorsBlurb}
      </div>
      ${renderTypography(brand)}
      ${renderPairings(brand)}
    </section>`;
}

function renderSidebar() {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = brands
    .map(
      (brand) => `
    <div class="nav-brand">
      <a class="nav-brand-link" href="#brand-${brand.id}">
        <span class="nav-abbr">${escapeHtml(brand.abbr)}</span>${escapeHtml(brand.name)}
      </a>
      <ul class="nav-sub">
        <li><a href="#brand-${brand.id}-logos">Logos</a></li>
        <li><a href="#brand-${brand.id}-colours">Colours</a></li>
        <li><a href="#brand-${brand.id}-typography">Typography</a></li>
        <li><a href="#brand-${brand.id}-pairings">Pairings</a></li>
      </ul>
    </div>
  `,
    )
    .join("");
}

function renderAll() {
  applyModeClasses();
  const container = document.getElementById("brands-container");
  container.innerHTML = brands.map(renderBrand).join("");
  renderSidebar();
  updateModeSwitchUI();
}

// ─── Mode & body classes ─────────────────────────────────────────────────────

function applyModeClasses() {
  document.body.classList.toggle("mode-simple", viewMode === "simple");
  document.body.classList.toggle("mode-designer", viewMode === "designer");
  document.body.classList.toggle("no-edit", !showEditControls());
}

function updateModeSwitchUI() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === viewMode);
  });
  const hint = document.getElementById("mode-hint");
  if (hint) {
    hint.textContent =
      viewMode === "simple"
        ? "Colours, fonts & logos for everyday use"
        : "CMYK, contrast ratios, tints & editing";
  }
}

function setViewMode(mode) {
  if (mode !== "simple" && mode !== "designer") return;
  viewMode = mode;
  localStorage.setItem("viewMode", viewMode);
  renderAll();
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.innerHTML;
    btn.classList.add("copied");
    if (
      btn.classList.contains("hex-label") ||
      btn.classList.contains("font-name-btn")
    ) {
      btn.innerHTML = "Copied!";
    } else if (btn.classList.contains("cmyk-copy")) {
      const valSpan = btn.querySelector(".cmyk-values");
      if (valSpan) valSpan.textContent = "Copied!";
    } else {
      const hint = btn.querySelector(".copy-hint");
      if (hint) hint.textContent = "Copied!";
    }
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.innerHTML = original;
    }, 1500);
  });
}

// ─── Profile toggle ───────────────────────────────────────────────────────────

document.querySelectorAll(".profile-btn").forEach((b) => {
  b.classList.toggle("active", b.dataset.profile === activeProfile);
});

document.querySelector(".profile-toggle")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".profile-btn");
  if (!btn || btn.dataset.profile === activeProfile) return;
  activeProfile = btn.dataset.profile;
  localStorage.setItem("cmykProfile", activeProfile);
  document.querySelectorAll(".profile-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.profile === activeProfile);
  });
  renderAll();
  updateCMYKHint();
});

// ─── Mode switch & mobile nav ────────────────────────────────────────────────

document.querySelector(".mode-switch")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".mode-btn");
  if (!btn) return;
  setViewMode(btn.dataset.mode);
});

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (backdrop) backdrop.hidden = true;
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (backdrop) backdrop.hidden = false;
}

document.getElementById("menu-toggle")?.addEventListener("click", openSidebar);
document
  .getElementById("sidebar-close")
  ?.addEventListener("click", closeSidebar);
document
  .getElementById("sidebar-backdrop")
  ?.addEventListener("click", closeSidebar);

document.getElementById("sidebar-nav")?.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeSidebar();
});

// ─── Modal ────────────────────────────────────────────────────────────────────

const modal = document.getElementById("color-modal");
const form = document.getElementById("color-form");
const nameInput = document.getElementById("color-name");
const hexInput = document.getElementById("color-hex");
const pickerInput = document.getElementById("color-picker");
const modalTitle = document.getElementById("modal-title");
const submitBtn = document.getElementById("modal-submit");
const cmykCInput = document.getElementById("cmyk-c");
const cmykMInput = document.getElementById("cmyk-m");
const cmykYInput = document.getElementById("cmyk-y");
const cmykKInput = document.getElementById("cmyk-k");
const cmykHint = document.getElementById("cmyk-hint");

function updateCMYKHint() {
  if (!cmykReady || !isValidHex(hexInput.value.trim())) {
    cmykHint.textContent = "";
    return;
  }
  const approx = approximateCMYK(hexInput.value.trim(), activeProfile);
  if (!approx) {
    cmykHint.textContent = "";
    return;
  }
  const profileLabel = activeProfile === "fogra39" ? "FOGRA39" : "SWOP v2";
  cmykHint.textContent = `Approx. (${profileLabel}): C ${approx.c}  M ${approx.m}  Y ${approx.y}  K ${approx.k}`;
}

function openModal(brandId, colorIndex = null) {
  if (!showEditControls()) return;
  editingBrandId = brandId;
  editingColorIndex = colorIndex;
  form.reset();

  if (colorIndex !== null) {
    const brand = brands.find((b) => b.id === brandId);
    const color = brand.colors[colorIndex];
    nameInput.value = color.name;
    hexInput.value = color.hex;
    pickerInput.value = color.hex;
    if (color.cmyk) {
      cmykCInput.value = color.cmyk.c;
      cmykMInput.value = color.cmyk.m;
      cmykYInput.value = color.cmyk.y;
      cmykKInput.value = color.cmyk.k;
    }
    modalTitle.textContent = "Edit colour";
    submitBtn.textContent = "Save colour";
  } else {
    modalTitle.textContent = "Add colour";
    submitBtn.textContent = "Add colour";
    pickerInput.value = "#000000";
    hexInput.value = "#000000";
  }
  updateCMYKHint();
  modal.showModal();
}

document
  .getElementById("modal-cancel")
  ?.addEventListener("click", () => modal.close());

pickerInput?.addEventListener("input", () => {
  hexInput.value = pickerInput.value;
  updateCMYKHint();
});

hexInput?.addEventListener("input", () => {
  if (isValidHex(hexInput.value)) {
    pickerInput.value = hexInput.value;
  }
  updateCMYKHint();
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!showEditControls()) return;

  const name = nameInput.value.trim();
  let hex = hexInput.value.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (!isValidHex(hex) || !name) return;

  const cVal = cmykCInput.value.trim();
  const mVal = cmykMInput.value.trim();
  const yVal = cmykYInput.value.trim();
  const kVal = cmykKInput.value.trim();

  let cmyk;
  if (cVal !== "" || mVal !== "" || yVal !== "" || kVal !== "") {
    const clamp = (s) =>
      Math.max(0, Math.min(100, Math.round(parseFloat(s) || 0)));
    cmyk = { c: clamp(cVal), m: clamp(mVal), y: clamp(yVal), k: clamp(kVal) };
  }

  const brand = brands.find((b) => b.id === editingBrandId);
  const colors = [...brand.colors];
  const entry = cmyk ? { name, hex, cmyk } : { name, hex };

  if (editingColorIndex !== null) {
    // Preserve flags like designerOnly that aren't edited in the modal
    const prev = brand.colors[editingColorIndex] || {};
    if (prev.designerOnly) entry.designerOnly = true;
    colors[editingColorIndex] = entry;
  } else {
    colors.push(entry);
  }

  await saveBrandColors(editingBrandId, colors);
  brand.colors = colors;
  modal.close();
  renderAll();
});

// ─── Event delegation ─────────────────────────────────────────────────────────

document
  .getElementById("brands-container")
  ?.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
      const value = copyBtn.dataset.hex;
      const copyValue = /^#[0-9A-Fa-f]{6}$/.test(value)
        ? value.slice(1)
        : value;
      copyToClipboard(copyValue, copyBtn);
      return;
    }

    const addBtn = e.target.closest(".add-color");
    if (addBtn) {
      openModal(addBtn.dataset.brand);
      return;
    }

    const editBtn = e.target.closest(".edit-color");
    if (editBtn) {
      openModal(editBtn.dataset.brand, parseInt(editBtn.dataset.index, 10));
      return;
    }

    const deleteBtn = e.target.closest(".delete-color");
    if (deleteBtn) {
      if (!showEditControls()) return;
      const { brand: brandId, index } = deleteBtn.dataset;
      const brand = brands.find((b) => b.id === brandId);
      const colors = brand.colors.filter((_, i) => i !== parseInt(index, 10));
      await saveBrandColors(brandId, colors);
      brand.colors = colors;
      renderAll();
    }
  });

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  applyModeClasses();
  updateModeSwitchUI();
  await Promise.all([fetchBrands(), initCMYK()]);
  await detectEditCapability();
  renderAll();
}

init();
