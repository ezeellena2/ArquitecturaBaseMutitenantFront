"""Inicios de la organización, aprobados el 2026-10-03. Sin métricas ni gráficos: solo lo que existe.
- Inicio-Org (A, invertido): arriba, las áreas en tarjetas con un dato real; abajo, «Para resolver» como tabla
  (Pendiente, Área, Estado, Desde y el enlace que pide el estado). Estado «Nada para resolver».
- Inicio-Miembro (A): «Tus empresas» en las mismas tarjetas; si administra su empresa, su «Para resolver».
- M-Inicio-Org (C, app): cabecera de color con el saludo, atajos redondos con globito de pendientes y «Para resolver»
  en filas con ícono redondo y botón cápsula.
Una fila entra en «Para resolver» si es un estado que ya existe y pide acción, si quien mira puede resolverla y si tiene
una acción concreta; se calcula al abrir el inicio y se va sola cuando el estado cambia.
Los de la compu llevan `data-vuelta="1004-<tablero>"`; el teléfono se arma entero cada vez. Corre antes de
menus_con_lineas.py, flechita_blanca.py y lineas_menu_lateral.py."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
sys.path.insert(0, str(GEN / "telefonos_1004"))
from app_estilo import ESTILO_X  # noqa: E402
from app_marco import SALIDA, estado, nav, pagina  # noqa: E402

ORG = (PROJ / "Inicio-Org.dc.html").read_text(encoding="utf-8")


def svg(d, w=20):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


def icono(href):
    return re.search(r'href="%s\.dc\.html"[^>]*>(<svg.*?</svg>)' % href, ORG, flags=re.S).group(1)


I = {
    "usuarios": re.search(r'aria-controls="menu-usuarios">(<svg.*?</svg>)', ORG, flags=re.S).group(1),
    "roles": svg('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2"/><path d="m17 6 2 2"/><path d="m14 9 2 2"/>'),
    "empresas": icono("Empresas"), "config": icono("Configuracion"), "pagina": icono("Pagina-Org"),
    "wa": icono("WA-Admin"), "auditoria": icono("Auditoria-Org"),
    "casa": svg('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    "chev": svg('<path d="m9 6 6 6-6 6"/>', 16),
}
# Área, nombre, dato, tablero de la compu, tablero del teléfono, atajo del teléfono, pendientes del área.
AREAS = [("usuarios", "Usuarios", "11 usuarios", "Usuarios", "M-Usuarios", "Usuarios", 2),
         ("roles", "Roles y permisos", "7 roles", "Roles", "M-Roles", "Roles", 0),
         ("empresas", "Empresas", "3 empresas", "Empresas", "M-Empresas", "Empresas", 0),
         ("pagina", "Página pública", '<span class="pill ok">Publicada</span>', "Pagina-Org", "M-Pagina-Org", "Página", 0),
         ("config", "Configuración", "delta.ejemplo.com", "Configuracion", "M-Configuracion", "Configuración", 1),
         ("auditoria", "Auditoría", "Último cambio hoy, 10:42", "Auditoria-Org", "M-Auditoria-Org", "Auditoría", 0),
         ("wa", "WhatsApp", "2 números", "WA-Admin", "M-WA-Admin", "WhatsApp", 1)]
# Área, qué, detalle, nombre del área, estado, clase, desde, acción, tablero de la compu, del teléfono. Primero lo rojo; después, por fecha.
PEND = [("wa", "+54 9 351 555-0200", "", "WhatsApp", "Falta medio de pago", "mal", "02/10/2026", "Cargar", "WA-Admin-Pago", "M-WA-Admin-Pago"),
        ("usuarios", "carla.bianchi@delta.ejemplo.com", "Invitación", "Usuarios", "Vencida", "alerta", "25/09/2026", "Reenviar", "Usuarios", "M-Usuarios"),
        ("usuarios", "Diego Ríos", "Se elimina el 27/10/2026", "Usuarios", "Baja pedida", "alerta", "27/09/2026", "Ver", "Usuario", "M-Usuario"),
        ("config", "Dominio de correo", "delta.ejemplo.com", "Configuración", "Pendiente", "alerta", "01/10/2026", "Verificar", "Configuracion-Verificar",
         "M-Configuracion-Verificar")]
COLS = "grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.8fr) minmax(0, 1fr) 110px 96px;"

ESTILO = """.ini { display: flex; flex-direction: column; gap: 20px; }
.ini-acc { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.ini-t { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border: 1px solid var(--borde); border-radius: 14px; box-shadow: var(--sombra); text-decoration: none; color: inherit; min-width: 0; }
.ini-t:hover { border-color: var(--borde2); }
.ini-ico { width: 36px; height: 36px; border-radius: 10px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12.5px; font-weight: 700; }
.ini-ico svg { width: 18px; height: 18px; }
.ini-t .tx { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.ini-t b { font-size: 14px; font-weight: 600; }
.ini-t .d { font-size: 12.5px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ini-t > svg:last-child { color: var(--t3); flex-shrink: 0; }
.ini .t-cab h2 { display: flex; align-items: center; gap: 8px; }
.ini .t-cab .cnt { font-size: 12px; font-weight: 600; padding: 1px 8px; border-radius: 999px; background: var(--s3); color: var(--t2); }
.ini .tt-f .lnk { justify-self: end; font-size: 13px; }
.ini-tit { margin: 4px 0 -6px; font-size: 15px; font-weight: 600; color: var(--t1); }"""
BANDA = ('<div class="banda-pag"><div class="izq"><span class="ico" aria-hidden="true">' + I["casa"] + '</span><div style="min-width: 0;">'
         '<div class="tit"><h1>Inicio</h1></div><p class="res">Grupo Delta</p></div></div></div>')


class Tablero:
    def __init__(self, nombre):
        self.nombre = nombre
        self.ruta = PROJ / f"{nombre}.dc.html"
        self.t = self.ruta.read_text(encoding="utf-8")
        self.marca = f'data-vuelta="1004-{nombre}"'

    @property
    def hecho(self):
        return self.marca in self.t

    def rep(self, a, b):
        assert self.t.count(a) == 1, (self.nombre, a[:90], self.t.count(a))
        self.t = self.t.replace(a, b)

    def guardar(self, css):
        self.rep("</helmet>", f"<style {self.marca}>\n{css}\n</style>\n</helmet>")
        self.ruta.write_text(self.t, encoding="utf-8")
        print("ok", self.nombre)


def tarjetas(items):
    return '<div class="ini-acc">' + "".join(
        f'<a class="ini-t" href="{h}"><span class="ini-ico">{ic}</span><span class="tx"><b>{n}</b><span class="d">{d}</span></span>{I["chev"]}</a>'
        for ic, n, d, h in items) + "</div>"


def tabla(filas, area="Área"):
    cab = f'<div class="t-cab"><h2>Para resolver <span class="cnt">{len(filas)}</span></h2></div>'
    th = f'<div class="tt-h" style="{COLS}"><span>Pendiente</span><span>{area}</span><span>Estado</span><span>Desde</span><span class="sr">Acción</span></div>'
    cuerpo = "".join(f'<div class="tt-f" style="{COLS}"><span style="min-width: 0;"><span class="c1">{q}</span>{f"<span class=c2>{d}</span>" if d else ""}</span>'
                     f'<span class="c1 n">{a}</span><span><span class="pill {cl}">{e}</span></span><span class="c1 n">{f}</span><a class="lnk" href="{h}.dc.html">{ac}</a></div>'
                     for q, d, a, e, cl, f, ac, h in filas)
    return f'<div class="tarjeta">{cab}{th}{cuerpo}</div>'


VACIO = ('<div class="tarjeta"><div class="t-cab"><h2>Para resolver <span class="cnt">0</span></h2></div>'
         '<div class="vacio" style="padding: 22px 16px;"><strong>Nada para resolver</strong></div></div>')
MAIN = '<main class="ab-app-shell__main">\n\n    </main>'


def tweak(b, prop, opciones, vals):
    props = json.dumps({prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))[1:-1]
    b.rep("data-props='{\"$preview\"", "data-props='{" + props + ",\"$preview\"")
    b.rep("      ...this.comunes(),\n", "      ...this.comunes(),\n" + vals)


def inicio_org():
    b = Tablero("Inicio-Org")
    if b.hecho:
        return
    acc = [(I[a], n, d, f"{c}.dc.html") for a, n, d, c, _, _, _ in AREAS]
    filas = [(q, d, ar, e, cl, f, ac, c) for _, q, d, ar, e, cl, f, ac, c, _ in PEND]
    cuerpo = (tarjetas(acc) + f'<sc-if value="{{{{conPendientes}}}}" hint-placeholder-val="{{{{si}}}}">{tabla(filas)}</sc-if>'
              f'<sc-if value="{{{{sinPendientes}}}}" hint-placeholder-val="{{{{no}}}}">{VACIO}</sc-if>')
    b.rep(MAIN, f'<main class="ab-app-shell__main">{BANDA}<div class="pagina"><div class="ini">{cuerpo}</div></div></main>')
    tweak(b, "pendientes", ["Con pendientes", "Nada para resolver"],
          "      conPendientes: (this.props.pendientes ?? 'Con pendientes') === 'Con pendientes',\n"
          "      sinPendientes: this.props.pendientes === 'Nada para resolver',\n")
    b.guardar(ESTILO)


def inicio_miembro():
    """Valentina Ruiz, con «Solo lectura» en Delta Norte S.A.; con el Tweak, «Administrador» de esa empresa."""
    b = Tablero("Inicio-Miembro")
    if b.hecho:
        return
    tj = tarjetas([("DN", "Delta Norte S.A.", "{{rolEmpresa}} · 3 miembros", "Empresa.dc.html")])
    pend = tabla([("martin.paz@delta.ejemplo.com", "Invitación", "Delta Norte S.A.", "Vencida", "alerta", "29/09/2026", "Reenviar", "Empresa")], "Empresa")
    cuerpo = f'<h2 class="ini-tit">Tus empresas</h2>{tj}<sc-if value="{{{{administra}}}}" hint-placeholder-val="{{{{no}}}}">{pend}</sc-if>'
    b.rep(MAIN, f'<main class="ab-app-shell__main">{BANDA}<div class="pagina"><div class="ini">{cuerpo}</div></div></main>')
    tweak(b, "rol", ["Solo lectura", "Administra su empresa"],
          "      administra: this.props.rol === 'Administra su empresa',\n"
          "      rolEmpresa: this.props.rol === 'Administra su empresa' ? 'Administrador' : 'Solo lectura',\n")
    b.guardar(ESTILO)


ESTILO_M = """<style data-vuelta="1004-M-Inicio-Org">
.c-top { flex-shrink: 0; background: linear-gradient(160deg, oklch(0.5 0.1 195), oklch(0.4 0.085 195)); color: #fff; padding-bottom: 46px; }
.c-top .ap-est { background: transparent; color: #fff; }
.c-hola { padding: 10px 20px 0; }
.c-hola span { font-size: 15px; color: oklch(1 0 0 / 0.82); }
.c-hola h1 { margin: 2px 0 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
.c-hoja { flex: 1; min-height: 0; margin-top: -26px; background: #fff; border-radius: 24px 24px 0 0; position: relative; z-index: 1; display: flex; flex-direction: column; overflow: hidden; }
.c-atajos { display: grid; grid-template-columns: repeat(4, 1fr); row-gap: 16px; padding: 22px 8px 18px; }
.c-atajos a { display: flex; flex-direction: column; align-items: center; gap: 7px; text-decoration: none; color: var(--t1); font-size: 12.5px; font-weight: 500; }
.c-circ { width: 56px; height: 56px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; position: relative; }
.c-circ svg { width: 24px; height: 24px; }
.c-bad { position: absolute; top: -2px; right: -2px; min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 10px; background: oklch(0.57 0.2 25); color: #fff; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff; }
.c-raya { height: 8px; background: oklch(0.965 0.006 78); flex-shrink: 0; }
.c-tit { display: flex; align-items: baseline; gap: 8px; padding: 16px 20px 4px; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
.c-tit span { font-size: 14px; font-weight: 600; color: var(--t3); }
.c-p { display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 20px; position: relative; }
.c-p + .c-p::before { content: ""; position: absolute; top: 0; left: 72px; right: 0; height: 1px; background: var(--borde); }
.c-ic { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.c-ic svg { width: 20px; height: 20px; }
.c-ic.mal { background: oklch(0.95 0.035 25); color: oklch(0.52 0.19 25); }
.c-ic.alerta { background: oklch(0.96 0.05 85); color: oklch(0.5 0.12 70); }
.c-p .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.c-p b { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-p .tx > span { font-size: 13px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-p .e.mal { color: oklch(0.52 0.19 25); font-weight: 500; }
.c-p .e.alerta { color: oklch(0.5 0.12 70); font-weight: 500; }
.c-btn { height: 34px; padding: 0 14px; border-radius: 17px; background: var(--marca-t); color: var(--marca-tx); font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; text-decoration: none; flex-shrink: 0; }
</style>"""
APP = {"Mas": "M-WA-Menu", "Chats": "M-WA-Chats", "Contactos": "M-WA-Contactos", "Difusiones": "M-WA-Difusiones"}


def inicio_movil():
    atajos = '<div class="c-atajos">' + "".join(
        f'<a href="{m}.dc.html"><span class="c-circ">{I[a]}{f"<span class=c-bad>{n}</span>" if n else ""}</span>{corto}</a>'
        for a, _, _, _, m, corto, n in AREAS) + "</div>"
    estados = {"Vencida": "Invitación vencida"}
    filas = "".join(f'<div class="c-p"><span class="c-ic {cl}">{I[a]}</span><span class="tx"><b>{q}</b><span><span class="e {cl}">{estados.get(e, e)}</span> · {ar}</span></span>'
                    f'<a class="c-btn" href="{m}.dc.html">{ac}</a></div>' for a, q, _, ar, e, cl, _, ac, _, m in PEND)
    contenido = (f'<div class="c-top">{estado()}<div class="c-hola"><span>Hola, Lucía</span><h1>Grupo Delta</h1></div></div>'
                 f'<div class="c-hoja">{atajos}<div class="c-raya"></div><div class="c-tit">Para resolver<span>{len(PEND)}</span></div>{filas}</div>'
                 + nav("inicio"))
    pagina("T-Inicio-Org", contenido, ESTILO_X + "\n" + ESTILO_M, "Inicio · teléfono")
    t = (SALIDA / "T-Inicio-Org.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"T-App-(\w+)\.dc\.html", lambda m: f"{APP[m.group(1)]}.dc.html", t)
    (PROJ / "M-Inicio-Org.dc.html").write_text(t, encoding="utf-8")
    print("ok M-Inicio-Org")


def lienzo():
    ruta = PROJ / "canvas.json"
    t = ruta.read_text(encoding="utf-8")
    c = json.loads(t)
    for k, nuevo in (("Inicio-Org.dc.html", "Inicio · /org"), ("Inicio-Miembro.dc.html", "Inicio de alguien con roles en una empresa"),
                     ("M-Inicio-Org.dc.html", "Inicio · teléfono")):
        viejo = json.dumps(c["boards"][k]["title"], ensure_ascii=False)
        if viejo != json.dumps(nuevo, ensure_ascii=False):
            t = t.replace('"title": ' + viejo, '"title": ' + json.dumps(nuevo, ensure_ascii=False), 1)
    ruta.write_text(t, encoding="utf-8", newline="")


if __name__ == "__main__":
    inicio_org()
    inicio_miembro()
    inicio_movil()
    lienzo()
