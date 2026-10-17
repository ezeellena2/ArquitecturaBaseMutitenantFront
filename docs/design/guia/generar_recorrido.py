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


RECORRIDOS = AQUI.parent / "recorridos"
ETAPAS = ["Ingreso y registro", "Organización", "Página pública y directorio", "Plataforma", "Mi cuenta", "Etapa 8 · WhatsApp", "Etapa 8b · Asistente",
          "Etapa 12 · Formularios", "Etapa 13 · Catálogos", "Etapa 17 · Biblioteca"]


def recorridos():
    """Los recorridos guiados (docs/design/recorridos/*.json), por etapa y en su orden."""
    lista = [json.loads(f.read_text(encoding="utf-8")) for f in sorted(RECORRIDOS.glob("*.json"))]
    for r in lista:
        assert r["etapa"] in ETAPAS, (r["id"], r["etapa"])
    return sorted(lista, key=lambda r: (ETAPAS.index(r["etapa"]), r.get("orden", 0)))


def datos_recorridos(lista, cajas):
    """Lo que necesita el reproductor: cada paso con su captura y el lugar a resaltar en porcentajes de la captura."""
    salida = []
    for r in lista:
        pasos = []
        for n, (p, c) in enumerate(zip(r["pasos"], cajas[r["id"]]), 1):
            caja = None
            if c["caja"]:
                x, y, w, h, pad = c["caja"]["x"], c["caja"]["y"], c["caja"]["w"], c["caja"]["h"], 8
                caja = [round(max(0, x - pad) / c["w"] * 100, 2), round(max(0, y - pad) / c["h"] * 100, 2),
                        round(min(c["w"], w + 2 * pad) / c["w"] * 100, 2), round(min(c["h"], h + 2 * pad) / c["h"] * 100, 2)]
            pasos.append({"img": f"img/rec/{r['id']}-{n}.jpg", "tel": c["w"] < 600, "caja": caja,
                          "actor": p["actor"], "titulo": p["titulo"], "texto": p["texto"], "avanzar": p["avanzar"]})
        salida.append({"id": r["id"], "titulo": r["titulo"], "etapa": r["etapa"], "resumen": r["resumen"], "pasos": pasos})
    return salida


def seccion_recorridos(lista):
    if not lista:
        return ""
    bloques = []
    for et in ETAPAS:
        rs = [r for r in lista if r["etapa"] == et]
        if not rs:
            continue
        tarjetas = "".join(
            f'<button type="button" class="rec-card" data-rec="{e(r["id"])}"><img src="img/rec/{e(r["id"])}-1.jpg" alt="" loading="lazy">'
            f'<span class="t">{e(r["titulo"])}</span><span class="d">{len(r["pasos"])} pasos · {e(r["pasos"][0]["actor"])}</span>'
            f'<span class="r">{e(r["resumen"])}</span></button>' for r in rs)
        bloques.append(f'<div class="rec-et"><h3>{e(et)}</h3><div class="rec-cards">{tarjetas}</div></div>')
    return ('<section class="cap-sec" id="recorridos"><header class="cap-cab"><span class="paso">Recorridos guiados</span>'
            '<h2>Cada flujo, paso a paso</h2><p>Cada paso muestra el tablero en su estado, el lugar que hay que tocar y quién lo hace. '
            'Tocá el recuadro naranja o «Siguiente» para avanzar; «Reproducir» avanza solo cada 6 segundos.</p></header>'
            + "".join(bloques) + "</section>")


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
    recs = recorridos()
    cajas_f = SALIDA / "rec" / "cajas.json"
    cajas = json.loads(cajas_f.read_text(encoding="utf-8")) if cajas_f.exists() else {}
    recs = [r for r in recs if r["id"] in cajas]
    datos = datos_recorridos(recs, cajas)
    if recs:
        nav.insert(0, '<a href="#recorridos"><span class="n">▶</span>Recorridos guiados</a>')
    datos_js = json.dumps({"etapas": [et for et in ETAPAS if any(r["etapa"] == et for r in datos)], "recorridos": datos},
                          ensure_ascii=False).replace("</", "<\\/")
    return (PLANTILLA.replace("@NAV@", "".join(nav)).replace("@SECCIONES@", seccion_recorridos(recs) + "".join(secciones)).replace("@URL@", URL_LIENZO)
            .replace("@DATOS_REC@", datos_js).replace("@BOTON_REC@", '<a class="boton sec" href="#recorridos">Ver los recorridos guiados</a>' if recs else "")
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
  --naranja: oklch(0.7 0.18 50);
  --naranja-f: oklch(0.6 0.17 45);
  --naranja-t: oklch(0.96 0.04 60);
  --foco: oklch(0.2 0.01 78 / 0.3);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --fondo: oklch(0.2 0.008 78); --hoja: oklch(0.245 0.01 78); --arena: oklch(0.3 0.02 76); --arena-b: oklch(0.36 0.022 76); --borde: oklch(0.34 0.01 78);
  --t1: oklch(0.94 0.006 78); --t2: oklch(0.78 0.01 78); --t3: oklch(0.66 0.01 78); --marca: oklch(0.7 0.1 195); --marca-tx: oklch(0.78 0.09 195);
  --marca-t: oklch(0.3 0.04 195); --no: oklch(0.55 0.01 78); --sombra: oklch(0 0 0 / 0.4); --velo: oklch(0 0 0 / 0.7);
  --naranja: oklch(0.74 0.17 55); --naranja-f: oklch(0.62 0.16 48); --naranja-t: oklch(0.32 0.06 55); --foco: oklch(0 0 0 / 0.45); color-scheme: dark; } }
:root[data-theme="dark"] {
  --fondo: oklch(0.2 0.008 78); --hoja: oklch(0.245 0.01 78); --arena: oklch(0.3 0.02 76); --arena-b: oklch(0.36 0.022 76); --borde: oklch(0.34 0.01 78);
  --t1: oklch(0.94 0.006 78); --t2: oklch(0.78 0.01 78); --t3: oklch(0.66 0.01 78); --marca: oklch(0.7 0.1 195); --marca-tx: oklch(0.78 0.09 195);
  --marca-t: oklch(0.3 0.04 195); --no: oklch(0.55 0.01 78); --sombra: oklch(0 0 0 / 0.4); --velo: oklch(0 0 0 / 0.7);
  --naranja: oklch(0.74 0.17 55); --naranja-f: oklch(0.62 0.16 48); --naranja-t: oklch(0.32 0.06 55); --foco: oklch(0 0 0 / 0.45); color-scheme: dark; }
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
/* Recorridos guiados: tarjetas por etapa y el reproductor a pantalla completa. */
.botones { display: flex; flex-wrap: wrap; gap: 10px; }
.boton.sec { background: var(--hoja); color: var(--marca-tx); border: 1px solid var(--arena-b); }
.rec-et { display: grid; gap: 10px; margin-top: 8px; }
.rec-et h3 { font-size: 15px; font-weight: 700; color: var(--t2); }
.rec-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 14px; }
.rec-card { display: grid; gap: 6px; align-content: start; padding: 10px 10px 14px; border: 1px solid var(--borde); border-radius: 12px; background: var(--hoja); color: inherit; font: inherit; text-align: left; cursor: pointer; }
.rec-card:hover { border-color: var(--marca); }
.rec-card img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: left top; border-radius: 8px; border: 1px solid var(--borde); }
.rec-card .t { font-size: 15px; font-weight: 700; margin-top: 4px; }
.rec-card .d { font-size: 12.5px; color: var(--t3); }
.rec-card .r { font-size: 13.5px; color: var(--t2); }
dialog.rp { width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; border-radius: 0; background: var(--fondo); }
dialog.rp[open] { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr); }
.rp-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; padding: 10px 16px; background: var(--hoja); border-bottom: 1px solid var(--borde); }
.rp-izq { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rp-ojo { font-size: 12px; font-weight: 700; color: var(--marca-tx); letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }
.rp-izq select { height: 34px; max-width: 280px; border: 1px solid var(--arena-b); border-radius: 8px; background: var(--hoja); color: var(--t1); font: inherit; font-weight: 600; padding: 0 8px; }
.rp-etapas { display: flex; gap: 4px; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: thin; }
.rp-etapas button { flex-shrink: 0; height: 30px; padding: 0 12px; border: 1px solid var(--borde); border-radius: 999px; background: var(--hoja); color: var(--t2); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.rp-etapas button[aria-selected="true"] { background: var(--marca-t); border-color: var(--marca); color: var(--marca-tx); font-weight: 600; }
.rp-der { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.rp-cuenta { font-size: 13px; color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; margin-right: 4px; }
.rp-b { height: 34px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--arena-b); background: var(--hoja); color: var(--t1); font: inherit; font-weight: 600; cursor: pointer; white-space: nowrap; }
.rp-b.pri { background: var(--marca); border-color: var(--marca); color: oklch(1 0 0); }
.rp-b:disabled { opacity: 0.45; cursor: default; }
.rp-izq { order: 0; } .rp-der { order: 2; } .rp-x { order: 3; } .rp-etapas { order: 4; flex-basis: 100%; }
.rp-x { width: 34px; height: 34px; border: 0; border-radius: 8px; background: transparent; color: var(--t2); font-size: 18px; cursor: pointer; }
.rp-prog { display: flex; gap: 3px; padding: 0 16px; background: var(--hoja); padding-bottom: 10px; }
.rp-prog span { flex: 1; height: 4px; border-radius: 2px; background: var(--borde); }
.rp-prog span.hecho { background: var(--marca); }
.rp-prog span.ahora { background: var(--naranja); }
.rp-cuerpo { display: grid; grid-template-columns: minmax(0, 1fr) 380px; min-height: 0; }
.rp-escena { min-width: 0; min-height: 0; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 20px; }
.rp-lienzo { position: relative; display: inline-block; line-height: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 12px 40px var(--sombra); background: var(--hoja); }
.rp-lienzo img { display: block; max-width: 100%; max-height: calc(100dvh - 150px); width: auto; height: auto; }
.rp-lienzo.tel { border-radius: 22px; }
.rp-toque { position: absolute; border: 3px solid var(--naranja); border-radius: 10px; background: transparent; box-shadow: 0 0 0 9999px var(--foco); cursor: pointer; padding: 0; }
.rp-toque[hidden] { display: none !important; }
.rp-et { position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(100% + 8px); background: var(--naranja-f); color: oklch(1 0 0); font-size: 13px; font-weight: 700; line-height: 1.2; padding: 6px 10px; border-radius: 8px; white-space: nowrap; box-shadow: 0 4px 12px var(--sombra); }
.rp-toque.abajo .rp-et { bottom: auto; top: calc(100% + 8px); }
.rp-toque.al-iz .rp-et { left: 0; transform: none; }
.rp-toque.al-de .rp-et { left: auto; right: 0; transform: none; }
@media (prefers-reduced-motion: no-preference) { .rp-toque { animation: rp-pulso 1.6s ease-in-out infinite; } }
@keyframes rp-pulso { 50% { border-color: var(--naranja-f); } }
.rp-panel { min-height: 0; overflow: auto; background: var(--hoja); border-left: 1px solid var(--borde); padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.rp-paso { font-size: 12px; font-weight: 700; color: var(--marca-tx); letter-spacing: 0.05em; text-transform: uppercase; }
.rp-actor { display: inline-flex; width: fit-content; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: var(--arena); color: var(--t1); font-size: 13px; font-weight: 500; }
.rp-panel h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.015em; }
.rp-panel #rp-texto { color: var(--t2); font-size: 15px; line-height: 1.55; }
.rp-como { border-left: 3px solid var(--naranja); background: var(--naranja-t); border-radius: 0 8px 8px 0; padding: 10px 12px; display: grid; gap: 2px; }
.rp-como span { font-size: 11.5px; font-weight: 700; color: var(--t3); letter-spacing: 0.05em; text-transform: uppercase; }
.rp-como p { font-weight: 600; }
.rp-lista { list-style: none; margin: 8px 0 0; padding: 12px 0 0; border-top: 1px solid var(--borde); display: grid; gap: 2px; }
.rp-lista button { width: 100%; display: flex; align-items: center; gap: 10px; padding: 7px 8px; border: 0; border-radius: 8px; background: transparent; color: var(--t2); font: inherit; font-size: 13.5px; text-align: left; cursor: pointer; }
.rp-lista button .n { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: var(--arena); color: var(--t2); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.rp-lista button.hecho .n { background: var(--marca-t); color: var(--marca-tx); }
.rp-lista button[aria-current="step"] { background: var(--marca-t); color: var(--t1); font-weight: 600; }
.rp-lista button[aria-current="step"] .n { background: var(--marca); color: oklch(1 0 0); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 900px) {
  .rp-cuerpo { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto; overflow: auto; }
  .rp-escena { overflow: visible; }
  .rp-lienzo img { max-height: 70dvh; }
  .rp-panel { border-left: 0; border-top: 1px solid var(--borde); overflow: visible; }
  .rp-izq { flex: 1; }
  .rp-izq select { flex: 1; min-width: 0; max-width: none; }
  .rp-x { order: 1; }
  .rp-etapas { order: 2; flex-basis: 100%; }
  .rp-der { order: 3; margin-left: 0; width: 100%; flex-wrap: wrap; }
  .rp-cuenta { width: 100%; }
  .rp-der .rp-b { flex: 1; padding: 0 8px; }
}
</style>

<div class="envoltura">
  <header class="cab">
    <span class="eyebrow">Sistema visual · Multitenant</span>
    <h1>Guía del lienzo</h1>
    <p>El recorrido completo, en el orden en que una persona usa el sistema: llega al sitio, entra, ve su perfil, registra su empresa, arma su equipo, la administra, atiende por WhatsApp y, aparte, lo que usan los operadores de la plataforma. Cada pantalla tiene la compu, el teléfono, lo que se abre desde ahí y sus estados. Tocá una captura para verla grande; para usarla con Play, abrí el lienzo.</p>
    <div class="datos"><span><b>@PANTALLAS@</b> pantallas</span><span><b>@TABLEROS@</b> tableros</span><span><b>@PROGRAMADAS@</b> pantallas ya programadas</span><span>Lienzo @VERSION@</span></div>
    <div class="leyenda"><span class="cod ok">Programada</span><span class="cod parte">Programada en parte</span><span class="cod no">Falta programar</span><span class="cod ref">De referencia</span></div>
    <div class="botones"><a class="boton" href="@URL@" target="_blank" rel="noopener">Abrir el lienzo</a>@BOTON_REC@</div>
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
<dialog id="rp" class="rp" aria-labelledby="rp-titulo">
  <div class="rp-barra">
    <div class="rp-izq"><span class="rp-ojo">Recorrido</span><label class="sr" for="rp-sel">Elegir el recorrido</label><select id="rp-sel"></select></div>
    <div class="rp-etapas" role="tablist" aria-label="Etapas" id="rp-etapas"></div>
    <div class="rp-der"><span class="rp-cuenta" id="rp-cuenta" aria-live="polite"></span>
      <button type="button" class="rp-b" id="rp-ant">Anterior</button>
      <button type="button" class="rp-b" id="rp-play" aria-pressed="false">Reproducir</button>
      <button type="button" class="rp-b pri" id="rp-sig">Siguiente</button></div>
    <button type="button" class="rp-x" id="rp-x" aria-label="Cerrar el recorrido">✕</button>
  </div>
  <div class="rp-prog" id="rp-prog" aria-hidden="true"></div>
  <div class="rp-cuerpo">
    <div class="rp-escena"><div class="rp-lienzo" id="rp-lienzo"><img id="rp-img" alt=""><button type="button" class="rp-toque" id="rp-toque"><span class="rp-et">Tocá para seguir</span></button></div></div>
    <aside class="rp-panel"><span class="rp-paso" id="rp-paso"></span><span class="rp-actor" id="rp-actor"></span><h2 id="rp-titulo"></h2><p id="rp-texto"></p>
      <div class="rp-como"><span>Cómo seguir</span><p id="rp-avanzar"></p></div><ol class="rp-lista" id="rp-lista" aria-label="Pasos del recorrido"></ol></aside>
  </div>
</dialog>
<script>
(function () {
  // Los recorridos guiados: los datos salen de docs/design/recorridos/*.json y las capturas, de capturar-recorridos.mjs.
  var REC = @DATOS_REC@;
  if (!REC.recorridos.length) return;
  var $ = function (id) { return document.getElementById(id); };
  var d = $('rp'), img = $('rp-img'), toque = $('rp-toque'), lienzo = $('rp-lienzo');
  var TODO = 'La historia completa';
  var st = { etapa: REC.etapas[0], rec: 0, i: 0 }, timer = null;
  function enEtapa() { return st.etapa === TODO ? REC.recorridos : REC.recorridos.filter(function (r) { return r.etapa === st.etapa; }); }
  // La secuencia: los pasos del recorrido elegido o, en «La historia completa», los de todos, uno detrás del otro.
  function seq() {
    var out = [], lista = st.etapa === TODO ? REC.recorridos : [REC.recorridos[st.rec]];
    lista.forEach(function (r) { r.pasos.forEach(function (p, k) { out.push({ r: r, p: p, k: k }); }); });
    return out;
  }
  function siguienteRecorrido() {
    if (st.etapa === TODO) return null;
    var lista = enEtapa();
    return lista[lista.indexOf(REC.recorridos[st.rec]) + 1] || null;
  }
  function render() {
    var s = seq(), x = s[st.i], r = x.r, p = x.p, base = st.i - x.k;
    st.rec = REC.recorridos.indexOf(r);
    img.src = p.img;
    img.alt = r.titulo + ', paso ' + (x.k + 1) + ': ' + p.titulo;
    lienzo.classList.toggle('tel', p.tel);
    if (p.caja) {
      toque.hidden = false;
      toque.style.left = p.caja[0] + '%'; toque.style.top = p.caja[1] + '%';
      toque.style.width = p.caja[2] + '%'; toque.style.height = p.caja[3] + '%';
      var cx = p.caja[0] + p.caja[2] / 2;
      toque.classList.toggle('abajo', p.caja[1] + p.caja[3] < 85);
      toque.classList.toggle('al-iz', cx < 25);
      toque.classList.toggle('al-de', cx > 75);
      toque.setAttribute('aria-label', 'Tocá para seguir: ' + p.avanzar);
    } else toque.hidden = true;
    $('rp-paso').textContent = r.etapa + ' · Paso ' + (x.k + 1);
    $('rp-actor').textContent = p.actor;
    $('rp-titulo').textContent = p.titulo;
    $('rp-texto').textContent = p.texto;
    $('rp-avanzar').textContent = p.avanzar;
    $('rp-cuenta').textContent = 'Paso ' + (st.i + 1) + ' de ' + s.length;
    $('rp-ant').disabled = st.i === 0;
    $('rp-sig').disabled = st.i === s.length - 1 && !siguienteRecorrido();
    $('rp-prog').innerHTML = s.map(function (_, j) { return '<span class="' + (j < st.i ? 'hecho' : j === st.i ? 'ahora' : '') + '"></span>'; }).join('');
    var ol = $('rp-lista');
    ol.innerHTML = '';
    r.pasos.forEach(function (q, k) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      b.className = k < x.k ? 'hecho' : '';
      if (k === x.k) b.setAttribute('aria-current', 'step');
      b.innerHTML = '<span class="n"></span><span class="t"></span>';
      b.querySelector('.n').textContent = k + 1;
      b.querySelector('.t').textContent = q.titulo;
      b.addEventListener('click', function () { st.i = base + k; render(); });
      li.appendChild(b);
      ol.appendChild(li);
    });
    var sel = $('rp-sel');
    sel.innerHTML = '';
    enEtapa().forEach(function (q) { var o = document.createElement('option'); o.value = q.id; o.textContent = q.titulo; o.selected = q === r; sel.appendChild(o); });
    Array.prototype.forEach.call($('rp-etapas').children, function (b) { b.setAttribute('aria-selected', b.textContent === st.etapa ? 'true' : 'false'); });
    if (s[st.i + 1]) { var pre = new Image(); pre.src = s[st.i + 1].p.img; }
  }
  function sig() {
    if (st.i < seq().length - 1) { st.i++; render(); return true; }
    var n = siguienteRecorrido();
    if (n) { st.rec = REC.recorridos.indexOf(n); st.i = 0; render(); return true; }
    return false;
  }
  function ant() { if (st.i > 0) { st.i--; render(); } }
  function parar() { clearInterval(timer); timer = null; $('rp-play').textContent = 'Reproducir'; $('rp-play').setAttribute('aria-pressed', 'false'); }
  function play() {
    if (timer) { parar(); return; }
    $('rp-play').textContent = 'Pausar';
    $('rp-play').setAttribute('aria-pressed', 'true');
    timer = setInterval(function () { if (!sig()) parar(); }, 6000);
  }
  REC.etapas.concat([TODO]).forEach(function (et) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.textContent = et;
    b.addEventListener('click', function () { st.etapa = et; st.rec = REC.recorridos.indexOf(enEtapa()[0]); st.i = 0; render(); });
    $('rp-etapas').appendChild(b);
  });
  $('rp-sel').addEventListener('change', function (ev) {
    var r = REC.recorridos.filter(function (q) { return q.id === ev.target.value; })[0];
    if (st.etapa === TODO) { var s = seq(); for (var j = 0; j < s.length; j++) { if (s[j].r === r) { st.i = j; break; } } }
    else { st.rec = REC.recorridos.indexOf(r); st.i = 0; }
    render();
  });
  $('rp-sig').addEventListener('click', sig);
  $('rp-ant').addEventListener('click', ant);
  toque.addEventListener('click', sig);
  $('rp-play').addEventListener('click', play);
  $('rp-x').addEventListener('click', function () { d.close(); });
  d.addEventListener('close', parar);
  d.addEventListener('keydown', function (ev) {
    if (ev.target.tagName === 'SELECT') return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); sig(); } else if (ev.key === 'ArrowLeft') { ev.preventDefault(); ant(); }
  });
  document.addEventListener('click', function (ev) {
    var c = ev.target.closest('[data-rec]');
    if (!c) return;
    var r = REC.recorridos.filter(function (q) { return q.id === c.getAttribute('data-rec'); })[0];
    st.etapa = r.etapa; st.rec = REC.recorridos.indexOf(r); st.i = 0;
    render();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  });
})();
</script>
"""

def tableros_usados():
    return list(dict.fromkeys(t for _, _, _, ps in CAPITULOS for p in ps for t in p[5] + p[6] + p[7]))


def pasar_a_jpg():
    """Las capturas de la compu, a 1200 de ancho y calidad 72; las del teléfono, enteras y calidad 80."""
    from PIL import Image
    (SALIDA / "img" / "rec").mkdir(parents=True, exist_ok=True)
    # Las de los recorridos guiados (capturar-recorridos.mjs) van a img/rec, con la misma regla.
    for f, destino in [(f, SALIDA / "img") for f in sorted((SALIDA / "png").glob("*.png"))] + \
                      [(f, SALIDA / "img" / "rec") for f in sorted((SALIDA / "rec").glob("*.png"))]:
        im = Image.open(f).convert("RGB")
        calidad = 80
        if im.width > 1000:
            im = im.resize((1200, int(im.height * 1200 / im.width)), Image.LANCZOS)
            calidad = 72
        im.save(destino / (f.stem + ".jpg"), "JPEG", quality=calidad, optimize=True, progressive=True)


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
