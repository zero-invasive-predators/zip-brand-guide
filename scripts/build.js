const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');

const basePath = (process.env.BASE_PATH || '/zip-brand-asset-manager').replace(/\/$/, '');

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });

copyDir(PUBLIC, DIST);

const distData = path.join(DIST, 'data');
fs.mkdirSync(distData, { recursive: true });
fs.copyFileSync(path.join(DATA, 'brands.json'), path.join(distData, 'brands.json'));

const config = `window.APP_CONFIG = {
  static: true,
  basePath: ${JSON.stringify(basePath)},
};
`;
fs.writeFileSync(path.join(DIST, 'config.js'), config, 'utf8');

console.log(`Built static site → dist/ (basePath: ${basePath || '/'})`);
