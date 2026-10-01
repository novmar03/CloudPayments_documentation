/* Shared presentation wrapper for MDX and the standalone documentation reader. */
(function(global){
  if(!global)return;
  const css=`.cp-demo{margin:24px 0 32px;padding:24px;border:1px solid #dce6f3;border-radius:16px;background:linear-gradient(110deg,#f1f7ff,#fff);display:flex;align-items:center;justify-content:space-between;gap:20px}.cp-demo strong{display:block;color:#182c48;font:650 18px/1.4 system-ui}.cp-demo p{margin:5px 0 0;color:#6b7d95;font:14px/1.5 system-ui}.cp-demo button,.cp-demo-dialog button{cursor:pointer;font:600 14px system-ui;border-radius:9px;padding:12px 18px;border:0;background:#176be5;color:white}.cp-demo button{white-space:nowrap}.cp-demo-dialog{box-sizing:border-box;width:min(940px,calc(100vw - 48px));max-width:none;max-height:calc(100dvh - 48px);padding:0;border:1px solid #dae3ee;border-radius:20px;background:#f7f9fc;color:#182c48;box-shadow:0 28px 100px #12233b40;overflow:hidden}.cp-demo-dialog::backdrop{background:#142b4e80;backdrop-filter:blur(5px)}.cp-demo-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:white;border-bottom:1px solid #e1e8f1}.cp-demo-header h2{font:650 20px/1.4 system-ui;margin:0!important;letter-spacing:-.02em}.cp-demo-header button{font:26px/1 system-ui;background:#f0f4f9;color:#52657e;padding:8px 12px}.cp-demo-body{position:relative;height:min(580px,calc(100dvh - 135px))}.cp-demo-dialog iframe{display:block;width:100%;height:100%;border:0}.cp-demo-loading{position:absolute;inset:0;background:#f7f9fc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;font:14px/1.6 system-ui;color:#63778f}.cp-demo-loading[hidden]{display:none}.cp-demo button:focus-visible,.cp-demo-dialog button:focus-visible{outline:3px solid #80b7ff;outline-offset:3px}@media(max-width:620px){.cp-demo{align-items:stretch;flex-direction:column;padding:20px}.cp-demo-dialog{margin:0;width:100vw;height:100dvh;max-height:none;border:0;border-radius:0}.cp-demo-header{padding:16px 18px}.cp-demo-body{height:calc(100dvh - 74px)}}`;
  function mount(root,{frameUrl,frameHtml,locale='en'}={}){
    if(!document.getElementById('cp-demo-style')){const style=document.createElement('style');style.id='cp-demo-style';style.textContent=css;document.head.appendChild(style);}
    const ru=locale==='ru',text=(en,rus)=>ru?rus:en;
    root.classList.add('cp-demo');
    const summary=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p'),button=document.createElement('button');
    title.textContent='Checkout sandbox';description.textContent=text('Test a card. Generate a cryptogram. No payment.','Проверьте карту и создайте криптограмму без оплаты.');button.textContent='Try Checkout';button.type='button';summary.append(title,description);root.append(summary,button);
    let dialog,timeout,oldOverflow;
    function close(){if(!dialog)return;clearTimeout(timeout);window.removeEventListener('message',onMessage);dialog.close();dialog.remove();dialog=null;document.body.style.overflow=oldOverflow;if(button.isConnected)button.focus();}
    function onMessage(event){if(!dialog||event.source!==dialog.querySelector('iframe').contentWindow||event.origin!==new URL(frameUrl,location.href).origin)return;
      if(event.data?.type==='cp-checkout-close')close();
      if(event.data?.type==='cp-checkout-ready'){clearTimeout(timeout);dialog.querySelector('.cp-demo-loading').hidden=true;}
    }
    button.onclick=()=>{
      if(dialog)return;
      dialog=document.createElement('dialog');dialog.className='cp-demo-dialog';dialog.setAttribute('aria-label',text('Try Checkout — test card','Try Checkout — тестовая карта'));
      const header=document.createElement('div');header.className='cp-demo-header';const h=document.createElement('h2');h.textContent='Try Checkout';const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label',text('Close demo','Закрыть демо'));x.onclick=close;header.append(h,x);
      const body=document.createElement('div');body.className='cp-demo-body';const frame=document.createElement('iframe');frame.title=text('Checkout test card form','Тестовая форма Checkout');frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms');frame.setAttribute('allow','clipboard-write');
      const cover=document.createElement('div');cover.className='cp-demo-loading';cover.setAttribute('role','status');
      function load(){cover.hidden=false;cover.textContent=text('Loading Checkout…','Загружаем Checkout…');clearTimeout(timeout);if(frameHtml){frame.srcdoc=frameHtml.replace('<html lang="en">','<html lang="'+locale+'">');}else{const url=new URL(frameUrl,location.href);url.searchParams.set('locale',locale);frame.src=url.href;}timeout=setTimeout(fail,20000);}
      function fail(){cover.textContent=text('The demo could not be loaded.','Не удалось загрузить демо.');const retry=document.createElement('button');retry.type='button';retry.textContent=text('Try again','Повторить');retry.onclick=load;cover.append(retry);}
      frame.onerror=fail;body.append(frame,cover);dialog.append(header,body);document.body.append(dialog);
      dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
      window.addEventListener('message',onMessage);oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();load();x.focus();
    };
    return ()=>{close();root.replaceChildren();};
  }
  global.CPCheckoutDemo={mount};
})(typeof window==='undefined'?null:window);
