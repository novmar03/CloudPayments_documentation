const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function form({generate=async()=> 'test-cryptogram',clipboard=true}={}){
  const elements={},messages=[],calls=[],timers=new Map();let timerId=0;
  const el=id=>elements[id]||=( {value:'',hidden:false,disabled:false,textContent:'',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},focus(){this.focused=true;},select(){this.selected=true;}} );
  for(const id of ['c_cardnumber','c_secret','c_expire','c_generate','c_crypto','result','result-placeholder','status','copy','checkoutForm'])el(id);
  el('c_cardnumber').value='4242 4242 4242 4242';el('c_secret').value='777';
  const document={documentElement:{lang:'en'},body:{dataset:{state:'default'},appendChild(script){document.script=script;}},getElementById:el,querySelectorAll:()=>[],addEventListener(type,fn){this[type]=fn;},createElement:()=>({remove(){}})};
  function Checkout(options){calls.push(options);this.createPaymentCryptogram=fields=>{calls.push(fields);return generate();};}
  const context={document,window:{cp:{Checkout}},cp:{Checkout},parent:{postMessage:msg=>messages.push(msg)},location:{search:'',origin:'https://example.test'},URLSearchParams,Date,Error,Promise,navigator:{clipboard:{writeText:async value=>{if(!clipboard)throw Error('Denied');calls.push(value);}}},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(read('static/checkout-demo/form.js'),context);
  return {elements,document,calls,messages,context,timers,submit:()=>el('checkoutForm').listeners.submit({preventDefault(){}})};
}
test('Checkout preserves official API and test ID, exposes success and copies result',async()=>{
  const f=form();await f.submit();assert.equal(f.document.body.dataset.state,'success');
  assert.equal(f.calls[0].publicId,'test_api_00000000000000000000002');assert.equal(f.calls[1].cardNumber,'4242 4242 4242 4242');assert.equal(f.elements.c_crypto.value,'test-cryptogram');
  await f.elements.copy.listeners.click();assert.equal(f.calls.at(-1),'test-cryptogram');
  assert.equal(f.messages[0].type,'cp-checkout-ready');assert(!JSON.stringify(f.messages).includes('4242'));
  f.document.keydown({key:'Escape'});assert.equal(f.messages.at(-1).type,'cp-checkout-close');
});
test('loading prevents duplicate generation and errors are retryable',async()=>{
  let reject;const f=form({generate:()=>new Promise((_,r)=>reject=r)});const work=f.submit();await Promise.resolve();
  assert.equal(f.document.body.dataset.state,'loading');assert(f.elements.c_generate.disabled);await f.submit();assert.equal(f.calls.length,2);
  reject({cardNumber:'CardNumber_Invalid'});await work;assert.equal(f.document.body.dataset.state,'error');assert.equal(f.elements.c_generate.disabled,false);assert.equal(f.elements.result.hidden,true);
});
test('script loading failure unlocks the form and permits a new attempt',async()=>{
  const f=form();delete f.context.window.cp;const work=f.submit();f.document.script.onerror();await work;
  assert.equal(f.document.body.dataset.state,'error');assert.equal(f.elements.c_generate.disabled,false);
  const retry=f.submit();f.context.window.cp=f.context.cp;f.document.script.onload();await retry;assert.equal(f.document.body.dataset.state,'success');
});
test('clipboard denial selects the result for manual copy',async()=>{
  const f=form({clipboard:false});await f.submit();await f.elements.copy.listeners.click();assert(f.elements.c_crypto.selected);assert.match(f.elements.status.textContent,/Ctrl\/Cmd\+C/);
});
test('MDX wrapper and standalone target the demo introduction without replacing page content',()=>{
  assert.match(read('src/components/EditedSection.jsx'),/page==='script-checkout'&&index===1&&<CheckoutDemo/);
  assert.match(read('static/checkout-demo/standalone.js'),/requirements\.before\(node\)/);
  assert.match(read('static/checkout-demo/demo.js'),/event\.source!==dialog\.querySelector\('iframe'\)\.contentWindow/);
  assert.match(read('static/checkout-demo/demo.js'),/dialog\.showModal\(\)/);
  assert.match(read('static/checkout-demo/demo.js'),/100dvh/);
  assert.doesNotMatch(read('static/checkout-demo/index.html'),/<input[^>]*\sname=/);
});
