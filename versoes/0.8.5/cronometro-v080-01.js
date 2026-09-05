
(function(){
  function showBootError(message){
    var app=document.getElementById('app');
    if(!app)return;
    app.innerHTML='<main style="padding:24px;font-family:-apple-system,BlinkMacSystemFont,system-ui;color:#111">'+
      '<h1 style="font-size:22px">Não foi possível abrir o aplicativo</h1>'+
      '<p style="font-size:14px;line-height:1.45">O site foi publicado, mas ocorreu um erro ao iniciar.</p>'+
      '<pre style="white-space:pre-wrap;font-size:12px;background:#f2f2f6;padding:12px;border-radius:14px">'+
      String(message||'Erro desconhecido').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+
      '</pre></main>';
  }
  window.addEventListener('error',function(e){ showBootError(e.message||e.error||'Erro de JavaScript'); });
  window.addEventListener('unhandledrejection',function(e){ showBootError(e.reason && (e.reason.message||e.reason) || 'Erro ao iniciar'); });
  window.__showCronometroBootError=showBootError;
})();

'use strict';
globalThis.APP_META = Object.freeze({
  version: '0.8.0',
  dataSchemaVersion: 4,
  factoryDataVersion: 1
});

'use strict';

globalThis.UI_CONFIG = Object.freeze({
  colors: {
    light: {
      bg: '#F2F2F6', card: '#FFFFFF', text: '#000000', secondary: '#85858A',
      line: '#E7E7E8', placeholder: '#C5C5C7', glass: 'rgba(255,255,255,.62)',
      floatBorder: 'rgba(255,255,255,.92)', usedText: '#9A9A9F'
    },
    dark: {
      bg: '#000000', card: '#1C1C1E', text: '#FFFFFF', secondary: '#98989D',
      line: '#38383A', placeholder: '#636366', glass: 'rgba(44,44,46,.72)',
      floatBorder: 'rgba(255,255,255,.12)', usedText: '#747478'
    },
    deleteFixed: '#E22400'
  },

  sizes: {
    contentSide:18, contentTop:14, topbarHeight:54, headerButton:40, headerIcon:22,
    titleSize:17.5, topTabTitleSize:20,

    settingsRadius:30, settingsRowHeight:56, settingsSide:18, settingsPadX:18,

    historyRadius:20, historyPadY:14, historyPadX:16, historyTitleSize:16,
    historyFilterHeight:44, historyFilterRadius:14,

    panelRadius:24, modalRadius:52, sheetCardRadius:30,
    borderWidth:1, iconStroke:1.8
  },

  header: {
    circleBorderWidth:0.75,
    circleBorderLight:'#FFFFFF',
    circleBorderDark:'#474747',
    iconStroke:2.3
  },

  timerModes: {
    small: {
      name:'Pequeno', layout:'lateral',
      minHeight:64, radius:30, padY:11, padX:14, gap:10, listGap:9,
      iconBox:42, iconRadius:13, iconSize:28, iconStroke:1.8,
      nameSize:13, nameWeight:620, nameAlignH:'left', nameAlignV:'center',
      timeSize:24, timeWeight:780, timeAlignH:'right', timeAlignV:'center',
      borderWidth:0, borderLight:'#FFFFFF', borderDark:'#38383A',
      shadow:{enabled:true,x:0,y:8,blur:24,spread:0,opacity:0.02},
      addHeight:52, addTextSize:14.5, addTextWeight:620, addIconStroke:2.5
    },
    medium: {
      name:'Médio', layout:'lateral',
      minHeight:76, radius:34, padY:12, padX:14, gap:10, listGap:10,
      iconBox:42, iconRadius:13, iconSize:28, iconStroke:1.8,
      nameSize:15.5, nameWeight:640, nameAlignH:'left', nameAlignV:'center',
      timeSize:34, timeWeight:760, timeAlignH:'right', timeAlignV:'center',
      borderWidth:0, borderLight:'#FFFFFF', borderDark:'#38383A',
      shadow:{enabled:true,x:0,y:8,blur:24,spread:0,opacity:0.025},
      addHeight:52, addTextSize:14.5, addTextWeight:620, addIconStroke:2.5
    },
    large: {
      name:'Grande', layout:'central',
      minHeight:60, radius:40, padY:11, padX:14, gap:0, listGap:11,
      iconBox:42, iconRadius:13, iconSize:28, iconStroke:1.8,
      nameSize:18, nameWeight:620, nameAlignH:'center', nameAlignV:'top',
      timeSize:80, timeWeight:700, timeAlignH:'center', timeAlignV:'top',
      borderWidth:0, borderLight:'#FFFFFF', borderDark:'#38383A',
      shadow:{enabled:false,x:0,y:8,blur:24,spread:0,opacity:0.06},
      addHeight:52, addTextSize:14.5, addTextWeight:620, addIconStroke:2.5
    }
  },

  actionGroup: {
    side:18, bottom:82, height:60, gap:10, totalFraction:1, saveFraction:1
  },

  totalCard: {
    radius:20, borderWidth:1, blur:16,
    shadow:{x:0,y:12,blur:25,spread:0,opacity:0.155},
    labelSize:12, labelWeight:500, timeSize:30, timeWeight:700,
    iconBox:48, iconSize:36, iconStroke:2.35,
    light:{bg:'#FFFFFF',text:'#000000',secondary:'#85858A',border:'#FFFFFF',iconBg:'#EAF3FF'},
    dark:{bg:'#1C1C1E',text:'#FFFFFF',secondary:'#98989D',border:'#38383A',iconBg:'#172A40'}
  },

  saveCard: {
    radius:20, borderWidth:1, blur:0,
    shadow:{x:0,y:12,blur:25,spread:0,opacity:0.155},
    textSize:20, textWeight:700, iconSize:25, iconStroke:4, gap:7
  },

  tabbar: {
    light:{background:'#F2F2F2',border:'#FFFFFF',icon:'#333333',selectedBackground:'#EBEBEB'},
    dark:{background:'#1C1C1E',border:'#474747',icon:'#C2C2C2',selectedBackground:'#3A3A3C'},
    opacity:0.53, left:14, right:14, bottom:18, height:50, padding:1.5, gap:6,
    radius:999, borderWidth:0.75, blur:7,
    shadow:{x:0,y:12,blur:34,spread:0,opacity:0.19},
    shadow2:{x:0,y:2,blur:10,spread:0,opacity:0.185},
    iconSize:35, iconStroke:1.5, showLabels:false
  },

  animationSpeeds: {
    slow:{id:'slow',name:'Lenta',durationMs:2400},
    normal:{id:'normal',name:'Normal',durationMs:1400},
    fast:{id:'fast',name:'Rápida',durationMs:800}
  },

  activeIconSizes: {
    standard:{id:'standard',name:'Padrão',size:28},
    medium:{id:'medium',name:'Médio',size:36},
    large:{id:'large',name:'Grande',size:44},
    maximum:{id:'maximum',name:'Máximo',size:52}
  },

  themePresets: [
    {id:'original',name:'Padrão',accent:'#007AFF',action:'#34C759',darkAccent:'#0A84FF',darkAction:'#30D158',saveBorderLight:'#56CF74'},
    {id:'blue',name:'Azul',accent:'#007AFF',action:'#007AFF',darkAccent:'#0A84FF',darkAction:'#0A84FF'},
    {id:'green',name:'Verde',accent:'#34C759',action:'#34C759',darkAccent:'#30D158',darkAction:'#30D158'},
    {id:'purple',name:'Roxo',accent:'#AF52DE',action:'#AF52DE',darkAccent:'#BF5AF2',darkAction:'#BF5AF2'},
    {id:'pink',name:'Rosa',accent:'#EE6F9E',action:'#EE6F9E',darkAccent:'#EE6F9E',darkAction:'#EE6F9E'},
    {id:'orange',name:'Laranja',accent:'#FF9500',action:'#FF9500',darkAccent:'#FF9F0A',darkAction:'#FF9F0A'},
    {id:'indigo',name:'Índigo',accent:'#5856D6',action:'#5856D6',darkAccent:'#5E5CE6',darkAction:'#5E5CE6'}
  ]
});


'use strict';

const $app = document.getElementById('app');
const $toast = document.getElementById('toast');

let db;
let ui = {
  tab:'timers',
  timerView:'timers',
  modal:null,
  popover:null,
  modelsEditing:false,
  historyQuery:'',
  historyModel:'all',
  historyArea:'all',
  statsArea:'all',
  historyDate:''
};

let data = {
  models:[],
  sessions:[],
  current:null,
  settings:{
    theme:'system',
    colorTheme:'original',
    timerSize:'small',
    simultaneous:'single',
    accentColor:'#007AFF',
    showVersionBadge:false,
    animateActiveTimerIcon:true,
    activeTimerAnimationSpeed:'normal',
    activeTimerIconSource:'default',
    activeTimerIconData:'',
    activeTimerIconName:'DVD',
    activeTimerIconSize:'standard',
    blinkTotalColon:true,
    timerSoundEnabled:false,
    timerSoundData:'',
    timerSoundName:'',
    timerSoundVolume:0.35,
    areas:[{id:'general',name:'Geral'}],
    statsCards:['summary','total','timers','average','best','worst','percent','trend']
  },
  undo:null
};

let tickHandle=null;
let toastHandle=null;
let timerLoopAudio=null;
let timerLoopAudioSource='';

function anyTimerRunning(){return !!data.current?.timers?.some(isTimerActive);}
function ensureTimerLoopAudio(){
  const src=data.settings.timerSoundData||'';
  if(!src)return null;
  if(!timerLoopAudio||timerLoopAudioSource!==src){
    if(timerLoopAudio){try{timerLoopAudio.pause();}catch(_){}}
    timerLoopAudio=new Audio(src);
    timerLoopAudio.loop=true;
    timerLoopAudio.preload='auto';
    timerLoopAudioSource=src;
  }
  timerLoopAudio.volume=Math.max(0,Math.min(1,Number(data.settings.timerSoundVolume ?? .35)));
  return timerLoopAudio;
}
function syncTimerLoopAudio(fromUserGesture=false){
  const shouldPlay=!!(data.settings.timerSoundEnabled&&data.settings.timerSoundData&&anyTimerRunning());
  const audio=ensureTimerLoopAudio();
  if(!audio)return;
  if(!shouldPlay){audio.pause();return;}
  if(audio.paused){
    const result=audio.play();
    if(result&&typeof result.catch==='function')result.catch(()=>{if(fromUserGesture)toast('Toque novamente no cronômetro para liberar o áudio');});
  }
}
function stopTimerLoopAudio(){if(timerLoopAudio)timerLoopAudio.pause();}


const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const now = () => Date.now();
const clone = obj => JSON.parse(JSON.stringify(obj));
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pad = n => String(n).padStart(2,'0');
const fmtDateTime = ms => { const d=new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} • ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = ms => { const d=new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const dayKey = ms => { const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const fmtDuration = ms => { ms=Math.max(0,Math.round(ms/1000)*1000); const s=Math.floor(ms/1000), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60; return h?`${h}:${pad(m)}:${pad(sec)}`:`${pad(m)}:${pad(sec)}`; };
const fmtShort = ms => { const s=Math.round(ms/1000); if(s<60)return `${s}s`; const m=Math.round(s/60); if(m<60)return `${m} min`; return `${(m/60).toFixed(1).replace('.',',')} h`; };

function defaultModel(){
  const t=now();
  return {id:uid(),name:'Meu modelo',createdAt:t,updatedAt:t,deletedAt:null,sortOrder:0,timers:[]};
}

function recordedFromTemplate(t){
  return {id:uid(),templateId:t.id,name:t.name,order:t.order,isAdhoc:false,isRemoved:false,intervals:[],correctedDurationMs:null};
}

function newSession(model){
  const t=now();
  return {
    id:uid(),modelId:model.id,modelNameSnapshot:model.name,title:'',manualTitle:false,note:'',
    openedAt:t,firstTimerStartedAt:null,savedAt:null,originalRecordedAt:null,restoredAt:null,
    deletedAt:null,status:'active',isNoMeasurement:false,globalPaused:false,pauseIntervals:[],
    pausedActiveTimerIds:[],customized:false,
    timers:model.timers.filter(x=>!x.removedAt).sort((a,b)=>a.order-b.order).map(recordedFromTemplate)
  };
}

function modelById(id){ return data.models.find(m=>m.id===id); }
function activeModels(){ return data.models.filter(m=>!m.deletedAt).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)||a.createdAt-b.createdAt); }
function nextModelOrder(){ return Math.max(-1,...data.models.map(m=>Number.isFinite(m.sortOrder)?m.sortOrder:-1))+1; }

function timerDuration(rt,at=now()){
  if(rt.correctedDurationMs!=null)return rt.correctedDurationMs;
  return rt.intervals.reduce((sum,i)=>sum+Math.max(0,(i.endedAt??at)-i.startedAt),0);
}
function sessionTotal(s,at=now()){ return s.timers.reduce((a,t)=>a+timerDuration(t,at),0); }
function pauseTotal(s,at=now()){ return s.pauseIntervals.reduce((a,p)=>a+Math.max(0,(p.endedAt??at)-p.startedAt),0); }
function sessionElapsedGross(s,at=now()){ const start=s.firstTimerStartedAt??s.openedAt; const end=s.savedAt??at; return Math.max(0,end-start); }
function sessionElapsedNet(s,at=now()){ return Math.max(0,sessionElapsedGross(s,at)-pauseTotal(s,at)); }
function openInterval(rt){ return [...rt.intervals].reverse().find(i=>i.endedAt==null); }
function isTimerActive(rt){ return !!openInterval(rt); }
function openPause(s){ return [...(s.pauseIntervals||[])].reverse().find(p=>p.endedAt==null); }
function isTimerPaused(s,rt){ return !isTimerActive(rt)&&timerDuration(rt)>0; }
function isTimerDone(){ return false; }

function startPause(s,t){
  if(!s.firstTimerStartedAt||s.timers.some(isTimerActive)||openPause(s))return;
  s.pauseIntervals||=[];
  s.pauseIntervals.push({id:uid(),startedAt:t,endedAt:null,origin:'no-active-timer'});
}
function endPause(s,t){ const p=openPause(s); if(p)p.endedAt=t; }

function haptic(kind='light'){
  try{if(navigator.vibrate)navigator.vibrate(kind==='save'?[20,25,20]:kind==='switch'?[12,18,12]:kind==='undo'?[8,12,8]:10);}catch(_){}
}
function toast(msg){
  clearTimeout(toastHandle);
  $toast.textContent=msg;
  $toast.classList.add('show');
  toastHandle=setTimeout(()=>$toast.classList.remove('show'),1800);
}
function setUndo(snapshot,label='Troca desfeita'){
  data.undo={snapshot,expiresAt:now()+5000,label};
  render();
  setTimeout(()=>{if(data.undo&&data.undo.expiresAt<=now()){data.undo=null;render();}},5100);
}
async function undo(){
  if(!data.undo)return;
  data.current=data.undo.snapshot;
  data.undo=null;
  await persistCurrent();
  haptic('undo');
  toast('Desfeito');
  render();
}

  

'use strict';

const DB_NAME='cronometro_archive_085';
const DB_VERSION=1;
const FACTORY_SEED_STATE_KEY='factorySeedVersion';

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const d=req.result;
      if(!d.objectStoreNames.contains('models'))d.createObjectStore('models',{keyPath:'id'});
      if(!d.objectStoreNames.contains('sessions'))d.createObjectStore('sessions',{keyPath:'id'});
      if(!d.objectStoreNames.contains('state'))d.createObjectStore('state',{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

function tx(store,mode='readonly'){return db.transaction(store,mode).objectStore(store);}
function getAll(store){return new Promise((res,rej)=>{const r=tx(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function getState(key){return new Promise((res,rej)=>{const r=tx('state').get(key);r.onsuccess=()=>res(r.result?.value);r.onerror=()=>rej(r.error);});}
function put(store,value){return new Promise((res,rej)=>{const r=tx(store,'readwrite').put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error);});}
function del(store,key){return new Promise((res,rej)=>{const r=tx(store,'readwrite').delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function putState(key,value){return put('state',{key,value});}

async function persistCurrent(){await putState('current',data.current);}
async function persistSettings(){await putState('settings',data.settings);}

async function loadFactoryData(){
  const response=await fetch('./initial-data.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Não foi possível carregar os dados iniciais.');
  const payload=await response.json();
  if(!payload||!Array.isArray(payload.models))throw new Error('Arquivo de dados iniciais inválido.');
  return payload;
}

async function seedFactoryDataIfNeeded(){
  const marker=await getState(FACTORY_SEED_STATE_KEY);
  if(marker!=null)return;

  const [existingModels,existingSessions,existingState]=await Promise.all([
    getAll('models'),
    getAll('sessions'),
    getAll('state')
  ]);

  // Só instala os dados de fábrica quando o banco está realmente vazio.
  // Isso também protege quem já usava o app e decidiu apagar todos os modelos.
  const hasPreviousInstallation=
    existingModels.length>0 ||
    existingSessions.length>0 ||
    existingState.some(item=>item.key!==FACTORY_SEED_STATE_KEY);

  if(hasPreviousInstallation){
    await putState(FACTORY_SEED_STATE_KEY,APP_META.factoryDataVersion);
    return;
  }

  const payload=await loadFactoryData();

  await new Promise((resolve,reject)=>{
    const tr=db.transaction(['models','state'],'readwrite');
    const models=tr.objectStore('models');
    const state=tr.objectStore('state');

    payload.models.forEach((model,index)=>{
      models.put({...clone(model),sortOrder:Number.isFinite(model.sortOrder)?model.sortOrder:index});
    });
    state.put({key:FACTORY_SEED_STATE_KEY,value:APP_META.factoryDataVersion});

    tr.oncomplete=resolve;
    tr.onerror=()=>reject(tr.error);
    tr.onabort=()=>reject(tr.error||new Error('Inicialização de dados cancelada.'));
  });
}

async function purgeExpired(){
  const cutoff=now()-30*24*60*60*1000;
  for(const s of [...data.sessions]){
    if(s.deletedAt&&s.deletedAt<cutoff){
      await del('sessions',s.id);
      data.sessions=data.sessions.filter(x=>x.id!==s.id);
    }
  }
  for(const m of [...data.models]){
    if(m.deletedAt&&m.deletedAt<cutoff){
      await del('models',m.id);
      data.models=data.models.filter(x=>x.id!==m.id);
    }
  }
}

  