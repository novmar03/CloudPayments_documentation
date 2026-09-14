import React,{useEffect,useRef} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
export default function LanguagePicker(){
 const ref=useRef(null),location=useLocation(),{siteConfig,i18n}=useDocusaurusContext();
 const base=siteConfig.baseUrl.replace(/en\/$/,'');
 const route=location.pathname.slice(base.length).replace(/^en\//,'');
 useEffect(()=>{const close=e=>{if(e.key==='Escape'||e.type==='pointerdown'&&!ref.current?.contains(e.target)){if(ref.current)ref.current.open=false;}};document.addEventListener('keydown',close);document.addEventListener('pointerdown',close);return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',close);};},[]);
 return <details className="language-picker" ref={ref}><summary aria-label="Выбрать язык / Choose language" title="Язык / Language"><svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg></summary><nav aria-label="Language">{[['ru','Русский'],['en','English']].map(([locale,label])=><a key={locale} href={base+(locale==='en'?'en/':'')+route+location.search+location.hash} lang={locale} aria-current={locale===i18n.currentLocale?'true':undefined}>{label}<span>{locale.toUpperCase()}</span></a>)}</nav></details>;
}
