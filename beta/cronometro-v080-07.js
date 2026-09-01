/* ---------- JANELA DE TEXTO ---------- */
function iosTextPrompt({
  title='Digite um texto',
  message='',
  value='',
  placeholder='',
  confirmText='Salvar',
  inputMode='text',
  multiline=false
}={}){
  return new Promise(resolve=>{
    document.querySelector('.ios-text-prompt-backdrop')?.remove();
    const backdrop=document.createElement('div');
    backdrop.className='ios-text-prompt-backdrop';
    backdrop.innerHTML=`<section class="ios-text-prompt" role="dialog" aria-modal="true">
      <div class="ios-text-prompt-copy"><h2>${esc(title)}</h2>${message?`<p>${esc(message)}</p>`:''}</div>
      <div class="ios-text-prompt-field">${multiline
        ?`<textarea id="iosPromptInput" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
        :`<input id="iosPromptInput" type="text" inputmode="${esc(inputMode)}" autocomplete="off" autocapitalize="sentences" placeholder="${esc(placeholder)}" value="${esc(value)}">`
      }</div>
      <div class="ios-text-prompt-actions"><button id="iosPromptCancel">Cancelar</button><button id="iosPromptConfirm">${esc(confirmText)}</button></div>
    </section>`;
    document.body.appendChild(backdrop);
    const input=backdrop.querySelector('#iosPromptInput');
    const finish=result=>{backdrop.remove();resolve(result);};
    backdrop.querySelector('#iosPromptCancel').onclick=()=>finish(null);
    backdrop.querySelector('#iosPromptConfirm').onclick=()=>finish(input.value);
    backdrop.onclick=e=>{if(e.target===backdrop)finish(null);};
    input.addEventListener('keydown',e=>{
      if(!multiline&&e.key==='Enter'){e.preventDefault();finish(input.value);}
    });
    try{
      input.focus({preventScroll:true});
      if(!multiline&&typeof input.setSelectionRange==='function'){
        const len=input.value.length;input.setSelectionRange(len,len);
      }
      setTimeout(()=>input.focus({preventScroll:true}),50);
    }catch(_){}
  });
}

/* ---------- CONFIRMAÇÃO DE SALVAMENTO ---------- */
function showSavedConfirmation(){
  document.querySelector('.save-confirmation')?.remove();
  const el=document.createElement('div');
  el.className='save-confirmation';
  el.innerHTML=`<div class="save-confirmation-card"><span class="save-confirmation-icon">${svgIcon('check')}</span><span>Registro salvo</span></div>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1400);
}

/* ---------- MARCADORES VISUAIS ---------- */
const V080_LUCIDE_MARKERS={
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.3L5.8 21 7 14.1l-5-4.8 6.9-1z"/>',
  sparkle:'<path d="m12 3-1.2 3.5L7 8l3.8 1.5L12 13l1.2-3.5L17 8l-3.8-1.5z"/><path d="m19 14-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8z"/><path d="m5 14-.7 1.8L2.5 16.5l1.8.7L5 19l.7-1.8 1.8-.7-1.8-.7z"/>',
  camera:'<path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2z"/><circle cx="12" cy="13" r="4"/>',
  scissors:'<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.7 8.3 11.3 5.2"/><path d="m8.7 15.7 11.3-5.2"/>',
  brush:'<path d="m14 5 5 5"/><path d="M13 6 4.5 14.5A3.5 3.5 0 0 0 4 19c1.2 1.2 3.2 1.1 4.5-.2L17 10.3"/><path d="M3 21c2 0 3-1 3-3"/>',
  droplet:'<path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5z"/>',
  leaf:'<path d="M20 4c-8 0-14 4-14 10 0 4 3 6 6 6 6 0 8-8 8-16z"/><path d="M4 21c2-5 6-9 12-12"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
function lucideMarkerSvg(name){
  const p=V080_LUCIDE_MARKERS[name];
  if(!p)return '';
  return `<svg class="sf-icon" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}
function visualMarkerMarkup(marker,cls='timer-visual-marker'){
  if(!marker)return `<span class="${cls} empty"></span>`;
  if(marker.type==='emoji')return `<span class="${cls}">${esc(marker.value||'')}</span>`;
  if(marker.type==='lucide'){
    const svg=lucideMarkerSvg(marker.value);
    return `<span class="${cls}${svg?'':' empty'}">${svg}</span>`;
  }
  if((marker.type==='svg'||marker.type==='iconoir')&&marker.data){
    return `<span class="${cls}"><img src="${esc(marker.data)}" alt=""></span>`;
  }
  return `<span class="${cls} empty"></span>`;
}
function timerNameFit(name){
  const n=Array.from(String(name||'')).length;
  return n>30?'fit-xlong':n>19?'fit-long':'';
}
function sanitizeSvg(svg){
  let s=String(svg||'').trim();
  s=s.replace(/<script[\s\S]*?<\/script>/gi,'');
  s=s.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,'');
  s=s.replace(/\son\w+\s*=\s*(["']).*?\1/gi,'');
  s=s.replace(/\son\w+\s*=\s*[^\s>]+/gi,'');
  return s;
}
function markerTarget(){
  const m=ui.modal;
  if(!m||m.type!=='timerMarker')return null;
  if(m.scope==='current'){
    const timer=data.current?.timers?.find(t=>t.id===m.timerId);
    return timer?{scope:'current',timer}:null;
  }
  const model=modelById(m.modelId);
  const timer=model?.timers?.find(t=>t.id===m.timerId);
  return timer?{scope:'model',model,timer}:null;
}
async function saveMarkerToTarget(marker){
  const target=markerTarget();if(!target)return;
  target.timer.marker=clone(marker||null);
  if(target.scope==='model'){
    target.model.updatedAt=now();
    await put('models',target.model);
    if(data.current?.modelId===target.model.id){
      const rt=data.current.timers.find(t=>t.templateId===target.timer.id);
      if(rt){rt.marker=clone(marker||null);await persistCurrent();}
    }
  }else{
    data.current.customized=true;
    await persistCurrent();
  }
  ui.modal=target.scope==='model'?{type:'editModel',id:target.model.id}:{type:'organize'};
  render();
}
async function importIconoirMarker(name){
  const clean=String(name||'').trim().toLowerCase().replace(/^iconoir-/,'');
  if(!clean)return;
  try{
    const url=`https://cdn.jsdelivr.net/npm/iconoir@7.12.1/icons/${encodeURIComponent(clean)}.svg`;
    const response=await fetch(url,{mode:'cors',cache:'force-cache'});
    if(!response.ok)throw new Error(String(response.status));
    const svg=sanitizeSvg(await response.text());
    if(!/^<svg[\s>]/i.test(svg))throw new Error('invalid-svg');
    await saveMarkerToTarget({type:'iconoir',value:clean,data:svgTextToDataUrl(svg)});
  }catch(err){
    console.error(err);
    alert('Não foi possível importar esse ícone do Iconoir. Confira o nome e tente novamente com internet ativa.');
  }
}
function renderTimerMarkerEditor(){
  const target=markerTarget();if(!target)return '';
  const marker=target.timer.marker||null;
  const tab=ui.modal.markerTab||'emoji';
  const preview=visualMarkerMarkup(marker,'marker-preview');
  const lucideNames=Object.keys(V080_LUCIDE_MARKERS);
  let pane='';
  if(tab==='emoji'){
    pane=`<div class="marker-pane"><input id="markerEmojiInput" maxlength="12" placeholder="Digite ou cole um emoji" value="${marker?.type==='emoji'?esc(marker.value):''}"></div>
      <div class="marker-editor-actions"><button class="primary" id="applyEmojiMarker">Usar emoji</button></div>`;
  }else if(tab==='lucide'){
    pane=`<div class="marker-pane"><div class="marker-grid">${lucideNames.map(n=>`<button data-lucide-marker="${esc(n)}" aria-label="${esc(n)}">${lucideMarkerSvg(n)}</button>`).join('')}</div></div>`;
  }else if(tab==='iconoir'){
    pane=`<div class="marker-pane"><input id="iconoirNameInput" placeholder="Nome do ícone, ex.: home-simple" value="${marker?.type==='iconoir'?esc(marker.value):''}"></div>
      <div class="marker-editor-actions"><button class="primary" id="importIconoirMarker">Importar ícone do Iconoir</button></div>`;
  }else{
    pane=`<div class="marker-pane"><textarea id="markerSvgInput" placeholder="Cole o código SVG completo"></textarea></div>
      <div class="marker-editor-actions"><button class="primary" id="applySvgMarker">Usar SVG</button></div>`;
  }
  return `<div class="modal-wrap"><section class="sheet marker-editor-sheet"><div class="sheet-head"><h2>Marcador visual</h2><button class="chip" id="closeModal">Fechar</button></div>
    ${preview}
    <div class="marker-tabs">${[['emoji','Emoji'],['lucide','Lucide'],['iconoir','Iconoir'],['svg','SVG']].map(([id,label])=>`<button data-marker-tab="${id}" class="${tab===id?'selected':''}">${label}</button>`).join('')}</div>
    ${pane}
    <div class="marker-editor-actions"><button class="danger" id="clearTimerMarker">Remover marcador</button></div>
  </section></div>`;
}

/* ---------- RENDER: CRONÔMETROS ---------- */
function renderTimers(){
  const s=data.current, models=activeModels();
  if(!models.length){ return shell(`<header class="topbar simple"><h1>Cronômetro</h1></header><main class="content"><div class="empty">Nenhum modelo criado.<br><br><button class="ios-button" id="createFirst">Criar modelo</button></div></main>`); }
  if(!s)return '';
  const model=modelById(s.modelId);
  const timerMode=currentTimerMode();
  const central=timerMode.layout==='central';
  const cards=s.timers.sort((a,b)=>a.order-b.order).map(rt=>`<button class="timer-card ${central?'central':''} ${timerStateClass(s,rt)}" data-timer="${rt.id}" aria-label="${esc(rt.name)}, ${fmtDuration(timerDuration(rt))}">
      ${timerStateIcon(s,rt)}
      <span class="timer-name-wrap">${visualMarkerMarkup(rt.marker)}<span class="name ${timerNameFit(rt.name)}">${esc(rt.name)}${rt.isAdhoc?'<span class="badge">Etapa avulsa</span>':''}</span></span>
      <span class="time">${fmtDuration(timerDuration(rt))}</span>
    </button>`).join('');
  const running=s.timers.some(isTimerActive);
  const blink=running&&data.settings.blinkTotalColon;
  const totalText=fmtDuration(sessionTotal(s));
  const widthClass=totalText.length>=9?'total-xlong':totalText.length>=7?'total-hours':'';
  const titlePopover=ui.popover?.type==='title'?`<div class="popover-backdrop" id="closePopover"></div><div class="title-popover floating-window"><button id="titleRename">Renomear</button><button id="titleEditModel">Editar modelo</button><button id="titleDiscard" class="danger">Descartar</button></div>`:'';
  const modelsDrawer=ui.timerView==='models'?renderModelsDrawer():'';
  return shell(`<header class="topbar timer-topbar"><div class="header-row"><button class="circle-button" id="modelsBack" aria-label="Modelos">${svgIcon('back')}</button><button class="current-title ${s.manualTitle?'':'untitled'}" id="currentTitleButton">${esc(currentTitle())}</button><button class="circle-button" id="sessionMenu" aria-label="Detalhes">${svgIcon('more')}</button>${titlePopover}</div><div class="current-model-name">${esc(model?.name||s.modelNameSnapshot)}</div>${s.customized?'<div class="status-line">Personalizado neste registro</div>':''}</header>
  <main class="content timer-content"><div class="timer-list">${cards}<button class="add-card" id="addAdhoc">${svgIcon('plus')}<span>Adicionar cronômetro</span></button></div></main>
  <div class="floating-actions timer-actions ${widthClass}"><section class="total-card floating-card ${running?'running':''}"><span class="total-icon">${svgIcon('clock')}</span><span class="total-copy"><small>Tempo total</small><strong class="total-time">${fmtDurationWithBlinkingColons(sessionTotal(s),blink)}</strong></span></section><button class="save-btn" id="saveBtn">${svgIcon('check')}<span>Salvar</span></button></div>${modelsDrawer}`);
}

/* ---------- RENDER: HISTÓRICO ---------- */
function renderHistory(){
  const areas=getAreas();
  const sessions=data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt).sort((a,b)=>(b.restoredAt||b.savedAt)-(a.restoredAt||a.savedAt));
  const filtered=sessions.filter(s=>{
    const q=ui.historyQuery.trim().toLocaleLowerCase();
    if(q&&!String(s.title||'').toLocaleLowerCase().includes(q))return false;
    if(ui.historyArea!=='all'&&sessionAreaId(s)!==ui.historyArea)return false;
    if(ui.historyModel!=='all'&&s.modelId!==ui.historyModel)return false;
    if(ui.historyDate&&dayKey(s.restoredAt||s.savedAt)!==ui.historyDate)return false;
    return true;
  });
  const groups={};filtered.forEach(s=>{const k=dayKey(s.restoredAt||s.savedAt);(groups[k]??=[]).push(s);});
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

/* ---------- RENDER: ESTATÍSTICAS ---------- */
function renderStats(){
  const areas=getAreas();
  const ss=validMeasuredSessions().filter(s=>ui.statsArea==='all'||sessionAreaId(s)===ui.statsArea);
  const count=ss.length,total=ss.reduce((a,s)=>a+sessionTotal(s,s.savedAt),0),avg=count?total/count:0;
  const byTimer=new Map();
  ss.forEach(s=>s.timers.forEach(t=>{
    const d=timerDuration(t,s.savedAt);if(d<=0)return;
    const key=t.templateId||`adhoc:${t.name}`;
    const x=byTimer.get(key)||{name:t.name,vals:[],total:0};
    x.vals.push(d);x.total+=d;byTimer.set(key,x);
  }));
  const timers=[...byTimer.values()].sort((a,b)=>b.total-a.total);
  const maxTotal=Math.max(1,...timers.map(x=>x.total));
  let trend='Sem dados suficientes';
  if(ss.length>=2){
    const ordered=[...ss].sort((a,b)=>a.originalRecordedAt-b.originalRecordedAt);
    const half=Math.max(1,Math.floor(ordered.length/2));
    const a=ordered.slice(0,half).reduce((x,s)=>x+sessionTotal(s,s.savedAt),0)/half;
    const bArr=ordered.slice(-half);
    const b=bArr.reduce((x,s)=>x+sessionTotal(s,s.savedAt),0)/bArr.length;
    const pct=a?((b-a)/a*100):0;
    trend=pct<0?`${Math.abs(pct).toFixed(1).replace('.',',')}% mais rápido`:`${pct.toFixed(1).replace('.',',')}% mais lento`;
  }
  const timerRows=kind=>timers.map(x=>{
    let value;
    if(kind==='avg')value=x.total/x.vals.length;
    if(kind==='best')value=Math.min(...x.vals);
    if(kind==='worst')value=Math.max(...x.vals);
    return `<div class="row"><span>${esc(x.name)}</span><strong>${fmtDuration(value)}</strong></div>`;
  }).join('')||'<div class="muted">Sem dados.</div>';
  const percentRows=timers.map(x=>`<div><div class="row"><span>${esc(x.name)}</span><strong>${total?(x.total/total*100).toFixed(1).replace('.',','):0}%</strong></div><div class="bar"><span style="width:${Math.min(100,x.total/maxTotal*100)}%"></span></div></div>`).join('')||'<div class="muted">Sem dados.</div>';
  return shell(`<header class="topbar section-tab-header"><h1>Estatísticas</h1></header>
  <div class="stats-area-filter"><select id="statsArea"><option value="all">Todas as áreas</option>${areas.map(a=>`<option value="${esc(a.id)}" ${ui.statsArea===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
  <main class="content"><h2 class="section-title">Visão geral</h2>${count?`<div class="stats-grid">
    <section class="panel"><h3>Resumo</h3><div class="row"><span>Registros medidos</span><strong>${count}</strong></div><div class="row"><span>Tempo acumulado</span><strong>${fmtDuration(total)}</strong></div><div class="row"><span>Média por registro</span><strong>${fmtDuration(avg)}</strong></div></section>
    <section class="panel"><h3>Tempo total por registro</h3>${[...ss].sort((a,b)=>b.originalRecordedAt-a.originalRecordedAt).slice(0,12).map(s=>`<div class="row"><span>${esc(s.title)}</span><strong>${fmtDuration(sessionTotal(s,s.savedAt))}</strong></div>`).join('')}</section>
    <section class="panel"><h3>Tempo de cada cronômetro</h3>${timers.map(x=>`<div><div class="row"><span>${esc(x.name)}</span><strong>${fmtDuration(x.total)}</strong></div><div class="bar"><span style="width:${x.total/maxTotal*100}%"></span></div></div>`).join('')}</section>
    <section class="panel"><h3>Média por cronômetro</h3>${timerRows('avg')}</section>
    <section class="panel"><h3>Melhor tempo</h3>${timerRows('best')}</section>
    <section class="panel"><h3>Pior tempo</h3>${timerRows('worst')}</section>
    <section class="panel"><h3>Percentual no tempo total</h3>${percentRows}</section>
    <section class="panel"><h3>Evolução / tendência</h3><div class="stat-big">${esc(trend)}</div><p class="muted small">Comparação da média da primeira metade dos registros com a metade mais recente.</p></section>
  </div>`:`<div class="empty">As estatísticas aparecerão depois que você salvar registros com medição nesta área.</div>`}</main>`);
}
