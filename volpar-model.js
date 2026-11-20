/* Volpar Turboliner II attachment integration. If the GLB is not yet uploaded
   to the GitHub repo, the lightweight hangar canvas remains visible. */
(()=>{'use strict';
const viewer=document.getElementById('volparViewer');
const status=document.getElementById('aircraftStatus');
if(!viewer)return;
const asset='./Jack_N404CK_Volpar_Turboliner_II_spline.glb';
const colors={classic:null,sonic:'#3476d8',yellow:'#f8c820',red:'#d83c43'};
const saved=()=>{try{return localStorage.getItem('ifrQuestPlanePaint')||'classic'}catch(e){return 'classic'}};
let original=new Map();
let paintParts=[];
const blocked=/glass|window|canopy|tire|tyre|wheel|prop|rotor|interior|seat|cockpit|light|instrument|engine|chrome|black|rubber|transparen/i;
const preferred=/paint|body|skin|airframe|fuselage|wing|tail|hull|white|aircraft|exterior|metal/i;
function findPaintParts(mats){
  let chosen=mats.filter(m=>preferred.test(m.name||'')&&!blocked.test(m.name||''));
  if(chosen.length)return chosen;
  // Fallback selects bright opaque body-like materials without altering dark/glass parts.
  return mats.filter(m=>{if(blocked.test(m.name||''))return false;
    const p=m.pbrMetallicRoughness,b=p&&p.baseColorFactor;
    return Array.isArray(b)&&b.length>=4&&b[3]>.96&&(b[0]+b[1]+b[2])>1.75;
  });
}
function applyColor(colorName){
  if(!Object.prototype.hasOwnProperty.call(colors,colorName))return;
  const paint=colors[colorName];
  if(!paintParts.length)return;
  for(const material of paintParts){
    const p=material.pbrMetallicRoughness;
    if(!p)continue;
    try{
      if(paint){p.setBaseColorFactor(paint);}
      else if(original.has(material))p.setBaseColorFactor(original.get(material));
    }catch(e){status.textContent='Paint preview unavailable for this model material.';}
  }
}
function activate(){
  viewer.classList.add('volpar-loaded');
  const mats=Array.from(viewer.model?.materials||[]);
  paintParts=findPaintParts(mats);
  for(const m of paintParts){const f=m.pbrMetallicRoughness?.baseColorFactor;if(f)original.set(m,Array.from(f));}
  applyColor(saved());
  status.textContent=paintParts.length?
    'VOLPAR TURBOLINER II · drag aircraft to rotate · select your paint':
    'VOLPAR TURBOLINER II loaded · paint targets need material mapping';
}
viewer.addEventListener('load',activate);
viewer.addEventListener('error',()=>{viewer.classList.remove('volpar-loaded');status.textContent='Lightweight hangar mode active · 3D file could not be loaded.'});
document.querySelectorAll('.aircraft-paint').forEach(b=>b.addEventListener('click',()=>applyColor(b.dataset.paint)));
if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)viewer.removeAttribute('auto-rotate');
// Only request GLB after confirming it exists; missing upload never breaks the game.
fetch(asset,{method:'HEAD',cache:'no-store'}).then(r=>{
 if(!r.ok)throw new Error('GLB not published');
 return customElements.whenDefined('model-viewer');
}).then(()=>{viewer.src=asset}).catch(()=>{status.textContent='HANGAR PREVIEW · the Volpar 3D file is not published yet; mission controls remain ready.'});
})();