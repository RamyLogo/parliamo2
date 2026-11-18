// The board scale never applies to the sentence strip.
let boardScale=Number(profileStore.getItem('pcs2BoardScale'))||1;
function resizeBoard(step=0){
 boardScale=Math.max(.7,Math.min(1.6,Math.round((boardScale+step*.15)*100)/100));
 document.documentElement.style.setProperty('--board-scale',boardScale);
 document.getElementById('boardSize').textContent=Math.round(boardScale*100)+'%';
 document.getElementById('boardSmaller').disabled=boardScale<=.7;
 document.getElementById('boardLarger').disabled=boardScale>=1.6;
 profileStore.setItem('pcs2BoardScale',boardScale);
}
resizeBoard();
const seed=[{"type":"folder","label":"PERSONE","items":[{"type":"pic","label":"il bimbo","id":7176}],"image":"https://static.arasaac.org/pictograms/7116/7116_500.png","iconPictogramId":7116},{"type":"folder","label":"AZIONI","items":[{"type":"pic","label":"mangia","id":6456}],"image":"https://static.arasaac.org/pictograms/7297/7297_500.png","iconPictogramId":7297},{"type":"folder","label":"GIOCHI","items":[{"type":"pic","id":3241,"label":"palla"},{"type":"pic","id":27612,"label":"palla da bowling"},{"type":"pic","id":2514,"label":"palla da tennis"}],"image":"https://static.arasaac.org/pictograms/9813/9813_500.png"},{"type":"folder","label":"CIBI","items":[{"type":"pic","label":"la pizza","id":2527}],"image":"https://static.arasaac.org/pictograms/4610/4610_500.png","iconPictogramId":4610},{"type":"folder","label":"colori","items":[],"image":"https://static.arasaac.org/pictograms/5968/5968_500.png","iconPictogramId":5968}];
let data=JSON.parse(profileStore.getItem("pcs2Data")||"null")||{root:seed}, path=["root"], sentence=[];
const img=id=>`https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
function save(){profileStore.setItem("pcs2Data",JSON.stringify(data))}
/* Default profile: loaded only when this browser has never saved its own profile.
   The complete exported profile must be stored in default-profile.parliamo. */
async function loadInitialProfile(){
 if(profileStore.getItem("pcs2Data")!==null)return;
 try{
  const response=await fetch("./default-profile.parliamo",{cache:"no-cache"});
  if(!response.ok)return;
  const initial=await response.json();
  if(!initial||!initial.data||!Array.isArray(initial.data.root))return;
  // Recheck after the asynchronous fetch: a user may have started editing.
  if(profileStore.getItem("pcs2Data")!==null)return;
  const values={pcs2Data:JSON.stringify(initial.data),
   pcs2Scenes:JSON.stringify(Array.isArray(initial.scenes)?initial.scenes:[]),
   pcs2GameExercises:JSON.stringify(Array.isArray(initial.gameExercises)?initial.gameExercises:[]),
   pcs2SceneFolders:JSON.stringify(Array.isArray(initial.sceneFolders)?initial.sceneFolders:[]),
   pcs2ProfileName:String(initial.profileName||"UTENTE")};
  for(const [key,value] of Object.entries(values))profileStore.setItem(key,value);
  data=initial.data;scenesData=initial.scenes||[];gameExercises=initial.gameExercises||[];
  profileName=String(initial.profileName||"UTENTE");
  const input=document.getElementById("profileName");if(input)input.value=profileName;
  path=["root"];render();renderSentence();renderGameExercises();
 }catch(e){console.warn("Profilo iniziale non disponibile:",e)}
}


function cur(){let a=data.root;for(let i=1;i<path.length;i++)a=a[path[i]].items;return a}

let labelsUppercase=profileStore.getItem("pcs2LabelsUppercase")==="1";
function displayLabel(s){
 const v=String(s??"");
 return labelsUppercase?v.toLocaleUpperCase("it-IT"):v.toLocaleLowerCase("it-IT");
}
function updateCaseButton(){
 const b=document.getElementById("caseToggleBtn");
 if(b)b.textContent=labelsUppercase?"Aa MAIUSCOLO":"Aa minuscolo";
}
function toggleLabelCase(){
 labelsUppercase=!labelsUppercase;
 profileStore.setItem("pcs2LabelsUppercase",labelsUppercase?"1":"0");
 updateCaseButton();
 render();
 renderSentence();
 const lab=document.getElementById("sceneDisplayLabel");
 if(lab && lab.dataset.rawLabel!==undefined)lab.textContent=displayLabel(lab.dataset.rawLabel);
}
let currentSceneFolder=null;
function sceneFolderNames(){return JSON.parse(profileStore.getItem("pcs2SceneFolders")||"[]")}
function saveSceneFolders(v){profileStore.setItem("pcs2SceneFolders",JSON.stringify(v))}
function newSceneFolder(){const name=prompt("Nome della cartella di scene:");if(!name||!name.trim())return;const folders=sceneFolderNames();if(folders.includes(name.trim())){alert("Cartella già presente.");return}folders.push(name.trim());saveSceneFolders(folders);currentSceneFolder=name.trim();renderScenesGrid()}
function renameSceneFolder(name){const newer=prompt("Nuovo nome:",name);if(!newer||!newer.trim()||newer===name)return;const folders=sceneFolderNames();if(folders.includes(newer.trim()))return alert("Cartella già presente.");saveSceneFolders(folders.map(x=>x===name?newer.trim():x));scenesData.forEach(x=>{if(x.folder===name)x.folder=newer.trim()});saveScenes();currentSceneFolder=newer.trim();renderScenesGrid()}
function deleteSceneFolder(name){if(!confirm("Eliminare la cartella? Le scene torneranno nella cartella principale SCENE."))return;scenesData.forEach(x=>{if(x.folder===name)x.folder=""});saveScenes();saveSceneFolders(sceneFolderNames().filter(x=>x!==name));currentSceneFolder=null;renderScenesGrid()}
function moveSceneFolder(i){const options=["(SCENE - principale)",...sceneFolderNames()];const choice=prompt("Sposta la scena in una cartella. Scrivi il numero:\n"+options.map((x,i)=>`${i}. ${x}`).join("\n"),String(Math.max(0,options.indexOf(scenesData[i].folder||"(SCENE - principale)"))));if(choice===null)return;const n=Number(choice);if(!Number.isInteger(n)||n<0||n>=options.length)return alert("Scelta non valida.");scenesData[i].folder=n===0?"":options[n];saveScenes();renderScenesGrid()}
function renderScenesGrid(){
 document.body.classList.add("scene-folder");const grid=document.getElementById("board"),bc=document.getElementById("crumb");
 bc.innerHTML='<button onclick="'+(currentSceneFolder!==null?'currentSceneFolder=null;renderScenesGrid()':'leaveScenes()')+'">↩︎ INDIETRO</button> <b>SCENE'+(currentSceneFolder?' / '+esc(currentSceneFolder):'')+'</b> <button class="scene-hide" onclick="hideScenesNow()" title="Nascondi cartella Scene">✕ NASCONDI</button>';
 grid.innerHTML="";
 const nf=document.getElementById("sceneNewFolder");if(nf)nf.style.display=currentSceneFolder===null?"inline-block":"none";
 if(currentSceneFolder===null){sceneFolderNames().forEach(name=>{const card=document.createElement("div");card.className="card scene-subfolder";card.innerHTML=`<div class="folder-shell"><div class="folder-tab"></div><div class="folder-shape"></div><div class="scene-folder-symbol">📁</div></div><b>${esc(displayLabel(name))}</b><div class="scene-folder-edit"><button onclick="event.stopPropagation();renameSceneFolder('${esc(name).replace(/&#39;/g,"\'")}')">✎</button><button onclick="event.stopPropagation();deleteSceneFolder('${esc(name).replace(/&#39;/g,"\'")}')">✕</button></div>`;card.onclick=()=>{currentSceneFolder=name;renderScenesGrid()};grid.appendChild(card)})}
 scenesData.forEach((x,i)=>{if((x.folder||"")!==(currentSceneFolder||""))return;const card=document.createElement("div");card.className="card";
 card.innerHTML=`<img src="${x.image||img(x.id)}"><div class="label-edit scene-card-actions"><b>${esc(displayLabel(x.label))}</b><button class="edit edit-bottom" onclick="event.stopPropagation();editScene(${i})">✎</button><button class="delete-bottom" onclick="event.stopPropagation();deleteScene(${i})">✕</button></div><button class="scene-move-folder" onclick="event.stopPropagation();moveSceneFolder(${i})">📁 SPOSTA</button>`;
 card.onclick=()=>{if(!editMode)showScene(i)};const toggle=document.createElement("button");toggle.className="game-scene-toggle";toggle.textContent=x.gameEnabled?"✓ gioCAA":"○ gioCAA";toggle.onclick=e=>{e.stopPropagation();x.gameEnabled=!x.gameEnabled;saveScenes();renderScenesGrid()};card.appendChild(toggle);grid.appendChild(card)});
}
function hideScenesNow(){if(scenesVisible)toggleScenes();else leaveScenes()}

function render(){
 document.body.classList.remove("scene-folder");
 if(inScenes){ renderScenesGrid(); return; }
 let a=cur();board.innerHTML=a.map((x,i)=>x.type==="folder"?
 `<div class="card" draggable="${editMode}" ondragstart="dragStart(event,${i})" ondragover="dragOver(event,${i})" ondragleave="dragLeave(event)" ondrop="dropItem(event,${i})" ondragend="dragEnd(event)" onclick="if(!editMode)openFolder(${i})"><div class="folder-shell"><div class="folder-tab"></div><div class="folder-shape"></div>${x.image?`<img src="${x.image}">`:`<div style="position:relative;z-index:2;font-size:42px;margin-top:20px">📁</div>`}</div><div class="label-edit"><b>${esc(displayLabel(x.label))}</b><button class="edit edit-bottom" aria-label="Modifica nome" onclick="event.preventDefault();event.stopPropagation();editItem(${i})">✎</button><button class="delete-bottom" aria-label="Cancella" onclick="event.preventDefault();event.stopPropagation();deleteItem(${i})">✕</button></div></div>`:
 `<div class="card" draggable="${editMode}" ondragstart="dragStart(event,${i})" ondragover="dragOver(event,${i})" ondragleave="dragLeave(event)" ondrop="dropItem(event,${i})" ondragend="dragEnd(event)" onclick="if(!editMode)tapPic(${i})"><img src="${x.image||img(x.id)}"><div class="label-edit"><b>${esc(displayLabel(x.label))}</b><button class="edit edit-bottom" aria-label="Modifica nome" onclick="event.preventDefault();event.stopPropagation();editItem(${i})">✎</button><button class="delete-bottom" aria-label="Cancella" onclick="event.preventDefault();event.stopPropagation();deleteItem(${i})">✕</button></div></div>`).join("");
 crumb.textContent=path.length===1?"":folderNames().join(" / ");backBtn.style.display=path.length>1?"inline-block":"none";

 // SCENE: visible only when explicitly activated in this session and only at root.

}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function folderNames(){let names=[],a=data.root;for(let i=1;i<path.length;i++){names.push(a[path[i]].label);a=a[path[i]].items}return names}
let voices=[];
function loadVoices(){
 voices=speechSynthesis.getVoices();
 let it=voices.filter(v=>v.lang && v.lang.toLowerCase().startsWith("it"));
 let list=it.length?it:voices;
 let saved=profileStore.getItem("pcs2Voice")||"";
 voiceSelect.innerHTML=list.map(v=>`<option value="${esc(v.name)}" ${v.name===saved?"selected":""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("");
}
function saveVoice(){profileStore.setItem("pcs2Voice",voiceSelect.value);profileStore.setItem("pcs2Rate",rate.value)}
function say(t){
 speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang="it-IT";
 let v=voices.find(x=>x.name===voiceSelect.value);if(v)u.voice=v;
 u.rate=parseFloat(rate.value||"1");speechSynthesis.speak(u)
}
function tapPic(i){if(gameActive&&gameScene&&document.getElementById("gameVerify").disabled)return;let x=cur()[i];sentence.push({...x});renderSentence();say(x.label);if(gameActive)gameFeedback.textContent=""}
function renderSentence(){
 const el=document.querySelector("#sentence");el.innerHTML=sentence.length?sentence.map((x,i)=>`<div class="chip token" role="button" tabindex="0" draggable="${editMode}" ondragstart="gameDragStart(event,${i})" ondragover="event.preventDefault()" ondrop="gameDrop(event,${i})" onclick="speakSentenceItem(${i})"><img src="${x.image||img(x.id)}"><div>${esc(displayLabel(x.label))}</div>${editMode?`<span class="sentence-edit-actions"><button onclick="event.stopPropagation();moveToken(${i},-1)" aria-label="Sposta a sinistra" ${i===0?'disabled':''}>←</button><button onclick="event.stopPropagation();moveToken(${i},1)" aria-label="Sposta a destra" ${i===sentence.length-1?'disabled':''}>→</button><button onclick="event.stopPropagation();removeToken(${i})" aria-label="Elimina pittogramma dalla frase">✕</button></span>`:""}<span class="token-action"></span></div>`).join(""):'<span class="small">Tocca i simboli per costruire la frase.</span>';
}
let gameDragged=null;
function gameDragStart(ev,i){if(!editMode){ev.preventDefault();return;}gameDragged=i;ev.dataTransfer.effectAllowed="move"}
function gameDrop(ev,i){ev.preventDefault();if(!editMode||gameDragged===null||gameDragged===i)return;const x=sentence.splice(gameDragged,1)[0];sentence.splice(i,0,x);gameDragged=null;renderSentence()}

let lastSentenceTouch=0;
function speakSentenceItem(i){
 const now=Date.now();
 if(now-lastSentenceTouch<250)return;
 lastSentenceTouch=now;
 const item=sentence[i];
 if(!item)return;
 say(item.label);
}
let sentenceSpeechRun=0;
function clearSentenceHighlight(){
 document.querySelectorAll("#sentence .token.speaking").forEach(el=>el.classList.remove("speaking"));
}
function speakSentence(){
 if(!sentence.length)return;
 const run=++sentenceSpeechRun;
 speechSynthesis.cancel();
 clearSentenceHighlight();

 function speakAt(i){
   if(run!==sentenceSpeechRun)return;
   clearSentenceHighlight();
   if(i>=sentence.length)return;

   const tokens=document.querySelectorAll("#sentence .token");
   const token=tokens[i];
   if(token){
     token.classList.add("speaking");
     token.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
   }

   const u=new SpeechSynthesisUtterance(sentence[i].label);
   u.lang="it-IT";
   const v=voices.find(x=>x.name===voiceSelect.value);
   if(v)u.voice=v;
   u.rate=parseFloat(rate.value||"1");
   u.onend=()=>{if(run===sentenceSpeechRun)speakAt(i+1)};
   u.onerror=()=>{if(run===sentenceSpeechRun)speakAt(i+1)};
   speechSynthesis.speak(u);
 }
 speakAt(0);
}
function undo(){sentenceSpeechRun++;speechSynthesis.cancel();clearSentenceHighlight();sentence.pop();renderSentence()}
function clearSentence(){sentenceSpeechRun++;speechSynthesis.cancel();clearSentenceHighlight();sentence=[];renderSentence()}
function newFolder(){let n=prompt("Nome della nuova cartella:");if(!n)return;cur().push({type:"folder",label:n.trim(),items:[]});save();render()}

function openInfo(anchor){
 const modal=document.getElementById("infoModal");
 const scroll=document.getElementById("infoScroll");
 if(!modal)return;
 modal.style.display="block";
 if(scroll)scroll.scrollTop=0;
 if(anchor){
   setTimeout(()=>{
     const target=document.getElementById(anchor);
     if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
   },30);
 }
}
function closeInfo(){
 const modal=document.getElementById("infoModal");
 if(modal)modal.style.display="none";
}

let arasaacMode="addPic";

function openSearch(){
 arasaacMode="addPic";
 const modal=document.getElementById("modal");
 const q=document.getElementById("q");
 const status=document.getElementById("status");
 const results=document.getElementById("results");
 if(status)status.textContent="";
 if(results)results.innerHTML="";
 if(q)q.value="";
 if(modal)modal.style.display="block";
 setTimeout(()=>q&&q.focus(),50);
}

function searchFolderCover(){
 if(path.length===1){
   alert("Apri prima la cartella a cui vuoi assegnare il pittogramma.");
   return;
 }
 arasaacMode="folderCover";
 const modal=document.getElementById("modal");
 const q=document.getElementById("q");
 const status=document.getElementById("status");
 const results=document.getElementById("results");
 if(status)status.textContent="Scegli il pittogramma da usare come icona della cartella.";
 if(results)results.innerHTML="";
 if(q)q.value="";
 if(modal)modal.style.display="block";
 setTimeout(()=>q&&q.focus(),50);
}

function closeSearch(){
 const modal=document.getElementById("modal");
 if(modal)modal.style.display="none";
 const results=document.getElementById("results");
 if(results)results.innerHTML="";
}

async function searchArasaac(){
 const q=document.getElementById("q");
 const status=document.getElementById("status");
 const results=document.getElementById("results");
 const term=(q&&q.value||"").trim();
 if(!term)return;
 if(status)status.textContent="Ricerca in corso…";
 if(results)results.innerHTML="";
 try{
   const res=await fetch("https://api.arasaac.org/v1/pictograms/it/search/"+encodeURIComponent(term));
   if(!res.ok)throw new Error("HTTP "+res.status);
   const arr=await res.json();
   if(!Array.isArray(arr)||!arr.length){
     if(status)status.textContent="Nessun pittogramma trovato.";
     return;
   }
   if(status)status.textContent="Tocca il pittogramma che vuoi usare.";
   arr.slice(0,30).forEach(x=>{
     const id=x._id;
     const label=(x.keywords&&x.keywords[0]&&x.keywords[0].keyword)||term;
     const card=document.createElement("div");
     card.className="card arasaac-result";
     card.innerHTML=`<img src="${img(id)}" alt="${esc(label)}"><div><b>${esc(label)}</b></div>`;
     card.onclick=()=>selectArasaacPictogram(id,label);
     results.appendChild(card);
   });
 }catch(e){
   if(status)status.textContent="";
   alert("Ricerca ARASAAC non disponibile. Controlla la connessione Internet e riprova.");
 }
}

function selectArasaacPictogram(id,suggestedLabel){
 if(arasaacMode==="folderCover"){
   let parent=data.root;
   for(let i=1;i<path.length-1;i++)parent=parent[path[i]].items;
   const folder=parent[path[path.length-1]];
   if(!folder)return;
   folder.image=img(id);
   folder.iconPictogramId=id;
   save();render();closeSearch();
   return;
 }
 const label=prompt("Scritta da associare al pittogramma:",suggestedLabel||"");
 if(label===null)return;
 const clean=label.trim();
 if(!clean)return;
 cur().push({type:"pic",label:clean,id:id});
 save();render();closeSearch();
}

function chooseFolderImage(){
 if(path.length===1){alert("Apri prima la cartella a cui vuoi aggiungere un'immagine.");return}
 folderImageInput.click()
}
function setFolderImage(e){
 let file=e.target.files&&e.target.files[0]; if(!file)return;
 let reader=new FileReader();
 reader.onload=()=>{
   let parent=data.root;
   for(let i=1;i<path.length-1;i++) parent=parent[path[i]].items;
   let folder=parent[path[path.length-1]];
   folder.image=reader.result; save(); render();
   e.target.value="";
 };
 reader.readAsDataURL(file)
}
function chooseLocalPic(camera){(camera?cameraInput:localPicInput).click()}
function addLocalPic(e){
 let file=e.target.files&&e.target.files[0]; if(!file)return;
 let reader=new FileReader();
 reader.onload=()=>{
   let label=prompt("Scritta da associare all'immagine:","")||"";
   label=label.trim(); if(!label){e.target.value="";return}
   cur().push({type:"pic",label:label,image:reader.result});
   save();render();e.target.value="";
 };
 reader.readAsDataURL(file)
}
function openFolder(i){path.push(i);render()} function goBack(){if(path.length>1){path.pop();render()}}



let sceneAddMode=null;
let profileName=profileStore.getItem("pcs2ProfileName")||"UTENTE";

function saveProfileName(){
 const el=document.getElementById("profileName");
 profileName=(el.value||"UTENTE").trim()||"UTENTE";
 profileStore.setItem("pcs2ProfileName",profileName);
}

function exportProfile(){
 saveProfileName();
 const payload={
   app:"PARLIAMO",
   formatVersion:2,
   profileName,
   exportedAt:new Date().toISOString(),
   data:data,
   scenes:scenesData,
   gameExercises:gameExercises,
   sceneFolders:sceneFolderNames(),
   voice:profileStore.getItem("pcs2Voice")||"",
   rate:profileStore.getItem("pcs2Rate")||"1"
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/octet-stream"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;
 const now=new Date();
 const pad=n=>String(n).padStart(2,"0");
 const stamp=now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate())+"_"+pad(now.getHours())+"-"+pad(now.getMinutes());
 a.download="PARLIAMO_"+profileName.replace(/[^a-z0-9_-]+/gi,"_")+"_"+stamp+".parliamo";
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}


const PROFILE_HISTORY_KEY="pcs2ProfileHistory";
function profileSnapshot(){
 return {app:"PARLIAMO",formatVersion:2,profileName,exportedAt:new Date().toISOString(),
 data:JSON.parse(JSON.stringify(data)),scenes:JSON.parse(JSON.stringify(scenesData)),
 gameExercises:JSON.parse(JSON.stringify(gameExercises)),sceneFolders:sceneFolderNames(),
 voice:profileStore.getItem("pcs2Voice")||"",rate:profileStore.getItem("pcs2Rate")||"1"};
}
function validProfile(x){
 return x&&["PARLIAMO","Parla con i simboli"].includes(x.app)&&x.data&&Array.isArray(x.data.root)&&
 (x.scenes===undefined||Array.isArray(x.scenes))&&(x.gameExercises===undefined||Array.isArray(x.gameExercises))&&
 (x.sceneFolders===undefined||Array.isArray(x.sceneFolders));
}
function profileHistory(){
 try{const h=JSON.parse(profileStore.getItem(PROFILE_HISTORY_KEY)||"[]");return Array.isArray(h)?h:[]}
 catch(e){return []}
}
function downloadProfileBackup(p,filename){
 const blob=new Blob([JSON.stringify(p,null,2)],{type:"application/octet-stream"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function preserveProfile(reason){
 const history=profileHistory();
 if(history.length>=5){
  const oldest=history[history.length-1];
  if(!confirm("Lo storico contiene già 5 versioni. Per continuare occorre esportare la più vecchia. Premi OK per scaricarla, oppure Annulla per interrompere."))return false;
  downloadProfileBackup(oldest.profile,"PARLIAMO_backup_"+oldest.savedAt.replace(/[:.]/g,"-")+".parliamo");
  if(!confirm("Verifica che il backup sia stato scaricato. Confermi di eliminare dallo storico la versione più vecchia e continuare?"))return false;
 }
 history.unshift({savedAt:new Date().toISOString(),reason,profile:profileSnapshot()});
 history.length=Math.min(history.length,5);
 try{profileStore.setItem(PROFILE_HISTORY_KEY,JSON.stringify(history));return true}
 catch(e){alert("Spazio insufficiente per salvare la versione precedente. Esporta il profilo e libera spazio.");return false}
}
function saveCurrentVersion(){
 saveProfileName();
 if(preserveProfile("Salvataggio manuale"))alert("Versione salvata nello storico.");
}
function applyProfile(x){
 if(!validProfile(x))throw Error("Profilo non valido");
 const d=JSON.parse(JSON.stringify(x.data)),sc=JSON.parse(JSON.stringify(x.scenes||[]));
 const ex=JSON.parse(JSON.stringify(x.gameExercises||[]));
 const folders=Array.isArray(x.sceneFolders)?x.sceneFolders:[...new Set(sc.map(s=>s.folder).filter(Boolean))];
 const name=String(x.profileName||"UTENTE");
 const updates={pcs2Data:JSON.stringify(d),pcs2Scenes:JSON.stringify(sc),
 pcs2GameExercises:JSON.stringify(ex),pcs2SceneFolders:JSON.stringify(folders),pcs2ProfileName:name};
 if(x.voice!==undefined)updates.pcs2Voice=x.voice;
 if(x.rate!==undefined)updates.pcs2Rate=x.rate;
 const before={};for(const k of Object.keys(updates))before[k]=profileStore.getItem(k);
 try{for(const [k,v] of Object.entries(updates))profileStore.setItem(k,v)}
 catch(e){for(const [k,v] of Object.entries(before)){try{if(v===null)profileStore.removeItem(k);else profileStore.setItem(k,v)}catch(_){}}throw e}
 data=d;scenesData=sc;gameExercises=ex;profileName=name;
 const pn=document.getElementById("profileName");if(pn)pn.value=name;
 path=["root"];inScenes=false;scenesVisible=false;currentSceneFolder=null;
 closeScene();render();renderSentence();renderGameExercises();
}
function showProfileHistory(){
 const h=profileHistory();
 if(!h.length){alert("Non ci sono ancora versioni salvate.");return}
 const list=h.map((v,i)=>(i+1)+". "+(v.profile.profileName||"UTENTE")+" — "+new Date(v.savedAt).toLocaleString("it-IT")+" ("+v.reason+")").join("\n");
 const selected=prompt("STORICO PROFILI\n\n"+list+"\n\nInserisci il numero da ripristinare, oppure Annulla:");
 if(selected===null||!selected.trim())return;
 const n=Number(selected.trim());
 if(!Number.isInteger(n)||n<1||n>h.length){alert("Numero non valido.");return}
 if(!validProfile(h[n-1].profile)){alert("La versione scelta non è valida.");return}
 if(!confirm("Ripristinare questa versione? La versione attuale verrà salvata nello storico."))return;
 if(!preserveProfile("Prima del ripristino"))return;
 try{applyProfile(h[n-1].profile);alert("Versione ripristinata.")}
 catch(e){alert("Ripristino non riuscito: "+e.message)}
}
function mergeProfile(current,incoming){
 const result=JSON.parse(JSON.stringify(current));
 const norm=s=>String(s||"").trim().toLocaleLowerCase("it-IT");
 function mergeItems(target,source){
  for(const item of source){
   if(!item||!["folder","pic"].includes(item.type))continue;
   if(item.type==="folder"){
    const match=target.find(x=>x.type==="folder"&&norm(x.label)===norm(item.label));
    if(match){
     if(!match.image&&item.image)match.image=item.image;
     mergeItems(match.items||(match.items=[]),item.items||[]);
    }else target.push(JSON.parse(JSON.stringify(item)));
   }else{
    const duplicate=target.some(x=>x.type==="pic"&&norm(x.label)===norm(item.label)&&
      ((x.id&&item.id&&String(x.id)===String(item.id))||(x.image&&item.image&&x.image===item.image)));
    if(!duplicate)target.push(JSON.parse(JSON.stringify(item)));
   }
  }
 }
 mergeItems(result.data.root,incoming.data.root);
 const signature=s=>norm(s.label)+"|"+(s.image||s.id||"")+"|"+norm(s.folder);
 const existing=new Map(result.scenes.map(s=>[signature(s),s]));
 const keys=new Set(result.scenes.map(s=>s.gameKey).filter(Boolean));
 const remap=new Map();
 for(const scene of incoming.scenes||[]){
  const match=existing.get(signature(scene));
  if(match){if(scene.gameEnabled)match.gameEnabled=true;if(scene.gameKey&&match.gameKey)remap.set(scene.gameKey,match.gameKey);continue}
  const copy=JSON.parse(JSON.stringify(scene));
  if(copy.gameKey&&keys.has(copy.gameKey)){
   let key;do{key="g"+Math.random().toString(36).slice(2,12)}while(keys.has(key));
   remap.set(copy.gameKey,key);copy.gameKey=key;
  }
  if(copy.gameKey)keys.add(copy.gameKey);
  result.scenes.push(copy);existing.set(signature(copy),copy);
 }
 result.sceneFolders=[...new Set([...(result.sceneFolders||[]),...(incoming.sceneFolders||[]),...result.scenes.map(s=>s.folder).filter(Boolean)])];
 const titles=new Set(result.gameExercises.map(e=>norm(e.title)));
 for(const exercise of incoming.gameExercises||[]){
  const copy=JSON.parse(JSON.stringify(exercise));
  copy.sceneIds=(copy.sceneIds||[]).map(id=>remap.get(id)||id).filter(id=>result.scenes.some(s=>s.gameKey===id));
  if(titles.has(norm(copy.title)))copy.title=(copy.title||"Esercizio")+" (importato)";
  while(titles.has(norm(copy.title)))copy.title+=" (2)";
  titles.add(norm(copy.title));result.gameExercises.push(copy);
 }
 return result;
}
function importProfileFile(ev){
 const file=ev.target.files&&ev.target.files[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=async()=>{
  try{
   const incoming=JSON.parse(reader.result);
   if(!validProfile(incoming))throw Error("Il file non è un profilo valido.");
   const option=prompt("IMPORTA PROFILO\n\n1 = SOSTITUISCI il profilo attuale\n2 = FONDI i contenuti con quelli attuali\n\nScrivi 1 o 2:","2");
   if(option===null)return;
   if(!["1","2"].includes(option.trim())){alert("Scegli 1 oppure 2.");return}
   const replace=option.trim()==="1";
   if(!confirm(replace?"Sostituire il profilo attuale? Prima sarà salvato nello storico.":"Fondere i profili? Le cartelle omonime saranno unite e i pittogrammi identici non duplicati. Prima sarà salvato il profilo attuale."))return;
   const target=replace?incoming:mergeProfile(profileSnapshot(),incoming);
   if(!preserveProfile(replace?"Prima della sostituzione":"Prima della fusione"))return;
   applyProfile(target);
   await profileStore.flush();
   alert(replace?"Profilo sostituito. La versione precedente è nello storico.":"Profili fusi. La versione precedente è nello storico.");
  }catch(e){alert("Importazione non riuscita: "+(e.message||"errore sconosciuto"))}
  finally{ev.target.value=""}
 };
 reader.onerror=()=>{alert("Impossibile leggere il file.");ev.target.value=""};
 reader.readAsText(file);
}

function openSceneAddMenu(){
 const m=document.getElementById("sceneAddMenu");
 m.classList.toggle("open");
}

function addSceneImage(ev){
 const f=ev.target.files&&ev.target.files[0]; if(!f)return;
 const label=prompt("Nome della scena:",""); if(label===null){ev.target.value="";return}
 const r=new FileReader();
 r.onload=()=>{
   scenesData.push({type:"pic",label:label.trim()||"SCENA",image:r.result,folder:currentSceneFolder||""});
   saveScenes(); render();
   document.body.classList.add("scene-folder");
 };
 r.readAsDataURL(f);
 ev.target.value="";
}

async function searchSceneArasaac(){
 const term=prompt("Cerca un pittogramma ARASAAC per la scena:","");
 if(!term)return;
 try{
   const res=await fetch("https://api.arasaac.org/v1/pictograms/it/search/"+encodeURIComponent(term));
   const arr=await res.json();
   if(!arr.length){alert("Nessun risultato.");return}
   const first=arr[0];
   const id=first._id;
   const label=prompt("Nome della scena:",term);
   if(label===null)return;
   scenesData.push({type:"pic",label:label.trim()||term,id:id,folder:currentSceneFolder||""});
   saveScenes(); render();
   document.body.classList.add("scene-folder");
 }catch(e){alert("Ricerca ARASAAC non disponibile.");}
}

let scenesVisible=false;
let scenesData=JSON.parse(profileStore.getItem("pcs2Scenes")||"[]");
let inScenes=false;

function saveScenes(){ profileStore.setItem("pcs2Scenes",JSON.stringify(scenesData)); }


function ensureScenesFolderVisible(){
 const grid=document.getElementById("board");
 if(!grid || inScenes || !scenesVisible)return;
 if(document.getElementById("scenesFolderCard"))return;
 const c=document.createElement("div");
 c.id="scenesFolderCard";
 c.className="card scenes-folder-card";
 c.onclick=openScenes;
 c.innerHTML='<div class="folder-shell"><div class="folder-tab"></div><div class="folder-shape"></div><div style="position:relative;z-index:2;font-size:42px;margin-top:20px">🎬</div></div><div class="label-edit"><b>'+esc(displayLabel("SCENE"))+'</b></div>';
 grid.prepend(c);
}
function removeScenesFolder(){
 const c=document.getElementById("scenesFolderCard");
 if(c)c.remove();
}


function refreshScenesFolder(){
 removeScenesFolder();
 if(scenesVisible && !inScenes) ensureScenesFolderVisible();
}

function toggleScenes(){
 scenesVisible=!scenesVisible;
 const b=document.getElementById("sceneToggleBtn");
 if(b)b.textContent=scenesVisible?"▣ NASCONDI CARTELLA SCENE":"▣ MOSTRA CARTELLA SCENE";
 if(!scenesVisible){
   inScenes=false;
   removeScenesFolder();
 }else{
   inScenes=false;
 }
 hideMenus();
 render();
 requestAnimationFrame(refreshScenesFolder);
}

function openScenes(){
 currentSceneFolder=null;
 inScenes=true;
 closeScene();
 render();
}

function leaveScenes(){
 inScenes=false;
 render();
 requestAnimationFrame(refreshScenesFolder);
}

function showScene(i){
 const __sceneStage=document.querySelector("#sceneStage")||document.querySelector("#sceneDisplay")||document.querySelector(".scene-stage")||document.querySelector(".scene-display");
 if(__sceneStage){__sceneStage.style.display="block";__sceneStage.hidden=false;}

 const x=scenesData[i];
 if(!x)return;
 const panel=document.getElementById("sceneDisplay");
 const im=document.getElementById("sceneDisplayImg");
 const lab=document.getElementById("sceneDisplayLabel");
 im.src=x.image||(x.id?img(x.id):"");
 lab.dataset.rawLabel=x.label||"";
 lab.textContent=displayLabel(x.label||"");
 lab.hidden=true;
 panel.style.display="block";
 document.body.classList.add("scene-open");
}

function toggleSceneName(ev){
 if(ev)ev.stopPropagation();
 const lab=document.getElementById("sceneDisplayLabel");
 if(lab)lab.hidden=!lab.hidden;
}
function speakSceneName(ev){
 if(ev)ev.stopPropagation();
 const lab=document.getElementById("sceneDisplayLabel");
 const name=lab?lab.textContent.trim():"";
 if(name)say(name);
}

function closeScene(){
 const panel=document.getElementById("sceneDisplay");
 if(panel)panel.style.display="none";
 document.body.classList.remove("scene-open");
}

function deleteScene(i){
 if(!scenesData[i])return;
 const removed=scenesData.splice(i,1)[0];
 deletedUndo={items:scenesData,index:i,item:removed,scene:true};
 saveScenes(); render();
 showUndoDelete();
}

function editScene(i){
 const x=scenesData[i]; if(!x)return;
 const nuovo=prompt("Nuovo nome:",x.label||"");
 if(nuovo===null)return;
 const nome=nuovo.trim(); if(!nome)return;
 x.label=nome; saveScenes(); render();
}

let editMode=false;
let deletedUndo=null;
let dragFrom=null;

function toggleEditMode(){
 editMode=!editMode;
 document.body.classList.toggle("edit-mode",editMode);
 const b=document.getElementById("editModeBtn");
 if(b)b.textContent=editMode?"✓ FINE MODIFICA":"✎ MODIFICA";
 render();
 renderSentence();
}

function deleteItem(i){
 const items=cur();
 if(!items[i])return;
 const removed=items.splice(i,1)[0];
 deletedUndo={items:items,index:i,item:removed};
 save(); render();
 showUndoDelete();
}
function showUndoDelete(){
 let bar=document.getElementById("undoDeleteBar");
 if(!bar){
   bar=document.createElement("div");
   bar.id="undoDeleteBar";
   bar.style.cssText="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100;background:#263238;color:white;padding:9px 12px;border-radius:10px;box-shadow:0 3px 14px #0005;display:flex;gap:12px;align-items:center";
   bar.innerHTML='<span>Elemento cancellato</span><button onclick="undoDelete()" style="font-weight:700;padding:6px 10px">ANNULLA</button>';
   document.body.appendChild(bar);
 }
 bar.style.display="flex";
 clearTimeout(window.undoDeleteTimer);
 window.undoDeleteTimer=setTimeout(()=>{bar.style.display="none";deletedUndo=null},8000);
}
function undoDelete(){
 if(!deletedUndo)return;
 deletedUndo.items.splice(deletedUndo.index,0,deletedUndo.item);
 if(deletedUndo.scene) saveScenes(); else save();
 render();
 const bar=document.getElementById("undoDeleteBar");
 if(bar)bar.style.display="none";
 deletedUndo=null;
}

function dragStart(e,i){
 if(!editMode){e.preventDefault();return}
 dragFrom=i;
 e.currentTarget.classList.add("dragging");
 e.dataTransfer.effectAllowed="move";
}
function dragOver(e,i){
 if(!editMode)return;
 e.preventDefault();
 e.currentTarget.classList.add("drag-over");
}
function dragLeave(e){e.currentTarget.classList.remove("drag-over")}
function dropItem(e,to){
 if(!editMode)return;
 e.preventDefault();
 e.currentTarget.classList.remove("drag-over");
 if(dragFrom===null||dragFrom===to)return;
 const items=cur();
 const moved=items.splice(dragFrom,1)[0];
 items.splice(to,0,moved);
 dragFrom=null;
 save(); render();
}
function dragEnd(e){
 e.currentTarget.classList.remove("dragging");
 document.querySelectorAll(".drag-over").forEach(x=>x.classList.remove("drag-over"));
 dragFrom=null;
}

function editItem(i){
  const items=cur();
  const item=items[i];
  if(!item)return;
  const nuovo=prompt(item.type==="folder" ? "Nuovo nome della cartella:" : "Nuovo nome:", item.label||"");
  if(nuovo===null)return;
  const nome=nuovo.trim();
  if(!nome)return;
  item.label=nome;
  save();
  render();
}
function hideMenus(){addMenu.style.display="none"}
function toggleMenu(id){let el=document.getElementById(id),open=el.style.display==="block";hideMenus();if(!open)el.style.display="block"}
document.addEventListener("click",e=>{if(!e.target.closest(".popover")&&!e.target.closest(".topbar"))hideMenus()});
rate.value=profileStore.getItem("pcs2Rate")||"1";
loadVoices();speechSynthesis.onvoiceschanged=loadVoices;


updateCaseButton();render();renderSentence();const _pn=document.getElementById("profileName");if(_pn)_pn.value=profileName;

// gioCAA: storage isolated from original PARLIAMO.
let gameExercises=JSON.parse(profileStore.getItem("pcs2GameExercises")||"[]");
let gameActive=false,gameScene=null,gameExpected=[],gameAttempts=0,gameGreen=0,gameOrange=0,gameRed=0,gameUsed=[];
let gameRunning=false,gameAdvanceTimer=null;
let gameTurn=0,gamePending=[],gameAssisted=false,gameFiller=false,gameOrangeScenes=new Set();
const repeatModeSelect=document.getElementById('gameRepeatMode');
repeatModeSelect.value=profileStore.getItem('pcs2GameRepeatMode')==='delayed'?'delayed':'immediate';
function saveGameRepeatMode(){profileStore.setItem('pcs2GameRepeatMode',repeatModeSelect.value)}
function resetGameProgress(){
 gameUsed=[];gameGreen=0;gameOrange=0;gameRed=0;gameTurn=0;
 gamePending=[];gameAssisted=false;gameFiller=false;gameOrangeScenes=new Set();
 renderGameAbacus();
}
function queueGameReview(assisted){
 const key=getSceneKey(gameScene);
 gamePending=gamePending.filter(x=>x.key!==key);
 const delay=assisted&&repeatModeSelect.value==='immediate'?1:2;
 gamePending.push({key,assisted,due:gameTurn+delay});
}
const gamePanel=document.getElementById("gamePanel"),gameFeedback=document.getElementById("gameFeedback");
function normalizeGame(t){return String(t||"").toLocaleLowerCase("it-IT").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
function allGamePics(items=data.root,out=[]){for(const x of items){if(x.type==="folder")allGamePics(x.items||[],out);else out.push(x)}return out}
function resolveGame(label){const words=normalizeGame(label).split(" ");const pics=allGamePics().sort((a,b)=>normalizeGame(b.label).length-normalizeGame(a.label).length);const result=[];let pos=0;while(pos<words.length){let found=null,count=0;for(const x of pics){const w=normalizeGame(x.label).split(" ");if(w.length>count&&w.every((v,i)=>v===words[pos+i])){found=x;count=w.length}}if(!found)return {missing:words[pos],expected:result};result.push(found);pos+=count}return {expected:result}}
function toggleGameHelp(){const el=document.getElementById("gameHelp");el.hidden=!el.hidden}
function toggleGame(){
 if(gameAdvanceTimer){clearTimeout(gameAdvanceTimer);gameAdvanceTimer=null}
 gameActive=!gameActive;
 gameRunning=false;
 document.body.classList.toggle("game-active",gameActive);
 document.body.classList.remove("game-running","game-solution-shown","game-finished");
 gamePanel.hidden=!gameActive;
 const sceneEl=document.getElementById('sceneDisplay');
 const slot=document.getElementById('gameSceneSlot');
 if(gameActive && sceneEl && slot)slot.appendChild(sceneEl);
 if(!gameActive && sceneEl)document.querySelector('main').prepend(sceneEl);
 document.getElementById("gameToggle").innerHTML=gameActive?'<span class="game-exit">✕<small>ESCI</small></span>':'<img src="giocaa-logo.png" alt="gioCAA">';
 if(gameActive){sentence=[];gameScene=null;resetGameProgress();renderSentence();gameFeedback.textContent="";renderGameExercises();renderGameAbacus();document.getElementById('gameVerify').disabled=true;document.getElementById('gameVerifyCompact').disabled=true}
 else{gameScene=null;closeScene();renderSentence()}
}
function finishGame(){
 gameRunning=false;gameScene=null;
 document.body.classList.remove('game-running','game-solution-shown');
 document.body.classList.add('game-finished');
 document.getElementById('gameSolution').hidden=true;
 document.getElementById('gameVerify').disabled=true;document.getElementById('gameVerifyCompact').disabled=true;
 closeScene();sentence=[];renderSentence();
 gameFeedback.textContent='ESERCIZIO TERMINATO. Il punteggio finale è riportato nell’abaco.';
}

function renderGameExercises(){const sel=document.getElementById("gameExercise"),prev=sel.value;sel.innerHTML='<option value="all">Tutte le scene abilitate</option>'+gameExercises.map((x,i)=>`<option value="${i}">${esc(x.title)}</option>`).join("");if([...sel.options].some(o=>o.value===prev))sel.value=prev}
function manageGameExercises(){const title=prompt("Titolo del nuovo esercizio (es. Frasi 2 elementi):");if(!title||!title.trim())return;const enabled=scenesData.map((s,i)=>s.gameEnabled?i:-1).filter(i=>i>=0);if(!enabled.length){alert("Prima abilita alcune scene nella cartella Scene.");return}const selected=prompt("Numeri delle scene da includere, separati da virgole.\n"+enabled.map((i,k)=>`${k+1}. ${scenesData[i].label}`).join("\n")+"\nLascia vuoto per includerle tutte.","");if(selected===null)return;const indexes=selected.trim()?selected.split(",").map(v=>enabled[Number(v.trim())-1]).filter(i=>i!==undefined):enabled;gameExercises.push({title:title.trim(),sceneIds:indexes.map(i=>getSceneKey(scenesData[i]))});profileStore.setItem("pcs2GameExercises",JSON.stringify(gameExercises));renderGameExercises();document.getElementById("gameExercise").value=String(gameExercises.length-1)}
function getSceneKey(x){if(!x.gameKey)x.gameKey='g'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);saveScenes();return x.gameKey}
function nextGame(){
 if(!gameActive)return;
 if(gameAdvanceTimer){clearTimeout(gameAdvanceTimer);gameAdvanceTimer=null}
 if(!gameRunning){gameRunning=true;resetGameProgress();document.body.classList.remove('game-finished');document.body.classList.add('game-running')}
 let pool=scenesData.filter(s=>s.gameEnabled);
 const chosen=document.getElementById('gameExercise').value;
 if(chosen!=='all'){
   const exercise=gameExercises[Number(chosen)];
   if(exercise)pool=pool.filter(s=>exercise.sceneIds.includes(getSceneKey(s)));
 }
 if(!pool.length){finishGame();gameFeedback.textContent='Nessuna scena abilitata per questo esercizio.';return}
 const ready=pool.map(scene=>({scene,result:resolveGame(scene.label)})).filter(x=>!x.result.missing);
 if(!ready.length){finishGame();gameFeedback.textContent='Mancano pittogrammi per le scene disponibili: controlla i nomi delle scene e dei pittogrammi.';return}
 gamePending=gamePending.filter(q=>ready.some(x=>getSceneKey(x.scene)===q.key));
 let review=gamePending.find(q=>q.due<=gameTurn+1);
 const available=ready.filter(x=>!gameUsed.includes(getSceneKey(x.scene)));
 // With a single scene, an assisted retry is still useful. An autonomous
 // review must actually have a different sentence between presentations.
 let choice=review?ready.find(x=>getSceneKey(x.scene)===review.key):available[Math.floor(Math.random()*available.length)];
 gameFiller=false;
 // Reuse another completed phrase when needed to space an orange review.
 // Its correct response does not add another point for the same filler.
 if(!choice&&gamePending.length){
   choice=ready.find(x=>!gamePending.some(q=>q.key===getSceneKey(x.scene)));
   gameFiller=Boolean(choice);
 }
 if(!choice){
   review=gamePending.find(q=>q.assisted);
   if(review)choice=ready.find(x=>getSceneKey(x.scene)===review.key);
 }
 if(!choice){finishGame();return}
 if(review)gamePending=gamePending.filter(q=>q!==review);
 gameAssisted=Boolean(review&&review.assisted);
 const x=choice.scene,key=getSceneKey(x);
 if(!gameUsed.includes(key))gameUsed.push(key);
 gameTurn++;gameScene=x;gameExpected=choice.result.expected;
 gameAttempts=0;sentence=[];renderSentence();showScene(scenesData.indexOf(x));
 gameFeedback.textContent=gameAssisted?'Riprova la frase dopo la soluzione.':review?'Ripasso: prova senza aiuti.':'';
 document.getElementById('gameSolution').hidden=true;
 gamePanel.scrollTop=0;
 document.body.classList.remove('game-solution-shown');
 document.getElementById('gameVerify').disabled=false;document.getElementById('gameVerifyCompact').disabled=false;
}

function gameTokenId(x){return x.id?`id:${x.id}`:`image:${x.image||''}|${normalizeGame(x.label)}`}
function renderGameAbacus(){for(const [id,n,color] of [["Green",gameGreen,"green"],["Orange",gameOrange,"orange"],["Red",gameRed,"red"]]){document.getElementById('game'+id+'Count').textContent=n;const rod=document.getElementById('game'+id+'Rod');rod.innerHTML=Array.from({length:Math.min(n,12)},()=>`<span class="abacus-ball ${color}"></span>`).join('');rod.title=n+' tentativi'}}
function gameCheck(){
 if(!gameScene||document.getElementById('gameVerify').disabled)return;
 gameAttempts++;
 const expected=gameExpected.map(gameTokenId),actual=sentence.map(gameTokenId);
 const correct=actual.length===expected.length&&actual.every((v,i)=>v===expected[i]);
 const key=getSceneKey(gameScene);
 if(correct){
   if(gameAssisted){
     if(!gameOrangeScenes.has(key)){gameOrangeScenes.add(key);gameOrange++}
     queueGameReview(false);
   }else if(gameOrangeScenes.has(key)){
     if(gameAttempts===1){gameOrangeScenes.delete(key);gameOrange--;gameGreen++}
     else queueGameReview(false);
   }else if(!gameFiller)gameGreen++;
 }else gameRed++;
 renderGameAbacus();
 const counts=new Map();expected.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
 const statuses=actual.map((v,i)=>{if(v===expected[i]){counts.set(v,counts.get(v)-1);return 'green'}return null});
 actual.forEach((v,i)=>{if(statuses[i])return;if((counts.get(v)||0)>0){statuses[i]='yellow';counts.set(v,counts.get(v)-1)}else statuses[i]='red'});
 document.querySelectorAll('#sentence .token').forEach((el,i)=>{
   const status=statuses[i];el.classList.remove('game-green','game-yellow','game-red');el.classList.add('game-'+status);
   const symbol=status==='green'?'✓':status==='yellow'?'↔':'✕';
   el.querySelector('.token-action').innerHTML=`<span class="token-status ${status==='green'?'correct':status==='yellow'?'move':'incorrect'}">${symbol}</span>`;
 });
 if(correct){
   gameFeedback.textContent=gameAssisted?'CORRETTO CON AIUTO: punto arancione.':'CORRETTO!';
   document.getElementById('gameVerify').disabled=true;document.getElementById('gameVerifyCompact').disabled=true;
   gameAdvanceTimer=setTimeout(()=>{gameAdvanceTimer=null;if(gameActive&&gameRunning)nextGame()},900);
 }else if(gameAttempts>=2){
   queueGameReview(true);
   gameFeedback.textContent='Guarda la soluzione, poi premi AVANTI per il ripasso.';
   showGameSolution();document.body.classList.add('game-solution-shown');
   document.getElementById('gameVerify').disabled=true;document.getElementById('gameVerifyCompact').disabled=true;
 }else gameFeedback.textContent='Puoi correggere e riprovare.';
}
function showGameSolution(){const box=document.getElementById('gameSolution'),tokens=document.getElementById('gameSolutionTokens');tokens.innerHTML=gameExpected.map((x,i)=>`<div class="game-solution-chip" id="gameSolutionChip${i}"><img src="${x.image||img(x.id)}" alt=""><b>${esc(displayLabel(x.label))}</b></div>`).join('');box.hidden=false;gamePanel.scrollTop=0}
function speakGameSolution(){if(!gameExpected.length)return;speechSynthesis.cancel();let index=0;function next(){document.querySelectorAll('.game-solution-chip').forEach(x=>x.classList.remove('speaking'));if(index>=gameExpected.length)return;const chip=document.getElementById('gameSolutionChip'+index);if(chip)chip.classList.add('speaking');const utter=new SpeechSynthesisUtterance(gameExpected[index].label);utter.lang='it-IT';const voice=voices.find(x=>x.name===voiceSelect.value);if(voice)utter.voice=voice;utter.rate=parseFloat(rate.value||'1');utter.onend=()=>{index++;next()};utter.onerror=()=>{index++;next()};speechSynthesis.speak(utter)}next()}
function moveToken(i,dir){if(!editMode)return;const j=i+dir;if(j<0||j>=sentence.length)return;[sentence[i],sentence[j]]=[sentence[j],sentence[i]];renderSentence();gameFeedback.textContent=''}
function removeToken(i){if(!editMode)return;sentence.splice(i,1);renderSentence()}

loadInitialProfile();
