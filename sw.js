var CACHE_NAME = "home-pwa-v1";
var APP_SHELL = [
  "./",
  "./index.html",
  "./home.html",
  "./Home.png",
  "./Home-192.png",
  "./manifest.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          return key.indexOf("home-pwa-") === 0 && key !== CACHE_NAME ? caches.delete(key) : false;
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (!response.ok) return response;
          var responseCopy = response.clone();
          return caches.open(CACHE_NAME)
            .then(function (cache) { return cache.put(request, responseCopy); })
            .then(function () { return response; });
        })
        .catch(function () {
          return caches.match(request).then(function (cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (!response.ok) return response;
        var responseCopy = response.clone();
        return caches.open(CACHE_NAME)
          .then(function (cache) { return cache.put(request, responseCopy); })
          .then(function () { return response; });
      });
    })
  );
});
