// Finder and the reader share canonical URLs without replacing the desktop.
const openDesktopArticle=window.openArticle;
const initialRoute=window.DESKTOP_ROUTE;
const isArchive=path=>/^\/blog\/(?:page\/\d+\/)?$/.test(path);
const shellRoute=path=>path==='/'||isArchive(path);
const routeWindow=document.getElementById('route-window');
if(initialRoute.kind==='post'||isArchive(initialRoute.path))routeWindow?.remove();
let articleRequest=0;
const articleLoads=new Map();
const initialPost=BLOG.posts.find(post=>post.url===initialRoute.path);
const initialBody=routeWindow?.querySelector(".post-content");
if(initialPost&&initialBody){
  initialPost.html=initialBody.innerHTML;
  initialPost.markdown=JSON.parse(document.getElementById("article-source").textContent);
}
function loadArticle(post){
  if(post.html!==undefined)return Promise.resolve();
  if(!articleLoads.has(post.url)){
    articleLoads.set(post.url,fetch(post.url).then(async response=>{
      if(!response.ok)throw new Error("Article request failed");
      const document=new DOMParser().parseFromString(await response.text(),"text/html");
      const body=document.querySelector(".post-content"),source=document.getElementById("article-source");
      if(!body||!source)throw new Error("Article content missing");
      post.markdown=JSON.parse(source.textContent);
      post.html=body.innerHTML;
    }).finally(()=>articleLoads.delete(post.url)));
  }
  return articleLoads.get(post.url);
}
let articleReturnUrl=initialRoute.kind==='post'?'/blog/':location.pathname+location.search;
let closingReader=false;
window.readerMinimized=false;
const nativeReaderClose=readingWindow.close.bind(readingWindow);
function readerMotion(enter){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const frames=[{opacity:0,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'none'}];
  return readingWindow.animate(enter?frames:frames.toReversed(),{duration:enter?180:120,easing:'ease-out'}).finished.catch(()=>{});
}
readingWindow.close=async value=>{
  if(closingReader||!readingWindow.open)return;
  articleRequest++;
  closingReader=true;
  await readerMotion(false);
  nativeReaderClose(value);
  closingReader=false;
};
readingWindow.addEventListener('cancel',event=>{if(event.defaultPrevented)return;event.preventDefault();readingWindow.close();});
function showArchive(reset=false){
  articleRequest++;
  routeWindow?.setAttribute('hidden','');
  openNative('finder');
  if(reset||section!=='all'){section='all';query='';updateFinder();}
  document.title='All Articles · Geo Qiao';
}
window.openArticle=async (index,{restore=false}={})=>{
  const post=BLOG.posts[index];if(!post)return false;
  const request=++articleRequest;
  try{await loadArticle(post);}catch{
    if(request===articleRequest)location.assign(post.url);
    return false;
  }
  if(request!==articleRequest)return false;
  const entering=!readingWindow.open&&!window.readerMinimized;
  window.readerMinimized=false;
  if(entering&&!restore)articleReturnUrl=location.pathname+location.search;
  openDesktopArticle(index);
  routeWindow?.setAttribute('hidden','');
  document.title=post.title+' · Geo Qiao';
  if(entering)readerMotion(true);
  if(!restore&&location.pathname!==post.url){
    // Switching reader tabs remains one visit, so Back returns to the list.
    history[entering?'pushState':'replaceState']({desktopArticle:true,returnUrl:articleReturnUrl},'',post.url);
  }
  return true;
};
function scrollToArticleHash(hash){
  if(!hash)return;
  requestAnimationFrame(()=>document.querySelector('#reader-body')?.querySelector('#'+CSS.escape(decodeURIComponent(hash.slice(1))))?.scrollIntoView({block:'start'}));
}
async function restoreDesktopRoute(){
  const legacy=Number(new URLSearchParams(location.hash.slice(1)).get('post'));
  const index=BLOG.posts.findIndex(p=>p.url===location.pathname||legacy&&p.issueNumber===legacy);
  if(index>=0){
    if(!await window.openArticle(index,{restore:true}))return;
    if(legacy)history.replaceState(history.state,'',BLOG.posts[index].url);
    else scrollToArticleHash(location.hash);
  }else{
    articleRequest++;
    window.readerMinimized=false;
    if(readingWindow.open)readingWindow.close();
    if(isArchive(location.pathname))showArchive();
    else if(location.pathname==='/'){
      routeWindow?.setAttribute('hidden','');
      document.title='Geo’s Blog';
    }else{
      routeWindow?.removeAttribute('hidden');
      document.title=initialRoute.title+' · Geo Qiao';
    }
  }
}
window.addEventListener('popstate',()=>{
  if(location.pathname!==initialRoute.path&&!shellRoute(location.pathname)&&!BLOG.posts.some(p=>p.url===location.pathname)){location.reload();return;}
  restoreDesktopRoute();
});
readingWindow.addEventListener('close',()=>{
  if(readingWindow.open||window.readerMinimized)return;
  if(BLOG.posts.some(p=>p.url===location.pathname)){
    if(history.state?.desktopArticle)history.back();
    else{history.replaceState(null,'',articleReturnUrl);showArchive(true);}
  }else if(!shellRoute(location.pathname))routeWindow?.removeAttribute('hidden');
});
document.addEventListener('click',async event=>{
  const link=event.target.closest('a');
  if(!link||link.target==='_blank'||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download'))return;
  const url=new URL(link.href);if(url.origin!==location.origin&&url.origin!=='https://geoqiao.me')return;
  const index=BLOG.posts.findIndex(p=>p.url===url.pathname);
  if(index>=0&&!link.closest('#outline-links')){
    event.preventDefault();
    if(!await window.openArticle(index))return;
    if(url.hash){history.replaceState(history.state,'',url.pathname+url.hash);scrollToArticleHash(url.hash);}
  }else if(url.pathname==='/blog/'&&!readingWindow.open){
    event.preventDefault();
    if(location.pathname!==url.pathname)history.pushState(null,'',url.pathname);
    showArchive(true);
  }
});
if(isArchive(initialRoute.path)){
  showArchive(true);
  const row=BLOG.posts.findIndex(p=>p.issueNumber===initialRoute.archiveStart);
  if(row>=0){document.querySelector(`[data-select="${row}"]`)?.scrollIntoView({block:'nearest'});}
}
restoreDesktopRoute();
