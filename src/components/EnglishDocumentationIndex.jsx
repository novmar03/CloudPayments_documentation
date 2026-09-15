import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation, useHistory} from '@docusaurus/router';
import sourceGroups from './navigation.json';
import englishPages from '../content/editor-pages.en.json';
import locales from './document-locales.cjs';
const groups=locales.view({groups:sourceGroups,pages:{},translations:{en:{pages:englishPages}}},'en').groups;

const filters = [['all', 'All sections'], ['business', 'For business'], ['developer', 'For developers']];

export default function EnglishDocumentationIndex(){
 const location=useLocation(),history=useHistory();
 const param=new URLSearchParams(location.search).get('audience');
 const audience=['business','developer'].includes(param)?param:'all';
 const visible=groups.filter(g=>audience==='all'||g.audience===audience||g.audience==='both');
 function choose(value){const params=new URLSearchParams(location.search);if(value==='all')params.delete('audience');else params.set('audience',value);history.replace({pathname:location.pathname,search:params.toString()?'?'+params.toString():'',hash:''});}
 return <div className="documentation-index">
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
     <ul className="section-links">{[...g.items.filter(item=>!item.parentId),...(g.links||[])].map(item=><li key={item.id+':'+item.title}><Link to={'/'+item.id+'/'+(item.anchor?'#'+item.anchor:'')}><span>{item.title}</span><span className="link-chevron" aria-hidden="true">›</span></Link></li>)}</ul>
    </section>)}
   </div>
   <div className="index-sources"><span>Sources</span><a href="https://developers.cloudpayments.ru/" target="_blank" rel="noreferrer">CloudPayments documentation ↗</a><a href="https://cloudpayments.ru/help/payments" target="_blank" rel="noreferrer">Knowledge base ↗</a></div>
  </div>
  <aside className="index-toc" aria-label="Contents"><div>On this page</div><nav>{visible.map(g=><a key={g.id} href={'#section-'+g.id}>{g.title}</a>)}</nav></aside>
 </div>
}
