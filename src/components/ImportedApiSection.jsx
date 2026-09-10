import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import content from '../content/api-fragments.json';
import {handleCodeCopy} from './document-ui';

export default function ImportedApiSection({section}) {
  const base = useBaseUrl('/');
  const fragment = content.fragments[section];
  if (!fragment) throw new Error(`Unknown API section: ${section}`);
  const html = fragment.html.replace(/<a\b[^>]*>/g, tag => {
    const link = tag.match(/href="https:\/\/developers\.cloudpayments\.ru\/#([^"]+)"/);
    if (!link) return tag;
    const target = content.linkTargets[decodeURIComponent(link[1])];
    if (!target) return tag;
    return tag.replace(link[0], `href="${base}${target.route}/${target.anchor ? '#' + encodeURIComponent(target.anchor) : ''}"`).replace(/\s(?:target|rel)="[^"]*"/g, '');
  });
  return <div className="imported-api" onClick={handleCodeCopy} dangerouslySetInnerHTML={{__html: html}} />;
}
