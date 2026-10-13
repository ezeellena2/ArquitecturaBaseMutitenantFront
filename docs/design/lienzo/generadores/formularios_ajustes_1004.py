"""E12 · Formularios: los ajustes fuera de la página nueva (spec §9 y texto de Diseño, punto 11).
- El menú de la organización suma «Formularios» debajo de WhatsApp (elegido el 13/10, opción A del listado): los tableros de la
  familia de WhatsApp (`w-sb`) y los de la barra `ab-sidebar` de Grupo Delta que ya tienen WhatsApp. En el teléfono, «Más»
  (M-WA-Menu) suma el grupo «Formularios».
- Rol suma el área Formularios con sus cinco permisos.
- La pestaña «Módulos» de la ficha de una organización (Plataforma) suma «Formularios».
Corre después de `formularios_1004.py`. Cada paso mira si su cambio ya está, así que se puede volver a correr."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rep  # noqa: E402
from formularios_1004 import ICONO  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-e12-ajustes"'
ARCHIVO = {"Rol-Anterior", "Usuario-Anterior", "Avisos-Anterior", "Configuracion-Anterior", "Pagina-Org-Anterior"}
hechos = []


def guardar(nombre, t):
    assert t.count("</helmet>") == 1, nombre
    if MARCA not in t:
        t = t.replace("</helmet>", f"<style {MARCA}></style>\n</helmet>")
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    hechos.append(nombre)


# ---- El menú de la compu.
for f in sorted(PROJ.glob("*.dc.html")):
    nombre = f.name[:-8]
    if nombre.startswith("M-") or nombre in ARCHIVO:
        continue
    t = f.read_text(encoding="utf-8")
    cambio = False
    # Familia de WhatsApp: el menú principal de la organización tiene el enlace a WA-Chats.
    for m in list(re.finditer(r'<aside class="w-sb".*?</aside>', t, re.S)):
        sb = m.group(0)
        if "FRM-Listado.dc.html" in sb:
            continue
        w = re.search(r'<a class="w-ln[^"]*" href="WA-Chats\.dc\.html">.*?</a>', sb, re.S)
        if not w:
            continue
        nuevo = sb.replace(w.group(0), w.group(0) + f'<a class="w-ln" href="FRM-Listado.dc.html">{ICONO} Formularios</a>', 1)
        t = t.replace(sb, nuevo, 1)
        cambio = True
    # Barra ab-sidebar de Grupo Delta con WhatsApp.
    if 'class="ab-sidebar"' in t and '<p class="scope-name">Grupo Delta</p>' in t and "wa-btn" in t and "FRM-Listado.dc.html" not in t:
        li = re.search(r'<li><button type="button" class="ab-sidebar__link wa-btn".*?</button></li>', t, re.S)
        if not li:
            continue
        icono = ICONO.replace('aria-hidden="true">', 'aria-hidden="true" class="ab-sidebar__icon">', 1)
        t = t.replace(li.group(0), li.group(0) + f'\n      <li><a class="ab-sidebar__link" href="FRM-Listado.dc.html">{icono}<span class="ab-sidebar__link-label">Formularios</span></a></li>', 1)
        cambio = True
    if cambio:
        guardar(nombre, t)

# ---- «Más» del teléfono.
t = (PROJ / "M-WA-Menu.dc.html").read_text(encoding="utf-8")
if "M-FRM-Listado.dc.html" not in t:
    k = t.index('<span class="ap-gtit">WhatsApp</span>')
    fin = t.index("</div>", t.index('href="M-WA-Plantillas.dc.html"', k)) + len("</div>")
    chev = re.search(r'<span class="chev">(<svg.*?</svg>)</span>', t[k:], re.S).group(1)
    grupo = ('<span class="ap-gtit">Formularios</span><div class="ap-grupo"><a class="ap-it " href="M-FRM-Listado.dc.html">'
             f'<span class="tx"><b>Formularios</b></span><span class="chev">{chev}</span></a></div>')
    t = t[:fin] + grupo + t[fin:]
    guardar("M-WA-Menu", t)

# ---- Rol: el área Formularios.
AREA = ("  { n: 'Formularios', ps: [['forms.read', 'Ver formularios', 'La lista de formularios y su ficha.'], "
        "['forms.manage', 'Diseñar formularios', 'Crear formularios y editar sus preguntas y textos.'], "
        "['forms.publish', 'Publicar formularios', 'Publicarlos en WhatsApp.'], "
        "['formrecords.create', 'Responder formularios', 'Recibirlos por WhatsApp y completarlos.'], "
        "['formrecords.read', 'Ver respuestas', 'Los valores de cada respuesta.']] },\n")
for nombre in ["Rol"]:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "forms.read" in t:
        continue
    m = re.search(r"\['whatsapp\.manage', 'Administrar WhatsApp', '[^']*'\]\] },\n", t)
    assert m, nombre
    t = t[:m.end()] + AREA + t[m.end():]
    guardar(nombre, t)

# M-Rol muestra el rol Dueño con todos los permisos fijos: el área nueva va después de WhatsApp.
t = (PROJ / "M-Rol.dc.html").read_text(encoding="utf-8")
if ">Ver formularios<" not in t:
    k = t.index('<span class="n">WhatsApp</span><span class="c">4 de 4</span>')
    ini = t.rindex('<div class="ap-area">', 0, k)
    cab = t[ini:t.index("</div>", k) + len("</div>")]
    perm = t[t.index('<div class="ap-perm">', k):t.index("</div>", t.index('<div class="ap-perm">', k)) + len("</div>")]
    fin = t.index("Administrar WhatsApp</div>", k) + len("Administrar WhatsApp</div>")
    bloque = cab.replace("WhatsApp", "Formularios").replace("4 de 4", "5 de 5") + "".join(
        perm.replace("Atender clientes", n) for n in ["Ver formularios", "Diseñar formularios", "Publicar formularios", "Responder formularios", "Ver respuestas"])
    t = t[:fin] + bloque + t[fin:]
    guardar("M-Rol", t)

# ---- Módulos de una organización (Plataforma).
t = (PROJ / "Organizacion.dc.html").read_text(encoding="utf-8")
if "n: 'Formularios'" not in t:
    t = rep(t, "  { id: 'b', n: 'Asistente', estado: 'prendido', origen: 'Manual', hasta: '', clave: false },\n",
            "  { id: 'b', n: 'Asistente', estado: 'prendido', origen: 'Manual', hasta: '', clave: false },\n"
            "  { id: 'd', n: 'Formularios', estado: 'prendido', origen: 'Manual', hasta: '' },\n")
    guardar("Organizacion", t)
t = (PROJ / "M-Organizacion.dc.html").read_text(encoding="utf-8")
if 'aria-label="Acciones de Formularios"' not in t:
    # La fila del Asistente aparece en cada estado que muestra la pestaña; «Formularios» va después de cada una.
    for k in reversed([m.start() for m in re.finditer('aria-label="Acciones de Asistente">', t)]):
        ini = t.rindex('<div class="ap-fila">', 0, k)
        fin = t.index("</button></div>", k) + len("</button></div>")
        fila = t[ini:fin]
        nueva = re.sub(r'<span class="l2">[^<]*</span>', '<span class="l2">Manual</span>', fila.replace("Asistente", "Formularios"), count=1)
        t = t[:fin] + nueva + t[fin:]
    t = rep(t, 'Módulos <span class="c">3</span>', 'Módulos <span class="c">4</span>', t.count('Módulos <span class="c">3</span>'))
    guardar("M-Organizacion", t)

print(len(hechos), "tableros:", " ".join(hechos))
