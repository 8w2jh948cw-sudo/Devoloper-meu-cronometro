function renderSessionDetail(s){
  const model=modelById(s.modelId);
  const timers=s.isNoMeasurement?[]:s.timers.filter(t=>timerDuration(t,s.savedAt)>0).sort((a,b)=>a.order-b.order);
  return `<div class="modal-wrap record-detail-wrap"><section class="sheet record-detail-sheet"><div class="sheet-head record-detail-head"><button class="circle-button glass record-detail-close" id="closeModal" aria-label="Fechar">${svgIcon('close')}</button><button class="record-title-button" data-edit-session-title="${s.id}"><span>${esc(s.title)}</span>${svgIcon('pencil')}</button><button class="record-detail-check" id="closeRecordDetail" aria-label="Concluir">${svgIcon('check')}</button></div><div class="record-detail-body">
    <div class="record-actions">${!model?`<button data-rebuild-model="${s.id}">Criar modelo deste registro</button>`:''}<button data-delete-session="${s.id}" class="danger">Excluir</button></div>
    <section class="panel record-summary"><div class="row"><span>Modelo de origem</span><strong>${esc(model ? (model.deletedAt ? 'Modelo excluído' : model.name) : 'Modelo excluído')}</strong></div>${s.isNoMeasurement?'<div class="row"><span class="badge">Sem medição</span></div>':`<div class="row"><span>Tempo total</span><strong class="detail-time-with-icon">${svgIcon('timers')}<span>${fmtDuration(sessionTotal(s,s.savedAt))}</span></strong></div><div class="row"><span>Tempo decorrido</span><strong>${fmtDuration(sessionElapsedNet(s,s.savedAt))}</strong></div><div class="row"><span>Pausas</span><strong>${fmtDuration(pauseTotal(s,s.savedAt))}</strong></div>`}<div class="row"><span>Registrado originalmente em</span><span>${fmtDateTime(s.originalRecordedAt)}</span></div>${s.restoredAt?`<div class="row"><span>Restaurado em</span><span>${fmtDateTime(s.restoredAt)}</span></div>`:''}</section>
    <div class="record-timers-list">${timers.map(t=>`<details class="record-timer-card"><summary><span class="record-timer-title">${esc(t.name)}${t.isAdhoc?'<span class="badge">Etapa avulsa</span>':''}${t.isRemoved?'<span class="badge">Removido</span>':''}</span><span class="record-timer-time">${svgIcon('timers')}<strong>${fmtDuration(timerDuration(t,s.savedAt))}</strong></span></summary><div class="record-timer-extra"><div class="muted small record-interval-label">Horários e intervalos</div>${t.intervals.map(i=>`<div class="row small"><span>${fmtDateTime(i.startedAt)}</span><span>${i.endedAt?fmtDateTime(i.endedAt):'aberto'}</span></div>`).join('')}<button class="action" data-correct-time="${s.id}" data-timer-id="${t.id}">Corrigir tempo</button></div></details>`).join('')}</div>
    <section class="panel"><label for="detailNote"><strong>Nota</strong></label><textarea id="detailNote" rows="4" data-note-session="${s.id}" placeholder="Notas">${esc(s.note)}</textarea><div id="noteStatus" class="muted small"></div></section>
  </div></section></div>`;
}

function renderTrash(){ const deletedSessions=data.sessions.filter(s=>s.deletedAt),deletedModels=data.models.filter(m=>m.deletedAt);return `<div class="modal-wrap"><section class="sheet"><div class="sheet-head"><h2>Apagados recentemente</h2><button class="chip" id="closeModal">Fechar</button></div><h3>Registros</h3>${deletedSessions.map(s=>`<div class="panel"><strong>${esc(s.title)}</strong><div class="toolbar"><button data-restore-session="${s.id}">Restaurar</button><button data-hard-session="${s.id}" class="danger">Apagar definitivamente</button></div></div>`).join('')||'<p class="muted">Nenhum registro.</p>'}<h3>Modelos</h3>${deletedModels.map(m=>`<div class="panel"><strong>${esc(m.name)}</strong><div class="toolbar"><button data-restore-model="${m.id}">Restaurar</button><button data-hard-model="${m.id}" class="danger">Apagar definitivamente</button></div></div>`).join('')||'<p class="muted">Nenhum modelo.</p>'}</section></div>`; }




function render(){
  applyTheme();

  if(ui.tab==='timers')$app.innerHTML=renderTimers();
  if(ui.tab==='history')$app.innerHTML=renderHistory();
  if(ui.tab==='stats')$app.innerHTML=renderStats();
  if(ui.tab==='settings')$app.innerHTML=renderSettings();

  if(ui.modal){
    if(ui.modal.type==='editModel'){const m=modelById(ui.modal.id);if(m)$app.insertAdjacentHTML('beforeend',renderEditModel(m));}
    if(ui.modal.type==='sessionMenu')$app.insertAdjacentHTML('beforeend',renderSessionMenu());
    if(ui.modal.type==='pendingModelSwitch')$app.insertAdjacentHTML('beforeend',renderPendingModelSwitch(ui.modal.targetModelId));
    if(ui.modal.type==='organize')$app.insertAdjacentHTML('beforeend',renderOrganize());
    if(ui.modal.type==='timerMarker')$app.insertAdjacentHTML('beforeend',renderTimerMarkerEditor());
    if(ui.modal.type==='session'){const s=data.sessions.find(x=>x.id===ui.modal.id);if(s)$app.insertAdjacentHTML('beforeend',renderSessionDetail(s));}
    if(ui.modal.type==='trash')$app.insertAdjacentHTML('beforeend',renderTrash());
  }

  document.getElementById('app-version-badge')?.remove();
  if(data.settings.showVersionBadge){
    document.body.insertAdjacentHTML('beforeend',`<div id="app-version-badge" class="app-version-badge">v${esc(APP_META.version)}</div>`);
  }

  bind();
  bindV080Events();
}

  

'use strict';

async function shareFile(name,type,content){
  const blob=content instanceof Blob?content:new Blob([content],{type}); const file=new File([blob],name,{type});
  try{ if(navigator.canShare?.({files:[file]})){ await navigator.share({files:[file],title:name}); return; } }catch(e){ if(e.name==='AbortError')return; }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('Arquivo gerado');
}
function csvCell(v){const s=String(v??'');return `"${s.replaceAll('"','""')}"`;}
async function exportCSV(){
  const rows=[['sessionId','originalRecordedAt','savedAt','restoredAt','title','modelId','model','recordedTimerId','templateId','cronometro','tipo','duracaoMs','tempoTotalMs','tempoDecorridoMs','pausasMs','nota']];
  data.sessions.filter(s=>s.status==='saved').forEach(s=>s.timers.forEach(t=>rows.push([s.id,new Date(s.originalRecordedAt).toISOString(),new Date(s.savedAt).toISOString(),s.restoredAt?new Date(s.restoredAt).toISOString():'',s.title,s.modelId,s.modelNameSnapshot,t.id,t.templateId||'',t.name,t.isAdhoc?'avulso':t.isRemoved?'removido':'modelo',timerDuration(t,s.savedAt),sessionTotal(s,s.savedAt),sessionElapsedNet(s,s.savedAt),pauseTotal(s,s.savedAt),s.note])));
  await shareFile(`cronometro-${dayKey(now())}.csv`,'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\n'));
}
async function exportJSON(){ const payload={schemaVersion:APP_META.dataSchemaVersion,exportedAt:new Date().toISOString(),models:data.models,sessions:data.sessions,settings:data.settings,currentSession:data.current}; await shareFile(`cronometro-dados-${dayKey(now())}.json`,'application/json',JSON.stringify(payload,null,2)); }
function validateBackup(payload){
  return payload && typeof payload==='object' && Array.isArray(payload.models) && Array.isArray(payload.sessions) && payload.settings && typeof payload.settings==='object';
}
function normalizeImportedCurrent(current,exportedAt){
  if(!current || current.status!=='active')return null;
  const c=clone(current);const stop=Date.parse(exportedAt)||now();
  (c.timers||[]).forEach(t=>(t.intervals||[]).forEach(i=>{if(i.endedAt==null)i.endedAt=Math.max(i.startedAt,stop);}));
  (c.pauseIntervals||[]).forEach(p=>{if(p.endedAt==null)p.endedAt=Math.max(p.startedAt,stop);});
  c.globalPaused=false;c.pausedActiveTimerIds=[];return c;
}
async function replaceFromBackup(payload){
  const current=normalizeImportedCurrent(payload.currentSession,payload.exportedAt);
  const settings={...data.settings,...payload.settings,simultaneous:'single'};
  await new Promise((resolve,reject)=>{
    const tr=db.transaction(['models','sessions','state'],'readwrite');
    const ms=tr.objectStore('models'),ss=tr.objectStore('sessions'),st=tr.objectStore('state');
    ms.clear();ss.clear();st.clear();
    payload.models.forEach((m,i)=>ms.put({...m,sortOrder:Number.isFinite(m.sortOrder)?m.sortOrder:i}));
    payload.sessions.forEach(x=>ss.put(x));
    st.put({key:'settings',value:settings});st.put({key:'current',value:current});st.put({key:FACTORY_SEED_STATE_KEY,value:APP_META.factoryDataVersion});
    tr.oncomplete=resolve;tr.onerror=()=>reject(tr.error);tr.onabort=()=>reject(tr.error||new Error('Importação cancelada'));
  });
  data.models=await getAll('models');data.sessions=await getAll('sessions');data.settings={...data.settings,...(await getState('settings')||{}),simultaneous:'single'};data.current=await getState('current');
  if(!data.current){const m=activeModels()[0];if(m){data.current=newSession(m);await persistCurrent();}}
}
async function importJSON(file){
  try{
    const payload=JSON.parse(await file.text());
    if(!validateBackup(payload)){alert('Este arquivo não parece ser um backup válido do Cronômetro.');return;}
    if(!confirm('Restaurar este backup? Todos os dados atuais do aplicativo serão substituídos pelos dados do arquivo.'))return;
    await replaceFromBackup(payload);data.undo=null;ui.modal=null;ui.popover=null;ui.timerView='timers';toast('Backup restaurado');render();
  }catch(err){console.error(err);alert('Não foi possível importar este arquivo JSON.');}
}
function ascii(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?').replace(/[()\\]/g,m=>'\\'+m);}
function makePdf(lines){
  const per=44,pages=[];for(let i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));if(!pages.length)pages=[['Relatorio Cronometro']];
  const objs=[];const fontObj=3;const pageObjStart=4;const contentStart=pageObjStart+pages.length;objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objs[2]=`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${pageObjStart+i} 0 R`).join(' ')}] >>`;objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((pg,i)=>{const contentNum=contentStart+i;objs[pageObjStart+i]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentNum} 0 R >>`;let y=800;const body=['BT','/F1 10 Tf',...pg.flatMap(line=>{const cmd=`1 0 0 1 45 ${y} Tm (${ascii(line).slice(0,100)}) Tj`;y-=17;return [cmd];}),'ET'].join('\n');objs[contentNum]=`<< /Length ${body.length} >>\nstream\n${body}\nendstream`;});
  let pdf='%PDF-1.4\n',offs=[0];for(let i=1;i<objs.length;i++){offs[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}const xref=pdf.length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)pdf+=`${String(offs[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'});
}
async function exportPDF(){
  const ss=data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt);const measured=ss.filter(s=>!s.isNoMeasurement);const total=measured.reduce((a,s)=>a+sessionTotal(s,s.savedAt),0);const lines=['RELATORIO CRONOMETRO',`Gerado em: ${fmtDateTime(now())}`,`Registros medidos: ${measured.length}`,`Tempo total acumulado: ${fmtDuration(total)}`,'','REGISTROS'];ss.sort((a,b)=>b.originalRecordedAt-a.originalRecordedAt).forEach(s=>{lines.push(`${fmtDate(s.originalRecordedAt)} | ${s.title} | ${s.isNoMeasurement?'Sem medicao':fmtDuration(sessionTotal(s,s.savedAt))}`);if(!s.isNoMeasurement)s.timers.filter(t=>timerDuration(t,s.savedAt)>0).forEach(t=>lines.push(`  - ${t.name}: ${fmtDuration(timerDuration(t,s.savedAt))}`));});await shareFile(`cronometro-relatorio-${dayKey(now())}.pdf`,'application/pdf',makePdf(lines));
}

  