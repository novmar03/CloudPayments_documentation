const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const groups=require('../src/components/navigation.json');
const locales=require('../src/components/document-locales.cjs');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="document-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
test('payment setup groups all six existing instructions under its landing page',()=>{
 const tech=groups.find(g=>g.id==='tech');
 const children=tech.items.filter(p=>p.parentId==='tech/methods');
 assert.equal(children.length,6);
 assert.equal(tech.items.filter(p=>!p.parentId).length,11);
 for(const p of children){assert(data.pages[p.id]);assert(data.pages['tech/methods'].html.includes('#/'+p.id));}
 const native=require('../sidebars.js').docs.find(g=>g.label===tech.title).items.find(p=>p.link?.id==='tech/methods');
 assert.deepEqual(native.items,children.map(p=>p.id));
});
test('additional resources are available to both audiences and link to existing sections',()=>{
 const additional=groups.find(g=>g.id==='additional');
 assert.equal(additional.audience,'both');
 assert(!groups.find(g=>g.id==='reference').items.some(p=>p.id==='reference/ecosystem'));
 for(const link of additional.links)assert(data.pages[link.id].toc.some(h=>h.id===link.anchor));
 const english=locales.view({groups,pages:data.pages},'en').groups.find(g=>g.id==='additional');
 assert(english.links.every(link=>!link.anchor));
 assert(!html.match(/<header>[\s\S]*?<\/header>/)[0].includes('merchant.cloudpayments.ru'));
});
