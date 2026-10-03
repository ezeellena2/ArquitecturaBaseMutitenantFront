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


if __name__ == "__main__":
    portada()
