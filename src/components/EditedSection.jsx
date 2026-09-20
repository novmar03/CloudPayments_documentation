import linkNavigation from './navigation.json';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import englishContent from '../content/editor-pages.en.json?render';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import russianContent from '../content/editor-pages.json?render';
import {handleCodeCopy} from './document-ui';
export default function EditedSection({page,index}) {
 const base=useBaseUrl('/');
 const {i18n:{currentLocale}}=useDocusaurusContext();
 const content=currentLocale==='en'?englishContent:russianContent;
 const html=(content[page]?.segments[index]||'').replaceAll('src="static/img/editor/', 'src="'+base+'img/editor/').replaceAll('__EDITOR_ASSET__/',base+'assets/editor-media/').replace(/href="#\/([^"@]+)(?:@([^"\s]+))?"/g,(_,route,anchor)=>'href="'+base+route+'/'+(anchor?'#'+anchor:'')+'"');
 const documentationRoutes=new Set(linkNavigation.flatMap(g=>g.items.map(p=>p.id)));
 const documentationLinkedHtml=html.replace(/href="\/(?!\/)([^"#]+)(#[^"]*)?"/g,(all,route,hash)=>documentationRoutes.has(route.replace(/^en\//,'').replace(/\/$/,''))?'href="'+base.replace(/\/en\/$/,'/')+route+(hash||'')+'"':all);
 return <div className="imported-api" onClick={handleCodeCopy} dangerouslySetInnerHTML={{__html:documentationLinkedHtml}}/>;
}
