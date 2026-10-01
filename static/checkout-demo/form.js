/* The official demo's Checkout API, fields and test Public ID are preserved.
   Only the surrounding UI and script-loading error handling are customized. */
(() => {
  const ru=document.documentElement.lang==='ru'||new URLSearchParams(location.search).get('locale')==='ru';
  const text=(en,rus)=>ru?rus:en,$=id=>document.getElementById(id);
  document.documentElement.lang=ru?'ru':'en';
  document.querySelectorAll('[data-en]').forEach(el=>el.textContent=el.dataset[ru?'ru':'en']);
  $('c_expire').value='12/'+String(new Date().getFullYear()+3).slice(-2);
  // Only lifecycle signals cross the frame boundary; card data and results never do.
  const notify=type=>parent.postMessage({type:'cp-checkout-'+type},'*');
  document.addEventListener('keydown',e=>{if(e.key==='Escape')notify('close');});
  let scriptPromise;
  function loadCheckoutScript(){
    if(window.cp?.Checkout)return Promise.resolve();
    if(scriptPromise)return scriptPromise;
    scriptPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.id='checkoutScriptTag';
      script.src='https://checkout.cloudpayments.ru/checkout.js';
      const fail=()=>{clearTimeout(timer);script.remove();scriptPromise=undefined;reject(new Error(text('Could not load Checkout. Check your connection and try again.','Не удалось загрузить Checkout. Проверьте соединение и повторите попытку.')));};
      const timer=setTimeout(fail,20000);
      script.onload=()=>{clearTimeout(timer);window.cp?.Checkout?resolve():fail();};script.onerror=fail;
      document.body.appendChild(script);
    });return scriptPromise;
  }
  let attempt=0;
  $('checkoutForm').addEventListener('submit',async e=>{
    e.preventDefault();if($('c_generate').disabled)return;
    const run=++attempt;
    const checkoutParams={cvv:$('c_secret').value,cardNumber:$('c_cardnumber').value,expDateMonthYear:$('c_expire').value};
    document.body.dataset.state='loading';$('c_generate').disabled=true;$('result').hidden=true;$('result-placeholder').hidden=false;$('c_crypto').value='';
    $('status').textContent=text('Generating cryptogram…','Создаём криптограмму…');
    let timer;
    try{
      await loadCheckoutScript();
      const checkout=new cp.Checkout({publicId:'test_api_00000000000000000000002'});
      const cryptogram=await Promise.race([checkout.createPaymentCryptogram(checkoutParams),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(text('Checkout timed out. Please try again.','Checkout не ответил вовремя. Повторите попытку.'))),30000);})]);
      if(run!==attempt)return;
      $('c_crypto').value=cryptogram;$('result').hidden=false;$('result-placeholder').hidden=true;document.body.dataset.state='success';$('status').textContent=text('Cryptogram generated. No payment was made.','Криптограмма создана. Оплата не выполнялась.');
    }catch(errors){
      document.body.dataset.state='error';
      $('status').textContent=errors instanceof Error?errors.message:text('Check card details and try again.','Проверьте данные карты и повторите попытку.');
    }finally{clearTimeout(timer);$('c_generate').disabled=false;}
  });
  $('copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('c_crypto').value);$('status').textContent=text('Cryptogram copied.','Криптограмма скопирована.');}
    catch{$('c_crypto').focus();$('c_crypto').select();$('status').textContent=text('Select and copy the cryptogram with Ctrl/Cmd+C.','Скопируйте выделенную криптограмму: Ctrl/Cmd+C.');}
  });
  notify('ready');
})();
