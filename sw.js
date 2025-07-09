// Service Worker for Ultimate 4K iPhone Slot Machine PWA
const CACHE_NAME = 'slot-machine-4k-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './js/display.js',
    './js/assets.js',
    './js/effects.js',
    './js/game.js',
    // Assets will be cached dynamically
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});