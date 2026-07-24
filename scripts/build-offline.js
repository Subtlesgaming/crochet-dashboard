/**
 * Builds a self-contained, double-click-able offline copy of the dashboard.
 *
 * The live/dev app uses ES modules + fetch() for data.json, which Chrome/Edge
 * block under file:// (no server). This script produces dist-offline/ with:
 *   - a single bundled classic <script> (no import/export left in it)
 *   - the JSON data inlined directly into that bundle (no fetch)
 * so the whole thing works by just opening dist-offline/index.html.
 *
 * Usage: node scripts/build-offline.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist-offline');
const TMP = path.join(DIST, '_tmp');

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('Cleaning dist-offline/...');
rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

console.log('Copying css/, assets/, and icons/...');
copyDir(path.join(ROOT, 'css'), path.join(DIST, 'css'));
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(ROOT, 'icons'), path.join(DIST, 'icons'));
fs.copyFileSync(path.join(ROOT, 'manifest.json'), path.join(DIST, 'manifest.json'));
fs.copyFileSync(path.join(ROOT, 'sw.js'), path.join(DIST, 'sw.js'));

console.log('Copying js/ source into a temp build dir...');
copyDir(path.join(ROOT, 'js'), TMP);

console.log('Inlining dashboard_data.json into a data-source shim...');
const rawData = fs.readFileSync(path.join(ROOT, 'data', 'dashboard_data.json'), 'utf8');
const shim = `const DATA = ${rawData};\nexport async function loadDashboardData() { return DATA; }\n`;
fs.writeFileSync(path.join(TMP, 'dataSource.js'), shim);

console.log('Bundling with esbuild...');
// npx on Windows resolves to npx.cmd, which requires shell:true to spawn; the
// args here are all internal, fixed paths (not user input), so this is safe.
execFileSync('npx', ['--yes', 'esbuild', path.join(TMP, 'app.js'), '--bundle', '--format=iife', `--outfile=${path.join(DIST, 'bundle.js')}`], {
  stdio: 'inherit',
  shell: true,
});

console.log('Writing offline index.html...');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(
  /<script type="module" src="js\/app\.js"><\/script>/,
  '<script src="bundle.js"></script>'
);
fs.writeFileSync(path.join(DIST, 'index.html'), html);

rmrf(TMP);
console.log('\nDone. dist-offline/index.html can be opened directly (double-click), no server needed.');
