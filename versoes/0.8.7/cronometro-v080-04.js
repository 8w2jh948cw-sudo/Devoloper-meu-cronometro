function renderStats(){
  const ss=validMeasuredSessions(); const count=ss.length,total=ss.reduce((a,s)=>a+sessionTotal(s,s.savedAt),0),avg=count?total/count:0;
  const byTimer=new Map();
  ss.forEach(s=>s.timers.forEach(t=>{const d=timerDuration(t,s.savedAt);if(d<=0)return;const key=t.templateId||`adhoc:${t.name}`;const x=byTimer.get(key)||{name:t.name,vals:[],total:0};x.vals.push(d);x.total+=d;byTimer.set(key,x);}));
  const timers=[...byTimer.values()].sort((a,b)=>b.total-a.total); const maxTotal=Math.max(1,...timers.map(x=>x.total));
  let trend='Sem dados suficientes'; if(ss.length>=2){const ordered=[...ss].sort((a,b)=>a.originalRecordedAt-b.originalRecordedAt);const half=Math.max(1,Math.floor(ordered.length/2));const a=ordered.slice(0,half).reduce((x,s)=>x+sessionTotal(s,s.savedAt),0)/half;const bArr=ordered.slice(-half);const b=bArr.reduce((x,s)=>x+sessionTotal(s,s.savedAt),0)/bArr.length;const pct=a?((b-a)/a*100):0;trend=pct<0?`${Math.abs(pct).toFixed(1).replace('.',',')}% mais rápido`:`${pct.toFixed(1).replace('.',',')}% mais lento`;}
  const timerRows=(kind)=>timers.map(x=>{let value;if(kind==='avg')value=x.total/x.vals.length;if(kind==='best')value=Math.min(...x.vals);if(kind==='worst')value=Math.max(...x.vals);return `<div class="row"><span>${esc(x.name)}</span><strong>${fmtDuration(value)}</strong></div>`}).join('')||'<div class="muted">Sem dados.</div>';
  const percentRows=timers.map(x=>`<div><div class="row"><span>${esc(x.name)}</span><strong>${total?(x.total/total*100).toFixed(1).replace('.',','):0}%</strong></div><div class="bar"><span style="width:${Math.min(100,x.total/maxTotal*100)}%"></span></div></div>`).join('')||'<div class="muted">Sem dados.</div>';
  return shell(`<header class="topbar section-tab-header"><h1>Estatísticas</h1></header><main class="content"><h2 class="section-title">Visão geral</h2>${count?`<div class="stats-grid">
    <section class="panel"><h3>Resumo</h3><div class="row"><span>Registros medidos</span><strong>${count}</strong></div><div class="row"><span>Tempo acumulado</span><strong>${fmtDuration(total)}</strong></div><div class="row"><span>Média por registro</span><strong>${fmtDuration(avg)}</strong></div></section>
    <section class="panel"><h3>Tempo total por registro</h3>${ss.sort((a,b)=>b.originalRecordedAt-a.originalRecordedAt).slice(0,12).map(s=>`<div class="row"><span>${esc(s.title)}</span><strong>${fmtDuration(sessionTotal(s,s.savedAt))}</strong></div>`).join('')}</section>
    <section class="panel"><h3>Tempo de cada cronômetro</h3>${timers.map(x=>`<div><div class="row"><span>${esc(x.name)}</span><strong>${fmtDuration(x.total)}</strong></div><div class="bar"><span style="width:${x.total/maxTotal*100}%"></span></div></div>`).join('')}</section>
    <section class="panel"><h3>Média por cronômetro</h3>${timerRows('avg')}</section>
    <section class="panel"><h3>Melhor tempo</h3>${timerRows('best')}</section>
    <section class="panel"><h3>Pior tempo</h3>${timerRows('worst')}</section>
    <section class="panel"><h3>Percentual no tempo total</h3>${percentRows}</section>
    <section class="panel"><h3>Evolução / tendência</h3><div class="stat-big">${esc(trend)}</div><p class="muted small">Comparação da média da primeira metade dos registros com a metade mais recente.</p></section>
  </div>`:`<div class="empty">As estatísticas aparecerão depois que você salvar registros com medição.</div>`}</main>`);
}



function renderSettings(){
  const presets=UI_CONFIG.themePresets||[];
  const speeds=Object.values(UI_CONFIG.animationSpeeds||{});
  const iconSizes=Object.values(UI_CONFIG.activeIconSizes||{});
  const customSelected=data.settings.colorTheme==='custom';
  const hasSound=!!data.settings.timerSoundData;
  const speedRow=data.settings.animateActiveTimerIcon?`<div class="settings-row animation-speed-row"><div class="animation-speed-options" role="group" aria-label="Velocidade da animação">${speeds.map(sp=>`<button data-animation-speed="${esc(sp.id)}" class="${data.settings.activeTimerAnimationSpeed===sp.id?'selected':''}" aria-pressed="${data.settings.activeTimerAnimationSpeed===sp.id?'true':'false'}">${esc(sp.name)}</button>`).join('')}</div></div>`:'';
  const currentIconName=data.settings.activeTimerIconSource==='default'?'DVD':(data.settings.activeTimerIconName||'Personalizado');
  const areas=getAreas();

  return shell(`<header class="topbar simple section-tab-header"><h1>Ajustes</h1></header><main class="settings-content">
    <section class="settings-section"><div class="settings-card sound-settings-card">
      <button class="settings-row button-row" id="toggleTimerSound" aria-pressed="${data.settings.timerSoundEnabled?'true':'false'}"><span>Som do cronômetro</span><span class="ios-switch ${data.settings.timerSoundEnabled?'on':''}" aria-hidden="true"></span></button>
      <label class="settings-row button-row accent-button-row" for="timerSoundFile"><span>${hasSound?'Trocar áudio':'Adicionar áudio'}</span><span class="secondary-value">${hasSound?esc(data.settings.timerSoundName||'Áudio adicionado'):'Nenhum áudio'}</span><input id="timerSoundFile" class="sr-only" type="file" accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav"></label>
      ${hasSound?`<label class="settings-row volume-row"><span>Volume</span><span class="range-wrap"><input id="timerSoundVolume" type="range" min="0" max="100" step="1" value="${Math.round((data.settings.timerSoundVolume??.35)*100)}"><span>${Math.round((data.settings.timerSoundVolume??.35)*100)}%</span></span></label><button class="settings-row button-row danger" id="removeTimerSound"><span>Remover áudio</span></button>`:''}
    </div></section>

    <section class="settings-section"><h3 class="section-label">Tema</h3><div class="settings-card color-card"><div class="theme-presets horizontal-themes">${presets.map(p=>`<button class="theme-preset ${data.settings.colorTheme===p.id?'selected':''}" data-color-theme="${esc(p.id)}"><span class="theme-dot" style="--theme-accent:${esc(p.accent)};--theme-action:${esc(p.action)}"></span><span>${esc(p.name)}</span></button>`).join('')}<button class="theme-preset ${customSelected?'selected':''}" data-color-theme="custom"><span class="theme-dot custom-dot" style="--theme-accent:${esc(data.settings.accentColor||'#007AFF')};--theme-action:${esc(data.settings.accentColor||'#007AFF')}"></span><span>Personalizada</span></button></div>${customSelected?`<div class="custom-theme-row"><input id="accentCustom" type="color" value="${esc(data.settings.accentColor||'#007AFF')}"><span>${esc((data.settings.accentColor||'#007AFF').toUpperCase())}</span></div>`:''}</div></section>

    <section class="settings-section"><div class="settings-card"><label class="settings-row" for="themeSelect"><span>Aparência</span><span class="select-wrap"><select id="themeSelect"><option value="system" ${data.settings.theme==='system'?'selected':''}>Sistema</option><option value="light" ${data.settings.theme==='light'?'selected':''}>Claro</option><option value="dark" ${data.settings.theme==='dark'?'selected':''}>Escuro</option></select><span class="chevrons">${svgIcon('chevrons')}</span></span></label></div></section>

    <section class="settings-section"><h3 class="section-label">Áreas</h3><div class="settings-card areas-settings-card">
      ${areas.map(a=>`<div class="settings-row area-settings-row"><span>${esc(a.name)}</span><span class="area-row-actions"><button data-rename-area="${esc(a.id)}">Renomear</button>${a.id!=='general'?`<button class="danger" data-delete-area="${esc(a.id)}">Apagar</button>`:''}</span></div>`).join('')}
      <button class="settings-row button-row accent-button-row" id="addArea"><span>Adicionar área</span></button>
    </div><p class="section-footer">Use áreas para separar modelos, Histórico e Estatísticas, por exemplo: Unhas, Casa e Outros.</p></section>

    <section class="settings-section"><h3 class="section-label">Ícone do cronômetro ativo</h3><div class="settings-card active-icon-source-card">
      <div class="settings-row"><span>Ícone atual</span><span class="secondary-value">${esc(currentIconName)}</span></div>
      <label class="settings-row button-row accent-button-row" for="activeIconFile"><span>Escolher SVG ou PNG</span><input id="activeIconFile" class="sr-only" type="file" accept="image/svg+xml,image/png,.svg,.png"></label>
      <button class="settings-row button-row accent-button-row" id="pasteSvgCode"><span>Colar código SVG</span></button>
      <button class="settings-row button-row accent-button-row" id="pasteSvgUrl"><span>Colar link SVG</span></button>
      ${data.settings.activeTimerIconSource!=='default'?`<button class="settings-row button-row" id="restoreDefaultActiveIcon"><span>Restaurar DVD</span></button>`:''}
    </div></section>

    <section class="settings-section"><div class="settings-card icon-size-settings-card"><div class="settings-row compact-title-row"><strong>Tamanho do ícone</strong></div><div class="settings-row animation-speed-row"><div class="animation-speed-options four-options" role="group" aria-label="Tamanho do ícone">${iconSizes.map(sz=>`<button data-active-icon-size="${esc(sz.id)}" class="${data.settings.activeTimerIconSize===sz.id?'selected':''}" aria-pressed="${data.settings.activeTimerIconSize===sz.id?'true':'false'}">${esc(sz.name)}</button>`).join('')}</div></div></div></section>

    <section class="settings-section"><div class="settings-card animation-settings-card"><button class="settings-row button-row" id="toggleActiveTimerAnimation" aria-pressed="${data.settings.animateActiveTimerIcon?'true':'false'}"><span>Animar ícone do cronômetro ativo</span><span class="ios-switch ${data.settings.animateActiveTimerIcon?'on':''}" aria-hidden="true"></span></button>${speedRow}</div></section>

    <section class="settings-section"><div class="settings-card"><button class="settings-row button-row" id="toggleTotalColonBlink" aria-pressed="${data.settings.blinkTotalColon?'true':'false'}"><span>Piscar os dois pontos do tempo total</span><span class="ios-switch ${data.settings.blinkTotalColon?'on':''}" aria-hidden="true"></span></button><button class="settings-row button-row" id="toggleVersionBadge" aria-pressed="${data.settings.showVersionBadge?'true':'false'}"><span>Mostrar versão no topo</span><span class="ios-switch ${data.settings.showVersionBadge?'on':''}" aria-hidden="true"></span></button></div></section>

    <section class="settings-section"><h3 class="section-label">Backup</h3><div class="settings-card"><button class="settings-row button-row accent-button-row" id="exportJson"><span>Fazer backup</span></button></div><p class="section-footer">Salve o arquivo JSON em uma pasta que você não se esqueça</p></section>
    <section class="settings-section"><div class="settings-card"><label class="settings-row button-row" for="importJsonFile"><span>Restaurar Backup</span><input id="importJsonFile" class="sr-only" type="file" accept="application/json,.json"></label></div><p class="section-footer">Restaura um backup substituindo os dados atuais pelos dados do arquivo JSON escolhido.</p></section>
    <section class="settings-section"><h3 class="section-label">Dados e exportação</h3><div class="settings-card"><button class="settings-row button-row" id="exportCsv"><span>Exportar CSV para planilhas</span></button><button class="settings-row button-row" id="exportPdf"><span>Exportar relatório PDF</span></button></div></section>
    <section class="settings-section"><h3 class="section-label">Armazenamento</h3><div class="settings-card"><div class="settings-row"><span>Dados salvos em</span><span class="secondary-value">Neste aparelho</span></div><div class="settings-row"><span>iCloud</span><span class="secondary-value">Apenas se salvo manualmente</span></div></div><p class="section-footer">Os registros são salvos em cache no seu navegador, caso o cache seja limpo, os dados serão perdidos.</p></section>
    <section class="settings-section"><div class="settings-card"><div class="settings-row"><span>Versão</span><span class="secondary-value">${esc(APP_META.version)}</span></div></div></section>
  </main>`);
}


function renderModelsDrawer(){
  const all=activeModels();
  return `<div class="models-drawer-overlay" id="modelsDrawerBackdrop">
    <aside class="models-drawer" role="dialog" aria-modal="true" aria-label="Modelos">
      <header class="topbar simple models-header models-drawer-header">
        <button class="text-button models-edit-button" id="toggleModelsEdit">${ui.modelsEditing?'Concluir':'Editar'}</button>
        <h1>Modelos</h1>
        <button class="circle-button models-close-button" id="closeModelsDrawer" aria-label="Fechar modelos">${svgIcon('close')}</button>
      </header>
      <main class="content models-page">
        <button class="create-model-card" id="createModel">${svgIcon('plus')}<span>Criar novo modelo</span></button>
        <div class="models-list">${all.map((m,i)=>`<div class="model-list-item"><button class="model-main" data-choose-model="${m.id}"><strong>${esc(m.name)}</strong><span>${m.timers.filter(t=>!t.removedAt).length} cronômetro(s)</span></button>${ui.modelsEditing?`<div class="model-reorder"><button data-move-model="${m.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-move-model="${m.id}" data-dir="1" ${i===all.length-1?'disabled':''}>↓</button></div>`:`<button class="circle-button small-circle" data-model-options="${m.id}" aria-label="Opções de ${esc(m.name)}">${svgIcon('more')}</button>`}${ui.popover?.type==='modelOptions'&&ui.popover.id===m.id?`<div class="popover-backdrop" id="closePopover"></div><div class="model-popover floating-window"><button data-model-rename="${m.id}">Renomear</button><button data-model-edit="${m.id}">Editar</button><button data-model-dup="${m.id}">Duplicar</button><button data-model-delete="${m.id}" class="danger">Apagar</button></div>`:''}</div>`).join('')}</div>
      </main>
    </aside>
  </div>`;
}

function renderEditModel(m){ const ts=m.timers.filter(t=>!t.removedAt).sort((a,b)=>a.order-b.order);return `<div class="modal-wrap"><section class="sheet"><div class="sheet-head"><h2>${esc(m.name)}</h2><button class="chip" id="closeToModels">Concluir</button></div><div class="toolbar"><button id="renameModel">Renomear modelo</button><button id="addTemplate">＋ Cronômetro</button></div>${ts.length?ts.map((t,i)=>`<div class="panel"><div class="row"><span><strong>${esc(t.name)}</strong></span><span class="toolbar"><button data-move-template="${t.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-move-template="${t.id}" data-dir="1" ${i===ts.length-1?'disabled':''}>↓</button></span></div><div class="toolbar"><button data-edit-template="${t.id}">Editar</button><button data-remove-template="${t.id}" class="danger">Remover</button></div></div>`).join(''):'<div class="empty">Este modelo está vazio. Você pode mantê-lo assim ou adicionar cronômetros.</div>'}</section></div>`; }

function renderPendingModelSwitch(targetModelId){
  const m=modelById(targetModelId);
  if(!m)return '';
  return `<div class="modal-wrap pending-switch-wrap">
    <section class="sheet pending-switch-sheet" role="dialog" aria-modal="true" aria-labelledby="pendingSwitchTitle">
      <div class="pending-switch-copy">
        <h2 id="pendingSwitchTitle">Registro atual não foi salvo</h2>
        <p>Antes de abrir “${esc(m.name)}”, escolha o que fazer com o registro atual.</p>
      </div>
      <div class="pending-switch-actions">
        <button class="pending-switch-button primary" id="pendingSwitchSave">Salvar registro e abrir este modelo</button>
        <button class="pending-switch-button danger" id="pendingSwitchDiscard">Descartar registro e abrir este modelo</button>
        <button class="pending-switch-button secondary" id="pendingSwitchCancel">Cancelar e voltar aos cronômetros</button>
      </div>
    </section>
  </div>`;
}


function renderSessionMenu(){ const s=data.current;return `<div class="modal-wrap"><section class="sheet details-sheet" role="dialog" aria-modal="true"><div class="sheet-head liquid-head"><button class="circle-button glass detail-close-button" id="closeModal" aria-label="Fechar">${svgIcon('close')}</button><h2>Detalhes</h2><span class="sheet-spacer"></span></div><div class="sheet-body"><section class="sheet-card timer-size-detail-card"><div class="detail-card-title">Tamanho</div><div class="detail-card-divider"></div><div class="detail-size-options animation-speed-options" role="group" aria-label="Tamanho dos cronômetros"><button data-timer-size="small" class="${data.settings.timerSize==='small'?'selected':''}">Pequeno</button><button data-timer-size="large" class="${data.settings.timerSize==='large'?'selected':''}">Grande</button></div></section><section class="sheet-card"><textarea id="currentNote" class="notes-box" rows="5" placeholder="Notas">${esc(s.note)}</textarea></section><section class="sheet-card"><button class="sheet-row action-row" id="menuCustomize">Organizar cronômetros</button><button class="detail-action" id="saveAsNewModel">Salvar como novo modelo</button><button class="detail-action" id="updateCurrentModel">Atualizar modelo atual</button></section></div></section></div>`; }


function renderOrganize(){const s=data.current;return `<div class="modal-wrap"><section class="sheet"><div class="sheet-head"><h2>Organizar registro</h2><button class="chip" id="closeModal">Concluir</button></div>${s.timers.sort((a,b)=>a.order-b.order).map((t,i)=>`<div class="panel"><div class="row"><strong>${esc(t.name)}</strong><span class="toolbar"><button data-move-current="${t.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-move-current="${t.id}" data-dir="1" ${i===s.timers.length-1?'disabled':''}>↓</button></span></div><div class="toolbar"><button data-rename-current="${t.id}">Renomear</button><button data-remove-current="${t.id}" class="danger">Remover</button></div></div>`).join('')}</section></div>`;}

