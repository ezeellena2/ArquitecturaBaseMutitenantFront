"""Arreglos de marcado del criterio sobre tableros existentes (se suman al bloque de estilo de aplicar_criterio.py).
Uso: python criterio_marcado.py Tablero1 Tablero2 ..."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
X = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
     'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')


def banda_segunda_linea(t):
    """Lo que estaba al lado del título (estado, «De sistema», «Cambios sin guardar») pasa a la segunda línea."""
    n = 0

    def mover(m):
        nonlocal n
        titulo, extras, res = m.group(1), m.group(2), m.group(4)
        if not extras.strip():
            return m.group(0)
        n += 1
        resto = f"<span>{res}</span>" if res is not None else ""
        return f'<div class="tit"><h1>{titulo}</h1></div><p class="res">{extras}{resto}</p>'

    t = re.sub(r'<div class="tit"><h1>(.*?)</h1>(.*?)</div>(<p class="res">(.*?)</p>)?', mover, t, flags=re.S)
    return t, n


def suspendida_en_segunda_linea(t):
    return re.subn(r'<span class="n2">[^<]*</span></span><span class="pill alerta">Suspendida</span>', '<span class="n2">Suspendida</span></span>', t)


def botones_sin_iconos(t):
    """Un botón solo lleva el «+» de agregar o crear; cualquier otro ícono se va."""
    n = 0

    def quitar(m):
        nonlocal n
        if "M12 5v14" in m.group(3):
            return m.group(0)
        n += 1
        return f"<{m.group(1)}{m.group(2)}>"

    t = re.sub(r'<(button|a)((?:(?!>).)*class="b [^"]*"(?:(?!>).)*)>\s*(<svg[^>]*>.*?</svg>)\s*', quitar, t, flags=re.S)
    return t, n


def errores_que_quedan(t):
    """El error de una acción directa queda en rojo y con ✕ hasta que se cierra (criterio de avisos)."""
    if "avisoError:" not in t or "cerrarAviso" in t:
        return t, 0
    t = t.replace("    this.timerAviso = setTimeout(() => this.setState({ aviso: '' }), 4000);",
                  "    if (tipo !== 'error') this.timerAviso = setTimeout(() => this.setState({ aviso: '' }), 4000);")
    t = t.replace('<div class="toast2" role="status">', '<div class="toast2 {{claseAviso}}" role="status">')
    t = re.sub(r'(<div class="toast2 \{\{claseAviso\}\}" role="status">.*?<span>\{\{aviso\}\}</span>)',
               lambda m: m.group(1) + f'<sc-if value="{{{{avisoError}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="ico-btn" aria-label="Cerrar" onClick="{{{{cerrarAviso}}}}">{X}</button></sc-if>',
               t, count=1, flags=re.S)
    t = re.sub(r"(\n(\s*)avisoError: (.+?) === 'error',)",
               lambda m: m.group(1) + f"\n{m.group(2)}claseAviso: {m.group(3)} === 'error' ? 'mal' : '',\n{m.group(2)}cerrarAviso: () => this.setState({{ aviso: '' }}),",
               t, count=1)
    return t, 1


def descartar_habilitado(t, movil):
    """Solo «Guardar cambios» se apaga sin cambios; descartar queda siempre habilitado y se llama igual en todas las ediciones."""
    etiqueta = "Descartar" if movil else "Descartar cambios"
    return re.subn(r'onClick="\{\{descartar\}\}" disabled="\{\{limpio\}\}">(Cancelar|Descartar cambios|Descartar)',
                   f'onClick="{{{{descartar}}}}">{etiqueta}', t)


def quitar_es_peligro(t):
    """«Quitar» no se deshace: botón de peligro (borde rojo) en la pantalla."""
    return re.subn(r'class="b b-sec([^"]*)"([^>]*)>Quitar<', lambda m: f'class="b b-pel{m.group(1)}"{m.group(2)}>Quitar<', t)


if __name__ == "__main__":
    for nombre in sys.argv[1:]:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        t, a = banda_segunda_linea(t)
        t, b = suspendida_en_segunda_linea(t)
        t, c = botones_sin_iconos(t)
        t, d = errores_que_quedan(t)
        t, e = descartar_habilitado(t, nombre.startswith("M-"))
        t, f = quitar_es_peligro(t)
        ruta.write_text(t, encoding="utf-8")
        print(f"{nombre}: banda {a} · suspendida {b} · íconos {c} · errores {d} · descartar {e} · quitar {f}")
