/* EDITOR_STRUCTURE_V1 */
function visibleNavigation(groups,audience='all'){
 return groups.filter(g=>!g.hidden).map(g=>{
  const byId=new Map(g.items.map(p=>[p.id,p]));
  function hidden(p){return !!p.hidden||!!(p.parentId&&byId.has(p.parentId)&&hidden(byId.get(p.parentId)));}
  const items=g.items.filter(p=>!hidden(p)&&(audience==='all'||(p.audience||g.audience)==='both'||(p.audience||g.audience)===audience));
  const ids=new Set(items.map(p=>p.id));
  const promoted=items.map(p=>{let parentId=p.parentId;while(parentId&&!ids.has(parentId))parentId=byId.get(parentId)?.parentId;return {...p,parentId};});
  const hasPage=p=>p.type!=='category'||promoted.some(child=>child.parentId===p.id&&hasPage(child));
  return {...g,items:promoted.filter(hasPage),links:(g.links||[]).filter(p=>ids.has(p.id))};
 }).filter(g=>g.items.length);
}
import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation, useHistory} from '@docusaurus/router';
import sourceGroups from './navigation.json';
import englishPages from '../content/editor-pages.en.json';
import locales from './document-locales.cjs';
import OverviewGate from './OverviewGate';
const groups=locales.view({groups:sourceGroups,pages:{},translations:{en:{pages:englishPages}}},'en').groups;

const filters = [['all', 'All sections'], ['business', 'For business'], ['developer', 'For developers']];

export default function EnglishDocumentationIndex(){
 const location=useLocation(),history=useHistory();
 const param=new URLSearchParams(location.search).get('audience');
 const audience=['business','developer'].includes(param)?param:'all';
 const visible=visibleNavigation(groups,audience);
 function choose(value){const params=new URLSearchParams(location.search);if(value==='all')params.delete('audience');else params.set('audience',value);history.replace({pathname:location.pathname,search:params.toString()?'?'+params.toString():'',hash:''});}
 return <OverviewGate groups={groups}><div className="documentation-index">
  <div className="index-main">
   <div className="index-eyebrow">DOCUMENTATION <span>/</span> OVERVIEW</div>
   <h1>About this document</h1>
   <div className="audience-bar">
    <div className="audience-switch" role="group" aria-label="Documentation audience">
     {filters.map(([value,label])=><button key={value} type="button" data-audience={value} aria-pressed={audience===value} onClick={()=>choose(value)}>{value!=='all'&&<span className="audience-marker" aria-hidden="true"/>}{label}</button>)}
    </div>
   </div>
   <div className="section-grid">
    {visible.map((g,i)=><section key={g.id} id={'section-'+g.id} className={'section-card audience-'+g.audience}>
     <h2>{g.title}</h2><p className="section-description">{g.description}</p>
     <div className="section-audiences">{(g.audience==='business'||g.audience==='both')&&<span className="audience-badge business">For business</span>}{(g.audience==='developer'||g.audience==='both')&&<span className="audience-badge developer">For developers</span>}</div>
     <ul className="section-links">{renderNavigationItems(g.items)}{(g.links||[]).map(item=><li key={item.id+':'+item.title}><Link to={'/'+item.id+'/'+(item.anchor?'#'+item.anchor:'')}>{item.title}</Link></li>)}</ul>
    </section>)}
   </div>
   <div className="index-sources"><span>Sources</span><a href="https://developers.cloudpayments.ru/" target="_blank" rel="noreferrer">CloudPayments documentation ↗</a><a href="https://cloudpayments.ru/help/payments" target="_blank" rel="noreferrer">Knowledge base ↗</a></div>
  </div>
  <aside className="index-toc" aria-label="Contents"><div>On this page</div><nav>{visible.map(g=><a key={g.id} href={'#section-'+g.id}>{g.title}</a>)}</nav></aside>
 </div></OverviewGate>
}

function renderNavigationItems(items,parentId){return items.filter(p=>p.parentId===parentId).map(p=><li key={p.id}>{p.type==='category'?<span>{p.title}</span>:<Link to={'/'+p.id+'/'}>{p.title}</Link>}{items.some(c=>c.parentId===p.id)&&<ul>{renderNavigationItems(items,p.id)}</ul>}</li>);}
