"""«Otro acceso» (el usuario, 25/10, por la Guía; front 744e3931, accesos-y-permisos.md): un link del otro acceso no lleva al inicio.
Ofrece entrar con el acceso del link y, al entrar, lo abre. Opción A, la que eligió el usuario: dentro del marco del acceso actual,
en el lugar y con la forma de «No encontramos esta página» (Error-Org), con el círculo, un título corto y el botón, sin texto
explicativo ni «Ir al inicio», porque el menú ya está.

- El link no dice de qué organización es: si la persona está en una sola, el título la nombra; si está en varias, elige con cuál
  entrar (iniciales, nombre y rol, como en su menú).
- Al revés, desde una empresa, «Entrar como persona».
- Sin ese acceso, o para un operador de Plataforma, es «No encontramos esta página», como hoy (Error-Org).

Escribe Otro-Acceso (de persona a empresa) y Otro-Acceso-Persona (de empresa a persona), con sus teléfonos, en la página Ingreso.
Se arman sobre Inicio-Personal e Inicio-Org (y sus teléfonos), que no cambian. Se puede volver a correr.
"""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
APROBADO = True  # el usuario los aprobó el 27/10
PARA_APROBAR = " · para aprobar"


def svg(d, size=24, sw="1.75"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


EDIFICIO = svg('<path d="M4 20h16"/><path d="M6 20V5.5a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1V20"/><path d="M14.5 10H17a1 1 0 0 1 1 1v9"/>'
               '<path d="M9 8.5h2.5M9 12h2.5M9 15.5h2.5"/>', 26)
PERSONA = svg('<circle cx="12" cy="8" r="3.75"/><path d="M5 19.5a7 7 0 0 1 14 0"/>', 26)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, "2.25")
ORGS = [("GD", "Grupo Delta", "Dueño", True), ("BS", "Beta S.R.L.", "Vendedor", False)]
# Un tablero por marco, para no mezclar el CSS de dos marcos: de persona a empresa (Otro-Acceso) y de empresa a persona
# (Otro-Acceso-Persona). Cada caso: (estado, título, botón, ícono, con la lista para elegir)
TABLEROS = {
    "Otro-Acceso": ("Inicio-Personal", [("Una organización", "Este link es de Grupo Delta", "Entrar como empresa", EDIFICIO, False),
                                        ("Varias organizaciones", "Este link es de una empresa", "Entrar como empresa", EDIFICIO, True)]),
    "Otro-Acceso-Persona": ("Inicio-Org", [("Desde la empresa", "Este link es de tu perfil personal", "Entrar como persona", PERSONA, False)]),
}

CSS = """/* Otro acceso: el bloque de «No encontramos esta página», con la lista de organizaciones si hay varias */
.oa-centro { justify-content: center; align-items: center; }
.oa-blq { width: 400px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
.oa-circ { width: 64px; height: 64px; border-radius: 50%; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.oa-blq h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.oa-blq .cb { height: 40px; padding: 0 20px; font-size: 14px; }
.oa-lista { align-self: stretch; display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; text-align: left; }
.oa-op { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 14px; border-bottom: 1px solid var(--borde); cursor: pointer; }
.oa-op:last-child { border-bottom: 0; }
.oa-op .ini { width: 32px; height: 32px; border-radius: 8px; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.oa-op .tx { flex: 1; display: flex; flex-direction: column; line-height: 1.3; }
.oa-op .tx b { font-size: 14px; font-weight: 500; color: var(--t1); }
.oa-op .tx span { font-size: 12.5px; color: var(--t3); }
.oa-op .ok { color: var(--marca); display: inline-flex; }
.oa-op.on { background: var(--marca-t); }
.oa-op.on .ini { background: #fff; color: var(--marca-tx); }
"""
CSS_TEL = """/* Otro acceso, en el teléfono: centrado, con la barra de abajo de la app */
.oa-c { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 18px; padding: 0 20px; }
.oa-c .oa-circ { align-self: center; width: 64px; height: 64px; border-radius: 50%; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.oa-c h1 { margin: 0; text-align: center; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; }
.oa-c .cb.full { width: 100%; height: 48px; font-size: 16px; }
.oa-lista { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 14px; overflow: hidden; background: #fff; }
.oa-op { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 0 14px; border-bottom: 1px solid var(--borde); }
.oa-op:last-child { border-bottom: 0; }
.oa-op .ini { width: 36px; height: 36px; border-radius: 10px; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.oa-op .tx { flex: 1; display: flex; flex-direction: column; line-height: 1.3; }
.oa-op .tx b { font-size: 16px; font-weight: 500; color: var(--t1); }
.oa-op .tx span { font-size: 13.5px; color: var(--t3); }
.oa-op .ok { color: var(--marca); display: inline-flex; }
.oa-op.on { background: var(--marca-t); }
.oa-op.on .ini { background: #fff; color: var(--marca-tx); }
"""


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def lista():
    return '<div class="oa-lista" role="radiogroup" aria-label="Organización">' + "".join(
        f'<div class="oa-op{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="ini">{ini}</span>'
        f'<span class="tx"><b>{n}</b><span>{rol}</span></span>{f"<span class=ok>{TILDE}</span>" if on else ""}</div>'
        for ini, n, rol, on in ORGS) + "</div>"


def cuerpo_app(t):
    """El marco de un tablero: lo que va entre </helmet> y </x-dc>."""
    i = t.index("</helmet>") + len("</helmet>")
    return t[i:t.index("</x-dc>")]


def script(estados, w, h):
    k = json.dumps(estados, ensure_ascii=False)
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"}, "$preview": {"width": w, "height": h}}
    return ("<script type=\"text/x-dc\" data-dc-script data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'>\n"
            "class Component extends DCLogic {\n  renderVals() {\n    const e = this.props.estado ?? " + json.dumps(estados[0], ensure_ascii=False) + ";\n"
            f"    const k = {k}.indexOf(e);\n    return {{\n      si: true, no: false,\n"
            + "".join(f"      s{i}: k === {i},\n" for i in range(len(estados))) + "    };\n  }\n}\n</script>")


def armar(base, estados, apps, css, w, h):
    """base: el tablero del que salen el encabezado y su CSS; apps: un marco por estado."""
    i = base.index("</helmet>")
    cab = base[:i] + f'<style data-oa="otro-acceso">\n{css}</style>\n'
    cuerpo = "".join(f'<sc-if value="{{{{s{k}}}}}" hint-placeholder-val="{{{{{"si" if k == 0 else "no"}}}}}">{a}</sc-if>' for k, a in enumerate(apps))
    j = base.index('<script type="text/x-dc"')
    fin = base[base.index("</script>", j) + len("</script>"):]
    return cab + "</helmet>\n" + cuerpo + "\n</x-dc>\n\n" + script(estados, w, h) + fin


def compu(marco, casos):
    a0 = cuerpo_app(leer(marco))
    apps = []
    for estado, titulo, boton, icono, varias in casos:
        personal = '<div class="w-bnd">' in a0
        clase = "cb cb-pri" if personal else "b b-pri"  # el botón de cada marco (el de la organización, como el de Error-Org)
        dentro = (f'<div class="oa-blq"><span class="oa-circ">{icono}</span><h1>{titulo}</h1>'
                  f'{lista() if varias else ""}<button type="button" class="{clase}">{boton}</button></div>')
        if personal:
            i = a0.index('<div class="w-bnd">')
            k = a0.rindex("</div></div>")
            a = a0[:i] + f'<div class="w-body oa-centro">{dentro}</div>' + a0[k:]
        else:  # el de la organización, como Error-Org
            i = a0.index('<main class="ab-app-shell__main">') + len('<main class="ab-app-shell__main">')
            k = a0.index("</main>")
            a = a0[:i] + f'<div class="pagina oa-centro" style="height: 100%; box-sizing: border-box;">{dentro}</div>' + a0[k:]
        # El link no es de ninguna sección del menú
        a = a.replace('class="w-ln on"', 'class="w-ln"').replace(' ab-sidebar__link--active" href="Inicio-Org.dc.html" aria-current="page"', '" href="Inicio-Org.dc.html"')
        apps.append(a)
    return armar(leer(marco), [c[0] for c in casos], apps, CSS, 1440, 900)


def telefono(marco, casos):
    a0 = cuerpo_app(leer("M-" + marco))
    apps = []
    for estado, titulo, boton, icono, varias in casos:
        blq = (f'<div class="oa-c"><span class="oa-circ">{icono}</span><h1>{titulo}</h1>{lista() if varias else ""}'
               f'<button type="button" class="cb cb-pri full">{boton}</button></div>')
        k = a0.index('<nav class="ap-nav"')
        if '<div class="ap-bar">' in a0:  # el personal: la barra de arriba sale
            i = a0.index('<div class="ap-bar">')
            a = a0[:i] + blq + a0[k:]
        else:  # el de la organización (la billetera): queda la barra de estado
            i = a0.index('<div class="c-top">')
            e0 = a0.index('<div class="ap-est">')
            est = a0[e0:a0.index("</span></div>", e0) + len("</span></div>")]
            a = a0[:i] + est + blq + a0[k:]
        apps.append(a.replace('<a class="on" aria-current="page"', "<a"))
    return armar(leer("M-" + marco), [c[0] for c in casos], apps, CSS_TEL, 390, 844)


NUEVOS = {"Otro-Acceso": (1440, 900, "Otro acceso · un link de empresa, como persona"), "Otro-Acceso-Persona": (1440, 900, "Otro acceso · un link personal, como empresa"),
          "M-Otro-Acceso": (390, 844, "Otro acceso · un link de empresa, como persona · teléfono"),
          "M-Otro-Acceso-Persona": (390, 844, "Otro acceso · un link personal, como empresa · teléfono")}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    b = c["boards"]
    for n, (w, h, titulo) in NUEVOS.items():
        if f"{n}.dc.html" not in b:
            fila = 2300 if n.startswith("M-") else 1280
            x = max(v["x"] for v in b.values() if v.get("page") == "ingreso" and v["y"] == fila) + (470 if n.startswith("M-") else 1520)
            b[f"{n}.dc.html"] = {"x": x, "y": fila, "is_interactive": True}
        b[f"{n}.dc.html"].update(w=w, h=h, page="ingreso", title=titulo + ("" if APROBADO else PARA_APROBAR))
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    for n, (marco, casos) in TABLEROS.items():
        (PROJ / f"{n}.dc.html").write_text(compu(marco, casos), encoding="utf-8")
        (PROJ / f"M-{n}.dc.html").write_text(telefono(marco, casos), encoding="utf-8")
    registrar()
    print("listo", list(NUEVOS))
