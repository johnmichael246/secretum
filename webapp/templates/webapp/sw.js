/* SW {{ version }} */

const version = '{{ version }}';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(version).then(function (cache) {
            return cache.addAll([
                '/',
                '/manifest.json',
                '/static/webapp/css/app.css',
                '/static/webapp/css/style.css',
                '/static/webapp/css/font-awesome.min.css',
                '/static/webapp/fonts/fontawesome-webfont.woff2?v=4.7.0',
                '/static/webapp/fonts/Orbitron-Regular.ttf',
                '/static/webapp/js/react.js',
                '/static/webapp/js/react-dom.js',
                '/static/webapp/js/bundle.js',
                'https://cdn.ravenjs.com/3.26.4/raven.min.js'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== version) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
