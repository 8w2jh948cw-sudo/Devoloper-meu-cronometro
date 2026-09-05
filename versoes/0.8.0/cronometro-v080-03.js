
'use strict';

function cssNum(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
function clamp01(v){return Math.max(0,Math.min(1,Number(v)||0));}
function colorWithAlpha(color,opacity){
  const a=clamp01(opacity);
  const m=String(color||'').match(/^#([0-9a-f]{6})$/i);
  if(!m)return `color-mix(in srgb,${color} ${a*100}%,transparent)`;
  const n=parseInt(m[1],16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
function currentPreset(){
  const presets=UI_CONFIG.themePresets||[];
  return presets.find(p=>p.id===data.settings.colorTheme)||presets[0]||{accent:'#007AFF',action:'#34C759',darkAccent:'#0A84FF',darkAction:'#30D158'};
}
function currentTimerMode(){
  return UI_CONFIG.timerModes?.[data.settings.timerSize]||UI_CONFIG.timerModes?.small||{};
}
function shadowCss(sh={}){
  return `${cssNum(sh.x)}px ${cssNum(sh.y)}px ${cssNum(sh.blur)}px ${cssNum(sh.spread)}px rgba(0,0,0,${clamp01(sh.opacity)})`;
}
function cssVerticalAlign(v){return v==='top'?'start':v==='bottom'?'end':'center';}
function activeTimerAnimationDuration(){
  const speed=UI_CONFIG.animationSpeeds?.[data.settings.activeTimerAnimationSpeed]||UI_CONFIG.animationSpeeds?.normal;
  return cssNum(speed?.durationMs,1400);
}
function activeTimerIconSize(){
  const size=UI_CONFIG.activeIconSizes?.[data.settings.activeTimerIconSize]||UI_CONFIG.activeIconSizes?.standard;
  return cssNum(size?.size,28);
}
function applyTheme(){
  const root=document.documentElement;
  if(data.settings.theme==='system')root.removeAttribute('data-theme');
  else root.setAttribute('data-theme',data.settings.theme);

  const c=UI_CONFIG.colors||{},z=UI_CONFIG.sizes||{},h=UI_CONFIG.header||{},m=currentTimerMode();
  const ag=UI_CONFIG.actionGroup||{},total=UI_CONFIG.totalCard||{},save=UI_CONFIG.saveCard||{},tab=UI_CONFIG.tabbar||{};
  const custom=data.settings.colorTheme==='custom';
  const preset=currentPreset();
  const accentLight=custom?(data.settings.accentColor||'#007AFF'):(preset.accent||'#007AFF');
  const actionLight=custom?accentLight:(preset.action||accentLight);
  const accentDark=custom?accentLight:(preset.darkAccent||preset.accent||'#0A84FF');
  const actionDark=custom?accentDark:(preset.darkAction||preset.action||accentDark);

  const vars={
    '--accent-light':accentLight,'--action-light':actionLight,
    '--accent-dark':accentDark,'--action-dark':actionDark,
    '--switch-on':actionLight,
    '--save-border-light':custom?actionLight:(preset.saveBorderLight||actionLight),'--save-border-dark':actionDark,
    '--delete-fixed':c.deleteFixed||'#E22400',

    '--light-bg':c.light?.bg,'--light-card':c.light?.card,'--light-text':c.light?.text,
    '--light-secondary':c.light?.secondary,'--light-line':c.light?.line,
    '--light-placeholder':c.light?.placeholder,'--light-glass':c.light?.glass,
    '--light-float-border':c.light?.floatBorder,'--light-used':c.light?.usedText,

    '--dark-bg':c.dark?.bg,'--dark-card':c.dark?.card,'--dark-text':c.dark?.text,
    '--dark-secondary':c.dark?.secondary,'--dark-line':c.dark?.line,
    '--dark-placeholder':c.dark?.placeholder,'--dark-glass':c.dark?.glass,
    '--dark-float-border':c.dark?.floatBorder,'--dark-used':c.dark?.usedText,

    '--content-side':`${cssNum(z.contentSide,18)}px`,'--content-top':`${cssNum(z.contentTop,14)}px`,
    '--topbar-height':`${cssNum(z.topbarHeight,54)}px`,'--header-button':`${cssNum(z.headerButton,40)}px`,
    '--header-icon':`${cssNum(z.headerIcon,22)}px`,'--title-size':`${cssNum(z.titleSize,17.5)}px`,
    '--header-circle-border':`${cssNum(h.circleBorderWidth,.75)}px`,
    '--light-header-circle-border':h.circleBorderLight||'#FFFFFF','--dark-header-circle-border':h.circleBorderDark||'#474747',
    '--header-icon-stroke':cssNum(h.iconStroke,2.3),

    '--timer-min-height':`${cssNum(m.minHeight,64)}px`,'--timer-radius':`${cssNum(m.radius,30)}px`,
    '--timer-pad-y':`${cssNum(m.padY,11)}px`,'--timer-pad-x':`${cssNum(m.padX,14)}px`,
    '--timer-gap':`${cssNum(m.gap,10)}px`,'--timer-list-gap':`${cssNum(m.listGap,9)}px`,
    '--timer-icon-size':`${cssNum(m.iconBox,38)}px`,'--timer-icon-radius':`${cssNum(m.iconRadius,13)}px`,
    '--timer-icon-inner':`${cssNum(m.iconSize,21)}px`,'--timer-icon-stroke':cssNum(m.iconStroke,1.8),
    '--timer-name-size':`${cssNum(m.nameSize,15)}px`,'--timer-name-weight':cssNum(m.nameWeight,620),
    '--timer-time-size':`${cssNum(m.timeSize,24)}px`,'--timer-time-weight':cssNum(m.timeWeight,780),
    '--timer-name-align':m.nameAlignH||'left','--timer-time-align':m.timeAlignH||'right',
    '--timer-name-v-align':cssVerticalAlign(m.nameAlignV),'--timer-time-v-align':cssVerticalAlign(m.timeAlignV),
    '--timer-border-width':`${cssNum(m.borderWidth)}px`,'--light-timer-border':m.borderLight||'#FFFFFF','--dark-timer-border':m.borderDark||'#38383A',
    '--timer-card-shadow':m.shadow?.enabled?shadowCss(m.shadow):'none',
    '--add-height':`${cssNum(m.addHeight,52)}px`,'--add-text-size':`${cssNum(m.addTextSize,14.5)}px`,
    '--add-text-weight':cssNum(m.addTextWeight,620),'--add-icon-stroke':cssNum(m.addIconStroke,2.5),

    '--action-group-side':`${cssNum(ag.side,18)}px`,'--action-group-bottom':`${cssNum(ag.bottom,82)}px`,
    '--floating-height':`${cssNum(ag.height,60)}px`,'--floating-gap':`${cssNum(ag.gap,10)}px`,
    '--action-total-fr':cssNum(ag.totalFraction,1),'--action-save-fr':cssNum(ag.saveFraction,1),

    '--total-radius':`${cssNum(total.radius,20)}px`,'--total-border-width':`${cssNum(total.borderWidth,1)}px`,
    '--total-blur':`${cssNum(total.blur,16)}px`,'--total-shadow':shadowCss(total.shadow),
    '--total-label-size':`${cssNum(total.labelSize,12)}px`,'--total-label-weight':cssNum(total.labelWeight,500),
    '--total-time-size':`${cssNum(total.timeSize,30)}px`,'--total-time-weight':cssNum(total.timeWeight,700),
    '--total-icon-box':`${cssNum(total.iconBox,32)}px`,'--total-icon-size':`${cssNum(total.iconSize,28)}px`,'--total-icon-stroke':cssNum(total.iconStroke,2.35),
    '--light-total-bg':total.light?.bg,'--light-total-text':total.light?.text,'--light-total-secondary':total.light?.secondary,
    '--light-total-border':total.light?.border,'--light-total-icon-bg':total.light?.iconBg,
    '--dark-total-bg':total.dark?.bg,'--dark-total-text':total.dark?.text,'--dark-total-secondary':total.dark?.secondary,
    '--dark-total-border':total.dark?.border,'--dark-total-icon-bg':total.dark?.iconBg,

    '--save-radius':`${cssNum(save.radius,20)}px`,'--save-border-width':`${cssNum(save.borderWidth,1)}px`,
    '--save-blur':`${cssNum(save.blur)}px`,'--save-shadow':shadowCss(save.shadow),
    '--save-text-size':`${cssNum(save.textSize,20)}px`,'--save-text-weight':cssNum(save.textWeight,700),
    '--save-icon-size':`${cssNum(save.iconSize,25)}px`,'--save-icon-stroke':cssNum(save.iconStroke,4),'--save-gap':`${cssNum(save.gap,7)}px`,

    '--light-tabbar-bg':colorWithAlpha(tab.light?.background||'#F2F2F2',tab.opacity),'--light-tabbar-border':tab.light?.border,'--light-tabbar-icon':tab.light?.icon,
    '--light-tabbar-selected-bg':tab.light?.selectedBackground,
    '--dark-tabbar-bg':colorWithAlpha(tab.dark?.background||'#1C1C1E',tab.opacity),'--dark-tabbar-border':tab.dark?.border,'--dark-tabbar-icon':tab.dark?.icon,
    '--dark-tabbar-selected-bg':tab.dark?.selectedBackground,
    '--tabbar-opacity':clamp01(tab.opacity),'--tabbar-left':`${cssNum(tab.left,14)}px`,'--tabbar-right':`${cssNum(tab.right,14)}px`,
    '--tabbar-bottom':`${cssNum(tab.bottom,18)}px`,'--tabbar-height':`${cssNum(tab.height,50)}px`,
    '--tabbar-padding':`${cssNum(tab.padding,1.5)}px`,'--tabbar-gap':`${cssNum(tab.gap,6)}px`,'--tabbar-radius':`${cssNum(tab.radius,999)}px`,
    '--tabbar-border-width':`${cssNum(tab.borderWidth,.75)}px`,'--tabbar-blur':`${cssNum(tab.blur,7)}px`,
    '--tabbar-shadow':`${shadowCss(tab.shadow)}, ${shadowCss(tab.shadow2)}`,
    '--tab-icon':`${cssNum(tab.iconSize,35)}px`,'--tab-icon-stroke':cssNum(tab.iconStroke,1.5),

    '--settings-radius':`${cssNum(z.settingsRadius,30)}px`,'--settings-row-height':`${cssNum(z.settingsRowHeight,56)}px`,
    '--settings-side':`${cssNum(z.settingsSide,18)}px`,'--settings-pad-x':`${cssNum(z.settingsPadX,18)}px`,
    '--history-radius':`${cssNum(z.historyRadius,20)}px`,'--history-pad-y':`${cssNum(z.historyPadY,14)}px`,
    '--history-pad-x':`${cssNum(z.historyPadX,16)}px`,'--history-title-size':`${cssNum(z.historyTitleSize,16)}px`,
    '--panel-radius':`${cssNum(z.panelRadius,24)}px`,'--modal-radius':`${cssNum(z.modalRadius,52)}px`,
    '--sheet-card-radius':`${cssNum(z.sheetCardRadius,30)}px`,'--border-width':`${cssNum(z.borderWidth,1)}px`,
    '--icon-stroke':cssNum(z.iconStroke,1.8),

    '--active-disc-duration':`${activeTimerAnimationDuration()}ms`,
    '--active-timer-icon-size':`${activeTimerIconSize()}px`
  };

  for(const [key,value] of Object.entries(vars))if(value!=null)root.style.setProperty(key,value);
}

  

'use strict';


function currentTitle(){ const s=data.current; if(!s)return 'Cronômetro'; return s.manualTitle&&s.title?s.title:`(sem título) ${fmtDateTime(s.firstTimerStartedAt??s.openedAt)}`; }

function timerStateClass(s,rt){ if(isTimerActive(rt))return 'active'; if(isTimerPaused(s,rt))return 'paused'; return ''; }

function svgIcon(name){
  const icons={
    timers:'<circle cx="12" cy="13" r="7.5"/><path d="M12 13V8.7M9 2.5h6M16.7 5.2l1.4-1.4"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    stats:'<path d="M3 3v18h18"/><path d="M7 16v-3"/><path d="M11 16V8"/><path d="M15 16v-5"/><path d="m19 8-4-4-4 4-4-4"/>',
    sliders:'<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
    settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    back:'<path d="M14.8 5.5 8.3 12l6.5 6.5"/>',
    more:'<circle cx="5" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.35" fill="currentColor" stroke="none"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
    plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    close:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    chevrons:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    play:'<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
    pause:'<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
    disc3:'<circle cx="12" cy="12" r="10"/><path d="M6 12c0-1.7.7-3.2 1.8-4.2"/><circle cx="12" cy="12" r="2"/><path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>',
    pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
  };
  const stroke={plus:'var(--plus-stroke,2.5)',check:'var(--check-stroke,3)',close:'var(--close-stroke,2)',chevrons:'var(--chevrons-stroke,1.75)'};
  const sw=stroke[name]??'var(--icon-stroke,2)';
  return `<svg class="sf-icon" viewBox="0 0 24 24" aria-hidden="true" style="stroke-width:${sw}">${icons[name]||''}</svg>`;
}



function activeTimerIconMarkup(){
  if(data.settings.activeTimerIconSource!=='default'&&data.settings.activeTimerIconData){
    return `<img class="custom-active-icon" src="${esc(data.settings.activeTimerIconData)}" alt="">`;
  }
  return svgIcon('disc3');
}

function timerStateIcon(s,rt){
  const active=isTimerActive(rt),paused=isTimerPaused(s,rt);
  const spin=active&&data.settings.animateActiveTimerIcon?' spin':'';
  const markup=active?activeTimerIconMarkup():svgIcon(paused?'pause':'play');
  return `<span class="icon timer-state-icon${spin}" aria-hidden="true">${markup}</span>`;
}

function fmtDurationWithBlinkingColons(ms,blink=false){
  return fmtDuration(ms).split(':').map(part=>`<span class="time-digits">${esc(part)}</span>`).join(`<span class="total-colon${blink?' blink':''}">:</span>`);
}

function refreshTimerReadouts(){
  const s=data.current;
  if(ui.tab!=='timers'||!s)return;
  document.querySelectorAll('[data-timer]').forEach(card=>{
    const rt=s.timers.find(t=>t.id===card.dataset.timer);
    const el=card.querySelector('.time');
    if(rt&&el)el.textContent=fmtDuration(timerDuration(rt));
  });
  const totalEl=document.querySelector('.total-time');
  if(totalEl){
    const running=s.timers.some(isTimerActive);
    totalEl.innerHTML=fmtDurationWithBlinkingColons(sessionTotal(s),running&&data.settings.blinkTotalColon);
  }
}


function shell(content,tab=ui.tab){
  const tabs=[['timers','timers','Cronômetros'],['history','history','Histórico'],['stats','stats','Estatísticas'],['settings','settings','Ajustes']];
  return `<div class="app-shell">${content}</div><nav class="tabbar ${UI_CONFIG.tabbar?.showLabels===false?'hide-labels':''}" aria-label="Navegação principal">
    ${tabs.map(([id,ic,l])=>`<button data-tab="${id}" class="${tab===id?'active':''}" aria-label="${l}">${svgIcon(ic)}<span class="tab-label">${l}</span></button>`).join('')}
  </nav>${data.undo&&data.undo.expiresAt>now()?`<div class="undo"><span>Alteração realizada</span><button id="undoBtn">Desfazer</button></div>`:''}`;
}


function renderTimers(){
  const s=data.current, models=activeModels();
  if(!models.length){ return shell(`<header class="topbar simple"><h1>Cronômetro</h1></header><main class="content"><div class="empty">Nenhum modelo criado.<br><br><button class="ios-button" id="createFirst">Criar modelo</button></div></main>`); }
  if(!s) return '';
  const model=modelById(s.modelId);
  const timerMode=currentTimerMode();
  const central=timerMode.layout==='central';
  const cards=s.timers.sort((a,b)=>a.order-b.order).map(rt=>`<button class="timer-card ${central?'central':''} ${timerStateClass(s,rt)}" data-timer="${rt.id}" aria-label="${esc(rt.name)}, ${fmtDuration(timerDuration(rt))}">
      ${timerStateIcon(s,rt)}
      <span class="name">${esc(rt.name)}${rt.isAdhoc?'<span class="badge">Etapa avulsa</span>':''}</span>
      <span class="time">${fmtDuration(timerDuration(rt))}</span>
    </button>`).join('');
  const running=s.timers.some(isTimerActive);
  const blink=running&&data.settings.blinkTotalColon;
  const titlePopover=ui.popover?.type==='title'?`<div class="popover-backdrop" id="closePopover"></div><div class="title-popover floating-window"><button id="titleRename">Renomear</button><button id="titleEditModel">Editar modelo</button><button id="titleDiscard" class="danger">Descartar</button></div>`:'';
  const modelsDrawer=ui.timerView==='models'?renderModelsDrawer():'';
  return shell(`<header class="topbar timer-topbar"><div class="header-row"><button class="circle-button" id="modelsBack" aria-label="Modelos">${svgIcon('back')}</button><button class="current-title ${s.manualTitle?'':'untitled'}" id="currentTitleButton">${esc(currentTitle())}</button><button class="circle-button" id="sessionMenu" aria-label="Detalhes">${svgIcon('more')}</button>${titlePopover}</div><div class="current-model-name">${esc(model?.name||s.modelNameSnapshot)}</div>${s.customized?'<div class="status-line">Personalizado neste registro</div>':''}</header>
  <main class="content timer-content"><div class="timer-list">${cards}<button class="add-card" id="addAdhoc">${svgIcon('plus')}<span>Adicionar cronômetro</span></button></div></main>
  <div class="floating-actions timer-actions"><section class="total-card floating-card ${running?'running':''}"><span class="total-icon">${svgIcon('clock')}</span><span class="total-copy"><small>Tempo total</small><strong class="total-time">${fmtDurationWithBlinkingColons(sessionTotal(s),blink)}</strong></span></section><button class="save-btn" id="saveBtn">${svgIcon('check')}<span>Salvar</span></button></div>${modelsDrawer}`);
}


function renderHistory(){
  const sessions=data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt).sort((a,b)=>(b.restoredAt||b.savedAt)-(a.restoredAt||a.savedAt));
  const filtered=sessions.filter(s=>{
    const q=ui.historyQuery.trim().toLocaleLowerCase(); if(q&&!s.title.toLocaleLowerCase().includes(q))return false;
    if(ui.historyModel!=='all'&&s.modelId!==ui.historyModel)return false;
    if(ui.historyDate&&dayKey(s.restoredAt||s.savedAt)!==ui.historyDate)return false; return true;
  });
  const groups={};filtered.forEach(s=>{const k=dayKey(s.restoredAt||s.savedAt);(groups[k]??=[]).push(s);});
  const list=Object.entries(groups).map(([k,arr])=>`<div class="history-day">${fmtDate(new Date(k+'T12:00:00').getTime())}</div>${arr.map(s=>`<button class="history-card" data-session="${s.id}"><div class="top"><strong>${esc(s.title)}</strong>${s.isNoMeasurement?'':`<span class="history-total">${svgIcon('timers')}<span>${fmtDuration(sessionTotal(s,s.savedAt))}</span></span>`}</div>${s.isNoMeasurement?'<span class="badge">Sem medição</span>':''}${s.restoredAt?'<span class="badge">Restaurado</span>':''}</button>`).join('')}`).join('');
  return shell(`<header class="topbar simple section-tab-header history-header"><span></span><h1>Registros</h1><button class="header-pill" id="historyTrash">Apagados</button></header><main class="content history-content"><div class="filters"><input id="historySearch" placeholder="Buscar título" value="${esc(ui.historyQuery)}"><select id="historyModel"><option value="all">Todos os modelos</option>${activeModels().map(m=>`<option value="${m.id}" ${ui.historyModel===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select><div class="date-filter"><input id="historyDate" type="date" value="${esc(ui.historyDate)}">${ui.historyDate?`<button id="historyDateClear" aria-label="Limpar data">${svgIcon('close')}</button>`:''}</div></div>${list||'<div class="empty">Nenhum registro encontrado.</div>'}</main>`);
}


function validMeasuredSessions(){ return data.sessions.filter(s=>s.status==='saved'&&!s.deletedAt&&!s.isNoMeasurement && !!modelById(s.modelId)); }

  