// Share links are self-contained. Version 1 numeric IDs are append-only.
(()=>{
  const ids=window.MiliShareIds,index=new Map(ids.map((id,i)=>[id,i]));
  const selected=new Set();let selecting=false,shared=[],feedbackTimer,collectionSignature=null;
  const keys=['Copy link','Copy search link','Copy page link','Select examples','Select results','Clear','Done','selected','Shared examples','Close collection','Add to set','Remove from set','Link copied','Could not copy link','Invalid share link'];
  const rows={
    zhs:'复制链接|复制搜索链接|复制页面链接|选择示例|选择搜索结果|清空|完成|已选|共享示例|关闭集合|加入集合|移出集合|链接已复制|无法复制链接|共享链接无效',
    zht:'複製連結|複製搜尋連結|複製頁面連結|選擇範例|選擇搜尋結果|清空|完成|已選|分享範例|關閉集合|加入集合|移出集合|已複製連結|無法複製連結|分享連結無效',
    ja:'リンクをコピー|検索リンクをコピー|ページリンクをコピー|例を選択|検索結果を選択|クリア|完了|選択済み|共有された例|一覧を閉じる|一覧に追加|一覧から削除|リンクをコピーしました|リンクをコピーできません|共有リンクが無効です',
    ko:'링크 복사|검색 링크 복사|페이지 링크 복사|예제 선택|검색 결과 선택|지우기|완료|선택됨|공유 예제|모음 닫기|모음에 추가|모음에서 제거|링크 복사됨|링크를 복사할 수 없음|잘못된 공유 링크',
    es:'Copiar enlace|Copiar enlace de búsqueda|Copiar enlace de página|Seleccionar ejemplos|Seleccionar resultados|Limpiar|Listo|seleccionados|Ejemplos compartidos|Cerrar colección|Añadir al conjunto|Quitar del conjunto|Enlace copiado|No se pudo copiar el enlace|Enlace no válido',
    fr:'Copier le lien|Copier le lien de recherche|Copier le lien de la page|Sélectionner des exemples|Sélectionner les résultats|Effacer|Terminé|sélectionnés|Exemples partagés|Fermer la collection|Ajouter à la sélection|Retirer de la sélection|Lien copié|Impossible de copier le lien|Lien non valide',
    ru:'Копировать ссылку|Ссылка на поиск|Ссылка на страницу|Выбрать примеры|Выбрать результаты|Очистить|Готово|выбрано|Общие примеры|Закрыть подборку|Добавить в подборку|Удалить из подборки|Ссылка скопирована|Не удалось скопировать ссылку|Недействительная ссылка',
    th:'คัดลอกลิงก์|คัดลอกลิงก์ค้นหา|คัดลอกลิงก์หน้า|เลือกตัวอย่าง|เลือกผลการค้นหา|ล้าง|เสร็จสิ้น|เลือกแล้ว|ตัวอย่างที่แชร์|ปิดชุดตัวอย่าง|เพิ่มในชุด|นำออกจากชุด|คัดลอกลิงก์แล้ว|คัดลอกลิงก์ไม่ได้|ลิงก์แชร์ไม่ถูกต้อง',
    vi:'Sao chép liên kết|Sao chép liên kết tìm kiếm|Sao chép liên kết trang|Chọn ví dụ|Chọn kết quả|Xóa|Xong|đã chọn|Ví dụ được chia sẻ|Đóng bộ ví dụ|Thêm vào bộ|Xóa khỏi bộ|Đã sao chép liên kết|Không thể sao chép liên kết|Liên kết không hợp lệ',
    de:'Link kopieren|Suchlink kopieren|Seitenlink kopieren|Beispiele auswählen|Ergebnisse auswählen|Leeren|Fertig|ausgewählt|Geteilte Beispiele|Sammlung schließen|Zur Auswahl hinzufügen|Aus Auswahl entfernen|Link kopiert|Link konnte nicht kopiert werden|Ungültiger Link',
    id:'Salin tautan|Salin tautan pencarian|Salin tautan halaman|Pilih contoh|Pilih hasil|Kosongkan|Selesai|dipilih|Contoh yang dibagikan|Tutup kumpulan|Tambahkan ke kumpulan|Hapus dari kumpulan|Tautan disalin|Tidak dapat menyalin tautan|Tautan tidak valid',
    pt:'Copiar link|Copiar link de pesquisa|Copiar link da página|Selecionar exemplos|Selecionar resultados|Limpar|Concluído|selecionados|Exemplos compartilhados|Fechar coleção|Adicionar ao conjunto|Remover do conjunto|Link copiado|Não foi possível copiar o link|Link inválido',
    tr:'Bağlantıyı kopyala|Arama bağlantısını kopyala|Sayfa bağlantısını kopyala|Örnekleri seç|Sonuçları seç|Temizle|Bitti|seçildi|Paylaşılan örnekler|Koleksiyonu kapat|Koleksiyona ekle|Koleksiyondan çıkar|Bağlantı kopyalandı|Bağlantı kopyalanamadı|Geçersiz bağlantı',
    it:'Copia link|Copia link della ricerca|Copia link della pagina|Seleziona esempi|Seleziona risultati|Cancella|Fine|selezionati|Esempi condivisi|Chiudi raccolta|Aggiungi alla raccolta|Rimuovi dalla raccolta|Link copiato|Impossibile copiare il link|Link non valido'
  };
  const selectionKeys=['Create selection link','Select all shown methods','Copy selection link','Exit selection','Include this section','Exclude this section'];
  const selectionRows={
    zhs:'创建所选内容链接|选择当前显示的全部方法|复制所选内容链接|退出选择|包含此章节|排除此章节',
    zht:'建立所選內容連結|選擇目前顯示的所有方法|複製所選內容連結|結束選擇|包含此章節|排除此章節',
    ja:'選択内容のリンクを作成|表示中のメソッドをすべて選択|選択内容のリンクをコピー|選択を終了|この項目を含める|この項目を除外',
    ko:'선택 항목 링크 만들기|표시된 모든 메서드 선택|선택 항목 링크 복사|선택 종료|이 항목 포함|이 항목 제외',
    es:'Crear enlace de selección|Seleccionar todos los métodos mostrados|Copiar enlace de selección|Salir de la selección|Incluir esta sección|Excluir esta sección',
    fr:'Créer un lien de sélection|Sélectionner toutes les méthodes affichées|Copier le lien de sélection|Quitter la sélection|Inclure cette section|Exclure cette section',
    ru:'Создать ссылку на подборку|Выбрать все показанные методы|Копировать ссылку на подборку|Выйти из выбора|Включить этот раздел|Исключить этот раздел',
    th:'สร้างลิงก์รายการที่เลือก|เลือกเมธอดทั้งหมดที่แสดง|คัดลอกลิงก์รายการที่เลือก|ออกจากการเลือก|รวมส่วนนี้|ไม่รวมส่วนนี้',
    vi:'Tạo liên kết cho mục đã chọn|Chọn tất cả phương thức đang hiển thị|Sao chép liên kết mục đã chọn|Thoát chọn|Bao gồm phần này|Loại trừ phần này',
    de:'Link zur Auswahl erstellen|Alle angezeigten Methoden auswählen|Auswahllink kopieren|Auswahl verlassen|Diesen Abschnitt aufnehmen|Diesen Abschnitt ausschließen',
    id:'Buat tautan pilihan|Pilih semua metode yang ditampilkan|Salin tautan pilihan|Keluar dari pilihan|Sertakan bagian ini|Keluarkan bagian ini',
    pt:'Criar link da seleção|Selecionar todos os métodos exibidos|Copiar link da seleção|Sair da seleção|Incluir esta seção|Excluir esta seção',
    tr:'Seçim bağlantısı oluştur|Gösterilen tüm metotları seç|Seçim bağlantısını kopyala|Seçimden çık|Bu bölümü dahil et|Bu bölümü çıkar',
    it:'Crea link della selezione|Seleziona tutti i metodi mostrati|Copia link della selezione|Esci dalla selezione|Includi questa sezione|Escludi questa sezione'
  };
  const viewRows={zhs:'所选章节|清除选择',zht:'所選章節|清除選擇',ja:'選択した項目|選択をクリア',ko:'선택한 섹션|선택 지우기',es:'Secciones seleccionadas|Borrar selección',fr:'Sections sélectionnées|Effacer la sélection',ru:'Выбранные разделы|Очистить выбор',th:'ส่วนที่เลือก|ล้างการเลือก',vi:'Các phần đã chọn|Xóa lựa chọn',de:'Ausgewählte Abschnitte|Auswahl löschen',id:'Bagian terpilih|Hapus pilihan',pt:'Seções selecionadas|Limpar seleção',tr:'Seçilen bölümler|Seçimi temizle',it:'Sezioni selezionate|Cancella selezione'};
  const label=key=>viewRows[MiliLocale.code]?.split('|')[['Selected sections','Clear selection'].indexOf(key)]||selectionRows[MiliLocale.code]?.split('|')[selectionKeys.indexOf(key)]||rows[MiliLocale.code]?.split('|')[keys.indexOf(key)]||key;
  const sectionIds=new Map();
  for(const fn of API.functions){const id=fn.owner+'-'+fn.name;sectionIds.set('example-'+id,id);for(const param of fn.params)sectionIds.set('callback-guide-'+id+'-'+param.name,id);}
  const sectionId=id=>sectionIds.get(id)||id;
  const scopedSearch={en:'Search selected sections…',zhs:'搜索所选章节…',zht:'搜尋所選章節…',ja:'選択した項目を検索…',ko:'선택한 섹션 검색…',es:'Buscar en las secciones seleccionadas…',fr:'Rechercher dans les sections sélectionnées…',ru:'Поиск в выбранных разделах…',th:'ค้นหาในส่วนที่เลือก…',vi:'Tìm trong các phần đã chọn…',de:'Ausgewählte Abschnitte durchsuchen…',id:'Cari di bagian terpilih…',pt:'Pesquisar nas seções selecionadas…',tr:'Seçilen bölümlerde ara…',it:'Cerca nelle sezioni selezionate…'};
  const linkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></svg>';
  const shareIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
  const tools=document.querySelector('#share-tools');
  const searchShare=document.createElement('button');searchShare.type='button';searchShare.className='share-button search-share';searchShare.dataset.shareAction='copy-search';
  searchShare.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></svg>';
  search.closest('.search-box').querySelector('kbd').before(searchShare);
  const collection=document.createElement('div');collection.id='shared-references';sections.before(collection);
  const popupActions=document.createElement('div');popupActions.className='reference-share-actions';
  referenceDialog.querySelector('.reference-close').before(popupActions);
  const feedback=document.createElement('div');feedback.className='share-feedback copy-toast';feedback.setAttribute('popover','manual');feedback.setAttribute('role','status');document.body.append(feedback);
  const bytesToText=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  function encodeSet(references){
    const numbers=[...new Set(references.map(id=>index.get(id)).filter(n=>n!==undefined))].sort((a,b)=>a-b);
    if(!numbers.length)return '';
    const bitmap=new Uint8Array((numbers.at(-1)>>3)+1),deltas=[];let previous=-1;
    for(const n of numbers){bitmap[n>>3]|=1<<(n&7);let delta=n-previous;previous=n;while(delta>127){deltas.push((delta&127)|128);delta>>>=7;}deltas.push(delta);}
    const dense='1b.'+bytesToText(bitmap),sparse='1d.'+bytesToText(deltas);return dense.length<sparse.length?dense:sparse;
  }
  function decodeSet(value){
    if(!/^1[bd]\.[A-Za-z0-9_-]+$/.test(value)||value.length>4096)throw Error('Invalid collection');
    const raw=atob(value.slice(3).replace(/-/g,'+').replace(/_/g,'/')),numbers=[];
    if(value[1]==='b'){
      if(raw.length>Math.ceil(ids.length/8))throw Error('Unknown identifiers');
      for(let i=0;i<raw.length;i++)for(let bit=0;bit<8;bit++)if(raw.charCodeAt(i)&(1<<bit))numbers.push(i*8+bit);
    }else{
      let previous=-1,delta=0,shift=0;
      for(const byte of raw){const n=byte.charCodeAt(0);delta+=(n&127)*2**shift;if(n&128){shift+=7;if(shift>21)throw Error('Invalid number');}else{if(!delta)throw Error('Invalid delta');previous+=delta;numbers.push(previous);delta=0;shift=0;}}
      if(shift)throw Error('Incomplete number');
    }
    if(!numbers.length||numbers.some(n=>n>=ids.length))throw Error('Unknown identifiers');
    return numbers.map(n=>ids[n]);
  }
  function makeLink({references=[],searchText='',selection=false}={}){
    references=[...new Set(references.map(sectionId))];
    const url=new URL(location.href);url.search='';url.hash='';const params=new URLSearchParams();
    if(references.length===1&&!selection)params.set('r',references[0]);else if(references.length)params.set('s',encodeSet(references));
    if(searchText)params.set('q',searchText);
    params.set('lang',MiliLocale.code);url.hash=params.toString();return url.href;
  }
  async function copyLink(text,button){
    let copied=false;
    try{await navigator.clipboard.writeText(text);copied=true;}catch{
      const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;opacity:0';document.body.append(area);area.select();copied=document.execCommand('copy');area.remove();button.focus({preventScroll:true});
    }
    feedback.textContent=label(copied?'Link copied':'Could not copy link');
    if(feedback.matches(':popover-open'))feedback.hidePopover();feedback.classList.remove('visible');feedback.showPopover();
    const anchor=button.getBoundingClientRect(),rect=feedback.getBoundingClientRect();
    Object.assign(feedback.style,{left:Math.max(8,Math.min(innerWidth-rect.width-8,anchor.left))+'px',top:(anchor.top>rect.height+12?anchor.top-rect.height-9:anchor.bottom+9)+'px',bottom:'auto'});
    requestAnimationFrame(()=>feedback.classList.add('visible'));clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{feedback.classList.remove('visible');feedback.hidePopover();},1100);
  }
  function button(action,text,extra=''){return '<button type="button" class="share-button" data-share-action="'+action+'" '+extra+'>'+esc(text)+'</button>';}
  function updatePopup(){
    const isSelected=selected.has(sectionId(referenceActiveId));
    popupActions.innerHTML=selecting?'<button type="button" class="share-button share-icon" data-share-action="popup-select" title="'+esc(label(isSelected?'Exclude this section':'Include this section'))+'" aria-label="'+esc(label(isSelected?'Exclude this section':'Include this section'))+'" aria-pressed="'+isSelected+'">'+(isSelected?'✓':'+')+'</button>':'';
  }
  function renderCollection(){
    const signature=MiliLocale.code+'|'+query+'|'+shared.join(',');if(signature===collectionSignature)return;collectionSignature=signature;
    collection.replaceChildren();if(!shared.length)return;
    const entries=shared.map(id=>{
      const content=referenceContent(id);if(!content)return '';
      if(query.trim()){const text=document.createElement('div');text.innerHTML=content.html;MiliLocale.applyDOM(text);if(!queryMatches(query.trim().toLowerCase(),id,content.title,text.textContent))return '';}
      const fn=API.functions.find(entry=>id===entry.owner+'-'+entry.name);
      if(fn)return card(fn).replace('id="'+id+'"','id="shared-ref-'+id+'" data-share-section="'+id+'"');
      return '<article class="function-card" id="shared-ref-'+esc(id)+'" data-share-section="'+esc(id)+'"><div class="function-head"><code><a class="method-name" data-api-reference href="#'+esc(id)+'">'+esc(content.title)+'</a></code></div><div class="shared-content">'+content.html+'</div></article>';
    }).filter(Boolean);
    collection.innerHTML='<section class="api-section"><div class="section-heading"><div class="share-heading"><h2>'+esc(label('Selected sections'))+'</h2><span>'+entries.length+(entries.length!==shared.length?' / '+shared.length:'')+'</span></div><div class="share-selection">'+button('collection-close',label('Clear selection'))+'</div></div><div class="function-list">'+(entries.join('')||'<p>'+esc(MiliLocale.t('No API entries found.'))+'</p>')+'</div></section>';
    for(const element of collection.querySelectorAll('.shared-content [id]')){if(element.id.startsWith('ease-'))element.dataset.easeId=element.id;element.removeAttribute('id');}
    collection.querySelectorAll('.shared-content').forEach(root=>updateEasing(root));MiliLocale.applyDOM(collection);
  }
  function renderControls(){
    document.body.classList.toggle('selection-editing',selecting);
    search.placeholder=shared.length?scopedSearch[MiliLocale.code]:MiliLocale.t('Search functions, properties, types, or enums…');
    searchShare.hidden=!query.trim();searchShare.title=label('Copy search link');searchShare.setAttribute('aria-label',label('Copy search link'));
    tools.classList.toggle('selection-active',selecting);
    tools.innerHTML=selecting?'<div class="share-options"><span class="share-count" aria-live="polite">'+selected.size+' '+esc(label('selected'))+'</span>'+button('select-results',label('Select all shown methods'))+button('clear',label('Clear'))+'<button type="button" class="share-button" data-share-action="select-mode" title="'+esc(label('Exit selection'))+'" aria-label="'+esc(label('Exit selection'))+'">×</button></div>'+button('copy-set',label('Copy selection link'),selected.size?'':'disabled'):(shared.length?button('copy-view',label('Copy selection link')):' ')+button('select-mode',label('Create selection link'),'aria-pressed="false"');
    const roots=shared.length?[collection]:[sections,dataSections];
    for(const root of roots)for(const card of root.querySelectorAll('article.function-card[id],article.property-card[id],article.enum-card[id]')){
      const ref=card.dataset.shareSection||card.id;if(!index.has(ref))continue;
      const actions=card.querySelector(':scope > .function-head .function-actions');
      if(actions){
        let link=actions.querySelector('[data-share-action="section-copy"]');
        if(!link){link=document.createElement('button');link.type='button';link.className='copy-button';link.dataset.shareAction='section-copy';link.dataset.sectionReference=ref;link.innerHTML=shareIcon;actions.prepend(link);}
        link.title=label('Copy link');link.setAttribute('aria-label',label('Copy link'));
      }
      const checked=selected.has(ref);card.classList.add('section-selectable');card.classList.toggle('section-selected',checked);
      let control=card.querySelector(':scope > .section-select-control');
      if(!control){control=document.createElement('button');control.type='button';control.className='share-button section-select-control';control.dataset.shareReference=ref;control.setAttribute('role','checkbox');card.prepend(control);}
      control.setAttribute('aria-checked',String(checked));control.setAttribute('aria-label',label(checked?'Exclude this section':'Include this section')+': '+ref);control.title=label(checked?'Exclude this section':'Include this section');
      control.innerHTML='<span class="selection-checkbox" aria-hidden="true">'+(checked?'✓':'')+'</span>';
    }
    updatePopup();
  }
  function updateFilteredView(){
    const filtered=shared.length>0;sections.hidden=filtered;dataSections.hidden=filtered;empty.hidden=filtered;document.body.classList.toggle('selection-filtered',filtered);
    const displayed=[...collection.querySelectorAll('article[id^="shared-ref-"]')].map(card=>card.id.slice(11));
    for(const link of document.querySelectorAll('.sidebar nav a')){
      link.dataset.originalHref??=link.getAttribute('href');link.dataset.originalCount??=link.querySelector('b').textContent;
      const hash=link.dataset.originalHref.slice(1);
      const targets=hash.startsWith('category-')?displayed.filter(id=>API.functions.some(fn=>id===fn.owner+'-'+fn.name&&fn.owner===hash.slice(9))):hash==='properties'?displayed.filter(id=>/^(type|property)-/.test(id)):hash==='enums'?displayed.filter(id=>id.startsWith('enum-')):[];
      link.hidden=filtered&&!targets.length;link.setAttribute('href',filtered&&targets.length?'#shared-ref-'+targets[0]:link.dataset.originalHref);link.querySelector('b').textContent=filtered?targets.length:link.dataset.originalCount;
    }
    for(const nav of document.querySelectorAll('.sidebar nav')){nav.hidden=filtered&&![...nav.querySelectorAll('a')].some(link=>!link.hidden);nav.previousElementSibling.hidden=nav.hidden;}
  }
  function renderShare(){renderCollection();updateFilteredView();renderControls();}
  document.addEventListener('click',event=>{
    const control=event.target.closest('[data-share-action],[data-share-reference]');
    const toggle=id=>{if(selected.has(id))selected.delete(id);else if(index.has(id))selected.add(id);};
    if(!control){
      const header=event.target.closest('.function-head,.property-title,.enum-heading'),card=header?.parentElement;
      if(!selecting||!card?.classList.contains('section-selectable')||event.defaultPrevented)return;
      if(event.target.closest('a,button,input,select,textarea,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="checkbox"]'))return;
      if(!getSelection()?.isCollapsed)return;
      const ref=card.dataset.shareSection||card.id;if(!index.has(ref))return;
      toggle(ref);renderControls();return;
    }
    if(control.dataset.shareReference){if(!selecting)return;toggle(control.dataset.shareReference);renderControls();return;}
    switch(control.dataset.shareAction){
      case 'copy-view':copyLink(makeLink(shared.length?{references:shared,selection:true}:{searchText:query.trim()}),control);break;
      case 'copy-search':copyLink(makeLink({references:shared,selection:shared.length>0,searchText:query.trim()}),control);break;
      case 'section-copy':copyLink(makeLink({references:[control.dataset.sectionReference]}),control);break;
      case 'popup-copy':copyLink(makeLink({references:[referenceActiveId]}),control);break;
      case 'popup-select':toggle(sectionId(referenceActiveId));selecting=true;renderControls();break;
      case 'select-mode':selecting=!selecting;renderControls();break;
      case 'select-results':(shared.length?collection:sections).querySelectorAll('.function-card[id]').forEach(card=>selected.add(card.dataset.shareSection||card.id));renderControls();break;
      case 'clear':selected.clear();renderControls();break;
      case 'copy-set':copyLink(makeLink({references:[...selected],selection:true}),control);break;
      case 'collection-copy':copyLink(makeLink({references:shared}),control);break;
      case 'collection-close':{shared=[];selected.clear();selecting=false;query='';search.value='';const url=new URL(location.href);url.search='';url.hash='lang='+MiliLocale.code;history.pushState(null,'',url.href);render();break;}
    }
  });
  function restoreLink(){
    let params=new URLSearchParams(location.hash.slice(1));
    if(!['r','s','q','ref','refs','lang'].some(key=>params.has(key)))params=new URLSearchParams(location.search);
    if(!['r','s','q','ref','refs'].some(key=>params.has(key))){
      if(params.has('lang')&&MiliLocale.codes.includes(params.get('lang'))){shared=[];query='';search.value='';revealedReferences.clear();if(isReferenceOpen())hideReferencePanel();MiliLocale.apply(params.get('lang'),false);}
      return;
    }
    try{
      if(params.get('q')?.length>2000)throw Error('Search too long');
      const reference=params.get('r')||params.get('ref');
      const references=params.has('s')?decodeSet(params.get('s')):params.has('refs')?params.get('refs').split(','):reference?[reference]:[];
      if(references.length>ids.length||references.some(id=>!index.has(id)||!referenceContent(id)))throw Error('Unknown reference');
      shared=[...new Set(references.map(sectionId))];selected.clear();shared.forEach(id=>selected.add(id));
      query=params.get('q')||'';search.value=query;revealedReferences.clear();
      if(MiliLocale.codes.includes(params.get('lang')))MiliLocale.apply(params.get('lang'),false);else render();
      if(!history.state?.mililuaReference&&isReferenceOpen())hideReferencePanel();
      if(shared.length)collection.scrollIntoView({block:'start'});
    }catch{tools.setAttribute('role','status');tools.textContent=label('Invalid share link');}
  }
  window.MiliShare={render:renderShare,updatePopup,makeLink,encodeSet,decodeSet,rememberState:()=>rememberContentState(collection),restoreState:state=>{restoreContentState(collection,state);collection.querySelectorAll('.shared-content').forEach(root=>updateEasing(root));}};
  window.addEventListener('hashchange',restoreLink);
  renderShare();restoreLink();
})();
