const path = require('node:path');

module.exports = function() {
  return {
    name:'cloudpayments-editor-render-data',
    configureWebpack() {
      return {module:{rules:[{
        test:/editor-pages\.json$/,
        resourceQuery:/render/,
        type:'javascript/auto',
        use:[path.join(__dirname, 'loaders/editor-render-data.cjs')],
      }]}};
    },
  };
};
