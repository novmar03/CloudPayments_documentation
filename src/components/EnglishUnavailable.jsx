import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
export default function EnglishUnavailable({page}){const base=useBaseUrl('/').replace(/en\/$/,'');return <div className="translation-missing"><p>The English version of this page has not been published yet.</p><a href={base+page+'/'} lang="ru">Read in Russian</a></div>;}
