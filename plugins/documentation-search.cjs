const {execFileSync} = require('node:child_process');
const path = require('node:path');
module.exports = function(context) {
  return {
    name:'cloudpayments-documentation-search',
    async loadContent() {
      execFileSync('python3', [path.join(context.siteDir,'scripts/export-html.py'),
        '--output',path.join(context.generatedFilesDir,'search-source.html'),
        '--search-index',path.join(context.siteDir,'static/search-index.json')], {cwd:context.siteDir});
    },
  };
};
