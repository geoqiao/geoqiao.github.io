// All desktop app windows participate in the same stacking context.
const desktopSurface=document.querySelector('.mac-native');
desktopSurface.append(readingWindow);
const pageWindow=document.getElementById('route-window');
if(pageWindow)desktopSurface.append(pageWindow);
const managedWindows=()=>[...desktopSurface.querySelectorAll('.window,#reader,#route-window')];
const windowVisible=panel=>!panel.hidden&&(panel.id!=='reader'||panel.open)&&!panel.classList.contains('mobile-inactive');
let activeWindow=null;
function appDock(panel){
  if(!panel)return null;
  const name=panel.id.replace('native-','');
  return document.querySelector(`.native-dock [data-extra-app="${name==='reader'?'obsidian':name}"]`)||document.querySelector(`.native-dock [data-native-app="${({finder:'writing',safari:'projects'})[name]||name}"]`);
}
raiseWindow=function(panel){
  if(!panel||!windowVisible(panel))return;
  const windows=managedWindows().filter(p=>p!==panel).sort((a,b)=>Number(a.style.zIndex||getComputedStyle(a).zIndex)-Number(b.style.zIndex||getComputedStyle(b).zIndex));
  windows.push(panel);
  windows.forEach((p,i)=>{p.style.zIndex=String(10+i);p.classList.toggle('window-active',p===panel);});
  activeWindow=panel;
  document.querySelectorAll('.native-dock button').forEach(b=>b.removeAttribute('aria-current'));
  const dock=appDock(panel);dock?.setAttribute('aria-current','true');dock?.classList.add('running');
  const name=panel.id==='reader'?'Obsidian':({finder:'访达',safari:'Safari',mygo:'MyGo Music',paseo:'Paseo',magpie:'Magpie',pi:'Pi',preferences:'系统设置',note:'备忘录',terminal:'终端'})[panel.id.replace('native-','')]||'Geo';
  const label=document.querySelector('.app-menu');if(label)label.textContent=name;
};
function activateNextWindow(){
  const next=managedWindows().filter(windowVisible).sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex))[0];
  if(next){raiseWindow(next);next.tabIndex=-1;next.focus({preventScroll:true});}
}
desktopSurface.addEventListener('pointerdown',event=>{const panel=event.target.closest('.window,#reader,#route-window');if(panel)raiseWindow(panel);},true);
desktopSurface.addEventListener('focusin',event=>{const panel=event.target.closest('.window,#reader,#route-window');if(panel)raiseWindow(panel);});
new MutationObserver(()=>{if(activeWindow&&!windowVisible(activeWindow))activateNextWindow();}).observe(desktopSurface,{subtree:true,attributes:true,attributeFilter:['hidden']});
readingWindow.addEventListener('close',()=>{if(readingWindow.open)return;appDock(readingWindow)?.classList.remove('running');activateNextWindow();});
document.addEventListener('click',event=>{
  const close=event.target.closest('[data-window-close]');
  if(close)appDock(document.getElementById(close.dataset.windowClose))?.classList.remove('running');
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&innerWidth>760&&activeWindow===readingWindow&&readingWindow.open&&!document.querySelector('dialog:modal')){event.preventDefault();readingWindow.close();}
});
const titlebar=readingWindow.querySelector('.reader-bar');
let readerDrag=null;
titlebar.addEventListener('pointerdown',event=>{
  if(innerWidth<=760||event.button!==0||event.target.closest('button,a,input,select'))return;
  const box=readingWindow.getBoundingClientRect();readerDrag={x:event.clientX-box.left,y:event.clientY-box.top};titlebar.setPointerCapture(event.pointerId);
});
titlebar.addEventListener('pointermove',event=>{
  if(!readerDrag||!titlebar.hasPointerCapture(event.pointerId))return;
  readingWindow.style.left=Math.max(0,Math.min(event.clientX-readerDrag.x,innerWidth-readingWindow.offsetWidth))+'px';
  readingWindow.style.top=Math.max(34,Math.min(event.clientY-readerDrag.y,innerHeight-130))+'px';
});
titlebar.addEventListener('lostpointercapture',()=>readerDrag=null);
const readerBreakpoint=matchMedia('(max-width:760px)');
readerBreakpoint.addEventListener('change',()=>{
  readingWindow.style.left='';readingWindow.style.top='';
  if(!readingWindow.open)return;
  HTMLDialogElement.prototype.close.call(readingWindow);
  if(readerBreakpoint.matches)readingWindow.showModal();else readingWindow.show();
  raiseWindow(readingWindow);
});
raiseWindow(document.getElementById('native-finder'));
