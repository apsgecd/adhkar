const CACHE_NAME = "adhkar-v6";
const ASSETS = [
    "./",
    "index.html",
    "manifest.json",
    "favicon.ico",
    "haddad.mp3",
    "names-of-Allah.mp3",
    "yaseen.mp3",
    "kahf.mp3",
    "click.mp3",
    "longclick.mp3",
    "yaseen.txt",
    "kahf.txt",
    "99names.txt",
    "haddad.txt",
    "salam-rasool.txt",
    "pdf/Asmaul-Badar.pdf",
    "pdf/Dua.pdf",
    "pdf/Khatham-Quran-Dua.pdf",
    "pdf/Manqoos-Mouleed.pdf",
    "pdf/Mayyith-Prayer.pdf"
];

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Add each file separately so one failure doesn't stop the rest
        await Promise.all(ASSETS.map(async url => {
            try {
                await cache.add(url);
            } catch (err) {
                console.warn("Could not cache", url, err);
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        // Remove old caches
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", event => {
    const req = event.request;
    if (req.method !== "GET") return;

    // Only handle files from this site
    if (new URL(req.url).origin !== self.location.origin) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;

        try {
            const response = await fetch(req);
            if (response.ok) cache.put(req, response.clone());
            return response;
        } catch (err) {
            // Offline page fallback
            if (req.mode === "navigate") {
                const page = await cache.match("index.html");
                if (page) return page;
            }
            return new Response("Offline", { status: 503 });
        }
    })());
});
