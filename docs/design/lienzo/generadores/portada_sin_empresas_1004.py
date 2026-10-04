"""Etapa 7 (plan aprobado el 2026-10-04):
- Landing y Landing-Movil suman el estado «Sin empresas» en la sección «Empresas en ArquitecturaBase» (decisión 5 del usuario): en
  lugar de las tarjetas va «Todavía no hay empresas publicadas», el texto del directorio vacío, y sale «Ver todas las empresas». El
  buscador queda, como en el directorio. Tweak «empresas».
- Los comentarios del contrato usan las rutas sin prefijo de acceso (ficha api-http): `/api/public/site` pasa a `/api/public-site`
  y `/api/public/businesses` a `/api/directory`. No se toca la copia congelada `lienzo-v35`.
Cada tablero lleva `data-vuelta="1004-portada-sin-empresas"`; si ya la tiene, no se toca."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-portada-sin-empresas"'
OPCIONES = ["Con empresas", "Sin empresas"]
VACIO = """<style data-vuelta="1004-portada-sin-empresas">
.lp-vacio { padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.lp-vacio strong { font-size: 16px; font-weight: 600; color: var(--t1); }
</style>"""


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


for nombre in ("Landing", "Landing-Movil"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    i = t.index('<div class="lp-emp">')
    j = t.index("</div>", t.index('<div class="lp-todas">')) + len("</div>")
    con = t[i:j]
    t = (t[:i] + f'<sc-if value="{{{{conEmpresas}}}}" hint-placeholder-val="{{{{si}}}}">{con}</sc-if>'
         '<sc-if value="{{sinEmpresas}}" hint-placeholder-val="{{no}}"><div class="lp-vacio"><strong>Todavía no hay empresas publicadas</strong></div></sc-if>' + t[j:])
    props = json.dumps({"empresas": {"editor": "enum", "options": OPCIONES, "default": OPCIONES[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\"", "data-props='" + props[:-1] + ",\"$preview\"")
    t = rep(t, "    return {\n      ...this.comunes(),\n\n    };",
            "    const sin = this.props.empresas === 'Sin empresas';\n\n    return {\n      ...this.comunes(),\n      conEmpresas: !sin,\n      sinEmpresas: sin,\n    };")
    t = rep(t, "</helmet>", VACIO + "\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)

RUTAS = [("/api/public/site", "/api/public-site"), ("/api/public/businesses", "/api/directory")]
archivos = [PROJ / f for f in ("Directorio.dc.html", "M-Directorio.dc.html", "Pagina-Publica.dc.html", "M-Pagina-Publica.dc.html")]
archivos += sorted((PROJ / "generadores" / "telefonos_1004" / "salida").glob("*.dc.html"))
for ruta in archivos:
    t = ruta.read_text(encoding="utf-8")
    nuevo = t
    for viejo, bueno in RUTAS:
        nuevo = nuevo.replace(viejo, bueno)
    if nuevo != t:
        ruta.write_text(nuevo, encoding="utf-8")
        print("ok rutas", ruta.name)
