"""Sitio público (Etapa 7), aprobado pantalla por pantalla desde el 2026-10-03.
- Portada → B: sin la etiqueta del héroe; después de «Dos lados separados», «Empresas en ArquitecturaBase» con buscador,
  tres empresas y «Ver todas las empresas» (lleva al directorio). «Empresas», arriba, baja a esa sección.
Cada tablero lleva `data-vuelta="1004-<tablero>"`; si ya la tiene, no se toca. Corre antes de menus_con_lineas.py,
flechita_blanca.py y lineas_menu_lateral.py."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def svg(d, w=16):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
FLECHA = svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>')
TARJETAS = """.lp-emp { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 36px; }
.lp-emp a { text-decoration: none; color: inherit; background: #fff; border: 1px solid var(--borde); border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 10px; }
.lp-emp a:hover { border-color: var(--borde2); box-shadow: 0 6px 18px oklch(0.24 0.014 78 / 0.08); }
.lp-emp .cab { display: flex; align-items: center; gap: 12px; }
.lp-emp .lg { width: 44px; height: 44px; border-radius: 12px; background: var(--marca-t); color: var(--marca-tx); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lp-emp b { font-size: 17px; font-weight: 600; }
.lp-emp p { margin: 0; color: var(--t2); font-size: 15px; line-height: 1.5; }
.lp-emp .dir { font-size: 14px; color: var(--marca-tx); font-weight: 500; }
.lp-dir-bar { display: flex; justify-content: center; gap: 12px; margin-top: 28px; }
.lp-dir-bar .bus { width: 420px; height: 44px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: var(--t3); font-size: 15px; }
.lp-todas { display: flex; justify-content: center; margin-top: 28px; }
.lp-todas a { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--marca-tx); text-decoration: none; font-size: 15px; }"""
EMPRESAS = [("GD", "Grupo Delta", "Grupo Delta y sus empresas, en un solo lugar.", "delta.plataforma.com"),
            ("OS", "Omega S.A.", "Omega S.A., en un solo lugar.", "omega.plataforma.com"),
            ("SI", "Sigma S.R.L.", "Sigma S.R.L., en un solo lugar.", "sigma.plataforma.com")]


class Tablero:
    def __init__(self, nombre):
        self.nombre = nombre
        self.ruta = PROJ / f"{nombre}.dc.html"
        self.t = self.ruta.read_text(encoding="utf-8")
        self.marca = f'data-vuelta="1004-{nombre}"'

    @property
    def hecho(self):
        return self.marca in self.t

    def rep(self, a, b, n=1):
        assert self.t.count(a) == n, (self.nombre, a[:90], self.t.count(a))
        self.t = self.t.replace(a, b)

    def guardar(self, css=""):
        self.rep("</helmet>", f"<style {self.marca}>\n{css}\n</style>\n</helmet>")
        self.ruta.write_text(self.t, encoding="utf-8")
        print("ok", self.nombre)


def portada():
    b = Tablero("Landing")
    if b.hecho:
        return
    i = b.t.index('<span cla', b.t.index('<section class="lp-hero">'))
    j = b.t.index("</span>", i) + len("</span>")
    assert "Para personas y para empresas" in b.t[i:j]
    b.t = b.t[:i] + b.t[j:]
    b.rep('<a href="#personas">Personas</a><a href="#organizaciones">Empresas</a><a href="#empezar">Cómo empezar</a>',
          '<a href="#personas">Personas</a><a href="#empezar">Cómo empezar</a><a href="#empresas">Empresas</a>')
    seccion = ('\n  <section class="lp-sec" id="empresas"><div class="lp-in">\n    <h2>Empresas en ArquitecturaBase</h2>'
               f'\n    <div class="lp-dir-bar"><span class="bus">{LUPA} Buscar una empresa</span></div>'
               '\n    <div class="lp-emp">'
               + "".join(f'<a href="Pagina-Publica.dc.html"><span class="cab"><span class="lg">{a}</span><b>{n}</b></span><p>{d}</p><span class="dir">{u}</span></a>'
                         for a, n, d, u in EMPRESAS)
               + f'</div>\n    <div class="lp-todas"><a href="Directorio.dc.html">Ver todas las empresas {FLECHA}</a></div>\n  </div></section>\n')
    ancla = '  <section class="lp-sec" id="empezar">'
    b.rep(ancla, seccion + ancla)
    b.guardar(TARJETAS)


DIRECTORIO = """.lp-nav .lp-links a.on { color: var(--marca-tx); font-weight: 600; }
.dir h1 { font-size: 30px !important; letter-spacing: -0.02em; }
.dir-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.dir-card { text-decoration: none; color: inherit; background: #fff; border: 1px solid var(--borde); border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 10px; }
.dir-card:hover { border-color: var(--borde2); box-shadow: 0 6px 18px oklch(0.24 0.014 78 / 0.08); }
.dir-card .cab { display: flex; align-items: center; gap: 12px; }
.dir-card .lg { width: 44px; height: 44px; border-radius: 12px; background: var(--marca-t); color: var(--marca-tx); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dir-card b { font-size: 17px; font-weight: 600; }
.dir-card p { margin: 0; color: var(--t2); font-size: 15px; line-height: 1.5; }
.dir-card .url { font-size: 14px; color: var(--marca-tx); font-weight: 500; }"""


def directorio():
    """Directorio → B: el encabezado de la portada con «Empresas» marcado y las empresas en tarjetas, con la paginación debajo."""
    b = Tablero("Directorio")
    if b.hecho:
        return
    nav = '<div class="lp-der"><a class="b b-gho" href="Ingreso.dc.html">Ingresá como empresa</a>'
    b.rep(nav, '<nav class="lp-links" aria-label="Secciones"><a href="Landing.dc.html#personas">Personas</a><a href="Landing.dc.html#empezar">Cómo empezar</a>'
          '<a class="on" href="Directorio.dc.html" aria-current="page">Empresas</a></nav>' + nav)
    ini = b.t.index('<div class="tarjeta">')
    fin = b.t.index("</div>\n  </div></main>")
    viejo = b.t[ini:fin]
    pie = viejo[viejo.index('<sc-if value="{{hayFilas}}"'):]
    vacios = viejo[viejo.index('<sc-if value="{{sinResultados}}"'):viejo.index('<sc-if value="{{hayFilas}}"')]
    nuevo = ('<div class="dir-grid"><sc-for list="{{filas}}" as="e" hint-placeholder-count="3"><a class="dir-card" href="Pagina-Publica.dc.html">'
             '<span class="cab"><span class="lg" aria-hidden="true">{{e.ini}}</span><b>{{e.nombre}}</b></span><p>{{e.desc}}</p><span class="url">{{e.url}}</span></a></sc-for></div>'
             '<div class="tarjeta" style="border: 0; box-shadow: none; background: transparent;">' + vacios + pie)
    b.t = b.t[:ini] + nuevo + b.t[fin:]
    b.guardar(DIRECTORIO)


PAGINA = """.pp-cta { height: 44px !important; padding: 0 22px !important; border-radius: 10px !important; font-size: 15px !important; width: 100%; }
.pp-dato { display: flex; gap: 12px; align-items: flex-start; padding: 14px 18px; border-top: 1px solid var(--borde); }
.pp-dato:first-child { border-top: 0; }
.pp-dato svg { color: var(--t3); flex-shrink: 0; margin-top: 2px; }
.pp-dato .tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pp-dato .tx span { font-size: 12.5px; color: var(--t3); }
.pp-dato .tx b, .pp-dato .tx a { font-size: 15px; font-weight: 500; color: var(--t1); text-decoration: none; overflow-wrap: anywhere; }
.pp-dato .tx a { color: var(--marca-tx); }
.pp-centro, .pp-nd { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 24px; background: radial-gradient(ellipse at 80% 0%, oklch(0.94 0.028 78), transparent 55%), var(--fondo); }
.pp-tarjeta { width: 560px; max-width: 100%; box-sizing: border-box; background: #fff; border: 1px solid var(--borde); border-radius: 20px; box-shadow: 0 16px 40px oklch(0.24 0.014 78 / 0.08); padding: 32px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; }
.pp-tarjeta .pp-logo { width: 84px; height: 84px; border-radius: 20px; font-size: 28px; margin-bottom: 10px; }
.pp-tarjeta h1 { margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; }
.pp-tarjeta .pp-desc { margin: 2px 0 14px; font-size: 16px; color: var(--t2); }
.pp-tarjeta .lista { width: 100%; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; text-align: left; }
.pp-tarjeta .lista + .pp-cta, .pp-tarjeta .lista + sc-if { margin-top: 18px; }
.pp-nd .pp-tarjeta { gap: 16px; }
.pp-nd .pp-tarjeta h1 { font-size: 24px; }"""


def pagina():
    """Página pública → B: una tarjeta centrada con el logo, el nombre, la descripción, los cuatro datos de contacto
    y «Ingresá para continuar» (sin sesión); arriba, solo la marca de la plataforma. «No disponible», en la misma tarjeta."""
    b = Tablero("Pagina-Publica")
    if b.hecho:
        return
    b.rep('<sc-if value="{{sinSesion}}" hint-placeholder-val="{{si}}"><a class="b b-sec lg" href="Ingreso.dc.html">Ingresá</a></sc-if>', "")
    ini = b.t.index('<section class="pp-cab">')
    fin = b.t.index('<main class="pp-mods"></main>') + len('<main class="pp-mods"></main>')
    cab = b.t[ini:fin]
    import re
    iconos = re.findall(r"<li>(<svg.*?</svg>)", cab, flags=re.S)
    assert len(iconos) == 4
    datos = [("Dirección", iconos[0], "Av. Corrientes 1234, piso 5, Buenos Aires", None),
             ("Teléfono", iconos[1], "011 4321-5678", "tel:+541143215678"),
             ("Correo", iconos[2], "contacto@delta.ejemplo.com", "mailto:contacto@delta.ejemplo.com"),
             ("Sitio web", iconos[3], "delta.ejemplo.com", "https://delta.ejemplo.com")]

    def dato(rotulo, icono, valor, href):
        v = f'<a href="{href}">{valor}</a>' if href else f"<b>{valor}</b>"
        return f'<div class="pp-dato">{icono}<span class="tx"><span>{rotulo}</span>{v}</span></div>'

    cuerpo = ('<main class="pp-centro"><div class="pp-tarjeta"><span class="pp-logo" aria-hidden="true">GD</span><h1>Grupo Delta</h1>'
              '<p class="pp-desc">Grupo Delta y sus empresas, en un solo lugar.</p><div class="lista">' + "".join(dato(*d) for d in datos) + "</div>"
              '<sc-if value="{{sinSesion}}" hint-placeholder-val="{{si}}"><a class="b b-pri lg pp-cta" href="Ingreso.dc.html">Ingresá para continuar</a></sc-if>'
              "</div></main>")
    b.t = b.t[:ini] + cuerpo + b.t[fin:]
    nd_ini = b.t.index('<section class="pp-nd">') + len('<section class="pp-nd">')
    nd_fin = b.t.index("</section>", nd_ini)
    b.t = b.t[:nd_ini] + '<div class="pp-tarjeta">' + b.t[nd_ini:nd_fin] + "</div>" + b.t[nd_fin:]
    b.guardar(PAGINA)


if __name__ == "__main__":
    portada()
    directorio()
    pagina()
