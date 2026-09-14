const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const assets = new Map();
function save(bytes, extension) {
  const name = createHash('sha256').update(bytes).digest('hex') + '.' + extension;
  const relative = 'static/img/editor/' + name;
  assets.set(relative, bytes);
  return relative;
}
function externalize(text) {
  return text.replace(/data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+)/g,
    (_, type, encoded) => save(Buffer.from(encoded, 'base64'), type === 'jpeg' ? 'jpg' : type));
}

// Optionally retain every uploaded draft asset, including currently unused ones.
// This reads the draft branch without checking it out or modifying it.
const editor = process.argv[2];
if (editor) {
  const files = execFileSync('git', ['-C', editor, 'ls-tree', '-r', '--name-only', 'origin/documentation-drafts', 'editor-assets'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
  for (const file of files) {
    if (!/^editor-assets\/[a-f0-9-]+\.(png|jpg|gif|webp)$/.test(file)) continue;
    save(execFileSync('git', ['-C', editor, 'show', 'origin/documentation-drafts:' + file], {maxBuffer:20 * 1024 * 1024}), path.extname(file).slice(1));
  }
}
const files = ['src/content/editor-pages.json', 'index.html'];
const writes = files.map(file => [file, externalize(fs.readFileSync(path.join(root, file), 'utf8'))]);
fs.mkdirSync(path.join(root, 'static/img/editor'), {recursive:true});
for (const [file, bytes] of assets) fs.writeFileSync(path.join(root, file), bytes);
for (const [file, text] of writes) fs.writeFileSync(path.join(root, file), text);
console.log(JSON.stringify({images:assets.size, files}));
