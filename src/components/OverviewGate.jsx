import React from 'react';
import {Redirect,useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {usePluginData} from '@docusaurus/useGlobalData';
import settings from '../content/documentation-settings.json';
import locales from './document-locales.cjs';

export default function OverviewGate({groups,children}){
 const location=useLocation(),available=usePluginData('documentation-overview');
 const value=new URLSearchParams(location.search).get('audience');
 const audience=['business','developer'].includes(value)?value:'all';
 const first=locales.landingPage(settings,groups,audience,available);
 const destination=useBaseUrl(first?'/'+first+'/':'/');
 return first?<Redirect to={{pathname:destination,search:location.search}}/>:children;
}
