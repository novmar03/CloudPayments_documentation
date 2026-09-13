const test = require('node:test');
const assert = require('node:assert/strict');
const {prepareEditorRenderData} = require('../scripts/lib/editor-render-data.cjs');

test('render data deduplicates images without changing source or text', () => {
  const image = Buffer.from('GIF89a-example');
  const segment = '<p id="якорь">Текст</p><img src="data:image/gif;base64,'+image.toString('base64')+'" alt="Пример">';
  const input = {page:{segments:[segment,segment],html:'full HTML',content:{privateNote:'editor-only'},toc:[]}};
  const before = JSON.stringify(input);
  const {pages,assets,embeddedBytes} = prepareEditorRenderData(input);
  assert.equal(JSON.stringify(input),before);
  assert.equal(assets.size,1);
  assert.equal(embeddedBytes,image.length*2);
  const [filename,data] = [...assets][0];
  assert.ok(filename.endsWith('.gif'));
  assert.deepEqual(data,image);
  assert.deepEqual(Object.keys(pages.page),['segments']);
  assert.equal(pages.page.segments[0].replace('__EDITOR_ASSET__/'+filename,'data:image/gif;base64,'+image.toString('base64')),segment);
});

test('external images, links and empty pages are preserved', () => {
  const segment = '<a href="#якорь">Ссылка</a><img src="https://example.com/image.png">';
  const {pages,assets} = prepareEditorRenderData({empty:{},page:{segments:[segment]}});
  assert.deepEqual(pages,{empty:{segments:[]},page:{segments:[segment]}});
  assert.equal(assets.size,0);
});
