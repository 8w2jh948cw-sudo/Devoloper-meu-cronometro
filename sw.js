'use strict';
const CACHE="cronometro-official-0.8.8-public-2";
const BETA_MODE=false;
const ASSETS=[
  "./",
  "./AI_RULES_MIN.txt",
  "./THIRD_PARTY_NOTICES.txt",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./app.js",
  "./apple-touch-icon.png",
  "./boot-resilient.js",
  "./cronometro-v080-01.css",
  "./cronometro-v080-01.js",
  "./cronometro-v080-02.css",
  "./cronometro-v080-02.js",
  "./cronometro-v080-03.css",
  "./cronometro-v080-03.js",
  "./cronometro-v080-04.js",
  "./cronometro-v080-05.js",
  "./cronometro-v080-06.js",
  "./cronometro-v080-07.js",
  "./cronometro-v080-08.js",
  "./cronometro-v080-09.js",
  "./cronometro-v081-overrides-1.js",
  "./cronometro-v081-overrides-2.js",
  "./cronometro-v081-overrides-3.js",
  "./cronometro-v081-overrides.css",
  "./cronometro-v081-version.js",
  "./cronometro-v082-01.js",
  "./cronometro-v082-02.js",
  "./cronometro-v082-03.js",
  "./cronometro-v082-04.js",
  "./cronometro-v082-05.js",
  "./cronometro-v082-overrides.css",
  "./cronometro-v083-fixes.css",
  "./cronometro-v083-version.js",
  "./cronometro-v084-bottom-bar-lab.css",
  "./cronometro-v084-bottom-bar-lab.js",
  "./cronometro-v085-sound-settings.js",
  "./cronometro-v086-stats-icon.js",
  "./cronometro-v087-data-backup.css",
  "./cronometro-v087-data-backup.js",
  "./cronometro-v088-ultra-visual.css",
  "./cronometro-v088-ultra-visual.js",
  "./design-config.js",
  "./environment.json",
  "./icon.svg",
  "./index.html",
  "./initial-data.json",
  "./jszip.min.js",
  "./launch.html",
  "./manifest.webmanifest",
  "./menu.html",
  "./recover.html",
  "./safe.html",
  "./styles-v080-01.css",
  "./styles.css",
  "./version.json",
  "./menu/index.html",
  "./diagnostico/index.html"
];
const SCOPE_PATH=new URL(self.registration.scope).pathname;

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>{
      if(BETA_MODE)return key.startsWith('cronometro-beta-')&&key!==CACHE;
      return key.startsWith('cronometro-')&&!key.startsWith('cronometro-beta-')&&key!==CACHE;
    }).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

function relPath(url){
  return url.pathname.startsWith(SCOPE_PATH)?url.pathname.slice(SCOPE_PATH.length):url.pathname;
}
function isSpecialNavigation(url){
  const rel=relPath(url);
  if(!BETA_MODE&&rel.startsWith('beta/'))return true;
  return rel==='menu.html'||rel.startsWith('menu/')||rel.startsWith('diagnostico/')||rel==='launch.html'||rel==='recover.html'||rel==='safe.html';
}
async function networkFirst(request, fallbackIndex=false){
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
    }
    return response;
  }catch(error){
    const hit=await caches.match(request,{ignoreSearch:true});
    if(hit)return hit;
    if(fallbackIndex){
      const fallback=await caches.match('./index.html');
      if(fallback)return fallback;
    }
    throw error;
  }
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const rel=relPath(url);

  /* O SW Oficial nunca interfere em /beta/. */
  if(!BETA_MODE&&rel.startsWith('beta/')){
    event.respondWith(fetch(event.request));
    return;
  }

  if(event.request.mode==='navigate'){
    /* Páginas reais nunca recebem index.html como fallback. */
    if(isSpecialNavigation(url)){
      event.respondWith(networkFirst(event.request,false));
      return;
    }
    event.respondWith(networkFirst(event.request,true));
    return;
  }

  event.respondWith(networkFirst(event.request,false).catch(()=>caches.match(event.request,{ignoreSearch:true})));
});
