"""Etapa 10 · Exportar mis datos en Mi cuenta (el «Para Diseño» de `docs/plans/2026-10-16-etapa-10-despliegue.md` del back).

POST /api/me/data-export pide los datos y GET /api/me/data-export/{id}/download los baja, desde el enlace del correo
«Exportación de datos lista» (`/cuenta?dataExport={id}`, que ya está en Mensajes, con su vencimiento de 48 horas). Sin pantalla
nueva, sin historial, sin opciones de alcance ni destinatario y sin «Confirmá que sos vos». Cada estado usa una pieza que ya existe:
- lo que salió bien, el aviso verde de abajo a la derecha (en el teléfono, la franja oscura);
- lo que falló, el aviso rojo con ✕ y, si es de red, «Reintentar» (tablero Avisos);
- lo que sigue pasando, el cartel arriba del contenido: «Descargando tus datos…»;
- el límite de pedidos, el aviso rojo con cuándo probar de nuevo y el botón grisado (24/10);
- sin un correo verificado, el botón apagado con ⓘ que abre el motivo, como «Dar de baja» de la única Dueña.
Los textos de error son los del contrato (Identity.DataExport.*), salvo el de un pedido ajeno (404), que no cuenta si existe.

Toca Cuenta (un Tweak «exportar») y M-Cuenta (estados nuevos). Se puede volver a correr: si ya están, no hace nada.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-e10="exportar"'
EXPORTAR_APROBADO = True
PARA_APROBAR = " · para aprobar"

# ---------------------------------------------------------------- Textos (contrato K1 de la E10 y avisos comunes de la app)
T_OK_PEDIDO = "Recibimos tu pedido. Te mandamos tus datos por correo cuando estén listos."
T_OK_BAJADO = "Descargamos tus datos."
T_RED = "No pudimos conectarnos. Revisá tu conexión."
T_VENCIO = "Este enlace venció. Volvé a pedir tus datos."
T_AJENO = "No encontramos esos datos en tu cuenta. Si los pediste con otra, entrá con esa."
T_DESCARGA = "No pudimos descargar tus datos. Probá de nuevo."
T_LIMITE = "Hiciste muchos pedidos seguidos. Probá de nuevo en 0:41."  # el aviso de error de siempre (24/10)
T_BAJANDO = "Descargando tus datos…"
T_SIN_CORREO = "Agregá y verificá un correo para recibir tus datos."
TEL = "011 15-5555-4521"

ESTADOS = ["Sin pedir", "Pidiendo", "Recibimos el pedido", "Sin conexión", "Demasiados pedidos", "Sin correo verificado",
           "Sin correo verificado: el motivo", "Desde el correo: descargando", "Desde el correo: descargado",
           "Desde el correo: venció", "Desde el correo: otra cuenta", "Desde el correo: no se pudo descargar"]

INFO = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/></svg>')
ALERTA = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5"/><path d="M12 16.2h.01"/></svg>')
TRI = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>')
RELOJ = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>')
CERRAR = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
WA = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      '<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/></svg>')


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:100], t.count(a))
    return t.replace(a, b)


def fin_de(t, i, abre, cierra):
    d = 0
    for m in re.finditer(re.escape(abre) + "|" + re.escape(cierra), t[i:]):
        d += 1 if m.group(0) == abre else -1
        if d == 0:
            return i + m.end()
    raise AssertionError(abre)


# ================================================================ Cuenta (compu): un Tweak «exportar»
JS_CUENTA = """// Etapa 10 · Exportar mis datos: textos del contrato (Identity.DataExport.*) y avisos comunes de la app.
const EXP_OK = { 'Recibimos el pedido': %(ok1)s, 'Desde el correo: descargado': %(ok2)s };
const EXP_MAL = { 'Sin conexión': %(red)s, 'Demasiados pedidos': %(limite)s, 'Desde el correo: venció': %(vencio)s, 'Desde el correo: otra cuenta': %(ajeno)s, 'Desde el correo: no se pudo descargar': %(descarga)s };
const EXP_REINTENTAR = ['Sin conexión', 'Desde el correo: no se pudo descargar'];
function exportar(e, s, c, conModulo) {
  // Sin correo verificado: la cuenta entra solo con su WhatsApp (400 Identity.DataExport.EmailRequired).
  const soloTel = e.startsWith('Sin correo verificado');
  const v = {
    // 24/10: mientras pide o mientras dura el límite, grisado con su mismo texto (y el aro, si está pidiendo).
    expPidiendo: e === 'Pidiendo',
    expApag: e === 'Pidiendo' || e === 'Demasiados pedidos',
    expPuede: !soloTel, expSinCorreo: soloTel,
    expBajando: e === 'Desde el correo: descargando',
    expMal: s.expCerrado ? '' : (EXP_MAL[e] || ''), expReintentar: EXP_REINTENTAR.includes(e),
    expCerrar: () => c.setState({ expCerrado: true }),
    expInfo: s.expInfo || (e === 'Sin correo verificado: el motivo' && !s.expVisto),
    verExp: () => c.setState({ expInfo: true }), cerrarExp: () => c.setState({ expInfo: false, expVisto: true }),
    soloTel, telSinVerificar: conModulo && !soloTel, contacto: soloTel ? %(tel)s : 'lucia.fer@gmail.com',
  };
  if (EXP_OK[e]) v.aviso = s.aviso || EXP_OK[e];
  if (soloTel) Object.assign(v, { principalPersonal: false, principalEmpresa: false, conTrabajo: false });
  return v;
}

""" % {"ok1": json.dumps(T_OK_PEDIDO, ensure_ascii=False), "ok2": json.dumps(T_OK_BAJADO, ensure_ascii=False), "red": json.dumps(T_RED, ensure_ascii=False),
       "vencio": json.dumps(T_VENCIO, ensure_ascii=False), "ajeno": json.dumps(T_AJENO, ensure_ascii=False), "descarga": json.dumps(T_DESCARGA, ensure_ascii=False),
       "limite": json.dumps(T_LIMITE, ensure_ascii=False), "tel": json.dumps(TEL, ensure_ascii=False)}

CSS_CUENTA = """  <style MARCA>
.p-aviso.mal { border-color: oklch(0.57 0.2 25 / 0.45); align-items: flex-start; }
.p-aviso .o-tt { flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 1px; }
.p-aviso .ib { margin: -6px -6px -6px 0; }
.p-aviso .o-lnk { height: auto; padding: 0; font-size: 13px; }
.ex-gira { display: inline-block; width: 14px; height: 14px; margin-right: 6px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; vertical-align: -2px; animation: ex-gira 0.8s linear infinite; }
@keyframes ex-gira { to { transform: rotate(360deg); } }
.w-body > .w-cartel { flex-shrink: 0; }
.w-cartel svg { flex-shrink: 0; }
  </style>""".replace("MARCA", MARCA)


def cuenta():
    f = PROJ / "Cuenta.dc.html"
    t = f.read_text(encoding="utf-8")
    if MARCA in t:
        return False
    # El Tweak y la lógica
    t = r(t, ',"$preview":{"width":1440,"height":900}}\'>',
          ',"exportar":' + json.dumps({"editor": "enum", "options": ESTADOS, "default": "Sin pedir", "section": "Estado"}, ensure_ascii=False, separators=(",", ":"))
          + ',"$preview":{"width":1440,"height":900}}\'>')
    t = r(t, "\nclass Component extends DCLogic {", "\n" + JS_CUENTA + "class Component extends DCLogic {")
    t = r(t, "      cerrarInfo: () => this.setState({ info: false }),\n",
          "      cerrarInfo: () => this.setState({ info: false }),\n"
          "      ...exportar(this.props.exportar ?? 'Sin pedir', s, this, this.props.whatsapp !== 'Sin el módulo de WhatsApp'),\n")
    # La fila de Privacidad: con correo, el botón (pidiendo, o la cuenta del límite); sin correo, apagado con ⓘ
    m = re.search(r'<div class="w-it"><span class="p-ic">(<svg[^>]*><path d="M12 4v11"/>.*?</svg>)</span><span class="dato"><b>Exportar mis datos</b></span>'
                  r'<button type="button" class="cb cb-sec ch">Exportar</button></div>', t, re.S)
    assert m, "la fila de Exportar mis datos"
    ic = m.group(1)
    fila = (f'<sc-if value="{{{{expPuede}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-it" {MARCA}><span class="p-ic">{ic}</span><span class="dato"><b>Exportar mis datos</b></span>'
            '<button type="button" class="cb cb-sec ch" disabled="{{expApag}}"><sc-if value="{{expPidiendo}}" hint-placeholder-val="{{no}}">'
            '<span class="ex-gira" aria-hidden="true"></span></sc-if>Exportar</button></div></sc-if>'
            f'<sc-if value="{{{{expSinCorreo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-it"><span class="p-ic">{ic}</span><span class="dato"><b class="o-fila-tit">Exportar mis datos'
            f'<button type="button" class="o-i" aria-label="Por qué no podés exportar tus datos" onClick="{{{{verExp}}}}">{INFO}</button></b></span>'
            '<button type="button" class="cb cb-sec ch o-apagado" aria-disabled="true" onClick="{{verExp}}">Exportar</button></div></sc-if>')
    t = t.replace(m.group(0), fila, 1)
    # Cómo entrás: sin correo, solo el WhatsApp como principal
    a = f'<sc-if value="{{{{conModulo}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-it"><span class="p-ic">'
    i = t.index(f"<b>{TEL}</b><span>Sin verificar</span>")
    k = t.rindex(a, 0, i)
    t = t[:k] + t[k:].replace(a, a.replace("conModulo", "telSinVerificar"), 1)
    j = fin_de(t, k, "<sc-if", "</sc-if>")
    tel = (f'<sc-if value="{{{{soloTel}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-it"><span class="p-ic">{WA}</span>'
           f'<span class="dato"><b>{TEL}</b><span>Principal</span></span></div></sc-if>')
    t = t[:j] + tel + t[j:]
    # Quién es: sin correo, el teléfono
    t = r(t, "<span>lucia.fer@gmail.com</span></span></div></aside>", "<span>{{contacto}}</span></span></div></aside>")
    t = r(t, '<span class="s">lucia.fer@gmail.com</span>', '<span class="s">{{contacto}}</span>')
    # Carteles arriba del contenido: el límite (Etapa 9) y la descarga desde el correo
    a = '</div></div><div class="w-body"><div class="w-caja"><div class="w-cab"><span>Tus datos</span>'
    t = r(t, a, a.replace('<div class="w-body">', '<div class="w-body">'
                          f'<sc-if value="{{{{expBajando}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-cartel info" role="status">{RELOJ}<span class="tx">{T_BAJANDO}</span></div></sc-if>'))
    # El aviso rojo, que se cierra a mano; si es de red o de la descarga, con «Reintentar»
    rojo = (f'<sc-if value="{{{{expMal}}}}" hint-placeholder-val="{{{{no}}}}"><div class="p-aviso mal" role="alert"><span style="color: oklch(0.55 0.2 25); display: inline-flex;">{ALERTA}</span>'
            '<span class="o-tt"><span>{{expMal}}</span></span>'
            '<sc-if value="{{expReintentar}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl o-lnk" style="margin-top: 1px;">Reintentar</button></sc-if>'
            f'<button type="button" class="ib" aria-label="Cerrar" onClick="{{{{expCerrar}}}}">{CERRAR}</button></div></sc-if>')
    # El motivo, como el de la única Dueña
    dlg = ('<sc-if value="{{expInfo}}" hint-placeholder-val="{{no}}"><div class="w-oscuro" style="z-index: 6;"></div>'
           '<div class="p-dlg" role="dialog" aria-label="No podemos mandarte tus datos"><div class="dc"><span>No podemos mandarte tus datos</span>'
           f'<button type="button" class="ib" aria-label="Cerrar" onClick="{{{{cerrarExp}}}}">{CERRAR}</button></div><div class="db"><div class="o-mot">{ALERTA}<div><b>{T_SIN_CORREO}</b></div></div>'
           '<span class="o-sub">Qué podés hacer</span><ol class="o-pasos"><li><span class="n">1</span>Agregá un correo en «Cómo entrás»</li>'
           '<li><span class="n">2</span>O vinculá tu cuenta de Google</li></ol></div>'
           '<div class="df"><button type="button" class="cb cb-pri" onClick="{{cerrarExp}}">Entendido</button></div></div></sc-if>')
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + rojo + dlg + t[k:]
    t = r(t, "</helmet>", CSS_CUENTA + "\n</helmet>")
    f.write_text(t, encoding="utf-8")
    return True


# ================================================================ M-Cuenta (teléfono): un estado por caso, copiado de «Con el módulo de WhatsApp»
FILA_TEL = '<div class="ap-it "><span class="tx"><b>Exportar mis datos</b></span><span class="acc-t">Exportar</span></div>'
SNACK_OK = ('<div class="f-snack" role="status"><span class="ok"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg></span><span class="tx">{}</span></div>')
SNACK_MAL = ('<div class="f-snack" role="alert"><span class="mal"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
             '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg></span><span class="tx">{}</span>{}'
             '<button type="button" class="x" aria-label="Cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg></button></div>')
REINTENTAR = '<button type="button" class="l">Reintentar</button>'
INICIO_CUERPO = '<div class="ap-cuerpo ap-gris"><span class="ap-gtit">Tus datos</span>'
CSS_TEL = """  <style MARCA>
.acc-t.apag { color: var(--t3); }
.f-snack .mal { color: oklch(0.75 0.15 25); display: inline-flex; }
.f-snack button.l { color: oklch(0.82 0.08 195); font-weight: 600; text-decoration: none; background: none; border: 0; padding: 0; font: inherit; font-weight: 600; }
.f-snack .x { color: oklch(1 0 0 / 0.7); display: inline-flex; background: none; border: 0; padding: 0; }
.ap-cartel.fila { margin: 12px 16px 0; display: flex; flex-direction: row; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; font-size: 14px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.ap-cartel.fila svg { flex-shrink: 0; margin-top: 1px; }
.ap-cartel.fila.info { background: var(--marca-t); color: var(--marca-tx); }
.t-mot { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.t-mot svg { flex-shrink: 0; margin-top: 3px; }
.t-mot b { display: block; font-size: 15px; font-weight: 600; }
.t-sub { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.t-pasos { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
.t-pasos li { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.t-pasos .n { width: 24px; height: 24px; border-radius: 50%; background: var(--s2); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  </style>""".replace("MARCA", MARCA)


def cartel(texto, info=False):
    return f'<div class="ap-cartel fila{" info" if info else ""}" role="{"status" if info else "alert"}">{RELOJ if info else TRI}<span>{texto}</span></div>'


SUBIR_TEL = 380  # el teléfono muestra la página más abajo, en Cómo entrás y Privacidad


def tel_variante(base, estado):
    # Corrida hacia abajo para que se vea la fila; el cartel queda fijo debajo de la barra, fuera de lo que se corre
    b = r(base, INICIO_CUERPO, INICIO_CUERPO.replace('<span class="ap-gtit">', f'<span class="ap-gtit" style="margin-top: -{SUBIR_TEL}px;">'))
    cuerpo = INICIO_CUERPO.replace('<span class="ap-gtit">', f'<span class="ap-gtit" style="margin-top: -{SUBIR_TEL}px;">')
    if estado == "Pidiendo":
        b = r(b, FILA_TEL, FILA_TEL.replace('<span class="acc-t">Exportar</span>', '<span class="acc-t apag">Exportar</span>'))
    elif estado == "Demasiados pedidos":
        b = r(b, FILA_TEL, FILA_TEL.replace('<span class="acc-t">Exportar</span>', '<span class="acc-t apag">Exportar</span>'))
        b = b[:b.rindex("</div>")] + SNACK_MAL.format(T_LIMITE, "") + "</div>"
    elif estado.startswith("Sin correo verificado"):
        # Solo el WhatsApp, como principal: sin correos
        b = re.sub(r'<div class="ap-it "><span class="tx"><b>lucia\.fer@gmail\.com</b><span>Principal</span></span></div>', "", b, count=1)
        b = re.sub(r'<div class="ap-it "><span class="tx"><b>lucia\.fernandez@delta\.ejemplo\.com</b>.*?</button></div>', "", b, count=1, flags=re.S)
        m = re.search(rf'<div class="ap-it "><span class="tx"><b>{re.escape(TEL)}</b><span><span class="w-est amb">Sin verificar</span></span></span>.*?</button></div>', b, re.S)
        assert m, "el WhatsApp del teléfono"
        b = b.replace(m.group(0), f'<div class="ap-it "><span class="tx"><b>{TEL}</b><span>Principal</span></span></div>', 1)
        fila = (f'<div class="ap-it "><span class="tx"><b>Exportar mis datos<button type="button" class="ap-i" aria-label="Por qué no podés exportar tus datos">{INFO}</button></b></span>'
                '<span class="acc-t apag">Exportar</span></div>')
        b = r(b, FILA_TEL, fila)
        if estado.endswith("el motivo"):
            hoja = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="No podemos mandarte tus datos"><span class="asa"></span>'
                    f'<div class="hc"><div><h2>No podemos mandarte tus datos</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR}</button></div>'
                    f'<div class="hb"><div class="t-mot">{ALERTA}<div><b>{T_SIN_CORREO}</b></div></div><span class="t-sub">Qué podés hacer</span>'
                    '<ol class="t-pasos"><li><span class="n">1</span>Agregá un correo en «Cómo entrás»</li><li><span class="n">2</span>O vinculá tu cuenta de Google</li></ol></div>'
                    '<div class="hp"><button type="button" class="cb cb-pri">Entendido</button></div></div>')
            b = b[:b.rindex("</div>")] + hoja + "</div>"
    elif estado == "Desde el correo: descargando":
        b = r(b, cuerpo, cartel(T_BAJANDO, info=True) + cuerpo)
    else:
        if estado in ("Recibimos el pedido", "Desde el correo: descargado"):
            snack = SNACK_OK.format(T_OK_PEDIDO if estado == "Recibimos el pedido" else T_OK_BAJADO)
        else:
            texto = {"Sin conexión": T_RED, "Desde el correo: venció": T_VENCIO, "Desde el correo: otra cuenta": T_AJENO,
                     "Desde el correo: no se pudo descargar": T_DESCARGA}[estado]
            snack = SNACK_MAL.format(texto, REINTENTAR if estado in ("Sin conexión", "Desde el correo: no se pudo descargar") else "")
        b = b[:b.rindex("</div>")] + snack + "</div>"
    return b


def m_cuenta():
    f = PROJ / "M-Cuenta.dc.html"
    t = f.read_text(encoding="utf-8")
    if MARCA in t:
        return False
    i = t.index('<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">')
    j = fin_de(t, i, "<sc-if", "</sc-if>")
    abre = '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">'
    base = t[i + len(abre):j - len("</sc-if>")]
    assert base.count(FILA_TEL) == 1
    nuevos = [e for e in ESTADOS if e != "Sin pedir"]
    bloques = "".join(f'<sc-if value="{{{{eX{k}}}}}" hint-placeholder-val="{{{{no}}}}">{tel_variante(base, e)}</sc-if>' for k, e in enumerate(nuevos))
    t = t[:j] + bloques + t[j:]
    # El Tweak y las banderas
    viejo = re.search(r'("estado":\{"editor":"enum","options":\[)([^\]]*)(\])', t)
    opciones = json.loads("[" + viejo.group(2) + "]")
    opciones += [f"Exportar: {e[0].lower() + e[1:]}" if not e.startswith("Desde el correo") else e for e in nuevos]
    t = t[:viejo.start(2)] + ",".join(json.dumps(o, ensure_ascii=False) for o in opciones) + t[viejo.end(2):]
    nombres = opciones[-len(nuevos):]
    banderas = "".join(f'      eX{k}: e === {json.dumps(n, ensure_ascii=False)},\n' for k, n in enumerate(nombres))
    t = r(t, '      e1: e === "Sin el módulo de WhatsApp",\n',
          '      e1: e === "Sin el módulo de WhatsApp",\n      // Etapa 10 · Exportar mis datos\n' + banderas)
    t = r(t, "</helmet>", CSS_TEL + "\n</helmet>")
    f.write_text(t, encoding="utf-8")
    return True


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n in ("Cuenta", "M-Cuenta"):
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(PARA_APROBAR, "") + ("" if EXPORTAR_APROBADO else PARA_APROBAR)
        b["is_interactive"] = True
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    print("Cuenta", cuenta())
    print("M-Cuenta", m_cuenta())
    registrar()
