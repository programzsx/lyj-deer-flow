// Extract FastAPI route inventory: METHOD + full path + file:line -> cmos/api/接口清单.txt
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN = ['backend/app/gateway/routers', 'backend/app/gateway/app.py'];

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.py')) files.push(full);
  }
})(SCAN[0]);
files.push(SCAN[1]);

// router prefix per file: find `router = APIRouter(prefix="...")`
const prefixRe = /APIRouter\(([^)]*)\)/s;

function filePrefix(src) {
  const m = src.match(/(\w+)\s*=\s*APIRouter\(/);
  if (!m) return { name: null, prefix: '' };
  const args = src.slice(m.index, m.index + 600).match(/prefix\s*=\s*["']([^"']*)["']/);
  return { name: m[1], prefix: args ? args[1] : '' };
}

const routes = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const { name, prefix } = filePrefix(src);
  const rel = f.split(path.sep).join('/').replace(ROOT + '/', '');
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = new RegExp(`@(\\w+)\\.(get|post|put|patch|delete|websocket)\\s*\\(\\s*["']([^"']+)["']`).exec(lines[i]);
    if (!m) continue;
    const routerVar = m[1];
    // app.py routes use @app.get directly with full path
    let full;
    if (routerVar === 'app') full = m[3];
    else if (routerVar === name) full = prefix + m[3];
    else {
      // decorator on some other router var (rare) - find its prefix
      const other = new RegExp(`${routerVar}\\s*=\\s*APIRouter\\(`).exec(src);
      let p = '';
      if (other) {
        const pm = src.slice(other.index, other.index + 600).match(/prefix\s*=\s*["']([^"']*)["']/);
        if (pm) p = pm[1];
      }
      full = p + m[3];
    }
    routes.push({ method: m[2].toUpperCase(), path: full, file: rel, line: i + 1 });
  }
}

routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

const out = routes.map(r => `${r.method} ${r.path}: ${r.file}:${r.line}`).join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'cmos/api/接口清单.txt'), out, 'utf8');
console.log(`routes: ${routes.length}`);
