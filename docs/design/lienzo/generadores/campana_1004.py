"""La campana de avisos (decisión del usuario del 2026-10-25, pantallas-y-ui.md del front, f922f208; pedido de la Guía).

Cada aviso en un solo lugar: lo que acabás de hacer, en el aviso de abajo; el estado del objeto, en la banda; todo lo demás
(lo que llegó, lo que falló en segundo plano, lo que espera a alguien), en la campana del encabezado, con su número, y cada
aviso lleva a donde se resuelve. Ningún cartel en el cuerpo de una pantalla, salvo el que la bloquea entera.

- La campana en el encabezado de todos los tableros de la compu con sesión (las dos formas de encabezado), al lado del nombre:
  4 en la organización, 2 en Plataforma y 1 en el perfil personal.
- En el teléfono, en la barra de arriba de las pantallas principales (Inicio, Chats, Contactos, Más y el inicio personal).
- `Campana` (la lista abierta sobre Formularios) y `M-Campana` (la lista en su pantalla), nuevos, en la página Organización.

Corre al final de todo. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
APROBADO = True  # el usuario la aprobó el 25/10 («publica y commitea», versión 140)
PARA_APROBAR = " · para aprobar"


def svg(d, w=20, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CAMPANA = svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>')
LLEGO = svg('<path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"/><path d="M5.5 6.5h13L20 13.5v5H4v-5z"/>', 18)
FALLO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8v.2"/>', 18)
ESPERA = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 18)
CANT = {"org": "4", "propuesta-whatsapp": "4", "formularios": "4", "plataforma": "2", "plat-formularios": "2", "personal": "1"}
AVISOS = [  # (tipo, ícono, texto, cuándo, destino en la compu, destino en el teléfono)
    ("llego", LLEGO, "Llegaron 5 tickets de combustible que no encajan en ningún formulario", "hace 10 min", "FRM-Faltan.dc.html", "M-FRM-Faltan.dc.html"),
    ("fallo", FALLO, "WhatsApp rechazó la versión 3 de Control de vehículo", "hace 1 hora", "FRM-Publicando.dc.html", "M-FRM-Editor.dc.html"),
    ("espera", ESPERA, "4 respuestas por aprobar", "hoy, 09:12", "FRM-Formularios.dc.html", "M-FRM-Respuestas.dc.html"),
    ("fallo", FALLO, "No se pudo mandar el aviso de <span class=\"cod\">VIS-000126</span>", "ayer", "FRM-Respuesta-Aprobacion.dc.html", "M-FRM-Respuesta-Aprobacion.dc.html"),
]
CSS = """.w-cmp-env { position: relative; display: inline-flex; margin-left: auto; margin-right: 6px; }
.w-campana { position: relative; width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: var(--t2); text-decoration: none; }
.w-campana:hover, .w-campana.on { background: oklch(0.24 0.014 78 / 0.06); color: var(--t1); }
.w-campana .n { position: absolute; top: 2px; right: 1px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 2px solid oklch(0.95 0.018 76); }
.w-cmp-env + .w-umd, .w-cmp-env + .envoltura { margin-left: 0 !important; }
.cmp-lista { position: absolute; z-index: 40; top: calc(100% + 8px); right: 0; width: 420px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; box-shadow: 0 16px 40px oklch(0.24 0.014 78 / 0.18); overflow: hidden; text-align: left; }
.cmp-cab { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--borde); font-size: 15px; font-weight: 700; color: var(--t1); }
.cmp-cab span { font-size: 13px; font-weight: 500; color: var(--t3); }
.cmp-it { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; text-decoration: none; color: var(--t1); }
.cmp-it + .cmp-it { border-top: 1px solid var(--borde); }
.cmp-it:hover { background: var(--s2); }
.cmp-ic { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: var(--s2); color: var(--t2); }
.cmp-ic.fallo { background: var(--peligro-t); color: oklch(0.52 0.19 25); }
.cmp-ic.espera { background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); }
.cmp-ic.llego { background: var(--marca-t); color: var(--marca-tx); }
.cmp-tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: 14px; line-height: 1.35; }
.cmp-tx small { font-size: 12.5px; color: var(--t3); }
.cmp-vacia { padding: 28px 16px; text-align: center; font-size: 14px; color: var(--t2); }
.cod { white-space: nowrap; }
"""
CSS_TEL = """.ap-bar .ap-campana, .c-campana { position: relative; }
.ap-campana .n, .c-campana .n { position: absolute; top: 2px; right: 0; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 2px solid #fff; }
.c-top { position: relative; }
.c-campana { position: absolute; top: 52px; right: 16px; width: 44px; height: 44px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; background: oklch(1 0 0 / 0.14); }
.c-campana .n { border-color: transparent; background: #fff; color: var(--marca-tx); }
.cp-fila { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; text-decoration: none; color: var(--t1); border-bottom: 1px solid var(--borde); }
.cp-fila .tx { display: flex; flex-direction: column; gap: 3px; font-size: 15.5px; line-height: 1.35; flex: 1; min-width: 0; }
.cp-fila .tx small { font-size: 13px; color: var(--t3); }
.cp-fila .chev { color: var(--t3); align-self: center; }
"""


def boton(n, href="Campana.dc.html", abierto=False, lista=""):
    return (f'<span class="w-cmp-env"><a class="w-campana{" on" if abierto else ""}" href="{href}" aria-label="Avisos: {n}">{CAMPANA}<span class="n">{n}</span></a>'
            f"{lista}</span>")


def lista(vacia=False):
    if vacia:
        cuerpo = '<div class="cmp-vacia">No hay avisos.</div>'
    else:
        cuerpo = "".join(f'<a class="cmp-it" href="{d}"><span class="cmp-ic {tipo}">{ic}</span><span class="cmp-tx">{tx}<small>{cuando}</small></span></a>'
                         for tipo, ic, tx, cuando, d, _m in AVISOS)
    return (f'<div class="cmp-lista" role="dialog" aria-label="Avisos"><div class="cmp-cab">Avisos<span>{"" if vacia else len(AVISOS)}</span></div>{cuerpo}</div>')


def css(t, bloque, marca):
    if f'data-campana="{marca}"' in t:
        return re.sub(rf'<style data-campana="{marca}">.*?</style>\n', f'<style data-campana="{marca}">\n{bloque}</style>\n', t, count=1, flags=re.S)
    return t.replace("</helmet>", f'<style data-campana="{marca}">\n{bloque}</style>\n</helmet>', 1)


def con_campana(t, n):
    """Pone la campana al lado del nombre, en las dos formas de encabezado de la compu."""
    if 'class="w-cmp-env"' in t:
        return t
    hechos = 0
    if '<details class="w-umd">' in t:
        t = t.replace('<details class="w-umd">', boton(n) + '<details class="w-umd">')
        hechos += 1
    if '<span class="envoltura">' in t and 'class="ab-topbar"' in t:
        k = t.index('class="ab-topbar"')
        i = t.index('<span class="envoltura">', k)
        t = t[:i] + boton(n) + t[i:]
        hechos += 1
    return css(t, CSS, "1") if hechos else t


TEL_RAIZ = {"M-WA-Chats": "4", "M-WA-Menu": "4", "M-WA-Contactos": "4", "M-Inicio-Personal": "1"}


def con_campana_tel(t, n):
    if "ap-campana" in t or "c-campana" in t:
        return t
    b = f'<a class="ap-ib ap-campana" href="M-Campana.dc.html" aria-label="Avisos: {n}">{CAMPANA}<span class="n">{n}</span></a>'
    salida, k = [], 0
    for m in re.finditer(r'<div class="ap-bar">', t):
        i = m.start()
        uno = t.index("</div>", t.index('<div class="tit">', i)) + len("</div>")
        cierre = t.index("</div>", uno)
        salida.append((cierre, b))
    for cierre, h in reversed(salida):
        t = t[:cierre] + h + t[cierre:]
    return css(t, CSS_TEL, "tel") if salida else t


def inicio_tel():
    t = (PROJ / "M-Inicio-Org.dc.html").read_text(encoding="utf-8")
    if "c-campana" not in t:
        b = f'<a class="c-campana" href="M-Campana.dc.html" aria-label="Avisos: 4">{CAMPANA}<span class="n">4</span></a>'
        assert t.count('<div class="c-hola">') >= 1
        t = t.replace('<div class="c-hola">', b + '<div class="c-hola">')
        t = css(t, CSS_TEL, "tel")
    (PROJ / "M-Inicio-Org.dc.html").write_text(t, encoding="utf-8")


# ================================================================ Campana (la lista abierta) y M-Campana
ESTADOS = ["Con avisos", "Sin avisos"]


def campana():
    t = (PROJ / "FRM-Formularios.dc.html").read_text(encoding="utf-8")
    t = t.replace(boton("4"), boton("4", abierto=True, lista='<sc-if value="{{cmpCon}}" hint-placeholder-val="{{si}}">' + lista()
                                     + '</sc-if><sc-if value="{{cmpSin}}" hint-placeholder-val="{{no}}">' + lista(True) + "</sc-if>"), 1)
    assert "cmp-lista" in t
    props = {"campana": {"editor": "enum", "options": ESTADOS, "default": ESTADOS[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    t = t.replace("      si: true, no: false,\n", "      si: true, no: false,\n      cmpCon: (this.props.campana ?? 'Con avisos') === 'Con avisos', cmpSin: this.props.campana === 'Sin avisos',\n", 1)
    t = re.sub(r"<title>[^<]*</title>", "<title>Avisos · la campana</title>", t)
    t = t.replace('href="Campana.dc.html" aria-label="Avisos: 4"', 'href="#" aria-label="Avisos: 4" aria-expanded="true"', 1)
    (PROJ / "Campana.dc.html").write_text(t, encoding="utf-8")


def campana_tel():
    filas = "".join(f'<a class="cp-fila" href="{m}"><span class="cmp-ic {tipo}">{ic}</span><span class="tx">{tx}<small>{cuando}</small></span>'
                    f'<span class="chev">{svg("<path d=" + chr(34) + "m9.5 5.5 6.5 6.5-6.5 6.5" + chr(34) + "/>", 18, "2")}</span></a>'
                    for tipo, ic, tx, cuando, _d, m in AVISOS)
    bar = C.t_bar("Avisos", "Grupo Delta", "M-Inicio-Org.dc.html")
    cuerpo = {"Con avisos": bar + f'<div class="ap-cuerpo">{filas}</div>',
              "Sin avisos": bar + '<div class="ap-cuerpo"><div class="ap-vacio">No hay avisos.</div></div>'}
    t = C.tel_pagina(cuerpo, ESTADOS, {}, "Avisos · la campana · teléfono", CSS + CSS_TEL)
    (PROJ / "M-Campana.dc.html").write_text(t, encoding="utf-8")


NUEVOS = {"Campana": (4560, 2300, 1440, 900, "Avisos · la campana"), "M-Campana": (6110, 3320, 390, 844, "Avisos · la campana · teléfono")}


def registrar(tocados):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (x, y, w, h, titulo) in NUEVOS.items():
        c["boards"].setdefault(f"{n}.dc.html", {"h": h, "is_interactive": True, "page": "org", "title": titulo, "w": w, "x": x, "y": y})
    for n in tocados:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    hechos = []
    for k, v in c["boards"].items():
        n = k[:-8]
        if n.startswith("M-") or v.get("page") not in CANT or n in NUEVOS:
            continue
        f = PROJ / k
        t = f.read_text(encoding="utf-8")
        nuevo = con_campana(t, CANT[v["page"]])
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    print("campana en", len(hechos), "tableros de la compu")
    for n, cant in TEL_RAIZ.items():
        f = PROJ / f"{n}.dc.html"
        t = f.read_text(encoding="utf-8")
        f.write_text(con_campana_tel(t, cant), encoding="utf-8")
    inicio_tel()
    campana()
    campana_tel()
    registrar(list(NUEVOS))
    print("listo")
