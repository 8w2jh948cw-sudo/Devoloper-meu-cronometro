/* Cronômetro — boot resiliente para iPhone/PWA
   Esta camada não acessa nem altera IndexedDB. Ela só evita tela branca e
   oferece saída para Diagnóstico/Modo Seguro se o motor principal falhar. */
(() => {
  'use strict';
  const startedAt=performance.now();
  const app=document.getElementById('app');
  if(!app)return;
  const beta=location.pathname.includes('/beta/');
  const release=String(window.APP_RELEASE||document.documentElement.dataset.release||'');
  const errors=[];
  let finished=false;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const diagnosticHref=beta?'../diagnostico/':'./diagnostico/';
  const safeHref='./safe.html';

  app.innerHTML=`<main id="cronometroBoot" style="min-height:100dvh;display:grid;place-items:center;padding:24px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;background:#F2F2F6;color:#111114">
    <section style="width:min(100%,360px);background:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.9);border-radius:24px;padding:20px;box-shadow:0 14px 36px rgba(0,0,0,.07);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px"><strong style="font-size:18px">Cronômetro${beta?' Beta':''}</strong><span style="font-size:10px;font-weight:800;letter-spacing:.05em;color:${beta?'#c56a00':'#007aff'}">${beta?'BETA':'OFICIAL'}${release?` · ${esc(release)}`:''}</span></div>
      <div id="cronometroBootStage" style="font-size:14px;font-weight:650;margin-bottom:5px">Tela inicial</div>
      <div id="cronometroBootDetail" style="font-size:12px;line-height:1.4;color:#6e6e73">Preparando a interface…</div>
      <div style="height:5px;background:#e1e1e6;border-radius:999px;overflow:hidden;margin-top:15px"><div id="cronometroBootBar" style="height:100%;width:12%;background:#007aff;border-radius:inherit;transition:width .25s ease"></div></div>
    </section>
  </main>`;

  const stage=document.getElementById('cronometroBootStage');
  const detail=document.getElementById('cronometroBootDetail');
  const bar=document.getElementById('cronometroBootBar');
  const steps=[
    [350,'Ambiente web','Verificando recursos do navegador…',30],
    [950,'Dados locais','Abrindo o armazenamento local…',52],
    [2200,'Motor do app','Carregando cronômetros e registros…',72],
    [4200,'Correções finais','Aplicando a interface…',88]
  ];

  function appLooksFunctional(){
    const root=document.getElementById('app');
    if(!root||document.getElementById('cronometroBoot'))return false;
    const tabbar=document.querySelector('.tabbar');
    const useful=document.querySelector('.timer-content,.settings-content,.history-content,.stats-content,.content');
    const hasCore=typeof window.render==='function'||typeof window.openDB==='function'||typeof window.put==='function';
    return Boolean(tabbar&&useful&&hasCore);
  }

  function finish(){
    if(finished)return;finished=true;
    clearInterval(pollTimer);clearTimeout(fallbackTimer);
    window.__CRONOMETRO_BOOT_OK__=true;
    window.__CRONOMETRO_BOOT_MS__=Math.round(performance.now()-startedAt);
  }

  function showFallback(){
    if(finished||!document.getElementById('cronometroBoot'))return;
    const elapsed=Math.round(performance.now()-startedAt);
    const errText=errors.length?`<pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;line-height:1.4;background:#f1f1f5;padding:10px;border-radius:12px;margin:12px 0 0">${esc(errors.slice(-3).join('\n'))}</pre>`:'';
    app.innerHTML=`<main style="min-height:100dvh;display:grid;place-items:center;padding:24px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;background:#F2F2F6;color:#111114"><section style="width:min(100%,380px);background:#fff;border-radius:24px;padding:20px;box-shadow:0 14px 36px rgba(0,0,0,.07)"><strong style="font-size:19px">O Cronômetro demorou para abrir</strong><p style="font-size:13px;line-height:1.45;color:#6e6e73;margin:8px 0 0">A interface não respondeu em ${Math.ceil(elapsed/1000)} s. Seus dados locais não foram apagados.</p>${errText}<div style="display:grid;gap:9px;margin-top:16px"><a href="${diagnosticHref}" style="text-decoration:none;text-align:center;background:#111114;color:#fff;padding:12px 14px;border-radius:13px;font-size:14px;font-weight:650">Abrir Diagnóstico</a><a href="${safeHref}" style="text-decoration:none;text-align:center;background:#ececf1;color:#111114;padding:12px 14px;border-radius:13px;font-size:14px;font-weight:650">Abrir Modo Seguro</a><a href="./" style="text-decoration:none;text-align:center;color:#007aff;padding:8px;font-size:13px;font-weight:650">Tentar novamente</a></div></section></main>`;
    finished=true;clearInterval(pollTimer);
  }

  window.addEventListener('error',event=>{
    errors.push(`Erro: ${event.message||event.error||'JavaScript'}`);
    window.__CRONOMETRO_BOOT_ERRORS__=errors.slice();
  });
  window.addEventListener('unhandledrejection',event=>{
    const reason=event.reason?.message||event.reason||'Promise rejeitada';
    errors.push(`Promise: ${reason}`);
    window.__CRONOMETRO_BOOT_ERRORS__=errors.slice();
  });

  const phaseTimer=setInterval(()=>{
    if(finished){clearInterval(phaseTimer);return;}
    const elapsed=performance.now()-startedAt;
    const next=[...steps].reverse().find(x=>elapsed>=x[0]);
    if(next&&stage&&detail&&bar){stage.textContent=next[1];detail.textContent=next[2];bar.style.width=`${next[3]}%`;}
  },180);

  const pollTimer=setInterval(()=>{if(appLooksFunctional()){clearInterval(phaseTimer);finish();}},180);
  const fallbackTimer=setTimeout(showFallback,9000);
  window.addEventListener('load',()=>setTimeout(()=>{if(appLooksFunctional())finish();},80),{once:true});
})();
