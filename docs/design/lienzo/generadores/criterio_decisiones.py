"""Tablero «Criterio · Decisiones por pantalla»: lo que el usuario eligió en cada pantalla y las reglas que dejó.
Cada decisión nueva suma una fila en DECISIONES; si deja una regla, va también a REGLAS y al tablero de esa pieza."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 1580
ARCHIVO = "Criterio-Decisiones.dc.html"
TITULO = "Criterio · Decisiones por pantalla"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

CSS = """  <style data-criterio="decisiones">
.dec { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; font-size: 13.5px; }
.dec .c, .dec .f { display: grid; gap: 20px; align-items: center; padding: 0 18px; }
.dec .c { min-height: 40px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.dec .f { min-height: 52px; padding-top: 10px; padding-bottom: 10px; box-sizing: border-box; border-bottom: 1px solid var(--borde); line-height: 1.5; }
.dec .f:last-child { border-bottom: 0; }
.dec .f:nth-child(odd) { background: oklch(0.975 0.008 78); }
.dec .f strong { font-weight: 600; }
.dec .f .op { font-weight: 600; color: var(--marca-tx); margin-right: 6px; }
.dec .f .nada { color: var(--t3); }
.dec .f .gris { color: var(--t3); }
.est { display: inline-flex; align-items: center; gap: 8px; }
.est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--t3); flex-shrink: 0; }
.est.ok::before { background: oklch(0.6 0.13 155); }
.est.pend::before { background: var(--marca); }
.est.alerta::before { background: oklch(0.72 0.15 70); }
.est.off { color: var(--t2); }
.est.off::before { background: oklch(0.75 0.01 78); }
  </style>"""

COLS_R = "minmax(0, 1fr) 300px 120px"
COLS_D = "220px minmax(0, 1fr) 230px"
ESTADOS = {
    "Dibujada": "ok",
    "Dibujada en parte": "ok",
    "Falta dibujar": "alerta",
    "En revisión": "pend",
    "Falta decidir": "off",
}

# Reglas generales que salieron de las decisiones: (regla, tablero donde quedó, fecha).
REGLAS = [
    ("Dentro de una caja, dos columnas iguales que ocupan todo el ancho.", "Formularios y campos", "02/10/2026"),
    ("Sin textos que explican: el estado se dice una vez arriba y un ⓘ abre el aviso importante.", "Avisos y errores · Diálogos", "02/10/2026"),
    ("Una celda puede llevar una segunda línea gris que aclara la primera.", "Tablas y listas", "02/10/2026"),
    ("Una lista se lee; cambiar una fila o sumar otra abre un diálogo chico.", "Tablas y listas", "02/10/2026"),
    ("Los permisos de un rol van en grupos que se abren y se cierran.", "Tablas y listas", "02/10/2026"),
]

# Decisiones por página: (pantalla, opción elegida, qué se eligió, estado en el lienzo).
DECISIONES = {
    "Perfil personal": [
        ("Mi cuenta · única Dueña", "", "Un ⓘ junto a «Dar de baja mi cuenta» y el botón apagado; los dos abren el aviso importante.", "Dibujada"),
    ],
    "Organización · 13 pantallas": [
        ("Usuarios", "A", "Usuario (nombre y correo), Rol en la organización, Empresa (con su rol debajo), Estado («Vence …» si es una invitación) y ⋮. Sin empresa, una sola raya.", "Falta dibujar"),
        ("Editar usuario", "B", "«Acceso a la organización» en dos columnas a todo el ancho. «Empresas» es una lista para leer («Delta S.A.» / «Solo lectura») con ⋮; cambiar los roles o «+ Sumar empresa» abre un diálogo chico.", "Falta dibujar"),
        ("Roles y permisos", "A", "Rol (con «De sistema» debajo), Vale en, Usuarios, Permisos y ⋮. Sin descripción ni tipo.", "Falta dibujar"),
        ("Editar un rol", "A", "Una fila por permiso, solo con el nombre. Cada área se abre y se cierra; al entrar, abiertas las que tienen algo marcado.", "Falta dibujar"),
        ("Empresas", "A", "Empresa (con el CUIT debajo, o «Sin CUIT»), Zona horaria, Miembros, Estado y ⋮.", "Falta dibujar"),
        ("Ficha de empresa", "", "", "En revisión"),
        ("Configuración", "", "Datos en dos columnas. Sin dominio: la caja dice «Sin dominio» y tiene «+ Agregar dominio». Pendiente: «Pendiente · Falta cargar un registro en el DNS del dominio», con «Verificar» y ⋮.", "Dibujada en parte"),
        ("Página pública", "", "Dos columnas; el logo es la primera fila de «Página». Borrador: la caja «Publicación» con el interruptor «Visible en delta.plataforma.com». Despublicada: el estado solo arriba, en rojo; un ⓘ y el interruptor trabado.", "Dibujada en parte"),
        ("Auditoría", "", "", "Falta decidir"),
        ("Inicio de la organización", "", "", "Falta decidir"),
        ("Inicio de un miembro", "", "", "Falta decidir"),
        ("Sin permiso o no encontrada", "", "", "Falta decidir"),
        ("Avisos del sistema", "", "", "Falta decidir"),
    ],
}


def fila_regla(regla, tablero, fecha):
    return f'<div class="f" style="grid-template-columns: {COLS_R};"><span>{regla}</span><span>{tablero}</span><span class="gris">{fecha}</span></div>'


def fila_decision(pantalla, opcion, que, estado):
    op = f'<span class="op">{opcion}</span>' if opcion else ""
    cuerpo = f"<span>{op}{que}</span>" if que else '<span class="nada">—</span>'
    return (f'<div class="f" style="grid-template-columns: {COLS_D};"><strong>{pantalla}</strong>{cuerpo}'
            f'<span class="est {ESTADOS[estado]}">{estado}</span></div>')


reglas_html = "\n      ".join(fila_regla(*r) for r in REGLAS)
paginas_html = "\n\n".join(
    f"""  <section>
    <h2>{pagina}</h2>
    <div class="dec">
      <div class="c" style="grid-template-columns: {COLS_D};"><span>Pantalla</span><span>Qué se eligió</span><span>En el lienzo</span></div>
      {"".join(fila_decision(*d) for d in filas)}
    </div>
  </section>"""
    for pagina, filas in DECISIONES.items()
)

BODY = f"""<div class="crit">
  <div>
    <h1>Decisiones por pantalla</h1>
    <p class="sub">Lo que elegiste en cada pantalla. Si una decisión deja una regla para todas, la regla va también a su tablero.</p>
  </div>

  <section>
    <h2>Reglas que salieron de estas decisiones</h2>
    <div class="dec">
      <div class="c" style="grid-template-columns: {COLS_R};"><span>Regla</span><span>Tablero</span><span>Desde</span></div>
      {reglas_html}
    </div>
  </section>

{paginas_html}
</div>"""

SCRIPT = f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{ALTO}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{ si: true, no: false }};
  }}
}}
</script>"""

html = "\n".join([head, CSS, "</helmet>", "", BODY, "</x-dc>", "", SCRIPT, "</body>", "</html>", ""])
(PROJ / ARCHIVO).write_text(html, encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"][ARCHIVO] = {"x": 10640, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 8000
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
