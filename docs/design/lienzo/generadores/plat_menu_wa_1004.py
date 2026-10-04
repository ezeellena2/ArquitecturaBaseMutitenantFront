"""Menú de Plataforma en la compu con lo decidido el 2026-10-03 (A): el WhatsApp de la plataforma solo atiende consultas.
- «WhatsApp» deja de abrir un panel (Chats, Contactos, Difusiones) y va directo a la bandeja (Plat-WA-Chats), con su contador.
- En Administración › WhatsApp, «Números» pasa a «Número» y las cuatro opciones llevan a los tableros Plat-WA-*.
Toca los tableros de Plataforma que tienen el menú de plat_vuelta_1004.py; se puede volver a correr. Corre después de
plat_vuelta_1004.py y plat_ajustes_1003.py."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
DESTINOS = {"WA-Admin": "Plat-WA-Numero", "WA-Respuestas": "Plat-WA-Bot", "WA-Equipos": "Plat-WA-Equipos", "WA-Plantillas": "Plat-WA-Plantillas"}

n = 0
for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    if 'onClick="{{plAbrirWhatsapp}}"' not in t:
        continue
    boton = re.search(r'<button type="button" class="ab-sidebar__link adm-btn \{\{plClaseWhatsapp\}\}"[^>]*>(<svg.*?</svg>)'
                      r'<span class="ab-sidebar__link-label">WhatsApp</span>(<span style="[^"]*">)1</span><svg.*?</svg></button>', t, flags=re.S)
    assert boton, ruta.name
    t = t.replace(boton.group(0), f'<a class="ab-sidebar__link" href="Plat-WA-Chats.dc.html">{boton.group(1)}'
                                  f'<span class="ab-sidebar__link-label">WhatsApp</span>{boton.group(2)}2</span></a>', 1)
    panel = re.search(r'<sc-if value="\{\{plEsWhatsapp\}\}"[^>]*>.*?</sc-if>', t, flags=re.S)
    assert panel, ruta.name
    t = t.replace(panel.group(0), "", 1)
    for viejo, nuevo in DESTINOS.items():
        t = t.replace(f'href="{viejo}.dc.html"', f'href="{nuevo}.dc.html"')
    t = t.replace('<span class="ab-sidebar__link-label">Números</span>', '<span class="ab-sidebar__link-label">Número</span>')
    assert "href=\"WA-" not in t, ruta.name
    ruta.write_text(t, encoding="utf-8")
    n += 1
    print("ok", ruta.stem)
print("ok", n, "tableros de Plataforma con el menú de WhatsApp nuevo")
