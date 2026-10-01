/* Attach after the demo introduction without changing any published page content. */
(() => {
  const main=document.getElementById('main');if(!main||!window.CPCheckoutDemo)return;
  let cleanup,node;
  function update(){
    if(node?.isConnected)return;
    cleanup?.();cleanup=null;node=null;
    const route=location.hash.split('@')[0];if(!/^#\/(en\/)?script-checkout\/?$/.test(route))return;
    const headings=[...main.querySelectorAll('h2')];
    const requirements=headings.find(h=>/^(Требования|Requirements)$/i.test(h.textContent.trim()));
    if(!requirements)return;
    node=document.createElement('div');node.dataset.checkoutDemo='';requirements.before(node);
    cleanup=window.CPCheckoutDemo.mount(node,{frameUrl:location.href,frameHtml:window.CPCheckoutFrame,locale:route.startsWith('#/en/')?'en':'ru'});
  }
  new MutationObserver(update).observe(main,{childList:true,subtree:true});update();
})();
