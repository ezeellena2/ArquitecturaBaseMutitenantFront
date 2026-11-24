"""La segunda parte de la base (v180, aprobada en la v181): los tableros que espera la F4, la F5 y la F10 a la F13 del plan del back
del 2026-11-19, en la página «Segunda parte de la base». Sale de la lista de la revisión del 2026-11-19 y de la
de alineación del 2026-11-23 (`.local/revision-2026-11-19/tableros-para-diseno.md` del back), con las decisiones 260 a 273 de la hoja
de ruta de formularios y las ADR 0061, 0062 y 0066.

Corre los generadores de cada grupo (`base2_roles_1004.py`, `base2_personas_1004.py`, `base2_filas_1004.py`,
`base2_whatsapp_1004.py`, `base2_config_1004.py` y `base2_criterio_1004.py`), la pasada de las piezas sobre lo que escribieron
(`traspaso10_piezas_1004.py --tableros …`) y suma la página, sus notas y sus tableros a `canvas.json`. Los tableros parten de la copia
de `base2_1004/` (la arma `capturar.mjs`), así que se puede volver a correr. Los tableros de siempre no cambian: el usuario los
aprobó el 2026-11-23 (v181), y cada `-Base2` manda sobre el suyo en lo que dibuja, que conserva sus demás estados.
"""
import pathlib
import subprocess
import sys

import base2_config_1004
import base2_criterio_1004
import base2_filas_1004
import base2_personas_1004
import base2_roles_1004
import base2_whatsapp_1004
from base2_comun import PROJ, registrar

GRUPOS = [base2_criterio_1004, base2_roles_1004, base2_personas_1004, base2_filas_1004, base2_whatsapp_1004, base2_config_1004]

C, T = (1440, 900), (390, 844)
FILAS = [
    ("criterio", "Criterio (F4, F11 y F12)", [("Criterio-Tablas-Base2", 1440, 5600), ("Criterio-Elegir", 1440, 3300)]),
    ("roles", "Roles y personas (F5 y F10)", [("Rol-Base2", *C), ("M-Rol-Base2", *T), ("Usuarios-Base2", *C), ("M-Usuarios-Base2", *T),
                                              ("Usuario-Base2", *C), ("M-Usuario-Base2", *T), ("Empresa-Base2", *C), ("M-Empresa-Base2", *T)]),
    ("plataforma", "Plataforma (F5 y F10)", [("Cuentas-Base2", *C), ("M-Cuentas-Base2", *T), ("Cuenta-Plat-Base2", *C), ("M-Cuenta-Plat-Base2", *T),
                                             ("Auditoria-Plat-Base2", *C), ("M-Auditoria-Plat-Base2", *T)]),
    ("whatsapp", "WhatsApp: «Sin confirmar» y los motivos (F10)", [("WA-Chats-Base2", *C), ("M-WA-Conversacion-Base2", *T),
                                                                  ("Plat-WA-Chats-Base2", *C), ("M-Plat-WA-Conversacion-Base2", *T),
                                                                  ("WA-Difusion-Resultados-Base2", *C), ("M-WA-Difusion-Resultados-Base2", *T)]),
    ("config", "Las reglas en Configuración (F13)", [("Config-Plat-Base2", 1440, 1760), ("M-Config-Plat-Base2", *T), ("WA-Config-Base2", *C),
                                                     ("M-WA-Config-Base2", *T), ("Asistente-Org-Base2", *C), ("M-Asistente-Org-Base2", *T),
                                                     ("Asistente-Personal-Base2", *C), ("M-Asistente-Personal-Base2", *T),
                                                     ("Asistente-Plat-Base2", *C), ("M-Asistente-Plat-Base2", *T)]),
    ("pieza", "La pieza para elegir en pantalla (F11)", [("Cuenta-Base2", *C), ("M-Cuenta-Base2", *T), ("Configuracion-Base2", *C),
                                                         ("M-Configuracion-Base2", *T), ("WA-Respuestas-Base2", *C), ("M-WA-Respuestas-Base2", *T)]),
    ("filas", "Nada debajo de otro dato (F4)", [("Legales-Base2", *C), ("WA-Difusiones-Base2", *C), ("M-Filas-Base2", *T)]),
]

NOTA = (
    "Segunda parte de la base, aprobada por el usuario el 23/11 («Aprobados los tableros de la base 2», v181). Son los tableros de la "
    "F4, la F5 y la F10 a la F13 del plan del 19/11, con las decisiones 260 a 273 y las ADR 0061, 0062 y 0066, y ya se programan. Van "
    "antes que las acciones del asistente y que la E12.\n\n"
    "Cada uno es el tablero de siempre con lo nuevo, con «-Base2» en el nombre: en lo que dibuja, manda sobre el de siempre, que "
    "conserva sus demás estados. Cada uno muestra solo lo que existe hasta esta etapa (78). Los estados se eligen con el Tweak «estado».\n\n"
    "De arriba abajo: el criterio (las tablas que ordenan y la pieza para elegir); roles y personas; Plataforma; WhatsApp; las reglas "
    "en Configuración; la pieza en pantalla, y nada debajo de otro dato. Cada fila tiene su nota a la izquierda.\n\n"
    "La configuración de WhatsApp de la organización va como entrada nueva, «Configuración», en Administración › WhatsApp "
    "(WA-Config-Base2).")

NOTAS_FILA = {
    "criterio": ("Criterio-Tablas-Base2: el encabezado que ordena (↑ ↓ en el color de la marca, ↕ al pasar el mouse) y «Ordenar por» al "
                 "final de la barra (264); ninguna fila con un botón con texto (261); nada debajo de otro dato, tampoco el texto en gris "
                 "(263); los permisos en áreas plegables (260) y el teléfono, con cada fila como una tarjeta.\n\n"
                 "Criterio-Elegir (nuevo): la pieza para elegir (262), cerrada y abierta, del servidor, con tope, en la barra y en el "
                 "teléfono, con los tres detalles del 23/11: abre con la elegida a la vista, sin «0 opciones» y la lista de un botón del "
                 "ancho de sus nombres."),
    "roles": ("Rol: áreas plegables con la flecha, la casilla y la (i); lo incluido apagado con su motivo (si lo incluyen dos, los "
              "nombra); el Dueño con tildes y cerrado; un rol de una empresa. «Lo que no podés dar»: Valeria Castro, que no es Dueña, ve "
              "apagado lo que no tiene (269 y 0061). «Invitar usuarios» y «Asignar roles» incluyen su «Ver» como dibujo, a confirmar "
              "contra sus pantallas (260).\n\n"
              "Usuarios, Usuario y Empresa: la columna «Entrega» (Pendiente, Enviada, Sin confirmar, No se pudo enviar) con su (i); en "
              "la ficha, la caja «Invitación»; reenviar una sin confirmar pide revisar con la persona (0066 §4); el selector de roles con "
              "lo que no podés dar apagado. En el teléfono, cada fila es una tarjeta."),
    "plataforma": ("Cuentas y Cuenta-Plat: la entrega de la invitación de un operador; sus permisos en áreas plegables, en la ficha "
                   "(solo lo que tiene, con su tilde) y al invitar o cambiarlos, con lo incluido («Administrar cuentas» incluye «Ver "
                   "cuentas») y lo que no podés dar apagados.\n\n"
                   "Auditoria-Plat: la (i) del título, «Los ingresos se guardan 12 meses.», con el número de Configuración (272)."),
    "whatsapp": ("Un mensaje «Sin confirmar» con su (i) y «Marcar como revisado»; revisado, «Lo revisó Ana Gómez · 19/11/2026, 14:35». "
                 "Revisar no lo reenvía. «No se pudo mandar» con cada uno de los ocho motivos debajo. Igual en Plataforma.\n\n"
                 "Difusión: un destinatario «Sin confirmar», sin revisión y sin contar como mandado ni como «No llegó» (255)."),
    "config": ("Config-Plat: «Nombre y correos» con «Así llega», «Privacidad y retención» y, con WhatsApp, «Países que reciben "
               "códigos» con el aviso de costo, el plazo de sus chats y el máximo de las organizaciones. Cada valor con su mínimo y su "
               "máximo en la (i), el error, el 409 y sin permiso. El rango de «Conversaciones del Inicio» (1 a 30) es a confirmar.\n\n"
               "WA-Config (nuevo): «Guardar los mensajes de los chats» de la organización (272). El asistente: el cupo del día dice que "
               "fue el cupo y cuándo vuelve, con la hora de la organización o del perfil (271)."),
    "pieza": ("La zona horaria y el idioma en la pieza, con la ciudad y, en gris, la hora de su país y el desfase (262). En Mi cuenta, "
              "«Verificar» y «Vincular» pasan al ⋮ de su fila (261); «Exportar» y «Borrar» de Privacidad son acciones, no filas, y "
              "quedan.\n\n«Fuera de horario»: el horario en una tabla de lectura (Día · Horario · ✎), cada día en un diálogo con la "
              "atención en la pieza (IN1-C de allá, como referencia)."),
    "filas": ("Documentos legales y Difusiones: lo que iba junto en una celda o debajo del nombre pasa a sus columnas (263).\n\n"
              "M-Filas-Base2: las listas del teléfono del núcleo, una por estado, con cada fila como una tarjeta con sus datos "
              "nombrados, de a dos. Los segmentados de filtro con cantidad ya no estaban en el núcleo: «Clientes | Internos» de Chats son "
              "dos vistas y siguen."),
}


def sin_archivo(ruta):
    """El lienzo publicado admite 512 archivos por versión: el usuario eligió sacar la página «Archivo» y sus 32 tableros descartados
    (2026-11-23, v180). Siguen en esta carpeta y en git; `canvas.json` deja de nombrarlos. Devuelve los tableros que sacó."""
    import json
    c = json.loads(pathlib.Path(ruta).read_text(encoding="utf-8"))
    fuera = [k for k, v in c["boards"].items() if v.get("page") == "archivo"]
    for k in fuera:
        del c["boards"][k]
    c["order"] = [o for o in c["order"] if o not in fuera]
    notas = [n for n, v in c["notes"].items() if v.get("page") == "archivo"]
    for n in notas:
        del c["notes"][n]
    if "noteOrder" in c:
        c["noteOrder"] = [n for n in c["noteOrder"] if n not in notas]
    c["pages"] = [p for p in c["pages"] if p["id"] != "archivo"]
    pathlib.Path(ruta).write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    return fuera


def main(ruta=None, solo_registrar=False):
    hechos = []
    for g in GRUPOS:
        hechos += [n for n, _ in g.TABLEROS] if solo_registrar else g.main()
    r = subprocess.run(["true"]) if solo_registrar else subprocess.run([sys.executable, "traspaso10_piezas_1004.py", "--tableros", ",".join(hechos)], cwd=PROJ / "generadores",
                       capture_output=True, text=True, encoding="utf-8")
    if not solo_registrar:
        print(r.stdout.strip() or r.stderr.strip())
        assert r.returncode == 0
    # Las filas, de arriba abajo, con su nota a la izquierda. La primera nota es la de la página.
    filas = [[(n, w, h) for n, w, h in tableros] for _, _, tableros in FILAS]
    ys, y = [], 0
    for _, _, tableros in FILAS:
        ys.append(y)
        y += max(h for _, _, h in tableros) + 160
    extra = [(f"base2-{clave}", f"{titulo}\n\n{NOTAS_FILA[clave]}", ys[k] + (760 if k == 0 else 0)) for k, (clave, titulo, _) in enumerate(FILAS)]
    nuevos = registrar(filas, NOTA, extra, ruta)
    faltan = set(hechos) - {n.removesuffix(".dc.html") for n in nuevos}
    assert not faltan, faltan
    print("canvas.json:", len(nuevos), "tableros en la página")


if __name__ == "__main__":
    # python base2_1004.py [--canvas <ruta>] [--solo-registrar]
    args = sys.argv[1:]
    ruta = args[args.index("--canvas") + 1] if "--canvas" in args else None
    main(ruta, "--solo-registrar" in args)
    if "--sin-archivo" in args:
        print("sin el Archivo:", len(sin_archivo(ruta or PROJ / "canvas.json")), "tableros fuera de canvas.json")
