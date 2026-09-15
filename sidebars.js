const english=process.env.DOCUSAURUS_CURRENT_LOCALE==='en';
const fs=require('node:fs');const path=require('node:path');
const sourceNavigation=require('./src/components/navigation.json');
const navigation=english?require('./src/components/document-locales.cjs').view({groups:sourceNavigation,pages:{}},'en').groups:sourceNavigation;
const editorPagesPath=path.join(__dirname,'src/content/editor-pages'+(english?'.en':'')+'.json');
const editorPages=fs.existsSync(editorPagesPath)?JSON.parse(fs.readFileSync(editorPagesPath,'utf8')):{};
function apiOutline(){
 const file=path.join(__dirname,'docs/tech/api.md');
 const used=new Map();
 const headings=editorPages['tech/api']?.toc||(english?[]:[...(fs.existsSync(file)?fs.readFileSync(file,'utf8'):'').matchAll(/^(#{2,6}) (.+)$/gm)].map(([,h,t])=>{const slug=t.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu,'').replace(/ /g,'-');const n=used.get(slug)||0;used.set(slug,n+1);return {level:h.length,title:t,id:slug+(n?'-'+n:'')};}));
 const root=[],stack=[{level:1,items:root}];
 headings.forEach((h,i)=>{while(stack.length>1&&stack.at(-1).level>=h.level)stack.pop();const link={type:'link',label:h.title,href:'/tech/api/#'+encodeURIComponent(h.id),autoAddBaseUrl:true};if(headings[i+1]?.level>h.level){const category={type:'category',label:h.title,collapsed:true,items:[]};stack.at(-1).items.push(category);stack.push({level:h.level,items:category.items});}else stack.at(-1).items.push(link);});return root;
}
function sidebarItems(items,parentId){return items.filter(p=>p.parentId===parentId).map(p=>{
 const children=items.filter(child=>child.parentId===p.id);
 if(children.length)return {type:'category',label:p.title,link:{type:'doc',id:p.id},collapsed:true,items:sidebarItems(items,p.id)};
 return p.id==='tech/api'?{type:'category',label:p.title,link:{type:'doc',id:p.id},collapsed:true,items:apiOutline()}:p.id;
});}
module.exports={docs:['index',...navigation.filter(g=>g.items.length).map(g=>({type:'category',label:g.title,collapsed:true,items:sidebarItems(g.items)}))]};
