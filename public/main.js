// ─── Colour utilities ────────────────────────────────────────────────────────

function hexToLinearRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b].map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
}

function linearRGBToOKLAB([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToLinearRGB([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function linearRGBToHex(rgb) {
  return '#' + rgb.map(c => {
    const srgb = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255))).toString(16).padStart(2, '0');
  }).join('');
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

// Generate an 11-stop tint/shade scale using OKLCH, pinning the source
// colour as the canonical stop and distributing others around it.
// Lightness stops are derived from Tailwind Teal OKLCH values, giving tighter
// clustering in the lights and more spread in the darks (600–950).
// Chroma uses a power curve: 0.3 on the light side (gentle steps at 50–200)
// and 0.8 on the dark side (retains richness through 700–900).
function generateScale(hex) {
  const lab = hexToOKLAB(hex);
  const [L, C, H] = oklabToOKLCH(lab);

  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  // Tailwind Teal-derived OKLCH lightness values, normalised to [0.12, 0.98]
  const standardLightness = [0.98, 0.9423, 0.8904, 0.8233, 0.7376, 0.6393, 0.5132, 0.4045, 0.3145, 0.2525, 0.12];

  // Find which step index the source lightness sits closest to
  const canonicalIdx = standardLightness.reduce((best, l, i) =>
    Math.abs(l - L) < Math.abs(standardLightness[best] - L) ? i : best, 0);

  const matchedStandardL = standardLightness[canonicalIdx];

  return steps.map((step, i) => {
    if (i === canonicalIdx) {
      return { step, hex, canonical: true };
    }

    const currentStandardL = standardLightness[i];

    // Map the standard-space relative position onto actual lightness
    const relativePosition = (currentStandardL - matchedStandardL) /
      (currentStandardL > matchedStandardL
        ? (0.95 - matchedStandardL)
        : (matchedStandardL - 0.05));

    const newL = Math.max(0.02, Math.min(0.98,
      L + relativePosition * (currentStandardL > matchedStandardL ? (0.98 - L) : (L - 0.02))
    ));

    // Power-curve chroma reduction toward white or black
    let newC;
    if (newL > L) {
      const ratio = (1 - newL) / Math.max(0.001, 1 - L);
      newC = C * Math.pow(Math.max(0, ratio), 0.3);
    } else {
      const ratio = newL / Math.max(0.001, L);
      newC = C * Math.pow(Math.max(0, ratio), 0.8);
    }

    const newLab = oklchToOKLAB([newL, Math.max(0, newC), H]);
    return { step, hex: oklabToHex(newLab), canonical: false };
  });
}

// WCAG relative luminance
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

// Returns a foreground colour (black or white) that contrasts well
function autoForeground(hex) {
  return relativeLuminance(hex) > 0.179 ? '#000000' : '#ffffff';
}

// ─── State ───────────────────────────────────────────────────────────────────

let brands = [];
let editingBrandId = null;
let editingColorIndex = null; // null = add new

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchBrands() {
  const res = await fetch('/api/brands');
  const data = await res.json();
  brands = data.brands;
}

async function saveBrandColors(brandId, colors) {
  await fetch(`/api/brands/${brandId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colors }),
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderBadge(pass, label) {
  return `<span class="badge ${pass ? 'badge-pass' : 'badge-fail'}">${label}</span>`;
}

function renderContrastRow(label, hex1, hex2) {
  const ratio = contrastRatio(hex1, hex2);
  const { aa, aaLarge, aaa } = wcagBadges(ratio);
  return `
    <div class="contrast-row">
      <span class="contrast-swatch" style="background:${hex2};color:${hex1}">Aa</span>
      <span class="contrast-label">${label}</span>
      <span class="contrast-ratio">${ratio.toFixed(2)}:1</span>
      ${renderBadge(aa, 'AA')}
      ${renderBadge(aaLarge, 'AA Large')}
    </div>`;
}

function renderAccessibilityPanel(color, allColors) {
  const others = allColors.filter(c => c.hex !== color.hex);
  const paletteNames = allColors.map(c => c.name.toLowerCase());
  const hasNamedWhite = paletteNames.includes('white');
  const hasNamedBlack = paletteNames.includes('black');

  const pairs = [];
  if (!hasNamedWhite) {
    pairs.push({ label: `${color.name} on white`,                    hex1: color.hex,  hex2: '#ffffff' });
    pairs.push({ label: `White on ${color.name.toLowerCase()}`,      hex1: '#ffffff',  hex2: color.hex });
  }
  if (!hasNamedBlack) {
    pairs.push({ label: `${color.name} on black`,                    hex1: color.hex,  hex2: '#000000' });
    pairs.push({ label: `Black on ${color.name.toLowerCase()}`,      hex1: '#000000',  hex2: color.hex });
  }
  others.forEach(other => {
    pairs.push({ label: `${color.name} on ${other.name.toLowerCase()}`, hex1: color.hex, hex2: other.hex });
  });

  pairs.sort((a, b) => contrastRatio(b.hex1, b.hex2) - contrastRatio(a.hex1, a.hex2));
  const rows = pairs.map(p => renderContrastRow(p.label, p.hex1, p.hex2)).join('');
  return `
    <details class="panel">
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
  const swatches = scale.map(({ step, hex: sh, canonical }) => {
    const fg = autoForeground(sh);
    return `
      <button class="scale-swatch copy-btn${canonical ? ' scale-canonical' : ''}" data-hex="${sh}" style="background:${sh};color:${fg}" title="Copy ${sh}">
        <span class="scale-step">${step}</span>
        <span class="scale-hex">${sh}</span>
      </button>`;
  }).join('');
  return `
    <details class="panel">
      <summary>Tints &amp; shades</summary>
      <div class="panel-body scale-row">${swatches}</div>
    </details>`;
}

function renderColorCard(color, index, brandId, allColors) {
  const fg = autoForeground(color.hex);
  return `
    <div class="color-card" data-brand="${brandId}" data-index="${index}">
      <button class="swatch copy-btn" data-hex="${color.hex}" style="background:${color.hex}" aria-label="Copy ${color.hex}">
        <span class="copy-hint" style="color:${fg}">Copy</span>
      </button>
      <div class="color-info">
        <span class="color-name">${color.name}</span>
        <button class="copy-btn hex-label" data-hex="${color.hex}">${color.hex}</button>
        <div class="color-actions">
          <button class="btn-icon edit-color" data-brand="${brandId}" data-index="${index}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon delete-color" data-brand="${brandId}" data-index="${index}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
      ${renderAccessibilityPanel(color, allColors)}
      ${renderScalePanel(color.hex)}
    </div>`;
}

function renderBrand(brand) {
  const colorCards = brand.colors.length
    ? brand.colors.map((c, i) => renderColorCard(c, i, brand.id, brand.colors)).join('')
    : '<p class="empty-state">No colours yet</p>';

  return `
    <section class="brand-card" id="brand-${brand.id}">
      <div class="brand-header">
        <div class="brand-title">
          <span class="brand-abbr">${brand.abbr}</span>
          <h2 class="brand-name">${brand.name}</h2>
        </div>
        <button class="btn-primary add-color" data-brand="${brand.id}">+ Add colour</button>
      </div>
      <div class="colors-grid">${colorCards}</div>
    </section>`;
}

function renderAll() {
  const container = document.getElementById('brands-container');
  container.innerHTML = brands.map(renderBrand).join('');
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────

function copyToClipboard(hex, btn) {
  navigator.clipboard.writeText(hex).then(() => {
    const original = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = btn.classList.contains('hex-label') ? 'Copied!' : original;
    if (!btn.classList.contains('hex-label')) {
      const hint = btn.querySelector('.copy-hint');
      if (hint) hint.textContent = 'Copied!';
    }
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = original;
    }, 1500);
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const modal = document.getElementById('color-modal');
const form = document.getElementById('color-form');
const nameInput = document.getElementById('color-name');
const hexInput = document.getElementById('color-hex');
const pickerInput = document.getElementById('color-picker');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('modal-submit');

function openModal(brandId, colorIndex = null) {
  editingBrandId = brandId;
  editingColorIndex = colorIndex;
  form.reset();

  if (colorIndex !== null) {
    const brand = brands.find(b => b.id === brandId);
    const color = brand.colors[colorIndex];
    nameInput.value = color.name;
    hexInput.value = color.hex;
    pickerInput.value = color.hex;
    modalTitle.textContent = 'Edit colour';
    submitBtn.textContent = 'Save colour';
  } else {
    modalTitle.textContent = 'Add colour';
    submitBtn.textContent = 'Add colour';
    pickerInput.value = '#000000';
    hexInput.value = '#000000';
  }
  modal.showModal();
}

document.getElementById('modal-cancel').addEventListener('click', () => modal.close());

// Keep picker and text input in sync
pickerInput.addEventListener('input', () => {
  hexInput.value = pickerInput.value;
});

hexInput.addEventListener('input', () => {
  if (isValidHex(hexInput.value)) {
    pickerInput.value = hexInput.value;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  let hex = hexInput.value.trim();
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (!isValidHex(hex) || !name) return;

  const brand = brands.find(b => b.id === editingBrandId);
  const colors = [...brand.colors];

  if (editingColorIndex !== null) {
    colors[editingColorIndex] = { name, hex };
  } else {
    colors.push({ name, hex });
  }

  await saveBrandColors(editingBrandId, colors);
  brand.colors = colors;
  modal.close();
  renderAll();
});

// ─── Event delegation ─────────────────────────────────────────────────────────

document.getElementById('brands-container').addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('.copy-btn');
  if (copyBtn) {
    copyToClipboard(copyBtn.dataset.hex, copyBtn);
    return;
  }

  const addBtn = e.target.closest('.add-color');
  if (addBtn) {
    openModal(addBtn.dataset.brand);
    return;
  }

  const editBtn = e.target.closest('.edit-color');
  if (editBtn) {
    openModal(editBtn.dataset.brand, parseInt(editBtn.dataset.index, 10));
    return;
  }

  const deleteBtn = e.target.closest('.delete-color');
  if (deleteBtn) {
    const { brand: brandId, index } = deleteBtn.dataset;
    const brand = brands.find(b => b.id === brandId);
    const colors = brand.colors.filter((_, i) => i !== parseInt(index, 10));
    await saveBrandColors(brandId, colors);
    brand.colors = colors;
    renderAll();
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

fetchBrands().then(renderAll);
