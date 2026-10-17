"""Etapa 9 · Aviso al llegar a un límite de uso (decisión del usuario, 2026-10-16: opción A, como el ingreso).
Security.RateLimit.Exceeded (429 con retryAfter): un aviso corto pegado a la acción y el mismo botón dice
«Reintentá en 0:41», apagado hasta que termina la cuenta; después se toca a mano y no se pierde lo escrito.
En una lectura va el estado de error de la página, con el mismo botón. Tres ejemplos con sus teléfonos:
- Asistente-Org / M-Asistente-Org: una consulta (el botón de mandar es un ícono: la cuenta va en el aviso);
- Rol / M-Rol: guardar los cambios de un rol;
- Usuarios / M-Usuarios: la lista que no carga.
Se puede volver a correr."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

T_LIM = "Hiciste muchos pedidos seguidos. Esperá un momento."
T_AS = "Hiciste muchas consultas seguidas. Probá de nuevo en 0:41."
BOTON = "Reintentá en 0:41"
ESCRITO = "¿Quiénes entraron esta semana?"
DESC_NUEVA = "Ve los miembros de la empresa y sus datos de contacto. No cambia nada."


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def opcion(t, prop, nueva):
    m = re.search(r'("%s":\{"editor":"enum","options":\[)([^\]]*)(\])' % prop, t)
    assert m, prop
    return t[:m.end(2)] + ',"%s"' % nueva + t[m.end(2):]


def fin_de(t, i, abre, cierra):
    d = 0
    for m in re.finditer(re.escape(abre) + "|" + re.escape(cierra), t[i:]):
        d += 1 if m.group(0) == abre else -1
        if d == 0:
            return i + m.end()
    raise AssertionError(abre)


def css(t, bloque):
    return t.replace("  </style>", bloque + "\n  </style>", 1)


def asistente(nombre):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Demasiadas consultas seguidas"
    if est in t:
        print(nombre, "ya tiene el estado")
        return
    t = opcion(t, "asistente", est)
    t = r(t, "    const tope = e === 'Tope del día' || e === 'Tope del mes';\n",
          "    const tope = e === 'Tope del día' || e === 'Tope del mes';\n"
          "    // Etapa 9: Security.RateLimit.Exceeded. El aviso va arriba de la caja, que conserva lo escrito; mandar vuelve a mano.\n"
          f"    const limite = e === '{est}';\n")
    t = r(t, "      asTope: tope,\n", "      asTope: tope || limite,\n")
    t = r(t, "      asTextoTope: e === 'Tope del mes'", f"      asEscrito: limite ? '{ESCRITO}' : '',\n      asEnvBloq: limite,\n      asTextoTope: limite ? '{T_AS}' : e === 'Tope del mes'")
    n = len(re.findall(r'<textarea class="as-tx"[^>]*aria-label="Tu consulta"', t))
    assert n
    t = re.sub(r'(<textarea class="as-tx"[^>]*aria-label="Tu consulta")', r'\1 value="{{asEscrito}}"', t)
    t = r(t, '<button type="button" class="as-env" aria-label="Enviar" onClick="{{asEnviar}}">',
          '<button type="button" class="as-env" aria-label="Enviar" onClick="{{asEnviar}}" disabled="{{asEnvBloq}}">', n)
    t = css(t, "    /* Etapa 9: mandar apagado mientras corre la cuenta de un límite */\n    .as-env:disabled { opacity: 0.45; cursor: default; }")
    ruta.write_text(t, encoding="utf-8")
    print(nombre, ": 1 estado")


def rol():
    ruta = PROJ / "Rol.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Guardar: demasiados pedidos"
    if est in t:
        print("Rol ya tiene el estado")
        return
    t = opcion(t, "modo", est)
    i = t.index("const MODOS = {")
    j = fin_de(t, t.index("{", i), "{", "}") + 1
    assert t[j - 1] == ";", t[j - 5:j + 5]
    t = (t[:j] + "\n// Etapa 9: el mismo rol con un cambio sin guardar, al llegar a un límite de uso.\n"
         f"MODOS['{est}'] = {{ ...MODOS['Editar el rol Solo lectura'], limite: true }};" + t[j:])
    t = r(t, "    return { m, guardado, ...guardado, elegidos: [...m.elegidos], errNombre: '', errVale: '', errPermisos: '', guardando: false, plegado: {} };",
          f"    return {{ m, guardado, ...guardado, ...(m.limite ? {{ descripcion: '{DESC_NUEVA}' }} : {{}}), elegidos: [...m.elegidos], errNombre: '', errVale: '', errPermisos: '', guardando: false, plegado: {{}}, limite: !!m.limite }};")
    t = r(t, "      noGuardable: (!m.nuevo && !sucio) || s.guardando,\n      textoGuardar: s.guardando ? 'Guardando…'",
          f"      noGuardable: (!m.nuevo && !sucio) || s.guardando || s.limite,\n      hayLimite: !!s.limite,\n      textoGuardar: s.limite ? '{BOTON}' : s.guardando ? 'Guardando…'")
    t = r(t, '<div class="w-body" style="overflow: auto;">',
          '<div class="w-body" style="overflow: auto;"><sc-if value="{{hayLimite}}" hint-placeholder-val="{{no}}">'
          f'<div class="w-cartel" role="alert"><span class="tx">{T_LIM}</span></div></sc-if>')
    ruta.write_text(t, encoding="utf-8")
    print("Rol: 1 estado")


def usuarios():
    ruta = PROJ / "Usuarios.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Demasiados pedidos"
    if f'"{est}"' in t:
        print("Usuarios ya tiene el estado")
        return
    t = opcion(t, "estado", est)
    t = r(t, "filas: pg.items.map(", f"filas: this.props.estado === '{est}' ? [] : pg.items.map(")
    m = re.search(r"\n(\s*)sinResultados: ", t)
    assert m
    t = t[:m.end()] + f"this.props.estado !== '{est}' && " + t[m.end():]
    t = r(t, "      filas: this.props.estado", f"      limite: this.props.estado === '{est}',\n      noLimite: this.props.estado !== '{est}',\n      filas: this.props.estado")
    t = r(t, '          <sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}">',
          '          <sc-if value="{{limite}}" hint-placeholder-val="{{no}}">\n'
          f'            <div class="vacio" role="alert"><strong>No pudimos cargar los usuarios.</strong><span>{T_LIM}</span><button type="button" class="b b-sec" disabled>{BOTON}</button></div>\n'
          '          </sc-if>\n'
          '          <sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}">')
    i = t.index('          <div class="pie">')
    j = fin_de(t, i, "<div", "</div>")
    t = t[:i] + '<sc-if value="{{noLimite}}" hint-placeholder-val="{{si}}">' + t[i:j] + "</sc-if>" + t[j:]
    t = css(t, "    /* Etapa 9: la lista no carga por un límite de uso */\n    .vacio .b:disabled { opacity: 0.5; cursor: default; }")
    ruta.write_text(t, encoding="utf-8")
    print("Usuarios: 1 estado")


def bloque(t, n):
    i = t.index('<sc-if value="{{%s}}"' % n)
    return i, fin_de(t, i, "<sc-if", "</sc-if>")


def tel_estado(t, nuevo_e, texto_e):
    m = re.search(r'(\n(\s*)e(\d+): e === "[^"]*",)(\n\s*\};)', t)
    assert m
    return t[:m.end(1)] + f'\n{m.group(2)}// Etapa 9: al llegar a un límite de uso (Security.RateLimit.Exceeded).\n{m.group(2)}{nuevo_e}: e === "{texto_e}",' + t[m.end(1):]


CSS_TEL_AVISO = """    /* Etapa 9: aviso al llegar a un límite de uso */
    .ap-cartel { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 12px; font-size: 14px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
    .ap-fijo .cb:disabled, .ap-vacio .cb:disabled { opacity: 0.5; cursor: default; }"""


def m_rol():
    ruta = PROJ / "M-Rol.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Guardar: demasiados pedidos"
    if est in t:
        print("M-Rol ya tiene el estado")
        return
    t = opcion(t, "estado", est)
    i, j = bloque(t, "e0")
    b = t[i:j].replace("{{e0}}", "{{e4}}", 1).replace('hint-placeholder-val="{{si}}"', 'hint-placeholder-val="{{no}}"', 1)
    b = r(b, "Ve los miembros de la empresa. No cambia nada.", DESC_NUEVA)
    b = r(b, '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>',
          f'<div class="ap-cartel" role="alert" style="margin: 0 16px 10px;">{T_LIM}</div>'
          f'<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full" disabled>{BOTON}</button></div>')
    t = t[:j] + b + t[j:]
    t = tel_estado(t, "e4", est)
    if ".ap-cartel {" not in t:
        t = css(t, CSS_TEL_AVISO)
    ruta.write_text(t, encoding="utf-8")
    print("M-Rol: 1 estado")


def m_usuarios():
    ruta = PROJ / "M-Usuarios.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Demasiados pedidos"
    if f'"{est}"' in t:
        print("M-Usuarios ya tiene el estado")
        return
    t = opcion(t, "estado", est)
    i, j = bloque(t, "e0")
    b = t[i:j].replace("{{e0}}", "{{e3}}", 1).replace('hint-placeholder-val="{{si}}"', 'hint-placeholder-val="{{no}}"', 1)
    a = b.index('<div class="ap-cuerpo">')
    z = b.index('<a class="ap-fab"', a)
    b = (b[:a] + '<div class="ap-cuerpo"><div class="ap-vacio" role="alert">No pudimos cargar los usuarios.'
         f'<span style="font-size: 14.5px; font-weight: 400; color: var(--t2);">{T_LIM}</span>'
         f'<button type="button" class="cb cb-sec" disabled>{BOTON}</button></div></div>' + b[z:])
    t = t[:j] + b + t[j:]
    t = tel_estado(t, "e3", est)
    if ".ap-vacio {" not in t:
        lis = (PROJ / "M-FRM-Listado.dc.html").read_text(encoding="utf-8")
        reglas = re.findall(r"\.ap-vacio[^{]*\{[^}]*\}", lis)
        assert reglas
        t = css(t, "    /* Estado vacío y de error, copiado de M-FRM-Listado */\n" + "\n".join("    " + x for x in reglas))
    if ".ap-cartel {" not in t:
        t = css(t, CSS_TEL_AVISO)
    ruta.write_text(t, encoding="utf-8")
    print("M-Usuarios: 1 estado")


if __name__ == "__main__":
    asistente("Asistente-Org")
    asistente("M-Asistente-Org")
    rol()
    usuarios()
    m_rol()
    m_usuarios()
