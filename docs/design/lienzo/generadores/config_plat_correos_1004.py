"""Config-Plat: los correos de contacto de ventas y de soporte (decisión 6 del usuario: salen de la configuración de la
plataforma). Son los que muestran el registro de empresa cerrado o en el límite («ventas@ejemplo.com») y la cuenta suspendida
en el ingreso y en el enlace del bot («soporte@ejemplo.com»). Van en la sección «Contacto», debajo de «Registro y altas»,
entran en «Cambios sin guardar» y se validan al guardar («Ingresá un correo válido.»).
El teléfono (M-Config-Plat) lo arma telefonos_1004/app_plat_personal.py. Lleva `data-vuelta="1004-correos-Config-Plat"`."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-correos-Config-Plat"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def campo(clave, rotulo):
    return (f'\n            <div class="campo2">\n              <label class="et" for="f-{clave}">{rotulo}</label>\n'
            f'              <input class="in2 {{{{mal{clave}}}}}" id="f-{clave}" type="email" autocomplete="off" value="{{{{{clave}}}}}" onChange="{{{{on{clave}}}}}">\n'
            f'              <sc-if value="{{{{err{clave}}}}}" hint-placeholder-val="{{{{no}}}}"><span class="err2" role="alert">{{{{err{clave}}}}}</span></sc-if>\n            </div>')


ruta = PROJ / "Config-Plat.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    fin = t.index("\n\n        </div>\n      </div>\n    </main>")
    t = t[:fin] + "\n            <h2>Contacto</h2>" + campo("Ventas", "Correo de ventas") + campo("Soporte", "Correo de soporte") + t[fin:]
    t = rep(t, "guardado: { registro: 'open', alta: 'approval', limite: '3' }, registro: 'open', alta: 'approval', limite: '3', errLimite: '' };",
            "guardado: { registro: 'open', alta: 'approval', limite: '3', ventas: 'ventas@ejemplo.com', soporte: 'soporte@ejemplo.com' }, "
            "registro: 'open', alta: 'approval', limite: '3', ventas: 'ventas@ejemplo.com', soporte: 'soporte@ejemplo.com', errLimite: '', errVentas: '', errSoporte: '' };")
    sucio = "s.registro !== s.guardado.registro || s.alta !== s.guardado.alta || s.limite !== s.guardado.limite"
    t = t.replace(sucio, sucio + " || s.ventas !== s.guardado.ventas || s.soporte !== s.guardado.soporte")
    t = rep(t, "descartar: () => this.setState({ ...s.guardado, errLimite: '', abierto: null }),",
            "descartar: () => this.setState({ ...s.guardado, errLimite: '', errVentas: '', errSoporte: '', abierto: null }),")
    t = rep(t, "        if (!Number.isInteger(n) || n < 1 || n > 50) {\n          this.setState({ errLimite: 'Usá un número de 1 a 50.', abierto: null });\n\n          return;\n        }\n",
            "        const correo = (v) => /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.trim());\n"
            "        const errores = {\n          errLimite: !Number.isInteger(n) || n < 1 || n > 50 ? 'Usá un número de 1 a 50.' : '',\n"
            "          errVentas: correo(s.ventas) ? '' : 'Ingresá un correo válido.',\n          errSoporte: correo(s.soporte) ? '' : 'Ingresá un correo válido.',\n        };\n\n"
            "        if (errores.errLimite || errores.errVentas || errores.errSoporte) {\n          this.setState({ ...errores, abierto: null });\n\n          return;\n        }\n")
    t = rep(t, "this.setState({ guardado: { registro: s.registro, alta: s.alta, limite: s.limite } });",
            "this.setState({ guardado: { registro: s.registro, alta: s.alta, limite: s.limite, ventas: s.ventas.trim(), soporte: s.soporte.trim() } });")
    t = rep(t, "      malLimite: s.errLimite ? 'mal' : '',\n",
            "      malLimite: s.errLimite ? 'mal' : '',\n"
            "      Ventas: s.ventas,\n      onVentas: (e) => this.setState({ ventas: e.target.value, errVentas: '' }),\n      malVentas: s.errVentas ? 'mal' : '',\n      errVentas: s.errVentas,\n"
            "      Soporte: s.soporte,\n      onSoporte: (e) => this.setState({ soporte: e.target.value, errSoporte: '' }),\n      malSoporte: s.errSoporte ? 'mal' : '',\n      errSoporte: s.errSoporte,\n")
    t = rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Config-Plat")
