"""v117 (2026-10-10): lo que pidió la Guía para las etapas 9 y 11.
- Etapa 9, el segundo factor de los operadores (plan maestro, ADR 0042 y 0044):
  - Ingreso y M-Ingreso suman «Operador: demasiados códigos incorrectos» (el bloqueo de la cuenta, `Identity.Account.LockedOut`),
    «Operador: código de recuperación incorrecto» y «Operador: configurar · código incorrecto».
  - Mapa-Ingreso suma el bloqueo por el autenticador, usa el código real del bloqueo y corrige «Lo que nunca se revela» según la 0043.
  - Cuenta-Plat y M-Cuenta-Plat: «Confirmá que sos vos» (la reautenticación antes de una acción sensible, dibujada al guardar
    permisos), su error, y «Restablecer el autenticador» en el ⋮ de un operador, con motivo.
- Etapa 11, al día con las ADR 0043 a 0049:
  - Plat-WA-Plantillas y M-Plat-WA-Plantillas: «Del sistema» con las 16 del catálogo de la Etapa 8 (0049), de a 10; la plantilla de
    consultas «Tu organización ya está activa» pasa a «Te pedimos un dato más», porque ese aviso ya es del sistema.
  - Plat-WA-Bot, M-Plat-WA-Bot y Plat-WA-Bot-Recorrido: «Entrar a mi cuenta» también manda el registro a un número sin cuenta (0049).
  - Plat-WA-Numero y M-Plat-WA-Numero: los avisos son de la cuenta y de la organización (0049).
  - Asistente-Personal y M-Asistente-Personal: «Mis mensajes con empresas: con mensajes», la fuente que registra la Etapa 11 (0049).
  - WA-Telefonos: el menú y el panel de Administración vigentes (con «Asistente», 0048), copiados de WA-Admin.
Lleva `data-vuelta="1004-v117"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rango_bloque, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-v117"'
textos = {}
css = {}
OP = "cuenta: 'Martín (operador de la plataforma)'"
CANDADO = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>')


def tocar(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    return None if MARCA in t else t


def casillas(prefijo, clase, valores, deshab=""):
    d = f' disabled="{deshab}"' if deshab else ""
    ins = "".join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Código {k + 1}" value="{v}"{d}>' for k, v in enumerate(valores))
    return f'<div class="otp {clase}" role="group" aria-label="Código">{ins}</div>'


# ---------------------------------------------------------------- Etapa 9 · Ingreso
for nombre in ["Ingreso", "M-Ingreso"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, f"  'Operador: código del autenticador incorrecto': {{ {OP}, paso: 'totp', tot: COD('120934'), malTot: true, msj: ['mal', 'El código no es válido.', 'Revisá que la hora de tu celular esté bien.'] }},\n",
            f"  'Operador: código del autenticador incorrecto': {{ {OP}, paso: 'totp', tot: COD('120934'), malTot: true, msj: ['mal', 'El código no es válido.', 'Revisá que la hora de tu celular esté bien.'] }},\n"
            "  // Etapa 9: los códigos del autenticador cuentan para el mismo bloqueo de la cuenta (Identity.Account.LockedOut).\n"
            f"  'Operador: demasiados códigos incorrectos': {{ {OP}, paso: 'totp', tot: COD('774201'), malTot: true, totBloq: true, msj: ['mal', 'Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos.', 'Probá de nuevo en 15 minutos.'] }},\n")
    t = rep(t, f"  'Operador: código de recuperación': {{ {OP}, paso: 'totp', recuperacion: true }},\n",
            f"  'Operador: código de recuperación': {{ {OP}, paso: 'totp', recuperacion: true }},\n"
            "  // Cada código de recuperación sirve una sola vez.\n"
            f"  'Operador: código de recuperación incorrecto': {{ {OP}, paso: 'totp', recuperacion: true, rec: 'P4TZ-8WNE', malRec: true, msj: ['mal', 'Ese código no es válido o ya lo usaste.', ''] }},\n")
    t = rep(t, f"  'Operador: configurar el autenticador': {{ {OP}, paso: 'alta' }},\n",
            f"  'Operador: configurar el autenticador': {{ {OP}, paso: 'alta' }},\n"
            f"  'Operador: configurar · código incorrecto': {{ {OP}, paso: 'alta', alt: COD('551203'), malAlt: true, msj: ['mal', 'El código no es válido.', 'Revisá que la hora de tu celular esté bien.'] }},\n")
    t = sumar_opcion(t, "Operador: código del autenticador incorrecto", "Operador: demasiados códigos incorrectos")
    t = sumar_opcion(t, "Operador: código de recuperación", "Operador: código de recuperación incorrecto")
    t = sumar_opcion(t, "Operador: configurar el autenticador", "Operador: configurar · código incorrecto")
    t = rep(t, "recuperacion: !!e.recuperacion, rec: '', alt: [...VACIO],",
            "recuperacion: !!e.recuperacion, rec: e.rec ?? '', malRec: !!e.malRec, alt: e.alt ?? [...VACIO], malAlt: !!e.malAlt, totBloq: !!e.totBloq,")
    t = rep(t, "      malRec: '',\n", "      malRec: s.malRec ? 'mal' : '',\n      totBloq: s.totBloq,\n")
    t = rep(t, "      onRec: (e) => this.setState({ rec: e.target.value, msj: null }),",
            "      onRec: (e) => this.setState({ rec: e.target.value, msj: null, malRec: false }),")
    t = rep(t, "      alt: { ...this.casillas('alt', () => ({ msj: null })), clase: '' },",
            "      alt: { ...this.casillas('alt', () => ({ msj: null, malAlt: false })), clase: s.malAlt ? 'mal' : '' },")
    # Bloqueada: las casillas y «Verificar» quedan apagados.
    i, j = rango_bloque(t, "enTotp")
    b = t[i:j]
    k0 = b.index('<div class="otp {{tot.clase}}"')
    k1 = b.index("</div>", k0)
    grupo = b[k0:k1]
    assert grupo.count('disabled="{{no}}"') == 6
    b = b[:k0] + grupo.replace('disabled="{{no}}"', 'disabled="{{totBloq}}"') + b[k1:]
    b = rep(b, '<button type="button" class="b b-pri lg" onClick="{{verificarTotp}}">Verificar</button>',
            '<button type="button" class="b b-pri lg" onClick="{{verificarTotp}}" disabled="{{totBloq}}">Verificar</button>')
    t = t[:i] + b + t[j:]
    textos[nombre] = t

t = tocar("Mapa-Ingreso")
if t:
    t = rep(t, '<span class="c">400 Auth.TwoFactor.Invalid</span></a>',
            '<span class="c">400 Auth.TwoFactor.Invalid</span></a>\n'
            '    <a class="caso" href="Ingreso.dc.html"><span class="t">Demasiados códigos del autenticador</span><span class="d">Operadores. El mismo bloqueo de la cuenta: 15 minutos.</span><span class="c">429 Identity.Account.LockedOut</span></a>')
    t = rep(t, '<span class="c">429 Auth.Account.LockedOut</span>', '<span class="c">429 Identity.Account.LockedOut</span>')
    t = rep(t, '<div class="caso"><span class="t">Si un correo tiene cuenta</span><span class="d">Pedir un código responde igual siempre. En el registro, si el correo ya existe, la pantalla es la misma y el correo que llega dice «Ya tenés una cuenta» con un código para entrar.</span></div>',
            '<div class="caso"><span class="t">Si un correo es de un operador</span><span class="d">Nada menciona al operador ni a Plataforma antes del código. Recién después, una pantalla privada lo manda a Plataforma (0043).</span></div>')
    textos["Mapa-Ingreso"] = t

# ---------------------------------------------------------------- Etapa 9 · la ficha de un operador
REAUTH_TXT = "Para guardar los permisos de Laura Díaz, escribí el código de tu app de autenticación."
REAUTH_ERR = "El código no es válido. Revisá que la hora de tu celular esté bien."
REST_TXT = "Se cierran sus sesiones y sus códigos de recuperación dejan de servir. Al volver a entrar, configura el autenticador de nuevo."
REST_MOTIVO = "Cambió de celular y perdió los códigos."

t = tocar("Cuenta-Plat")
if t:
    t = sumar_opcion(t, "Operador: quitar operador", "Operador: restablecer el autenticador", prop="cuenta")
    t = sumar_opcion(t, "Operador: restablecer el autenticador", "Operador: confirmar que sos vos", prop="cuenta")
    t = sumar_opcion(t, "Operador: confirmar que sos vos", "Operador: confirmar que sos vos · código incorrecto", prop="cuenta")
    t = rep(t, "      dlgQuitar: this.props.cuenta === 'Operador: quitar operador',\n",
            "      dlgQuitar: this.props.cuenta === 'Operador: quitar operador',\n"
            "      dlgRestablecer: this.props.cuenta === 'Operador: restablecer el autenticador',\n"
            "      // Etapa 9: una acción sensible pide el código del autenticador si el último no es reciente.\n"
            "      dlgReauth: (this.props.cuenta || '').startsWith('Operador: confirmar que sos vos'),\n"
            "      reauthMal: this.props.cuenta === 'Operador: confirmar que sos vos · código incorrecto',\n")
    t = rep(t, '<div class="menu der" role="menu"><button type="button" class="menu-it pel" role="menuitem">',
            f'<div class="menu der" role="menu"><button type="button" class="menu-it" role="menuitem">{CANDADO} Restablecer el autenticador</button>'
            '<button type="button" class="menu-it pel" role="menuitem">')
    i, j = rango_bloque(t, "dlgQuitar")
    rest = ('<sc-if value="{{dlgRestablecer}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" '
            'aria-label="¿Restablecer el autenticador de Laura Díaz?"><div class="dlg-h"><h2>¿Restablecer el autenticador de Laura Díaz?</h2></div>'
            f'<div class="dlg-t">{REST_TXT}</div><div class="dlg-b una" style="padding-top: 0;"><div class="campo2"><label class="et">Motivo'
            f'<span class="req" aria-hidden="true">*</span></label><textarea class="in2">{REST_MOTIVO}</textarea></div></div>'
            '<div class="dlg-f"><button type="button" class="b b-sec">Cancelar</button><button type="button" class="b b-pel">Restablecer</button></div></div></div></sc-if>')
    reauth = ('<sc-if value="{{dlgReauth}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg chico" role="dialog" aria-modal="true" '
              'aria-label="Confirmá que sos vos"><div class="dlg-h"><h2>Confirmá que sos vos</h2></div>'
              f'<div class="dlg-t">{REAUTH_TXT}</div><div class="dlg-b una ra" style="padding-top: 0;">'
              '<sc-if value="{{reauthMal}}" hint-placeholder-val="{{no}}">' + casillas("ra", "mal", "120934")
              + f'<span class="err2" role="alert">{REAUTH_ERR}</span></sc-if>'
              '<sc-if value="{{reauthBien}}" hint-placeholder-val="{{si}}">' + casillas("ra", "", [""] * 6) + '</sc-if>'
              '<button type="button" class="lnk ra-rec">Usar un código de recuperación</button></div>'
              '<div class="dlg-f"><button type="button" class="b b-sec">Cancelar</button><button type="button" class="b b-pri">Confirmar</button></div></div></div></sc-if>')
    t = t[:j] + rest + reauth + t[j:]
    t = rep(t, "      reauthMal: this.props.cuenta === 'Operador: confirmar que sos vos · código incorrecto',\n",
            "      reauthMal: this.props.cuenta === 'Operador: confirmar que sos vos · código incorrecto',\n"
            "      reauthBien: this.props.cuenta !== 'Operador: confirmar que sos vos · código incorrecto',\n")
    textos["Cuenta-Plat"] = t
    css["Cuenta-Plat"] = """.ra .otp { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.ra .otp input { height: 48px; width: 100%; box-sizing: border-box; padding: 0; border: 1px solid var(--borde2); border-radius: 10px; text-align: center; font-size: 20px; font-weight: 600; color: var(--t1); font-variant-numeric: tabular-nums; background: #fff; font-family: inherit; }
.ra .otp.mal input { border-color: var(--peligro); background: var(--peligro-t); }
.ra { gap: 10px !important; }
.ra .ra-rec { justify-self: start; font-size: 13.5px; margin-top: 4px; }
"""

t = tocar("M-Cuenta-Plat")
if t:
    i, j = rango_bloque(t, "e4")
    e4 = t[i:j]
    k = e4.index('<div class="ap-velo"></div>')
    x = re.search(r'<button type="button" class="ap-ib" aria-label="Cerrar">.*?</button>', e4[k:], re.S).group(0)
    i1, j1 = rango_bloque(t, "e1")
    e1 = t[i1:j1]
    assert e1.endswith("</sc-if>")

    def con_hoja(var, titulo, cuerpo, pie):
        hoja = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="' + titulo + '"><span class="asa"></span>'
                f'<div class="hc"><div><h2>{titulo}</h2></div>{x}</div><div class="hb">{cuerpo}</div><div class="hp">{pie}</div></div>')
        b = re.sub(r'^<sc-if value="\{\{e1\}\}" hint-placeholder-val="\{\{(si|no)\}\}">', '<sc-if value="{{' + var + '}}" hint-placeholder-val="{{no}}">', e1, count=1)
        return b[:-len("</sc-if>")] + hoja + "</sc-if>"

    rest = con_hoja("e7", "¿Restablecer el autenticador de Laura Díaz?",
                    f'<p class="ap-txt-l">{REST_TXT}</p><div class="ap-cmp"><span class="rt"><span>Motivo <span class="rq">*</span></span></span>'
                    f'<div class="ct area">{REST_MOTIVO}</div></div>',
                    '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Restablecer</button>')
    pie_ra = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Confirmar</button>'
    ra = con_hoja("e8", "Confirmá que sos vos", f'<p class="ap-txt-l">{REAUTH_TXT}</p><div class="ra">' + casillas("ra", "", [""] * 6)
                  + '<button type="button" class="ra-rec">Usar un código de recuperación</button></div>', pie_ra)
    ra_mal = con_hoja("e9", "Confirmá que sos vos", f'<p class="ap-txt-l">{REAUTH_TXT}</p><div class="ra">' + casillas("ra", "mal", "120934")
                      + f'<span class="ra-err" role="alert">{REAUTH_ERR}</span><button type="button" class="ra-rec">Usar un código de recuperación</button></div>', pie_ra)
    t = t[:j] + rest + ra + ra_mal + t[j:]
    t = sumar_opcion(t, "Operador: quitar operador", "Operador: restablecer el autenticador")
    t = sumar_opcion(t, "Operador: restablecer el autenticador", "Operador: confirmar que sos vos")
    t = sumar_opcion(t, "Operador: confirmar que sos vos", "Operador: confirmar que sos vos · código incorrecto")
    t = rep(t, '      e4: e === "Operador: quitar operador",\n',
            '      e4: e === "Operador: quitar operador",\n'
            '      e7: e === "Operador: restablecer el autenticador",\n'
            '      e8: e === "Operador: confirmar que sos vos",\n'
            '      e9: e === "Operador: confirmar que sos vos · código incorrecto",\n')
    t = rep(t, '<span role="menuitem">Cambiar permisos</span><span class="sep" role="separator"></span>',
            '<span role="menuitem">Cambiar permisos</span><span role="menuitem">Restablecer el autenticador</span><span class="sep" role="separator"></span>')
    textos["M-Cuenta-Plat"] = t
    css["M-Cuenta-Plat"] = """.ra { display: flex; flex-direction: column; gap: 10px; }
.ra .otp { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.ra .otp input { height: 52px; width: 100%; box-sizing: border-box; padding: 0; border: 1px solid var(--borde2); border-radius: 12px; text-align: center; font-size: 22px; font-weight: 600; color: var(--t1); font-variant-numeric: tabular-nums; background: #fff; font-family: inherit; }
.ra .otp.mal input { border-color: var(--peligro); background: var(--peligro-t); }
.ra-err { font-size: 14px; color: oklch(0.5 0.19 25); }
.ra-rec { align-self: flex-start; border: 0; background: transparent; padding: 6px 0; font: inherit; font-size: 15px; font-weight: 600; color: var(--marca-tx); cursor: pointer; }
"""

# ---------------------------------------------------------------- Etapa 11 · Plantillas de la plataforma
NUEVAS = [("Baja iniciada por la plataforma", "baja_cuenta_plataforma", "04/10/2026"),
          ("Baja por la plataforma, cuenta suspendida", "baja_cuenta_plataforma_suspendida", "04/10/2026"),
          ("Aviso de recuperación a la cuenta", "recuperacion_aviso_cuenta", "06/10/2026"),
          ("Organización aprobada", "organizacion_aprobada", "08/10/2026"),
          ("Organización rechazada", "organizacion_rechazada", "08/10/2026"),
          ("Página pública moderada", "pagina_publica_moderada", "08/10/2026")]

t = tocar("Plat-WA-Plantillas")
if t:
    t = rep(t, "12 plantillas · 11 aprobadas", "18 plantillas · 17 aprobadas")
    t = rep(t, 'Del sistema <span class="c">10</span>', 'Del sistema <span class="c">16</span>', 2)
    t = rep(t, "Tu organización ya está activa", "Te pedimos un dato más", 2)
    i, j = rango_bloque(t, "e1")
    b = t[i:j]
    m = re.search(r'<div class="w-tr t"><span class="dos"><b>Recuperación rechazada</b>.*?</button></span></div>', b, re.S)
    modelo = m.group(0)
    filas = "".join(modelo.replace("Recuperación rechazada", n).replace("recuperacion_rechazada", s).replace("15/09/2026", f) for n, s, f in NUEVAS)
    a = b.index('<div class="w-tr t">')
    assert b.endswith("</div></sc-if>")
    fin = len(b) - len("</div></sc-if>")
    b = (b[:a] + '<sc-if value="{{pag1}}" hint-placeholder-val="{{si}}">' + b[a:fin] + "</sc-if>"
         + '<sc-if value="{{pag2}}" hint-placeholder-val="{{no}}">' + filas + "</sc-if>"
         + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · {{pagina}}</span></div></div></sc-if>')
    t = t[:i] + b + t[j:]
    t = sumar_opcion(t, "Del sistema", "Del sistema: página 2", prop="pestana")
    t = rep(t, '      e1: e === "Del sistema",\n',
            '      e1: e.startsWith("Del sistema"),\n'
            '      pag1: e !== "Del sistema: página 2",\n'
            '      pag2: e === "Del sistema: página 2",\n'
            '      rango: e === "Del sistema: página 2" ? "11–16 de 16" : "1–10 de 16",\n'
            '      pagina: e === "Del sistema: página 2" ? "Página 2 de 2" : "Página 1 de 2",\n')
    textos["Plat-WA-Plantillas"] = t
    css["Plat-WA-Plantillas"] = ".w-tr .dos > span { white-space: normal; overflow-wrap: anywhere; }\n"

t = tocar("M-Plat-WA-Plantillas")
if t:
    t = rep(t, 'Del sistema <span class="c">10</span>', 'Del sistema <span class="c">16</span>', 2)
    t = rep(t, "Tu organización ya está activa", "Te pedimos un dato más", 2)
    i, j = rango_bloque(t, "e1")
    b = t[i:j]
    k = b.rindex('</div><a class="ap-fab"')
    b = b[:k] + '<div class="ap-mas"><button type="button" class="cb cb-sec">Cargar más</button></div>' + b[k:]
    t = t[:i] + b + t[j:]
    textos["M-Plat-WA-Plantillas"] = t
    css["M-Plat-WA-Plantillas"] = """.ap-mas { display: flex; justify-content: center; padding: 14px 16px 92px; }
.ap-mas .cb { height: 44px; padding: 0 22px; border-radius: 12px; }
"""

# ---------------------------------------------------------------- Etapa 11 · Bot y número de la plataforma (0049)
for nombre in ["Plat-WA-Bot", "M-Plat-WA-Bot"]:
    t = tocar(nombre)
    if t:
        textos[nombre] = rep(t, "<b>Entrar a mi cuenta</b><span>Manda el enlace para entrar</span>",
                             "<b>Entrar a mi cuenta</b><span>Manda el enlace para entrar o registrarse</span>")
t = tocar("Plat-WA-Bot-Recorrido")
if t:
    textos["Plat-WA-Bot-Recorrido"] = rep(t, "<b>Enlace para entrar</b><span>Lo manda el bot</span>",
                                          "<b>Enlace para entrar o registrarse</b><span>Lo manda el bot</span>")
for nombre in ["Plat-WA-Numero", "M-Plat-WA-Numero"]:
    t = tocar(nombre)
    if t:
        textos[nombre] = rep(t, "<b>Códigos, invitaciones y avisos de la cuenta</b>",
                             "<b>Códigos, invitaciones y avisos de la cuenta y de la organización</b>", 2)

# ---------------------------------------------------------------- Etapa 11 · Mis mensajes con empresas (0049)
for nombre, destino in [("Asistente-Personal", "WA-Mensajes.dc.html"), ("M-Asistente-Personal", "M-WA-Mensajes.dc.html")]:
    t = tocar(nombre)
    if not t:
        continue
    flecha = re.search(r'<a class="as-ir" href="Perfil-Suspendido\.dc\.html">Ver Beta S\.R\.L\. (<svg.*?</svg>)</a>', t, re.S).group(1)
    i, j = rango_bloque(t, "asVacio")
    vacio = t[i:j]
    con = vacio.replace('<sc-if value="{{asVacio}}"', '<sc-if value="{{asConMensajes}}"', 1)
    con = rep(con, "<p>Todavía no tenés mensajes con empresas.</p>",
              '<p>Tenés mensajes con <b>3 empresas</b>:</p><ul><li>La Clementina <span class="s">· hoy, 10:42</span></li>'
              '<li>Grupo Delta <span class="s">· ayer</span></li><li>Ferretería Rosales <span class="s">· 28/09</span></li></ul>'
              f'<a class="as-ir" href="{destino}">Ver mis mensajes {flecha}</a>')
    t = t[:j] + con + t[j:]
    t = sumar_opcion(t, "Mis mensajes con empresas: sin mensajes", "Mis mensajes con empresas: con mensajes", prop="asistente")
    t = rep(t, '["Mis mensajes con empresas: sin mensajes", "Consultando",',
            '["Mis mensajes con empresas: sin mensajes", "Mis mensajes con empresas: con mensajes", "Consultando",')
    t = rep(t, "      asConResultados: e !== 'Mis mensajes con empresas: sin mensajes',\n",
            "      asConResultados: !e.startsWith('Mis mensajes con empresas'),\n"
            "      // Etapa 11: WhatsApp registra la fuente de «Mis mensajes con empresas» (0049).\n"
            "      asConMensajes: e === 'Mis mensajes con empresas: con mensajes',\n")
    t = rep(t, "      asActiva: conv && e !== 'Mis mensajes con empresas: sin mensajes' ? 'on' : '',",
            "      asActiva: conv && !e.startsWith('Mis mensajes con empresas') ? 'on' : '',")
    textos[nombre] = t

# ---------------------------------------------------------------- Etapa 11 · Cargar teléfonos con el menú vigente (0048)
t = tocar("WA-Telefonos")
if t:
    admin = (PROJ / "WA-Admin.dc.html").read_text(encoding="utf-8")
    cuerpo = lambda s: s[s.index("</helmet>"):]  # noqa: E731
    asides_a = list(re.finditer(r"<aside.*?</aside>", cuerpo(admin), re.S))
    assert len(asides_a) == 2
    menu, panel = asides_a[0].group(0), asides_a[1].group(0)
    g = re.search(r'<a class="w-ln grupo" href="Usuarios\.dc\.html">(<svg.*?</svg>) Gestión de usuarios <span class="fl">(<svg.*?</svg>)</span></a>', panel, re.S)
    w = re.search(r'<span class="w-ln grupo">(<svg.*?</svg>) WhatsApp <span class="fl">(<svg.*?</svg>)</span></span><div class="w-hijos">.*?</div>', panel, re.S)
    sg, derecha = g.group(1), g.group(2)
    sw, abajo = w.group(1), w.group(2)
    panel = panel.replace(g.group(0), f'<span class="w-ln grupo">{sg} Gestión de usuarios <span class="fl">{abajo}</span></span>'
                          '<div class="w-hijos"><a class="w-ln on" href="Usuarios.dc.html">Usuarios</a><a class="w-ln" href="Roles.dc.html">Roles y permisos</a></div>')
    panel = panel.replace(w.group(0), f'<a class="w-ln grupo" href="WA-Admin.dc.html">{sw} WhatsApp <span class="fl">{derecha}</span></a>')
    base = t.index("</helmet>")
    asides_t = list(re.finditer(r"<aside.*?</aside>", t[base:], re.S))
    assert len(asides_t) == 2
    (m0, m1) = asides_t
    t = t[:base + m0.start()] + menu + t[base + m0.end():base + m1.start()] + panel + t[base + m1.end():]
    assert "Asistente-Config-Org.dc.html" in t
    textos["WA-Telefonos"] = t

for nombre, t in textos.items():
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}>\n{css.get(nombre, '')}</style>\n</helmet>"), encoding="utf-8")
print("tableros", list(textos))
