import React,{useEffect,useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import '../../static/checkout-demo/demo.js';

/** Checkout executes only in the child document, never in the MDX application. */
export default function CheckoutDemo(){
  const root=useRef(null),frameUrl=useBaseUrl('/checkout-demo/index.html');
  const {i18n:{currentLocale}}=useDocusaurusContext();
  useEffect(()=>window.CPCheckoutDemo.mount(root.current,{frameUrl,locale:currentLocale}),[frameUrl,currentLocale]);
  return <div ref={root} data-checkout-demo=""/>;
}
