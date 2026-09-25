const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const policy=require('../src/components/document-locales.cjs');
const root=path.join(__dirname,'..');
const groups=[{id:'hidden-group',hidden:true,audience:'both',items:[{id:'group-hidden',title:'Hidden'}]},{id:'pages',title:'Pages',audience:'both',items:[
 {id:'hidden-parent',type:'category',hidden:true,title:'Hidden parent'},
 {id:'hidden-child',parentId:'hidden-parent',title:'Hidden child'},
 {id:'developer',audience:'developer',title:'Developer'},
 {id:'missing',title:'Missing'},
 {id:'category',type:'category',title:'Category'},
 {id:'first',parentId:'category',audience:'business',title:'First'},
 {id:'second',audience:'both',title:'Second'},
]}];
const available={'group-hidden':true,'hidden-child':true,developer:true,first:true,second:true};
test('enabled and absent settings keep the overview as landing page',()=>{
 for(const settings of [undefined,{}, {showOverviewPage:true}])assert.equal(policy.landingPage(settings,groups,'business',available),null);
});
test('disabled setting selects depth-first visible pages and skips hidden ancestors, audience mismatches and unavailable pages',()=>{
 assert.equal(policy.landingPage({showOverviewPage:false},groups,'business',available),'first');
 assert.equal(policy.landingPage({showOverviewPage:false},groups,'developer',available),'developer');
 assert.equal(policy.landingPage({showOverviewPage:false},groups,'business',{second:true}),'second');
 const promoted=[{id:'g',audience:'developer',items:[{id:'parent',audience:'developer'},{id:'child',parentId:'parent',audience:'business'}]}];
 assert.equal(policy.landingPage({showOverviewPage:false},promoted,'business',{child:true}),'child');
});
test('no visible available page returns the overview fallback',()=>{
 for(const audience of ['business','developer','all'])assert.equal(policy.landingPage({showOverviewPage:false},groups,audience,{}),null);
 assert.equal(policy.landingPage({showOverviewPage:false},[], 'all',available),null);
});
function reader(locale,enabled,audience='business',availableIds=['developer','first','second']){
 const pages=Object.fromEntries(Object.keys(available).map(id=>[id,{id,title:id,html:'<p>Content '+id+'</p>',toc:[],group:'pages'}]));
 const translations={en:{pages:Object.fromEntries(availableIds.map(id=>[id,{...pages[id],title:'EN '+id}]))}};
 // RU absence is represented by a missing page, EN absence by no translation.
 if(locale==='ru')for(const id of Object.keys(pages))if(!availableIds.includes(id))delete pages[id];
 const data={groups,pages,translations,settings:{showOverviewPage:enabled}};
 const handlers={},elements={},redirects=[];
 const element=id=>({textContent:id==='document-data'?JSON.stringify(data):'',innerHTML:'',focus(){},setAttribute(){},classList:{remove(){},toggle(){}},addEventListener(type,fn){handlers[id+':'+type]=fn;},querySelectorAll(){return[];},querySelector(){return null;}});
 for(const id of ['document-data','main','sidebar','menu-button'])elements[id]=element(id);
 const location={hash:policy.url(locale),search:'?audience='+audience,pathname:'/docs/index.html'};
 const sandbox={URLSearchParams,document:{getElementById:id=>id==='documentation-search'?null:elements[id]||element(id),addEventListener(){},title:''},location,window:{scrollTo(){},addEventListener(type,fn){handlers[type]=fn;}},history:{replaceState(_s,_t,url){redirects.push(url);location.hash=url.slice(url.indexOf('#'));}},requestAnimationFrame:fn=>fn()};
 let source=fs.readFileSync(path.join(root,'src/offline-template.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 source=source.replace('/* DOCUMENT_LOCALES */',fs.readFileSync(path.join(root,'src/components/document-locales.cjs'),'utf8'));
 vm.runInNewContext(source,sandbox);
 return {elements,redirects,location,sandbox,handlers};
}
for(const locale of ['ru','en']){
 test('standalone enabled overview is in navigation and is the landing page: '+locale,()=>{
  const {elements,redirects}=reader(locale,true);
  assert.equal(redirects.length,0);assert.match(elements.sidebar.innerHTML,/home-link/);
  assert.match(elements.main.innerHTML,/overview-grid/);
 });
 test('standalone disabled overview redirects once to first available page and is absent from navigation: '+locale,()=>{
  const {elements,redirects}=reader(locale,false);
  assert.deepEqual(redirects,[policy.url(locale,'first')]);
  assert.doesNotMatch(elements.sidebar.innerHTML,/home-link|Об этом документе|About this document/);
  assert.doesNotMatch(elements.main.innerHTML,/overview-grid/);
  assert.match(elements.main.innerHTML,/Content first/);
 });
 test('standalone ignores unavailable pages and uses fallback without a redirect loop: '+locale,()=>{
  assert.deepEqual(reader(locale,false,'business',['second']).redirects,[policy.url(locale,'second')]);
  const result=reader(locale,false,'business',[]);
  assert.equal(result.redirects.length,0);assert.match(result.elements.main.innerHTML,/overview-grid/);
  result.handlers.hashchange();assert.equal(result.redirects.length,0);
  assert.doesNotMatch(result.elements.sidebar.innerHTML,/home-link/);
 });
}
test('Docusaurus sidebars include the overview only when enabled for both locales',()=>{
 const source=fs.readFileSync(path.join(root,'sidebars.js'),'utf8');
 for(const locale of ['ru','en'])for(const showOverviewPage of [true,false]){
  const context={module:{exports:{}},process:{env:{DOCUSAURUS_CURRENT_LOCALE:locale}},__dirname:root,require:id=>id==='./src/components/navigation.json'?groups:id==='./src/content/documentation-settings.json'?{showOverviewPage}:id==='./src/components/document-locales.cjs'?policy:id==='node:path'?path:id==='node:fs'?{existsSync:()=>false}:null};
  vm.runInNewContext(source,context);
  assert.equal(context.module.exports.docs.includes('index'),showOverviewPage);
 }
});

test('Docusaurus availability excludes missing files and English placeholders',()=>{
 const source=fs.readFileSync(path.join(root,'scripts/lib/documentation-availability.cjs'),'utf8');
 const contents={'/site/docs/first.md':'First','/site/docs/second.mdx':'Second','/site/i18n/en/docusaurus-plugin-content-docs/current/first.md':'<EnglishUnavailable page="first" />','/site/i18n/en/docusaurus-plugin-content-docs/current/second.mdx':'English content'};
 const context={module:{exports:{}},require:id=>id==='node:path'?path:{existsSync:p=>p in contents,readFileSync:p=>contents[p]}};
 vm.runInNewContext(source,context);
 const availableFor=locale=>context.module.exports.documentationAvailability('/site',groups,locale);
 assert.deepEqual(Object.keys(availableFor('ru')),['first','second']);
 assert.deepEqual(Object.keys(availableFor('en')),['second']);
 assert.equal(policy.landingPage({showOverviewPage:false},groups,'business',availableFor('en')),'second');
});

test('Docusaurus root redirect respects base path, locale, audience and fallback',()=>{
 const {transformSync}=require('@babel/core');
 const source=fs.readFileSync(path.join(root,'src/components/OverviewGate.jsx'),'utf8');
 const code=transformSync(source,{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-react-jsx','@babel/plugin-transform-modules-commonjs']}).code;
 const React=require('react'),Redirect=()=>null;
 for(const locale of ['ru','en'])for(const enabled of [true,false])for(const empty of [true,false]){
  const search='?audience=business',base='/CloudPayments_documentation/'+(locale==='en'?'en/':'');
  const context={exports:{},URLSearchParams,require:id=>id==='react'?React:id==='@docusaurus/router'?{Redirect,useLocation:()=>({search})}:id==='@docusaurus/useBaseUrl'?p=>base+p.replace(/^\//,''):id==='@docusaurus/useGlobalData'?{usePluginData:()=>empty?{}:available}:id.endsWith('documentation-settings.json')?{showOverviewPage:enabled}:policy};
  vm.runInNewContext(code,context);
  const result=context.exports.default({groups,children:'overview'});
  if(enabled||empty)assert.equal(result,'overview');
  else{assert.equal(result.type,Redirect);assert.equal(result.props.to.pathname,base+'first/');assert.equal(result.props.to.search,search);}
 }
});
