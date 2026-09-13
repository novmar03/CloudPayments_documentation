const {prepareEditorRenderData} = require('../../scripts/lib/editor-render-data.cjs');

module.exports = function(source) {
  this.cacheable?.();
  const {pages, assets} = prepareEditorRenderData(JSON.parse(source));
  for (const [name, data] of assets) this.emitFile('assets/editor-media/' + name, data);
  return 'module.exports = ' + JSON.stringify(pages) + ';';
};
