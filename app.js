'use strict';
const $=s=>document.querySelector(s),storageKey='warlike.crypte.local.v1',encoder=new TextEncoder(),decoder=new TextDecoder();
const MAX_ITEMS=100,MAX_ENVELOPE=2_000_000;let key=null,vault=null,selected=null,nonce=0,editedAt=Date.now(),busy=false,pendingImport=null;
const encode=b=>{const bytes=new Uint8Array(b);let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text)};
const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function validateEnvelope(value){return value&&value.schema==='warlike.crypte.v1'&&value.kdf==='PBKDF2-SHA256'&&value.iterations===600000&&typeof value.salt==='string'&&typeof value.iv==='string'&&typeof value.data==='string'&&value.salt.length===44&&value.iv.length===16&&value.data.length<MAX_ENVELOPE&&/^[A-Za-z0-9+/=]+$/.test(value.salt+value.iv+value.data)}
function envelope(){try{const s=localStorage.getItem(storageKey);return s?JSON.parse(s):null}catch{return null}}
function hasVault(){return localStorage.getItem(storageKey)!==null}
const random=n=>crypto.getRandomValues(new Uint8Array(n));
async function derive(password,salt){const seed=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},seed,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encrypt(password=key.password){const salt=random(32),iv=random(12),derived=await derive(password,salt);const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('warlike.crypte.v1')},derived,encoder.encode(JSON.stringify(vault)));return{schema:'warlike.crypte.v1',kdf:'PBKDF2-SHA256',iterations:600000,salt:encode(salt),iv:encode(iv),data:encode(data)}}
async function decrypt(password,source){if(!validateEnvelope(source))throw Error('Format de coffre invalide.');const secret=await derive(password,decode(source.salt));const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(source.iv),additionalData:encoder.encode('warlike.crypte.v1')},secret,decode(source.data));const obj=JSON.parse(decoder.decode(bytes));if(!obj||!Array.isArray(obj.items)||obj.items.length>MAX_ITEMS||obj.items.some(x=>!x||typeof x.id!=='string'||typeof x.title!=='string'||typeof x.password!=='string'||typeof x.user!=='string'||typeof x.notes!=='string'))throw Error('Contenu de coffre invalide.');return obj}
function lockedUI(){pendingImport=null;if($('#importDialog').open)$('#importDialog').close();$('#changePanel').hidden=true;$('#changeForm').reset();$('#changeError').textContent='';key=null;vault=null;selected=null;for(const id of ['itemId','itemTitle','itemUser','itemPassword','itemNotes']){const field=$('#'+id);if(field)field.value=''}$('#itemPassword').type='password';$('#showPassword').textContent='Afficher';$('#entries').replaceChildren();$('#saveError').textContent='';$('#locked').hidden=false;$('#unlocked').hidden=true;$('#master').value='';$('#masterConfirm').value='';$('#status').textContent='Coffre verrouillé';$('#status').classList.remove('open');$('#authError').textContent='';const existing=hasVault();$('#lockTitle').textContent=existing?'Déverrouiller le coffre':'Créer votre coffre';$('#lockHelp').textContent=existing?'Entre ta phrase maîtresse pour déchiffrer les données locales.':'Choisis une phrase maîtresse de 12 caractères minimum. Sans elle, le coffre est irrécupérable.';$('#confirmWrap').hidden=existing;$('#unlockButton').textContent=existing?'Déverrouiller':'Créer le coffre'}
function openUI(){editedAt=Date.now();$('#locked').hidden=true;$('#unlocked').hidden=false;$('#status').textContent='Coffre déverrouillé';$('#status').classList.add('open');$('#authError').textContent='';render();newEntry()}
async function save(){if(!key||!vault)throw Error('Coffre verrouillé.');const state=await encrypt();const data=JSON.stringify(state);if(data.length>MAX_ENVELOPE)throw Error('Coffre trop volumineux.');localStorage.setItem(storageKey,data);editedAt=Date.now()}
$('#unlockForm').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;$('#unlockButton').disabled=true;$('#authError').textContent='';const password=$('#master').value;try{const source=envelope();if(hasVault()&&!source)throw Error('Coffre local endommagé : exporte une copie avant toute action.');if(source){const data=await decrypt(password,source);key={password};vault=data;openUI()}else{if(password.length<12||password!==$('#masterConfirm').value)throw Error('Phrase maîtresse trop courte ou confirmation incorrecte.');key={password};vault={items:[],createdAt:Date.now()};await save();openUI()}}catch(err){key=null;vault=null;$('#authError').textContent=err.name==='OperationError'?'Phrase maîtresse incorrecte ou sauvegarde endommagée.':err.message}finally{busy=false;$('#unlockButton').disabled=false}});
function newEntry(){selected=null;$('#itemId').value='';$('#itemTitle').value='';$('#itemUser').value='';$('#itemPassword').value='';$('#itemNotes').value='';$('#itemPassword').type='password';$('#showPassword').textContent='Afficher';$('#saveError').textContent='';render()}
$('#add').onclick=newEntry;
function selectItem(id){const item=vault.items.find(x=>x.id===id);if(!item)return;selected=id;$('#itemId').value=id;$('#itemTitle').value=item.title;$('#itemUser').value=item.user;$('#itemPassword').value=item.password;$('#itemNotes').value=item.notes;$('#itemPassword').type='password';$('#showPassword').textContent='Afficher';$('#saveError').textContent='';render()}
function render(){if(!vault)return;const wrap=$('#entries');wrap.replaceChildren();const query=$('#search').value.toLocaleLowerCase();for(const x of vault.items.filter(i=>[i.title,i.user].some(t=>t.toLocaleLowerCase().includes(query))).sort((a,b)=>a.title.localeCompare(b.title))){const b=document.createElement('button');b.type='button';b.className='entry'+(selected===x.id?' selected':'');const title=document.createElement('span');title.textContent=x.title;const sub=document.createElement('small');sub.textContent=x.user;b.append(title,sub);b.onclick=()=>selectItem(x.id);wrap.append(b)}}
$('#search').oninput=render;
$('#entryForm').addEventListener('submit',async e=>{e.preventDefault();if(!vault||busy)return;const title=$('#itemTitle').value.trim(),user=$('#itemUser').value.trim(),password=$('#itemPassword').value,notes=$('#itemNotes').value;if(!title)return;const old=vault.items.find(x=>x.id===selected);if(!old&&vault.items.length>=MAX_ITEMS){$('#saveError').textContent='Limite de 100 identifiants.';return}const original=structuredClone(vault);const item={id:old?.id||crypto.randomUUID(),title,user,password,notes,updated:Date.now()};vault.items=old?vault.items.map(x=>x.id===old.id?item:x):[...vault.items,item];try{busy=true;await save();selected=item.id;$('#saveError').textContent='Enregistré localement et chiffré.';render()}catch(err){vault=original;$('#saveError').textContent='Enregistrement impossible : '+err.message}finally{busy=false}});
$('#remove').onclick=async()=>{if(!selected||!vault||busy)return;const item=vault.items.find(x=>x.id===selected);if(!confirm('Supprimer définitivement « '+item.title+' » ?'))return;const before=structuredClone(vault);vault.items=vault.items.filter(x=>x.id!==selected);try{busy=true;await save();newEntry()}catch(err){vault=before;$('#saveError').textContent='Suppression impossible : '+err.message}finally{busy=false}};
$('#showPassword').onclick=()=>{const input=$('#itemPassword');input.type=input.type==='password'?'text':'password';$('#showPassword').textContent=input.type==='password'?'Afficher':'Masquer'};
$('#copy').onclick=async()=>{try{if(!$('#itemPassword').value)return;await navigator.clipboard.writeText($('#itemPassword').value);$('#saveError').textContent='Copié. Le presse-papiers reste sous le contrôle de ton système.'}catch{$('#saveError').textContent='Copie indisponible.'}};
function generatePassword(length=24){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+';const limit=Math.floor(256/chars.length)*chars.length;let result='';while(result.length<length){for(const v of random(64)){if(v<limit&&result.length<length)result+=chars[v%chars.length]}}return result}
$('#generate').onclick=()=>{$('#itemPassword').value=generatePassword();$('#itemPassword').type='text';$('#showPassword').textContent='Masquer';$('#saveError').textContent='Nouveau mot de passe généré. Enregistre la fiche pour le conserver.'};
$('#lock').onclick=lockedUI;let idleTicker=setInterval(()=>{if(key&&Date.now()-editedAt>120000)lockedUI()},10000);document.addEventListener('pointerdown',()=>{if(key)editedAt=Date.now()});document.addEventListener('keydown',()=>{if(key)editedAt=Date.now()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&key)lockedUI()});
function saveFile(data,name){const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
$('#export').onclick=()=>{const source=localStorage.getItem(storageKey);if(!key||!source)return;saveFile(source,'warlike-crypte-backup-'+new Date().toISOString().slice(0,10)+'.json')};

$('#changeMaster').onclick=()=>{if(!vault||busy)return;$('#changePanel').hidden=false;$('#changeError').textContent='';$('#oldMaster').focus();};
$('#cancelChange').onclick=()=>{$('#changeForm').reset();$('#changeError').textContent='';$('#changePanel').hidden=true;};
$('#changeForm').onsubmit=async e=>{
 e.preventDefault();if(!key||!vault||busy)return;
 const current=$('#oldMaster').value,next=$('#newMaster').value,confirmation=$('#newMasterConfirm').value;
 if(next.length<16||next!==confirmation){$('#changeError').textContent='Utilise au moins 16 caractères et confirme la nouvelle phrase.';return;}
 busy=true;$('#confirmChange').disabled=true;$('#changeError').textContent='';
 try{
  const previous=envelope();if(!previous||!validateEnvelope(previous))throw Error('Coffre local introuvable ou endommagé.');
  await decrypt(current,previous);
  const updated=await encrypt(next);const data=JSON.stringify(updated);
  if(data.length>MAX_ENVELOPE)throw Error('Coffre trop volumineux.');
  localStorage.setItem(storageKey,data);
  key={password:next};editedAt=Date.now();
  $('#changeForm').reset();$('#changePanel').hidden=true;
  $('#saveError').textContent='Phrase maîtresse modifiée et coffre rechiffré. Exporte une nouvelle sauvegarde.';
 }catch(err){$('#changeError').textContent=err.name==='OperationError'?'Phrase maîtresse actuelle incorrecte.':'Modification impossible : '+err.message;}
 finally{busy=false;$('#confirmChange').disabled=false;}
};
$('#importVault').onclick=()=>{if(!busy)$('#importFile').click();};
$('#cancelImport').onclick=()=>{if(busy)return;pendingImport=null;$('#importPassword').value='';$('#importDialog').close();};
$('#importFile').onchange=async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file||busy)return;
 try{
  if(file.size>MAX_ENVELOPE)throw Error('Fichier trop volumineux.');
  const value=JSON.parse(await file.text());if(!validateEnvelope(value))throw Error('Ce fichier ne contient pas un coffre WarLike valide.');
  pendingImport=value;$('#importVerifyForm').reset();$('#importError').textContent='';$('#importDialog').showModal();$('#importPassword').focus();
 }catch(err){pendingImport=null;$('#authError').textContent='Import impossible : '+err.message;}
};
$('#importDialog').addEventListener('close',()=>{pendingImport=null;$('#importPassword').value='';});
$('#importVerifyForm').onsubmit=async e=>{
 e.preventDefault();if(!pendingImport||busy)return;
 busy=true;$('#confirmImport').disabled=true;$('#importError').textContent='';
 try{
  await decrypt($('#importPassword').value,pendingImport);
  if(hasVault()&&!confirm('Remplacer le coffre local actuel ? Cette opération écrase ses données chiffrées. Assure-toi d’avoir exporté une sauvegarde.'))return;
  localStorage.setItem(storageKey,JSON.stringify(pendingImport));
  $('#importDialog').close();lockedUI();
  $('#authError').textContent='Sauvegarde vérifiée et importée. Déverrouille-la avec sa phrase maîtresse.';
 }catch(err){$('#importError').textContent=err.name==='OperationError'?'Phrase maîtresse incorrecte ou sauvegarde corrompue.':'Import impossible : '+err.message;}
 finally{busy=false;$('#confirmImport').disabled=false;}
};
lockedUI();
