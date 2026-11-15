// The phone desktop keeps apps discoverable without shrinking desktop windows.
const appTile=(label,src,attrs)=>`<button class="spring-app" ${attrs}><img src="${src}" alt=""><span>${label}</span></button>`;
const socialApps=[{name:'Twitter / X',id:'twitter',url:'https://twitter.com/geoqiao'},{name:'抖音',id:'douyin',url:'https://www.douyin.com/user/MS4wLjABAAAAdyqgUdRPLiCRML4eqTzRw1yAD0tC4TMzZtzHAA8CRjAA4AQkhP_sLLiiGADSWdZa'},{name:'视频号',id:'weixin',url:'/channels/'},{name:'GitHub',id:'github',url:'https://github.com/geoqiao'}];
const followLinks=[...socialApps,{name:'RSS 订阅',id:'rss',url:'/atom.xml'}];
const socialIcon=p=>`/desktop/assets/apps/${p.id}.${['weixin','rss'].includes(p.id)?'svg':'jpg'}`;
const socialMarkup=()=>socialApps.map(p=>`<a class="spring-app social-app" href="${p.url}" ${p.id==='weixin'?'':'target="_blank" rel="noopener"'}><img class="social-artwork social-${p.id}" src="${socialIcon(p)}" alt=""><span>${p.name}</span></a>`).join('');
const desktop=document.querySelector('.mac-native');
document.querySelector('.mobile-welcome')?.remove();
const featured=BLOG.posts.filter(p=>p.featured).sort((a,b)=>BLOG.featured.indexOf(a.issueNumber)-BLOG.featured.indexOf(b.issueNumber)).slice(0,2);
desktop.insertAdjacentHTML('afterbegin',`<section class="springboard" aria-label="Geo 的桌面"><header class="spring-profile"><img src="/desktop/assets/avatar.png" alt="Geo Qiao"><div><p>WELCOME TO MY DESKTOP</p><h1>Geo Qiao<span>的小世界</span></h1></div><a href="/about/" aria-label="关于 Geo">↗</a></header><section class="spring-widget"><header><img src="/desktop/assets/apps/obsidian.png" alt=""><span>精选笔记</span><a href="/blog/">全部文章 ›</a></header>${featured.map(p=>`<a class="spring-note" href="${p.url}"><span>${esc(p.title)}</span><time>${p.date}</time></a>`).join('')}</section><nav class="spring-grid" aria-label="应用">${appTile('访达','/desktop/assets/macos/finder.png','data-native-app="writing"')}${appTile('项目','/desktop/assets/macos/safari.png','data-native-app="projects"')}${appTile('Obsidian','/desktop/assets/apps/obsidian.png','data-extra-app="obsidian"')}${appTile('MyGo Music','/desktop/assets/apps/mygo.png','data-extra-app="mygo"')}${appTile('Paseo','/desktop/assets/apps/paseo.png','data-extra-app="paseo"')}${appTile('Magpie','/desktop/assets/apps/magpie.png','data-extra-app="magpie"')}${appTile('Pi','/desktop/assets/apps/pi.svg','data-extra-app="pi"')}${appTile('设置','/desktop/assets/macos/settings.png','data-native-app="preferences"')}</nav><p class="spring-caption">写一点代码，做一点东西，记录一路上的生活。</p></section><nav class="social-dock" aria-label="关注 Geo">${socialMarkup()}</nav><button class="phone-home" aria-label="返回桌面">‹ 桌面</button>`);
function showPhoneHome(){document.body.classList.remove('phone-app-open');document.querySelectorAll('.mac-native .window').forEach(w=>w.classList.add('mobile-inactive'));document.querySelector('.springboard')?.removeAttribute('inert');document.querySelector('.phone-home')?.blur();}
const nativeOpen=openNative;
openNative=function(name){nativeOpen(name);if(innerWidth<=760){document.body.classList.add('phone-app-open');document.querySelector('.springboard')?.setAttribute('inert','');}};
document.querySelector('.phone-home').addEventListener('click',showPhoneHome);
document.addEventListener('click',e=>{if(innerWidth<=760&&e.target.closest('[data-window-close],[data-window-min]'))showPhoneHome();});
if(innerWidth<=760)showPhoneHome();
matchMedia('(max-width:760px)').addEventListener('change',event=>{if(event.matches)showPhoneHome();else{document.body.classList.remove('phone-app-open');document.querySelector('.springboard')?.removeAttribute('inert');document.querySelectorAll('.mobile-inactive').forEach(w=>w.classList.remove('mobile-inactive'));}});

// Desktop aliases share the same grid as folders; phones retain the compact Dock.
document.querySelector('.native-desktop').insertAdjacentHTML('beforeend',socialMarkup());
for(const name of ['terminal','note']){document.getElementById('native-'+name).hidden=true;document.querySelector(`[data-native-app="${name}"]`)?.classList.remove('running');}
finderNames.social='关注我';
const baseFinderSidebar=nativeSidebar;
nativeSidebar=()=>baseFinderSidebar().replace(/<a class="sidebar-link" href="https:\/\/github.com\/geoqiao"[^>]*>.*?<\/a>/,'').replace('</aside>',`<p class="sidebar-label">我的账号</p><button data-section="social" class="${section==='social'?'active':''}">${icon('person')}关注我</button>${followLinks.map(p=>`<a class="sidebar-link social-sidebar" href="${p.url}" ${p.id==='weixin'?'':'target="_blank" rel="noopener"'}><img src="${socialIcon(p)}" alt="">${p.name}</a>`).join('')}</aside>`);
const baseFinderContent=nativeFinderContent;
nativeFinderContent=()=>section==='social'?`${nativeSidebar()}<section class="finder-social-list" aria-label="社交账号">${followLinks.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).map(p=>`<a class="finder-social-item" href="${p.url}" ${p.id==='weixin'?'':'target="_blank" rel="noopener"'}><img class="social-artwork social-${p.id}" src="${socialIcon(p)}" alt=""><span>${p.name}</span><small>${p.id==='rss'?'通过阅读器订阅新文章':p.id==='douyin'||p.id==='weixin'?'Geo还没学':'geoqiao'} ↗</small></a>`).join('')}</section>`:baseFinderContent();
const finderTabs=[['featured','Featured'],['all','全部文章'],['projects','Projects'],['social','关注我']];
document.querySelector('.native-finder-toolbar').insertAdjacentHTML('afterend',`<div class="finder-tabs" role="tablist" aria-label="访达标签页">${finderTabs.map(([id,label])=>`<button role="tab" id="finder-tab-${id}" data-section="${id}" aria-selected="${section===id}" tabindex="${section===id?0:-1}">${label}</button>`).join('')}</div>`);
const baseUpdateFinder=updateFinder;
updateFinder=()=>{baseUpdateFinder();const body=document.querySelector('.finder-body');body.setAttribute('role','tabpanel');body.setAttribute('aria-label',finderNames[section]);document.querySelector('.native-finder').classList.toggle('social-view',section==='social');document.querySelectorAll('.finder-tabs [role=tab]').forEach(tab=>{const active=tab.dataset.section===section;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});if(section==='social')document.querySelector('.finder footer>span:last-child').textContent=followLinks.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).length+' 个关注方式';};
document.querySelector('.finder-tabs').addEventListener('keydown',event=>{const tabs=[...event.currentTarget.querySelectorAll('[role=tab]')];let index=tabs.indexOf(document.activeElement);if(index<0)return;if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();navigateFinder(tabs[index].dataset.section);tabs[index].focus();tabs[index].scrollIntoView({block:'nearest',inline:'nearest'});});
updateFinder();

// Attempt audible playback on arrival; recover from the browser's gesture gate.
const musicQuick=document.createElement('button');
musicQuick.className='music-quick-toggle';
musicQuick.setAttribute('aria-label','播放背景音乐');
musicQuick.title=MUSIC_TRACK.title;
musicQuick.textContent='♫ 播放音乐';
document.querySelector('.system-menu-right').prepend(musicQuick);
let waitingForMusicGesture=true;
function syncBackgroundMusic(){musicQuick.textContent=music.paused?'♫ 播放音乐':'Ⅱ 音乐';musicQuick.setAttribute('aria-label',music.paused?'播放背景音乐':'暂停背景音乐');musicQuick.setAttribute('aria-pressed',String(!music.paused));}
function stopMusicGestureWatch(){waitingForMusicGesture=false;window.removeEventListener('click',resumeBackgroundMusic,true);window.removeEventListener('keydown',resumeBackgroundMusic,true);}
function resumeBackgroundMusic(event){if(!waitingForMusicGesture||event?.target.closest('.music-quick-toggle,#music-play'))return;if(event?.type==='keydown'&&(event.ctrlKey||event.metaKey||event.altKey||!['Enter',' '].includes(event.key)))return;music.play().then(stopMusicGestureWatch).catch(()=>{syncBackgroundMusic();});}
musicQuick.addEventListener('click',()=>{stopMusicGestureWatch();if(music.paused)startRequestedMusic();else music.pause();});
music.addEventListener('playing',()=>{stopMusicGestureWatch();syncBackgroundMusic();});
music.addEventListener('pause',syncBackgroundMusic);
music.addEventListener('ended',syncBackgroundMusic);
window.addEventListener('click',resumeBackgroundMusic,true);
window.addEventListener('keydown',resumeBackgroundMusic,true);
music.autoplay=true;
music.preload='auto';
resumeBackgroundMusic();

// Keep the Dock focused on browsing, reading, favourite apps and settings.
const mainDock=document.querySelector('.native-dock');
const dockGroups=[
  [['native','writing','访达'],['extra','obsidian','文章'],['extra','mygo','音乐']],
  [['extra','paseo','Paseo'],['extra','magpie','Magpie'],['extra','pi','Pi']],
  [['native','preferences','设置']]
];
const dockItems=dockGroups.map(group=>group.map(([kind,id,label])=>{
  const button=mainDock.querySelector(`[data-${kind}-app="${id}"]`);
  button.setAttribute('aria-label',label==='文章'?'Obsidian · 阅读文章':label==='音乐'?'MyGo Music · 音乐':label);
  button.insertAdjacentHTML('beforeend',`<span class="dock-label">${label}</span>`);
  return button;
}));
mainDock.replaceChildren();
dockItems.forEach((items,index)=>{
  if(index){const divider=document.createElement('span');divider.className='dock-separator';divider.setAttribute('aria-hidden','true');mainDock.append(divider);}
  mainDock.append(...items);
});
document.querySelector('#native-finder').addEventListener('click',event=>{
  if(!event.target.matches('.finder-list,.finder-body'))return;
  selected=-1;projectSelected=-1;updateFinder();
});
