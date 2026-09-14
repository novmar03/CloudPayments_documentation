import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import locales from '../../components/document-locales.cjs';
import React, {useEffect, useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import search from '../../components/documentation-search.cjs';

export default function SearchBar() {
  const root = useRef(null);
  const base = useBaseUrl('/');
  const {i18n:{currentLocale}}=useDocusaurusContext();
  useEffect(() => search.mount(root.current, {
    locale:currentLocale,
    getData: async () => {
      const response = await fetch(base + 'search-index.json');
      if (!response.ok) throw new Error('Search index unavailable');
      return locales.searchView(await response.json(),currentLocale);
    },
    routeUrl: (page,anchor) => base + page + '/' + (anchor ? '#' + encodeURIComponent(anchor) : ''),
  }), [base,currentLocale]);
  return <div ref={root} className="documentation-search"/>;
}
