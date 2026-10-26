"""Las reglas del usuario del 2026-10-25 que valen para todo el lienzo (pedidos que pasó la Guía, maqueta cde670e):
- el teléfono de la vista previa va sin rótulo: sale «Así lo ve quien lo recibe» de arriba del teléfono, en todos los
  tableros vigentes (el editor del formulario, las plantillas y los catálogos); en el teléfono queda el ojo con su hoja;
- «Criterio · Tablas y listas»: un dato por celda, en un renglón (front 4fdcab2b), y las fechas completas, con año y hora,
  en la zona de quien mira (formatos.md, d7644064). Lo que aclaraba una celda va en su propia columna o no va.

Los tableros de las etapas que se redibujan (12, 13 y 14 primero) lo aplican en su generador; los de las etapas cerradas
cambian en la base de la 12. Corre después de `formularios_14_formularios_1004.py` y antes de `formularios_etapas_1004.py`.
Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
ROTULO = re.compile(r'<div class="pv-tit"><span class="pv-tit2">Así lo ve quien lo recibe</span>(?:<span class="pv-pant">· ([^<]*)</span>)?</div>')


def sin_rotulo(t):
    # Con más de una pantalla queda cuál es, sin el rótulo
    return ROTULO.sub(lambda m: f'<div class="pv-tit"><span class="pv-pant">{m.group(1)[0].upper() + m.group(1)[1:]}</span></div>' if m.group(1) else "", t)


# ================================================================ Criterio · Tablas y listas
MARCA = 'data-reglas="25-10"'
CSS = """<style data-reglas="25-10">
.tb .th, .tb .tr { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 1fr) 140px 48px; }
.tb .tr .num { font-variant-numeric: tabular-nums; }
</style>
</helmet>"""
GUION = '<span class="nada">—</span>'
FILAS = [  # usuario, correo, rol en la organización, empresa, estado, vencimiento, ⋮ abierto
    ("Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", "Dueño", "Delta S.A.", '<span class="est ok">Activo</span>', GUION, False),
    ("Tomás Acosta", "tomas.acosta@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est ok">Activo</span>', GUION, True),
    ("Julieta Sosa", "julieta.sosa@delta.ejemplo.com", "Auditor", GUION, '<span class="est ok">Activo</span>', GUION, False),
    ("Diego Ríos", "diego.rios@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est alerta">Baja pedida</span>', GUION, False),
    ("Martín Paz", "martin.paz@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est ok">Activo</span>', GUION, False),
    ("Marcos Giménez", "marcos.gimenez@delta.ejemplo.com", GUION, GUION, '<span class="est off">Deshabilitado</span>', GUION, False),
    ("Sofía Herrera", "sofia.herrera@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est pend">Invitación pendiente</span>', "02/10/2026 18:00", False),
]
TEXTOS = [
    ("<li><strong>Filas de 40 px</strong>; si alguna tiene segunda línea, todas las de la tabla son de 52. Letra de hoy (13), alternadas. Al pasar el mouse, petróleo claro.</li>",
     "<li><strong>Filas de 40 px</strong>, alternadas, con letra de 13. Al pasar el mouse, petróleo claro.</li>"),
    ("<li><strong>Un tema por columna.</strong> Debajo, en gris, lo que lo aclara: el correo, el rol en la empresa, cuándo vence. Sin dato, una sola raya.</li>",
     "<li><strong>Un dato por celda, en un renglón.</strong> Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, Vencimiento), o no va. Sin dato, una sola raya.</li>"
     "\n        <li><strong>Las fechas, completas:</strong> 25/10/2026 18:07, con año y hora, en la zona de quien mira. Nunca «hoy», «ayer» ni «hace 2 horas».</li>"),
    ("<strong>Fila de tabla</strong><span>40 o 52 px</span><span>52 en toda la tabla si alguna fila tiene segunda línea. Letra de 13, la de hoy; la segunda línea, gris de 12. Una fila sí y otra no, arena muy suave. Al pasar el mouse, petróleo claro.</span>",
     "<strong>Fila de tabla</strong><span>40 px</span><span>Un dato por celda, en un renglón, con letra de 13. Una fila sí y otra no, arena muy suave. Al pasar el mouse, petróleo claro.</span>"),
    ("<li>Dos datos sin relación en la misma celda: la segunda línea solo aclara la primera.</li>",
     "<li>Dos datos en la misma celda, también en una segunda línea gris: el correo debajo del nombre, «Vence…» debajo del estado.</li>"),
    ("<li>Una columna aparte para algo que aclara otra: el correo va debajo del nombre.</li>",
     "<li>Fechas sin año, «hoy», «ayer» o «hace 2 horas».</li>"),
]


def criterio_tablas(t):
    if MARCA in t:
        return t.replace(t[t.index('<style data-reglas="25-10">'):t.index("</helmet>", t.index('<style data-reglas="25-10">')) + len("</helmet>")], CSS, 1)
    t = t.replace("</helmet>", CSS, 1)
    i = t.index('<div class="th"><span>Usuario</span><span>Rol en la organización</span>')
    j = t.index('<div class="pie">', i)
    filas = ""
    for n, correo, rol, empresa, estado, vence, menu in FILAS:
        filas += (f'<div class="tr{" h" if menu else ""}"><span class="n">{n}</span><span>{correo}</span><span>{rol}</span><span>{empresa}</span><span>{estado}</span>'
                  f'<span class="num">{vence}</span><span class="der"><button type="button" class="ib{" h" if menu else ""}" aria-label="Acciones de {n}">{KEBAB}</button>'
                  + (MENU if menu else "") + "</span></div>\n        ")
    th = ('<div class="th"><span>Usuario</span><span>Correo</span><span>Rol en la organización</span><span>Empresa</span><span>Estado</span>'
          '<span>Vencimiento</span><span class="sr">Acciones</span></div>\n        ')
    t = t[:i] + th + filas + t[j:]
    for a, b in TEXTOS:
        assert t.count(a) == 1, a[:60]
        t = t.replace(a, b)
    return t


KEBAB = MENU = ""


if __name__ == "__main__":
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    archivo = {k[:-8] for k, v in c["boards"].items() if v.get("page") == "archivo"}
    tocados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        if n in archivo or n == "Criterio-Decisiones":
            continue
        t = f.read_text(encoding="utf-8")
        nuevo = sin_rotulo(t)
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            tocados.append(n)
    print("sin el rótulo de la vista previa:", len(tocados), tocados)
    ruta = PROJ / "Criterio-Tablas.dc.html"
    t = ruta.read_text(encoding="utf-8")
    KEBAB = re.search(r'aria-label="Acciones de Lucía Fernández">(<svg.*?</svg>)</button>', t, re.S).group(1)
    MENU = re.search(r'<div class="menu2" role="menu">.*?Deshabilitar</span></div>', t, re.S).group(0)
    ruta.write_text(criterio_tablas(t), encoding="utf-8")
    print("Criterio · Tablas y listas: un dato por celda y fechas completas")
