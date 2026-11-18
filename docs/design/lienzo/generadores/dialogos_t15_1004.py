"""Unos diálogos y unas pantallas de ajustes repasados con la lista de chequeo de diseño (lienzo v175, 2026-11-18), con la decisión
213 de la hoja de ruta del back, que adopta lo que ArquitecturaBase rehízo del 8 al 11/11 («Diálogos con la lista de chequeo»), y
con la 209 y la 211. Cada tablero contestó las doce preguntas del README; acá se redibuja solo lo que no las pasaba:

- **Dar de baja un formulario** (`FRM-Dar-De-Baja`, `-18`, `-21` y `-23`; no tiene teléfono). Tenía tres títulos armados a mano y
  una tarjeta por consecuencia, con la explicación debajo (preguntas 4 y 6). Queda como en ArquitecturaBase: «Deja de pasar» y «Se
  conserva», cada uno con su título y en la grilla de lectura (`DetailGrid`), y un solo aviso, el de WhatsApp, que no se deshace,
  con el vencimiento del último envío abierto y la hora después de una coma (205). Las filas son las de la spec 17 y las que suman
  la 18 (fotos y documentos), la 21 (PDF, aprobaciones y lo que espera) y la 23 (el asistente y las sugerencias, con su explicación
  en la (i), que vuelven si se reactiva). Los envíos abiertos se conservan: se responden hasta vencer. «Consultando» no cambia.
- **Borrar un formulario** (`FRM-Reactivar-Eliminar`, los cuatro estados de borrar): lo que se afecta, en una frase (213), y sin la
  ✕, porque no se deshace (161). «No se deshace» se dice una vez, en el aviso de WhatsApp de uno publicado.
- **Enviar un formulario desde el chat** (`WA-Chats-Formulario`, `-16`, `-20` y `-Cliente`, con sus teléfonos). «Se puede mandar
  hasta el …» iba en un renglón suelto con un reloj, debajo del contador, y las opciones de cada catálogo, en «Motivo: 3 opciones»
  corrido (pregunta 4). Van juntos en la grilla de lectura, como en ArquitecturaBase, entre la lista y el mensaje: cada catálogo con
  sus opciones y «Se puede mandar hasta». El idioma no va: en el multitenant el contenido no tiene idioma (35). En la compu, el
  mensaje se leía con la letra del navegador (16 px y negro), otro tamaño que el resto del diálogo (pregunta 11): va con la de un
  campo. «Escribí el mensaje…» sale del campo vacío: solo un buscador lleva texto de ejemplo (`formularios.md`, pregunta 6).
- **Verificar un número o un correo** (`Cuenta-Verificar` y `M-Cuenta-Verificar`): el código iba suelto, sin su rótulo, y «Llega al
  WhatsApp de tu celular…» era una leyenda debajo (preguntas 1 y 6). Va en su campo, «Código», con la pieza común, y esa ayuda, en su
  (i), solo por WhatsApp; el error sigue debajo del campo.
- **Ajustes** (`Configuracion`, `Plat-Asistente-Config`, `-23` y `Asistente-Config-Org`, con sus teléfonos): cada zona ya es una cosa
  (la conexión con el proveedor va entera en «Clave y modelo»), así que las zonas no cambian. Lo que no pasaba: los campos con texto
  de ejemplo («Pegá la clave de Anthropic», «Claude Opus 5.5», «claude-opus-5-5»; pregunta 6) y la (i) de «Máximos del asistente de
  WhatsApp» (la 23), que en la compu no tenía su pieza (iba pegada al título) y en el teléfono faltaba (preguntas 11 y 12).
  `Configuracion` y `M-Configuracion` pasan sin cambios.

La grilla de lectura es la de `Criterio-Dialogos` (`.t15-dg`, el rótulo sobre arena clara) y en el teléfono, la de `M-Auditoria-Org`
(`.ap-det`, el rótulo encima del valor). Su estilo va en un bloque `<style data-dt15>` por tablero, con las medidas ya escaladas como
las deja la pasada de las piezas (180), así esa pasada no lo cambia.

Corre al final de todo, después de `traspaso15_textos_1004.py` y antes de la pasada de las piezas; al terminar imprime los tableros
para esa pasada. No toca `canvas.json`. Lee y escribe sin cambiar los finales de línea, y se puede volver a correr: lo que ya está
hecho no vuelve a encontrar lo que busca.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

INFO = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/></svg>')
ATENCION = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>')
RELOJ = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>')
LISTA = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5h10.5M9 12h10.5M9 17.5h10.5"/><circle cx="4.8" cy="6.5" r="1.1"/>'
         '<circle cx="4.8" cy="12" r="1.1"/><circle cx="4.8" cy="17.5" r="1.1"/></svg>')


def info(texto, clase="f-i"):
    return f'<span class="{clase}" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{INFO}</span>'


# ------------------------------------------------------------------------------------------------------------------ estilos
# La grilla de lectura de `Criterio-Dialogos`, con las medidas que deja la pasada de las piezas (el original, al lado).
CSS_GRILLA = """/* 213 · Lo que un diálogo dice que va a hacer, en la grilla de lectura (`DetailGrid`), como en Criterio · Diálogos. */
.t15-dg { display: grid; grid-template-columns: 150px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 3px/*10px*/; overflow: hidden; font-size: 10.7px/*13px*/; background: #fff; }
.t15-dg > span { padding: 6.5px/*9px*/ 8.6px/*12px*/; border-top: 1px solid var(--borde); line-height: 1.4; }
.t15-dg > span:nth-child(-n+2) { border-top: 0; }
.t15-dg > span:nth-child(odd) { background: oklch(0.975 0.012 95); color: var(--t2); }
"""
CSS_MENSAJE = """/* Pregunta 11 · El mensaje se lee con la letra de un campo, no con la del navegador. */
.w-dlg .w-cmp .ct { font-size: 10.7px/*13px*/; color: var(--t1); }
"""
# En el teléfono, la de `M-Auditoria-Org`: el rótulo encima del valor y una línea entre los datos. El teléfono no se escala.
CSS_GRILLA_TEL = """/* 213 · Lo que un diálogo dice que va a hacer, en la grilla de lectura del teléfono, como en M-Auditoria-Org. */
.t15-det { display: flex; flex-direction: column; }
.t15-det .ap-det { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--borde); }
.t15-det .ap-det:first-child { border-top: 0; padding-top: 0; }
.t15-det .ap-det:last-child { padding-bottom: 0; }
.t15-det .ap-det span { font-size: 13px; color: var(--t3); }
.t15-det .ap-det b { font-size: 15.5px; font-weight: 500; }
"""
CSS_INFO = """/* 213 · La (i) de un campo, como en los formularios. */
.f-i { display: inline-flex; vertical-align: middle; margin-left: 2.9px/*4px*/; color: var(--t3); cursor: help; }
"""
CSS_INFO_TEL = """/* 213 · La (i) de un campo, al lado del rótulo; el error, como el de cualquier campo. */
.f-i { display: inline-flex; vertical-align: -2px; margin-left: 4px; color: var(--t3); cursor: help; }
.ap-cmp .ap-err { margin: 0; }
"""


def con_estilo(t, css):
    """El bloque `data-dt15`, una vez y en su lugar: si ya está igual no se toca."""
    n = "\r\n" if "\r\n" in t else "\n"
    bloque = ('<style data-dt15="dialogos">\n' + css + "</style>\n").replace("\n", n)
    m = re.search(r'<style data-dt15="dialogos">.*?</style>\r?\n', t, flags=re.S)
    if m:
        return t if m.group(0) == bloque else t[:m.start()] + bloque + t[m.end():]
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", bloque + "</helmet>", 1)


# ------------------------------------------------------------------------------------------------------------------ ayudas
def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo, veces):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está, es una corrida anterior."""
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:140])
        return t
    assert k == veces, (viejo[:140], k, veces)
    return t.replace(viejo, nuevo)


def texto(html):
    return " ".join(re.sub(r"<[^>]+>", " ", html).split())


# ------------------------------------------------------------------------------------------------------------------ dar de baja
def grupo(titulo, filas):
    """Un grupo de datos con su título, como `GroupLabel` y `DetailGrid`: el título es el rótulo de un campo."""
    celdas = "".join(f"<span>{r}</span><span>{v}</span>" for r, v in filas)
    return (f'<div class="w-cmp" role="group" aria-label="{titulo}"><span class="rt">{titulo}</span>'
            f'<div class="t15-dg">{celdas}</div></div>')


def aviso(txt):
    return f'<div class="p-aviso " role="status">{ATENCION}<span>{txt}</span></div>'


NO_SE_DESHACE = "En WhatsApp no se deshace. "
REACTIVAR = " Para volver a usarlo, se reactiva con una versión nueva."
AVISO_ABIERTOS = aviso(NO_SE_DESHACE + "El último envío abierto vence el 25/10/2026, 18:40; después se deprecan sus Flows." + REACTIVAR)
AVISO_AHORA = aviso(NO_SE_DESHACE + "No hay envíos abiertos: se deprecan ahora sus Flows." + REACTIVAR)
CHAT = ("Chat", "No se manda más")
ASISTENTE = ("Asistente" + info("Sale de los formularios que ofrece en las conversaciones. Vuelve a ofrecerlo si se reactiva."),
             "No lo ofrece más")
SUGERENCIAS = ("Sugerencias" + info("Las de otros formularios hacia este. Vuelven si se reactiva."), "2 dejan de ofrecerse")
ABIERTOS = ("Envíos abiertos", "2, se pueden responder hasta que vencen")
ESPERAN = ("Aprobaciones pendientes", "3, se pueden seguir aprobando o rechazando")
R17 = ("Respuestas", "24")
R18 = ("Respuestas", "24, con sus fotos y documentos")
R21 = ("Respuestas", "24, con sus fotos, documentos, PDF y aprobaciones")


def cuerpo_baja(deja, conserva, nota):
    return grupo("Deja de pasar", deja) + grupo("Se conserva", conserva) + nota


# Lo que decía cada estado (para no pisar otra cosa) y lo que dice ahora. El estado «Consultando» (s2) no cambia.
VIEJO_17 = ("Qué deja de pasar No se manda más desde el chat Sale de «Enviar formulario». Envíos abiertos y WhatsApp 2 envíos abiertos "
            "Se pueden responder hasta que vencen. El último vence el 25/10/2026 a las 18:40. En WhatsApp no se deshace. Al vencer los "
            "envíos abiertos, se deprecan sus Flows. Para volver a usarlo, se reactiva con una versión nueva. Lo que se conserva ")
BAJA = {
    "FRM-Dar-De-Baja": {
        "s0": (VIEJO_17 + "Se conservan las 24 respuestas Siguen en la planilla y en el Excel.",
               cuerpo_baja([CHAT], [R17, ABIERTOS], AVISO_ABIERTOS)),
        "s1": ("Qué deja de pasar No se manda más desde el chat Sale de «Enviar formulario». Envíos abiertos y WhatsApp En WhatsApp no se "
               "deshace. No hay envíos abiertos: se deprecan ahora sus Flows. Para volver a usarlo, se reactiva con una versión nueva. Lo "
               "que se conserva Se conservan las 24 respuestas Siguen en la planilla y en el Excel.",
               cuerpo_baja([CHAT], [R17], AVISO_AHORA)),
        "s3": (VIEJO_17 + "Se conservan las 24 respuestas Siguen en la planilla y en el Excel.",
               cuerpo_baja([CHAT], [R17, ABIERTOS], AVISO_ABIERTOS)),
        "s4": ("No pudimos darlo de baja. No cambió nada. " + VIEJO_17 + "Se conservan las 24 respuestas Siguen en la planilla y en el Excel.",
               None),  # el error de arriba se conserva tal cual; el resto, como s0
    },
    "FRM-Dar-De-Baja-18": {
        "s0": (VIEJO_17 + "Se conservan las 24 respuestas, con sus fotos y documentos Siguen en la planilla y en el Excel.",
               cuerpo_baja([CHAT], [R18, ABIERTOS], AVISO_ABIERTOS)),
    },
    "FRM-Dar-De-Baja-21": {
        "s0": (VIEJO_17 + "Se conservan las 24 respuestas, con sus fotos, documentos, PDF y aprobaciones Siguen en la planilla y en el "
               "Excel. 3 respuestas esperan aprobación Se pueden seguir aprobando o rechazando.",
               cuerpo_baja([CHAT], [R21, ESPERAN, ABIERTOS], AVISO_ABIERTOS)),
    },
    "FRM-Dar-De-Baja-23": {
        "s0": ("Qué deja de pasar No se manda más desde el chat Sale de «Enviar formulario». El asistente no lo ofrece más Sale de los "
               "formularios que ofrece. 2 sugerencias hacia este formulario dejan de ofrecerse Vuelven si lo reactivás. "
               + VIEJO_17.removeprefix("Qué deja de pasar No se manda más desde el chat Sale de «Enviar formulario». ")
               + "Se conservan las 24 respuestas, con sus fotos, documentos, PDF y aprobaciones Siguen en la planilla y en el Excel. "
               "3 respuestas esperan aprobación Se pueden seguir aprobando o rechazando.",
               cuerpo_baja([CHAT, ASISTENTE, SUGERENCIAS], [R21, ESPERAN, ABIERTOS], AVISO_ABIERTOS)),
    },
}
ERROR_BAJA = re.compile(r'<div class="p-aviso mal" role="status"><svg.*?</svg><span>No pudimos darlo de baja\. No cambió nada\.</span></div>')


def pasar_baja(t, nombre):
    for estado, (viejo, nuevo) in BAJA[nombre].items():
        marca = '<sc-if value="{{' + estado + '}}" hint-placeholder-val="{{no}}"><div class="w-oscuro">'
        assert t.count(marca) == 1, (nombre, estado, t.count(marca))
        ini = t.index('<div class="db una">', t.index(marca)) + len('<div class="db una">')
        fin = t.index('</div><div class="df">', ini)
        cuerpo = t[ini:fin]
        if nuevo is None:  # «No se pudo»: la franja del error, arriba, y lo mismo que «Con envíos abiertos»
            error = ERROR_BAJA.match(cuerpo)
            assert error, (nombre, estado, cuerpo[:200])
            nuevo = error.group(0) + BAJA[nombre]["s0"][1]
        if cuerpo == nuevo:
            continue
        assert texto(cuerpo) == viejo, (nombre, estado, texto(cuerpo))
        t = t[:ini] + nuevo + t[fin:]
    return con_estilo(t, CSS_GRILLA)


# ------------------------------------------------------------------------------------------------------------------ borrar
CERRAR_BORRAR = re.compile(r'(<div class="dc"><span>¿Borrar «[^»]+»\?</span>)<button type="button" class="ib" aria-label="Cerrar"><svg.*?</svg></button>(</div>)')


def pasar_borrar(t):
    k = len(CERRAR_BORRAR.findall(t))
    assert k in (0, 4), k  # los cuatro estados de borrar; con 0, ya se corrió
    t = CERRAR_BORRAR.sub(r"\1\2", t)
    for prefijo, veces in (("REC", 3), ("HER", 1)):
        t = cambiar(t, f"Deja de aparecer en la lista y no se puede volver a usar. El prefijo {prefijo} queda reservado.",
                    f"Deja de aparecer en la lista, no se puede volver a usar y el prefijo {prefijo} queda reservado.", veces)
    assert t.count("¿Borrar «") == 8 and "no se puede volver a usar. El prefijo" not in t
    return t


# ------------------------------------------------------------------------------------------------------------------ enviar
HASTA = re.compile(r'<span class="[ct]-lin">' + re.escape(RELOJ) + r' Se puede mandar hasta el (\d{2}/\d{2}/\d{4}, \d{1,2}:\d{2})\.</span>')
OPCIONES_PC = re.compile(r'<div class="c-prep">((?:<span class="c-lin">' + re.escape(LISTA) + r' [^<:]+: \d+ opciones</span>)+)</div>')
OPCIONES_TEL = re.compile(r'(?:<span class="t-lin">' + re.escape(LISTA) + r' [^<:]+: \d+ opciones</span>)+')
UN_CATALOGO = re.compile(r'</svg> ([^<:]+): (\d+ opciones)</span>')
MENSAJE = {False: '<div class="w-cmp"><span class="rt">Mensaje que lo acompaña', True: '<div class="ap-cmp"><span class="rt"><span>Mensaje que lo acompaña'}
CUERPO = {False: ('<div class="db una">', '<div class="df">'), True: ('<div class="hb">', '<div class="hp">')}
# Lo que va entre la grilla y el mensaje, como en ArquitecturaBase: la preparación de las opciones y su problema.
ANTES_DEL_MENSAJE = ('<div class="p-prob"', '<div class="t-prob2"', '<div class="c-est">' + RELOJ + " Preparando las opciones")
SE_PUEDE = {"WA-Chats-Formulario": 20, "WA-Chats-Formulario-16": 3, "WA-Chats-Formulario-20": 4, "WA-Chats-Formulario-Cliente": 3,
            "M-WA-Chats-Formulario": 13, "M-WA-Chats-Formulario-16": 3, "M-WA-Chats-Formulario-20": 3, "M-WA-Chats-Formulario-Cliente": 2}


def grilla(filas, telefono):
    if telefono:
        return '<div class="t15-det">' + "".join(f'<div class="ap-det"><span>{r}</span><b>{v}</b></div>' for r, v in filas) + "</div>"
    return '<div class="t15-dg">' + "".join(f"<span>{r}</span><span>{v}</span>" for r, v in filas) + "</div>"


def balanceado(html):
    return html.count("<div") == html.count("</div>") and html.endswith("</div>")


def rehacer_envio(cuerpo, telefono):
    """Un diálogo (u hoja) de «Enviar un formulario»: el vencimiento y las opciones de cada catálogo, en la grilla."""
    hasta = HASTA.search(cuerpo)
    if not hasta:
        return cuerpo
    cuerpo = cuerpo[:hasta.start()] + cuerpo[hasta.end():]
    filas, donde = [], None
    opciones = (OPCIONES_TEL if telefono else OPCIONES_PC).search(cuerpo)
    if opciones:
        filas = UN_CATALOGO.findall(opciones.group(0))
        assert filas, opciones.group(0)[:200]
        cuerpo, donde = cuerpo[:opciones.start()] + cuerpo[opciones.end():], opciones.start()
    filas.append(("Se puede mandar hasta", hasta.group(1)))
    if donde is None:
        donde = cuerpo.index(MENSAJE[telefono])
        for marca in ANTES_DEL_MENSAJE:
            k = cuerpo.rfind(marca, 0, donde)
            if k >= 0 and balanceado(cuerpo[k:donde]):
                donde = k
                break
    return cuerpo[:donde] + grilla(filas, telefono) + cuerpo[donde:]


def pasar_envio(t, nombre):
    telefono = nombre.startswith("M-")
    ini_m, fin_m = CUERPO[telefono]
    partes, pos = [], 0
    for m in re.finditer(re.escape(ini_m) + r".*?" + re.escape(fin_m), t, flags=re.S):
        partes.append(t[pos:m.start()])
        partes.append(rehacer_envio(m.group(0), telefono))
        pos = m.end()
    partes.append(t[pos:])
    t = "".join(partes)
    # Sin texto de ejemplo en el mensaje vacío (solo un buscador lo lleva): está en «Falta el mensaje».
    if nombre in ("WA-Chats-Formulario", "M-WA-Chats-Formulario"):
        t = cambiar(t, '<div class="ct area mal ph">Escribí el mensaje…</div>', '<div class="ct area mal"></div>', 1)
    assert "Se puede mandar hasta el" not in t and "Escribí el mensaje…" not in t, nombre
    assert not OPCIONES_PC.search(t) and not OPCIONES_TEL.search(t), nombre
    fila = "<span>Se puede mandar hasta</span>" if not telefono else '<div class="ap-det"><span>Se puede mandar hasta</span>'
    assert t.count(fila) == SE_PUEDE[nombre], (nombre, t.count(fila))
    return con_estilo(t, CSS_GRILLA_TEL if telefono else CSS_GRILLA + CSS_MENSAJE)


# ------------------------------------------------------------------------------------------------------------------ verificar
NOTA_WA = "Llega al WhatsApp de tu celular. En WhatsApp Web no se muestra."
CODIGO_PC = re.compile(r'<div class="db">(<div class="p-otp[^"]*" role="group" aria-label="Código">.*?</div>)'
                       r'((?:<span class="err2" role="alert">[^<]*</span>)?)((?:<span class="o-nota">' + re.escape(NOTA_WA) + r"</span>)?)</div>")
CODIGO_TEL = re.compile(r'(<div class="ap-cod6[^"]*">.*?</div>)((?:<p class="ap-err" role="alert">[^<]*</p>)?)'
                        r'((?:<p class="ap-nwa">' + re.escape(NOTA_WA) + r"</p>)?)")


def pasar_verificar(t, telefono):
    if telefono:
        def campo(m):
            cajas = m.group(1).replace('">', '" role="group" aria-label="Código">', 1)
            ayuda = info(NOTA_WA) if m.group(3) else ""
            return f'<div class="ap-cmp"><span class="rt"><span>Código{ayuda}</span></span>{cajas}{m.group(2)}</div>'
        k = len(CODIGO_TEL.findall(t))
        assert k in (0, 5), k
        t = CODIGO_TEL.sub(campo, t)
        assert t.count('<span>Código<span class="f-i"') == 3 and "ap-nwa\">" not in t
        return con_estilo(t, CSS_INFO_TEL)

    def campo(m):
        ayuda = info(NOTA_WA) if m.group(3) else ""
        return f'<div class="db"><div class="w-cmp"><span class="rt">Código{ayuda}</span>{m.group(1)}{m.group(2)}</div></div>'
    k = len(CODIGO_PC.findall(t))
    assert k in (0, 5), k
    t = CODIGO_PC.sub(campo, t)
    assert t.count('<span class="rt">Código') == 5 and 'class="o-nota">Llega' not in t
    return con_estilo(t, CSS_INFO)


# ------------------------------------------------------------------------------------------------------------------ ajustes
MAXIMOS = "Cada organización elige sus límites del asistente de WhatsApp dentro de estos máximos."
TITULO_TEL = '<span class="ap-gtit" style="margin: 14px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">'


def pasar_ajustes(t, nombre):
    telefono = nombre.startswith("M-")
    if telefono:
        t = cambiar(t, '<div class="ct ph">Pegá la clave de Anthropic</div>', '<div class="ct"></div>', 1)
    else:
        t = cambiar(t, 'placeholder="Pegá la clave de Anthropic"', 'placeholder=""', 1)
    if nombre.startswith(("Plat-", "M-Plat-")) and not telefono:
        t = cambiar(t, 'placeholder="Claude Opus 5.5"', 'placeholder=""', 1)
        t = cambiar(t, 'placeholder="claude-opus-5-5"', 'placeholder=""', 1)
    if nombre == "Plat-Asistente-Config-23":
        t = cambiar(t, '<span class="f-i" tabindex="0" role="img" aria-label="' + MAXIMOS, '<span class="as-i" tabindex="0" role="img" aria-label="' + MAXIMOS, 1)
    if nombre == "M-Plat-Asistente-Config-23":
        t = cambiar(t, TITULO_TEL + "Máximos del asistente de WhatsApp</span>",
                    TITULO_TEL + "<span>Máximos del asistente de WhatsApp" + info(MAXIMOS, "as-i") + "</span></span>", 1)
    assert "Pegá la clave" not in t and 'placeholder="Claude' not in t and 'placeholder="claude' not in t, nombre
    return t


TABLEROS = {
    **{n: pasar_baja for n in BAJA},
    "FRM-Reactivar-Eliminar": lambda t, n: pasar_borrar(t),
    **{n: pasar_envio for n in SE_PUEDE},
    "Cuenta-Verificar": lambda t, n: pasar_verificar(t, False),
    "M-Cuenta-Verificar": lambda t, n: pasar_verificar(t, True),
    **{n: pasar_ajustes for n in ("Plat-Asistente-Config", "Plat-Asistente-Config-23", "M-Plat-Asistente-Config",
                                  "M-Plat-Asistente-Config-23", "Asistente-Config-Org", "M-Asistente-Config-Org")},
}

if __name__ == "__main__":
    cambiados = []
    for nombre, pasar in TABLEROS.items():
        t = leer(nombre)
        nuevo = pasar(t, nombre)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(TABLEROS), "tableros,", len(cambiados), "cambiados")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TABLEROS))
