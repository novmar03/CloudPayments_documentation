const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(path.join(process.env.PLAYWRIGHT_ROOT,'node_modules/playwright'));
const delay=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const server=spawn('python3',['-m','http.server','4174','--bind','127.0.0.1'],{stdio:'inherit'});
 let browser;
 const nativeServer=require('node:http').createServer((req,res)=>{const raw=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/CloudPayments_documentation\//,'');let file=path.resolve('build',raw);if(!file.startsWith(path.resolve('build')+path.sep)&&file!==path.resolve('build')){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}}).listen(4175,'127.0.0.1');
 try{
  const base='http://127.0.0.1:4174/';
  for(let n=0;n<100;n++){try{if((await fetch(base)).ok)break;}catch{}await delay(200);}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1468,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'#/tech/api');
  await page.locator('#main article').waitFor();
  const russian=await page.locator('#main article').innerText();
  await page.locator('#language-picker summary').click();
  await page.locator('#language-picker [data-language="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.ok(page.url().endsWith('#/en/tech/api'));
  await page.getByText('The English version of this page has not been published yet.').waitFor();
  const search=page.getByPlaceholder('Search documentation');
  await search.fill('PublicId');
  await page.getByText('No results. Try another word.').waitFor();
  await search.press('Escape');
  await page.getByRole('link',{name:'Read in Russian',exact:true}).click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  assert.equal(await page.locator('#main article').innerText(),russian);
  await page.goto(base+'#/');
  const globe=await page.locator('#language-picker summary').boundingBox(),input=await page.locator('#documentation-search').boundingBox();
  assert.ok(globe.x+globe.width<=input.x+1,'Globe must appear to the left of search');
  fs.mkdirSync('test-artifacts',{recursive:true});
  await page.locator('#language-picker summary').click();
  await page.screenshot({path:'test-artifacts/documentation-language-menu.png',fullPage:false});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-artifacts/documentation-language-menu-mobile.png',fullPage:false});
  await page.setViewportSize({width:1468,height:900});
  await page.goto('http://127.0.0.1:4175/CloudPayments_documentation/tech/api/');
  await page.locator('.navbar .language-picker summary').click();
  await page.locator('.navbar .language-picker a[lang="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.getByText('The English version of this page has not been published yet.').waitFor();
  assert.ok(page.url().endsWith('/en/tech/api/'));
  await page.screenshot({path:'test-artifacts/native-english-page.png',fullPage:false});
  await page.getByRole('link',{name:'Read in Russian',exact:true}).click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  assert.ok(page.url().endsWith('/tech/api/')&&!page.url().includes('/en/'));
  assert.deepEqual(errors,[]);
  console.log('Browser verified: globe placement, route-preserving switching, English search, missing translation and Russian restoration.');
 }finally{await browser?.close();server.kill();nativeServer.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
