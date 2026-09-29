// Scan backend python packages and emit name: path inventories.
// Usage: node scripts/gen_python_inventory.cjs (run from repo root)
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['backend/app', 'backend/packages'];
const OUT_DIR = 'cmos';

// ---- helpers -------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__pycache__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.py')) out.push(full);
  }
  return out;
}

const toPosix = (p) => p.split(path.sep).join('/');

// Dotted module name of a .py file relative to its package root.
// backend/app/x/y.py            -> app.x.y
// backend/app/x/__init__.py    -> app.x
// packages/harness/deerflow/... -> deerflow...
function dottedName(rel) {
  const parts = rel.split('/');
  if (rel.startsWith('backend/app/')) {
    const rest = parts.slice(2);
  } else if (rel.startsWith('backend/packages/')) {
    const rest = parts.slice(4);
  }
  // determine package prefix by location
  let prefix;
  let rest;
  if (rel.startsWith('backend/app/')) {
    prefix = 'app';
    rest = parts.slice(2);
  } else if (rel.startsWith('backend/packages/harness/')) {
    prefix = 'deerflow';
    rest = parts.slice(4);
  } else if (rel.startsWith('backend/packages/extension-api/')) {
    prefix = 'deerflow_extension_api';
    rest = parts.slice(4);
  } else if (rel.startsWith('backend/packages/')) {
    prefix = parts[2];
    rest = parts.slice(3);
  }
  const last = rest[rest.length - 1];
  if (last === '__init__.py') rest = rest.slice(0, -1);
  else rest[rest.length - 1] = last.replace(/\.py$/, '');
  return [prefix, ...rest].join('.');
}

// Minimal python class-name extractor (top-level + nested class statements).
// Line-oriented scan that understands indentation; skips comments/strings crudely.
function extractClasses(source) {
  const names = [];
  const lines = source.split(/\r?\n/);
  let inTriple = null; // track ''' / """ blocks
  for (const raw of lines) {
    const line = raw;
    if (inTriple) {
      if (line.includes(inTriple)) inTriple = null;
      continue;
    }
    const stripped = line.trim();
    if (stripped.startsWith('#')) continue;
    // detect opening triple quote
    const t3 = /("""|''')/.exec(stripped);
    if (t3 && stripped.indexOf(t3[1], t3.index + 3) === -1) {
      inTriple = t3[1];
      continue;
    }
    const m = /^class\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(stripped);
    if (m) names.push(m[1]);
  }
  return names;
}

// ---- scan ----------------------------------------------------------------

const pyFiles = [];
for (const d of SCAN_DIRS) walk(path.join(ROOT, d), pyFiles);

const packages = []; // {name, path}
const modules = [];  // {name, path}
const classes = [];  // {name, path, module}

for (const abs of pyFiles) {
  const rel = toPosix(path.relative(ROOT, abs));
  const name = dottedName(rel);
  const source = fs.readFileSync(abs, 'utf8');

  // package = __init__.py
  if (path.basename(abs) === '__init__.py') {
    packages.push({ name, path: rel });
  } else {
    modules.push({ name, path: rel });
  }
  // every .py is also a module
  modules.push({ name, path: rel, dup: path.basename(abs) === '__init__.py' });

  for (const cls of extractClasses(source)) {
    classes.push({ name: cls, path: rel, module: name });
  }
}

// dedupe modules (init files were pushed twice)
const seenMod = new Set();
const modList = [];
for (const m of modules) {
  const key = m.name;
  if (!seenMod.has(key)) { seenMod.add(key); modList.push(m); }
}

const cmp = (a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path);

packages.sort(cmp);
modList.sort(cmp);
classes.sort((a, b) => a.name.localeCompare(b.name) || a.module.localeCompare(b.module));

// ---- write ---------------------------------------------------------------

function writeList(file, rows, fmt) {
  const lines = rows.map(fmt);
  fs.writeFileSync(path.join(ROOT, OUT_DIR, file), lines.join('\n') + '\n', 'utf8');
  return lines.length;
}

const nPkg = writeList('package清单.txt', packages, (p) => `${p.name}: ${p.path}`);
const nMod = writeList('module清单.txt', modList, (m) => `${m.name}: ${m.path}`);
const nCls = writeList('class清单.txt', classes, (c) => `${c.name}: ${c.path}`);

console.log(`packages: ${nPkg}`);
console.log(`modules: ${nMod}`);
console.log(`classes: ${nCls}`);
