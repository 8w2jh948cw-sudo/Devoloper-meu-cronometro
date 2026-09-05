
 'use strict';

function readFileAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('Falha ao ler arquivo'));r.readAsDataURL(file);});}
function svgTextToDataUrl(svg){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;}
async function setActiveIconFromFile(file){
  if(!file)return;
  const type=(file.type||'').toLowerCase(),name=(file.name||'').toLowerCase();
  if(!(type==='image/svg+xml'||type==='image/png'||name.endsWith('.svg')||name.endsWith('.png'))){alert('Escolha um arquivo SVG ou PNG.');return;}
  data.settings.activeTimerIconData=await readFileAsDataURL(file);
  data.settings.activeTimerIconSource=(type==='image/png'||name.endsWith('.png'))?'png':'svg';
  data.settings.activeTimerIconName=file.name||'Personalizado';
  await persistSettings();render();
}
async function setActiveIconFromSvgCode(){
  const code=(prompt('Cole o código SVG completo:','')||'').trim();if(!code)return;
  if(!/^<svg[\s>]/i.test(code)){alert('O código precisa começar com uma tag <svg>.');return;}
  data.settings.activeTimerIconData=svgTextToDataUrl(code);
  data.settings.activeTimerIconSource='svg';data.settings.activeTimerIconName='SVG colado';
  await persistSettings();render();
}
async function setActiveIconFromUrl(){
  const raw=(prompt('Cole o link direto para um SVG:','')||'').trim();if(!raw)return;
  let url;try{url=new URL(raw,location.href);if(!/^https?:$/.test(url.protocol))throw new Error();}catch(_){alert('Digite um link http ou https válido.');return;}
  try{
    const response=await fetch(url.href,{mode:'cors',cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const svg=await response.text();
    if(!/<svg[\s>]/i.test(svg))throw new Error('O link não retornou um SVG');
    data.settings.activeTimerIconData=svgTextToDataUrl(svg);data.settings.activeTimerIconSource='svg';data.settings.activeTimerIconName='SVG por link';
    toast('SVG importado e salvo no aparelho');
  }catch(_){
    data.settings.activeTimerIconData=url.href;data.settings.activeTimerIconSource='remoteSvg';data.settings.activeTimerIconName='SVG por link';
    toast('Link salvo; este ícone pode precisar de internet');
  }
  await persistSettings();render();
}
async function handleTimerSoundFile(file){
  if(!file)return;
  const ok=/\.(mp3|m4a|wav)$/i.test(file.name||'')||['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/x-wav'].includes((file.type||'').toLowerCase());
  if(!ok){alert('Escolha um áudio MP3, M4A ou WAV.');return;}
  data.settings.timerSoundData=await readFileAsDataURL(file);data.settings.timerSoundName=file.name||'Áudio';
  timerLoopAudio=null;timerLoopAudioSource='';
  await persistSettings();syncTimerLoopAudio(true);render();
}


async function saveCurrentLayoutAsNewModel(){
  const s=data.current;
  if(!s)return;
  const base=(prompt('Nome do novo modelo:','')||'').trim();
  if(!base)return;

  if(activeModels().some(m=>m.name.toLocaleLowerCase()===base.toLocaleLowerCase())){
    alert('Já existe um modelo com esse nome.');
    return;
  }

  const t=now();
  const model={
    id:uid(),
    name:base,
    createdAt:t,
    updatedAt:t,
    deletedAt:null,
    sortOrder:nextModelOrder(),
    timers:s.timers
      .filter(rt=>!rt.removedAt)
      .sort((a,b)=>(a.order??0)-(b.order??0))
      .map((rt,i)=>({
        id:uid(),
        name:rt.name||`Cronômetro ${i+1}`,
        order:i,
        createdAt:t,
        removedAt:null
      }))
  };

  data.models.push(model);
  await put('models',model);
  toast('Novo modelo salvo');
  render();
}

async function updateCurrentModelFromLayout(){
  const s=data.current;
  if(!s)return;

  const model=data.models.find(m=>m.id===s.modelId);
  if(!model){
    toast('Modelo original não encontrado');
    return;
  }

  const ok=confirm(`Substituir a organização do modelo "${model.name}" pela configuração atual? Os tempos deste registro não serão alterados.`);
  if(!ok)return;

  const t=now();
  const existingById=new Map((model.timers||[]).map(x=>[x.id,x]));

  model.timers=s.timers
    .filter(rt=>!rt.removedAt)
    .sort((a,b)=>(a.order??0)-(b.order??0))
    .map((rt,i)=>{
      const templateId=rt.templateId;
      const old=templateId?existingById.get(templateId):null;
      return {
        id:old?.id||uid(),
        name:rt.name||`Cronômetro ${i+1}`,
        order:i,
        createdAt:old?.createdAt||t,
        removedAt:null
      };
    });

  model.updatedAt=t;
  await put('models',model);
  toast('Modelo atual atualizado');
  render();
}

function bind(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ui.tab=b.dataset.tab;ui.modal=null;ui.popover=null;if(ui.tab==='timers')ui.timerView='timers';render();});
  const byId=id=>document.getElementById(id);
  if(byId('createFirst'))byId('createFirst').onclick=createModel;
  if(byId('modelsBack'))byId('modelsBack').onclick=()=>{ui.timerView='models';ui.modal=null;ui.popover=null;render();};
  if(byId('closeModelsDrawer'))byId('closeModelsDrawer').onclick=()=>{ui.timerView='timers';ui.modal=null;ui.popover=null;render();};
  if(byId('modelsDrawerBackdrop'))byId('modelsDrawerBackdrop').onclick=e=>{if(e.target===byId('modelsDrawerBackdrop')){ui.timerView='timers';ui.modal=null;ui.popover=null;render();}};
  if(byId('currentTitleButton'))byId('currentTitleButton').onclick=()=>{ui.popover={type:'title'};render();};

  if(byId('saveAsNewModel'))byId('saveAsNewModel').onclick=saveCurrentLayoutAsNewModel;
  if(byId('updateCurrentModel'))byId('updateCurrentModel').onclick=updateCurrentModelFromLayout;
  if(byId('sessionMenu'))byId('sessionMenu').onclick=()=>{ui.modal={type:'sessionMenu'};ui.popover=null;render();};
  document.querySelectorAll('[data-timer]').forEach(b=>b.onclick=()=>tapTimer(b.dataset.timer));
  if(byId('addAdhoc'))byId('addAdhoc').onclick=addAdhoc;
  if(byId('saveBtn'))byId('saveBtn').onclick=saveSession;
  if(byId('undoBtn'))byId('undoBtn').onclick=undo;
  if(byId('pendingSwitchSave'))byId('pendingSwitchSave').onclick=()=>openModelAfterPendingChoice(ui.modal?.targetModelId,'save');
  if(byId('pendingSwitchDiscard'))byId('pendingSwitchDiscard').onclick=()=>openModelAfterPendingChoice(ui.modal?.targetModelId,'discard');
  if(byId('pendingSwitchCancel'))byId('pendingSwitchCancel').onclick=()=>openModelAfterPendingChoice(ui.modal?.targetModelId,'cancel');
  if(byId('closeModal'))byId('closeModal').onclick=()=>{ui.modal=null;render();};
  if(byId('closeRecordDetail'))byId('closeRecordDetail').onclick=()=>{ui.modal=null;render();};
  if(byId('closePopover'))byId('closePopover').onclick=()=>{ui.popover=null;render();};
  document.querySelectorAll('.modal-wrap').forEach(w=>w.onclick=e=>{
    if(e.target!==w)return;
    if(ui.modal?.type==='pendingModelSwitch')return;
    ui.modal=null;
    render();
  });
  if(byId('closeToModels'))byId('closeToModels').onclick=()=>{ui.modal=null;render();};
  if(byId('createModel'))byId('createModel').onclick=createModel;
  if(byId('toggleModelsEdit'))byId('toggleModelsEdit').onclick=()=>{ui.modelsEditing=!ui.modelsEditing;ui.popover=null;render();};
  document.querySelectorAll('[data-model-options]').forEach(b=>b.onclick=e=>{e.stopPropagation();ui.popover={type:'modelOptions',id:b.dataset.modelOptions};render();});
  document.querySelectorAll('[data-model-rename]').forEach(b=>b.onclick=()=>{ui.popover=null;renameModel(modelById(b.dataset.modelRename));});
  document.querySelectorAll('[data-model-edit]').forEach(b=>b.onclick=()=>{ui.popover=null;ui.modal={type:'editModel',id:b.dataset.modelEdit};render();});
  document.querySelectorAll('[data-model-dup]').forEach(b=>b.onclick=()=>{ui.popover=null;duplicateModel(modelById(b.dataset.modelDup));});
  document.querySelectorAll('[data-model-delete]').forEach(b=>b.onclick=()=>{ui.popover=null;deleteModel(modelById(b.dataset.modelDelete));});
  document.querySelectorAll('[data-move-model]').forEach(b=>b.onclick=()=>moveModel(b.dataset.moveModel,Number(b.dataset.dir)));
  document.querySelectorAll('[data-choose-model]').forEach(b=>b.onclick=()=>chooseModel(b.dataset.chooseModel));
  document.querySelectorAll('[data-edit-model]').forEach(b=>b.onclick=()=>{ui.modal={type:'editModel',id:b.dataset.editModel};render();});
  document.querySelectorAll('[data-dup-model]').forEach(b=>b.onclick=()=>duplicateModel(modelById(b.dataset.dupModel)));
  document.querySelectorAll('[data-delete-model]').forEach(b=>b.onclick=()=>deleteModel(modelById(b.dataset.deleteModel)));
  if(ui.modal?.type==='editModel'){
    const m=modelById(ui.modal.id);
    if(byId('renameModel'))byId('renameModel').onclick=()=>renameModel(m); if(byId('addTemplate'))byId('addTemplate').onclick=()=>addTemplate(m);
    document.querySelectorAll('[data-edit-template]').forEach(b=>b.onclick=()=>editTemplate(m,b.dataset.editTemplate));
    document.querySelectorAll('[data-remove-template]').forEach(b=>b.onclick=()=>removeTemplate(m,b.dataset.removeTemplate));
    document.querySelectorAll('[data-move-template]').forEach(b=>b.onclick=()=>moveTemplate(m,b.dataset.moveTemplate,Number(b.dataset.dir)));
  }
  if(byId('titleRename'))byId('titleRename').onclick=async()=>{const current=data.current;const initial=current.manualTitle?current.title:'';const n=(prompt('Título:',initial)||'').trim();if(n){current.title=n;current.manualTitle=true;await persistCurrent();}ui.popover=null;render();};
  if(byId('titleEditModel'))byId('titleEditModel').onclick=()=>{const m=modelById(data.current?.modelId);ui.popover=null;if(m)ui.modal={type:'editModel',id:m.id};render();};
  if(byId('titleDiscard'))byId('titleDiscard').onclick=async()=>{ui.popover=null;await discardCurrent();};
  const currentNote=byId('currentNote');if(currentNote){let tm;currentNote.oninput=e=>{data.current.note=e.target.value;clearTimeout(tm);tm=setTimeout(()=>persistCurrent(),180);};currentNote.onblur=()=>persistCurrent();}
  if(byId('menuCustomize'))byId('menuCustomize').onclick=()=>{ui.modal={type:'organize'};render();};
  document.querySelectorAll('[data-move-current]').forEach(b=>b.onclick=()=>moveCurrentTimer(b.dataset.moveCurrent,Number(b.dataset.dir)));
  document.querySelectorAll('[data-rename-current]').forEach(b=>b.onclick=()=>renameCurrentTimer(b.dataset.renameCurrent));
  document.querySelectorAll('[data-remove-current]').forEach(b=>b.onclick=()=>removeCurrentTimer(b.dataset.removeCurrent));
  if(byId('historySearch'))byId('historySearch').oninput=e=>{ui.historyQuery=e.target.value;render();};
  if(byId('historyModel'))byId('historyModel').onchange=e=>{ui.historyModel=e.target.value;render();};
  if(byId('historyDate'))byId('historyDate').onchange=e=>{ui.historyDate=e.target.value;render();};
  if(byId('historyDateClear'))byId('historyDateClear').onclick=()=>{ui.historyDate='';render();};
  if(byId('historyTrash'))byId('historyTrash').onclick=()=>{ui.modal={type:'trash'};render();};
  document.querySelectorAll('[data-session]').forEach(b=>b.onclick=()=>{ui.modal={type:'session',id:b.dataset.session};render();});
  document.querySelectorAll('[data-delete-session]').forEach(b=>b.onclick=()=>deleteSession(data.sessions.find(s=>s.id===b.dataset.deleteSession)));
  document.querySelectorAll('[data-edit-session-title]').forEach(b=>b.onclick=()=>editSessionTitle(data.sessions.find(s=>s.id===b.dataset.editSessionTitle)));
  document.querySelectorAll('[data-rebuild-model]').forEach(b=>b.onclick=()=>rebuildModelFromSession(data.sessions.find(s=>s.id===b.dataset.rebuildModel)));
  document.querySelectorAll('[data-correct-time]').forEach(b=>b.onclick=()=>{const s=data.sessions.find(s=>s.id===b.dataset.correctTime);const t=s?.timers.find(t=>t.id===b.dataset.timerId);if(s&&t)correctTimer(s,t);});
  const note=byId('detailNote'); if(note){let tm;note.oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>saveSessionNote(e.target.dataset.noteSession,e.target.value),350);};}
  document.querySelectorAll('[data-restore-session]').forEach(b=>b.onclick=()=>restoreSession(data.sessions.find(s=>s.id===b.dataset.restoreSession)));
  document.querySelectorAll('[data-hard-session]').forEach(b=>b.onclick=()=>hardDeleteSession(data.sessions.find(s=>s.id===b.dataset.hardSession)));
  document.querySelectorAll('[data-restore-model]').forEach(b=>b.onclick=()=>restoreModel(modelById(b.dataset.restoreModel)));
  document.querySelectorAll('[data-hard-model]').forEach(b=>b.onclick=()=>hardDeleteModel(modelById(b.dataset.hardModel)));
  if(byId('themeSelect'))byId('themeSelect').onchange=async e=>{data.settings.theme=e.target.value;await persistSettings();render();};
  if(byId('toggleTimerSound'))byId('toggleTimerSound').onclick=async()=>{
    if(!data.settings.timerSoundData){byId('timerSoundFile')?.click();return;}
    data.settings.timerSoundEnabled=!data.settings.timerSoundEnabled;await persistSettings();syncTimerLoopAudio(true);render();
  };
  if(byId('timerSoundFile'))byId('timerSoundFile').onchange=async e=>{const f=e.target.files?.[0];if(f)await handleTimerSoundFile(f);e.target.value='';};
  if(byId('timerSoundVolume'))byId('timerSoundVolume').oninput=e=>{data.settings.timerSoundVolume=Number(e.target.value)/100;const label=e.target.parentElement?.querySelector('span');if(label)label.textContent=`${e.target.value}%`;if(timerLoopAudio)timerLoopAudio.volume=data.settings.timerSoundVolume;};
  if(byId('timerSoundVolume'))byId('timerSoundVolume').onchange=async()=>{await persistSettings();};
  if(byId('removeTimerSound'))byId('removeTimerSound').onclick=async()=>{stopTimerLoopAudio();data.settings.timerSoundEnabled=false;data.settings.timerSoundData='';data.settings.timerSoundName='';timerLoopAudio=null;timerLoopAudioSource='';await persistSettings();render();};
  if(byId('activeIconFile'))byId('activeIconFile').onchange=async e=>{const f=e.target.files?.[0];if(f)await setActiveIconFromFile(f);e.target.value='';};
  if(byId('pasteSvgCode'))byId('pasteSvgCode').onclick=setActiveIconFromSvgCode;
  if(byId('pasteSvgUrl'))byId('pasteSvgUrl').onclick=setActiveIconFromUrl;
  if(byId('restoreDefaultActiveIcon'))byId('restoreDefaultActiveIcon').onclick=async()=>{data.settings.activeTimerIconSource='default';data.settings.activeTimerIconData='';data.settings.activeTimerIconName='DVD';await persistSettings();render();};
  document.querySelectorAll('[data-active-icon-size]').forEach(b=>b.onclick=async()=>{data.settings.activeTimerIconSize=b.dataset.activeIconSize;await persistSettings();render();});
  document.querySelectorAll('[data-timer-size]').forEach(b=>b.onclick=async()=>{data.settings.timerSize=b.dataset.timerSize;await persistSettings();render();});
  if(byId('exportCsv'))byId('exportCsv').onclick=exportCSV;
  if(byId('exportJson'))byId('exportJson').onclick=exportJSON;
  if(byId('exportPdf'))byId('exportPdf').onclick=exportPDF;
  document.querySelectorAll('[data-color-theme]').forEach(b=>b.onclick=async()=>{data.settings.colorTheme=b.dataset.colorTheme;if(data.settings.colorTheme==='custom'&&!data.settings.accentColor)data.settings.accentColor='#007AFF';await persistSettings();render();});
  if(byId('accentCustom'))byId('accentCustom').onchange=async e=>{data.settings.accentColor=e.target.value;data.settings.colorTheme='custom';await persistSettings();render();};
  if(byId('importJsonFile'))byId('importJsonFile').onchange=async e=>{const f=e.target.files?.[0];if(f)await importJSON(f);e.target.value='';};
  if(byId('toggleVersionBadge'))byId('toggleVersionBadge').onclick=async()=>{
    data.settings.showVersionBadge=!data.settings.showVersionBadge;
    await persistSettings();
    render();
  };
  if(byId('toggleActiveTimerAnimation'))byId('toggleActiveTimerAnimation').onclick=async()=>{
    data.settings.animateActiveTimerIcon=!data.settings.animateActiveTimerIcon;
    await persistSettings();
    render();
  };
  document.querySelectorAll('[data-animation-speed]').forEach(b=>b.onclick=async()=>{
    data.settings.activeTimerAnimationSpeed=b.dataset.animationSpeed;
    await persistSettings();
    render();
  });
  if(byId('toggleTotalColonBlink'))byId('toggleTotalColonBlink').onclick=async()=>{
    data.settings.blinkTotalColon=!data.settings.blinkTotalColon;
    await persistSettings();
    render();
  };
}

  

'use strict';


/* ---------- ÁREAS ---------- */
function getAreas(){
  const raw=Array.isArray(data.settings.areas)?data.settings.areas:[];
  const out=raw.filter(a=>a&&typeof a.id==='string'&&typeof a.name==='string'&&a.name.trim());
  if(!out.some(a=>a.id==='general'))out.unshift({id:'general',name:'Geral'});
  return out;
}
function areaById(id){return getAreas().find(a=>a.id===id)||getAreas()[0]||{id:'general',name:'Geral'};}
function modelAreaId(m){return m?.areaId||'general';}
function sessionAreaId(s){return s?.areaId||modelById(s?.modelId)?.areaId||'general';}

async function migrateV080Data(){
  let settingsChanged=false,currentChanged=false;
  if(!Array.isArray(data.settings.areas)||!data.settings.areas.length){
    data.settings.areas=[{id:'general',name:'Geral'}];
    settingsChanged=true;
  }else if(!data.settings.areas.some(a=>a?.id==='general')){
    data.settings.areas.unshift({id:'general',name:'Geral'});
    settingsChanged=true;
  }
  ui.historyArea=ui.historyArea||'all';
  ui.statsArea=ui.statsArea||'all';

  for(const m of data.models){
    let changed=false;
    if(!m.areaId){m.areaId='general';changed=true;}
    for(const t of (m.timers||[])){
      if(!Object.prototype.hasOwnProperty.call(t,'marker')){t.marker=null;changed=true;}
    }
    if(changed)await put('models',m);
  }

  // Registros antigos continuam sem areaId para poderem acompanhar a área
  // do modelo de origem. Registros novos passam a salvar um snapshot da área.
  for(const s of data.sessions){
    let changed=false;
    for(const t of (s.timers||[])){
      if(!Object.prototype.hasOwnProperty.call(t,'marker')){
        const mt=modelById(s.modelId)?.timers?.find(x=>x.id===t.templateId);
        t.marker=clone(mt?.marker||null);changed=true;
      }
    }
    if(changed)await put('sessions',s);
  }

  if(data.current){
    if(!data.current.areaId){data.current.areaId=modelAreaId(modelById(data.current.modelId));currentChanged=true;}
    for(const t of (data.current.timers||[])){
      if(!Object.prototype.hasOwnProperty.call(t,'marker')){
        const mt=modelById(data.current.modelId)?.timers?.find(x=>x.id===t.templateId);
        t.marker=clone(mt?.marker||null);currentChanged=true;
      }
    }
  }

  if(settingsChanged)await persistSettings();
  if(currentChanged)await persistCurrent();
}


/* ---------- SESSÕES COM ÁREA E MARCADOR ---------- */
function recordedFromTemplate(t){
  return {
    id:uid(),templateId:t.id,name:t.name,order:t.order,isAdhoc:false,isRemoved:false,
    intervals:[],correctedDurationMs:null,marker:clone(t.marker||null)
  };
}
function newSession(model){
  const t=now();
  return {
    id:uid(),modelId:model.id,modelNameSnapshot:model.name,areaId:modelAreaId(model),
    title:'',manualTitle:false,note:'',
    openedAt:t,firstTimerStartedAt:null,savedAt:null,originalRecordedAt:null,restoredAt:null,
    deletedAt:null,status:'active',isNoMeasurement:false,globalPaused:false,pauseIntervals:[],
    pausedActiveTimerIds:[],customized:false,
    timers:model.timers.filter(x=>!x.removedAt).sort((a,b)=>a.order-b.order).map(recordedFromTemplate)
  };
}

