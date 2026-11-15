// Keep browser Back meaningful while the reader is open.
const openDesktopArticle=window.openArticle;
let restoringArticle=false;
window.openArticle=index=>{
  const post=BLOG.posts[index];if(!post)return;
  const wasOpen=readingWindow.open;
  openDesktopArticle(index);
  if(!restoringArticle){const url=new URL(location.href);url.hash=`post=${post.issueNumber}`;history[wasOpen?'replaceState':'pushState'](null,'',url);}
};
function restoreDesktopArticle(){const issue=Number(new URLSearchParams(location.hash.slice(1)).get('post'));const index=BLOG.posts.findIndex(p=>p.issueNumber===issue);restoringArticle=true;if(index>=0)window.openArticle(index);else if(readingWindow.open)readingWindow.close();restoringArticle=false;}
window.addEventListener('popstate',restoreDesktopArticle);
readingWindow.addEventListener('close',()=>{if(location.hash.startsWith('#post=')){const url=new URL(location.href);url.hash='';history.replaceState(null,'',url);}});
document.getElementById('reader-body').addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const url=new URL(link.href);if(url.origin!==location.origin&&url.origin!=='https://geoqiao.me')return;const index=BLOG.posts.findIndex(p=>p.url===url.pathname);if(index>=0){event.preventDefault();window.openArticle(index);if(url.hash)requestAnimationFrame(()=>{const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));target?.scrollIntoView({block:'start'});});}});
restoreDesktopArticle();
