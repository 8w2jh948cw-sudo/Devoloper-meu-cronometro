/* ---------- ÁREAS: AÇÕES ---------- */
async function addArea(){
  const raw=await iosTextPrompt({title:'Nova área',message:'Exemplos: Unhas, Casa, Estudos.',placeholder:'Nome da área'});
  const name=String(raw??'').trim();if(!name)return;
  if(getAreas().some(a=>a.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Já existe uma área com esse nome.');return;}
  data.settings.areas=[...getAreas(),{id:`area-${uid()}`,name}];
  await persistSettings();render();
}
async function renameArea(id){
  const area=areaById(id);
  const raw=await iosTextPrompt({title:'Renomear área',value:area.name,placeholder:'Nome'});
  const name=String(raw??'').trim();if(!name)return;
  if(getAreas().some(a=>a.id!==id&&a.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Já existe uma área com esse nome.');return;}
  data.settings.areas=getAreas().map(a=>a.id===id?{...a,name}:a);
  await persistSettings();render();
}
async function deleteArea(id){
  if(id==='general')return;
  const area=areaById(id);
  if(!confirm(`Apagar a área “${area.name}”? Modelos e registros dessa área serão movidos para Geral.`))return;
  data.settings.areas=getAreas().filter(a=>a.id!==id);
  for(const m of data.models){if(m.areaId===id){m.areaId='general';await put('models',m);}}
  for(const s of data.sessions){if(s.areaId===id){s.areaId='general';await put('sessions',s);}}
  if(data.current?.areaId===id){data.current.areaId='general';await persistCurrent();}
  if(ui.historyArea===id)ui.historyArea='all';
  if(ui.statsArea===id)ui.statsArea='all';
  await persistSettings();render();
}

/* ---------- CSV COM ÁREA ---------- */
async function exportCSV(){
  const rows=[['sessionId','area','originalRecordedAt','savedAt','restoredAt','title','modelId','model','recordedTimerId','templateId','cronometro','tipo','duracaoMs','tempoTotalMs','tempoDecorridoMs','pausasMs','nota']];
  data.sessions.filter(s=>s.status==='saved').forEach(s=>s.timers.forEach(t=>rows.push([
    s.id,areaById(sessionAreaId(s)).name,new Date(s.originalRecordedAt).toISOString(),new Date(s.savedAt).toISOString(),
    s.restoredAt?new Date(s.restoredAt).toISOString():'',s.title,s.modelId,s.modelNameSnapshot,t.id,t.templateId||'',t.name,
    t.isAdhoc?'avulso':t.isRemoved?'removido':'modelo',timerDuration(t,s.savedAt),sessionTotal(s,s.savedAt),
    sessionElapsedNet(s,s.savedAt),pauseTotal(s,s.savedAt),s.note
  ])));
  await shareFile(`cronometro-${dayKey(now())}.csv`,'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\n'));
}

/* ---------- EVENTOS NOVOS/OVERRIDES ---------- */
function bindV080Events(){
  const byId=id=>document.getElementById(id);

  if(ui.modal?.type==='timerMarker'){
    const returnFromMarker=()=>{
      const m=ui.modal;
      ui.modal=m.scope==='model'?{type:'editModel',id:m.modelId}:{type:'organize'};
      render();
    };
    if(byId('closeModal'))byId('closeModal').onclick=returnFromMarker;
    document.querySelectorAll('.modal-wrap').forEach(w=>w.onclick=e=>{if(e.target===w)returnFromMarker();});
  }

  if(byId('historyArea'))byId('historyArea').onchange=e=>{
    ui.historyArea=e.target.value;ui.historyModel='all';render();
  };
  if(byId('statsArea'))byId('statsArea').onchange=e=>{ui.statsArea=e.target.value;render();};

  if(byId('addArea'))byId('addArea').onclick=addArea;
  document.querySelectorAll('[data-rename-area]').forEach(b=>b.onclick=()=>renameArea(b.dataset.renameArea));
  document.querySelectorAll('[data-delete-area]').forEach(b=>b.onclick=()=>deleteArea(b.dataset.deleteArea));

  if(byId('modelAreaSelect'))byId('modelAreaSelect').onchange=async e=>{
    const m=modelById(ui.modal?.id);if(!m)return;
    m.areaId=e.target.value;m.updatedAt=now();await put('models',m);
    if(data.current?.modelId===m.id){data.current.areaId=m.areaId;await persistCurrent();}
    render();
  };

  document.querySelectorAll('[data-model-marker]').forEach(b=>b.onclick=()=>{
    ui.modal={type:'timerMarker',scope:'model',modelId:ui.modal?.id,timerId:b.dataset.modelMarker,markerTab:'emoji'};render();
  });
  document.querySelectorAll('[data-current-marker]').forEach(b=>b.onclick=()=>{
    ui.modal={type:'timerMarker',scope:'current',timerId:b.dataset.currentMarker,markerTab:'emoji'};render();
  });
  document.querySelectorAll('[data-marker-tab]').forEach(b=>b.onclick=()=>{
    if(ui.modal?.type!=='timerMarker')return;ui.modal.markerTab=b.dataset.markerTab;render();
  });
  if(byId('applyEmojiMarker'))byId('applyEmojiMarker').onclick=async()=>{
    const value=String(byId('markerEmojiInput')?.value||'').trim();
    if(!value)return;await saveMarkerToTarget({type:'emoji',value});
  };
  document.querySelectorAll('[data-lucide-marker]').forEach(b=>b.onclick=()=>saveMarkerToTarget({type:'lucide',value:b.dataset.lucideMarker}));
  if(byId('importIconoirMarker'))byId('importIconoirMarker').onclick=()=>importIconoirMarker(byId('iconoirNameInput')?.value||'');
  if(byId('applySvgMarker'))byId('applySvgMarker').onclick=async()=>{
    const svg=sanitizeSvg(byId('markerSvgInput')?.value||'');
    if(!/^<svg[\s>]/i.test(svg)){alert('Cole um SVG válido.');return;}
    await saveMarkerToTarget({type:'svg',value:'SVG personalizado',data:svgTextToDataUrl(svg)});
  };
  if(byId('clearTimerMarker'))byId('clearTimerMarker').onclick=()=>saveMarkerToTarget(null);

  if(byId('titleRename'))byId('titleRename').onclick=async()=>{
    const current=data.current;if(!current)return;
    const raw=await iosTextPrompt({title:'Editar título',value:current.manualTitle?current.title:'',placeholder:'Título do registro'});
    const n=String(raw??'').trim();
    if(n){current.title=n;current.manualTitle=true;await persistCurrent();}
    ui.popover=null;render();
  };

  const unsafe=byId('updateCurrentModel');if(unsafe)unsafe.remove();
}

'use strict';

async function init(){
  db=await openDB();
  await seedFactoryDataIfNeeded();

  data.models=await getAll('models');
  data.sessions=await getAll('sessions');
  data.settings={...data.settings,...(await getState('settings')||{}),simultaneous:'single'};
  data.current=await getState('current');
  await migrateV080Data();

  if(localStorage.getItem('show_version_badge')==='1'&&!data.settings.showVersionBadge){
    data.settings.showVersionBadge=true;
    await persistSettings();
  }

  if(!(UI_CONFIG.themePresets||[]).some(p=>p.id===data.settings.colorTheme)){
    data.settings.colorTheme='original';
    await persistSettings();
  }

  let settingsChanged=false;
  if(!UI_CONFIG.timerModes?.[data.settings.timerSize]){data.settings.timerSize='small';settingsChanged=true;}
  if(!UI_CONFIG.animationSpeeds?.[data.settings.activeTimerAnimationSpeed]){data.settings.activeTimerAnimationSpeed='normal';settingsChanged=true;}
  if(typeof data.settings.animateActiveTimerIcon!=='boolean'){data.settings.animateActiveTimerIcon=true;settingsChanged=true;}
  if(typeof data.settings.blinkTotalColon!=='boolean'){data.settings.blinkTotalColon=true;settingsChanged=true;}
  if(!UI_CONFIG.activeIconSizes?.[data.settings.activeTimerIconSize]){data.settings.activeTimerIconSize='standard';settingsChanged=true;}
  if(!['default','svg','png','remoteSvg'].includes(data.settings.activeTimerIconSource)){data.settings.activeTimerIconSource='default';settingsChanged=true;}
  if(typeof data.settings.activeTimerIconData!=='string'){data.settings.activeTimerIconData='';settingsChanged=true;}
  if(typeof data.settings.activeTimerIconName!=='string'){data.settings.activeTimerIconName='DVD';settingsChanged=true;}
  if(typeof data.settings.timerSoundEnabled!=='boolean'){data.settings.timerSoundEnabled=false;settingsChanged=true;}
  if(typeof data.settings.timerSoundData!=='string'){data.settings.timerSoundData='';settingsChanged=true;}
  if(typeof data.settings.timerSoundName!=='string'){data.settings.timerSoundName='';settingsChanged=true;}
  if(!Number.isFinite(Number(data.settings.timerSoundVolume))){data.settings.timerSoundVolume=.35;settingsChanged=true;}
  data.settings.timerSoundVolume=Math.max(0,Math.min(1,Number(data.settings.timerSoundVolume)));
  if(!data.settings.timerSoundData&&data.settings.timerSoundEnabled){data.settings.timerSoundEnabled=false;settingsChanged=true;}
  if(settingsChanged)await persistSettings();

  let modelOrderChanged=false;
  activeModels().forEach((m,i)=>{
    if(!Number.isFinite(m.sortOrder)){
      m.sortOrder=i;
      modelOrderChanged=true;
    }
  });
  if(modelOrderChanged){
    for(const m of data.models)await put('models',m);
  }

  if(data.current?.globalPaused){
    data.current.globalPaused=false;
    data.current.pausedActiveTimerIds=[];
    await persistCurrent();
  }

  if(data.current?.status!=='active')data.current=null;

  if(!data.current){
    const model=activeModels()[0];
    if(model){
      data.current=newSession(model);
      await persistCurrent();
    }
  }

  await purgeExpired();
  render();

  tickHandle=setInterval(()=>{
    if(ui.tab==='timers'&&ui.timerView==='timers'&&data.current&&data.current.timers.some(isTimerActive))refreshTimerReadouts();
  },1000);

  if('serviceWorker' in navigator){
    try{await navigator.serviceWorker.register('./sw.js');}
    catch(error){console.warn('Service worker não registrado',error);}
  }

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)render();
  });
}

init().catch(err=>{
  console.error(err);
  $app.innerHTML=`<main class="content"><h1>Erro ao abrir o aplicativo</h1><pre>${esc(err.message)}</pre></main>`;
});
