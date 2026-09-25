const fs=require('node:fs');
const path=require('node:path');

// A translated placeholder has a route but is not an available landing page.
function documentationAvailability(root,groups,locale){
 const directory=locale==='en'?'i18n/en/docusaurus-plugin-content-docs/current':'docs';
 const available={};
 for(const page of groups.flatMap(g=>g.items).filter(p=>p.type!=='category')){
  const file=['.md','.mdx'].map(ext=>path.join(root,directory,page.id+ext)).find(p=>fs.existsSync(p));
  if(file&&!/<EnglishUnavailable\b/.test(fs.readFileSync(file,'utf8')))available[page.id]=true;
 }
 return available;
}
module.exports={documentationAvailability};
