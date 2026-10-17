"""Etapa 9 · «Confirmá que sos vos» en las demás acciones delicadas de Plataforma (pedido de la Guía, 2026-10-16).
Dos ejemplos, uno por forma de pedirlo; el resto de las acciones sigue la misma regla (Criterio-Decisiones):
- Recuperaciones › Aprobar: la confirmación reemplaza al diálogo «Revisar el pedido», nunca va encima.
- Documentos legales › Publicar: reemplaza al diálogo de publicar; el formulario de la página queda cargado detrás.
Copia el diálogo de Cuenta-Plat (etapa9_reauth_1004.py). Se puede volver a correr."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def dialogo(flag, texto):
    celdas = "".join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Código {i}">' for i in range(1, 7))
    return (f'<sc-if value="{{{{{flag}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="velo"><div class="dlg chico" role="dialog" aria-modal="true" aria-label="Confirmá que sos vos">'
            f'<div class="dlg-h"><h2>Confirmá que sos vos</h2></div><div class="dlg-t">{texto}</div>'
            f'<div class="dlg-b una ra" style="padding-top: 0;"><div class="otp " role="group" aria-label="Código">{celdas}</div>'
            '<button type="button" class="lnk ra-rec">Usar un código de recuperación</button></div>'
            '<div class="dlg-f"><button type="button" class="b b-sec">Cancelar</button><button type="button" class="b b-pri">Confirmar</button></div></div></div></sc-if>')


def css_del_dialogo():
    t = (PROJ / "Cuenta-Plat.dc.html").read_text(encoding="utf-8")
    lineas = [l for l in t.splitlines() if re.match(r"\s*\.(ra|otp)\b", l) and l.rstrip().endswith("}")]
    assert any(".ra .otp input" in l for l in lineas)
    return "\n    /* Etapa 9: «Confirmá que sos vos», copiado de Cuenta-Plat */\n" + "\n".join("    " + l.strip() for l in lineas) + "\n  </style>"


def opcion(t, prop, nueva):
    patron = re.compile(r'("%s":\{"editor":"enum","options":\[)([^\]]*)(\])' % prop)
    m = patron.search(t)
    assert m, prop
    return t[:m.end(2)] + ',"%s"' % nueva + t[m.end(2):]


def recuperaciones():
    ruta = PROJ / "Recuperaciones.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Aprobar: confirmá que sos vos"
    if est in t:
        print("Recuperaciones ya tiene el estado")
        return
    t = opcion(t, "caso", est)
    t = r(t, "const CASOS = { 'Pedidos': 'pedidos', 'Revisar un pedido': 'revisar', 'Sin pedidos': 'vacio' };",
          f"const CASOS = {{ 'Pedidos': 'pedidos', 'Revisar un pedido': 'revisar', 'Sin pedidos': 'vacio', '{est}': 'pedidos' }};")
    i = t.index("  renderVals() {")
    j = t.index("return {", i) + len("return {")
    t = (t[:j] + "\n      // Etapa 9: al aprobar sin una confirmación reciente, este diálogo reemplaza a «Revisar el pedido».\n"
         f"      reauthAprobar: this.props.caso === '{est}'," + t[j:])
    t = r(t, '<sc-if value="{{dlgRevisar}}"',
          dialogo("reauthAprobar", "Para aprobar el pedido de Pablo Ortiz, escribí el código de tu app de autenticación.") + '<sc-if value="{{dlgRevisar}}"')
    if ".ra .otp input" not in t:
        t = t.replace("  </style>", css_del_dialogo(), 1)
    ruta.write_text(t, encoding="utf-8")
    print("Recuperaciones: 1 estado")


def legales():
    ruta = PROJ / "Legales.dc.html"
    t = ruta.read_text(encoding="utf-8")
    est = "Publicar: confirmá que sos vos"
    if est in t:
        print("Legales ya tiene el estado")
        return
    t = opcion(t, "pantalla", est)
    t = r(t, "const PANTALLAS = { 'Documentos': 'lista', 'Publicar versión nueva': 'nueva' };",
          f"const PANTALLAS = {{ 'Documentos': 'lista', 'Publicar versión nueva': 'nueva', '{est}': 'nueva' }};")
    t = r(t, "...this.formVacio('Terms'), clavePantalla: props.pantalla,", "...this.formInicial(props.pantalla), clavePantalla: props.pantalla,")
    t = r(t, "pantalla: PANTALLAS[this.props.pantalla ?? 'Documentos'], ...this.formVacio('Terms') });",
          "pantalla: PANTALLAS[this.props.pantalla ?? 'Documentos'], ...this.formInicial(this.props.pantalla) });")
    t = r(t, "  formVacio(tipo) {",
          "  // Etapa 9: al publicar sin una confirmación reciente, el formulario queda cargado detrás del diálogo.\n"
          "  formInicial(pantalla) {\n"
          "    const f = this.formVacio('Terms');\n"
          f"    return pantalla === '{est}' ? {{ ...f, vigencia: '01/11/2026', es: 'Estos términos regulan el uso del servicio por parte de las personas y las organizaciones.', en: 'These terms govern the use of the service by people and organizations.' }} : f;\n"
          "  }\n\n"
          "  formVacio(tipo) {")
    i = t.index("  renderVals() {")
    j = t.index("return {", i) + len("return {")
    t = (t[:j] + "\n      // Etapa 9: este diálogo reemplaza al de publicar, nunca va encima.\n"
         f"      reauthPublicar: this.props.pantalla === '{est}'," + t[j:])
    t = r(t, '<sc-if value="{{confirmacion}}"',
          dialogo("reauthPublicar", "Para publicar la versión 3 de Términos y condiciones, escribí el código de tu app de autenticación.") + '<sc-if value="{{confirmacion}}"')
    if ".ra .otp input" not in t:
        t = t.replace("  </style>", css_del_dialogo(), 1)
    ruta.write_text(t, encoding="utf-8")
    print("Legales: 1 estado")


if __name__ == "__main__":
    recuperaciones()
    legales()
