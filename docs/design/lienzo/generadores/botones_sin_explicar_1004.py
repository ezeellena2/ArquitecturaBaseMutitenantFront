"""El flujo de botones y avisos que decidió el usuario el 2026-10-24 (pedido de la Guía; evaluación del traspaso 2 en el back, A1).

«No quiero botones diciendo qué está pasando ni textos explicativos; si falta algo, los botones quedan grisados; al guardar, la
notificación de abajo como ya tiene el sistema; los errores con los estilos de siempre; nada de "Cambios sin guardar".»

- Criterio · Botones: sale de Prohibido «Deshabilitar un botón en vez de explicar qué falta» y entra el flujo; «Guardando…» pasa a
  «grisado con su mismo texto» (reemplaza la decisión del 05/10).
- Criterio · Marco: la segunda línea de la banda es el resumen o el estado del objeto, nunca «Cambios sin guardar».
- Saca «Cambios sin guardar» de los tableros del sistema. Los de formularios (E12 a E18) esperan otras decisiones del usuario y se
  redibujan de a una etapa: este generador no los toca. Tampoco cambia lo que sigue abierto: las opciones de menú apagadas con su
  motivo debajo y el botón que queda habilitado si falta un dato obligatorio.

Corre al final de todo, después de `menus_y_solo_lectura_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
APROBADO = True
PARA_APROBAR = " · para aprobar"

# Los de formularios que se redibujan con su etapa (evaluación del traspaso 2, §4)
FORMULARIOS = set("""FRM-Editor M-FRM-Editor FRM-Publicar FRM-Publicando FRM-Catalogo M-FRM-Catalogo FRM-Catalogo-Filtros M-FRM-Catalogo-Filtros
FRM-Catalogo-Propuesta FRM-Editor-Reglas M-FRM-Reglas FRM-Editor-Reglas-Plantilla M-FRM-Reglas-Plantilla FRM-Editor-Sugerencias FRM-Pdf
M-FRM-Respuesta-Aprobacion Plat-FRM-Plantilla Plat-FRM-Publicar Plat-FRM-Retirar Plat-FRM-Plantilla-Reglas Plat-FRM-Pdf Plat-FRM-Categorias
M-FRM-Plantilla FRM-Editor-Asistente""".split())
NO_TOCAR = FORMULARIOS | {"Criterio-Decisiones"}  # Decisiones sale de criterio_decisiones.py


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:100], t.count(a))
    return t.replace(a, b)


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


# ================================================================ Criterio · Botones
GIRA = '<span class="girar2" aria-hidden="true"></span>'
ALTO_BOTONES = 2540  # el flujo nuevo suma una sección: el contenido llega a 2486


def criterio_botones():
    t = leer("Criterio-Botones")
    if "Mientras trabaja" in t:
        return False
    t = r(t, f'<button type="button" class="cb cb-pri" disabled="{{si}}" style="opacity: 0.85;">{GIRA} Guardando…</button></div><strong>Guardando</strong>'
             "<p>Dice qué está haciendo y no se puede volver a tocar: «Guardando…», «Enviando…», «Verificando…», «Aceptando…», «Comprobando…», «Creando…», "
             "«Invitando…», «Agregando…», «Quitando…», «Desvinculando…», «Dando de baja…».</p>",
          f'<button type="button" class="cb cb-pri" disabled="{{si}}">{GIRA} Guardar cambios</button></div><strong>Mientras trabaja</strong>'
          "<p>Grisado, con el aro y su mismo texto, y no se puede volver a tocar. Nunca «Guardando…», «Invitando…» ni otro texto de espera.</p>")
    t = r(t, "<strong>Deshabilitado</strong><p>Solo «Guardar cambios» cuando no hay cambios, en todas las ediciones, también en los diálogos. "
             "Lo demás, siempre habilitado: si falta un dato, al tocarlo se marca el campo.</p>",
          "<strong>Grisado</strong><p>«Guardar cambios» se habilita cuando hay cambios, también en los diálogos. Lo que necesita algo antes queda grisado, "
          "como publicar con cambios sin guardar. Si falta un dato, sigue habilitado: al tocarlo se marca el campo.</p>")
    flujo = """<section>
    <h2>Habilitado o grisado, y nada más</h2>
    <ul class="reglas2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
      <li><strong>Un botón está habilitado o grisado,</strong> sin textos al lado ni debajo. Si el motivo no es obvio, va en su tooltip.</li>
      <li><strong>Que «Guardar cambios» esté habilitado ya dice que hay cambios.</strong> Al salir con cambios, se pregunta «¿Salir sin guardar?».</li>
      <li><strong>La banda no cuenta qué pasa:</strong> su segunda línea es el resumen o el estado del objeto, sin «Cambios sin guardar» ni números de revisión, que quedan en los historiales.</li>
      <li><strong>Lo que salió bien,</strong> en el aviso verde de abajo. <strong>Los errores,</strong> con sus estilos de siempre: debajo del campo o en el aviso rojo. Nunca va en rojo una fila recién agregada.</li>
      <li><strong>Las acciones van al borde derecho</strong> del encabezado de su superficie: la banda, la caja o el diálogo.</li>
      <li><strong>Lo que no se edita</strong> va en su campo, apagado y gris, sin textos al lado (A11, Criterio · Formularios), también lo elegido al crear que ya no se cambia.</li>
      <li><strong>Mientras dura un límite de pedidos,</strong> el botón queda grisado con su mismo texto, y cuándo se puede volver a probar lo dice el aviso de error.</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>"""
    t = r(t, "<section>\n    <h2>Prohibido</h2>", flujo) if "<section>\n    <h2>Prohibido</h2>" in t else r(t, "<section> <h2>Prohibido</h2>", flujo)
    t = r(t, "<li>Deshabilitar un botón en vez de explicar qué falta.</li>",
          "<li>Textos al lado o debajo de un botón: «No hay cambios para guardar», «Primero guardá los cambios», «Revisá los datos marcados».</li>"
          "<li>«Cambios sin guardar», números de revisión fuera del historial o un botón que cambia su texto mientras trabaja.</li>")
    t = t.replace('"$preview":{"width":1440,"height":2080}', f'"$preview":{{"width":1440,"height":{ALTO_BOTONES}}}', 1)
    t = t.replace("min-height: 2080px", f"min-height: {ALTO_BOTONES}px", 1)
    escribir("Criterio-Botones", t)
    return True


# ================================================================ Criterio · Marco
def criterio_marco():
    t = leer("Criterio-Marco")
    if "nunca «Cambios sin guardar»" in t:
        return False
    t = r(t, '<p class="res"><span class="suc">Cambios sin guardar</span></p>', '<p class="res"></p>')
    t = r(t, "<li><strong>La segunda línea</strong> lleva el resumen, el estado (punto y palabra) o «Cambios sin guardar».</li>",
          "<li><strong>La segunda línea</strong> lleva el resumen o el estado del objeto (punto y palabra), nunca «Cambios sin guardar» ni un número de revisión.</li>")
    escribir("Criterio-Marco", t)
    return True


# ================================================================ «Cambios sin guardar» fuera de los tableros del sistema
def subtitulo_normal(t, titulo):
    """El subtítulo que lleva la barra del teléfono de esa pantalla cuando no hay cambios."""
    m = re.findall(rf'<h1>{re.escape(titulo)}</h1><span class="sub">((?:(?!</span>).)*?|<span[^>]*>[^<]*</span>[^<]*)</span>', t)
    m = [x for x in m if "Cambios sin guardar" not in x]
    return m[0] if m else ""


def limpiar(n):
    t = leer(n)
    antes = t
    # La banda de la compu: el texto, con o sin su condición
    t = re.sub(r'<sc-if value="\{\{[a-zA-Z]+\}\}" hint-placeholder-val="\{\{no\}\}"><span[^>]*>Cambios sin guardar</span></sc-if>', "", t)
    t = re.sub(r' · <span class="amb-t">Cambios sin guardar</span>', "", t)
    t = re.sub(r'<sc-if value="\{\{[a-zA-Z]+\}\}" hint-placeholder-val="\{\{no\}\}">· <span[^>]*>Cambios sin guardar</span></sc-if>', "", t)
    # El teléfono de un usuario: con error o sin él, la barra lleva su dato
    t = re.sub(r'<sc-if value="\{\{noErr\}\}" hint-placeholder-val="\{\{si\}\}"><span class="sub">([^<]*)</span></sc-if>'
               r'<sc-if value="\{\{conErr\}\}" hint-placeholder-val="\{\{no\}\}"><span class="sub amb"><span>Cambios sin guardar</span></span></sc-if>',
               lambda m: '<span class="sub">' + m.group(1) + '</span>', t)
    # La barra del teléfono: vuelve su subtítulo de siempre
    for m in list(re.finditer(r'<h1>([^<]+)</h1><span class="sub amb"><span>Cambios sin guardar</span></span>', t)):
        sub = subtitulo_normal(t, m.group(1))
        t = t.replace(m.group(0), f'<h1>{m.group(1)}</h1>' + (f'<span class="sub">{sub}</span>' if sub else ""), 1)
    t = re.sub(r'<span class="sub amb">Cambios sin guardar</span>', "", t)
    # M-Usuario: el correo sigue al nombre (con el error, es Lucía; antes lo tapaba «Cambios sin guardar»)
    if n == "M-Usuario" and "correo:" not in t:
        t = t.replace('<h1>{{nombre}}</h1><span class="sub">tomas.acosta@delta.ejemplo.com</span>', '<h1>{{nombre}}</h1><span class="sub">{{correo}}</span>', 1)
        nombre = '      nombre: e === "Error al guardar" ? "Lucía Fernández" : "Tomás Acosta",\n'
        correo = '      correo: e === "Error al guardar" ? "lucia.fernandez@delta.ejemplo.com" : "tomas.acosta@delta.ejemplo.com",\n'
        t = t.replace(nombre, nombre + correo, 1)
    # Los comentarios del estilo
    t = t.replace("estado, «De sistema» y «Cambios sin guardar» van en la segunda línea", "estado y «De sistema» van en la segunda línea")
    t = t.replace("estado, detalle y «Cambios sin guardar» en la segunda línea", "estado y detalle en la segunda línea")
    # El nombre del estado en los Tweaks: «Con cambios»
    t = t.replace('"Cambios sin guardar"', '"Con cambios"').replace("'Cambios sin guardar'", "'Con cambios'")
    if t != antes:
        escribir(n, t)
    return t != antes, t.count("Cambios sin guardar")


def tableros_del_sistema():
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    hechos, quedan = [], []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        b = c["boards"].get(f.name)
        if not b or b.get("page") == "archivo" or n in NO_TOCAR or n.startswith("Criterio-"):
            continue
        if "Cambios sin guardar" not in f.read_text(encoding="utf-8"):
            continue
        cambio, resto = limpiar(n)
        if cambio:
            hechos.append(n)
        if resto:
            quedan.append((n, resto))
    return hechos, quedan


# ================================================================ Sin textos de espera ni cuenta regresiva en los botones (24/10)
T_LIMITE = "Hiciste muchos pedidos seguidos. Probá de nuevo en 0:41."
ESPERA_JS = ["Avisos", "Empresas", "Rol", "Usuario", "Asistente-Plat", "Organizaciones", "Registro-Empresa", "M-Registro-Empresa", "Empresa", "Usuarios"]
ESPERA_FIJA = {  # tablero: [(viejo, nuevo)]
    "WA-Alta": [('<button type="button" class="cb cb-pri" aria-disabled="true" style="opacity: 0.85;"><span class="ta-girar" aria-hidden="true"></span> Conectando…</button>',
                 '<button type="button" class="cb cb-pri" disabled><span class="ta-girar" aria-hidden="true"></span> Conectar número</button>')],
    "Plat-WA-Alta": [('<button type="button" class="cb cb-pri" aria-disabled="true" style="opacity: 0.85;"><span class="ta-girar" aria-hidden="true"></span> Conectando…</button>',
                      '<button type="button" class="cb cb-pri" disabled><span class="ta-girar" aria-hidden="true"></span> Conectar número</button>')],
    "Invitacion": [('<button type="button" class="b b-pri lg" disabled="{{si}}" style="opacity: 0.85;"><span class="girar2" aria-hidden="true"></span> Aceptando…</button>',
                    '<button type="button" class="b b-pri lg" disabled="{{si}}"><span class="girar2" aria-hidden="true"></span> Aceptar invitación</button>')],
    "M-Invitacion": [('<button type="button" class="b b-pri lg" disabled="{{si}}" style="opacity: 0.85;"><span class="girar2" aria-hidden="true"></span> Aceptando…</button>',
                      '<button type="button" class="b b-pri lg" disabled="{{si}}"><span class="girar2" aria-hidden="true"></span> Aceptar invitación</button>')],
    "WA-Chats-Formulario": [('<button type="button" class="cb cb-pri" disabled>Enviando…</button>', '<button type="button" class="cb cb-pri" disabled>Enviar</button>')],
    "M-WA-Chats-Formulario": [('<button type="button" class="cb cb-pri" disabled>Enviando…</button>', '<button type="button" class="cb cb-pri" disabled>Enviar</button>')],
    "Usuarios": [('<span>Hiciste muchos pedidos seguidos. Esperá un momento.</span><button type="button" class="b b-sec" disabled>Reintentá en 0:41</button>',
                  f'<span>{T_LIMITE}</span><button type="button" class="b b-sec" disabled>Reintentar</button>')],
    "M-Usuarios": [('Hiciste muchos pedidos seguidos. Esperá un momento.</span><button type="button" class="cb cb-sec" disabled>Reintentá en 0:41</button>',
                    f'{T_LIMITE}</span><button type="button" class="cb cb-sec" disabled>Reintentar</button>')],
}
CSS_SNACK = """.f-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 110px; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.f-snack .tx { flex: 1; min-width: 0; }
.f-snack .mal { color: oklch(0.75 0.15 25); display: inline-flex; }
.f-snack .x { color: oklch(1 0 0 / 0.7); display: inline-flex; background: none; border: 0; padding: 0; }
"""
ALERTA = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5"/><path d="M12 16.2h.01"/></svg>')
CERRAR = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
SNACK_MAL = ('<div class="f-snack" role="alert"><span class="mal"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
             '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg></span><span class="tx">{}</span>'
             '<button type="button" class="x" aria-label="Cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg></button></div>')


def sin_espera():
    hechos = []
    for n in ESPERA_JS:
        t = leer(n)
        t2 = re.sub(r"s\.[a-zA-Z]+ \? '[A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:ando|endo)…' : ", "", t)
        if t2 != t:
            escribir(n, t2)
            hechos.append(n)
    for n, pares in ESPERA_FIJA.items():
        t = leer(n)
        t2 = t
        for a, b in pares:
            t2 = t2.replace(a, b)
        if t2 != t:
            escribir(n, t2)
            hechos.append(n)
    # Rol: la cuenta del límite sale del botón; lo dice el aviso rojo, que no se va solo
    t = leer("Rol")
    if "Reintentá en 0:41" in t:
        t = r(t, "textoGuardar: s.limite ? 'Reintentá en 0:41' : ", "textoGuardar: ")
        t = re.sub(r'<sc-if value="\{\{hayLimite\}\}" hint-placeholder-val="\{\{no\}\}"><div class="w-cartel" role="alert">(?:<svg.*?</svg>)?<span class="tx">Hiciste muchos pedidos seguidos[^<]*</span></div></sc-if>', "", t, flags=re.S)
        aviso = ('<sc-if value="{{hayLimite}}" hint-placeholder-val="{{no}}"><div class="p-aviso mal" role="alert">'
                 f'<span style="color: oklch(0.55 0.2 25); display: inline-flex;">{ALERTA}</span><span class="o-tt"><span>{T_LIMITE}</span></span>'
                 f'<button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button></div></sc-if>')
        k = t.rindex("</div>\n</x-dc>")
        t = t[:k] + aviso + t[k:]
        escribir("Rol", t)
        hechos.append("Rol")
    # M-Rol: ídem, con la franja oscura del teléfono
    t = leer("M-Rol")
    if "Reintentá en 0:41" in t:
        t = re.sub(r'<div class="ap-cartel fila" role="alert" style="margin: 0 16px 10px;"><svg.*?</svg><span>Hiciste muchos pedidos seguidos\. Esperá un momento\.</span></div>', "", t, flags=re.S)
        t = r(t, '<button type="button" class="cb cb-pri full" disabled>Reintentá en 0:41</button></div>',
              '<button type="button" class="cb cb-pri full" disabled>Guardar cambios</button></div>' + SNACK_MAL.format(T_LIMITE))
        if ".f-snack {" not in t:
            t = t.replace("</helmet>", '<style data-c9="snack">\n' + CSS_SNACK + "</style>\n</helmet>", 1)
        escribir("M-Rol", t)
        hechos.append("M-Rol")
    # Avisos: el ejemplo «Demasiados pedidos» lleva el botón grisado y el aviso de error
    t = leer("Avisos")
    if "'Reintentá en '" in t:
        t = r(t, "textoGuardar: s.espera > 0 ? 'Reintentá en ' + Math.floor(s.espera / 60) + ':' + String(s.espera % 60).padStart(2, '0') : ", "textoGuardar: ")
        viejo = "return { ...base, zona: 'America/Argentina/Cordoba', espera: ESPERA };"
        if viejo in t:
            # 24/10: el botón queda grisado mientras dura la espera; cuándo probar de nuevo lo dice el aviso de error.
            t = t.replace(viejo, "return { ...base, zona: 'America/Argentina/Cordoba', espera: ESPERA, "
                                 "aviso: 'Hiciste muchos pedidos seguidos. Probá de nuevo en 0:42.', avisoTipo: 'error' };", 1)
        escribir("Avisos", t)
        hechos.append("Avisos")
    t = leer("M-Avisos")
    if "Reintentá en 0:39" in t:
        a = '<button type="button" class="cb cb-pri full apag">Reintentá en 0:39</button></div>'
        t = r(t, a, '<button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>' + SNACK_MAL.format("Hiciste muchos pedidos seguidos. Probá de nuevo en 0:39."))
        escribir("M-Avisos", t)
        hechos.append("M-Avisos")
    # El ingreso y el enlace: el mismo caso, un error por muchos pedidos («Reenviar en 30 s», al pedir un código, queda)
    for n in ("Ingreso", "M-Ingreso"):
        t = leer(n)
        if "'Reintentá en '" not in t:
            continue
        t = r(t, "textoEnviar: s.espera > 0 ? 'Reintentá en ' + mmss(s.espera) : 'Enviar código'", "textoEnviar: 'Enviar código'")
        t = r(t, "hayMsj: !!s.msj,", "hayMsj: !!s.msj || s.espera > 0,")
        t = r(t, "msjTipo: s.msj ? s.msj[0] : '',", "msjTipo: s.espera > 0 ? 'mal' : s.msj ? s.msj[0] : '',")
        t = r(t, "msjTexto: s.msj ? s.msj[1] : '',",
              "msjTexto: s.espera > 0 ? 'Hiciste muchos pedidos seguidos. Probá de nuevo en ' + mmss(s.espera) + '.' : s.msj ? s.msj[1] : '',")
        t = r(t, "msjSub: s.msj ? s.msj[2] : '',", "msjSub: s.espera > 0 ? '' : s.msj ? s.msj[2] : '',")
        escribir(n, t)
        hechos.append(n)
    for n in ("Enlace", "M-Enlace"):
        t = leer(n)
        if "Reintentá en {{textoEspera}}" not in t:
            continue
        t = r(t, '<button type="button" class="b b-pri lg" disabled="{{si}}">Reintentá en {{textoEspera}}</button>',
              '<button type="button" class="b b-pri lg" disabled="{{si}}">Continuar</button>')
        t = r(t, "msjTexto: 'Hiciste demasiadas solicitudes. Esperá un momento y volvé a intentar.'",
              "msjTexto: 'Hiciste muchos pedidos seguidos. Probá de nuevo en 0:' + String(s.espera).padStart(2, '0') + '.'")
        escribir(n, t)
        hechos.append(n)
    return hechos


def registrar(nombres):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    c["boards"]["Criterio-Botones.dc.html"]["h"] = ALTO_BOTONES
    for n in nombres:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


TOCADOS_ARCHIVO = PROJ / "generadores" / "botones_sin_explicar_tocados.json"

if __name__ == "__main__":
    print("Criterio · Botones", criterio_botones())
    print("Criterio · Marco", criterio_marco())
    hechos, quedan = tableros_del_sistema()
    print("sin «Cambios sin guardar»", len(hechos), hechos)
    print("quedan", quedan)
    espera = sin_espera()
    print("sin textos de espera ni cuenta regresiva", espera)
    # Los que cambian a la vista (los demás solo cambiaron un comentario del estilo o el nombre de un estado)
    tocados = sorted(set(json.loads(TOCADOS_ARCHIVO.read_text(encoding="utf-8"))) | set(espera))
    TOCADOS_ARCHIVO.write_text(json.dumps(tocados, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    registrar(tocados)
