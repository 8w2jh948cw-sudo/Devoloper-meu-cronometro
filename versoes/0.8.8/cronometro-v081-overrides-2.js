function statsSection(title,body){return `<details class="panel stats-collapsible"><summary>${esc(title)}</summary><div class="stats-collapsible-body">${body}</div></details>`;}
function renderStats(){
  const areas=getAreas();
  const ss=validMeasuredSessions().filter(s=>ui.statsArea==='all'||sessionAreaId(s)===ui.statsArea);
  const count=ss.length,total=ss.reduce((a,s)=>a+sessionTotal(s,s.savedAt),0),avg=count?total/count:0;
  const byTimer=new Map();
  ss.forEach(s=>s.timers.forEach(t=>{const d=timerDuration(t,s.savedAt);if(d<=0)return;const key=t.templateId||`adhoc:${t.name}`;const x=byTimer.get(key)||{name:t.name,vals:[],total:0};x.vals.push(d);x.total+=d;byTimer.set(key,x);}));
  const timers=[...byTimer.values()].sort((a,b)=>b.total-a.total),maxTotal=Math.max(1,...timers.map(x=>x.total));
  let trend='Sem dados suficientes';
  if(ss.length>=2){const ordered=[...ss].sort((a,b)=>recordDateMs(a)-recordDateMs(b));const half=Math.max(1,Math.floor(ordered.length/2));const a=ordered.slice(0,half).reduce((x,s)=>x+sessionTotal(s,s.savedAt),0)/half;const bArr=ordered.slice(-half);const b=bArr.reduce((x,s)=>x+sessionTotal(s,s.savedAt),0)/bArr.length;const pct=a?((b-a)/a*100):0;trend=pct<0?`${Math.abs(pct).toFixed(1).replace('.',',')}% mais rápido`:`${pct.toFixed(1).replace('.',',')}% mais lento`;}
  const timerRows=kind=>timers.map(x=>{let value;if(kind==='avg')value=x.total/x.vals.length;if(kind==='best')value=Math.min(...x.vals);if(kind==='worst')value=Math.max(...x.vals);return `<div class="row"><span>${esc(x.name)}</span><strong>${fmtDuration(value)}</strong></div>`}).join('')||'<div class="muted">Sem dados.</div>';
  const percentRows=timers.map(x=>`<div><div class="row"><span>${esc(x.name)}</span><strong>${total?(x.total/total*100).toFixed(1).replace('.',','):0}%</strong></div><div class="bar"><span style="width:${Math.min(100,x.total/maxTotal*100)}%"></span></div></div>`).join('')||'<div class="muted">Sem dados.</div>';
  const sections=count?[
    statsSection('Resumo',`<div class="row"><span>Registros medidos</span><strong>${count}</strong></div><div class="row"><span>Tempo acumulado</span><strong>${fmtDuration(total)}</strong></div><div class="row"><span>Média por registro</span><strong>${fmtDuration(avg)}</strong></div>`),
    statsSection('Tempo total por registro',[...ss].sort((a,b)=>recordDateMs(b)-recordDateMs(a)).slice(0,12).map(s=>`<div class="row"><span>${esc(s.title)}</span><strong>${fmtDuration(sessionTotal(s,s.savedAt))}</strong></div>`).join('')),
    statsSection('Tempo de cada cronômetro',timers.map(x=>`<div><div class="row"><span>${esc(x.name)}</span><strong>${fmtDuration(x.total)}</strong></div><div class="bar"><span style="width:${x.total/maxTotal*100}%"></span></div></div>`).join('')),
    statsSection('Média por cronômetro',timerRows('avg')),
    statsSection('Melhor tempo',timerRows('best')),
    statsSection('Pior tempo',timerRows('worst')),
    statsSection('Percentual no tempo total',percentRows),
    statsSection('Evolução / tendência',`<div class="stat-big">${esc(trend)}</div><p class="muted small">Comparação da média da primeira metade dos registros com a metade mais recente.</p>`)
  ].join(''):'';
  return shell(`<header class="topbar section-tab-header"><h1>Estatísticas</h1></header><div class="stats-area-filter"><select id="statsArea"><option value="all">Todas as áreas</option>${areas.map(a=>`<option value="${esc(a.id)}" ${ui.statsArea===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div><main class="content"><h2 class="section-title">Visão geral</h2>${count?`<div class="stats-grid">${sections}</div>`:`<div class="empty">As estatísticas aparecerão depois que você salvar registros com medição nesta área.</div>`}</main>`);
}

function renderPendingModelSwitch(targetModelId){
  const m=modelById(targetModelId);if(!m)return '';
  return `<div class="modal-wrap pending-switch-wrap" id="pendingSwitchBackdrop"><section class="sheet pending-switch-sheet" role="dialog" aria-modal="true" aria-labelledby="pendingSwitchTitle"><div class="pending-switch-copy"><h2 id="pendingSwitchTitle">O que fazer com o registro atual?</h2><p>Antes de abrir “${esc(m.name)}”, escolha se deseja salvar ou descartar o registro atual.</p></div><div class="pending-switch-actions"><button class="pending-switch-button primary" id="pendingSwitchSave">Salvar e abrir o modelo</button><button class="pending-switch-button danger" id="pendingSwitchDiscard">Descartar e abrir o modelo</button><button class="pending-switch-button secondary" id="pendingSwitchCancel">Voltar aos cronômetros</button></div></section></div>`;
}

/* Organizador compacto com arraste pelo puxador. */
function organizeStateMarkup(s,t){const used=timerDuration(t)>0||isTimerActive(t);return `<span class="organize-state-icon">${svgIcon(used?'pause':'play')}</span>`;}
function renderOrganize(){
  const s=data.current;
  return `<div class="modal-wrap"><section class="sheet organize-sheet"><div class="sheet-head"><h2>Reordenar cronômetros</h2><button class="chip" id="closeModal">Concluir</button></div><p class="organize-hint">Arraste pelo puxador da direita. Toque no nome para renomear e no marcador para escolher emoji ou ícone.</p><div class="organize-list" id="organizeList">${s.timers.sort((a,b)=>a.order-b.order).map(t=>`<div class="organize-timer-card" data-organize-timer="${t.id}">${organizeStateMarkup(s,t)}<button class="organize-marker-button" data-current-marker="${t.id}" aria-label="Marcador de ${esc(t.name)}">${visualMarkerMarkup(t.marker)}</button><button class="organize-name-button" data-rename-current="${t.id}">${esc(t.name)}</button><button class="organize-delete-button" data-remove-current="${t.id}" aria-label="Remover ${esc(t.name)}">${trashIconMarkup()}</button><button class="organize-drag-handle" data-reorder-handle="${t.id}" aria-label="Arrastar ${esc(t.name)}">≡</button></div>`).join('')}</div></section></div>`;
}
async function persistOrganizeDomOrder(){
  const ids=[...document.querySelectorAll('#organizeList [data-organize-timer]')].map(el=>el.dataset.organizeTimer);
  if(!data.current||!ids.length)return;
  const map=new Map(data.current.timers.map(t=>[t.id,t]));
  data.current.timers=ids.map((id,i)=>{const t=map.get(id);if(t)t.order=i;return t;}).filter(Boolean);
  data.current.customized=true;await persistCurrent();
}
function bindOrganizerDrag(){
  const list=document.getElementById('organizeList');if(!list)return;
  list.querySelectorAll('[data-reorder-handle]').forEach(handle=>{
    handle.onpointerdown=e=>{
      if(e.button!=null&&e.button!==0)return;
      const card=handle.closest('[data-organize-timer]');if(!card)return;
      e.preventDefault();handle.setPointerCapture?.(e.pointerId);card.classList.add('dragging');
      const move=ev=>{
        ev.preventDefault();const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest?.('[data-organize-timer]');
        if(!target||target===card||target.parentElement!==list)return;
        const rect=target.getBoundingClientRect();const before=ev.clientY<rect.top+rect.height/2;
        list.insertBefore(card,before?target:target.nextSibling);
      };
      const up=async ev=>{handle.releasePointerCapture?.(e.pointerId);card.classList.remove('dragging');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);await persistOrganizeDomOrder();};
      handle.addEventListener('pointermove',move,{passive:false});handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up);
    };
  });
}
