"""Etapa 9 · Límites de uso en Config-Plat y M-Config-Plat (decisión del usuario, 2026-10-16: opción A, una sección más
de Configuración con el mismo «Guardar cambios» y un solo motivo). Los doce perfiles `rateLimits` del contrato, con los
valores moderados de P3. Estados: con cambios, fuera de rango, el motivo, «Confirmá que sos vos» (reemplaza al diálogo
del motivo) y otra persona que cambió la configuración (409, el cartel de Pagina-Org). Se puede volver a correr."""
import importlib.util
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("otras", PROJ / "generadores" / "etapa9_otras_1004.py")
otras = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(otras)

# Perfil del contrato, grupo, nombre en pantalla, pedidos, cada, unidad (s, m, h).
PERFILES = [
    ("ip", "Para todo el servicio", "Por dirección IP", 300, 1, "m"),
    ("publicIp", "", "Páginas públicas, por dirección IP", 60, 1, "m"),
    ("identity", "", "Por cuenta", 120, 1, "m"),
    ("tenant", "", "Por organización", 600, 1, "m"),
    ("loginCode", "Ingreso", "Pedir un código", 20, 15, "m"),
    ("loginVerify", "", "Escribir un código", 30, 15, "m"),
    ("invitationPreview", "", "Abrir una invitación", 60, 15, "m"),
    ("invitationAccept", "", "Aceptar una invitación", 10, 15, "m"),
    ("assistantQuickQuery", "Asistente", "Consultas fijas", 20, 1, "m"),
    ("assistantConversation", "", "Conversaciones", 10, 1, "m"),
    ("assistantNewKey", "", "Probar una clave nueva", 3, 15, "m"),
    ("whatsAppWebhook", "WhatsApp", "Avisos de Meta", 120, 1, "m"),
]
ESTADOS = ["Sin cambios", "Con cambios", "Límite fuera de rango", "Guardar: motivo", "Guardar: confirmá que sos vos", "Otra persona cambió la configuración"]
E_PEDIDOS = "Usá un número de 1 a 1.000.000."
E_CADA = "Usá un tiempo de 1 segundo a 24 horas."
MOTIVO = "Más consultas fijas para la campaña de octubre."
T_REAUTH = "Para guardar la configuración, escribí el código de tu app de autenticación."
T_409 = "Otra persona cambió esto mientras lo editabas."


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def unidad(cada, u):
    uno = str(cada).strip() == "1"
    return {"s": "segundo" if uno else "segundos", "m": "minuto" if uno else "minutos", "h": "hora" if uno else "horas"}[u]


CSS_ESC = """
    /* Etapa 9: límites de uso */
    .lim { grid-column: 1 / -1; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
    .lim-cab, .lim-f { display: grid; grid-template-columns: minmax(0, 1fr) 140px 220px; gap: 16px; align-items: start; padding: 8px 16px; }
    .lim-cab { padding: 10px 16px; background: var(--s2); font-size: 12px; font-weight: 600; color: var(--t2); border-bottom: 1px solid var(--borde); }
    .lim-g { padding: 12px 16px 4px; font-size: 13px; font-weight: 600; color: var(--t2); border-top: 1px solid var(--borde); margin-top: 6px; }
    .lim-g.primero { border-top: 0; margin-top: 0; }
    .lim-n { font-size: 14px; color: var(--t1); padding-top: 8px; }
    .lim-c { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .lim-cada { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 8px; }
    .lim .in2 { height: 36px; min-height: 0; }
    .lim .err2 { font-size: 12.5px; }
    .w-cartel { display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 6px 8px 6px 14px; border-radius: 10px; font-size: 13px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
    .w-cartel .tx { flex: 1; }
    .w-cartel .lnk { color: oklch(0.4 0.1 70); }
  </style>"""


def escritorio():
    ruta = PROJ / "Config-Plat.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "Límites de uso" in t:
        print("Config-Plat ya tiene los límites")
        return
    chev = re.search(r'<svg width="14" height="14"[^>]*><path d="m7 10 5 5 5-5"/></svg>', t).group(0)
    t = r(t, """data-props='{"$preview":{"width":1440,"height":900}}'""",
          "data-props='" + json.dumps({"estado": {"editor": "enum", "options": ESTADOS, "default": "Sin cambios", "section": "Estado"},
                                       "$preview": {"width": 1440, "height": 900}}, ensure_ascii=False, separators=(",", ":")) + "'")

    filas = (
        '\n            <h2>Límites de uso</h2>\n'
        '            <div class="lim" role="group" aria-label="Límites de uso"><div class="lim-cab"><span>Límite</span><span>Pedidos</span><span>Cada</span></div>'
        '<sc-for list="{{limites}}" as="l" hint-placeholder-count="12">'
        '<sc-if value="{{l.grupo}}" hint-placeholder-val="{{no}}"><div class="lim-g {{l.claseGrupo}}">{{l.grupo}}</div></sc-if>'
        '<div class="lim-f"><span class="lim-n">{{l.n}}</span>'
        '<div class="lim-c"><input class="in2 {{l.malP}}" type="number" inputmode="numeric" value="{{l.p}}" onChange="{{l.onP}}" aria-label="{{l.ariaP}}">'
        '<sc-if value="{{l.errP}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{l.errP}}</span></sc-if></div>'
        '<div class="lim-c"><div class="lim-cada"><input class="in2 {{l.malC}}" type="number" inputmode="numeric" value="{{l.c}}" onChange="{{l.onC}}" aria-label="{{l.ariaC}}">'
        f'<button type="button" class="in2 {{{{l.malC}}}}" aria-haspopup="listbox" aria-label="{{{{l.ariaU}}}}"><span class="val">{{{{l.u}}}}</span>{chev}</button></div>'
        '<sc-if value="{{l.errC}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{l.errC}}</span></sc-if></div>'
        "</div></sc-for></div>\n"
    )
    fin = t.index("        </div>\n      </div>\n    </main>")
    t = t[:fin] + filas + t[fin:]
    # 409: el cartel de Pagina-Org arriba de la hoja.
    t = r(t, '<div class="pagina">\n        <div class="hoja" role="form"',
          '<div class="pagina">\n        <sc-if value="{{conflicto}}" hint-placeholder-val="{{no}}"><div class="w-cartel" role="alert">'
          f'<span class="tx">{T_409}</span><button type="button" class="lnk">Seguir editando</button><button type="button" class="b b-sec">Ver lo nuevo</button></div></sc-if>\n'
          '        <div class="hoja" role="form"')
    t = r(t, '<sc-if value="{{confirmacion}}"', otras.dialogo("reauthGuardar", T_REAUTH) + '<sc-if value="{{confirmacion}}"')

    lim = "{ " + ", ".join(f"{k}: {{ p: '{p}', c: '{c}', u: '{u}' }}" for k, _, _, p, c, u in PERFILES) + " }"
    t = r(t, "ventas: 'ventas@ejemplo.com', soporte: 'soporte@ejemplo.com' }, registro:",
          f"ventas: 'ventas@ejemplo.com', soporte: 'soporte@ejemplo.com', lim: LIM }}, lim: LIM, errLim: {{}}, conflicto: false, reauth: false, claveEstado: props.estado, registro:")
    t = r(t, "class Component extends DCLogic {",
          "// Etapa 9: los doce perfiles rateLimits de PlatformSettings, con los valores iniciales moderados (P3).\n"
          f"const LIM = {lim};\n"
          "const PERFILES = " + json.dumps([[k, g, n] for k, g, n, *_ in PERFILES], ensure_ascii=False) + ";\n"
          "const SEG = { s: 1, m: 60, h: 3600 };\n"
          "const UNIDAD = (c, u) => ({ s: ['segundo', 'segundos'], m: ['minuto', 'minutos'], h: ['hora', 'horas'] })[u][String(c).trim() === '1' ? 0 : 1];\n\n"
          "class Component extends DCLogic {")
    t = r(t, "  avisar(texto, tipo = 'ok') {",
          "  // Etapa 9: estados del tablero (tweak «Estado»).\n"
          "  desdeEstado(e) {\n"
          "    const lim = JSON.parse(JSON.stringify(LIM));\n"
          "    const base = { lim, errLim: {}, conflicto: false, reauth: false, confirmar: null, motivo: '', errMotivo: '' };\n"
          "    if (!e || e === 'Sin cambios') return base;\n"
          "    lim.assistantQuickQuery.p = '30';\n"
          f"    if (e === 'Límite fuera de rango') {{ lim.assistantQuickQuery.p = '0'; lim.assistantNewKey.c = '48'; lim.assistantNewKey.u = 'h'; return {{ ...base, errLim: {{ assistantQuickQuery: {{ p: '{E_PEDIDOS}' }}, assistantNewKey: {{ c: '{E_CADA}' }} }} }}; }}\n"
          f"    if (e === 'Guardar: motivo') return {{ ...base, confirmar: this.confirmacionGuardar(), motivo: '{MOTIVO}' }};\n"
          "    // Sin una confirmación reciente, este diálogo reemplaza al del motivo; Cancelar vuelve a él con el motivo escrito.\n"
          "    if (e === 'Guardar: confirmá que sos vos') return { ...base, reauth: true };\n"
          "    // 409 General.ConcurrencyConflict: no pisa los cambios de la otra persona.\n"
          "    if (e === 'Otra persona cambió la configuración') return { ...base, conflicto: true };\n"
          "    return base;\n"
          "  }\n\n"
          "  componentDidUpdate() {\n"
          "    if (this.props.estado !== this.state.claveEstado) this.setState({ claveEstado: this.props.estado, ...this.desdeEstado(this.props.estado) });\n"
          "  }\n\n"
          "  confirmacionGuardar() {\n"
          "    return { titulo: '¿Guardar la configuración?', texto: 'Cambia cómo entran las personas y las organizaciones nuevas, y los límites de uso. Lo que ya existe no cambia.', boton: 'Guardar', peligro: false, motivo: true, accion: () => { const s = this.state; this.setState({ guardado: { registro: s.registro, alta: s.alta, limite: s.limite, ventas: s.ventas.trim(), soporte: s.soporte.trim(), lim: JSON.parse(JSON.stringify(s.lim)) } }); this.avisar('Guardamos la configuración.'); } };\n"
          "  }\n\n"
          "  avisar(texto, tipo = 'ok') {")
    # El estado inicial sale del tweak.
    t = r(t, "errLimite: '', errVentas: '', errSoporte: '' };\n  }",
          "errLimite: '', errVentas: '', errSoporte: '' };\n    Object.assign(this.state, this.desdeEstado(props.estado));\n  }")
    viejo_sucio = "s.registro !== s.guardado.registro || s.alta !== s.guardado.alta || s.limite !== s.guardado.limite || s.ventas !== s.guardado.ventas || s.soporte !== s.guardado.soporte"
    nuevo_sucio = viejo_sucio + " || JSON.stringify(s.lim) !== JSON.stringify(s.guardado.lim)"
    t = r(t, viejo_sucio, nuevo_sucio, 2)
    t = r(t, "descartar: () => this.setState({ ...s.guardado, errLimite: '', errVentas: '', errSoporte: '', abierto: null }),",
          "descartar: () => this.setState({ ...s.guardado, lim: JSON.parse(JSON.stringify(s.guardado.lim)), errLim: {}, conflicto: false, errLimite: '', errVentas: '', errSoporte: '', abierto: null }),")
    t = r(t, "        if (errores.errLimite || errores.errVentas || errores.errSoporte) {\n          this.setState({ ...errores, abierto: null });",
          "        // Límites: pedidos de 1 a 1.000.000 y ventana de 1 segundo a 24 horas; sin cero para desactivar.\n"
          "        const errLim = {};\n"
          "        for (const [k] of PERFILES) {\n"
          "          const l = s.lim[k];\n"
          "          const p = Number(l.p);\n"
          "          const seg = Number(l.c) * SEG[l.u];\n"
          f"          if (!Number.isInteger(p) || p < 1 || p > 1000000) errLim[k] = {{ ...errLim[k], p: '{E_PEDIDOS}' }};\n"
          f"          if (!Number.isInteger(Number(l.c)) || seg < 1 || seg > 86400) errLim[k] = {{ ...errLim[k], c: '{E_CADA}' }};\n"
          "        }\n\n"
          "        if (errores.errLimite || errores.errVentas || errores.errSoporte || Object.keys(errLim).length) {\n          this.setState({ ...errores, errLim, abierto: null });")
    t = re.sub(r"this\.pedirConfirmacion\(\{ titulo: '¿Guardar la configuración\?'.*?\} \}\);\n", "this.pedirConfirmacion(this.confirmacionGuardar());\n", t, count=1, flags=re.S)
    assert "this.pedirConfirmacion(this.confirmacionGuardar());" in t
    t = r(t, "      errLimite: s.errLimite,\n    };",
          "      errLimite: s.errLimite,\n"
          "      conflicto: s.conflicto,\n"
          "      reauthGuardar: s.reauth,\n"
          "      limites: PERFILES.map(([k, g, n], i) => {\n"
          "        const l = s.lim[k];\n"
          "        const e = s.errLim[k] || {};\n"
          "        const poner = (campo, v) => this.setState({ lim: { ...this.state.lim, [k]: { ...this.state.lim[k], [campo]: v } }, errLim: { ...this.state.errLim, [k]: { ...(this.state.errLim[k] || {}), [campo]: '' } } });\n"
          "        return { grupo: g, claseGrupo: i === 0 ? 'primero' : '', n, p: l.p, c: l.c, u: UNIDAD(l.c, l.u), malP: e.p ? 'mal' : '', malC: e.c ? 'mal' : '', errP: e.p || '', errC: e.c || '',\n"
          "          onP: (ev) => poner('p', ev.target.value), onC: (ev) => poner('c', ev.target.value), ariaP: 'Pedidos · ' + n, ariaC: 'Cada · ' + n, ariaU: 'Unidad · ' + n };\n"
          "      }),\n"
          "    };")
    t = t.replace("  </style>", CSS_ESC, 1)
    if ".ra .otp input" not in t:
        t = t.replace("  </style>", otras.css_del_dialogo(), 1)
    ruta.write_text(t, encoding="utf-8")
    print("Config-Plat: límites y 6 estados")


CSS_TEL = """
    /* Etapa 9: límites de uso */
    .lim-gm { font-size: 13px; font-weight: 600; color: var(--t2); margin: 6px 0 -6px; }
    .lim-m { display: grid; grid-template-columns: minmax(0, 1fr) auto 64px minmax(0, 1.25fr); gap: 8px; align-items: center; }
    .lim-m .cada { font-size: 14px; color: var(--t2); }
    .lim-m .ct.mal { border-color: var(--peligro); }
    .lim-err { font-size: 13px; color: oklch(0.5 0.19 25); margin-top: -6px; }
    .ap-cartel { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 12px; font-size: 14px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
    .ap-cartel .ac { display: flex; gap: 16px; }
    .ap-cartel button { border: 0; background: transparent; padding: 0; font: inherit; font-weight: 600; color: inherit; }
  </style>"""


def telefono():
    ruta = PROJ / "M-Config-Plat.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "Límites de uso" in t:
        print("M-Config-Plat ya tiene los límites")
        return
    chev = re.search(r'<div class="ct">Abierto(<svg.*?</svg>)</div>', t).group(1)
    i = t.index('<div class="ap-cuerpo"')
    j = t.index('<div class="ap-fijo">', i)
    cuerpo = t[i:j]
    assert cuerpo.endswith("</div>")
    dentro = cuerpo[cuerpo.index(">") + 1:-len("</div>")]
    abre = cuerpo[:cuerpo.index(">") + 1]
    gtit = '<span class="ap-gtit" style="margin: 14px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">Límites de uso</span>'
    cartel = (f'<div class="ap-cartel" role="alert"><span>{T_409}</span><div class="ac"><button type="button">Seguir editando</button>'
              '<button type="button">Ver lo nuevo</button></div></div>')

    def filas(cambios=False, error=False, desde=None):
        out = []
        ver = desde is None
        for k, g, n, p, c, u in PERFILES:
            ver = ver or k == desde
            if not ver:
                continue
            if g:
                out.append(f'<span class="lim-gm">{g}</span>')
            mp = mc = ""
            err = ""
            if cambios and k == "assistantQuickQuery":
                p = 30
            if error and k == "assistantQuickQuery":
                p, mp, err = 0, " mal", f'<span class="lim-err" role="alert">{E_PEDIDOS}</span>'
            if error and k == "assistantNewKey":
                c, u, mc, err = 48, "h", " mal", f'<span class="lim-err" role="alert">{E_CADA}</span>'
            out.append(f'<div class="ap-cmp"><span class="rt"><span>{n}</span></span><div class="lim-m"><div class="ct{mp}">{p}</div>'
                       f'<span class="cada">cada</span><div class="ct{mc}">{c}</div><div class="ct{mc}">{unidad(c, u)}{chev}</div></div></div>{err}')
        return ("" if desde else gtit) + "".join(out)

    pie = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>'
    assert pie in t
    pie_on = pie.replace(" apag", "")
    hoja_motivo = ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="¿Guardar la configuración?"><span class="asa"></span>'
                   '<div class="hc"><div><h2>¿Guardar la configuración?</h2></div></div><div class="hb">'
                   '<p class="ap-txt-l">Cambia cómo entran las personas y las organizaciones nuevas, y los límites de uso. Lo que ya existe no cambia.</p>'
                   f'<div class="ap-cmp"><span class="rt"><span>Motivo <span class="rq">*</span></span></span><div class="ct area">{MOTIVO}</div></div></div>'
                   '<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button></div></div>')
    celdas = "".join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Código {i}">' for i in range(1, 7))
    hoja_reauth = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Confirmá que sos vos"><span class="asa"></span>'
                   '<div class="hc"><div><h2>Confirmá que sos vos</h2></div></div><div class="hb">'
                   f'<p class="ap-txt-l">{T_REAUTH}</p><div class="ra"><div class="otp " role="group" aria-label="Código">{celdas}</div>'
                   '<button type="button" class="ra-rec">Usar un código de recuperación</button></div></div>'
                   '<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Confirmar</button></div></div>')
    # «Sin cambios» y «Con cambios» muestran la pantalla desde arriba; los demás, ya bajada hasta los límites.
    vistas = {
        "e0": abre + dentro + filas() + "</div>" + pie,
        "e1": abre + dentro + filas(cambios=True) + "</div>" + pie_on,
        "e2": abre + filas(error=True, desde="assistantQuickQuery") + "</div>" + pie_on,
        "e3": abre + filas(cambios=True) + "</div>" + pie_on + hoja_motivo,
        "e4": abre + filas(cambios=True) + "</div>" + pie_on + hoja_reauth,
        "e5": abre + cartel + filas(cambios=True) + "</div>" + pie_on,
    }
    resto = t[j + len(pie):]
    t = t[:i] + "".join(f'<sc-if value="{{{{{k}}}}}" hint-placeholder-val="{{{{no}}}}">{v}</sc-if>' for k, v in vistas.items()) + resto
    t = r(t, """data-props='{"$preview":{"width":390,"height":844}}'""",
          "data-props='" + json.dumps({"estado": {"editor": "enum", "options": ESTADOS, "default": "Sin cambios", "section": "Estado"},
                                       "$preview": {"width": 390, "height": 844}}, ensure_ascii=False, separators=(",", ":")) + "'")
    t = r(t, "  renderVals() {\n    return { si: true, no: false };\n  }",
          "  renderVals() {\n    const e = this.props.estado || 'Sin cambios';\n    return {\n      si: true,\n      no: false,\n"
          + "".join(f"      e{n}: e === {json.dumps(x, ensure_ascii=False)},\n" for n, x in enumerate(ESTADOS)) + "    };\n  }")
    t = t.replace("  </style>", CSS_TEL, 1)
    if ".ra .otp input" not in t:
        tel = (PROJ / "M-Cuenta-Plat.dc.html").read_text(encoding="utf-8")
        lineas = [l.strip() for l in tel.splitlines() if re.match(r"\s*\.(ra|ra-err|ra-rec)\b", l) and l.rstrip().endswith("}") and ".rec" not in l.split("{")[0] and "bloq" not in l]
        assert any(".ra .otp input" in l for l in lineas)
        t = t.replace("  </style>", "\n    /* Etapa 9: «Confirmá que sos vos», copiado de M-Cuenta-Plat */\n" + "\n".join("    " + l for l in lineas) + "\n  </style>", 1)
    ruta.write_text(t, encoding="utf-8")
    print("M-Config-Plat: límites y 6 estados")


if __name__ == "__main__":
    escritorio()
    telefono()
