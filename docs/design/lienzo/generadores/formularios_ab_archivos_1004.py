"""Etapa 14 · Fotos y documentos con la disposición de ArquitecturaBase (F1 a F5 del lienzo «Formularios por WhatsApp»).

Las piezas viven en `formularios_ab_1004.py`, que arma el editor y el chat:
- F1: en el editor, las preguntas «Foto» y «Documento» y el contador «Archivos: hasta N de 10»;
- F5: en Publicar, «Más de 10 archivos»;
- F3: en el chat, la respuesta con miniaturas y documentos, bajando, reintentando y rechazada con «Mandar de nuevo»;
- F4: el visor nuevo, sobre el chat y a pantalla completa en el teléfono.
Este archivo escribe los dos tableros nuevos del visor, los registra y marca «· para aprobar» los que suman estados de la
E14. Corre después de `formularios_ab_1004.py` y de `formularios_ab_catalogos_1004.py`.
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402

PROJ = F.PROJ
E14_APROBADA = True
NUEVOS = {"WA-Chats-Visor": (A.chat_visor, "WhatsApp · Internos · ver las fotos de una respuesta", (3040, 1780, 1440, 900)),
          "M-WA-Chats-Visor": (A.tel_visor, "WhatsApp · Internos · ver las fotos · teléfono", (1880, 2800, 390, 844))}
CON_ESTADOS_NUEVOS = ["FRM-Editor", "FRM-Publicar", "WA-Chats-Respuesta", "M-FRM-Editor", "M-WA-Conversacion-Respuesta"]


def registrar():
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    marca = "" if E14_APROBADA else A.PARA_APROBAR
    for n, (_, titulo, (x, y, w, h)) in NUEVOS.items():
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": titulo + marca, "page": "formularios", "is_interactive": True}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    for n in CON_ESTADOS_NUEVOS:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(A.PARA_APROBAR, "") + marca
    (PROJ / "canvas.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    for n, (f, _, _) in NUEVOS.items():
        (PROJ / f"{n}.dc.html").write_text(f(), encoding="utf-8")
    registrar()
    print("tableros", list(NUEVOS))
