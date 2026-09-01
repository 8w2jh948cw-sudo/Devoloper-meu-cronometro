'use strict';
const CACHE='cronometro-0.8.9-beta.3';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg','./app-icon-192.png','./app-icon-512.png','./apple-touch-icon.png','./initial-data.json',
  './cronometro-v080-01.css','./cronometro-v080-02.css','./cronometro-v080-03.css',
  './cronometro-v080-01.js','./cronometro-v080-02.js','./cronometro-v080-03.js',
  './cronometro-v080-04.js','./cronometro-v080-05.js','./cronometro-v080-06.js',
  './cronometro-v080-07.js','./cronometro-v080-08.js','./cronometro-v080-09.js',
  './cronometro-v081-overrides.css','./cronometro-v081-version.js',
  './cronometro-v081-overrides-1.js','./cronometro-v081-overrides-2.js','./cronometro-v081-overrides-3.js',
  './cronometro-v082-overrides.css','./cronometro-v082-01.js','./cronometro-v082-02.js',
  './cronometro-v082-03.js','./cronometro-v082-04.js','./cronometro-v082-05.js',
  './cronometro-v083-fixes.css','./cronometro-v083-version.js',
  './cronometro-v084-bottom-bar-lab.css','./cronometro-v084-bottom-bar-lab.js',
  './cronometro-v085-sound-settings.js','./cronometro-v086-stats-icon.js',
  './cronometro-v087-data-backup.css','./cronometro-v087-data-backup.js',
  './cronometro-v088-ultra-visual.css','./cronometro-v088-ultra-visual.js'
];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cronometro-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]))});

function isSpecialNavigation(url){
  const p=url.pathname;
  return /\/(?:menu\.html|menu\/|diagnostico\/|launch\.html|recover\.html|safe\.html)(?:$|\/)/.test(p);
}

async function networkThenCache(request,{fallbackIndex=false}={}){
  try{
    const response=await fetch(request);
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}
    return response;
  }catch(_){
    const hit=await caches.match(request);
    if(hit)return hit;
    if(fallbackIndex)return caches.match('./index.html');
    throw _;
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    /* Páginas reais nunca podem virar index.html. */
    if(isSpecialNavigation(url)){
      event.respondWith(networkThenCache(event.request,{fallbackIndex:false}));
      return;
    }
    event.respondWith(networkThenCache(event.request,{fallbackIndex:true}));
    return;
  }

  event.respondWith(networkThenCache(event.request,{fallbackIndex:false}).catch(()=>caches.match(event.request)));
});
