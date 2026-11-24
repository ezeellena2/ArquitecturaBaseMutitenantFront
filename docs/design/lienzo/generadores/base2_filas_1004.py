"""Nada debajo de otro dato (263) en las tablas y las filas del teléfono del núcleo, para la F4 de la segunda parte de la base.

- `M-Filas-Base2`: las listas del teléfono del núcleo, una por estado, con cada fila como una tarjeta: el nombre y cada dato con
  su nombre, de a dos, sin datos unidos con «·» debajo del nombre. Las de Usuarios, Cuentas y los miembros de una empresa están en
  sus tableros (`base2_personas_1004.py`). Con muchos datos, la tarjeta lleva menos: los que se leen en la lista.
- `Legales-Base2`: «Versión 2 · vigente desde …» debajo del nombre pasa a sus columnas.
- `WA-Difusiones-Base2`: «118 entregados · 86 leídos» pasa a dos columnas de números.

Parte de la copia de `base2_1004/`.
"""
import re

from base2_comun import (NADA_T, boton_ordenar, con_orden, copia, css, est, escribir, fin_div, hijos, por_estado, tablero, tarjeta,
                         una_vez)

CLASE_EST = {"ok": ["Activo", "Activa", "Aprobada", "Aprobado", "Conectado", "Enviada", "Acepta", "Respondió", "Leído"],
             "pend": ["Pendiente", "Espera aprobación", "Programada", "En revisión", "Invitación pendiente"],
             "aten": ["Suspendida", "Por borrar", "Falta medio de pago", "Se dio de baja"],
             "mal": ["Rechazado", "Rechazada", "Falló el alta", "Necesita recuperación", "No llegó"],
             "": ["De baja", "Cerrada", "No acepta", "Sin respuesta", "Borrada", "Pausada"]}


def punto(texto):
    clase = next((c for c, ps in CLASE_EST.items() if texto in ps), "")
    return est(clase, texto)


def limpio(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h)).strip()


def partes(fila):
    """El nombre, lo de su derecha y los renglones de abajo de una fila del teléfono, separados por «·»."""
    l1 = re.search(r'<span class="l1"[^>]*>(.*?)</span>(?=<span class="l2")', fila, re.S)
    l1 = l1.group(1) if l1 else ""
    nombre = re.search(r'<(?:b|span class="q")>(.*?)</(?:b|span)>', l1, re.S)
    if nombre:
        derecha = re.sub(r'<(?:b|span class="q")>.*?</(?:b|span)>', "", l1, count=1, flags=re.S)
        nombre = limpio(nombre.group(1))
    else:
        m = re.match(r"([^<]*)(.*)", l1, re.S)
        nombre, derecha = m.group(1).strip(), m.group(2)
    l2 = re.search(r'<span class="l2"[^>]*>(.*?)</span>(?=<span class="l3"|</div>|</span></a>|</span><span class="chev"|$)', fila, re.S)
    l3 = re.search(r'<span class="l3"[^>]*>(.*?)</span>(?:</span>|</div>|</a>|<button)', fila, re.S)
    sp = lambda m: [x.strip() for x in limpio(m.group(1)).split(" · ")] if m else []
    return nombre, limpio(derecha), sp(l2), sp(l3)


def filas_de(t):
    pos = [m.start() for m in re.finditer(r'<(?:a|div) class="(?:ap-fila|w-conv)"', t)]
    out = []
    for i in pos:
        tag = t[i + 1:t.index(" ", i)]
        prof, j = 0, i
        for m in re.finditer(rf"<{tag}\b|</{tag}>", t[i:]):
            prof += 1 if m.group(0) != f"</{tag}>" else -1
            if prof == 0:
                j = i + m.end()
                break
        # El ⋮ de la fila va a continuación, dentro del mismo contenedor de la fila (`ap-fila` de div)
        out.append((i, j))
    return out


def con_tarjetas(t, hacer):
    """Cambia cada fila por su tarjeta: `hacer(nombre, derecha, l2, l3)` da los datos con su nombre."""
    nuevo = t
    for i, j in reversed(filas_de(t)):
        fila = t[i:j]
        n, d, l2, l3 = partes(fila)
        av = re.search(r'<span class="w-av[^"]*">.*?</span>', fila, re.S)
        href = re.search(r'href="([^"]+)"', fila)
        keb = n if 'aria-label="Acciones de' in fila else None
        nuevo = nuevo[:i] + tarjeta(n, hacer(n, d, l2, l3), acciones=keb, href=href.group(1) if href else "#",
                                    av=av.group(0) if av else "") + nuevo[j:]
    # El ⋮ que quedaba al lado de la fila (en `ap-fila` de div) ya está en la tarjeta.
    nuevo = re.sub(r'(<div class="b2-tj">.*?</div>)(<button type="button" class="ap-ib" aria-label="Acciones de [^"]*">.*?</button>)',
                   r"\1", nuevo, flags=re.S)
    return nuevo


def num(texto):
    m = re.match(r"(\d+)", texto or "")
    return m.group(1) if m else "—"


LISTAS = [
    ("Roles", "m_roles", lambda n, d, a, b: [("Tipo", "De sistema" if len(a) > 1 else "Personalizado"), ("Vale en", a[-1] if a else "—"),
                                            ("Usuarios", num(d)), ("Permisos", num(b[0] if b else ""))]),
    ("Empresas", "m_empresas", lambda n, d, a, b: [("Estado", punto(b[0])), ("Miembros", num(d)),
                                                  ("CUIT", a[0].replace("CUIT ", "") if a and a[0] != "Sin CUIT" else "—"),
                                                  ("Zona horaria", b[1] if len(b) > 1 else "—")]),
    ("Organizaciones", "m_orgs", lambda n, d, a, b: [("Estado", punto(b[0])), ("Alta", d), ("Dueño", a[0]), ("Origen", b[1] if len(b) > 1 else "—")]),
    ("Recuperaciones", "m_recup", lambda n, d, a, b: [("Estado", punto(b[0])), ("Fecha y hora", d),
                                                     ("Método de antes", a[0].split(" → ")[0]), ("Método nuevo", a[0].split(" → ")[-1])]),
    ("Auditoría de la organización", "m_audorg", lambda n, d, a, b: [("Fecha y hora", d, True), ("Dónde", a[0]), ("Quién", a[1] if len(a) > 1 else "—")]),
    ("Auditoría de Plataforma", "m_audplat", lambda n, d, a, b: [("Fecha y hora", d, True), ("Sobre", a[0]), ("Quién", a[1] if len(a) > 1 else "—")]
     + ([("Motivo", b[0], True)] if b else [])),
    ("Contactos", "m_contactos", lambda n, d, a, b: [("Número", a[0]), ("Promociones", punto(b[-1])),
                                                    ("Etiquetas", b[0] if len(b) > 1 else "—"), ("Última conversación", d)]),
    ("Difusiones", "m_difusiones", lambda n, d, a, b: [("Estado", punto(b[0])), ("Fecha", d), ("Entregados", num(b[1]) if len(b) > 1 else "—"),
                                                      ("Leídos", num(b[2]) if len(b) > 2 else "—")]),
    ("Equipos", "m_equipos", lambda n, d, a, b: [("Bandeja", b[0].replace("Bandeja ", "") if b else "—"), ("Aviso", d.replace("Aviso a los ", "A los ")),
                                                ("Personas", a[0], True)]),
    ("Plantillas", "m_plantillas", lambda n, d, a, b: [("Estado", punto(b[0])), ("Tipo", a[0]), ("Idioma", a[1] if len(a) > 1 else "—"), ("Fecha", d)]),
    ("Documentos legales", "m_legales", lambda n, d, a, b: [("Vigente", d), ("Vigente desde", a[0].replace("Vigente desde ", "")),
                                                           ("Programada", b[1].split(" desde ")[0] if len(b) > 1 else "—"),
                                                           ("Desde", b[1].split(" desde ")[-1] if len(b) > 1 else "—")]),
    ("Números de WhatsApp", "m_waadmin", lambda n, d, a, b: [("Estado", punto(b[-1])), ("Atiende a", b[0]), ("Nombre verificado", a[0]),
                                                            ("Este mes", d)]),
]
OTRAS = ["M-Empresas", "M-Organizaciones", "M-Recuperaciones", "M-Auditoria-Org", "M-Auditoria-Plat", "M-WA-Contactos", "M-WA-Difusiones",
         "M-WA-Equipos", "M-WA-Plantillas", "M-Legales", "M-WA-Admin"]


def m_filas_base2():
    cuerpos = [con_tarjetas(copia(base), hacer) for _, base, hacer in LISTAS]
    return tablero("M-Roles", "Las listas del núcleo en el teléfono · cada fila, una tarjeta con sus datos nombrados", css(True),
                   por_estado(cuerpos), [n for n, _, _ in LISTAS], 390, 844, otras=OTRAS)


# ---------------------------------------------------------------------------------------------------------------- compu
def legales_base2():
    t = copia("legales")
    filas = [("Términos y condiciones", "Versión 2", "01/06/2026", NADA_T, NADA_T),
             ("Política de privacidad", "Versión 1", "12/01/2026", "Versión 2", "01/11/2026")]
    keb = re.search(r'<span class="der envoltura">.*?</span>', t, re.S).group(0)
    cols = "minmax(0px, 1.4fr) 150px 140px 160px 140px 28px"
    cab = (f'<div class="tt-h" style="grid-template-columns: {cols};"><span aria-sort="ascending">Documento<span class="b2-fl" aria-hidden="true">↑</span></span>'
           '<span>Versión vigente</span><span>Vigente desde</span><span>Versión programada</span><span>Vigente desde</span><span class="sr">Acciones</span></div>')
    cuerpo = "".join(f'<div class="tt-f " style="grid-template-columns: {cols};"><span class="c1">{n}</span><span class="c1 n">{v}</span>'
                     f'<span class="c1 n">{d}</span><span class="c1 n">{p}</span><span class="c1 n">{pd}</span>'
                     f'{keb.replace("Términos y condiciones", n)}</div>' for n, v, d, p, pd in filas)
    i = t.index('<div class="tarjeta">')
    j = fin_div(t, i)
    t = t[:i] + f'<div class="tarjeta">{cab}{cuerpo}</div>' + t[j:]
    return tablero("Legales", "Documentos legales · un dato por columna · /plataforma/legales", css(), t, None, 1440, 900, otras=["Usuarios"])


def wa_difusiones_base2():
    t = copia("wadifusiones")
    t = una_vez(t, "<span>Resultados</span>", '<span style="text-align: right;">Entregados</span><span style="text-align: right;">Leídos</span>')
    t = re.sub(r"<span>(\d+) entregados · (\d+) leídos</span>", r'<span class="r">\1</span><span class="r">\2</span>', t)
    t = t.replace('<span><span style="color: var(--t3);">—</span></span><span>20/12',
                  '<span class="r"><span style="color: var(--t3);">—</span></span><span class="r"><span style="color: var(--t3);">—</span></span><span>20/12')
    extra = ".w-th.f, .w-tr.f { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) 119px 94px 130px 104px 90px 161px 64px !important; }\n"
    return tablero("WA-Difusiones", "WhatsApp · Difusiones · un dato por columna", css() + extra, t, None, 1440, 900)


TABLEROS = [("M-Filas-Base2", m_filas_base2), ("Legales-Base2", legales_base2), ("WA-Difusiones-Base2", wa_difusiones_base2)]


def main(solo=None):
    hechos = []
    for nombre, hacer in TABLEROS:
        if solo and nombre not in solo:
            continue
        escribir(nombre, hacer())
        hechos.append(nombre)
    return hechos


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or None)
