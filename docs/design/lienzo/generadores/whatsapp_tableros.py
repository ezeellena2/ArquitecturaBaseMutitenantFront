"""Propuesta · WhatsApp: chats, ficha del contacto y administración del número, en web y en celular."""
import json
import pathlib

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
PAGINA = "propuesta-whatsapp"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
HEAD_BASE = botones.split("</helmet>", 1)[0]

ARENA, ARENA_B, PANEL, CAB = "oklch(0.925 0.02 75)", "oklch(0.87 0.022 75)", "oklch(0.905 0.022 75)", "oklch(0.945 0.018 76)"

CSS = f"""  <style data-propuesta="whatsapp">
body {{ margin: 0; }}
.w-app {{ display: flex; width: 1440px; height: 900px; overflow: hidden; background: var(--fondo); font-family: Inter, system-ui, sans-serif; font-size: 13px; color: var(--t1); position: relative; }}
.w-sb {{ width: 232px; flex-shrink: 0; background: {ARENA}; border-right: 1px solid {ARENA_B}; display: flex; flex-direction: column; }}
.w-mk {{ height: 52px; flex-shrink: 0; display: flex; align-items: center; gap: 10px; padding: 0 14px; font-size: 14px; font-weight: 700; border-bottom: 1px solid {ARENA_B}; }}
.w-br {{ width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, oklch(0.5 0.1 195), oklch(0.58 0.11 170)); flex-shrink: 0; }}
.w-cx {{ padding: 12px 14px; line-height: 1.35; }}
.w-cx b {{ display: block; font-size: 14px; }}
.w-cx span {{ color: var(--t3); font-size: 12.5px; }}
.w-nav {{ display: flex; flex-direction: column; gap: 2px; padding: 4px 8px; }}
.w-ln {{ display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 10px; border-radius: 8px; color: oklch(0.42 0.018 60); }}
.w-ln svg {{ flex-shrink: 0; }}
.w-ln.on {{ background: #fff; color: oklch(0.43 0.09 195); font-weight: 600; box-shadow: 0 1px 2px oklch(0.24 0.012 60 / 0.08), 0 0 0 1px var(--borde); }}
.w-ln .cnt {{ margin-left: auto; font-size: 12px; font-weight: 600; color: oklch(0.43 0.09 195); }}
.w-ln.grupo {{ font-weight: 600; color: var(--t1); }}
.w-ln .fl {{ margin-left: auto; color: var(--t3); display: inline-flex; }}
.w-esp {{ flex: 1; }}
.w-abajo {{ border-top: 1px solid {ARENA_B}; padding: 8px; }}
.w-us {{ border-top: 1px solid {ARENA_B}; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }}
.w-us .tx {{ display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }}
.w-us .tx span {{ color: var(--t3); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
.w-panel {{ width: 232px; flex-shrink: 0; background: {PANEL}; border-right: 1px solid oklch(0.85 0.026 75); display: flex; flex-direction: column; }}
.w-panel .pc {{ height: 52px; display: flex; align-items: center; padding: 0 14px; font-size: 14px; font-weight: 700; border-bottom: 1px solid oklch(0.85 0.026 75); }}
.w-panel .w-nav {{ padding: 10px 8px; }}
.w-av {{ width: 32px; height: 32px; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }}
.w-av.g {{ background: oklch(0.9 0.012 78); color: var(--t2); }}
.w-av.chico {{ width: 28px; height: 28px; font-size: 12px; }}
.w-co {{ flex: 1; min-width: 0; display: flex; flex-direction: column; }}
.w-tb {{ height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: {ARENA}; border-bottom: 1px solid {ARENA_B}; color: var(--t2); }}
.w-tb .um {{ display: inline-flex; align-items: center; gap: 10px; padding: 4px 8px 4px 4px; border-radius: 10px; }}
.w-tb .um .tx {{ display: flex; flex-direction: column; line-height: 1.25; }}
.w-tb .um b {{ color: var(--t1); font-size: 13px; }}
.w-tb .um span {{ font-size: 12px; }}
.w-bnd {{ flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; box-sizing: border-box; padding: 10px 24px; background: #fff; border-bottom: 1px solid var(--borde); }}
.w-bnd .iz {{ display: flex; align-items: center; gap: 12px; min-width: 0; }}
.w-bnd .ic {{ width: 36px; height: 36px; border-radius: 10px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.w-bnd .vol {{ width: 28px; height: 28px; box-sizing: border-box; border-radius: 7px; border: 1px solid var(--borde); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.w-bnd h1 {{ margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; }}
.w-bnd .res {{ margin: 2px 0 0; font-size: 13px; color: var(--t2); }}
.w-bnd .ac {{ display: flex; align-items: center; gap: 8px; flex-shrink: 0; }}
.w-est {{ display: inline-flex; align-items: center; gap: 6px; }}
.w-est::before {{ content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }}
.w-est.off::before {{ background: oklch(0.75 0.01 78); }}
.w-est.pend::before {{ background: oklch(0.72 0.15 70); }}
.w-body {{ flex: 1; min-height: 0; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }}
.w-caja {{ background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }}
.w-cab {{ display: flex; align-items: center; justify-content: space-between; min-height: 40px; box-sizing: border-box; padding: 0 4px 0 16px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; }}
.w-it {{ display: flex; align-items: center; gap: 12px; min-height: 56px; box-sizing: border-box; padding: 6px 8px 6px 16px; border-bottom: 1px solid var(--borde); }}
.w-it:last-child {{ border-bottom: 0; }}
.w-it .dato {{ flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }}
.w-it .dato b {{ font-weight: 500; }}
.w-it .dato span {{ font-size: 12px; color: var(--t3); }}
.w-sw {{ width: 36px; height: 20px; border-radius: 999px; background: var(--marca); position: relative; flex-shrink: 0; }}
.w-sw::after {{ content: ""; position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px oklch(0.2 0 0 / 0.2); }}
.w-sw.off {{ background: oklch(0.85 0.01 78); }}
.w-sw.off::after {{ right: auto; left: 2px; }}
.w-th, .w-tr {{ display: grid; grid-template-columns: 160px minmax(0, 1fr) 200px 120px 48px; gap: 16px; align-items: center; padding: 0 8px 0 16px; }}
.w-th {{ min-height: 40px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }}
.w-tr {{ min-height: 40px; border-bottom: 1px solid var(--borde); }}
.w-tr:nth-child(odd) {{ background: oklch(0.975 0.008 78); }}
.w-tr:last-child {{ border-bottom: 0; }}
.w-tr > span {{ min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
.w-tr .r {{ text-align: right; font-variant-numeric: tabular-nums; }}
.w-chat {{ flex: 1; min-height: 0; display: flex; background: #fff; border-top: 0; }}
.w-bandeja {{ width: 380px; flex-shrink: 0; border-right: 1px solid var(--borde); display: flex; flex-direction: column; }}
.w-bandeja .filtro {{ display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--borde); }}
.w-bus {{ flex: 1; height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 8px; background: var(--s2); display: flex; align-items: center; gap: 8px; padding: 0 12px; color: var(--t3); }}
.w-pil {{ height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 999px; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; color: var(--t2); background: #fff; white-space: nowrap; }}
.w-conv {{ display: flex; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--borde); align-items: flex-start; }}
.w-conv.on {{ background: var(--marca-t); }}
.w-conv .tx {{ flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }}
.w-conv .l1 {{ display: flex; justify-content: space-between; gap: 8px; }}
.w-conv .l1 b {{ font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
.w-conv .l1 span {{ font-size: 12px; color: var(--t3); flex-shrink: 0; }}
.w-conv .l2 {{ display: flex; justify-content: space-between; gap: 8px; font-size: 12.5px; color: var(--t3); }}
.w-conv .l2 span {{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
.w-conv.nuevo .l1 b, .w-conv.nuevo .l2 span {{ font-weight: 600; color: var(--t1); }}
.w-conv.nuevo .l1 span {{ color: var(--marca-tx); font-weight: 600; }}
.w-punto {{ width: 8px; height: 8px; border-radius: 50%; background: var(--marca); flex-shrink: 0; margin-top: 5px; }}
.w-hilo {{ flex: 1; min-width: 0; display: flex; flex-direction: column; }}
.w-hilo .hc {{ height: 60px; flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 0 12px 0 16px; border-bottom: 1px solid var(--borde); }}
.w-hilo .hc .tx {{ flex: 1; display: flex; flex-direction: column; line-height: 1.3; }}
.w-hilo .hc .tx b {{ font-size: 14px; font-weight: 600; }}
.w-hilo .hc .tx span {{ font-size: 12.5px; color: var(--t3); }}
.w-msjs {{ flex: 1; min-height: 0; background: oklch(0.975 0.008 78); padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }}
.w-dia {{ align-self: center; font-size: 12px; color: var(--t3); background: #fff; border: 1px solid var(--borde); border-radius: 999px; padding: 2px 10px; }}
.w-m {{ max-width: 62%; display: flex; flex-direction: column; gap: 3px; }}
.w-m .gl {{ padding: 8px 12px; border-radius: 12px; font-size: 13.5px; line-height: 1.45; }}
.w-m .pie {{ font-size: 11.5px; color: var(--t3); padding: 0 4px; }}
.w-m.ent {{ align-self: flex-start; }}
.w-m.ent .gl {{ background: #fff; border: 1px solid var(--borde); border-top-left-radius: 4px; }}
.w-m.sal {{ align-self: flex-end; align-items: flex-end; }}
.w-m.sal .gl {{ background: var(--marca-t); color: oklch(0.3 0.05 195); border-top-right-radius: 4px; }}
.w-escr {{ flex-shrink: 0; display: flex; gap: 8px; align-items: center; padding: 12px 16px; border-top: 1px solid var(--borde); background: #fff; }}
.w-escr .area {{ flex: 1; height: 40px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; display: flex; align-items: center; padding: 0 12px; color: var(--t3); }}
.w-cartel {{ display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 6px 8px 6px 14px; border-radius: 10px; font-size: 13px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }}
.w-cartel .tx {{ flex: 1; }}
.w-cartel.info {{ background: var(--marca-t); color: var(--marca-tx); }}
.w-vacio {{ display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 48px 16px; text-align: center; color: var(--t2); }}
.w-vacio .circ {{ width: 48px; height: 48px; border-radius: 50%; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }}
.w-vacio b {{ color: var(--t1); font-size: 14px; }}
.w-oscuro {{ position: absolute; inset: 0; z-index: 5; background: oklch(0.3 0.014 78 / 0.5); display: flex; align-items: center; justify-content: center; }}
.w-dlg {{ width: 560px; background: #fff; border-radius: 12px; box-shadow: 0 24px 48px oklch(0.2 0.014 78 / 0.28); overflow: hidden; }}
.w-dlg .dc {{ display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 8px 0 20px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 15px; font-weight: 600; }}
.w-dlg .db {{ padding: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }}
.w-dlg .df {{ display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); }}
.w-cmp {{ display: flex; flex-direction: column; gap: 6px; min-width: 0; }}
.w-cmp .rt {{ font-size: 12.5px; font-weight: 600; color: var(--t2); }}
.w-cmp .ct {{ height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; }}
.w-cmp .ct.area {{ height: 84px; align-items: flex-start; padding-top: 9px; line-height: 1.45; }}
.w-tel {{ width: 390px; height: 844px; overflow: hidden; background: var(--fondo); font-family: Inter, system-ui, sans-serif; font-size: 13px; color: var(--t1); display: flex; flex-direction: column; position: relative; }}
.w-tel .w-tb {{ padding: 0 12px; }}
.w-tel .w-bnd {{ padding: 10px 16px; }}
.w-tel .w-bnd h1 {{ font-size: 17px; }}
.w-tel .w-body {{ padding: 12px 16px; gap: 12px; }}
.w-tel .w-conv {{ padding: 12px 16px; }}
.w-tel .cb {{ height: 44px; }}
.w-tel .cb.ch {{ height: 36px; }}
.w-tel .ib {{ width: 44px; height: 44px; }}
.w-tel .w-escr {{ padding: 10px 12px 20px; }}
.w-tel .w-msjs {{ padding: 14px 12px; }}
.w-tel .w-m {{ max-width: 82%; }}
.w-hoja {{ position: absolute; z-index: 6; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; }}
.w-hoja .dc {{ display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 4px 0 16px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); border-radius: 16px 16px 0 0; font-size: 15px; font-weight: 600; }}
.w-hoja .db {{ padding: 16px; display: flex; flex-direction: column; gap: 14px; }}
.w-hoja .df {{ display: flex; gap: 8px; padding: 12px 16px 24px; border-top: 1px solid var(--borde); }}
.w-hoja .df .cb {{ flex: 1; }}
.w-fija {{ margin-top: auto; flex-shrink: 0; }}
.w-hijos {{ margin-left: 18px; padding-left: 10px; border-left: 1px solid oklch(0.85 0.026 75); display: flex; flex-direction: column; gap: 2px; }}
.w-panel .w-hijos {{ border-left-color: oklch(0.82 0.03 75); }}
.w-th.c, .w-tr.c {{ grid-template-columns: minmax(0, 1fr) 220px 200px 140px 48px; }}
.w-th.p, .w-tr.p {{ grid-template-columns: minmax(0, 1fr) 180px 200px 200px 48px; }}
.w-pie {{ display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 16px; border-top: 1px solid var(--borde); font-size: 13px; color: var(--t2); }}
.w-cajon {{ position: absolute; z-index: 6; left: 0; top: 0; bottom: 0; width: 300px; background: oklch(0.925 0.02 75); display: flex; flex-direction: column; box-shadow: 8px 0 24px oklch(0.2 0.014 78 / 0.2); }}
.w-cajon .w-ln {{ height: 38px; }}
:where(.w-app, .w-tel) a {{ text-decoration: none; color: inherit; cursor: pointer; }}
  </style>"""


def svg(d, w=18, sw="1.75"):
    return f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'


I = {
    "casa": svg('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    "chat": svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>'),
    "engr": svg('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
    "gente": svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>'),
    "edif": svg('<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2"/>'),
    "mundo": svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.6 2.5 14.4 0 17"/><path d="M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'),
    "lista": svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    "wa": svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>'),
    "volver": svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2"),
    "abajo": svg('<path d="m7 10 5 5 5-5"/>', 14, "2"),
    "der": svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', 14, "2"),
    "lupa": svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>', 16),
    "menu": svg('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>', 20),
    "x": svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2"),
    "reloj": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 18, "2"),
    "info": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 18, "2"),
}
KEBAB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>'
MAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>'


def kebab(nombre):
    return f'<button type="button" class="ib" aria-label="Acciones de {nombre}">{KEBAB}</button>'


def sidebar(activo, admin):
    """Menú principal: Inicio y el grupo WhatsApp (Chats, Contactos). El grupo se abre si uno de sus hijos está activo."""
    destino = {"chats": "WA-Chats.dc.html", "contactos": "WA-Contactos.dc.html"}
    hijo = lambda clave, texto, extra="": f'<a class="w-ln{" on" if activo == clave else ""}" href="{destino[clave]}">{texto}{extra}</a>'
    abierto = activo in ("chats", "contactos")
    grupo = (f'<span class="w-ln grupo">{I["wa"]} WhatsApp <span class="fl">{I["abajo"] if abierto else I["der"]}</span></span>'
             + (f'<div class="w-hijos">{hijo("chats", "Chats", "<span class=\"cnt\">3</span>")}{hijo("contactos", "Contactos")}</div>' if abierto else ""))
    return (f'<aside class="w-sb" aria-label="Menú principal"><div class="w-mk"><span class="brand" style="width: 28px; height: 28px; border-radius: 8px;"></span>ArquitecturaBase</div>'
            f'<div class="w-cx"><b>Grupo Delta</b><span>Organización</span></div>'
            f'<nav class="w-nav"><span class="w-ln{" on" if activo == "inicio" else ""}">{I["casa"]} Inicio</span>{grupo}</nav>'
            f'<div class="w-esp"></div>'
            f'<div class="w-abajo"><a class="w-ln{" on" if admin else ""}" href="WA-Admin.dc.html">{I["engr"]} Administración <span class="fl">{I["der"]}</span></a></div>'
            f'<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div></aside>')


def panel_admin(activo):
    """Panel de Administración: el grupo WhatsApp (Número, Respuestas automáticas, Plantillas) abierto."""
    destino = {"numero": "WA-Admin.dc.html", "respuestas": "WA-Respuestas.dc.html", "plantillas": "WA-Plantillas.dc.html"}
    hijo = lambda clave, texto: f'<a class="w-ln{" on" if activo == clave else ""}" href="{destino[clave]}">{texto}</a>'
    return (f'<aside class="w-panel" aria-label="Administración"><div class="pc">Administración</div><nav class="w-nav">'
            f'<span class="w-ln grupo">{I["gente"]} Gestión de usuarios <span class="fl">{I["der"]}</span></span>'
            f'<span class="w-ln">{I["edif"]} Empresas</span><span class="w-ln">{I["engr"]} Configuración</span>'
            f'<span class="w-ln">{I["mundo"]} Página pública</span>'
            f'<span class="w-ln grupo">{I["wa"]} WhatsApp <span class="fl">{I["abajo"]}</span></span>'
            f'<div class="w-hijos">{hijo("numero", "Número")}{hijo("respuestas", "Respuestas automáticas")}{hijo("plantillas", "Plantillas")}</div>'
            f'<span class="w-ln">{I["lista"]} Auditoría</span></nav></aside>')


def topbar(migas):
    return (f'<header class="w-tb"><span>{migas}</span><span class="um"><span class="w-av">L</span>'
            f'<span class="tx"><b>Lucía Fernández</b><span>Grupo Delta</span></span>{I["abajo"]}</span></header>')


def banda(titulo, resumen, acciones="", icono=None, volver=False):
    izq = (f'<a class="vol" href="{volver}" aria-label="Volver">{I["volver"]}</a>' if isinstance(volver, str)
           else f'<span class="vol">{I["volver"]}</span>' if volver else f'<span class="ic">{icono}</span>')
    return (f'<div class="w-bnd"><div class="iz">{izq}<div><h1>{titulo}</h1><p class="res">{resumen}</p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


CONVS = [
    ("ML", "Martina López", "¿Atienden hasta las 18?", "10:42", "on"),
    ("", "+54 9 351 555-0192", "Hola, quería consultar por el horario de atención.", "10:15", "nuevo"),
    ("FD", "Federico Díaz", "¿Siguen abiertos el sábado?", "Ayer", "nuevo"),
    ("JP", "Javier Pereyra", "Perfecto, gracias.", "Ayer", ""),
    ("CR", "Carla Ruiz", "Vos: Te esperamos.", "Lunes", ""),
    ("LM", "Laura Méndez", "Listo, ya lo recibí.", "28/09", ""),
    ("SG", "Sergio Gómez", "Vos: Cualquier cosa nos escribís.", "25/09", ""),
]


def bandeja(enlaces=None):
    filas = ""
    for ini, nombre, prev, hora, clase in CONVS:
        av = f'<span class="w-av{"" if ini else " g"}">{ini or I["wa"]}</span>'
        punto = '<span class="w-punto" aria-label="Sin leer"></span>' if clase == "nuevo" else ""
        href = (enlaces or {}).get(nombre)
        tag, attr = ("a", f' href="{href}"') if href else ("div", "")
        filas += (f'<{tag} class="w-conv {clase}"{attr}>{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
                  f'<span class="l2"><span>{prev}</span>{punto}</span></span></{tag}>')
    return filas


MENSAJES = f"""<span class="w-dia">Hoy</span>
<div class="w-m ent"><span class="gl">Hola, buen día. ¿Me pasan la dirección?</span><span class="pie">10:40</span></div>
<div class="w-m sal"><span class="gl">Hola. Gracias por escribir a Grupo Delta. En un momento te respondemos.</span><span class="pie">Respuesta automática · 10:40</span></div>
<div class="w-m sal"><span class="gl">Hola, Martina. Estamos en Av. Corrientes 1234, piso 3.</span><span class="pie">Lucía Fernández · 10:41</span></div>
<div class="w-m ent"><span class="gl">Genial, gracias. ¿Atienden hasta las 18?</span><span class="pie">10:42</span></div>"""


def web(cuerpo, activo, admin, migas):
    """admin: None, o la clave activa del grupo WhatsApp de Administración (numero, respuestas, plantillas)."""
    return (f'<div class="w-app">{sidebar(activo, admin is not None)}{panel_admin(admin) if admin else ""}'
            f'<div class="w-co">{topbar(migas)}{cuerpo}</div></div>')


def con_dialogo(pantalla, dialogo):
    """Mete el diálogo adentro de la raíz de la pantalla, para que el oscurecido la tape entera."""
    return pantalla[:-6] + dialogo + "</div>"


def tel_tb():
    return f'<header class="w-tb"><a style="display: inline-flex;" href="M-WA-Menu.dc.html" aria-label="Abrir el menú">{I["menu"]}</a><b style="font-size: 14px;">ArquitecturaBase</b><span class="w-av chico">L</span></header>'


TABLEROS = {}

# ===== Menú principal › WhatsApp › Chats =====
TABLEROS["WA-Chats"] = ("WhatsApp › Chats (web)", 1440, 900, web(
    banda("Chats", "7 conversaciones · 3 sin leer", icono=I["chat"]) +
    f"""<div class="w-chat">
      <div class="w-bandeja"><div class="filtro"><span class="w-bus">{I["lupa"]} Buscar por nombre o número</span><span class="w-pil">Sin leer {I["abajo"]}</span></div>{bandeja()}</div>
      <div class="w-hilo">
        <div class="hc"><span class="w-av">ML</span><span class="tx"><b>Martina López</b><span>+54 9 11 5555-4521</span></span><button type="button" class="cb cb-sec ch">Ver ficha</button>{kebab("Martina López")}</div>
        <div class="w-msjs">{MENSAJES}</div>
        <div class="w-escr"><span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div>
      </div>
    </div>""", "chats", None, "Inicio / WhatsApp / Chats"))

# ===== Menú principal › WhatsApp › Contactos =====
GUION = '<span style="color: var(--t3);">—</span>'
CONTACTOS = [("Martina López", "+54 9 11 5555-4521", "Hoy", "2"), (GUION, "+54 9 351 555-0192", "Hoy", "1"),
             ("Federico Díaz", "+54 9 11 5555-2087", "Ayer", "3"), ("Javier Pereyra", "+54 9 11 5555-7310", "Ayer", "5"),
             ("Carla Ruiz", "+54 9 11 5555-1146", "29/09/2026", "2"), ("Laura Méndez", "+54 9 11 5555-3378", "28/09/2026", "1"),
             ("Sergio Gómez", "+54 9 11 5555-9021", "25/09/2026", "2")]
filas_c = "".join(f'<div class="w-tr c"><span style="font-weight: 500;">{n}</span><span>{t}</span><span>{u}</span><span class="r">{k}</span><span style="display: flex; justify-content: flex-end;">{kebab(t)}</span></div>' for n, t, u, k in CONTACTOS)
TABLEROS["WA-Contactos"] = ("WhatsApp › Contactos (web)", 1440, 900, web(
    banda("Contactos", "7 contactos", icono=I["gente"]) +
    f"""<div class="w-body"><div class="w-caja" style="padding: 12px 16px;"><span class="w-bus" style="max-width: 360px;">{I["lupa"]} Buscar por nombre o número</span></div>
      <div class="w-caja"><div class="w-th c"><span>Nombre</span><span>Número</span><span>Última conversación</span><span style="text-align: right;">Conversaciones</span><span class="sr">Acciones</span></div>{filas_c}
      <div class="w-pie"><span>1–7 de 7</span><span>10 por página · Página 1 de 1</span></div></div></div>""",
    "contactos", None, "Inicio / WhatsApp / Contactos"))

# ===== Ficha del contacto (se abre desde Contactos o desde el chat) =====
HIST = [("Hoy", "¿Me pasan la dirección?", "Lucía Fernández", "4"), ("12/09/2026", "Hola, ¿cómo hago para pedir una factura?", "Tomás Acosta", "9")]
filas_hist = "".join(f'<div class="w-tr"><span>{f}</span><span>{m}</span><span>{a}</span><span class="r">{n}</span><span style="display: flex; justify-content: flex-end;">{kebab(f)}</span></div>' for f, m, a, n in HIST)
TABLEROS["WA-Contacto"] = ("WhatsApp › Ficha del contacto (web)", 1440, 900, web(
    banda("Martina López", "+54 9 11 5555-4521 · Escribe desde el 12/09/2026",
          acciones=f'{kebab("Martina López")}<button type="button" class="cb cb-sec">Editar contacto</button><a class="cb cb-pri" href="WA-Chats.dc.html">Abrir chat</a>', volver="WA-Contactos.dc.html") +
    f"""<div class="w-body"><div class="w-caja"><div class="w-cab"><span>Conversaciones</span></div>
      <div class="w-th"><span>Fecha</span><span>Primer mensaje</span><span>Respondió</span><span style="text-align: right;">Mensajes</span><span class="sr">Acciones</span></div>{filas_hist}</div></div>""",
    "contactos", None, "Inicio / WhatsApp / Contactos / Martina López"))

# ===== Administración › WhatsApp › Número =====
NUMERO = f"""<div class="w-caja"><div class="w-cab"><span>Datos del número</span></div>
  <div class="w-it"><span class="dato"><b>Grupo Delta</b><span>Nombre que ven tus clientes</span></span></div>
  <div class="w-it"><span class="dato"><b>Grupo Delta S.A.</b><span>Cuenta de Meta</span></span></div>
  <div class="w-it"><span class="dato"><b>15/09/2026</b><span>Conectado desde</span></span></div>
</div>"""
TABLEROS["WA-Admin"] = ("Administración › WhatsApp › Número (web)", 1440, 900, web(
    banda("Número", '<span class="w-est">Conectado</span> · +54 9 11 5555-0100', acciones=kebab("Número"), icono=I["wa"]) +
    f'<div class="w-body">{NUMERO}</div>', "", "numero", "Inicio / WhatsApp / Número"))
TABLEROS["WA-Admin-Vacio"] = ("Administración › WhatsApp › Número sin conectar (web)", 1440, 900, web(
    banda("Número", '<span class="w-est off">Sin conectar</span>', acciones='<button type="button" class="cb cb-pri">Conectar número</button>', icono=I["wa"]) +
    f'<div class="w-body"><div class="w-caja"><div class="w-vacio"><span class="circ">{I["wa"]}</span><b>Todavía no hay un número conectado.</b><span>Al conectarlo, entrás con tu cuenta de Meta y elegís el número de Grupo Delta.</span></div></div></div>',
    "", "numero", "Inicio / WhatsApp / Número"))

# ===== Administración › WhatsApp › Respuestas automáticas =====
RESP = f"""<div class="w-caja">
  <div class="w-it"><span class="dato"><b>Bienvenida</b><span>La primera vez que alguien escribe</span></span><span class="w-sw" role="switch" aria-checked="true" aria-label="Bienvenida"></span>{kebab("Bienvenida")}</div>
  <div class="w-it"><span class="dato"><b>Fuera de horario</b><span>Lunes a viernes, de 9 a 18</span></span><span class="w-sw" role="switch" aria-checked="true" aria-label="Fuera de horario"></span>{kebab("Fuera de horario")}</div>
</div>"""
RESPUESTAS = banda("Respuestas automáticas", "2 activas", icono=I["wa"]) + f'<div class="w-body">{RESP}</div>'
TABLEROS["WA-Respuestas"] = ("Administración › WhatsApp › Respuestas automáticas (web)", 1440, 900,
                             web(RESPUESTAS, "", "respuestas", "Inicio / WhatsApp / Respuestas automáticas"))
DLG = f"""<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Fuera de horario">
  <div class="dc"><span>Fuera de horario</span><button type="button" class="ib" aria-label="Cerrar">{I["x"]}</button></div>
  <div class="db">
    <div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Mensaje</span><div class="ct area">Hola. Ahora estamos fuera de horario. Te respondemos el próximo día hábil desde las 9.</div></div>
    <div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Días</span><div class="ct">Lunes, martes, miércoles, jueves y viernes {I["abajo"]}</div></div>
    <div class="w-cmp"><span class="rt">Desde</span><div class="ct">9:00 {I["abajo"]}</div></div>
    <div class="w-cmp"><span class="rt">Hasta</span><div class="ct">18:00 {I["abajo"]}</div></div>
  </div>
  <div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button></div>
</div></div>"""
TABLEROS["WA-Admin-Editar"] = ("Administración › WhatsApp › Editar respuesta (web)", 1440, 900,
                               con_dialogo(web(RESPUESTAS, "", "respuestas", "Inicio / WhatsApp / Respuestas automáticas"), DLG))

# ===== Administración › WhatsApp › Plantillas =====
PLANTILLAS = [("Seguimiento", "Utilidad", '<span class="w-est">Aprobada</span>', "20/09/2026"),
              ("Recordatorio", "Utilidad", '<span class="w-est">Aprobada</span>', "18/09/2026"),
              ("Novedades", "Marketing", '<span class="w-est pend">En revisión</span>', "30/09/2026")]
filas_p = "".join(f'<div class="w-tr p"><span style="font-weight: 500;">{n}</span><span>{c}</span><span>{e}</span><span>{f}</span><span style="display: flex; justify-content: flex-end;">{kebab(n)}</span></div>' for n, c, e, f in PLANTILLAS)
TABLEROS["WA-Plantillas"] = ("Administración › WhatsApp › Plantillas (web)", 1440, 900, web(
    banda("Plantillas", "3 plantillas · 2 aprobadas", acciones=f'<button type="button" class="cb cb-pri">{MAS} Nueva plantilla</button>', icono=I["wa"]) +
    f"""<div class="w-body"><div class="w-caja"><div class="w-th p"><span>Nombre</span><span>Categoría</span><span>Estado en Meta</span><span>Última modificación</span><span class="sr">Acciones</span></div>{filas_p}</div></div>""",
    "", "plantillas", "Inicio / WhatsApp / Plantillas"))


# ===== Teléfono =====
def ln_tel(texto, icono="", clase="", extra="", href=None):
    tag, attr = ("a", f' href="{href}"') if href else ("span", "")
    return f'<{tag} class="w-ln{(" " + clase) if clase else ""}"{attr}>{icono}{" " if icono else ""}{texto}{extra}</{tag}>'


FL_ABAJO = f'<span class="fl">{I["abajo"]}</span>'
FL_DER = f'<span class="fl">{I["der"]}</span>'
CNT3 = '<span class="cnt">3</span>'
TABLEROS["M-WA-Menu"] = ("Menú abierto · teléfono", 390, 844, f"""<div class="w-tel">{tel_tb()}
  <div style="flex: 1; background: var(--fondo);"></div>
  <a class="w-oscuro" href="M-WA-Chats.dc.html" aria-label="Cerrar el menú"></a>
  <aside class="w-cajon" aria-label="Menú">
    <div class="w-mk"><span class="brand" style="width: 28px; height: 28px; border-radius: 8px;"></span>ArquitecturaBase</div>
    <div class="w-cx"><b>Grupo Delta</b><span>Organización</span></div>
    <nav class="w-nav">
      {ln_tel("Inicio", I["casa"])}
      {ln_tel("WhatsApp", I["wa"], "grupo", FL_ABAJO)}
      <div class="w-hijos">{ln_tel("Chats", clase="on", extra=CNT3, href="M-WA-Chats.dc.html")}{ln_tel("Contactos", href="M-WA-Contacto.dc.html")}</div>
    </nav>
    <div class="w-esp"></div>
    <div class="w-abajo"><nav class="w-nav" style="padding: 0;">
      {ln_tel("Administración", I["engr"], "grupo", FL_ABAJO)}
      <div class="w-hijos">{ln_tel("Gestión de usuarios", extra=FL_DER)}{ln_tel("Empresas")}{ln_tel("Configuración")}{ln_tel("Página pública")}
        {ln_tel("WhatsApp", extra=FL_ABAJO)}
        <div class="w-hijos">{ln_tel("Número")}{ln_tel("Respuestas automáticas", href="M-WA-Admin.dc.html")}{ln_tel("Plantillas")}</div>
        {ln_tel("Auditoría")}</div>
    </nav></div>
    <div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>
  </aside></div>""")

TABLEROS["M-WA-Chats"] = ("Chats · teléfono", 390, 844, f"""<div class="w-tel">{tel_tb()}
  {banda("Chats", "7 conversaciones · 3 sin leer", icono=I["chat"])}
  <div style="display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--borde); background: #fff;"><span class="w-bus" style="height: 40px;">{I["lupa"]} Buscar</span><span class="w-pil" style="height: 40px;">Sin leer {I["abajo"]}</span></div>
  <div style="background: #fff; flex: 1;">{bandeja({"Martina López": "M-WA-Conversacion.dc.html", "Javier Pereyra": "M-WA-24h.dc.html"})}</div></div>""")

TABLEROS["M-WA-Conversacion"] = ("Conversación · teléfono", 390, 844, f"""<div class="w-tel">
  <div class="w-bnd" style="padding: 8px 4px 8px 8px;"><div class="iz"><button type="button" class="ib" aria-label="Volver a Chats">{I["volver"]}</button><span class="w-av">ML</span><div><h1 style="font-size: 15px;">Martina López</h1><p class="res" style="font-size: 12.5px;">+54 9 11 5555-4521</p></div></div><div class="ac">{kebab("Martina López")}</div></div>
  <div class="w-msjs">{MENSAJES}</div>
  <div class="w-escr"><span class="area" style="height: 44px;">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div></div>""")

TABLEROS["M-WA-24h"] = ("Conversación pasadas 24 h · teléfono", 390, 844, f"""<div class="w-tel">
  <div class="w-bnd" style="padding: 8px 4px 8px 8px;"><div class="iz"><button type="button" class="ib" aria-label="Volver a Chats">{I["volver"]}</button><span class="w-av">JP</span><div><h1 style="font-size: 15px;">Javier Pereyra</h1><p class="res" style="font-size: 12.5px;">+54 9 11 5555-7310</p></div></div><div class="ac">{kebab("Javier Pereyra")}</div></div>
  <div class="w-msjs"><span class="w-dia">Ayer</span>
    <div class="w-m ent"><span class="gl">¿Me confirman cuando esté listo?</span><span class="pie">16:20</span></div>
    <div class="w-m sal"><span class="gl">Sí, te avisamos por acá.</span><span class="pie">Tomás Acosta · 16:31</span></div>
    <div class="w-m ent"><span class="gl">Perfecto, gracias.</span><span class="pie">16:32</span></div></div>
  <div style="padding: 10px 12px 0; background: #fff; border-top: 1px solid var(--borde);"><div class="w-cartel">{I["reloj"]}<span class="tx">Pasaron más de 24 horas desde su último mensaje. Solo podés mandarle una plantilla.</span></div></div>
  <div class="w-escr" style="border-top: 0;"><button type="button" class="cb cb-pri" style="flex: 1;">Elegir plantilla</button></div></div>""")

TABLEROS["M-WA-Contacto"] = ("Ficha del contacto · teléfono", 390, 844, f"""<div class="w-tel">{tel_tb()}
  {banda("Martina López", "+54 9 11 5555-4521", acciones=f'{kebab("Martina López")}<a class="cb cb-pri ch" href="M-WA-Conversacion.dc.html">Abrir chat</a>', volver="M-WA-Chats.dc.html")}
  <div class="w-body"><div class="w-caja"><div class="w-cab"><span>Conversaciones</span></div>
    <div class="w-it"><span class="dato"><b>Hoy</b><span>¿Me pasan la dirección? · Lucía Fernández</span></span>{kebab("Hoy")}</div>
    <div class="w-it"><span class="dato"><b>12/09/2026</b><span>Hola, ¿cómo hago para pedir una factura? · Tomás Acosta</span></span>{kebab("12/09/2026")}</div>
  </div></div></div>""")

TABLEROS["M-WA-Admin"] = ("Respuestas automáticas · teléfono", 390, 844, f"""<div class="w-tel">{tel_tb()}
  {banda("Respuestas automáticas", "2 activas", icono=I["wa"])}
  <div class="w-body">{RESP}</div></div>""")

TABLEROS["M-WA-Editar"] = ("Editar respuesta · teléfono", 390, 844, f"""<div class="w-tel">{tel_tb()}
  {banda("Respuestas automáticas", "2 activas", icono=I["wa"])}
  <div class="w-body">{RESP}</div>
  <div class="w-oscuro" style="align-items: flex-end;"></div>
  <div class="w-hoja" role="dialog" aria-label="Fuera de horario">
    <div class="dc"><span>Fuera de horario</span><button type="button" class="ib" aria-label="Cerrar">{I["x"]}</button></div>
    <div class="db">
      <div class="w-cmp"><span class="rt">Mensaje</span><div class="ct area" style="height: 100px;">Hola. Ahora estamos fuera de horario. Te respondemos el próximo día hábil desde las 9.</div></div>
      <div class="w-cmp"><span class="rt">Días</span><div class="ct" style="height: 44px;">Lunes a viernes {I["abajo"]}</div></div>
      <div style="display: flex; gap: 12px;"><div class="w-cmp" style="flex: 1;"><span class="rt">Desde</span><div class="ct" style="height: 44px;">9:00 {I["abajo"]}</div></div><div class="w-cmp" style="flex: 1;"><span class="rt">Hasta</span><div class="ct" style="height: 44px;">18:00 {I["abajo"]}</div></div></div>
    </div>
    <div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button></div>
  </div></div>""")


def archivo(titulo, w, h, cuerpo):
    head = HEAD_BASE.replace("<title>Criterio · Botones</title>", f"<title>{titulo}</title>")
    script = (f"<script type=\"text/x-dc\" data-dc-script data-props='{{\"$preview\":{{\"width\":{w},\"height\":{h}}}}}'>\n"
              "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}\n</script>")
    return "\n".join([head, CSS, "</helmet>", "", cuerpo, "</x-dc>", "", script, "</body>", "</html>", ""])


def boton_a_enlace(html, texto_boton, clase, href, veces=None):
    viejo = f'<button type="button" class="{clase}">{texto_boton}</button>'
    assert viejo in html, viejo
    return html.replace(viejo, f'<a class="{clase}" href="{href}">{texto_boton}</a>')


def icono_a_enlace(html, etiqueta, contenido, href):
    viejo = f'<button type="button" class="ib" aria-label="{etiqueta}">{contenido}</button>'
    assert viejo in html, viejo
    return html.replace(viejo, f'<a class="ib" aria-label="{etiqueta}" href="{href}">{contenido}</a>')


ENLACES = {
    "WA-Chats": lambda h: boton_a_enlace(h, "Ver ficha", "cb cb-sec ch", "WA-Contacto.dc.html"),
    "WA-Contactos": lambda h: h.replace('<span style="font-weight: 500;">Martina López</span>', '<a style="font-weight: 600; color: var(--marca-tx);" href="WA-Contacto.dc.html">Martina López</a>'),
    "WA-Admin-Vacio": lambda h: boton_a_enlace(h, "Conectar número", "cb cb-pri", "WA-Admin.dc.html"),
    "WA-Respuestas": lambda h: icono_a_enlace(h, "Acciones de Fuera de horario", KEBAB, "WA-Admin-Editar.dc.html"),
    "WA-Admin-Editar": lambda h: boton_a_enlace(boton_a_enlace(icono_a_enlace(h, "Cerrar", I["x"], "WA-Respuestas.dc.html"),
                                                               "Cancelar", "cb cb-sec", "WA-Respuestas.dc.html"), "Guardar cambios", "cb cb-pri", "WA-Respuestas.dc.html"),
    "M-WA-Conversacion": lambda h: icono_a_enlace(icono_a_enlace(h, "Volver a Chats", I["volver"], "M-WA-Chats.dc.html"),
                                                  "Acciones de Martina López", KEBAB, "M-WA-Contacto.dc.html"),
    "M-WA-24h": lambda h: icono_a_enlace(h, "Volver a Chats", I["volver"], "M-WA-Chats.dc.html"),
    "M-WA-Admin": lambda h: icono_a_enlace(h, "Acciones de Fuera de horario", KEBAB, "M-WA-Editar.dc.html"),
    "M-WA-Editar": lambda h: boton_a_enlace(boton_a_enlace(icono_a_enlace(h, "Cerrar", I["x"], "M-WA-Admin.dc.html"),
                                                           "Cancelar", "cb cb-sec", "M-WA-Admin.dc.html"), "Guardar", "cb cb-pri", "M-WA-Admin.dc.html"),
}

for clave, (titulo, w, h, cuerpo) in TABLEROS.items():
    cuerpo = ENLACES.get(clave, lambda x: x)(cuerpo)
    (PROJ / f"{clave}.dc.html").write_text(archivo(titulo, w, h, cuerpo), encoding="utf-8")

# Índice: página propia. Web arriba (dos filas), teléfono abajo.
ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
if not any(p["id"] == PAGINA for p in c["pages"]):
    i = next(n for n, p in enumerate(c["pages"]) if p["id"] == "propuesta-cuenta") + 1
    c["pages"].insert(i, {"id": PAGINA, "name": "Propuesta · WhatsApp"})
fila1 = ["WA-Chats", "WA-Contactos", "WA-Contacto"]
fila2 = ["WA-Admin", "WA-Admin-Vacio", "WA-Respuestas", "WA-Admin-Editar", "WA-Plantillas"]
tel_orden = ["M-WA-Menu", "M-WA-Chats", "M-WA-Conversacion", "M-WA-24h", "M-WA-Contacto", "M-WA-Admin", "M-WA-Editar"]
web_orden = fila1 + fila2
for fila, claves in enumerate([fila1, fila2]):
    for col, clave in enumerate(claves):
        c["boards"][f"{clave}.dc.html"] = {"x": col * 1520, "y": 260 + fila * 1020, "w": 1440, "h": 900, "title": TABLEROS[clave][0], "page": PAGINA, "is_interactive": True}
for n, clave in enumerate(tel_orden):
    c["boards"][f"{clave}.dc.html"] = {"x": n * 470, "y": 260 + 2 * 1020, "w": 390, "h": 844, "title": TABLEROS[clave][0], "page": PAGINA, "is_interactive": True}
for clave in web_orden + tel_orden:
    if f"{clave}.dc.html" not in c["order"]:
        c["order"].append(f"{clave}.dc.html")
c["notes"]["t-propuesta-whatsapp"] = {"kind": "title1", "x": 0, "y": 0, "w": 600, "maxW": 1440 * 5 + 80 * 4, "text": "Organización · WhatsApp", "page": PAGINA}
c["launch"] = {"view": "canvas", "page": "criterio"}
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(TABLEROS))
