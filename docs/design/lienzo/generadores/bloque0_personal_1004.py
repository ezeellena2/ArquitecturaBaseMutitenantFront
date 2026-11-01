"""Bloque 0 · Personal (el plan de diseño del 27/10): el perfil personal pasa a las reglas del 25/10, copiando la maqueta (8af6be2).

- Sin el cartel «Agregá un correo personal o tu WhatsApp…» en el Inicio personal (compu y teléfono) ni en el asistente: que a
  la cuenta le falta un método propio espera a la persona, así que va en la campana, y el aviso lleva a Mi cuenta.
  - Compu: en «Con el aviso», la campana abierta sobre el Inicio, con el aviso sin leer; en «Sin el aviso», sin número.
  - Teléfono: la campana del Inicio abre `M-Campana-Personal` («Avisos», nuevo), con el aviso o con «No hay avisos.».
- La respuesta «Mis mensajes con empresas» del asistente nombra las empresas sin fecha, como la maqueta (salen «hoy, 10:42»,
  «ayer» y «28/09»).
La pantalla de la invitación aceptada conserva su aviso: es la pantalla entera de ese paso. Corre después de
`campana_1004.py` y antes de `otro_acceso_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import campana_1004 as K  # noqa: E402
import reglas_25_10_1004 as R  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
TEXTO, CUANDO = K.METODO, K.METODO_CUANDO
CARTEL = re.compile(r'<sc-if value="\{\{conAviso\}\}" hint-placeholder-val="\{\{si\}\}"><div class="(?:w-cartel|ap-sug)">.*?</sc-if>', re.S)
VALS = 'conAviso: e === "Con el aviso",'
VALS_NUEVOS = VALS + '\n      sinAviso: e !== "Con el aviso", claseCampana: e === "Con el aviso" ? " on" : "",'

LISTA = ('<sc-if value="{{conAviso}}" hint-placeholder-val="{{si}}"><div class="cmp-lista" role="dialog" aria-label="Avisos">'
         '<div class="cmp-cab">Avisos<span>1</span></div>'
         f'<a class="cmp-it sin-leer" href="Cuenta.dc.html" aria-label="{TEXTO}, sin leer"><span class="cmp-ic espera">{K.ESPERA}</span>'
         f'<span class="cmp-tx">{TEXTO}<small>{CUANDO}</small></span><span class="cmp-punto" aria-hidden="true"></span></a></div></sc-if>')
# La campana del Inicio personal: abierta con el aviso o, sin él, sin número. Otro-Acceso copia el marco y la vuelve a la simple.
CAMPANA_INICIO = (f'<span class="w-cmp-env"><a class="w-campana{{{{claseCampana}}}}" href="#" aria-label="Avisos">{K.CAMPANA}'
                  '<sc-if value="{{conAviso}}" hint-placeholder-val="{{si}}"><span class="n">1</span></sc-if></a>' + LISTA + "</span>")
CAMPANA_TEL_VIEJA = '<a class="ap-ib ap-campana" href="M-Campana.dc.html" aria-label="Avisos: 1">' + K.CAMPANA + '<span class="n">1</span></a>'
CAMPANA_TEL = ('<a class="ap-ib ap-campana" href="M-Campana-Personal.dc.html" aria-label="Avisos">' + K.CAMPANA
               + '<sc-if value="{{conAviso}}" hint-placeholder-val="{{si}}"><span class="n">1</span></sc-if></a>')
VOLVER = ('<a class="ap-ib" aria-label="Volver" href="M-Inicio-Personal.dc.html"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" '
          'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></a>')
FILA_TEL = (f'<a class="cp-fila" href="M-Cuenta.dc.html"><span class="cmp-ic espera">{K.ESPERA}</span>'
            f'<span class="tx"><b style="font-weight: 600;">{TEXTO}</b><small>{CUANDO}</small></span>'
            '<span class="cmp-punto" aria-hidden="true" style="align-self: center; width: 9px; height: 9px; border-radius: 50%; background: var(--marca); flex-shrink: 0;"></span></a>')
CSS_VACIO = """.ap-vacio { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; text-align: center; font-size: 16px; font-weight: 600; color: var(--t1); }
"""
NUEVO = ("M-Campana-Personal", {"h": 844, "is_interactive": True, "page": "personal", "title": "Avisos · personal · teléfono", "w": 390, "x": 4810, "y": 1280})


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


def inicio():
    t = leer("Inicio-Personal")
    if "M-Campana-Personal" in t or "claseCampana" in t:
        return t
    t = CARTEL.sub("", t)
    assert t.count(K.boton("1")) == 1 and t.count(VALS) == 1
    t = t.replace(K.boton("1"), CAMPANA_INICIO).replace(VALS, VALS_NUEVOS)
    return K.css(t, K.CSS, "1")  # con «sin leer» y su punto, que la campana sumó en la v143


def inicio_tel():
    t = leer("M-Inicio-Personal")
    if "M-Campana-Personal" in t:
        return t
    t = CARTEL.sub("", t)
    assert t.count(CAMPANA_TEL_VIEJA) == 1 and t.count(VALS) == 1
    return t.replace(CAMPANA_TEL_VIEJA, CAMPANA_TEL).replace(VALS, VALS_NUEVOS)


def avisos_tel(base):
    """«Avisos» del perfil personal, con el marco del Inicio personal: ‹ vuelve al Inicio."""
    i = base.index('<div class="ap-bar">')
    j = base.index('<div class="ap-cuerpo">')
    k = base.index('<nav class="ap-nav"')
    bar = f'<div class="ap-bar int">{VOLVER}<div class="tit"><h1>Avisos</h1><span class="sub">Personal</span></div></div>'
    cuerpo = ('<div class="ap-cuerpo"><sc-if value="{{conAviso}}" hint-placeholder-val="{{si}}">' + FILA_TEL + '</sc-if>'
              '<sc-if value="{{sinAviso}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">No hay avisos.</div></sc-if></div>')
    t = base[:i] + bar + cuerpo + base[k:]
    t = t.replace('<a class="on" aria-current="page"', "<a", 1)
    t = re.sub(r"<title>[^<]*</title>", "<title>Avisos · personal · teléfono</title>", t, count=1)
    t = K.css(t, K.CSS, "1")
    return t.replace("</helmet>", f'<style data-b0="personal">\n{CSS_VACIO}</style>\n</helmet>', 1) if 'data-b0="personal"' not in t else t


def asistente(n):
    t = leer(n)
    t = CARTEL.sub("", t)
    return re.sub(r'(<li>[^<]+) <span class="s">· [^<]*</span>(</li>)', r"\1\2", t)


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    n, b = NUEVO
    c["boards"].setdefault(f"{n}.dc.html", b)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    escribir("Inicio-Personal", inicio())
    tel = inicio_tel()
    escribir("M-Inicio-Personal", tel)
    escribir("M-Campana-Personal", avisos_tel(tel))
    for n in ("Asistente-Personal", "M-Asistente-Personal"):
        escribir(n, asistente(n))
    # Detrás de los diálogos de Mi cuenta, «Cómo entrás» como en Mi cuenta: un renglón por fila, con el estado a la derecha
    for n in ("Cuenta-Agregar", "Cuenta-Verificar", "Cuenta-Metodo", "Cuenta-Baja"):
        escribir(n, R.cuenta(leer(n)))
    registrar()
    print("bloque 0 · personal: listo")
