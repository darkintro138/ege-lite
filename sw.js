const SCOPE=new URL('./',self.location.href);
const abs=p=>new URL(p,SCOPE).href;
const SHELL_CACHE='ege-shell-v4',AUDIO_CACHE='ege-audio-v4',AUDIO_MAX=80;
const SHELL=['index.html','site.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'].map(abs);
const AUDIO_PREFIX=new URL('audio/',SCOPE).pathname;
const OFFLINE_HTML='<!doctype html><meta charset="utf-8"><title>ЕГЭ Lite</title><body style="background:#04081a;color:#eaf1ff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px"><div><div style="font-size:40px">🎧</div><h2>ЕГЭ Lite</h2><p style="color:rgba(220,232,255,.7);line-height:1.6">Нет связи с сервером.<br>Открой приложение один раз по Wi‑Fi —<br>и дальше оно будет работать без интернета.</p></div></body>';

self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(SHELL_CACHE);await Promise.allSettled(SHELL.map(u=>c.add(u)));await self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==SHELL_CACHE&&x!==AUDIO_CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
async function trimAudio(c){const k=await c.keys();if(k.length>AUDIO_MAX){const n=k.length-AUDIO_MAX;for(let i=0;i<n;i++)await c.delete(k[i]);}}

self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url); if(u.origin!==location.origin)return;

  if(r.mode==='navigate'){
    e.respondWith((async()=>{
      const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),2500);
      try{
        const res=await fetch(r,{signal:ctrl.signal}); clearTimeout(t);
        if(res&&res.status===200){const c=await caches.open(SHELL_CACHE);c.put(abs('index.html'),res.clone()).catch(()=>{});}
        return res;
      }catch(_){
        clearTimeout(t);
        const c=await caches.open(SHELL_CACHE);
        return (await c.match(abs('index.html')))||new Response(OFFLINE_HTML,{headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  if(u.pathname.startsWith(AUDIO_PREFIX)){
    e.respondWith((async()=>{
      const c=await caches.open(AUDIO_CACHE);
      const hit=await c.match(r); if(hit)return hit;
      const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),12000);
      try{
        const res=await fetch(r,{signal:ctrl.signal}); clearTimeout(t);
        if(res&&res.status===200){c.put(r,res.clone()).catch(()=>{});trimAudio(c);}
        return res;
      }catch(_){ clearTimeout(t); return Response.error(); }
    })());
    return;
  }

  e.respondWith((async()=>{
    const cached=await caches.match(r);
    const net=fetch(r).then(res=>{if(res&&res.status===200){caches.open(SHELL_CACHE).then(c=>c.put(r,res.clone()).catch(()=>{}));}return res;}).catch(()=>cached);
    return cached||net;
  })());
});