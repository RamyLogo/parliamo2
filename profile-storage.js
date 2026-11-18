/* ParliAMO 2: persistent profile storage, isolated from original app. */
(async function(){
 const status=document.createElement("div");
 status.textContent="Caricamento profilo…";status.style.cssText="position:fixed;inset:0;background:white;color:#222;z-index:100000;display:grid;place-items:center;font:18px Arial";
 document.body.appendChild(status);
 try{
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open("Parliamo2Profile",1);r.onupgradeneeded=()=>r.result.createObjectStore("state");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error("Archivio bloccato"))});
 const read=()=>new Promise((resolve,reject)=>{const r=db.transaction("state").objectStore("state").get("profile");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 const write=state=>new Promise((resolve,reject)=>{const tx=db.transaction("state","readwrite");tx.objectStore("state").put(state,"profile");tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error("Salvataggio non riuscito"))});
 let state=await read();
 if(!state){state={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("pcs2"))state[k]=localStorage.getItem(k)}await write(state)}
 let pending=Promise.resolve(),failureShown=false;
 function queue(){const snapshot={...state};pending=pending.catch(()=>{}).then(()=>write(snapshot));pending.catch(()=>{if(!failureShown){failureShown=true;alert("Archivio non salvato. Non chiudere la pagina: esporta il profilo per conservarlo.")}})}
 window.profileStore={getItem:k=>Object.prototype.hasOwnProperty.call(state,k)?state[k]:null,setItem(k,v){state[k]=String(v);queue()},removeItem(k){delete state[k];queue()},flush:()=>pending};
 const script=document.createElement("script");script.src="app-idb.js";script.onload=()=>status.remove();script.onerror=()=>{status.textContent="Impossibile caricare ParliAMO 2. Ricarica la pagina."};document.body.appendChild(script);
 }catch(e){status.textContent="Archivio locale non disponibile. Ricarica la pagina o prova un browser diverso. I dati precedenti non sono stati cancellati.";console.error(e)}
})();
