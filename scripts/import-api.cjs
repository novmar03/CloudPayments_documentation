// Import the user-supplied saved CloudPayments HTML without rewriting its content.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cheerio = require('cheerio');
const Prism = require('prismjs');
require('prismjs/components/prism-json');
require('prismjs/components/prism-bash');
const root = path.resolve(__dirname, '..');
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-api.cjs saved-documentation.htm');
const source = fs.readFileSync(input, 'utf8');
const $ = cheerio.load(source);
const api = $('#api');
assert.equal(api.length, 1, 'Expected the source API chapter');
const sections = {intro: {title: 'API', nodes: []}};
let current = 'intro';
api.nextUntil('h1').each((_, node) => {
  if (node.tagName === 'h2') {
    current = $(node).attr('id');
    sections[current] = {title: $(node).text(), nodes: []};
  } else sections[current].nodes.push($.html(node));
});
const slug = text => text.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/ /g, '-');
const docs = {};
for (const route of ['tech/api', 'tech/orders', 'tech/notifications']) {
  docs[route] = fs.readFileSync(path.join(root, 'docs', `${route}.md`), 'utf8')
    .replace(/^import ImportedApiSection[^\n]*\n/gm, '')
    .replace(/^<ImportedApiSection section="[^"]+" \/>\n/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}
const aliases = {'Оплата по токену (рекарринг)': 'Рекарринг'};
const moved = {
  'sozdanie-scheta-dlya-otpravki-po-pochte': {route: 'tech/orders', title: 'Создание заказов с помощью API'},
  'otmena-sozdannogo-scheta': {route: 'tech/orders', title: 'Отмена созданного заказа'},
  'prosmotr-nastroek-uvedomleniy': {route: 'tech/notifications', title: 'Просмотр настроек уведомлений'},
  'izmenenie-nastroek-uvedomleniy': {route: 'tech/notifications', title: 'Изменение настроек уведомлений'},
};
const targets = {api: {route: 'tech/api', anchor: ''}};
const fragments = {};
const used = new Set();
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const normalize = text => text.replace(/\s+/g, ' ').trim();
const totals = {chapters: 0, codeBlocks: 0, tables: 0, callouts: 0, links: 0};
for (const [id, section] of Object.entries(sections)) {
  const title = aliases[section.title] || section.title;
  const destination = id === 'intro' ? {route: 'tech/api', title: '', level: 1} : (moved[id] || {route: 'tech/api', title});
  if (id !== 'intro') {
    const heading = [...docs[destination.route].matchAll(/^(#{2,4}) (.+)$/gm)].find(m => m[2] === destination.title);
    assert(heading, `Missing destination heading: ${id}`);
    destination.level = heading[1].length;
    targets[id] = {route: destination.route, anchor: slug(destination.title)};
  }
  const raw = section.nodes.join('\n');
  const fragment = cheerio.load(raw, null, false);
  const originalText = normalize(fragment.root().text());
  const originalCodes = fragment('pre code').toArray().map(n => fragment(n).text());
  const originalLinks = fragment('a[href]').toArray().map(n => fragment(n).attr('href'));
  const counts = {codeBlocks: originalCodes.length, tables: fragment('table').length, callouts: fragment('aside').length, links: originalLinks.length};
  assert.equal(fragment('script,iframe,form,input,select,img,video').length, 0, 'Unexpected embedded resource: inspect before importing');
  fragment('*').each((_, node) => {
    for (const name of Object.keys(node.attribs || {})) if (/^on/i.test(name) || name === 'style') fragment(node).removeAttr(name);
    const nodeId = fragment(node).attr('id');
    // The original page has an extra duplicate 3-D Secure anchor before its heading.
    if (nodeId && sections[nodeId]) fragment(node).removeAttr('id');
    else if (nodeId) targets[nodeId] = {route: destination.route, anchor: nodeId};
  });
  fragment('h3,h4').each((_, node) => {node.tagName = `h${Math.min(destination.level + 1, 6)}`;node.name = node.tagName;});
  fragment('a[href]').each((_, node) => {
    const link = fragment(node), href = link.attr('href');
    assert(!/^(javascript|data):/i.test(href), 'Unsafe source hyperlink');
    if (/^https?:/.test(href)) link.attr('target', '_blank').attr('rel', 'noopener noreferrer');
  });
  // These assertions run before adding interface labels, so all visible source text is checked.
  assert.equal(normalize(fragment.root().text()), originalText, `Text changed: ${id}`);
  fragment('pre').each((index, node) => {
    const pre = fragment(node), code = pre.find('code').first();
    const text = code.text();
    let language = 'text';
    try {JSON.parse(text);language = 'json';} catch {}
    if (/^\s*</.test(text)) language = 'markup';
    else if (/^\s*curl\s/m.test(text)) language = 'bash';
    const codeId = `api-code-${id}-${index + 1}`;
    if (Prism.languages[language]) code.html(Prism.highlight(text, Prism.languages[language], language));
    code.attr('id', codeId).attr('class', `language-${language}`);
    pre.attr('class', 'api-code');
    pre.wrap('<div class="api-code-block"></div>');
    pre.before(`<div class="api-code-toolbar"><span>${language === 'markup' ? 'HTML' : language.toUpperCase()}</span><button type="button" data-copy-code="${codeId}" data-copy-state="ready" aria-label="Копировать код" title="Копировать код"><svg class="api-copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="12" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg><svg class="api-copy-success" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span class="api-copy-status" data-copy-status role="status" aria-live="polite"></span></button></div>`);
  });
  fragment('table').wrap('<div class="api-table-scroll" tabindex="0" aria-label="Таблица параметров"></div>');
  fragment('aside').addClass('api-callout').attr('role', 'note');
  assert.deepEqual(fragment('pre code').toArray().map(n => fragment(n).text()), originalCodes, `Code changed: ${id}`);
  assert.deepEqual(fragment('a[href]').toArray().map(n => fragment(n).attr('href')), originalLinks, `Links changed: ${id}`);
  const forAudit = cheerio.load(fragment.html(), null, false);
  forAudit('.api-code-toolbar').remove();
  assert.equal(normalize(forAudit.root().text()), originalText, `Content changed: ${id}`);
  fragments[id] = {sourceTitle: section.title, destination, html: fragment.html(), audit: {textSha256: hash(originalText), codeSha256: originalCodes.map(hash), ...counts}};
  used.add(id);
  if (id !== 'intro') totals.chapters++;
  for (const key of Object.keys(counts)) totals[key] += counts[key];
}
assert.equal(used.size, Object.keys(sections).length);
for (const [route, markdown] of Object.entries(docs)) {
  let output = markdown.replace(/^(---\n[\s\S]*?\n---\n)/, '$1\nimport ImportedApiSection from \'@site/src/components/ImportedApiSection\';\n');
  if (route === 'tech/api') output = output.replace(/\n(?=## )/, '\n<ImportedApiSection section="intro" />\n\n');
  output = output.replace(/^(#{2,4}) (.+)$/gm, (line, hashes, title) => {
    const match = Object.entries(fragments).find(([id, data]) => id !== 'intro' && data.destination.route === route && data.destination.title === title);
    return match ? `${line}\n\n<ImportedApiSection section="${match[0]}" />` : line;
  });
  fs.writeFileSync(path.join(root, 'docs', `${route}.md`), output.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
}
fs.mkdirSync(path.join(root, 'src/content'), {recursive: true});
const result = {source: 'User-provided документация CP.htm.zip', sourceSha256: hash(source), totals, linkTargets: targets, fragments};
fs.writeFileSync(path.join(root, 'src/content/api-fragments.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(totals));
