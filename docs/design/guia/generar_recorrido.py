"""Arma la guía del lienzo como un recorrido de punta a punta: cada capítulo es un paso de quien usa el sistema y cada
pantalla muestra la compu, el teléfono, lo que se abre desde ahí, sus estados y si ya está programada.
Uso (ver README.md): `python generar_recorrido.py <carpeta de salida>`. Escribe `capturar.json` con los tableros que usa; si ya
están las capturas en `<salida>/png`, las pasa a JPG en `<salida>/img` y arma `<salida>/Guia-Lienzo.html`."""
import html
import json
import pathlib
import re
import sys
import tempfile

AQUI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
from recorrido import CAPITULOS, CODIGO, VERSION  # noqa: E402

LIENZO = AQUI.parent / "lienzo"
SALIDA = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(tempfile.gettempdir()) / "guia-lienzo"
URL_LIENZO = "https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK"
CANVAS = json.loads((LIENZO / "canvas.json").read_text(encoding="utf-8"))["boards"]


def e(s):
    return html.escape(s, quote=True)


def tweaks(tablero):
    t = (LIENZO / f"{tablero}.dc.html").read_text(encoding="utf-8")
    m = re.search(r"data-props='([^']*)'", t)
    if not m:
        return {}
    d = json.loads(m.group(1))
    return {k: v["options"] for k, v in d.items() if isinstance(v, dict) and v.get("options")}


def nombre_tablero(t):
    titulo = CANVAS[t + ".dc.html"].get("title", t)
    return re.sub(r"\s*·\s*teléfono$", "", titulo)


def captura(t, clase, pie=None):
    p = f'<span class="pie">{e(pie)}</span>' if pie else ""
    return (f'<button type="button" class="cap {clase}" data-img="img/{t}.jpg" data-titulo="{e(nombre_tablero(t))}" aria-label="Ver {e(nombre_tablero(t))} más grande">'
            f'<img src="img/{t}.jpg" alt="{e(nombre_tablero(t))}" loading="lazy">{p}</button>')


def pantalla(p, n):
    pid, nombre, ruta, cod, etapa, web, tel, mas, desc = p
    cn, cc = CODIGO[cod]
    estados = {}
    for t in web + tel:
        for k, v in tweaks(t).items():
            estados.setdefault(k, [])
            for o in v:
                if o not in estados[k]:
                    estados[k].append(o)
    est = ""
    if estados:
        filas = "".join(f'<li><span class="k">{e(k.capitalize())}</span><span class="v">{" · ".join(e(o) for o in v)}</span></li>' for k, v in estados.items())
        cuenta = sum(len(v) for v in estados.values())
        est = f'<details class="estados"><summary>{cuenta} estados para ver con Tweak</summary><ul>{filas}</ul></details>'
    etapa_txt = f"Etapa {etapa}" if etapa != "—" else ""
    compu = "".join(captura(t, "web", nombre_tablero(t) if len(web) > 1 else None) for t in web)
    telef = "".join(captura(t, "tel") for t in tel)
    extras = "".join(captura(t, "mas tel-chico" if t.startswith("M-") else "mas", nombre_tablero(t)) for t in mas)
    bloque_mas = f'<div class="extras"><span class="rot">Se abre desde acá</span><div class="fila-mas">{extras}</div></div>' if mas else ""
    return (f'<article class="pant" id="{pid}">'
            f'<div class="texto"><span class="num">{n}</span><h3>{e(nombre)}</h3><p class="ruta">{e(ruta)}</p>'
            f'<p class="linea"><span class="cod {cc}">{cn}</span>{f"<span class=etapa>{e(etapa_txt)}</span>" if etapa_txt else ""}</p>'
            f'<p class="desc">{e(desc)}</p>{est}</div>'
            f'<div class="caps"><div class="webs">{compu}</div>{f"<div class=tels>{telef}</div>" if tel else ""}</div>'
            f'{bloque_mas}</article>')


def pagina():
    nav, secciones = [], []
    total_p = total_t = prog = 0
    for k, (cid, titulo, texto, ps) in enumerate(CAPITULOS, 1):
        nav.append(f'<a href="#{cid}"><span class="n">{k}</span>{e(titulo)}</a>')
        filas = "".join(pantalla(p, f"{k}.{i}") for i, p in enumerate(ps, 1))
        secciones.append(f'<section class="cap-sec" id="{cid}"><header class="cap-cab"><span class="paso">Paso {k}</span><h2>{e(titulo)}</h2><p>{e(texto)}</p></header>{filas}</section>')
        total_p += len(ps)
        total_t += sum(len(p[5]) + len(p[6]) + len(p[7]) for p in ps)
        prog += sum(1 for p in ps if p[3] == "si")
    return (PLANTILLA.replace("@NAV@", "".join(nav)).replace("@SECCIONES@", "".join(secciones)).replace("@URL@", URL_LIENZO)
            .replace("@PANTALLAS@", str(total_p)).replace("@TABLEROS@", str(total_t)).replace("@PROGRAMADAS@", str(prog)).replace("@VERSION@", e(VERSION)))


PLANTILLA = r"""<title>Guía del lienzo multitenant</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* El recorrido de una persona por el sistema, paso a paso: los colores y la letra del propio producto (fondo cálido, marco arena, petróleo). Cada pantalla es una fila: el texto a la izquierda y las capturas a la derecha. */
:root {
  --fondo: oklch(0.982 0.006 80);
  --hoja: oklch(1 0 0);
  --arena: oklch(0.935 0.018 76);
  --arena-b: oklch(0.88 0.022 76);
  --borde: oklch(0.9 0.008 78);
  --t1: oklch(0.24 0.014 78);
  --t2: oklch(0.45 0.014 78);
  --t3: oklch(0.58 0.01 78);
  --marca: oklch(0.5 0.099 195);
  --marca-tx: oklch(0.42 0.09 195);
  --marca-t: oklch(0.95 0.03 195);
  --ok: oklch(0.6 0.13 155);
  --parte: oklch(0.72 0.15 70);
  --no: oklch(0.7 0.01 78);
  --sombra: oklch(0.24 0.014 78 / 0.12);
  --velo: oklch(0.2 0.01 78 / 0.6);
  --sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --fondo: oklch(0.2 0.008 78); --hoja: oklch(0.245 0.01 78); --arena: oklch(0.3 0.02 76); --arena-b: oklch(0.36 0.022 76); --borde: oklch(0.34 0.01 78);
  --t1: oklch(0.94 0.006 78); --t2: oklch(0.78 0.01 78); --t3: oklch(0.66 0.01 78); --marca: oklch(0.7 0.1 195); --marca-tx: oklch(0.78 0.09 195);
  --marca-t: oklch(0.3 0.04 195); --no: oklch(0.55 0.01 78); --sombra: oklch(0 0 0 / 0.4); --velo: oklch(0 0 0 / 0.7); color-scheme: dark; } }
:root[data-theme="dark"] {
  --fondo: oklch(0.2 0.008 78); --hoja: oklch(0.245 0.01 78); --arena: oklch(0.3 0.02 76); --arena-b: oklch(0.36 0.022 76); --borde: oklch(0.34 0.01 78);
  --t1: oklch(0.94 0.006 78); --t2: oklch(0.78 0.01 78); --t3: oklch(0.66 0.01 78); --marca: oklch(0.7 0.1 195); --marca-tx: oklch(0.78 0.09 195);
  --marca-t: oklch(0.3 0.04 195); --no: oklch(0.55 0.01 78); --sombra: oklch(0 0 0 / 0.4); --velo: oklch(0 0 0 / 0.7); color-scheme: dark; }
* { box-sizing: border-box; }
body { background: var(--fondo); color: var(--t1); font-family: var(--sans); font-size: 14px; line-height: 1.5; padding-inline: 16px; padding-block: 0 72px; }
.envoltura { max-width: 1280px; margin: 0 auto; }
a { color: var(--marca-tx); text-underline-offset: 2px; }
a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--marca); outline-offset: 2px; border-radius: 6px; }
h1, h2, h3 { text-wrap: balance; margin: 0; }
p { margin: 0; }
.cab { padding-block: 40px 24px; display: grid; gap: 14px; }
.eyebrow { font-size: 12.5px; font-weight: 600; color: var(--t3); letter-spacing: 0.05em; text-transform: uppercase; }
.cab h1 { font-size: clamp(28px, 4vw, 36px); font-weight: 700; letter-spacing: -0.02em; }
.cab p { max-width: 70ch; color: var(--t2); font-size: 15px; }
.datos { display: flex; flex-wrap: wrap; gap: 6px 20px; color: var(--t2); font-size: 13.5px; }
.datos b { color: var(--t1); font-variant-numeric: tabular-nums; }
.leyenda { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--t2); }
.boton { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; border-radius: 8px; background: var(--marca); color: oklch(1 0 0); font-weight: 600; text-decoration: none; width: fit-content; }
.cod { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.cod::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--no); flex-shrink: 0; }
.cod.ok::before { background: var(--ok); } .cod.parte::before { background: var(--parte); } .cod.ref::before { background: var(--t3); }
.nav { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--fondo); border-bottom: 1px solid var(--borde); margin-inline: -16px; padding: 0 16px; }
.nav .fila { max-width: 1280px; margin: 0 auto; display: flex; gap: 2px; overflow-x: auto; padding-block: 8px; scrollbar-width: thin; }
.nav a { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; color: var(--t2); text-decoration: none; font-weight: 500; font-size: 13.5px; }
.nav a .n { width: 20px; height: 20px; border-radius: 50%; background: var(--arena); color: var(--t2); font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
.nav a:hover { background: var(--arena); color: var(--t1); }
.cap-sec { margin-top: 48px; scroll-margin-top: 60px; display: grid; gap: 14px; }
.cap-cab { display: grid; gap: 4px; padding-bottom: 6px; }
.cap-cab .paso { font-size: 12.5px; font-weight: 700; color: var(--marca-tx); letter-spacing: 0.05em; text-transform: uppercase; }
.cap-cab h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.015em; }
.cap-cab p { color: var(--t2); max-width: 75ch; font-size: 15px; }
.pant { background: var(--hoja); border: 1px solid var(--borde); border-radius: 12px; display: grid; grid-template-columns: minmax(0, 280px) minmax(0, 1fr); gap: 0 24px; padding: 20px; scroll-margin-top: 64px; }
.texto { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.num { font-size: 12px; font-weight: 600; color: var(--t3); font-variant-numeric: tabular-nums; }
.texto h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.ruta { font-family: var(--mono); font-size: 12px; color: var(--t2); overflow-wrap: anywhere; }
.linea { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: var(--t2); margin-top: 2px; }
.etapa { color: var(--t3); }
.desc { color: var(--t2); margin-top: 4px; }
.estados { margin-top: 6px; color: var(--t2); font-size: 13px; }
.estados summary { cursor: pointer; font-weight: 500; color: var(--marca-tx); width: fit-content; }
.estados ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.estados .k { display: block; font-size: 12px; font-weight: 600; color: var(--t3); text-transform: uppercase; letter-spacing: 0.04em; }
.estados .v { display: block; color: var(--t1); }
.caps { display: flex; gap: 14px; align-items: flex-start; min-width: 0; }
.webs { flex: 1; min-width: 0; display: grid; gap: 10px; }
.tels { display: flex; gap: 10px; flex-shrink: 0; width: 168px; }
.cap { display: grid; gap: 4px; padding: 0; border: 0; background: none; cursor: zoom-in; font: inherit; color: inherit; text-align: left; min-width: 0; }
.cap img { display: block; width: 100%; height: auto; border: 1px solid var(--borde); border-radius: 8px; background: var(--fondo); }
.cap.web img { max-height: 560px; object-fit: cover; object-position: left top; }
.cap.tel { width: 168px; }
.cap.tel img { border-radius: 16px; max-height: 364px; object-fit: cover; object-position: left top; }
.cap .pie { font-size: 12px; color: var(--t3); }
.cap:hover img { border-color: var(--marca); }
.extras { grid-column: 2; margin-top: 14px; display: grid; gap: 6px; min-width: 0; }
.extras .rot { font-size: 12px; font-weight: 600; color: var(--t3); text-transform: uppercase; letter-spacing: 0.04em; }
.fila-mas { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.cap.mas { width: 200px; flex-shrink: 0; }
.cap.mas img { max-height: 125px; object-fit: cover; object-position: left top; }
.cap.mas.tel-chico { width: 96px; }
.cap.mas.tel-chico img { max-height: 208px; border-radius: 12px; }
dialog { border: 0; padding: 0; border-radius: 12px; max-width: min(1300px, 96vw); max-height: 92vh; background: var(--hoja); color: var(--t1); box-shadow: 0 24px 64px var(--sombra); }
dialog::backdrop { background: var(--velo); }
dialog .dc { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; background: var(--arena); border-bottom: 1px solid var(--arena-b); font-weight: 600; }
dialog .dc button { height: 32px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--arena-b); background: var(--hoja); color: var(--t1); font: inherit; cursor: pointer; }
dialog .db { overflow: auto; max-height: calc(92vh - 50px); }
dialog img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
@media (max-width: 860px) {
  .pant { grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 16px; }
  .extras { grid-column: 1; margin-top: 0; }
}
@media (max-width: 520px) {
  .caps { flex-direction: column; }
  .tels { width: 100%; }
  .cap.tel { width: min(168px, 48%); }
}
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>

<div class="envoltura">
  <header class="cab">
    <span class="eyebrow">Sistema visual · Multitenant</span>
    <h1>Guía del lienzo</h1>
    <p>El recorrido completo, en el orden en que una persona usa el sistema: llega al sitio, entra, ve su perfil, registra su empresa, arma su equipo, la administra, atiende por WhatsApp y, aparte, lo que usan los operadores de la plataforma. Cada pantalla tiene la compu, el teléfono, lo que se abre desde ahí y sus estados. Tocá una captura para verla grande; para usarla con Play, abrí el lienzo.</p>
    <div class="datos"><span><b>@PANTALLAS@</b> pantallas</span><span><b>@TABLEROS@</b> tableros</span><span><b>@PROGRAMADAS@</b> pantallas ya programadas</span><span>Lienzo @VERSION@</span></div>
    <div class="leyenda"><span class="cod ok">Programada</span><span class="cod parte">Programada en parte</span><span class="cod no">Falta programar</span><span class="cod ref">De referencia</span></div>
    <a class="boton" href="@URL@" target="_blank" rel="noopener">Abrir el lienzo</a>
  </header>
</div>
<nav class="nav" aria-label="Pasos del recorrido"><div class="fila">@NAV@</div></nav>
<main class="envoltura">@SECCIONES@</main>
<dialog id="zoom" aria-labelledby="zoom-t"><div class="dc"><span id="zoom-t"></span><button type="button" id="zoom-x">Cerrar</button></div><div class="db"><img id="zoom-img" alt=""></div></dialog>
<script>
(function () {
  var d = document.getElementById('zoom'), img = document.getElementById('zoom-img'), t = document.getElementById('zoom-t');
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('.cap');
    if (!b) return;
    img.src = b.getAttribute('data-img');
    img.alt = b.getAttribute('data-titulo');
    t.textContent = b.getAttribute('data-titulo');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  });
  document.getElementById('zoom-x').addEventListener('click', function () { if (d.close) d.close(); else d.removeAttribute('open'); });
  d.addEventListener('click', function (ev) { if (ev.target === d && d.close) d.close(); });
})();
</script>
"""

def tableros_usados():
    return list(dict.fromkeys(t for _, _, _, ps in CAPITULOS for p in ps for t in p[5] + p[6] + p[7]))


def pasar_a_jpg():
    """Las capturas de la compu, a 1200 de ancho y calidad 72; las del teléfono, enteras y calidad 80."""
    from PIL import Image
    (SALIDA / "img").mkdir(parents=True, exist_ok=True)
    for f in sorted((SALIDA / "png").glob("*.png")):
        im = Image.open(f).convert("RGB")
        calidad = 80
        if im.width > 1000:
            im = im.resize((1200, int(im.height * 1200 / im.width)), Image.LANCZOS)
            calidad = 72
        im.save(SALIDA / "img" / (f.stem + ".jpg"), "JPEG", quality=calidad, optimize=True, progressive=True)


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    usados = tableros_usados()
    faltan = [t for t in usados if t + ".dc.html" not in CANVAS]
    assert not faltan, f"tableros que no están en el lienzo: {faltan}"
    lista = [{"t": t, "w": CANVAS[t + ".dc.html"]["w"], "h": CANVAS[t + ".dc.html"]["h"]} for t in usados]
    (SALIDA / "capturar.json").write_text(json.dumps(lista), encoding="utf-8")
    if not (SALIDA / "png").exists():
        print(f"capturar.json listo en {SALIDA}: ahora corré capturar.mjs y volvé a correr este script.")
        sys.exit(0)
    pasar_a_jpg()
    (SALIDA / "Guia-Lienzo.html").write_text(pagina(), encoding="utf-8")
    hay = {f.stem for f in (SALIDA / "img").glob("*.jpg")}
    print("guía en", SALIDA / "Guia-Lienzo.html", "· faltan imágenes:", sorted(set(usados) - hay))
