const path=require('node:path');
const {documentationAvailability}=require('../scripts/lib/documentation-availability.cjs');
module.exports=function(context){
 return {
  name:'documentation-overview',
  getPathsToWatch(){return ['docs/**/*.{md,mdx}','i18n/en/docusaurus-plugin-content-docs/current/**/*.{md,mdx}','src/components/navigation.json'].map(p=>path.join(context.siteDir,p));},
  async loadContent(){const groups=JSON.parse(require('node:fs').readFileSync(path.join(context.siteDir,'src/components/navigation.json'),'utf8'));return documentationAvailability(context.siteDir,groups,context.i18n.currentLocale);},
  async contentLoaded({content,actions}){actions.setGlobalData(content);},
 };
};
