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
function navigation(groups,audience='all',available){
 return groups.filter(g=>!g.hidden).map(g=>{
  const byId=new Map(g.items.map(p=>[p.id,p]));
  function hidden(p,seen=new Set()){if(seen.has(p.id))return true;seen.add(p.id);return !!p.hidden||!!(p.parentId&&byId.has(p.parentId)&&hidden(byId.get(p.parentId),seen));}
  const items=g.items.filter(p=>p.id!=='index'&&!hidden(p)&&(audience==='all'||(p.audience||g.audience)==='both'||(p.audience||g.audience)===audience)&&(p.type==='category'||!available||!!available[p.id]));
  const ids=new Set(items.map(p=>p.id));
  const promoted=items.map(p=>{let parentId=p.parentId;const seen=new Set();while(parentId&&!ids.has(parentId)&&!seen.has(parentId)){seen.add(parentId);parentId=byId.get(parentId)?.parentId;}return {...p,parentId};});
  const hasPage=p=>p.type!=='category'||promoted.some(child=>child.parentId===p.id&&hasPage(child));
  return {...g,items:promoted.filter(hasPage),links:(g.links||[]).filter(p=>ids.has(p.id))};
 }).filter(g=>g.items.length);
}
function orderedPages(groups){
 return groups.flatMap(g=>{const walk=parent=>g.items.filter(p=>p.parentId===parent).flatMap(p=>[...(p.type==='category'?[]:[p]),...walk(p.id)]);return walk(undefined);});
}
function availablePages(pages,locale){return Object.fromEntries(Object.entries(pages).filter(([,p])=>locale!=='en'||p.translated).map(([id])=>[id,true]));}
function landingPage(settings,groups,audience,available){
 if(settings?.showOverviewPage!==false)return null;
 return orderedPages(navigation(groups,audience,available))[0]?.id||null;
}
return {route,url,view,searchView,navigation,orderedPages,availablePages,landingPage};
});
