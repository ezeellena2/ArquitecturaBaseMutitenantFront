"""Etapa 11, WhatsApp de atención: los tableros sin contradicciones y con los estados que faltan («Para Diseño» del plan
docs/plans/2026-10-13-etapa-11-whatsapp.md del back, decisiones D1 a D8 del 2026-10-13) y la regla de secciones, pestañas y
filtros del 13/10. Corre al final, después de formularios_catalogos_1004.py. Cada tablero lleva la marca `data-e11` y no se
vuelve a tocar si ya la tiene; para rehacerlo, se restaura desde git y se vuelve a correr."""
import json
import pathlib
import re
import sys

from estados_util import con_estados_pantalla, marcar, rep, sumar_opcion

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = "data-e11"

CHEV = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')
CERRAR = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
CERRAR_TEL = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
CHEV_TEL = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')


# ---------------------------------------------------------------- ayudas

def leer(nombre):
    return (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


def escribir(nombre, t):
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print(nombre)


def cierre_div(t, i):
    """Posición justo después del </div> que cierra el <div …> que empieza en i."""
    prof = 0
    for k in re.finditer(r"<div\b|</div>", t[i:]):
        prof += 1 if k.group(0) == "<div" else -1
        if prof == 0:
            return i + k.end()
    raise AssertionError("div sin cerrar")


def estados_compu(t, nombre):
    """Tablero de compu sin estados: el contenido (banda y cuerpo) y lo que se abre encima quedan en `e0`, con el Tweak «estado»."""
    i = t.index('<div class="w-co">')
    fin_co = cierre_div(t, i)
    j = t.index('<div class="w-bnd">', i)
    k = fin_co - len("</div>")
    fin_app = t.rindex("</div>", 0, t.index("</x-dc>"))
    encima = t[fin_co:fin_app]
    t = (t[:j] + '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">' + t[j:k] + "</sc-if>" + t[k:fin_co]
         + '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">' + encima + "</sc-if>" + t[fin_app:])
    props = json.dumps({"estado": {"editor": "enum", "options": [nombre], "default": nombre, "section": "Estado"},
                        "$preview": {"width": 1440, "height": 900}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\":{\"width\":1440,\"height\":900}}'", f"data-props='{props}'")
    n = json.dumps(nombre, ensure_ascii=False)
    return rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
               "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.estado ?? {n};\n\n    return {{\n      si: true,\n      no: false,\n      e0: e === {n},\n    }};\n  }}\n}}")


def bloques(t, var):
    """Los bloques `<sc-if value="{{var}}">` de primer nivel, como (inicio, fin)."""
    res = []
    for m in re.finditer(r'<sc-if value="\{\{' + re.escape(var) + r'\}\}"[^>]*>', t):
        prof = 0
        for k in re.finditer(r"<sc-if\b|</sc-if>", t[m.start():]):
            prof += 1 if k.group(0) == "<sc-if" else -1
            if prof == 0:
                res.append((m.start(), m.start() + k.end()))
                break
    return res


def sumar_estado(t, nombre, cambios=(), encima=None, base="e0", tras=None, encima_base=True, al_final=""):
    """Suma el estado `nombre`: copia el contenido de `base` con `cambios` [(viejo, nuevo[, veces])]. Lo que se abre encima es
    `encima` (html) o, si es None y `encima_base`, lo de `base`. Devuelve el texto con la opción nueva después de `tras`."""
    m = re.findall(r"\n      (e\d+): e === ", t)
    var = f"e{max(int(x[1:]) for x in m) + 1}"
    bs = bloques(t, base)
    i, j = bs[0]
    nuevo = re.sub(r'^<sc-if value="\{\{' + base + r'\}\}" hint-placeholder-val="\{\{(si|no)\}\}">',
                   '<sc-if value="{{' + var + '}}" hint-placeholder-val="{{no}}">', t[i:j], count=1)
    for c in cambios:
        viejo, bueno = c[0], c[1]
        veces = c[2] if len(c) > 2 else 1
        assert nuevo.count(viejo) == veces, (nombre, viejo[:120], nuevo.count(viejo))
        nuevo = nuevo.replace(viejo, bueno)
    if al_final:
        nuevo = nuevo[:-len("</sc-if>")] + al_final + "</sc-if>"
    # El contenido va después del último bloque de contenido de cualquier estado.
    ult = max(b[0][1] for b in (bloques(t, v) for v in re.findall(r"\n      (e\d+): e === ", t)) if b)
    t = t[:ult] + nuevo + t[ult:]
    if encima is None and encima_base and len(bloques(t, base)) > 1:
        a, b = bloques(t, base)[1]
        encima = t[a:b][t[a:b].index(">") + 1:-len("</sc-if>")]
    if encima:
        fin_app = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:fin_app] + '<sc-if value="{{' + var + '}}" hint-placeholder-val="{{no}}">' + encima + "</sc-if>" + t[fin_app:]
    ops = re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]', t)
    ultimo = json.loads("[" + ops.group(1) + "]")[-1]
    t = sumar_opcion(t, tras or ultimo, nombre)
    lineas = re.findall(r"\n      e\d+: e === [^\n]*,", t)
    return t.replace(lineas[-1], lineas[-1] + f'\n      {var}: e === {json.dumps(nombre, ensure_ascii=False)},', 1)


def sumar_estado_tel(t, nombre, cambios=(), base="e0", tras=None, al_final=""):
    """Teléfono: copia la pantalla `base` (de la barra de estado a la rayita) con `cambios`; `al_final` va encima (hoja o menú)."""
    return sumar_estado(t, nombre, cambios, encima=False, base=base, tras=tras, encima_base=False, al_final=al_final)


def dlg(titulo, cuerpo, pie, chico=True, cerrar=True, una=True):
    c = f'<button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button>' if cerrar else ""
    return (f'<div class="w-oscuro"><div class="w-dlg{" chico" if chico else ""}" role="dialog" aria-label="{titulo}">'
            f'<div class="dc"><span>{titulo}</span>{c}</div><div class="db{" una" if una else ""}">{cuerpo}</div>'
            f'<div class="df">{pie}</div></div></div>')


def hoja(titulo, cuerpo, pie, cerrar=True):
    c = f'<button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button>' if cerrar else ""
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="' + titulo + '"><span class="asa"></span>'
            f'<div class="hc"><h2>{titulo}</h2>{c}</div><div class="hb">{cuerpo}</div><div class="hp">{pie}</div></div>')


def campo(rotulo, valor, req=True, select=True, ancho=True):
    r = ' <span style="color: var(--peligro);">*</span>' if req else ""
    s = ' style="grid-column: 1 / -1;"' if ancho else ""
    return f'<div class="w-cmp"{s}><span class="rt">{rotulo}{r}</span><div class="ct">{valor}{(" " + CHEV) if select else ""}</div></div>'


def campo_tel(rotulo, valor, req=True, select=True):
    r = ' <span class="rq">*</span>' if req else ""
    return (f'<div class="ap-cmp"><span class="rt"><span>{rotulo}{r}</span></span>'
            f'<div class="ct{" sel" if select else ""}">{valor}{CHEV_TEL if select else ""}</div></div>')


def ya(t):
    return MARCA in t


# ---------------------------------------------------------------- estilos comunes

CSS_COMPU = """.e11-tx { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--t1); }
.o-menu { position: absolute; z-index: 6; right: 52px; top: 166px; width: 260px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.o-menu .tit { padding: 8px 10px 4px; font-size: 12px; font-weight: 600; color: var(--t3); }
.o-menu .it { display: flex; flex-direction: column; padding: 9px 12px; font-size: 13.5px; line-height: 1.35; }
.o-menu .it span { font-size: 12px; color: var(--t3); }
.o-menu .it.h { background: var(--marca-t); }
.o-menu .it + .it { border-top: 1px solid var(--borde); }
.o-menu .sep { height: 1px; background: var(--borde); margin: 4px 0; }
.o-menu .it.apag { color: var(--t3); cursor: default; }
.o-menu .it.pel { color: oklch(0.52 0.19 25); }
.o-menu .sep2 { height: 6px; background: var(--s2); border-top: 1px solid var(--borde); }
.e11-cobra { color: oklch(0.55 0.13 70); }
"""
CSS_TEL = """.e11-tx { margin: 0; font-size: 15px; line-height: 1.5; color: var(--t1); }
.ap-menu { position: absolute; z-index: 8; right: 8px; top: 100px; width: 236px; background: #fff; border-radius: 14px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.2), 0 0 0 1px var(--borde); overflow: hidden; display: flex; flex-direction: column; }
.ap-menu span { min-height: 50px; display: flex; align-items: center; padding: 0 18px; font-size: 15.5px; }
.ap-menu span + span { border-top: 1px solid var(--borde); }
.ap-cmp { display: flex; flex-direction: column; gap: 6px; }
.ap-cmp .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); display: flex; justify-content: space-between; align-items: center; }
.ap-cmp .rq { color: var(--peligro); }
.ap-cmp .ct { min-height: 48px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; font-size: 16px; background: #fff; }
.ap-cmp .ct.area { display: block; padding: 12px 14px; line-height: 1.55; min-height: 104px; }
.ap-menu span.pel { color: oklch(0.52 0.19 25); }
.ap-menu .sep2 { min-height: 6px !important; height: 6px; padding: 0 !important; background: var(--s2); }
.ap-menu span.off { color: var(--t3); flex-direction: column; align-items: flex-start; justify-content: center; padding: 10px 18px; }
.ap-menu .sub { display: block; font-size: 13px; color: var(--t3); margin-top: 2px; line-height: 1.35; }
.ap-menu .sub span { display: inline; min-height: 0; padding: 0; border: 0; font-size: inherit; }
.e11-cobra { color: oklch(0.55 0.13 70); }
.ap-cmp .ct.sel { display: flex; align-items: center; justify-content: space-between; }
.ap-cmp .ct.sel svg { color: var(--t3); flex-shrink: 0; }
"""

# ---------------------------------------------------------------- Números (D1: el contador siempre; D7: desconectar)

PAGO_MOTIVO = "Responde hasta 1.000 mensajes por mes. Sin medio de pago no manda plantillas ni difusiones"
PAGO_TITULO = "+54 9 351 555-0200 no tiene medio de pago"


def numeros():
    # Falta medio de pago: el aviso de D1 en la compu y en el teléfono.
    for nombre in ("WA-Admin-Pago", "M-WA-Admin-Pago", "WA-Admin", "M-WA-Admin"):
        t = leer(nombre)
        if ya(t):
            continue
        t = t.replace("+54 9 351 555-0200 no puede responder", PAGO_TITULO)
        t = t.replace("<span>Sin medio de pago, Meta no deja mandar mensajes</span>", f"<span>{PAGO_MOTIVO}</span>")
        t = t.replace('aria-label="Por qué no puede responder"', 'aria-label="Qué significa"').replace('aria-label="Qué hacer"', 'aria-label="Qué significa"')
        # El número sin medio de pago también cuenta sus mensajes gratis.
        t = t.replace('<span><span style="color: var(--t3);">—</span></span>', "<span>310 de 1.000 gratis</span>")
        t = t.replace('<span class="l1">+54 9 351 555-0200</span>', '<span class="l1">+54 9 351 555-0200<span>310 de 1.000 gratis</span></span>')
        t = marcar(t, MARCA, CSS_TEL if nombre.startswith("M-") else CSS_COMPU)
        if nombre == "WA-Admin":
            t = numeros_compu(t)
        if nombre == "M-WA-Admin":
            t = numeros_tel(t)
        escribir(nombre, t)


def numeros_compu(t):
    t = estados_compu(t, "Lista")
    fila2 = '<button type="button" class="ib" aria-label="Acciones de +54 9 351 555-0200">'
    menu = ('<div class="o-menu e11-mn" role="menu" aria-label="Acciones de +54 9 351 555-0200" style="top: 284px; right: 40px;">'
            '<span class="it" role="menuitem">Cambiar a quién atiende</span><span class="it" role="menuitem">Comprobar medio de pago</span>'
            '<div class="sep2" role="separator"></div><span class="it pel" role="menuitem">Desconectar</span></div>')
    t = sumar_estado(t, "Menú del número", [(fila2, fila2.replace('class="ib"', 'class="ib on"'))], encima=menu)
    atiende = dlg("A quién atiende +54 9 351 555-0200", campo("Atiende a", "Delta Sur S.R.L."),
                  '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button>')
    t = sumar_estado(t, "Cambiar a quién atiende", encima=atiende)
    desc = dlg("¿Desconectar +54 9 351 555-0200?", '<p class="e11-tx">Sus chats quedan para leer, sin responder. Para volver a atender, conectalo de nuevo.</p>',
               '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Desconectar</button>', cerrar=False)
    t = sumar_estado(t, "Desconectar", encima=desc)
    t = sumar_estado(t, "Desconectado", [
        ("2 números · 1 sin medio de pago", "2 números · 1 desconectado"),
        ('<span><span class="w-est mal">Falta medio de pago</span><a class="o-i" href="WA-Admin-Pago.dc.html" aria-label="Qué significa">',
         '<span><span class="w-est off">Desconectado</span><a class="o-i" href="WA-Admin-Pago.dc.html" aria-label="Qué significa" style="display: none;">'),
        ("<span>310 de 1.000 gratis</span>", '<span><span style="color: var(--t3);">—</span></span>'),
    ], encima="")
    t = sumar_estado(t, "Pasado el tope", [("<span>640 de 1.000 gratis</span>", '<span>1.240 · <span class="e11-cobra">240 se cobran</span></span>')], encima="")
    return t.replace(".w-est.mal::before", ".w-est.gris::before { background: var(--t3); }\n.w-est.mal::before", 1) if ".w-est.gris" not in t else t


def numeros_tel(t):
    t = con_estados_pantalla(t, "Lista")
    menu = ('<div class="ap-menu" role="menu" style="top: 196px;"><span role="menuitem">Cambiar a quién atiende</span>'
            '<span role="menuitem">Comprobar medio de pago</span><span class="sep2" role="separator"></span>'
            '<span class="pel" role="menuitem">Desconectar</span></div>')
    fila2 = '<button type="button" class="ap-ib" aria-label="Acciones de +54 9 351 555-0200">'
    t = sumar_estado_tel(t, "Menú del número", al_final=menu)
    atiende = hoja("A quién atiende +54 9 351 555-0200", campo_tel("Atiende a", "Delta Sur S.R.L."),
                   '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>')
    t = sumar_estado_tel(t, "Cambiar a quién atiende", al_final=atiende)
    desc = hoja("¿Desconectar +54 9 351 555-0200?", '<p class="e11-tx">Sus chats quedan para leer, sin responder. Para volver a atender, conectalo de nuevo.</p>',
                '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Desconectar</button>', cerrar=False)
    t = sumar_estado_tel(t, "Desconectar", al_final=desc)
    t = sumar_estado_tel(t, "Desconectado", [
        ('<span class="l1">+54 9 351 555-0200<span>310 de 1.000 gratis</span></span>', '<span class="l1">+54 9 351 555-0200</span>'),
        ('<span class="w-est mal">Falta medio de pago</span><button type="button" class="ap-i" aria-label="Qué significa">',
         '<span class="w-est off">Desconectado</span><button type="button" class="ap-i" aria-label="Qué significa" style="display: none;">'),
    ])
    t = sumar_estado_tel(t, "Pasado el tope", [("<span>640 de 1.000 gratis</span>", '<span>1.240 · <span class="e11-cobra">240 se cobran</span></span>')])
    return t


# ---------------------------------------------------------------- Plataforma: número y plantillas

CSS_VSEG_COMPU = """.o-tabs.e11-vseg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); border-bottom: 0; width: 340px; margin-bottom: 14px; }
.o-tabs.e11-vseg > span { height: 30px; padding: 0; border-radius: 8px; border-bottom: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; color: var(--t2); }
.o-tabs.e11-vseg > span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.o-tabs.e11-vseg > a { height: 30px; padding: 0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
"""
CSS_VSEG_TEL = """.ap-tabs.e11-vseg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; margin: 4px 16px 8px; border-radius: 12px; background: var(--s3); border-bottom: 0; }
.ap-tabs.e11-vseg span { height: 38px; border-radius: 9px; border-bottom: 0; font-size: 14.5px; color: var(--t2); }
.ap-tabs.e11-vseg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
"""


def a_segmentado(t, clase):
    """Pestañas que son dos vistas de la misma lista → control segmentado (regla del 13/10)."""
    t = re.sub(r'<div class="' + clase + r'" role="tablist"( aria-label="[^"]*")?>', lambda m: f'<div class="{clase} e11-vseg" role="radiogroup" aria-label="Ver">', t)
    t = re.sub(r'<span class="on" role="tab"( aria-selected="true")?>', '<span class="on" role="radio" aria-checked="true">', t)
    t = re.sub(r'<span( class="")? role="tab"( aria-selected="false")?>', '<span role="radio" aria-checked="false">', t)
    return t.replace('<a class="" role="tab" href=', '<a role="radio" aria-checked="false" href=')


def plataforma():
    for nombre in ("Plat-WA-Plantillas", "M-Plat-WA-Plantillas"):
        t = leer(nombre)
        if ya(t):
            continue
        tel = nombre.startswith("M-")
        t = a_segmentado(t, "ap-tabs" if tel else "o-tabs")
        # invitacion_organizacion es Marketing en español y Utility en inglés (decisión del 12/10).
        if tel:
            t = rep(t, '<span class="l2">invitacion_organizacion · Utilidad</span><span class="l3"><span class="w-est ">Aprobada</span></span>',
                    '<span class="l2">invitacion_organizacion · Marketing</span><span class="l3"><span class="w-est ">Aprobada</span> · Utilidad en inglés</span>')
        else:
            viejo = '<span>invitacion_organizacion · Español e inglés</span></span><span>Utilidad</span>'
            t = rep(t, viejo, '<span>invitacion_organizacion · Español e inglés</span></span><span class="dos"><span>Marketing</span><span>Utilidad en inglés</span></span>', t.count(viejo))
        t = marcar(t, MARCA, (CSS_TEL + CSS_VSEG_TEL) if tel else (CSS_COMPU + CSS_VSEG_COMPU))
        escribir(nombre, t)

    for nombre in ("Plat-WA-Numero", "M-Plat-WA-Numero"):
        t = leer(nombre)
        if ya(t):
            continue
        tel = nombre.startswith("M-")
        t = t.replace("<span>Los códigos y los avisos salen solo por correo</span>",
                      "<span>Los códigos y los avisos salen solo por correo. Las consultas siguen hasta 1.000 por mes</span>")
        t = t.replace("<br>Los códigos y los avisos salen solo por correo</p>",
                      "<br>Los códigos y los avisos salen solo por correo. Las consultas siguen hasta 1.000 por mes</p>")
        sw = ('<span class="ap-sw" role="switch" aria-checked="true">' if tel
              else '<span class="w-sw" role="switch" aria-checked="true" aria-label="Atiende consultas">')
        t = sumar_estado(t, "Consultas apagadas", [(sw, sw.replace('class="ap-sw"', 'class="ap-sw off"').replace('class="w-sw"', 'class="w-sw off"').replace('"true"', '"false"'))],
                         tras="Conectado", encima=False if tel else None, encima_base=not tel)
        t = marcar(t, MARCA, CSS_TEL if tel else CSS_COMPU)
        escribir(nombre, t)


def bot():
    # El bot: «Configuración | Recorrido» son dos vistas de la misma configuración → control segmentado (el usuario, 13/10: «B»).
    for nombre in ("WA-Respuestas", "WA-Bot-Recorrido", "M-WA-Respuestas", "M-WA-Bot-Recorrido", "Plat-WA-Bot", "Plat-WA-Bot-Recorrido", "M-Plat-WA-Bot",
                   "WA-Admin-Editar", "M-WA-Editar"):
        t = leer(nombre)
        if "Activo · " in t:
            # D9 (el usuario, 13/10): el bot no se apaga; con un número conectado siempre responde.
            escribir(nombre, t.replace('<p class="res">Activo · ', '<p class="res">'))
            t = leer(nombre)
        if ya(t):
            continue
        tel = nombre.startswith("M-")
        t = a_segmentado(t, "ap-tabs" if tel else "o-tabs")
        escribir(nombre, marcar(t, MARCA, (CSS_TEL + CSS_VSEG_TEL) if tel else (CSS_COMPU + CSS_VSEG_COMPU)))


def alta():
    # WA-Alta: el resumen de la banda como texto de cada estado, no como un hueco.
    t = leer("WA-Alta")
    if ya(t):
        return
    t = rep(t, '<p class="res">{{res}}</p>',
            '<p class="res"><sc-if value="{{e2}}" hint-placeholder-val="{{no}}">3 números · 1 sin medio de pago</sc-if>'
            '<sc-if value="{{sinNuevo}}" hint-placeholder-val="{{si}}">2 números · 1 sin medio de pago</sc-if></p>')
    t = rep(t, "      res: e === 'Conectado' ? '3 números · 1 sin medio de pago' : '2 números · 1 sin medio de pago',\n",
            "      sinNuevo: e !== 'Conectado',\n")
    t = t.replace('<span><span style="color: var(--t3);">—</span></span>', "<span>310 de 1.000 gratis</span>")
    t = t.replace('aria-label="Por qué no puede responder"', 'aria-label="Qué significa"')
    escribir("WA-Alta", marcar(t, MARCA))


if __name__ == "__main__":
    numeros()
    plataforma()
    bot()
    alta()
