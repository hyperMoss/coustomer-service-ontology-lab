import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml' };
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const full = resolve(root, '.' + path);
    if (full !== root && !full.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    let f = full;
    if ((await stat(f)).isDirectory()) f = resolve(f, 'index.html');
    const data = await readFile(f);
    res.writeHead(200, { 'Content-Type': mime[extname(f)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Teaching site: http://127.0.0.1:${port}/`));
