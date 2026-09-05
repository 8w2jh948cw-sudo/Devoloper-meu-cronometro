/* Clientes */
function fuzzyClientScore(query,name){
  const q=normalizeSearchText(query),n=normalizeSearchText(name);if(!q)return 1;if(n===q)return 100;if(n.startsWith(q))return 90;if(n.includes(q))return 75;
  const qp=q.split(/\s+/).filter(Boolean),np=n.split(/\s+/);let score=0;for(const p of qp){if(np.some(x=>x.startsWith(p)))score+=18;else if(np.some(x=>x.includes(p)))score+=10;}
  let i=0;for(const ch of n){if(ch===q[i])i++;if(i===q.length)break;}if(i===q.length)score+=12;return score;
}
function clientSearchResults(query,areaId=activeAreaId()){
  return clientsForArea(areaId).map(c=>({c,score:fuzzyClientScore(query,c.name)})).filter(x=>!query||x.score>=12).sort((a,b)=>b.score-a.score||a.c.name.localeCompare(b.c.name,'pt-BR')).slice(0,8).map(x=>x.c);
}
async function createClient(name,areaId=activeAreaId()){
  const clean=String(name||'').trim();if(!clean)return null;const existing=clientsForArea(areaId).find(c=>normalizeSearchText(c.name)===normalizeSearchText(clean));if(existing)return existing;
  const c={id:`client-${uid()}`,areaId,name:clean,createdAt:now(),updatedAt:now(),deletedAt:null};data.settings.clients=[...(data.settings.clients||[]),c];await persistSettings();return c;
}
async function setSessionClient(session,client){
  if(!session)return;session.clientId=client?.id||null;session.clientNameSnapshot=client?.name||'';
  if(session.status==='saved')await put('sessions',session);else await persistCurrent();
}
function renderClientPicker(){
  const target=ui.modal?.target||'current',session=target==='current'?data.current:data.sessions.find(s=>s.id===ui.modal?.sessionId),aid=sessionAreaId(session)||activeAreaId();
  return `<div class="client-picker-wrap"><section class="client-picker-card"><div class="client-picker-head"><h2>Selecionar cliente</h2><button class="client-picker-close" id="closeClientPicker">${svgIcon('close')}</button></div><input class="client-picker-search" id="clientPickerSearch" placeholder="Buscar ou cadastrar cliente" autocomplete="off"><div class="client-picker-list" id="clientPickerList"></div></section></div>`;
}
function fillClientPickerList(query=''){
  const list=document.getElementById('clientPickerList');if(!list)return;const session=ui.modal?.target==='current'?data.current:data.sessions.find(s=>s.id===ui.modal?.sessionId),aid=sessionAreaId(session)||activeAreaId();const results=clientSearchResults(query,aid);const q=String(query||'').trim();
  list.innerHTML=`<button class="client-picker-item none" data-pick-client=""><strong>${esc(data.settings.clientEmptyLabel||'Sem cliente')}</strong><small>Salvar sem vincular uma cliente</small></button>${results.map(c=>`<button class="client-picker-item" data-pick-client="${esc(c.id)}"><strong>${esc(c.name)}</strong><small>${data.sessions.filter(s=>s.status==='saved'&&s.clientId===c.id).length} atendimento(s)</small></button>`).join('')}${q&&!results.some(c=>normalizeSearchText(c.name)===normalizeSearchText(q))?`<button class="client-picker-item create" data-create-client="${esc(q)}"><strong>＋ Cadastrar “${esc(q)}”</strong><small>Criar uma nova cliente nesta área</small></button>`:''}`;
  bindClientPickerItems();
}
function closeClientPicker(){ui.modal=null;render();}
function bindClientPickerItems(){
  document.querySelectorAll('[data-pick-client]').forEach(b=>b.onclick=async()=>{const session=ui.modal?.target==='current'?data.current:data.sessions.find(s=>s.id===ui.modal?.sessionId),c=b.dataset.pickClient?clientById(b.dataset.pickClient):null;await setSessionClient(session,c);ui.modal=null;render();});
  document.querySelectorAll('[data-create-client]').forEach(b=>b.onclick=async()=>{const session=ui.modal?.target==='current'?data.current:data.sessions.find(s=>s.id===ui.modal?.sessionId),c=await createClient(b.dataset.createClient,sessionAreaId(session)||activeAreaId());await setSessionClient(session,c);ui.modal=null;render();});
}
function renderClientProfile(clientId){
  const c=clientById(clientId);if(!c)return '';
  const ss=data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt&&s.clientId===c.id).sort((a,b)=>recordDateMs(b)-recordDateMs(a));const measured=ss.filter(s=>!s.isNoMeasurement);const avg=measured.length?measured.reduce((a,s)=>a+sessionTotal(s,s.savedAt),0)/measured.length:0;
  const clientNotes=ss.filter(s=>String(s.clientNote||'').trim());const appointmentNotes=ss.filter(s=>String(s.appointmentNote||s.note||'').trim());
  const entries=(arr,key)=>arr.map(s=>`<article class="client-note-entry"><div class="meta">${esc(fmtDateTime(recordDateMs(s)))} · ${esc(s.modelNameSnapshot||modelById(s.modelId)?.name||'Modelo')}</div><p>${esc(String(s[key]||(key==='appointmentNote'?s.note:'')||''))}</p><button class="client-record-open" data-open-client-record="${s.id}">Abrir atendimento</button></article>`).join('')||'<div class="muted small">Nenhuma anotação.</div>';
  return `<div class="client-profile-wrap"><section class="client-profile-card"><div class="client-profile-head"><h2>${esc(c.name)}</h2><button class="client-profile-close" id="closeClientProfile">${svgIcon('close')}</button></div><div class="client-profile-summary"><div><small>Atendimentos</small><strong>${ss.length}</strong></div><div><small>Tempo médio</small><strong>${measured.length?fmtDuration(avg):'—'}</strong></div></div><section class="client-profile-section"><h3>Anotações sobre a cliente</h3>${entries(clientNotes,'clientNote')}</section><section class="client-profile-section"><h3>Anotações dos atendimentos</h3>${entries(appointmentNotes,'appointmentNote')}</section></section></div>`;
}

/* Área/tipo */
function renderAreaTypeChooser(name,id=null){
  return `<div class="area-type-wrap"><section class="area-type-card"><div class="area-type-head"><h2>Tipo da área</h2><button class="area-type-close" id="closeAreaType">${svgIcon('close')}</button></div><p class="muted small">Escolha quais recursos aparecem em “${esc(name)}”.</p><div class="area-type-options"><button data-area-type-choice="clients"><strong>Clientes / atendimentos</strong><small>Ativa cadastro de clientes, anotações e métricas por cliente.</small></button><button data-area-type-choice="generic"><strong>Genérica</strong><small>Usa apenas cronômetros, modelos, histórico e estatísticas universais.</small></button></div></section></div>`;
}
async function addArea(){
  const raw=await iosTextPrompt({title:'Nova área',message:'Exemplos: Clientes, Faxina, Estudos.',placeholder:'Nome da área'});const name=String(raw??'').trim();if(!name)return;if(getAreas().some(a=>normalizeSearchText(a.name)===normalizeSearchText(name))){alert('Já existe uma área com esse nome.');return;}ui.modal={type:'areaTypeNew',pendingAreaName:name};render();
}
async function createAreaWithType(name,type){
  const a={id:`area-${uid()}`,name,type:type==='clients'?'clients':'generic'};data.settings.areas=[...getAreas(),a];data.settings.activeAreaId=a.id;await persistSettings();ui.modal=null;render();
}
async function changeAreaType(id,type){data.settings.areas=getAreas().map(a=>a.id===id?{...a,type:type==='clients'?'clients':'generic'}:a);await persistSettings();ui.modal=null;render();}
async function deleteArea(id){
  if(id==='general')return;const area=areaById(id);if(!confirm(`Apagar a área “${area.name}”? Modelos e registros dessa área serão reclassificados como “Sem área”. Nenhum tempo ou anotação será apagado.`))return;
  data.settings.areas=getAreas().filter(a=>a.id!==id);for(const m of data.models){if(m.areaId===id){m.areaId='general';await put('models',m);}}for(const s of data.sessions){if(s.areaId===id){s.areaId='general';await put('sessions',s);}}if(data.current?.areaId===id){data.current.areaId='general';await persistCurrent();}if(data.settings.activeAreaId===id)data.settings.activeAreaId='general';await persistSettings();render();
}

/* Render de Modelos agrupados por Área. */
function renderModelsDrawer(){
  const areas=getAreas().slice().sort((a,b)=>a.id==='general'?1:b.id==='general'?-1:a.name.localeCompare(b.name,'pt-BR'));const active=activeAreaId();
  const groups=areas.map(a=>{const ms=activeModels().filter(m=>modelAreaId(m)===a.id).sort((x,y)=>(x.sortOrder??0)-(y.sortOrder??0));const rows=ms.map(m=>`<div class="model-row ${data.current?.modelId===m.id?'current':''}"><button class="model-main" data-choose-model="${m.id}"><span>${esc(m.name)}</span></button>${ui.modelsEditing?`<button class="model-more" data-model-options="${m.id}" aria-label="Opções">${svgIcon('more')}</button>`:''}</div>`).join('');return `<section class="models-area-group ${a.id===active?'active':'inactive'}"><button class="models-area-heading ${a.id===active?'active':''}" data-activate-area="${a.id}"><span>${esc(a.name)} <span class="area-type-pill">${esc(areaTypeLabel(a.type))}</span></span><span>${ms.length} modelo${ms.length===1?'':'s'}</span></button>${rows||'<div class="models-area-empty">Nenhum modelo nesta área.</div>'}</section>`;}).join('');
  return `<div class="models-drawer-backdrop" id="modelsDrawerBackdrop"><aside class="models-drawer"><div class="models-drawer-head"><button id="toggleModelsEdit">${ui.modelsEditing?'Concluir':'Editar'}</button><div><strong>Modelos</strong>${activeAreaBadge()}</div><button class="circle-button" id="closeModelsDrawer">${svgIcon('close')}</button></div><main class="models-page"><button class="create-model-card" id="createModel">${svgIcon('plus')}<span>Criar modelo em ${esc(activeArea().name)}</span></button>${groups}</main></aside></div>`;
}

/* Tela inicial: Área sempre aparente. Em áreas de cliente, cliente substitui o título livre como identificação. */
function renderTimers(){
  const models=activeModels(),s=data.current;
  if(!models.length)return shell(`<header class="topbar simple"><div class="section-profile-head">${activeAreaBadge()}<h1>Cronômetro</h1></div></header><main class="content"><div class="empty">Nenhum modelo criado.<br><br><button class="ios-button" id="createFirst">Criar modelo em ${esc(activeArea().name)}</button></div></main>`);
  if(!s){const own=modelOptionsForActiveArea();return shell(`<header class="topbar simple"><div class="section-profile-head">${activeAreaBadge()}<h1>Cronômetro</h1></div></header><main class="content"><div class="empty">Escolha um modelo para começar.<br><br><button class="ios-button" id="modelsBack">Ver modelos</button></div></main>${ui.timerView==='models'?renderModelsDrawer():''}`);}
  const model=modelById(s.modelId),timerMode=currentTimerMode(),central=timerMode.layout==='central';
  const cards=s.timers.sort((a,b)=>a.order-b.order).map(rt=>`<button class="timer-card ${central?'central':''} ${timerStateClass(s,rt)}" data-timer="${rt.id}" aria-label="${esc(rt.name)}, ${fmtDuration(timerDuration(rt))}">${timerStateIcon(s,rt)}<span class="timer-name-wrap">${visualMarkerMarkup(rt.marker)}<span class="name ${timerNameFit(rt.name)}">${esc(rt.name)}${rt.isAdhoc?'<span class="badge">Etapa avulsa</span>':''}</span></span><span class="time">${fmtDuration(timerDuration(rt))}</span></button>`).join('');
  const running=s.timers.some(isTimerActive),blink=running&&data.settings.blinkTotalColon,totalText=fmtDuration(sessionTotal(s)),widthClass=totalText.length>=9?'total-xlong':totalText.length>=7?'total-hours':'';
  const clientMode=isClientArea(sessionAreaId(s));const display=clientMode?clientLabelForSession(s):currentTitle();
  const titlePopover=!clientMode&&ui.popover?.type==='title'?`<div class="popover-backdrop" id="closePopover"></div><div class="title-popover floating-window"><button id="titleRename">Renomear</button><button id="titleEditModel">Editar modelo</button><button id="titleDiscard" class="danger">Descartar</button></div>`:'';
  const modelsDrawer=ui.timerView==='models'?renderModelsDrawer():'';
  return shell(`<header class="topbar timer-topbar">${activeAreaBadge(areaById(sessionAreaId(s)))}<div class="header-row"><button class="circle-button" id="modelsBack" aria-label="Modelos">${svgIcon('back')}</button><button class="current-title ${clientMode&&!s.clientId?'untitled':(!clientMode&&!s.manualTitle?'untitled':'')}" id="currentTitleButton">${esc(display)}</button><button class="circle-button" id="sessionMenu" aria-label="Detalhes">${svgIcon('more')}</button>${titlePopover}</div><div class="current-model-name">${esc(model?.name||s.modelNameSnapshot)}</div>${s.customized?'<div class="status-line">Personalizado neste registro</div>':''}</header><main class="content timer-content"><div class="timer-list">${cards}<button class="add-card" id="addAdhoc">${svgIcon('plus')}<span>Adicionar cronômetro</span></button></div></main><div class="floating-actions timer-actions ${widthClass}"><section class="total-card floating-card ${running?'running':''}"><span class="total-icon">${svgIcon('clock')}</span><span class="total-copy"><small>Tempo total</small><strong class="total-time">${fmtDurationWithBlinkingColons(sessionTotal(s),blink)}</strong></span></section><button class="save-btn" id="saveBtn">${svgIcon('check')}<span>Salvar</span></button></div>${modelsDrawer}`);
}

/* Histórico sempre segue a Área/perfil ativo. */
function historyMatchesQuery(s,q){
  const nq=normalizeSearchText(q);if(!nq)return true;if(ui.historyClientId)return s.clientId===ui.historyClientId;
  return [sessionDisplayTitle(s),s.title,s.modelNameSnapshot,clientLabelForSession(s)].some(v=>normalizeSearchText(v).includes(nq));
}
function historyClientSuggestionsMarkup(){
  if(!isClientArea()||!ui.historyQuery.trim()||ui.historyClientId)return '';
  const rs=clientSearchResults(ui.historyQuery);if(!rs.length)return '';
  return `<div class="history-search-suggestions">${rs.slice(0,5).map(c=>`<button data-history-client="${c.id}"><strong>${esc(c.name)}</strong><small>${data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt&&s.clientId===c.id).length} atendimento(s)</small></button>`).join('')}</div>`;
}
function renderHistory(){
  const aid=activeAreaId(),sessions=data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt&&sessionAreaId(s)===aid).sort((a,b)=>recordDateMs(b)-recordDateMs(a));
  const filtered=sessions.filter(s=>historyMatchesQuery(s,ui.historyQuery)&&(ui.historyModel==='all'||s.modelId===ui.historyModel)&&(!ui.historyDate||dayKey(recordDateMs(s))===ui.historyDate));
  const groups={};filtered.forEach(s=>{const k=dayKey(recordDateMs(s));(groups[k]??=[]).push(s);});
  const list=Object.entries(groups).map(([k,arr])=>`<div class="history-day">${fmtDate(new Date(k+'T12:00:00').getTime())}</div>${arr.map(s=>{const clientMode=isClientArea(sessionAreaId(s)),title=sessionDisplayTitle(s);return `<button class="history-card" data-session="${s.id}"><div class="top"><strong class="${clientMode?'history-card-client-name':''}">${clientMode?personIconMarkup():''}${esc(title)}</strong>${s.isNoMeasurement?'':`<span class="history-total">${svgIcon('timers')}<span>${fmtDuration(sessionTotal(s,s.savedAt))}</span></span>`}</div><div class="history-meta">${esc(s.modelNameSnapshot||modelById(s.modelId)?.name||'Modelo')} · ${esc(fmtDateTime(recordDateMs(s)))}</div>${s.isNoMeasurement?'<span class="badge">Sem medição</span>':''}${s.restoredAt?'<span class="badge">Restaurado</span>':''}</button>`;}).join('')}`).join('');
  const modelOptions=modelOptionsForActiveArea();const searchPlaceholder=isClientArea()?'Buscar cliente ou registro':'Buscar título ou registro';
  return shell(`<header class="topbar simple section-tab-header history-header"><span></span><div class="section-profile-head">${activeAreaBadge()}<h1>Registros</h1></div><button class="header-pill" id="historyTrash">Apagados</button></header><main class="content history-content"><div class="filters history-filters history-filters-v082"><div class="history-search-wrap"><input id="historySearch" placeholder="${esc(searchPlaceholder)}" value="${esc(ui.historyQuery)}" autocomplete="off">${historyClientSuggestionsMarkup()}</div><select id="historyModel"><option value="all">Todos os modelos desta área</option>${modelOptions.map(m=>`<option value="${m.id}" ${ui.historyModel===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select><div class="date-filter date-filter-v082 ${ui.historyDate?'has-value':''}"><span class="date-placeholder">Filtrar por data</span><input id="historyDate" type="date" value="${esc(ui.historyDate)}">${ui.historyDate?`<button id="historyDateClear" aria-label="Limpar data">${svgIcon('close')}</button>`:''}</div></div>${list||'<div class="empty">Nenhum registro encontrado nesta área.</div>'}</main>`);
}
