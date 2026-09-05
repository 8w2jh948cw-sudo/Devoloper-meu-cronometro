/* v0.8.7 — painel de Dados/Backup com lembrete por antiguidade */
globalThis.APP_META=Object.freeze({version:'0.8.7',dataSchemaVersion:5,factoryDataVersion:1});

function backupShareIcon(){
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3"/><path d="m7.8 7.2 4.2-4.2 4.2 4.2"/><path d="M8 9H6.6A2.6 2.6 0 0 0 4 11.6v6.8A2.6 2.6 0 0 0 6.6 21h10.8a2.6 2.6 0 0 0 2.6-2.6v-6.8A2.6 2.6 0 0 0 17.4 9H16"/></svg>`;
}
function backupImportIcon(){
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v13"/><path d="m7.8 11.8 4.2 4.2 4.2-4.2"/><path d="M8 9H6.6A2.6 2.6 0 0 0 4 11.6v6.8A2.6 2.6 0 0 0 6.6 21h10.8a2.6 2.6 0 0 0 2.6-2.6v-6.8A2.6 2.6 0 0 0 17.4 9H16"/></svg>`;
}
function backupChevron(){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`;}
function backupAlertIcon(){return backupShareIcon();}
function backupDateLabel(ms){
  const d=new Date(ms);if(!Number.isFinite(d.getTime()))return '';
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function backupAgeInfo(){
  const raw=Number(data.settings.lastBackupExportAt||0);
  if(!raw||!Number.isFinite(raw))return {tone:'stale',title:'Backup ainda não registrado',text:'O app ainda não registrou um backup externo criado por você.',subtitle:'Nenhum backup externo registrado'};
  const age=Math.max(0,now()-raw),days=Math.floor(age/86400000);
  const when=days===0?'hoje':days===1?'ontem':`há ${days} dias`;
  const dated=backupDateLabel(raw);
  if(days<7)return {tone:'ok',title:'Backup em dia',text:`Último backup criado ${when}.`,subtitle:`Último backup: ${dated}`};
  if(days<14)return {tone:'warn',title:'Lembrete de backup',text:`O último backup foi criado ${when}. Talvez seja uma boa hora para criar outro.`,subtitle:`Último backup: ${dated}`};
  return {tone:'stale',title:'Backup desatualizado',text:`Já faz ${days} dias desde o último backup externo.`,subtitle:`Último backup: ${dated}`};
}
function renderDataBackupSectionV087(){
  const info=backupAgeInfo();
  return `<section class="settings-section data-backup-section"><h3 class="section-label">Dados</h3>
    <div class="backup-alert ${info.tone}"><span class="backup-alert-icon">${backupAlertIcon()}</span><span class="backup-alert-copy"><strong class="backup-alert-title">${esc(info.title)}</strong><span class="backup-alert-text">${esc(info.text)}</span></span></div>
    <div class="data-backup-card">
      <button class="data-backup-row" id="exportJson"><span class="data-backup-row-icon">${backupShareIcon()}</span><span class="data-backup-row-copy"><strong class="data-backup-row-title">Exportar dados</strong><span class="data-backup-row-subtitle">${esc(info.subtitle)}</span></span><span class="data-backup-chevron">${backupChevron()}</span></button>
      <label class="data-backup-row data-backup-file-label" for="importJsonFile"><span class="data-backup-row-icon">${backupImportIcon()}</span><span class="data-backup-row-copy"><strong class="data-backup-row-title">Importar dados</strong><span class="data-backup-row-subtitle">Substitui os dados atuais pelo conteúdo do backup JSON</span></span><span class="data-backup-chevron">${backupChevron()}</span><input id="importJsonFile" class="sr-only" type="file" accept="application/json,.json"></label>
    </div>
    <p class="data-backup-footnote">O backup JSON inclui registros, modelos, áreas, clientes e personalizações do aplicativo.</p>
  </section>
  <section class="settings-section data-export-other"><h3 class="section-label">Outros formatos</h3><div class="settings-card"><button class="settings-row button-row accent-button-row" id="exportCsv"><span>Exportar CSV</span></button><button class="settings-row button-row accent-button-row" id="exportPdf"><span>Exportar PDF</span></button></div></section>`;
}

const __renderSettingsV087=renderSettings;
renderSettings=function(){
  const html=__renderSettingsV087();
  if((ui.settingsView||'main')!=='main')return html;
  const marker='<section class="settings-section"><h3 class="section-label">Dados</h3>';
  const start=html.indexOf(marker);
  if(start<0)return html;
  const next=html.indexOf('<section class="settings-section">',start+marker.length);
  if(next<0)return html;
  return html.slice(0,start)+renderDataBackupSectionV087()+html.slice(next);
};

async function exportJSON(){
  const createdAt=now();
  const payload={
    schemaVersion:APP_META.dataSchemaVersion,
    exportedAt:new Date(createdAt).toISOString(),
    models:data.models,
    sessions:data.sessions,
    settings:{...data.settings,lastBackupExportAt:createdAt},
    currentSession:data.current
  };
  const name=`cronometro-dados-${dayKey(createdAt)}.json`;
  const type='application/json';
  const blob=new Blob([JSON.stringify(payload,null,2)],{type});
  const file=new File([blob],name,{type});
  let completed=false;
  try{
    if(navigator.canShare?.({files:[file]})){
      await navigator.share({files:[file],title:name});
      completed=true;
    }else{
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);completed=true;
    }
  }catch(error){
    if(error?.name==='AbortError')return;
    console.error(error);
    try{
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);completed=true;
    }catch(fallbackError){
      console.error(fallbackError);alert('Não foi possível gerar o arquivo de backup.');return;
    }
  }
  if(completed){
    data.settings.lastBackupExportAt=createdAt;
    await persistSettings();
    toast('Backup externo criado');
    render();
  }
}
