"""La etapa «Acciones del asistente» (ADR 0068 y decisión 268 del back; spec `docs/plans/formularios/acciones-del-asistente.md`):
la IA prepara, la persona confirma en la pantalla de siempre y guarda la ruta de siempre. Va después de la segunda parte de la
base y antes de la E12, así que cada tablero muestra solo lo que existe hasta ahí (78): sin «Gestión de formularios».

Escribe diez tableros, con su teléfono, en la página «Propuesta · Acciones del asistente» de `canvas.json`:
- `Asistente-Org-Acciones`: el Inicio con la tarjeta de cada acción en el hilo, debajo del texto de la IA, en todos sus estados
  (nueva, con «Revisá», reemplazada, ya no disponible con su motivo, aplicada y plegada, y sin confirmar). La tarjeta copia la de
  armar de `Asistente-Org-25`, con cada dato en su renglón (263) y el botón de quitar o dar de baja en rojo contorneado;
- `Usuarios-Invitar-Propuesta`: «Invitar usuario» sobre el Inicio, con «Propuesta del asistente», un rol con «Revisá», la pieza
  para elegir abierta (262) con lo que no se puede dar apagado y su motivo (211 y 0061), el aviso de que manda la invitación,
  «Invitando…» y «Ya se guardó»;
- `Usuario-Propuesta`: la ficha de una persona con «Lo que cambia» (un rol que se suma y otro que se quita) y el aviso de que la
  persona cambió desde la propuesta, con lo que cambia contado sobre lo de ahora;
- `Rol-Propuesta`: el editor de roles con los permisos en áreas plegables (260, RO3-D), con un rol nuevo propuesto, lo incluido y
  lo que no tenés apagados con su motivo, y un cambio de permisos en «Lo que cambia»;
- `Confirmar-Propuesta`: la confirmación de quitar a una persona, desde su ficha, y la de dar de baja un rol, desde Roles, abiertas
  desde la tarjeta.

Quien pide es Valeria Castro, con el rol «Administración de personas» (Usuarios y Roles enteros, «Ver empresas», «Usar el
asistente» y «Atender clientes»): no es Dueña, así que hay roles y permisos que no puede dar. Su menú muestra solo lo que esos
permisos dejan ver.

Parte de la copia de los tableros de siempre en la v176, ya dibujados, de `acciones_asistente_1004/` (la arma `capturar.mjs` de
esa carpeta), y escribe las medidas de antes de la escala: después va
`traspaso10_piezas_1004.py --tableros <los diez y sus teléfonos>`, que pone las piezas y la escala de la compu (180). Se puede
volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
COPIA = pathlib.Path(__file__).resolve().parent / "acciones_asistente_1004"
PAGINA = {"id": "acciones-asistente", "name": "Propuesta · Acciones del asistente"}
MARCA = 'data-acc="acciones"'


def copia(nombre):
    return (COPIA / f"{nombre}.html").read_text(encoding="utf-8").strip()


def una_vez(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:140])
    return t.replace(viejo, nuevo)


def fin_div(t, i):
    """El final del `<div` que empieza en `i`, contando los que se abren y se cierran adentro."""
    assert t.startswith("<div", i)
    profundidad, k = 0, i
    for m in re.finditer(r"<div\b|</div>", t[i:]):
        profundidad += 1 if m.group(0) == "<div" else -1
        if profundidad == 0:
            return i + m.end()
    raise AssertionError("div sin cerrar")


def svg_de(t, despues_de):
    i = t.index(despues_de)
    a = t.index("<svg", i)
    return t[a:t.index("</svg>", a) + len("</svg>")]


# ---------------------------------------------------------------------------------------------------------------- íconos
SVG_REV = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>')
SVG_I = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/></svg>')
SVG_OK = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>')
SVG_ATEN = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/>'
            '<path d="M12 9.5v4"/><path d="M12 17h.01"/></svg>')
SVG_FLECHA = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')
SVG_X = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
SVG_TILDE = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>')
SVG_MENOS = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" '
             'aria-hidden="true"><path d="M6 12h12"/></svg>')
SVG_CHEV = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')
ARO = '<span class="acc-aro" aria-hidden="true"></span>'
AD = ' aria-disabled="true"'
NADA = ' class="nada"'
DUDAM = '<span class="acc-dudam">{}</span>'

# ---------------------------------------------------------------------------------------------------------------- quien pide
YO = {"n": "Valeria Castro", "ini": "V", "correo": "valeria.castro@delta.ejemplo.com", "rol": "Administración de personas"}
# Lo que no ve con sus permisos: Formularios es de la E12, y no tiene Configuración, Página pública, administrar WhatsApp,
# configurar el asistente, Auditoría ni mandar difusiones.
NO_VE = ["FRM-Formularios.dc.html", "Configuracion.dc.html", "Pagina-Org.dc.html", "WA-Admin.dc.html", "Asistente-Config-Org.dc.html",
         "Auditoria-Org.dc.html", "WA-Difusiones.dc.html"]


def actor(t):
    t = t.replace("Lucía Fernández", YO["n"]).replace("lucia.fernandez@delta.ejemplo.com", YO["correo"])
    t = re.sub(r'(<span class="avatar"[^>]*>)L(</span>)', rf'\g<1>{YO["ini"]}\g<2>', t)
    t = re.sub(r'(<span class="w-av"[^>]*>)L(</span>)', rf'\g<1>{YO["ini"]}\g<2>', t)
    t = re.sub(r'(<span class="yo">)L(</span>)', rf'\g<1>{YO["ini"]}\g<2>', t)
    t = t.replace('<span class="n2">Dueño</span>', f'<span class="n2">{YO["rol"]}</span>')
    return t.replace('Grupo Delta<span class="s">Dueño</span>', f'Grupo Delta<span class="s">{YO["rol"]}</span>')


def menu(t):
    for h in NO_VE:
        t = re.sub(rf'<li><a [^>]*href="{re.escape(h)}"[^>]*>.*?</a></li>', "", t, flags=re.S)
        t = re.sub(rf'<a class="w-ln[^"]*" href="{re.escape(h)}">.*?</a>', "", t, flags=re.S)
    assert "FRM-Formularios" not in t
    return t


def marco(t):
    return actor(menu(t))


# ---------------------------------------------------------------------------------------------------------------- el tablero
def cabeza(base, titulo, otra=None):
    """Todo lo de `base` hasta `</helmet>`, con su título, y los estilos que la base tiene fuera del helmet. Con `otra`, suma
    después los estilos de esa otra base que `base` no tiene, para dibujar en un tablero las pantallas de las dos."""
    t = (PROJ / f"{base}.dc.html").read_text(encoding="utf-8")
    i = t.index("</helmet>")
    j = t.index("</x-dc>")
    afuera = "".join(re.findall(r"<style\b[^>]*>.*?</style>", t[i:j], re.S))
    cab = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t[:i], count=1)
    cab = re.sub(r'<style data-acc="acciones">.*?</style>\n?', "", cab, flags=re.S)
    if otra:
        o = (PROJ / f"{otra}.dc.html").read_text(encoding="utf-8")
        k = o.index("</helmet>")
        propios = re.findall(r"<style\b[^>]*>.*?</style>", cab, re.S)
        suma = [b for b in re.findall(r"<style\b[^>]*>.*?</style>", o[:k], re.S)
                if b not in propios and 'data-t10="piezas"' not in b and MARCA not in b]
        cab += "\n".join(suma) + "\n"
        afuera += "".join(b for b in re.findall(r"<style\b[^>]*>.*?</style>", o[k:o.index("</x-dc>")], re.S) if b not in afuera)
    return cab, afuera


def sc_if(i, cuerpo):
    return '<sc-if value="{{e%d}}" hint-placeholder-val="{{%s}}">%s</sc-if>' % (i, "si" if i == 0 else "no", cuerpo)


def por_estado(cuerpos):
    return "".join(sc_if(i, c) for i, c in enumerate(cuerpos))


def tablero(base, titulo, css, plantilla, estados, ancho, alto, otra=None):
    cab, afuera = cabeza(base, titulo, otra)
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"},
             "$preview": {"width": ancho, "height": alto}}
    texto_props = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto_props
    lista = json.dumps(estados, ensure_ascii=False)
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(estados)))
    guion = (f"<script type=\"text/x-dc\" data-dc-script data-props='{texto_props}'>\n"
             "class Component extends DCLogic {\n"
             "  renderVals() {\n"
             f"    const k = {lista}.indexOf(this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n"
             "  }\n"
             "}\n"
             "</script>\n</body>\n</html>\n")
    assert "{{" not in re.sub(r"\{\{(e\d+|si|no)\}\}", "", plantilla), "una variable sin valor en la plantilla"
    return (f"{cab}<style {MARCA}>\n{css}</style>\n</helmet>\n{afuera}\n{plantilla}\n</x-dc>\n{guion}")


# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_COMUN = """
/* Acciones del asistente (ADR 0068) · la tarjeta en el hilo, copiada de la de armar de la E25: cada dato en su renglón (263). */
.acc-card { border: 1px solid var(--borde2); border-radius: @R@; background: #fff; margin-top: 6px; font-size: @LETRA@; overflow: hidden; }
.acc-card .cab { display: flex; align-items: center; gap: 8px; padding: @CABP@; border-bottom: 1px solid var(--borde); background: oklch(0.975 0.006 95); }
.acc-card .cab b { font-weight: 600; margin-right: auto; }
.acc-card a.cb { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; height: @BOTON@; padding: 0 12px; border: 1px solid var(--marca); border-radius: @RB@; background: var(--marca); color: #fff; font-size: @LETRAB@; font-weight: 600; text-decoration: none; white-space: nowrap; }
.acc-card a.cb.acc-pel { background: #fff; border-color: oklch(0.57 0.2 25 / 0.4); color: oklch(0.52 0.19 25); }
.acc-datos { display: grid; grid-template-columns: @COLK@ minmax(0, 1fr); gap: 6px 14px; padding: 10px 12px 12px; }
.acc-datos .k { color: var(--t2); }
.acc-datos .v { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; min-width: 0; overflow-wrap: anywhere; color: var(--t1); }
.acc-rev { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 6px; border-radius: 3px; background: var(--alerta-t); color: var(--alerta); font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.acc-rev svg { width: 12px; height: 12px; flex: none; }
.acc-pleg { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; margin-top: 6px; padding: @PLEGP@; border: 1px solid var(--borde2); border-radius: @R@; background: #fff; font-size: @LETRA@; }
.acc-pleg b { font-weight: 600; }
.acc-pleg .etq { padding: 0 6px; border: 1px solid var(--borde2); border-radius: 3px; font-size: 11.5px; color: var(--t2); white-space: nowrap; }
.acc-pleg .lnk { color: var(--marca-tx); font-weight: 600; text-decoration: none; white-space: nowrap; }
.acc-mot { color: var(--t2); }

/* «Propuesta del asistente» junto al título (regla 9 de la 0068). */
.acc-tit { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; min-width: 0; }
.acc-prop { display: inline-flex; align-items: center; gap: 5px; color: var(--marca-tx); font-size: @LETRAP@; font-weight: 500; white-space: nowrap; }
.acc-prop svg { width: 14px; height: 14px; flex: none; }

/* Lo apagado dice por qué en un tooltip sobre el control (211); aquí, abierto para verlo. */
.acc-tip { position: absolute; z-index: 60; left: @TIPL@; bottom: calc(100% + 6px); width: max-content; max-width: 300px; padding: 7px 10px; border-radius: 6px; background: oklch(0.27 0.012 60); color: #fff; font-size: @LETRAT@; font-weight: 400; line-height: 1.4; white-space: normal; text-align: left; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
.acc-tip::after { content: ""; position: absolute; left: 14px; top: 100%; border: 6px solid transparent; border-top-color: oklch(0.27 0.012 60); }

/* Los avisos según su tipo (210): blancos, con el filo de 3 px y el ícono del color de su tipo. */
.acc-av { --acc-tipo: var(--t2); display: flex; align-items: flex-start; gap: 8px; padding: 9px 12px; border: 1px solid var(--borde2); border-left: 3px solid var(--acc-tipo); border-radius: 3px; background: #fff; color: var(--t1); font-size: @LETRA@; line-height: 1.45; }
.acc-av.aten { --acc-tipo: var(--alerta); }
.acc-av.ok { --acc-tipo: oklch(0.55 0.13 155); }
.acc-av > svg { flex: none; margin-top: 1px; color: var(--acc-tipo); }

/* El botón que trabaja: el aro y su gerundio (115). */
.acc-aro { display: inline-block; width: 14px; height: 14px; box-sizing: border-box; margin-right: 6px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; vertical-align: -2px; animation: acc-girar 0.8s linear infinite; }
@keyframes acc-girar { to { transform: rotate(360deg); } }

/* «Lo que cambia»: lo que se suma y lo que se quita, sobre lo leído al abrir (regla 9 de la 0068). */
.acc-tabla { font-size: @LETRAC@; }
.acc-tabla .f { display: grid; grid-template-columns: var(--acc-cols); border-top: 1px solid var(--borde); }
.acc-tabla .f:first-child { border-top: 0; }
.acc-tabla .f > span { padding: 9px 14px; min-width: 0; }
.acc-tabla .f > span + span { box-shadow: inset 1px 0 0 var(--borde); }
.acc-tabla .h { background: oklch(0.945 0.027 95); color: var(--t2); font-weight: 600; }
.acc-tabla .nada { color: var(--t3); }

/* Los permisos de un rol en áreas plegables (260, RO3-D): una columna, «Permiso»; la banda con la flecha, su casilla, el nombre y
   su (i); abierta, un permiso por fila con su casilla y su nombre entero. Lo incluido y lo que no tenés, apagados con su motivo. */
.acc-perm { position: relative; border: 1px solid var(--borde); border-radius: @R@; background: #fff; }
.acc-perm .ph { padding: 9px 14px; border-radius: @R@ @R@ 0 0; background: oklch(0.945 0.027 95); color: var(--t2); font-size: @LETRAC@; font-weight: 600; }
.acc-area { display: flex; align-items: center; gap: 10px; min-height: @ALTOA@; padding: 0 14px 0 8px; border-top: 1px solid var(--borde); background: oklch(0.975 0.006 95); font-size: @LETRAC@; font-weight: 600; }
.acc-area .fl { display: inline-flex; flex: none; padding: 0; border: 0; border-radius: 3px; background: transparent; cursor: pointer; width: @ZONA@; height: @ZONA@; align-items: center; justify-content: center; color: var(--t2); }
.acc-area.cerrada .fl svg { transform: rotate(-90deg); }
.acc-area .zc { display: inline-flex; flex: none; width: @ZONA@; height: @ZONA@; align-items: center; justify-content: center; position: relative; }
.acc-area .i { position: relative; display: inline-flex; color: var(--t3); cursor: help; }
.acc-area.apag .nm { color: var(--t3); }
.acc-p { position: relative; display: flex; align-items: center; gap: 10px; min-height: @ALTOP@; padding: 0 14px 0 calc(8px + @ZONA@ + 10px + (@ZONA@ - @CASILLA@) / 2); border-top: 1px solid var(--borde); font-size: @LETRAC@; }
.acc-p.apag { color: var(--t3); }
.acc-p .acc-tip { left: calc(8px + @ZONA@ + 10px); }
.acc-cb { display: inline-flex; flex: none; width: @CASILLA@; height: @CASILLA@; box-sizing: border-box; align-items: center; justify-content: center; border: 1.5px solid var(--borde2); border-radius: 3px; background: #fff; color: #fff; }
.acc-cb.lleno, .acc-cb.parcial { border-color: var(--marca); background: var(--marca); }
.acc-cb.apag { border-color: var(--borde); background: var(--s3); }
.acc-cb.lleno.apag, .acc-cb.parcial.apag { border-color: oklch(0.78 0.06 140); background: oklch(0.78 0.06 140); }
.acc-cb svg { width: 12px; height: 12px; }
.acc-zc-tip { left: -6px; }
"""

CSS_COMPU = (CSS_COMUN.replace("@R@", "3px").replace("@RB@", "3px").replace("@LETRA@", "13px").replace("@LETRAB@", "12.5px")
             .replace("@LETRAP@", "13px").replace("@LETRAT@", "12.5px").replace("@LETRAC@", "14px").replace("@CABP@", "7px 10px")
             .replace("@BOTON@", "28px").replace("@COLK@", "190px").replace("@PLEGP@", "8px 12px").replace("@TIPL@", "12px")
             .replace("@ALTOA@", "40px").replace("@ALTOP@", "36px").replace("@ZONA@", "24px").replace("@CASILLA@", "16px")) + """
/* La compu: el campo con «Revisá» y su motivo debajo, como el error de un campo (263), y la pieza para elegir abierta (262). */
.in2.acc-duda { border-color: oklch(0.72 0.15 70); box-shadow: inset 0 0 0 1px oklch(0.72 0.15 70); }
button.in2 .acc-rev { margin-left: auto; margin-right: 8px; }
.acc-dudam { display: block; margin-top: 5px; color: var(--alerta); font-size: 12.5px; }
.acc-lista { left: 0 !important; right: auto !important; width: 100% !important; max-width: none !important; max-height: none !important; overflow: visible !important; }
.acc-lista .op2 { position: relative; }
.acc-lista .op2.acc-apag { cursor: default; }
.acc-lista .op2.acc-apag .opn, .acc-lista .op2.acc-apag .opd { color: var(--t3); }
.acc-lista .op2 .acc-tip { left: 34px; }
.acc-dlg-av { grid-column: 1 / -1; }
.velo .b.b-pri[aria-disabled="true"] { opacity: 0.75; cursor: default; }
.velo .dlg-f .acc-apagado { position: relative; }
.velo .dlg-f .acc-apagado .b { opacity: 0.5; cursor: default; }
.velo .dlg-f .acc-apagado .acc-tip { left: auto; right: 0; }
.velo .dlg-f .acc-apagado .acc-tip::after { left: auto; right: 18px; }
.velo .acc-dh { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; }
.w-body .acc-av, .pagina .acc-av { max-width: 960px; }
"""

CSS_TEL = (CSS_COMUN.replace("@R@", "10px").replace("@RB@", "10px").replace("@LETRA@", "14px").replace("@LETRAB@", "15px")
           .replace("@LETRAP@", "13px").replace("@LETRAT@", "14px").replace("@LETRAC@", "15px").replace("@CABP@", "10px 12px")
           .replace("@BOTON@", "44px").replace("@COLK@", "112px").replace("@PLEGP@", "10px 12px").replace("@TIPL@", "12px")
           .replace("@ALTOA@", "44px").replace("@ALTOP@", "44px").replace("@ZONA@", "44px").replace("@CASILLA@", "22px")) + """
/* El teléfono: la acción de la tarjeta va abajo, entera; la pieza para elegir ocupa la pantalla (262). */
.acc-card .acc-pie { padding: 0 12px 12px; }
.acc-card .acc-pie a.cb { width: 100%; }
.acc-cb svg { width: 15px; height: 15px; }
.acc-area { padding-left: 0; gap: 0; }
.acc-area .nm { margin-left: 4px; margin-right: 6px; }
.acc-p { padding-left: 44px; gap: 11px; }
.acc-p .acc-tip { left: 34px; }
.ap-cmp .ct.acc-duda { border-color: oklch(0.72 0.15 70); box-shadow: inset 0 0 0 1px oklch(0.72 0.15 70); }
.ap-cmp .ct .acc-rev { margin-left: auto; margin-right: 6px; }
.acc-dudam { display: block; margin-top: 6px; color: var(--alerta); font-size: 14px; line-height: 1.4; }
.acc-hoja-av { margin-top: 2px; }
.acc-pk { position: absolute; z-index: 70; top: 44px; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background: #fff; }
.acc-pk .bar { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 8px 0 20px; border-bottom: 1px solid var(--borde); }
.acc-pk .bar h2 { flex: 1; margin: 0; font-size: 18px; font-weight: 700; color: var(--t1); }
.acc-pk .bar button { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t1); }
.acc-pk .op { position: relative; display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 8px 20px; border-bottom: 1px solid var(--borde); font-size: 16px; color: var(--t1); }
.acc-pk .op .n2 { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.acc-pk .op .d { color: var(--t2); font-size: 13px; line-height: 1.35; }
.acc-pk .op.apag, .acc-pk .op.apag .d { color: var(--t3); }
.acc-pk .op .acc-tip { left: 54px; }
.acc-pk .pie { margin-top: auto; padding: 12px 20px 34px; border-top: 1px solid var(--borde); }
.acc-pk .pie .cb { width: 100%; height: 48px; }
.ap-fijo .acc-apagado { position: relative; flex: 1; display: flex; }
.ap-fijo .acc-apagado .cb { flex: 1; opacity: 0.5; }
.ap-fijo .acc-apagado .acc-tip { left: auto; right: 0; }
.ap-fijo .acc-apagado .acc-tip::after { left: auto; right: 24px; }
.ap-hoja .acc-apagado { position: relative; display: flex; }
.ap-hoja .acc-apagado .cb { flex: 1; opacity: 0.5; }
.ap-hoja .acc-apagado .acc-tip { left: 0; }
.acc-tel-av { margin: 0 0 12px; }
"""

# ---------------------------------------------------------------------------------------------------------------- los datos
INVITA = "ana.lopez@delta.ejemplo.com"
# Los roles de la organización que ve quien pide, con lo que no puede dar apagado (0061): nombre, descripción, motivo.
ROLES_ORG = [
    ("Dueño", "Tiene todos los permisos de la organización.", "Tiene permisos que no tenés."),
    ("Administración de personas", "Invita y edita personas y roles.", None),
    ("Auditor", "Ve los usuarios y la auditoría. No cambia nada.", "Tiene permisos que no tenés."),
    ("Recursos humanos", "Invita, edita y da de baja usuarios.", None),
    ("Ventas", "Atiende a los clientes por WhatsApp.", None),
    ("Ventas mayoristas", "Atiende a los clientes mayoristas.", None),
]
ROLES_EMP = [
    ("Administrador", "Administra la empresa: sus miembros y sus roles.", "Tiene permisos que no tenés en Delta S.A."),
    ("Solo lectura", "Ve los miembros de la empresa. No cambia nada.", None),
]
MOTIVO_DUDA = "Hay dos roles parecidos: Ventas y Ventas mayoristas."
# El catálogo de la organización hasta esta etapa (sin Formularios, Respuestas ni Catálogos), con lo que tiene quien pide.
AREAS = [
    ("Usuarios", [("Ver usuarios", "Consultar la lista y la ficha de las personas de la organización."),
                  ("Invitar usuarios", "Enviar una invitación para sumarse a la organización."),
                  ("Administrar usuarios", "Editar, dar de baja, reactivar y quitar personas de la organización.")]),
    ("Roles", [("Ver roles", "Consultar los roles y los permisos que incluyen."), ("Administrar roles", "Crear, editar y borrar roles."),
               ("Asignar roles", "Asignar o quitar roles de las personas.")]),
    ("Empresas", [("Ver empresas", "Consultar las empresas de la organización."),
                  ("Administrar empresas", "Crear, editar y borrar empresas.")]),
    ("Configuración", [("Ver la configuración", "Consultar la configuración de la organización."),
                       ("Cambiar la configuración", "Editar la configuración de la organización.")]),
    ("Auditoría", [("Ver la auditoría", "Consultar el registro de auditoría de la organización.")]),
    ("Página pública", [("Administrar la página pública", "Editar y publicar la página pública de la organización.")]),
    ("Asistente", [("Usar el asistente", "Consultar el asistente con tus permisos."),
                   ("Configurar el asistente", "Configurar y consultar el uso del asistente de la organización.")]),
    ("WhatsApp", [("Atender clientes", "Ver y responder la bandeja de Clientes, y ver, editar e importar los contactos."),
                  ("Atender internos", "Ver y responder la bandeja de Internos."),
                  ("Mandar difusiones", "Crear, programar y cancelar difusiones a los contactos que aceptan promociones."),
                  ("Administrar WhatsApp", "Conectar números y configurar el bot, los equipos y las plantillas.")]),
]
TIENE = {"Ver usuarios", "Invitar usuarios", "Administrar usuarios", "Ver roles", "Administrar roles", "Asignar roles", "Ver empresas",
         "Usar el asistente", "Atender clientes"}
INCLUYE = {"Administrar usuarios": "Ver usuarios", "Administrar roles": "Ver roles", "Administrar empresas": "Ver empresas",
           "Cambiar la configuración": "Ver la configuración"}
NO_TENES = "No tenés este permiso."
NO_TENES_AREA = "Tiene permisos que no tenés."


# ---------------------------------------------------------------------------------------------------------------- la tarjeta
def destino(nombre, tel):
    return ("M-" if tel else "") + nombre + ".dc.html"


def revisa(valor):
    return f'{valor}<span class="acc-rev">{SVG_REV}Revisá</span>'


def tarjeta(nombre, boton, a, filas, tel, peligro=False):
    clase = "cb acc-pel" if peligro else "cb cb-pri"
    b = f'<a class="{clase}" href="{destino(a, tel)}">{boton}</a>'
    datos = "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in filas)
    if tel:
        return (f'<div class="acc-card" role="group" aria-label="{nombre}"><div class="cab"><b>{nombre}</b></div>'
                f'<div class="acc-datos">{datos}</div><div class="acc-pie">{b}</div></div>')
    return (f'<div class="acc-card" role="group" aria-label="{nombre}"><div class="cab"><b>{nombre}</b>{b}</div>'
            f'<div class="acc-datos">{datos}</div></div>')


def plegada(nombre, quien, estado, cola=""):
    q = f"<span>{quien}</span>" if quien else ""
    return f'<div class="acc-pleg" role="group" aria-label="{nombre}"><b>{nombre}</b>{q}<span class="etq">{estado}</span>{cola}</div>'


def enlace(texto, a, tel):
    return f'<a class="lnk" href="{destino(a, tel)}">{texto}</a>'


def motivo(texto):
    return f'<span class="acc-mot">{texto}</span>'


FILAS_INVITA = [("Correo", INVITA), ("Roles de la organización", "Ventas"), ("Empresa", "Delta S.A."), ("Roles en la empresa", "Solo lectura")]
FILAS_INVITA_DUDA = [("Correo", INVITA), ("Roles de la organización", revisa("Ventas")), ("Motivo", MOTIVO_DUDA), ("Empresa", "Delta S.A."),
                     ("Roles en la empresa", "Solo lectura")]
PIDE = {
    "invitar": "Invitá a Ana López, ana.lopez@delta.ejemplo.com, con el rol Ventas, y en Delta S.A. con Solo lectura.",
    "invitar-duda": "Invitá a ana.lopez@delta.ejemplo.com como vendedora, y en Delta S.A. que solo pueda ver.",
    "roles": "A Tomás Acosta sacale Recursos humanos y dale Ventas.",
    "quitar": "Quitá a Martín Paz de la organización.",
    "rol": "Creá un rol Coordinación que pueda administrar usuarios y ver las empresas.",
    "cambio-rol": "Al rol Ventas sumale Ver usuarios y sacale Ver empresas.",
    "baja-rol": "Dá de baja el rol Ventas mayoristas, ya no lo usamos.",
    "baja": "Dale a Diego Ríos el rol Recursos humanos.",
}
RESPONDE = {
    "invitar": "Te preparé la invitación. Revisala antes de mandarla.",
    "invitar-duda": "Te preparé la invitación. Revisá el rol de la organización: hay dos parecidos.",
    "roles": "Te preparé el cambio de roles de Tomás Acosta. Lo revisás en su ficha antes de guardar.",
    "quitar": "Te preparé quitar a Martín Paz. Se confirma desde su ficha.",
    "rol": "Te preparé el rol nuevo. Revisá sus permisos en el editor antes de crearlo.",
    "cambio-rol": "Te preparé el cambio del rol Ventas. Lo revisás en el editor antes de guardar.",
    "baja-rol": "Te preparé dar de baja el rol Ventas mayoristas. Se confirma desde Roles.",
    "baja": "Te preparé el cambio de roles de Diego Ríos.",
}


def estados_inicio(tel):
    """(estado, título de la conversación, turnos): cada turno es (lo que pidió, lo que contestó la IA, la tarjeta)."""
    T = lambda *a, **k: tarjeta(*a, tel=tel, **k)
    E = lambda texto, a: enlace(texto, a, tel)
    inv = T("Invitación de usuario", "Revisar e invitar", "Usuarios-Invitar-Propuesta", FILAS_INVITA)
    roles = T("Cambio de roles", "Revisar cambios", "Usuario-Propuesta",
              [("Persona", "Tomás Acosta"), ("Se suma en la organización", "Ventas"), ("Se quita en la organización", "Recursos humanos")])
    quitar = T("Quitar de la organización", "Revisar y quitar", "Confirmar-Propuesta",
               [("Persona", "Martín Paz"), ("Correo", "martin.paz@delta.ejemplo.com")], peligro=True)
    rol = T("Rol nuevo", "Revisar y crear", "Rol-Propuesta",
            [("Nombre", "Coordinación"), ("Descripción", "Coordina a las personas de cada equipo."), ("Vale en", "Toda la organización"),
             ("Permisos", "Administrar usuarios, Ver empresas")])
    cambio = T("Cambio de rol", "Revisar cambios", "Rol-Propuesta",
               [("Rol", "Ventas"), ("Se suma", "Ver usuarios"), ("Se quita", "Ver empresas")])
    baja = T("Baja de rol", "Revisar y dar de baja", "Confirmar-Propuesta", [("Rol", "Ventas mayoristas")], peligro=True)
    t = lambda clave, tarjeta_: (PIDE[clave], RESPONDE[clave], tarjeta_)
    return [
        ("Invitación de usuario", "Invitar a Ana López", [t("invitar", inv)]),
        ("Invitación con «Revisá»", "Invitar a Ana López",
         [t("invitar-duda", T("Invitación de usuario", "Revisar e invitar", "Usuarios-Invitar-Propuesta", FILAS_INVITA_DUDA))]),
        ("Cambio de roles", "Los roles de Tomás", [t("roles", roles)]),
        ("Quitar de la organización", "Quitar a Martín Paz", [t("quitar", quitar)]),
        ("Rol nuevo", "Un rol para coordinar", [t("rol", rol)]),
        ("Cambio de rol", "Los permisos de Ventas", [t("cambio-rol", cambio)]),
        ("Baja de rol", "Baja de Ventas mayoristas", [t("baja-rol", baja)]),
        ("Reemplazada", "Invitar a Ana López",
         [("Invitá a ana.lopez@delta.ejemplo.com con el rol Ventas.", "Te preparé la invitación.",
           plegada("Invitación de usuario", INVITA, "Reemplazada")),
          ("Mejor dale Ventas mayoristas.", "Te preparé otra con Ventas mayoristas. Reemplaza a la anterior.",
           T("Invitación de usuario", "Revisar e invitar", "Usuarios-Invitar-Propuesta",
             [("Correo", INVITA), ("Roles de la organización", "Ventas mayoristas")]))]),
        ("Ya no disponible: sin el permiso", "Los roles de Tomás",
         [t("roles", plegada("Cambio de roles", "Tomás Acosta", "Ya no disponible",
                             motivo("Ya no tenés el permiso «Administrar usuarios».")))]),
        ("Ya no disponible: ya no está", "Quitar a Martín Paz",
         [t("quitar", plegada("Quitar de la organización", None, "Ya no disponible",
                              motivo("La persona ya no está en la organización.")))]),
        ("Ya no disponible: la cuenta se dio de baja", "Los roles de Diego",
         [t("baja", plegada("Cambio de roles", None, "Ya no disponible", motivo("La cuenta de esa persona se dio de baja.")))]),
        ("Ya no disponible: de otra versión", "Un rol para coordinar",
         [t("rol", plegada("Rol nuevo", None, "Ya no disponible", motivo("Es de una versión anterior. Pedila de nuevo.")))]),
        ("Invitación enviada", "Invitar a Ana López",
         [t("invitar", plegada("Invitación de usuario", INVITA, "Invitación enviada", E("Ver en Usuarios", "Usuarios")))]),
        ("Roles cambiados", "Los roles de Tomás",
         [t("roles", plegada("Cambio de roles", "Tomás Acosta", "Roles cambiados", E("Ver la ficha", "Usuario")))]),
        ("Quitado", "Quitar a Martín Paz", [t("quitar", plegada("Quitar de la organización", None, "Quitado"))]),
        ("Rol creado", "Un rol para coordinar", [t("rol", plegada("Rol nuevo", "Coordinación", "Rol creado", E("Ver el rol", "Rol")))]),
        ("Rol cambiado", "Los permisos de Ventas",
         [t("cambio-rol", plegada("Cambio de rol", "Ventas", "Rol cambiado", E("Ver el rol", "Rol")))]),
        ("Rol dado de baja", "Baja de Ventas mayoristas", [t("baja-rol", plegada("Baja de rol", None, "Rol dado de baja"))]),
        ("Sin confirmar", "Invitar a Ana López",
         [t("invitar", plegada("Invitación de usuario", INVITA, "Sin confirmar", E("Revisar en Usuarios", "Usuarios")))]),
    ]


def turnos_html(turnos, av):
    return "".join(f'<div class="as-yo"><span class="as-burb">{yo}</span></div><div class="as-el">{av}<div class="as-cont">'
                   f'<div class="as-md"><p>{ia}</p></div>{card}</div></div>' for yo, ia, card in turnos)


# ---------------------------------------------------------------------------------------------------------------- el Inicio
def inicio_compu():
    """El marco del Inicio de la compu, sin la conversación: (antes, después del hilo, el ícono de la IA, la caja de abajo)."""
    t = marco(copia("inicio"))
    t, n = re.subn(r'href="Campana-25\.dc\.html" aria-label="Avisos: \d+">(.*?)<span class="n">\d+</span>',
                   r'href="Campana.dc.html" aria-label="Avisos: 1">\1<span class="n">1</span>', t, count=1, flags=re.S)
    assert n == 1
    a = t.index('<section class="as-chat" aria-label="Asistente">') + len('<section class="as-chat" aria-label="Asistente">')
    b = t.index("</section>", a)
    chat = t[a:b]
    av = re.search(r'<span class="as-av">.*?</span>', chat, re.S).group(0)
    pie = chat[chat.index('<div class="as-pie">'):]
    t = t[:a] + "@CHAT@" + t[b:]
    t = una_vez(t, "</main>", "@VELO@</main>")
    return t, av, pie


CONV_ACTIVA = ('<div class="as-it "><button type="button" class="as-it-n">Un formulario para los remitos</button><span class="envoltura">'
               '<button type="button" class="as-keb" aria-haspopup="menu" aria-expanded="false" aria-label="Acciones de Invitaciones vencidas">')


def conv_activa(titulos):
    nombre = por_estado(titulos) if isinstance(titulos, list) else titulos
    return (f'<div class="as-it on"><button type="button" class="as-it-n">{nombre}</button><span class="envoltura">'
            '<button type="button" class="as-keb" aria-haspopup="menu" aria-expanded="false" aria-label="Acciones de la conversación">')


def asistente_org_acciones():
    t, av, pie = inicio_compu()
    estados = estados_inicio(False)
    t = una_vez(t, CONV_ACTIVA, conv_activa([e[1] for e in estados]))
    hilos = [f'<div class="as-hilo"><div class="as-col">{turnos_html(e[2], av)}</div></div>{pie}' for e in estados]
    t = t.replace("@CHAT@", por_estado(hilos)).replace("@VELO@", "")
    return tablero("Asistente-Org-25", "Asistente · inicio de la organización · acciones del asistente", CSS_COMPU, t,
                   [e[0] for e in estados], 1440, 900)


def inicio_tel():
    t = marco(copia("m_inicio"))
    a = t.index('<div class="as-tcuerpo">')
    b = fin_div(t, a)
    av = re.search(r'<span class="as-av">.*?</span>', t[a:b], re.S).group(0)
    t = t[:a] + "@CHAT@" + t[b:]
    t = una_vez(t, '<span class="ap-raya"></span></div>', '@VELO@<span class="ap-raya"></span></div>')
    return t, av


def m_asistente_org_acciones():
    t, av = inicio_tel()
    estados = estados_inicio(True)
    hilos = [f'<div class="as-tcuerpo"><div class="as-col">{turnos_html(e[2], av)}</div></div>' for e in estados]
    t = t.replace("@CHAT@", por_estado(hilos)).replace("@VELO@", "")
    return tablero("M-Asistente-Org", "Asistente · teléfono · acciones del asistente", CSS_TEL, t, [e[0] for e in estados], 390, 844)


# ---------------------------------------------------------------------------------------------------------------- Invitar usuario
INV_ESTADOS = ["Propuesta del asistente", "Roles de la organización: lo que no podés dar", "Roles en la empresa: lo que no podés dar",
               "Invitando", "Ya se guardó"]


def opciones_compu(roles, elegidos, tip_en):
    filas = []
    for n, d, mot in roles:
        on = n in elegidos
        tip = f'<span class="acc-tip" role="tooltip">{mot}</span>' if mot and n == tip_en else ""
        filas.append(f'<label class="op2{" acc-apag" if mot else ""}"{AD if mot else ""}>'
                     f'<input type="checkbox"{" checked" if on else ""}{" disabled" if mot else ""}>'
                     f'<span><span class="opn">{n}</span><span class="opd">{d}</span></span>{tip}</label>')
    return (f'<div class="menu lista acc-lista" role="listbox" aria-multiselectable="true" style="top: 60px;">{"".join(filas)}</div>')


def campo_elegir(et, valor, ancho=False, duda=None, lista=None):
    clase = "campo2 envoltura" + (" ancho" if ancho else "")
    marca = f'<span class="acc-rev">{SVG_REV}Revisá</span>' if duda else ""
    html = (f'<div class="{clase}"><span class="et">{et}</span><button type="button" class="in2{" acc-duda" if duda else ""}" '
            f'aria-haspopup="listbox" aria-expanded="{"true" if lista else "false"}"><span class="val">{valor}</span>{marca}{SVG_FLECHA}</button>')
    if lista:
        html += lista
    if duda:
        html += f'<span class="acc-dudam">{duda}</span>'
    return html + "</div>"


def dialogo_invitar(estado):
    lista_org = opciones_compu(ROLES_ORG, {"Ventas"}, "Auditor") if estado == INV_ESTADOS[1] else None
    lista_emp = opciones_compu(ROLES_EMP, {"Solo lectura"}, "Administrador") if estado == INV_ESTADOS[2] else None
    guardo = estado == "Ya se guardó"
    arriba = f'<div class="acc-av ok acc-dlg-av" role="status">{SVG_OK}<span>Ya se guardó.</span></div>' if guardo else ""
    aviso = f'<div class="acc-av acc-dlg-av">{SVG_I}<span>Se le manda la invitación por correo.</span></div>' if not guardo else ""
    cuerpo = (arriba
              + '<div class="campo2 ancho"><label class="et" for="acc-correo">Correo<span class="req" aria-hidden="true">*</span></label>'
              f'<input class="in2" id="acc-correo" type="email" autocomplete="off" value="{INVITA}"></div>'
              + campo_elegir("Roles de la organización", "Ventas", ancho=True, duda=None if guardo else MOTIVO_DUDA, lista=lista_org)
              + campo_elegir("Empresa", "Delta S.A.")
              + campo_elegir("Roles en la empresa", "Solo lectura", lista=lista_emp)
              + aviso)
    if guardo:
        pie = ('<button type="button" class="b b-sec">Cerrar</button>'
               '<a class="b b-pri" href="Usuarios.dc.html" style="text-decoration: none;">Ver en Usuarios</a>')
    elif estado == "Invitando":
        pie = (f'<button type="button" class="b b-sec" disabled>Cancelar</button>'
               f'<button type="button" class="b b-pri" aria-disabled="true">{ARO}Invitando…</button>')
    else:
        pie = '<button type="button" class="b b-sec">Cancelar</button><button type="button" class="b b-pri">Invitar</button>'
    return ('<div class="velo"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="acc-dt">'
            f'<div class="dlg-h"><div class="acc-dh"><h2 id="acc-dt">Invitar usuario</h2><span class="acc-prop">@SPARK@Propuesta del asistente</span></div>'
            f'<button type="button" class="dlg-x" aria-label="Cerrar">{SVG_X}</button></div>'
            f'<div class="dlg-b">{cuerpo}</div><div class="dlg-f">{pie}</div></div></div>')


def spark(av):
    return re.search(r"<svg.*?</svg>", av, re.S).group(0)


def usuarios_invitar_propuesta():
    t, av, pie = inicio_compu()
    estados = estados_inicio(False)
    e = next(x for x in estados if x[0] == "Invitación con «Revisá»")
    t = una_vez(t, CONV_ACTIVA, conv_activa(e[1]))
    t = t.replace("@CHAT@", f'<div class="as-hilo"><div class="as-col">{turnos_html(e[2], av)}</div></div>{pie}')
    t = t.replace("@VELO@", por_estado([dialogo_invitar(x) for x in INV_ESTADOS]).replace("@SPARK@", spark(av)))
    return tablero("Asistente-Org-25", "Invitar usuario · propuesta del asistente, sobre el Inicio · para aprobar", CSS_COMPU, t,
                   INV_ESTADOS, 1440, 900)


M_INV_ESTADOS = ["Propuesta del asistente", "Roles de la organización: lo que no podés dar", "Invitando", "Ya se guardó"]


def picker_tel(titulo, roles, elegidos, tip_en):
    filas = []
    for n, d, mot in roles:
        on = n in elegidos
        caja = f'<span class="acc-cb{" lleno" if on else ""}{" apag" if mot else ""}">{SVG_TILDE if on else ""}</span>'
        tip = f'<span class="acc-tip" role="tooltip">{mot}</span>' if mot and n == tip_en else ""
        filas.append(f'<div class="op{" apag" if mot else ""}" role="option" aria-selected="{"true" if on else "false"}"'
                     f'{AD if mot else ""}>{caja}<span class="n2"><span>{n}</span><span class="d">{d}</span></span>{tip}</div>')
    return (f'<div class="acc-pk" role="dialog" aria-label="{titulo}"><div class="bar"><h2>{titulo}</h2>'
            f'<button type="button" aria-label="Cerrar">{SVG_X}</button></div><div role="listbox" aria-multiselectable="true">{"".join(filas)}</div>'
            f'<div class="pie"><button type="button" class="cb cb-pri">Listo ({len(elegidos)})</button></div></div>')


def hoja_invitar(estado, spark_svg):
    guardo = estado == "Ya se guardó"
    cmp = lambda et, valor, extra="", duda=None: (
        f'<div class="ap-cmp"><span class="rt"><span>{et}</span></span><div class="ct{" acc-duda" if duda else ""}">{valor}{extra}'
        f'{SVG_CHEV}</div>{DUDAM.format(duda) if duda else ""}</div>')
    duda = None if guardo else MOTIVO_DUDA
    marca = "" if guardo else f'<span class="acc-rev">{SVG_REV}Revisá</span>'
    arriba = f'<div class="acc-av ok acc-hoja-av" role="status">{SVG_OK}<span>Ya se guardó.</span></div>' if guardo else ""
    aviso = "" if guardo else f'<div class="acc-av acc-hoja-av">{SVG_I}<span>Se le manda la invitación por correo.</span></div>'
    cuerpo = (arriba + f'<div class="ap-cmp"><span class="rt"><span>Correo <span class="rq">*</span></span></span><div class="ct">{INVITA}</div></div>'
              + cmp("Roles de la organización", "Ventas", marca, duda) + cmp("Empresa", "Delta S.A.") + cmp("Roles en la empresa", "Solo lectura")
              + aviso)
    if guardo:
        pie = '<button type="button" class="cb cb-sec">Cerrar</button><a class="cb cb-pri" href="M-Usuarios.dc.html">Ver en Usuarios</a>'
    elif estado == "Invitando":
        pie = f'<button type="button" class="cb cb-sec" disabled>Cancelar</button><button type="button" class="cb cb-pri" aria-disabled="true">{ARO}Invitando…</button>'
    else:
        pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Invitar</button>'
    hoja = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Invitar usuario"><span class="asa"></span>'
            f'<div class="hc"><div class="acc-tit"><h2>Invitar usuario</h2><span class="acc-prop">{spark_svg}Propuesta del asistente</span></div>'
            f'<button type="button" class="ap-ib" aria-label="Cerrar">{SVG_X}</button></div><div class="hb">{cuerpo}</div><div class="hp">{pie}</div></div>')
    if estado == M_INV_ESTADOS[1]:
        hoja += picker_tel("Roles de la organización", ROLES_ORG, {"Ventas"}, "Auditor")
    return hoja


def m_usuarios_invitar_propuesta():
    t, av = inicio_tel()
    estados = estados_inicio(True)
    e = next(x for x in estados if x[0] == "Invitación con «Revisá»")
    t = t.replace("@CHAT@", f'<div class="as-tcuerpo"><div class="as-col">{turnos_html(e[2], av)}</div></div>')
    t = t.replace("@VELO@", por_estado([hoja_invitar(x, spark(av)) for x in M_INV_ESTADOS]))
    return tablero("M-Asistente-Org", "Invitar usuario · propuesta del asistente · teléfono · para aprobar", CSS_TEL, t, M_INV_ESTADOS,
                   390, 844)


# ---------------------------------------------------------------------------------------------------------------- la ficha
def tabla_cambia(columnas, filas, anchos):
    cab = "".join(f"<span>{c}</span>" for c in columnas)
    cuerpo = "".join('<div class="f" role="row">' + "".join(f'<span{NADA if v == "—" else ""}>{v}</span>' for v in f) + "</div>"
                     for f in filas)
    return (f'<div class="w-caja o-abre acc-cambia"><div class="w-cab"><span>Lo que cambia</span></div>'
            f'<div class="acc-tabla" role="table" aria-label="Lo que cambia" style="--acc-cols: {anchos};"><div class="f h" role="row">{cab}</div>{cuerpo}</div></div>')


def prop_junto(t, h1, spark_svg, compu=True):
    viejo = f"<h1>{h1}</h1>"
    return una_vez(t, viejo, f'<div class="acc-tit">{viejo}<span class="acc-prop">{spark_svg}Propuesta del asistente</span></div>')


def ficha_compu(nombre="Tomás Acosta", correo="tomas.acosta@delta.ejemplo.com", desde="03/02/2026"):
    t = marco(copia("usuario"))
    if nombre != "Tomás Acosta":
        t = t.replace("Tomás Acosta", nombre).replace("tomas.acosta@delta.ejemplo.com", correo).replace("desde el 03/02/2026", f"desde el {desde}")
    a = t.index('<div class="w-bnd">')
    b = fin_div(t, t.index('<div class="w-body">'))
    return t[:a] + "@CONTENIDO@" + t[b:], t[a:b]


SPARK = None  # el ícono de la IA, el mismo del hilo


def usuario_propuesta():
    t, contenido = ficha_compu()
    contenido = prop_junto(contenido, "Tomás Acosta", SPARK)
    contenido = una_vez(contenido, '<span class="val vacio2">Ninguno</span>', '<span class="val ">Ventas</span>')
    contenido = una_vez(contenido, '<button type="button" class="cb cb-pri" disabled="">Guardar cambios</button>',
                        '<button type="button" class="cb cb-pri">Guardar cambios</button>')
    cuerpo_i = contenido.index('<div class="w-body">') + len('<div class="w-body">')
    cols = "220px minmax(0, 1fr) minmax(0, 1fr)"
    cambia = tabla_cambia(["Dónde", "Se suma", "Se quita"], [["Organización", "Ventas", "Recursos humanos"]], cols)
    cambia_ahora = tabla_cambia(["Dónde", "Se suma", "Se quita"], [["Organización", "—", "Recursos humanos"]], cols)
    franja = f'<div class="acc-av aten" role="status">{SVG_ATEN}<span>Tomás Acosta cambió desde la propuesta.</span></div>'
    estados = ["Lo que cambia", "Cambió desde la propuesta"]
    cuerpos = [contenido[:cuerpo_i] + cambia + contenido[cuerpo_i:], contenido[:cuerpo_i] + franja + cambia_ahora + contenido[cuerpo_i:]]
    return tablero("Usuario", "Editar usuario · propuesta del asistente · /org/usuarios/:id · para aprobar", CSS_COMPU,
                   t.replace("@CONTENIDO@", por_estado(cuerpos)), estados, 1440, 900)


def m_usuario_propuesta():
    t = marco(copia("m_usuario"))
    t = una_vez(t, '<span class="sub">tomas.acosta@delta.ejemplo.com</span>', f'<span class="sub acc-prop">{SPARK}Propuesta del asistente</span>')
    t = una_vez(t, "<b>Roles de la organización</b><span>Ninguno</span>", "<b>Roles de la organización</b><span>Ventas</span>")
    t = una_vez(t, '<button type="button" class="cb cb-pri full apag">Guardar cambios</button>',
                '<button type="button" class="cb cb-pri full">Guardar cambios</button>')
    a = t.index('<div class="ap-cuerpo ap-gris">') + len('<div class="ap-cuerpo ap-gris">')
    fila = lambda k, v: f'<div class="ap-it "><span class="tx"><b>{k}</b><span>{v}</span></span></div>'
    cambia = ('<span class="ap-gtit">Lo que cambia</span><div class="ap-grupo">'
              + fila("Se suma en la organización", "Ventas") + fila("Se quita en la organización", "Recursos humanos") + "</div>")
    cambia_ahora = ('<span class="ap-gtit">Lo que cambia</span><div class="ap-grupo">' + fila("Se quita en la organización", "Recursos humanos") + "</div>")
    franja = f'<div class="acc-av aten acc-tel-av" role="status">{SVG_ATEN}<span>Tomás Acosta cambió desde la propuesta.</span></div>'
    t = t[:a] + por_estado([cambia, franja + cambia_ahora]) + t[a:]
    return tablero("M-Usuario", "Editar usuario · propuesta del asistente · teléfono · para aprobar", CSS_TEL, t,
                   ["Lo que cambia", "Cambió desde la propuesta"], 390, 844)


# ---------------------------------------------------------------------------------------------------------------- el rol
def caja(estado):
    """La casilla dibujada: `vacia`, `lleno` o `parcial`, apagada o no."""
    forma, apagada = estado
    icono = SVG_TILDE if forma == "lleno" else SVG_MENOS if forma == "parcial" else ""
    clase = "acc-cb" + ("" if forma == "vacia" else f" {forma}") + (" apag" if apagada else "")
    return f'<span class="{clase}" aria-hidden="true">{icono}</span>'


def permisos(marcados, abiertas, tip=None, aria="Permisos"):
    """Las áreas plegables (260) con lo `marcados`, abiertas las de `abiertas`. `tip` = (permiso, motivo) muestra ese tooltip."""
    filas = ['<div class="ph" role="row"><span role="columnheader">Permiso</span></div>']
    for area, lista in AREAS:
        nombres = [p for p, _ in lista]
        incluidos = {INCLUYE[p] for p in nombres if p in marcados and p in INCLUYE}
        hay = [p for p in nombres if p in marcados or p in incluidos]
        forma = "lleno" if len(hay) == len(nombres) else "parcial" if hay else "vacia"
        apag_area = any(p not in TIENE for p in nombres)
        abierta = area in abiertas
        ayuda = "&#10;".join(f"{p} — {d}" for p, d in lista)
        tip_area = (f'<span class="acc-tip acc-zc-tip" role="tooltip">{NO_TENES_AREA}</span>'
                    if tip and tip[0] == area else "")
        filas.append(f'<div class="acc-area{"" if abierta else " cerrada"}{" apag" if apag_area else ""}" role="row">'
                     f'<button type="button" class="fl" aria-expanded="{"true" if abierta else "false"}" aria-label="{area}">{SVG_CHEV}</button>'
                     f'<span class="zc" role="checkbox" aria-checked="{"true" if forma == "lleno" else "mixed" if forma == "parcial" else "false"}"'
                     f'{AD if apag_area else ""} aria-label="Todos los permisos de {area}">{caja((forma, apag_area))}{tip_area}</span>'
                     f'<span class="nm">{area}</span><span class="i" tabindex="0" role="img" aria-label="{ayuda}" title="{ayuda}">{SVG_I}</span></div>')
        if not abierta:
            continue
        for p in nombres:
            on = p in marcados or p in incluidos
            quien = next((k for k, v in INCLUYE.items() if v == p and k in marcados), None)
            mot = f"Lo incluye «{quien}»." if quien else NO_TENES if p not in TIENE else None
            t = f'<span class="acc-tip" role="tooltip">{mot}</span>' if tip and tip[0] == p else ""
            filas.append(f'<div class="acc-p{" apag" if mot else ""}" role="row"><span role="checkbox" aria-checked="{"true" if on else "false"}"'
                         f'{AD if mot else ""} style="display: inline-flex;">{caja(("lleno" if on else "vacia", bool(mot)))}</span>'
                         f'<span>{p}</span>{t}</div>')
    return f'<div class="acc-perm" role="table" aria-label="{aria}">{"".join(filas)}</div>'


NUEVO = {"Administrar usuarios", "Ver empresas"}
NUEVO_ABIERTAS = {"Usuarios", "Empresas"}
VENTAS_ANTES = {"Ver empresas", "Atender clientes"}
VENTAS = {"Ver usuarios", "Atender clientes"}
VENTAS_ABIERTAS = {"Usuarios", "Empresas", "WhatsApp"}
ROL_ESTADOS = ["Rol nuevo propuesto", "Rol nuevo: lo incluido", "Rol nuevo: lo que no tenés", "Cambio de permisos", "Cambió desde la propuesta"]


def rol_contenido(base):
    t = marco(copia(base))
    a = t.index('<div class="w-bnd">')
    b = fin_div(t, t.index('<div class="w-body"'))
    return t[:a] + "@CONTENIDO@" + t[b:], t[a:b]


def sin_matriz(contenido, nuevo):
    i = contenido.index('<div class="w-caja r212-caja">')
    j = fin_div(contenido, i)
    return contenido[:i] + nuevo + contenido[j:]


def rol_propuesta():
    marco_crear, crear = rol_contenido("rol_crear")
    crear = prop_junto(crear, "Crear un rol", SPARK)
    crear = una_vez(crear, 'aria-label="Nombre" value=""', 'aria-label="Nombre" value="Coordinación"')
    crear = una_vez(crear, '<span class="val vacio2">Elegí dónde vale</span>', '<span class="val ">Toda la organización</span>')
    crear = una_vez(crear, '<textarea class="ct area" aria-label="Descripción"></textarea>',
                    '<textarea class="ct area" aria-label="Descripción">Coordina a las personas de cada equipo.</textarea>')
    _, editar = rol_contenido("rol_editar")
    editar = editar.replace("Recursos humanos", "Ventas").replace("Invita, edita y da de baja usuarios.", "Atiende a los clientes por WhatsApp.")
    editar = una_vez(editar, "0 usuarios lo tienen", "3 usuarios lo tienen")
    editar = prop_junto(editar, "Ventas", SPARK)
    editar = una_vez(editar, '<button type="button" class="cb cb-pri" disabled="">Guardar cambios</button>',
                     '<button type="button" class="cb cb-pri">Guardar cambios</button>')
    cols = "minmax(0, 1fr) minmax(0, 1fr)"
    franja = f'<div class="acc-av aten" role="status">{SVG_ATEN}<span>El rol Ventas cambió desde la propuesta.</span></div>'
    cuerpo_i = editar.index('<div class="w-body" style="overflow: auto;">') + len('<div class="w-body" style="overflow: auto;">')
    cambio = sin_matriz(editar, permisos(VENTAS, VENTAS_ABIERTAS))
    cambio = cambio[:cuerpo_i] + tabla_cambia(["Se suma", "Se quita"], [["Ver usuarios", "Ver empresas"]], cols) + cambio[cuerpo_i:]
    # Desde la propuesta, otra persona ya le quitó «Ver empresas»: lo que cambia se cuenta sobre lo de ahora.
    ahora = sin_matriz(editar, permisos(VENTAS, {"Usuarios", "WhatsApp"}))
    ahora = ahora[:cuerpo_i] + franja + tabla_cambia(["Se suma", "Se quita"], [["Ver usuarios", "—"]], cols) + ahora[cuerpo_i:]
    cuerpos = [sin_matriz(crear, permisos(NUEVO, NUEVO_ABIERTAS)),
               sin_matriz(crear, permisos(NUEVO, NUEVO_ABIERTAS, tip=("Ver usuarios",))),
               sin_matriz(crear, permisos(NUEVO, NUEVO_ABIERTAS, tip=("Administrar empresas",))),
               cambio, ahora]
    # El marco de «Crear un rol» con la ruta de cada uno: el de cambiar, con el nombre del rol
    ruta_crear = "Inicio / Gestión de usuarios / Roles y permisos / Crear un rol"
    assert ruta_crear in marco_crear
    marco_t = marco_crear.replace(ruta_crear, "Inicio / Gestión de usuarios / Roles y permisos / "
                                  + por_estado(["Crear un rol", "Crear un rol", "Crear un rol", "Ventas", "Ventas"]))
    return tablero("Rol", "Rol · propuesta del asistente, con los permisos en áreas plegables · para aprobar", CSS_COMPU,
                   marco_t.replace("@CONTENIDO@", por_estado(cuerpos)), ROL_ESTADOS, 1440, 900)


M_ROL_ESTADOS = ["Rol nuevo propuesto", "Rol nuevo: lo incluido", "Cambio de permisos", "Cambió desde la propuesta"]


def m_rol_propuesta():
    crear = marco(copia("m_rol_crear"))
    crear = una_vez(crear, '<span class="sub">Administración</span>', f'<span class="sub acc-prop">{SPARK}Propuesta del asistente</span>')
    crear = una_vez(crear, '<span>Nombre <span class="rq">*</span></span></span><div class="ct"></div>',
                    '<span>Nombre <span class="rq">*</span></span></span><div class="ct">Coordinación</div>')
    crear = una_vez(crear, f'<div class="ct ph sel">Elegí dónde vale', '<div class="ct sel">Toda la organización')
    crear = una_vez(crear, '<div class="ct area"></div>', '<div class="ct area">Coordina a las personas de cada equipo.</div>')
    i = crear.index('<div class="ap-grupo ap-sin-vale"')
    j = fin_div(crear, i)
    crear_a, crear_b = crear[:i], crear[j:]
    editar = marco(copia("m_rol_editar"))
    editar = editar.replace("Recursos humanos", "Ventas").replace("Invita, edita y da de baja usuarios.", "Atiende a los clientes por WhatsApp.")
    editar = una_vez(editar, '<span class="sub">Vale en toda la organización · 0 usuarios lo tienen</span>',
                     f'<span class="sub acc-prop">{SPARK}Propuesta del asistente</span>')
    editar = una_vez(editar, '<button type="button" class="cb cb-pri full apag">Guardar cambios</button>',
                     '<button type="button" class="cb cb-pri full">Guardar cambios</button>')
    i = editar.index('<div class="r212t marco"')
    j = fin_div(editar, i)
    ed_a, ed_b = editar[:i], editar[j:]
    k = ed_a.index('<div class="ap-cuerpo"')
    k = ed_a.index(">", k) + 1
    fila = lambda kk, v: f'<div class="ap-it "><span class="tx"><b>{kk}</b><span>{v}</span></span></div>'
    cambia = ('<span class="ap-gtit" style="margin: 6px 0 -6px;">Lo que cambia</span><div class="ap-grupo" style="margin: 0;">'
              + fila("Se suma", "Ver usuarios") + fila("Se quita", "Ver empresas") + "</div>")
    cambia_ahora = ('<span class="ap-gtit" style="margin: 6px 0 -6px;">Lo que cambia</span><div class="ap-grupo" style="margin: 0;">'
                    + fila("Se suma", "Ver usuarios") + "</div>")
    franja = f'<div class="acc-av aten" role="status" style="margin-top: 4px;">{SVG_ATEN}<span>El rol Ventas cambió desde la propuesta.</span></div>'
    cuerpos = [crear_a + permisos(NUEVO, NUEVO_ABIERTAS) + crear_b,
               crear_a + permisos(NUEVO, NUEVO_ABIERTAS, tip=("Ver usuarios",)) + crear_b,
               ed_a[:k] + cambia + ed_a[k:] + permisos(VENTAS, VENTAS_ABIERTAS) + ed_b,
               ed_a[:k] + franja + cambia_ahora + ed_a[k:] + permisos(VENTAS, {"Usuarios", "WhatsApp"}) + ed_b]
    # Cada estado es la pantalla entera del teléfono: el marco de la app no cambia entre una y otra
    plantilla = por_estado(cuerpos)
    return tablero("M-Rol", "Rol · propuesta del asistente · teléfono · para aprobar", CSS_TEL, plantilla, M_ROL_ESTADOS, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- confirmar
CONF_ESTADOS = ["Quitar a Martín Paz", "Dar de baja el rol Ventas mayoristas", "Dar de baja: el rol ya tiene personas"]
TEXTO_QUITAR = ("Deja de entrar a Grupo Delta y a sus empresas, y pierde sus roles. Sus correos de delta.ejemplo.com dejan de servirle "
                "para ingresar; se lo avisamos por sus otros métodos de ingreso. Su cuenta y su perfil personal siguen funcionando.")
TEXTO_BAJA_ROL = "Deja de aparecer para asignar. Nadie lo tiene, así que no le cambia nada a ningún usuario."
MOTIVO_CON_PERSONAS = "Lo tienen 2 usuarios. Quitáselo primero."


def confirmacion(titulo, texto, boton, peligro=True, apagado=None):
    b = f'<button type="button" class="b {"b-pel" if peligro else "b-pri"}">{boton}</button>'
    if apagado:
        b = (f'<span class="acc-apagado"><button type="button" class="b {"b-pel" if peligro else "b-pri"}" aria-disabled="true">{boton}</button>'
             f'<span class="acc-tip" role="tooltip">{apagado}</span></span>')
    return ('<div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" aria-labelledby="acc-ct">'
            f'<div class="dlg-h"><div class="acc-dh"><h2 id="acc-ct">{titulo}</h2><span class="acc-prop">{SPARK}Propuesta del asistente</span></div></div>'
            f'<div class="dlg-t">{texto}</div><div class="dlg-f"><button type="button" class="b b-sec" autofocus>Cancelar</button>{b}</div></div></div>')


FILA_ROL = ('<div class="tt-f" style="grid-template-columns: minmax(0px, 1.3fr) 140px minmax(0px, 1.2fr) 100px 100px 28px;">'
            '<a class="c1" href="Rol.dc.html">@N@</a><span class="c1 n">Personalizado</span><span class="c1 n">Toda la organización</span>'
            '<span class="num">@U@</span><span class="num">@P@</span><span class="der envoltura">'
            '<button type="button" class="kebab" aria-haspopup="menu" aria-expanded="false" aria-label="Acciones de @N@">@KEB@</button></span></div>')


def roles_compu(usuarios_mayoristas):
    t = marco(copia("roles"))
    keb = svg_de(t, 'aria-label="Acciones de Auditor"')
    i = t.index('<a class="c1" href="Rol.dc.html">Administrador</a>')
    i = t.rindex('<div class="tt-f"', 0, i)
    nuevas = "".join(FILA_ROL.replace("@N@", n).replace("@U@", u).replace("@P@", p).replace("@KEB@", keb)
                     for n, u, p in (("Administración de personas", "1", "9"), ("Ventas", "3", "2"), ("Ventas mayoristas", usuarios_mayoristas, "2")))
    t = t[:i] + nuevas + "\n            " + t[i:]
    t = una_vez(t, "7 roles · 3 de la organización · 4 de empresas", "10 roles · 6 de la organización · 4 de empresas")
    t = una_vez(t, "<span>1–7 de 7</span>", "<span>1–10 de 10</span>")
    return t


def confirmar_propuesta():
    t, contenido = ficha_compu("Martín Paz", "martin.paz@delta.ejemplo.com", "10/03/2026")
    ficha = t.replace("@CONTENIDO@", contenido)
    quitar = una_vez(ficha, "</div>\n", "</div>\n") if False else ficha
    # La confirmación de siempre, sobre la ficha: va al final del marco, como el diálogo de la ficha
    quitar = quitar[:quitar.rindex("</div>")] + confirmacion("¿Quitar a Martín Paz de Grupo Delta?", TEXTO_QUITAR, "Quitar") + "</div>"
    roles = roles_compu("0")
    borrar = roles.replace("</main>", confirmacion("¿Dar de baja el rol Ventas mayoristas?", TEXTO_BAJA_ROL, "Dar de baja", peligro=False) + "</main>", 1)
    con_personas = roles_compu("2").replace("</main>", confirmacion("¿Dar de baja el rol Ventas mayoristas?", TEXTO_BAJA_ROL.split(".")[0] + ".",
                                                                    "Dar de baja", peligro=False, apagado=MOTIVO_CON_PERSONAS) + "</main>", 1)
    return tablero("Usuario", "Confirmar lo que propone el asistente · quitar a una persona y dar de baja un rol · para aprobar", CSS_COMPU,
                   por_estado([quitar, borrar, con_personas]), CONF_ESTADOS, 1440, 900, otra="Roles")


def hoja_confirmar(titulo, texto, boton, peligro=True, apagado=None):
    clase = "cb cb-pel lleno" if peligro else "cb cb-pri lleno"
    b = f'<button type="button" class="{clase}">{boton}</button>'
    if apagado:
        b = (f'<span class="acc-apagado"><button type="button" class="{clase}" aria-disabled="true">{boton}</button>'
             f'<span class="acc-tip" role="tooltip">{apagado}</span></span>')
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="' + titulo + '"><span class="asa"></span>'
            f'<div class="hc"><div class="acc-tit"><h2>{titulo}</h2><span class="acc-prop">{SPARK}Propuesta del asistente</span></div></div>'
            f'<div class="hb"><p class="ap-txt-l" style="margin: 0;">{texto}</p></div><div class="hp">{b}'
            '<button type="button" class="cb cb-sec" autofocus>Cancelar</button></div></div>')


def m_roles(usuarios_mayoristas):
    t = marco(copia("m_roles"))
    keb = svg_de(t, 'aria-label="Acciones de Auditor"')
    i = t.index('<div class="ap-fila"><a class="tx" href="#" style="color: inherit; text-decoration: none;"><span class="l1">Administrador<span>')
    fila = lambda n, u, p: (f'<div class="ap-fila"><a class="tx" href="#" style="color: inherit; text-decoration: none;"><span class="l1">{n}'
                            f'<span>{u}</span></span><span class="l2">Toda la organización</span><span class="l3">{p}</span></a>'
                            f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{keb}</button></div>')
    u = "1 usuario" if usuarios_mayoristas == "1" else f"{usuarios_mayoristas} usuarios"
    return t[:i] + fila("Administración de personas", "1 usuario", "9 permisos") + fila("Ventas", "3 usuarios", "2 permisos") + \
        fila("Ventas mayoristas", u, "2 permisos") + t[i:]


def m_confirmar_propuesta():
    ficha = marco(copia("m_usuario"))
    ficha = ficha.replace("Tomás Acosta", "Martín Paz").replace("tomas.acosta@delta.ejemplo.com", "martin.paz@delta.ejemplo.com")
    texto = TEXTO_QUITAR
    quitar = una_vez(ficha, '<span class="ap-raya"></span></div>',
                     hoja_confirmar("¿Quitar a Martín Paz de Grupo Delta?", texto, "Quitar") + '<span class="ap-raya"></span></div>')
    borrar = una_vez(m_roles("0"), '<span class="ap-raya"></span></div>',
                     hoja_confirmar("¿Dar de baja el rol Ventas mayoristas?", TEXTO_BAJA_ROL, "Dar de baja", peligro=False)
                     + '<span class="ap-raya"></span></div>')
    con = una_vez(m_roles("2"), '<span class="ap-raya"></span></div>',
                  hoja_confirmar("¿Dar de baja el rol Ventas mayoristas?", TEXTO_BAJA_ROL.split(".")[0] + ".", "Dar de baja", peligro=False,
                                 apagado=MOTIVO_CON_PERSONAS) + '<span class="ap-raya"></span></div>')
    return tablero("M-Usuario", "Confirmar lo que propone el asistente · teléfono · para aprobar", CSS_TEL, por_estado([quitar, borrar, con]),
                   CONF_ESTADOS, 390, 844, otra="M-Roles")


# ---------------------------------------------------------------------------------------------------------------- canvas.json
TABLEROS = [
    ("Asistente-Org-Acciones", "Inicio · las acciones del asistente, en el hilo · para aprobar", asistente_org_acciones),
    ("Usuarios-Invitar-Propuesta", None, usuarios_invitar_propuesta),
    ("Usuario-Propuesta", None, usuario_propuesta),
    ("Rol-Propuesta", None, rol_propuesta),
    ("Confirmar-Propuesta", None, confirmar_propuesta),
]
TELEFONOS = [
    ("M-Asistente-Org-Acciones", "Inicio · las acciones del asistente · teléfono · para aprobar", m_asistente_org_acciones),
    ("M-Usuarios-Invitar-Propuesta", None, m_usuarios_invitar_propuesta),
    ("M-Usuario-Propuesta", None, m_usuario_propuesta),
    ("M-Rol-Propuesta", None, m_rol_propuesta),
    ("M-Confirmar-Propuesta", None, m_confirmar_propuesta),
]
NOTA = ("Acciones del asistente (ADR 0068 y decisión 268 del back), para aprobar. Va después de la segunda parte de la base y antes de "
        "la E12: cada tablero muestra solo lo que existe hasta acá (78), sin «Gestión de formularios».\n\n"
        "La regla: la IA prepara, la persona confirma en la pantalla de siempre y guarda la ruta de siempre. La tarjeta va en el hilo, "
        "debajo del texto de la IA, con cada dato en su renglón y «Revisá» con su motivo en lo dudoso. Su botón abre la pantalla de la "
        "acción con la propuesta: el diálogo «Invitar usuario» sobre el Inicio, la ficha de la persona, el editor de roles o la "
        "confirmación de quitar o de dar de baja.\n\n"
        "Quien pide es Valeria Castro, con «Administración de personas»: no es Dueña, así que lo que no puede dar se ve apagado, "
        "con el motivo en un tooltip sobre el control (211). Los permisos de un rol van en áreas plegables (260), con lo incluido "
        "apagado y su motivo.\n\n"
        "Un rol se da de baja con el verbo de la pantalla de Roles (el usuario, 23/11): la tarjeta «Baja de rol», «Revisar y dar de "
        "baja» y, aplicada, «Rol dado de baja». La confirmación es la de Roles de hoy.")


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    if not any(p["id"] == PAGINA["id"] for p in c["pages"]):
        c["pages"].insert(next(i for i, p in enumerate(c["pages"]) if p["id"] == "org") + 1, PAGINA)
    titulos = {}
    for lista in (TABLEROS, TELEFONOS):
        for nombre, titulo, _ in lista:
            t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
            titulos[nombre] = titulo or re.search(r"<title>(.*?)</title>", t).group(1)
    x0, paso = 700, 1540
    for k, (nombre, _, _) in enumerate(TABLEROS):
        c["boards"][f"{nombre}.dc.html"] = {"h": 900, "is_interactive": True, "page": PAGINA["id"], "title": titulos[nombre], "w": 1440,
                                            "x": x0 + k * paso, "y": 0}
    for k, (nombre, _, _) in enumerate(TELEFONOS):
        c["boards"][f"{nombre}.dc.html"] = {"h": 844, "is_interactive": True, "page": PAGINA["id"], "title": titulos[nombre], "w": 390,
                                            "x": x0 + k * paso, "y": 1000}
    c["notes"]["acciones-asistente"] = {"color": "blue", "page": PAGINA["id"], "text": NOTA, "w": 620, "x": 0, "y": 0}
    # La página guarda el orden de las notas al editarse: la nueva va al final
    if "noteOrder" in c and "acciones-asistente" not in c["noteOrder"]:
        c["noteOrder"].append("acciones-asistente")
    nuevos = [f"{n}.dc.html" for lista in (TABLEROS, TELEFONOS) for n, _, _ in lista]
    c["order"] = [o for o in c["order"] if o not in nuevos]
    primero_archivo = next((i for i, o in enumerate(c["order"]) if c["boards"].get(o, {}).get("page") == "archivo"), len(c["order"]))
    c["order"][primero_archivo:primero_archivo] = nuevos
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    global SPARK
    SPARK = spark(inicio_compu()[1])
    for lista in (TABLEROS, TELEFONOS):
        for nombre, titulo, hacer in lista:
            t = hacer()
            if titulo:
                t = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t, count=1)
            (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
            print("ok", nombre, len(t))
    registrar()


if __name__ == "__main__":
    main()
