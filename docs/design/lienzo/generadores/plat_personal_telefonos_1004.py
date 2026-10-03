"""Teléfonos de Plataforma y del perfil personal aprobados el 2026-10-03 en formato app.
1. Corre telefonos_1004/app_plat_personal.py, que arma las pantallas sobre la copia de partida (telefonos_1004/base).
2. Deja cada pantalla con su nombre final (M-*), sus enlaces y su título.
3. Acomoda los teléfonos en la fila de teléfonos de las páginas «Perfil personal» y «Plataforma».
Corre después de org_telefonos_1004.py y antes de menus_con_lineas.py y flechita_blanca.py. Se puede volver a correr."""
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

# Pantalla armada → (tablero, título, página, x, y).
PANTALLAS = [
    ("Per-Inicio", "M-Inicio-Personal", "Inicio personal · teléfono", "personal", 0, 1280),
    ("Per-Mas", "M-Mas-Personal", "Más · personal · teléfono", "personal", 470, 1280),
    ("Per-Cuenta", "M-Cuenta", "Mi cuenta · teléfono", "personal", 940, 1280),
    ("Per-Agregar", "M-Cuenta-Agregar", "Mi cuenta · agregar correo o teléfono · teléfono", "personal", 1410, 1280),
    ("Per-Verificar", "M-Cuenta-Verificar", "Mi cuenta · verificar · teléfono", "personal", 1880, 1280),
    ("Per-Baja", "M-Cuenta-Baja", "Mi cuenta · dar de baja · teléfono", "personal", 2350, 1280),
    ("Plat-Organizaciones", "M-Organizaciones", "Organizaciones · teléfono", "plataforma", 0, 2300),
    ("Plat-Organizacion", "M-Organizacion", "Ficha de una organización · teléfono", "plataforma", 470, 2300),
    ("Plat-Cuentas", "M-Cuentas", "Cuentas · teléfono", "plataforma", 940, 2300),
    ("Plat-Cuenta", "M-Cuenta-Plat", "Ficha de una cuenta · teléfono", "plataforma", 1410, 2300),
    ("Plat-Recuperaciones", "M-Recuperaciones", "Recuperaciones · teléfono", "plataforma", 1880, 2300),
    ("Plat-Mas", "M-Mas-Plat", "Más · plataforma · teléfono", "plataforma", 2350, 2300),
    ("Plat-Auditoria", "M-Auditoria-Plat", "Auditoría de seguridad · teléfono", "plataforma", 2820, 2300),
    ("Plat-AuditoriaDetalle", "M-Auditoria-Plat-Detalle", "Auditoría de seguridad · detalle · teléfono", "plataforma", 3290, 2300),
    ("Plat-Legales", "M-Legales", "Documentos legales · teléfono", "plataforma", 3760, 2300),
    ("Plat-Config", "M-Config-Plat", "Configuración de la plataforma · teléfono", "plataforma", 4230, 2300),
]
NOMBRES = {p: n for p, n, _, _, _, _ in PANTALLAS}


def armar():
    sys.path.insert(0, str(T))
    runpy.run_path(str(T / "app_plat_personal.py"), run_name="__main__")
    for pantalla, nombre, titulo, _, _, _ in PANTALLAS:
        t = (SALIDA / f"T-{pantalla}.dc.html").read_text(encoding="utf-8")
        t = re.sub(r"T-((?:Per|Plat)-\w+)\.dc\.html", lambda m: f"{NOMBRES[m.group(1)]}.dc.html", t)
        t = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t, count=1, flags=re.S)
        assert "T-App-" not in t and "T-Org-" not in t, nombre
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("ok", len(PANTALLAS), "teléfonos de Plataforma y del perfil personal")


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for _, nombre, titulo, pagina, x, y in PANTALLAS:
        clave = f"{nombre}.dc.html"
        datos = {"h": 844, "is_interactive": True, "page": pagina, "title": titulo, "w": 390, "x": x, "y": y}
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
