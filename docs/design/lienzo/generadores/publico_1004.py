"""Sitio público (Etapa 7), aprobado pantalla por pantalla desde el 2026-10-03.
- Portada → B: sin la etiqueta del héroe; después de «Dos lados separados», «Empresas en ArquitecturaBase» con buscador,
  tres empresas y «Ver todas las empresas» (lleva al directorio). «Empresas», arriba, baja a esa sección.
- Directorio (`/empresas`) → B: tarjetas. Página pública → B: una tarjeta centrada, con sus tres estados.
- Teléfonos → web, no app (se abren desde un enlace y no tienen sesión): la portada en una columna con ☰.
Cada tablero lleva `data-vuelta="1004-<tablero>"`; si ya la tiene, no se toca. Corre antes de menus_con_lineas.py,
flechita_blanca.py y lineas_menu_lateral.py."""
import pathlib
import re
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
.dir-card .url { font-size: 14px; color: var(--marca-tx); font-weight: 500; }
.dir .tarjeta { box-shadow: none !important; }"""


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


def tarjeta_pagina(b, ingresa, ingreso):
    """Cambia la cabecera de la página pública por la tarjeta centrada y mete «No disponible» en la misma tarjeta."""
    b.rep(f'<sc-if value="{{{{sinSesion}}}}" hint-placeholder-val="{{{{si}}}}">{ingresa}</sc-if>', "")
    ini = b.t.index('<section class="pp-cab">')
    fin = b.t.index('<main class="pp-mods"></main>') + len('<main class="pp-mods"></main>')
    cab = b.t[ini:fin]
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
              '<sc-if value="{{sinSesion}}" hint-placeholder-val="{{si}}"><a class="b b-pri lg pp-cta" href="' + ingreso + '">Ingresá para continuar</a></sc-if>'
              "</div></main>")
    b.t = b.t[:ini] + cuerpo + b.t[fin:]
    nd_ini = b.t.index('<section class="pp-nd">') + len('<section class="pp-nd">')
    nd_fin = b.t.index("</section>", nd_ini)
    b.t = b.t[:nd_ini] + '<div class="pp-tarjeta">' + b.t[nd_ini:nd_fin] + "</div>" + b.t[nd_fin:]


def pagina():
    """Página pública → B: una tarjeta centrada con el logo, el nombre, la descripción, los cuatro datos de contacto
    y «Ingresá para continuar» (sin sesión); arriba, solo la marca de la plataforma. «No disponible», en la misma tarjeta."""
    b = Tablero("Pagina-Publica")
    if b.hecho:
        return
    tarjeta_pagina(b, '<a class="b b-sec lg" href="Ingreso.dc.html">Ingresá</a>', "Ingreso.dc.html")
    b.guardar(PAGINA)


HAMB = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>')
PORTADA_MOVIL = """.lpm .lp-dir-bar { margin-top: 20px; }
.lpm .lp-dir-bar .bus { width: 100%; }
.lpm .lp-emp { grid-template-columns: 1fr; gap: 12px; margin-top: 16px; }
.lpm .lp-emp a { padding: 16px; gap: 8px; }
.lpm .lp-emp b { font-size: 16px; }
.lpm .lp-emp p { font-size: 14.5px; }
.lpm .lp-todas { margin-top: 20px; }
.lpm .lp-nav { position: relative; }
.lpm .lp-der { align-items: center; }
.lpm .hamb { width: 40px; height: 40px; border: 0; border-radius: 10px; background: transparent; color: var(--t1); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; margin-right: -8px; }
.lpm .hamb:hover, .lpm .hamb[aria-expanded="true"] { background: var(--s3); }
.lpm .m-menu { position: absolute; z-index: 20; left: 0; right: 0; top: 60px; background: #fff; border-bottom: 1px solid var(--borde); box-shadow: 0 16px 28px oklch(0.24 0.014 78 / 0.12); display: flex; flex-direction: column; }
.lpm .m-menu a { display: flex; align-items: center; min-height: 52px; padding: 0 20px; font-size: 16px; font-weight: 500; color: var(--t1); text-decoration: none; border-top: 1px solid var(--borde); }
.lpm .m-menu a.sec { color: var(--marca-tx); font-weight: 600; }"""


def portada_movil():
    """Portada en el teléfono → A: web (se abre desde un enlace, sin marco de app). Arriba, la marca, «Ingresar» y ☰
    (Personas, Cómo empezar, Empresas e «Ingresá como empresa»); lo mismo que la portada B, en una columna."""
    b = Tablero("Landing-Movil")
    if b.hecho:
        return
    i = b.t.index('<span class="lp-kicker">')
    j = b.t.index("</span>", i) + len("</span>")
    b.t = b.t[:i] + b.t[j:]
    b.rep('<div class="lp-der"><a class="b b-gho b-sm" href="M-Ingreso.dc.html" style="height: 36px;" aria-label="Ingresá como empresa">Empresas</a>'
          '<a class="b b-pri b-sm" href="M-Ingreso.dc.html" style="height: 36px;">Ingresar</a></div>',
          '<div class="lp-der"><a class="b b-pri b-sm" href="M-Ingreso.dc.html" style="height: 36px;">Ingresar</a>'
          f'<button type="button" class="hamb" aria-label="Abrir el menú" aria-expanded="{{{{expMas}}}}" onClick="{{{{alternarMas}}}}">{HAMB}</button></div>'
          '\n    <sc-if value="{{abiertoMas}}" hint-placeholder-val="{{no}}"><nav class="m-menu" aria-label="Secciones">'
          '<a href="#personas">Personas</a><a href="#empezar">Cómo empezar</a><a href="#empresas">Empresas</a>'
          '<a class="sec" href="M-Ingreso.dc.html">Ingresá como empresa</a></nav></sc-if>')
    seccion = ('\n  <section class="lp-sec" id="empresas"><div class="lp-in">\n    <h2>Empresas en ArquitecturaBase</h2>'
               f'\n    <div class="lp-dir-bar"><span class="bus">{LUPA} Buscar una empresa</span></div>'
               '\n    <div class="lp-emp">'
               + "".join(f'<a href="M-Pagina-Publica.dc.html"><span class="cab"><span class="lg">{a}</span><b>{n}</b></span><p>{d}</p><span class="dir">{u}</span></a>'
                         for a, n, d, u in EMPRESAS)
               + f'</div>\n    <div class="lp-todas"><a href="M-Directorio.dc.html">Ver todas las empresas {FLECHA}</a></div>\n  </div></section>\n')
    ancla = '  <section class="lp-sec" id="empezar">'
    b.rep(ancla, seccion + ancla)
    b.rep('"$preview":{"width":390,"height":2920}', '"$preview":{"width":390,"height":3600}')
    b.guardar(TARJETAS + "\n" + PORTADA_MOVIL)


def menu_movil(inicio, empresas_on):
    """☰ del sitio público en el teléfono: Personas, Cómo empezar, Empresas e «Ingresá como empresa»."""
    emp = ('<a class="on" href="M-Directorio.dc.html" aria-current="page">Empresas</a>' if empresas_on
           else f'<a href="{inicio}#empresas">Empresas</a>')
    return ('<div class="lp-der"><a class="b b-pri b-sm" href="M-Ingreso.dc.html" style="height: 36px;">Ingresar</a>'
            f'<button type="button" class="hamb" aria-label="Abrir el menú" aria-expanded="{{{{expMas}}}}" onClick="{{{{alternarMas}}}}">{HAMB}</button></div>'
            '\n    <sc-if value="{{abiertoMas}}" hint-placeholder-val="{{no}}"><nav class="m-menu" aria-label="Secciones">'
            f'<a href="{inicio}#personas">Personas</a><a href="{inicio}#empezar">Cómo empezar</a>{emp}'
            '<a class="sec" href="M-Ingreso.dc.html">Ingresá como empresa</a></nav></sc-if>')


MENU_MOVIL = """.m .lp-nav { position: relative; }
.m .lp-der { align-items: center; }
.m .hamb { width: 40px; height: 40px; border: 0; border-radius: 10px; background: transparent; color: var(--t1); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; margin-right: -8px; }
.m .hamb:hover, .m .hamb[aria-expanded="true"] { background: var(--s3); }
.m .m-menu { position: absolute; z-index: 20; left: 0; right: 0; top: 60px; background: #fff; border-bottom: 1px solid var(--borde); box-shadow: 0 16px 28px oklch(0.24 0.014 78 / 0.12); display: flex; flex-direction: column; }
.m .m-menu a { display: flex; align-items: center; min-height: 52px; padding: 0 20px; font-size: 16px; font-weight: 500; color: var(--t1); text-decoration: none; border-top: 1px solid var(--borde); }
.m .m-menu a.on { color: var(--marca-tx); font-weight: 600; background: var(--marca-t); }
.m .m-menu a.sec { color: var(--marca-tx); font-weight: 600; }"""
DIRECTORIO_MOVIL = DIRECTORIO.replace(".dir-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }",
                                      ".dir-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }") + """
.pp.m .dir { padding: 24px 0; }
.pp.m .dir h1 { font-size: 26px !important; }
.pp.m .dir .fb { padding: 0; border: 0; box-shadow: none !important; background: transparent; }
.pp.m .dir .fb-bus { flex: 1 1 auto; max-width: none; }
.pp.m .dir .fb-bus input { height: 44px; font-size: 15px; border-radius: 12px; background: #fff; padding-left: 38px; }
.pp.m .dir-card { padding: 16px; gap: 8px; }
.pp.m .dir-card b { font-size: 16px; }
.pp.m .dir-card p { font-size: 14.5px; }
.pp.m .dir .pie { padding: 4px 0; }"""


def directorio_movil():
    """Directorio en el teléfono: web, con el ☰ de la portada (Empresas marcado) y las empresas en tarjetas, una debajo de otra."""
    b = Tablero("M-Directorio")
    if b.hecho:
        return
    b.rep('<div class="lp-der"><a class="b b-gho b-sm" href="M-Ingreso.dc.html" style="height: 36px;" aria-label="Ingresá como empresa">Empresas</a>'
          '<a class="b b-pri b-sm" href="M-Ingreso.dc.html" style="height: 36px;">Ingresar</a></div>', menu_movil("Landing-Movil.dc.html", True))
    ini = b.t.index('<div class="tarjeta">')
    fin = b.t.index("</div>\n  </div></main>")
    viejo = b.t[ini:fin]
    pie = viejo[viejo.index('<sc-if value="{{hayFilas}}"'):]
    vacios = viejo[viejo.index('<sc-if value="{{sinResultados}}"'):viejo.index('<sc-if value="{{hayFilas}}"')]
    nuevo = ('<div class="dir-grid"><sc-for list="{{filas}}" as="e" hint-placeholder-count="3"><a class="dir-card" href="M-Pagina-Publica.dc.html">'
             '<span class="cab"><span class="lg" aria-hidden="true">{{e.ini}}</span><b>{{e.nombre}}</b></span><p>{{e.desc}}</p><span class="url">{{e.url}}</span></a></sc-for></div>'
             '<div class="tarjeta" style="border: 0; box-shadow: none; background: transparent;">' + vacios + pie)
    b.t = b.t[:ini] + nuevo + b.t[fin:]
    b.rep("      cerrarMenus: () => this.setState({ abierto: null }),\n",
          "      cerrarMenus: () => this.setState({ abierto: null }),\n"
          "      abiertoMas: s.abierto === 'mas',\n      expMas: s.abierto === 'mas' ? 'true' : 'false',\n      alternarMas: () => this.alternarMenu('mas'),\n")
    b.guardar(DIRECTORIO_MOVIL + "\n" + MENU_MOVIL)


PAGINA_MOVIL = PAGINA + """
.pp.m .pp-centro, .pp.m .pp-nd { padding: 20px 16px; }
.pp.m .pp-tarjeta { padding: 24px 18px 20px; border-radius: 18px; box-shadow: 0 10px 28px oklch(0.24 0.014 78 / 0.08); }
.pp.m .pp-tarjeta .pp-logo { width: 72px; height: 72px; border-radius: 18px; font-size: 24px; margin-bottom: 8px; }
.pp.m .pp-tarjeta h1 { font-size: 26px; }
.pp.m .pp-tarjeta .pp-desc { margin-bottom: 12px; font-size: 15px; }
.pp.m .pp-dato { padding: 12px 14px; }
.pp.m .pp-cta { height: 48px !important; border-radius: 12px !important; }
.pp.m .pp-nd .pp-tarjeta h1 { font-size: 22px; }"""


def pagina_movil():
    """Página pública en el teléfono: la misma tarjeta de la compu (B), con sus tres estados, sobre el fondo de la página."""
    b = Tablero("M-Pagina-Publica")
    if b.hecho:
        return
    tarjeta_pagina(b, '<a class="b b-sec" href="M-Ingreso.dc.html">Ingresá</a>', "M-Ingreso.dc.html")
    b.guardar(PAGINA_MOVIL)


if __name__ == "__main__":
    portada()
    directorio()
    pagina()
    portada_movil()
    directorio_movil()
    pagina_movil()
