// A file-search palette: results stay navigable while the preview changes.
const searchPalette=document.createElement('dialog');
searchPalette.id='search-palette';searchPalette.setAttribute('aria-label','Search Geo’s Blog');searchPalette.setAttribute('closedby','any');
searchPalette.innerHTML=`<header class="palette-header"><button data-palette-close aria-label="Close search">‹</button><input id="palette-query" type="text" inputmode="search" enterkeyhint="go" placeholder="Search articles and projects…" aria-label="Search articles and projects" role="combobox" aria-controls="palette-results" aria-expanded="true" aria-autocomplete="list" autocomplete="off" autofocus><select id="palette-type" aria-label="Result type"><option value="all">All Types</option><option value="Article">Articles</option><option value="Project">Projects</option><option value="App">Apps</option></select></header><div class="palette-body"><section class="palette-list"><p id="palette-heading">Recent</p><div id="palette-results" role="listbox" aria-label="Search results"></div><p id="palette-empty" hidden>No results found. Try another title or topic.</p></section><aside id="palette-preview" aria-label="Selected result preview"></aside></div><footer class="palette-footer"><span id="palette-count" role="status"></span><button id="palette-preview-toggle" aria-expanded="false">Preview</button><button id="palette-open">Open <kbd>↵</kbd></button><button data-palette-close>Close <kbd>esc</kbd></button></footer>`;
document.body.append(searchPalette);
const paletteQuery=document.getElementById('palette-query'),paletteType=document.getElementById('palette-type'),paletteResults=document.getElementById('palette-results');
const paletteEntries=[
 ...BLOG.posts.map((p,index)=>({title:p.title,type:'Article',detail:p.description,date:p.date,tags:p.tags.join(', '),url:p.url,image:'/desktop/assets/macos/document.png',open:()=>window.openArticle(index)})),
 ...BLOG.projects.map(p=>({title:p.title,type:'Project',detail:p.summary,url:p.url,image:p.image,open:()=>location.assign(p.url)})),
 ...[...document.querySelectorAll('.native-dock>button')].map(b=>({title:b.getAttribute('aria-label'),type:'App',detail:'Open '+b.getAttribute('aria-label'),image:b.querySelector('img').src,open:()=>b.click()}))
];
let paletteMatches=[],paletteSelected=0;
function palettePreview(){
 const item=paletteMatches[paletteSelected];
 document.getElementById('palette-open').disabled=!item;
 document.getElementById('palette-preview-toggle').disabled=!item;
 if(!item){document.getElementById('palette-preview').replaceChildren();paletteQuery.removeAttribute('aria-activedescendant');return;}
 [...paletteResults.children].forEach((row,index)=>row.setAttribute('aria-selected',String(index===paletteSelected)));
 paletteQuery.setAttribute('aria-activedescendant','palette-result-'+paletteSelected);
 document.getElementById('palette-preview').innerHTML=`<div class="palette-art">${item.type==='Article'?`<div class="palette-paper"><small>GEO’S BLOG</small><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div>`:`<img src="${esc(item.image)}" alt="">`}</div><h3>Information</h3><dl><div><dt>Name</dt><dd>${esc(item.title)}</dd></div><div><dt>Type</dt><dd>${item.type}</dd></div>${item.date?`<div><dt>Published</dt><dd>${item.date}</dd></div>`:''}${item.tags?`<div><dt>Tags</dt><dd>${esc(item.tags)}</dd></div>`:''}</dl><p class="palette-description">${esc(item.detail)}</p>`;
}
function drawPalette(){
 const terms=paletteQuery.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 paletteMatches=paletteEntries.filter(p=>(paletteType.value==='all'||paletteType.value===p.type)&&terms.every(t=>(p.title+' '+p.detail+' '+(p.tags||'')).toLocaleLowerCase().includes(t)));
 if(!terms.length&&paletteType.value==='all')paletteMatches=paletteMatches.slice(0,10);
 paletteSelected=0;
 paletteResults.innerHTML=paletteMatches.map((p,i)=>`<div id="palette-result-${i}" role="option" aria-selected="${i===0}" data-palette-result="${i}"><img src="${esc(p.image)}" alt=""><span>${esc(p.title)}</span><small>${p.type}</small></div>`).join('');
 document.getElementById('palette-heading').textContent=terms.length?'Results':'Recent';
 document.getElementById('palette-count').textContent=paletteMatches.length+' results';
 document.getElementById('palette-empty').hidden=paletteMatches.length>0;
 palettePreview();
}
function openPalette(){
 if(searchPalette.open)return;
 paletteQuery.value='';paletteType.value='all';searchPalette.classList.remove('show-preview');document.getElementById('palette-preview-toggle').setAttribute('aria-expanded','false');drawPalette();searchPalette.showModal();
}
function openPaletteResult(){const item=paletteMatches[paletteSelected];if(!item)return;searchPalette.close();if(item.type==='App'&&item.title!=='Obsidian'&&innerWidth<=760&&readingWindow.open)readingWindow.querySelector('[data-window-min="reader"]').click();item.open();}
paletteQuery.addEventListener('input',drawPalette);paletteType.addEventListener('change',drawPalette);
paletteResults.addEventListener('click',e=>{const row=e.target.closest('[data-palette-result]');if(!row)return;paletteSelected=Number(row.dataset.paletteResult);palettePreview();paletteQuery.focus({preventScroll:true});});
paletteResults.addEventListener('dblclick',openPaletteResult);
searchPalette.addEventListener('keydown',event=>{
 if(event.isComposing||event.target===paletteType)return;
 if(['ArrowDown','ArrowUp'].includes(event.key)&&paletteMatches.length){event.preventDefault();paletteSelected=(paletteSelected+(event.key==='ArrowDown'?1:-1)+paletteMatches.length)%paletteMatches.length;palettePreview();paletteResults.children[paletteSelected].scrollIntoView({block:'nearest'});}
 if(event.key==='Enter'&&event.target===paletteQuery){event.preventDefault();openPaletteResult();}
});
searchPalette.querySelectorAll('[data-palette-close]').forEach(b=>b.onclick=()=>searchPalette.close());
document.getElementById('palette-open').onclick=openPaletteResult;
document.getElementById('palette-preview-toggle').onclick=event=>{const open=searchPalette.classList.toggle('show-preview');event.currentTarget.setAttribute('aria-expanded',String(open));event.currentTarget.textContent=open?'Results':'Preview';};
if(!('closedBy' in HTMLDialogElement.prototype)){
 const outside=e=>{const r=searchPalette.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};let pressedOutside=false;
 searchPalette.addEventListener('pointerdown',e=>pressedOutside=outside(e));searchPalette.addEventListener('pointerup',e=>{if(pressedOutside&&outside(e))searchPalette.close();});
}
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'&&!event.isComposing){event.preventDefault();event.stopImmediatePropagation();if(searchPalette.open)searchPalette.close();else openPalette();}},true);
document.addEventListener('click',event=>{if(event.target.closest('[data-action="search"],[data-open-palette]')){event.preventDefault();event.stopImmediatePropagation();openPalette();}},true);
document.querySelectorAll('[data-action="search"]').forEach(button=>{button.title='Search · ⌘K';button.setAttribute('aria-label','Search · Command K');});
const paletteTrigger=document.createElement('button');paletteTrigger.className='palette-trigger';paletteTrigger.dataset.openPalette='';paletteTrigger.innerHTML='Search <kbd>⌘K</kbd>';paletteTrigger.setAttribute('aria-label','Search articles, projects and apps · Command K');document.querySelector('.spring-profile').append(paletteTrigger);
