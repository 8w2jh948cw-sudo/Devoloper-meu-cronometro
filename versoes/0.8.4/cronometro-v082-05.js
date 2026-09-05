/* Eventos v0.8.2 */
function bindV082Events(){
  const byId=id=>document.getElementById(id);
  document.querySelectorAll('[data-activate-area]').forEach(b=>b.onclick=e=>{e.stopPropagation();activateArea(b.dataset.activateArea);});
  if(byId('currentTitleButton')&&isClientArea(sessionAreaId(data.current)))byId('currentTitleButton').onclick=()=>{ui.popover=null;ui.modal={type:'clientPicker',target:'current'};render();};
  document.querySelectorAll('[data-edit-record-client]').forEach(b=>b.onclick=()=>{ui.modal={type:'clientPicker',target:'saved',sessionId:b.dataset.editRecordClient};render();});
  document.querySelectorAll('[data-open-client]').forEach(b=>b.onclick=()=>{ui.modal={type:'clientProfile',clientId:b.dataset.openClient};render();});
  document.querySelectorAll('[data-open-client-record]').forEach(b=>b.onclick=()=>{ui.modal={type:'session',id:b.dataset.openClientRecord};render();});
  document.querySelectorAll('[data-edit-dual-notes]').forEach(b=>b.onclick=()=>{ui.modal={type:'notesEditor',sessionId:b.dataset.editDualNotes};render();});
  document.querySelectorAll('[data-reclassify-record]').forEach(b=>b.onclick=()=>{ui.modal={type:'recordAreaPicker',sessionId:b.dataset.reclassifyRecord};render();});
  document.querySelectorAll('[data-measurement-status]').forEach(b=>b.onclick=()=>setTimerMeasurementStatus(b.dataset.sessionId,b.dataset.timerId,b.dataset.measurementStatus));
  document.querySelectorAll('[data-restore-short]').forEach(b=>b.onclick=()=>restoreIgnoredInterval(b.dataset.restoreShort,b.dataset.timerId,b.dataset.index));
  document.querySelectorAll('[data-history-client]').forEach(b=>b.onclick=()=>{const c=clientById(b.dataset.historyClient);if(!c)return;ui.historyClientId=c.id;ui.historyQuery=c.name;render();});
  if(byId('historySearch'))byId('historySearch').oninput=e=>{ui.historyQuery=e.target.value;ui.historyClientId=null;render();};
  const ap=byId('currentAppointmentNote');if(ap){autoGrowTextarea(ap);ap.oninput=e=>{autoGrowTextarea(e.target);data.current.appointmentNote=e.target.value;data.current.note=e.target.value;clearTimeout(ap._tm);ap._tm=setTimeout(()=>persistCurrent(),180);};}
  const cn=byId('currentClientNote');if(cn){autoGrowTextarea(cn);cn.oninput=e=>{autoGrowTextarea(e.target);data.current.clientNote=e.target.value;clearTimeout(cn._tm);cn._tm=setTimeout(()=>persistCurrent(),180);};}
  if(byId('openAdvancedSettings'))byId('openAdvancedSettings').onclick=()=>{ui.settingsView='advanced';render();};
  if(byId('closeAdvancedSettings'))byId('closeAdvancedSettings').onclick=()=>{ui.settingsView='appearance';render();};
  if(byId('editClientEmptyLabel'))byId('editClientEmptyLabel').onclick=async()=>{const raw=await iosTextPrompt({title:'Texto sem cliente',message:'Esse texto aparece quando nenhum cliente estiver vinculado.',value:data.settings.clientEmptyLabel||'Sem cliente',placeholder:'Sem cliente'});const v=String(raw??'').trim();if(v){data.settings.clientEmptyLabel=v;await persistSettings();render();}};
  document.querySelectorAll('[data-change-area-type]').forEach(b=>b.onclick=()=>{const a=areaById(b.dataset.changeAreaType);ui.modal={type:'areaTypeExisting',areaId:a.id,pendingAreaName:a.name};render();});
  if(byId('modelAreaSelect'))byId('modelAreaSelect').onchange=async e=>{const m=modelById(ui.modal?.id);if(!m)return;m.areaId=e.target.value;m.updatedAt=now();await put('models',m);if(data.current?.modelId===m.id){data.current.areaId=m.areaId;await persistCurrent();data.settings.activeAreaId=m.areaId;await persistSettings();}render();};
  const rangeBind=(id,key,div=100)=>{const el=byId(id);if(!el)return;el.oninput=e=>{data.settings[key]=Number(e.target.value)/div;applyTheme();const label=e.target.closest('.advanced-setting')?.querySelector('.advanced-setting-head span:last-child');if(label)label.textContent=`${e.target.value}%`;};el.onchange=async()=>persistSettings();};
  rangeBind('uiTextScale','uiTextScale');rangeBind('uiCardScale','uiCardScale');rangeBind('uiIconScale','uiIconScale');
  document.querySelectorAll('[data-ui-density]').forEach(b=>b.onclick=async()=>{data.settings.uiDensity=b.dataset.uiDensity;await persistSettings();render();});
  document.querySelectorAll('[data-ui-font]').forEach(b=>b.onclick=async()=>{data.settings.uiFontPreset=b.dataset.uiFont;await persistSettings();render();});
  if(byId('toggleIgnoreShort'))byId('toggleIgnoreShort').onclick=async()=>{data.settings.ignoreShortMeasurements=!data.settings.ignoreShortMeasurements;await persistSettings();render();};
  if(byId('shortThreshold')){byId('shortThreshold').oninput=e=>{data.settings.shortMeasurementThresholdSec=Number(e.target.value);const label=e.target.closest('.advanced-setting')?.querySelector('.advanced-setting-head span:last-child');if(label)label.textContent=`${e.target.value}s`;};byId('shortThreshold').onchange=()=>persistSettings();}
}
const __renderV082Base=render;let __v082Migrated=false;let __v082MigrationPromise=null;
function __renderV082Enhanced(){
  __renderV082Base();
  if(ui.modal?.type==='clientPicker')$app.insertAdjacentHTML('beforeend',renderClientPicker());
  if(ui.modal?.type==='clientProfile')$app.insertAdjacentHTML('beforeend',renderClientProfile(ui.modal.clientId));
  if(ui.modal?.type==='notesEditor')$app.insertAdjacentHTML('beforeend',renderNotesEditor(ui.modal.sessionId));
  if(ui.modal?.type==='recordAreaPicker')$app.insertAdjacentHTML('beforeend',renderRecordAreaPicker(ui.modal.sessionId));
  if(ui.modal?.type==='areaTypeNew'||ui.modal?.type==='areaTypeExisting')$app.insertAdjacentHTML('beforeend',renderAreaTypeChooser(ui.modal.pendingAreaName,ui.modal.areaId));
  applyTheme();
  if(ui.modal?.type==='clientPicker'){const wrap=document.querySelector('.client-picker-wrap'),detach=fitPromptToVisualViewport(wrap);wrap._detach=detach;fillClientPickerList('');const input=document.getElementById('clientPickerSearch');if(input){input.oninput=e=>fillClientPickerList(e.target.value);setTimeout(()=>input.focus({preventScroll:true}),50);}if(document.getElementById('closeClientPicker'))document.getElementById('closeClientPicker').onclick=()=>{detach();closeClientPicker();};wrap.onclick=e=>{if(e.target===wrap){detach();closeClientPicker();}};}
  if(ui.modal?.type==='clientProfile'){const wrap=document.querySelector('.client-profile-wrap');document.getElementById('closeClientProfile')?.addEventListener('click',()=>{ui.modal=null;render();});wrap?.addEventListener('click',e=>{if(e.target===wrap){ui.modal=null;render();}});}
  if(ui.modal?.type==='notesEditor'){const wrap=document.querySelector('.notes-editor-wrap'),detach=fitPromptToVisualViewport(wrap);document.getElementById('closeNotesEditor')?.addEventListener('click',()=>{detach();ui.modal={type:'session',id:ui.modal.sessionId};render();});document.getElementById('saveNotesEditor')?.addEventListener('click',()=>{detach();saveNotesEditor();});wrap?.addEventListener('click',e=>{if(e.target===wrap){detach();ui.modal={type:'session',id:ui.modal.sessionId};render();}});}
  if(ui.modal?.type==='recordAreaPicker'){const wrap=document.querySelector('.area-type-wrap');document.getElementById('closeRecordAreaPicker')?.addEventListener('click',()=>{ui.modal={type:'session',id:ui.modal.sessionId};render();});document.querySelectorAll('[data-record-area-choice]').forEach(b=>b.onclick=()=>reclassifyRecordArea(ui.modal.sessionId,b.dataset.recordAreaChoice));wrap?.addEventListener('click',e=>{if(e.target===wrap){ui.modal={type:'session',id:ui.modal.sessionId};render();}});}
  if(ui.modal?.type==='areaTypeNew'||ui.modal?.type==='areaTypeExisting'){const wrap=document.querySelector('.area-type-wrap');document.getElementById('closeAreaType')?.addEventListener('click',()=>{ui.modal=null;render();});document.querySelectorAll('[data-area-type-choice]').forEach(b=>b.onclick=()=>ui.modal.type==='areaTypeNew'?createAreaWithType(ui.modal.pendingAreaName,b.dataset.areaTypeChoice):changeAreaType(ui.modal.areaId,b.dataset.areaTypeChoice));wrap?.addEventListener('click',e=>{if(e.target===wrap){ui.modal=null;render();}});}
  bindV082Events();
}
render=function(){if(__v082Migrated)return __renderV082Enhanced();if(__v082MigrationPromise)return;if(!db||!data||!data.settings||!Array.isArray(data.models))return __renderV082Enhanced();__v082MigrationPromise=migrateV082Data().then(()=>{__v082Migrated=true;__v082MigrationPromise=null;__renderV082Enhanced();}).catch(err=>{__v082MigrationPromise=null;console.error('Falha na migração v0.8.2',err);__renderV082Enhanced();});};
setTimeout(()=>{if(!$app?.querySelector?.('.boot-message')&&!__v082Migrated)render();},0);
