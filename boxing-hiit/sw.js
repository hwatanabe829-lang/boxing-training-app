const CACHE='boxer-hiit-v1';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './parts/01.txt','./parts/02.txt','./parts/03.txt','./parts/04.txt',
  './parts/05.txt','./parts/06.txt','./parts/07.txt','./parts/08.txt'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return res;
    }))
  );
});