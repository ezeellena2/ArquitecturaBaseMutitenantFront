"""Lo que resolvió el usuario el 2026-10-04 en las consultas que trajo el front (la Guía y «Paquete 0»):
- Subtítulo de las pantallas internas del teléfono: el camino. M-Error-Org («Sin permiso» y «No encontrada») dice «Administración» y no
  «Grupo Delta»; M-Auditoria-Org, «Administración» y no «Últimos 30 días» (eso es el filtro).
- M-Usuario: «Estado» y «Roles de la organización» abren hojas de opciones. «Estado», con tilde, se cierra al elegir; «Roles», con
  casillas y «Listo». Tweak «estado».
- M-Pagina-Org: el país y el número del teléfono de contacto en dos campos, como en el resto de los tableros y en la app.
- Cuentas, «Invitar operador» con un correo que ya tiene una invitación: «Reenviala desde la lista.».
Las fechas del año en curso, el correo del perfil de una organización y la invitación sin nombre no cambian tableros (el lienzo ya
estaba así o lo suma Mensajes): quedan en Decisiones por pantalla. Cada tablero lleva `data-vuelta="1004-consultas"`."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-consultas"'


def rep(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t, estilo=""):
    return rep(t, "</helmet>", estilo + f"<style {MARCA}>\n</style>\n</helmet>")


def svg(d, w=24, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CERRAR = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 22, "2")
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, "2.4")
TILDE_CHK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
CHEV = svg('<path d="m7 10 5 5 5-5"/>', 18, "2")

for nombre, viejo, n in (("M-Error-Org", "Grupo Delta", 2), ("M-Auditoria-Org", "Últimos 30 días", 1)):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA not in t:
        t = rep(t, f'<span class="sub">{viejo}</span>', '<span class="sub">Administración</span>', n)
        ruta.write_text(marcar(t), encoding="utf-8")
        print("ok", nombre)

ruta = PROJ / "M-Usuario.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    css = """<style data-vuelta="1004-consultas-hojas">
.ap-op { display: flex; align-items: center; gap: 12px; min-height: 52px; font-size: 16px; color: var(--t1); border-bottom: 1px solid var(--borde); }
.ap-op:last-child { border-bottom: 0; }
.ap-op[aria-selected="true"] { color: var(--marca-tx); font-weight: 500; }
.ap-op .tilde { margin-left: auto; display: inline-flex; color: var(--marca-tx); }
.ap-chk { width: 22px; height: 22px; box-sizing: border-box; border-radius: 6px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; }
.ap-chk.on { background: var(--marca); border-color: var(--marca); }
.ap-hoja .hb:has(.ap-op) { gap: 0; }
</style>"""

    def hoja(titulo, cuerpo, pie=""):
        p = f'<div class="hp">{pie}</div>' if pie else ""
        return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="' + titulo + '"><span class="asa"></span>'
                f'<div class="hc"><h2>{titulo}</h2><button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR}</button></div>'
                f'<div class="hb">{cuerpo}</div>{p}</div>')

    estado = hoja("Estado", f'<div class="ap-op" role="option" aria-selected="true">Activo<span class="tilde">{TILDE}</span></div>'
                  '<div class="ap-op" role="option" aria-selected="false">Deshabilitado</div>')
    roles = hoja("Roles de la organización",
                 '<div class="ap-op" role="option" aria-selected="false"><span class="ap-chk"></span>Dueño</div>'
                 '<div class="ap-op" role="option" aria-selected="false"><span class="ap-chk"></span>Recursos humanos</div>'
                 f'<div class="ap-op" role="option" aria-selected="true"><span class="ap-chk on">{TILDE_CHK}</span>Auditor</div>',
                 '<button type="button" class="cb cb-pri">Listo</button>')
    fin = t.rindex('<span class="ap-raya"></span>')
    t = t[:fin] + f'<sc-if value="{{{{e1}}}}" hint-placeholder-val="{{{{no}}}}">{estado}</sc-if><sc-if value="{{{{e2}}}}" hint-placeholder-val="{{{{no}}}}">{roles}</sc-if>' + t[fin:]
    opciones = ["Editar usuario", "Elegir el estado", "Elegir los roles"]
    props = json.dumps({"estado": {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\"", "data-props='" + props[:-1] + ",\"$preview\"")
    vals = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    t = rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
            "class Component extends DCLogic {\n  renderVals() {\n    const e = this.props.estado ?? \"Editar usuario\";\n\n    return {\n      si: true,\n      no: false,\n" + vals + "    };\n  }\n}")
    ruta.write_text(marcar(t, css + "\n"), encoding="utf-8")
    print("ok M-Usuario")

ruta = PROJ / "M-Pagina-Org.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    i = t.index('<span class="rt"><span>Teléfono</span></span><div class="ct"><span class="ban-pre">')
    a = t.index('<div class="ct">', i)
    b = t.index("</div>", a) + len("</div>")
    viejo = t[a:b]
    pre = viejo[len('<div class="ct">'):viejo.index("+54") + 3] + "</span>"
    t = t[:a] + f'<div class="ap-tel"><div class="ct" aria-label="País: Argentina">{pre}{CHEV}</div><div class="ct">011 4321-5678</div></div>' + t[b:]
    css = """<style data-vuelta="1004-consultas-tel">
.ap-tel { display: grid; grid-template-columns: 124px minmax(0, 1fr); gap: 8px; }
.ap-tel .ct { white-space: nowrap; }
.ap-tel .ct svg:not(.bandera) { color: var(--t3); flex-shrink: 0; }
</style>"""
    ruta.write_text(marcar(t, css + "\n"), encoding="utf-8")
    print("ok M-Pagina-Org")

ruta = PROJ / "Cuentas.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = t.replace("Ese correo ya tiene una invitación. Reenviala desde Cuentas.", "Ese correo ya tiene una invitación. Reenviala desde la lista.")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Cuentas")
