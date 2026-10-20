"""Los ⋮ de ficha y los datos de solo lectura (pedido del Coordinador de la 9, 20/10; la forma del ⋮ la eligió el usuario).

1. En el teléfono, el ⋮ de la barra de una ficha o de una lista abre una hoja desde abajo con el nombre de la ficha como título, como
   el ⋮ de una fila (Criterio · Menús). Pasan a esa forma los desplegables `.ap-menu` y se dibuja abierto donde faltaba
   (M-Usuario, M-WA-Difusion-Resultados y M-WA-Conversacion). Las hojas no llevan íconos, como las que ya había.
2. En la compu, cada opción de un ⋮ lleva su ícono gris (Criterio · Menús), con los íconos que ya usa el lienzo para la misma acción.
3. A11 (v113): lo que no se puede cambiar es el mismo campo apagado, nunca un rótulo con texto suelto. El Proveedor del diálogo de un
   modelo, el teléfono al editar un contacto y la bandeja al editar un equipo; y el estado de solo lectura de Configuración.

Corre al final de todo, después de `alineamiento_e9_app_1004.py`, porque toca tableros que rehacen otros generadores. Se puede volver a
correr: lo que ya está hecho no se repite.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-c9="menus"'
APROBADO = True
PARA_APROBAR = " · para aprobar"


def svg(d, w=16, sw="1.75"):
    return (f'<svg class="mi-ic" width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


# Los íconos que ya usa el lienzo para la misma acción (Usuarios, WA-Plantillas, Organizaciones, Criterio · Menús…)
IC = {
    "editar": svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    "borrar": svg('<path d="M4.5 7h15"/><path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>'),
    "reenviar": svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>'),
    "revocar": svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>'),
    "quitar_persona": svg('<circle cx="10" cy="8" r="3.5"/><path d="M4 20a6 6 0 0 1 12 0"/><path d="M16 11h5"/>'),
    "roles": svg('<path d="M12 3 5 6v5.5c0 4.2 2.9 7.8 7 9.5 4.1-1.7 7-5.3 7-9.5V6z"/>'),
    "duplicar": svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
    "cancelar": svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'),
    "ver": svg('<path d="M2.75 12S6 5.75 12 5.75 21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12Z"/><circle cx="12" cy="12" r="2.75"/>'),
    "desvincular": svg('<path d="M9 15l6-6"/><path d="M10.5 6.5 12 5a4 4 0 0 1 6 6l-1.5 1.5"/><path d="M13.5 17.5 12 19a4 4 0 0 1-6-6l1.5-1.5"/>'),
    "principal": svg('<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>'),
    "mas": svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    "cambiar": svg('<path d="M7 7h12"/><path d="m15 3 4 4-4 4"/><path d="M17 17H5"/><path d="m9 13-4 4 4 4"/>'),
}
ICONOS = {  # tablero: [(opción, ícono)]
    "Usuario": [("Cambiar roles", "roles"), ("Quitar de la empresa", "quitar_persona"), ("Quitar de la organización", "quitar_persona"),
                ("Reenviar invitación", "reenviar"), ("Revocar invitación", "revocar")],
    "Cuenta-Metodo": [("Hacer principal", "principal"), ("Quitar", "borrar")],
    "Plat-WA-Numero": [("Comprobar medio de pago", "reenviar"), ("Conectar otro número", "mas")],
    "WA-Admin": [("Cambiar a quién atiende", "cambiar"), ("Comprobar medio de pago", "reenviar"), ("Desconectar", "desvincular")],
    "WA-Chats": [("Ver ficha del contacto", "ver")],
    "WA-Chats-Asistente": [("Ver ficha del contacto", "ver")],
    "WA-Difusiones": [("Duplicar", "duplicar"), ("Cancelar difusión", "cancelar")],
    "WA-Equipos": [("Editar", "editar"), ("Borrar", "borrar")],
    "WA-Mensajes": [("Desvincular", "desvincular")],
    "WA-Respuestas": [("Editar", "editar"), ("Quitar", "borrar")],
}
CSS_ICONOS = """[role="menuitem"]:has(> svg.mi-ic) { flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 10px !important; }
svg.mi-ic { color: var(--t3); flex-shrink: 0; }
.pel > svg.mi-ic, [class~="pel"] > svg.mi-ic { color: inherit; }
"""
CSS_RO = """.ct.ro { background: var(--s2) !important; color: var(--t2) !important; border-color: var(--borde) !important; cursor: default; }
.ct.ro svg { color: var(--t3); }
"""
CSS_HOJA = """.ap-velo { position: absolute; inset: 0; z-index: 6; background: oklch(0.2 0.014 78 / 0.45); }
.ap-hoja { position: absolute; z-index: 7; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; box-shadow: 0 -8px 24px oklch(0.2 0.014 78 / 0.12); }
.ap-hoja .asa { align-self: center; width: 36px; height: 5px; border-radius: 3px; background: var(--borde2); margin: 8px 0 4px; }
.ap-hoja .hc { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 6px 4px 20px; }
.ap-hoja .hc h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; }
.ap-hoja .hb { padding: 8px 20px 16px; display: flex; flex-direction: column; gap: 14px; }
.ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }
.ap-acciones > span, .ap-acciones > a, .ap-acciones > sc-if > span, .ap-acciones > sc-if > a { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); color: var(--t1); text-decoration: none; }
.ap-acciones > :first-child { border-top: 0; }
.ap-acciones .sep { min-height: 8px; padding: 0; background: var(--s2); }
.ap-acciones .pel { color: var(--peligro); }
.ap-acciones .off { flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; color: var(--t3); }
.ap-acciones .off small { font-size: 13px; }
"""
PELIGRO = {"Desvincular", "Quitar de la organización", "Revocar invitación", "Cancelar difusión", "Quitar contacto", "Desconectar"}


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:100], t.count(a))
    return t.replace(a, b)


def css(t, bloque, marca):
    if f'data-c9="{marca}"' in t:
        return t
    return t.replace("</helmet>", f'<style data-c9="{marca}">\n{bloque}</style>\n</helmet>', 1)


def fin_de(t, i, abre, cierra):
    d = 0
    for m in re.finditer(re.escape(abre) + "|" + re.escape(cierra), t[i:]):
        d += 1 if m.group(0) == abre else -1
        if d == 0:
            return i + m.end()
    raise AssertionError(abre)


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


# ================================================================ 1 · Criterio · Menús
def criterio():
    t = leer("Criterio-Menus")
    if "El ⋮ de la barra" in t:
        return False
    a = "<li><strong>En el teléfono, una hoja desde abajo</strong> con el dato de la fila como título, como «Sofía Herrera». Vale para todas las listas.</li>"
    b = a + ('\n      <li><strong>El ⋮ de la barra de una ficha o de una lista, igual:</strong> en la compu abre debajo del ⋮; en el teléfono, '
             "una hoja desde abajo con el nombre de la ficha como título, como «Martina López». Las hojas del teléfono no llevan íconos.</li>")
    escribir("Criterio-Menus", r(t, a, b))
    return True


# ================================================================ 2 · Íconos en los ⋮ de la compu
def iconos():
    hechos = []
    for n, opciones in ICONOS.items():
        t = leer(n)
        antes = t
        for texto, ic in opciones:
            pat = re.compile(r'(<(span|a|button)\b[^>]*role="menuitem"[^>]*>)(\s*)' + re.escape(texto) + r'(?=\s*<)')
            t, k = pat.subn(lambda m: m.group(1) + IC[ic] + " " + texto, t)
            assert k or IC[ic][:40] in t, (n, texto)
        if t != antes:
            escribir(n, css(t, CSS_ICONOS, "iconos"))
            hechos.append(n)
    return hechos


# ================================================================ 3 · El ⋮ de la barra en el teléfono: una hoja desde abajo
def items_de(html):
    """Los ítems de un desplegable, como filas de la hoja; las de peligro, al final, después de una franja."""
    salida, peligro = [], []
    for m in re.finditer(r'<sc-if\b([^>]*)>(.*?)</sc-if>|<a\b([^>]*)>(.*?)</a>|<span\b([^>]*)>(.*?)</span>', html, re.S):
        if m.group(1) is not None:
            interno = items_de(m.group(2))
            salida.append(f"<sc-if{m.group(1)}>{interno}</sc-if>")
            continue
        if m.group(3) is not None:
            attrs, cuerpo, tag = m.group(3), m.group(4), "a"
        else:
            attrs, cuerpo, tag = m.group(5), m.group(6), "span"
        if 'role="menuitem"' not in attrs and tag == "span":
            continue
        href = re.search(r'href="([^"]*)"', attrs)
        off = 'class="off"' in attrs or "aria-disabled" in attrs
        texto = re.sub(r"<small[^>]*>.*?</small>", "", cuerpo, flags=re.S)
        texto = re.sub(r"<[^>]+>", "", texto).strip()
        sub = re.search(r"<small[^>]*>.*?</small>", cuerpo, re.S)
        clase = "pel" if texto in PELIGRO else ("off" if off else "")
        a_attrs = f' class="{clase}"' if clase else ""
        extra = ' aria-disabled="true"' if off else ""
        if href:
            fila = f'<a role="menuitem" href="{href.group(1)}"{a_attrs}>{texto}</a>'
        else:
            fila = f'<span role="menuitem"{a_attrs}{extra}>{texto}{sub.group(0) if sub and off else ""}</span>'
        (peligro if clase == "pel" else salida).append(fila)
    if peligro:
        salida.append('<span class="sep" role="separator"></span>')
        salida += peligro
    return "".join(salida)


def hoja(titulo, items):
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de {titulo}"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div><div class="hb" style="padding-bottom: 34px;">'
            f'<div class="ap-acciones">{items}</div></div></div>')


DESPLEGABLES = ["M-Plat-WA-Conversacion", "M-Usuarios", "M-WA-Chats-Formulario", "M-WA-Chats-SinTomar", "M-WA-Contacto", "M-WA-Mensaje"]


def desplegables():
    hechos = []
    for n in DESPLEGABLES:
        t = leer(n)
        k = 0
        while True:
            m = re.search(r'<div class="ap-menu"[^>]*>(.*?)</div>', t, re.S)
            if not m:
                break
            # El título es el del ⋮ de la barra de esa pantalla, no el de una fila
            barra = [x for x in re.finditer(r'<div class="ap-c?bar[^"]*">(.*?)</div>', t[:m.start()], re.S)][-1]
            previo = re.findall(r'aria-label="Acciones de ([^"]+)"', t[barra.start():m.start()])
            assert previo, n
            titulo = previo[0]
            t = t[:m.start()] + hoja(titulo, items_de(m.group(1))) + t[m.end():]
            k += 1
        if k:
            escribir(n, css(t, CSS_HOJA, "hoja"))
            hechos.append((n, k))
    return hechos


ABIERTOS = {  # tablero: (título, ítems)
    "M-Usuario": ("{{nombre}}", '<span role="menuitem" class="pel">Quitar de la organización</span>'),
    "M-WA-Difusion-Resultados": ("20 % en empanadas", '<span role="menuitem">Duplicar</span>'),
    "M-WA-Conversacion": ("Martina López", '<a role="menuitem" href="M-WA-Chats-Pasar.dc.html">Pasar</a>'
                                           '<a role="menuitem" href="M-WA-Contacto.dc.html">Ver ficha del contacto</a>'),
}


def abiertos():
    hechos = []
    for n, (titulo, items) in ABIERTOS.items():
        t = leer(n)
        if "eMenuBarra" in t:
            continue
        abre = '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">'
        if abre in t:
            # Un estado por pantalla entera: se copia la primera y se le suma la hoja
            i = t.index(abre)
            j = fin_de(t, i, "<sc-if", "</sc-if>")
            base = t[i + len(abre):j - len("</sc-if>")]
            t = t[:j] + '<sc-if value="{{eMenuBarra}}" hint-placeholder-val="{{no}}">' + base + hoja(titulo, items) + "</sc-if>" + t[j:]
        else:
            # Una sola pantalla con capas: la hoja va como una capa más, junto a las otras hojas
            ancla = '<sc-if value="{{e1}}" hint-placeholder-val="{{no}}"><div class="ap-velo">'
            t = r(t, ancla, '<sc-if value="{{eMenuBarra}}" hint-placeholder-val="{{no}}">' + hoja(titulo, items) + "</sc-if>" + ancla)
        m = re.search(r'("estado":\{"editor":"enum","options":\[)("[^"]*")', t)
        t = t[:m.end(2)] + ',"Menú"' + t[m.end(2):]
        t = r(t, "      si: true,\n      no: false,\n", '      si: true,\n      no: false,\n      eMenuBarra: e === "Menú",\n') if "      si: true,\n      no: false,\n" in t \
            else r(t, "si: true, no: false,", 'si: true, no: false, eMenuBarra: e === "Menú",')
        escribir(n, css(t, CSS_HOJA, "hoja"))
        hechos.append(n)
    return hechos


# ================================================================ 4 · A11: el mismo campo, apagado
def a11():
    hechos = []
    for n in ("Plat-Asistente-Config", "M-Plat-Asistente-Config"):
        t = leer(n)
        t2 = re.sub(r'<div class="ct sel">Anthropic<svg.*?</svg></div>', '<div class="ct ro">Anthropic</div>', t, flags=re.S)
        if t2 != t:
            escribir(n, css(t2, CSS_RO, "ro"))
            hechos.append(n)
    for n, viejo, nuevo in (("WA-Contacto", '<span class="e11-solo">011 15-5555-6203</span>', '<div class="ct ro">011 15-5555-6203</div>'),
                            ("M-WA-Contacto", '<span class="e11-solo">011 15-5555-6203</span>', '<div class="ct ro">011 15-5555-6203</div>'),
                            ("WA-Equipos", '<span class="ta-solo">Clientes</span>', '<div class="ct ro">Clientes</div>'),
                            ("M-WA-Equipos", '<span class="ta-solo">Clientes</span>', '<div class="ct ro">Clientes</div>')):
        t = leer(n)
        if viejo in t:
            escribir(n, css(t.replace(viejo, nuevo), CSS_RO, "ro"))
            hechos.append(n)
    return hechos


def configuracion():
    """Sin «Administrar la configuración»: los mismos campos apagados, sin guardar, sin agregar ni quitar dominios."""
    t = leer("Configuracion")
    if '"permiso":' in t:
        return False
    t = r(t, ',"$preview":{"width":1440,"height":900}}\'>',
          ',"permiso":{"editor":"enum","options":["Puede cambiarla","Solo lectura"],"default":"Puede cambiarla","section":"Estado"},"$preview":{"width":1440,"height":900}}\'>')
    t = r(t, "      verificado: (this.props.dominio || 'Verificado') === 'Verificado',\n",
          "      verificado: (this.props.dominio || 'Verificado') === 'Verificado',\n"
          "      // Sin settings.manage (A11): los mismos campos, apagados.\n"
          "      puede: this.props.permiso !== 'Solo lectura', solo: this.props.permiso === 'Solo lectura', ro: this.props.permiso === 'Solo lectura' ? 'ro' : '',\n")
    m = re.search(r'<div class="ac"><button type="button" class="cb cb-sec" onClick="\{\{descartar\}\}">Descartar cambios</button>.*?</div>', t, re.S)
    t = t.replace(m.group(0), '<div class="ac"><sc-if value="{{puede}}" hint-placeholder-val="{{si}}">' + m.group(0)[len('<div class="ac">'):-len("</div>")] + "</sc-if></div>", 1)
    m = re.search(r'<input class="ct" style="font: inherit; color: var\(--t1\);" type="text" aria-label="Nombre de la organización"[^>]*>', t)
    t = t.replace(m.group(0), '<sc-if value="{{puede}}" hint-placeholder-val="{{si}}">' + m.group(0) + '</sc-if><sc-if value="{{solo}}" hint-placeholder-val="{{no}}"><div class="ct ro">{{nombre}}</div></sc-if>', 1)
    for v in ("Español (Argentina) ", "Buenos Aires (GMT−3) ", "Peso argentino (ARS) "):
        t = r(t, f'<div class="ct">{v}', f'<div class="ct {{{{ro}}}}">{v}')
    m = re.search(r'<a class="cb cb-sec ch" href="Configuracion-Dominio\.dc\.html">.*?</a>', t, re.S)
    t = t.replace(m.group(0), '<sc-if value="{{puede}}" hint-placeholder-val="{{si}}">' + m.group(0) + "</sc-if>", 1)
    t = r(t, '<a class="cb cb-sec ch" href="Configuracion-Verificar.dc.html">Verificar</a>',
          '<sc-if value="{{puede}}" hint-placeholder-val="{{si}}"><a class="cb cb-sec ch" href="Configuracion-Verificar.dc.html">Verificar</a></sc-if>')
    t = re.sub(r'(<a class="ib" aria-label="Quitar delta\.ejemplo\.com" href="Configuracion-Quitar\.dc\.html"><svg.*?</svg></a>)',
               r'<sc-if value="{{puede}}" hint-placeholder-val="{{si}}">\1</sc-if>', t, flags=re.S)
    t = r(t, '<span class="rt">Nombre de la organización <span class="req">*</span></span>',
          '<span class="rt">Nombre de la organización<sc-if value="{{puede}}" hint-placeholder-val="{{si}}"> <span class="req">*</span></sc-if></span>')
    escribir("Configuracion", css(t, CSS_RO, "ro"))
    return True


def m_configuracion():
    t = leer("M-Configuracion")
    if '"Solo lectura"' in t:
        return False
    abre = '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">'
    i = t.index(abre)
    j = fin_de(t, i, "<sc-if", "</sc-if>")
    b = t[i + len(abre):j - len("</sc-if>")]
    b = r(b, '<div class="ct">Grupo Delta</div>', '<div class="ct ro">Grupo Delta</div>')
    for v in ("Español (Argentina)", "Buenos Aires (GMT−3)", "Peso argentino (ARS)"):
        b = r(b, f'<div class="ct">{v}', f'<div class="ct ro">{v}')
    b = r(b, '<a href="M-Configuracion-Dominio.dc.html">Agregar dominio</a>', "")
    b = re.sub(r'<button type="button" class="ap-ib" aria-label="Acciones de delta\.ejemplo\.com"><svg.*?</svg></button>', "", b, flags=re.S)
    b = re.sub(r'<div class="ap-fijo">.*?</div>', "", b, count=1, flags=re.S)
    b = b.replace('<span class="rq">*</span>', "")
    t = t[:j] + '<sc-if value="{{eSolo}}" hint-placeholder-val="{{no}}">' + b + "</sc-if>" + t[j:]
    m = re.search(r'("estado":\{"editor":"enum","options":\[[^\]]*)(\])', t)
    t = t[:m.end(1)] + ',"Solo lectura"' + t[m.end(1):]
    t = r(t, "      e2: e === \"Cambios sin guardar\",\n", "      e2: e === \"Cambios sin guardar\",\n      // Sin settings.manage (A11): los mismos campos, apagados.\n      eSolo: e === \"Solo lectura\",\n")
    escribir("M-Configuracion", css(t, CSS_RO, "ro"))
    return True


# ================================================================ canvas.json
def registrar(nombres):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n in nombres:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


TOCADOS = (["Criterio-Menus"] + list(ICONOS) + DESPLEGABLES + list(ABIERTOS)
           + ["Plat-Asistente-Config", "M-Plat-Asistente-Config", "WA-Contacto", "WA-Equipos", "M-WA-Equipos", "Configuracion", "M-Configuracion"])

if __name__ == "__main__":
    print("criterio", criterio())
    print("íconos", iconos())
    print("hojas", desplegables())
    print("abiertos", abiertos())
    print("A11", a11())
    print("Configuracion", configuracion(), m_configuracion())
    registrar(sorted(set(TOCADOS)))
