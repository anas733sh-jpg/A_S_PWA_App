// public/service-worker.js

const CACHE_NAME = 'as-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/admin.html',
  '/settings.html',
  '/games.html',
  '/style.css',
  '/games.css',
  '/script.js',
  // ملفات الأيقونات الأساسية
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
  // يمكنك إضافة المزيد من ملفات JS و CSS هنا
];

// تثبيت ملف الخدمة (Service Worker) و تخزين الملفات في الذاكرة المؤقتة (Cache)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// استراتيجية "الذاكرة المؤقتة أولاً" - يتم محاولة جلب الملف من الذاكرة المؤقتة، ثم من الشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // الرد من الذاكرة المؤقتة إذا وجد
        if (response) {
          return response;
        }
        // أو محاولة جلب الملف من الشبكة
        return fetch(event.request);
      })
  );
});

// تحديث ملف الخدمة و حذف الذاكرة المؤقتة القديمة
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
