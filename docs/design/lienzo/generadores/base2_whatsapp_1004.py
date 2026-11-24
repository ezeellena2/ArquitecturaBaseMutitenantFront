"""Lo que no se sabe si salió por WhatsApp (0066 y 255) y la (i) de la auditoría de Plataforma (272), para la F10 de la segunda
parte de la base. Escribe `WA-Chats-Base2`, `Plat-WA-Chats-Base2`, `WA-Difusion-Resultados-Base2`, `Auditoria-Plat-Base2` y sus
teléfonos, desde la copia de `base2_1004/`.

- Un mensaje «Sin confirmar» lleva su (i) («No sabemos si salió…») y «Marcar como revisado»; revisado, la línea gris de quién y
  cuándo («Lo revisó Ana Gómez · 19/11/2026, 14:35»). Revisar no lo reenvía ni dice que llegó.
- «No se pudo mandar» lleva debajo su motivo, uno de los ocho códigos, con el texto del módulo.
- En una difusión, un destinatario «Sin confirmar» no tiene revisión y no cuenta como mandado ni como «No llegó» (255).
- La (i) del título de la auditoría de Plataforma dice cuánto se guardan los ingresos, con el número de la configuración (272).
"""
import re

from base2_comun import (MOTIVOS_WA, REVISO, SIN_CONFIRMAR_WA, copia, css, escribir, est, info, por_estado, tablero, una_vez)
from base2_filas_1004 import LISTAS, con_tarjetas, punto

CSS_CHAT = """
/* Base 2 · el envío de un mensaje (0066): el estado con su (i), «Marcar como revisado» y el motivo debajo. */
.b2-pie { display: flex !important; align-items: center; justify-content: flex-end; gap: 4px; }
.b2-pie .b2-est { color: inherit; }
.b2-lnk { padding: 0; border: 0; background: none; color: var(--marca-tx); font: inherit; font-weight: 600; text-decoration: underline; cursor: pointer; }
.b2-mot { color: var(--peligro) !important; }
"""
SIN_TIP = SIN_CONFIRMAR_WA + " Marcarlo como revisado no lo reenvía."


def pies(caso):
    """Lo que va debajo del globo del último mensaje: `sin`, `sin-i`, `revisado` o el índice de un motivo."""
    if caso in ("sin", "sin-i"):
        i = info(SIN_TIP, caso == "sin-i", "b2-tip-der")
        return (f'<span class="pie b2-pie"><span class="b2-est aten">Sin confirmar</span>{i}</span>'
                '<span class="pie"><button type="button" class="b2-lnk">Marcar como revisado</button></span>')
    if caso == "revisado":
        return f'<span class="pie b2-pie"><span class="b2-est aten">Sin confirmar</span></span><span class="pie">{REVISO}</span>'
    return f'<span class="pie ta-fallo">No se pudo mandar</span><span class="pie b2-mot">{MOTIVOS_WA[caso][1]}</span>'


def con_pie(t, clase, caso):
    """Cambia lo de abajo del último mensaje que salió (`w-m sal` o `ap-m sal`)."""
    i = t.rindex(f'<div class="{clase} sal">')
    j = t.index("</div>", i)
    globo = t[i:j]
    k = globo.index('<span class="pie')
    return t[:i] + globo[:k] + pies(caso) + t[j:]


ESTADOS = (["Sin confirmar", "Sin confirmar: por qué", "Revisado"]
           + [f"No se pudo mandar: {c.split('.')[-1]}" for c, _ in MOTIVOS_WA])
CASOS = ["sin", "sin-i", "revisado"] + list(range(len(MOTIVOS_WA)))


def wa_chats_base2():
    t = copia("wachats_fallo")
    return tablero("WA-Chats", "WhatsApp · Chats · un mensaje sin confirmar y los motivos de «No se pudo mandar»", css() + CSS_CHAT,
                   por_estado([con_pie(t, "w-m", c) for c in CASOS]), ESTADOS, 1440, 900)


def m_wa_conversacion_base2():
    t = copia("m_waconv_fallo")
    return tablero("M-WA-Conversacion", "Conversación · un mensaje sin confirmar · teléfono", css(True) + CSS_CHAT,
                   por_estado([con_pie(t, "ap-m", c) for c in CASOS]), ESTADOS, 390, 844)


def plat_wa_chats_base2():
    t = copia("platwachats")
    return tablero("Plat-WA-Chats", "Plataforma · WhatsApp · Consultas · un mensaje sin confirmar y los motivos", css() + CSS_CHAT,
                   por_estado([con_pie(t, "w-m", c) for c in CASOS]), ESTADOS, 1440, 900)


def m_plat_wa_conversacion_base2():
    t = copia("m_platwaconv")
    return tablero("M-Plat-WA-Conversacion", "Consultas · un mensaje sin confirmar · teléfono", css(True) + CSS_CHAT,
                   por_estado([con_pie(t, "ap-m", c) for c in CASOS]), ESTADOS, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- difusiones
DUDOSO = ("No sabemos si le llegó: WhatsApp no confirmó el envío. No se repite solo, y no cuenta como mandado ni como «No llegó».")
D_ESTADOS = ["Resultados", "Sin confirmar: por qué"]


def difres(abierto):
    t = copia("difres")
    t = una_vez(t, '<div class="w-it"><span class="dato"><b>2</b><span>Se dieron de baja</span></span></div>',
                '<div class="w-it"><span class="dato"><b>2</b><span>Se dieron de baja</span></span></div>'
                '<div class="w-it"><span class="dato"><b>1</b><span>Sin confirmar</span></span></div>')
    i = t.index('<div class="w-tr r"><span><b style="font-weight: 500;">Valeria Sosa</b>')
    fila = t[i:t.index('<div class="w-tr r">', i + 10)]
    nueva = (fila.replace("Valeria Sosa", "Federico Díaz").replace("011 15-5555-6120", "011 15-5555-2087")
             .replace('<span class="w-est off">Entregado</span>', est("aten", "Sin confirmar", DUDOSO, abierto))
             .replace("25/09/2026, 09:31", "25/09/2026, 09:30"))
    return t[:i] + nueva + t[i:]


def wa_difusion_resultados_base2():
    return tablero("WA-Difusion-Resultados", "WhatsApp · Resultados de una difusión · un destinatario sin confirmar",
                   css() + ".o-g5 { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }\n",
                   por_estado([difres(False), difres(True)]), D_ESTADOS, 1440, 900)


def m_wa_difusion_resultados_base2():
    t = copia("m_difres")
    t = una_vez(t, '<span role="listitem"><b>6</b><i>No llegaron</i></span>',
                '<span role="listitem"><b>6</b><i>No llegaron</i></span><span role="listitem"><b>1</b><i>Sin confirmar</i></span>')
    k = t.index('<div class="w-conv"><span class="w-av">VS</span>')
    t = t[:k] + ('<div class="w-conv"><span class="w-av">FD</span><span class="tx"><span class="l1"><b>Federico Díaz</b><span>25/09/2026, 09:30</span></span>'
                 '<span class="l2"><span>011 15-5555-2087</span></span><span class="l3"><span class="w-est">Sin confirmar</span></span></span></div>') + t[k:]

    def datos(n, d, a, b):
        e = punto(b[0]) if b else "—"
        if b and b[0] == "Sin confirmar":
            e = est("aten", "Sin confirmar", DUDOSO, True, "b2-tip-abajo")
        return [("Número", a[0] if a else "—"), ("Estado", e), ("Último cambio", d, True)]
    t = con_tarjetas(t, datos)
    return tablero("M-WA-Difusion-Resultados", "Resultados de una difusión · un destinatario sin confirmar · teléfono", css(True),
                   t, None, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- auditoría
INGRESOS = "Los ingresos se guardan 12 meses."


def auditoria_plat_base2():
    t = copia("audplat")
    t = una_vez(t, '<div class="tit"><h1>Auditoría</h1></div>',
                f'<div class="tit"><h1>Auditoría</h1>{info(INGRESOS, True, "b2-tip-abajo")}</div>')
    return tablero("Auditoria-Plat", "Auditoría de seguridad · la (i) con el plazo de los ingresos · /plataforma/auditoria", css(), t, None,
                   1440, 900)


def m_auditoria_plat_base2():
    t = copia("m_audplat")
    t = una_vez(t, '<div class="tit"><h1>Auditoría</h1>', f'<div class="tit"><h1>Auditoría{info(INGRESOS, True, "b2-tip-abajo")}</h1>')
    hacer = next(h for n, _, h in LISTAS if n == "Auditoría de Plataforma")
    t = con_tarjetas(t, hacer)
    return tablero("M-Auditoria-Plat", "Auditoría de seguridad · la (i) del plazo · teléfono", css(True)
                   + ".ap-bar .tit h1 { overflow: visible; }\n.ap-bar .tit .b2-i .acc-tip { left: -60px; }\n", t, None, 390, 844)


TABLEROS = [("WA-Chats-Base2", wa_chats_base2), ("M-WA-Conversacion-Base2", m_wa_conversacion_base2),
            ("Plat-WA-Chats-Base2", plat_wa_chats_base2), ("M-Plat-WA-Conversacion-Base2", m_plat_wa_conversacion_base2),
            ("WA-Difusion-Resultados-Base2", wa_difusion_resultados_base2), ("M-WA-Difusion-Resultados-Base2", m_wa_difusion_resultados_base2),
            ("Auditoria-Plat-Base2", auditoria_plat_base2), ("M-Auditoria-Plat-Base2", m_auditoria_plat_base2)]


def main(solo=None):
    hechos = []
    for nombre, hacer in TABLEROS:
        if solo and nombre not in solo:
            continue
        escribir(nombre, hacer())
        hechos.append(nombre)
    return hechos


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or None)
