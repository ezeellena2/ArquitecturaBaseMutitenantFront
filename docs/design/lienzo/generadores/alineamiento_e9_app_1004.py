"""Alineación con la app después de la puerta de la E9 (pedido del Coordinador, 17/10; galería en docs/design/capturas/etapa-9).

Cada paso se puede volver a correr: si el tablero ya está alineado, no lo toca. Corre al final, después de los generadores.
1. Cuenta-Plat y M-Cuenta-Plat: los tres permisos del asistente después de «Atender consultas», y «Cambiar la configuración»
   al final, como en el catálogo de la app (núcleo, módulos y la configuración última).
2. Config-Plat: una tarjeta por sección; en el teléfono, título chico gris y tarjeta, y el conflicto se ve desde arriba.
3. Las bandas del límite y de conflicto llevan ⚠; en la compu «Seguir editando» va en verde.
5. Legales, publicar: miga con el paso, aviso fuera de la tarjeta, tarjetas «Versión» y «Contenido», cuadros de cuatro renglones.
6 y 8. Subtítulos del teléfono: el rol con cambios y Auditoría de Plataforma.
7. M-Usuarios: el error de carga en un recuadro punteado.
9. Asistente: atajos sin ⚡ y título a la izquierda en el teléfono.
10. «Confirmá que sos vos» en el teléfono, siempre con ✕.
11. El ⋮ de una fila abre hacia abajo.
Los puntos 4, el «Vale en» del 6 y el «+» del 9 son decisiones del lienzo: quedan como están y los resuelve el Front.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

CONF = ("Cambiar la configuración", "Registro de personas y alta de organizaciones.")
BIBLIO = ("Administrar la biblioteca de formularios", "Armar, publicar y retirar las plantillas de formularios y sus categorías.")
ASISTENTE = [("Usar el asistente de Plataforma", "Consultar el asistente con tus permisos de Plataforma."),
             ("Configurar el asistente de Plataforma", "Configurar claves, modelos y topes del asistente."),
             ("Ver el uso del asistente", "Ver costos y consultas agregados sin leer conversaciones.")]


def leer(nombre):
    return (PROJ / nombre).read_text(encoding="utf-8")


def escribir(nombre, t):
    (PROJ / nombre).write_text(t, encoding="utf-8")


def permisos_asistente():
    filas = {
        "Cuenta-Plat.dc.html": [
            (lambda q, d: f'<div class="o-fila"><span class="dos"><span class="c1">{q}</span><span class="n2">{d}</span></span><span class="o-perm no">—</span></div>', 2),
            (lambda q, d: f'<label class="op2"><input type="checkbox"><span><span class="opn">{q}</span><span class="opd">{d}</span></span></label>', 1)],
        "M-Cuenta-Plat.dc.html": [
            (lambda q, d: f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{q}</span><span class="ap-perm no">—</span></span><span class="l2">{d}</span></div></div>', 13)],
    }
    for nombre, plantillas in filas.items():
        t = leer(nombre)
        if ASISTENTE[0][0] in t:
            print(nombre, "ya tiene los permisos del asistente")
            continue
        for fila, minimo in plantillas:
            viejo = fila(*CONF) + fila(*BIBLIO)
            nuevo = "".join(fila(*p) for p in ASISTENTE) + fila(*BIBLIO) + fila(*CONF)
            assert t.count(viejo) == minimo, (nombre, t.count(viejo), minimo)
            t = t.replace(viejo, nuevo)
        escribir(nombre, t)
        print(nombre, "permisos del asistente")


def tri(px):
    return (f'<svg width="{px}" height="{px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>')


CIRCULO = re.compile(r'<svg [^>]*><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>(<span class="tx">Otra persona cambió esto)')


def css(t, marca, reglas):
    """Suma reglas al final del primer estilo del tablero, una sola vez."""
    if f"/* {marca} */" in t:
        return t
    i = t.index("</style>")
    return t[:i] + f"/* {marca} */\n{reglas}\n" + t[i:]


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:100], t.count(a), n)
    return t.replace(a, b)


def tarjetas_config():
    """2. Config-Plat: una tarjeta por sección, como la app. En la compu cada sección es su propia hoja con la banda del título;
    en el teléfono, un título chico gris y una tarjeta con los campos."""
    n = "Config-Plat.dc.html"
    t = leer(n)
    if 'aria-label="Contacto"' not in t:
        t = r(t, '<div class="hoja" role="form" aria-label="Configuración de la plataforma">',
              '<div class="hoja" role="group" aria-label="Registro y altas">')
        t = r(t, "            <h2>Contacto</h2>", '          </div>\n          <div class="hoja" role="group" aria-label="Contacto">\n            <h2>Contacto</h2>')
        t = r(t, "            <h2>Límites de uso</h2>", '          </div>\n          <div class="hoja" role="group" aria-label="Límites de uso">\n            <h2>Límites de uso</h2>')
        escribir(n, t)
        print(n, "una tarjeta por sección")

    n = "M-Config-Plat.dc.html"
    t = leer(n)
    if "ap-tarj" in t:
        print(n, "ya tiene tarjetas")
        return
    tit = re.compile(r'<span class="ap-gtit" style="[^"]*">([^<]+)</span>')

    def cuerpo(e):
        a = t.index(f'<sc-if value="{{{{{e}}}}}"')
        i = t.index('<div class="ap-cuerpo"', a)
        i = t.index(">", i) + 1
        j = t.index('</div><div class="ap-fijo">', i)
        return i, j

    def armar(interior):
        partes = tit.split(interior)
        sal = f'<div class="ap-tarj cont">{partes[0]}</div>' if partes[0].strip() else ""
        for k in range(1, len(partes), 2):
            sal += f'<span class="ap-sec">{partes[k]}</span><div class="ap-tarj">{partes[k + 1]}</div>'
        return sal

    # La de conflicto se ve desde arriba, como en la app: la banda de lado a lado y abajo el formulario con los cambios.
    i1, j1 = cuerpo("e1")
    con_cambios = t[i1:j1]
    a5 = t.index('<sc-if value="{{e5}}"')
    i5 = t.index('<div class="ap-cuerpo"', a5)
    j5 = t.index('</div><div class="ap-fijo">', i5)
    banda = ('<div class="f-banda amb" role="alert">' + tri(18) + '<span class="tx">Otra persona cambió esto mientras lo editabas.'
             '<span class="acc"><a href="#">Seguir editando</a><a href="#">Ver lo nuevo</a></span></span></div>')
    k5 = t.index(">", i5) + 1
    t = t[:i5] + banda + t[i5:k5].replace("padding: 4px 20px 0", "padding: 14px 20px 0") + con_cambios + t[j5:]
    for e in ["e5", "e4", "e3", "e2", "e1", "e0"]:
        i, j = cuerpo(e)
        t = t[:i] + armar(t[i:j]) + t[j:]
    t = t.replace('<div class="ap-cuerpo" style="padding: 4px 20px 0; gap: 14px;">', '<div class="ap-cuerpo" style="padding: 12px 20px 0; gap: 8px;">')
    t = t.replace('<div class="ap-cuerpo" style="padding: 14px 20px 0; gap: 14px;">', '<div class="ap-cuerpo" style="padding: 14px 20px 0; gap: 8px;">')
    t = css(t, "E9 · tarjetas por sección y banda de conflicto", """
.ap-sec { font-size: 14px; font-weight: 600; color: var(--t2); }
.ap-tarj { display: flex; flex-direction: column; gap: 14px; padding: 16px; border: 1px solid var(--borde); border-radius: 14px; background: #fff; }
.ap-tarj.cont { border-top: 0; border-top-left-radius: 0; border-top-right-radius: 0; padding-top: 4px; }
.ap-tarj + .ap-sec { margin-top: 12px; }
.ap-tarj .lim-gm { margin-bottom: -6px; }
.f-banda { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; font-size: 14.5px; line-height: 1.4; }
.f-banda svg { flex-shrink: 0; margin-top: 1px; }
.f-banda .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.f-banda .acc { display: flex; gap: 18px; }
.f-banda .acc a { font-weight: 600; text-decoration: none; color: inherit; }
.f-banda.amb { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }""")
    escribir(n, t)
    print(n, "tarjetas con título chico y banda de conflicto")


def bandas_con_aviso():
    """3. Las bandas del límite y de conflicto llevan ⚠, como Banner y ConcurrencyBanner; en la compu «Seguir editando» va en verde."""
    for nombre in sorted(p.name for p in PROJ.glob("*.dc.html")):
        if re.search(r"-v1\d\d\.dc\.html$", nombre):
            continue
        t = leer(nombre)
        v = t
        t = t.replace('<div class="w-cartel" role="alert"><span class="tx">Otra persona cambió esto',
                      '<div class="w-cartel" role="alert">' + tri(16) + '<span class="tx">Otra persona cambió esto')
        t = t.replace('<div class="w-cartel" role="alert"><span class="tx">Hiciste muchos pedidos seguidos',
                      '<div class="w-cartel" role="alert">' + tri(16) + '<span class="tx">Hiciste muchos pedidos seguidos')
        t = CIRCULO.sub(lambda m: tri(18) + m.group(1), t)
        t = t.replace('<div class="ap-cartel" role="alert" style="margin: 0 16px 10px;">Hiciste muchos pedidos seguidos. Esperá un momento.</div>',
                      '<div class="ap-cartel fila" role="alert" style="margin: 0 16px 10px;">' + tri(18) + '<span>Hiciste muchos pedidos seguidos. Esperá un momento.</span></div>')
        if 'class="ap-cartel fila"' in t:
            t = css(t, "E9 · banda del límite con aviso", ".ap-cartel.fila { flex-direction: row; align-items: flex-start; gap: 10px; }\n.ap-cartel.fila svg { flex-shrink: 0; margin-top: 2px; }")
        if '<button type="button" class="lnk">Seguir editando</button>' in t:
            t = css(t, "E9 · Seguir editando en verde", ".w-cartel svg { flex-shrink: 0; }\n.w-cartel .lnk { color: var(--marca); font-weight: 600; }")
        if t != v:
            escribir(nombre, t)
            print(nombre, "bandas con ⚠")


def error_usuarios_tel():
    """7. M-Usuarios: el error de carga va en un recuadro punteado, arriba, como en la app."""
    n = "M-Usuarios.dc.html"
    t = leer(n)
    if "ap-vacio caja" in t:
        return
    t = r(t, '<div class="ap-vacio" role="alert">No pudimos cargar los usuarios.', '<div class="ap-vacio caja" role="alert">No pudimos cargar los usuarios.')
    t = css(t, "E9 · error de carga en un recuadro", ".ap-vacio.caja { margin: 8px 12px 0; padding: 32px 24px; border: 1px dashed var(--borde); border-radius: 14px; }")
    escribir(n, t)
    print(n, "error en recuadro punteado")


def legales_publicar():
    """5. Legales, «Publicar versión nueva»: la miga suma el paso, el aviso va fuera de la tarjeta con ⚠, una tarjeta «Versión»
    con el documento y la fecha, otra «Contenido», y los cuadros de unos cuatro renglones."""
    n = "Legales.dc.html"
    t = leer(n)
    if "<h2>Versión</h2>" in t:
        return
    t = r(t, '<li class="ab-breadcrumbs__item ab-breadcrumbs__item--current" aria-current="page">Documentos legales</li>',
          '<sc-if value="{{enLista}}" hint-placeholder-val="{{si}}"><li class="ab-breadcrumbs__item ab-breadcrumbs__item--current" aria-current="page">Documentos legales</li></sc-if>'
          '<sc-if value="{{enNueva}}" hint-placeholder-val="{{no}}"><li class="ab-breadcrumbs__item"><a class="ab-breadcrumbs__link" href="#" onClick="{{cancelar}}">Documentos legales</a></li>'
          '<li class="ab-breadcrumbs__separator" aria-hidden="true">/</li><li class="ab-breadcrumbs__item ab-breadcrumbs__item--current" aria-current="page">Publicar versión nueva</li></sc-if>')
    m = re.search(r'\n        <div class="hoja">\n          <div class="aviso-linea alerta"><svg [^>]*><circle cx="12" cy="12" r="8.5"/>'
                  r'<path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>(<span>Al publicarla[^<]*</span></div>)', t)
    assert m, "aviso de Legales"
    t = t[:m.start()] + '\n        <div class="aviso-linea alerta">' + tri(16) + m.group(1) + '\n        <div class="hoja">\n          <h2>Versión</h2>' + t[m.end():]
    t = r(t, "          <h2>Contenido</h2>", '        </div>\n        <div class="hoja">\n          <h2>Contenido</h2>')
    t = r(t, 'style="min-height: 440px;"', 'rows="4" style="min-height: 96px;"', 2)
    escribir(n, t)
    print(n, "publicar como la app")


def subtitulos_tel():
    """6 y 8. Teléfono: el rol con cambios dice «Cambios sin guardar»; Auditoría de Plataforma dice «Administración»."""
    n = "M-Rol.dc.html"
    t = leer(n)
    if "Cambios sin guardar</span></span></div>" not in t:
        a = t.index("Reintentá en 0:41</button>")
        viejo = '<div class="tit"><h1>Solo lectura</h1><span class="sub">Vale en Delta S.A. · 4 usuarios lo tienen</span></div>'
        i = t.rindex(viejo, 0, a)
        t = t[:i] + '<div class="tit"><h1>Solo lectura</h1><span class="sub amb"><span>Cambios sin guardar</span></span></div>' + t[i + len(viejo):]
        t = css(t, "E9 · subtítulo con cambios", ".ap-bar .tit .sub.amb { color: oklch(0.55 0.13 70); }")
        escribir(n, t)
        print(n, "subtítulo «Cambios sin guardar»")
    for n in ["M-Auditoria-Plat.dc.html", "M-Auditoria-Plat-Detalle.dc.html"]:
        t = leer(n)
        if '<h1>Auditoría</h1><span class="sub">Últimos 30 días</span>' in t:
            escribir(n, r(t, '<h1>Auditoría</h1><span class="sub">Últimos 30 días</span>', '<h1>Auditoría</h1><span class="sub">Administración</span>'))
            print(n, "subtítulo «Administración»")


def asistente_como_la_app():
    """9. Asistente: los atajos sin ⚡ y, en el teléfono, el título a la izquierda."""
    zap = re.compile(r'(<button type="button" class="as-chip" onClick="\{\{asChip\}\}">)<svg [^>]*><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>')
    for n in ["Asistente-Org", "Asistente-Personal", "Asistente-Plat", "M-Asistente-Org", "M-Asistente-Personal", "M-Asistente-Plat"]:
        t = leer(f"{n}.dc.html")
        v = t
        t = zap.sub(r"\1", t)
        if n.startswith("M-"):
            t = css(t, "E9 · título del asistente a la izquierda",
                    ".as-bar .tit { text-align: left !important; align-items: flex-start !important; padding-left: 4px; }\n"
                    ".as-bar .tit h1 { font-size: 24px !important; font-weight: 700 !important; letter-spacing: -0.02em; }\n"
                    ".as-chips { flex-direction: column; align-items: center; }")
        if t != v:
            escribir(f"{n}.dc.html", t)
            print(n, "asistente como la app")


def cerrar_confirmacion_tel():
    """10. «Confirmá que sos vos» en el teléfono lleva ✕ siempre: es la misma hoja que en M-Cuenta-Plat."""
    cerrar = re.search(r'<div class="hc"><div><h2>Confirmá que sos vos</h2></div>(<button type="button" class="ap-ib" aria-label="Cerrar">.*?</button>)</div>',
                       leer("M-Cuenta-Plat.dc.html")).group(1)
    for p in sorted(PROJ.glob("M-*.dc.html")):
        t = p.read_text(encoding="utf-8")
        viejo = '<div class="hc"><div><h2>Confirmá que sos vos</h2></div></div>'
        if viejo in t:
            p.write_text(t.replace(viejo, f'<div class="hc"><div><h2>Confirmá que sos vos</h2></div>{cerrar}</div>'), encoding="utf-8")
            print(p.name, "✕ en «Confirmá que sos vos»")


def menu_hacia_abajo():
    """11. El ⋮ de una fila abre hacia abajo, como en la app; solo sube en las dos últimas filas de una página llena."""
    for p in sorted(PROJ.glob("*.dc.html")):
        if re.search(r"-v1\d\d\.dc\.html$", p.name):
            continue
        t = p.read_text(encoding="utf-8")
        if "n > 5 && i >= n - 3 ? 'arriba'" not in t:
            continue
        t = t.replace("n > 5 && i >= n - 3 ? 'arriba'", "n >= 10 && i >= n - 2 ? 'arriba'")
        t = t.replace("// Menú ⋮ de una fila; en las últimas filas de una lista larga se abre hacia arriba.",
                      "// Menú ⋮ de una fila: abre hacia abajo; solo sube en las dos últimas filas de una página llena.")
        p.write_text(t, encoding="utf-8")
        print(p.name, "⋮ hacia abajo")


if __name__ == "__main__":
    permisos_asistente()
    tarjetas_config()
    bandas_con_aviso()
    legales_publicar()
    subtitulos_tel()
    error_usuarios_tel()
    asistente_como_la_app()
    cerrar_confirmacion_tel()
    menu_hacia_abajo()
