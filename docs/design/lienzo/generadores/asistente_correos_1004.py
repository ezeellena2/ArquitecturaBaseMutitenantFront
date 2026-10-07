"""Mensajes: los correos de alerta del asistente (D23 de la propuesta del asistente; v114, 2026-10-07).
Al 80 % y al 100 % del tope mensual: al Dueño si la organización usa su propia clave y a la plataforma (su correo de soporte,
Config-Plat › Contacto) si usa la de la plataforma. Solo correo, por el outbox, en es y en.
Lleva `// D23` en sus entradas; si ya están, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")


def entrada(n, comentario, asunto, para, titulo, parrafos, datos, boton, notas=()):
    p = ", ".join(f"P('{x}')" for x in parrafos)
    d = ", ".join(f"{{ k: '{k}', v: '{v}' }}" for k, v in datos)
    nt = ", ".join(f"P('{x}')" for x in notas)
    return (f"  {{\n    n: '{n}',\n    // D23: {comentario}\n    correo: {{\n      asunto: '{asunto}',\n      para: '{para}',\n"
            f"      titulo: '{titulo}',\n      parrafos: [{p}],\n      datos: [{d}],\n      boton: '{boton}',\n"
            + (f"      notas: [{nt}],\n" if notas else "") + "    },\n  },\n")


if "// D23:" not in t:
    nuevas = [
        entrada("Asistente: 80 % del tope (su clave)", "la organización usa su propia clave; le llega al Dueño.",
                "El asistente de Grupo Delta usó el 80 % del tope del mes", "lucia.fernandez@delta.ejemplo.com",
                "El asistente usó el 80 % del tope del mes",
                ["Hola, Lucía. Grupo Delta ya usó USD 160,00 de los USD 200,00 de tope de octubre.",
                 "Si llega al tope, el asistente deja de responder hasta el 1 de noviembre. Podés subir el tope en la configuración del asistente."],
                [("Organización", "Grupo Delta"), ("Usado", "USD 160,00 de USD 200,00"), ("Mes", "Octubre de 2026")], "Ver el uso"),
        entrada("Asistente: tope alcanzado (su clave)", "la organización usa su propia clave; le llega al Dueño.",
                "El asistente de Grupo Delta llegó al tope del mes", "lucia.fernandez@delta.ejemplo.com",
                "El asistente llegó al tope del mes",
                ["Hola, Lucía. Grupo Delta usó los USD 200,00 de tope de octubre y el asistente dejó de responder.",
                 "Vuelve a responder el 1 de noviembre, o antes si subís el tope en la configuración del asistente."],
                [("Organización", "Grupo Delta"), ("Usado", "USD 200,00 de USD 200,00"), ("Mes", "Octubre de 2026")], "Revisar configuración"),
        entrada("Asistente: 80 % del tope (plataforma)", "la organización usa la clave de la plataforma; le llega al correo de soporte de la plataforma.",
                "Grupo Delta usó el 80 % del tope del asistente", "soporte@ejemplo.com",
                "Grupo Delta usó el 80 % del tope del asistente",
                ["Grupo Delta, que usa la clave de la plataforma, ya usó USD 80,00 de los USD 100,00 de tope de octubre.",
                 "Si llega al tope, su asistente deja de responder hasta el 1 de noviembre."],
                [("Organización", "Grupo Delta"), ("Usado", "USD 80,00 de USD 100,00"), ("Mes", "Octubre de 2026")], "Ver el uso"),
        entrada("Asistente: tope alcanzado (plataforma)", "la organización usa la clave de la plataforma; le llega al correo de soporte de la plataforma.",
                "Grupo Delta llegó al tope del asistente", "soporte@ejemplo.com",
                "Grupo Delta llegó al tope del asistente",
                ["Grupo Delta usó los USD 100,00 de tope de octubre y su asistente dejó de responder hasta el 1 de noviembre."],
                [("Organización", "Grupo Delta"), ("Usado", "USD 100,00 de USD 100,00"), ("Mes", "Octubre de 2026")], "Ver el uso"),
    ]
    t = rep(t, "];\n\nconst HORA = ", "".join(nuevas) + "];\n\nconst HORA = ")
    anterior = "Recuperación: rechazada"
    for e in ["Asistente: 80 % del tope (su clave)", "Asistente: tope alcanzado (su clave)",
              "Asistente: 80 % del tope (plataforma)", "Asistente: tope alcanzado (plataforma)"]:
        t = sumar_opcion(t, anterior, e, prop="mensaje")
        anterior = e
    ruta.write_text(t, encoding="utf-8")
    print("ok Mensajes")
