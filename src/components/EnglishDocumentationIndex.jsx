import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation, useHistory} from '@docusaurus/router';
import sourceGroups from './navigation.json';
import englishPages from '../content/editor-pages.en.json';
import locales from './document-locales.cjs';
const groups=locales.view({groups:sourceGroups,pages:{},translations:{en:{pages:englishPages}}},'en').groups;

const filters = [['all', 'All sections'], ['business', 'For business'], ['developer', 'For developers']];
function SectionIcon({kind}) {
 const paths={start:'M8 4h8v4h4v12H4V8h4V4Zm0 4h8M8 13h8M8 17h5',solutions:'M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v6H4v-6Zm10 0h6v6h-6v-6Z',methods:'M3 7h18v13H3V7Zm0 5h18M6 16h4',scenarios:'M4 7h12l-3-3m3 3-3 3M20 17H8l3-3m-3 3 3 3',tech:'m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18',security:'m12 3 8 4v6c0 4-8 8-8 8s-8-4-8-8V7l8-4Zm-4 9 3 3 5-6',reference:'M4 4h7v16H4V4Zm10 0h6v16h-6V4ZM7 8h1m9 0h1'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
export default function EnglishDocumentationIndex(){
 const location=useLocation(),history=useHistory();
 const param=new URLSearchParams(location.search).get('audience');
 const audience=['business','developer'].includes(param)?param:'all';
 const visible=groups.filter(g=>audience==='all'||g.audience===audience||g.audience==='both');
 const count=visible.reduce((n,g)=>n+g.items.length,0);
 function choose(value){const params=new URLSearchParams(location.search);if(value==='all')params.delete('audience');else params.set('audience',value);history.replace({pathname:location.pathname,search:params.toString()?'?'+params.toString():'',hash:''});}
 return <div className="documentation-index">
  <div className="index-main">
   <div className="index-eyebrow">DOCUMENTATION <span>/</span> OVERVIEW</div>
   <h1>About this document</h1>
   <p className="index-lead">From choosing a payment solution to technical integration.<br className="desktop-break"/> Choose the sections you need.</p>
   <div className="audience-bar">
    <div className="audience-switch" role="group" aria-label="Documentation audience">
     {filters.map(([value,label])=><button key={value} type="button" data-audience={value} aria-pressed={audience===value} onClick={()=>choose(value)}>{value!=='all'&&<span className="audience-marker" aria-hidden="true"/>}{label}</button>)}
    </div>
    <span className="result-count" aria-live="polite">Sections: {visible.length} <span>·</span> Pages: {count}</span>
   </div>
   <div className="section-grid">
    {visible.map((g,i)=><section key={g.id} id={'section-'+g.id} className={'section-card audience-'+g.audience}>
     <div className="section-heading"><div className="section-icon"><SectionIcon kind={g.id}/></div><span className="section-number">{String(groups.indexOf(g)+1).padStart(2,'0')}</span></div>
     <h2>{g.title}</h2><p className="section-description">{g.description}</p>
     <div className="section-audiences">{(g.audience==='business'||g.audience==='both')&&<span className="audience-badge business">For business</span>}{(g.audience==='developer'||g.audience==='both')&&<span className="audience-badge developer">For developers</span>}</div>
     <ul className="section-links">{g.items.map(item=><li key={item.id}><Link to={'/'+item.id+'/'}><span>{item.id.startsWith('tech/methods/')?'Setup: ':''}{item.title}</span><span className="link-chevron" aria-hidden="true">›</span></Link></li>)}</ul>
    </section>)}
   </div>
   <div className="index-sources"><span>Sources</span><a href="https://developers.cloudpayments.ru/" target="_blank" rel="noreferrer">CloudPayments documentation ↗</a><a href="https://cloudpayments.ru/help/payments" target="_blank" rel="noreferrer">Knowledge base ↗</a></div>
  </div>
  <aside className="index-toc" aria-label="Contents"><div>On this page</div><nav>{visible.map(g=><a key={g.id} href={'#section-'+g.id}>{g.title}</a>)}</nav></aside>
 </div>
}
