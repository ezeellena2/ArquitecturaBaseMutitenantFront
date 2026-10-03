"""Los teléfonos que faltaban (2026-10-03), en formato app, con los textos y los estados de su tablero de la compu:
- M-Sesion: iniciando, cambiando de lado, cerrando y «No pudimos iniciar tu sesión», como pantalla de arranque de una app;
- M-Perfil-Suspendido: suspendida, en espera o cerrada, con «Elegí otro perfil» en un grupo;
- M-Error-Org: sin permiso o no encontrada, dentro de la app, con la barra de abajo;
- M-Avisos: los avisos sobre Configuración: lo pasajero, abajo, en una franja oscura; lo que sigue, debajo de la barra de
  arriba; «Salir sin guardar», en una hoja sin ✕; «Reintentá en 0:39», en el botón fijo.
Cada teléfono se arma entero cada vez. Corre antes de menus_con_lineas.py, flechita_blanca.py y lineas_menu_lateral.py."""
import json
import pathlib
import runpy
import sys

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
sys.path.insert(0, str(GEN / "telefonos_1004"))
from app_estilo import ESTILO_X  # noqa: E402
from app_marco import I, SALIDA, barra, estado, nav, pagina, svg  # noqa: E402

ORG = runpy.run_path(str(GEN / "telefonos_1004" / "app_org.py"))  # campo, item, est, kebab y GUARDAR, como en los teléfonos de Organización
campo, item, est, kebab = ORG["campo"], ORG["item"], ORG["est"], ORG["kebab"]
APP = {"Mas": "M-WA-Menu", "Chats": "M-WA-Chats", "Contactos": "M-WA-Contactos", "Difusiones": "M-WA-Difusiones",
       "Configuracion": "M-Configuracion", "Dominio": "M-Configuracion-Dominio"}

CHEV = svg('<path d="m9 6 6 6-6 6"/>', 18, "2")
SALIR = svg('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>', 18)
IC = {
    "alerta": svg('<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', 28),
    "reloj": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 28),
    "candado": svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>', 28),
    "lupa": svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>', 28),
    "error": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>', 28),
    "ok": svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 20),
    "sinred": svg('<path d="M2 8.5a15 15 0 0 1 4-2.4"/><path d="M10 5.1A15 15 0 0 1 22 8.5"/><path d="M5 12a10 10 0 0 1 3.5-2"/><path d="M15 10.2A10 10 0 0 1 19 12"/>'
                  '<path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/><path d="m3 3 18 18"/>', 18),
    "info": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 18),
    "aviso": svg('<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', 18),
    "x": svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 18, "2"),
}

ESTILO = """<style data-vuelta="1004-faltan">
@keyframes giro { to { transform: rotate(360deg); } }
.f-centro { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0 32px; text-align: center; }
.f-centro h1 { margin: 6px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; }
.f-centro p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--t2); }
.f-marca { width: 76px; height: 76px; border-radius: 22px; }
.f-marca::after { inset: 21px !important; border-width: 5px !important; border-radius: 5px !important; }
.f-giro { width: 26px; height: 26px; box-sizing: border-box; border-radius: 50%; border: 3px solid var(--borde); border-top-color: var(--marca); animation: giro 0.9s linear infinite; margin-top: 18px; }
.f-perfil { position: relative; width: 84px; height: 84px; display: inline-flex; align-items: center; justify-content: center; }
.f-perfil .ini { width: 66px; height: 66px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); font-size: 22px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.f-perfil::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 3px solid var(--borde); border-top-color: var(--marca); animation: giro 1.1s linear infinite; }
.f-circ { width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--s3); color: var(--t2); }
.f-circ.mal { background: oklch(0.95 0.035 25); color: oklch(0.52 0.19 25); }
.f-circ.amb { background: oklch(0.96 0.05 85); color: oklch(0.5 0.12 70); }
.f-circ.azul { background: var(--marca-t); color: var(--marca-tx); }
.f-btn { height: 48px; padding: 0 26px; border-radius: 24px; margin-top: 10px; font-size: 15.5px; }
.f-arriba { padding: 64px 32px 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; flex-shrink: 0; }
.f-arriba h1 { margin: 6px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; }
.f-arriba p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--t2); }
.f-salir { margin: auto auto 40px; display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 20px; border-radius: 22px; font-size: 15.5px; font-weight: 600; color: var(--t1); text-decoration: none; }
.f-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 110px; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.f-snack .tx { flex: 1; min-width: 0; }
.f-snack .ok { color: oklch(0.78 0.14 155); display: inline-flex; }
.f-snack .mal { color: oklch(0.75 0.15 25); display: inline-flex; }
.f-snack a, .f-snack button.l { color: oklch(0.82 0.08 195); font-weight: 600; text-decoration: none; background: none; border: 0; padding: 0; font: inherit; font-weight: 600; }
.f-snack .x { color: oklch(1 0 0 / 0.7); display: inline-flex; background: none; border: 0; padding: 0; }
.f-banda { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; font-size: 14.5px; line-height: 1.4; }
.f-banda svg { flex-shrink: 0; margin-top: 1px; }
.f-banda .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.f-banda .acc { display: flex; gap: 18px; }
.f-banda .acc a { font-weight: 600; text-decoration: none; color: inherit; }
.f-banda.mal { background: oklch(0.96 0.03 25); color: oklch(0.45 0.17 25); }
.f-banda.amb { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.f-banda.azul { background: var(--marca-t); color: var(--marca-tx); align-items: center; }
.f-banda.azul .cb { height: 34px; border-radius: 17px; padding: 0 14px; background: #fff; color: var(--marca-tx); border: 0; }
.ap-bar .sub.amb { color: oklch(0.55 0.13 70); }
.ap-fijo .cb.apag { opacity: 0.45; }
.ap-fijo .cb.full { padding: 0 10px; min-width: 0; }
</style>"""


def tweak(t, prop, opciones):
    props = json.dumps({prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    vals = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    viejo = ("data-props='{\"$preview\":{\"width\":390,\"height\":844}}'>\nclass Component extends DCLogic {\n  renderVals() {\n"
             "    return { si: true, no: false };\n  }\n}")
    nuevo = ("data-props='" + props[:-1] + ",\"$preview\":{\"width\":390,\"height\":844}}'>\nclass Component extends DCLogic {\n  renderVals() {\n"
             f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n    return {{\n      si: true,\n      no: false,\n{vals}    }};\n  }}\n}}")
    assert t.count(viejo) == 1
    return t.replace(viejo, nuevo)


def estados(pantallas):
    return "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}"><div class="ap" style="position: absolute; inset: 0;">{p}</div></sc-if>'
                   for i, p in enumerate(pantallas))


def armar(nombre, titulo, prop, opciones, pantallas):
    pagina(f"T-{nombre}", estados(pantallas), ESTILO_X + "\n" + ESTILO, titulo)
    t = (SALIDA / f"T-{nombre}.dc.html").read_text(encoding="utf-8")
    t = tweak(t, prop, opciones)
    for a, b in APP.items():
        t = t.replace(f"T-App-{a}.dc.html", f"{b}.dc.html").replace(f"T-Org-{a}.dc.html", f"{b}.dc.html")
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("ok", nombre)


# ---------- Sesión ----------
def arranque(centro, pie=""):
    return estado() + f'<div class="f-centro">{centro}</div>{pie}'


MARCA = '<span class="brand f-marca" aria-hidden="true"></span>'
GIRO = '<span class="f-giro" role="progressbar" aria-label="Cargando"></span>'
SESION = ["Iniciando sesión", "Cambiando de lado: a Grupo Delta", "Cambiando de lado: a Personal", "Cerrando sesión", "No pudimos iniciar tu sesión"]
armar("M-Sesion", "Sesión · teléfono", "estado", SESION, [
    arranque(MARCA + GIRO + "<h1>Iniciando sesión…</h1><p>Esto puede tardar unos segundos.</p>"),
    arranque('<span class="f-perfil"><span class="ini">GD</span></span><h1>Cambiando a Grupo Delta…</h1>'),
    arranque('<span class="f-perfil"><span class="ini">P</span></span><h1>Cambiando a Personal…</h1>'),
    arranque(MARCA + GIRO + "<h1>Cerrando sesión…</h1>"),
    arranque(f'<span class="f-circ mal">{IC["error"]}</span><h1>No pudimos iniciar tu sesión</h1><p>Volvé a ingresar. Si vuelve a pasar, probá en otra ventana.</p>',
             '<div class="ap-fijo"><a class="cb cb-pri full" href="M-Ingreso.dc.html">Volver a ingresar</a></div>'),
])


# ---------- Organización no disponible ----------
def perfiles(con_delta=True):
    p = item("Personal", "Tu perfil personal", izq='<span class="ini">P</span>', der=f'<span class="chev">{CHEV}</span>', href="M-Inicio-Personal.dc.html")
    if con_delta:
        p += item("Grupo Delta", "Dueño", izq='<span class="ini">GD</span>', der=f'<span class="chev">{CHEV}</span>', href="M-Inicio-Org.dc.html")
    return f'<span class="ap-gtit">Elegí otro perfil</span><div class="ap-grupo">{p}</div>'


def no_disponible(clase, icono, titulo, texto, con_delta=True):
    return (estado() + f'<div class="ap-cuerpo ap-gris"><div class="f-arriba"><span class="f-circ {clase}">{IC[icono]}</span><h1>{titulo}</h1><p>{texto}</p></div>'
            + perfiles(con_delta) + f'<a class="f-salir" href="M-Ingreso.dc.html">{SALIR} Salir</a></div>')


armar("M-Perfil-Suspendido", "Organización no disponible · teléfono", "estado", ["Suspendida", "Espera aprobación", "Cerrada"], [
    no_disponible("amb", "alerta", "Beta S.R.L. está suspendida", "Nadie de la organización puede entrar por ahora. Tus otros perfiles siguen funcionando."),
    no_disponible("azul", "reloj", "Estamos revisando Grupo Delta", "Te avisamos por correo cuando esté aprobada.", con_delta=False),
    no_disponible("", "candado", "Beta S.R.L. está cerrada", "La organización ya no está disponible. Tus otros perfiles siguen funcionando."),
])


# ---------- Sin permiso o no encontrada ----------
def nav_miembro():
    return ('<nav class="ap-nav" aria-label="Secciones" style="grid-template-columns: repeat(2, 1fr);">'
            f'<a href="M-Inicio-Org.dc.html"><span class="i">{I["casa"]}</span>Inicio</a>'
            '<a href="M-WA-Menu.dc.html"><span class="i"><span class="yo">V</span></span>Más</a></nav>')


def error(titulo_bar, icono, titulo, barra_abajo):
    return (estado() + barra(titulo_bar, "Grupo Delta", volver="M-Inicio-Org.dc.html")
            + f'<div class="f-centro"><span class="f-circ">{IC[icono]}</span><h1>{titulo}</h1><a class="cb cb-pri f-btn" href="M-Inicio-Org.dc.html">Ir al inicio</a></div>'
            + barra_abajo)


armar("M-Error-Org", "Sin permiso o no encontrada · teléfono", "caso", ["Sin permiso (403)", "No encontrada (404)"], [
    error("Auditoría", "candado", "No tenés permiso para ver esta página", nav_miembro()),
    error("Auditoría", "lupa", "No encontramos esta página", nav_miembro()),
])


# ---------- Avisos del sistema (sobre Configuración) ----------
VERIFICADO = item("delta.ejemplo.com", est("", "Verificado") + " · 10 correos administrados por Grupo Delta", der=kebab("delta.ejemplo.com"))


def config(sub="Administración", banda="", fijo=None, encima=""):
    s = f'<span class="amb">{sub}</span>' if sub != "Administración" else sub
    b = barra("Configuración", s, volver="T-App-Mas.dc.html").replace('<span class="sub"><span class="amb">', '<span class="sub amb"><span>')
    fijo = fijo or ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>'
                    f'<button type="button" class="cb cb-pri full{" apag" if sub == "Administración" else ""}">Guardar cambios</button></div>')
    return (estado() + b + banda
            + '<div class="ap-cuerpo" style="padding: 14px 20px 0; gap: 14px;">'
            + campo("Nombre de la organización", "Grupo Delta") + campo("Idioma y región predeterminados", "Español (Argentina)", req=False, flecha=True)
            + campo("Zona horaria predeterminada", "Córdoba (GMT−3)" if sub != "Administración" else "Buenos Aires (GMT−3)", req=False, flecha=True)
            + campo("Moneda predeterminada", "Peso argentino (ARS)", req=False, flecha=True)
            + '<span class="ap-gtit" style="margin: 6px 0 -6px;">Dominio de correo<a href="T-Org-Dominio.dc.html">Agregar dominio</a></span>'
            + f'<div class="ap-grupo" style="margin: 0;">{VERIFICADO}</div></div>' + fijo + encima)


def snack(icono, clase, texto, extra=""):
    return f'<div class="f-snack" role="status"><span class="{clase}">{IC[icono]}</span><span class="tx">{texto}</span>{extra}</div>'


CAMBIOS = "Cambios sin guardar"
CERRAR = f'<button type="button" class="x" aria-label="Cerrar">{IC["x"]}</button>'
SALIR_SIN = ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="¿Salir sin guardar?"><span class="asa"></span>'
             '<div class="hc" style="padding-right: 20px;"><h2>¿Salir sin guardar?</h2></div>'
             '<div class="hb"><p class="ap-txt-l">Se pierde lo que cambiaste acá.</p></div>'
             '<div class="hp"><button type="button" class="cb cb-sec">Seguir editando</button>'
             '<button type="button" class="cb cb-pel" style="background: var(--peligro); color: #fff; border-color: var(--peligro);">Salir sin guardar</button></div></div>')
AVISOS = ["Guardado", "Sin conexión", "Error del servidor", "Demasiados pedidos", "Demasiados pedidos sin botón", "Alguien cambió esto",
          "Salir sin guardar", "Versión nueva", "Módulo apagado"]
armar("M-Avisos", "Avisos del sistema · teléfono", "caso", AVISOS, [
    config(encima=snack("ok", "ok", "Guardamos la configuración.")),
    config(CAMBIOS, banda=f'<div class="f-banda mal" role="status">{IC["sinred"]}<span class="tx">Sin conexión</span></div>'),
    config(CAMBIOS, encima=snack("error", "mal", "Algo salió mal. Probá de nuevo en un rato.", '<button type="button" class="l">Copiar código</button>' + CERRAR)),
    config(CAMBIOS, fijo='<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>'
                         '<button type="button" class="cb cb-pri full apag">Reintentá en 0:39</button></div>'),
    config(CAMBIOS, encima=snack("error", "mal", "Hiciste muchos pedidos seguidos. Probá de nuevo en unos segundos.", CERRAR)),
    config(CAMBIOS, banda=f'<div class="f-banda amb" role="alert">{IC["aviso"]}<span class="tx">Otra persona cambió esto mientras lo editabas.'
                          '<span class="acc"><a href="#">Seguir editando</a><a href="#">Ver lo nuevo</a></span></span></div>'),
    config(CAMBIOS, encima=SALIR_SIN),
    config(banda=f'<div class="f-banda azul" role="status">{IC["info"]}<span class="tx">Hay una versión nueva</span><button type="button" class="cb">Actualizar</button></div>'),
    error("WhatsApp", "lupa", "No encontramos esta página", nav("mas")).replace("Grupo Delta</span>", "Administración</span>", 1),
])

PANTALLAS = [("M-Sesion", "Sesión · teléfono", "ingreso", 3760, 2300),
             ("M-Perfil-Suspendido", "Organización no disponible · teléfono", "ingreso", 4230, 2300),
             ("M-Error-Org", "Sin permiso o no encontrada · teléfono", "org", 4700, 3320),
             ("M-Avisos", "Avisos del sistema · teléfono", "org", 5170, 3320)]


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for nombre, titulo, pagina_, x, y in PANTALLAS:
        clave = f"{nombre}.dc.html"
        datos = {"h": 844, "is_interactive": True, "page": pagina_, "title": titulo, "w": 390, "x": x, "y": y}
        if clave in c["boards"]:
            c["boards"][clave].update(datos)
        else:
            c["boards"][clave] = datos
            c["order"].append(clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8", newline="")


if __name__ == "__main__":
    lienzo()
