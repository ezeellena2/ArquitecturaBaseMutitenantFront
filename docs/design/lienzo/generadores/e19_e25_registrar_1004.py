"""La E19 a la E25 con el traspaso 18 (tanda 3B del 2026-11-26, lienzo v188): el panel de «Gestión de formularios» y el registro
en `canvas.json`.

- `--panel <etapa>`: el panel en dos grupos (275), arriba «Formularios» (y, desde la E25, «Documentos recibidos») y, tras una línea
  sin título, «Catálogos»; desde la E22 suma «Biblioteca» después de «Catálogos» (y antes de «Formularios que faltan», que llega en
  la E23), que hasta ahora faltaba. «Biblioteca» queda marcada en los tableros de la biblioteca y de una plantilla. Va en los
  tableros de esa etapa que muestran el panel en la compu (los teléfonos no tienen panel), con la pieza de `e14_panel_1004.py`.
  Un tablero que ya lo tiene no cambia. Si el tablero no tenía « · para aprobar», no se lo suma: la línea sola alinea con la 275, ya
  aprobada; «Biblioteca», que se ve, sí lo suma.
- `--registrar <etapa> [--canvas <ruta>]`: pone en `canvas.json` (o en el publicado, traído al scratchpad) el título del lienzo de
  cada tablero de la etapa con « · para aprobar» si su `<title>` lo tiene, el alto nuevo de los que crecieron (`ALTOS`) y los
  tableros nuevos (`NUEVOS`).

Los tableros los redibujan `e19_editor_1004.py`, `e19_planillas_1004.py`, `e20_editor_1004.py`, `e20_carga_1004.py`,
`e21_listas_1004.py`, `e21_tableros_1004.py`, `e21_respuesta_1004.py`, `e21_corregir_1004.py`, `e21_reglas_1004.py` y los de la E22 a
la E25. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
SUFIJO = " · para aprobar"

ETAPAS = {
    "19": ["FRM-Editor-Lineas", "M-FRM-Editor-Lineas", "FRM-Editor-Condiciones", "M-FRM-Editor-Condiciones", "FRM-Editor-Calculo",
           "M-FRM-Editor-Calculo", "FRM-Publicar-19", "FRM-Respuestas-19", "M-FRM-Respuestas-19", "FRM-Respuestas-Exportar-19",
           "FRM-Tablero-19", "M-FRM-Tablero-19", "FRM-Respuesta-19", "M-FRM-Respuesta-19"],
    "20": ["FRM-Editor-20", "M-FRM-Editor-20", "FRM-Publicar-20", "M-FRM-Publicar-20", "FRM-Editor-Ubicacion",
           "M-FRM-Editor-Ubicacion", "FRM-Editor-Listas", "M-FRM-Editor-Listas", "FRM-Formularios-20", "M-FRM-Formularios-20",
           "WA-Chats-Formulario-20", "M-WA-Chats-Formulario-20", "FRM-Cargar-Respuesta", "M-FRM-Cargar-Respuesta",
           "FRM-Cargar-Panel", "FRM-Cargar-Enviada", "M-FRM-Cargar-Enviada", "FRM-Cargar-Lista", "M-FRM-Cargar-Lista",
           "FRM-Cargar-Archivos", "M-FRM-Cargar-Archivos", "FRM-Respuestas-20", "M-FRM-Respuestas-20", "FRM-Respuestas-Propias",
           "M-FRM-Respuestas-Propias", "FRM-Respuesta-20", "M-FRM-Respuesta-20"],
    "21": ["FRM-Formularios-21", "M-FRM-Formularios-21", "Campana-21", "M-Campana-21", "WA-Chats-Avisos",
           "M-WA-Conversacion-Avisos", "FRM-Cargar-Respuesta-21", "M-FRM-Cargar-Respuesta-21", "FRM-Tablero-21",
           "M-FRM-Tablero-21", "Cuenta-21", "M-Cuenta-21", "WA-Plantilla-Nueva-21", "M-WA-Plantilla-Nueva-21",
           "FRM-Respuesta-Aprobacion", "M-FRM-Respuesta-Aprobacion", "FRM-Editor-Reglas", "M-FRM-Reglas",
           "FRM-Editor-Reglas-Bloque", "M-FRM-Reglas-Bloque", "FRM-Pdf", "FRM-Editor-21", "M-FRM-Editor-21",
           "FRM-Dar-De-Baja-21", "FRM-Editor-Baja-21", "FRM-Respuesta-Corregir", "M-FRM-Respuesta-Corregir",
           "FRM-Respuesta-Anular", "M-FRM-Respuesta-Anular", "FRM-Respuestas-21", "M-FRM-Respuestas-21",
           "FRM-Respuestas-Propias-21", "M-FRM-Respuestas-Propias-21"],
    "22": ["FRM-Formularios-22", "M-FRM-Formularios-22", "FRM-Biblioteca", "M-FRM-Biblioteca", "FRM-Plantilla", "M-FRM-Plantilla",
           "FRM-Plantilla-Usar", "FRM-Editor-Reglas-Plantilla", "M-FRM-Reglas-Plantilla", "Plat-FRM-Biblioteca",
           "M-Plat-FRM-Biblioteca", "Plat-FRM-Plantilla-Nueva", "Plat-FRM-Plantilla", "Plat-FRM-Plantilla-Reglas", "Plat-FRM-Pdf",
           "Plat-FRM-Publicar", "Plat-FRM-Retirar", "Plat-FRM-Categorias"],
    "23": ["WA-Asistente", "WA-Asistente-Casos", "WA-Asistente-Probar", "M-WA-Asistente", "WA-Asistente-Limites", "WA-Modo-Atencion",
           "M-WA-Modo-Atencion", "Plat-Asistente-Config-23", "M-Plat-Asistente-Config-23", "WA-Chats-Casos", "M-WA-Chats-Casos",
           "WA-Chats-Asistente", "M-WA-Conversacion-Asistente", "WA-Chats-Audio", "WA-Preguntas-Sin-Respuesta",
           "M-WA-Preguntas-Sin-Respuesta", "FRM-Faltan", "M-FRM-Faltan", "FRM-Editor-Sugerencias", "FRM-Editor-Asistente",
           "FRM-Editor-Reglas-23", "M-FRM-Reglas-23", "FRM-Respuesta-Cadena", "FRM-Dar-De-Baja-23", "FRM-Editor-Baja-23"],
    "24": ["WA-Asistentes", "M-WA-Asistentes", "WA-Equipo-Asistente", "M-WA-Equipo-Asistente"],
    "25": ["WA-Chats-Documento", "M-WA-Chats-Documento", "FRM-Documentos", "M-FRM-Documentos", "FRM-Respuesta-25",
           "M-FRM-Respuesta-25", "Asistente-Org-25", "M-Asistente-Org-25", "FRM-Editor-Lectura", "M-FRM-Editor-Lectura",
           "Plat-FRM-Plantilla-Lectura", "FRM-Plantilla-25", "M-FRM-Plantilla-25", "FRM-Armar-Con-IA", "M-FRM-Armar-Con-IA",
           "M-WA-Armar-Con-IA", "FRM-Formularios-25", "FRM-Catalogos-25", "FRM-Faltan-25", "WA-Asistente-Casos-25",
           "FRM-Catalogo-Propuesta-25", "Campana-25"],
    "base2": ["Asistente-Config-Org", "M-Asistente-Config-Org", "Plat-Asistente-Config", "M-Plat-Asistente-Config", "M-Filas-Base2",
              "M-Usuarios-Base2", "M-Cuentas-Base2", "M-Empresa-Base2", "M-Usuario-Base2", "M-Auditoria-Plat-Base2",
              "M-WA-Difusion-Resultados-Base2", "Usuarios-Base2", "Usuario-Base2", "Empresa-Base2", "Cuenta-Plat-Base2",
              "M-Cuenta-Plat-Base2", "Config-Plat-Base2", "Rol-Base2", "M-Rol-Base2", "WA-Config-Base2", "M-WA-Config-Base2"],
}
# El alto nuevo de los tableros que crecieron al redibujarlos (lo dicen los reportes de cada grupo).
ALTOS = {"FRM-Editor-Reglas": 1700, "FRM-Respuesta-19": 1000, "FRM-Respuesta-20": 1100, "FRM-Respuesta-Aprobacion": 1500, "FRM-Editor-Reglas-Plantilla": 1700, "Plat-FRM-Plantilla-Reglas": 1700, "FRM-Respuesta-Cadena": 1200, "FRM-Respuesta-Corregir": 1500}
# Los tableros nuevos: su entrada entera en `canvas.json`.
NUEVOS = {}

# «Biblioteca» (275), desde la E22: después de «Catálogos». Marcada en la biblioteca y en una plantilla.
SVG_BIBLIOTECA = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
                  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5c-1.8-1.3-4.3-2-7.5-2v13'
                  'c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2v-13c-3.2 0-5.7.7-7.5 2Z"/><path d="M12 6.5v13"/></svg>')
BIBLIOTECA_MARCADA = {"FRM-Biblioteca", "FRM-Plantilla", "FRM-Plantilla-Usar", "FRM-Plantilla-25"}


FORMULARIOS = re.compile(r'Formularios\s*(?:<sc-if[^>]*>)?\s*(?:<span class="cnt">[^<]*</span>)?\s*(?:</sc-if>)?\s*</a>')


def partir(panel):
    """Como `e14_panel_1004.partir`, también con el número al lado de «Formularios» (desde la E21) o con «Documentos recibidos»."""
    if e14p.SEP in panel or not e14p.CATALOGOS.search(panel):
        return panel  # sin «Catálogos» (quien solo carga ve solo «Formularios») no hay segundo grupo
    f = FORMULARIOS.search(panel)
    m = e14p.CATALOGOS.search(panel)
    assert f and m and m.start() > f.start(), "el panel no tiene «Formularios» antes de «Catálogos»"
    return panel[:m.start()] + e14p.SEP + panel[m.start():]


def con_biblioteca(panel, marcada):
    if 'href="FRM-Biblioteca.dc.html"' in panel or not e14p.CATALOGOS.search(panel):
        return panel
    if marcada:
        panel = panel.replace('class="w-ln on"', 'class="w-ln"')
    m = e14p.CATALOGOS.search(panel)
    clase = "w-ln on" if marcada else "w-ln"
    enlace = f'<a class="{clase}" href="FRM-Biblioteca.dc.html">{SVG_BIBLIOTECA} Biblioteca</a>'
    envoltura = re.match(r'<sc-if [^>]*>', m.group(0))
    if envoltura:  # quien no ve «Catálogos» tampoco ve «Biblioteca»
        enlace = envoltura.group(0) + enlace + "</sc-if>"
    return panel[:m.end()] + enlace + panel[m.end():]


def para_aprobar(t):
    return re.sub(r"<title>([^<]*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)


def panel(etapa):
    desde_22 = int(etapa) >= 22
    for nombre in ETAPAS[etapa]:
        ruta = PROJ / f"{nombre}.dc.html"
        if not ruta.exists():
            continue
        t = ruta.read_text(encoding="utf-8")
        if 'aria-label="Gestión de formularios"' not in t:
            continue

        def cambiar(m):
            p = partir(m.group(0))
            return con_biblioteca(p, nombre in BIBLIOTECA_MARCADA) if desde_22 else p

        nuevo, n = e14p.PANEL.subn(cambiar, t)
        if e14p.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
        if desde_22 and "FRM-Biblioteca.dc.html" in e14p.PANEL.search(nuevo).group(0)                 and "FRM-Biblioteca.dc.html" not in e14p.PANEL.search(t).group(0):
            nuevo = para_aprobar(nuevo)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok panel", nombre, n, "(sin cambios)" if nuevo == t else "")


def registrar(etapa, ruta):
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    for nombre in ETAPAS[etapa]:
        clave = f"{nombre}.dc.html"
        if clave in NUEVOS and clave not in c["boards"]:
            c["boards"][clave] = NUEVOS[clave]
            c["order"].append(clave)
        if clave not in c["boards"]:
            continue
        b = c["boards"][clave]
        t = (PROJ / clave).read_text(encoding="utf-8")
        html = re.search(r"<title>([^<]*)</title>", t).group(1)
        b["title"] = b["title"].removesuffix(SUFIJO) + (SUFIJO if html.endswith(SUFIJO) else "")
        if nombre in ALTOS:
            b["h"] = ALTOS[nombre]
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")
    print("ok", ruta, "etapa", etapa)


if __name__ == "__main__":
    if "--panel" in sys.argv:
        panel(sys.argv[sys.argv.index("--panel") + 1])
    if "--registrar" in sys.argv:
        destino = pathlib.Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else PROJ / "canvas.json"
        for etapa in sys.argv[sys.argv.index("--registrar") + 1].split(","):
            registrar(etapa, destino)
