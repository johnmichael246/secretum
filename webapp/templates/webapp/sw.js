self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('v1').then(function (cache) {
            return cache.addAll([
                '/',
                '/static/webapp/css/app.css',
                '/static/webapp/css/style.css',
                '/static/webapp/css/font-awesome.min.css',
                '/static/webapp/fonts/fontawesome-webfont.woff2?v=4.7.0',
                '/static/webapp/fonts/Orbitron-Regular.ttf',
                '/static/webapp/js/react.js',
                '/static/webapp/js/react-dom.js',
                '/static/webapp/js/bundle.js'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
