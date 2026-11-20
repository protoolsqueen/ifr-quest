/* IFR Quest — lightweight software-rendered 3D hangar. Original procedural plane,
   not the uploaded X-Plane asset. No external scripts, no telemetry, ~75 polygons. */
(()=>{'use strict';
const canvas=document.getElementById('hangar3d');if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
const colors={classic:'#e9edf1',sonic:'#3476d8',yellow:'#f8c820',red:'#d83c43'};
let paint='classic';try{paint=localStorage.getItem('ifrQuestPlanePaint')||'classic'}catch(e){}if(!colors[paint])paint='classic';
const state={dragging:false,lastX:0,manualAngle:0,paint,active:true};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function shade(h,v){const c=rgb(h);return `rgb(${c.map(x=>Math.max(0,Math.min(255,Math.round(x*v)))).join(',')})`}
function v(x,y,z){return [x,y,z]}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(a){const l=Math.hypot(...a)||1;return a.map(x=>x/l)}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function face(pts,col,alpha=1,wire=false){return {pts,col,alpha,wire}}
function box(o,s,col,out){const [x,y,z]=o,[w,h,d]=s;
 const p=[v(x-w/2,y-h/2,z-d/2),v(x+w/2,y-h/2,z-d/2),v(x+w/2,y+h/2,z-d/2),v(x-w/2,y+h/2,z-d/2),v(x-w/2,y-h/2,z+d/2),v(x+w/2,y-h/2,z+d/2),v(x+w/2,y+h/2,z+d/2),v(x-w/2,y+h/2,z+d/2)];
 for(const idx of [[0,1,2,3],[4,7,6,5],[3,2,6,7],[0,4,5,1],[0,3,7,4],[1,5,6,2]])out.push(face(idx.map(i=>p[i]),col));}
function plate(top,th,col,out){out.push(face(top,col));out.push(face(top.map(p=>v(p[0],p[1]-th,p[2])).reverse(),col));
 for(let i=0;i<top.length;i++){const j=(i+1)%top.length;out.push(face([top[i],top[j],v(top[j][0],top[j][1]-th,top[j][2]),v(top[i][0],top[i][1]-th,top[i][2])],col))}}
function tube(cx,cy,za,zb,radii,col,out,N=10){const a=typeof radii==='number'?radii:radii[0],b=typeof radii==='number'?radii:radii[1];for(let i=0;i<N;i++){const t=i*Math.PI*2/N,t2=(i+1)*Math.PI*2/N;out.push(face([v(cx+Math.cos(t)*a,cy+Math.sin(t)*a,za),v(cx+Math.cos(t2)*a,cy+Math.sin(t2)*a,za),v(cx+Math.cos(t2)*b,cy+Math.sin(t2)*b,zb),v(cx+Math.cos(t)*b,cy+Math.sin(t)*b,zb)],col));}}
function plane(){const a=[],p=colors[state.paint];
 // Stretched Beech-18-inspired, twin-turboprop silhouette; original procedural placeholder.
 tube(0,2.6,-4.15,3.3,[0.44,.61],p,a,12);tube(0,2.6,3.3,4.1,[.61,.22],p,a,12);
 tube(0,2.6,4.1,4.32,[.22,.02],shade(p,.95),a,12);
 plate([v(-6.1,2.72,-.82),v(6.1,2.72,-.82),v(5.65,2.72,-.34),v(0,2.72,1.35)],.13,p,a);
 // tip accent stripes to enhance depth
 for(const s of [-1,1]){plate([v(s*5.6,2.75,-.78),v(s*6.1,2.75,-.82),v(s*5.95,2.75,-.36),v(s*5.48,2.75,-.35)],.03,'#f1e4bb',a)}
 plate([v(-2.65,2.65,-3.98),v(2.65,2.65,-3.98),v(2.7,2.65,-3.5),v(0,2.65,-3.12)],.08,p,a);
 plate([v(0,2.65,-4.08),v(0,4.25,-4.15),v(0,4.15,-3.65),v(0,2.65,-3.18)],.10,p,a);
 // cockpit glazed windows (upper fuselage) and cabin windows
 plate([v(-.42,3.07,2.73),v(.42,3.07,2.73),v(.52,3.03,1.66),v(-.52,3.03,1.66)],.035,'#19364e',a);
 for(const side of [-1,1])for(let i=0;i<4;i++){const z=.35-i*.87;box([side*.6,2.73,z],[.055,.28,.43],'#213b4f',a)}
 for(const s of [-1,1]){tube(s*2.4,2.58,-.1,1.75,.46,shade(p,.84),a,10);tube(s*2.4,2.58,1.75,2.08,[.47,.16],'#b9c5cd',a,10);
 tube(s*2.4,2.58,2.08,2.2,[.16,.035],'#8da0ae',a,8);
 box([s*1.9,1.15,-.4],[.10,1.65,.12],'#788fa0',a);box([s*1.92,.45,-.42],[.32,.48,.18],'#10171d',a);
 }
 box([0,1.1,3.08],[.10,1.6,.11],'#8396a6',a);box([0,.43,3.13],[.33,.48,.19],'#10171d',a);
 return a;
}
function scene(ts){const a=[];
 box([0,-.22,-1.5],[31,.3,29],'#344355',a);box([0,-.21,-21],[14,.23,25],'#273a4c',a);
 for(let z=-28;z<14;z+=2.9){box([0,-.03,z],[.065,.03,1.2],'#e1bc77',a);for(let s of [-1,1])box([s*3.7,-.035,z],[.22,.05,.22],s<0?'#7cbad9':'#f2bb77',a)}
 for(let x=-12.5;x<=12.5;x+=2.5){box([x,-.04,0],[.025,.015,27],'#566778',a)}
 for(let z=-12;z<13;z+=3){box([0,-.04,z],[28,.018,.025],'#475a6d',a)}
 for(const s of [-1,1]){box([s*14.5,5.1,-1.4],[.8,10.3,29],'#172e43',a);box([s*13.7,10.1,-1.3],[.32,.35,29],'#68829a',a);
 for(let z of [-12,-3,6,12])box([s*13.7,5,z],[.42,9.9,.38],'#536d87',a);
 for(let z of [-10,0,10])box([s*13.2,9.8,z],[.15,.12,3.5],'#9bcfee',a);
 }
 for(let z of [-12,-5,2,9])box([0,10.25,z],[28,.26,.33],'#506a81',a);
 for(let s of [-1,1])box([s*10.1,4.9,-14],[8.8,9.75,.4],'#223b50',a);
 box([0,9.95,-14],[12,.65,.4],'#3c6078',a);
 for(let s of [-1,1])for(let i=0;i<3;i++)box([s*(10+i*.53),.42,8.7+i*.35],[.9,.76,.9],i===1?'#667c91':'#3b526b',a);
 box([-10,.45,3],[2.9,.8,1],'#485b6a',a);
 a.push(...plane());
 return a;
}
let W=0,H=0,dpr=1,raf=0,last=0,started=performance.now(),hover=false;
function resize(){const rect=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,1.5);W=Math.max(1,rect.width);H=Math.max(1,rect.height);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
let resizeObserver;if('ResizeObserver'in window){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas)}else window.addEventListener('resize',resize);resize();
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function render(t){raf=requestAnimationFrame(render);if(t-last<(reduced?160:34))return;last=t;if(!W||!H||!document.getElementById('view-home')||document.getElementById('view-home').hidden)return;
 const phase=(t-started)/1000;const orbit=0.28+(!reduced?Math.sin(phase*.22)*.17:0)+state.manualAngle;
 const cam=v(.65+Math.sin(phase*.20)*1.3,6.4,15.5);const target=v(-2.8,2.0,-.6),forward=norm(sub(target,cam)),right=norm(cross(forward,v(0,1,0))),up=norm(cross(right,forward));
 const f=(Math.min(W*1.05,H*1.9))*.83;
 const project=p=>{let q=sub(p,cam),z=dot(q,forward);return {x:W/2+f*dot(q,right)/(z||1),y:H*.27-f*dot(q,up)/(z||1),z}};
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#243b57');bg.addColorStop(.54,'#142a42');bg.addColorStop(1,'#07111f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const faces=scene(phase).map(poly=>{let pts=poly.pts.map(project);let depth=pts.reduce((v,p)=>v+p.z,0)/pts.length;let e1=sub(poly.pts[1],poly.pts[0]),e2=sub(poly.pts[2],poly.pts[0]),normal=norm(cross(e1,e2));let diffuse=Math.abs(dot(normal,norm(v(-.45,1,.85))));return {...poly,pts,depth,bright:.62+diffuse*.47}}).filter(x=>x.pts.every(p=>p.z>.4)).sort((a,b)=>b.depth-a.depth);
 for(let poly of faces){ctx.beginPath();ctx.moveTo(poly.pts[0].x,poly.pts[0].y);for(let j=1;j<poly.pts.length;j++)ctx.lineTo(poly.pts[j].x,poly.pts[j].y);ctx.closePath();ctx.fillStyle=shade(poly.col,poly.bright);ctx.fill();}
 const shadow=ctx.createLinearGradient(0,0,0,H);shadow.addColorStop(0,'#07132700');shadow.addColorStop(1,'#0713279c');ctx.fillStyle=shadow;ctx.fillRect(0,0,W,H);
}
if(!reduced)raf=requestAnimationFrame(render);else render(performance.now());
function applyPaint(next){if(!colors[next])return;state.paint=next;try{localStorage.setItem('ifrQuestPlanePaint',next)}catch(e){}document.querySelectorAll('.aircraft-paint').forEach(b=>{let on=b.dataset.paint===next;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});document.documentElement.style.setProperty('--paint',colors[next]);if(reduced){last=-99999;render(performance.now())}}
canvas.setAttribute('role','img');canvas.setAttribute('aria-label','3D-rendered original twin turboprop in a hangar with slowly moving camera; illustrative model');
document.querySelectorAll('.aircraft-paint').forEach(b=>b.addEventListener('click',()=>applyPaint(b.dataset.paint)));
applyPaint(paint);
window.IFRHangar={applyPaint,getPaint:()=>state.paint};
})();