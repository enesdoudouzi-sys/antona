var CACHE='lernsterne-v22';
var ASSETS=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){if(k!==CACHE)return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  try{if(new URL(req.url).origin!==self.location.origin)return;}catch(err){return;} // Fremd-Hosts (z. B. Online-Stimme, Fonts) nie abfangen
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(resp){var c=resp.clone();caches.open(CACHE).then(function(ch){ch.put('index.html',c);});return resp;})
      .catch(function(){return caches.match('index.html').then(function(r){return r||caches.match('./');});}));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){return r||fetch(req).then(function(resp){var c=resp.clone();caches.open(CACHE).then(function(ch){try{ch.put(req,c);}catch(err){}});return resp;});}));
});
