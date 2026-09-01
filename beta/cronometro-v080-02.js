
'use strict';

function hasPendingSession(s){return !!(s&&(s.firstTimerStartedAt||sessionTotal(s)>0||s.note?.trim()||s.customized||s.manualTitle));}

async function ensureCurrent(modelId=null){
  if(data.current?.status==='active') return data.current;
  const model=modelById(modelId)||activeModels()[0];
  if(!model) return null;
  data.current=newSession(model); await persistCurrent(); return data.current;
}

async function openModelAfterPendingChoice(id,action){
  const m=modelById(id);
  if(!m)return;

  if(action==='save'){
    const ok=await saveSession();
    if(!ok)return;
  }else if(action==='discard'){
    stopTimerLoopAudio();
    data.current=null;
    await putState('current',null);
  }else{
    ui.modal=null;
    ui.popover=null;
    ui.timerView='timers';
    render();
    return;
  }

  stopTimerLoopAudio();
  data.current=newSession(m);
  await persistCurrent();
  ui.timerView='timers';
  ui.popover=null;
  if(!m.timers.some(t=>!t.removedAt)) ui.modal={type:'editModel',id:m.id};
  else ui.modal=null;
  render();
}

async function chooseModel(id){
  const m=modelById(id);
  if(!m)return;

  if(data.current && data.current.status==='active' && data.current.modelId!==id && hasPendingSession(data.current)){
    ui.modal={type:'pendingModelSwitch',targetModelId:id};
    ui.popover=null;
    render();
    return;
  }

  stopTimerLoopAudio();
  data.current=newSession(m);
  await persistCurrent();
  ui.timerView='timers';
  ui.popover=null;
  if(!m.timers.some(t=>!t.removedAt)) ui.modal={type:'editModel',id:m.id};
  else ui.modal=null;
  render();
}

async function tapTimer(timerId){
  const s=data.current; if(!s)return;
  const rt=s.timers.find(t=>t.id===timerId); if(!rt)return;
  const t=now();
  if(!s.firstTimerStartedAt) s.firstTimerStartedAt=t;
  const active=s.timers.find(x=>isTimerActive(x));
  if(active?.id===rt.id){
    openInterval(rt).endedAt=t;
    startPause(s,t);
    syncTimerLoopAudio(true);
    await persistCurrent(); haptic('light'); render(); return;
  }
  const snap=clone(s);
  if(active){ openInterval(active).endedAt=t; }
  else { endPause(s,t); }
  rt.intervals.push({id:uid(),startedAt:t,endedAt:null,origin:active?'switch':'resume'});
  syncTimerLoopAudio(true);
  await persistCurrent();
  if(active){ setUndo(snap); haptic('switch'); } else { haptic('light'); render(); }
}

async function addAdhoc(){
  const s=data.current;if(!s)return;
  const name=(prompt('Nome do cronômetro avulso:','')||'').trim(); if(!name)return;
  if(s.timers.some(t=>t.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Já existe um cronômetro com esse nome neste registro.');return;}
  s.timers.push({id:uid(),templateId:null,name,order:s.timers.length,isAdhoc:true,isRemoved:false,intervals:[],correctedDurationMs:null});
  s.customized=true; await persistCurrent(); render();
}
async function renameCurrentTimer(id){ const s=data.current,rt=s?.timers.find(t=>t.id===id);if(!rt)return; const n=(prompt('Novo nome:',rt.name)||'').trim();if(!n)return;rt.name=n;s.customized=true;await persistCurrent();render(); }
async function removeCurrentTimer(id){
  const s=data.current,rt=s?.timers.find(t=>t.id===id);if(!rt)return;
  if(timerDuration(rt)>0 && !confirm('Este cronômetro já possui tempo acumulado. Remover deste registro?'))return;
  const snap=clone(s),t=now();if(isTimerActive(rt)){openInterval(rt).endedAt=t;} s.timers=s.timers.filter(t=>t.id!==id).map((t,i)=>({...t,order:i})); startPause(s,t); s.customized=true; syncTimerLoopAudio(true); await persistCurrent(); setUndo(snap,'Remoção desfeita');
}
async function moveCurrentTimer(id,dir){ const s=data.current;if(!s)return;const arr=s.timers.sort((a,b)=>a.order-b.order),i=arr.findIndex(t=>t.id===id),j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];arr.forEach((t,k)=>t.order=k);s.customized=true;await persistCurrent();render(); }

async function saveSession(){
  const s=data.current;if(!s)return false;const t=now();
  if(s.globalPaused){ s.globalPaused=false;s.pausedActiveTimerIds=[]; }
  s.timers.forEach(rt=>{const oi=openInterval(rt);if(oi)oi.endedAt=t;});
  endPause(s,t);
  const measured=sessionTotal(s,t)>0;
  if(!measured){
    let note=s.note.trim(); if(!note) note=(prompt('Para salvar um registro sem medição, escreva uma nota explicando:','')||'').trim();
    if(!note){ alert('A nota é obrigatória para salvar sem medição.'); return false; }
    s.note=note; s.isNoMeasurement=true;
  }
  if(!s.manualTitle) s.title=`(sem título) ${fmtDateTime(s.firstTimerStartedAt ?? s.openedAt)}`;
  s.savedAt=t; s.originalRecordedAt=s.firstTimerStartedAt ?? s.openedAt; s.status='saved';

  const adhoc=s.timers.filter(x=>x.isAdhoc);
  const model=modelById(s.modelId);
  if(adhoc.length && model){
    for(const rt of adhoc){
      if(confirm(`Incorporar “${rt.name}” ao modelo “${model.name}” para os próximos registros?`)){
        const templ={id:uid(),name:rt.name,order:model.timers.filter(x=>!x.removedAt).length,createdAt:t,removedAt:null};
        model.timers.push(templ); model.updatedAt=t; rt.templateId=templ.id; rt.isAdhoc=false; await put('models',model);
      }
    }
  }
  await put('sessions',clone(s)); data.sessions.unshift(clone(s));
  const sameModel=modelById(s.modelId); data.current=sameModel?newSession(sameModel):null; await putState('current',data.current);
  stopTimerLoopAudio(); haptic('save'); toast('Registro salvo'); render(); return true;
}

async function discardCurrent(){ if(!data.current)return; if(confirm('Descartar o registro atual?')){ stopTimerLoopAudio(); const m=modelById(data.current.modelId); data.current=m?newSession(m):null; await persistCurrent(); render(); } }

  

'use strict';

async function createModel(){
  const name=(prompt('Nome do novo modelo:','')||'').trim();if(!name)return;
  if(activeModels().some(m=>m.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Já existe um modelo com esse nome.');return;}
  const t=now(),m={id:uid(),name,createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:[]};data.models.push(m);await put('models',m);ui.modal={type:'editModel',id:m.id};render();
}
async function renameModel(m){ const n=(prompt('Nome do modelo:',m.name)||'').trim(); if(!n)return; if(activeModels().some(x=>x.id!==m.id&&x.name.toLocaleLowerCase()===n.toLocaleLowerCase())){alert('Já existe um modelo com esse nome.');return;} m.name=n;m.updatedAt=now();await put('models',m);if(data.current?.modelId===m.id){data.current.modelNameSnapshot=n;await persistCurrent();}render(); }
async function addTemplate(m){
  const name=(prompt('Nome do cronômetro:','')||'').trim();if(!name)return;
  if(m.timers.some(t=>!t.removedAt&&t.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Neste modelo, os cronômetros precisam ter nomes diferentes.');return;}
  m.timers.push({id:uid(),name,order:m.timers.filter(t=>!t.removedAt).length,createdAt:now(),removedAt:null});m.updatedAt=now();await put('models',m);render();
}
async function editTemplate(m,tid){
  const t=m.timers.find(x=>x.id===tid);if(!t)return;
  const n=(prompt('Nome do cronômetro:',t.name)||'').trim();if(!n)return;
  if(m.timers.some(x=>x.id!==tid&&!x.removedAt&&x.name.toLocaleLowerCase()===n.toLocaleLowerCase())){alert('Neste modelo, os cronômetros precisam ter nomes diferentes.');return;}
  t.name=n;m.updatedAt=now();await put('models',m);
  for(const s of data.sessions){
    let changed=false;
    for(const rt of s.timers){if(rt.templateId===tid){rt.name=t.name;changed=true;}}
    if(changed) await put('sessions',s);
  }
  render();
}
async function removeTemplate(m,tid){
  const t=m.timers.find(x=>x.id===tid);if(!t||!confirm(`Remover “${t.name}” do modelo? O histórico será preservado.`))return;
  t.removedAt=now();m.updatedAt=now();await put('models',m);
  for(const s of data.sessions){let changed=false;for(const rt of s.timers){if(rt.templateId===tid){rt.isRemoved=true;changed=true;}}if(changed)await put('sessions',s);}
  render();
}
async function moveTemplate(m,tid,dir){ const arr=m.timers.filter(t=>!t.removedAt).sort((a,b)=>a.order-b.order);const i=arr.findIndex(t=>t.id===tid),j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];arr.forEach((t,k)=>t.order=k);m.updatedAt=now();await put('models',m);render(); }
async function duplicateModel(m){ let n=2,name=`${m.name} (${n})`;const names=new Set(activeModels().map(x=>x.name));while(names.has(name)){n++;name=`${m.name} (${n})`;}const t=now();const c={id:uid(),name,createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:m.timers.filter(x=>!x.removedAt).sort((a,b)=>a.order-b.order).map((x,i)=>({id:uid(),name:x.name,order:i,createdAt:t,removedAt:null}))};data.models.push(c);await put('models',c);toast('Modelo duplicado');render(); }
async function moveModel(id,dir){const arr=activeModels();const i=arr.findIndex(m=>m.id===id),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];for(let k=0;k<arr.length;k++){arr[k].sortOrder=k;arr[k].updatedAt=now();await put('models',arr[k]);}render();}
async function deleteModel(m){ if(data.current?.modelId===m.id && hasPendingSession(data.current)){alert('Salve ou descarte o registro em andamento antes de excluir este modelo.');return;}if(!confirm(`Mover “${m.name}” para Apagados recentemente?`))return;m.deletedAt=now();m.updatedAt=now();await put('models',m);if(data.current?.modelId===m.id){const next=activeModels()[0];data.current=next?newSession(next):null;await persistCurrent();}ui.modal=null;ui.popover=null;render(); }
async function restoreModel(m){m.deletedAt=null;if(!Number.isFinite(m.sortOrder))m.sortOrder=nextModelOrder();m.updatedAt=now();await put('models',m);toast('Modelo restaurado');render();}
async function hardDeleteModel(m){if(!confirm('Excluir este modelo definitivamente? Esta ação é irreversível.'))return;await del('models',m.id);data.models=data.models.filter(x=>x.id!==m.id);render();}

async function rebuildModelFromSession(s){
  if(modelById(s.modelId)){alert('Esta ação só fica disponível depois que o modelo de origem é excluído definitivamente.');return;}
  const base=(prompt('Nome do novo modelo:',s.modelNameSnapshot||'Novo modelo')||'').trim();if(!base)return;
  let name=base,n=2;const names=new Set(activeModels().map(m=>m.name));while(names.has(name)){name=`${base} (${n++})`;}
  const chosen=[];
  for(const rt of s.timers.sort((a,b)=>a.order-b.order)){
    if(confirm(`Incluir “${rt.name}” no novo modelo?`)) chosen.push(rt);
  }
  const t=now(),m={id:uid(),name,createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:chosen.map((rt,i)=>({id:uid(),name:rt.name,order:i,createdAt:t,removedAt:null}))};
  data.models.push(m);await put('models',m);toast('Novo modelo criado');ui.modal={type:'editModel',id:m.id};render();
}

  

'use strict';

async function deleteSession(s){ if(!confirm('Mover este registro para Apagados recentemente?'))return;s.deletedAt=now();await put('sessions',s);render(); }
async function restoreSession(s){s.deletedAt=null;s.restoredAt=now();if(!s.manualTitle)s.title=`(sem título) ${fmtDateTime(s.restoredAt)}`;await put('sessions',s);toast('Registro restaurado');render();}
async function hardDeleteSession(s){if(!confirm('Apagar definitivamente? Esta ação não pode ser desfeita.'))return;await del('sessions',s.id);data.sessions=data.sessions.filter(x=>x.id!==s.id);ui.modal=null;render();}
async function correctTimer(s,rt){ const current=timerDuration(rt);const input=prompt(`Novo tempo efetivo de “${rt.name}” em minutos:`,(current/60000).toFixed(1).replace('.',','));if(input==null)return;const mins=Number(input.replace(',','.'));if(!Number.isFinite(mins)||mins<0){alert('Digite um número válido.');return;}if(!confirm('Aplicar esta correção de tempo?'))return;rt.correctedDurationMs=Math.round(mins*60000);await put('sessions',s);toast('Tempo corrigido');render(); }
async function saveSessionNote(id,value){const s=data.sessions.find(x=>x.id===id);if(!s)return;s.note=value;await put('sessions',s);const el=document.querySelector('#noteStatus');if(el)el.textContent=`Alterado • salvo às ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;}
async function editSessionTitle(s){const n=(prompt('Título:',s.title)||'').trim();if(!n)return;s.title=n;s.manualTitle=true;await put('sessions',s);render();}

  