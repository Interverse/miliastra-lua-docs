// Each control keeps its own reserved place and crosses the toolbar independently.
(()=>{
  const controls=document.querySelector('#reading-controls'),header=document.querySelector('.topbar');
  const slot=document.querySelector('#toolbar-controls'),dock=document.createElement('div');
  dock.className='reading-controls';slot.append(dock);
  const groups=[controls.querySelector('.search-row'),controls.querySelector('#share-tools')].map(element=>{
    const home=document.createElement('div');home.className='control-home'+(element.id==='share-tools'?' share-tools-home':'');
    element.before(home);home.append(element);return {element,home,docked:false,animation:null};
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  function updateHeader(){
    header.classList.toggle('controls-docked',groups.some(group=>group.docked));
    document.documentElement.style.setProperty('--toolbar-height',header.getBoundingClientRect().height+'px');
    scheduleSidebarHighlight();
    if(languageMenu.matches(':popover-open'))positionLanguageMenu();
  }
  function move(group,next){
    const {element,home}=group,before=element.getBoundingClientRect();
    const focus=document.activeElement,selection=focus===search?[search.selectionStart,search.selectionEnd]:null;
    group.animation?.cancel();
    if(next){home.style.height=home.getBoundingClientRect().height+'px';if(element.matches('.search-row'))dock.prepend(element);else dock.append(element);}
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
