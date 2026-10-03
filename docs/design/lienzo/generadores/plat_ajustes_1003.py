"""Plataforma en la compu: ajustes aprobados por el usuario el 2026-10-03 sobre la propuesta de la Etapa 5.
Corre después de plat_vuelta_1004.py (usa su clase Tablero) y suma lo que faltaba de la aprobación:
- Cuentas: sin la columna Teléfono (el teléfono está en la ficha de la cuenta).
- Ficha de cuenta: los métodos como en Mi cuenta. Filas sin encabezado; el tipo, «Principal» y quién lo administra van
  en la segunda línea; el estado aparece solo si pide atención («Ya no sirve para ingresar»).
- Documentos legales: lista sin encabezados, con «Versión N · vigente desde dd/mm/aaaa» en la segunda línea.
La ficha de organización no se toca: el usuario prefirió conservar las pestañas (plat_vuelta_1004.py, 2026-10-03).
También les saca « · por refinar» a los títulos de los ocho tableros en canvas.json.
Cada tablero lleva `data-ajuste="1003-<tablero>"`; si ya lo tiene, no se toca."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from plat_vuelta_1004 import Tablero, PROJ  # noqa: E402

FILAS = """.o-fila { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px;
  min-height: 56px; padding: 8px 16px; border-bottom: 1px solid var(--borde); box-sizing: border-box; }
.o-fila:last-child { border-bottom: 0; }
.o-fila.o-con-menu { grid-template-columns: minmax(0, 1fr) 28px; }
.o-fila .dos, .o-res .dos { display: flex; flex-direction: column; gap: 1px; min-width: 0; line-height: 1.35; }
.o-fila .dos > *, .o-res .dos > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-fila .n2, .o-res .n2 { font-size: 12px; color: var(--t3); }
.o-fila .c1, .o-res .c1 { font-weight: 500; }"""

class Ajuste(Tablero):
    def __init__(self, nombre):
        super().__init__(nombre)
        self.marca = f'data-ajuste="1003-{nombre}"'


def cuentas():
    b = Ajuste("Cuentas")
    if b.hecho:
        return
    viejas = "minmax(0, 1.8fr) 150px minmax(0, 1.3fr) minmax(0, 1.2fr) 190px 28px"
    b.rep(viejas, "minmax(0, 1.8fr) minmax(0, 1.5fr) minmax(0, 1.2fr) 190px 28px", n=2)
    b.rep("<span>Teléfono</span>", "")
    b.rep('<span class="c1 n {{c.claseTel}}">{{c.tel}}</span>', "")
    b.guardar()


def cuenta_plat():
    b = Ajuste("Cuenta-Plat")
    if b.hecho:
        return
    cols = "minmax(0, 1.8fr) minmax(0, 1.3fr) 130px 200px"
    b.rep(f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Método</span><span>Administrado por</span>'
          '<span>Verificado el</span><span>Estado</span></div>', "")
    b.rep(f'<div class="tt-f o-alto" style="grid-template-columns: {cols};"><span class="dos"><span class="c1">{{{{m.valor}}}}</span>'
          '<span class="n2">{{m.tipoPrincipal}}</span></span><span class="c1 n {{m.claseOrg}}">{{m.org}}</span>'
          '<span class="c1 n">{{m.verificado}}</span><span><span class="pill {{m.pill}}">{{m.estado}}</span></span></div>',
          '<div class="o-fila"><span class="dos"><span class="c1">{{m.valor}}</span><span class="n2">{{m.detalle}}</span></span>'
          '<span><sc-if value="{{m.noSirve}}" hint-placeholder-val="{{no}}"><span class="pill off">Ya no sirve para ingresar</span></sc-if></span></div>')
    b.rep("        tipoPrincipal: m.principal ? m.tipo + ' · Principal' : m.tipo,",
          "        tipoPrincipal: m.principal ? m.tipo + ' · Principal' : m.tipo,\n"
          "        detalle: [m.tipo, m.principal ? 'Principal' : '', m.org ? 'Administrado por ' + m.org : ''].filter(Boolean).join(' · '),\n"
          "        noSirve: !m.activo,")
    b.guardar(FILAS)


def legales():
    b = Ajuste("Legales")
    if b.hecho:
        return
    cols = "minmax(0, 2fr) 140px 140px 110px 28px"
    b.rep(f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Documento</span><span>Vigente desde</span>'
          '<span class="num">Versión vigente</span><span class="num">Versiones</span><span class="sr">Acciones</span></div>', "")
    b.rep(f'<div class="tt-f {{{{d.clase}}}}" style="grid-template-columns: {cols};">\n'
          '              <span class="c1">{{d.n}}</span>\n'
          '              <span class="c1 n">{{d.desde}}</span>\n'
          '              <span class="num">{{d.version}}</span>\n'
          '              <span class="num">{{d.versiones}}</span>',
          '<div class="o-fila o-con-menu {{d.clase}}">\n'
          '              <span class="dos"><span class="c1">{{d.n}}</span><span class="n2">Versión {{d.version}} · vigente desde {{d.desde}}</span></span>')
    b.guardar(FILAS)


def titulos():
    ruta = PROJ / "canvas.json"
    original = ruta.read_text(encoding="utf-8")
    canvas = json.loads(original)
    n = 0
    for nombre in ("Organizaciones", "Organizacion", "Cuentas", "Cuenta-Plat", "Recuperaciones", "Legales", "Auditoria-Plat", "Config-Plat"):
        tablero = canvas["boards"][f"{nombre}.dc.html"]
        if tablero["title"].endswith(" · por refinar"):
            tablero["title"] = tablero["title"].removesuffix(" · por refinar")
            n += 1
    final = "\n" if original.endswith("\n") else ""
    ruta.write_text(json.dumps(canvas, ensure_ascii=False, indent=2) + final, encoding="utf-8")
    print("títulos sin «por refinar»:", n)


if __name__ == "__main__":
    cuentas()
    cuenta_plat()
    legales()
    titulos()
