"""Invitación: los tres estados que la app tiene y el lienzo no dibujaba (relevamiento E1-E6, N3; tanda aprobada por el usuario el
2026-10-04). Se copian de la app con las piezas del criterio:
- «Sin cuenta: cargando»: solo «Cargando invitación…», al centro y en gris, como la app;
- «Sin cuenta: aceptando»: el botón dice «Aceptando…» con la ruedita y no se puede volver a tocar (Criterio · Botones, «Guardando»);
- «Sin cuenta: error al aceptar»: la franja roja de los mensajes, debajo del texto legal, con «Algo salió mal. Probá de nuevo en un
  rato.».
Cambia Invitacion y M-Invitacion. Lleva `data-vuelta="1004-estados-invitacion"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-estados-invitacion"'
NUEVOS = ["Sin cuenta: cargando", "Sin cuenta: aceptando", "Sin cuenta: error al aceptar"]
ICONOS = ('<svg class="ic-mal" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>'
          '<svg class="ic-aten" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>')
CSS = f"""<style {MARCA}>
.cargando-inv {{ margin: 0; padding: 48px 0; text-align: center; font-size: 13px; color: var(--t2); }}
.girar2 {{ width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 2px solid oklch(1 0 0 / 0.4); border-top-color: #fff; display: inline-block; }}
button.b.lg:disabled {{ cursor: default; }}
</style>"""


def rep(t, a, b):
    assert t.count(a) == 1, (a[:80], t.count(a))
    return t.replace(a, b)


for nombre in ("Invitacion", "M-Invitacion"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    t = rep(t, '"options":["Sin cuenta","Con cuenta y sin sesión"', '"options":["Sin cuenta",' + ",".join(f'"{e}"' for e in NUEVOS) + ',"Con cuenta y sin sesión"')
    sin_cuenta = "{ correo: 'valentina.ruiz@gmail.com', empresa: 'Delta Norte S.A.', roles: 'Solo lectura', modo: 'directo', nota: 'Al aceptar creamos tu cuenta con este correo y aceptás los Términos y la Política de privacidad.' }"
    assert t.count(sin_cuenta) == 1
    base = sin_cuenta[:-2]
    t = rep(t, "  'Sin cuenta': " + sin_cuenta + ",\n",
            "  'Sin cuenta': " + sin_cuenta + ",\n"
            "  // Lo que muestra la app mientras trae la invitación, mientras la acepta y si falla al aceptar.\n"
            "  'Sin cuenta: cargando': { cargando: true },\n"
            f"  'Sin cuenta: aceptando': {base}, enviando: true }},\n"
            f"  'Sin cuenta: error al aceptar': {base}, error: 'Algo salió mal. Probá de nuevo en un rato.' }},\n")
    t = rep(t, "valida: !e.invalida && !e.aceptada,",
            "valida: !e.invalida && !e.aceptada && !e.cargando,\n      cargando: !!e.cargando,\n      enviando: !!e.enviando,\n      noEnviando: !e.enviando,\n      errAceptar: e.error || '',")
    t = rep(t, '<a class="b b-pri lg" href="Inicio-Org.dc.html">Aceptar invitación</a>',
            '<sc-if value="{{noEnviando}}" hint-placeholder-val="{{si}}"><a class="b b-pri lg" href="Inicio-Org.dc.html">Aceptar invitación</a></sc-if>'
            '<sc-if value="{{enviando}}" hint-placeholder-val="{{no}}"><button type="button" class="b b-pri lg" disabled="{{si}}" style="opacity: 0.85;">'
            '<span class="girar2" aria-hidden="true"></span> Aceptando…</button></sc-if>')
    t = rep(t, '<p class="nota">{{notaAceptar}}</p>',
            '<p class="nota">{{notaAceptar}}</p><sc-if value="{{errAceptar}}" hint-placeholder-val="{{no}}">'
            f'<div class="msj mal" role="alert">{ICONOS}<span>{{{{errAceptar}}}}</span></div></sc-if>')
    t = rep(t, '<sc-if value="{{valida}}" hint-placeholder-val="{{si}}">',
            '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><p class="cargando-inv" role="status">Cargando invitación…</p></sc-if>'
            '<sc-if value="{{valida}}" hint-placeholder-val="{{si}}">')
    assert t.count("</helmet>") == 1
    css = CSS.replace("font-size: 13px;", "font-size: 14.5px;") if nombre.startswith("M-") else CSS
    t = t.replace("</helmet>", css + "\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)
