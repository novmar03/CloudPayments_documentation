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
  querySelectorAll() {return [];},
});
const elements = Object.fromEntries(['document-data', 'main', 'sidebar', 'menu-button'].map(id => [id, element(id)]));
let outlineHtml = '', outlineLinks = [];
elements.sidebar.querySelectorAll = () => {
  if (outlineHtml !== elements.sidebar.innerHTML) {
    outlineHtml = elements.sidebar.innerHTML;
    outlineLinks = [...outlineHtml.matchAll(/data-page-anchor="([^"]+)"/g)].map(([, anchor]) => ({
      dataset: {pageAnchor: anchor}, attributes: {}, active: false,
      setAttribute(name, value) {this.attributes[name] = value;},
      removeAttribute(name) {delete this.attributes[name];},
      classList: {toggle(name, value) {this.owner.active = value;}},
    }));
    outlineLinks.forEach(link => {link.classList.owner = link;});
  }
  return outlineLinks;
};
const sandbox = {
  document: {getElementById: id => id === 'documentation-search' ? null : elements[id] || element(id), addEventListener() {}, title: ''},
  location: {hash: '#/'}, history: {replaceState() {}},
  window: {scrollTo() {}, addEventListener(event, callback) {handlers[event] = callback;}},
  requestAnimationFrame: callback => callback(),
};
vm.createContext(sandbox);
new vm.Script(code).runInContext(sandbox);
assert(elements.main.innerHTML.includes('Об этом документе'));
for (const audience of ['business', 'developer', 'all']) {
  handlers['main:click']({target: {closest: selector => selector === '[data-audience]' ? {dataset: {audience}} : null}});
  const visible = data.groups.filter(group => !group.hidden && group.items.length && (audience === 'all' || [audience, 'both'].includes(group.audience)));
  for (const group of data.groups) {
    assert.equal(elements.main.innerHTML.includes(`id="section-${group.id}"`), visible.includes(group));
  }

}
const ids = data.groups.flatMap(group => group.items.map(item => item.id));
assert.equal(ids.length, new Set(ids).size);
let apiSidebarChecked = false;
for (const id of ids) {
  assert(data.pages[id], `Page missing: ${id}`);
  assert(fs.existsSync(path.join(root, 'docs', `${id}.md`)));
  sandbox.location.hash = `#/${id}`;
  handlers.hashchange();
  if (id === 'tech/api' && !apiSidebarChecked) {
    assert(elements.sidebar.innerHTML.includes('>Бизнес-сценарии оплаты (технические аспекты)</a></summary>'));
    assert(elements.sidebar.innerHTML.includes('>Двухстадийная оплата</a></summary>'));
    assert(elements.sidebar.innerHTML.includes('>Возврат денег</a></summary>'));
    assert(!/<details class="nested-outline" open/.test(elements.sidebar.innerHTML));
    apiSidebarChecked = true;
  }
  assert.equal(sandbox.document.title, `${data.pages[id].title} · CloudPayments`);
  assert(elements.main.innerHTML.includes(data.pages[id].html));
  for (const heading of data.pages[id].toc) {
    assert(data.pages[id].html.includes(`id="${heading.id}"`));
    sandbox.location.hash = `#/${id}@${encodeURIComponent(heading.id)}`;
    handlers.hashchange();
    if (id === 'tech/api') {
      assert(elements.sidebar.innerHTML.includes(`href="#/${id}@${encodeURIComponent(heading.id)}"`));
      const activeLinks = outlineLinks.filter(link => link.active);
      assert.equal(activeLinks.length, 1);
      assert.equal(activeLinks[0].dataset.pageAnchor, heading.id);
      assert.equal(activeLinks[0].attributes['aria-current'], 'location');
    }
  }
}
sandbox.location.hash = '#/';
handlers.hashchange();
assert(elements.main.innerHTML.includes('Об этом документе'));
assert(outlineLinks.every(link => !link.active));
assert(!/<script[^>]+src=|<link[^>]+href="(?!data:)|<img[^>]+src="(?!data:)/.test(html));
console.log(`Verified ${ids.length} pages, all audience filters, heading anchors and offline assets.`);
