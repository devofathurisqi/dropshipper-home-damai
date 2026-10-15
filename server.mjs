import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const config = JSON.parse(await readFile(path.join(root, 'site.json'), 'utf8'));
const port = Number(process.env.PORT || config.port);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ttf':'font/ttf' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const filename = (await stat(target)).isDirectory() ? path.join(target,'index.html') : target;
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type':types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' });
    if (req.method === 'HEAD') res.end(); else res.end(body);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Halaman tidak ditemukan.'); }
}).listen(port, '127.0.0.1', () => console.log(`${config.brand} — http://127.0.0.1:${port}`));

