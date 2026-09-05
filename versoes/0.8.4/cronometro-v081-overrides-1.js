'use strict';

/* =========================
   v0.8.1 — overrides
   ========================= */

function trashIconMarkup(){
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 10v7M14 10v7"/></svg>`;
}
function recordDateMs(s){return s?.originalRecordedAt??s?.savedAt??s?.openedAt??now();}
function recordGrossMs(s){return sessionTotal(s,s.savedAt)+pauseTotal(s,s.savedAt);}
function toDateInputValue(ms){const d=new Date(ms);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function toTimeInputValue(ms){const d=new Date(ms);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;}
function autoGrowTextarea(el){if(!el)return;el.style.height='auto';el.style.height=Math.min(180,Math.max(42,el.scrollHeight))+'px';}

async function editRecordDate(s){
  if(!s)return;
  document.querySelector('.record-date-editor')?.remove();
  const ms=recordDateMs(s);
  const wrap=document.createElement('div');
  wrap.className='record-date-editor';
  wrap.innerHTML=`<section class="record-date-editor-card" role="dialog" aria-modal="true">
    <div class="record-date-editor-copy"><h2>Editar data do registro</h2></div>
    <div class="record-date-fields"><input id="recordDateInput" type="date" value="${toDateInputValue(ms)}"><input id="recordTimeInput" type="time" value="${toTimeInputValue(ms)}"></div>
    <div class="record-date-editor-actions"><button id="cancelRecordDate">Cancelar</button><button id="saveRecordDate">Salvar</button></div>
  </section>`;
  document.body.appendChild(wrap);
  const finish=()=>wrap.remove();
  wrap.querySelector('#cancelRecordDate').onclick=finish;
  wrap.onclick=e=>{if(e.target===wrap)finish();};
  wrap.querySelector('#saveRecordDate').onclick=async()=>{
    const ds=wrap.querySelector('#recordDateInput').value,ts=wrap.querySelector('#recordTimeInput').value||'00:00';
    if(!ds)return;
    const next=new Date(`${ds}T${ts}:00`);
    if(Number.isNaN(next.getTime()))return;
    s.originalRecordedAt=next.getTime();
    await put('sessions',s);
    finish();render();
  };
}

/* Histórico usa a data real/editável do registro para ordenar, agrupar e filtrar. */
function renderHistory(){
  const areas=getAreas();
  const sessions=data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt).sort((a,b)=>recordDateMs(b)-recordDateMs(a));
  const filtered=sessions.filter(s=>{
    const q=ui.historyQuery.trim().toLocaleLowerCase();
    if(q&&!String(s.title||'').toLocaleLowerCase().includes(q))return false;
    if(ui.historyArea!=='all'&&sessionAreaId(s)!==ui.historyArea)return false;
    if(ui.historyModel!=='all'&&s.modelId!==ui.historyModel)return false;
    if(ui.historyDate&&dayKey(recordDateMs(s))!==ui.historyDate)return false;
    return true;
  });
  const groups={};filtered.forEach(s=>{const k=dayKey(recordDateMs(s));(groups[k]??=[]).push(s);});
  const list=Object.entries(groups).map(([k,arr])=>`<div class="history-day">${fmtDate(new Date(k+'T12:00:00').getTime())}</div>${arr.map(s=>{
    const area=areaById(sessionAreaId(s));
    return `<button class="history-card" data-session="${s.id}"><div class="top"><strong>${esc(s.title)}</strong>${s.isNoMeasurement?'':`<span class="history-total">${svgIcon('timers')}<span>${fmtDuration(sessionTotal(s,s.savedAt))}</span></span>`}</div><div class="history-meta">${esc(area.name)} • ${esc(s.modelNameSnapshot||modelById(s.modelId)?.name||'Modelo')}</div>${s.isNoMeasurement?'<span class="badge">Sem medição</span>':''}${s.restoredAt?'<span class="badge">Restaurado</span>':''}</button>`;
  }).join('')}`).join('');
  const modelOptions=activeModels().filter(m=>ui.historyArea==='all'||modelAreaId(m)===ui.historyArea);
  return shell(`<header class="topbar simple section-tab-header history-header"><span></span><h1>Registros</h1><button class="header-pill" id="historyTrash">Apagados</button></header><main class="content history-content"><div class="filters history-filters">
    <input id="historySearch" placeholder="Buscar título" value="${esc(ui.historyQuery)}">
    <select id="historyArea"><option value="all">Todas as áreas</option>${areas.map(a=>`<option value="${esc(a.id)}" ${ui.historyArea===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select>
    <select id="historyModel"><option value="all">Todos os modelos</option>${modelOptions.map(m=>`<option value="${m.id}" ${ui.historyModel===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select>
    <div class="date-filter"><input id="historyDate" type="date" value="${esc(ui.historyDate)}">${ui.historyDate?`<button id="historyDateClear" aria-label="Limpar data">${svgIcon('close')}</button>`:''}</div>
  </div>${list||'<div class="empty">Nenhum registro encontrado.</div>'}</main>`);
}

function renderSessionDetail(s){
  const model=modelById(s.modelId);
  const timers=[...(s.timers||[])].sort((a,b)=>(a.order??0)-(b.order??0));
  const gross=recordGrossMs(s),working=sessionTotal(s,s.savedAt),pauses=pauseTotal(s,s.savedAt);
  return `<div class="modal-wrap record-detail-wrap"><section class="sheet record-detail-sheet"><div class="sheet-head record-detail-head">
    <button class="circle-button glass record-detail-close" id="closeModal" aria-label="Fechar">${svgIcon('close')}</button>
    <div class="record-detail-title-stack"><button class="record-title-button" data-edit-session-title="${s.id}"><span>${esc(s.title)}</span>${svgIcon('pencil')}</button><button class="record-date-button" data-edit-record-date="${s.id}">${esc(fmtDateTime(recordDateMs(s)))} ${svgIcon('pencil')}</button></div>
    <button class="record-detail-check" id="closeRecordDetail" aria-label="Concluir">${svgIcon('check')}</button>
  </div><div class="record-detail-body">
    <section class="record-note-section"><h3 class="record-section-label">Anotações</h3><div class="record-note-card"><textarea id="detailNote" rows="1" data-note-session="${s.id}" placeholder="">${esc(s.note||'')}</textarea></div><div id="noteStatus" class="record-note-status"></div></section>
    <section class="panel record-summary"><div class="record-context-grid"><div class="record-context-item"><span>Área</span><strong>${esc(areaById(sessionAreaId(s)).name)}</strong></div><div class="record-context-item"><span>Modelo de origem</span><strong>${esc(model ? (model.deletedAt ? 'Modelo excluído' : model.name) : 'Modelo excluído')}</strong></div></div>${s.isNoMeasurement?'<div class="row"><span class="badge">Sem medição</span></div>':`<div class="row"><span>Tempo bruto</span><strong>${fmtDuration(gross)}</strong></div><div class="row"><span>Tempo trabalhando</span><strong class="detail-time-with-icon">${svgIcon('timers')}<span>${fmtDuration(working)}</span></strong></div><div class="row"><span>Pausas</span><strong>${fmtDuration(pauses)}</strong></div>`}${s.restoredAt?`<div class="row"><span>Restaurado em</span><span>${fmtDateTime(s.restoredAt)}</span></div>`:''}</section>
    ${!model?`<div class="record-actions"><button data-rebuild-model="${s.id}">Criar modelo deste registro</button></div>`:''}
    <div class="record-timers-list">${timers.map(t=>{const d=timerDuration(t,s.savedAt),zero=d<=0;return `<details class="record-timer-card ${zero?'zero':''}"><summary><span class="record-timer-title">${visualMarkerMarkup(t.marker,'record-inline-marker')}${esc(t.name)}${t.isAdhoc?'<span class="badge">Etapa avulsa</span>':''}${t.isRemoved?'<span class="badge">Removido</span>':''}</span><span class="record-timer-time">${svgIcon('timers')}<strong>${fmtDuration(d)}</strong></span></summary><div class="record-timer-extra">${zero?'<div class="record-zero-note">Nenhum tempo registrado neste cronômetro.</div>':''}<div class="muted small record-interval-label">Horários e intervalos</div>${t.intervals?.length?t.intervals.map(i=>`<div class="row small"><span>${fmtDateTime(i.startedAt)}</span><span>${i.endedAt?fmtDateTime(i.endedAt):'aberto'}</span></div>`).join(''):'<div class="muted small">Nenhum intervalo registrado.</div>'}<button class="action" data-correct-time="${s.id}" data-timer-id="${t.id}">Corrigir tempo</button></div></details>`}).join('')}</div>
    <div class="record-delete-wrap"><button class="record-delete-button" data-delete-session="${s.id}">${trashIconMarkup()}<span>Excluir</span></button></div>
  </div></section></div>`;
}
