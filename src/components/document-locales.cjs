(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CPDocsLocales=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const groupLabels={"additional":["Additional resources","More about the CloudPayments ecosystem"],"start":["Getting started","Connection and merchant account"],"solutions":["Payment solutions","Interfaces and integration options"],"methods":["Payment methods","Cards, wallets and other payment options"],"scenarios":["Payment scenarios","Subscriptions, repeat payments and escrow"],"tech":["Technical integration","Interfaces, API, notifications and payment setup"],"security":["Information security","PCI DSS and payment data protection"],"reference":["Testing and reference","Integration testing and reference materials"]};
const names={"methods":"Payment method setup","connect":"Connection process","account":"Merchant account","compare":"Comparing payment interfaces","widget":"Widget","blocks":"Payment blocks","checkout":"Check-out script","orders":"Single-use payment links","links":"Reusable payment links","charity":"Charity","infoshop":"Infoshop","sdk":"Mobile SDKs","api":"API","card":"Bank cards","tpay":"T-Pay","sberpay":"SberPay","mirpay":"Mir Pay","sbp":"Faster Payments System","dolyami":"Dolyami","installments":"Installments","foreign":"International cards","digital":"Digital ruble","recurrent":"Recurring subscriptions","recurring":"Repeat payments","escrow":"Escrow","customization":"Payment interface customization","notifications":"Notifications","security":"Information security","testing":"Testing","directory":"Reference","glossary":"Glossary","ecosystem":"CloudPayments ecosystem"};
function route(hash){const raw=String(hash||'').replace(/^#\/?/,'');const locale=raw.startsWith('en/')?'en':'ru';return {locale,path:locale==='en'?raw.slice(3):raw};}
function url(locale,id='',anchor=''){return '#/'+(locale==='en'?'en/':'')+id+(anchor?'@'+encodeURIComponent(anchor):'');}
function view(data,locale){
 if(locale!=='en')return {groups:data.groups,pages:data.pages};
 const translations=data.translations?.en?.pages||{},pages={};
 const groups=data.groups.map(g=>({...g,title:groupLabels[g.id]?.[0]||g.title,description:groupLabels[g.id]?.[1]||'',links:(g.links||[]).map(link=>({...link,anchor:translations[link.id]?.toc?.some(h=>h.id===link.anchor)?link.anchor:undefined})),items:g.items.map(p=>({...p,title:translations[p.id]?.title||names[p.id.split('/').pop()]||p.title}))}));
 for(const g of groups)for(const p of g.items){if(p.type==='category')continue;const en=translations[p.id];pages[p.id]={...data.pages[p.id],...p,group:g.id,html:en?.html||'',toc:en?.toc||[],translated:!!en};}
 return {groups,pages};
}
function searchView(data,locale){const result=view(data,locale);if(locale==='en')result.pages=Object.fromEntries(Object.entries(result.pages).filter(([,p])=>p.translated));return result;}
return {route,url,view,searchView};
});
