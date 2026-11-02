"""Los tableros de formularios por etapa (decisión 78 y la del usuario del 2026-10-25: un tablero por etapa).

Los números de etapa son el orden (README de `docs/plans/formularios/` del back): 12 Catálogos, 13 Campos, 14 Formularios,
15 Respuestas, 16 Datos de las personas, 17 Ciclo de vida, 18 Fotos y documentos, 19 Condiciones, 20 Cargar desde la web,
21 Reglas y aprobación, 22 Biblioteca, 23 Asistente, 24 Varios asistentes y 25 Documentos. Cada tablero muestra solo lo
que existe hasta su etapa; cuando una pantalla cambia en una etapa posterior, esa versión es un tablero aparte, con la
etapa en el nombre (FRM-Formularios-15).

- El panel de «Gestión de formularios» de cada tablero es el de su etapa: «Catálogos» desde la 12, «Formularios» desde la
  14 (con lo que espera aprobación desde la 21) y «Formularios que faltan» desde la 23.
- La página «Organización · Formularios» va en filas, una por etapa, con su título: arriba los tableros de la compu y
  debajo los teléfonos.

Corre al final de los generadores de formularios, antes de `campana_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import gestion_formularios_1004 as G  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent

# (etapa, título, tableros de la compu, teléfonos), en el orden de la fila
FILAS = [
    (12, "Etapa 12 · Catálogos", ["FRM-Catalogos", "FRM-Catalogo-Nuevo", "FRM-Catalogo", "FRM-Catalogo-Opciones", "FRM-Catalogo-Importar", "FRM-Catalogo-Tipo", "FRM-Catalogo-Filtros",
                                  "FRM-Catalogo-Contactos"],
     ["M-FRM-Catalogos", "M-FRM-Catalogo", "M-FRM-Catalogo-Opciones", "M-FRM-Catalogo-Filtros", "M-FRM-Catalogo-Contactos"]),
    (13, "Etapa 13 · Campos de los catálogos", ["FRM-Catalogo-13", "FRM-Catalogo-Opciones-13"], ["M-FRM-Catalogo-13", "M-FRM-Catalogo-Opciones-13"]),
    (14, "Etapa 14 · Formularios", ["FRM-Formularios", "FRM-Editor", "FRM-Publicar", "FRM-Publicando", "WA-Chats-Formulario", "WA-Chats-Respuesta",
                                    "WA-Chats-Formulario-Cliente", "WA-Mensajes-14", "FRM-Catalogos-14", "FRM-Catalogo-14", "Campana-14"],
     ["M-FRM-Formularios", "M-FRM-Editor", "M-WA-Chats-Formulario", "M-WA-Conversacion-Respuesta", "M-WA-Chats-Formulario-Cliente", "M-WA-Mensaje-14",
      "M-FRM-Catalogos-14", "M-FRM-Catalogo-14", "M-Campana-14"]),
    (15, "Etapa 15 · Respuestas", ["FRM-Formularios-15", "FRM-Respuestas", "FRM-Respuestas-Filtros", "FRM-Respuesta", "FRM-Respuestas-Exportar", "FRM-Tablero"],
     ["M-FRM-Respuestas", "M-FRM-Respuesta", "M-FRM-Tablero"]),
    (17, "Etapa 17 · Ciclo de vida", ["FRM-Formularios-17", "FRM-Editor-Baja", "FRM-Dar-De-Baja", "FRM-Reactivar-Eliminar", "FRM-Copiar"],
     ["M-FRM-Formularios-17", "M-FRM-Editor-Baja"]),
    (18, "Etapa 18 · Fotos y documentos", ["FRM-Editor-18", "FRM-Publicar-18", "WA-Chats-Respuesta-18", "WA-Chats-Visor"],
     ["M-FRM-Editor-18", "M-WA-Conversacion-Respuesta-18", "M-WA-Chats-Visor"]),
    (21, "Etapa 21 · Reglas, aprobación y PDF", ["FRM-Formularios-21", "FRM-Editor-Reglas", "FRM-Pdf", "FRM-Respuesta-Aprobacion", "WA-Chats-Avisos"],
     ["M-FRM-Reglas", "M-FRM-Respuesta-Aprobacion", "M-WA-Conversacion-Avisos"]),
    (22, "Etapa 22 · Biblioteca", ["FRM-Formularios-22", "FRM-Biblioteca", "FRM-Plantilla", "FRM-Plantilla-Usar", "FRM-Editor-Reglas-Plantilla"],
     ["M-FRM-Biblioteca", "M-FRM-Plantilla", "M-FRM-Reglas-Plantilla"]),
    (23, "Etapa 23 · El asistente", ["FRM-Editor-Asistente", "FRM-Editor-Sugerencias", "FRM-Catalogo-Propuesta", "FRM-Respuesta-Cadena", "FRM-Faltan",
                                     "WA-Chats-Asistente", "WA-Chats-Sugerencia", "WA-Chats-Audio"],
     ["M-FRM-Faltan", "M-WA-Conversacion-Asistente"]),
]
ETAPA_DE = {n: etapa for etapa, _t, compu, tel in FILAS for n in compu + tel}
TODAS = list(G.ENTRADAS)  # sin «Diseñar formularios» cuando corre después de formularios_lista_y_ficha_1004.py


def entradas(etapa):
    out = []
    for clave, href, icono, texto, cnt in TODAS:
        if clave == "disenar" or (clave == "formularios" and etapa < 14) or (clave == "faltan" and etapa < 23):
            continue
        out.append((clave, href, icono, texto, "" if clave == "formularios" and etapa < 21 else cnt))
    return out


def panel(etapa, activo, condiciones=None, cantidad=None):
    """El panel de «Gestión de formularios» de una etapa."""
    viejas = list(G.ENTRADAS)
    G.ENTRADAS[:] = entradas(etapa)
    try:
        return G.panel(activo, condiciones, cantidad if etapa >= 21 else None)
    finally:
        G.ENTRADAS[:] = viejas


ACTIVO = {"FRM-Formularios.dc.html": "formularios", "FRM-Catalogos.dc.html": "catalogos", "FRM-Faltan.dc.html": "faltan"}
LISTAS = {"FRM-Formularios", "FRM-Formularios-15", "FRM-Formularios-17", "FRM-Formularios-21", "FRM-Formularios-22", "Campana", "Campana-14"}  # arman su panel con los permisos


def con_panel_de_la_etapa(n, t):
    m = G.PANEL_RE.search(t)
    if not m or n in LISTAS or n not in ETAPA_DE:
        return t
    on = re.search(r'<a class="w-ln on" href="([^"]+)"', m.group(0))
    activo = ACTIVO.get(on.group(1), "formularios") if on else ("catalogos" if n.startswith("FRM-Catalogo") else "formularios")
    return t[:m.start()] + panel(ETAPA_DE[n], activo) + t[m.end():]


ARRANQUE, ALTO_TITULO, ENTRE_FILAS, PASO_COMPU, PASO_TEL, ALTO_TEL = 260, 200, 320, 1520, 470, 844


def ubicar(c):
    """Cada tablero en la fila de su etapa, con el título de la fila; devuelve los que no tienen etapa."""
    b = c["boards"]
    y = ARRANQUE
    for etapa, titulo, compu, tel in FILAS:
        c["notes"][f"t-formularios-{etapa}"] = {"kind": "title1", "x": 0, "y": y, "w": 900, "maxW": 8000, "text": titulo, "page": "formularios"}
        y += ALTO_TITULO
        alto = max((b[f"{n}.dc.html"]["h"] for n in compu if f"{n}.dc.html" in b), default=0)
        for i, n in enumerate(compu):
            if f"{n}.dc.html" in b:
                b[f"{n}.dc.html"].update(x=i * PASO_COMPU, y=y)
        y += alto + 120 if alto else 0
        for i, n in enumerate(tel):
            if f"{n}.dc.html" in b:
                b[f"{n}.dc.html"].update(x=i * PASO_TEL, y=y)
        y += (ALTO_TEL if tel else 0) + ENTRE_FILAS
    return sorted(k for k, v in b.items() if v.get("page") == "formularios" and k[:-8] not in ETAPA_DE)


if __name__ == "__main__":
    tocados = []
    for n in ETAPA_DE:
        f = PROJ / f"{n}.dc.html"
        if not f.exists():
            continue
        t = f.read_text(encoding="utf-8")
        nuevo = con_panel_de_la_etapa(n, t)
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            tocados.append(n)
    print("panel de su etapa en", len(tocados), "tableros")
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    sin_etapa = ubicar(c)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("sin etapa:", sin_etapa)
