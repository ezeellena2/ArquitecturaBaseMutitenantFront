"""Teléfonos de Organización aprobados el 2026-10-03 en formato app (lo de la compu del 2026-10-02 con las reglas del teléfono).
1. Corre telefonos_1004/app_org.py, que arma las pantallas sobre la copia de partida (telefonos_1004/base).
2. Deja cada pantalla con su nombre final (M-*), sus enlaces y su título.
3. Acomoda los teléfonos en la página «Organización»: las pantallas en la fila de los teléfonos y los diálogos en una fila nueva.
Corre después de wa_telefonos_1004.py y antes de menus_con_lineas.py y flechita_blanca.py. Se puede volver a correr."""
import json
import pathlib
import re
import runpy
import sys

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
T = GEN / "telefonos_1004"
SALIDA = T / "salida"

# Pantalla armada → (tablero, título, x, y).
PANTALLAS = [
    ("Usuarios", "M-Usuarios", "Usuarios · teléfono", 470, 3320),
    ("Usuario", "M-Usuario", "Editar usuario · teléfono", 940, 3320),
    ("Roles", "M-Roles", "Roles y permisos · teléfono", 1410, 3320),
    ("Rol", "M-Rol", "Editar un rol · teléfono", 1880, 3320),
    ("Empresas", "M-Empresas", "Empresas · teléfono", 2350, 3320),
    ("Empresa", "M-Empresa", "Ficha de empresa · teléfono", 2820, 3320),
    ("Configuracion", "M-Configuracion", "Configuración · teléfono", 3290, 3320),
    ("Auditoria", "M-Auditoria-Org", "Auditoría · teléfono", 3760, 3320),
    ("Pagina", "M-Pagina-Org", "Página pública · teléfono", 4230, 3320),
    ("Invitar", "M-Usuarios-Invitar", "Invitar usuario · teléfono", 0, 5304),
    ("SumarEmpresa", "M-Usuario-Empresa", "Sumar empresa · teléfono", 470, 5304),
    ("Dominio", "M-Configuracion-Dominio", "Configuración · agregar dominio · teléfono", 940, 5304),
    ("Verificar", "M-Configuracion-Verificar", "Configuración · verificar dominio · teléfono", 1410, 5304),
    ("Quitar", "M-Configuracion-Quitar", "Configuración · quitar dominio · teléfono", 1880, 5304),
]
NOMBRES = {p: n for p, n, _, _, _ in PANTALLAS}
# Enlaces a los teléfonos de WhatsApp (la barra de abajo y «Más»).
APP = {"Mas": "M-WA-Menu", "Chats": "M-WA-Chats", "Contactos": "M-WA-Contactos", "Difusiones": "M-WA-Difusiones"}


def armar():
    sys.path.insert(0, str(T))
    runpy.run_path(str(T / "app_org.py"), run_name="__main__")
    for pantalla, nombre, titulo, _, _ in PANTALLAS:
        t = (SALIDA / f"T-Org-{pantalla}.dc.html").read_text(encoding="utf-8")
        t = re.sub(r"T-Org-(\w+)\.dc\.html", lambda m: f"{NOMBRES[m.group(1)]}.dc.html", t)
        t = re.sub(r"T-App-(\w+)\.dc\.html", lambda m: f"{APP[m.group(1)]}.dc.html", t)
        t = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t, count=1, flags=re.S)
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("ok", len(PANTALLAS), "teléfonos de Organización")


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for _, nombre, titulo, x, y in PANTALLAS:
        clave = f"{nombre}.dc.html"
        datos = {"h": 844, "is_interactive": True, "page": "org", "title": titulo, "w": 390, "x": x, "y": y}
        if clave in c["boards"]:
            c["boards"][clave].update(datos)
        else:
            c["boards"][clave] = datos
        if clave not in c["order"]:
            c["order"].append(clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok canvas.json")


armar()
lienzo()
