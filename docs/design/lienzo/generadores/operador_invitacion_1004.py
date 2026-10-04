"""La invitación de un operador de Plataforma (ADR 0042, precisión del 2026-10-04): queda pendiente hasta que la persona entra, y
vence a los 7 días, como la invitación a una organización (lo eligió el usuario). Sale solo por correo, como pide el diálogo
«Invitar operador».
- Mensajes: «Invitación como operador», con quién invita, los permisos, el vencimiento y que la cuenta es solo para operar la plataforma.
- Cuentas y M-Cuentas: el operador invitado en «Invitación pendiente» (o «Invitación vencida»), con «Reenviar invitación» y «Revocar
  invitación», como en Usuarios. Invitar suma la fila pendiente.
Cada tablero lleva `data-vuelta="1004-operador-invitacion"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-operador-invitacion"'
CORREO = "julieta.molina@arquitecturabase.ejemplo.com"


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t):
    return rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")


# ---------- Mensajes ----------
ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '"Invitación a una organización",', '"Invitación a una organización","Invitación como operador",')
    nuevo = f"""  {{
    n: 'Invitación como operador',
    // ADR 0042: «Invitar operador» deja la invitación pendiente hasta que entra, y vence a los 7 días. Solo por correo.
    correo: {{
      asunto: 'Martín Sosa te invitó como operador de ArquitecturaBase',
      para: '{CORREO}',
      titulo: 'Te invitaron como operador',
      parrafos: [P('Hola. Martín Sosa te invitó a sumarte como operador de la plataforma ArquitecturaBase.')],
      datos: [{{ k: 'Permisos', v: 'Ver organizaciones, Ver cuentas y Recuperaciones' }}, {{ k: 'Vence', v: '04/10/2026' }}],
      boton: 'Ingresar',
      notas: [P('Para entrar, usá este correo antes de que venza la invitación: te vamos a mandar un código de acceso.'),
        P('Esta cuenta es solo para operar la plataforma: no se usa como persona ni para entrar a una organización.')],
      pie: 'Si no esperabas este correo, podés ignorarlo. Sin el código, nadie puede entrar a tu cuenta.',
    }},
  }},
"""
    i = t.index("    n: 'Invitación a una organización',")
    j = t.index("\n  {\n", i) + 1  # el comienzo del mensaje siguiente
    t = t[:j] + nuevo + t[j:]
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Mensajes")

# ---------- Cuentas (compu) ----------
REENVIAR_IC = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>')
REVOCAR_IC = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
ruta = PROJ / "Cuentas.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    o2 = "  { id: 'o2', n: 'Laura Díaz', email: 'laura.diaz@arquitecturabase.ejemplo.com', tel: '', tipo: 'operador', permisos: 2, ultimo: 'hace 5 días', metodo: 'Código + autenticador', estado: 'activa' },\n"
    t = rep(t, o2, o2 + f"  {{ id: 'o3', n: '', email: '{CORREO}', tel: '', tipo: 'operador', permisos: 3, ultimo: 'Nunca', metodo: 'Vence el 04/10/2026', estado: 'invitado' }},\n")
    t = rep(t, "        const nombre = c.n || c.email;\n\n        return {\n          ...this.fila(c.id, nombre, i, pg.items.length),",
            "        const nombre = c.n || c.email;\n        const inv = c.estado === 'invitado' || c.estado === 'vencida';\n\n        return {\n          ...this.fila(c.id, nombre, i, pg.items.length),")
    t = rep(t, "pill: { activa: 'ok', suspendida: 'alerta', recuperacion: 'mal', baja: 'alerta', eliminada: 'off' }[c.estado],",
            "pill: { activa: 'ok', suspendida: 'alerta', recuperacion: 'mal', baja: 'alerta', eliminada: 'off', invitado: 'pend', vencida: 'alerta' }[c.estado],")
    t = rep(t, "textoEstado: { activa: 'Activa', suspendida: 'Suspendida', recuperacion: 'Necesita recuperación', baja: 'Baja pedida', eliminada: 'Eliminada' }[c.estado],",
            "textoEstado: { activa: 'Activa', suspendida: 'Suspendida', recuperacion: 'Necesita recuperación', baja: 'Baja pedida', eliminada: 'Eliminada', invitado: 'Invitación pendiente', vencida: 'Invitación vencida' }[c.estado],")
    t = rep(t, "          suspendida: c.estado === 'suspendida',\n",
            "          suspendida: c.estado === 'suspendida',\n"
            "          invitacion: inv,\n"
            "          // POST /api/platform/operators/{id}/invitation/resend: renueva el vencimiento, 7 días.\n"
            "          reenviar: () => { this.setState({ abierto: null }); this.poner(c.id, { estado: 'invitado', metodo: 'Vence el 04/10/2026' }); this.avisar('Reenviamos la invitación a ' + nombre + '.'); },\n"
            "          revocar: () => this.pedirConfirmacion({ titulo: '¿Revocar la invitación a ' + nombre + '?', texto: 'El enlace deja de funcionar. Podés volver a invitarla cuando quieras.', boton: 'Revocar', accion: () => { this.setState({ cuentas: this.state.cuentas.filter((x) => x.id !== c.id) }); this.avisar('Revocamos la invitación a ' + nombre + '.'); } }),\n")
    t = rep(t, "          conSesiones: c.estado !== 'baja' && c.estado !== 'eliminada',\n", "          conSesiones: c.estado !== 'baja' && c.estado !== 'eliminada' && !inv,\n")
    t = rep(t, "          puedeBaja: c.estado !== 'baja' && c.estado !== 'eliminada',\n", "          puedeBaja: c.estado !== 'baja' && c.estado !== 'eliminada' && !inv,\n")
    t = rep(t, "          sepBaja: c.estado !== 'activa' && c.estado !== 'baja' && c.estado !== 'eliminada',\n",
            "          sepBaja: c.estado !== 'activa' && c.estado !== 'baja' && c.estado !== 'eliminada' && !inv,\n")
    t = rep(t, '<sc-if value="{{c.conSesiones}}" hint-placeholder-val="{{si}}"><button type="button" class="menu-it" role="menuitem" onClick="{{c.cerrarSesiones}}">',
            f'<sc-if value="{{{{c.invitacion}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="menu-it" role="menuitem" onClick="{{{{c.reenviar}}}}">{REENVIAR_IC} Reenviar invitación</button>'
            f'<div class="menu-sep" role="separator"></div><button type="button" class="menu-it pel" role="menuitem" onClick="{{{{c.revocar}}}}">{REVOCAR_IC} Revocar invitación</button></sc-if>'
            '<sc-if value="{{c.conSesiones}}" hint-placeholder-val="{{si}}"><button type="button" class="menu-it" role="menuitem" onClick="{{c.cerrarSesiones}}">')
    t = rep(t, "metodo: 'Invitación enviada', estado: 'activa', nueva: true", "metodo: 'Vence el 04/10/2026', estado: 'invitado', nueva: true")
    t = rep(t, "{ v: 'activa', n: 'Activas' }, { v: 'suspendida', n: 'Suspendidas' }",
            "{ v: 'activa', n: 'Activas' }, { v: 'invitado', n: 'Invitación pendiente' }, { v: 'vencida', n: 'Invitación vencida' }, { v: 'suspendida', n: 'Suspendidas' }")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Cuentas")

# ---------- M-Cuentas (teléfono) ----------
ruta = PROJ / "M-Cuentas.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    i = t.index('<span class="w-av">M</span><span class="tx"><span class="l1"><b>Martín Sosa</b>')
    i = t.rindex('<div class="w-conv"', 0, i)
    j = t.index("</button></div>", i) + len("</button></div>")
    martin = t[i:j]
    kebab = martin[martin.index('<button type="button" class="ap-ib"'):]
    fila = ('<div class="w-conv" style="align-items: center; padding-right: 6px;"><a href="#" style="display: flex; gap: 14px; flex: 1; min-width: 0; color: inherit; text-decoration: none;">'
            f'<span class="w-av g">J</span><span class="tx"><span class="l1"><b>{CORREO}</b></span><span class="l2"><span>Operador</span></span>'
            '<span class="l3"><span class="w-est azul">Invitación pendiente</span> · vence 04/10</span></span></a>'
            + kebab.replace("Acciones de Martín Sosa", f"Acciones de {CORREO}"))
    t = t[:j] + fila + t[j:]
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok M-Cuentas")
