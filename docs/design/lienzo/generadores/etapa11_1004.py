"""Etapa 11, WhatsApp de atención: los tableros sin contradicciones y con los estados que faltan («Para Diseño» del plan
docs/plans/2026-10-13-etapa-11-whatsapp.md del back, decisiones D1 a D8 del 2026-10-13) y la regla de secciones, pestañas y
filtros del 13/10. Corre al final, después de formularios_catalogos_1004.py. Cada tablero lleva la marca `data-e11` y no se
vuelve a tocar si ya la tiene; para rehacerlo, se restaura desde git y se vuelve a correr."""
import json
import pathlib
import re
import sys

from estados_util import con_estados_pantalla, marcar, ordenar_opciones, rep, sumar_opcion

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
.o-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 10px; background: var(--peligro-t); color: oklch(0.42 0.16 25); grid-column: 1 / -1; }
.o-mot svg { flex-shrink: 0; margin-top: 1px; }
.o-mot b { display: block; font-size: 15px; font-weight: 600; color: oklch(0.38 0.15 25); }
.o-mot span { font-size: 12.5px; }
.o-sub { font-size: 12.5px; font-weight: 600; color: var(--t3); grid-column: 1 / -1; }
.o-pasos { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; grid-column: 1 / -1; }
.o-pasos li { display: flex; gap: 10px; align-items: center; font-size: 13.5px; }
.o-pasos .n { width: 22px; height: 22px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.f-toast { position: absolute; z-index: 41; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 14px; max-width: 460px; background: #fff; border: 1px solid oklch(0.57 0.2 25 / 0.45); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); font-size: 13px; color: var(--t1); }
.f-toast .mal { color: oklch(0.55 0.2 25); display: inline-flex; }
.f-toast .ib { width: 28px; height: 28px; }
.e11-adj { display: inline-flex !important; align-items: center; gap: 8px; color: var(--t2); font-style: italic; }
.e11-adj svg { color: var(--t3); flex-shrink: 0; }
.e11-est { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 13px; color: var(--t2); }
.e11-est.mal { color: oklch(0.5 0.19 25); }
.e11-est .o-i { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; background: none; color: inherit; border-radius: 50%; }
.e11-est .w-est { display: inline-flex; align-items: center; gap: 6px; }
.e11-est .w-est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
.e11-est .w-est.mal::before { background: oklch(0.57 0.2 25); }
.e11-est .w-est.off::before { background: oklch(0.75 0.01 78); }
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
.ap-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px; background: var(--peligro-t); color: oklch(0.42 0.16 25); }
.ap-mot svg { flex-shrink: 0; margin-top: 1px; }
.ap-mot b { display: block; font-size: 15.5px; font-weight: 600; color: oklch(0.38 0.15 25); }
.ap-mot span { font-size: 13.5px; }
.ap-sub { font-size: 13px; font-weight: 600; color: var(--t3); margin-bottom: -2px; }
.ap-pasos { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.ap-pasos li { display: flex; gap: 12px; align-items: center; font-size: 15px; }
.ap-pasos .n { width: 28px; height: 28px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.f-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 96px; display: flex; align-items: center; gap: 10px; padding: 10px 6px 10px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.f-snack .tx { flex: 1; min-width: 0; }
.f-snack .mal { color: oklch(0.75 0.15 25); display: inline-flex; }
.f-snack .ap-ib { color: #fff; }
.e11-adj { display: inline-flex !important; align-items: center; gap: 8px; color: var(--t2); font-style: italic; }
.e11-adj svg { color: var(--t3); flex-shrink: 0; }
.e11-est { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: var(--t2); white-space: nowrap; }
.e11-est.mal { color: oklch(0.5 0.19 25); }
.e11-est .ap-i { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 0; background: none; color: inherit; border-radius: 50%; }
.e11-est .w-est { display: inline-flex; align-items: center; gap: 6px; }
.e11-est .w-est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
.e11-est .w-est.mal::before { background: oklch(0.57 0.2 25); }
.e11-est .w-est.off::before { background: oklch(0.75 0.01 78); }
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


# ---------------------------------------------------------------- Chats (D7: adjuntos y número desconectado; tomar; pago; Internos)

def _svg(d, w=18, sw="2"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


ALERTA = _svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>')
INFO = _svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16)
FOTO = _svg('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-5-5-8 8"/>')
DOC = _svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>')
AUDIO = _svg('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5v3"/>')
NOTA = _svg('<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M8.5 12h7"/><path d="M8.5 16h5"/>', 18, "1.75")
NOTA_TEL = _svg('<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M8.5 12h7"/><path d="M8.5 16h5"/>', 22, "1.75")
PUNTOS = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
          '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')


def div_en(t, inicio):
    """El <div …> completo que empieza con `inicio` (la primera vez)."""
    i = t.index(inicio)
    return t[i:cierre_div(t, i)]


def pasos_html(pasos, clase):
    return f'<ol class="{clase}">' + "".join(f'<li><span class="n">{n}</span>{p}</li>' for n, p in enumerate(pasos, 1)) + "</ol>"


def aviso(titulo, motivo, detalle, pasos):
    """El aviso importante (Criterio · Diálogos): el motivo en rojo suave, «Qué podés hacer» y «Entendido»."""
    cuerpo = (f'<div class="o-mot">{ALERTA}<div><b>{motivo}</b><span>{detalle}</span></div></div><span class="o-sub">Qué podés hacer</span>'
              + pasos_html(pasos, "o-pasos"))
    return dlg(titulo, cuerpo, '<button type="button" class="cb cb-pri">Entendido</button>')


def aviso_tel(titulo, motivo, detalle, pasos):
    cuerpo = (f'<div class="ap-mot">{ALERTA}<div><b>{motivo}</b><span>{detalle}</span></div></div><span class="ap-sub">Qué podés hacer</span>'
              + pasos_html(pasos, "ap-pasos"))
    return hoja(titulo, cuerpo, '<button type="button" class="cb cb-pri">Entendido</button>')


def burbuja(icono, texto, hora, tel=False):
    return f'<div class="{"ap-m" if tel else "w-m"} ent"><span class="gl e11-adj">{icono} {texto}</span><span class="pie">{hora}</span></div>'


def conv(ini, nombre, hora, l2, l3, on=False, nuevo=False):
    clase = "w-conv" + (" on" if on else "") + (" nuevo" if nuevo else "")
    punto = '<span class="w-punto" aria-label="Sin leer"></span>' if nuevo else ""
    return (f'<div class="{clase}"><span class="w-av">{ini}</span><span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
            f'<span class="l2"><span>{l2}</span>{punto}</span><span class="l3{" sin" if "Sin tomar" in l3 else ""}">{l3}</span></span></div>')


def hilo_msjs(lista, tel=False):
    h = []
    for m in lista:
        if m[0] == "dia":
            h.append(f'<span class="{"ap-dia" if tel else "w-dia"}">{m[1]}</span>')
        elif m[0] == "sis":
            h.append(f'<span class="{"ap-sis" if tel else "o-sis"}">{m[1]}</span>')
        else:
            h.append(f'<div class="{"ap-m" if tel else "w-m"} {m[0]}"><span class="gl">{m[1]}</span><span class="pie">{m[2]}</span></div>')
    return "".join(h)


# Las conversaciones que se suman. Delta Sur atiende con +54 9 351 555-0200, el número sin medio de pago o desconectado de Números.
CARLA = [("dia", "Lunes"), ("ent", "Hola, ¿tienen tarugos del 8?", "11:02"), ("sis", "Eligió «Hacer un pedido» · pasó a Ventas"),
         ("sis", "Lucía Fernández tomó la conversación"), ("sal", "Sí, tenemos. ¿Cuántas cajas?", "Lucía Fernández · 11:05"),
         ("ent", "Tres. Paso a la tarde.", "11:06"), ("sal", "Te esperamos.", "Lucía Fernández · 11:07")]
CARLA_PAGO = CARLA[:-1] + [("ent", "¿Me lo pueden mandar por moto?", "11:20")]
JAVIER = [("dia", "Ayer"), ("ent", "Hola, ¿me confirman cuándo sale el pedido 1038?", "16:20"), ("sis", "Eligió «Consultar un pedido» · pasó a Soporte"),
          ("sis", "Tomás Acosta tomó la conversación"), ("sal", "Hola, Javier. Sale mañana a la mañana.", "Tomás Acosta · 16:24"),
          ("ent", "Perfecto, gracias.", "16:25")]
TOMAS = [("dia", "Hoy"), ("ent", "Hola, Lucía. Ya terminé la visita en Ferretería Rosales.", "10:48"), ("sis", "Pasó a Carga de pedidos"),
         ("sis", "Lucía Fernández tomó la conversación"), ("sal", "Genial, Tomás. ¿Cómo te fue?", "Lucía Fernández · 10:50"),
         ("ent", "Bien. Me pidieron 20 cajas de tarugos del 8. ¿Hay stock?", "10:51")]
AVISO_DESC = ("Carla Ruiz escribió a un número desconectado", "+54 9 351 555-0200 está desconectado", "Sus chats quedan para leer, sin responder",
              ["Pedile a quien administra WhatsApp que lo conecte de nuevo"])
AVISO_PAGO = ("No se puede responder a Carla Ruiz", "Falta medio de pago en Meta", "+54 9 351 555-0200 ya usó los 1.000 mensajes gratis de este mes",
              ["Pedile a quien administra WhatsApp que agregue un medio de pago en Meta", "O esperá al 1/11, cuando vuelven los 1.000 gratis"])
AVISO_24H = ("Pasaron 24 horas", "Martina López escribió por última vez ayer a las 10:42", "Pasadas 24 horas, WhatsApp solo deja mandarle una plantilla aprobada",
             ["Tocá «Elegir plantilla» y mandale una", "Cuando conteste, podés volver a escribirle por 24 horas"])
TOMADO = "No pudimos mandar tu mensaje: Tomás Acosta tomó el chat antes."


def cab_hilo(ini, nombre, sub, pasar=True):
    acc = '<button type="button" class="cb cb-sec ch">Pasar</button>' if pasar else ""
    return (f'<div class="hc"><span class="w-av">{ini}</span><span class="tx"><b>{nombre}</b><span>{sub}</span></span><span class="acc">{acc}'
            f'<button type="button" class="ib" aria-label="Acciones de {nombre}">{PUNTOS}</button></span></div>')


def escr_estado(texto, mal=False, nota=True, info=True):
    n = f'<button type="button" class="o-nt" aria-label="Nota interna" aria-pressed="false" title="Nota interna">{NOTA}</button>' if nota else ""
    i = f'<button type="button" class="o-i" aria-label="Qué significa">{INFO}</button>' if info else ""
    return f'<div class="w-escr">{n}<span class="e11-est{" mal" if mal else ""}">{texto}{i}</span></div>'


def escr_estado_tel(texto, mal=False, nota=True, info=True):
    n = f'<button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">{NOTA_TEL}</button>' if nota else ""
    i = f'<button type="button" class="ap-i" aria-label="Qué significa">{INFO}</button>' if info else ""
    return f'<div class="ap-escr">{n}<span class="e11-est{" mal" if mal else ""}">{texto}{i}</span></div>'


def a_chats_seg(t):
    """Las bandejas ya se ven segmentadas: se les da el papel de control segmentado, no de pestañas."""
    for clase in ("o-seg", "ap-seg"):
        t = t.replace(f'<div class="{clase}" role="tablist" aria-label="Bandeja">', f'<div class="{clase}" role="radiogroup" aria-label="Bandeja">')
    t = t.replace('<span class="on" role="tab" aria-selected="true">', '<span class="on" role="radio" aria-checked="true">')
    t = t.replace('<span role="tab" aria-selected="false">', '<span role="radio" aria-checked="false">')
    return t.replace('<span class="on" role="tab">', '<span class="on" role="radio" aria-checked="true">').replace('<span role="tab">', '<span role="radio" aria-checked="false">')


def chats_compu():
    nombre = "WA-Chats"
    t = leer(nombre)
    if ya(t):
        return
    t = estados_compu(a_chats_seg(t), "Clientes")
    bandeja = div_en(t, '<div class="w-bandeja">')
    hilo = div_en(t, '<div class="w-hilo">')
    escr = div_en(hilo, '<div class="w-escr">')
    msjs = div_en(hilo, '<div class="w-msjs">')
    filas = {}
    for ini in ("ML", "JP", "CR"):
        k = bandeja.index(f'<span class="w-av">{ini}</span>')
        i = bandeja.rindex("<div", 0, k)
        filas[ini] = bandeja[i:cierre_div(bandeja, i)]

    def on(f):
        return re.sub(r'^<div class="w-conv[^"]*">', '<div class="w-conv on">', f)

    def seleccionar(b, ini, fila_nueva=None):
        b = b.replace(filas["ML"], filas["ML"].replace('<div class="w-conv on">', '<div class="w-conv">', 1))
        return b.replace(filas[ini], on(fila_nueva or filas[ini]))

    # Internos: empleados, sin menú, directo a su equipo.
    seg = div_en(bandeja, '<div class="o-seg"')
    seg_int = (seg.replace('<span class="on" role="radio" aria-checked="true">Clientes', '<span role="radio" aria-checked="false">Clientes')
               .replace('<span role="radio" aria-checked="false">Internos', '<span class="on" role="radio" aria-checked="true">Internos'))
    filtro = div_en(bandeja, '<div class="filtro">')
    b_int = ('<div class="w-bandeja">' + seg_int + filtro
             + conv("TA", "Tomás Acosta", "10:51", "Bien. Me pidieron 20 cajas de tarugos del 8. ¿Hay stock?", "Carga de pedidos · Lucía Fernández", on=True)
             + conv("MP", "Martín Paz", "Ayer", "Mañana paso por el depósito.", "Carga de pedidos · Sin tomar", nuevo=True) + "</div>")
    h_int = ('<div class="w-hilo">' + cab_hilo("TA", "Tomás Acosta", "+54 9 11 5555-4521 · Empleado · Delta S.A.")
             + '<div class="w-msjs">' + hilo_msjs(TOMAS) + "</div>" + escr + "</div>")
    t = sumar_estado(t, "Internos", [(bandeja, b_int), (hilo, h_int)], encima="")

    # Fotos, audios y documentos: «Mandó…», sin descarga (D7; la descarga llega con la E14).
    adj = burbuja(FOTO, "Mandó una foto", "10:43") + burbuja(DOC, "Mandó un documento", "10:43") + burbuja(AUDIO, "Mandó un audio", "10:44")
    fila_ml = filas["ML"].replace("<span>10:42</span>", "<span>10:44</span>").replace("<span>2 cajas de tornillos. ¿Atienden hasta las 18?</span>", "<span>Mandó un audio</span>")
    t = sumar_estado(t, "Foto, audio o documento", [(msjs, msjs[:-len("</div>")] + adj + "</div>"), (filas["ML"], fila_ml)], encima="")

    # Un chat que tomó otra persona: se lee y lleva notas; no se responde.
    h_otro = ('<div class="w-hilo">' + cab_hilo("JP", "Javier Pereyra", "+54 9 11 5555-3388 · Soporte") + '<div class="w-msjs">' + hilo_msjs(JAVIER)
              + "</div>" + escr_estado("Lo atiende Tomás Acosta", info=False) + "</div>")
    t = sumar_estado(t, "Lo atiende otra persona", [(bandeja, seleccionar(bandeja, "JP")), (hilo, h_otro)], encima="")

    # Carrera al tomar (WhatsApp.Conversation.TakenByOther): el mensaje no sale.
    st = leer("WA-Chats-SinTomar")
    h_st = div_en(st, '<div class="w-hilo">')
    h_st = re.sub(r'<button type="button" class="cb cb-pri[^"]*">Tomar</button>', "", h_st)
    h_st = rep(h_st, "<span>Sin tomar · Ventas</span>", "<span>Ventas · Tomás Acosta</span>")
    m_st = div_en(h_st, '<div class="w-msjs">')
    h_st = h_st.replace(m_st, m_st[:-len("</div>")] + '<span class="o-sis">Tomás Acosta tomó la conversación · 10:16</span></div>')
    h_st = h_st.replace(div_en(h_st, '<div class="w-escr">'), escr_estado("Lo atiende Tomás Acosta", info=False))
    i = bandeja.index('<div class="w-conv nuevo"><span class="w-av g">')
    fila_st = bandeja[i:cierre_div(bandeja, i)]
    fila_st2 = (on(fila_st).replace('<span class="w-punto" aria-label="Sin leer"></span>', "")
                .replace('<span class="l3 sin">Ventas · Sin tomar</span>', '<span class="l3">Ventas · Tomás Acosta</span>'))
    b_st = bandeja.replace(filas["ML"], filas["ML"].replace('<div class="w-conv on">', '<div class="w-conv">', 1)).replace(fila_st, fila_st2)
    toast = (f'<div class="f-toast" role="alert" style="bottom: 84px;"><span class="mal">{ALERTA}</span><span>{TOMADO}</span>'
             f'<button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button></div>')
    t = sumar_estado(t, "Lo tomó otra persona", [(bandeja, b_st), (hilo, h_st), ("5 conversaciones · 2 sin tomar", "5 conversaciones · 1 sin tomar")], encima=toast)

    # Número desconectado (D7): sus chats quedan para leer.
    h_desc = ('<div class="w-hilo">' + cab_hilo("CR", "Carla Ruiz", "+54 9 11 5555-1146 · Delta Sur S.R.L.", pasar=False) + '<div class="w-msjs">'
              + hilo_msjs(CARLA) + "</div>" + escr_estado('<span class="w-est off">Número desconectado</span>', nota=False) + "</div>")
    t = sumar_estado(t, "Número desconectado", [(bandeja, seleccionar(bandeja, "CR")), (hilo, h_desc)], encima="")
    t = sumar_estado(t, "Número desconectado · qué significa", [(bandeja, seleccionar(bandeja, "CR")), (hilo, h_desc)], encima=aviso(*AVISO_DESC))

    # Sin medio de pago y pasado el tope (WhatsApp.Conversation.PaymentRequired).
    h_pago = ('<div class="w-hilo">' + cab_hilo("CR", "Carla Ruiz", "+54 9 11 5555-1146 · Delta Sur S.R.L.") + '<div class="w-msjs">'
              + hilo_msjs(CARLA_PAGO) + "</div>" + escr_estado('<span class="w-est mal">Sin medio de pago</span>', mal=True) + "</div>")
    fila_cr = filas["CR"].replace("<span>Vos: Te esperamos.</span>", "<span>¿Me lo pueden mandar por moto?</span>")
    b_pago = seleccionar(bandeja, "CR", fila_cr)
    t = sumar_estado(t, "Sin medio de pago", [(bandeja, b_pago), (hilo, h_pago)], encima="")
    t = sumar_estado(t, "Sin medio de pago · qué significa", [(bandeja, b_pago), (hilo, h_pago)], encima=aviso(*AVISO_PAGO))
    escribir(nombre, marcar(t, MARCA, CSS_COMPU))


def chats_resto():
    """Los otros tableros de Chats en la compu: el papel de segmentado y el ⓘ de las 24 horas."""
    for nombre in ("WA-Chats-Nota", "WA-Chats-Pasar", "WA-Chats-SinTomar", "WA-Chats-Plantilla"):
        t = leer(nombre)
        if not ya(t):
            escribir(nombre, marcar(a_chats_seg(t), MARCA))
    t = leer("WA-Chats-24h")
    if not ya(t):
        t = estados_compu(a_chats_seg(t), "Pasaron 24 horas")
        t = sumar_estado(t, "Qué significa", encima=aviso(*AVISO_24H))
        escribir("WA-Chats-24h", marcar(t, MARCA, CSS_COMPU))


def cbar(t, ini, nombre, sub, clase_av="w-av"):
    """La barra de la conversación del teléfono con otra persona."""
    b = div_en(t, '<div class="ap-cbar">')
    i = b.index('<span class="w-av')
    j = b.index('<button type="button" class="ap-ib" aria-label="Acciones de')
    k = b.index('">', j) + 2
    return (b[:i] + f'<span class="{clase_av}">{ini}</span><span class="tx"><b>{nombre}</b><span>{sub}</span></span>'
            + f'<button type="button" class="ap-ib" aria-label="Acciones de {nombre}">' + b[k:])


def snack_mal(texto):
    return (f'<div class="f-snack" role="alert"><span class="mal">{ALERTA}</span><span class="tx">{texto}</span>'
            f'<button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button></div>')


def conv_tel(*a, **k):
    c = conv(*a, **k)
    return re.sub(r'^<div class="([^"]*)">', lambda m: f'<a class="{m.group(1)}" href="#">', c)[:-len("</div>")] + "</a>"


def chats_tel():
    t = leer("M-WA-Conversacion")
    if not ya(t):
        t = con_estados_pantalla(t, "Conversación")
        barra = div_en(t, '<div class="ap-cbar">')
        chat = div_en(t, '<div class="ap-chat">')
        escr = div_en(t, '<div class="ap-escr">')
        adj = burbuja(FOTO, "Mandó una foto", "10:43", True) + burbuja(DOC, "Mandó un documento", "10:43", True) + burbuja(AUDIO, "Mandó un audio", "10:44", True)
        t = sumar_estado_tel(t, "Foto, audio o documento", [(chat, chat[:-len("</div>")] + adj + "</div>")])
        t = sumar_estado_tel(t, "Lo atiende otra persona", [
            (barra, cbar(t, "JP", "Javier Pereyra", "Soporte · Tomás Acosta")),
            (chat, '<div class="ap-chat">' + hilo_msjs(JAVIER, True) + "</div>"), (escr, escr_estado_tel("Lo atiende Tomás Acosta", info=False))])
        st = leer("M-WA-Chats-SinTomar")
        b_st = rep(div_en(st, '<div class="ap-cbar">'), '<span class="sin">Sin tomar · Ventas</span>', "<span>Ventas · Tomás Acosta</span>")
        c_st = div_en(st, '<div class="ap-chat">')
        c_st = c_st[:-len("</div>")] + '<span class="ap-sis">Tomás Acosta tomó la conversación · 10:16</span></div>'
        t = sumar_estado_tel(t, "Lo tomó otra persona", [(barra, b_st), (chat, c_st), (escr, escr_estado_tel("Lo atiende Tomás Acosta", info=False))],
                             al_final=snack_mal(TOMADO))
        desc = [(barra, cbar(t, "CR", "Carla Ruiz", "Delta Sur S.R.L.")), (chat, '<div class="ap-chat">' + hilo_msjs(CARLA, True) + "</div>"),
                (escr, escr_estado_tel('<span class="w-est off">Número desconectado</span>', nota=False))]
        t = sumar_estado_tel(t, "Número desconectado", desc)
        t = sumar_estado_tel(t, "Número desconectado · qué significa", desc, al_final=aviso_tel(*AVISO_DESC))
        pago = [(barra, cbar(t, "CR", "Carla Ruiz", "Delta Sur S.R.L.")), (chat, '<div class="ap-chat">' + hilo_msjs(CARLA_PAGO, True) + "</div>"),
                (escr, escr_estado_tel('<span class="w-est mal">Sin medio de pago</span>', mal=True))]
        t = sumar_estado_tel(t, "Sin medio de pago", pago)
        t = sumar_estado_tel(t, "Sin medio de pago · qué significa", pago, al_final=aviso_tel(*AVISO_PAGO))
        escribir("M-WA-Conversacion", marcar(t, MARCA, CSS_TEL))

    t = leer("M-WA-24h")
    if not ya(t):
        t = con_estados_pantalla(t, "Pasaron 24 horas")
        t = sumar_estado_tel(t, "Qué significa", al_final=aviso_tel(*AVISO_24H))
        escribir("M-WA-24h", marcar(t, MARCA, CSS_TEL))

    t = leer("M-WA-Chats")
    if not ya(t):
        t = con_estados_pantalla(a_chats_seg(t), "Clientes")
        seg = div_en(t, '<div class="ap-seg"')
        seg_int = (seg.replace('<span class="on" role="radio" aria-checked="true">Clientes', '<span role="radio" aria-checked="false">Clientes')
                   .replace('<span role="radio" aria-checked="false">Internos', '<span class="on" role="radio" aria-checked="true">Internos'))
        cuerpo = div_en(t, '<div class="ap-cuerpo">')
        lista = ('<div class="ap-cuerpo">'
                 + conv_tel("TA", "Tomás Acosta", "10:51", "Bien. Me pidieron 20 cajas de tarugos del 8. ¿Hay stock?", "Carga de pedidos · Lucía Fernández")
                 + conv_tel("MP", "Martín Paz", "Ayer", "Mañana paso por el depósito.", "Carga de pedidos · Sin tomar", nuevo=True) + "</div>")
        t = sumar_estado_tel(t, "Internos", [(seg, seg_int), (cuerpo, lista)])
        escribir("M-WA-Chats", marcar(t, MARCA, CSS_TEL))


# ---------------------------------------------------------------- Plantilla al elegirla: las que no se pueden usar, apagadas con su motivo (regla del 13/10)

OPCIONES_PLANTILLA = [("Pedido listo", "Utilidad", True, False), ("Seguimos tu pedido", "Utilidad", False, False),
                      ("Aviso de turno", "En revisión en Meta", False, True), ("Oferta de octubre", "Rechazada por Meta", False, True)]
CSS_OPS = """.w-cmp.e11-abre { position: relative; }
.w-dlg:has(.e11-abre) { overflow: visible; }
.w-dlg:has(.e11-abre) .dc { border-radius: 12px 12px 0 0; }
.w-cmp.e11-abre .ct { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.e11-ops { position: absolute; z-index: 3; left: 0; right: 0; top: calc(100% + 4px); background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); overflow: hidden; display: flex; flex-direction: column; }
.e11-ops .op { display: flex; flex-direction: column; padding: 8px 12px; font-size: 13.5px; line-height: 1.35; color: var(--t1); }
.e11-ops .op + .op { border-top: 1px solid var(--borde); }
.e11-ops .op span { font-size: 12px; color: var(--t3); }
.e11-ops .op.on { background: var(--marca-t); color: var(--marca-tx); }
.e11-ops .op.apag { color: var(--t3); }
"""
CSS_OPS_TEL = """.ap-op { display: flex; align-items: center; gap: 12px; min-height: 52px; font-size: 16px; color: var(--t1); border-bottom: 1px solid var(--borde); }
.ap-op:last-child { border-bottom: 0; }
.ap-op[aria-selected="true"] { color: var(--marca-tx); font-weight: 500; }
.ap-op .tilde { margin-left: auto; display: inline-flex; color: var(--marca-tx); }
.ap-hoja .hb:has(.ap-op) { gap: 0; }
.ap-op.apag { color: var(--t3); flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; padding: 10px 0; }
.ap-op .sub { font-size: 13.5px; color: var(--t3); font-weight: 400; }
"""
TILDE = _svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, "2.4")


def plantilla_elegir():
    t = leer("WA-Chats-Plantilla")
    if "Elegir la plantilla" not in t:
        t = t.replace("Costo estimado: US$ 0,02", "Costo estimado: US$ 0,03")
        t = estados_compu(t, "Plantilla elegida")
        sel = ('<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Plantilla <span style="color: var(--peligro);">*</span></span>'
               '<div class="ct">Pedido listo · Utilidad')
        ops = '<div class="e11-ops" role="listbox" aria-label="Plantilla">' + "".join(
            f'<div class="op{" on" if on else ""}{" apag" if apag else ""}" role="option" aria-selected="{"true" if on else "false"}"'
            + (' aria-disabled="true"' if apag else "") + f'>{n}<span>{s}</span></div>' for n, s, on, apag in OPCIONES_PLANTILLA) + "</div>"
        a, b = bloques(t, "e0")[1]
        encima = t[a:b][t[a:b].index(">") + 1:-len("</sc-if>")]
        i = encima.index(sel)
        fin = cierre_div(encima, i)
        campo_abierto = encima[i:fin - len("</div>")].replace('<div class="w-cmp" style=', '<div class="w-cmp e11-abre" style=', 1) + ops + "</div>"
        t = sumar_estado(t, "Elegir la plantilla", encima=encima[:i] + campo_abierto + encima[fin:])
        escribir("WA-Chats-Plantilla", marcar(t, 'data-e11="plantilla"', CSS_OPS))

    t = leer("M-WA-Chats-Plantilla")
    if not ya(t):
        t = t.replace("Costo estimado: US$ 0,02", "Costo estimado: US$ 0,03")
        t = con_estados_pantalla(t, "Plantilla elegida")
        h = div_en(t, '<div class="ap-hoja"')
        ops = "".join(
            (f'<div class="ap-op apag" role="option" aria-selected="false" aria-disabled="true">{n}<span class="sub">{s}</span></div>' if apag else
             f'<div class="ap-op" role="option" aria-selected="{"true" if on else "false"}">{n} · {s}' + (f'<span class="tilde">{TILDE}</span>' if on else "") + "</div>")
            for n, s, on, apag in OPCIONES_PLANTILLA)
        nueva = ('<div class="ap-hoja" role="dialog" aria-label="Plantilla"><span class="asa"></span><div class="hc"><h2>Plantilla</h2>'
                 f'<button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button></div><div class="hb">{ops}</div></div>')
        t = sumar_estado_tel(t, "Elegir la plantilla", [(h, nueva)])
        escribir("M-WA-Chats-Plantilla", marcar(t, MARCA, CSS_TEL + CSS_OPS_TEL))


def datos():
    """Datos de ejemplo que contradecían las reglas: Martina López (cliente) tenía el número de Tomás Acosta (empleado de Delta S.A.,
    en Internos y en «Cargar teléfonos»). Ningún número es a la vez de empleado y de cliente."""
    for nombre in ("WA-Chats", "WA-Chats-24h", "WA-Chats-Nota", "WA-Chats-Pasar", "WA-Chats-Plantilla", "WA-Contacto", "WA-Contactos",
                   "WA-Contactos-Importar", "M-WA-Contacto", "M-WA-Contactos", "M-WA-Contactos-Importar", "Criterio-Marco"):
        t = leer(nombre)
        n = (t.replace("+54 9 11 5555-4521 · Vinculada", "+54 9 11 5555-6203 · Vinculada") if nombre == "WA-Chats"
             else t.replace("+54 9 11 5555-4521", "+54 9 11 5555-6203"))
        # 7310 es de Martín Paz, empleado (Cargar teléfonos): Martina pasó a 6203.
        n = n.replace("+54 9 11 5555-7310", "+54 9 11 5555-6203")
        if n != t:
            escribir(nombre, n)
    # Cada contacto con su número: Javier Pereyra (el de los chats) y Carla Ruiz (el de Contactos).
    for nombre in ("WA-Contactos", "WA-Contactos-Importar", "M-WA-Contactos", "M-WA-Contactos-Importar", "WA-Chats"):
        t = leer(nombre)
        n = t.replace("+54 9 11 5555-6203 · Vinculado", "+54 9 11 5555-3388 · Vinculado").replace("+54 9 351 555-0731 · Delta Sur", "+54 9 11 5555-1146 · Delta Sur")
        if n != t:
            escribir(nombre, n)
    # Las difusiones van solo a quienes aceptan: Federico Díaz y Sergio Gómez no aceptan, así que no figuran entre los destinatarios.
    for nombre in ("WA-Difusion-Resultados", "M-WA-Difusion-Resultados"):
        t = leer(nombre)
        n = (t.replace("Federico Díaz", "Lucas Benítez").replace("+54 9 11 5555-2087", "+54 9 11 5555-4410")
             .replace("Sergio Gómez", "Valeria Sosa").replace("+54 9 11 5555-9021", "+54 9 11 5555-6120")
             .replace('<span class="w-av">FD</span>', '<span class="w-av">LB</span>').replace('<span class="w-av">SG</span>', '<span class="w-av">VS</span>'))
        if n != t:
            escribir(nombre, n)
    # La lista de contactos con los totales que usan las difusiones (312 aceptan) y su primera página completa.
    extra = [("Lucas Benítez", "+54 9 11 5555-4410", "Minorista", "", "Acepta", "25/09/2026"),
             ("Valeria Sosa", "+54 9 11 5555-6120", "Minorista", "", "Acepta", "25/09/2026"),
             ("Diego Romero", "+54 9 11 5555-8834", "", " off", "Sin respuesta", "24/09/2026")]
    for nombre in ("WA-Contactos", "WA-Contactos-Importar"):
        t = leer(nombre)
        if "486 contactos" in t:
            continue
        t = rep(t, "7 contactos · 3 aceptan promociones", "486 contactos · 312 aceptan promociones")
        filas = "".join(f'<div class="w-tr k"><span class="dos"><b>{n}</b><span>{tel}</span></span><span>{et or GUION}</span>'
                        f'<span><span class="w-est{c}">{p}</span></span><span>{f}</span><span style="display: flex; justify-content: flex-end;">'
                        f'<button type="button" class="ib" aria-label="Acciones de {n}">{PUNTOS}</button></span></div>' for n, tel, et, c, p, f in extra)
        t = rep(t, '<div class="w-pie"><span>1–7 de 7</span><span>10 por página · Página 1 de 1</span></div>',
                filas + '<div class="w-pie"><span>1–10 de 486</span><span>10 por página · Página 1 de 49</span></div>')
        escribir(nombre, t)
    # «Horario de fiestas» es la que se arma en Nueva difusión: Mayorista, 48 contactos.
    for nombre, viejo, nuevo in (("WA-Difusiones", '<b style="font-weight: 400;">Todos los que aceptan</b><span>312 contactos</span>',
                                  '<b style="font-weight: 400;">Mayorista</b><span>48 contactos</span>'),
                                 ("M-WA-Difusiones", "Aviso de horario · Los que aceptan · 312 contactos", "Aviso de horario · Mayorista · 48 contactos")):
        t = leer(nombre)
        if viejo in t:
            escribir(nombre, t.replace(viejo, nuevo))


GUION = '<span style="color: var(--t3);">—</span>'

# ---------------------------------------------------------------- Contactos: editar, sin vínculo e importar con filas rechazadas

CSS_FICHA = """.e11-dg { display: grid; grid-template-columns: 160px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; grid-column: 1 / -1; font-size: 13px; }
.e11-dg > span { padding: 9px 12px; border-top: 1px solid var(--borde); line-height: 1.4; }
.e11-dg > span:nth-child(-n+2) { border-top: 0; }
.e11-dg > span:nth-child(odd) { background: oklch(0.97 0.012 76); color: var(--t2); font-weight: 500; }
.e11-dg .mal { color: oklch(0.5 0.19 25); }
.e11-solo { font-size: 13.5px; min-height: 36px; display: flex; align-items: center; }
.e11-seg { display: grid; grid-auto-columns: 1fr; grid-auto-flow: column; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.e11-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.e11-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.f-toast.ok { border-color: var(--borde); }
.f-toast .ok { color: oklch(0.55 0.13 155); display: inline-flex; }
.w-dlg.e11-ancho { width: 600px; }
"""
CSS_FICHA_TEL = """.e11-dg { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 14px; overflow: hidden; font-size: 15px; }
.e11-dg > div { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; }
.e11-dg > div + div { border-top: 1px solid var(--borde); }
.e11-dg > div > span:first-child { font-size: 13px; font-weight: 600; color: var(--t2); }
.e11-dg .mal { color: oklch(0.5 0.19 25); }
.e11-solo { font-size: 16px; min-height: 28px; display: flex; align-items: center; }
.e11-seg { display: grid; grid-auto-columns: 1fr; grid-auto-flow: column; gap: 3px; padding: 3px; border-radius: 12px; background: var(--s3); }
.e11-seg span { height: 40px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-size: 14.5px; font-weight: 600; color: var(--t2); }
.e11-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.f-snack .ok { color: oklch(0.78 0.14 155); display: inline-flex; }
"""
OK = _svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>')
RECHAZADAS = [("Fila 12", "«11 5555» no es un teléfono"), ("Fila 27", "Falta el teléfono"), ("Fila 33", "El teléfono está repetido en el archivo")]


def dg(filas):
    return '<div class="e11-dg">' + "".join(f"<span>{a}</span><span>{b}</span>" for a, b in filas) + "</div>"


def dg_tel(filas):
    return '<div class="e11-dg">' + "".join(f"<div><span>{a}</span><span>{b}</span></div>" for a, b in filas) + "</div>"


def seg(opciones, on):
    return '<div class="e11-seg" role="radiogroup">' + "".join(
        (f'<span class="on" role="radio" aria-checked="true">{o}</span>' if o == on else f'<span role="radio" aria-checked="false">{o}</span>') for o in opciones) + "</div>"


def contactos():
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button>'
    promos = ["Acepta", "No acepta", "Sin respuesta"]
    t = leer("WA-Contacto")
    if not ya(t):
        t = estados_compu(t, "Ficha")
        cuerpo = (campo("Nombre", "Martina López", select=False, ancho=False)
                  + '<div class="w-cmp"><span class="rt">Teléfono</span><span class="e11-solo">+54 9 11 5555-6203</span></div>'
                  + campo("Etiquetas", "Mayorista", req=False) + '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Promociones</span>'
                  + seg(promos, "Acepta") + "</div>")
        t = sumar_estado(t, "Editar contacto", encima=dlg("Editar contacto", cuerpo, pie, chico=False, una=False))
        t = sumar_estado(t, "Sin vínculo", [("+54 9 11 5555-6203 · Vinculada a su cuenta · Mayorista", "+54 9 11 5555-6203 · Mayorista")], encima="")
        escribir("WA-Contacto", marcar(t, MARCA, CSS_COMPU + CSS_FICHA))

    t = leer("M-WA-Contacto")
    if not ya(t):
        t = con_estados_pantalla(t, "Ficha")
        cuerpo = (campo_tel("Nombre", "Martina López", select=False)
                  + '<div class="ap-cmp"><span class="rt"><span>Teléfono</span></span><span class="e11-solo">+54 9 11 5555-6203</span></div>'
                  + campo_tel("Etiquetas", "Mayorista", req=False) + '<div class="ap-cmp"><span class="rt"><span>Promociones</span></span>' + seg(promos, "Acepta") + "</div>")
        t = sumar_estado_tel(t, "Editar contacto", al_final=hoja("Editar contacto", cuerpo,
                             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>'))
        t = sumar_estado_tel(t, "Sin vínculo", [("+54 9 11 5555-6203 · Vinculada a su cuenta<br>", "+54 9 11 5555-6203<br>")])
        escribir("M-WA-Contacto", marcar(t, MARCA, CSS_TEL + CSS_FICHA_TEL))

    # Importar: la vista previa (CC05) muestra lo que entra y lo que no, antes de guardar.
    resumen = [("Para importar", "48 contactos: 41 nuevos y 7 que ya estaban"), ("No se importan", '<span class="mal">3 filas</span>')] + RECHAZADAS
    t = leer("WA-Contactos-Importar")
    if not ya(t):
        t = estados_compu(t, "Archivo elegido")
        a, b = bloques(t, "e0")[1]
        encima = t[a:b][t[a:b].index(">") + 1:-len("</sc-if>")]
        etiqueta = div_en(encima, '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Etiqueta para todos</span>')
        revisar = encima.replace(etiqueta, etiqueta + dg(resumen)).replace('<div class="w-dlg" role="dialog"', '<div class="w-dlg e11-ancho" role="dialog"', 1)
        t = sumar_estado(t, "Con filas que no entran", encima=revisar)
        toast = f'<div class="f-toast ok" role="status"><span class="ok">{OK}</span><span>Importamos 48 contactos.</span></div>'
        t = sumar_estado(t, "Importado", encima=toast)
        escribir("WA-Contactos-Importar", marcar(t, MARCA, CSS_COMPU + CSS_FICHA))

    t = leer("M-WA-Contactos-Importar")
    if not ya(t):
        t = con_estados_pantalla(t, "Archivo elegido")
        h = div_en(t, '<div class="ap-hoja"')
        etiqueta = div_en(h, '<div class="ap-cmp"><span class="rt"><span>Etiqueta para todos</span>')
        t = sumar_estado_tel(t, "Con filas que no entran", [(etiqueta, etiqueta + dg_tel(resumen))])
        snack = f'<div class="f-snack" role="status"><span class="ok">{OK}</span><span class="tx">Importamos 48 contactos.</span></div>'
        velo = '<div class="ap-velo"></div>'
        t = sumar_estado_tel(t, "Importado", [(velo, ""), (h, snack)])
        escribir("M-WA-Contactos-Importar", marcar(t, MARCA, CSS_TEL + CSS_FICHA_TEL))


# ---------------------------------------------------------------- Difusiones: programar con la zona, cancelar una programada y «Por qué no llegó»

AVISO_NO_LLEGO = ("No le llegó a +54 9 11 5555-6650", "Ese número no tiene WhatsApp", "Meta lo informó el 25/09/2026 a las 09:30",
                  ["Revisá el número con la persona", "Si cambió de número, importala de nuevo con el número nuevo"])
PROGRAMAR = [("Plantilla", "Aviso de horario · Marketing"), ("Destinatarios", "48 contactos con la etiqueta «Mayorista» que aceptan promociones"),
             ("Cuándo", "20/12/2026 a las 09:00, hora de Buenos Aires (GMT−3)"), ("Costo estimado", "US$ 2,97")]
CANCELAR_TXT = '<p class="e11-tx">No se va a mandar a los 48 contactos. Podés duplicarla para programarla de nuevo.</p>'
CANCELAR_PIE = '<button type="button" class="cb cb-sec">Volver</button><button type="button" class="cb cb-pel lleno">Cancelar difusión</button>'


def difusiones():
    t = leer("WA-Difusiones")
    if not ya(t):
        t = estados_compu(t, "Lista")
        menu = ('<div class="o-menu" role="menu" aria-label="Acciones de Horario de fiestas" style="top: 354px; right: 34px;">'
                '<span class="it" role="menuitem">Duplicar</span><div class="sep2" role="separator"></div><span class="it pel" role="menuitem">Cancelar difusión</span></div>')
        t = sumar_estado(t, "Menú de la programada", encima=menu)
        t = sumar_estado(t, "Cancelar difusión", encima=dlg("¿Cancelar «Horario de fiestas»?", CANCELAR_TXT, CANCELAR_PIE, cerrar=False))
        t = sumar_estado(t, "Cancelada", [('<span class="w-est prog">Programada</span>', '<span class="w-est off">Cancelada</span>'),
                                          ("3 difusiones · 1 programada", "3 difusiones")], encima="")
        escribir("WA-Difusiones", marcar(t, MARCA, CSS_COMPU))

    t = leer("M-WA-Difusiones")
    if not ya(t):
        t = con_estados_pantalla(t, "Lista")
        acciones = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Horario de fiestas"><span class="asa"></span>'
                    f'<div class="hc"><h2>Horario de fiestas</h2><button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button></div>'
                    '<div class="hb"><div class="ap-op" role="menuitem">Duplicar</div>'
                    '<div class="ap-op" role="menuitem" style="color: oklch(0.52 0.19 25);">Cancelar difusión</div></div></div>')
        t = sumar_estado_tel(t, "Acciones de la programada", al_final=acciones)
        t = sumar_estado_tel(t, "Cancelar difusión", al_final=hoja("¿Cancelar «Horario de fiestas»?", CANCELAR_TXT, CANCELAR_PIE, cerrar=False))
        t = sumar_estado_tel(t, "Cancelada", [('<span class="w-est prog">Programada</span>', '<span class="w-est off">Cancelada</span>')])
        escribir("M-WA-Difusiones", marcar(t, MARCA, CSS_TEL + CSS_OPS_TEL))

    t = leer("WA-Difusion-Nueva")
    if not ya(t):
        t = estados_compu(t, "Borrador")
        t = sumar_estado(t, "Confirmar la programación", encima=dlg("¿Programar «Horario de fiestas»?", dg(PROGRAMAR),
                         '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Programar</button>', chico=False))
        escribir("WA-Difusion-Nueva", marcar(t, MARCA, CSS_COMPU + CSS_FICHA))
    t = leer("M-WA-Difusion-Nueva")
    if not ya(t):
        t = con_estados_pantalla(t, "Borrador")
        t = sumar_estado_tel(t, "Confirmar la programación", al_final=hoja("¿Programar «Horario de fiestas»?", dg_tel(PROGRAMAR),
                             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Programar</button>'))
        escribir("M-WA-Difusion-Nueva", marcar(t, MARCA, CSS_TEL + CSS_FICHA_TEL))

    t = leer("WA-Difusion-Resultados")
    if not ya(t):
        t = estados_compu(t, "Resultados")
        t = sumar_estado(t, "Por qué no llegó", encima=aviso(*AVISO_NO_LLEGO))
        escribir("WA-Difusion-Resultados", marcar(t, MARCA, CSS_COMPU))
    t = leer("M-WA-Difusion-Resultados")
    if not ya(t):
        # El resumen no filtra como si fueran pestañas (regla del 13/10): los filtros van en el botón «Filtros» de la barra.
        filtros = re.search(r'<button type="button" class="ap-ib" aria-label="Filtros">.*?</button>', leer("M-WA-Chats"), flags=re.S).group(0)
        t = rep(t, '<div class="ap-chips" role="tablist" aria-label="Filtrar por estado"><span class="on" role="tab">',
                '<div class="ap-chips e11-res" role="list" aria-label="Resultados"><span role="listitem">')
        t = t.replace('<span role="tab">', '<span role="listitem">')
        t = rep(t, '<button type="button" class="ap-ib" aria-label="Buscar">', filtros + '<button type="button" class="ap-ib" aria-label="Buscar">')
        t = con_estados_pantalla(t, "Resultados")
        t = sumar_estado_tel(t, "Por qué no llegó", al_final=aviso_tel(*AVISO_NO_LLEGO))
        escribir("M-WA-Difusion-Resultados", marcar(t, MARCA, CSS_TEL + ".ap-chips.e11-res span { background: #fff; border-color: var(--borde); color: var(--t1); }\n"
                                                    ".ap-chips.e11-res span i { color: var(--t3); }\n"))


# ---------------------------------------------------------------- Bot: editar las respuestas, elegir el número, tope de 10 y «Además»

CHEV_DER = _svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', 18)
TILDE_CHK = _svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 12, "3")
BIENVENIDA = "Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?"
FUERA = "Hola, ahora estamos cerrados. Te respondemos el próximo día hábil desde las 9."
DIAS = [("Lunes", True), ("Martes", True), ("Miércoles", True), ("Jueves", True), ("Viernes", True), ("Sábado", False), ("Domingo", False)]
MENU_10 = [("Hacer un pedido", "Pasa a Ventas"), ("Consultar un pedido", "Pasa a Soporte"),
           ("Horarios y dirección", "Contesta: «Estamos en Av. Corrientes 1234, de 9 a 18»"), ("Hablar con alguien", "Pasa a Atención general"),
           ("Formas de pago", "Contesta: «Efectivo, transferencia o tarjeta»"), ("Envíos a domicilio", "Contesta: «Enviamos en CABA y GBA»"),
           ("Pedir presupuesto", "Pasa a Ventas"), ("Reclamos", "Pasa a Soporte"), ("Cambios y devoluciones", "Pasa a Soporte"),
           ("Trabajar con nosotros", "Contesta: «Dejanos tu CV en el local»")]
NUMEROS_BOT = [("+54 9 11 5555-0100", "Toda la organización", True), ("+54 9 351 555-0200", "Delta Sur S.R.L.", False)]
AVISO_TOPE = ("El menú ya tiene 10 opciones", "WhatsApp muestra hasta 10 opciones", "Es lo que entra en una lista de WhatsApp",
              ["Quitá una opción para sumar otra", "O juntá dos opciones en una"])
CSS_BOT = """.w-body > .w-caja { flex-shrink: 0; }
.e11-dias { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; grid-column: 1 / -1; }
.e11-dia { display: grid; grid-template-columns: 26px 1fr 96px 18px 96px; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; font-size: 13.5px; }
.e11-dia + .e11-dia { border-top: 1px solid var(--borde); }
.e11-dia:nth-child(even) { background: var(--s2); }
.e11-dia .h { height: 32px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; padding: 0 10px; }
.e11-dia .a { color: var(--t3); text-align: center; }
.e11-dia.off { color: var(--t3); }
.e11-dia .cerrado { grid-column: 3 / -1; color: var(--t3); }
.e11-chk { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }
.e11-chk.on { background: var(--marca); border-color: var(--marca); color: #fff; }
.cb.e11-apag { opacity: 0.5; cursor: default; }
.e11-ops.flota { position: absolute; z-index: 6; top: auto; right: auto; }
"""
CSS_BOT_TEL = """.e11-dia { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; min-height: 52px; font-size: 16px; border-bottom: 1px solid var(--borde); }
.e11-dia:last-child { border-bottom: 0; }
.e11-dia .hs { color: var(--t2); font-size: 15px; }
.e11-dia.off { color: var(--t3); }
.e11-chk { width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }
.e11-chk.on { background: var(--marca); border-color: var(--marca); color: #fff; }
.ap-gtit a.e11-apag { opacity: 0.5; }
.ap-hoja .hb { max-height: 600px; overflow: auto; }
"""


def dias_compu():
    filas = []
    for d, on in DIAS:
        chk = f'<span class="e11-chk{" on" if on else ""}">{TILDE_CHK if on else ""}</span>'
        hs = ('<span class="h">09:00</span><span class="a">a</span><span class="h">18:00</span>' if on else '<span class="cerrado">Cerrado</span>')
        filas.append(f'<div class="e11-dia{"" if on else " off"}">{chk}<span>{d}</span>{hs}</div>')
    return '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Días y horarios de atención</span><div class="e11-dias">' + "".join(filas) + "</div></div>"


def dias_tel():
    filas = "".join(f'<div class="e11-dia{"" if on else " off"}"><span class="e11-chk{" on" if on else ""}">{TILDE_CHK if on else ""}</span><span>{d}</span>'
                    f'<span class="hs">{"9 a 18" if on else "Cerrado"}</span></div>' for d, on in DIAS)
    return f'<div class="ap-cmp"><span class="rt"><span>Días y horarios de atención</span></span><div>{filas}</div></div>'


def sin_interruptores(t):
    """D9 y el contrato: la bienvenida y el fuera de horario no se apagan; se editan."""
    for r in ("Bienvenida", "Fuera de horario"):
        t = t.replace(f'<span class="w-sw" role="switch" aria-checked="true" aria-label="{r}"></span>', "")
    chev = re.search(r'<span class="chev">(<svg.*?</svg>)</span>', t, flags=re.S)
    if chev:
        for r, s in (("Bienvenida", "La primera vez que alguien escribe"), ("Fuera de horario", "Lunes a viernes, de 9 a 18")):
            t = t.replace(f'<span class="tx"><b>{r}</b><span>{s}</span></span><span class="ap-sw" role="switch" aria-checked="true"></span>',
                          f'<span class="tx"><b>{r}</b><span>{s}</span></span><span class="chev">{chev.group(1)}</span>')
    return t


def bot_estados():
    for nombre in ("Plat-WA-Bot", "M-Plat-WA-Bot", "WA-Admin-Editar", "M-WA-Editar"):
        t = leer(nombre)
        n = sin_interruptores(t)
        if n != t:
            escribir(nombre, n)

    t = leer("WA-Respuestas")
    if 'data-e11="bot"' not in t:
        t = estados_compu(sin_interruptores(t), "Configuración")
        guardar = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button>'
        t = sumar_estado(t, "Editar bienvenida", encima=dlg("Bienvenida", f'<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Texto '
                         f'<span style="color: var(--peligro);">*</span></span><div class="ct area">{BIENVENIDA}</div></div>', guardar, chico=False))
        t = sumar_estado(t, "Editar fuera de horario", encima=dlg("Fuera de horario",
                         f'<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Texto <span style="color: var(--peligro);">*</span></span>'
                         f'<div class="ct area">{FUERA}</div></div>' + campo("Zona horaria", "Buenos Aires (GMT−3)") + dias_compu(), guardar, chico=False, una=False))
        pil = '<span class="w-pil">Número: +54 9 11 5555-0100 · Toda la organización'
        ops = ('<div class="e11-ops flota" role="listbox" aria-label="Número" style="left: 508px; top: 246px; width: 380px;">' + "".join(
            f'<div class="op{" on" if on else ""}" role="option" aria-selected="{"true" if on else "false"}">{n}<span>{a}</span></div>'
            for n, a, on in NUMEROS_BOT) + "</div>")
        t = sumar_estado(t, "Elegir el número", [(pil, pil.replace('class="w-pil"', 'class="w-pil e11-pil-on"'))], encima=ops)
        a, b = bloques(t, "e0")[0]
        base = t[a:b]
        menu = div_en(base, '<div class="w-caja"><div class="w-cab"><span>Menú</span>')
        num_svg = re.search(r'<a class="ib" href="WA-Admin-Editar.dc.html" aria-label="Acciones de Hacer un pedido">(<svg.*?</svg>)</a>', menu, flags=re.S).group(1)
        cab = div_en(menu, '<div class="w-cab">')
        filas = "".join(f'<div class="w-it"><span class="num">{i}</span><span class="dato"><b>{n}</b><span>{s}</span></span>'
                        f'<button type="button" class="ib" aria-label="Acciones de {n}">{num_svg}</button></div>' for i, (n, s) in enumerate(MENU_10, 1))
        cab10 = cab.replace('<button type="button" class="cb cb-sec ch">', '<button type="button" class="cb cb-sec ch e11-apag" aria-disabled="true">')
        menu10 = '<div class="w-caja">' + cab10 + filas + "</div>"
        tope = [(menu, menu10), ("<p class=\"res\">4 opciones en el menú</p>", "<p class=\"res\">10 opciones en el menú</p>")]
        t = sumar_estado(t, "Tope de 10 opciones", tope, encima="")
        t = sumar_estado(t, "Tope de 10 · qué significa", tope, encima=aviso(*AVISO_TOPE))
        sw = '<span class="w-sw" role="switch" aria-checked="true" aria-label="{}"></span>'
        t = sumar_estado(t, "Además apagado", [(sw.format(r), sw.format(r).replace('class="w-sw"', 'class="w-sw off"').replace('"true"', '"false"'))
                                               for r in ("Preguntar por promociones", "Ofrecer vincular su cuenta")], encima="")
        escribir("WA-Respuestas", marcar(t, 'data-e11="bot"', CSS_COMPU + CSS_BOT + CSS_OPS
                                          + ".w-pil.e11-pil-on { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }\n"))

    t = leer("M-WA-Respuestas")
    if 'data-e11="bot"' not in t:
        t = con_estados_pantalla(sin_interruptores(t), "Configuración")
        guardar = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>'
        area = '<div class="ap-cmp"><span class="rt"><span>Texto <span class="rq">*</span></span></span><div class="ct area">{}</div></div>'
        t = sumar_estado_tel(t, "Editar bienvenida", al_final=hoja("Bienvenida", area.format(BIENVENIDA), guardar))
        t = sumar_estado_tel(t, "Editar fuera de horario", al_final=hoja("Fuera de horario", area.format(FUERA)
                             + campo_tel("Zona horaria", "Buenos Aires (GMT−3)") + dias_tel(), guardar))
        ops = "".join(f'<div class="ap-op" role="option" aria-selected="{"true" if on else "false"}">{n} · {a}'
                      + (f'<span class="tilde">{TILDE}</span>' if on else "") + "</div>" for n, a, on in NUMEROS_BOT)
        t = sumar_estado_tel(t, "Elegir el número", al_final=('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Número"><span class="asa"></span>'
                             f'<div class="hc"><h2>Número</h2><button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button></div><div class="hb">{ops}</div></div>'))
        a, b = bloques(t, "e0")[0]
        base = t[a:b]
        grupo = div_en(base[base.index('<span class="ap-gtit">Menú'):], '<div class="ap-grupo">')
        chev = re.search(r'<span class="chev">(<svg.*?</svg>)</span>', grupo, flags=re.S).group(1)
        filas = "".join(f'<div class="ap-it "><span class="num">{i}</span><span class="tx"><b>{n}</b><span>{s}</span></span><span class="chev">{chev}</span></div>'
                        for i, (n, s) in enumerate(MENU_10, 1))
        tope = [(grupo, f'<div class="ap-grupo">{filas}</div>'), ('<span class="ap-gtit">Menú<a href="#">Agregar opción</a></span>',
                                                                    '<span class="ap-gtit">Menú<a href="#" class="e11-apag" aria-disabled="true">Agregar opción</a></span>')]
        t = sumar_estado_tel(t, "Tope de 10 opciones", tope)
        t = sumar_estado_tel(t, "Tope de 10 · qué significa", tope, al_final=aviso_tel(*AVISO_TOPE))
        sw_tel = '<span class="tx"><b>{}</b><span>{}</span></span><span class="ap-sw" role="switch" aria-checked="true"></span>'
        t = sumar_estado_tel(t, "Además apagado", [(sw_tel.format(r, s), sw_tel.format(r, s).replace('class="ap-sw"', 'class="ap-sw off"').replace('"true"', '"false"'))
                                                   for r, s in (("Preguntar por promociones", "Al terminar la primera conversación"),
                                                                ("Ofrecer vincular su cuenta", "Si el número es de una persona registrada"))])
        escribir("M-WA-Respuestas", marcar(t, 'data-e11="bot"', CSS_TEL + CSS_BOT_TEL + CSS_OPS_TEL))


# ---------------------------------------------------------------- Equipos (D6: aviso con «No avisar») y Plantillas («Por qué la rechazó Meta»)

AVISOS_EQUIPO = [("A los 10 minutos", True), ("A los 15 minutos", False), ("A los 30 minutos", False), ("No avisar", False)]
AVISO_RECHAZO = ("Meta rechazó «Promo semanal»", "El formato no cumple las reglas de Meta", "Revisada el 29/09/2026",
                 ["Duplicala y corregí el texto", "Mandala de nuevo a Meta"])


def equipos_plantillas():
    t = leer("WA-Equipos-Crear")
    if not ya(t):
        t = estados_compu(t, "Crear equipo")
        sel = '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Aviso por correo si nadie lo toma</span><div class="ct">A los 10 minutos'
        ops = '<div class="e11-ops" role="listbox" aria-label="Aviso por correo">' + "".join(
            f'<div class="op{" on" if on else ""}" role="option" aria-selected="{"true" if on else "false"}">{n}</div>' for n, on in AVISOS_EQUIPO) + "</div>"
        a, b = bloques(t, "e0")[1]
        encima = t[a:b][t[a:b].index(">") + 1:-len("</sc-if>")]
        i = encima.index(sel)
        fin = cierre_div(encima, i)
        abierto = encima[:i] + encima[i:fin - len("</div>")].replace('<div class="w-cmp" style=', '<div class="w-cmp e11-abre" style=', 1) + ops + "</div>" + encima[fin:]
        t = sumar_estado(t, "Elegir el aviso", encima=abierto)
        escribir("WA-Equipos-Crear", marcar(t, MARCA, CSS_COMPU + CSS_OPS))

    t = leer("M-WA-Equipos-Crear")
    if not ya(t):
        t = con_estados_pantalla(t, "Crear equipo")
        h = div_en(t, '<div class="ap-hoja"')
        ops = "".join(f'<div class="ap-op" role="option" aria-selected="{"true" if on else "false"}">{n}' + (f'<span class="tilde">{TILDE}</span>' if on else "")
                      + "</div>" for n, on in AVISOS_EQUIPO)
        nueva = ('<div class="ap-hoja" role="dialog" aria-label="Aviso por correo"><span class="asa"></span><div class="hc"><h2>Aviso por correo si nadie lo toma</h2>'
                 f'<button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button></div><div class="hb">{ops}</div></div>')
        t = sumar_estado_tel(t, "Elegir el aviso", [(h, nueva)])
        escribir("M-WA-Equipos-Crear", marcar(t, MARCA, CSS_TEL + CSS_OPS_TEL))

    t = leer("WA-Plantillas")
    if not ya(t):
        t = estados_compu(t, "Lista")
        t = sumar_estado(t, "Por qué la rechazó Meta", encima=aviso(*AVISO_RECHAZO))
        escribir("WA-Plantillas", marcar(t, MARCA, CSS_COMPU))
    t = leer("M-WA-Plantillas")
    if not ya(t):
        t = con_estados_pantalla(t, "Lista")
        t = sumar_estado_tel(t, "Por qué la rechazó Meta", al_final=aviso_tel(*AVISO_RECHAZO))
        escribir("M-WA-Plantillas", marcar(t, MARCA, CSS_TEL))


# ---------------------------------------------------------------- Personas: Mensajes de la persona, Cargar teléfonos, Usuarios y permisos de Plataforma

PERMISOS_WA = [("Administrar el WhatsApp de Plataforma", "Conectar el número y configurar el bot, los equipos y las plantillas de consultas."),
               ("Atender consultas", "Ver y responder las consultas que llegan al número de Plataforma.")]
TELEFONOS = ["11 5555-4521", "11 5555-7310", "11 5555-8812", "11 5555-9934", "11 5555-1200", "11 4444"]
INVITADOS = ["+54 9 11 5555-8812", "+54 9 11 5555-9934", "+54 9 11 5555-1200"]
DESVINCULAR_TXT = ('<p class="e11-tx">Deja de verse en Mensajes y La Clementina ya no la ve unida a tu cuenta. '
                   'Podés seguir escribiéndole por WhatsApp.</p>')
DESVINCULAR_PIE = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Desvincular</button>'
CSS_PERSONAS = """.e11-vacio { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; font-size: 14px; font-weight: 600; color: var(--t2); }
.w-cmp .ct.area.e11-alto { height: 168px; white-space: pre-line; }
"""


def permisos_plataforma():
    for nombre in ("Cuenta-Plat", "M-Cuenta-Plat"):
        t = leer(nombre)
        if "Atender consultas" in t:
            continue
        aud = "Los eventos de seguridad de todo el servicio."
        if nombre == "Cuenta-Plat":
            t = re.sub(r'(<div class="o-fila"><span class="dos"><span class="c1">Ver la auditoría</span><span class="n2">' + aud
                       + r'</span></span><span class="o-perm (?:si|no)">(?:<svg.*?</svg>|—)</span></div>)',
                       lambda m: m.group(1) + "".join(f'<div class="o-fila"><span class="dos"><span class="c1">{n}</span><span class="n2">{d}</span></span>'
                                                      '<span class="o-perm no">—</span></div>' for n, d in PERMISOS_WA), t, flags=re.S)
            t = re.sub(r'(<label class="op2"><input type="checkbox"(?: checked)?><span><span class="opn">Ver la auditoría</span><span class="opd">' + aud
                       + r'</span></span></label>)',
                       lambda m: m.group(1) + "".join(f'<label class="op2"><input type="checkbox"><span><span class="opn">{n}</span><span class="opd">{d}</span></span></label>'
                                                      for n, d in PERMISOS_WA), t)
        else:
            t = re.sub(r'(<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">Ver la auditoría</span><span class="ap-perm (?:si|no)">(?:<svg.*?</svg>|—)</span></span>'
                       r'<span class="l2">' + aud + r'</span></div></div>)',
                       lambda m: m.group(1) + "".join(f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{n}</span><span class="ap-perm no">—</span></span>'
                                                      f'<span class="l2">{d}</span></div></div>' for n, d in PERMISOS_WA), t, flags=re.S)
        assert t.count("Atender consultas") >= 2, nombre
        escribir(nombre, t)


def usuarios_telefono():
    # Las invitaciones de «Cargar teléfonos» figuran en Usuarios con el teléfono (ADR 0047: la identidad de la invitación es un Phone).
    t = leer("Usuarios")
    if INVITADOS[0] not in t:
        nuevos = "".join(f"  {{ id: 'u1{i}', n: '', email: '{tel}', estado: 'invitado', vence: '20/10/2026', rolesOrg: [], empresas: [{{ c: 'c1', roles: ['Solo lectura'] }}] }},\n"
                         for i, tel in enumerate(INVITADOS, 2))
        marca = "  { id: 'u8', n: 'Marcos Giménez',"
        t = rep(t, marca, nuevos + marca)
        escribir("Usuarios", t)
    t = leer("M-Usuarios")
    if not ya(t):
        wa = re.search(r'<span class="w-av g">(<svg.*?</svg>)</span>', leer("M-WA-Chats"), flags=re.S).group(1)
        i = t.index('<span class="w-av">M</span><span class="tx"><span class="l1"><b>Marcos Giménez</b>')
        i = t.rindex('<div class="w-conv"', 0, i)
        fila = div_en(t[i:], '<div class="w-conv"')
        boton = re.search(r'<button type="button" class="ap-ib" aria-label="Acciones de Marcos Giménez">.*?</button>', fila, flags=re.S).group(0)
        filas = "".join(fila[:fila.index('<span class="w-av">')] + f'<span class="w-av g">{wa}</span><span class="tx"><span class="l1"><b>{tel}</b></span>'
                        '<span class="l2"><span>Delta S.A. · Solo lectura</span></span><span class="l3"><span class="w-est azul">Invitación pendiente</span> · vence 20/10</span></span></a>'
                        + boton.replace("Marcos Giménez", tel) + "</div>" for tel in INVITADOS)
        t = t[:i] + filas + t[i:]
        t = con_estados_pantalla(t, "Lista")
        menu = '<div class="ap-menu" role="menu" style="top: 96px;"><a role="menuitem" href="M-WA-Telefonos.dc.html" style="color: inherit; text-decoration: none;"><span>Cargar teléfonos</span></a></div>'
        t = sumar_estado_tel(t, "Menú", al_final=menu)
        escribir("M-Usuarios", marcar(t, MARCA, CSS_TEL))


def cargar_telefonos():
    t = leer("WA-Telefonos")
    if not ya(t):
        t = estados_compu(t, "Revisar")
        tabla = div_en(t, '<div class="w-caja"><div class="w-th p">')
        campo_tels = ('<div class="w-caja"><div class="w-cab"><span>Teléfonos</span></div><div class="o-g2"><div class="w-cmp" style="grid-column: 1 / -1;">'
                      '<span class="rt" style="display: flex; align-items: center; justify-content: space-between;"><span>Uno por renglón, hasta 200 '
                      '<span style="color: var(--peligro);">*</span></span><a href="#" style="font-weight: 600; color: var(--marca-tx); text-decoration: none;">Subir un archivo</a></span>'
                      f'<div class="ct area e11-alto">{chr(10).join(TELEFONOS)}</div></div></div></div>')
        t = sumar_estado(t, "Pegar o subir", [(tabla, campo_tels), ("6 teléfonos · 2 ya son miembros · 3 invitaciones · 1 inválido", "Paso 1 de 2"),
                                               (">Vincular y mandar 3 invitaciones<", ">Revisar 6 teléfonos<")], encima="")
        t = ordenar_opciones(t, ["Pegar o subir", "Revisar"])
        escribir("WA-Telefonos", marcar(t, MARCA, CSS_COMPU + CSS_PERSONAS))
    t = leer("M-WA-Telefonos")
    if not ya(t):
        t = con_estados_pantalla(t, "Revisar")
        cuerpo = div_en(t, '<div class="ap-cuerpo">')
        grupo = div_en(cuerpo, '<div class="ap-grupo"')
        corte = cuerpo.index(grupo) + len(grupo)
        area = ('<span class="ap-gtit">Teléfonos</span><div class="ap-cmp" style="padding: 0 16px;"><span class="rt"><span>Uno por renglón, hasta 200 <span class="rq">*</span></span>'
                '<a class="ej" href="#">Subir un archivo</a></span>'
                f'<div class="ct area" style="white-space: pre-line; min-height: 190px;">{chr(10).join(TELEFONOS)}</div></div>')
        t = sumar_estado_tel(t, "Pegar o subir", [(cuerpo, cuerpo[:corte] + area + "</div>"), ('<span class="sub">6 teléfonos · 3 invitaciones</span>', '<span class="sub">Paso 1 de 2</span>'),
                                                  (">Vincular y mandar 3 invitaciones<", ">Revisar 6 teléfonos<")])
        t = ordenar_opciones(t, ["Pegar o subir", "Revisar"])
        escribir("M-WA-Telefonos", marcar(t, MARCA, CSS_TEL + ".ap-cmp .ej { text-decoration: none; font-size: 13.5px; font-weight: 600; color: var(--marca-tx); }\n"))


def mensajes_persona():
    t = leer("WA-Mensajes")
    if not ya(t):
        t = estados_compu(t, "Conversación")
        chat = div_en(t, '<div class="w-chat">')
        t = sumar_estado(t, "Vacío", [(chat, '<div class="w-body"><div class="w-caja e11-vacio">Todavía no tenés mensajes con organizaciones</div></div>'),
                                      ('<p class="res">3 organizaciones</p>', '<p class="res">Ninguna organización</p>')], encima="")
        menu = ('<div class="o-menu" role="menu" aria-label="Acciones de La Clementina" style="top: 168px; right: 24px;">'
                '<span class="it pel" role="menuitem">Desvincular</span></div>')
        t = sumar_estado(t, "Menú de la conversación", encima=menu)
        t = sumar_estado(t, "Desvincular", encima=dlg("¿Desvincular la conversación con La Clementina?", DESVINCULAR_TXT, DESVINCULAR_PIE, cerrar=False))
        escribir("WA-Mensajes", marcar(t, MARCA, CSS_COMPU + CSS_PERSONAS))
    t = leer("M-WA-Mensajes")
    if not ya(t):
        t = con_estados_pantalla(t, "Lista")
        cuerpo = div_en(t, '<div class="ap-cuerpo">')
        t = sumar_estado_tel(t, "Vacío", [(cuerpo, '<div class="ap-cuerpo"><div class="e11-vacio">Todavía no tenés mensajes con organizaciones</div></div>')])
        escribir("M-WA-Mensajes", marcar(t, MARCA, CSS_TEL + ".e11-vacio { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 32px; "
                                         "text-align: center; font-size: 16px; font-weight: 600; color: var(--t2); }\n"))
    t = leer("M-WA-Mensaje")
    if not ya(t):
        t = con_estados_pantalla(t, "Conversación")
        t = sumar_estado_tel(t, "Menú", al_final='<div class="ap-menu" role="menu"><span class="pel" role="menuitem">Desvincular</span></div>')
        t = sumar_estado_tel(t, "Desvincular", al_final=hoja("¿Desvincular la conversación con La Clementina?", DESVINCULAR_TXT, DESVINCULAR_PIE, cerrar=False))
        escribir("M-WA-Mensaje", marcar(t, MARCA, CSS_TEL))


# ---------------------------------------------------------------- Textos: mensajes del sistema y «Decisiones por pantalla»

MENSAJES_NUEVOS = {
    "Chats esperando": """  {
    n: 'Consultas esperando',
    // Plataforma › WhatsApp: el mismo aviso que «Chats esperando», para un equipo de operadores. Solo el resumen, sin mensajes ni teléfonos.
    correo: {
      asunto: 'Tenés 2 consultas esperando en Soporte',
      para: 'martin.sosa@arquitecturabase.ejemplo.com',
      titulo: '2 consultas esperando en Soporte',
      parrafos: [P('Hola, Martín. Hay 2 consultas de WhatsApp sin tomar en Soporte, de ArquitecturaBase. La más vieja espera hace 15 minutos.')],
      boton: 'Ver las consultas',
      pie: 'Te llega porque estás en el equipo Soporte. Quien administra el WhatsApp de Plataforma elige cuándo se manda este aviso.',
    },
  },
""",
    "Bot: cuenta de operador": """  {
    n: 'Bot: ofrecer vincular',
    // D2 (13/10): el bot de una organización lo ofrece solo si el número es un Phone verificado de una cuenta, al terminar la conversación.
    wa: { mio: 'Gracias, era eso.', texto: [N('Este número es de una cuenta de ArquitecturaBase. ¿Querés ver esta conversación con Grupo Delta en Mensajes, en tu cuenta?')],
      botones: [{ t: 'Vincular', resp: true }, { t: 'Ahora no', resp: true }] },
  },
  {
    n: 'Bot: conversación vinculada',
    // D5: Mensajes muestra la conversación desde que se vinculó.
    wa: { mio: 'Vincular', texto: [N('Listo. Desde ahora ves esta conversación en Mensajes, en tu cuenta de ArquitecturaBase.')], botones: [] },
  },
""",
}


def mensajes_sistema():
    t = leer("Mensajes")
    if "Consultas esperando" in t:
        return
    # Con Consultas, el chat del número de la plataforma ya no sirve solo para entrar.
    t = t.replace(" pie: 'Por ahora este chat solo sirve para entrar.',", "")
    t = t.replace("pie: 'Te llega porque estás en el equipo Ventas. El Dueño elige cuándo se manda este aviso.',",
                  "pie: 'Te llega porque estás en el equipo Ventas. Quien administra WhatsApp elige cuándo se manda este aviso.',")
    for despues, bloque in MENSAJES_NUEVOS.items():
        i = t.index(f"    n: '{despues}',")
        i = t.rindex("  {\n", 0, i)
        fin = t.index("\n  },\n", i) + len("\n  },\n")
        t = t[:fin] + bloque + t[fin:]
    # Los mensajes del bot de una organización salen de su número: el encabezado del teléfono dice quién manda.
    t = rep(t, '<span class="logo" aria-hidden="true"></span>\n            <div><div class="n1">ArquitecturaBase <svg',
            '<sc-if value="{{w.dePlataforma}}" hint-placeholder-val="{{si}}"><span class="logo" aria-hidden="true"></span></sc-if>'
            '<sc-if value="{{w.deOrg}}" hint-placeholder-val="{{no}}"><span class="logo e11-org" aria-hidden="true">GD</span></sc-if>\n'
            '            <div><div class="n1">{{w.de}} <svg')
    t = rep(t, "        mio: w.mio || '', horaMia: '14:34', hora: '14:35',",
            "        mio: w.mio || '', horaMia: '14:34', hora: '14:35', de: w.de || 'ArquitecturaBase', dePlataforma: !w.de, deOrg: !!w.de,")
    t = t.replace("wa: { mio: 'Gracias, era eso.',", "wa: { de: 'Grupo Delta', mio: 'Gracias, era eso.',").replace("wa: { mio: 'Vincular',", "wa: { de: 'Grupo Delta', mio: 'Vincular',")
    t = marcar(t, MARCA, ".wa-cab .logo.e11-org { background: var(--marca); background-image: none; color: #fff; display: inline-flex; align-items: center; "
                         "justify-content: center; font-size: 13px; font-weight: 700; }\n"
                         ".wa-cab .logo.e11-org::before, .wa-cab .logo.e11-org::after { display: none; }\n")
    t = sumar_opcion(t, "Chats esperando", "Consultas esperando", "mensaje")
    t = sumar_opcion(t, "Bot: cuenta de operador", "Bot: ofrecer vincular", "mensaje")
    t = sumar_opcion(t, "Bot: ofrecer vincular", "Bot: conversación vinculada", "mensaje")
    assert "solo sirve para entrar" not in t
    escribir("Mensajes", t)


if __name__ == "__main__":
    datos()
    numeros()
    plataforma()
    bot()
    alta()
    chats_compu()
    chats_resto()
    chats_tel()
    plantilla_elegir()
    bot_estados()
    equipos_plantillas()
    contactos()
    difusiones()
    permisos_plataforma()
    usuarios_telefono()
    cargar_telefonos()
    mensajes_persona()
    mensajes_sistema()
