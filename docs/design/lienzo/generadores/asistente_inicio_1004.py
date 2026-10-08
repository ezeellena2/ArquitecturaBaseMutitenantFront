"""El asistente en el inicio (ADR 0048 del back y la propuesta del asistente, §7 puntos 1 y 2; v114, 2026-10-07).
- Compu: el inicio de los tres lados es el asistente: historial a la izquierda (Nueva conversación, Guardadas y Recientes, ⋮ con Guardar,
  Renombrar, Exportar y Borrar), «¿Qué querés consultar?» con la caja, las consultas fijas como botones y lo de hoy como bienvenida
  («Para resolver» y las tarjetas). Asistente-Org (sobre Inicio-Org), Asistente-Personal (sobre Inicio-Personal) e Asistente-Plat
  (sobre Organizaciones: Plataforma no tenía inicio; suma «Inicio» al menú).
- Teléfono: la pestaña «Asistente» en la barra de abajo, con el chat a pantalla completa y el historial en una hoja (M-Asistente-Org,
  M-Asistente-Personal y M-Asistente-Plat). La barra de abajo de M-Inicio-Org, M-Inicio-Personal y M-Organizaciones suma la pestaña.
- Estados en el Tweak «asistente»: consultas en curso («Consultando usuarios…»), streaming con «Detener», copiar y 👍/👎, adjuntos (10 MB),
  falló, detenida, «Te quedan 10 consultas hoy», topes, y «El asistente todavía no está configurado» con «Revisar configuración» solo
  para quien puede.
Los tableros nuevos se arman copiando el marco de su tablero base; si ya existen, no se tocan."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-asistente"'


def svg(d, w=16, sw="1.75", extra=""):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"{extra}>{d}</svg>')


CHISPA_D = ('<path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9z"/>'
            '<path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>')
CHISPA = svg(CHISPA_D)
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>')
ENVIAR = svg('<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>', 18, "2")
PARAR = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.5"/></svg>'
CLIP = svg('<path d="m20.5 11.5-8.3 8.3a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/>', 18)
COPIAR = svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>')
ARRIBA = svg('<path d="M7 10v11"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18.5 21H7V10l4-8a3 3 0 0 1 4 3.9z"/>')
ABAJO = svg('<path d="M17 14V3"/><path d="M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 5.5 3H17v11l-4 8a3 3 0 0 1-4-3.9z"/>')
RAYO = svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', 14)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.2")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
ALERTA = svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', 16, "2")
FLECHA = svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 14, "2")
PDF = svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', 15)
IMG = svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>', 15)
CRUZ = svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 14, "2")
PIN = svg('<path d="M9 4h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 15v5"/>')
LAPIZ = svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>')
BAJAR = svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>')
TACHO = svg('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>')
HIST = svg('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>', 22, "2")
NUEVA = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 22, "1.9")
CERRAR = svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 22, "2")
CHISPA_NAV = svg(CHISPA_D, 24, "1.75")
MAS18 = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 18, "2")
CHEV_IZQ = svg('<path d="m15 6-6 6 6 6"/>', 18)

LADOS = {
    "org": {
        "base": "Inicio-Org", "nuevo": "Asistente-Org", "tel_base": "M-Inicio-Org", "tel_nuevo": "M-Asistente-Org",
        "nombre": "Grupo Delta", "placeholder": "Preguntá lo que quieras sobre Grupo Delta",
        "chips": ["Usuarios activos", "Invitaciones vencidas", "Quiénes son Dueños", "Últimos cambios"],
        "guardadas": ["Permisos del rol Auditor"],
        "recientes": ["Invitaciones vencidas", "Quién entró esta semana", "Empresas sin administrador", "Cambios de ayer en Roles"],
        "q1": "Invitaciones vencidas",
        "a1": ('<p>Hay <b>2 invitaciones vencidas</b>:</p><ul><li>carla.bianchi@delta.ejemplo.com <span class="s">· venció el 25/09/2026</span></li>'
               '<li>martin.gomez@delta.ejemplo.com <span class="s">· venció el 30/09/2026</span></li></ul>'
               f'<a class="as-ir" href="Usuarios.dc.html">Ver en Usuarios {FLECHA}</a>'),
        "adj": ("planilla-ventas.pdf", "1,2 MB"),
        "q2": "¿Están todos los de esta planilla en Delta Norte?",
        "paso1": "Consultó Empresas", "consultando": "Consultando usuarios…", "listo": "Consultó Empresas y Usuarios",
        "parcial": "En la planilla hay 6 personas. 4 ya son usuarios de Delta Norte; faltan",
        "a2": ('<p>En la planilla hay 6 personas. <b>4 ya son usuarios de Delta Norte</b>; faltan estas 2:</p>'
               '<ul><li>Julieta Paz <span class="s">· julieta.paz@delta.ejemplo.com</span></li>'
               '<li>Ramiro Ledesma <span class="s">· ramiro.ledesma@delta.ejemplo.com</span></li></ul>'
               f'<a class="as-ir" href="Usuarios.dc.html">Invitarlas desde Usuarios {FLECHA}</a>'),
        "puede": "e === 'Sin configurar (Dueño)'", "config": "Asistente-Config-Org.dc.html", "uso": "Asistente-Uso-Org.dc.html",
        "estados": ["Bienvenida", "Primera vez", "Con adjuntos", "Adjunto de más de 10 MB", "Consultando", "Escribiendo", "Respuesta",
                    "Historial plegado", "Detenida", "Falló la respuesta", "Menú de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas",
                    "Tope del día", "Tope del mes", "Sin configurar (Dueño)", "Sin configurar (otro rol)"],
        "tel_estados": ["Bienvenida", "Primera vez", "Con adjuntos", "Consultando", "Escribiendo", "Respuesta", "Falló la respuesta", "Historial",
                        "Acciones de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas", "Tope del día", "Tope del mes",
                        "Sin configurar (Dueño)", "Sin configurar (otro rol)"],
    },
    "personal": {
        "base": "Inicio-Personal", "nuevo": "Asistente-Personal", "tel_base": "M-Inicio-Personal", "tel_nuevo": "M-Asistente-Personal",
        "nombre": "Personal", "placeholder": "Preguntá sobre tu cuenta y tus organizaciones",
        "chips": ["Mis organizaciones", "Cómo entro a mi cuenta", "Mis mensajes con empresas"],
        "guardadas": ["Cómo recuperar mi cuenta"],
        "recientes": ["Por qué no puedo entrar a Beta", "Mis organizaciones", "Correos de mi cuenta"],
        "q1": "Mis organizaciones",
        "a1": '<p>Estás en <b>2 organizaciones</b>:</p><ul><li>Grupo Delta <span class="s">· Dueño</span></li><li>Beta S.R.L. <span class="s">· suspendida</span></li></ul>',
        "adj": None,
        "q2": "¿Por qué no puedo entrar a Beta?",
        "paso1": "", "consultando": "Consultando tus organizaciones…", "listo": "Consultó tus organizaciones",
        "parcial": "Beta S.R.L. está suspendida desde el 25/09/2026. Mientras",
        "a2": ('<p>Beta S.R.L. está <b>suspendida</b> desde el 25/09/2026. Mientras siga así, nadie entra como empresa; tus datos se conservan.</p>'
               f'<a class="as-ir" href="Perfil-Suspendido.dc.html">Ver Beta S.R.L. {FLECHA}</a>'),
        "puede": "false", "config": "", "uso": "",
        "vacio": ("Mis mensajes con empresas", "Todavía no tenés mensajes con empresas."),
        "estados": ["Bienvenida", "Primera vez", "Con adjuntos", "Adjunto de más de 10 MB", "Consultando", "Escribiendo", "Respuesta",
                    "Historial plegado", "Detenida", "Falló la respuesta", "Menú de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas",
                    "Tope del día", "Sin configurar", "Mis mensajes con empresas: sin mensajes"],
        "tel_estados": ["Bienvenida", "Primera vez", "Con adjuntos", "Consultando", "Escribiendo", "Respuesta", "Falló la respuesta", "Historial",
                        "Acciones de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas", "Tope del día", "Sin configurar",
                        "Mis mensajes con empresas: sin mensajes"],
    },
    "plat": {
        "base": "Organizaciones", "nuevo": "Asistente-Plat", "tel_base": "M-Organizaciones", "tel_nuevo": "M-Asistente-Plat",
        "nombre": "Plataforma", "placeholder": "Preguntá sobre las organizaciones y las cuentas",
        "chips": ["Organizaciones por aprobar", "Recuperaciones pendientes", "Seguridad de hoy", "Uso del asistente"],
        "guardadas": ["Altas de setiembre"],
        "recientes": ["Organizaciones por aprobar", "Recuperaciones de la semana", "Cuentas suspendidas"],
        "q1": "Organizaciones por aprobar",
        "a1": ('<p>Hay <b>2 organizaciones</b> que esperan aprobación:</p><ul><li>Gamma S.A. <span class="s">· se registró el 27/09/2026</span></li>'
               '<li>Épsilon S.R.L. <span class="s">· se registró el 26/09/2026</span></li></ul>'
               f'<a class="as-ir" href="Organizaciones.dc.html">Ver en Organizaciones {FLECHA}</a>'),
        "adj": None,
        "q2": "¿Cuánto costó el asistente este mes y quiénes lo usan más?",
        "paso1": "", "consultando": "Consultando el uso del asistente…", "listo": "Consultó el uso del asistente",
        "parcial": "En octubre el asistente costó USD 112,40. Las que",
        "a2": ('<p>En octubre el asistente costó <b>USD 112,40</b>. Las que más lo usan:</p><ul><li>Grupo Delta <span class="s">· USD 37,40</span></li>'
               '<li>Sigma S.A. <span class="s">· USD 21,10</span></li><li>Personas <span class="s">· USD 8,30</span></li></ul>'
               f'<a class="as-ir" href="Plat-Asistente-Uso.dc.html">Ver el uso {FLECHA}</a>'),
        "puede": "e === 'Sin configurar'", "config": "Plat-Asistente-Config.dc.html", "uso": "Plat-Asistente-Uso.dc.html",
        "estados": ["Bienvenida", "Primera vez", "Con adjuntos", "Adjunto de más de 10 MB", "Consultando", "Escribiendo", "Respuesta",
                    "Historial plegado", "Detenida", "Falló la respuesta", "Menú de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas",
                    "Tope del día", "Sin configurar"],
        "tel_estados": ["Bienvenida", "Primera vez", "Con adjuntos", "Consultando", "Escribiendo", "Respuesta", "Falló la respuesta", "Historial",
                        "Acciones de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas", "Tope del día", "Sin configurar"],
    },
}

PARA_RESOLVER_PLAT = (
    '<div class="tarjeta t52"><div class="t-cab"><h2>Para resolver <span class="cnt">4</span></h2></div>'
    '<div class="tt-h" style="grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.25fr) 104px 80px;"><span>Pendiente</span><span>Área</span><span>Estado</span><span>Desde</span><span class="sr">Acción</span></div>'
    + "".join(
        f'<div class="tt-f" style="grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.25fr) 104px 80px;"><span style="min-width: 0;" class="dos"><span class="c1">{a}</span>'
        f'{"<span class=n2>" + b + "</span>" if b else ""}</span><span class="c1 n">{c}</span><span><span class="pill alerta">{d}</span></span><span class="c1 n">{f}</span>'
        f'<a class="lnk" href="{h}">Revisar</a></div>'
        for a, b, c, d, f, h in [
            ("Gamma S.A.", "Julio Pérez", "Organizaciones", "Espera aprobación", "27/09/2026", "Organizacion.dc.html"),
            ("Épsilon S.R.L.", "Morena Paz", "Organizaciones", "Espera aprobación", "26/09/2026", "Organizacion.dc.html"),
            ("pa•••@kappa.ejemplo.com", "Pablo Ortiz", "Recuperaciones", "Pendiente", "27/09/2026", "Recuperaciones.dc.html"),
            ("ma•••@omega.ejemplo.com", "", "Recuperaciones", "Pendiente", "26/09/2026", "Recuperaciones.dc.html"),
        ])
    + "</div>")


def fila_hist(titulo, activa, tel=False):
    """Una conversación del historial; la primera de Recientes es la abierta y tiene su ⋮."""
    if tel:
        keb = (f'<button type="button" class="as-keb vis" aria-label="Acciones de {titulo}" onClick="{{{{asIrAcciones}}}}">{KEBAB}</button>')
        return (f'<div class="as-it {"{{asActiva}}" if activa else ""}"><button type="button" class="as-it-n" onClick="{{{{asAbrir}}}}">{titulo}</button>{keb}</div>')
    menu = ""
    if activa:
        menu = ('<sc-if value="{{asMenu}}" hint-placeholder-val="{{no}}"><div class="menu der as-menu" role="menu" aria-label="Acciones de ' + titulo + '">'
                f'<button type="button" class="menu-it" role="menuitem" onClick="{{{{asCancelar}}}}">{PIN} Guardar</button>'
                f'<button type="button" class="menu-it" role="menuitem" onClick="{{{{asRenombrarIr}}}}">{LAPIZ} Renombrar</button>'
                f'<button type="button" class="menu-it" role="menuitem" onClick="{{{{asCancelar}}}}">{BAJAR} Exportar en Markdown</button>'
                f'<button type="button" class="menu-it" role="menuitem" onClick="{{{{asCancelar}}}}">{BAJAR} Exportar en PDF</button>'
                '<div class="menu-sep" role="separator"></div>'
                f'<button type="button" class="menu-it pel" role="menuitem" onClick="{{{{asBorrarIr}}}}">{TACHO} Borrar</button></div></sc-if>')
    keb = (f'<span class="envoltura"><button type="button" class="as-keb" aria-haspopup="menu" aria-expanded="{{{{asExpMenu}}}}" aria-label="Acciones de {titulo}" '
           f'onClick="{{{{asAlternarMenu}}}}">{KEBAB}</button>{menu}</span>') if activa else \
          f'<button type="button" class="as-keb" aria-label="Acciones de {titulo}">{KEBAB}</button>'
    return (f'<div class="as-it {"{{asActiva}}" if activa else ""}"><button type="button" class="as-it-n" onClick="{{{{asAbrir}}}}">{titulo}</button>{keb}</div>')


def historial(d, tel=False):
    h = ""
    if d["guardadas"]:
        h += '<div class="as-gr">Guardadas</div>' + "".join(fila_hist(x, False, tel) for x in d["guardadas"])
    h += (f'<div class="as-gr">Recientes <span class="as-i" tabindex="0" role="img" aria-label="Se borran solas a los 30 días sin actividad. Las guardadas no vencen." '
          f'title="Se borran solas a los 30 días sin actividad. Las guardadas no vencen.">{INFO}</span></div>')
    h += "".join(fila_hist(x, i == 0, tel) for i, x in enumerate(d["recientes"]))
    return h


def caja(d, tel=False):
    """La caja de la consulta, con los adjuntos, Detener mientras responde y los avisos de debajo."""
    adjs = ('<sc-if value="{{asAdjuntos}}" hint-placeholder-val="{{no}}"><div class="as-adjs">'
            f'<span class="as-adj"><span class="ic">{IMG}</span><span class="n">captura-usuarios.png</span><span class="p">240 KB</span>'
            f'<button type="button" class="as-ib mini" aria-label="Quitar captura-usuarios.png" onClick="{{{{asNueva}}}}">{CRUZ}</button></span>'
            f'<span class="as-adj {{{{asAdjClase}}}}"><span class="ic">{PDF}</span><span class="n">planilla-ventas.pdf</span><span class="p">{{{{asAdjPeso}}}}</span>'
            f'<button type="button" class="as-ib mini" aria-label="Quitar planilla-ventas.pdf" onClick="{{{{asNueva}}}}">{CRUZ}</button></span>'
            '</div></sc-if>')
    accion = (f'<sc-if value="{{{{asCorriendo}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="{"as-env as-par" if tel else "b b-sec as-det"}" '
              f'aria-label="Detener" onClick="{{{{asDetener}}}}">{PARAR}{"" if tel else " Detener"}</button></sc-if>'
              f'<sc-if value="{{{{asQuieto}}}}" hint-placeholder-val="{{{{si}}}}"><button type="button" class="as-env" aria-label="Enviar" onClick="{{{{asEnviar}}}}">{ENVIAR}</button></sc-if>')
    if tel:
        cuerpo = (f'<div class="as-caja">{adjs}<div class="as-fila"><button type="button" class="as-ib" aria-label="Adjuntar imágenes o PDF">{CLIP}</button>'
                  f'<textarea class="as-tx" rows="1" aria-label="Tu consulta" placeholder="Preguntá algo"></textarea>{accion}</div></div>')
    else:
        cuerpo = (f'<div class="as-caja">{adjs}<textarea class="as-tx" aria-label="Tu consulta" placeholder="{d["placeholder"]}"></textarea>'
                  f'<div class="as-acc"><button type="button" class="as-ib" aria-label="Adjuntar imágenes o PDF" title="Imágenes o PDF, hasta 10 MB y 5 por consulta">{CLIP}</button>'
                  f'<span class="as-esp"></span>{accion}</div></div>')
    franja = (f'<div class="as-franja" role="status">{ALERTA}<span>{{{{asTextoTope}}}}</span>'
              + (f'<sc-if value="{{{{asTopeMes}}}}" hint-placeholder-val="{{{{no}}}}"><a class="as-fr-l" href="{d["uso"]}">Ver uso</a></sc-if>' if d["uso"] else "")
              + '</div>')
    return (f'<sc-if value="{{{{asTope}}}}" hint-placeholder-val="{{{{no}}}}">{franja}</sc-if>'
            f'<sc-if value="{{{{asConCaja}}}}" hint-placeholder-val="{{{{si}}}}">{cuerpo}</sc-if>'
            '<sc-if value="{{asAdjMal}}" hint-placeholder-val="{{no}}"><span class="as-err" role="alert">planilla-ventas.pdf pesa más de 10 MB.</span></sc-if>'
            '<sc-if value="{{asQuedan}}" hint-placeholder-val="{{no}}"><span class="as-quedan">Te quedan <b>10 consultas</b> hoy.</span></sc-if>')


def chips(d):
    return ('<div class="as-chips" role="group" aria-label="Consultas fijas">'
            + "".join(f'<button type="button" class="as-chip" onClick="{{{{asChip}}}}">{RAYO}{c}</button>' for c in d["chips"]) + "</div>")


def hilo(d, tel=False):
    adj = ""
    if d["adj"]:
        adj = f'<span class="as-adj chico"><span class="ic">{PDF}</span><span class="n">{d["adj"][0]}</span><span class="p">{d["adj"][1]}</span></span>'
    paso1 = f'<span class="as-tool ok">{TILDE}{d["paso1"]}</span>' if d["paso1"] else ""
    acts = (f'<div class="as-acts"><button type="button" class="as-ib chico" aria-label="Copiar" title="Copiar">{COPIAR}</button>'
            f'<button type="button" class="as-ib chico" aria-label="Me sirvió" title="Me sirvió">{ARRIBA}</button>'
            f'<button type="button" class="as-ib chico" aria-label="No me sirvió" title="No me sirvió">{ABAJO}</button></div>')
    av = f'<span class="as-av">{CHISPA}</span>'
    vacio = ""
    if d.get("vacio"):
        q, r = d["vacio"]
        vacio = ('<sc-if value="{{asVacio}}" hint-placeholder-val="{{no}}"><div class="as-col">'
                 f'<div class="as-yo"><span class="as-burb"><span class="as-fija" title="Consulta fija">{RAYO}</span>{q}</span></div>'
                 f'<div class="as-el">{av}<div class="as-cont"><div class="as-md"><p>{r}</p></div>'
                 f'<div class="as-acts"><button type="button" class="as-ib chico" aria-label="Copiar" title="Copiar">{COPIAR}</button></div></div></div>'
                 '</div></sc-if>')
    return (
        vacio
        + '<sc-if value="{{asConResultados}}" hint-placeholder-val="{{si}}"><div class="as-col">'
        f'<div class="as-yo"><span class="as-burb"><span class="as-fija" title="Consulta fija">{RAYO}</span>{d["q1"]}</span></div>'
        f'<div class="as-el">{av}<div class="as-cont"><div class="as-md">{d["a1"]}</div>'
        f'<div class="as-acts"><button type="button" class="as-ib chico" aria-label="Copiar" title="Copiar">{COPIAR}</button></div></div></div>'
        f'<div class="as-yo">{adj}<span class="as-burb">{d["q2"]}</span></div>'
        f'<div class="as-el">{av}<div class="as-cont"><div class="as-tools">'
        f'<sc-if value="{{{{asConsultando}}}}" hint-placeholder-val="{{{{no}}}}">{paso1}<span class="as-tool"><span class="as-spin"></span>{d["consultando"]}</span></sc-if>'
        f'<sc-if value="{{{{asConsultado}}}}" hint-placeholder-val="{{{{si}}}}"><span class="as-tool ok">{TILDE}{d["listo"]}</span></sc-if></div>'
        f'<sc-if value="{{{{asEscribiendo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="as-md"><p>{d["parcial"]}<span class="as-cursor"></span></p></div></sc-if>'
        f'<sc-if value="{{{{asDetenida}}}}" hint-placeholder-val="{{{{no}}}}"><div class="as-md"><p>{d["parcial"]}</p></div><span class="as-nota">Detuviste la respuesta.</span></sc-if>'
        f'<sc-if value="{{{{asFallo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="as-fallo" role="alert">{ALERTA}<span>El asistente no responde ahora.</span>'
        f'<button type="button" class="{"cb cb-sec" if tel else "b b-sec"} as-reint" onClick="{{{{asReintentar}}}}">Reintentar</button></div></sc-if>'
        f'<sc-if value="{{{{asListo}}}}" hint-placeholder-val="{{{{si}}}}"><div class="as-md">{d["a2"]}</div>{acts}</sc-if>'
        '</div></div></div></sc-if>')


def sin_config(d, tel=False):
    boton = ""
    if d["config"]:
        clase = "cb cb-pri" if tel else "b b-pri"
        boton = f'<sc-if value="{{{{asPuedeConf}}}}" hint-placeholder-val="{{{{si}}}}"><a class="{clase}" href="{("M-" if tel else "") + d["config"]}">Revisar configuración</a></sc-if>'
    return (f'<div class="tarjeta as-nc"><span class="as-av gr gris">{CHISPA}</span><strong>El asistente todavía no está configurado</strong>{boton}</div>')


def zona_compu(d, extra):
    return (
        '<div class="as-zona {{asZonaClase}}">'
        '<aside class="as-hist" aria-label="Conversaciones">'
        f'<div class="as-riel"><button type="button" class="as-ib" aria-label="Nueva conversación" title="Nueva conversación" onClick="{{{{asNueva}}}}">{MAS18}</button></div>'
        f'<button type="button" class="b b-sec as-nueva" onClick="{{{{asNueva}}}}">{MAS} Nueva conversación</button>'
        f'<sc-if value="{{{{asConHistorial}}}}" hint-placeholder-val="{{{{si}}}}">{historial(d)}</sc-if>'
        '<sc-if value="{{asPrimera}}" hint-placeholder-val="{{no}}"><p class="as-vacio">Todavía no hay conversaciones</p></sc-if>'
        '</aside>'
        f'<button type="button" class="as-plegar" aria-label="{{{{asTextoPlegar}}}}" aria-expanded="{{{{asExpHist}}}}" onClick="{{{{asAlternarHist}}}}">{CHEV_IZQ}</button>'
        '<section class="as-chat" aria-label="Asistente">'
        '<sc-if value="{{asBienvenida}}" hint-placeholder-val="{{si}}"><div class="as-bien"><div class="as-col">'
        f'<div class="as-cab"><span class="as-av">{CHISPA}</span><h2 class="as-h">¿Qué querés consultar?</h2></div>'
        f'{caja(d)}{chips(d)}{extra}</div></div></sc-if>'
        f'<sc-if value="{{{{asSinConf}}}}" hint-placeholder-val="{{{{no}}}}"><div class="as-bien"><div class="as-col">{sin_config(d)}{extra}</div></div></sc-if>'
        f'<sc-if value="{{{{asConv}}}}" hint-placeholder-val="{{{{no}}}}"><div class="as-hilo">{hilo(d)}</div><div class="as-pie"><div class="as-col">{caja(d)}</div></div></sc-if>'
        '</section></div>'
        '<sc-if value="{{asAviso}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" aria-labelledby="as-at">'
        '<div class="dlg-h"><h2 id="as-at">Antes de tu primera consulta</h2></div>'
        '<div class="dlg-t">Tus consultas las procesa un proveedor de IA; no subas datos sensibles.</div>'
        '<div class="dlg-f"><a class="as-fr-l as-priv" href="Legal.dc.html">Ver la privacidad</a><button type="button" class="b b-pri" onClick="{{asEntendido}}">Entendido</button></div></div></div></sc-if>'
        '<sc-if value="{{asRenombrar}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg chico" role="dialog" aria-modal="true" aria-labelledby="as-rt">'
        f'<div class="dlg-h"><h2 id="as-rt">Renombrar la conversación</h2><button type="button" class="dlg-x" aria-label="Cerrar" onClick="{{{{asCancelar}}}}">{CERRAR}</button></div>'
        '<div class="dlg-b una"><div class="campo2"><label class="et" for="as-nombre">Nombre<span class="req" aria-hidden="true">*</span></label>'
        '<input class="in2" id="as-nombre" type="text" value="{{asNombre}}" onChange="{{asOnNombre}}"></div></div>'
        '<div class="dlg-f"><button type="button" class="b b-sec" onClick="{{asCancelar}}">Cancelar</button>'
        '<button type="button" class="b b-pri" disabled="{{asSinCambio}}" onClick="{{asCancelar}}">Guardar cambios</button></div></div></div></sc-if>'
        '<sc-if value="{{asBorrar}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" aria-labelledby="as-bt">'
        f'<div class="dlg-h"><h2 id="as-bt">¿Borrar «{d["recientes"][0]}»?</h2></div>'
        '<div class="dlg-t">Se borra para siempre, con sus adjuntos.</div>'
        '<div class="dlg-f"><button type="button" class="b b-sec" onClick="{{asCancelar}}">Cancelar</button>'
        '<button type="button" class="b b-pel" onClick="{{asBorrarOk}}">Borrar</button></div></div></div></sc-if>')


def zona_tel(d):
    t0 = d["recientes"][0]
    acciones = [(PIN, "Guardar", "asCerrarHoja", ""), (LAPIZ, "Renombrar", "asRenombrarIr", ""), (BAJAR, "Exportar en Markdown", "asCerrarHoja", ""),
                (BAJAR, "Exportar en PDF", "asCerrarHoja", ""), (TACHO, "Borrar", "asBorrarIr", " pel")]
    return (
        '<div class="as-tcuerpo">'
        f'<sc-if value="{{{{asBienvenida}}}}" hint-placeholder-val="{{{{si}}}}"><div class="as-tbien"><span class="as-av gr">{CHISPA}</span>'
        f'<h2 class="as-h">¿Qué querés consultar?</h2>{chips(d)}</div></sc-if>'
        f'<sc-if value="{{{{asSinConf}}}}" hint-placeholder-val="{{{{no}}}}"><div class="as-tbien">{sin_config(d, True)}</div></sc-if>'
        f'<sc-if value="{{{{asConv}}}}" hint-placeholder-val="{{{{no}}}}">{hilo(d, True)}</sc-if>'
        '</div>'
        f'<sc-if value="{{{{asConPie}}}}" hint-placeholder-val="{{{{si}}}}"><div class="as-tpie">{caja(d, True)}</div></sc-if>'
        # Historial en una hoja.
        '<sc-if value="{{asHist}}" hint-placeholder-val="{{no}}"><div class="as-velo" onClick="{{asCerrarHoja}}"></div>'
        '<div class="as-hoja" role="dialog" aria-label="Conversaciones"><span class="as-asa"></span>'
        f'<div class="as-hc"><h2>Conversaciones</h2><button type="button" class="as-tb" aria-label="Cerrar" onClick="{{{{asCerrarHoja}}}}">{CERRAR}</button></div>'
        f'<div class="as-hb">{historial(d, True)}</div></div></sc-if>'
        # Acciones de una conversación (el ⋮ de una fila abre una hoja con el dato como título).
        '<sc-if value="{{asAcciones}}" hint-placeholder-val="{{no}}"><div class="as-velo" onClick="{{asCerrarHoja}}"></div>'
        f'<div class="as-hoja" role="dialog" aria-label="{t0}"><span class="as-asa"></span>'
        f'<div class="as-hc"><h2>{t0}</h2><button type="button" class="as-tb" aria-label="Cerrar" onClick="{{{{asCerrarHoja}}}}">{CERRAR}</button></div>'
        '<div class="as-hacc">' + "".join(f'<button type="button" class="as-ha{c}" onClick="{{{{{a}}}}}">{i}<span>{n}</span></button>' for i, n, a, c in acciones)
        + '</div></div></sc-if>'
        # El aviso de la primera vez (D22).
        '<sc-if value="{{asAviso}}" hint-placeholder-val="{{no}}"><div class="as-velo"></div>'
        '<div class="as-hoja" role="alertdialog" aria-label="Antes de tu primera consulta"><span class="as-asa"></span>'
        '<div class="as-hc"><h2>Antes de tu primera consulta</h2></div><p class="as-htx">Tus consultas las procesa un proveedor de IA; no subas datos sensibles.</p>'
        '<div class="as-hpie"><button type="button" class="cb cb-pri" onClick="{{asEntendido}}">Entendido</button>'
        '<a class="cb cb-sec" href="M-Legal.dc.html">Ver la privacidad</a></div></div></sc-if>'
        # Renombrar.
        '<sc-if value="{{asRenombrar}}" hint-placeholder-val="{{no}}"><div class="as-velo" onClick="{{asCerrarHoja}}"></div>'
        '<div class="as-hoja" role="dialog" aria-label="Renombrar la conversación"><span class="as-asa"></span>'
        f'<div class="as-hc"><h2>Renombrar la conversación</h2><button type="button" class="as-tb" aria-label="Cerrar" onClick="{{{{asCerrarHoja}}}}">{CERRAR}</button></div>'
        '<div class="as-hform"><label class="as-rot" for="as-tnombre">Nombre <span class="as-rq">*</span></label>'
        '<input class="as-in" id="as-tnombre" type="text" value="{{asNombre}}" onChange="{{asOnNombre}}"></div>'
        '<div class="as-hpie"><button type="button" class="cb cb-pri" disabled="{{asSinCambio}}" onClick="{{asCerrarHoja}}">Guardar cambios</button>'
        '<button type="button" class="cb cb-sec" onClick="{{asCerrarHoja}}">Cancelar</button></div></div></sc-if>'
        # Borrar.
        '<sc-if value="{{asBorrar}}" hint-placeholder-val="{{no}}"><div class="as-velo" onClick="{{asCerrarHoja}}"></div>'
        f'<div class="as-hoja" role="alertdialog" aria-label="¿Borrar «{t0}»?"><span class="as-asa"></span>'
        f'<div class="as-hc"><h2>¿Borrar «{t0}»?</h2></div><p class="as-htx">Se borra para siempre, con sus adjuntos.</p>'
        '<div class="as-hpie"><button type="button" class="cb as-pel" onClick="{{asBorrarOk}}">Borrar</button>'
        '<button type="button" class="cb cb-sec" onClick="{{asCerrarHoja}}">Cancelar</button></div></div></sc-if>')


def js(d, tel=False):
    conv = ["Mis mensajes con empresas: sin mensajes", "Consultando", "Escribiendo", "Respuesta", "Historial plegado", "Detenida", "Falló la respuesta", "Menú de una conversación", "Renombrar", "Borrar",
            "Quedan 10 consultas", "Tope del día", "Tope del mes", "Acciones de una conversación"]
    listo = ["Respuesta", "Historial plegado", "Menú de una conversación", "Renombrar", "Borrar", "Quedan 10 consultas", "Tope del día", "Tope del mes",
             "Acciones de una conversación"]
    volver = "'Respuesta'"
    return f"""
  // El asistente (ADR 0048): el estado sale del Tweak «asistente» y lo cambian los botones.
  asistente() {{
    const e = this.state.asE ?? (this.props.asistente ?? 'Bienvenida');
    const ir = (x) => this.setState({{ asE: x, asNombre: undefined }});
    const conv = {json.dumps(conv, ensure_ascii=False)}.includes(e) || (e === 'Historial' && false);
    const sinConf = e.startsWith('Sin configurar');
    const tope = e === 'Tope del día' || e === 'Tope del mes';
    const corriendo = e === 'Consultando' || e === 'Escribiendo';
    const pleg = this.state.asPleg ?? (e === 'Historial plegado');
    const nombre = this.state.asNombre ?? {json.dumps(d["recientes"][0], ensure_ascii=False)};

    return {{
      si: true,
      no: false,
      asZonaClase: pleg ? 'plegado' : '',
      asTextoPlegar: pleg ? 'Mostrar las conversaciones' : 'Ocultar las conversaciones',
      asExpHist: pleg ? 'false' : 'true',
      asAlternarHist: () => this.setState({{ asPleg: !pleg }}),
      asVacio: e === 'Mis mensajes con empresas: sin mensajes',
      asConResultados: e !== 'Mis mensajes con empresas: sin mensajes',
      asBienvenida: !conv && !sinConf,
      asConv: conv,
      asSinConf: sinConf,
      asPuedeConf: {d["puede"]},
      asPrimera: e === 'Primera vez',
      asAviso: e === 'Primera vez',
      asEntendido: () => ir('Bienvenida'),
      asConHistorial: e !== 'Primera vez',
      asActiva: conv && e !== 'Mis mensajes con empresas: sin mensajes' ? 'on' : '',
      asAdjuntos: e === 'Con adjuntos' || e === 'Adjunto de más de 10 MB',
      asAdjMal: e === 'Adjunto de más de 10 MB',
      asAdjClase: e === 'Adjunto de más de 10 MB' ? 'mal' : '',
      asAdjPeso: e === 'Adjunto de más de 10 MB' ? '14,8 MB' : '1,2 MB',
      asConsultando: e === 'Consultando',
      asConsultado: e !== 'Consultando',
      asEscribiendo: e === 'Escribiendo',
      asDetenida: e === 'Detenida',
      asFallo: e === 'Falló la respuesta',
      asListo: {json.dumps(listo, ensure_ascii=False)}.includes(e),
      asCorriendo: corriendo,
      asQuieto: !corriendo,
      asMenu: e === 'Menú de una conversación',
      asExpMenu: e === 'Menú de una conversación' ? 'true' : 'false',
      asRenombrar: e === 'Renombrar',
      asBorrar: e === 'Borrar',
      asHist: e === 'Historial',
      asAcciones: e === 'Acciones de una conversación',
      asQuedan: e === 'Quedan 10 consultas',
      asTope: tope,
      asTopeMes: e === 'Tope del mes',
      asConCaja: !tope,
      asConPie: !sinConf,
      asTextoTope: e === 'Tope del mes' ? 'Grupo Delta llegó al tope del mes del asistente.' : 'Llegaste a las 50 consultas de hoy. Se renuevan a las 21:00.',
      asNombre: nombre,
      asOnNombre: (ev) => this.setState({{ asNombre: ev.target.value }}),
      asSinCambio: nombre === {json.dumps(d["recientes"][0], ensure_ascii=False)},
      asNueva: () => ir('Bienvenida'),
      asAbrir: () => ir('Respuesta'),
      asChip: () => ir('Respuesta'),
      asEnviar: () => ir('Consultando'),
      asDetener: () => ir('Detenida'),
      asReintentar: () => ir('Respuesta'),
      asAlternarMenu: () => ir(e === 'Menú de una conversación' ? 'Respuesta' : 'Menú de una conversación'),
      asRenombrarIr: () => ir('Renombrar'),
      asBorrarIr: () => ir('Borrar'),
      asCancelar: () => ir({volver}),
      asBorrarOk: () => ir('Bienvenida'),
      asAbrirHist: () => ir('Historial'),
      asIrAcciones: () => ir('Acciones de una conversación'),
      asCerrarHoja: () => ir({volver}),
    }};
  }}

"""


def con_script(t, d, estados, ancho, alto, tel=False):
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(
        {"asistente": {"editor": "enum", "options": estados, "default": "Bienvenida", "section": "Estado"}, "$preview": {"width": ancho, "height": alto}},
        ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    i = t.index("  renderVals() {")
    t = t[:i] + js(d, tel) + "  renderValsBase() {" + t[i + len("  renderVals() {"):]
    k = t.rindex("</script>")
    fin = t.rindex("}", 0, k)  # cierre de la clase
    return t[:fin] + "  renderVals() {\n    return { ...this.renderValsBase(), ...this.asistente() };\n  }\n" + t[fin:]


CSS = """.ab-app-shell__main:has(> .as-zona) { display: flex !important; flex-direction: column !important; overflow: hidden !important; min-height: 0; }
.w-co:has(> .as-zona) { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.as-zona { flex: 1; min-height: 0; display: flex; position: relative; }
.as-hist { width: 264px; flex-shrink: 0; box-sizing: border-box; background: #fff; border-right: 1px solid var(--borde); padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; overflow: auto; }
.as-nueva { width: calc(100% - 14px); justify-content: flex-start !important; margin-bottom: 8px; }
.as-gr { display: flex; align-items: center; gap: 6px; padding: 14px 10px 6px; font-size: 12.5px; font-weight: 600; color: var(--t3); }
.as-i { display: inline-flex; color: var(--t3); cursor: help; }
.as-it { position: relative; display: flex; align-items: center; border-radius: 8px; min-height: 36px; }
.as-it:hover, .as-it.on { background: var(--s2); }
.as-it-n { flex: 1; min-width: 0; border: 0; background: transparent; text-align: left; padding: 8px 10px; font: inherit; font-size: 14px; color: var(--t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.as-it.on .as-it-n { font-weight: 600; }
.as-keb { width: 28px; height: 28px; margin-right: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; }
.as-it:hover .as-keb, .as-it.on .as-keb, .as-keb.vis { opacity: 1; }
.as-keb:hover { background: oklch(0.9 0.012 78); }
.as-it .envoltura { position: relative; display: inline-flex; }
.as-menu { top: calc(100% + 4px) !important; right: 0 !important; left: auto !important; min-width: 230px !important; }
.as-menu .menu-it svg { color: var(--t2); flex-shrink: 0; }
.as-menu .menu-it.pel, .as-menu .menu-it.pel svg { color: oklch(0.52 0.19 25); }
.as-plegar { position: absolute; z-index: 6; top: 20px; left: 250px; width: 28px; height: 28px; padding: 0; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #fff; border: 1px solid var(--borde2); box-shadow: 0 1px 3px oklch(0.24 0.012 60 / 0.12); color: var(--t2); cursor: pointer; }
.as-plegar:hover { color: var(--marca); }
.as-zona.plegado .as-plegar { left: 42px; }
.as-zona.plegado .as-plegar svg { transform: rotate(180deg); }
.as-riel { display: none; }
.as-zona.plegado .as-hist { width: 56px; padding: 16px 10px; }
.as-zona.plegado .as-hist > :not(.as-riel) { display: none !important; }
.as-zona.plegado .as-riel { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 40px; }
.as-vacio { padding: 16px 10px; margin: 0; font-size: 13.5px; color: var(--t3); }
.as-chat { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.as-bien { flex: 1; min-height: 0; overflow: auto; padding: 28px 32px 24px; }
.as-col { width: 100%; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; }
.as-cab { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px; }
.as-cab .as-av { width: 36px; height: 36px; }
.as-cab .as-av svg { width: 20px; height: 20px; }
.as-av { width: 28px; height: 28px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.as-av.gr { width: 40px; height: 40px; }
.as-av.gr svg { width: 22px; height: 22px; }
.as-av.gris { background: var(--s2); color: var(--t3); }
.as-h { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.01em; color: var(--t1); text-wrap: balance; }
.as-caja { background: #fff; border: 1px solid var(--borde2); border-radius: 16px; box-shadow: 0 2px 10px oklch(0.24 0.014 78 / 0.07); padding: 12px 12px 10px 16px; display: flex; flex-direction: column; gap: 8px; }
.as-caja:focus-within { border-color: var(--marca); }
.as-tx { display: block; width: 100%; box-sizing: border-box; border: 0; outline: 0; resize: none; font: inherit; font-size: 15px; line-height: 1.5; color: var(--t1); background: transparent; min-height: 48px; padding: 4px 0 0; }
.as-tx::placeholder { color: var(--t3); }
.as-acc { display: flex; align-items: center; gap: 8px; }
.as-esp { flex: 1; }
.as-ib { width: 34px; height: 34px; border: 0; border-radius: 8px; background: transparent; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.as-ib:hover { background: var(--s2); color: var(--t1); }
.as-ib.chico { width: 30px; height: 30px; }
.as-ib.mini { width: 24px; height: 24px; border-radius: 6px; }
.as-env { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.as-det { height: 34px !important; }
.as-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.as-chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 1px solid var(--borde); border-radius: 999px; background: #fff; font: inherit; font-size: 13.5px; color: var(--t1); cursor: pointer; }
.as-chip svg { color: var(--marca-tx); }
.as-chip:hover { border-color: var(--marca); }
.as-adjs { display: flex; flex-wrap: wrap; gap: 8px; }
.as-adj { display: inline-flex; align-items: center; gap: 8px; height: 40px; box-sizing: border-box; padding: 0 6px 0 7px; border: 1px solid var(--borde); border-radius: 10px; background: var(--s2); font-size: 13px; color: var(--t1); max-width: 280px; }
.as-adj.chico { height: 36px; padding-right: 12px; background: #fff; }
.as-adj .ic { width: 26px; height: 26px; border-radius: 6px; background: #fff; display: inline-flex; align-items: center; justify-content: center; color: var(--t2); flex-shrink: 0; }
.as-adj.chico .ic { background: var(--s2); }
.as-adj .n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.as-adj .p { color: var(--t3); white-space: nowrap; }
.as-adj.mal { border-color: oklch(0.6 0.19 25); background: var(--peligro-t); }
.as-err { font-size: 13px; color: oklch(0.5 0.19 25); padding-left: 4px; }
.as-quedan { font-size: 13px; color: var(--t2); text-align: center; }
.as-hilo { flex: 1; min-height: 0; overflow: auto; padding: 24px 32px 8px; display: flex; flex-direction: column-reverse; }
.as-hilo .as-col { margin-top: auto; gap: 20px; }
.as-yo { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.as-burb { max-width: 76%; box-sizing: border-box; background: var(--marca-t); color: var(--t1); padding: 10px 14px; border-radius: 16px 16px 4px 16px; font-size: 15px; line-height: 1.5; display: inline-flex; gap: 6px; align-items: center; }
.as-fija { color: var(--marca-tx); display: inline-flex; flex-shrink: 0; }
.as-el { display: flex; gap: 12px; align-items: flex-start; }
.as-cont { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding-top: 3px; }
.as-md { font-size: 15px; line-height: 1.6; color: var(--t1); }
.as-md p { margin: 0 0 6px; }
.as-md ul { margin: 2px 0 8px; padding-left: 20px; }
.as-md li { margin: 2px 0; }
.as-md .s { color: var(--t2); }
.as-md b { font-weight: 600; }
.as-ir { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: var(--marca-tx); text-decoration: none; font-size: 14px; }
.as-tools { display: flex; flex-direction: column; gap: 4px; }
.as-tool { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--t2); }
.as-tool.ok svg { color: var(--ok); }
.as-spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--borde2); border-top-color: var(--marca); animation: as-gira 0.8s linear infinite; flex-shrink: 0; }
@keyframes as-gira { to { transform: rotate(360deg); } }
.as-cursor { display: inline-block; width: 8px; height: 17px; margin-left: 3px; vertical-align: -3px; background: var(--marca); border-radius: 2px; animation: as-tit 1s steps(2) infinite; }
@keyframes as-tit { 50% { opacity: 0; } }
.as-acts { display: flex; gap: 2px; margin-left: -6px; }
.as-acts .as-ib { color: var(--t3); }
.as-nota { font-size: 13px; color: var(--t3); }
.as-fallo { display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 14px; border-radius: 12px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 14px; }
.as-fallo svg { flex-shrink: 0; }
.as-reint { margin-left: auto; height: 32px !important; }
.as-pie { padding: 8px 32px 20px; }
.as-pie > .as-col { gap: 8px; }
.as-franja { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 14px; }
.as-franja svg { flex-shrink: 0; }
.as-fr-l { margin-left: auto; font-weight: 600; color: inherit; }
.as-priv { margin: 0 auto 0 0; align-self: center; font-size: 14px; color: var(--marca-tx); text-decoration: none; }
.as-nc { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 28px 24px; text-align: center; }
.as-nc strong { font-size: 17px; font-weight: 600; }
.as-bien .ini-t { padding: 12px 14px !important; }
.as-bien .tarjeta { margin-top: 6px; }
.as-bien .ini-acc + * { margin-top: 0; }
.as-bien .dos { display: flex; flex-direction: column; }
.as-bien .n2 { font-size: 12.5px; color: var(--t3); }
"""

CSS_TEL = """.as-bar { height: 60px; flex-shrink: 0; display: flex; align-items: center; gap: 4px; padding: 0 6px !important; background: #fff; }
.as-bar .tit { flex: 1; min-width: 0; text-align: center; display: flex; flex-direction: column; align-items: center; }
.as-bar .tit h1 { margin: 0; font-size: 18px; font-weight: 600; line-height: 1.25; color: var(--t1); }
.as-bar .tit .sub { font-size: 13px; color: var(--t2); line-height: 1.3; }
.as-tb { width: 44px; height: 44px; border: 0; border-radius: 12px; background: transparent; color: var(--t1); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.as-tcuerpo { flex: 1; min-height: 0; overflow: auto; padding: 8px 16px 12px; display: flex; flex-direction: column-reverse; background: #fff; }
.as-tcuerpo .as-col { margin-top: auto; gap: 18px; max-width: none; }
.as-tbien { margin: auto 0; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 0 4px; }
.as-tbien .as-h { font-size: 24px; }
.as-tbien .as-chip { height: 40px; font-size: 15px; padding: 0 16px; }
.as-tbien .as-nc { width: 100%; box-sizing: border-box; }
.as-tpie { flex-shrink: 0; padding: 6px 12px 10px; display: flex; flex-direction: column; gap: 6px; background: #fff; }
.as-tpie .as-caja { padding: 6px 6px 6px 6px; border-radius: 24px; gap: 6px; }
.as-tpie .as-adjs { padding: 4px 4px 0; }
.as-fila { display: flex; align-items: flex-end; gap: 4px; }
.as-fila .as-tx { flex: 1; min-height: 36px; font-size: 16px; padding: 7px 4px; }
.as-tpie .as-env { width: 36px; height: 36px; }
.as-par { background: var(--t1); }
.as-tpie .as-franja { font-size: 14.5px; }
.as-tpie .as-quedan, .as-tpie .as-err { font-size: 13.5px; }
.ap .as-burb { max-width: 86%; font-size: 16px; }
.ap .as-md { font-size: 16px; }
.ap .as-el { gap: 10px; }
.ap .as-fallo { font-size: 14.5px; }
.as-velo { position: absolute; inset: 0; z-index: 30; background: oklch(0.2 0.014 78 / 0.42); }
.as-hoja { position: absolute; left: 0; right: 0; bottom: 0; z-index: 31; background: #fff; border-radius: 16px 16px 0 0; padding: 6px 0 30px; max-height: 80%; display: flex; flex-direction: column; box-shadow: 0 -8px 24px oklch(0.2 0.014 78 / 0.12); }
.as-asa { width: 36px; height: 4px; border-radius: 2px; background: var(--borde2); align-self: center; margin: 4px 0 6px; flex-shrink: 0; }
.as-hc { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 8px 8px 20px; }
.as-hc h2 { margin: 0; font-size: 18px; font-weight: 600; }
.as-hb { overflow: auto; padding: 0 12px; display: flex; flex-direction: column; gap: 2px; }
.as-hb .as-it { min-height: 48px; }
.as-hb .as-it-n { font-size: 16px; padding: 12px 10px; }
.as-hb .as-gr { font-size: 13.5px; }
.as-hb .as-keb { width: 40px; height: 40px; }
.as-hacc { display: flex; flex-direction: column; }
.as-ha { display: flex; align-items: center; gap: 14px; min-height: 52px; padding: 0 20px; border: 0; border-top: 1px solid var(--borde); background: transparent; font: inherit; font-size: 16px; color: var(--t1); text-align: left; cursor: pointer; }
.as-ha svg { width: 20px; height: 20px; color: var(--t2); }
.as-ha.pel, .as-ha.pel svg { color: oklch(0.52 0.19 25); }
.as-hform { display: flex; flex-direction: column; gap: 6px; padding: 4px 20px 8px; }
.as-rot { font-size: 14px; font-weight: 600; color: var(--t1); }
.as-rq { color: oklch(0.55 0.2 25); }
.as-in { height: 48px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 12px; font: inherit; font-size: 16px; color: var(--t1); }
.as-htx { margin: 0; padding: 0 20px 8px; font-size: 15px; color: var(--t2); line-height: 1.5; }
.as-hpie { display: flex; flex-direction: column; gap: 10px; padding: 12px 20px 0; }
.as-hpie .cb { width: 100%; height: 48px; font-size: 16px; }
.as-pel { background: var(--peligro) !important; color: #fff !important; border-color: transparent !important; }
.ap-nav a .i svg { display: block; }
"""


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def marcar(t, css):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def nav_links(t):
    nav = re.search(r'<nav class="ap-nav"[^>]*>(.*?)</nav>', t, re.S).group(1)
    return [(m.group(1), re.sub(r'^<a[^>]*>', '', m.group(0))[:-4]) for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>.*?</a>', nav, re.S)]


def armar_nav(links, activo):
    cols = len(links)
    estilo = "" if cols == 5 else f' style="grid-template-columns: repeat({cols}, 1fr);"'
    out = ""
    for href, cuerpo in links:
        on = ' class="on" aria-current="page"' if href == activo else ""
        out += f'<a{on} href="{href}">{cuerpo}</a>'
    return f'<nav class="ap-nav" aria-label="Secciones"{estilo}>{out}</nav>'


def tab_asistente(href):
    return (href, f'<span class="i">{CHISPA_NAV}</span>Asistente')


def nav_del_lado(lado, base_nav, activo):
    """La barra de abajo con «Asistente» (recomendación: en el segundo lugar; lo que no entra pasa a «Más»)."""
    links = [l for l in base_nav if "M-Asistente-" not in l[0]]
    tel_nuevo = LADOS[lado]["tel_nuevo"] + ".dc.html"
    if lado == "org":  # Inicio, Asistente, Chats, Contactos, Más (Difusiones pasa a Más)
        links = [l for l in links if "Difusiones" not in l[0]]
    if lado == "plat":  # Organizaciones, Asistente, Cuentas, Consultas, Más (Recuperaciones pasa a Más)
        links = [l for l in links if "Recuperaciones" not in l[0]]
    links.insert(1, tab_asistente(tel_nuevo))
    return armar_nav(links, activo)


hechos = []
for lado, d in LADOS.items():
    # ---- Compu ----
    ruta = PROJ / f"{d['nuevo']}.dc.html"
    if not ruta.exists():
        t = leer(d["base"])
        if lado == "org":
            ini = re.search(r'<div class="ini">(.*)</div></div></main>', t, re.S).group(1)
            acc = re.search(r'<div class="ini-acc">.*?</a></div>', ini, re.S).group(0)
            extra = ini.replace(acc, "") + acc
            a = t.index('<div class="pagina">')
            b = t.index("</main>", a)
            t = t[:a] + zona_compu(d, extra) + t[b:]
            t = re.sub(r"<title>[^<]*</title>", "<title>Asistente · inicio de la organización</title>", t, count=1)
        elif lado == "personal":
            cartel = re.search(r'<div class="w-body">(.*?)</div></div></div>\s*</x-dc>', t, re.S).group(1)
            m = re.search(r'<div class="w-body">.*?</div>(?=</div></div>\s*</x-dc>)', t, re.S)
            t = t[:m.start()] + zona_compu(d, cartel) + t[m.end():]
            t = re.sub(r"<title>[^<]*</title>", "<title>Asistente · inicio personal</title>", t, count=1)
        else:
            org = leer("Inicio-Org")
            banda = re.search(r'<div class="banda-pag">.*?</div></div></div>', org, re.S).group(0).replace("Grupo Delta", "Plataforma")
            li_ini = re.search(r'<li><a class="ab-sidebar__link ab-sidebar__link--active" href="Inicio-Org\.dc\.html" aria-current="page">.*?</li>', org, re.S).group(0)
            li_ini = li_ini.replace("Inicio-Org.dc.html", "Asistente-Plat.dc.html")
            a = t.index('<main class="ab-app-shell__main">') + len('<main class="ab-app-shell__main">')
            b = t.index("</main>", a)
            t = t[:a] + banda + zona_compu(d, PARA_RESOLVER_PLAT) + t[b:]
            t = re.sub(r'<li><a class="ab-sidebar__link" href="Asistente-Plat\.dc\.html">.*?</li>', '', t, count=1, flags=re.S)
            t = t.replace('<nav class="ab-sidebar__nav" aria-label="Secciones"><ul class="ab-sidebar__list">',
                          '<nav class="ab-sidebar__nav" aria-label="Secciones"><ul class="ab-sidebar__list">' + li_ini, 1)
            t = t.replace('<a class="ab-sidebar__link ab-sidebar__link--active" href="Organizaciones.dc.html" aria-current="page">',
                          '<a class="ab-sidebar__link" href="Organizaciones.dc.html">', 1)
            t = re.sub(r'(<li class="ab-breadcrumbs__item ab-breadcrumbs__item--current" aria-current="page">)[^<]*(</li>)', r"\1Inicio\2", t, count=1)
            t = re.sub(r"<title>[^<]*</title>", "<title>Plataforma · Inicio</title>", t, count=1)
        t = con_script(t, d, d["estados"], 1440, 900)
        if lado == "plat":
            t = t.replace("this.state = { plNav: 'gestion',", "this.state = { plNav: null,", 1)
        ruta.write_text(marcar(t, CSS), encoding="utf-8")
        hechos.append(d["nuevo"])

    # ---- Teléfono ----
    ruta = PROJ / f"{d['tel_nuevo']}.dc.html"
    base_tel = leer(d["tel_base"])
    links = nav_links(base_tel)
    if not ruta.exists():
        t = base_tel
        est = re.search(r'<div class="ap-est">.*?</div>', t, re.S).group(0)
        a = t.index('<div class="ap">') + len('<div class="ap">')
        b = t.index('<nav class="ap-nav"')
        fin_nav = t.index("</nav>", b) + len("</nav>")
        barra = (f'<div class="ap-bar as-bar"><button type="button" class="as-tb" aria-label="Conversaciones" onClick="{{{{asAbrirHist}}}}">{HIST}</button>'
                 f'<div class="tit"><h1>Asistente</h1><span class="sub">{d["nombre"]}</span></div>'
                 f'<button type="button" class="as-tb" aria-label="Nueva conversación" onClick="{{{{asNueva}}}}">{NUEVA}</button></div>')
        t = t[:a] + est + barra + zona_tel(d) + nav_del_lado(lado, links, d["tel_nuevo"] + ".dc.html") + t[fin_nav:]
        t = re.sub(r"<title>[^<]*</title>", f"<title>Asistente · {d['nombre']} · teléfono</title>", t, count=1)
        t = con_script(t, d, d["tel_estados"], 390, 844, True)
        ruta.write_text(marcar(t, CSS + CSS_TEL), encoding="utf-8")
        hechos.append(d["tel_nuevo"])
        # La barra de abajo del inicio del teléfono suma la pestaña.
        if MARCA not in base_tel:
            b = base_tel.index('<nav class="ap-nav"')
            fin_nav = base_tel.index("</nav>", b) + len("</nav>")
            t2 = base_tel[:b] + nav_del_lado(lado, links, d["tel_base"] + ".dc.html") + base_tel[fin_nav:]
            (PROJ / f"{d['tel_base']}.dc.html").write_text(marcar(t2, ".ap-nav a .i svg { display: block; }\n"), encoding="utf-8")
            hechos.append(d["tel_base"])

# ---- canvas.json: una fila nueva al final de cada página ----
lienzo = PROJ / "canvas.json"
c = json.loads(lienzo.read_text(encoding="utf-8"))
PAG = {"org": "org", "personal": "personal", "plat": "plataforma"}
TIT = {"org": ("Asistente · inicio de la organización · /org", "Asistente · organización · teléfono"),
       "personal": ("Asistente · inicio personal · /", "Asistente · personal · teléfono"),
       "plat": ("Inicio con el asistente · /plataforma", "Asistente · plataforma · teléfono")}
cambio = False
for lado, d in LADOS.items():
    pag = PAG[lado]
    if f"{d['nuevo']}.dc.html" in c["boards"]:
        continue
    fondo = max(v["y"] + v["h"] for v in c["boards"].values() if v["page"] == pag)
    y = fondo + 260
    c["boards"][f"{d['nuevo']}.dc.html"] = {"x": 0, "y": y, "w": 1440, "h": 900, "title": TIT[lado][0], "page": pag, "is_interactive": True}
    c["boards"][f"{d['tel_nuevo']}.dc.html"] = {"x": 1520, "y": y, "w": 390, "h": 844, "title": TIT[lado][1], "page": pag, "is_interactive": True}
    for n in [d["nuevo"], d["tel_nuevo"]]:
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    cambio = True
if cambio:
    lienzo.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("tableros", hechos)
