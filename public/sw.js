const CACHE_NAME = "luqmati-shell-v4";

// Only hashed build assets and icons are precached. HTML navigations are never
// cached: they can contain a signed-in user's data and would be replayed to the
// next person using the same device.
const APP_SHELL = [
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // A single asset failing during install must not make the whole PWA
      // unusable. Successful assets are still retained.
      await Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset)));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function offlineAnalysisResponse() {
  return new Response(
    JSON.stringify({
      error: "Internet connection is required to analyze a new meal.",
      offline: true,
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isSameOrigin(request)) return;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Offline analysis gets a clear, retryable response instead of a spinner.
  if (url.pathname === "/api/analyze-food") {
    event.respondWith(fetch(request).catch(() => offlineAnalysisResponse()));
    return;
  }

  // Private APIs and page navigations always go to the network.
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") return;

  // Immutable Next assets, fonts and icons are cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
