"""Marco de app para los teléfonos (decisión del 2026-10-03: el teléfono es una app, con barra de abajo).
Piezas: barra de estado, barra de título (con ‹ en pantallas internas), barra de abajo, «+» flotante, hoja desde abajo y filas."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent
BASE = (AQUI / "base" / "telefono.dc.html").read_text(encoding="utf-8")
SALIDA = AQUI / "salida"


def svg(d, w=24, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


I = {
    "lupa": svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>'),
    "filtro": svg('<path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/>'),
    "volver": svg('<path d="M15 5 8 12l7 7"/>', 24, "2"),
    "cerrar": svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 22, "2"),
    "casa": svg('<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/>'),
    "chat": svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/>'),
    "personas": svg('<circle cx="9" cy="8" r="3.5"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4"/><path d="M18 14.8c1.6.7 2.7 2.3 3 4.7"/>'),
    "megafono": svg('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>'),
    "mas": svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 26, "2.25"),
    "info": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2"),
    "alerta": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>', 20, "2"),
    "wa": svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>', 20),
    "kebab": ('<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.7"/>'
              '<circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.5" r="1.7"/></svg>'),
}
SENAL = ('<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="3" height="4" rx="1"/>'
         '<rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>')
BATERIA = ('<svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4"/>'
           '<rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor"/><path d="M23 4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/></svg>')

ESTILO = """<style data-propuesta="app-marco">
.ap { width: 390px; height: 844px; overflow: hidden; background: #fff; font-family: Inter, system-ui, sans-serif; color: var(--t1); display: flex; flex-direction: column; position: relative; }
.ap-est { height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 22px 0 30px; font-size: 15px; font-weight: 600; background: #fff; }
.ap-est .ic { display: inline-flex; align-items: center; gap: 6px; }
.ap-bar { height: 60px; flex-shrink: 0; display: flex; align-items: center; gap: 4px; padding: 0 6px 0 16px; background: #fff; }
.ap-bar.int { padding-left: 4px; }
.ap-bar .tit { flex: 1; min-width: 0; }
.ap-bar h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ap-bar.int h1 { font-size: 20px; }
.ap-bar .sub { display: block; font-size: 12.5px; font-weight: 500; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ap-ib { width: 44px; height: 44px; border: 0; background: none; color: var(--t1); display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; position: relative; flex-shrink: 0; text-decoration: none; }
.ap-cuerpo { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.ap-fila { display: flex; align-items: center; gap: 14px; padding: 12px 6px 12px 16px; position: relative; text-decoration: none; color: inherit; }
.ap-fila::after { content: ""; position: absolute; left: 16px; right: 0; bottom: 0; height: 1px; background: var(--borde); }
.ap-fila .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; padding-right: 10px; }
.ap-fila .l1 { display: flex; justify-content: space-between; gap: 8px; font-size: 15.5px; font-weight: 500; }
.ap-fila .l1 span { font-size: 12.5px; font-weight: 400; color: var(--t3); flex-shrink: 0; }
.ap-fila .l2 { font-size: 14px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ap-fila .l3 { font-size: 13px; color: var(--t3); }
.ap-fila .l3 .w-est { font-size: 13px; color: var(--t2); }
.ap-fila .ap-ib { color: var(--t2); margin-right: -4px; }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.w-est.mal { color: oklch(0.5 0.19 25) !important; }
.w-est.baja::before { background: oklch(0.72 0.15 70); }
.w-est.prog::before { background: var(--marca); }
.ap-i { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 22px; padding: 0; border: 0; background: none; color: oklch(0.52 0.19 25); vertical-align: middle; }
.ap-fab { position: absolute; z-index: 4; right: 16px; bottom: 110px; width: 56px; height: 56px; border-radius: 16px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px oklch(0.3 0.06 195 / 0.3), 0 2px 4px oklch(0.3 0.06 195 / 0.2); }
.ap-nav { flex-shrink: 0; display: grid; grid-template-columns: repeat(5, 1fr); padding: 8px 4px 28px; background: #fff; border-top: 1px solid var(--borde); }
.ap-nav a { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 500; color: var(--t2); text-decoration: none; }
.ap-nav .i { width: 56px; height: 30px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; position: relative; }
.ap-nav a.on { color: var(--marca-tx); font-weight: 600; }
.ap-nav a.on .i { background: var(--marca-t); }
.ap-nav .b { position: absolute; top: -3px; right: 4px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.ap-nav .yo { width: 26px; height: 26px; border-radius: 50%; background: var(--marca); color: #fff; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.ap-nav a.on .yo { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--marca); }
.ap-raya { position: absolute; z-index: 9; left: 50%; bottom: 8px; width: 134px; height: 5px; margin-left: -67px; border-radius: 3px; background: var(--t1); }
.ap-velo { position: absolute; inset: 0; z-index: 6; background: oklch(0.2 0.014 78 / 0.45); }
.ap-hoja { position: absolute; z-index: 7; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; box-shadow: 0 -8px 24px oklch(0.2 0.014 78 / 0.12); }
.ap-hoja .asa { align-self: center; width: 36px; height: 5px; border-radius: 3px; background: var(--borde2); margin: 8px 0 4px; }
.ap-hoja .hc { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 6px 4px 20px; }
.ap-hoja .hc h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; }
.ap-hoja .hb { padding: 8px 20px 16px; display: flex; flex-direction: column; gap: 14px; }
.ap-hoja .hp { display: flex; gap: 10px; padding: 8px 20px 34px; }
.ap-hoja .hp .cb { flex: 1; height: 48px; border-radius: 12px; font-size: 15px; }
</style>"""


def estado():
    return f'<div class="ap-est"><span>9:41</span><span class="ic">{SENAL}{BATERIA}</span></div>'


def barra(titulo, sub="", acciones="", volver=None):
    v = f'<a class="ap-ib" aria-label="Volver" href="{volver}">{I["volver"]}</a>' if volver else ""
    s = f'<span class="sub">{sub}</span>' if sub else ""
    return f'<div class="ap-bar{" int" if volver else ""}">{v}<div class="tit"><h1>{titulo}</h1>{s}</div>{acciones}</div>'


def nav(activo, sin_leer=2):
    items = [("inicio", I["casa"], "Inicio", "M-Inicio-Org.dc.html"), ("chats", I["chat"], "Chats", "T-App-Chats.dc.html"),
             ("contactos", I["personas"], "Contactos", "T-App-Contactos.dc.html"), ("difusiones", I["megafono"], "Difusiones", "T-App-Difusiones.dc.html")]
    h = '<nav class="ap-nav" aria-label="Secciones">'
    for clave, ic, txt, href in items:
        on = ' class="on" aria-current="page"' if clave == activo else ""
        b = f'<span class="b">{sin_leer}</span>' if clave == "chats" and sin_leer else ""
        h += f'<a{on} href="{href}"><span class="i">{ic}{b}</span>{txt}</a>'
    on = ' class="on" aria-current="page"' if activo == "mas" else ""
    return h + f'<a{on} href="T-App-Mas.dc.html"><span class="i"><span class="yo">L</span></span>Más</a></nav>'


def fab(etiqueta, href="#"):
    return f'<a class="ap-fab" aria-label="{etiqueta}" href="{href}">{I["mas"]}</a>'


def hoja(titulo, cuerpo, pie=""):
    p = f'<div class="hp">{pie}</div>' if pie else ""
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="' + titulo.replace('"', "") + '"><span class="asa"></span>'
            f'<div class="hc"><h2>{titulo}</h2><button type="button" class="ap-ib" aria-label="Cerrar">{I["cerrar"]}</button></div>'
            f'<div class="hb">{cuerpo}</div>{p}</div>')


def pagina(nombre, contenido, estilo="", titulo_doc=None):
    ini = BASE.index('<div class="w-tel">')
    fin = BASE.index("</x-dc>")
    t = BASE[:ini] + f'<div class="ap">{contenido}<span class="ap-raya"></span></div>\n' + BASE[fin:]
    t = t.replace("</helmet>", ESTILO + "\n" + estilo + "\n</helmet>", 1)
    if titulo_doc:
        t = t.replace("<title>Chats · teléfono</title>", f"<title>{titulo_doc}</title>", 1)
    SALIDA.mkdir(exist_ok=True)
    (SALIDA / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    return t
