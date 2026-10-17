"""Etapa 9 · «Confirmá que sos vos» en Cuenta-Plat y M-Cuenta-Plat (pedido de la Guía, 2026-10-16).
Suma los estados que faltaban: con un código de recuperación, su error, demasiados intentos (el mismo bloqueo
de la cuenta, Identity.Account.LockedOut) y cancelar la confirmación sin perder el formulario.
Copia los textos y las piezas del ingreso del operador (Ingreso, «Operador: código de recuperación»).
Se puede volver a correr: si los estados ya están, no toca nada."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

APP_BIEN = "Operador: confirmar que sos vos"
APP_MAL = "Operador: confirmar que sos vos · código incorrecto"
REC = "Operador: confirmar con un código de recuperación"
REC_MAL = "Operador: confirmar · código de recuperación incorrecto"
BLOQ = "Operador: confirmar · demasiados intentos"
VUELTA = "Operador: cancelar la confirmación"
NUEVOS = [REC, REC_MAL, BLOQ, VUELTA]

T_APP = "Para guardar los permisos de Laura Díaz, escribí el código de tu app de autenticación."
T_REC = "Para guardar los permisos de Laura Díaz, escribí uno de los códigos de recuperación que guardaste."
E_REC = "Ese código no es válido o ya lo usaste."
E_BLOQ = "Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos. Probá de nuevo en 15 minutos."
PERMISOS_NUEVOS = "Ver organizaciones, Administrar cuentas, Recuperaciones y Ver la auditoría"
MOTIVO = "Va a atender las bajas de cuentas."


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def otp(valores, clase, bloq=False):
    dis = " disabled" if bloq else ""
    celdas = "".join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Código {i + 1}" value="{v}"{dis}>' for i, v in enumerate(valores))
    return f'<div class="otp {clase}" role="group" aria-label="Código">{celdas}</div>'


def opciones(t, prop, despues):
    patron = re.compile(r'("%s":\{"editor":"enum","options":\[)([^\]]*)(\])' % prop)
    m = patron.search(t)
    assert m, prop
    lista = m.group(2)
    ancla = '"%s"' % despues
    assert ancla in lista, despues
    extra = "".join(',"%s"' % n for n in NUEVOS)
    return t[:m.start(2)] + lista.replace(ancla, ancla + extra) + t[m.end(2):]


CSS_ESC = """
    /* Etapa 9: confirmar con un código de recuperación y el bloqueo */
    .ra input.in2.rec { height: 44px; min-height: 0; padding: 0 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 15px; letter-spacing: 0.08em; cursor: text; }
    .ra .otp.bloq input { background: var(--s2); color: var(--t3); border-color: var(--borde); }
    .ra .ra-rec:disabled { color: var(--t3); cursor: default; text-decoration: none; }
    .dlg-f .b-pri:disabled { opacity: 0.45; cursor: default; }
  </style>"""


def escritorio():
    ruta = PROJ / "Cuenta-Plat.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if REC in t:
        print("Cuenta-Plat ya tiene los estados")
        return
    t = opciones(t, "cuenta", APP_MAL)

    # Diálogo «Confirmá que sos vos»: texto y cuerpo según el modo (app o recuperación).
    i = t.index('<sc-if value="{{dlgReauth}}"')
    j = t.index("</sc-if>", t.index("Confirmar</button>", i)) + len("</sc-if>")
    viejo = t[i:j]
    otp_mal = viejo[viejo.index('<sc-if value="{{reauthMal}}"'):viejo.index('<sc-if value="{{reauthBien}}"')]
    otp_bien = viejo[viejo.index('<sc-if value="{{reauthBien}}"'):viejo.index('<button type="button" class="lnk ra-rec">')]
    nuevo = (
        '<sc-if value="{{dlgReauth}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg chico" role="dialog" aria-modal="true" aria-label="Confirmá que sos vos">'
        '<div class="dlg-h"><h2>Confirmá que sos vos</h2></div>'
        f'<sc-if value="{{{{reauthApp}}}}" hint-placeholder-val="{{{{si}}}}"><div class="dlg-t">{T_APP}</div></sc-if>'
        f'<sc-if value="{{{{reauthRec}}}}" hint-placeholder-val="{{{{no}}}}"><div class="dlg-t">{T_REC}</div></sc-if>'
        '<div class="dlg-b una ra" style="padding-top: 0;">'
        + otp_mal + otp_bien
        + '<sc-if value="{{reauthBloq}}" hint-placeholder-val="{{no}}">' + otp("774201", "bloq", True)
        + f'<span class="err2" role="alert">{E_BLOQ}</span></sc-if>'
        '<sc-if value="{{recBien}}" hint-placeholder-val="{{no}}"><div class="campo2"><label class="et" for="ra-rec-in">Código de recuperación</label>'
        '<input id="ra-rec-in" type="text" class="in2 rec" placeholder="XXXX-XXXX" autocomplete="off" spellcheck="false"></div></sc-if>'
        '<sc-if value="{{recMal}}" hint-placeholder-val="{{no}}"><div class="campo2"><label class="et" for="ra-rec-mal">Código de recuperación</label>'
        f'<input id="ra-rec-mal" type="text" class="in2 rec mal" value="P4TZ-8WNE" autocomplete="off" spellcheck="false" aria-invalid="true"><span class="err2" role="alert">{E_REC}</span></div></sc-if>'
        '<sc-if value="{{reauthLibre}}" hint-placeholder-val="{{si}}"><button type="button" class="lnk ra-rec">Usar un código de recuperación</button></sc-if>'
        '<sc-if value="{{reauthBloq}}" hint-placeholder-val="{{no}}"><button type="button" class="lnk ra-rec" disabled>Usar un código de recuperación</button></sc-if>'
        '<sc-if value="{{reauthRec}}" hint-placeholder-val="{{no}}"><button type="button" class="lnk ra-rec">Usar la app de autenticación</button></sc-if>'
        '</div><div class="dlg-f"><button type="button" class="b b-sec">Cancelar</button>'
        '<sc-if value="{{noBloq}}" hint-placeholder-val="{{si}}"><button type="button" class="b b-pri">Confirmar</button></sc-if>'
        '<sc-if value="{{reauthBloq}}" hint-placeholder-val="{{no}}"><button type="button" class="b b-pri" disabled>Confirmar</button></sc-if>'
        "</div></div></div></sc-if>"
    )
    t = t[:i] + nuevo + t[j:]

    # Cancelar la confirmación: vuelve «Cambiar permisos» con lo que se había cargado.
    i = t.index('<sc-if value="{{dlgPermisos}}"')
    j = t.index("</sc-if>", t.index("Guardar cambios</button>", i)) + len("</sc-if>")
    vuelta = t[i:j].replace("{{dlgPermisos}}", "{{dlgPermisosVuelta}}").replace('aria-expanded="true"', 'aria-expanded="false"')
    k = vuelta.index('<div class="menu lista"')
    m = vuelta.index('</label></div></div><div class="campo2 ancho">', k) + len("</label></div>")
    vuelta = vuelta[:k] + vuelta[m:]
    vuelta = r(vuelta, '<span class="val">Ver organizaciones, Recuperaciones y Ver la auditoría</span>', f'<span class="val">{PERMISOS_NUEVOS}</span>')
    vuelta = r(vuelta, '<textarea class="in2"></textarea>', f'<textarea class="in2">{MOTIVO}</textarea>')
    t = t[:j] + vuelta + t[j:]

    t = r(t,
          "      dlgReauth: (this.props.cuenta || '').startsWith('Operador: confirmar que sos vos'),\n"
          "      reauthMal: this.props.cuenta === 'Operador: confirmar que sos vos · código incorrecto',\n"
          "      reauthBien: this.props.cuenta !== 'Operador: confirmar que sos vos · código incorrecto',\n",
          f"      dlgReauth: ['{APP_BIEN}', '{APP_MAL}', '{REC}', '{REC_MAL}', '{BLOQ}'].includes(this.props.cuenta),\n"
          f"      reauthApp: ['{APP_BIEN}', '{APP_MAL}', '{BLOQ}'].includes(this.props.cuenta),\n"
          f"      reauthRec: ['{REC}', '{REC_MAL}'].includes(this.props.cuenta),\n"
          f"      reauthMal: this.props.cuenta === '{APP_MAL}',\n"
          f"      reauthBien: this.props.cuenta === '{APP_BIEN}',\n"
          "      // Los códigos de recuperación y los del autenticador cuentan para el mismo bloqueo de la cuenta.\n"
          f"      reauthBloq: this.props.cuenta === '{BLOQ}',\n"
          f"      noBloq: this.props.cuenta !== '{BLOQ}',\n"
          f"      reauthLibre: ['{APP_BIEN}', '{APP_MAL}'].includes(this.props.cuenta),\n"
          f"      recBien: this.props.cuenta === '{REC}',\n"
          f"      recMal: this.props.cuenta === '{REC_MAL}',\n"
          "      // Cancelar la confirmación no pierde lo cargado: vuelve el formulario de la acción.\n"
          f"      dlgPermisosVuelta: this.props.cuenta === '{VUELTA}',\n")
    t = t.replace("  </style>", CSS_ESC, 1)
    ruta.write_text(t, encoding="utf-8")
    print("Cuenta-Plat: 4 estados")


CSS_TEL = """
    /* Etapa 9: confirmar con un código de recuperación y el bloqueo */
    .ra .ct.rec { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.06em; }
    .ra .ct.rec.ph { color: var(--t3); }
    .ra .ct.rec.mal { border-color: var(--peligro); }
    .ra .otp.bloq input { background: var(--s2); color: var(--t3); border-color: var(--borde); }
    .ra .ra-rec:disabled { color: var(--t3); cursor: default; }
    .hp .cb-pri:disabled { opacity: 0.45; cursor: default; }
  </style>"""


def telefono():
    ruta = PROJ / "M-Cuenta-Plat.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if REC in t:
        print("M-Cuenta-Plat ya tiene los estados")
        return
    t = opciones(t, "estado", APP_MAL)

    def bloque(n):
        i = t.index('<sc-if value="{{%s}}"' % n)
        j = t.index("</sc-if>", i) + len("</sc-if>")
        assert "<sc-if" not in t[i + 6:j], n
        return t[i:j]

    e9, e3 = bloque("e9"), bloque("e3")
    a = e9.index('<div class="hb">')
    b = e9.index('<div class="hp">')
    pie = '<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Confirmar</button></div></div></sc-if>'
    assert e9.endswith(pie), e9[-200:]
    cab = e9[:a]

    def campo(valor, clase, err=""):
        return ('<div class="ap-cmp"><span class="rt"><span>Código de recuperación</span></span>'
                f'<div class="ct rec {clase}">{valor}</div></div>' + err)

    e10 = (cab.replace("{{e9}}", "{{e10}}")
           + f'<div class="hb"><p class="ap-txt-l">{T_REC}</p><div class="ra">' + campo("XXXX-XXXX", "ph")
           + '<button type="button" class="ra-rec">Usar la app de autenticación</button></div></div>' + pie)
    e11 = (cab.replace("{{e9}}", "{{e11}}")
           + f'<div class="hb"><p class="ap-txt-l">{T_REC}</p><div class="ra">'
           + campo("P4TZ-8WNE", "mal", f'<span class="ra-err" role="alert">{E_REC}</span>')
           + '<button type="button" class="ra-rec">Usar la app de autenticación</button></div></div>' + pie)
    e12 = (cab.replace("{{e9}}", "{{e12}}")
           + f'<div class="hb"><p class="ap-txt-l">{T_APP}</p><div class="ra">' + otp("774201", "bloq", True)
           + f'<span class="ra-err" role="alert">{E_BLOQ}</span><button type="button" class="ra-rec" disabled>Usar un código de recuperación</button></div></div>'
           + pie.replace('class="cb cb-pri">', 'class="cb cb-pri" disabled>'))
    e13 = e3.replace("{{e3}}", "{{e13}}")
    e13 = r(e13, '<div class="ct sel">Ver organizaciones, Recuperaciones y Ver la auditoría', f'<div class="ct sel">{PERMISOS_NUEVOS}')
    e13 = r(e13, '<div class="ct area"></div>', f'<div class="ct area">{MOTIVO}</div>')
    fin = t.index(e9) + len(e9)
    t = t[:fin] + e10 + e11 + e12 + e13 + t[fin:]

    t = r(t, f'e9: e === "{APP_MAL}"',
          f'e9: e === "{APP_MAL}",\n'
          f'      e10: e === "{REC}",\n'
          f'      e11: e === "{REC_MAL}",\n'
          "      // Los códigos de recuperación y los del autenticador cuentan para el mismo bloqueo de la cuenta.\n"
          f'      e12: e === "{BLOQ}",\n'
          "      // Cancelar la confirmación no pierde lo cargado: vuelve el formulario de la acción.\n"
          f'      e13: e === "{VUELTA}"')
    t = t.replace("  </style>", CSS_TEL, 1)
    ruta.write_text(t, encoding="utf-8")
    print("M-Cuenta-Plat: 4 estados")


if __name__ == "__main__":
    escritorio()
    telefono()
