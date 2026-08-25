"""Server local para la landing.

Un `python -m http.server` pelado NO resuelve las pretty URLs de netlify.toml
(/reclamos-vecinales -> /reclamos-vecinales.html) y la navegacion interna da 404.
Este server espeja esa regla de forma generica: si el path no tiene extension y
existe `<path>.html`, sirve ese archivo.

Uso:  python serve.py [puerto]      (default 8123, desde cualquier cwd)
"""
import http.server
import os
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        full = super().translate_path(path)
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if not os.path.exists(full) and '.' not in os.path.basename(clean):
            candidate = full.rstrip('/\\') + '.html'
            if os.path.exists(candidate):
                return candidate
        return full


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print('Landing local en http://localhost:%d' % port)
    http.server.ThreadingHTTPServer(('', port), Handler).serve_forever()
