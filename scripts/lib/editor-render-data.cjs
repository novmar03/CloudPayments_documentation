const {createHash} = require('node:crypto');

/** Preserve source JSON; derive only the HTML fragments needed by readers. */
function prepareEditorRenderData(pages) {
  const assets = new Map();
  const renderPages = {};
  let embeddedBytes = 0;
  for (const [id, page] of Object.entries(pages)) {
    renderPages[id] = {segments:(page.segments || []).map(segment => segment.replace(
      /\bsrc=(["'])data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=\s]+)\1/g,
      (_, quote, mime, encoded) => {
        const data = Buffer.from(encoded.replace(/\s/g, ''), 'base64');
        embeddedBytes += data.length;
        const name = createHash('sha256').update(data).digest('hex') + '.' + (mime === 'jpeg' ? 'jpg' : mime);
        assets.set(name, data);
        return 'src=' + quote + '__EDITOR_ASSET__/' + name + quote;
      }
    ))};
  }
  return {pages:renderPages, assets, embeddedBytes};
}

module.exports = {prepareEditorRenderData};
