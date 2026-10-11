const SHELL_CACHE='ege-shell-v2',AUDIO_CACHE='ege-audio-v2',AUDIO_MAX=80;
const SHELL_URLS=['/','/index.html','/site.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png'];

self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(SHELL_CACHE);await Promise.allSettled(SHELL_URLS.map(u=>c.add(u)));await self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==SHELL_CACHE&&x!==AUDIO_CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});

async function trimAudio(c){const k=await c.keys();if(k.length>AUDIO_MAX){const n=k.length-AUDIO_MAX;for(let i=0;i<n;i++)await c.delete(k[i]);}}

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return;

  if(r.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const res=await fetch(r);
        if(res.status===200){const c=await caches.open(SHELL_CACHE);c.put('/index.html',res.clone()).catch(()=>{});}
        return res;
      }catch(_){
        const c=await caches.open(SHELL_CACHE);
        return (await c.match('/index.html'))||(await c.match('/'))||Response.error();
      }
    })());
    return;
  }

  if(u.pathname.startsWith('/audio/')){
    e.respondWith((async()=>{
      const c=await caches.open(AUDIO_CACHE);
      const hit=await c.match(r);
      if(hit)return hit;
      const res=await fetch(r);
      if(res.status===200){c.put(r,res.clone()).then(()=>trimAudio(c)).catch(()=>{});}
      return res;
    })());
    return;
  }

  e.respondWith((async()=>{
    const cached=await caches.match(r);
    const net=fetch(r).then(res=>{if(res.status===200){caches.open(SHELL_CACHE).then(c=>c.put(r,res.clone()).catch(()=>{}));}return res;}).catch(()=>cached);
    return cached||net;
  })());
});