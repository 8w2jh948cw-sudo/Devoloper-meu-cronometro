/* v0.8.9 — retrocompatibilidade de clientes em backups legados */
globalThis.APP_META=Object.freeze({version:'0.8.9',dataSchemaVersion:6,factoryDataVersion:1});

function legacyClientCleanNameV089(value){
  return String(value??'').normalize('NFC').replace(/\s+/g,' ').trim();
}

function legacyClientExactKeyV089(value){
  return legacyClientCleanNameV089(value).toLocaleLowerCase('pt-BR');
}

function legacyClientPlaceholderKeyV089(value){
  return legacyClientCleanNameV089(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('pt-BR');
}

function legacyClientIsPlaceholderV089(value,emptyLabel='Sem cliente'){
  const clean=legacyClientCleanNameV089(value);
  if(!clean)return true;
  const key=legacyClientPlaceholderKeyV089(clean);
  const emptyKey=legacyClientPlaceholderKeyV089(emptyLabel);
  if(key===emptyKey||key==='sem cliente')return true;
  if(/^\(?sem titulo\)?(?:\s|$)/i.test(key))return true;
  return false;
}

function legacyClientOwnV089(obj,key){
  return !!obj&&Object.prototype.hasOwnProperty.call(obj,key);
}

function legacyClientCloneV089(value){
  if(typeof structuredClone==='function'){
    try{return structuredClone(value);}catch(_){}
  }
  return JSON.parse(JSON.stringify(value));
}

function legacyClientMergeAreaTypesV089(importedAreas,currentAreas){
  const current=Array.isArray(currentAreas)?currentAreas:[];
  const byId=new Map(current.filter(Boolean).map(a=>[a.id,a]));
  const byName=new Map();
  for(const area of current){
    if(!area?.name)continue;
    const key=legacyClientExactKeyV089(area.name);
    const list=byName.get(key)||[];
    list.push(area);byName.set(key,list);
  }
  return (Array.isArray(importedAreas)?importedAreas:current).filter(Boolean).map(area=>{
    if(area.type)return {...area};
    let hint=byId.get(area.id)||null;
    if(!hint&&area.name){
      const matches=byName.get(legacyClientExactKeyV089(area.name))||[];
      if(matches.length===1)hint=matches[0];
    }
    return {...area,type:hint?.type==='clients'?'clients':'generic'};
  });
}

function legacyClientAreaIdForSessionV089(session,models){
  if(session?.areaId)return session.areaId;
  const model=(Array.isArray(models)?models:[]).find(m=>m?.id===session?.modelId);
  return model?.areaId||'general';
}

function legacyClientAreaIsClientsV089(areaId,settings){
  return (Array.isArray(settings?.areas)?settings.areas:[]).some(a=>a?.id===areaId&&a.type==='clients');
}

function legacyClientPrepareSettingsV089(payload){
  const imported=legacyClientCloneV089(payload?.settings||{});
  const currentAreas=(typeof data!=='undefined'&&Array.isArray(data?.settings?.areas))?data.settings.areas:[];
  const sourceAreas=Array.isArray(imported.areas)?imported.areas:currentAreas;
  imported.areas=legacyClientMergeAreaTypesV089(sourceAreas,currentAreas);
  imported.clients=Array.isArray(imported.clients)?imported.clients.map(c=>{
    const out={...c};
    if(!Array.isArray(out.aliases))out.aliases=[];
    return out;
  }):[];
  return imported;
}

function legacyClientBuildIndexV089(clients){
  const index=new Map();
  for(const client of clients){
    if(!client||client.deletedAt||!client.areaId||!legacyClientCleanNameV089(client.name))continue;
    const key=`${client.areaId}\u0000${legacyClientExactKeyV089(client.name)}`;
    if(!index.has(key))index.set(key,client);
  }
  return index;
}

function legacyClientLinkSessionV089(session,{models,settings,clients,index,legacyBackup}){
  if(!session||typeof session!=='object')return {changed:false,created:false};
  const areaId=legacyClientAreaIdForSessionV089(session,models);
  if(!legacyClientAreaIsClientsV089(areaId,settings))return {changed:false,created:false};

  let changed=false;
  if(!session.areaId){session.areaId=areaId;changed=true;}

  const oldTitle=typeof session.title==='string'?session.title:'';
  if(oldTitle&&!legacyClientOwnV089(session,'legacyTitle')){
    session.legacyTitle=oldTitle;
    changed=true;
  }

  const currentClient=session.clientId?clients.find(c=>c?.id===session.clientId&&!c.deletedAt):null;
  if(currentClient){
    if(!session.clientNameSnapshot){session.clientNameSnapshot=currentClient.name;changed=true;}
    return {changed,created:false};
  }

  const missingClientField=!legacyClientOwnV089(session,'clientId');
  const danglingClientId=!!session.clientId&&!currentClient;
  if(!legacyBackup&&!missingClientField&&!danglingClientId){
    return {changed,created:false};
  }

  const explicitSnapshot=legacyClientCleanNameV089(session.clientNameSnapshot||'');
  const legacyName=legacyClientCleanNameV089(session.legacyTitle||oldTitle);
  const name=explicitSnapshot||legacyName;
  if(legacyClientIsPlaceholderV089(name,settings.clientEmptyLabel||'Sem cliente')){
    if(missingClientField){session.clientId=null;changed=true;}
    return {changed,created:false};
  }

  const key=`${areaId}\u0000${legacyClientExactKeyV089(name)}`;
  let client=index.get(key)||null;
  let created=false;
  if(!client){
    const t=typeof now==='function'?now():Date.now();
    const idPart=typeof uid==='function'?uid():`${t}-${Math.random().toString(36).slice(2)}`;
    client={id:`client-${idPart}`,areaId,name,aliases:[],createdAt:t,updatedAt:t,deletedAt:null};
    clients.push(client);index.set(key,client);created=true;
  }

  if(session.clientId!==client.id){session.clientId=client.id;changed=true;}
  if(session.clientNameSnapshot!==client.name){session.clientNameSnapshot=client.name;changed=true;}
  return {changed,created};
}

function migrateLegacyBackupClientsV089(payload){
  const migrated=legacyClientCloneV089(payload);
  const schema=Number(migrated?.schemaVersion);
  const legacyBackup=!Number.isFinite(schema)||schema<5;
  const models=Array.isArray(migrated.models)?migrated.models:[];
  const settings=legacyClientPrepareSettingsV089(migrated);
  const clients=settings.clients;
  const index=legacyClientBuildIndexV089(clients);
  let linkedSessions=0,createdClients=0;

  for(const session of (Array.isArray(migrated.sessions)?migrated.sessions:[])){
    const result=legacyClientLinkSessionV089(session,{models,settings,clients,index,legacyBackup});
    if(result.changed&&session.clientId)linkedSessions++;
    if(result.created)createdClients++;
  }

  if(migrated.currentSession){
    const result=legacyClientLinkSessionV089(migrated.currentSession,{models,settings,clients,index,legacyBackup});
    if(result.created)createdClients++;
  }

  migrated.settings=settings;
  migrated.schemaVersion=Math.max(Number.isFinite(schema)?schema:0,6);
  migrated.migrationInfo={
    ...(migrated.migrationInfo||{}),
    legacyClientMigrationV089:true,
    linkedSessions,
    createdClients
  };
  return migrated;
}

async function repairAlreadyImportedLegacyClientsV089(){
  if(typeof data==='undefined'||!data?.settings||!Array.isArray(data.sessions))return {changed:false,linkedSessions:0,createdClients:0};
  const models=Array.isArray(data.models)?data.models:[];
  const settings=data.settings;
  settings.clients=Array.isArray(settings.clients)?settings.clients:[];
  for(const client of settings.clients)if(client&&!Array.isArray(client.aliases))client.aliases=[];
  const clients=settings.clients;
  const index=legacyClientBuildIndexV089(clients);
  let changed=false,linkedSessions=0,createdClients=0;
  const changedSessions=[];

  for(const session of data.sessions){
    if(legacyClientOwnV089(session,'clientId'))continue;
    const result=legacyClientLinkSessionV089(session,{models,settings,clients,index,legacyBackup:false});
    if(result.changed){changed=true;changedSessions.push(session);if(session.clientId)linkedSessions++;}
    if(result.created)createdClients++;
  }

  let currentChanged=false;
  if(data.current&&!legacyClientOwnV089(data.current,'clientId')){
    const result=legacyClientLinkSessionV089(data.current,{models,settings,clients,index,legacyBackup:false});
    if(result.changed){changed=true;currentChanged=true;}
    if(result.created)createdClients++;
  }

  if(!changed)return {changed:false,linkedSessions,createdClients};
  await persistSettings();
  for(const session of changedSessions)await put('sessions',session);
  if(currentChanged)await persistCurrent();
  return {changed:true,linkedSessions,createdClients};
}

const __replaceFromBackupV089=replaceFromBackup;
replaceFromBackup=async function(payload){
  const migrated=migrateLegacyBackupClientsV089(payload);
  await __replaceFromBackupV089(migrated);
  /* Normaliza também campos introduzidos nas versões 0.8.0/0.8.2. */
  try{if(typeof migrateV080Data==='function')await migrateV080Data();}catch(error){console.error('Falha na normalização v0.8.0 após importação',error);}
  try{if(typeof migrateV082Data==='function')await migrateV082Data();}catch(error){console.error('Falha na normalização v0.8.2 após importação',error);}
};

let legacyClientRepairStateV089='pending';
const __renderV089=render;
render=function(){
  const result=__renderV089();
  if(legacyClientRepairStateV089==='pending'&&typeof db!=='undefined'&&db&&typeof data!=='undefined'&&data?.settings&&Array.isArray(data.sessions)){
    legacyClientRepairStateV089='running';
    Promise.resolve().then(repairAlreadyImportedLegacyClientsV089).then(info=>{
      legacyClientRepairStateV089='done';
      if(info.changed){
        try{toast(`Clientes recuperadas: ${info.createdClients}`);}catch(_){}
        __renderV089();
      }
    }).catch(error=>{
      legacyClientRepairStateV089='done';
      console.error('Falha ao reparar clientes de registros legados',error);
    });
  }
  return result;
};
