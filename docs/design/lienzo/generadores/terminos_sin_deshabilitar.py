"""Criterio: el botón no se deshabilita hasta aceptar los términos; si falta, el error va debajo de la casilla."""
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
MENSAJE = "Aceptá los Términos y la Política de privacidad."
ERROR = '<sc-if value="{{errAcepta}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{errAcepta}}</span></sc-if>'


def cambiar(t, viejo, nuevo, nombre):
    assert t.count(viejo) == 1, (nombre, t.count(viejo), viejo[:70])
    return t.replace(viejo, nuevo)


def error_bajo_casilla(t, nombre):
    if "{{errAcepta}}" in t:
        return t
    m = re.search(r'<label class="chk">.*?</label>', t, flags=re.S)
    assert m, nombre
    return t[:m.end()] + ERROR + t[m.end():]


for nombre in ["Registro", "Registro-Empresa", "M-Registro", "M-Registro-Empresa"]:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "enviarSiAcepta" not in t:
        t = error_bajo_casilla(t, nombre)
        t = cambiar(t, 'class="b-google" disabled="{{si}}"', 'class="b-google" onClick="{{pedirAcepta}}"', nombre)
        t = cambiar(t, 'onClick="{{enviar}}" disabled="{{noAcepta}}"', 'onClick="{{enviarSiAcepta}}"', nombre)
        t = cambiar(t, "alternarAcepta: () => this.setState({ acepta: !this.state.acepta }),",
                    "alternarAcepta: () => this.setState({ acepta: !this.state.acepta, errAcepta: '' }),\n"
                    "      errAcepta: s.errAcepta || '',\n"
                    f"      pedirAcepta: () => this.setState({{ errAcepta: '{MENSAJE}' }}),\n"
                    f"      enviarSiAcepta: () => (this.state.acepta ? this.enviar() : this.setState({{ errAcepta: '{MENSAJE}' }})),", nombre)
    ruta.write_text(t, encoding="utf-8")
    print(nombre, "ok")

for nombre in ["Aceptar-Terminos", "M-Aceptar-Terminos"]:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "pedirAcepta" not in t:
        t = error_bajo_casilla(t, nombre)
        t = cambiar(t, '<button type="button" class="b b-pri lg" disabled="{{si}}">Aceptar y seguir</button>',
                    '<button type="button" class="b b-pri lg" onClick="{{pedirAcepta}}">Aceptar y seguir</button>', nombre)
        t = cambiar(t, "alternarAcepta: () => this.setState({ acepta: !this.state.acepta }),",
                    "alternarAcepta: () => this.setState({ acepta: !this.state.acepta, errAcepta: '' }),\n"
                    "      errAcepta: this.state.errAcepta || '',\n"
                    f"      pedirAcepta: () => this.setState({{ errAcepta: '{MENSAJE}' }}),", nombre)
    ruta.write_text(t, encoding="utf-8")
    print(nombre, "ok")
