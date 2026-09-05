/* v0.8.8 — modo Clássico / Ultra Visual */
globalThis.APP_META=Object.freeze({version:'0.8.8',dataSchemaVersion:5,factoryDataVersion:1});

function visualStyleModeV088(){
  return data?.settings?.visualStyleMode==='ultra'?'ultra':'classic';
}
function applyVisualStyleV088(mode=visualStyleModeV088()){
  document.documentElement.dataset.visualStyle=mode==='ultra'?'ultra':'classic';
}
function visualStyleSettingsBlockV088(){
  const mode=visualStyleModeV088();
  return `<section class="settings-section visual-style-section"><h3 class="section-label">Estilo visual</h3><div class="settings-card visual-style-card">
    <div class="visual-style-intro">Escolha entre o visual atual, mais leve, e a camada Ultra com Glow, vidro e cor suave.</div>
    <div class="visual-style-picker" role="group" aria-label="Estilo visual do aplicativo">
      <button class="visual-style-option ${mode==='classic'?'selected':''}" data-visual-style-mode="classic" aria-pressed="${mode==='classic'}"><span class="visual-style-option-head"><span class="visual-style-swatch"></span><span>Clássico</span></span><small>Mais leve e otimizado.</small><span class="visual-style-chip">PADRÃO</span></button>
      <button class="visual-style-option ${mode==='ultra'?'selected':''}" data-visual-style-mode="ultra" aria-pressed="${mode==='ultra'}"><span class="visual-style-option-head"><span class="visual-style-swatch ultra"></span><span>Ultra</span></span><small>Glow, transparência e profundidade.</small><span class="visual-style-chip">FANCY</span></button>
    </div>
    <div class="visual-style-footnote">O app sempre inicia pela camada Clássica. Se Ultra estiver selecionado, os efeitos entram logo depois da abertura para reduzir o risco de travamentos.</div>
  </div></section>`;
}

const __renderAppearanceV088=renderAppearanceSettings;
renderAppearanceSettings=function(){
  const html=__renderAppearanceV088();
  const marker='<main class="settings-content">';
  if(!html.includes(marker))return html;
  return html.replace(marker,marker+visualStyleSettingsBlockV088());
};

let ultraBootSettledV088=false;
let ultraBootTimerV088=null;
const __renderV088=render;
render=function(){
  const mode=visualStyleModeV088();
  if(!ultraBootSettledV088&&mode==='ultra')applyVisualStyleV088('classic');
  else applyVisualStyleV088(mode);
  const result=__renderV088();
  if(!ultraBootSettledV088){
    ultraBootSettledV088=true;
    if(mode==='ultra'){
      clearTimeout(ultraBootTimerV088);
      ultraBootTimerV088=setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>applyVisualStyleV088('ultra'))),120);
    }
  }
  return result;
};

document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-visual-style-mode]');
  if(!button)return;
  const mode=button.dataset.visualStyleMode==='ultra'?'ultra':'classic';
  if(!data?.settings)return;
  data.settings.visualStyleMode=mode;
  applyVisualStyleV088(mode);
  try{await persistSettings();}catch(error){console.error('Falha ao salvar estilo visual',error);}
  render();
  toast(mode==='ultra'?'Modo Ultra ativado':'Modo Clássico ativado');
});

applyVisualStyleV088('classic');
