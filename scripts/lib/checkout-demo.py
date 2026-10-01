"""Embed the wrapper and isolated frame without rebuilding published content."""
import json

def checkout_demo(root):
    folder = root / 'static/checkout-demo'
    frame = (folder / 'index.html').read_text().replace('<script src="form.js"></script>', '<script>' + (folder / 'form.js').read_text() + '</script>')
    return '<script>window.CPCheckoutFrame=' + json.dumps(frame, ensure_ascii=False).replace('<', '\\u003c') + ';\n' + (folder / 'demo.js').read_text() + '\n' + (folder / 'standalone.js').read_text() + '</script>'
