const STATIC_CACHE = "royal-celebration-static-v4";
const RUNTIME_CACHE = "royal-celebration-runtime-v4";
const API_CACHE = "royal-celebration-api-v4";

const APP_SHELL = [
  "/offline.html",
  "/styles.css",
  "/enquiry.css",
  "/app.js",
  "/enquiry.js",
  "/pwa.js",
  "/manifest.webmanifest",
  "/assets/pwa-icon.svg",
  "/assets/SrSLogicsLogo.png",
  "/assets/media/stage.jpeg",
  "/assets/media/pic_lawn.jpeg",
  "/assets/media/room.jpeg",
  "/assets/media/room1.jpeg",
  "/assets/media/video_frames/entrance-frame.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isHtmlNavigation(request) {
  return request.mode === "navigate" || request.destination === "document";
}

function networkFirst(request, cacheName, fallbackUrl) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (fallbackUrl) return caches.match(fallbackUrl);
      throw new Error("Network unavailable");
    });
}

function networkOnlyWithOffline(request, fallbackUrl) {
  return fetch(request).catch(async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) return caches.match(fallbackUrl);
    throw new Error("Network unavailable");
  });
}

function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

function shouldAlwaysRefresh(url) {
  return [
    "/",
    "/console",
    "/index.html",
    "/home",
    "/celebrations",
    "/stays",
    "/gallery",
    "/enquiry",
    "/styles.css",
    "/app.js",
    "/pwa.js",
    "/manifest.webmanifest",
  ].includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isHtmlNavigation(request)) {
    event.respondWith(networkOnlyWithOffline(request, "/offline.html"));
    return;
  }

  if (shouldAlwaysRefresh(url)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "worker" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});
