import React, {useEffect, useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import search from '../../components/documentation-search.cjs';

export default function SearchBar() {
  const root = useRef(null);
  const base = useBaseUrl('/');
  useEffect(() => search.mount(root.current, {
    getData: async () => {
      const response = await fetch(base + 'search-index.json');
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    },
    routeUrl: (page,anchor) => base + page + '/' + (anchor ? '#' + encodeURIComponent(anchor) : ''),
  }), [base]);
  return <div ref={root} className="documentation-search"/>;
}
