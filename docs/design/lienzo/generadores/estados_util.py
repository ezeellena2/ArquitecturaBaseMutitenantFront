"""Ayudas para sumar estados a un tablero sin inventar piezas: se clona un estado que ya existe (un bloque
`<sc-if value="{{eN}}">`) y se le cambian algunos textos o clases. Las usan los generadores `estados_*_1004.py`."""
import json
import re


def rep(t, a, b, n=1):
    """Reemplaza `a` por `b` y exige que `a` aparezca exactamente `n` veces."""
    assert t.count(a) == n, (a[:100], t.count(a))
    return t.replace(a, b)


def rango_bloque(t, var):
    """Devuelve (inicio, fin) del bloque `<sc-if value="{{var}}" …>…</sc-if>`, contando los sc-if de adentro."""
    m = re.search(r'<sc-if value="\{\{' + re.escape(var) + r'\}\}"[^>]*>', t)
    assert m, var
    prof = 0
    for k in re.finditer(r"<sc-if\b|</sc-if>", t[m.start():]):
        prof += 1 if k.group(0) == "<sc-if" else -1
        if prof == 0:
            return m.start(), m.start() + k.end()
    raise AssertionError("sc-if sin cerrar: " + var)


def nombre_de(t, var):
    """El nombre del estado que activa `var` según la línea `var: e === "…",` de renderVals."""
    m = re.search(r"\b" + re.escape(var) + r': e === "([^"]+)",', t)
    assert m, var
    return m.group(1)


def sumar_opcion(t, despues_de, nuevo, prop="estado"):
    """Suma `nuevo` a las opciones del Tweak `prop`, justo después de `despues_de`."""
    m = re.search(r'"' + re.escape(prop) + r'":\{"editor":"enum","options":\[([^\]]*)\]', t)
    assert m, prop
    opciones = json.loads("[" + m.group(1) + "]")
    assert despues_de in opciones and nuevo not in opciones, (despues_de, nuevo)
    opciones.insert(opciones.index(despues_de) + 1, nuevo)
    nuevas = ",".join(json.dumps(o, ensure_ascii=False) for o in opciones)
    return t[:m.start(1)] + nuevas + t[m.end(1):]


def ordenar_opciones(t, orden, prop="estado"):
    """Deja las opciones del Tweak `prop` en el orden dado (deben ser las mismas)."""
    m = re.search(r'"' + re.escape(prop) + r'":\{"editor":"enum","options":\[([^\]]*)\]', t)
    assert m, prop
    assert sorted(json.loads("[" + m.group(1) + "]")) == sorted(orden), orden
    return t[:m.start(1)] + ",".join(json.dumps(o, ensure_ascii=False) for o in orden) + t[m.end(1):]


def clonar(t, var_base, var_nuevo, nombre_nuevo, cambios, prop="estado"):
    """Clona el estado `var_base` como `var_nuevo` («nombre_nuevo»), le aplica `cambios` [(viejo, nuevo[, veces])] y lo deja después."""
    i, j = rango_bloque(t, var_base)
    bloque = t[i:j]
    nuevo = re.sub(r'^<sc-if value="\{\{' + re.escape(var_base) + r'\}\}" hint-placeholder-val="\{\{(si|no)\}\}">',
                   '<sc-if value="{{' + var_nuevo + '}}" hint-placeholder-val="{{no}}">', bloque, count=1)
    for c in cambios:
        viejo, bueno = c[0], c[1]
        veces = c[2] if len(c) > 2 else 1
        assert nuevo.count(viejo) == veces, (var_nuevo, viejo[:100], nuevo.count(viejo))
        nuevo = nuevo.replace(viejo, bueno)
    t = t[:j] + nuevo + t[j:]
    base = nombre_de(t, var_base)
    t = sumar_opcion(t, base, nombre_nuevo, prop)
    linea = f'      {var_base}: e === "{base}",\n'
    return rep(t, linea, linea + f'      {var_nuevo}: e === "{nombre_nuevo}",\n')


def marcar(t, marca, css=""):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {marca}>\n{css}</style>\n</helmet>")


def con_estados_pantalla(t, nombre, ancho=390, alto=844):
    """Teléfono sin estados: envuelve la pantalla (de la barra de estado a la rayita de abajo) en `e0` y le suma el Tweak «estado»."""
    cab, cuerpo = t.split("</helmet>", 1)
    i = cuerpo.index('<div class="ap-est">')
    j = cuerpo.index('<span class="ap-raya">')
    cuerpo = cuerpo[:i] + '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">' + cuerpo[i:j] + "</sc-if>" + cuerpo[j:]
    t = cab + "</helmet>" + cuerpo
    props = json.dumps({"estado": {"editor": "enum", "options": [nombre], "default": nombre, "section": "Estado"},
                        "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\":{\"width\":%d,\"height\":%d}}'" % (ancho, alto), f"data-props='{props}'")
    n = json.dumps(nombre, ensure_ascii=False)
    return rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
               "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.estado ?? {n};\n\n    return {{\n      si: true,\n      no: false,\n      e0: e === {n},\n    }};\n  }}\n}}")


CERRAR_HOJA = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
ALERTA = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>')
CHEV_CAMPO = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')


def hoja(titulo, cuerpo, pie, sub=""):
    """Una hoja del teléfono, desde abajo, con manija, ✕, el cuerpo y los botones (como M-Usuario-Empresa)."""
    s = f'<span class="h-sub">{sub}</span>' if sub else ""
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="' + titulo + '"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2>{s}</div><button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_HOJA}</button></div>'
            f'<div class="hb">{cuerpo}</div><div class="hp">{pie}</div></div>')


def campo(rotulo, valor, req=False, vacio=False, select=False, extra=""):
    r = ' <span class="rq">*</span>' if req else ""
    clase = "ct" + (" ph" if vacio else "") + (" sel" if select else "")
    v = valor + (CHEV_CAMPO if select else "")
    return f'<div class="ap-cmp"><span class="rt"><span>{rotulo}{r}</span>{extra}</span><div class="{clase}">{v}</div></div>'


def franja_hoja(texto):
    return f'<div class="aviso-mal tel" role="alert">{ALERTA}<span>{texto}</span></div>'


CSS_TEL = """.f-banda { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; font-size: 14.5px; line-height: 1.4; }
.f-banda svg { flex-shrink: 0; margin-top: 2px; }
.f-banda.mal { background: oklch(0.96 0.03 25); color: oklch(0.45 0.17 25); }
.ap-bar .sub.amb { color: oklch(0.55 0.13 70); }
.ap-bar .sub .amb-t { color: oklch(0.55 0.13 70); }
.aviso-mal { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 14.5px; line-height: 1.4; }
.aviso-mal svg { flex-shrink: 0; margin-top: 2px; }
.ap-todos { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--t2); }
.ap-todos .ap-chk { width: 20px; height: 20px; }
.ap-cmp .ct.sel { display: flex; align-items: center; justify-content: space-between; }
.ap-cmp .ct.sel svg { color: var(--t3); flex-shrink: 0; }
.ap-cmp .ct.ph { color: var(--t3); text-align: left; }
.ap-hoja .hc .h-sub { display: block; font-size: 13.5px; color: var(--t3); margin-top: 2px; }
.w-est.amb::before { background: oklch(0.72 0.15 70); }
.ap-it .acc-t { color: var(--marca-tx); font-weight: 600; font-size: 15px; text-decoration: none; }
"""
