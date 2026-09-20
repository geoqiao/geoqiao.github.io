const assetPath=new URL('.',document.currentScript.src).pathname;
const status=document.getElementById('status');
const shots={single:[assetPath+'ask-single.png','pi-ask 原版终端的单选界面'],multi:[assetPath+'ask-multi.png','pi-ask 原版终端的多选界面'],preview:[assetPath+'ask-preview.png','pi-ask 原版终端的方案预览界面']};
const dialog=document.getElementById('demo-video');
document.addEventListener('click',async event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.shot){const [src,alt]=shots[button.dataset.shot];const image=document.getElementById('ask-screenshot');image.src=src;image.alt=alt;document.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',b===button));}
 if(button.dataset.copy){const code=document.getElementById(button.dataset.copy);try{await navigator.clipboard.writeText(code.textContent);button.querySelector('span').textContent='已复制';status.textContent='安装命令已复制。';}catch{const range=document.createRange();range.selectNodeContents(code);getSelection().removeAllRanges();getSelection().addRange(range);status.textContent='已选中命令，请手动复制。';}}
 if(button.hasAttribute('data-open-video')){dialog.showModal();dialog.querySelector('video').load();}
 if(button.hasAttribute('data-close-video'))dialog.close();
 if(button.hasAttribute('data-fullscreen')){try{if(document.fullscreenElement)await document.exitFullscreen();else await button.closest('[data-preview]').requestFullscreen();}catch{status.textContent='浏览器未允许全屏，可使用打开链接。';}}
});
dialog?.addEventListener('close',()=>dialog.querySelector('video').pause());
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
function fit(viewport){if(!viewport.clientWidth||!viewport.clientHeight)return;const width=document.fullscreenElement?viewport.clientWidth:Number(viewport.dataset.sourceWidth);const frame=viewport.querySelector('iframe');const scale=viewport.clientWidth/width;frame.style.width=width+'px';frame.style.height=viewport.clientHeight/scale+'px';frame.style.transform=`scale(${scale})`;}
const observer=new ResizeObserver(entries=>entries.forEach(({target})=>fit(target)));
document.querySelectorAll('.frame-viewport').forEach(viewport=>observer.observe(viewport));
document.addEventListener('fullscreenchange',()=>document.querySelectorAll('[data-fullscreen]').forEach(button=>{const full=document.fullscreenElement===button.closest('[data-preview]');const name=button.closest('[data-preview]').querySelector('iframe').title.replace(' 原版页面预览','');button.textContent=full?'⤡':'⤢';button.setAttribute('aria-label',(full?'收起 ':'放大 ')+name+' 预览');}));
