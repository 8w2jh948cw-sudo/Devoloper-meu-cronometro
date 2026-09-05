/* ---------- RENDER: MODELOS AGRUPADOS POR ÁREA ---------- */
function renderModelsDrawer(){
  const all=activeModels(),areas=getAreas();
  const groups=areas.map(a=>({area:a,models:all.filter(m=>modelAreaId(m)===a.id)})).filter(g=>g.models.length);
  const list=groups.map(g=>`<div class="models-area-group"><div class="models-area-title">${esc(g.area.name)}</div><div class="models-list">${g.models.map(m=>{
    const i=all.findIndex(x=>x.id===m.id);
    return `<div class="model-list-item"><button class="model-main" data-choose-model="${m.id}"><strong>${esc(m.name)}</strong><span>${m.timers.filter(t=>!t.removedAt).length} cronômetro(s)</span></button>${ui.modelsEditing?`<div class="model-reorder"><button data-move-model="${m.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-move-model="${m.id}" data-dir="1" ${i===all.length-1?'disabled':''}>↓</button></div>`:`<button class="circle-button small-circle" data-model-options="${m.id}" aria-label="Opções de ${esc(m.name)}">${svgIcon('more')}</button>`}${ui.popover?.type==='modelOptions'&&ui.popover.id===m.id?`<div class="popover-backdrop" id="closePopover"></div><div class="model-popover floating-window"><button data-model-rename="${m.id}">Renomear</button><button data-model-edit="${m.id}">Editar</button><button data-model-dup="${m.id}">Duplicar</button><button data-model-delete="${m.id}" class="danger">Apagar</button></div>`:''}</div>`;
  }).join('')}</div></div>`).join('');
  return `<div class="models-drawer-overlay" id="modelsDrawerBackdrop"><aside class="models-drawer" role="dialog" aria-modal="true" aria-label="Modelos">
    <header class="topbar simple models-header models-drawer-header"><button class="text-button models-edit-button" id="toggleModelsEdit">${ui.modelsEditing?'Concluir':'Editar'}</button><h1>Modelos</h1><button class="circle-button models-close-button" id="closeModelsDrawer" aria-label="Fechar modelos">${svgIcon('close')}</button></header>
    <main class="content models-page"><button class="create-model-card" id="createModel">${svgIcon('plus')}<span>Criar novo modelo</span></button>${list||'<div class="empty">Nenhum modelo.</div>'}</main>
  </aside></div>`;
}

function renderEditModel(m){
  const ts=m.timers.filter(t=>!t.removedAt).sort((a,b)=>a.order-b.order),areas=getAreas();
  return `<div class="modal-wrap"><section class="sheet"><div class="sheet-head"><h2>${esc(m.name)}</h2><button class="chip" id="closeToModels">Concluir</button></div>
    <div class="model-area-row"><span>Área</span><select id="modelAreaSelect">${areas.map(a=>`<option value="${esc(a.id)}" ${modelAreaId(m)===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
    <div class="toolbar"><button id="renameModel">Renomear modelo</button><button id="addTemplate">＋ Cronômetro</button></div>
    ${ts.length?ts.map((t,i)=>`<div class="panel"><div class="row"><span class="model-timer-heading">${visualMarkerMarkup(t.marker)}<strong>${esc(t.name)}</strong></span><span class="toolbar"><button data-move-template="${t.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-move-template="${t.id}" data-dir="1" ${i===ts.length-1?'disabled':''}>↓</button></span></div><div class="toolbar"><button data-edit-template="${t.id}">Editar nome</button><button data-model-marker="${t.id}">Marcador</button><button data-remove-template="${t.id}" class="danger">Remover</button></div></div>`).join(''):'<div class="empty">Este modelo está vazio. Você pode mantê-lo assim ou adicionar cronômetros.</div>'}
  </section></div>`;
}

/* ---------- DETALHES DA TELA INICIAL ---------- */
function renderSessionMenu(){
  const s=data.current;
  return `<div class="modal-wrap"><section class="sheet details-sheet" role="dialog" aria-modal="true">
    <div class="sheet-head liquid-head"><button class="circle-button glass detail-close-button" id="closeModal" aria-label="Fechar">${svgIcon('close')}</button><h2>Detalhes</h2><span class="sheet-spacer"></span></div>
    <div class="sheet-body">
      <section class="sheet-card notes-detail-card"><textarea id="currentNote" class="notes-box" rows="5" placeholder="Notas">${esc(s.note)}</textarea></section>
      <h3 class="detail-section-label">Tamanho dos cronômetros</h3>
      <section class="sheet-card timer-size-detail-card"><div class="detail-size-options animation-speed-options" role="group" aria-label="Tamanho dos cronômetros">
        <button data-timer-size="small" class="${data.settings.timerSize==='small'?'selected':''}">Pequeno</button>
        <button data-timer-size="medium" class="${data.settings.timerSize==='medium'?'selected':''}">Médio</button>
        <button data-timer-size="large" class="${data.settings.timerSize==='large'?'selected':''}">Grande</button>
      </div></section>
      <section class="sheet-card detail-action-card"><button class="detail-action" id="menuCustomize">Reordenar cronômetros</button></section>
      <section class="sheet-card detail-action-card"><button class="detail-action" id="saveAsNewModel">Salvar como novo modelo</button></section>
    </div>
  </section></div>`;
}
function renderOrganize(){
  const s=data.current;
  return `<div class="modal-wrap"><section class="sheet"><div class="sheet-head"><h2>Reordenar cronômetros</h2><button class="chip" id="closeModal">Concluir</button></div>${s.timers.sort((a,b)=>a.order-b.order).map((t,i)=>`<div class="panel"><div class="row"><span class="model-timer-heading">${visualMarkerMarkup(t.marker)}<strong>${esc(t.name)}</strong></span><span class="toolbar"><button data-move-current="${t.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-move-current="${t.id}" data-dir="1" ${i===s.timers.length-1?'disabled':''}>↓</button></span></div><div class="toolbar"><button data-rename-current="${t.id}">Renomear</button><button data-current-marker="${t.id}">Marcador</button><button data-remove-current="${t.id}" class="danger">Remover</button></div></div>`).join('')}</section></div>`;
}

/* ---------- DETALHE DE REGISTRO SALVO ---------- */
function renderSessionDetail(s){
  const model=modelById(s.modelId);
  const timers=s.isNoMeasurement?[]:s.timers.filter(t=>timerDuration(t,s.savedAt)>0).sort((a,b)=>a.order-b.order);
  return `<div class="modal-wrap record-detail-wrap"><section class="sheet record-detail-sheet"><div class="sheet-head record-detail-head"><button class="circle-button glass record-detail-close" id="closeModal" aria-label="Fechar">${svgIcon('close')}</button><button class="record-title-button" data-edit-session-title="${s.id}"><span>${esc(s.title)}</span>${svgIcon('pencil')}</button><button class="record-detail-check" id="closeRecordDetail" aria-label="Concluir">${svgIcon('check')}</button></div><div class="record-detail-body">
    <div class="record-actions">${!model?`<button data-rebuild-model="${s.id}">Criar modelo deste registro</button>`:''}<button data-delete-session="${s.id}" class="danger">Excluir</button></div>
    <section class="panel record-summary"><div class="row"><span>Área</span><strong>${esc(areaById(sessionAreaId(s)).name)}</strong></div><div class="row"><span>Modelo de origem</span><strong>${esc(model ? (model.deletedAt ? 'Modelo excluído' : model.name) : 'Modelo excluído')}</strong></div>${s.isNoMeasurement?'<div class="row"><span class="badge">Sem medição</span></div>':`<div class="row"><span>Tempo total</span><strong class="detail-time-with-icon">${svgIcon('timers')}<span>${fmtDuration(sessionTotal(s,s.savedAt))}</span></strong></div><div class="row"><span>Tempo decorrido</span><strong>${fmtDuration(sessionElapsedNet(s,s.savedAt))}</strong></div><div class="row"><span>Pausas</span><strong>${fmtDuration(pauseTotal(s,s.savedAt))}</strong></div>`}<div class="row"><span>Registrado originalmente em</span><span>${fmtDateTime(s.originalRecordedAt)}</span></div>${s.restoredAt?`<div class="row"><span>Restaurado em</span><span>${fmtDateTime(s.restoredAt)}</span></div>`:''}</section>
    <div class="record-timers-list">${timers.map(t=>`<details class="record-timer-card"><summary><span class="record-timer-title">${visualMarkerMarkup(t.marker,'record-inline-marker')}${esc(t.name)}${t.isAdhoc?'<span class="badge">Etapa avulsa</span>':''}${t.isRemoved?'<span class="badge">Removido</span>':''}</span><span class="record-timer-time">${svgIcon('timers')}<strong>${fmtDuration(timerDuration(t,s.savedAt))}</strong></span></summary><div class="record-timer-extra"><div class="muted small record-interval-label">Horários e intervalos</div>${t.intervals.map(i=>`<div class="row small"><span>${fmtDateTime(i.startedAt)}</span><span>${i.endedAt?fmtDateTime(i.endedAt):'aberto'}</span></div>`).join('')}<button class="action" data-correct-time="${s.id}" data-timer-id="${t.id}">Corrigir tempo</button></div></details>`).join('')}</div>
    <section class="panel"><label for="detailNote"><strong>Nota</strong></label><textarea id="detailNote" rows="4" data-note-session="${s.id}" placeholder="Notas">${esc(s.note)}</textarea><div id="noteStatus" class="muted small"></div></section>
  </div></section></div>`;
}

/* ---------- FUNÇÕES DE TEXTO SEM prompt() NATIVO ---------- */
async function addAdhoc(){
  const s=data.current;if(!s)return;
  const raw=await iosTextPrompt({title:'Novo cronômetro',message:'Dê um nome ao cronômetro avulso.',placeholder:'Nome do cronômetro'});
  const name=String(raw??'').trim();if(!name)return;
  if(s.timers.some(t=>t.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Já existe um cronômetro com esse nome neste registro.');return;}
  s.timers.push({id:uid(),templateId:null,name,order:s.timers.length,isAdhoc:true,isRemoved:false,intervals:[],correctedDurationMs:null,marker:null});
  s.customized=true;await persistCurrent();render();
}
async function renameCurrentTimer(id){
  const s=data.current,rt=s?.timers.find(t=>t.id===id);if(!rt)return;
  const raw=await iosTextPrompt({title:'Renomear cronômetro',value:rt.name,placeholder:'Nome'});
  const n=String(raw??'').trim();if(!n)return;
  rt.name=n;s.customized=true;await persistCurrent();render();
}
async function createModel(){
  const raw=await iosTextPrompt({title:'Novo modelo',message:'Escolha um nome para o novo modelo.',placeholder:'Nome do modelo'});
  const name=String(raw??'').trim();if(!name)return;
  if(activeModels().some(m=>m.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Já existe um modelo com esse nome.');return;}
  const t=now(),m={id:uid(),name,areaId:'general',createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:[]};
  data.models.push(m);await put('models',m);ui.modal={type:'editModel',id:m.id};render();
}
async function renameModel(m){
  const raw=await iosTextPrompt({title:'Renomear modelo',value:m.name,placeholder:'Nome do modelo'});
  const n=String(raw??'').trim();if(!n)return;
  if(activeModels().some(x=>x.id!==m.id&&x.name.toLocaleLowerCase()===n.toLocaleLowerCase())){alert('Já existe um modelo com esse nome.');return;}
  m.name=n;m.updatedAt=now();await put('models',m);
  if(data.current?.modelId===m.id){data.current.modelNameSnapshot=n;await persistCurrent();}
  render();
}
async function addTemplate(m){
  const raw=await iosTextPrompt({title:'Novo cronômetro',message:`Adicionar ao modelo “${m.name}”.`,placeholder:'Nome do cronômetro'});
  const name=String(raw??'').trim();if(!name)return;
  if(m.timers.some(t=>!t.removedAt&&t.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Neste modelo, os cronômetros precisam ter nomes diferentes.');return;}
  m.timers.push({id:uid(),name,order:m.timers.filter(t=>!t.removedAt).length,createdAt:now(),removedAt:null,marker:null});
  m.updatedAt=now();await put('models',m);render();
}
async function editTemplate(m,tid){
  const t=m.timers.find(x=>x.id===tid);if(!t)return;
  const raw=await iosTextPrompt({title:'Renomear cronômetro',value:t.name,placeholder:'Nome'});
  const n=String(raw??'').trim();if(!n)return;
  if(m.timers.some(x=>x.id!==tid&&!x.removedAt&&x.name.toLocaleLowerCase()===n.toLocaleLowerCase())){alert('Neste modelo, os cronômetros precisam ter nomes diferentes.');return;}
  t.name=n;m.updatedAt=now();await put('models',m);
  if(data.current?.modelId===m.id){
    const rt=data.current.timers.find(x=>x.templateId===tid);
    if(rt){rt.name=n;await persistCurrent();}
  }
  render();
}
async function duplicateModel(m){
  let n=2,name=`${m.name} (${n})`;const names=new Set(activeModels().map(x=>x.name));
  while(names.has(name)){n++;name=`${m.name} (${n})`;}
  const t=now();
  const c={id:uid(),name,areaId:modelAreaId(m),createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:m.timers.filter(x=>!x.removedAt).sort((a,b)=>a.order-b.order).map((x,i)=>({id:uid(),name:x.name,order:i,createdAt:t,removedAt:null,marker:clone(x.marker||null)}))};
  data.models.push(c);await put('models',c);toast('Modelo duplicado');render();
}
async function rebuildModelFromSession(s){
  if(modelById(s.modelId)){alert('Esta ação só fica disponível depois que o modelo de origem é excluído definitivamente.');return;}
  const raw=await iosTextPrompt({title:'Criar modelo deste registro',value:s.modelNameSnapshot||'Novo modelo',placeholder:'Nome do modelo'});
  const base=String(raw??'').trim();if(!base)return;
  let name=base,n=2;const names=new Set(activeModels().map(m=>m.name));while(names.has(name)){name=`${base} (${n++})`;}
  const chosen=[];
  for(const rt of s.timers.sort((a,b)=>a.order-b.order)){if(confirm(`Incluir “${rt.name}” no novo modelo?`))chosen.push(rt);}
  const t=now(),m={id:uid(),name,areaId:sessionAreaId(s),createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:chosen.map((rt,i)=>({id:uid(),name:rt.name,order:i,createdAt:t,removedAt:null,marker:clone(rt.marker||null)}))};
  data.models.push(m);await put('models',m);toast('Novo modelo criado');ui.modal={type:'editModel',id:m.id};render();
}
async function correctTimer(s,rt){
  const current=timerDuration(rt);
  const raw=await iosTextPrompt({title:'Corrigir tempo',message:`Novo tempo efetivo de “${rt.name}” em minutos.`,value:(current/60000).toFixed(1).replace('.',','),inputMode:'decimal',confirmText:'Aplicar'});
  if(raw==null)return;
  const mins=Number(String(raw).replace(',','.'));
  if(!Number.isFinite(mins)||mins<0){alert('Digite um número válido.');return;}
  if(!confirm('Aplicar esta correção de tempo?'))return;
  rt.correctedDurationMs=Math.round(mins*60000);await put('sessions',s);toast('Tempo corrigido');render();
}
async function editSessionTitle(s){
  const raw=await iosTextPrompt({title:'Editar título',value:s.title,placeholder:'Título do registro'});
  const n=String(raw??'').trim();if(!n)return;
  s.title=n;s.manualTitle=true;await put('sessions',s);render();
}
async function saveCurrentLayoutAsNewModel(){
  const s=data.current;if(!s)return;
  const raw=await iosTextPrompt({title:'Salvar como novo modelo',message:'A configuração atual dos cronômetros será copiada sem alterar este registro.',placeholder:'Nome do novo modelo'});
  const base=String(raw??'').trim();if(!base)return;
  if(activeModels().some(m=>m.name.toLocaleLowerCase()===base.toLocaleLowerCase())){alert('Já existe um modelo com esse nome.');return;}
  const t=now();
  const model={id:uid(),name:base,areaId:s.areaId||modelAreaId(modelById(s.modelId)),createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),
    timers:s.timers.filter(t=>!t.removedAt&&!t.isRemoved).sort((a,b)=>(a.order??0)-(b.order??0)).map((rt,i)=>({id:uid(),name:rt.name||`Cronômetro ${i+1}`,order:i,createdAt:t,removedAt:null,marker:clone(rt.marker||null)}))
  };
  data.models.push(model);await put('models',model);toast('Novo modelo salvo');render();
}
async function setActiveIconFromSvgCode(){
  const raw=await iosTextPrompt({title:'Código SVG',message:'Cole o código SVG completo.',placeholder:'<svg ...>...</svg>',confirmText:'Usar SVG',multiline:true});
  const code=String(raw??'').trim();if(!code)return;
  if(!/^<svg[\s>]/i.test(code)){alert('O código precisa começar com uma tag <svg>.');return;}
  data.settings.activeTimerIconData=svgTextToDataUrl(sanitizeSvg(code));
  data.settings.activeTimerIconSource='svg';data.settings.activeTimerIconName='SVG colado';
  await persistSettings();render();
}
async function setActiveIconFromUrl(){
  const raw=await iosTextPrompt({title:'Link do SVG',message:'Cole um link direto para um arquivo SVG.',placeholder:'https://…/icone.svg',confirmText:'Importar'});
  const text=String(raw??'').trim();if(!text)return;
  let url;try{url=new URL(text,location.href);if(!/^https?:$/.test(url.protocol))throw new Error();}catch(_){alert('Digite um link http ou https válido.');return;}
  try{
    const response=await fetch(url.href,{mode:'cors',cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const svg=sanitizeSvg(await response.text());
    if(!/<svg[\s>]/i.test(svg))throw new Error('O link não retornou um SVG');
    data.settings.activeTimerIconData=svgTextToDataUrl(svg);data.settings.activeTimerIconSource='svg';data.settings.activeTimerIconName='SVG por link';
    toast('SVG importado e salvo no aparelho');
  }catch(_){
    data.settings.activeTimerIconData=url.href;data.settings.activeTimerIconSource='remoteSvg';data.settings.activeTimerIconName='SVG por link';
    toast('Link salvo; este ícone pode precisar de internet');
  }
  await persistSettings();render();
}

/* ---------- SALVAR REGISTRO ---------- */
async function saveSession(){
  const s=data.current;if(!s)return false;const t=now();
  if(s.globalPaused){s.globalPaused=false;s.pausedActiveTimerIds=[];}
  s.timers.forEach(rt=>{const oi=openInterval(rt);if(oi)oi.endedAt=t;});
  endPause(s,t);
  const measured=sessionTotal(s,t)>0;
  if(!measured){
    let note=s.note.trim();
    if(!note){
      const raw=await iosTextPrompt({title:'Registro sem medição',message:'Escreva uma nota explicando este registro antes de salvar.',placeholder:'Nota',confirmText:'Salvar',multiline:true});
      note=String(raw??'').trim();
    }
    if(!note){alert('A nota é obrigatória para salvar sem medição.');return false;}
    s.note=note;s.isNoMeasurement=true;
  }
  if(!s.manualTitle)s.title=`(sem título) ${fmtDateTime(s.firstTimerStartedAt??s.openedAt)}`;
  s.areaId=s.areaId||modelAreaId(modelById(s.modelId));
  s.savedAt=t;s.originalRecordedAt=s.firstTimerStartedAt??s.openedAt;s.status='saved';

  const adhoc=s.timers.filter(x=>x.isAdhoc);
  const model=modelById(s.modelId);
  if(adhoc.length&&model){
    for(const rt of adhoc){
      if(confirm(`Incorporar “${rt.name}” ao modelo “${model.name}” para os próximos registros?`)){
        const templ={id:uid(),name:rt.name,order:model.timers.filter(x=>!x.removedAt).length,createdAt:t,removedAt:null,marker:clone(rt.marker||null)};
        model.timers.push(templ);model.updatedAt=t;rt.templateId=templ.id;rt.isAdhoc=false;await put('models',model);
      }
    }
  }
  await put('sessions',clone(s));data.sessions.unshift(clone(s));
  const sameModel=modelById(s.modelId);data.current=sameModel?newSession(sameModel):null;await putState('current',data.current);
  stopTimerLoopAudio();haptic('save');render();showSavedConfirmation();return true;
}
