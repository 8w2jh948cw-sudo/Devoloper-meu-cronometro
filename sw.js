'use strict';
const CACHE='cronometro-0.8.2';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg','./initial-data.json',
  './cronometro-v080-01.css','./cronometro-v080-02.css','./cronometro-v080-03.css',
  './cronometro-v080-01.js','./cronometro-v080-02.js','./cronometro-v080-03.js',
  './cronometro-v080-04.js','./cronometro-v080-05.js','./cronometro-v080-06.js',
  './cronometro-v080-07.js','./cronometro-v080-08.js','./cronometro-v080-09.js',
  './cronometro-v081-overrides.css','./cronometro-v081-version.js',
  './cronometro-v081-overrides-1.js','./cronometro-v081-overrides-2.js','./cronometro-v081-overrides-3.js',
  './cronometro-v082-overrides.css','./cronometro-v082-01.js','./cronometro-v082-02.js',
  './cronometro-v082-03.js','./cronometro-v082-04.js','./cronometro-v082-05.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cronometro-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));});
