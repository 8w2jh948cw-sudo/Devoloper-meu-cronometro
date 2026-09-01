'use strict';

/* =========================
   v0.8.2 — Áreas como perfis, clientes e métricas
   ========================= */

globalThis.APP_META=Object.freeze({version:'0.8.2',dataSchemaVersion:5,factoryDataVersion:1});

function normalizeSearchText(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();}
function activeAreaId(){
  const ids=new Set(getAreas().map(a=>a.id));
  const preferred=data.settings.activeAreaId;
  if(preferred&&ids.has(preferred))return preferred;
  const current=sessionAreaId(data.current);
  return ids.has(current)?current:(getAreas()[0]?.id||'general');
}
function activeArea(){return areaById(activeAreaId());}
function areaType(areaOrId){const a=typeof areaOrId==='string'?areaById(areaOrId):areaOrId;return a?.type||'generic';}
function isClientArea(areaId=activeAreaId()){return areaType(areaId)==='clients';}
function areaTypeLabel(t){return t==='clients'?'Clientes / atendimentos':'Genérica';}
function personIconMarkup(){return `<svg class="sf-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.5-4 2.8-6.2 6.5-6.2S18 16 18.5 20"/></svg>`;}
function clientsForArea(areaId=activeAreaId()){
  return (Array.isArray(data.settings.clients)?data.settings.clients:[]).filter(c=>c&&c.areaId===areaId&&!c.deletedAt).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
function clientById(id){return (data.settings.clients||[]).find(c=>c.id===id)||null;}
function clientLabelForSession(s){
  if(!s)return data.settings.clientEmptyLabel||'Sem cliente';
  return clientById(s.clientId)?.name||s.clientNameSnapshot||data.settings.clientEmptyLabel||'Sem cliente';
}
function sessionDisplayTitle(s){
  if(isClientArea(sessionAreaId(s)))return clientLabelForSession(s);
  return s?.title||`(sem título) ${fmtDateTime(recordDateMs(s))}`;
}
function activeAreaBadge(area=activeArea()){return `<span class="area-profile-badge" title="Área ativa">${esc(area?.name||'Sem área')}</span>`;}
function modelOptionsForActiveArea(){return activeModels().filter(m=>modelAreaId(m)===activeAreaId()).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0));}
function setActiveAreaState(id){
  const exists=getAreas().some(a=>a.id===id);if(!exists)return false;
  data.settings.activeAreaId=id;
  ui.historyModel='all';ui.historyClientId=null;
  return true;
}
async function persistActiveArea(id){if(!setActiveAreaState(id))return false;await persistSettings();return true;}

async function migrateV082Data(){
  let settingsChanged=false,currentChanged=false;
  let areas=getAreas().map(a=>({...a}));
  const general=areas.find(a=>a.id==='general');
  if(general&&general.name!=='Sem área'){general.name='Sem área';settingsChanged=true;}
  areas=areas.map(a=>{if(!a.type){settingsChanged=true;return {...a,type:'generic'};}return a;});
  if(!areas.some(a=>a.id==='general')){areas.push({id:'general',name:'Sem área',type:'generic'});settingsChanged=true;}
  data.settings.areas=areas;
  if(!Array.isArray(data.settings.clients)){data.settings.clients=[];settingsChanged=true;}
  if(typeof data.settings.clientEmptyLabel!=='string'||!data.settings.clientEmptyLabel.trim()){data.settings.clientEmptyLabel='Sem cliente';settingsChanged=true;}
  if(typeof data.settings.ignoreShortMeasurements!=='boolean'){data.settings.ignoreShortMeasurements=true;settingsChanged=true;}
  if(!Number.isFinite(Number(data.settings.shortMeasurementThresholdSec))){data.settings.shortMeasurementThresholdSec=10;settingsChanged=true;}
  data.settings.shortMeasurementThresholdSec=Math.max(1,Math.min(60,Math.round(Number(data.settings.shortMeasurementThresholdSec)||10)));
  if(!Number.isFinite(Number(data.settings.uiTextScale))){data.settings.uiTextScale=1;settingsChanged=true;}
  if(!Number.isFinite(Number(data.settings.uiCardScale))){data.settings.uiCardScale=1;settingsChanged=true;}
  if(!Number.isFinite(Number(data.settings.uiIconScale))){data.settings.uiIconScale=1;settingsChanged=true;}
  if(!['compact','standard','spacious'].includes(data.settings.uiDensity)){data.settings.uiDensity='standard';settingsChanged=true;}
  if(!['system','rounded'].includes(data.settings.uiFontPreset)){data.settings.uiFontPreset='system';settingsChanged=true;}
  if(!data.settings.activeAreaId||!areas.some(a=>a.id===data.settings.activeAreaId)){
    data.settings.activeAreaId=data.current?.areaId||modelAreaId(modelById(data.current?.modelId))||'general';settingsChanged=true;
  }
  for(const m of data.models){
    let changed=false;
    if(!m.areaId){m.areaId='general';changed=true;}
    if(changed)await put('models',m);
  }
  for(const s of data.sessions){
    let changed=false;
    if(!s.areaId){s.areaId=modelAreaId(modelById(s.modelId));changed=true;}
    if(isClientArea(s.areaId)){
      if(!Object.prototype.hasOwnProperty.call(s,'appointmentNote')){s.appointmentNote=s.note||'';changed=true;}
      if(!Object.prototype.hasOwnProperty.call(s,'clientNote')){s.clientNote='';changed=true;}
    }
    for(const t of (s.timers||[])){
      if(!Object.prototype.hasOwnProperty.call(t,'measurementStatus')){t.measurementStatus=timerDuration(t,s.savedAt)>0?'measured':'notNeeded';changed=true;}
      if(!Array.isArray(t.ignoredIntervals)){t.ignoredIntervals=[];changed=true;}
    }
    if(changed)await put('sessions',s);
  }
  if(data.current){
    if(!data.current.areaId){data.current.areaId=modelAreaId(modelById(data.current.modelId));currentChanged=true;}
    if(isClientArea(data.current.areaId)){
      if(!Object.prototype.hasOwnProperty.call(data.current,'appointmentNote')){data.current.appointmentNote=data.current.note||'';currentChanged=true;}
      if(!Object.prototype.hasOwnProperty.call(data.current,'clientNote')){data.current.clientNote='';currentChanged=true;}
      if(!Object.prototype.hasOwnProperty.call(data.current,'clientId')){data.current.clientId=null;currentChanged=true;}
    }
    for(const t of (data.current.timers||[])){
      if(!Array.isArray(t.ignoredIntervals)){t.ignoredIntervals=[];currentChanged=true;}
      if(!Object.prototype.hasOwnProperty.call(t,'measurementStatus')){t.measurementStatus=timerDuration(t)>0?'measured':'notNeeded';currentChanged=true;}
    }
    data.settings.activeAreaId=data.current.areaId;settingsChanged=true;
  }
  ui.historyArea=activeAreaId();ui.statsArea=activeAreaId();ui.historyClientId=null;
  if(settingsChanged)await persistSettings();
  if(currentChanged)await persistCurrent();
}

function recordedFromTemplate(t){
  return {id:uid(),templateId:t.id,name:t.name,order:t.order,isAdhoc:false,isRemoved:false,intervals:[],ignoredIntervals:[],correctedDurationMs:null,measurementStatus:'notNeeded',marker:clone(t.marker||null)};
}
function newSession(model){
  const t=now(),aid=modelAreaId(model),clients=isClientArea(aid);
  return {id:uid(),modelId:model.id,modelNameSnapshot:model.name,areaId:aid,title:'',manualTitle:false,note:'',appointmentNote:'',clientNote:'',clientId:null,clientNameSnapshot:'',openedAt:t,firstTimerStartedAt:null,savedAt:null,originalRecordedAt:null,restoredAt:null,deletedAt:null,status:'active',isNoMeasurement:false,globalPaused:false,pauseIntervals:[],pausedActiveTimerIds:[],customized:false,timers:model.timers.filter(x=>!x.removedAt).sort((a,b)=>a.order-b.order).map(recordedFromTemplate),clientMode:clients};
}
function currentTimerMode(){
  const base=UI_CONFIG.timerModes?.[data.settings.timerSize]||UI_CONFIG.timerModes?.small||{};
  if(data.settings.timerSize!=='medium')return base;
  return {...base,minHeight:88,radius:36,padY:14,padX:15,iconBox:48,iconSize:32,nameSize:16.5,timeSize:42,listGap:10};
}
const __applyThemeV082Base=applyTheme;
applyTheme=function(){
  __applyThemeV082Base();
  const root=document.documentElement,body=document.body;
  const ts=Math.max(.9,Math.min(1.12,Number(data.settings.uiTextScale)||1));
  const cs=Math.max(.9,Math.min(1.12,Number(data.settings.uiCardScale)||1));
  const is=Math.max(.9,Math.min(1.2,Number(data.settings.uiIconScale)||1));
  root.style.setProperty('--v082-text-scale',ts);root.style.setProperty('--v082-card-scale',cs);root.style.setProperty('--v082-icon-scale',is);
  body.classList.toggle('v082-rounded',data.settings.uiFontPreset==='rounded');
  body.classList.toggle('v082-text-scaled',Math.abs(ts-1)>.001);body.classList.toggle('v082-cards-scaled',Math.abs(cs-1)>.001);body.classList.toggle('v082-icons-scaled',Math.abs(is-1)>.001);
  body.classList.toggle('v082-compact',data.settings.uiDensity==='compact');body.classList.toggle('v082-spacious',data.settings.uiDensity==='spacious');
  body.dataset.timerMode=data.settings.timerSize;
};
function fitPromptToVisualViewport(backdrop){
  const vv=window.visualViewport;if(!vv||!backdrop)return()=>{};
  const update=()=>{backdrop.style.height=`${vv.height}px`;backdrop.style.top=`${vv.offsetTop}px`;backdrop.style.bottom='auto';};
  vv.addEventListener('resize',update);vv.addEventListener('scroll',update);update();
  return()=>{vv.removeEventListener('resize',update);vv.removeEventListener('scroll',update);};
}
function iosTextPrompt({title='Digite um texto',message='',value='',placeholder='',confirmText='Salvar',inputMode='text',multiline=false}={}){
  return new Promise(resolve=>{
    document.querySelector('.ios-text-prompt-backdrop')?.remove();
    const backdrop=document.createElement('div');backdrop.className='ios-text-prompt-backdrop';
    backdrop.innerHTML=`<section class="ios-text-prompt" role="dialog" aria-modal="true"><div class="ios-text-prompt-copy"><h2>${esc(title)}</h2>${message?`<p>${esc(message)}</p>`:''}</div><div class="ios-text-prompt-field">${multiline?`<textarea id="iosPromptInput" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input id="iosPromptInput" type="text" inputmode="${esc(inputMode)}" autocomplete="off" autocapitalize="sentences" placeholder="${esc(placeholder)}" value="${esc(value)}">`}</div><div class="ios-text-prompt-actions"><button id="iosPromptCancel">Cancelar</button><button id="iosPromptConfirm">${esc(confirmText)}</button></div></section>`;
    document.body.appendChild(backdrop);const input=backdrop.querySelector('#iosPromptInput');const detach=fitPromptToVisualViewport(backdrop);
    const finish=result=>{detach();backdrop.remove();resolve(result);};
    backdrop.querySelector('#iosPromptCancel').onclick=()=>finish(null);backdrop.querySelector('#iosPromptConfirm').onclick=()=>finish(input.value);backdrop.onclick=e=>{if(e.target===backdrop)finish(null);};
    input.addEventListener('keydown',e=>{if(!multiline&&e.key==='Enter'){e.preventDefault();finish(input.value);}});
    requestAnimationFrame(()=>{try{input.focus({preventScroll:true});const len=input.value.length;if(!multiline&&input.setSelectionRange)input.setSelectionRange(len,len);setTimeout(()=>input.focus({preventScroll:true}),80);}catch(_){}});
  });
}
function hasPendingSession(s){return !!(s&&(s.firstTimerStartedAt||sessionTotal(s)>0||String(s.note||'').trim()||String(s.appointmentNote||'').trim()||String(s.clientNote||'').trim()||s.clientId||s.customized||s.manualTitle));}
function shortThresholdMs(){return data.settings.ignoreShortMeasurements===false?0:Math.max(0,Number(data.settings.shortMeasurementThresholdSec||10)*1000);}
function maybeIgnoreShortInterval(rt,interval){
  if(!rt||!interval||interval.endedAt==null||interval.restored)return false;
  const limit=shortThresholdMs(),dur=Math.max(0,interval.endedAt-interval.startedAt);if(!limit||dur>=limit)return false;
  rt.ignoredIntervals=Array.isArray(rt.ignoredIntervals)?rt.ignoredIntervals:[];
  rt.ignoredIntervals.push({...interval,ignoredAt:now(),durationMs:dur});
  rt.intervals=(rt.intervals||[]).filter(i=>i.id!==interval.id);
  if(timerDuration(rt)<=0)rt.measurementStatus='notNeeded';
  return true;
}
async function tapTimer(timerId){
  const s=data.current;if(!s)return;const rt=s.timers.find(t=>t.id===timerId);if(!rt)return;const t=now();
  if(!s.firstTimerStartedAt)s.firstTimerStartedAt=t;
  const active=s.timers.find(x=>isTimerActive(x));
  if(active?.id===rt.id){const oi=openInterval(rt);oi.endedAt=t;maybeIgnoreShortInterval(rt,oi);if(timerDuration(rt)>0)rt.measurementStatus='measured';startPause(s,t);syncTimerLoopAudio(true);await persistCurrent();haptic('light');render();return;}
  const snap=clone(s);
  if(active){const oi=openInterval(active);oi.endedAt=t;maybeIgnoreShortInterval(active,oi);if(timerDuration(active)>0)active.measurementStatus='measured';}
  else endPause(s,t);
  rt.intervals.push({id:uid(),startedAt:t,endedAt:null,origin:active?'switch':'resume'});rt.measurementStatus=timerDuration(rt)>0?'measured':rt.measurementStatus||'notNeeded';
  syncTimerLoopAudio(true);await persistCurrent();if(active){setUndo(snap);haptic('switch');}else{haptic('light');render();}
}
async function chooseModel(id){
  const m=modelById(id);if(!m)return;
  if(data.current&&data.current.status==='active'&&data.current.modelId!==id&&hasPendingSession(data.current)){ui.modal={type:'pendingModelSwitch',targetModelId:id};ui.popover=null;render();return;}
  stopTimerLoopAudio();await persistActiveArea(modelAreaId(m));data.current=newSession(m);await persistCurrent();ui.timerView='timers';ui.popover=null;ui.modal=!m.timers.some(t=>!t.removedAt)?{type:'editModel',id:m.id}:null;render();
}
async function openModelAfterPendingChoice(id,action){
  const m=modelById(id);if(!m)return;
  if(action==='save'){const ok=await saveSession();if(!ok)return;}else if(action==='discard'){stopTimerLoopAudio();data.current=null;await putState('current',null);}else{ui.modal=null;ui.popover=null;ui.timerView='timers';render();return;}
  stopTimerLoopAudio();await persistActiveArea(modelAreaId(m));data.current=newSession(m);await persistCurrent();ui.timerView='timers';ui.popover=null;ui.modal=!m.timers.some(t=>!t.removedAt)?{type:'editModel',id:m.id}:null;render();
}
async function activateArea(id){
  const a=areaById(id);if(!a)return;
  if(activeAreaId()===id)return;
  const first=activeModels().filter(m=>modelAreaId(m)===id).sort((x,y)=>(x.sortOrder??0)-(y.sortOrder??0))[0]||null;
  if(data.current&&hasPendingSession(data.current)&&sessionAreaId(data.current)!==id){
    if(first){ui.modal={type:'pendingModelSwitch',targetModelId:first.id};return render();}
    const ok=confirm(`Há um registro em andamento em “${activeArea().name}”. Salve ou descarte esse registro antes de abrir “${a.name}”.`);if(!ok)return;return;
  }
  await persistActiveArea(id);
  if(first){data.current=newSession(first);await persistCurrent();}
  else{data.current=null;await putState('current',null);}
  ui.timerView='models';render();
}
async function createModel(){
  const raw=await iosTextPrompt({title:'Novo modelo',message:`Este modelo será criado em “${activeArea().name}”.`,placeholder:'Nome do modelo'});const name=String(raw??'').trim();if(!name)return;
  if(activeModels().some(m=>modelAreaId(m)===activeAreaId()&&normalizeSearchText(m.name)===normalizeSearchText(name))){alert('Já existe um modelo com esse nome nesta área.');return;}
  const t=now(),m={id:uid(),name,areaId:activeAreaId(),createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:[]};data.models.push(m);await put('models',m);data.current=newSession(m);await persistCurrent();ui.modal={type:'editModel',id:m.id};render();
}
async function saveCurrentLayoutAsNewModel(){
  const s=data.current;if(!s)return;const raw=await iosTextPrompt({title:'Salvar como novo modelo',message:`Será criado em “${activeArea().name}”.`,placeholder:'Nome do novo modelo'});const base=String(raw??'').trim();if(!base)return;
  if(activeModels().some(m=>modelAreaId(m)===activeAreaId()&&normalizeSearchText(m.name)===normalizeSearchText(base))){alert('Já existe um modelo com esse nome nesta área.');return;}
  const t=now(),model={id:uid(),name:base,areaId:activeAreaId(),createdAt:t,updatedAt:t,deletedAt:null,sortOrder:nextModelOrder(),timers:s.timers.filter(t=>!t.removedAt&&!t.isRemoved).sort((a,b)=>(a.order??0)-(b.order??0)).map((rt,i)=>({id:uid(),name:rt.name||`Cronômetro ${i+1}`,order:i,createdAt:t,removedAt:null,marker:clone(rt.marker||null)}))};
  data.models.push(model);await put('models',model);toast('Novo modelo salvo');render();
}
