/* Shared by the standalone HTML and the Docusaurus search bar. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CPDocumentationSearch = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const normalize = value => String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tokens = query => [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];

  function buildIndex(data, textOf) {
    const index = [];
    const groupNames = Object.fromEntries((data.groups || []).map(g => [g.id, g.title]));
    for (const [pageId, page] of Object.entries(data.pages || {})) {
      const html = page.html || '';
      const headings = [...html.matchAll(/<h[1-6]\b([^>]*)>([\s\S]*?)<\/h[1-6]>/gi)];
      const add = (heading, anchor, body) => {
        const text = textOf(body).replace(/\s+/g, ' ').trim();
        index.push({pageId, pageTitle:page.title, heading, anchor, text, group:groupNames[page.group] || '',
          searchTitle:normalize(page.title), searchHeading:normalize(heading), searchText:normalize(text)});
      };
      add('', '', html.slice(0, headings[0]?.index ?? html.length));
      headings.forEach((h, i) => {
        const attr = h[1].match(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
        const anchor = attr ? textOf(attr[1] || attr[2]) : '';
        add(textOf(h[2]), anchor, html.slice(h.index + h[0].length, headings[i+1]?.index ?? html.length));
      });
    }
    return index;
  }

  function find(index, query) {
    const terms = tokens(query);
    if (!terms.length) return [];
    const phrase = normalize(query.trim());
    return index.map((entry, order) => {
      const combined = entry.searchTitle + ' ' + entry.searchHeading + ' ' + entry.searchText;
      if (!terms.every(term => combined.includes(term))) return null;
      let score = entry.searchTitle === phrase ? 150 : 0;
      score += entry.searchHeading === phrase ? 130 : 0;
      for (const term of terms) score += (entry.searchTitle.includes(term) ? 25 : 0) + (entry.searchHeading.includes(term) ? 40 : 0) + (entry.searchText.includes(term) ? 8 : 0);
      // A page-title-only match is represented once instead of at every heading.
      if (entry.heading && terms.every(term => entry.searchTitle.includes(term)) && !terms.some(term => entry.searchHeading.includes(term) || entry.searchText.includes(term))) return null;
      return {...entry, score, order};
    }).filter(Boolean).sort((a,b) => b.score - a.score || a.order - b.order);
  }

  function highlight(text, query) {
    const folded = normalize(text), terms = tokens(query), ranges = [];
    for (const term of terms) {
      let at = folded.indexOf(term);
      while (at >= 0) { ranges.push([at, at + term.length]); at = folded.indexOf(term, at + term.length); }
    }
    ranges.sort((a,b) => a[0]-b[0]);
    const merged = [];
    for (const range of ranges) {
      const last = merged[merged.length-1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push(range.slice());
    }
    let cursor = 0, result = '';
    for (const [start,end] of merged) { result += escape(text.slice(cursor,start)) + '<mark>' + escape(text.slice(start,end)) + '</mark>'; cursor=end; }
    return result + escape(text.slice(cursor));
  }

  function excerpt(entry, query) {
    const positions = tokens(query).map(t => entry.searchText.indexOf(t)).filter(p => p >= 0);
    let start = Math.max(0, (positions.length ? Math.min(...positions) : 0) - 65);
    if (start) { const space=entry.text.indexOf(' ',start); if (space >= start && space < start+25) start=space+1; }
    const end = Math.min(entry.text.length, start+210);
    return (start ? '…' : '') + highlight(entry.text.slice(start,end),query) + (end<entry.text.length ? '…' : '');
  }

  function mount(root, {getData, routeUrl, onNavigate = () => {}, locale = 'ru'}) {
    const doc = root.ownerDocument;
    const ui=(ru,en)=>locale==='en'?en:ru;
    root.classList.add('documentation-search');
    const uid = 'doc-search-' + Math.random().toString(36).slice(2);
    root.innerHTML = '<div class="doc-search-field"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" maxlength="160" autocomplete="off" spellcheck="false" placeholder="'+ui("Поиск по документации","Search documentation")+'" aria-label="'+ui("Поиск по всей документации","Search all documentation")+'" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="'+uid+'"><button class="doc-search-clear" type="button" aria-label="'+ui("Очистить поиск","Clear search")+'" hidden>×</button><kbd aria-hidden="true">/</kbd></div><div class="doc-search-panel" hidden><p class="doc-search-status" role="status" aria-live="polite"></p><div class="doc-search-results" role="listbox" id="'+uid+'" aria-label="'+ui("Результаты поиска","Search results")+'"></div></div>';
    const input = root.querySelector('input'), panel = root.querySelector('.doc-search-panel'), list = root.querySelector('.doc-search-results'), status = root.querySelector('.doc-search-status'), clear = root.querySelector('.doc-search-clear');
    let indexPromise, timer, serial=0, selected=-1, links=[], disposed=false;
    const listeners=[];
    const listen=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
    const textOf = html => {
      const parsed = new DOMParser().parseFromString(html.replace(/<img\b[^>]*>/gi,''),'text/html');
      parsed.querySelectorAll('script,style,button,[aria-hidden="true"]').forEach(node=>node.remove());
      parsed.querySelectorAll('p,li,tr,td,th,div,br').forEach(node=>node.appendChild(parsed.createTextNode(' ')));
      return (parsed.body.textContent || '').replace(/\s+/g,' ').trim();
    };
    const index=()=>indexPromise || (indexPromise=Promise.resolve().then(getData).then(data=>buildIndex(data,textOf)).catch(error=>{indexPromise=null;throw error;}));
    function close() { ++serial; clearTimeout(timer); panel.hidden=true; input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant'); }
    function select(value) {
      selected=value;
      links.forEach((link,i)=>link.setAttribute('aria-selected',String(i===value)));
      if (links[value]) {input.setAttribute('aria-activedescendant',links[value].id);links[value].scrollIntoView({block:'nearest'});}
      else input.removeAttribute('aria-activedescendant');
    }
    async function update() {
      const turn=++serial, query=input.value.trim();
      clear.hidden=!input.value; panel.hidden=false; input.setAttribute('aria-expanded','true'); selected=-1; links=[]; list.innerHTML='';input.removeAttribute('aria-activedescendant');
      if (!query) {status.textContent=''+ui("Введите слово, название метода или параметр API","Enter a word, method name or API parameter")+'';return;}
      status.textContent=''+ui("Ищем по всей документации…","Searching documentation…")+'';
      try {
        const results=find(await index(),query);
        if (disposed || turn!==serial) return;
        status.textContent=results.length ? ''+ui("Найдено: ","Results: ")+''+results.length+(results.length>20?''+ui(" · Показаны первые 20"," · Showing the first 20")+'':'') : ''+ui("Ничего не найдено. Попробуйте другое слово.","No results. Try another word.")+'';
        list.innerHTML=results.slice(0,20).map((entry,i)=>'<a class="doc-search-result" id="'+uid+'-'+i+'" role="option" aria-selected="false" href="'+escape(routeUrl(entry.pageId,entry.anchor))+'"><span class="doc-search-group">'+escape(entry.group)+' · '+highlight(entry.pageTitle,query)+'</span><strong>'+highlight(entry.heading || entry.pageTitle,query)+'</strong>'+(entry.text?'<span class="doc-search-excerpt">'+excerpt(entry,query)+'</span>':'')+'</a>').join('');
        links=[...list.querySelectorAll('a')];
      } catch {if(turn===serial && !disposed) status.textContent=''+ui("Не удалось загрузить поиск. Повторите ввод или обновите страницу.","Search could not be loaded. Try again or reload the page.")+'';}
    }
    listen(input,'input',()=>{++serial;clearTimeout(timer);timer=setTimeout(update,100);});
    listen(input,'focus',update);
    listen(input,'keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();}
      if(event.key==='ArrowDown' || event.key==='ArrowUp'){event.preventDefault();if(panel.hidden){void update();return;}if(links.length) select(selected<0?(event.key==='ArrowDown'?0:links.length-1):(selected+(event.key==='ArrowDown'?1:-1)+links.length)%links.length);}
      if(event.key==='Enter'){event.preventDefault();if(!panel.hidden && links.length) links[Math.max(0,selected)].click();}
    });
    listen(clear,'click',()=>{input.value='';input.focus();void update();});
    listen(list,'click',event=>{const link=event.target.closest('a');if(link){close();input.blur();onNavigate(link);}});
    listen(doc,'pointerdown',event=>{if(!root.contains(event.target))close();});
    listen(root,'focusout',event=>{if(!root.contains(event.relatedTarget))close();});
    listen(doc,'keydown',event=>{if(event.key==='/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select,[contenteditable="true"]')){event.preventDefault();input.focus();}});
    return ()=>{disposed=true;close();listeners.forEach(remove=>remove());root.innerHTML='';};
  }
  return {normalize, tokens, buildIndex, find, highlight, excerpt, mount};
});
