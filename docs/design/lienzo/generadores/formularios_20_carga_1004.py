"""La etapa 20, cargar una respuesta desde la web (20-cargar-desde-la-web.md del back). Sigue el front real de ArquitecturaBaseFront: `FormEntryPage`, `FormEntryPanel`,
`EntryCatalogField` y `formEntries.json`, con nuestras piezas y colores (108 y 126): la banda con Cancelar y Enviar, las zonas plegables, la grilla de hasta tres por renglón,
la lista de catálogo con su total y «Mostrar 50 más», «Enviada» y el panel al costado. Lo que allá todavía no existe sale de la spec: «Enviando…» con su barra sin palabras (95 y 115),
lo condicional y las líneas, lo propio, las listas dependientes y publicar solo para la app. La lista «Formularios» de la etapa sale de `formularios_lista_y_ficha_1004.py`.
Muestran solo lo que existe hasta la 20 (78): sin estado, aprobación, PDF, corregir ni anular.

Corre después de `formularios_19_logica_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_15_respuestas_1004 as R  # noqa: E402
import formularios_16_personas_1004 as H  # noqa: E402
import formularios_19_logica_1004 as X  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = F.PROJ
CHEV, MAS, TACHO, TILDE, BUSCAR, CERRAR = F.CHEV, A.MAS, M.IC["borrar"], A.TILDE, F.BUSCAR, F.X
FORM, VERSION = X.FORM, "versión 4"
SUB = f"{FORM} · {VERSION}"
NUM, HORA = "PED-000046", "15/10/2026 12:32"
ENVIAR = "Enviar"
AY_FOTOS = "JPG o PNG, hasta 25 MB cada una."
PROVEEDORES = [("Aceros Rosario", "CUIT 30-70988123-4"), ("Bulonera del Centro", "CUIT 30-71244551-8"), ("Caños del Litoral", "CUIT 30-70551882-3"), ("Distribuidora Centro", "CUIT 30-71009127-9")]
# 5 × 4.200 + 20 × 850 = 38.000, más los 30.000 de «Monto»
RENGLONES = [("Caño de 1/2 pulgada", "$ 4.200,00", "5"), ("Codo de 90°", "$ 850,00", "20")]
TOTAL = "$ 68.000,00"
LLENO = {"Cliente": "Ferretería Sur", "Venta": "Sí", "Motivo": "Venta nueva", "Monto": "30.000,00", "Zona": "Centro", "Fecha": "22/10/2026", "Proveedor": "Aceros Rosario", "Productos": RENGLONES,
         "Observaciones": "Retira el cliente.", "Fotos": 2}
OBLIGA = "Completá esta respuesta."
ELIGE = "Elegí una opción."

CSS_20 = """.cg-z { overflow: visible !important; }
.cg-z .f-cab { border-radius: 12px 12px 0 0; }
.cg-z.pl .f-cab { border-bottom: 0; border-radius: 12px; }
.cg-z .f-cab .ib { color: var(--t2); }
.cg-z:not(.pl) .f-cab .ib svg { transform: rotate(180deg); }
.cg-fila { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 12px 16px; border-top: 1px solid var(--borde); align-items: start; }
.f-cab + .cg-fila { border-top: 0; }
.cg-q { position: relative; min-width: 0; }
.cg-q.s2 { grid-column: span 2; }
.cg-q.s3 { grid-column: 1 / -1; }
.cg-q .ct.ang { max-width: 168px; }
.cg-q .ct.des, .cg-rd.des, .ab-seg.des { opacity: 0.6; }
.cg-q .ab-seg { align-self: flex-start; }
.cg-q .ab-seg > span { padding: 8px 18px; }
.cg-q .e-tipw { display: flex; width: 100%; }
.cg-q .e-tipw .ct { flex: 1; }
.cg-q .e-tip { left: 0; right: auto; top: calc(100% + 6px); }
.cg-q .e-tip::before { left: 18px; right: auto; }
.cg-rd { display: flex; flex-wrap: wrap; gap: 8px 18px; min-height: 36px; align-items: center; font-size: 14px; color: var(--t1); }
.cg-rd span { display: inline-flex; align-items: center; gap: 7px; }
.cg-rd i { width: 16px; height: 16px; box-sizing: border-box; border: 1.5px solid var(--borde2); border-radius: 50%; background: #fff; }
.cg-rd span.on i { border: 5px solid var(--marca); }
.cg-cat { display: flex !important; align-items: center; gap: 8px; }
.cg-cat.vac { color: var(--t3); }
.cg-cat .v { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cg-cat .q { display: inline-flex; color: var(--t3); }
.cg-cat .q svg { width: 14px; height: 14px; }
.cg-cat .x { display: inline-flex; color: var(--t2); }
.cg-cat.foco { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.5 0.08 180 / 0.16); }
.cg-cat.mal { border-color: var(--peligro); }
.cg-area { height: auto !important; min-height: 72px; white-space: normal !important; line-height: 1.45; padding-top: 8px; }
.cg-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.cg-cnt { font-size: 12.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
.cg-hasta { font-size: 12.5px; font-weight: 400; color: var(--t3); }
.cg-ay { font-size: 12.5px; color: var(--t3); }
.cg-lista { position: absolute; z-index: 30; left: 0; right: 0; top: 62px; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--borde2); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); overflow: hidden; }
.cg-lista .c { padding: 8px 12px; font-size: 12.5px; color: var(--t3); }
.cg-lista .o { display: flex; flex-direction: column; gap: 1px; padding: 7px 12px; font-size: 14px; color: var(--t1); }
.cg-lista .o small { font-size: 12.5px; color: var(--t3); }
.cg-lista .o.on { background: var(--s2); }
.cg-lista .o.ch { flex-direction: row; align-items: center; gap: 10px; }
.cg-lista .o.ch .bx { width: 16px; height: 16px; box-sizing: border-box; border-radius: 4px; border: 1.5px solid var(--borde2); background: #fff; color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.cg-lista .o.ch .bx.on { background: var(--marca); border-color: var(--marca); }
.cg-lista .o.ch .bx svg { width: 12px; height: 12px; }
.cg-lista .o.ch .tx { display: flex; flex-direction: column; gap: 1px; }
.cg-lista .p { display: flex; justify-content: flex-end; padding: 4px 8px; border-top: 1px solid var(--borde); }
.cg-lista .m { padding: 16px 12px; font-size: 13.5px; color: var(--t2); }
.cg-lin { border: 1px solid var(--borde); border-radius: 8px; overflow: hidden; background: #fff; }
.cg-linh, .cg-linr { display: grid; grid-template-columns: minmax(0, 1fr) 150px 36px; gap: 8px; align-items: center; padding: 6px 8px; }
.cg-linh { background: oklch(0.945 0.018 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.cg-linr { border-top: 1px solid var(--borde); }
.cg-linr .ct { height: 34px; display: flex; align-items: center; box-sizing: border-box; padding: 0 10px; }
.cg-lpie { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.cg-drop { display: flex; align-items: center; gap: 10px; min-height: 64px; padding: 12px 14px; border: 1.5px dashed var(--borde2); border-radius: 10px; font-size: 13.5px; color: var(--t2); background: #fff; }
.cg-fotos { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
.cg-fot { position: relative; display: flex; flex-direction: column; gap: 4px; width: 92px; font-size: 12px; color: var(--t2); }
.cg-fot .im { width: 92px; height: 92px; border-radius: 8px; background: linear-gradient(135deg, oklch(0.84 0.03 170), oklch(0.66 0.05 170)); }
.cg-fot .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cg-fot .x { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--borde); background: #fff; color: var(--peligro); display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.cg-fot .x svg { width: 12px; height: 12px; }
.cg-fot .x[disabled], .cg-mas[disabled] { opacity: 0.5; cursor: default; }
.cg-min { display: inline-block; width: 44px; height: 44px; margin-right: 6px; border-radius: 6px; background: linear-gradient(135deg, oklch(0.84 0.03 170), oklch(0.66 0.05 170)); vertical-align: top; }
.cg-mas { width: 92px; height: 92px; box-sizing: border-box; border: 1.5px dashed var(--borde2); border-radius: 8px; background: #fff; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font: inherit; font-size: 13px; font-weight: 600; color: var(--t2); padding: 0; }
.cg-barra { height: 4px; border-radius: 2px; background: var(--s3); overflow: hidden; flex-shrink: 0; }
.cg-barra i { display: block; height: 100%; background: var(--marca); border-radius: 2px; }
.cg-env { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--borde); font-size: 14px; font-weight: 600; color: var(--t1); }
.cg-env .ck { display: inline-flex; color: var(--marca); }
.cg-z .g-det { margin: 12px 16px 16px; }
.cg-z .f-cab .der { display: flex; gap: 8px; }
.cg-ban { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; border: 1px solid oklch(0.85 0.08 85); background: oklch(0.97 0.04 85); font-size: 14px; color: oklch(0.36 0.08 70); }
.cg-ban svg { flex: none; }
.cg-ban .tx { flex: 1; min-width: 0; }
.cg-ban.mal { border-color: oklch(0.85 0.08 25); background: var(--peligro-t); color: oklch(0.42 0.14 25); }
.d2.cg-panel { display: flex; flex-direction: column; }
.cg-panel .d2-h b { font-size: 16px; font-weight: 600; }
.cg-panel .d2-h a { font-size: 13px; font-weight: 600; color: var(--marca-tx); text-decoration: none; white-space: nowrap; }
.cg-panel .d2-b { padding: 0; }
.cg-panel .cg-fila { grid-template-columns: minmax(0, 1fr); padding: 10px 20px; }
.cg-panel .cg-fila:first-child { border-top: 0; }
.cg-panel .cg-q.s2, .cg-panel .cg-q.s3 { grid-column: auto; }
.cg-panel .cg-ztit { padding: 10px 20px; font-size: 13px; font-weight: 600; color: var(--t2); background: oklch(0.945 0.018 76); }
.cg-ppie { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); flex-shrink: 0; }
.cg-ppie .q-chk { flex: 1; min-width: 0; display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; }
.cg-ppie .q-chk i { width: 16px; height: 16px; flex: none; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.cg-ppie .q-chk i.no { background: #fff; border: 1.5px solid var(--borde2); box-sizing: border-box; }
.cg-ppie .q-chk i svg { width: 12px; height: 12px; }
.w-app:has(.cg-panel) .f-toast { right: 584px; }
.pl-caja .w-tr.pl.nueva { background: var(--marca-t); }
"""
CSS_T20 = """.cg-tz { margin: 12px 16px 0; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; flex-shrink: 0; }
.cg-tz:last-child { margin-bottom: 16px; }
.cg-tz .h { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; padding: 0 14px; border: 0; background: oklch(0.945 0.018 76); font: inherit; font-size: 15px; font-weight: 600; color: var(--t1); }
.cg-tz .h .fl { margin-left: auto; display: inline-flex; color: var(--t2); }
.cg-tz .h .fl.ab { transform: rotate(180deg); }
.cg-tb { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
.cg-tb .ap-cmp { margin: 0; }
.cg-tc { display: flex; flex-direction: column; gap: 6px; font-size: 14.5px; }
.cg-tc .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.cg-tc .rq { color: var(--peligro); }
.cg-tseg { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--borde2); border-radius: 12px; overflow: hidden; background: #fff; }
.cg-tseg span { height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 15.5px; color: var(--t1); }
.cg-tseg span + span { border-left: 1px solid var(--borde2); }
.cg-tseg span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.cg-trd { display: flex; flex-direction: column; gap: 2px; }
.cg-trd span { display: inline-flex; align-items: center; gap: 10px; min-height: 40px; font-size: 15.5px; }
.cg-trd i { width: 20px; height: 20px; box-sizing: border-box; border: 1.5px solid var(--borde2); border-radius: 50%; background: #fff; }
.cg-trd span.on i { border: 6px solid var(--marca); }
.cg-terr { font-size: 13.5px; color: var(--peligro); }
.cg-tlin { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--borde); border-radius: 12px; }
.cg-tlin .t { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.cg-tbus { display: flex; align-items: center; gap: 10px; margin: 12px 16px 6px; padding: 0 14px; height: 48px; border: 1.5px solid var(--marca); border-radius: 12px; background: #fff; font-size: 16px; color: var(--t3); }
.cg-tcnt { margin: 0 16px 8px; font-size: 13.5px; color: var(--t3); }
.cg-tmas { display: flex; justify-content: center; padding: 14px; }
.cg-tfot { display: flex; flex-wrap: wrap; gap: 10px; }
.cg-tfot .im { position: relative; width: 104px; height: 104px; border-radius: 10px; background: linear-gradient(135deg, oklch(0.84 0.03 170), oklch(0.66 0.05 170)); }
.cg-tacc { display: flex; flex-direction: column; gap: 8px; }
.cg-tacc .cb { height: 46px; font-size: 15.5px; border-radius: 12px; justify-content: center; }
.cg-tbarra { height: 4px; background: var(--s3); flex-shrink: 0; }
.cg-tbarra i { display: block; height: 100%; background: var(--marca); }
.cg-tban { display: flex; flex-direction: column; gap: 10px; margin: 12px 16px 0; padding: 12px 14px; border-radius: 12px; border: 1px solid oklch(0.85 0.08 85); background: oklch(0.97 0.04 85); font-size: 15px; line-height: 1.4; color: oklch(0.36 0.08 70); flex-shrink: 0; }
.cg-tban.mal { border-color: oklch(0.85 0.08 25); background: var(--peligro-t); color: oklch(0.42 0.14 25); }
.cg-tenv { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--borde); font-size: 15px; font-weight: 600; }
.cg-tenv .ck { display: inline-flex; color: var(--marca); }
.ap-fijo.dos { flex-direction: column; align-items: stretch; gap: 8px; }
.ap-fijo.dos .cb.full { flex: none; }
.ap-fila .l3 { font-size: 13px; color: var(--t3); }
"""


def enlaces(t):
    for a, b in [("FRM-Respuesta.dc.html", "FRM-Respuesta-20.dc.html"), ("FRM-Respuesta-Completa.dc.html", "FRM-Respuesta-20.dc.html"), ("FRM-Respuestas-Filtros.dc.html", "FRM-Respuestas-20.dc.html"),
                 ("FRM-Respuestas.dc.html", "FRM-Respuestas-20.dc.html"), ("FRM-Tablero.dc.html", "FRM-Tablero-19.dc.html"), ("FRM-Editor.dc.html", "FRM-Editor-Listas.dc.html"), ("FRM-Publicar.dc.html", "FRM-Publicar-20.dc.html"),
                 ("FRM-Publicando.dc.html", "FRM-Publicar-20.dc.html"), ("FRM-Formularios.dc.html", "FRM-Formularios-20.dc.html"),
                 ("M-FRM-Respuesta.dc.html", "M-FRM-Respuesta-20.dc.html"), ("M-FRM-Respuestas.dc.html", "M-FRM-Respuestas-20.dc.html"), ("M-FRM-Tablero.dc.html", "M-FRM-Tablero-19.dc.html"),
                 ("M-FRM-Editor.dc.html", "M-FRM-Editor-Listas.dc.html"), ("M-FRM-Formularios.dc.html", "M-FRM-Formularios-20.dc.html")]:
        t = t.replace(f'"{a}"', f'"{b}"')
    return t


def migas(t, hoja=""):
    return t.replace("Formularios / Visita a cliente", f"Formularios / {FORM}{' / ' + hoja if hoja else ''}")


# ================================================================ Las preguntas: la app decide la forma (86 y 87)
def err(texto):
    return f'<span class="err2" role="alert">{texto}</span>' if texto else ""


def q(rot, control, s=1, req=False, mal=None, extra="", ayuda=""):
    r = f'{rot}{" <span class=" + chr(34) + "req" + chr(34) + ">*</span>" if req else ""}{extra}{F.info(ayuda) if ayuda else ""}'
    return s, f'<div class="w-cmp cg-q s{s}"><span class="rt">{r}</span>{control}{err(mal)}</div>'


def txt(v="", ang=False, mal=False, des=False):
    return f'<div class="ct{" ang" if ang else ""}{" mal" if mal else ""}{" des" if des else ""}">{v}</div>'


def seg(v=None, des=False):
    return '<span class="ab-seg' + (" des" if des else "") + '" role="radiogroup" aria-label="Sí o no">' + "".join(f'<span class="{"on" if v == x else ""}">{x}</span>' for x in ["Sí", "No"]) + "</span>"


def radios(ops, v=None, des=False):
    return f'<div class="cg-rd{" des" if des else ""}" role="radiogroup">' + "".join(f'<span class="{"on" if v == x else ""}"><i></i>{x}</span>' for x in ops) + "</div>"


def cat(rot, v=None, mal=False, foco=False, des=False, escrito=""):
    if v:
        return f'<div class="ct cg-cat{" mal" if mal else ""}{" des" if des else ""}"><span class="v">{v}</span><span class="x" aria-label="Quitar {rot}">{F.X}</span></div>'
    texto = escrito or f"Buscar en {rot}"
    return f'<div class="ct cg-cat{"" if escrito else " vac"}{" mal" if mal else ""}{" foco" if foco else ""}{" des" if des else ""}"><span class="q">{BUSCAR}</span><span class="v">{texto}</span></div>'


def area(v="", mal=False, des=False):
    return f'<div class="ct cg-area{" ph" if not v else ""}{" mal" if mal else ""}{" des" if des else ""}">{v}</div>'


def lineas(filas=None, mal=False, des=False):
    filas = filas or [("", "", "")]
    r = "".join(f'<div class="cg-linr">{cat("Producto", p, mal=mal and not p, des=des)}{txt(c, mal=mal and not c, des=des)}'
                f'<button type="button" class="ib" aria-label="Quitar el renglón {k}"{" disabled" if len(filas) == 1 else ""}>{TACHO}</button></div>' for k, (p, _pr, c) in enumerate(filas, 1))
    return (f'<div class="cg-lin"><div class="cg-linh"><span>Producto <span class="req">*</span></span><span>Cantidad <span class="req">*</span></span><span class="sr">Quitar</span></div>{r}</div>'
            f'<div class="cg-lpie"><button type="button" class="cb cb-sec">{MAS} Agregar renglón</button><span class="cg-cnt">{len(filas)} de 10</span></div>')


def fotos(n=0, mal=None, tope=3, des=False):
    if not n:
        c = f'<div class="cg-drop">Arrastrá las fotos acá o <button type="button" class="cb cb-sec"{" disabled" if des else ""}>Elegir fotos</button></div>'
    else:
        tiles = "".join(f'<div class="cg-fot"><span class="im" role="img" aria-label="IMG_223{k}.jpg"></span><span class="nm">IMG_223{k}.jpg</span>'
                        f'<button type="button" class="x" aria-label="Quitar IMG_223{k}.jpg"{" disabled" if des else ""}>{F.X}</button></div>' for k in range(1, n + 1))
        mas = "" if n >= tope else f'<button type="button" class="cg-mas"{" disabled" if des else ""}>{MAS}Agregar</button>'
        c = f'<div class="cg-fotos">{tiles}{mas}</div><span class="cg-cnt">{n} de {tope}</span>'
    return c + err(mal)


def armar(preguntas, columnas=3):
    """Los renglones con las columnas en uso, sin reordenar: una que no entra baja de renglón (86)."""
    filas, fila, uso = [], "", 0
    for s, h in preguntas:
        s = min(s, columnas)
        if uso + s > columnas:
            filas.append(fila)
            fila, uso = "", 0
        fila += h
        uso += s
    if fila:
        filas.append(fila)
    return "".join(f'<div class="cg-fila" data-entry-row>{f}</div>' for f in filas)


def zona(titulo, preguntas, plegada=False, columnas=3):
    cuerpo = "" if plegada else armar(preguntas, columnas)
    b = f'<button type="button" class="ib" aria-expanded="{"false" if plegada else "true"}" aria-label="{"Expandir" if plegada else "Plegar"} {titulo}">{CHEV}</button>'
    return f'<div class="w-caja cg-z{" pl" if plegada else ""}"><div class="f-cab"><span>{titulo}</span>{b}</div>{cuerpo}</div>'


def q_datos(v, e, des=False):
    p = [q("Cliente", txt(v.get("Cliente", ""), mal="Cliente" in e, des=des), 2, True, e.get("Cliente")),
         q("¿Se concretó la venta?", seg(v.get("Venta"), des) + err(e.get("Venta")), 1, True),
         q("Motivo", radios(["Venta nueva", "Reclamo", "Seguimiento"], v.get("Motivo"), des), 2)]
    if v.get("Venta") == "Sí":  # lo condicional aparece en su lugar y los renglones se recalculan
        p.append(q("Monto", txt(v.get("Monto", ""), ang=True, des=des), 1))
    return p


def q_entrega(v, e, des=False, prov=None, zona_q=None):
    return [zona_q or q("Zona", cat("Zona", v.get("Zona"), mal="Zona" in e, des=des), 2, True, e.get("Zona")),
            q("Fecha de entrega", txt(v.get("Fecha", ""), ang=True, mal="Fecha" in e, des=des), 1, True, e.get("Fecha")),
            prov or q("Proveedor", cat("Proveedor", v.get("Proveedor"), mal="Proveedor" in e, des=des), 2, True, e.get("Proveedor")),
            q("Productos", lineas(v.get("Productos"), mal="Productos" in e, des=des) + err(e.get("Productos")), 3, True),
            q("Observaciones", area(v.get("Observaciones", ""), des=des), 3)]


def q_fotos(v, e, des=False):
    return [q("Foto del remito", fotos(v.get("Fotos", 0), e.get("Fotos"), des=des), 3, extra=' <span class="cg-hasta">hasta 3</span>', ayuda=AY_FOTOS)]


def pagina(v=None, e=None, ple=(), des=False, prov=None, zona_q=None, antes="", extra=""):
    v, e = v or {}, e or {}
    return ('<div class="w-body">' + antes + zona("Datos", q_datos(v, e, des), "Datos" in ple) + zona("Entrega", q_entrega(v, e, des, prov, zona_q), "Entrega" in ple)
            + zona("Fotos y documentos", q_fotos(v, e, des), "Fotos y documentos" in ple) + extra + "</div>")


def banda(enviar=None, cancelar=True, titulo="Nueva respuesta", sub=SUB, volver="FRM-Formularios-20.dc.html"):
    c = f'<button type="button" class="cb cb-sec"{"" if cancelar else " disabled"}>Cancelar</button>'
    b = enviar if enviar is not None else f'<button type="button" class="cb cb-pri">{ENVIAR}</button>'
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="{volver}" aria-label="Volver a Formularios">{L.VOLVER}</a>'
            f'<div><h1>{titulo}</h1><p class="res">{sub}</p></div></div><div class="ac">{c}{b}</div></div>')


APAGADO = f'<span class="e-tipw"><button type="button" class="cb cb-pri" aria-disabled="true" title="Te falta el dato «Sucursal».">{ENVIAR}</button><span class="e-tip" role="tooltip">Te falta el dato «Sucursal».</span></span>'
ENVIANDO = E.trabaja("Enviando…")


def editor(V, capas, estados, nombre, css=""):
    t = A.pagina_editor(V, capas, estados, nombre, E.CSS_E12 + E.CSS_CA4 + CSS_20 + css)
    return t


# ================================================================ FRM-Cargar-Respuesta: la página (84)
E_P = ["Nueva respuesta", "Aparece una pregunta", "Una zona plegada", "Con errores", "Se abre la zona plegada", "Salir sin enviar", "Abriendo el formulario", "No se pudo abrir"]


def cargar():
    parcial = {"Cliente": "Ferretería Sur", "Venta": "Sí", "Motivo": "Venta nueva"}
    errores = {"Cliente": OBLIGA, "Venta": ELIGE, "Zona": ELIGE, "Fecha": "Elegí una fecha.", "Proveedor": ELIGE, "Productos": OBLIGA}
    plegada_err = {"Zona": ELIGE, "Fecha": "Elegí una fecha.", "Proveedor": ELIGE, "Productos": OBLIGA}
    abriendo = ('<div class="w-body"><div class="w-caja cg-z"><div class="f-cab"><span>Abriendo el formulario</span></div>' + P.ESQ + "</div></div>")
    fallo = ('<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>No se pudo abrir el formulario.</b><button type="button" class="cb cb-sec">Reintentar</button></div></div></div>')
    C_ = {"Nueva respuesta": pagina(), "Aparece una pregunta": pagina(parcial), "Una zona plegada": pagina(parcial, ple=("Entrega",)), "Con errores": pagina(e=errores),
          "Se abre la zona plegada": pagina({**parcial, "Monto": "30.000,00"}, plegada_err), "Salir sin enviar": pagina(parcial), "Abriendo el formulario": abriendo, "No se pudo abrir": fallo}
    bandas = {"Abriendo el formulario": banda(f'<button type="button" class="cb cb-pri" disabled>{ENVIAR}</button>', sub=FORM), "No se pudo abrir": banda(f'<button type="button" class="cb cb-pri" disabled>{ENVIAR}</button>', sub=FORM)}
    V = {e: (bandas.get(e, banda()), C_[e]) for e in E_P}
    capas = {"Salir sin enviar": A.confirmar("¿Salir sin enviar?", f"Lo que cargaste en {FORM} se pierde.", "Salir sin enviar", cancelar="Seguir cargando")}
    return editor(V, capas, E_P, "Nueva respuesta · /org/formularios/:id/cargar")


# ================================================================ FRM-Cargar-Lista: la lista de catálogo
E_L = ["La lista", "Buscando", "Sin coincidencias", "Una sola opción", "Sin el dato de la persona", "Elegir varias", "Espera otra respuesta", "Cambió la respuesta"]
TIPOS = [("Caños", True), ("Conexiones", True), ("Herramientas", False), ("Selladores", False)]


def lista(opciones, cuenta="58 opciones", mas=True, marcada=None):
    o = "".join(f'<div class="o{" on" if t == marcada else ""}" role="option">{t}<small>{d}</small></div>' for t, d in opciones)
    pie = '<div class="p"><button type="button" class="cb cb-enl">Mostrar 50 más</button></div>' if mas else ""
    return f'<div class="cg-lista" role="listbox" aria-label="Proveedor"><div class="c">{cuenta}</div>{o}{pie}</div>'


def lista_multi():
    o = "".join(f'<div class="o ch" role="option" aria-selected="{"true" if on else "false"}"><span class="bx{" on" if on else ""}">{TILDE if on else ""}</span><span class="tx">{t}</span></div>' for t, on in TIPOS)
    return f'<div class="cg-lista" role="listbox" aria-label="Rubros" aria-multiselectable="true"><div class="c">12 opciones · Elegiste 2 de 3</div>{o}<div class="p"><button type="button" class="cb cb-enl">Mostrar más</button></div></div>'


def catalogo():
    base = {k: v for k, v in LLENO.items() if k in ("Cliente", "Venta", "Motivo", "Monto")}
    conz = {**base, "Zona": "Centro"}
    pq = lambda c, extra="", mal=None: q("Proveedor", c + extra, 2, True, mal)
    espera = '<span class="e-tipw">' + cat("Proveedor", des=True) + '<span class="e-tip" role="tooltip">Primero elegí «Zona».</span></span>'
    multi = q("Rubros", cat("Rubros", foco=True) + '<div class="cg-chips">' + "".join(f'<span class="ab-chip">{t}<span aria-hidden="true">×</span></span>' for t, on in TIPOS if on) + "</div>" + lista_multi().replace('top: 62px', ""), 2, extra=' <span class="cg-hasta">hasta 3</span>')
    # La lista de una sola opción, ya elegida; sin el dato, la pregunta frena y lo nombra
    sin_dato = '<div class="cg-ban mal" role="alert">' + F.ALERTA + f'<span class="tx">No podés enviar {FORM}: te falta el dato «Sucursal».</span></div>'
    V = {"La lista": (banda(), pagina(conz, prov=pq(cat("Proveedor", foco=True), lista(PROVEEDORES)))),
         "Buscando": (banda(), pagina(conz, prov=pq(cat("Proveedor", foco=True, escrito="ace"), '<div class="cg-lista" aria-busy="true"><div class="m"><span class="girar2" aria-hidden="true"></span> Cargando las opciones</div></div>'))),
         "Sin coincidencias": (banda(), pagina(conz, prov=pq(cat("Proveedor", foco=True, escrito="ombú"), '<div class="cg-lista"><div class="m">Ninguna opción coincide con «ombú».</div></div>'))),
         "Una sola opción": (banda(), pagina(conz, prov=q("Proveedor", cat("Proveedor", "Aceros Rosario"), 2, True))),
         "Sin el dato de la persona": (banda(APAGADO), pagina(base, antes=sin_dato, zona_q=q("Zona", cat("Zona", des=True).replace("Buscar en Zona", "Esta lista no está disponible ahora."), 2, True))),
         "Elegir varias": (banda(), pagina(conz, prov=multi)),
         "Espera otra respuesta": (banda(), pagina(base, prov=pq(espera))),
         "Cambió la respuesta": (banda(), pagina({**base, "Zona": "Norte"}, prov=q("Proveedor", cat("Proveedor") + '<span class="cg-ay">Cambió «Zona»: volvé a elegir.</span>', 2, True)))}
    return editor(V, {}, E_L, "Las listas de catálogo · /org/formularios/:id/cargar", ".cg-q:has(.cg-chips) .cg-lista { top: 104px; }\n")


# ================================================================ FRM-Cargar-Archivos: las fotos y los documentos
E_A = ["Arrastrar o elegir", "Con fotos", "En el tope", "Una que no sirve", "Enviando", "Se cortó la conexión"]


def archivos():
    v = dict(LLENO)
    ple = ("Datos", "Entrega")
    corte = A.toast("No se pudo enviar. Revisá la conexión y volvé a tocar Enviar.", "mal")
    barra = '<div class="cg-barra" role="progressbar" aria-label="Enviando" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><i style="width: 64%;"></i></div>'
    V = {"Arrastrar o elegir": (banda(), pagina({**v, "Fotos": 0}, ple=ple)), "Con fotos": (banda(), pagina(v, ple=ple)), "En el tope": (banda(), pagina({**v, "Fotos": 3}, ple=ple)),
         "Una que no sirve": (banda(), pagina(v, {"Fotos": "remito.heic no es una foto JPG o PNG."}, ple=ple)),
         "Enviando": (banda(ENVIANDO, cancelar=False), pagina(v, ple=ple, des=True, antes=barra)), "Se cortó la conexión": (banda(), pagina(v, ple=ple))}
    return editor(V, {"Se cortó la conexión": corte}, E_A, "Fotos y documentos · /org/formularios/:id/cargar")


# ================================================================ FRM-Cargar-Enviada: lo que se mandó, y lo que puede pasar al enviar
E_E = ["Enviada", "Versión nueva", "Se dio de baja", "Una opción dada de baja", "Sin conexión"]


def fotos_chicas(n=2):
    return f"{n} fotos"


MINIS = '<span class="cg-min" role="img" aria-label="IMG_2231.jpg"></span><span class="cg-min" role="img" aria-label="IMG_2232.jpg"></span>'


def valores(filas=RENGLONES, fotos=None):
    return [("Cliente", "Ferretería Sur"), ("¿Se concretó la venta?", "Sí"), ("Motivo", "Venta nueva"), ("Monto", "30.000,00"), ("Zona", "Centro"), ("Fecha de entrega", "22/10/2026"), ("Proveedor", "Aceros Rosario"),
            ("Productos", X.ln_tabla(filas)), ("Total", TOTAL), ("Observaciones", "Retira el cliente."), ("Foto del remito", fotos or fotos_chicas())]


def enviada():
    cab = ('<div class="f-cab"><span>Enviada</span><span class="der"><a class="cb cb-pri" href="FRM-Cargar-Respuesta.dc.html">Cargar otra</a><a class="cb cb-sec" href="FRM-Respuestas-20.dc.html">Ver en la planilla</a></span></div>')
    ok = f'<div class="cg-env"><span class="ck">{TILDE}</span>Se guardó el {HORA}</div>'
    hecho = f'<div class="w-body"><div class="w-caja cg-z">{cab}{ok}{F.grilla(valores())}</div></div>'
    ban = lambda tx, b, cls="": f'<div class="cg-ban {cls}" role="alert">{F.ALERTA}<span class="tx">{tx}</span>{b}</div>'
    nueva = ban(f"{FORM} tiene una versión nueva. Pasá a ella para enviar: lo que cargaste se conserva.", '<button type="button" class="cb cb-sec">Pasar a la versión nueva</button>')
    baja = ban(f"{FORM} se dio de baja y ya no se puede cargar.", '<a class="cb cb-sec" href="FRM-Formularios-20.dc.html">Volver a Formularios</a>', "mal")
    opcion = pagina({**LLENO, "Proveedor": "Bulonera del Centro"}, {"Proveedor": "«Bulonera del Centro» ya no está disponible. Elegí otro."}, ple=("Datos",))
    corte = A.toast("No se pudo enviar. Revisá la conexión y volvé a tocar Enviar.", "mal")
    off = f'<button type="button" class="cb cb-pri" disabled title="Pasá a la versión nueva para enviar.">{ENVIAR}</button>'
    off2 = f'<button type="button" class="cb cb-pri" disabled title="Este formulario se dio de baja.">{ENVIAR}</button>'
    V = {"Enviada": (banda("", cancelar=False, titulo=NUM).replace('<button type="button" class="cb cb-sec" disabled>Cancelar</button>', ""), hecho),
         "Versión nueva": (banda(off), pagina(LLENO, ple=("Entrega", "Fotos y documentos"), antes=nueva)), "Se dio de baja": (banda(off2), pagina(LLENO, ple=("Entrega", "Fotos y documentos"), des=True, antes=baja)),
         "Una opción dada de baja": (banda(), opcion), "Sin conexión": (banda(), pagina(LLENO, ple=("Entrega", "Fotos y documentos")))}
    return editor(V, {"Sin conexión": corte}, E_E, "Enviada · /org/formularios/:id/cargar", F.CSS_GRILLA + X.CSS_19)


# ================================================================ La planilla, con «App» (90)
NS = X.NS
COLS = [("num", "N°", 112, ""), ("rec", "Recibida", 136, ""), ("quien", "Cargó", 118, ""), ("can", "Canal", 88, ""), ("cli", "Cliente", 132, ""), ("pro", "Productos", 96, ""), ("tot", "Total", 108, "r")]
RESP = [(NUM, HORA, "Tomás Acosta", "App", "Ferretería Sur", "30.000,00", "2 renglones", TOTAL),
        ("PED-000045", "15/10/2026 11:47", "Tomás Acosta", "WhatsApp", "Corralón El Puente", "48.000,00", "3 renglones", "$ 143.000,00"),
        ("PED-000044", "15/10/2026 11:04", "Tomás Acosta", "WhatsApp", "Obra Centro", NS, "2 renglones", None),
        ("PED-000043", "14/10/2026 17:02", "Paula Méndez", "WhatsApp", "Distribuidora Norte", "212.000,00", "5 renglones", "$ 624.900,00"),
        ("PED-000042", "14/10/2026 09:30", "Paula Méndez", "WhatsApp", "Ferretería Sur", NS, "1 renglón", None),
        ("PED-000041", "13/10/2026 15:30", "Tomás Acosta", "WhatsApp", "Ferretería Rosales", "125.500,00", "4 renglones", "$ 298.750,00"),
        ("PED-000040", "13/10/2026 14:10", "Lucía Fernández", "WhatsApp", "Obra Centro", NS, "1 renglón", None),
        ("PED-000039", "13/10/2026 12:20", "Martín Paz", "WhatsApp", "Corralón El Puente", "96.300,00", "—", "—"),
        ("PED-000038", "13/10/2026 11:04", "Tomás Acosta", "WhatsApp", "Ferretería Rosales", None, "—", "—"),
        ("PED-000037", "12/10/2026 17:40", "Paula Méndez", "WhatsApp", "Distribuidora Norte", "54.200,00", "—", "—")]
COLS_P = [c for c in COLS if c[0] != "quien"]
PROPIAS = [r for r in RESP if r[2] == "Tomás Acosta"]


def celda(k, r, destino="FRM-Respuesta-20.dc.html"):
    n, rec, quien, can, cli, mon, pro, tot = r
    if k == "num":
        return f'<span><a class="pl-num" href="{destino}">{n}</a></span>'
    v = {"rec": rec, "quien": quien, "can": can, "cli": cli, "mon": mon, "pro": pro, "tot": tot}[k]
    clase = ' class="r"' if k in ("mon", "tot") else ""
    return f"<span{clase}>{R.valor(v)}</span>"


def tabla(filas=RESP, cols=COLS, sel_=None, nueva=None, pie="1–10 de 46", pag="Página 1 de 5", destino="FRM-Respuesta-20.dc.html"):
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel_ else ""}{" nueva" if r[0] == nueva else ""}">' + "".join(celda(k, r, destino) for k, *_ in cols) + "</div>" for r in filas)
    return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(cols)};"><div class="pl-scroll">{R.cabecera(cols)}{h}</div>'
            f'<div class="w-pie"><span>{pie}</span><span>10 por página · {pag}</span></div></div>')


def pil(texto, con=False, menu=""):
    return f'<span class="f-env"><span class="w-pil{" con" if con else ""}" role="button" aria-haspopup="listbox">{texto} {CHEV}</span>{menu}</span>'


def barra(canal="normal", propia=False):
    """«Canal» se suma a los filtros rápidos; la cantidad ya está en «Respuestas», arriba."""
    t = re.sub(r'<span class="tot">[^<]*</span>', "", R.barra())
    menu = ""
    if canal == "menu":
        menu = ('<span class="f-mn" role="listbox" aria-label="Filtrar por canal"><span role="option" class="on">Todos los canales<span class="cnt"></span></span><span role="option">App<span class="cnt">1</span></span>'
                '<span role="option">WhatsApp<span class="cnt">45</span></span></span>')
    p = pil("Canal: App", True) if canal == "app" else pil("Canal", menu=menu)
    marca = '<span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">Recibida'
    assert marca in t
    t = t.replace(marca, p + marca, 1)
    if canal == "app":
        t = t.replace('<span class="pl-der">', '<button type="button" class="cb cb-enl">Limpiar filtros</button><span class="pl-der">', 1)
    if propia:
        t = t.replace('<span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">Empresa ' + CHEV + "</span></span>", "", 1)
    return t


def fondo(filas=RESP, cols=COLS, canal="normal", propia=False, **k):
    return R.CUERPO.format(barra(canal, propia) + tabla(filas, cols, **k))


AGREGAR = '<a class="cb cb-sec" href="FRM-Respuestas-Exportar.dc.html">Exportar a Excel</a><a class="cb cb-pri" href="FRM-Cargar-Panel.dc.html">Agregar respuesta</a>'


def banda_p(ac=AGREGAR, res="Respuestas · versión 4 publicada"):
    return R.banda(FORM, res, ac)


CSS_PL = P.CSS_MF + R.CSS_MF2 + F.CSS_GRILLA + P.CSS_D2 + R.CSS_DET + R.CSS_RC + ".d2-h a.nv { text-decoration: none; }\n"


def planilla(nombre, estados, bnd, cu, capas, titulo, pestana=True, hoja=""):
    t = R.pagina(titulo, A.con_estados([(e, bnd[e]) for e in estados]), A.con_estados([(e, cu[e]) for e in estados]), estados, css=CSS_PL + CSS_20 + X.CSS_19)
    if capas:
        k = t.rindex("</div>\n</x-dc>")
        t = t[:k] + A.con_estados([(e, capas.get(e, "")) for e in estados]) + t[k:]
    return t


E_PL = ["Planilla", "Canal: menú", "Canal: App"]


def respuestas():
    cu = {"Planilla": fondo(), "Canal: menú": fondo(canal="menu"), "Canal: App": fondo(RESP[:1], canal="app", pie="1 de 1", pag="Página 1 de 1")}
    return planilla("FRM-Respuestas-20", E_PL, {e: banda_p() for e in E_PL}, cu, {}, "Respuestas · /org/formularios/:id/respuestas · etapa 20")


E_D = ["Respuesta", "Pantalla completa"]


def origen(t):
    a = '<a class="d2-ln" href="WA-Chats-Respuesta.dc.html">Abrir conversación</a>'
    assert a in t
    t = t.replace(a, "").replace("La respondió Tomás Acosta por WhatsApp · se la mandó Lucía Fernández", "En la app, la cargó Tomás Acosta")
    return t


def detalle():
    aside = origen(R.d2(NUM, FORM, 4, valores(fotos=MINIS), "Tomás Acosta", HORA, primera=True, pos="1 de 10"))
    rc = R.rc_cuerpo(valores(fotos=MINIS), [(HORA, "En la app, la cargó Tomás Acosta")], resumen="11 preguntas · 11 respondidas").replace(f"La respondió Tomás Acosta el {HORA}", f"La cargó Tomás Acosta el {HORA}")
    bnd = {"Respuesta": banda_p(), "Pantalla completa": R.rc_banda(NUM, f"Versión 4 · recibida el {HORA}", "1 de 10", primera=True).replace('<a class="cb cb-sec" href="WA-Chats-Respuesta.dc.html">Abrir conversación</a>', "")}
    cu = {"Respuesta": fondo(sel_=NUM), "Pantalla completa": rc}
    return planilla("FRM-Respuesta-20", E_D, bnd, cu, {"Respuesta": aside}, "Respuesta · etapa 20")


# ================================================================ FRM-Cargar-Panel: junto a la planilla, solo en la compu
E_PA = ["Panel", "Con errores", "Enviando", "Se guardó", "Mantener las respuestas", "Cerrar sin enviar"]


def panel(v=None, e=None, enviar=None, keep=False, des=False):
    v, e = v or {}, e or {}
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar">{F.X}</button>'
    def col(titulo, ps):
        return f'<div class="cg-ztit">{titulo}</div>' + armar(ps, 1)
    b = col("Datos", q_datos(v, e, des)) + col("Entrega", q_entrega(v, e, des)) + col("Fotos y documentos", q_fotos(v, e, des))
    chk = f'<span class="q-chk">{"<i>" + TILDE + "</i>" if keep else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}Mantener las respuestas para la siguiente</span>'
    c = f'<button type="button" class="cb cb-sec"{" disabled" if des else ""}>Cancelar</button>'
    ev = enviar or f'<button type="button" class="cb cb-pri">{ENVIAR}</button>'
    return (f'<aside class="d2 cg-panel" role="region" aria-label="Nueva respuesta de {FORM}"><div class="d2-h"><b>Nueva respuesta</b><a href="FRM-Cargar-Respuesta.dc.html">Pantalla completa</a>{cerrar}</div>'
            f'<div class="d2-b">{b}</div><div class="cg-ppie">{chk}{c}{ev}</div></aside>')


def cargar_panel():
    parcial = {"Cliente": "Ferretería Sur", "Venta": "Sí", "Motivo": "Venta nueva", "Monto": "30.000,00"}
    errores = {"Cliente": OBLIGA, "Venta": ELIGE}
    conservado = {k: v for k, v in LLENO.items() if k != "Fotos"}
    ban = '<div class="cg-barra" role="progressbar" aria-label="Enviando" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><i style="width: 64%;"></i></div>'
    caps = {"Panel": panel(), "Con errores": panel(e=errores), "Enviando": panel(LLENO, enviar=ENVIANDO, des=True).replace('<div class="d2-b">', ban + '<div class="d2-b">', 1), "Se guardó": panel() + A.toast(f"Se guardó {NUM}"),
            "Mantener las respuestas": panel(conservado, keep=True) + A.toast(f"Se guardó {NUM}"), "Cerrar sin enviar": panel(parcial) + A.confirmar("¿Cerrar sin enviar?", "Lo que cargaste en esta respuesta se pierde.", "Cerrar sin enviar", cancelar="Seguir cargando")}
    sin = RESP[1:]
    cu = {e: fondo(sin, pie="1–10 de 45") for e in E_PA}
    cu["Se guardó"] = cu["Mantener las respuestas"] = fondo(nueva=NUM)
    return planilla("FRM-Cargar-Panel", E_PA, {e: banda_p() for e in E_PA}, cu, caps, "El panel · /org/formularios/:id/respuestas/nueva")


# ================================================================ FRM-Respuestas-Propias: lo suyo, sin «Mis cargas» aparte (85)
E_PR = ["Lo suyo", "Una respuesta suya", "Una dirección ajena", "De un formulario dado de baja"]


def como_tomas(t):
    t = L.G.PANEL_RE.sub(lambda m: L.ET.panel(20, "formularios"), t)
    t = t.replace('<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>',
                  '<div class="w-us"><span class="w-av">T</span><span class="tx"><b>Tomás Acosta</b><span>tomas.acosta@delta.ejemplo.com</span></span></div>')
    t = re.sub(r'(<summary class="um"[^>]*>)<span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b>', r'\1<span class="w-av">T</span><span class="tx"><b>Tomás Acosta</b>', t, count=1)
    t = re.sub(r'<div class="w-abajo"><a class="w-ln" href="WA-Admin\.dc\.html">.*?</a>', '<div class="w-abajo">', t, count=1, flags=re.S)
    t = re.sub(r'<a class="w-ln" href="WA-Chats\.dc\.html">.*?</a>', "", t, count=1, flags=re.S)
    return re.sub(r'<a class="w-ln[^"]*" href="FRM-Catalogos\.dc\.html">.*?</a>', "", t, count=1, flags=re.S)


def propias():
    agregar = '<a class="cb cb-pri" href="FRM-Cargar-Respuesta.dc.html">Agregar respuesta</a>'
    pie = dict(pie="1–5 de 5", pag="Página 1 de 1", destino="FRM-Respuestas-Propias.dc.html")
    aside = origen(R.d2(NUM, FORM, 4, valores(fotos=MINIS), "Tomás Acosta", HORA, primera=True, pos="1 de 5"))
    falta = R.d2(modo="falta")
    rel = [("REL-000012", "30/09/2026 10:15", "Tomás Acosta", "WhatsApp", "Obra Centro", "—", "—", "—"), ("REL-000009", "22/09/2026 16:40", "Tomás Acosta", "WhatsApp", "Depósito Sur", "—", "—", "—")]
    cols_rel = [c for c in COLS_P if c[0] in ("num", "rec", "can")] + [("cli", "Obra", 240, "")]
    cu = {"Lo suyo": fondo(PROPIAS, COLS_P, propia=True, **pie), "Una respuesta suya": fondo(PROPIAS, COLS_P, propia=True, sel_=NUM, **pie), "Una dirección ajena": fondo(PROPIAS, COLS_P, propia=True, **pie),
          "De un formulario dado de baja": fondo(rel, cols_rel, propia=True, pie="1–2 de 2", pag="Página 1 de 1", destino="FRM-Respuestas-Propias.dc.html")}
    bnd = {e: banda_p(agregar) for e in E_PR}
    bnd["De un formulario dado de baja"] = R.banda("Relevamiento de obra", "Respuestas · dado de baja", "")
    t = planilla("FRM-Respuestas-Propias", E_PR, bnd, cu, {"Una respuesta suya": aside, "Una dirección ajena": falta}, "Lo propio · /org/formularios/:id/respuestas")
    return t


# ================================================================ FRM-Editor-Listas: «Según otra respuesta» (94)
PREG = [("Cliente", "Texto corto · hasta 60 caracteres · Obligatoria"), ("¿Se concretó la venta?", "Sí o no · Obligatoria"), ("Motivo", "Elegir una · 3 opciones · Opcional"),
        ("Monto", "Número · 2 decimales · 1 condición · Opcional"), ("Zona", "De un catálogo · Zonas · Obligatoria"), ("Fecha de entrega", "Fecha · Obligatoria"),
        ("Proveedor", "De un catálogo · Proveedores · 1 filtro · Obligatoria"), ("Productos", "Grupo de líneas · 2 columnas · hasta 10 renglones · Obligatoria"), ("Total", "Cálculo · Pesos"),
        ("Observaciones", "Texto largo · Opcional"), ("Foto del remito", "Foto · hasta 3 · Opcional")]
TITULO_ANTES = 5  # «Entrega» va antes de la quinta pregunta
E_ED = ["Según otra respuesta", "Agregar filtro: menú", "La pregunta va después", "Sin preguntas que sirvan", "Un formulario para clientes"]
AY_SEGUN = "Las opciones se achican según lo que la persona respondió en otra pregunta. Queda solo para la app."


def con_preguntas(fn):
    def envuelta(*a, **k):
        viejas, vp = A.PREGUNTAS, X.PREG
        A.PREGUNTAS, X.PREG = [(n, d, False, None) for n, d in PREG], PREG
        try:
            return fn(*a, **k)
        finally:
            A.PREGUNTAS, X.PREG = viejas, vp
    return envuelta


def cond_lista(pregunta="Zona", mal=None):
    x = f'<button type="button" class="ib" aria-label="Quitar el filtro">{F.X}</button>'
    v = f'<div class="ct sel{" mal" if mal else ""}"><span class="v">{pregunta}</span>{CHEV}</div>'
    e = err(mal)
    return (f'<fieldset class="q-cond"><legend>Según otra respuesta</legend><div class="w-cmp"><span class="rt">Campo</span><div class="ct sel"><span class="v">Zona</span>{CHEV}</div></div>'
            f'<div class="w-cmp"><span class="rt">Pregunta</span>{v}{e}</div>{x}</fieldset>')


def zona_filtros(conds="", menu=False, apagado=None):
    m = ""
    if menu:
        m = ('<div class="f-menu" role="menu" aria-label="Agregar filtro">' + "".join(f'<span class="f-mi" role="menuitem">{x}</span>' for x in ["Según quien lo recibe", "Fijo", "Según otra respuesta"]) + "</div>")
    if apagado:
        b = f'<span class="e-tipw"><button type="button" class="cb cb-sec" disabled>{MAS} Agregar filtro {CHEV}</button><span class="e-tip" role="tooltip">{apagado}</span></span>'
    else:
        b = f'<span class="lg-bar"><button type="button" class="cb cb-sec" aria-haspopup="menu">{MAS} Agregar filtro {CHEV}</button>{m}</span>'
    prueba = (f'<div class="q-res"><b>Con «Centro», 58 opciones</b></div>' if conds and "mal" not in conds else "")
    cuerpo = f'<div class="zb">{conds}{prueba}</div>' if conds else ""
    return f'<div class="w-cmp ancho q-zona"><div class="zc"><span>Qué opciones ve cada persona{F.info(H.AYUDA_QUE_VE)}</span>{b}</div>{cuerpo}</div>'


def cuerpo_ed(html, k=7, pv=None):
    def fila(n):
        return html if n == k else X.fila(n)
    filas = "".join(("" if n != TITULO_ANTES else E.fila_titulo("Entrega")) + fila(n) for n in range(1, len(PREG) + 1))
    caja = (f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der"><button type="button" class="cb cb-sec">{MAS} Agregar título</button>'
            f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></span></div>{filas}</div>')
    pv = pv or (X.PV_BASE + '<div class="pv-c">Zona<div class="pv-in">Elegí una opción ' + CHEV + "</div></div>")
    return '<div class="w-body"><div class="f-cols"><div class="f-pila">' + E.caja_formulario(nombre=FORM, prefijo="PED", modo="fijo") + caja + "</div>" + X.vista(pv) + "</div></div>"


def editor_listas():
    def prov(z, oblig=True):
        return X.abierta(7, "De un catálogo", '<div class="w-cmp ancho"><span class="rt">Catálogo</span><div class="ct sel">Proveedores' + CHEV + "</div></div>" + z, oblig=oblig)
    banda_e = X.BANDA()
    conds = cond_lista()
    V = {"Según otra respuesta": cuerpo_ed(prov(zona_filtros(conds))), "Agregar filtro: menú": cuerpo_ed(prov(zona_filtros(conds, menu=True))),
         "La pregunta va después": cuerpo_ed(prov(zona_filtros(cond_lista("Fecha de entrega", "Tiene que ser una pregunta anterior que elija de «Zonas»."))), pv=X.PV_BASE),
         "Sin preguntas que sirvan": cuerpo_ed(prov(zona_filtros(apagado="Ninguna pregunta anterior elige de «Zonas»."))),
         "Un formulario para clientes": cuerpo_ed(prov(zona_filtros(cond_lista("Zona", "Una lista dependiente no se puede usar en un formulario solo para clientes."))))}
    return A.pagina_editor({e: (banda_e, V[e]) for e in E_ED}, {}, E_ED, "Editor · según otra respuesta", E.CSS_E12 + E.CSS_CA4 + E.CSS_TITULOS + H.CSS_FILTROS + X.CSS_19 + ".q-zona .lg-bar .f-menu { left: auto; right: 0; }\n.q-cond { align-items: start; }\n.q-cond > .ib { margin-top: 24px; }\n")


# ================================================================ FRM-Publicar-20: solo para la app (98 y 104)
E_PU = ["Sin número conectado", "Con una lista dependiente", "Con un catálogo grande", "Solo para clientes"]


def publicar():
    tit = "Publicar la versión 4"
    que = lambda: E.z_zona("Qué se publica", E.z_dato("Borrador", f"Guardado el {E.GUARDADO}") + E.z_dato("Preguntas", "11") + E.z_dato("Cambiadas", "Zona y Proveedor") + E.z_dato("En WhatsApp", "No"))

    def aviso(motivo):
        return E.z_zona("Avisos", H.z_aviso("Queda solo para la app", motivo), H.AYUDA_AVISOS)
    pie = E.pie_pub().replace("Publicar versión 4", "Publicar versión 4")
    frena = E.z_zona("Problemas", E.z_problema("No se puede publicar", "Este formulario es solo para clientes, y ellos responden por WhatsApp. Conectá un número o cambiá «Para quién es».", "Ir a «Para quién es»"), E.AYUDA_PROBLEMAS)
    capas = {E_PU[0]: A.dlg_publicar(tit, aviso("La organización no tiene un número de WhatsApp conectado. Para mandarlo cuando se conecte, hay que volver a publicar.") + que(), pie),
             E_PU[1]: A.dlg_publicar(tit, aviso("«Proveedor» usa una lista dependiente, y WhatsApp no las muestra. Se carga desde la web.") + que(), pie),
             E_PU[2]: A.dlg_publicar(tit, aviso("«Repuesto» tiene 240 opciones, y WhatsApp admite hasta 200 al elegir una. Se carga desde la web.") + que(), pie),
             E_PU[3]: A.dlg_publicar(tit, frena + que().replace(E.z_dato("En WhatsApp", "No"), ""), E.pie_pub(activo=False))}
    acciones = ('<button type="button" class="cb cb-sec" disabled>Descartar</button><button type="button" class="cb cb-sec" disabled>Guardar cambios</button>'
                '<a class="cb cb-pri" href="FRM-Publicar-20.dc.html">Publicar</a>' + E.kebab(False))
    base = (E.banda(FORM, E.EST_PUB, acciones, E.VOL), cuerpo_ed(""))
    return A.pagina_editor({e: base for e in E_PU}, capas, E_PU, "Publicar · etapa 20", E.CSS_E12 + E.CSS_CA4 + E.CSS_TITULOS + E.CSS_ZONAS + H.CSS_AVISOS + X.CSS_19)


# ================================================================ Los teléfonos
def t_q(rot, h, req=False, mal=None):
    return (f'<div class="cg-tc"><span class="rt">{rot}{" <span class=" + chr(34) + "rq" + chr(34) + ">*</span>" if req else ""}</span>{h}' + (f'<span class="cg-terr">{mal}</span>' if mal else "") + "</div>")


def t_txt(rot, v="", req=False, mal=None, ph=""):
    return F.tcampo(rot, v or ph, req=req, vacio=not v).replace('class="ct', 'class="ct mal' if mal else 'class="ct', 1) + (f'<span class="cg-terr">{mal}</span>' if mal else "")


def t_seg(v=None):
    return '<div class="cg-tseg">' + "".join(f'<span class="{"on" if v == x else ""}">{x}</span>' for x in ["Sí", "No"]) + "</div>"


def t_rd(ops, v=None):
    return '<div class="cg-trd">' + "".join(f'<span class="{"on" if v == x else ""}"><i></i>{x}</span>' for x in ops) + "</div>"


def t_zona(t, h, plegada=False):
    return (f'<div class="cg-tz"><button type="button" class="h" aria-expanded="{"false" if plegada else "true"}">{t}<span class="fl{"" if plegada else " ab"}">{CHEV}</span></button>' + ("" if plegada else f'<div class="cg-tb">{h}</div>') + "</div>")


def t_foto_btns():
    return ('<div class="cg-tacc"><button type="button" class="cb cb-pri">Tomar foto</button><button type="button" class="cb cb-sec">Elegir de la galería</button></div>')


def t_fotos(n=0):
    if not n:
        return t_foto_btns()
    tiles = "".join(f'<span class="im" role="img" aria-label="IMG_223{k}.jpg"></span>' for k in range(1, n + 1))
    return f'<div class="cg-tfot">{tiles}</div><span class="cg-cnt">{n} de 3</span>' + t_foto_btns()


def t_datos(v, e):
    h = t_txt("Cliente", v.get("Cliente", ""), True, e.get("Cliente")) + t_q("¿Se concretó la venta?", t_seg(v.get("Venta")), True, e.get("Venta")) + t_q("Motivo", t_rd(["Venta nueva", "Reclamo", "Seguimiento"], v.get("Motivo")))
    if v.get("Venta") == "Sí":
        h += t_txt("Monto", v.get("Monto", ""))
    return h


def t_lin(filas):
    r = "".join(f'<div class="cg-tlin"><span class="t">Renglón {k}</span>' + F.tcampo("Producto", p or "Buscar en Producto", req=True, vacio=not p) + F.tcampo("Cantidad", c or " ", req=True, vacio=not c) + "</div>" for k, (p, _pr, c) in enumerate(filas, 1))
    return r + f'<span class="t-mas">{MAS} Agregar renglón</span><span class="cg-cnt">{len(filas)} de 10</span>'


def t_entrega(v, e):
    return (t_txt("Zona", v.get("Zona", ""), True, e.get("Zona"), "Buscar en Zona") + t_txt("Fecha de entrega", v.get("Fecha", ""), True, e.get("Fecha"), " ") + t_txt("Proveedor", v.get("Proveedor", ""), True, e.get("Proveedor"), "Buscar en Proveedor")
            + t_lin(v.get("Productos") or [("", "", "")]) + F.tcampo("Observaciones", v.get("Observaciones", " "), vacio=not v.get("Observaciones")))


def t_pagina(v=None, e=None, ple=(), antes="", fijo=None):
    v, e = v or {}, e or {}
    pie = fijo if fijo is not None else f'<div class="ap-fijo"><button type="button" class="cb cb-pri full">{ENVIAR}</button></div>'
    return (C.t_bar("Nueva respuesta", SUB, "M-FRM-Formularios-20.dc.html") + '<div class="ap-cuerpo">' + antes + t_zona("Datos", t_datos(v, e), "Datos" in ple) + t_zona("Entrega", t_entrega(v, e), "Entrega" in ple)
            + t_zona("Fotos y documentos", t_q("Foto del remito", t_fotos(v.get("Fotos", 0))), "Fotos y documentos" in ple) + "</div>" + pie)


CSS_TP = P.CSS_TPL + R.CSS_T15 + A.CSS_TCHAT_AB + E.CSS_E12 + E.CSS_TED_E12 + F.CSS_TFILTRO + CSS_T20


def tel_cargar():
    est = ["Nueva respuesta", "Aparece una pregunta", "Con errores", "Salir sin enviar"]
    parcial = {"Cliente": "Ferretería Sur", "Venta": "Sí", "Motivo": "Venta nueva"}
    cu = {"Nueva respuesta": t_pagina(), "Aparece una pregunta": t_pagina(parcial), "Con errores": t_pagina(e={"Cliente": OBLIGA, "Venta": ELIGE}), "Salir sin enviar": t_pagina(parcial)}
    hoja = F.thoja("¿Salir sin enviar?", f'<p class="d-tx">Lo que cargaste en {FORM} se pierde.</p>', '<button type="button" class="cb cb-pel lleno">Salir sin enviar</button><button type="button" class="cb cb-sec">Seguir cargando</button>')
    return C.tel_pagina(cu, est, {"Salir sin enviar": hoja}, "Nueva respuesta · teléfono · etapa 20", CSS_TP)


def t_lista_barra(rot):
    return f'<div class="ap-bar int"><div class="tit" style="padding-left: 16px;"><h1>{rot}</h1></div><button type="button" class="ap-ib" aria-label="Cerrar la lista">{F.TCERRAR if hasattr(F, "TCERRAR") else F.X}</button></div>'


def tel_lista():
    est = ["La lista", "Sin coincidencias", "Elegir varias", "Espera otra respuesta"]
    filas = "".join(f'<div class="ap-fila"><div class="tx"><span class="l1">{t}</span><span class="l2">{d}</span></div></div>' for t, d in PROVEEDORES + [("Ferretería Industrial", "CUIT 30-70811234-1"), ("Hierros del Sur", "CUIT 30-71500231-6")])
    bus = lambda rot, escrito="": f'<div class="cg-tbus">{BUSCAR}<span>{escrito or "Buscar en " + rot}</span></div>'
    lista_ = t_lista_barra("Proveedor") + bus("Proveedor") + '<div class="cg-tcnt">58 opciones</div><div class="ap-cuerpo">' + filas + '<div class="cg-tmas"><button type="button" class="cb cb-sec">Mostrar 50 más</button></div></div>'
    nada = t_lista_barra("Proveedor") + bus("Proveedor", "ombú") + '<div class="ap-cuerpo"><div class="ap-vacio">Ninguna opción coincide con «ombú».</div></div>'
    tilde = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
    opc = "".join(f'<span class="t-opc {"on" if on else ""}">{t}<span class="d">{tilde if on else ""}</span></span>' for t, on in TIPOS)
    varias = (t_lista_barra("Rubros") + bus("Rubros") + '<div class="cg-tcnt">12 opciones · Elegiste 2 de 3</div><div class="ap-cuerpo"><div class="ap-grupo" style="padding: 4px 14px;">' + opc + "</div></div>"
              '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo · 2 elegidos</button></div>')
    espera = t_pagina({"Cliente": "Ferretería Sur", "Venta": "Sí", "Motivo": "Venta nueva", "Monto": "30.000,00"}, ple=("Datos",)).replace("Buscar en Proveedor", "Elegí antes «Zona»")
    return C.tel_pagina({"La lista": lista_, "Sin coincidencias": nada, "Elegir varias": varias, "Espera otra respuesta": espera}, est, {}, "Las listas · teléfono · etapa 20", CSS_TP)


def tel_archivos():
    est = ["Tomar foto primero", "Con fotos", "Enviando", "Se cortó la conexión"]
    v = dict(LLENO)
    ple = ("Datos", "Entrega")
    barra = '<div class="cg-tbarra" role="progressbar" aria-label="Enviando" aria-valuenow="64"><i style="width: 64%;"></i></div>'
    corte = '<div class="cg-tban mal" role="alert">No se pudo enviar. Revisá la conexión y volvé a tocar Enviar.</div>'
    env = '<div class="ap-fijo"><button type="button" class="cb cb-pri full k-trabaja" aria-busy="true">' + E.GIRA + "Enviando…</button></div>"
    cu = {"Tomar foto primero": t_pagina({**v, "Fotos": 0}, ple=ple), "Con fotos": t_pagina(v, ple=ple), "Enviando": t_pagina(v, ple=ple, fijo=env).replace('<div class="ap-cuerpo">', barra + '<div class="ap-cuerpo">', 1), "Se cortó la conexión": t_pagina(v, ple=ple, antes=corte)}
    return C.tel_pagina(cu, est, {}, "Fotos y documentos · teléfono · etapa 20", CSS_TP)


def tel_enviada():
    est = ["Enviada", "Versión nueva", "Se dio de baja"]
    grilla = "".join(f'<div class="f"><span class="k">{k}</span><span>{v}</span></div>' for k, v in valores())
    fijo = '<div class="ap-fijo dos"><a class="cb cb-pri full" href="M-FRM-Cargar-Respuesta.dc.html">Cargar otra</a><a class="cb cb-sec full" href="M-FRM-Respuestas-20.dc.html">Ver en la planilla</a></div>'
    hecho = (C.t_bar(NUM, SUB, "M-FRM-Formularios-20.dc.html") + '<div class="tr-scroll"><div class="tr-sec"><div class="h">Enviada</div>'
             f'<div class="cg-tenv"><span class="ck">{TILDE}</span>Se guardó el {HORA}</div><div class="tr-gr">{grilla}</div></div></div>' + fijo)
    nueva = f'<div class="cg-tban" role="alert">{FORM} tiene una versión nueva. Pasá a ella para enviar: lo que cargaste se conserva.<button type="button" class="cb cb-sec">Pasar a la versión nueva</button></div>'
    baja = f'<div class="cg-tban mal" role="alert">{FORM} se dio de baja y ya no se puede cargar.<a class="cb cb-sec" href="M-FRM-Formularios-20.dc.html">Volver a Formularios</a></div>'
    off = f'<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>{ENVIAR}</button></div>'
    cu = {"Enviada": hecho, "Versión nueva": t_pagina(LLENO, ple=("Entrega", "Fotos y documentos"), antes=nueva, fijo=off), "Se dio de baja": t_pagina(LLENO, ple=("Entrega", "Fotos y documentos"), antes=baja, fijo=off)}
    return C.tel_pagina(cu, est, {}, "Enviada · teléfono · etapa 20", CSS_TP + X.CSS_19 + ".tr-gr .ln-t { font-size: 14.5px; }\n.tr-sec > .h { cursor: default; }\n")


def fila_t(r, destino="M-FRM-Respuesta-20.dc.html"):
    n, rec, _q, can, cli, mon, pro, tot = r
    mon_t = "No se mostró" if mon == NS else (mon or "Sin respuesta")
    l3 = " · ".join(x for x in [None if pro == "—" else pro, None if tot == "—" else (tot or "Sin respuesta")] if x)
    return (f'<a class="ap-fila" href="{destino}"><div class="tx"><span class="l1">{n}<span class="hr">{rec}</span></span>'
            f'<span class="l2">{cli} · {can}</span><span class="l3">Monto: {mon_t}{" · " + l3 if l3 else ""}</span></div></a>')


def tel_respuestas():
    der = f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    fab = f'<a class="ap-fab" aria-label="Agregar respuesta" href="M-FRM-Cargar-Respuesta.dc.html">{F.TFAB}</a>'
    t = C.t_bar(FORM, "46 respuestas", "M-FRM-Formularios-20.dc.html", der) + '<div class="ap-cuerpo">' + "".join(fila_t(r) for r in RESP) + "</div>" + fab
    return C.tel_pagina({"Respuestas": t}, ["Respuestas"], {}, "Respuestas · teléfono · etapa 20", CSS_TP)


def t_detalle(num=NUM):
    grilla = "".join(f'<div class="f"><span class="k">{k}</span><span>{v}</span></div>' for k, v in valores())
    return (C.t_bar(num, f"{FORM} · versión 4", "M-FRM-Respuestas-20.dc.html") + '<div class="tr-scroll"><div class="tr-sec"><div class="cg-tenv"><span class="ck">' + TILDE + f'</span>Recibida {HORA}</div>'
            '<div class="tr-act"><span>En la app, la cargó Tomás Acosta</span></div></div><div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">' + CHEV + f'</span></button><div class="tr-gr">{grilla}</div></div></div>')


def tel_respuesta():
    return C.tel_pagina({"Respuesta": t_detalle()}, ["Respuesta"], {}, "Respuesta · teléfono · etapa 20", CSS_TP + X.CSS_19 + ".tr-gr .ln-t { font-size: 14.5px; }\n")


def tel_propias():
    est = ["Lo suyo", "Una dirección ajena"]
    der = f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    fab = f'<a class="ap-fab" aria-label="Agregar respuesta" href="M-FRM-Cargar-Respuesta.dc.html">{F.TFAB}</a>'
    bar = C.t_bar(FORM, "5 respuestas", "M-FRM-Formularios-20.dc.html", der)
    t = bar + '<div class="ap-cuerpo">' + "".join(fila_t(r, "M-FRM-Respuesta-20.dc.html") for r in PROPIAS) + "</div>" + fab
    falta = C.t_bar(FORM, "", "M-FRM-Respuestas-Propias.dc.html") + '<div class="ap-cuerpo"><div class="ap-vacio">No encontramos esta respuesta.<a class="cb cb-sec" href="M-FRM-Respuestas-Propias.dc.html">Volver a la planilla</a></div></div>'
    return C.tel_pagina({"Lo suyo": t, "Una dirección ajena": falta}, est, {}, "Lo propio · teléfono · etapa 20", CSS_TP)


def tel_editor():
    est = ["Según otra respuesta", "Agregar un filtro"]

    def fila(c, v):
        return f'<div class="q-row"><span class="tx"><b>{c}</b><span>{v}</span></span><button type="button" class="ap-ib" aria-label="Quitar el filtro">{F.svg(chr(60) + "path d=" + chr(34) + "M6 6l12 12M18 6 6 18" + chr(34) + "/>", 20)}</button></div>'
    t = (C.t_bar("Proveedor", "Pregunta", "M-FRM-Editor.dc.html") + '<div class="ap-cuerpo"><div class="ap-gtit">Qué opciones ve cada persona<a href="#">Agregar un filtro</a></div><div class="ap-grupo">' + fila("Zona", "Según otra respuesta · Zona") + "</div>"
         '<div class="ap-txt-l" style="padding: 12px 16px;"><b>Con «Centro», 58 opciones</b></div></div>')
    h = M.hoja("Agregar un filtro", '<span role="menuitem">Según quien lo recibe</span><span role="menuitem">Fijo</span><span role="menuitem">Según otra respuesta</span>')
    return M.css(C.tel_pagina({e: t for e in est}, est, {"Agregar un filtro": h}, "Según otra respuesta · teléfono · etapa 20", E.CSS_E12 + CSS_TP), M.CSS_HOJA, "hoja")


def tel_publicar():
    est = ["Sin número conectado", "Con una lista dependiente", "Con un catálogo grande", "Solo para clientes"]
    tit = "Publicar la versión 4"
    base = X.t_bar() + E.t_cuerpo(nombre=FORM, prefijo="PED") + E.t_fijo("cambios")

    def hoja(motivo, btn=True):
        pie = f'<button type="button" class="cb cb-pri"{"" if btn else " disabled"}>Publicar versión 4</button><button type="button" class="cb cb-sec">Cancelar</button>'
        return F.thoja(tit, f'<div class="p-tit2">{"Avisos" if btn else "Problemas"}</div><div class="cg-tban{"" if btn else " mal"}" style="margin: 0;">{motivo}</div><div class="p-tit2" style="margin-top: 12px;">Qué se publica</div><span class="t-lin">11 preguntas</span><span class="t-lin">En WhatsApp: no</span>', pie)
    capas = {est[0]: hoja("Queda solo para la app: la organización no tiene un número de WhatsApp conectado. Para mandarlo cuando se conecte, hay que volver a publicar."),
             est[1]: hoja("Queda solo para la app: «Proveedor» usa una lista dependiente, y WhatsApp no las muestra."), est[2]: hoja("Queda solo para la app: «Repuesto» tiene 240 opciones, y WhatsApp admite hasta 200 al elegir una."),
             est[3]: hoja("No se puede publicar: este formulario es solo para clientes, y ellos responden por WhatsApp.", False)}
    return C.tel_pagina({e: base for e in est}, est, capas, "Publicar · teléfono · etapa 20", A.CSS_TED + A.CSS_TCHAT_AB + E.CSS_E12 + E.CSS_TED_E12 + CSS_TP)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Formularios-20": ("Formularios · la lista con «Cargar» · etapa 20", 1440, 900), "M-FRM-Formularios-20": ("Formularios · teléfono · etapa 20", 390, 844),
           "FRM-Cargar-Respuesta": ("Nueva respuesta · la página · etapa 20", 1440, 1200), "M-FRM-Cargar-Respuesta": ("Nueva respuesta · teléfono · etapa 20", 390, 844),
           "FRM-Cargar-Panel": ("Nueva respuesta · el panel · etapa 20", 1440, 900),
           "FRM-Cargar-Lista": ("Nueva respuesta · las listas · etapa 20", 1440, 1100), "M-FRM-Cargar-Lista": ("Las listas · teléfono · etapa 20", 390, 844),
           "FRM-Cargar-Archivos": ("Nueva respuesta · fotos y documentos · etapa 20", 1440, 900), "M-FRM-Cargar-Archivos": ("Fotos y documentos · teléfono · etapa 20", 390, 844),
           "FRM-Cargar-Enviada": ("Nueva respuesta · enviada · etapa 20", 1440, 1000), "M-FRM-Cargar-Enviada": ("Enviada · teléfono · etapa 20", 390, 844),
           "FRM-Respuestas-20": ("Formularios · la planilla con «App» · etapa 20", 1440, 900), "M-FRM-Respuestas-20": ("La planilla · teléfono · etapa 20", 390, 844),
           "FRM-Respuesta-20": ("Formularios · una respuesta de la app · etapa 20", 1440, 900), "M-FRM-Respuesta-20": ("Una respuesta · teléfono · etapa 20", 390, 844),
           "FRM-Respuestas-Propias": ("Formularios · lo propio · etapa 20", 1440, 900), "M-FRM-Respuestas-Propias": ("Lo propio · teléfono · etapa 20", 390, 844),
           "FRM-Editor-Listas": ("Formularios · según otra respuesta · etapa 20", 1440, 1600), "M-FRM-Editor-Listas": ("Según otra respuesta · teléfono · etapa 20", 390, 844),
           "FRM-Publicar-20": ("Formularios · publicar solo para la app · etapa 20", 1440, 1000), "M-FRM-Publicar-20": ("Publicar · teléfono · etapa 20", 390, 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (titulo, w, h) in TITULOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def css_y_alto(t, alto):
    return L.con_css(t, "alto", f".w-app {{ height: {alto}px !important; }}\n") if alto else t


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    L.FICHAS.setdefault(FORM, ("46", "FRM-Editor-Listas.dc.html", "M-FRM-Editor-Listas.dc.html"))
    fp = con_preguntas
    for n, f, alto, hoja, pestana in [("FRM-Cargar-Respuesta", cargar, 1200, "Nueva respuesta", None), ("FRM-Cargar-Lista", catalogo, 1100, "Nueva respuesta", None), ("FRM-Cargar-Archivos", archivos, None, "Nueva respuesta", None),
                                      ("FRM-Cargar-Enviada", enviada, 1000, "Nueva respuesta", None), ("FRM-Respuestas-20", respuestas, None, "", "respuestas"), ("FRM-Respuesta-20", detalle, None, "", "respuestas"),
                                      ("FRM-Cargar-Panel", cargar_panel, None, "", "respuestas"), ("FRM-Respuestas-Propias", propias, None, "", None),
                                      ("FRM-Editor-Listas", fp(editor_listas), 1600, "", "diseno"), ("FRM-Publicar-20", fp(publicar), 1000, "", "diseno")]:
        t = migas(L.sin_disenar(n, E.post(n, f(), alto)), hoja)
        t = css_y_alto(t, alto)
        if pestana:
            t = L.con_pestanas(t, pestana)
        if n in ("FRM-Editor-Listas", "FRM-Publicar-20"):  # todavía no se publicó la versión 4: PED-000046 no existe
            t = t.replace('<span class="c">46</span>', '<span class="c">45</span>')
        if n == "FRM-Respuestas-Propias":
            t = como_tomas(t).replace(f'Formularios / {FORM}"]', 'Formularios / Relevamiento de obra"]', 1)
        if n == "FRM-Cargar-Enviada":  # las migas dicen la hoja de cada estado
            miga = f"Inicio / Gestión de formularios / Formularios / {FORM} / "
            t = t.replace(miga + "Nueva respuesta", "{{miga}}").replace("      si: true, no: false,\n", f"      si: true, no: false, miga: {json.dumps(miga, ensure_ascii=False)} + (k === 0 ? {json.dumps(NUM)} : 'Nueva respuesta'),\n", 1)
        (PROJ / f"{n}.dc.html").write_text(enlaces(t), encoding="utf-8")
    for n, f in [("M-FRM-Cargar-Respuesta", tel_cargar), ("M-FRM-Cargar-Lista", tel_lista), ("M-FRM-Cargar-Archivos", tel_archivos), ("M-FRM-Cargar-Enviada", tel_enviada), ("M-FRM-Respuestas-20", tel_respuestas),
                 ("M-FRM-Respuesta-20", tel_respuesta), ("M-FRM-Respuestas-Propias", tel_propias), ("M-FRM-Editor-Listas", tel_editor), ("M-FRM-Publicar-20", fp(tel_publicar))]:
        (PROJ / f"{n}.dc.html").write_text(enlaces(E.post(n, f())), encoding="utf-8")
    registrar()
    print("tableros", len(TITULOS))
