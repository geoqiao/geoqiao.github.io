// Canonical article URLs are shared by direct loads and desktop navigation.
const openDesktopArticle=window.openArticle;
let restoringArticle=false;
const initialRoute=window.DESKTOP_ROUTE;
if(initialRoute.kind==='post')document.getElementById('route-window')?.remove();
let articleReturnUrl=initialRoute.kind==='post'?'/blog/':location.pathname+location.search;
window.openArticle=index=>{
  const post=BLOG.posts[index];if(!post)return;
  if(!readingWindow.open&&!restoringArticle)articleReturnUrl=location.pathname+location.search;
  openDesktopArticle(index);
  document.getElementById('route-window')?.setAttribute('hidden','');
  document.title=post.title+' · Geo Qiao';
  if(!restoringArticle&&location.pathname!==post.url)history.pushState({desktopArticle:true,returnUrl:articleReturnUrl},'',post.url);
};
function restoreDesktopArticle(){
  const legacy=Number(new URLSearchParams(location.hash.slice(1)).get('post'));
  const index=BLOG.posts.findIndex(p=>p.url===location.pathname||legacy&&p.issueNumber===legacy);
  restoringArticle=true;
  if(index>=0){window.openArticle(index);if(legacy)history.replaceState(history.state,'',BLOG.posts[index].url);if(location.hash)requestAnimationFrame(()=>document.querySelector('#reader-body')?.querySelector('#'+CSS.escape(decodeURIComponent(location.hash.slice(1))))?.scrollIntoView({block:'start'}));}
  else{if(readingWindow.open)readingWindow.close();document.getElementById('route-window')?.toggleAttribute('hidden',initialRoute.kind==='post');document.title=initialRoute.title==='Geo Qiao'?'Geo Qiao':initialRoute.title+' · Geo Qiao';}
  restoringArticle=false;
}
window.addEventListener('popstate',()=>{if(location.pathname!==initialRoute.path&&!BLOG.posts.some(p=>p.url===location.pathname)){location.reload();return;}restoreDesktopArticle();});
readingWindow.addEventListener('close',()=>{if(BLOG.posts.some(p=>p.url===location.pathname)){if(history.state?.desktopArticle)history.back();else location.assign(articleReturnUrl);}else if(initialRoute.kind!=='post')document.getElementById('route-window')?.removeAttribute('hidden');});
document.addEventListener('click',event=>{
  const link=event.target.closest('a');if(!link||link.target==='_blank'||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download'))return;
  const url=new URL(link.href);if(url.origin!==location.origin&&url.origin!=='https://geoqiao.me')return;
  const index=BLOG.posts.findIndex(p=>p.url===url.pathname);
  if(index>=0&&!link.closest('#outline-links')){event.preventDefault();window.openArticle(index);if(url.hash){history.replaceState(history.state,'',url.pathname+url.hash);requestAnimationFrame(()=>document.querySelector('#reader-body')?.querySelector('#'+CSS.escape(decodeURIComponent(url.hash.slice(1))))?.scrollIntoView({block:'start'}));}}
});
restoreDesktopArticle();
