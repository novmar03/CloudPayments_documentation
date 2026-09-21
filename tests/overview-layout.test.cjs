const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const groups=require('../src/components/navigation.json');
const deleted=require('../src/content/deleted-pages.json');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="document-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
test('deleted legacy pages are absent from navigation, published data and both locale sources',()=>{
 const ids=groups.flatMap(g=>g.items.map(p=>p.id));
 for(const id of deleted){
  assert(!ids.includes(id));
  assert(!data.pages[id]);
  for(const locale of ['editor-pages.json','editor-pages.en.json'])assert(!require('../src/content/'+locale)[id]);
  for(const root of ['docs','i18n/en/docusaurus-plugin-content-docs/current']){
   for(const extension of ['.md','.mdx'])assert(!fs.existsSync(path.join(__dirname,'..',root,id+extension)));
  }
 }
});
test('current navigation keeps its page sources and audience settings',()=>{
 assert(groups.some(g=>g.title==='Общая информация'));
 for(const group of groups){
  assert(['business','developer','both'].includes(group.audience));
  for(const page of group.items.filter(p=>p.type!=='category'))assert(data.pages[page.id]);
 }
 assert(!html.match(/<header>[\s\S]*?<\/header>/)[0].includes('merchant.cloudpayments.ru'));
});
