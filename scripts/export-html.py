from pathlib import Path
import argparse, re, json, html, base64

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT
parser = argparse.ArgumentParser(description='Build a standalone HTML documentation file.')
parser.add_argument('--output', type=Path, default=ROOT / 'index.html')
args = parser.parse_args()
groups = json.loads((SOURCE / 'src/components/navigation.json').read_text())
pages = {}
EDITOR_PAGES_FILE = ROOT / 'src/content/editor-pages.json'
editor_pages = json.loads(EDITOR_PAGES_FILE.read_text()) if EDITOR_PAGES_FILE.exists() else {}
internal_links = []
api_data = json.loads((ROOT/'src/content/api-fragments.json').read_text(encoding='utf-8'))

def imported_section(section):
    content = api_data['fragments'][section]['html']
    def rewrite_tag(match):
        tag = match[0]
        link = re.search(r'href="https://developers\.cloudpayments\.ru/#([^"]+)"', tag)
        if not link: return tag
        destination = api_data['linkTargets'].get(link[1])
        if not destination: return tag
        route, anchor = destination['route'], destination['anchor']
        internal_links.append((route, anchor))
        url = '#/' + route + ('@' + anchor if anchor else '')
        tag = tag.replace(link[0], 'href="' + html.escape(url, quote=True) + '"')
        return re.sub(r'\s(?:target|rel)="[^"]*"', '', tag)
    return '<div class="imported-api">' + re.sub(r'<a\b[^>]*>', rewrite_tag, content) + '</div>'

def target(url):
    if url.startswith('/'):
        route, _, anchor = url.strip('/').partition('#')
        route = route.rstrip('/')
        internal_links.append((route, anchor))
        return '#/' + route + (('@' + anchor) if anchor else '')
    return url

def inline(text):
    saved = []
    def keep(value):
        saved.append(value)
        return '\x00' + str(len(saved)-1) + '\x00'
    def image(m):
        p = SOURCE / 'static' / m[2].lstrip('/')
        if not p.is_file(): raise ValueError(str(p))
        src = 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode()
        return keep('<img class="doc-image" alt="'+html.escape(m[1],quote=True)+'" src="'+src+'">')
    text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', image, text)
    text = re.sub(r'`([^`]+)`', lambda m: keep('<code>'+html.escape(m[1])+'</code>'), text)
    def link(m):
        url = target(m[2])
        extra = ' target="_blank" rel="noopener noreferrer"' if url.startswith('https://') else ''
        return keep('<a href="'+html.escape(url,quote=True)+'"'+extra+'>'+html.escape(m[1])+'</a>')
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,text)
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',text)
    for i, value in enumerate(saved): text = text.replace('\x00'+str(i)+'\x00',value)
    return text

def render(body):
    lines=body.splitlines(); output=[]; toc=[]; ids={}; i=0
    while i<len(lines):
        line=lines[i]
        if not line.strip(): i+=1;continue
        if line.startswith('import ImportedApiSection '): i+=1;continue
        component = re.fullmatch(r'<ImportedApiSection section="([^"]+)" />', line)
        if component:
            output.append(imported_section(component[1])); i+=1; continue
        if line.startswith('```'):
            lang=line[3:];code=[];i+=1
            while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
            output.append('<div class="code-label">'+html.escape(lang)+'</div><pre><code>'+html.escape('\n'.join(code))+'</code></pre>');i+=1;continue
        m=re.match(r'^(#{1,6}) (.+)',line)
        if m:
            level=len(m[1]); title=m[2]; anchor=re.sub(r'[^\w\s-]','',title.lower()).replace(' ','-')
            n=ids.get(anchor,0);ids[anchor]=n+1
            if n:anchor+='-'+str(n)
            toc.append({'level':level,'title':title,'id':anchor})
            output.append(f'<h{level} id="{html.escape(anchor)}">{html.escape(title)}</h{level}>');i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                parts=lines[i].strip().strip('|').split('|')
                if not all(re.fullmatch(r'[\s:-]+',p) for p in parts):rows.append(parts)
                i+=1
            table='<div class="table-scroll"><table><thead><tr>'+''.join('<th>'+inline(c.strip())+'</th>' for c in rows[0])+'</tr></thead><tbody>'
            for row in rows[1:]:table+='<tr>'+''.join('<td>'+inline(c.strip())+'</td>' for c in row)+'</tr>'
            output.append(table+'</tbody></table></div>');continue
        if re.match(r'^[-*] ',line):
            items=[]
            while i<len(lines) and re.match(r'^[-*] ',lines[i]):items.append('<li>'+inline(lines[i][2:])+'</li>');i+=1
            output.append('<ul>'+''.join(items)+'</ul>');continue
        paragraph=[]
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```)',lines[i]):paragraph.append(lines[i]);i+=1
        output.append('<p>'+inline(' '.join(paragraph))+'</p>')
    return ''.join(output),toc

for g in groups:
    for item in g['items']:
        if item['id'] in editor_pages:
            edited = editor_pages[item['id']]
            pages[item['id']] = {**item, 'group': g['id'], 'title': edited['title'], 'html': edited['html'], 'toc': edited['toc']}
            continue
        raw=(SOURCE/'docs'/(item['id']+'.md')).read_text()
        body=re.sub(r'^---\n.*?\n---\n','',raw,flags=re.S)
        content,toc=render(body)
        pages[item['id']]={**item,'group':g['id'],'html':content,'toc':toc}

for route,anchor in internal_links:
    assert route in pages, route
    if anchor: assert 'id="'+html.escape(anchor,quote=True)+'"' in pages[route]['html'], (route,anchor)

template=(ROOT/'src/offline-template.html').read_text(encoding='utf-8')
template=template.replace('/* IMPORTED_API_CSS */', (ROOT/'src/css/imported-api.css').read_text(encoding='utf-8'))
template=template.replace('/* DOCUMENT_UI */', (ROOT/'src/components/document-ui.js').read_text(encoding='utf-8'))
for placeholder, filename in [('__FAVICON_DATA_URI__', 'favicon.svg'), ('__LOGO_DATA_URI__', 'cloudpayments-logo.svg')]:
    asset = (ROOT/'static'/filename).read_bytes()
    template = template.replace(placeholder, 'data:image/svg+xml;base64,' + base64.b64encode(asset).decode('ascii'))
data=json.dumps({'groups':groups,'pages':pages},ensure_ascii=False).replace('<','\\u003c')
out=args.output
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(template.replace('/* DOCUMENT_DATA */',data), encoding='utf-8')
print(json.dumps({'file':str(out),'pages':len(pages),'internal_links':len(internal_links),'bytes':out.stat().st_size},ensure_ascii=False))
