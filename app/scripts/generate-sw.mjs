import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const assetsDir = path.join(distDir, "assets");
const dataDir = path.join(distDir, "data");
const viteConfigPath = path.join(projectRoot, "vite.config.ts");

async function readBasePath() {
  const contents = await readFile(viteConfigPath, "utf8");
  const match = contents.match(/base:\s*["'`]([^"'`]+)["'`]/);
  return match ? match[1] : "/";
}

async function listFiles(dirPath) {
  try {
    const entries = await readdir(dirPath);
    return entries.sort();
  } catch {
    return [];
  }
}

async function ensureDirExists(dirPath) {
  const info = await stat(dirPath);
  if (!info.isDirectory()) {
    throw new Error(`${dirPath} is not a directory`);
  }
}

function buildServiceWorkerSource(basePath, assetFiles, dataFiles) {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const precacheUrls = [
    normalizedBase,
    `${normalizedBase}index.html`,
    ...assetFiles.map((fileName) => `${normalizedBase}assets/${fileName}`),
    ...dataFiles.map((fileName) => `${normalizedBase}data/${fileName}`),
  ];

  return `const CACHE_PREFIX = "swedish-vocab-cache";
const CACHE_VERSION = "${Date.now()}";
const CACHE_NAME = \`\${CACHE_PREFIX}-\${CACHE_VERSION}\`;
const BASE_PATH = "${normalizedBase}";
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) {
    return;
  }

  if (request.mode === "navigate" || url.pathname === BASE_PATH || url.pathname === \`\${BASE_PATH}index.html\`) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith(\`\${BASE_PATH}data/\`)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith(\`\${BASE_PATH}assets/\`)) {
    event.respondWith(cacheFirst(request));
  }
});
`;
}

await ensureDirExists(distDir);
const [basePath, assetFiles, dataFiles] = await Promise.all([
  readBasePath(),
  listFiles(assetsDir),
  listFiles(dataDir),
]);

const swSource = buildServiceWorkerSource(basePath, assetFiles, dataFiles);
await writeFile(path.join(distDir, "sw.js"), swSource, "utf8");
