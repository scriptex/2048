const CACHE_NAME = '2048-cache';
const urlsToCache = [
	'/'
];

self.addEventListener('install', event => {
	self.skipWaiting();

	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
	);
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(response => {
			if (response) {
				return response;
			}

			const fetchRequest = event.request.clone();

			return fetch(fetchRequest).then(response => {
				if (
					!response ||
					response.status !== 200 ||
					response.type !== 'basic'
				) {
					return response;
				}

				const responseToCache = response.clone();

				event.waitUntil(
					caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, responseToCache);
					})
				);

				return response;
			});
		})
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(cacheNames =>
				Promise.all(
					cacheNames
						.filter(cacheName => cacheName !== CACHE_NAME)
						.map(cacheName => caches.delete(cacheName))
				)
			)
	);
});
