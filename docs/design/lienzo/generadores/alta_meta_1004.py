"""Alta de Meta de una organización (Etapa 11, ADR 0038): el alta embebida de WhatsApp (Embedded Signup v4) tal como la muestra
Meta, copiada de las capturas de su documentación oficial (developers.facebook.com/documentation/business-messaging/whatsapp/
embedded-signup/default-flow, actualizada el 03/09/2026). La ventana es de Meta y no se diseña: se dibuja igual, en inglés como
en sus capturas (decidido el 2026-10-03; con Facebook en español Meta la muestra traducida). Se copian títulos, campos y botones;
los párrafos largos de Meta van como líneas grises, y en lugar del logo de Meta va su nombre como texto.
- WA-Alta-Meta: la ventana de Meta encima de Números, con un estado por cada uno de sus 8 pasos.
- WA-Alta: lo nuestro antes y después de la ventana («Atiende a», conectado, cancelado y error de Meta).
Se rehace entero cada vez."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
APP = "ArquitecturaBase"
PERSONA = "Lucía Fernández"


def svg(d, w=16, sw="1.8", fill="none"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


ABAJO = '<span class="mw-car">▼</span>'
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 12, "3")
WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/>', 16)
CHAT = svg('<path d="M5 5h14v10H9l-4 4z"/>', 15)
EDIF = svg('<rect x="4" y="7" width="16" height="12" rx="1.5"/><path d="M9 7V5h6v2"/>', 16)
INFO = '<span class="mw-i">i</span>'

CSS = """<style data-vuelta="1004-alta-meta">
.mw-velo { position: absolute; inset: 0; z-index: 30; background: oklch(0.2 0.01 60 / 0.45); }
.mw-pill { position: absolute; z-index: 31; left: 50%; bottom: 28px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; padding: 10px 12px 10px 18px; border-radius: 999px; background: #fff; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.25); font-size: 13.5px; color: var(--t1); }
.mw-pill .cb { height: 32px; border-radius: 16px; }
.mw { position: absolute; z-index: 32; left: 50%; top: 26px; transform: translateX(-50%); width: 470px; height: 640px; background: #fff; border-radius: 11px; overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 30px 70px rgb(0 0 0 / 0.35), 0 0 0 1px rgb(0 0 0 / 0.12); font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1c1e21; }
.mw-tit { height: 30px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 0 12px; background: #ececec; font-size: 12px; font-weight: 600; color: #3a3a3a; }
.mw-tit i { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.mw-tit i:nth-child(1) { background: #ff5f57; } .mw-tit i:nth-child(2) { background: #febc2e; } .mw-tit i:nth-child(3) { background: #28c840; margin-right: 8px; }
.mw-url { height: 28px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; margin: 0 8px 6px; padding: 0 10px; border-radius: 6px; background: #fff; border: 1px solid #d0d0d0; font-size: 12px; color: #333; white-space: nowrap; overflow: hidden; }
.mw-urlb { background: #ececec; padding-top: 2px; flex-shrink: 0; }
.mw-cab { height: 56px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; background: #f0f2f5; border-bottom: 1px solid #dddfe2; }
.mw-logos { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #0866ff; }
.mw-logos .x { color: #8a8d91; font-weight: 400; }
.mw-logos .brand { width: 20px; height: 20px; border-radius: 6px; }
.mw-av { display: flex; align-items: center; gap: 6px; }
.mw-av span:first-child { width: 26px; height: 26px; border-radius: 50%; background: var(--marca); color: #fff; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.mw-car { font-size: 9px; color: #1c1e21; line-height: 1; }
.mw-cue { flex: 1; min-height: 0; display: flex; overflow: hidden; }
.mw-rail { width: 34px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; padding-top: 18px; background: linear-gradient(180deg, #f3f6fb, #eef1f8); }
.mw-rail span { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid #8a8d91; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; }
.mw-rail span.ok { background: #31a24c; border-color: #31a24c; color: #fff; }
.mw-rail span.on { border: 2px solid #0866ff; box-shadow: 0 0 0 4px #e7f0ff; }
.mw-in { flex: 1; min-width: 0; padding: 16px 20px 0; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
.mw-in.ancho { padding: 26px 34px 0; }
.mw h1 { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.mw h1.g { font-size: 17px; }
.mw .sub { margin: -6px 0 0; font-size: 12.5px; color: #1c1e21; }
.mw .rot { font-size: 12.5px; font-weight: 700; margin-top: 4px; }
.mw .rot2 { font-size: 11.5px; color: #65676b; margin-top: -8px; }
.mw-gris { display: flex; flex-direction: column; gap: 6px; }
.mw-gris i { display: block; height: 8px; border-radius: 4px; background: #dfe1e5; }
.mw-sel { height: 34px; border: 1px solid #ccd0d5; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 12.5px; color: #1c1e21; box-sizing: border-box; }
.mw-sel.mw-vac { color: #65676b; }
.mw-tel { display: grid; grid-template-columns: 104px 1fr; }
.mw-tel .mw-sel:first-child { border-radius: 6px 0 0 6px; border-right: 0; }
.mw-tel .mw-sel:last-child { border-radius: 0 6px 6px 0; }
.mw-rad { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; }
.mw-rad b { font-weight: 400; display: block; }
.mw-rad small { font-size: 11px; color: #65676b; display: block; margin-top: 2px; }
.mw-rad .o { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #8a8d91; box-sizing: border-box; flex-shrink: 0; margin-top: 1px; }
.mw-rad .o.on { border: 5px solid #0866ff; }
.mw-cod { display: flex; gap: 6px; }
.mw-cod span { width: 24px; height: 28px; border: 1px solid #ccd0d5; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
.mw a, .mw .lnk { color: #0866ff; text-decoration: none; font-size: 12.5px; }
.mw-i { display: inline-flex; width: 12px; height: 12px; border-radius: 50%; background: #1c1e21; color: #fff; font-size: 9px; font-weight: 700; align-items: center; justify-content: center; margin-left: 4px; vertical-align: 1px; }
.mw-pie { flex-shrink: 0; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; padding: 12px 18px 14px; font-size: 11.5px; color: #1c1e21; }
.mw-pie .leg small { display: block; color: #65676b; font-size: 10.5px; margin-top: 2px; }
.mw-pie .bt { display: flex; gap: 8px; flex-shrink: 0; }
.mw-b { height: 32px; padding: 0 16px; border-radius: 6px; border: 1px solid #ccd0d5; background: #fff; font-size: 12.5px; font-weight: 600; color: #1c1e21; display: inline-flex; align-items: center; justify-content: center; }
.mw-b.az { background: #0866ff; border-color: #0866ff; color: #fff; }
.mw-b.az.ap { background: #a8c7fa; border-color: #a8c7fa; }
.mw-b.gr { background: #e4e6eb; border-color: #e4e6eb; flex: 1; }
.mw-b.ve { background: #00875a; border-color: #00875a; color: #fff; }
.mw-nota { border-top: 1px solid #dddfe2; padding-top: 10px; margin-top: auto; }
.mw-ban { height: 92px; flex-shrink: 0; margin: 0 -34px 6px; background: linear-gradient(120deg, #dbe8ff, #f3e8ff 55%, #ffe6d5); }
.mw-it { display: flex; gap: 10px; align-items: center; font-size: 12.5px; }
.mw-it .ic { width: 28px; height: 28px; border-radius: 50%; background: #f0f2f5; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: #1c1e21; }
.mw-it b { font-weight: 600; display: block; }
.mw-it small { color: #65676b; font-size: 11px; }
.mw-it a { font-weight: 400; }
.mw ul { margin: 0; padding-left: 18px; font-size: 12.5px; display: flex; flex-direction: column; gap: 4px; }
.mw-chk { display: flex; gap: 10px; font-size: 12.5px; align-items: flex-start; }
.mw-chk .c { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #0866ff; color: #0866ff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mw-ok { width: 72px; height: 72px; border-radius: 50%; background: #cfe0ff; align-self: center; margin-top: 6px; box-shadow: 0 0 0 10px #eef4ff; }
.mw-centro { text-align: center; }
</style>"""


def gris(*anchos):
    return '<div class="mw-gris">' + "".join(f'<i style="width: {a}%"></i>' for a in anchos) + "</div>"


def ventana(cuerpo, pie, url="v24.0"):
    return ('<div class="mw" role="dialog" aria-label="Ventana de Meta: Facebook Login for Business">'
            '<div class="mw-tit"><i></i><i></i><i></i>Facebook Login for Business</div>'
            f'<div class="mw-urlb"><div class="mw-url">⚙ https://www.facebook.com/{url}/dialog/oauth?app_id=1105469744…</div></div>'
            f'<div class="mw-cab"><span class="mw-logos">Meta <span class="x">⇄</span><span class="brand" aria-hidden="true"></span></span>'
            f'<span class="mw-av"><span>L</span>{ABAJO}</span></div>{cuerpo}{pie}</div>')


def pie_pasos(boton="Next", atras="Back", activo=True):
    return (f'<div class="mw-pie"><span class="leg">{APP}\'s <a>Privacy Policy</a> and <a>Terms</a><small>Session ID: 019e19c8-0807-74d5-8da7-789c6ef7a5e0</small></span>'
            f'<span class="bt"><span class="mw-b">{atras}</span><span class="mw-b az{"" if activo else " ap"}">{boton}</span></span></div>')


def rail(n_ok, actual=True, total=4):
    return '<div class="mw-rail">' + "".join(
        f'<span class="ok">{TILDE}</span>' if i < n_ok else (f'<span class="on"></span>' if i == n_ok and actual else "<span></span>") for i in range(total)) + "</div>"


PASOS = []
# 1 · Authentication (Facebook Login for Business)
PASOS.append(ventana(
    f'<div class="mw-cue"><div class="mw-in ancho"><h1 class="g">Continue as {PERSONA}?</h1>{gris(96, 92, 60)}<div style="height: 6px"></div>{gris(94, 96, 90, 50)}'
    f'<div style="display: flex; gap: 8px; margin-top: 18px;"><span class="mw-b gr">Cancel</span><span class="mw-b az" style="flex: 1;">Continue as {PERSONA}</span></div>'
    f'<span style="font-size: 12.5px; margin-top: 6px;">Not {PERSONA}? <a>Log into another account.</a></span></div></div>',
    f'<div class="mw-pie" style="flex-direction: column; align-items: stretch;">{gris(96, 90, 40)}'
    f'<span style="display: flex; justify-content: space-between; margin-top: 8px;"><span>{APP}\'s <a>Privacy Policy</a> and <a>Terms</a></span><a>Help Center</a></span></div>',
    url="v17.0"))
# 2 · Authorization
PASOS.append(ventana(
    f'<div class="mw-cue"><div class="mw-in ancho" style="padding-top: 0;"><div class="mw-ban" aria-hidden="true"></div><h1 class="g">Seamlessly connect your account to {APP}</h1>{gris(96, 70)}'
    f'<span class="rot">You\'ll be able to:</span><div class="mw-it"><span class="ic">{CHAT}</span><span>Communicate with customers at scale</span></div>'
    f'<div style="padding-left: 38px; display: flex; flex-direction: column; gap: 8px;">{gris(94, 72)}{gris(70, 76)}</div>'
    f'<div class="mw-nota">{gris(92, 40)}</div></div></div>',
    pie_pasos("Continue", "Cancel")))
# 3 · Phone number addition
PASOS.append(ventana(
    f'<div class="mw-cue">{rail(0)}<div class="mw-in"><h1>Add your WhatsApp phone number</h1><p class="sub">Choose how you want to be identified when sending messages.</p>'
    '<span class="rot">Add a phone number</span>'
    '<div class="mw-rad"><span class="o on"></span><span><b>Add a phone number</b><small>Number verification is required.</small></span></div>'
    f'<span class="rot">Phone number</span><div class="mw-tel"><span class="mw-sel">AR +54 {ABAJO}</span><span class="mw-sel">9 11 5555-0300</span></div>'
    f'<span class="mw-sel">Create a new WhatsApp Business profile {ABAJO}</span>'
    f'<div class="mw-rad"><span class="o"></span><span><b>Use a display name with virtual number instead</b><small>{gris(96, 90, 70)}</small></span></div></div></div>',
    pie_pasos()))
# 4 · Phone number verification
PASOS.append(ventana(
    f'<div class="mw-cue">{rail(1)}<div class="mw-in"><h1>Verify your phone number</h1><p class="sub">We sent a code via text message to +5491155550300</p>'
    '<span class="rot">Verification code</span><div class="mw-cod"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>0</span></div>'
    '<a>Resend code</a><span class="rot">Choose how you would like to verify your number</span>'
    '<div style="display: flex; gap: 18px;"><span class="mw-rad"><span class="o on"></span>Text message</span><span class="mw-rad"><span class="o"></span>Phone call</span></div></div></div>',
    pie_pasos()))
# 5 · Business asset selection
PASOS.append(ventana(
    f'<div class="mw-cue">{rail(2)}<div class="mw-in"><h1>Select the business assets to share with {APP}</h1><p class="sub">You can use existing assets or create new ones.</p>'
    f'<span class="rot">Business portfolio{INFO}</span><span class="mw-sel">Create a Business portfolio {ABAJO}</span>'
    f'<span class="rot">WhatsApp Business account{INFO}</span><span class="mw-sel">Create a WhatsApp Business account {ABAJO}</span>'
    f'<div class="mw-nota">{gris(96, 92, 30)}</div></div></div>',
    pie_pasos()))
# 6 · Business asset creation
PASOS.append(ventana(
    f'<div class="mw-cue">{rail(3)}<div class="mw-in" style="gap: 7px;"><h1>Enter business information for new assets</h1><p class="sub">Any changes will only affect new assets.</p>'
    '<span class="rot">Name</span><span class="mw-sel">Grupo Delta</span>'
    '<span class="rot">Email</span><span class="mw-sel">lucia.fernandez@delta.ejemplo.com</span>'
    f'<span class="rot">Category</span><span class="rot2">Select the category that best describes your business.</span><span class="mw-sel mw-vac">Choose a business category {ABAJO}</span>'
    f'<span class="rot">Country</span><span class="mw-sel">Argentina {ABAJO}</span>'
    '<span class="rot">Website</span><span class="mw-sel">delta.ejemplo.com <span style="color: #65676b;">17/512</span></span>'
    f'<span class="rot">Time zone</span><span class="mw-sel">(GMT-03:00) America/Buenos_Aires {ABAJO}</span>'
    '<a>Show more options ▾</a></div></div>',
    pie_pasos()))
# 7 · Permissions review
PASOS.append(ventana(
    f'<div class="mw-cue"><div class="mw-in ancho"><h1 class="g">Review what you\'ll share with {APP}</h1>{gris(94, 60)}'
    f'<span class="rot">{APP} is requesting access to</span><div class="mw-it"><span class="ic">{WA}</span><span><b>WhatsApp Business account</b><small>Grupo Delta</small></span></div>'
    f'<span class="rot">{APP} will be able to</span><ul><li>Manage your WhatsApp accounts</li><li>Manage and access conversations in WhatsApp</li>'
    '<li>Log events on your WhatsApp business account\'s behalf and send those events to Meta</li></ul>'
    f'<div class="mw-nota">{gris(96, 94, 50)}</div></div></div>',
    f'<div class="mw-pie"><span class="leg">{APP}\'s <a>Privacy Policy</a> and<br><a>Terms of Service</a></span><span class="bt"><span class="mw-b">Back</span><span class="mw-b az">Confirm</span></span></div>'))
# 8 · Success
PASOS.append(ventana(
    f'<div class="mw-cue"><div class="mw-in ancho" style="gap: 9px;"><span class="mw-ok" aria-hidden="true"></span><h1 class="g mw-centro">Your account is connected to {APP}</h1>'
    f'<div style="padding: 0 20px;">{gris(100, 70)}</div><span class="rot">Assets successfully created</span>'
    f'<div class="mw-it"><span class="ic">{EDIF}</span><span><a>Grupo Delta</a><br><small>Business</small></span></div>'
    f'<div class="mw-it"><span class="ic">{WA}</span><span><a>Grupo Delta</a><br><small>WhatsApp Account</small></span></div>'
    f'<span class="rot">Improve your experience</span><div class="mw-chk"><span class="c">{TILDE}</span><span>Instruct Meta to automatically identify order and lead events<br><a style="font-size: 11px;">See terms and details</a></span></div></div></div>',
    f'<div class="mw-pie"><span class="leg">{APP}\'s <a>Privacy</a><br><a>Policy</a> and <a>Terms</a></span><span class="bt"><span class="mw-b ve">Add payment method</span><span class="mw-b az">Finish</span></span></div>'))

OPCIONES = ["1 · Authentication", "2 · Authorization", "3 · Phone number", "4 · Phone verification", "5 · Business assets", "6 · New business assets",
            "7 · Permissions review", "8 · Success"]
PILL = ('<div class="mw-pill" role="status">Ventana de Meta abierta<span class="cb cb-sec">Volver a la ventana</span>'
        '<span class="cb cb-sec">Cancelar</span></div>')


def tweak(t, prop, opciones):
    props = json.dumps({prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    vals = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    viejo = "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}"
    assert t.count(viejo) == 1
    t = t.replace("data-props='{\"$preview\"", "data-props='" + props[:-1] + ",\"$preview\"", 1)
    return t.replace(viejo, "class Component extends DCLogic {\n  renderVals() {\n"
                     f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n    return {{\n      si: true,\n      no: false,\n{vals}    }};\n  }}\n}}")


def alta():
    t = (PROJ / "WA-Admin.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Administración › WhatsApp › Números · ventana de Meta</title>", t, count=1, flags=re.S)
    fin = t.index("</div>\n</x-dc>")
    estados = "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{p}</sc-if>' for i, p in enumerate(PASOS))
    t = t[:fin] + f'<div class="mw-velo"></div>{PILL}{estados}' + t[fin:]
    t = t.replace("</helmet>", CSS + "\n</helmet>", 1)
    t = tweak(t, "paso", OPCIONES)
    (PROJ / "WA-Alta-Meta.dc.html").write_text(t, encoding="utf-8")
    print("ok WA-Alta-Meta")


CSS_CONECTAR = """<style data-vuelta="1004-alta-meta">
.toast2 { position: absolute; z-index: 41; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; max-width: 460px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); font-size: 13px; color: var(--t1); }
.toast2 svg { flex-shrink: 0; }
.w-dlg:has(.fa-lista) { overflow: visible; }
.w-dlg:has(.fa-lista) .dc { border-radius: 12px 12px 0 0; }
.fa-cmp { position: relative; }
.fa-cmp .ct svg { color: var(--t3); flex-shrink: 0; }
.fa-cmp .ct.abierto { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.fa-lista { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 30; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); padding: 6px; display: flex; flex-direction: column; }
.fa-lista span { display: flex; align-items: center; justify-content: space-between; min-height: 36px; padding: 0 10px; border-radius: 6px; }
.fa-lista span.on { background: var(--marca-t); color: var(--marca-tx); }
.fa-lista span.sep { min-height: 0; height: 1px; padding: 0; margin: 4px 0; border-radius: 0; background: var(--borde); }
</style>"""
CHEV = svg('<path d="m7 10 5 5 5-5"/>', 16, "2")
CERRAR = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
OK = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.55 0.13 155)" stroke-width="2" stroke-linecap="round" '
      'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>')
INFO_GRIS = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/></svg>')
ALERTA = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>', 18, "2")
ELEGIDO = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, "2.25")
EMPRESAS = ["Delta S.A.", "Delta Norte S.A.", "Delta Sur S.R.L."]
OPCIONES_CONECTAR = ["Atiende a", "Atiende a · elegir", "Conectado", "Cancelado", "Error de Meta"]


def atiende_a(abierto):
    """«Conectar número» pregunta a quién atiende antes de abrir la ventana de Meta: así «Cancelar» no deja nada a medias.
    Si la organización no tiene empresas, no se pregunta y la ventana se abre directo."""
    lista = ""
    if abierto:
        lista = (f'<div class="fa-lista" role="listbox"><span class="on" role="option" aria-selected="true">Toda la organización{ELEGIDO}</span>'
                 '<span class="sep" role="separator"></span>' + "".join(f'<span role="option">{e}</span>' for e in EMPRESAS) + "</div>")
    return ('<div class="w-oscuro"><div class="w-dlg chico" role="dialog" aria-label="Conectar número">'
            f'<div class="dc"><span>Conectar número</span><button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button></div>'
            f'<div class="db una"><div class="w-cmp fa-cmp"><span class="rt">Atiende a</span><span class="ct{" abierto" if abierto else ""}">Toda la organización{CHEV}</span>{lista}</div></div>'
            '<div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Seguir en Meta</button></div></div></div>')


def error_meta(paso2="Si vuelve a pasar, escribí a soporte@ejemplo.com"):
    """Meta manda el evento ERROR con un código (error_id) y la sesión, que pide para su soporte. El texto del error lo muestra Meta en
    su ventana; acá va el código para que la organización lo pase a soporte."""
    return ('<div class="w-oscuro"><div class="w-dlg chico" role="dialog" aria-label="No se pudo conectar el número">'
            f'<div class="dc"><span>No se pudo conectar el número</span><button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button></div>'
            f'<div class="db una"><div class="o-mot">{ALERTA}<div><b>Meta informó un error</b><span>Código 524126</span></div></div>'
            '<span class="o-sub">Qué podés hacer</span><ol class="o-pasos"><li><span class="n">1</span>Volvé a tocar «Conectar número»</li>'
            f'<li><span class="n">2</span>{paso2}</li></ol></div>'
            '<div class="df"><button type="button" class="cb cb-pri">Entendido</button></div></div></div>')


def conectar():
    """WA-Alta: lo nuestro alrededor de la ventana de Meta. Antes, «Atiende a»; después, el número conectado, la ventana cerrada sin
    terminar (evento CANCEL) o el error que informa Meta (evento ERROR). Cerrar la ventana en la última pantalla de Meta cuenta como
    terminada. Si en esa pantalla no se agregó el medio de pago, la fila queda «Falta medio de pago», como en WA-Admin-Pago."""
    t = (PROJ / "WA-Admin.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Administración › WhatsApp › Números · conectar</title>", t, count=1, flags=re.S)
    t = t.replace('<p class="res">2 números · 1 sin medio de pago</p>', '<p class="res">{{res}}</p>', 1)
    a = t.index('<div class="w-tr n">')
    b = t.index('<div class="w-tr n">', a + 5)
    fila = t[a:b].replace("+54 9 11 5555-0100", "+54 9 11 5555-0300").replace("Grupo Delta · también en la app", "Grupo Delta").replace("640 de 1.000 gratis", "0 de 1.000 gratis")
    fin_fila = t.index("</button></span></div>", b) + len("</button></span></div>")
    t = t[:fin_fila] + f'<sc-if value="{{{{e2}}}}" hint-placeholder-val="{{{{no}}}}">{fila}</sc-if>' + t[fin_fila:]
    estados = [atiende_a(False), atiende_a(True),
               f'<div class="toast2" role="status">{OK}<span>Número conectado</span></div>',
               f'<div class="toast2" role="status">{INFO_GRIS}<span>No se conectó el número</span></div>',
               error_meta()]
    fin = t.index("</div>\n</x-dc>")
    t = t[:fin] + "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{p}</sc-if>' for i, p in enumerate(estados)) + t[fin:]
    t = t.replace("</helmet>", CSS_CONECTAR + "\n</helmet>", 1)
    t = tweak(t, "estado", OPCIONES_CONECTAR)
    t = t.replace("      no: false,\n", "      no: false,\n      res: e === 'Conectado' ? '3 números · 1 sin medio de pago' : '2 números · 1 sin medio de pago',\n", 1)
    (PROJ / "WA-Alta.dc.html").write_text(t, encoding="utf-8")
    print("ok WA-Alta")


CSS_COEX = """<style data-vuelta="1004-alta-meta-coex">
.mw-perfil { align-self: center; width: 250px; margin-top: 8px; border: 1px solid #dddfe2; border-radius: 10px; overflow: hidden; }
.mw-perfil .arr { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 12px 12px; }
.mw-perfil .foto { width: 54px; height: 54px; border-radius: 50%; background: var(--marca); color: #fff; font-size: 20px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.mw-perfil .nom { font-size: 14px; font-weight: 700; margin-top: 4px; }
.mw-perfil .num { font-size: 12px; color: #1c1e21; }
.mw-perfil .acc { display: flex; gap: 6px; margin-top: 8px; }
.mw-perfil .acc span { width: 70px; height: 48px; border: 1px solid #dddfe2; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 11px; color: #1c1e21; }
.mw-perfil .acc svg { color: #00875a; }
.mw-perfil .abj { border-top: 6px solid #f0f2f5; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.mw-perfil .abj span { display: flex; align-items: center; gap: 8px; }
.mw-sel.ro { background: #f0f2f5; color: #8a8d91; }
.mw-sel.val { border-color: #31a24c; }
.mw-sel.val svg { color: #31a24c; }
.mw-qr { align-self: center; display: flex; align-items: center; gap: 10px; margin-left: 26px; }
.mw-qr svg.cod { width: 150px; height: 150px; }
.mw ol { margin: 0; padding-left: 18px; font-size: 12px; display: flex; flex-direction: column; gap: 6px; }
.mw ol li::marker { font-weight: 400; }
.mw-b.ve svg { margin-right: 6px; }
</style>"""


def qr(lado=25, semilla=7):
    """Un código QR de muestra: los tres cuadrados de las esquinas y módulos al azar (no se puede escanear)."""
    import random
    r = random.Random(semilla)
    celdas = []
    def esquina(x, y):
        return (f'<rect x="{x}" y="{y}" width="7" height="7" fill="#000"/><rect x="{x + 1}" y="{y + 1}" width="5" height="5" fill="#fff"/>'
                f'<rect x="{x + 2}" y="{y + 2}" width="3" height="3" fill="#000"/>')
    for fy in range(lado):
        for fx in range(lado):
            if (fx < 8 and fy < 8) or (fx > lado - 9 and fy < 8) or (fx < 8 and fy > lado - 9):
                continue
            if r.random() < 0.48:
                celdas.append(f'<rect x="{fx}" y="{fy}" width="1" height="1"/>')
    return (f'<svg class="cod" viewBox="0 0 {lado} {lado}" shape-rendering="crispEdges" aria-label="Código QR" role="img">'
            f'<rect width="{lado}" height="{lado}" fill="#fff"/><g fill="#000">{"".join(celdas)}</g>'
            f'{esquina(0, 0)}{esquina(lado - 7, 0)}{esquina(0, lado - 7)}</svg>')


TEL = svg('<path d="M6.5 4h3l1.5 4-2 1.2a10 10 0 0 0 5.8 5.8L16 13l4 1.5v3A2 2 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6 2 2 0 0 1 6.5 4z"/>', 16)
TIENDA = svg('<path d="M4 9.5 5.5 5h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V19h13v-7.5"/><path d="M10 19v-4h4v4"/>', 16)
COMPARTIR = svg('<path d="M14 4h6v6"/><path d="M20 4l-8 8"/><path d="M18 14v5H5V6h5"/>', 16)
PERCHA = svg('<path d="M12 7.5a1.8 1.8 0 1 1 1.8-1.8c0 1-1.8 1.4-1.8 2.8L3.5 15h17z"/>', 15)
MUNDO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.6 2.5 14.4 0 17"/><path d="M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>', 15)
COPIAR = svg('<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/>', 16)
TARJETA = svg('<path d="M4 12.5 11.5 5H19v7.5L11.5 20z"/><circle cx="15" cy="9" r="1.2"/>', 14, "2")
NEGOCIO = svg('<rect x="4" y="7" width="16" height="12" rx="1.5"/><path d="M9 7V5h6v2"/>', 16)
VALIDO = svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 16, "2")

COEX = []
# 3 · Phone number: el número que ya está en la app WhatsApp Business. Con ese número, Meta pasa solo al flujo de coexistencia.
COEX.append(ventana(
    f'<div class="mw-cue">{rail(0)}<div class="mw-in"><h1>Add your WhatsApp phone number</h1><p class="sub">Choose how you want to be identified when sending messages.</p>'
    '<span class="rot">Add a phone number</span>'
    '<div class="mw-rad"><span class="o on"></span><span><b>Add a phone number</b><small>Number verification is required.</small></span></div>'
    f'<span class="rot">Phone number</span><div class="mw-tel"><span class="mw-sel">AR +54 {ABAJO}</span><span class="mw-sel">9 11 5555-0100</span></div>'
    f'<span class="mw-sel">Create a new WhatsApp Business profile {ABAJO}</span>'
    f'<div class="mw-rad"><span class="o"></span><span><b>Use a display name with virtual number instead</b><small>{gris(96, 90, 70)}</small></span></div></div></div>',
    pie_pasos()))
# 4 · Business profile: los datos de la cuenta de la app WhatsApp Business.
COEX.append(ventana(
    f'<div class="mw-cue">{rail(1, total=5)}<div class="mw-in"><h1>Verify your account details</h1><p class="sub">Incorrect info? Go back and update your phone number.</p>'
    f'<div class="mw-perfil"><div class="arr"><span class="foto">GD</span><span class="nom">Grupo Delta</span><span class="num">+5491155550100</span>'
    f'<span class="acc"><span>{TEL}Call</span><span>{TIENDA}Catalog</span><span>{COMPARTIR}Share</span></span></div>'
    f'<div class="abj"><span>{PERCHA}Professional Services</span><span>{MUNDO}<a>https://delta.ejemplo.com/</a></span></div></div></div></div>',
    pie_pasos()))
# 5 · Business portfolio selection
COEX.append(ventana(
    f'<div class="mw-cue">{rail(2, total=5)}<div class="mw-in"><h1>Select the business assets to share with {APP}</h1><p class="sub">You can use existing assets or create new ones.</p>'
    f'<span class="rot">Business portfolio{INFO}</span><span class="mw-sel">Create a Business portfolio {ABAJO}</span>'
    f'<div class="mw-nota">{gris(96, 70)}</div></div></div>',
    pie_pasos()))
# 6 · Business creation
COEX.append(ventana(
    f'<div class="mw-cue">{rail(3, total=6)}<div class="mw-in"><h1>Enter business information for new assets</h1><p class="sub">Any changes will only affect new assets.</p>'
    f'<span class="rot">Name</span><span class="mw-sel val">Grupo Delta {VALIDO}</span>'
    '<span class="rot">Email</span><span class="mw-sel">lucia.fernandez@delta.ejemplo.com</span>'
    f'<span class="rot">Country</span><span class="mw-sel">Argentina {ABAJO}</span>'
    '<span class="rot">Website</span><span class="mw-sel">https://delta.ejemplo.com/ <span style="color: #65676b;">26/512</span></span></div></div>',
    pie_pasos()))
# 7 · QR code verification: se escanea desde la app WhatsApp Business; al escanearlo, la ventana sigue sola.
COEX.append(ventana(
    f'<div class="mw-cue">{rail(4, total=6)}<div class="mw-in"><h1>Import contacts and chat history</h1>{gris(96, 92, 40)}'
    f'<span class="rot">Use the WhatsApp Business app to scan the QR code:</span><div class="mw-qr">{qr()}<span style="color: #65676b;">{COPIAR}</span></div>'
    f'<span class="rot">Start the process:</span><ol><li>{gris(94, 70)}</li><li>{gris(90, 50)}</li></ol></div></div>',
    pie_pasos(activo=False)))
# 8 · Business information confirmation
COEX.append(ventana(
    f'<div class="mw-cue">{rail(5, total=6)}<div class="mw-in"><h1>Confirm or edit your WhatsApp Business account</h1>{gris(96, 94, 90, 40)}'
    '<span class="rot">WhatsApp Business account name</span><span class="mw-sel ro">Grupo Delta</span>'
    f'<span class="rot">Timezone{INFO}</span><span class="mw-sel">(GMT-03:00) America/Buenos_Aires {ABAJO}</span></div></div>',
    pie_pasos()))
# 9 · Terms and conditions review
COEX.append(ventana(
    f'<div class="mw-cue"><div class="mw-in ancho"><h1 class="g">Review what you\'ll share with {APP}</h1>{gris(94, 60)}'
    f'<span class="rot">{APP} is requesting access to</span><div class="mw-it"><span class="ic">{WA}</span><span><b>WhatsApp Business account</b><small>Grupo Delta</small></span></div>'
    f'<span class="rot">{APP} will be able to</span><ul><li>Manage your WhatsApp accounts</li><li>Manage and access conversations in WhatsApp</li>'
    '<li>Log events on your WhatsApp business account\'s behalf and send those events to Meta</li></ul>'
    f'<div class="mw-nota">{gris(96, 94, 50)}</div></div></div>',
    f'<div class="mw-pie"><span class="leg">{APP}\'s <a>Privacy Policy</a> and<br><a>Terms of Service</a></span><span class="bt"><span class="mw-b">Back</span><span class="mw-b az">Confirm</span></span></div>'))
# 10 · Success
COEX.append(ventana(
    f'<div class="mw-cue"><div class="mw-in ancho" style="gap: 9px;"><span class="mw-ok" aria-hidden="true"></span><h1 class="g mw-centro">Your account is connected to {APP}</h1>'
    f'<div style="padding: 0 20px;">{gris(100, 70)}</div><span class="rot">Assets successfully created</span>'
    f'<div class="mw-it"><span class="ic">{NEGOCIO}</span><span><a>Grupo Delta</a><br><small>Business</small></span></div>'
    f'<span class="rot">Improve your experience</span>'
    f'<div class="mw-chk"><span class="c">{TILDE}</span><span>Turn on insights for your business<br><a style="font-size: 11px;">See terms and details</a></span></div>'
    f'<div class="mw-chk"><span class="c">{TILDE}</span><span>Instruct Meta to automatically identify order and lead events<br><a style="font-size: 11px;">See terms and details</a></span></div></div></div>',
    f'<div class="mw-pie"><span class="leg">{APP}\'s <a>Privacy</a><br><a>Policy</a> and <a>Terms</a></span><span class="bt"><span class="mw-b ve">{TARJETA}Add payment method</span><span class="mw-b az">Finish</span></span></div>'))

OPCIONES_COEX = ["3 · Phone number", "4 · Account details", "5 · Business portfolio", "6 · New business", "7 · QR code", "8 · Confirm account",
                 "9 · Review", "10 · Success"]


def coexistencia():
    """WA-Alta-Coexistencia: si el número ya está en la app WhatsApp Business, Meta pasa solo a este flujo (los pasos 1 y 2 son los
    mismos de WA-Alta-Meta). Copiado de las capturas de «Flujo de coexistencia» de la misma página de Meta. Al terminar, la fila del
    número dice «también en la app», como en WA-Admin."""
    t = (PROJ / "WA-Admin.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Administración › WhatsApp › Números · ventana de Meta · número de la app</title>", t, count=1, flags=re.S)
    fin = t.index("</div>\n</x-dc>")
    estados = "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{p}</sc-if>' for i, p in enumerate(COEX))
    t = t[:fin] + f'<div class="mw-velo"></div>{PILL}{estados}' + t[fin:]
    t = t.replace("</helmet>", CSS + "\n" + CSS_COEX + "\n</helmet>", 1)
    t = tweak(t, "paso", OPCIONES_COEX)
    (PROJ / "WA-Alta-Coexistencia.dc.html").write_text(t, encoding="utf-8")
    print("ok WA-Alta-Coexistencia")


CSS_TEL = """<style data-vuelta="1004-alta-meta-tel">
.ap-cmp { display: flex; flex-direction: column; gap: 6px; }
.ap-cmp .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); display: flex; justify-content: space-between; align-items: center; }
.ap-cmp .ct { min-height: 48px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; font-size: 16px; background: #fff; }
.ap-cmp .ct svg { color: var(--t3); flex-shrink: 0; }
.ap-pais { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 4px; font-size: 16px; color: var(--t1); border-bottom: 1px solid var(--borde); }
.ap-pais:last-child { border-bottom: 0; }
.ap-pais[aria-selected="true"] { color: var(--marca-tx); font-weight: 500; }
.ap-pais svg { margin-left: auto; }
.ap-hoja .hb:has(.ap-pais) { gap: 0; }
.f-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 110px; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.f-snack .tx { flex: 1; min-width: 0; }
.f-snack .ok { color: oklch(0.78 0.14 155); display: inline-flex; }
.f-snack .neu { color: oklch(1 0 0 / 0.7); display: inline-flex; }
.ap:has(.f-snack) .ap-fab { bottom: 180px; }
.ap-hoja .hb:empty { display: none; }
.ap-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px; background: var(--peligro-t); color: oklch(0.42 0.16 25); }
.ap-mot svg { flex-shrink: 0; margin-top: 1px; }
.ap-mot b { display: block; font-size: 15.5px; font-weight: 600; color: oklch(0.38 0.15 25); }
.ap-mot span { font-size: 13.5px; }
.ap-sub { font-size: 13px; font-weight: 600; color: var(--t3); margin-bottom: -2px; }
.ap-pasos { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.ap-pasos li { display: flex; gap: 12px; align-items: center; font-size: 15px; }
.ap-pasos .n { width: 28px; height: 28px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>"""
X_TEL = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 22, "2")
CHEV_TEL = svg('<path d="m7 10 5 5 5-5"/>', 18, "2")
OK_TEL = svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 20)
INFO_TEL = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 20, "2")
OPCIONES_TEL = ["Atiende a", "Atiende a · elegir", "Ventana de Meta abierta", "Conectado", "Cancelado", "Error de Meta"]


def hoja_tel(titulo, cuerpo, pie, cerrar=True):
    x = f'<button type="button" class="ap-ib" aria-label="Cerrar">{X_TEL}</button>' if cerrar else ""
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="' + titulo + '"><span class="asa"></span>'
            f'<div class="hc"><h2>{titulo}</h2>{x}</div><div class="hb">{cuerpo}</div><div class="hp">{pie}</div></div>')


def telefono():
    """M-WA-Alta: lo mismo que WA-Alta en el teléfono, con hojas desde abajo y avisos abajo. La ventana de Meta no se dibuja en el
    teléfono: Meta no publica cómo se ve en el celular, y se abre a pantalla completa con las mismas pantallas que en la compu."""
    t = (PROJ / "M-WA-Admin.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Números · conectar · teléfono</title>", t, count=1, flags=re.S)
    a = t.index('<div class="ap-fila">')
    b = t.index('<div class="ap-fila">', a + 5)
    fila = t[a:b].replace("+54 9 11 5555-0100", "+54 9 11 5555-0300").replace("Grupo Delta · también en la app", "Grupo Delta").replace("640 de 1.000 gratis", "0 de 1.000 gratis")
    fin_fila = t.index('</button></div>', b) + len('</button></div>')
    t = t[:fin_fila] + f'<sc-if value="{{{{e3}}}}" hint-placeholder-val="{{{{no}}}}">{fila}</sc-if>' + t[fin_fila:]
    campo = f'<div class="ap-cmp"><span class="rt"><span>Atiende a</span></span><div class="ct">Toda la organización{CHEV_TEL}</div></div>'
    opciones = (f'<div class="ap-pais" role="option" aria-selected="true">Toda la organización{ELEGIDO}</div>'
                + "".join(f'<div class="ap-pais" role="option" aria-selected="false">{e}</div>' for e in EMPRESAS))
    error = (f'<div class="ap-mot">{ALERTA}<div><b>Meta informó un error</b><span>Código 524126</span></div></div><span class="ap-sub">Qué podés hacer</span>'
             '<ol class="ap-pasos"><li><span class="n">1</span>Volvé a tocar «Conectar número»</li><li><span class="n">2</span>Si vuelve a pasar, escribí a soporte@ejemplo.com</li></ol>')
    estados = [
        hoja_tel("Conectar número", campo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Seguir en Meta</button>'),
        hoja_tel("Atiende a", opciones, "").replace('<div class="hp"></div>', ""),
        hoja_tel("Ventana de Meta abierta", "", '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Volver a la ventana</button>', cerrar=False),
        f'<div class="f-snack" role="status"><span class="ok">{OK_TEL}</span><span class="tx">Número conectado</span></div>',
        f'<div class="f-snack" role="status"><span class="neu">{INFO_TEL}</span><span class="tx">No se conectó el número</span></div>',
        hoja_tel("No se pudo conectar el número", error, '<button type="button" class="cb cb-pri">Entendido</button>'),
    ]
    fin = t.index('<span class="ap-raya"></span>')
    t = t[:fin] + "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{p}</sc-if>' for i, p in enumerate(estados)) + t[fin:]
    t = t.replace("</helmet>", CSS_TEL + "\n</helmet>", 1)
    t = tweak(t, "estado", OPCIONES_TEL)
    (PROJ / "M-WA-Alta.dc.html").write_text(t, encoding="utf-8")
    print("ok M-WA-Alta")


OPCIONES_PLAT = ["Ventana de Meta abierta", "Conectado", "Cancelado", "Error de Meta"]
VALS_PLAT = ("    const e = this.props.estado ?? \"Ventana de Meta abierta\";\n\n    return {\n      si: true,\n      no: false,\n"
             "      e0: e === \"Conectado\",\n      e1: false,\n      e2: e !== \"Conectado\",\n"
             + "".join(f"      f{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(OPCIONES_PLAT)) + "    };")


def a_plataforma(t, titulo, recien):
    """Pasa un tablero de Número de la plataforma (estados Conectado, Falta medio de pago y Sin número) a los del alta: el número
    recién conectado o la pantalla sin número detrás de lo que pasa con la ventana de Meta."""
    t = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t, count=1, flags=re.S)
    a = t.index('<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">')
    b = t.index('<sc-if value="{{e1}}"', a)
    bloque = t[a:b]
    for viejo, nuevo in recien:
        assert viejo in bloque, viejo
        bloque = bloque.replace(viejo, nuevo)
    t = t[:a] + bloque.replace("{{si}}", "{{no}}", 1) + t[b:]
    t = t.replace('<sc-if value="{{e2}}" hint-placeholder-val="{{no}}">', '<sc-if value="{{e2}}" hint-placeholder-val="{{si}}">', 1)
    viejo = re.search(r"    const e = this\.props\.estado \?\? \"Conectado\";.*?\n    \};", t, flags=re.S).group(0)
    t = t.replace(viejo, VALS_PLAT, 1)
    t = t.replace('"options":["Conectado","Falta medio de pago","Sin número"],"default":"Conectado"',
                  '"options":' + json.dumps(OPCIONES_PLAT, ensure_ascii=False, separators=(",", ":")) + ',"default":"Ventana de Meta abierta"', 1)
    return t


def plataforma():
    """Plat-WA-Alta y M-Plat-WA-Alta: el alta del número de la plataforma. Es la misma ventana de Meta (WA-Alta-Meta y
    WA-Alta-Coexistencia), sin «Atiende a»: el número de la plataforma no atiende a una organización ni a una empresa, así que
    «Conectar número» abre la ventana directo. Detrás, Número sin número; al terminar, el número recién conectado. Si Meta informa
    un error, el código va al soporte de Meta (no hay otro soporte arriba de la plataforma)."""
    recien = [("desde el 12/01/2026", "desde el 03/10/2026"), ("11.900 mensajes este mes", "0 mensajes este mes"), ("580 de 1.000 gratis este mes", "0 de 1.000 gratis este mes")]
    t = a_plataforma((PROJ / "Plat-WA-Numero.dc.html").read_text(encoding="utf-8"), "Plataforma › Administración › WhatsApp › Número · conectar", recien)
    capas = [f'<div class="mw-velo"></div>{PILL}',
             f'<div class="toast2" role="status">{OK}<span>Número conectado</span></div>',
             f'<div class="toast2" role="status">{INFO_GRIS}<span>No se conectó el número</span></div>',
             error_meta("Si vuelve a pasar, pasale el código al soporte de Meta")]
    fin = t.index("</div>\n</x-dc>")
    t = t[:fin] + "".join(f'<sc-if value="{{{{f{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{c}</sc-if>' for i, c in enumerate(capas)) + t[fin:]
    t = t.replace("</helmet>", CSS + "\n" + CSS_CONECTAR + "\n</helmet>", 1)
    (PROJ / "Plat-WA-Alta.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Alta")

    t = a_plataforma((PROJ / "M-Plat-WA-Numero.dc.html").read_text(encoding="utf-8"), "Número · conectar · teléfono", recien)
    capas = [hoja_tel("Ventana de Meta abierta", "", '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Volver a la ventana</button>', cerrar=False),
             f'<div class="f-snack" role="status"><span class="ok">{OK_TEL}</span><span class="tx">Número conectado</span></div>',
             f'<div class="f-snack" role="status"><span class="neu">{INFO_TEL}</span><span class="tx">No se conectó el número</span></div>',
             hoja_tel("No se pudo conectar el número",
                      f'<div class="ap-mot">{ALERTA}<div><b>Meta informó un error</b><span>Código 524126</span></div></div><span class="ap-sub">Qué podés hacer</span>'
                      '<ol class="ap-pasos"><li><span class="n">1</span>Volvé a tocar «Conectar número»</li><li><span class="n">2</span>Si vuelve a pasar, pasale el código al soporte de Meta</li></ol>',
                      '<button type="button" class="cb cb-pri">Entendido</button>')]
    fin = t.rindex('<span class="ap-raya"></span>')
    t = t[:fin] + "".join(f'<sc-if value="{{{{f{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{c}</sc-if>' for i, c in enumerate(capas)) + t[fin:]
    t = t.replace("</helmet>", CSS_TEL + "\n</helmet>", 1)
    (PROJ / "M-Plat-WA-Alta.dc.html").write_text(t, encoding="utf-8")
    print("ok M-Plat-WA-Alta")


# (tablero, título, página, x, y, ancho, alto, va después de)
TABLEROS = [
    ("WA-Alta", "Administración › WhatsApp › Números · conectar", "propuesta-whatsapp", 0, 8360, 1440, 900, "WA-Admin-Vacio"),
    ("WA-Alta-Meta", "Administración › WhatsApp › Números · ventana de Meta", "propuesta-whatsapp", 1520, 8360, 1440, 900, "WA-Alta"),
    ("WA-Alta-Coexistencia", "Administración › WhatsApp › Números · ventana de Meta · número de la app", "propuesta-whatsapp", 3040, 8360, 1440, 900, "WA-Alta-Meta"),
    ("M-WA-Alta", "Números · conectar · teléfono", "propuesta-whatsapp", 3290, 6340, 390, 844, "M-WA-Admin-Vacio"),
    ("Plat-WA-Alta", "Administración › WhatsApp › Número · conectar", "plataforma", 9120, 3260, 1440, 900, "Plat-WA-Numero"),
    ("M-Plat-WA-Alta", "Número · conectar · teléfono", "plataforma", 7520, 2300, 390, 844, "M-Plat-WA-Numero"),
]


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for nombre, titulo, pagina, x, y, w, h, despues in TABLEROS:
        clave = f"{nombre}.dc.html"
        datos = {"x": x, "y": y, "w": w, "h": h, "title": titulo, "page": pagina, "is_interactive": True}
        if clave in c["boards"]:
            c["boards"][clave].update(datos)
        else:
            c["boards"][clave] = datos
        if clave not in c["order"]:
            c["order"].insert(c["order"].index(f"{despues}.dc.html") + 1, clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8", newline="")


if __name__ == "__main__":
    alta()
    conectar()
    coexistencia()
    telefono()
    plataforma()
    lienzo()
