// Minimal dependency-free static file server for the exported `out/` directory,
// used as the Playwright webServer. No third-party dependency, no network fetch.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = "out";
const PORT = Number(process.env.PORT ?? 3000);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function resolveFile(pathname) {
  const p = decodeURIComponent(pathname);
  const candidates = p.endsWith("/")
    ? [join(ROOT, p, "index.html")]
    : [join(ROOT, p), `${join(ROOT, p)}.html`, join(ROOT, p, "index.html")];
  for (const c of candidates) if (await isFile(c)) return c;
  return null;
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const file = await resolveFile(url.pathname);
    if (file) {
      const body = await readFile(file);
      res.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      });
      res.end(body);
      return;
    }
    const notFound = join(ROOT, "404.html");
    if (await isFile(notFound)) {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(await readFile(notFound));
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
}).listen(PORT, () => {
  console.log(`serving ${ROOT} on http://localhost:${PORT}`);
});
