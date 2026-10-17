"""Etapa 11, tanda A: los estados de Chats, Números, Bot y Equipos que el front ya programó y que al lienzo le faltaban,
copiados de la app (informe del front del 13/10 y decisiones del coordinador). Corre después de `etapa11_1004.py`.

Primero los formatos que muestra la app, en todos los tableros de la tanda: teléfonos en formato nacional (PhoneText:
«011 15-5555-0100»), la fecha corta en la lista de chats y en los días del hilo («05/10», no «Lunes»), las horas del bot
«Lunes a viernes, de 09:00 a 18:00», el bot sin «Ver opciones», Plataforma sin el ⋮ del chat ni el de la opción del
sistema. Esos cambios son idempotentes por sí mismos. Después, los estados nuevos de cada tablero, que lleva la marca
`data-e11ta` y no se vuelve a tocar si ya la tiene; para rehacerlo, se restaura desde git y se vuelve a correr."""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from etapa11_1004 import (ALERTA, CERRAR, CERRAR_TEL, OK, aviso, aviso_tel, bloques, campo, campo_tel, cierre_div, div_en, dlg,  # noqa: E402
                          escribir, estados_compu, hoja, leer, sumar_estado, sumar_estado_tel)
from estados_util import con_estados_pantalla, marcar, rep, sumar_opcion  # noqa: E402

MARCA = "data-e11ta"

TABLEROS = """WA-Chats WA-Chats-24h WA-Chats-Nota WA-Chats-Pasar WA-Chats-SinTomar M-WA-Chats M-WA-Conversacion M-WA-24h M-WA-Chats-Nota
M-WA-Chats-Pasar M-WA-Chats-SinTomar Plat-WA-Chats M-Plat-WA-Chats M-Plat-WA-Conversacion WA-Mensajes M-WA-Mensajes M-WA-Mensaje WA-Admin
WA-Admin-Pago WA-Admin-Vacio M-WA-Admin M-WA-Admin-Pago M-WA-Admin-Vacio WA-Alta WA-Alta-Meta WA-Alta-Coexistencia M-WA-Alta Plat-WA-Numero
M-Plat-WA-Numero Plat-WA-Alta M-Plat-WA-Alta WA-Respuestas M-WA-Respuestas WA-Admin-Editar M-WA-Editar WA-Bot-Recorrido M-WA-Bot-Recorrido
Plat-WA-Bot M-Plat-WA-Bot Plat-WA-Bot-Recorrido WA-Equipos M-WA-Equipos WA-Equipos-Crear M-WA-Equipos-Crear Plat-WA-Equipos
M-Plat-WA-Equipos""".split()
# La ventana de Meta la dibuja Facebook: sus números van como los muestra Meta, no la app.
VENTANA_META = {"WA-Alta-Meta", "WA-Alta-Coexistencia"}


def ya(t):
    return MARCA in t


def _svg(d, w=18, sw="2"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


INFO20 = _svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 20)
OK20 = _svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 20, "1.8")
INFO18 = _svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 18)
ALERTA28 = _svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>', 28)
LUPA18 = _svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>', 18, "1.75")
VOLVER = _svg('<path d="M15 5 8 12l7 7"/>', 24)

# ---------------------------------------------------------------- estilos (clases propias `ta-`; lo de la base, solo si falta)

TA_COMPU = """.ta-menu { position: absolute; z-index: 6; width: 260px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); overflow: hidden; display: flex; flex-direction: column; }
.ta-menu .it { display: flex; flex-direction: column; padding: 9px 12px; font-size: 13.5px; line-height: 1.35; color: var(--t1); text-decoration: none; }
.ta-menu .it + .it { border-top: 1px solid var(--borde); }
.ta-menu .it.pel { color: oklch(0.52 0.19 25); }
.ta-menu .sep2 { height: 6px; background: var(--s2); border-top: 1px solid var(--borde); }
.ta-menu .ta-nadie, .o-menu .ta-nadie { margin: 0; padding: 8px 14px; font-size: 13px; color: var(--t2); }
.ta-toast { position: absolute; z-index: 41; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; max-width: 460px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); font-size: 13px; color: var(--t1); }
.ta-toast > span:first-child { display: inline-flex; flex-shrink: 0; }
.ta-toast .ok { color: oklch(0.55 0.13 155); }
.ta-toast .neu { color: var(--t2); }
.ta-toast.mal { border-color: oklch(0.57 0.2 25 / 0.45); padding: 8px 8px 8px 14px; }
.ta-toast .mal { color: oklch(0.55 0.2 25); }
.ta-toast .ib { width: 28px; height: 28px; }
.ta-vacio { padding: 32px; text-align: center; font-size: 14px; font-weight: 600; color: var(--t1); }
.ta-gris { flex: 1; background: var(--s2); }
.w-bus.ta-lleno { color: var(--t1); }
.w-pil.ta-on { border-color: var(--marca); background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.ta-limpiar { border: 0; background: transparent; font-family: inherit; padding: 6px 8px; border-radius: 8px; font-size: 13px; color: var(--t3); }
.ta-carga { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 32px; text-align: center; }
.ta-carga b { font-size: 14px; font-weight: 600; }
.ta-ant { display: flex; justify-content: center; flex-shrink: 0; }
.w-m .pie.ta-fallo { color: var(--peligro); }
.ta-girar { display: inline-block; width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 2px solid oklch(1 0 0 / 0.4); border-top-color: #fff; }
.w-dlg.chico { width: 420px; }
.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
.w-dlg .db.ta-nada { display: none; }
.w-cmp .ct.mal { border-color: var(--peligro); }
.w-cmp .err2 { font-size: 12.5px; color: var(--peligro); }
.w-cmp .ta-ph { color: var(--t3); }
.ta-solo { font-size: 13.5px; min-height: 36px; display: flex; align-items: center; }
.w-cmp.ta-abre { position: relative; }
.w-cmp.ta-abre .ct { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.w-dlg:has(.ta-abre) { overflow: visible; }
.w-dlg:has(.ta-abre) .dc { border-radius: 12px 12px 0 0; }
.ta-ops { position: absolute; z-index: 3; left: 0; right: 0; top: calc(100% + 4px); background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); }
.ta-ops p { margin: 0; padding: 12px 14px; font-size: 13px; color: var(--t2); }
.ta-sin { margin: 0; padding: 16px 20px; font-size: 13px; color: var(--t2); }
.e11-dia .h.ta-mal { border-color: var(--peligro); }
.e11-dia .ta-err-dia { grid-column: 2 / -1; margin: -6px 0 8px; font-size: 12.5px; color: var(--peligro); }
.w-it .dato span.e11-cobra { color: oklch(0.55 0.13 70); }
.filtro.ta-envuelve { flex-wrap: wrap; }
.filtro.ta-envuelve .w-bus { flex-basis: 100%; }
"""
TA_TEL = """.ta-snack { position: absolute; z-index: 9; left: 12px; right: 12px; bottom: 110px; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.ta-snack.x { padding: 6px 6px 6px 16px; }
.ta-snack .tx { flex: 1; min-width: 0; }
.ta-snack .ok { color: oklch(0.78 0.14 155); display: inline-flex; }
.ta-snack .neu { color: oklch(1 0 0 / 0.7); display: inline-flex; }
.ta-snack .mal { color: oklch(0.75 0.15 25); display: inline-flex; }
.ta-snack .ap-ib { color: #fff; }
.ta-vacio { padding: 32px; text-align: center; font-size: 14px; font-weight: 600; color: var(--t1); }
.ta-vacio.marco { margin: 16px; border: 1px dashed var(--borde2); border-radius: 12px; }
.ta-bus { flex-shrink: 0; margin: 4px 16px 8px; display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; border-radius: 12px; background: var(--s3); color: var(--t3); font-size: 15.5px; }
.ta-bus span { color: var(--t1); }
.ta-ant { display: flex; justify-content: center; flex-shrink: 0; }
.ap-m .pie.ta-fallo { color: var(--peligro); }
.ta-nadie { margin: 0; padding: 4px 0 8px; font-size: 15px; color: var(--t2); }
.ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }
.ap-acciones span { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); }
.ap-acciones span:first-child { border-top: 0; }
.ap-acciones .sep { min-height: 8px; padding: 0; background: var(--s2); }
.ap-acciones .pel { color: var(--peligro); }
.ap-hoja .hp.ta-wrap { flex-wrap: wrap; }
.ap-hoja .hp .cb.ta-full { flex-basis: 100%; }
.ap-cmp .ct.mal { border-color: var(--peligro); box-shadow: 0 0 0 3px oklch(0.57 0.2 25 / 0.12); }
.ap-cmp .ta-ph { color: var(--t3); }
.ap-err { font-size: 13.5px; color: var(--peligro); margin: -2px 0 0; }
.ta-solo { font-size: 16px; min-height: 28px; display: flex; align-items: center; }
.ta-sin { margin: 0; padding: 16px; font-size: 13px; color: var(--t2); }
.e11-dia .hs.ta-hs { display: inline-flex; align-items: center; gap: 8px; color: var(--t3); }
.e11-dia .hs.ta-hs .h { width: 96px; height: 40px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; display: inline-flex; align-items: center; padding: 0 12px; font-size: 15px; color: var(--t1); }
.e11-dia .hs.ta-hs .h.ta-mal { border-color: var(--peligro); }
.e11-dia .ta-err-dia { grid-column: 2 / -1; margin: -8px 0 10px; font-size: 13.5px; color: var(--peligro); }
.ap-it .tx span.e11-cobra { color: oklch(0.55 0.13 70); }
.ap:has(.ta-snack) .ap-fab { bottom: 180px; }
.ap-hoja .hb:has(> .ta-nadie) { padding-bottom: 34px; }
"""
# Lo de la base que algunos tableros no traen (copiado de etapa11_1004 y de M-Error-Org).
BASE_COMPU = {
    ".e11-tx {": ".e11-tx { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--t1); }\n",
    ".o-mot {": """.o-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 10px; background: var(--peligro-t); color: oklch(0.42 0.16 25); grid-column: 1 / -1; }
.o-mot svg { flex-shrink: 0; margin-top: 1px; }
.o-mot b { display: block; font-size: 15px; font-weight: 600; color: oklch(0.38 0.15 25); }
.o-mot span { font-size: 12.5px; }
.o-sub { font-size: 12.5px; font-weight: 600; color: var(--t3); grid-column: 1 / -1; }
.o-pasos { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; grid-column: 1 / -1; }
.o-pasos li { display: flex; gap: 10px; align-items: center; font-size: 13.5px; }
.o-pasos .n { width: 22px; height: 22px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
""",
    ".mw-pill {": """.mw-velo { position: absolute; inset: 0; z-index: 30; background: oklch(0.2 0.01 60 / 0.45); }
.mw-pill { position: absolute; z-index: 31; left: 50%; bottom: 28px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; padding: 10px 12px 10px 18px; border-radius: 999px; background: #fff; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.25); font-size: 13.5px; color: var(--t1); white-space: nowrap; }
.mw-pill .cb { height: 32px; border-radius: 16px; }
""",
}
BASE_TEL = {
    ".e11-tx {": ".e11-tx { margin: 0; font-size: 15px; line-height: 1.5; color: var(--t1); }\n",
    ".ap-mot {": """.ap-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px; background: var(--peligro-t); color: oklch(0.42 0.16 25); }
.ap-mot svg { flex-shrink: 0; margin-top: 1px; }
.ap-mot b { display: block; font-size: 15.5px; font-weight: 600; color: oklch(0.38 0.15 25); }
.ap-mot span { font-size: 13.5px; }
""",
    ".ap-pasos {": """.ap-sub { font-size: 13px; font-weight: 600; color: var(--t3); margin-bottom: -2px; }
.ap-pasos { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.ap-pasos li { display: flex; gap: 12px; align-items: center; font-size: 15px; }
.ap-pasos .n { width: 28px; height: 28px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
""",
    ".f-centro {": """.f-centro { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0 32px; text-align: center; background: #fff; }
.f-centro h1 { margin: 6px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; }
.f-circ { width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--s3); color: var(--t2); }
.f-btn { height: 48px; padding: 0 26px; border-radius: 24px; margin-top: 10px; font-size: 15.5px; }
""",
}


def estilos(t, tel, extra=""):
    cab = t[:t.index("</helmet>")]
    base = "".join(css for clave, css in (BASE_TEL if tel else BASE_COMPU).items() if clave not in cab)
    return base + (TA_TEL if tel else TA_COMPU) + extra


def guardar(nombre, t, extra=""):
    escribir(nombre, marcar(t, MARCA, estilos(t, nombre.startswith("M-"), extra)))


# ---------------------------------------------------------------- formatos que muestra la app

TEL = re.compile(r"\+54 9 (\d{2,4}) (\d{3,4})-(\d{4})")


def nacional(t):
    """PhoneText en es-AR (libphonenumber, formatNational): «+54 9 11 5555-0100» → «011 15-5555-0100»."""
    return TEL.sub(lambda m: f"0{m.group(1)} 15-{m.group(2)}-{m.group(3)}", t)


HS_TEL = '<span class="hs ta-hs"><span class="h">09:00</span>a<span class="h">18:00</span></span>'


def formatos():
    for nombre in TABLEROS:
        t = leer(nombre)
        n = t if nombre in VENTANA_META else nacional(t)
        # El bot no muestra «Ver opciones» (la galería lo marca: la app no lo dibuja).
        n = n.replace('<span class="bt">Ver opciones</span>', "")
        # La lista de chats y los días del hilo: «10:42», «Ayer» o la fecha corta. El lunes de los ejemplos es el 05/10.
        for clase in ("w-dia", "ap-dia"):
            n = n.replace(f'<span class="{clase}">Lunes</span>', f'<span class="{clase}">05/10</span>')
        n = re.sub(r'(<span class="l1"><b>[^<]*</b><span>)Lunes(</span>)', lambda m: m.group(1) + "05/10" + m.group(2), n)
        # Las horas del bot, como las arma scheduleSummary; en el diálogo del teléfono, las dos horas en su campo.
        n = n.replace("Lunes a viernes, de 9 a 18<", "Lunes a viernes, de 09:00 a 18:00<")
        n = n.replace('<span class="hs">9 a 18</span>', HS_TEL)
        if nombre == "Plat-WA-Chats":
            # El ⋮ del chat solo lleva «Ver ficha del contacto»; en Plataforma no hay ficha y no se dibuja.
            n = re.sub(r'(<span class="cb cb-sec ch">Pasar</span>)<button type="button" class="ib" aria-label="Acciones de Lucía Fernández">.*?</button>',
                       lambda m: m.group(1), n, flags=re.S)
        if nombre == "Plat-WA-Bot":
            # La opción del sistema no se edita ni se quita: sin ⋮.
            n = re.sub(r'(<span class="o-gris">Del sistema</span>)<button type="button" class="ib" aria-label="Acciones de Entrar a mi cuenta">.*?</button>',
                       lambda m: m.group(1), n, flags=re.S)
        if nombre == "M-Plat-WA-Bot":
            n = re.sub(r'(<span class="ap-gris-t">Del sistema</span>)<span class="chev"><svg.*?</svg></span>', lambda m: m.group(1), n, flags=re.S)
        assert not re.search(r'<span class="(?:w-dia|ap-dia)">(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)</span>', n), nombre
        if n != t:
            escribir(nombre, n)


# ---------------------------------------------------------------- ayudas

def bloque(t, var, i=0):
    a, b = bloques(t, var)[i]
    return t[a:b]


def en_bloque(t, var, cambios, i=0):
    """Cambia el bloque `var` (el de contenido, o el i-ésimo) de un estado que ya existe."""
    a, b = bloques(t, var)[i]
    nuevo = t[a:b]
    for c in cambios:
        viejo, bueno = c[0], c[1]
        veces = c[2] if len(c) > 2 else 1
        assert nuevo.count(viejo) == veces, (var, viejo[:120], nuevo.count(viejo))
        nuevo = nuevo.replace(viejo, bueno)
    return t[:a] + nuevo + t[b:]


def interior(t, var, i=1):
    """Lo de adentro del bloque `var` (por omisión, el segundo: lo que se abre encima)."""
    x = bloque(t, var, i)
    return x[x.index(">") + 1:-len("</sc-if>")]


def sumar_encima(t, nombre, html, pref="e", tras=None):
    """Un estado que es solo lo que se abre encima del contenido común (los tableros del alta)."""
    nums = [int(x) for x in re.findall(r"\n      " + pref + r"(\d+): ", t)]
    var = f"{pref}{max(nums) + 1}"
    bloq = '<sc-if value="{{' + var + '}}" hint-placeholder-val="{{no}}">' + html + "</sc-if>"
    raya = t.rfind('<span class="ap-raya"></span>')
    fin = raya if raya > 0 else t.rindex("</div>", 0, t.index("</x-dc>"))
    t = t[:fin] + bloq + t[fin:]
    ops = re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]', t)
    t = sumar_opcion(t, tras or json.loads("[" + ops.group(1) + "]")[-1], nombre)
    return rep(t, "\n    };\n  }\n}", f"\n      {var}: e === {json.dumps(nombre, ensure_ascii=False)},\n    }};\n  }}\n}}")


def boton(t, etiqueta):
    """El botón ⋮ (o el que sea) con ese aria-label, entero."""
    m = re.search(r'<(button|a) [^>]*aria-label="' + re.escape(etiqueta) + r'"[^>]*>.*?</\1>', t, flags=re.S)
    assert m, etiqueta
    return m.group(0)


def prendido(b):
    return b.replace('class="ib"', 'class="ib on"', 1)


def menu(etiqueta, items, estilo):
    """El ⋮ abierto en la compu: opciones, y las de peligro al final después de la franja gris."""
    comunes, peligro = items
    h = "".join(f'<span class="it" role="menuitem">{x}</span>' for x in comunes)
    if peligro:
        h += '<div class="sep2" role="separator"></div>' + "".join(f'<span class="it pel" role="menuitem">{x}</span>' for x in peligro)
    return f'<div class="ta-menu" role="menu" aria-label="{etiqueta}" style="{estilo}">{h}</div>'


def acciones_tel(titulo, comunes, peligro=()):
    """El ⋮ de una fila en el teléfono: hoja desde abajo con el dato de la fila de título, sin ✕ (RowActions)."""
    h = "".join(f'<span role="menuitem">{x}</span>' for x in comunes)
    if peligro:
        h += '<span class="sep" role="separator"></span>' + "".join(f'<span class="pel" role="menuitem">{x}</span>' for x in peligro)
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de {titulo}"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div><div class="hb" style="padding-bottom: 34px;">'
            f'<div class="ap-acciones">{h}</div></div></div>')


def confirmar(titulo, cuerpo, pie):
    """ConfirmDialog: sin ✕; sin descripción, solo el título y los botones."""
    db = f'<div class="db una">{cuerpo}</div>' if cuerpo else '<div class="db ta-nada"></div>'
    return (f'<div class="w-oscuro"><div class="w-dlg chico" role="alertdialog" aria-label="{titulo}"><div class="dc"><span>{titulo}</span></div>'
            f'{db}<div class="df">{pie}</div></div></div>')


def confirmar_tel(titulo, cuerpo, pie):
    hb = f'<div class="hb">{cuerpo}</div>' if cuerpo else ""
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div>{hb}<div class="hp">{pie}</div></div>')


def toast(texto, tipo="ok"):
    icono = {"ok": OK, "neu": INFO18, "mal": ALERTA}[tipo]
    x = f'<button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button>' if tipo == "mal" else ""
    return (f'<div class="ta-toast{" mal" if tipo == "mal" else ""}" role="{"alert" if tipo == "mal" else "status"}">'
            f'<span class="{tipo}">{icono}</span><span>{texto}</span>{x}</div>')


def snack(texto, tipo="ok"):
    icono = {"ok": OK20, "neu": INFO20, "mal": ALERTA}[tipo]
    x = f'<button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button>' if tipo == "mal" else ""
    return (f'<div class="ta-snack{" x" if tipo == "mal" else ""}" role="{"alert" if tipo == "mal" else "status"}">'
            f'<span class="{tipo}">{icono}</span><span class="tx">{texto}</span>{x}</div>')


PIE_GUARDAR = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>'
PIE_CAMBIOS = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button>'


def ct_mal(rotulo, placeholder, error, req=True, ancho=True, select=True, tel=False):
    """Un campo con su error debajo (FormField): el borde rojo y el texto rojo; vacío, o con el texto gris de cuando no hay nada."""
    valor = f'<span class="ta-ph">{placeholder}</span>' if placeholder else ""
    if tel:
        h = campo_tel(rotulo, valor, req=req, select=select).replace('<div class="ct', '<div class="ct mal', 1)
        return h[:-len("</div>")] + f'<p class="ap-err" role="alert">{error}</p></div>'
    h = campo(rotulo, valor, req=req, select=select, ancho=ancho).replace('<div class="ct">', '<div class="ct mal">', 1)
    return h[:-len("</div>")] + f'<span class="err2" role="alert">{error}</span></div>'


# ---------------------------------------------------------------- Chats

VACIO_CHATS = '<div class="ta-vacio">Todavía no hay conversaciones</div>'
NINGUNA_CHATS = '<div class="ta-vacio">Ninguna conversación coincide con los filtros</div>'
NO_CONECTA = "No pudimos conectarnos. Revisá tu conexión."
RESPUESTA = "Sí, hasta las 18. ¿Te las preparo?"
MOTIVO = "WhatsApp no pudo entregarlo a ese número."


def filtro_lleno(filtro, busca, limpiar="Limpiar filtros"):
    """La FilterBar con lo que se buscó, el filtro «Sin tomar» elegido (petróleo) y «Limpiar filtros»."""
    f = re.sub(r'<span class="w-bus">(<svg.*?</svg>) [^<]*</span>', lambda m: f'<span class="w-bus ta-lleno">{m.group(1)} {busca}</span>', filtro, count=1, flags=re.S)
    if '<span class="w-pil">Todos ' in f:
        f = f.replace('<span class="w-pil">Todos ', '<span class="w-pil ta-on">Sin tomar ', 1)
    f = f.replace('<div class="filtro">', '<div class="filtro ta-envuelve">', 1)
    return f[:-len("</div>")] + f'<button type="button" class="ta-limpiar">{limpiar}</button></div>'


def hilo_carga():
    return f'<div class="w-hilo"><div class="ta-carga"><b>{NO_CONECTA}</b><button type="button" class="cb cb-sec">Reintentar</button></div></div>'


def mas_mensaje(msjs, html):
    return msjs[:-len("</div>")] + html + "</div>"


def chats_compu():
    t = leer("WA-Chats")
    if ya(t):
        return
    base = bloque(t, "e0")
    bandeja = div_en(base, '<div class="w-bandeja">')
    hilo = div_en(base, '<div class="w-hilo">')
    seg = div_en(bandeja, '<div class="o-seg"')
    filtro = div_en(bandeja, '<div class="filtro">')
    msjs = div_en(hilo, '<div class="w-msjs">')
    seg0 = seg.replace('<span class="c">5</span>', '<span class="c">0</span>').replace('<span class="c">2</span>', '<span class="c">0</span>')
    gris = '<div class="ta-gris"></div>'
    t = sumar_estado(t, "Bandeja vacía", [(bandeja, '<div class="w-bandeja">' + seg0 + filtro + VACIO_CHATS + "</div>"), (hilo, gris),
                                          ("5 conversaciones · 2 sin tomar", "0 conversaciones · 0 sin tomar")], encima="")
    t = sumar_estado(t, "Sin coincidencias", [(bandeja, '<div class="w-bandeja">' + seg + filtro_lleno(filtro, "Pereyra") + NINGUNA_CHATS + "</div>"),
                                              (hilo, gris)], encima="")
    # El ⋮ del chat: solo lleva a la ficha del contacto (en Plataforma no hay ⋮; «Ver la cuenta» es un botón).
    b = boton(hilo, "Acciones de Martina López")
    ficha = ('<div class="ta-menu" role="menu" aria-label="Acciones de Martina López" style="top: 167px; right: 12px; width: 220px;">'
             '<a class="it" role="menuitem" href="WA-Contacto.dc.html">Ver ficha del contacto</a></div>')
    t = sumar_estado(t, "Menú del chat", [(b, prendido(b))], encima=ficha)
    ant = '<div class="ta-ant"><button type="button" class="cb cb-sec ch">Ver mensajes anteriores</button></div>'
    t = sumar_estado(t, "Ver mensajes anteriores", [(msjs, msjs.replace('<div class="w-msjs">', '<div class="w-msjs">' + ant, 1))], encima="")
    cola = f'\n<div class="w-m sal"><span class="gl">{RESPUESTA}</span><span class="pie">En cola · 10:43</span></div>'
    t = sumar_estado(t, "Mensaje en cola", [(msjs, mas_mensaje(msjs, cola))], encima="")
    fallo = f'\n<div class="w-m sal"><span class="gl">{RESPUESTA}</span><span class="pie ta-fallo">No se pudo mandar · {MOTIVO}</span></div>'
    t = sumar_estado(t, "No se pudo mandar", [(msjs, mas_mensaje(msjs, fallo))], encima="")
    t = sumar_estado(t, "La conversación no carga", [(hilo, hilo_carga())], encima="")
    guardar("WA-Chats", t)


def chats_plataforma_compu():
    t = leer("Plat-WA-Chats")
    if ya(t):
        return
    t = estados_compu(t, "Consultas")
    base = bloque(t, "e0")
    bandeja = div_en(base, '<div class="w-bandeja">')
    hilo = div_en(base, '<div class="w-hilo">')
    filtro = div_en(bandeja, '<div class="filtro">')
    gris = '<div class="ta-gris"></div>'
    t = sumar_estado(t, "Bandeja vacía", [(bandeja, '<div class="w-bandeja">' + filtro + VACIO_CHATS + "</div>"), (hilo, gris),
                                          ("4 conversaciones · 2 sin tomar", "0 conversaciones · 0 sin tomar")], encima="")
    t = sumar_estado(t, "Sin coincidencias", [(bandeja, '<div class="w-bandeja">' + filtro_lleno(filtro, "Gómez") + NINGUNA_CHATS + "</div>"),
                                              (hilo, gris)], encima="")
    t = sumar_estado(t, "La conversación no carga", [(hilo, hilo_carga())], encima="")
    guardar("Plat-WA-Chats", t)


def chats_pasar():
    t = leer("WA-Chats-Pasar")
    if not ya(t):
        t = estados_compu(t, "Pasar a")
        t = sumar_estado(t, "Sin nadie a quien pasarlo", encima='<div class="o-menu" role="menu" aria-label="Pasar a"><p class="ta-nadie">No hay a quién pasarlo</p></div>')
        guardar("WA-Chats-Pasar", t)
    t = leer("M-WA-Chats-Pasar")
    if not ya(t):
        t = con_estados_pantalla(t, "Pasar a")
        lst = div_en(bloque(t, "e0"), '<div class="ap-lst"')
        t = sumar_estado_tel(t, "Sin nadie a quien pasarlo", [(lst, '<p class="ta-nadie">No hay a quién pasarlo</p>')])
        guardar("M-WA-Chats-Pasar", t)


def bus_tel(texto):
    return f'<div class="ta-bus" role="search">{LUPA18}<span>{texto}</span></div>'


def buscar_prendido(b):
    return b.replace('aria-label="Buscar">', 'aria-label="Buscar" aria-pressed="true">', 1)


def chats_tel():
    t = leer("M-WA-Chats")
    if not ya(t):
        base = bloque(t, "e0")
        seg = div_en(base, '<div class="ap-seg"')
        cuerpo = div_en(base, '<div class="ap-cuerpo">')
        seg0 = seg.replace('<span class="c">5</span>', '<span class="c">0</span>').replace('<span class="c">2</span>', '<span class="c">0</span>')
        lupa = boton(base, "Buscar")
        t = sumar_estado_tel(t, "Bandeja vacía", [(seg, seg0), (cuerpo, '<div class="ap-cuerpo">' + VACIO_CHATS + "</div>"), ('<span class="b">2</span>', "")])
        t = sumar_estado_tel(t, "Sin coincidencias", [(lupa, buscar_prendido(lupa)), (seg, seg + bus_tel("Pereyra")),
                                                     (cuerpo, '<div class="ap-cuerpo">' + NINGUNA_CHATS + "</div>")])
        guardar("M-WA-Chats", t)

    t = leer("M-Plat-WA-Chats")
    if not ya(t):
        t = con_estados_pantalla(t, "Consultas")
        base = bloque(t, "e0")
        cuerpo = div_en(base, '<div class="ap-cuerpo">')
        barra = div_en(base, '<div class="ap-bar">')
        t = sumar_estado_tel(t, "Bandeja vacía", [(cuerpo, '<div class="ap-cuerpo">' + VACIO_CHATS + "</div>"), ('<span class="b">2</span>', "")])
        t = sumar_estado_tel(t, "Sin coincidencias", [(barra, buscar_prendido(barra) + bus_tel("Gómez")),
                                                     (cuerpo, '<div class="ap-cuerpo">' + NINGUNA_CHATS + "</div>")])
        guardar("M-Plat-WA-Chats", t)

    def no_carga(t, titulo, volver):
        base = bloque(t, "e0")
        cbar = div_en(base, '<div class="ap-cbar">')
        chat = div_en(base, '<div class="ap-chat">')
        escr = div_en(base, '<div class="ap-escr">')
        barra = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{volver}">{VOLVER}</a>'
                 f'<div class="tit"><h1>{titulo}</h1></div></div>')
        centro = (f'<div class="f-centro" role="alert"><span class="f-circ" style="color: oklch(0.55 0.2 25);">{ALERTA28}</span>'
                  '<h1>No pudimos abrir esta pantalla</h1><button type="button" class="cb cb-sec f-btn">Reintentar</button></div>')
        return sumar_estado_tel(t, "La conversación no carga", [(cbar, barra), (chat, centro), (escr, "")])

    t = leer("M-WA-Conversacion")
    if not ya(t):
        base = bloque(t, "e0")
        chat = div_en(base, '<div class="ap-chat">')
        ant = '<div class="ta-ant"><button type="button" class="cb cb-sec ch">Ver mensajes anteriores</button></div>'
        t = sumar_estado_tel(t, "Ver mensajes anteriores", [(chat, chat.replace('<div class="ap-chat">', '<div class="ap-chat">' + ant, 1))])
        cola = f'<div class="ap-m sal"><span class="gl">{RESPUESTA}</span><span class="pie">En cola · 10:43</span></div>'
        t = sumar_estado_tel(t, "Mensaje en cola", [(chat, mas_mensaje(chat, cola))])
        fallo = f'<div class="ap-m sal"><span class="gl">{RESPUESTA}</span><span class="pie ta-fallo">No se pudo mandar · {MOTIVO}</span></div>'
        t = sumar_estado_tel(t, "No se pudo mandar", [(chat, mas_mensaje(chat, fallo))])
        t = no_carga(t, "Chats", "M-WA-Chats.dc.html")
        guardar("M-WA-Conversacion", t)

    t = leer("M-Plat-WA-Conversacion")
    if not ya(t):
        t = no_carga(t, "Consultas", "M-Plat-WA-Chats.dc.html")
        guardar("M-Plat-WA-Conversacion", t)


def mensajes():
    t = leer("WA-Mensajes")
    if not ya(t):
        base = bloque(t, "e0")
        bandeja = div_en(base, '<div class="w-bandeja">')
        hilo = div_en(base, '<div class="w-hilo">')
        filtro = div_en(bandeja, '<div class="filtro">')
        t = sumar_estado(t, "Sin coincidencias", [
            (bandeja, '<div class="w-bandeja">' + filtro_lleno(filtro, "Panadería", "Limpiar")
             + '<div class="ta-vacio">Ninguna organización coincide con la búsqueda</div></div>'),
            (hilo, '<div class="ta-gris"></div>'), ('<p class="res">3 organizaciones</p>', '<p class="res">Ninguna organización</p>')],
            encima="", tras="Vacío")
        guardar("WA-Mensajes", t)
    t = leer("M-WA-Mensajes")
    if not ya(t):
        # Sin conversaciones no hay buscador (la app no dibuja la FilterBar).
        t = en_bloque(t, "e1", [(boton(bloque(t, "e1"), "Buscar"), "")])
        base = bloque(t, "e0")
        barra = div_en(base, '<div class="ap-bar">')
        cuerpo = div_en(base, '<div class="ap-cuerpo">')
        t = sumar_estado_tel(t, "Sin coincidencias", [(barra, buscar_prendido(barra) + bus_tel("Panadería")),
                                                     (cuerpo, '<div class="ap-cuerpo"><div class="ta-vacio">Ninguna organización coincide con la búsqueda</div></div>')])
        guardar("M-WA-Mensajes", t)


# ---------------------------------------------------------------- Números

CENTRAL = "011 15-5555-0100"
SUR = "0351 15-555-0200"
DESC_TXT = '<p class="e11-tx">Sus chats quedan para leer, sin responder. Para volver a atender, conectalo de nuevo.</p>'
DESC_PIE = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Desconectar</button>'
VENCIO = "El alta de Meta venció. Conectá el número de nuevo."
YA_CONECTADO = "Ese número ya está conectado."
PASOS_ORG = ["Volvé a tocar «Conectar número»", "Si vuelve a pasar, escribí a soporte@ejemplo.com"]
PASOS_PLAT = ["Volvé a tocar «Conectar número»", "Si vuelve a pasar, pasale el código al soporte de Meta"]


def conectar_btn(t):
    m = re.search(r'<button type="button" class="cb cb-pri"><svg.*?</svg> Conectar número</button>', t, flags=re.S)
    assert m
    return m.group(0)


def fab(t, etiqueta):
    m = re.search(r'<a class="ap-fab" aria-label="' + etiqueta + r'" href="[^"]*"><svg.*?</svg></a>', t, flags=re.S)
    assert m, etiqueta
    return m.group(0)


def numeros():
    t = leer("WA-Admin")
    if not ya(t):
        # Desconectado: sin ⋮ y sin contarlo en la banda (la banda solo cuenta los que no tienen medio de pago).
        e4 = bloque(t, "e4")
        t = en_bloque(t, "e4", [("2 números · 1 desconectado", "2 números"), (boton(e4, f"Acciones de {SUR}"), "")])
        base = bloque(t, "e0")
        b1 = boton(base, f"Acciones de {CENTRAL}")
        t = sumar_estado(t, "Menú de un número conectado", [(b1, prendido(b1))],
                         encima=menu(f"Acciones de {CENTRAL}", (["Cambiar a quién atiende"], ["Desconectar"]), "top: 227px; right: 40px;"))
        t = sumar_estado(t, "Desconectar un número conectado", encima=confirmar(f"¿Desconectar {CENTRAL}?", DESC_TXT, DESC_PIE))
        t = sumar_estado(t, "Comprobar · todavía falta", encima=toast("Todavía falta el medio de pago", "neu"))
        estado_sur = re.search(r'<span><span class="w-est mal">Falta medio de pago</span><a class="o-i".*?</a></span>', base, flags=re.S).group(0)
        t = sumar_estado(t, "Comprobar · ya tiene", [(estado_sur, '<span><span class="w-est ">Conectado</span></span>'),
                                                     ("2 números · 1 sin medio de pago", "2 números")], encima=toast("El número ya tiene medio de pago"))
        t = sumar_estado(t, "Sin alta de Meta", [(conectar_btn(base), "")], encima="")
        guardar("WA-Admin", t)

    t = leer("M-WA-Admin")
    if not ya(t):
        e4 = bloque(t, "e4")
        t = en_bloque(t, "e4", [(boton(e4, f"Acciones de {SUR}"), "")])
        base = bloque(t, "e0")
        t = sumar_estado_tel(t, "Menú de un número conectado", al_final=acciones_tel(CENTRAL, ["Cambiar a quién atiende"], ["Desconectar"]))
        t = sumar_estado_tel(t, "Desconectar un número conectado", al_final=confirmar_tel(f"¿Desconectar {CENTRAL}?", DESC_TXT, DESC_PIE))
        t = sumar_estado_tel(t, "Comprobar · todavía falta", al_final=snack("Todavía falta el medio de pago", "neu"))
        estado_sur = re.search(r'<span class="w-est mal">Falta medio de pago</span><button type="button" class="ap-i".*?</button>', base, flags=re.S).group(0)
        t = sumar_estado_tel(t, "Comprobar · ya tiene", [(estado_sur, '<span class="w-est ">Conectado</span>')], al_final=snack("El número ya tiene medio de pago"))
        t = sumar_estado_tel(t, "Sin alta de Meta", [(fab(base, "Conectar número"), "")])
        guardar("M-WA-Admin", t)

    t = leer("WA-Admin-Vacio")
    if not ya(t):
        t = estados_compu(t, "Sin números")
        t = sumar_estado(t, "Sin alta de Meta", [(conectar_btn(bloque(t, "e0")), "")], encima="")
        guardar("WA-Admin-Vacio", t)
    t = leer("M-WA-Admin-Vacio")
    if not ya(t):
        t = con_estados_pantalla(t, "Sin números")
        t = sumar_estado_tel(t, "Sin alta de Meta", [(fab(bloque(t, "e0"), "Conectar número"), "")])
        guardar("M-WA-Admin-Vacio", t)


def conectando(t, cont_var=None):
    """«Conectar número» de la banda pasa a «Conectando…» mientras se manda el código (solo en la compu)."""
    btn = conectar_btn(t)
    espera = '<button type="button" class="cb cb-pri" aria-disabled="true" style="opacity: 0.85;"><span class="ta-girar" aria-hidden="true"></span> Conectando…</button>'
    t = rep(t, btn, '<sc-if value="{{noConectando}}" hint-placeholder-val="{{si}}">' + btn + '</sc-if>'
            '<sc-if value="{{conectando}}" hint-placeholder-val="{{no}}">' + espera + "</sc-if>")
    return rep(t, "\n      si: true,\n      no: false,\n", "\n      si: true,\n      no: false,\n      conectando: e === \"Conectando…\",\n"
               "      noConectando: e !== \"Conectando…\",\n")


def alta():
    pill = ('<div class="mw-velo"></div><div class="mw-pill" role="status">Ventana de Meta abierta<span class="cb cb-sec">Volver a la ventana</span>'
            '<span class="cb cb-sec">Cancelar</span></div>')
    t = leer("WA-Alta")
    if not ya(t):
        t = conectando(t)
        t = sumar_encima(t, "Ventana de Meta abierta", pill, tras="Atiende a · elegir")
        t = sumar_encima(t, "Conectando…", "", tras="Ventana de Meta abierta")
        t = sumar_encima(t, "El alta de Meta venció", aviso("No se pudo conectar el número", VENCIO, "", PASOS_ORG))
        t = sumar_encima(t, "Ese número ya está conectado", toast(YA_CONECTADO, "mal"))
        guardar("WA-Alta", t)
    t = leer("M-WA-Alta")
    if not ya(t):
        t = sumar_encima(t, "El alta de Meta venció", aviso_tel("No se pudo conectar el número", VENCIO, "", PASOS_ORG))
        t = sumar_encima(t, "Ese número ya está conectado", snack(YA_CONECTADO, "mal"))
        guardar("M-WA-Alta", t)
    t = leer("Plat-WA-Alta")
    if not ya(t):
        t = conectando(t)
        t = sumar_encima(t, "Conectando…", "", pref="f", tras="Ventana de Meta abierta")
        t = sumar_encima(t, "El alta de Meta venció", aviso("No se pudo conectar el número", VENCIO, "", PASOS_PLAT), pref="f")
        t = sumar_encima(t, "Ese número ya está conectado", toast(YA_CONECTADO, "mal"), pref="f")
        guardar("Plat-WA-Alta", t)
    t = leer("M-Plat-WA-Alta")
    if not ya(t):
        t = sumar_encima(t, "El alta de Meta venció", aviso_tel("No se pudo conectar el número", VENCIO, "", PASOS_PLAT), pref="f")
        t = sumar_encima(t, "Ese número ya está conectado", snack(YA_CONECTADO, "mal"), pref="f")
        guardar("M-Plat-WA-Alta", t)


PLAT = "011 15-4000-1000"
TOPE_PLAT = '1.240 · <span class="e11-cobra">240 se cobran</span> este mes'


def numero_plataforma():
    t = leer("Plat-WA-Numero")
    if not ya(t):
        e1 = bloque(t, "e1")
        b = boton(e1, f"Acciones de {PLAT}")
        t = sumar_estado(t, "Menú del número", [(b, prendido(b))], base="e1", tras="Falta medio de pago",
                         encima=menu(f"Acciones de {PLAT}", (["Comprobar medio de pago", "Conectar otro número"], []), "top: 226px; right: 40px;"))
        t = sumar_estado(t, "Consultas pasado el tope", [("580 de 1.000 gratis este mes", TOPE_PLAT)], tras="Consultas apagadas", encima="")
        t = sumar_estado(t, "Sin número · sin alta de Meta", [(conectar_btn(bloque(t, "e2")), "")], base="e2", encima="")
        guardar("Plat-WA-Numero", t)
    t = leer("M-Plat-WA-Numero")
    if not ya(t):
        e1 = bloque(t, "e1")
        velo = e1.index('<div class="ap-velo"></div>')
        aviso_e1 = e1[velo:cierre_div(e1, e1.index('<div class="ap-hoja"', velo))]
        t = sumar_estado_tel(t, "Menú del número", [(aviso_e1, acciones_tel(PLAT, ["Comprobar medio de pago", "Conectar otro número"]))],
                             base="e1", tras="Falta medio de pago")
        t = sumar_estado_tel(t, "Consultas pasado el tope", [("580 de 1.000 gratis este mes", TOPE_PLAT)], tras="Consultas apagadas")
        t = sumar_estado_tel(t, "Sin número · sin alta de Meta", [(fab(bloque(t, "e2"), "Conectar número"), "")], base="e2")
        guardar("M-Plat-WA-Numero", t)


# ---------------------------------------------------------------- Bot

def ponerle_errores_dias(x, tel):
    """«Fuera de horario» con los dos errores de cada día: falta una hora y la de cierre antes que la de apertura."""
    if tel:
        lun = '<span>Lunes</span>' + HS_TEL
        mar = '<span>Martes</span>' + HS_TEL
        x = rep(x, lun, '<span>Lunes</span><span class="hs ta-hs"><span class="h">09:00</span>a<span class="h ta-mal"></span></span>'
                '<span class="ta-err-dia" role="alert">Completá las dos horas.</span>')
        return rep(x, mar, '<span>Martes</span><span class="hs ta-hs"><span class="h">18:00</span>a<span class="h ta-mal">09:00</span></span>'
                   '<span class="ta-err-dia" role="alert">La hora de cierre tiene que ser después de la de apertura.</span>')
    horas = '<span class="h">09:00</span><span class="a">a</span><span class="h">18:00</span>'
    x = rep(x, '<span>Lunes</span>' + horas, '<span>Lunes</span><span class="h">09:00</span><span class="a">a</span><span class="h ta-mal"></span>'
            '<span class="ta-err-dia" role="alert">Completá las dos horas.</span>')
    return rep(x, '<span>Martes</span>' + horas, '<span>Martes</span><span class="h">18:00</span><span class="a">a</span><span class="h ta-mal">09:00</span>'
               '<span class="ta-err-dia" role="alert">La hora de cierre tiene que ser después de la de apertura.</span>')


def bot():
    t = leer("WA-Respuestas")
    if not ya(t):
        # Con 10 opciones «Agregar opción» no se apaga: abre el aviso (la app y la galería).
        t = t.replace('<button type="button" class="cb cb-sec ch e11-apag" aria-disabled="true">', '<button type="button" class="cb cb-sec ch">')
        base = bloque(t, "e0")
        b = boton(base, "Acciones de Horarios y dirección")
        t = sumar_estado(t, "Menú de una opción", [(b, prendido(b))], encima=menu("Acciones de Horarios y dirección", (["Editar"], ["Quitar"]),
                                                                                 "top: 652px; right: 40px; width: 220px;"), tras="Configuración")
        caja = div_en(base, '<div class="w-caja"><div class="w-cab"><span>Menú</span>')
        cab = div_en(caja, '<div class="w-cab">')
        t = sumar_estado(t, "Menú vacío", [(caja, '<div class="w-caja">' + cab + '<p class="ta-sin">Todavía no hay opciones en el menú.</p></div>'),
                                           ('<p class="res">4 opciones en el menú</p>', '<p class="res">0 opciones en el menú</p>')],
                         encima="", tras="Menú de una opción")
        # «Mensajes de empleados» está al final de la página: se ve como si se hubiera bajado.
        abajo = [("Pasan a Carga de pedidos, sin menú", "Pasan a Internos, sin menú"),
                 ('<div class="w-body" style="overflow: auto;">', '<div class="w-body" style="overflow: auto; justify-content: flex-end;">')]
        t = sumar_estado(t, "Empleados sin equipo", abajo, encima="")
        t = sumar_estado(t, "Mensajes de empleados", abajo, encima=dlg("Mensajes de empleados", campo("Equipo", "Sin equipo", req=False),
                                                                       PIE_GUARDAR))
        t = sumar_estado(t, "Fuera de horario · errores", encima=ponerle_errores_dias(interior(t, "e2"), False), tras="Editar fuera de horario")
        guardar("WA-Respuestas", t)

    t = leer("M-WA-Respuestas")
    if not ya(t):
        t = t.replace('<a href="#" class="e11-apag" aria-disabled="true">Agregar opción</a>', '<a href="#">Agregar opción</a>')
        base = bloque(t, "e0")
        i = base.index('<span class="ap-gtit">Menú<a href="#">Agregar opción</a></span>')
        grupo = div_en(base[i:], '<div class="ap-grupo">')
        t = sumar_estado_tel(t, "Menú vacío", [(grupo, '<div class="ap-grupo"><p class="ta-sin">Todavía no hay opciones en el menú.</p></div>')],
                             tras="Configuración")
        abajo = [("Pasan a Carga de pedidos, sin menú", "Pasan a Internos, sin menú"), ('<div class="ap-cuerpo ap-gris">', '<div class="ap-cuerpo ap-gris" style="justify-content: flex-end;">')]
        t = sumar_estado_tel(t, "Empleados sin equipo", abajo)
        t = sumar_estado_tel(t, "Mensajes de empleados", abajo, al_final=hoja("Mensajes de empleados", campo_tel("Equipo", "Sin equipo", req=False), PIE_GUARDAR))
        e2 = bloque(t, "e2")
        t = sumar_estado_tel(t, "Fuera de horario · errores", [(e2[e2.index('<div class="ap-hoja"'):-len("</sc-if>")],
                                                               ponerle_errores_dias(e2[e2.index('<div class="ap-hoja"'):-len("</sc-if>")], True))],
                             base="e2", tras="Editar fuera de horario")
        guardar("M-WA-Respuestas", t)

    sin_equipos = '<span class="ta-ph">Todavía no hay equipos</span>'
    t = leer("WA-Admin-Editar")
    if not ya(t):
        t = estados_compu(t, "Editar opción")
        dialogo = interior(t, "e0")
        ct = re.search(r'<div class="ct">Ventas (<svg.*?</svg>)</div>', dialogo, flags=re.S)
        nuevo = (dialogo.replace('aria-label="Editar opción"', 'aria-label="Agregar opción"').replace("<span>Editar opción 1</span>", "<span>Agregar opción</span>")
                 .replace('<div class="ct">Hacer un pedido</div>', '<div class="ct">Pedir presupuesto</div>'))
        con_error = nuevo.replace(ct.group(0), f'<div class="ct mal">{sin_equipos} {ct.group(1)}</div><span class="err2" role="alert">Completá este dato.</span>')
        t = sumar_estado(t, "Sin equipos", encima=con_error)
        i = nuevo.index('<div class="w-cmp"><span class="rt">Equipo')
        cmp = nuevo[i:cierre_div(nuevo, i)]
        abierto = (cmp.replace('<div class="w-cmp">', '<div class="w-cmp ta-abre">', 1).replace(ct.group(0), f'<div class="ct">{sin_equipos} {ct.group(1)}</div>')
                   [:-len("</div>")] + '<div class="ta-ops" role="listbox" aria-label="Equipo"><p>Ninguna opción coincide.</p></div></div>')
        t = sumar_estado(t, "Sin equipos · elegir", encima=nuevo.replace(cmp, abierto))
        guardar("WA-Admin-Editar", t)

    t = leer("M-WA-Editar")
    if not ya(t):
        # En el teléfono, la opción que se edita (no la del sistema) se quita desde su hoja (decisión del coordinador).
        pie = '<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button></div>'
        t = rep(t, pie, '<div class="hp ta-wrap"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>'
                '<button type="button" class="cb cb-pel ta-full">Quitar opción</button></div>')
        t = con_estados_pantalla(t, "Editar opción")
        h = div_en(bloque(t, "e0"), '<div class="ap-hoja"')
        ct = re.search(r'<div class="ct">Ventas(<svg.*?</svg>)</div>', h, flags=re.S)
        nueva = (h.replace('aria-label="Editar opción 1"', 'aria-label="Agregar opción"').replace("<h2>Editar opción 1</h2>", "<h2>Agregar opción</h2>")
                 .replace('<div class="ct">Hacer un pedido</div>', '<div class="ct">Pedir presupuesto</div>')
                 .replace('<div class="hp ta-wrap">', '<div class="hp">').replace('<button type="button" class="cb cb-pel ta-full">Quitar opción</button>', ""))
        con_error = nueva.replace(ct.group(0), f'<div class="ct mal">{sin_equipos}{ct.group(1)}</div><p class="ap-err" role="alert">Completá este dato.</p>')
        t = sumar_estado_tel(t, "Sin equipos", [(h, con_error)])
        lista = hoja("Equipo", '<p class="ta-nadie">Ninguna opción coincide.</p>', "")
        t = sumar_estado_tel(t, "Sin equipos · elegir", [('<div class="ap-velo"></div>' + h, lista)])
        guardar("M-WA-Editar", t)


# ---------------------------------------------------------------- Equipos

def dlg_equipo(nombre, personas, aviso_txt, plataforma=False, errores=False):
    """«Editar equipo» (TeamDialog): Nombre y Bandeja (solo lectura) arriba; Personas u Operadores y el aviso a lo ancho."""
    rot = "Operadores" if plataforma else "Personas"
    if errores:
        cn = ct_mal("Nombre", "", "Escribí el nombre del equipo.", ancho=plataforma, select=False)
        cp = ct_mal(rot, "Sin operadores" if plataforma else "Sin personas", "Elegí al menos un operador." if plataforma else "Elegí al menos una persona.")
    else:
        cn = campo("Nombre", nombre, select=False, ancho=plataforma)
        cp = campo(rot, personas)
    bandeja = "" if plataforma else '<div class="w-cmp"><span class="rt">Bandeja</span><span class="ta-solo">Clientes</span></div>'
    cuerpo = cn + bandeja + cp + campo("Aviso por correo si nadie lo toma", aviso_txt, req=False)
    return dlg("Editar equipo", cuerpo, PIE_CAMBIOS, chico=False, una=False)


def hoja_equipo(nombre, personas, aviso_txt, plataforma=False, errores=False):
    rot = "Operadores" if plataforma else "Personas"
    if errores:
        cn = ct_mal("Nombre", "", "Escribí el nombre del equipo.", select=False, tel=True)
        cp = ct_mal(rot, "Sin operadores" if plataforma else "Sin personas", "Elegí al menos un operador." if plataforma else "Elegí al menos una persona.", tel=True)
    else:
        cn = campo_tel("Nombre", nombre, select=False)
        cp = campo_tel(rot, personas)
    bandeja = "" if plataforma else '<div class="ap-cmp"><span class="rt"><span>Bandeja</span></span><span class="ta-solo">Clientes</span></div>'
    return hoja("Editar equipo", cn + bandeja + cp + campo_tel("Aviso por correo si nadie lo toma", aviso_txt, req=False), PIE_CAMBIOS)


BORRAR_PIE = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Borrar</button>'


def equipos():
    t = leer("WA-Equipos")
    if not ya(t):
        t = estados_compu(t, "Lista")
        base = bloque(t, "e0")
        b = boton(base, "Acciones de Ventas")
        t = sumar_estado(t, "Menú del equipo", [(b, prendido(b))], encima=menu("Acciones de Ventas", (["Editar"], ["Borrar"]), "top: 225px; right: 40px; width: 220px;"))
        t = sumar_estado(t, "Editar equipo", encima=dlg_equipo("Ventas", "Lucía Fernández, Carolina Vega", "A los 10 minutos"))
        t = sumar_estado(t, "Editar equipo · errores", encima=dlg_equipo("", "", "A los 10 minutos", errores=True))
        t = sumar_estado(t, "Borrar equipo", encima=confirmar("¿Borrar «Ventas»?", "", BORRAR_PIE))
        t = sumar_estado(t, "Equipo sin aviso", [("<span>A los 30 minutos</span>", "<span>Sin aviso</span>")], encima="")
        caja = div_en(base, '<div class="w-caja">')
        th = div_en(caja, '<div class="w-th e">')
        t = sumar_estado(t, "Sin equipos", [(caja, '<div class="w-caja">' + th + '<div class="vacio"><strong>Todavía no hay equipos</strong></div></div>'),
                                            ('<p class="res">4 equipos</p>', '<p class="res">0 equipos</p>')], encima="")
        guardar("WA-Equipos", t)

    t = leer("M-WA-Equipos")
    if not ya(t):
        t = con_estados_pantalla(t, "Lista")
        base = bloque(t, "e0")
        t = sumar_estado_tel(t, "Acciones del equipo", al_final=acciones_tel("Ventas", ["Editar"], ["Borrar"]))
        t = sumar_estado_tel(t, "Editar equipo", al_final=hoja_equipo("Ventas", "Lucía Fernández, Carolina Vega", "A los 10 minutos"))
        t = sumar_estado_tel(t, "Editar equipo · errores", al_final=hoja_equipo("", "", "A los 10 minutos", errores=True))
        t = sumar_estado_tel(t, "Borrar equipo", al_final=confirmar_tel("¿Borrar «Ventas»?", "", BORRAR_PIE))
        t = sumar_estado_tel(t, "Equipo sin aviso", [("<span>Aviso a los 30 min</span>", "<span>Sin aviso</span>")])
        cuerpo = div_en(base, '<div class="ap-cuerpo">')
        t = sumar_estado_tel(t, "Sin equipos", [(cuerpo, '<div class="ap-cuerpo"><div class="ta-vacio marco">Todavía no hay equipos</div></div>')])
        guardar("M-WA-Equipos", t)

    t = leer("Plat-WA-Equipos")
    if not ya(t):
        # La lista es común a los estados: el diálogo es lo que se abre encima.
        t = sumar_encima(t, "Editar equipo · errores", dlg_equipo("", "", "A los 10 minutos", plataforma=True, errores=True))
        guardar("Plat-WA-Equipos", t)
    t = leer("M-Plat-WA-Equipos")
    if not ya(t):
        t = sumar_estado_tel(t, "Editar equipo · errores", al_final=hoja_equipo("", "", "A los 10 minutos", plataforma=True, errores=True))
        guardar("M-Plat-WA-Equipos", t)


def como_la_app():
    """Dos diferencias con la app que quedaban (revisión del 14/10): sin ⋮ junto a los interruptores de «Además» del bot, y el menú
    viejo del número en el teléfono pasa a hoja, como en la app. Se puede volver a correr."""
    t = leer("WA-Respuestas")
    nuevo = re.sub(r'<button type="button" class="ib" aria-label="Acciones de (?:Preguntar por promociones|Ofrecer vincular su cuenta)">.*?</button>', "", t, flags=re.S)
    if nuevo != t:
        escribir("WA-Respuestas", nuevo)
    t = leer("M-WA-Admin")
    viejo = re.search(r'<div class="ap-menu" role="menu" style="top: 196px;">.*?</div>', t, re.S)
    if viejo:
        items = ('<span role="menuitem">Cambiar a quién atiende</span><span role="menuitem">Comprobar medio de pago</span>'
                 '<span class="sep" role="separator"></span><span class="pel" role="menuitem">Desconectar</span>')
        hoja_num = ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de 0351 15-555-0200"><span class="asa"></span>'
                    '<div class="hc" style="padding-right: 20px;"><h2>0351 15-555-0200</h2></div><div class="hb" style="padding-bottom: 34px;">'
                    f'<div class="ap-acciones">{items}</div></div></div>')
        escribir("M-WA-Admin", t.replace(viejo.group(0), hoja_num))


if __name__ == "__main__":
    formatos()
    chats_compu()
    chats_plataforma_compu()
    chats_pasar()
    chats_tel()
    mensajes()
    numeros()
    alta()
    numero_plataforma()
    bot()
    equipos()
    como_la_app()
