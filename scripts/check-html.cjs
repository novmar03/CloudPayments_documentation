const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const json = html.match(/<script id="document-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
const data = JSON.parse(json);
const code = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
assert.deepEqual(data.groups, JSON.parse(fs.readFileSync(path.join(root, 'src/components/navigation.json'), 'utf8')));
const handlers = {};
const element = id => ({
  textContent: id === 'document-data' ? json : '', innerHTML: '',
  focus() {}, scrollIntoView() {}, setAttribute() {},
  classList: {remove() {}, toggle() {return true;}},
  addEventListener(event, callback) {handlers[`${id}:${event}`] = callback;},
  querySelector() {return {focus() {}};},
});
const elements = Object.fromEntries(['document-data', 'main', 'sidebar', 'menu-button'].map(id => [id, element(id)]));
const sandbox = {
  document: {getElementById: id => elements[id] || element(id), addEventListener() {}, title: ''},
  location: {hash: '#/'}, history: {replaceState() {}},
  window: {scrollTo() {}, addEventListener(event, callback) {handlers[event] = callback;}},
  requestAnimationFrame: callback => callback(),
};
vm.createContext(sandbox);
new vm.Script(code).runInContext(sandbox);
assert(elements.main.innerHTML.includes('Об этом документе'));
for (const audience of ['business', 'developer', 'all']) {
  handlers['main:click']({target: {closest: () => ({dataset: {audience}})}});
  const visible = data.groups.filter(group => audience === 'all' || [audience, 'both'].includes(group.audience));
  for (const group of data.groups) {
    assert.equal(elements.main.innerHTML.includes(`id="section-${group.id}"`), visible.includes(group));
  }
  assert(elements.main.innerHTML.includes('id="section-scenarios"'));
}
const ids = data.groups.flatMap(group => group.items.map(item => item.id));
assert.equal(ids.length, new Set(ids).size);
for (const id of ids) {
  assert(data.pages[id], `Page missing: ${id}`);
  assert(fs.existsSync(path.join(root, 'docs', `${id}.md`)));
  sandbox.location.hash = `#/${id}`;
  handlers.hashchange();
  assert.equal(sandbox.document.title, `${data.pages[id].title} · CloudPayments`);
  assert(elements.main.innerHTML.includes(data.pages[id].html));
  for (const heading of data.pages[id].toc) {
    assert(data.pages[id].html.includes(`id="${heading.id}"`));
    sandbox.location.hash = `#/${id}@${encodeURIComponent(heading.id)}`;
    handlers.hashchange();
  }
}
sandbox.location.hash = '#/';
handlers.hashchange();
assert(elements.main.innerHTML.includes('Об этом документе'));
assert(!/<script[^>]+src=|<link[^>]+href="(?!data:)|<img[^>]+src="(?!data:)/.test(html));
console.log(`Verified ${ids.length} pages, all audience filters, heading anchors and offline assets.`);
