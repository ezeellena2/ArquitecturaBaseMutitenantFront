"""Mi cuenta › WhatsApp en el teléfono (Etapa 8), en formato app, con los estados aprobados en la compu el 2026-10-03:
- M-Cuenta: con o sin el módulo de WhatsApp;
- M-Cuenta-Agregar: «WhatsApp» con país y número, la hoja para elegir el país y los errores (país que WhatsApp no habilita,
  número de otra cuenta); sin el módulo, solo el correo;
- M-Cuenta-Verificar: el código por WhatsApp, con «Reenviar», y los errores (incorrecto y vencido);
- M-Cuenta-Metodo (nuevo): el ⋮ del WhatsApp como hoja de acciones y las confirmaciones con el código a otro método.
Rehace esos teléfonos encima de los de plat_personal_telefonos_1004.py: corre después de él y antes de las reglas finales."""
import json
import pathlib
import re
import runpy
import sys

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
T = GEN / "telefonos_1004"
sys.path.insert(0, str(T))
from app_estilo import ESTILO_X  # noqa: E402
from app_marco import SALIDA, hoja, pagina, svg  # noqa: E402

P = runpy.run_path(str(T / "app_plat_personal.py"))  # CUENTA, campo, item, est, kebab, BOTONES, COD y ESTILO, como los aprobados
CUENTA, campo, item, est, kebab, BOTONES, COD = (P[k] for k in ("CUENTA", "campo", "item", "est", "kebab", "BOTONES", "COD"))
NOMBRES = {"Per-Cuenta": "M-Cuenta", "Per-Agregar": "M-Cuenta-Agregar", "Per-Verificar": "M-Cuenta-Verificar", "Per-Baja": "M-Cuenta-Baja",
           "Per-Mas": "M-Mas-Personal", "Per-Inicio": "M-Inicio-Personal"}
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 18, "2")
LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>', 18)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, "2.4")
TEL = "011 15-•••••-4521"
NOTA = '<p class="ap-nwa">Llega al WhatsApp de tu celular. En WhatsApp Web no se muestra.</p>'

ESTILO = """<style data-vuelta="1004-cuenta-wa">
.ap-tel { display: grid; grid-template-columns: 124px minmax(0, 1fr); gap: 8px; }
.ap-tel .ct { white-space: nowrap; }
.ap-cmp .ct.mal { border-color: var(--peligro); box-shadow: 0 0 0 3px oklch(0.57 0.2 25 / 0.12); }
.ap-err { font-size: 13.5px; color: var(--peligro); margin: -2px 0 0; }
.ap-nwa { font-size: 13px; color: var(--t3); margin: 0; line-height: 1.45; }
.ap-cod6.mal span { border-color: var(--peligro); }
.ap-reenv { align-self: center; font-size: 15px; font-weight: 600; color: var(--marca-tx); background: none; border: 0; padding: 4px 8px; }
.ap-reenv.apag { color: var(--t3); }
.ap-bus { display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; border-radius: 12px; background: var(--s3); color: var(--t3); font-size: 15.5px; }
.ap-pais { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 4px; font-size: 16px; color: var(--marca-tx); font-weight: 500; }
.ap-pais .c { margin-left: auto; color: var(--t2); font-weight: 400; }
.ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }
.ap-acciones span { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); }
.ap-acciones span:first-child { border-top: 0; }
.ap-acciones .sep { min-height: 8px; padding: 0; background: var(--s2); }
.ap-acciones .pel { color: var(--peligro); }
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


def armar(nombre, titulo, prop, opciones, pantallas):
    cuerpo = "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}"><div class="ap" style="position: absolute; inset: 0;">{p}</div></sc-if>'
                     for i, p in enumerate(pantallas))
    pagina(f"T-{nombre}", cuerpo, ESTILO_X + "\n" + P["ESTILO"] + "\n" + ESTILO, titulo)
    t = (SALIDA / f"T-{nombre}.dc.html").read_text(encoding="utf-8")
    t = tweak(t, prop, opciones)
    t = re.sub(r"T-(Per-\w+)\.dc\.html", lambda m: f"{NOMBRES[m.group(1)]}.dc.html", t)
    assert "T-Per-" not in t and "T-App-" not in t, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("ok", nombre)


# Mi cuenta sin el módulo: ni la fila del teléfono ni «teléfono» en la acción.
FILA_TEL = item("011 15-5555-4521", est("amb", "Sin verificar"), der='<a class="acc-t" href="T-Per-Verificar.dc.html" style="text-decoration: none;">Verificar</a>')
assert CUENTA.count(FILA_TEL) == 1
SIN = CUENTA.replace(FILA_TEL, "").replace(">Agregar correo o teléfono</a>", ">Agregar correo</a>")


def tel(numero="11 5555-4521", error=""):
    err = f'<p class="ap-err" role="alert">{error}</p>' if error else ""
    return (f'<div class="ap-cmp"><span class="rt"><span>Número de WhatsApp</span></span><div class="ap-tel"><div class="ct" aria-label="País: Argentina">AR +54{ABAJO}</div>'
            f'<div class="ct{" mal" if error else ""}">{numero}</div></div></div>{err}')


SEG_WA = '<div class="ap-seg2"><span>Correo</span><span class="on">WhatsApp</span></div>'
SEG_CORREO = '<div class="ap-seg2"><span class="on">Correo</span><span>WhatsApp</span></div>'
ENVIAR = BOTONES("Cancelar", "Enviar código")
AGREGAR = "Agregar correo o teléfono"

armar("M-Cuenta", "Mi cuenta · teléfono", "whatsapp", ["Con el módulo de WhatsApp", "Sin el módulo de WhatsApp"], [CUENTA, SIN])
armar("M-Cuenta-Agregar", "Mi cuenta · agregar correo o teléfono · teléfono", "estado",
      ["Correo", "WhatsApp", "WhatsApp: elegir el país", "WhatsApp: país que WhatsApp no habilita", "WhatsApp: número de otra cuenta", "Sin el módulo de WhatsApp"], [
          CUENTA + hoja(AGREGAR, SEG_CORREO + campo("Correo", "lucia.trabajo@gmail.com", req=False), ENVIAR),
          CUENTA + hoja(AGREGAR, SEG_WA + tel(), ENVIAR),
          CUENTA + hoja("País", f'<div class="ap-bus">{LUPA} Buscar país</div><div class="ap-pais" role="option" aria-selected="true">Argentina<span class="c">+54</span>{TILDE}</div>'),
          CUENTA + hoja(AGREGAR, SEG_WA + tel("+1 415 555-0134", "Todavía no mandamos códigos a números de ese país."), ENVIAR),
          CUENTA + hoja(AGREGAR, SEG_WA + tel("11 4444-1234", "Este número ya está asociado a una cuenta."), ENVIAR),
          SIN + hoja("Agregar correo", campo("Correo", "lucia.trabajo@gmail.com", req=False), ENVIAR),
      ])

TXT = f'<p class="ap-txt-l">Te mandamos un código a <b>{TEL}</b>. Vence en 10 minutos.</p>'
COD_MAL = '<div class="ap-cod6 mal"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>0</span></div>'
ESPERA = '<span class="ap-reenv apag">Reenviar en 51 s</span>'
REENVIAR = '<button type="button" class="ap-reenv">Reenviar código</button>'
VERIF = "Verificar tu WhatsApp"
armar("M-Cuenta-Verificar", "Mi cuenta · verificar · teléfono", "estado", ["Correo", "WhatsApp", "WhatsApp: código incorrecto", "WhatsApp: código vencido"], [
    CUENTA + hoja("Verificar tu correo", '<p class="ap-txt-l">Te mandamos un código a lu•••@gmail.com.</p>' + COD, BOTONES("Cancelar", "Verificar")),
    CUENTA + hoja(VERIF, TXT + COD + NOTA + ESPERA, BOTONES("Cancelar", "Verificar")),
    CUENTA + hoja(VERIF, TXT + COD_MAL + '<p class="ap-err" role="alert">El código no es válido.</p>' + NOTA + ESPERA, BOTONES("Cancelar", "Verificar")),
    CUENTA + hoja(VERIF, TXT + COD_MAL + '<p class="ap-err" role="alert">El código venció. Pedí uno nuevo.</p>' + NOTA + REENVIAR, BOTONES("Cancelar", "Verificar")),
])

# El WhatsApp verificado, con su ⋮, y un segundo correo personal.
VERIFICADO = item("011 15-5555-4521", "", der=kebab("011 15-5555-4521"))
TRABAJO = item("lucia.trabajo@gmail.com", "", der=kebab("lucia.trabajo@gmail.com"))
METODO = CUENTA.replace(FILA_TEL, TRABAJO + VERIFICADO)


def confirmar(titulo, texto, boton, pel=False, extra=""):
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="' + titulo + '"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div><div class="hb"><p class="ap-txt-l">{texto}</p>{COD}{extra}</div>'
            f'<div class="hp">{BOTONES("Cancelar", boton, pel)}</div></div>')


ACCIONES = ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de 011 15-5555-4521"><span class="asa"></span>'
            '<div class="hc" style="padding-right: 20px;"><h2>011 15-5555-4521</h2></div><div class="hb" style="padding-bottom: 34px;">'
            '<div class="ap-acciones"><span role="menuitem">Hacer principal</span><span class="sep" role="separator"></span>'
            '<span class="pel" role="menuitem">Quitar</span></div></div></div>')
armar("M-Cuenta-Metodo", "Mi cuenta · quitar o hacer principal · teléfono", "estado",
      ["Menú del WhatsApp", "Quitar el WhatsApp", "Hacer principal el WhatsApp", "Quitar un correo: el código llega por WhatsApp"], [
          METODO + ACCIONES,
          METODO + confirmar("¿Quitar este WhatsApp?", "Ya no vas a poder entrar con 011 15-5555-4521. Para confirmar, escribí el código que te mandamos a lu•••@gmail.com.", "Quitar", True),
          METODO + confirmar("¿Hacer principal este WhatsApp?", "Desde ahora te avisamos a 011 15-5555-4521. Para confirmar, escribí el código que te mandamos a lu•••@gmail.com.", "Hacer principal"),
          METODO + confirmar("¿Quitar este correo?", f"Ya no vas a poder entrar con lucia.trabajo@gmail.com. Para confirmar, escribí el código que te mandamos a <b>{TEL}</b>.",
                             "Quitar", True, NOTA),
      ])

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"]["M-Cuenta-Metodo.dc.html"] = {"h": 844, "is_interactive": True, "page": "personal", "title": "Mi cuenta · quitar o hacer principal · teléfono",
                                          "w": 390, "x": 2820, "y": 1280}
if "M-Cuenta-Metodo.dc.html" not in c["order"]:
    c["order"].append("M-Cuenta-Metodo.dc.html")
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8", newline="")
