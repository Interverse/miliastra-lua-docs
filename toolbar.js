// Each control keeps its own reserved place and crosses the toolbar independently.
(()=>{
  const controls=document.querySelector('#reading-controls'),header=document.querySelector('.topbar');
  const slot=document.querySelector('#toolbar-controls'),dock=document.createElement('div');
  dock.className='reading-controls';slot.append(dock);
  const shareDock=document.createElement('div');shareDock.className='share-dock-home';dock.append(shareDock);
  const groups=[controls.querySelector('.search-row'),controls.querySelector('#share-tools')].map(element=>{
    const home=document.createElement('div');home.className='control-home'+(element.id==='share-tools'?' share-tools-home':'');
    element.before(home);home.append(element);return {element,home,docked:false,animation:null};
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  function updateHeader(){
    header.classList.toggle('controls-docked',groups.some(group=>group.docked));
    shareDock.hidden=!groups.some(group=>group.element.id==='share-tools'&&group.docked);
    document.documentElement.style.setProperty('--toolbar-height',header.getBoundingClientRect().height+'px');
    scheduleSidebarHighlight();
    if(languageMenu.matches(':popover-open'))positionLanguageMenu();
  }
  function move(group,next){
    const {element,home}=group,before=element.getBoundingClientRect();
    const focus=document.activeElement,selection=focus===search?[search.selectionStart,search.selectionEnd]:null;
    group.animation?.cancel();
    if(next){home.style.height=home.getBoundingClientRect().height+'px';if(element.matches('.search-row'))dock.prepend(element);else shareDock.append(element);}
    else{home.append(element);home.style.height='';}
    group.docked=next;updateHeader();
    if(element.contains(focus)){focus.focus({preventScroll:true});if(selection)search.setSelectionRange(...selection);}
    if(!reduced.matches){
      const after=element.getBoundingClientRect(),distant=next&&before.bottom<0;
      const dx=distant?0:before.left-after.left,dy=distant?-8:before.top-after.top;
      group.animation=element.animate([{transform:'translate('+dx+'px,'+dy+'px)',opacity:.92},{transform:'translate(0,0)',opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    updateHeader();
  }
  function check(){
    frame=0;
    for(const group of groups){
      const boundary=header.getBoundingClientRect().bottom,rect=group.home.getBoundingClientRect();
      const covered=boundary-rect.top;
      if(!group.docked&&covered>=rect.height*.75)move(group,true);
      else if(group.docked&&rect.top>boundary+12)move(group,false);
    }
    updateHeader();
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(check);}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  const observer=new ResizeObserver(schedule);observer.observe(header);groups.forEach(group=>{observer.observe(group.home);observer.observe(group.element);});
  schedule();
})();

// Mobile navigation uses the site's own section picker and touch controls.
(()=>{
  const icon=(body)=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+body+'</svg>';
  const listIcon=icon('<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>');
  const searchIcon=icon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>');
  const topIcon=icon('<path d="M5 4h14M12 20V8m-5 5 5-5 5 5"/>');
  const topLabels={en:'Back to top',zhs:'返回顶部',zht:'回到頂端',ja:'先頭に戻る',ko:'맨 위로',es:'Volver arriba',fr:'Retour en haut',ru:'Наверх',th:'กลับด้านบน',vi:'Về đầu trang',de:'Nach oben',id:'Kembali ke atas',pt:'Voltar ao topo',tr:'Başa dön',it:'Torna in alto'};
  const picker=document.createElement('button');picker.type='button';picker.className='mobile-reference-nav';picker.setAttribute('aria-haspopup','menu');picker.setAttribute('aria-expanded','false');
  document.querySelector('#controls-home').before(picker);
  const menu=document.createElement('div');menu.id='mobile-section-menu';menu.className='mobile-section-menu';menu.setAttribute('popover','auto');menu.setAttribute('role','menu');document.body.append(menu);picker.setAttribute('aria-controls',menu.id);
  const floating=document.createElement('nav');floating.className='mobile-navigation';
  floating.innerHTML='<button type="button" data-mobile-nav="sections">'+listIcon+'</button><button type="button" data-mobile-nav="search">'+searchIcon+'</button><button type="button" data-mobile-nav="top">'+topIcon+'</button>';document.body.append(floating);
  const sectionsButton=floating.querySelector('[data-mobile-nav="sections"]');sectionsButton.setAttribute('aria-haspopup','menu');sectionsButton.setAttribute('aria-controls',menu.id);
  let pending=false,opener=picker;
  function position(){
    const rect=opener.getBoundingClientRect(),width=Math.min(innerWidth-24,Math.max(rect.width,280));
    menu.style.width=width+'px';menu.style.maxHeight=Math.min(480,innerHeight-120)+'px';
    const height=menu.getBoundingClientRect().height;
    menu.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';
    menu.style.top=(rect.bottom+height+8<innerHeight-12?rect.bottom+8:Math.max(12,rect.top-height-8))+'px';
  }
  function open(button){opener=button;if(menu.matches(':popover-open'))menu.hidePopover();else{menu.showPopover();position();menu.querySelector('button')?.focus({preventScroll:true});}}
  function update(){
    pending=false;const scroll=menu.scrollTop,title=MiliLocale.t('Reference');
    picker.innerHTML=listIcon+'<span>'+esc(title)+'</span>'+icon('<path d="m7 10 5 5 5-5"/>');picker.setAttribute('aria-label',title);
    floating.setAttribute('aria-label',title);
    sectionsButton.title=title;sectionsButton.setAttribute('aria-label',title);
    const searchButton=floating.querySelector('[data-mobile-nav="search"]');searchButton.title=MiliLocale.t('Search functions, properties, types, or enums…');searchButton.setAttribute('aria-label',searchButton.title);
    const top=floating.querySelector('[data-mobile-nav="top"]');top.title=topLabels[MiliLocale.code];top.setAttribute('aria-label',top.title);
    menu.replaceChildren();
    for(const link of document.querySelectorAll('.sidebar nav a')){
      const href=link.getAttribute('href');if(link.hidden||!document.getElementById(href.slice(1)))continue;
      const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitem');item.dataset.target=href.slice(1);
      item.textContent=link.querySelector('span')?.textContent||link.textContent.replace(/\s*\d+\s*$/,'');menu.append(item);
    }
    menu.scrollTop=scroll;if(menu.matches(':popover-open'))position();
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  picker.addEventListener('click',()=>open(picker));
  floating.addEventListener('click',event=>{
    const button=event.target.closest('[data-mobile-nav]');if(!button)return;
    if(button.dataset.mobileNav==='sections'){open(button);return;}
    if(menu.matches(':popover-open'))menu.hidePopover();
    if(button.dataset.mobileNav==='top')window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    else{search.scrollIntoView({block:'center'});search.focus({preventScroll:true});}
  });
  menu.addEventListener('click',event=>{const item=event.target.closest('[data-target]');if(!item)return;menu.hidePopover();document.getElementById(item.dataset.target)?.scrollIntoView({block:'start'});});
  menu.addEventListener('keydown',event=>{
    const items=[...menu.querySelectorAll('button')],index=items.indexOf(document.activeElement);let next;
    if(event.key==='ArrowDown')next=(index+1)%items.length;else if(event.key==='ArrowUp')next=(index-1+items.length)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;
    if(next!==undefined){event.preventDefault();items[next]?.focus();}
  });
  menu.addEventListener('toggle',()=>{const expanded=String(menu.matches(':popover-open'));picker.setAttribute('aria-expanded',expanded);sectionsButton.setAttribute('aria-expanded',expanded);});
  window.addEventListener('resize',()=>{if(menu.matches(':popover-open'))position();});
  window.addEventListener('scroll',()=>{if(menu.matches(':popover-open'))menu.hidePopover();},{passive:true});
  const observer=new MutationObserver(schedule);observer.observe(document.querySelector('.sidebar'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','href']});observer.observe(document.querySelector('#function-sections'),{childList:true});update();
})();
