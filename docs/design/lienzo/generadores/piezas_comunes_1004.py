"""Piezas comunes al criterio en los tableros que todavía no lo seguían (6d-6 de la Guía, 2026-10-05; la app ya sigue al criterio):
- La banda de los tableros del marco viejo (`.banda-pag`) mide 64, como `.w-bnd` de Criterio · Marco, y las migas van a 4, como
  las de `.w-tb`.
- Los diálogos: la confirmación `.p-dlg` con 20 arriba; los `.dlg` del marco viejo con encabezado de 48, ✕ de 32 con ícono de 16
  y radio 12 (Criterio · Diálogos).
- Las tablas y las cajas de filtros (`.tarjeta`, `.fb`): radio 12 y sin sombra (Criterio · Tablas).
- Pagina-Org y M-Pagina-Org: el estado «Borrador sin dirección»: el interruptor trabado con su ⓘ y el aviso «Página sin
  dirección» con los textos de la app. En el teléfono, la ⓘ también en «Despublicada por la plataforma», como la app.
- Empresa: la ✕ de «Revocar invitación» con el trazo del set, 1,75.
Lleva `data-vuelta="1004-piezas-comunes"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, rango_bloque, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-piezas-comunes"'
ARCHIVO = {"Cuenta-A", "Cuenta-B", "Cuenta-C", "Botones"}
SVG = r"<svg(?:(?!</svg>).)*</svg>"
textos, css = {}, {}


def tocar(nombre):
    if nombre not in textos:
        t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
        textos[nombre] = None if MARCA in t else t
        css[nombre] = []
    return textos[nombre]


def poner(nombre, t, regla=""):
    textos[nombre] = t
    if regla:
        css[nombre].append(regla)


CSS_BANDA = (".banda-pag { height: 64px !important; min-height: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; "
             "box-sizing: border-box !important; }\n.ab-breadcrumbs__list { gap: 4px !important; }\n")
CSS_PDLG = ".p-dlg .tx { padding-top: 20px !important; }\n"
CSS_DLG = (".dlg { border-radius: 12px !important; }\n"
           ".dlg-h { min-height: 48px !important; box-sizing: border-box !important; padding: 0 8px 0 20px !important; align-items: center !important; }\n"
           ".dlg-x { width: 32px !important; height: 32px !important; color: var(--t2) !important; }\n.dlg-x svg { width: 16px !important; height: 16px !important; }\n")
CSS_TABLA = (".tarjeta, .fb { border-radius: 12px !important; box-shadow: none !important; }\n"
             ".tarjeta > .tt-h:first-child { border-radius: 11px 11px 0 0 !important; }\n")

for ruta in sorted(PROJ.glob("*.dc.html")):
    nombre = ruta.name[:-len(".dc.html")]
    if nombre.endswith("-Anterior") or nombre in ARCHIVO:
        continue
    crudo = ruta.read_text(encoding="utf-8")
    reglas = ""
    if 'class="banda-pag' in crudo:
        reglas += CSS_BANDA
    if 'class="p-dlg' in crudo:
        reglas += CSS_PDLG
    if 'class="dlg-h' in crudo:
        reglas += CSS_DLG
    if re.search(r'class="(tarjeta|fb)[ "]', crudo):
        reglas += CSS_TABLA
    if reglas:
        t = tocar(nombre)
        if t:
            poner(nombre, t, reglas)

# Empresa: el trazo de la ✕ de «Revocar invitación».
t = tocar("Empresa")
if t:
    viejo = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg> Revocar invitación'
    poner("Empresa", rep(t, viejo, viejo.replace('stroke-width="2"', 'stroke-width="1.75"')))

# Pagina-Org (compu): «Borrador sin dirección».
DIR_TIT, DIR_MOT = "Página sin dirección", "Para publicarla, la página necesita una dirección."
DIR_PASOS = ("Elegí la dirección de la página", "Guardá los cambios")
t = tocar("Pagina-Org")
if t:
    t = sumar_opcion(t, "Borrador: vista previa", "Borrador sin dirección")
    t = rep(t, "    const vista = e === 'Borrador: vista previa';\n",
            "    const vista = e === 'Borrador: vista previa';\n    const sinDir = e === 'Borrador sin dirección';\n")
    t = rep(t, "estado: error ? 'Publicada' : vista ? 'Borrador' : (e || 'Publicada'), errGuardar: error, vista };",
            "estado: error ? 'Publicada' : vista || sinDir ? 'Borrador' : (e || 'Publicada'), errGuardar: error, vista, sinDir, dirInfo: sinDir };")
    t = rep(t, "      borrador: s.estado === 'Borrador',\n",
            "      borrador: s.estado === 'Borrador',\n      borradorConDir: s.estado === 'Borrador' && !s.sinDir,\n      sinDir: !!s.sinDir,\n"
            "      slug: s.sinDir ? '' : 'delta',\n      dirInfo: !!s.dirInfo,\n"
            "      verDir: () => this.setState({ dirInfo: true }),\n      cerrarDir: () => this.setState({ dirInfo: false }),\n")
    # El interruptor: con dirección, publica; sin dirección, trabado con su ⓘ.
    i = t.index('<sc-if value="{{borrador}}" hint-placeholder-val="{{no}}"><div class="w-it">')
    t = t[:i] + t[i:].replace('<sc-if value="{{borrador}}"', '<sc-if value="{{borradorConDir}}"', 1)
    m = re.search(r'<sc-if value="\{\{despublicada\}\}" hint-placeholder-val="\{\{no\}\}"><div class="w-it">.*?</sc-if>', t, re.S)
    bloque = m.group(0)
    nuevo = (bloque.replace("{{despublicada}}", "{{sinDir}}").replace('aria-label="Por qué está despublicada" onClick="{{verInfo}}"', 'aria-label="Por qué no se puede publicar" onClick="{{verDir}}"')
             .replace("Visible en delta.plataforma.com", "Visible en .plataforma.com").replace("bloqueado por la plataforma", "falta la dirección"))
    assert nuevo != bloque and "{{verDir}}" in nuevo
    t = t[:m.end()] + nuevo + t[m.end():]
    t = rep(t, '<div class="o-pre"><span style="flex: 1;">delta</span>', '<div class="o-pre"><span style="flex: 1;">{{slug}}</span>')
    # El aviso, con la pieza del de «Página despublicada».
    i, j = rango_bloque(t, "info")
    aviso = t[i:j]
    aviso = aviso.replace('<sc-if value="{{info}}"', '<sc-if value="{{dirInfo}}"', 1).replace("{{cerrarInfo}}", "{{cerrarDir}}")
    aviso = rep(aviso, 'aria-label="Página despublicada"', f'aria-label="{DIR_TIT}"')
    aviso = rep(aviso, "<span>Página despublicada</span>", f"<span>{DIR_TIT}</span>")
    aviso = rep(aviso, "<b>Datos de contacto falsos</b><span>Despublicada por la plataforma el 26/09/2026</span>", f"<b>{DIR_MOT}</b>")
    aviso = rep(aviso, "Corregí los datos de la página", DIR_PASOS[0])
    aviso = rep(aviso, "Pedí a la plataforma que la habilite", DIR_PASOS[1])
    t = t[:j] + aviso + t[j:]
    poner("Pagina-Org", t)

# M-Pagina-Org (teléfono): la ⓘ en «Despublicada» y el estado «Borrador sin dirección».
I_TEL = ('<button type="button" class="ap-i" aria-label="{aria}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/>'
         '<path d="M12 7.8h.01"/></svg></button>')
t = tocar("M-Pagina-Org")
if t:
    i, j = rango_bloque(t, "e2")
    b = rep(t[i:j], "<b>Visible en delta.plataforma.com</b></span><span class=\"ap-sw off apag\"",
            "<b>Visible en delta.plataforma.com" + I_TEL.format(aria="Por qué está despublicada") + "</b></span><span class=\"ap-sw off apag\"")
    t = t[:i] + b + t[j:]
    t = clonar(t, "e2", "e6", "Borrador sin dirección", [
        ('<span class="w-est mal">Despublicada por la plataforma</span>', '<span class="w-est off">Borrador</span>'),
        ("Visible en delta.plataforma.com<button type=\"button\" class=\"ap-i\" aria-label=\"Por qué está despublicada\"",
         "Visible en .plataforma.com<button type=\"button\" class=\"ap-i\" aria-label=\"Por qué no se puede publicar\""),
        ('<div class="ct">delta</div>', '<div class="ct"></div>'),
        ('aria-label="Página despublicada"', f'aria-label="{DIR_TIT}"'),
        ("<h2>Página despublicada</h2>", f"<h2>{DIR_TIT}</h2>"),
        ("<b>Datos de contacto falsos</b><span>Despublicada por la plataforma el 26/09/2026</span>", f"<b>{DIR_MOT}</b>"),
        ("Corregí los datos de la página", DIR_PASOS[0]),
        ("Pedí a la plataforma que la habilite", DIR_PASOS[1]),
    ])
    poner("M-Pagina-Org", t, ".ap-i { border: 0; background: none; padding: 0; margin-left: 6px; color: oklch(0.52 0.19 25); display: inline-flex; vertical-align: -3px; cursor: pointer; }\n")

escritos = 0
for nombre, t in textos.items():
    if t is None:
        continue
    assert t.count("</helmet>") == 1, nombre
    t = t.replace("</helmet>", f"<style {MARCA}>\n{''.join(css[nombre])}</style>\n</helmet>")
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    escritos += 1
print("tableros", escritos)
