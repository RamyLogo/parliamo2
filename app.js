const seed=[{"type":"folder","label":"PERSONE","items":[{"type":"pic","label":"il bimbo","id":7176}],"image":"https://static.arasaac.org/pictograms/7116/7116_500.png","iconPictogramId":7116},{"type":"folder","label":"AZIONI","items":[{"type":"pic","label":"mangia","id":6456}],"image":"https://static.arasaac.org/pictograms/7297/7297_500.png","iconPictogramId":7297},{"type":"folder","label":"GIOCHI","items":[{"type":"pic","id":3241,"label":"palla"},{"type":"pic","id":27612,"label":"palla da bowling"},{"type":"pic","id":2514,"label":"palla da tennis"}],"image":"https://static.arasaac.org/pictograms/9813/9813_500.png"},{"type":"folder","label":"CIBI","items":[{"type":"pic","label":"la pizza","id":2527}],"image":"https://static.arasaac.org/pictograms/4610/4610_500.png","iconPictogramId":4610},{"type":"folder","label":"colori","items":[],"image":"https://static.arasaac.org/pictograms/5968/5968_500.png","iconPictogramId":5968}];
let data=JSON.parse(localStorage.getItem("pcs2Data")||"null")||{root:seed}, path=["root"], sentence=[];
const img=id=>`https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
function save(){localStorage.setItem("pcs2Data",JSON.stringify(data))}
function cur(){let a=data.root;for(let i=1;i<path.length;i++)a=a[path[i]].items;return a}

let labelsUppercase=localStorage.getItem("pcs2LabelsUppercase")==="1";
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
 localStorage.setItem("pcs2LabelsUppercase",labelsUppercase?"1":"0");
 updateCaseButton();
 render();
 renderSentence();
 const lab=document.getElementById("sceneDisplayLabel");
 if(lab && lab.dataset.rawLabel!==undefined)lab.textContent=displayLabel(lab.dataset.rawLabel);
}
let currentSceneFolder=null;
function sceneFolderNames(){return JSON.parse(localStorage.getItem("pcs2SceneFolders")||"[]")}
function saveSceneFolders(v){localStorage.setItem("pcs2SceneFolders",JSON.stringify(v))}
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
 `<div class="card" draggable="${editMode}" ondragstart="dragStart(event,${i})" ondragover="dragOver(event,${i})" ondragleave="dragLeave(event)" ondrop="dropItem(event,${i})" ondragend="dragEnd(event)" onclick="if(!editMode)tapPic(${i})"><img src="${x.image||img(x.id)}"><div class="label-edit"><b>${esc(displayLabel(x.label))}</b><button class="edit edit-bottom" aria-label="Modifica nome" onclick="event.preventDefault();event.stopPropagation();editItem(${i})">✎</button><button class="delete-bottom" aria-label="Cancella" onclick="event.preventDefault();event.stopPropagation();deleteItem(${i})">✕</button></div>${gameActive?`<div class="game-move"><button onclick="moveToken(${i},-1)">←</button><button onclick="moveToken(${i},1)">→</button><button onclick="removeToken(${i})">✕</button></div>`:""}</div>`).join("");
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
 let saved=localStorage.getItem("pcs2Voice")||"";
 voiceSelect.innerHTML=list.map(v=>`<option value="${esc(v.name)}" ${v.name===saved?"selected":""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("");
}
function saveVoice(){localStorage.setItem("pcs2Voice",voiceSelect.value);localStorage.setItem("pcs2Rate",rate.value)}
function say(t){
 speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang="it-IT";
 let v=voices.find(x=>x.name===voiceSelect.value);if(v)u.voice=v;
 u.rate=parseFloat(rate.value||"1");speechSynthesis.speak(u)
}
function tapPic(i){if(gameActive&&gameScene&&document.getElementById("gameVerify").disabled)return;let x=cur()[i];sentence.push({...x});renderSentence();say(x.label);if(gameActive)gameFeedback.textContent=""}
function renderSentence(){
 const el=document.querySelector("#sentence");el.innerHTML=sentence.length?sentence.map((x,i)=>`<div class="chip token" role="button" tabindex="0" draggable="${gameActive&&!document.getElementById('gameVerify').disabled}" ondragstart="gameDragStart(event,${i})" ondragover="event.preventDefault()" ondrop="gameDrop(event,${i})" onclick="speakSentenceItem(${i})"><img src="${x.image||img(x.id)}"><div>${esc(displayLabel(x.label))}</div><span class="token-action"></span></div>`).join(""):'<span class="small">Tocca i simboli per costruire la frase.</span>';
}
let gameDragged=null;
function gameDragStart(ev,i){if(!gameActive)return;gameDragged=i;ev.dataTransfer.effectAllowed="move"}
function gameDrop(ev,i){ev.preventDefault();if(gameDragged===null||gameDragged===i)return;const x=sentence.splice(gameDragged,1)[0];sentence.splice(i,0,x);gameDragged=null;renderSentence()}

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
let profileName=localStorage.getItem("pcs2ProfileName")||"UTENTE";

function saveProfileName(){
 const el=document.getElementById("profileName");
 profileName=(el.value||"UTENTE").trim()||"UTENTE";
 localStorage.setItem("pcs2ProfileName",profileName);
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
   voice:localStorage.getItem("pcs2Voice")||"",
   rate:localStorage.getItem("pcs2Rate")||"1"
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

function importProfileFile(ev){
 const file=ev.target.files&&ev.target.files[0];
 if(!file)return;
 const r=new FileReader();
 r.onload=()=>{
   try{
     const x=JSON.parse(r.result);
     if(!x || (x.app!=="Parla con i simboli" && x.app!=="PARLIAMO") || !x.data)throw new Error();
     data=x.data;
     scenesData=Array.isArray(x.scenes)?x.scenes:[];
     gameExercises=Array.isArray(x.gameExercises)?x.gameExercises:[];localStorage.setItem("pcs2GameExercises",JSON.stringify(gameExercises));
     saveSceneFolders(Array.isArray(x.sceneFolders)?x.sceneFolders:[...new Set(scenesData.map(s=>s.folder).filter(Boolean))]);
     profileName=x.profileName||"UTENTE";
     localStorage.setItem("pcs2Data",JSON.stringify(data));
     localStorage.setItem("pcs2Scenes",JSON.stringify(scenesData));
     localStorage.setItem("pcs2ProfileName",profileName);
     if(x.voice!==undefined)localStorage.setItem("pcs2Voice",x.voice);
     if(x.rate!==undefined)localStorage.setItem("pcs2Rate",x.rate);
     const pn=document.getElementById("profileName");if(pn)pn.value=profileName;
     path=["root"]; inScenes=false; scenesVisible=false; closeScene(); render(); renderSentence();
     let msg="Profilo "+profileName+" importato.";
     if(x.exportedAt){const d=new Date(x.exportedAt);if(!isNaN(d))msg+="\nEsportato il "+d.toLocaleDateString("it-IT")+" alle "+d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});}
     alert(msg);
   }catch(e){alert("Il file non è un profilo valido.");}
   ev.target.value="";
 };
 r.readAsText(file);
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
let scenesData=JSON.parse(localStorage.getItem("pcs2Scenes")||"[]");
let inScenes=false;

function saveScenes(){ localStorage.setItem("pcs2Scenes",JSON.stringify(scenesData)); }


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
rate.value=localStorage.getItem("pcs2Rate")||"1";
loadVoices();speechSynthesis.onvoiceschanged=loadVoices;


updateCaseButton();render();renderSentence();const _pn=document.getElementById("profileName");if(_pn)_pn.value=profileName;if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");

// gioCAA: storage isolated from original PARLIAMO.
let gameExercises=JSON.parse(localStorage.getItem("pcs2GameExercises")||"[]");
let gameActive=false,gameScene=null,gameExpected=[],gameAttempts=0,gameGreen=0,gameRed=0,gameUsed=[];
let gameRunning=false,gameAdvanceTimer=null;
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
 document.body.classList.remove("game-running","game-solution-shown");
 gamePanel.hidden=!gameActive;
 document.getElementById("gameToggle").innerHTML=gameActive?'<span class="game-exit">✕<small>ESCI</small></span>':'<img src="giocaa-logo.png" alt="gioCAA">';
 if(gameActive){sentence=[];gameScene=null;gameUsed=[];gameGreen=0;gameRed=0;renderSentence();gameFeedback.textContent="";renderGameExercises();renderGameAbacus();document.getElementById('gameVerify').disabled=true}
 else{gameScene=null;closeScene();renderSentence()}
}
function finishGame(){
 gameRunning=false;gameScene=null;
 document.body.classList.remove('game-running','game-solution-shown');
 document.getElementById('gameSolution').hidden=true;
 document.getElementById('gameVerify').disabled=true;
 closeScene();sentence=[];renderSentence();
 gameFeedback.textContent='ESERCIZIO TERMINATO. Il punteggio finale è riportato nell’abaco.';
}

function renderGameExercises(){const sel=document.getElementById("gameExercise"),prev=sel.value;sel.innerHTML='<option value="all">Tutte le scene abilitate</option>'+gameExercises.map((x,i)=>`<option value="${i}">${esc(x.title)}</option>`).join("");if([...sel.options].some(o=>o.value===prev))sel.value=prev}
function manageGameExercises(){const title=prompt("Titolo del nuovo esercizio (es. Frasi 2 elementi):");if(!title||!title.trim())return;const enabled=scenesData.map((s,i)=>s.gameEnabled?i:-1).filter(i=>i>=0);if(!enabled.length){alert("Prima abilita alcune scene nella cartella Scene.");return}const selected=prompt("Numeri delle scene da includere, separati da virgole.\n"+enabled.map((i,k)=>`${k+1}. ${scenesData[i].label}`).join("\n")+"\nLascia vuoto per includerle tutte.","");if(selected===null)return;const indexes=selected.trim()?selected.split(",").map(v=>enabled[Number(v.trim())-1]).filter(i=>i!==undefined):enabled;gameExercises.push({title:title.trim(),sceneIds:indexes.map(i=>getSceneKey(scenesData[i]))});localStorage.setItem("pcs2GameExercises",JSON.stringify(gameExercises));renderGameExercises();document.getElementById("gameExercise").value=String(gameExercises.length-1)}
function getSceneKey(x){if(!x.gameKey)x.gameKey='g'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);saveScenes();return x.gameKey}
function nextGame(){
 if(!gameActive)return;
 if(gameAdvanceTimer){clearTimeout(gameAdvanceTimer);gameAdvanceTimer=null}
 if(!gameRunning){gameRunning=true;gameUsed=[];gameGreen=0;gameRed=0;renderGameAbacus();document.body.classList.add('game-running')}
 let pool=scenesData.filter(s=>s.gameEnabled);
 const chosen=document.getElementById('gameExercise').value;
 if(chosen!=='all'){
   const exercise=gameExercises[Number(chosen)];
   if(exercise)pool=pool.filter(s=>exercise.sceneIds.includes(getSceneKey(s)));
 }
 if(!pool.length){finishGame();gameFeedback.textContent='Nessuna scena abilitata per questo esercizio.';return}
 const available=pool.filter(s=>!gameUsed.includes(getSceneKey(s)));
 if(!available.length){finishGame();return}
 // Prefer scenes that can be resolved without stopping the activity.
 const candidates=available.map(s=>({scene:s,result:resolveGame(s.label)}));
 const ready=candidates.filter(c=>!c.result.missing);
 if(!ready.length){finishGame();gameFeedback.textContent='Mancano pittogrammi per le scene disponibili: controlla i nomi delle scene e dei pittogrammi.';return}
 const choice=ready[Math.floor(Math.random()*ready.length)];
 const x=choice.scene;
 gameUsed.push(getSceneKey(x));gameScene=x;gameExpected=choice.result.expected;
 gameAttempts=0;sentence=[];renderSentence();showScene(scenesData.indexOf(x));
 gameFeedback.textContent='';
 document.getElementById('gameSolution').hidden=true;
 document.body.classList.remove('game-solution-shown');
 document.getElementById('gameVerify').disabled=false;
}

function gameTokenId(x){return x.id?`id:${x.id}`:`image:${x.image||''}|${normalizeGame(x.label)}`}
function renderGameAbacus(){for(const [id,n,color] of [["Green",gameGreen,"green"],["Red",gameRed,"red"]]){document.getElementById('game'+id+'Count').textContent=n;const rod=document.getElementById('game'+id+'Rod');rod.innerHTML=Array.from({length:Math.min(n,12)},()=>`<span class="abacus-ball ${color}"></span>`).join('');rod.title=n+' tentativi'}}
function gameCheck(){if(!gameScene||document.getElementById('gameVerify').disabled)return;gameAttempts++;const expected=gameExpected.map(gameTokenId),actual=sentence.map(gameTokenId),correct=actual.length===expected.length&&actual.every((v,i)=>v===expected[i]);if(correct)gameGreen++;else gameRed++;renderGameAbacus();const counts=new Map();expected.forEach(v=>counts.set(v,(counts.get(v)||0)+1));const statuses=actual.map((v,i)=>{if(v===expected[i]){counts.set(v,counts.get(v)-1);return 'green'}return null});actual.forEach((v,i)=>{if(statuses[i])return;if((counts.get(v)||0)>0){statuses[i]='yellow';counts.set(v,counts.get(v)-1)}else statuses[i]='red'});document.querySelectorAll('#sentence .token').forEach((el,i)=>{const status=statuses[i];el.classList.remove('game-green','game-yellow','game-red');el.classList.add('game-'+status);const action=el.querySelector('.token-action');if(status==='green')action.innerHTML='<span class="token-status correct">✓</span>';if(status==='red')action.innerHTML=`<button class="token-status incorrect" onclick="event.stopPropagation();removeToken(${i})" aria-label="Elimina pittogramma">✕</button>`;if(status==='yellow')action.innerHTML=`<span class="token-status move" title="Sposta pittogramma">↔</span><div class="token-arrows"><button onclick="event.stopPropagation();moveToken(${i},-1)">◀</button><button onclick="event.stopPropagation();moveToken(${i},1)">▶</button></div>`});if(correct){gameFeedback.textContent='CORRETTO!';document.getElementById('gameVerify').disabled=true;gameAdvanceTimer=setTimeout(()=>{gameAdvanceTimer=null;if(gameActive&&gameRunning)nextGame()},900)}else if(gameAttempts>=2){gameFeedback.textContent='Ecco la soluzione di gioCAA.';showGameSolution();document.body.classList.add('game-solution-shown');document.getElementById('gameVerify').disabled=true}else{gameFeedback.textContent='Puoi correggere e riprovare.'}}
function showGameSolution(){const box=document.getElementById('gameSolution'),tokens=document.getElementById('gameSolutionTokens');tokens.innerHTML=gameExpected.map((x,i)=>`<div class="game-solution-chip" id="gameSolutionChip${i}"><img src="${x.image||img(x.id)}" alt=""><b>${esc(displayLabel(x.label))}</b></div>`).join('');box.hidden=false}
function speakGameSolution(){if(!gameExpected.length)return;speechSynthesis.cancel();let index=0;function next(){document.querySelectorAll('.game-solution-chip').forEach(x=>x.classList.remove('speaking'));if(index>=gameExpected.length)return;const chip=document.getElementById('gameSolutionChip'+index);if(chip)chip.classList.add('speaking');const utter=new SpeechSynthesisUtterance(gameExpected[index].label);utter.lang='it-IT';const voice=voices.find(x=>x.name===voiceSelect.value);if(voice)utter.voice=voice;utter.rate=parseFloat(rate.value||'1');utter.onend=()=>{index++;next()};utter.onerror=()=>{index++;next()};speechSynthesis.speak(utter)}next()}
function moveToken(i,dir){if(document.getElementById('gameVerify').disabled)return;const j=i+dir;if(j<0||j>=sentence.length)return;[sentence[i],sentence[j]]=[sentence[j],sentence[i]];renderSentence();gameFeedback.textContent=''}
function removeToken(i){if(document.getElementById('gameVerify').disabled)return;sentence.splice(i,1);renderSentence()}
