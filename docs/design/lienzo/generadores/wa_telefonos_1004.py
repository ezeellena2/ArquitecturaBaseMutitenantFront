"""Teléfonos de WhatsApp aprobados el 2026-10-03, ya como app (barra de abajo, título en la barra, hojas desde abajo).
1. Corre telefonos_1004/app_todas.py y app_numeros.py, que arman las pantallas sobre la copia de partida (telefonos_1004/base).
2. Deja cada pantalla con su nombre final (M-WA-*), sus enlaces y su título.
3. Acomoda los 27 teléfonos en la página «Organización · WhatsApp», en cuatro filas, y les saca «· por refinar».
Corre después de wa_vuelta_1003.py. Se puede volver a correr."""
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

# Pantalla armada → (tablero, título). Las filas son las de la página: atender, contactos y difusiones, administración y el resto.
FILAS = [
    [("Chats", "M-WA-Chats", "Chats · teléfono"), ("Conversacion", "M-WA-Conversacion", "Conversación · teléfono"),
     ("SinTomar", "M-WA-Chats-SinTomar", "Chat sin tomar · teléfono"), ("Pasar", "M-WA-Chats-Pasar", "Pasar · teléfono"),
     ("Nota", "M-WA-Chats-Nota", "Nota interna · teléfono"), ("24h", "M-WA-24h", "Pasaron 24 horas · teléfono"),
     ("Plantilla", "M-WA-Chats-Plantilla", "Elegir plantilla · teléfono")],
    [("Contactos", "M-WA-Contactos", "Contactos · teléfono"), ("Importar", "M-WA-Contactos-Importar", "Importar contactos · teléfono"),
     ("Ficha", "M-WA-Contacto", "Ficha del contacto · teléfono"), ("Difusiones", "M-WA-Difusiones", "Difusiones · teléfono"),
     ("DifusionNueva", "M-WA-Difusion-Nueva", "Nueva difusión · teléfono"), ("Resultados", "M-WA-Difusion-Resultados", "Resultados de una difusión · teléfono")],
    [("Mas", "M-WA-Menu", "Más · teléfono"), ("Numeros", "M-WA-Admin", "Números · teléfono"), ("Pago", "M-WA-Admin-Pago", "Falta medio de pago · teléfono"),
     ("SinNumeros", "M-WA-Admin-Vacio", "Sin números · teléfono"), ("Bot", "M-WA-Respuestas", "Bot · configuración · teléfono"),
     ("BotRecorrido", "M-WA-Bot-Recorrido", "Bot · recorrido · teléfono"), ("BotOpcion", "M-WA-Editar", "Bot · editar opción · teléfono")],
    [("Equipos", "M-WA-Equipos", "Equipos · teléfono"), ("EquipoCrear", "M-WA-Equipos-Crear", "Crear equipo · teléfono"),
     ("Plantillas", "M-WA-Plantillas", "Plantillas · teléfono"), ("PlantillaNueva", "M-WA-Plantilla-Nueva", "Nueva plantilla · teléfono"),
     ("Telefonos", "M-WA-Telefonos", "Cargar teléfonos de empleados · teléfono"), ("Mensajes", "M-WA-Mensajes", "Mensajes · teléfono"),
     ("Mensaje", "M-WA-Mensaje", "Mensajes · conversación · teléfono")],
]
NOMBRES = {p: n for fila in FILAS for p, n, _ in fila}


def armar():
    sys.path.insert(0, str(T))
    for s in ("app_todas", "app_numeros"):
        runpy.run_path(str(T / f"{s}.py"), run_name="__main__")
    for fila in FILAS:
        for pantalla, nombre, titulo in fila:
            t = (SALIDA / f"T-App-{pantalla}.dc.html").read_text(encoding="utf-8")
            t = re.sub(r"T-App-(\w+)\.dc\.html", lambda m: f"{NOMBRES[m.group(1)]}.dc.html", t)
            t = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t, count=1, flags=re.S)
            (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("ok", len(NOMBRES), "teléfonos de WhatsApp")


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for f, fila in enumerate(FILAS):
        for i, (_, nombre, titulo) in enumerate(fila):
            clave = f"{nombre}.dc.html"
            b = c["boards"].get(clave)
            datos = {"x": i * 470, "y": 4340 + f * 1000, "w": 390, "h": 844, "title": titulo, "page": "propuesta-whatsapp", "is_interactive": True}
            if b is None:
                c["boards"][clave] = datos
            else:
                b.update(datos)
            if clave not in c["order"]:
                c["order"].append(clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok canvas.json")


armar()
lienzo()
