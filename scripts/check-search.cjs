const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const search=require('../src/components/documentation-search.cjs');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="document-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const plain=html=>html.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const index=search.buildIndex(data,plain);
assert.equal(new Set(index.map(entry=>entry.pageId)).size,Object.keys(data.pages).length);
assert.deepEqual(search.find(index,'  '),[]);
assert.deepEqual(search.find(index,'этогослованет999'),[]);
for(const result of search.find(index,'номер телефона')){
  const haystack=result.searchTitle+' '+result.searchHeading+' '+result.searchText;
  assert(haystack.includes('номер') && haystack.includes('телефона'));
}
for(const entry of index)if(entry.anchor)assert(data.pages[entry.pageId].html.includes('id="'+entry.anchor+'"'));
assert.equal(search.highlight('Платёж и ПЛАТЕЖ','платеж'),'<mark>Платёж</mark> и <mark>ПЛАТЕЖ</mark>');
assert.equal(search.highlight('<img onerror="bad">','img'),'&lt;<mark>img</mark> onerror=&quot;bad&quot;&gt;');
const fresh=structuredClone(data);
fresh.pages[Object.keys(fresh.pages)[0]].html+='<h2 id="new-section">Новая глава</h2><p>Уникальноепубликуемоеслово</p>';
assert.equal(search.find(search.buildIndex(fresh,plain),'уникальноепубликуемоеслово')[0].anchor,'new-section');
console.log(`Verified search across ${Object.keys(data.pages).length} pages and ${index.length} sections, API parameters, anchors, multiword queries, highlighting and newly published text.`);
