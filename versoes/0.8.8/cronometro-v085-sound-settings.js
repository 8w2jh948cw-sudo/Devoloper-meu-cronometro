/* v0.8.5 — Som do cronômetro em página própria */
globalThis.APP_META=Object.freeze({version:'0.8.5',dataSchemaVersion:5,factoryDataVersion:1});

function renderTimerSoundSettings(){
  const hasSound=!!data.settings.timerSoundData;
  const soundName=hasSound?(data.settings.timerSoundName||'Áudio escolhido'):'Nenhum áudio escolhido';
  const volume=Math.round((Number(data.settings.timerSoundVolume)||0)*100);
  return shell(`<header class="topbar simple section-tab-header appearance-header"><button class="appearance-back" id="closeSoundSettings" aria-label="Voltar">${svgIcon('back')}</button><h1>Som do cronômetro</h1><span></span></header><main class="settings-content sound-detail-settings">
    <section class="settings-section"><div class="settings-card sound-settings-card">
      <button class="settings-row button-row" id="toggleTimerSound" aria-pressed="${data.settings.timerSoundEnabled?'true':'false'}"><span>Som durante a contagem</span><span class="ios-switch ${data.settings.timerSoundEnabled?'on':''}" aria-hidden="true"></span></button>
      <label class="settings-row button-row accent-button-row" for="timerSoundFile"><span>Escolher áudio</span><span class="secondary-value audio-file-name">${esc(soundName)}</span><input id="timerSoundFile" class="sr-only" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,.mp3,.m4a,.wav"></label>
      <label class="settings-row volume-row"><span>Volume</span><span class="range-wrap"><input id="timerSoundVolume" type="range" min="0" max="100" step="1" value="${volume}" ${hasSound?'':'disabled'}><span>${volume}%</span></span></label>
    </div><p class="section-footer">O áudio toca em loop somente enquanto algum cronômetro estiver contando.</p></section>
    ${hasSound?`<section class="settings-section"><div class="settings-card"><button class="settings-row button-row danger" id="removeTimerSound"><span>Remover áudio</span></button></div></section>`:''}
  </main>`);
}

const __renderSettingsV085=renderSettings;
renderSettings=function(){
  if(ui.settingsView==='sound')return renderTimerSoundSettings();
  const html=__renderSettingsV085();
  if((ui.settingsView||'main')!=='main')return html;
  const start=html.indexOf('<section class="settings-section sound-section">');
  if(start<0)return html;
  const end=html.indexOf('</section>',start);
  if(end<0)return html;
  const hasSound=!!data.settings.timerSoundData;
  const status=hasSound?(data.settings.timerSoundEnabled?'Ativado':'Desativado'):'Nenhum áudio';
  const replacement=`<section class="settings-section"><div class="settings-card settings-navigation-card"><button class="settings-row button-row" id="openSoundSettings"><span>Som do cronômetro</span><span class="secondary-value">${esc(status)} ›</span></button></div></section>`;
  return html.slice(0,start)+replacement+html.slice(end+'</section>'.length);
};

const __bindV082EventsV085=bindV082Events;
bindV082Events=function(){
  __bindV082EventsV085();
  const byId=id=>document.getElementById(id);
  if(byId('openSoundSettings'))byId('openSoundSettings').onclick=()=>{ui.settingsView='sound';render();};
  if(byId('closeSoundSettings'))byId('closeSoundSettings').onclick=()=>{ui.settingsView='main';render();};
};
