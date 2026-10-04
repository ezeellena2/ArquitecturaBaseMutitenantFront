"""«Cargar teléfonos de empleados» sin revelar si un número tiene cuenta (ADR 0041, «en todos lados»; lo resolvió el usuario el
2026-10-04). Antes, cada número salía como «Ya es miembro», «Tiene cuenta» (con el nombre de la persona) o «Sin cuenta», y eso le
decía a la organización qué números tienen cuenta. Ahora sale «Ya es miembro» (la organización ya conoce a sus miembros), «Se invita»
(para todos los demás, sin nombre: le llega una invitación por WhatsApp y la cuenta se vincula al aceptar) o «Número inválido».
Cambia WA-Telefonos y M-WA-Telefonos. Lleva `data-vuelta="1004-telefonos-sin-revelar"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-telefonos-sin-revelar"'


def rep(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t):
    return rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")


ruta = PROJ / "WA-Telefonos.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<span>+54 9 11 5555-8812</span><span>Gabriel Ortiz</span>',
            '<span>+54 9 11 5555-8812</span><span><span style="color: var(--t3);">—</span></span>')
    t = rep(t, '<span class="w-est inv" style="font-size: 13px; color: var(--t1);">Tiene cuenta</span><span>Le llega una invitación a Grupo Delta</span>',
            '<span class="w-est inv" style="font-size: 13px; color: var(--t1);">Se invita</span><span>Le llega una invitación por WhatsApp</span>')
    t = rep(t, '<span class="w-est inv" style="font-size: 13px; color: var(--t1);">Sin cuenta</span>',
            '<span class="w-est inv" style="font-size: 13px; color: var(--t1);">Se invita</span>', 2)
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok WA-Telefonos")

ruta = PROJ / "M-WA-Telefonos.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<span class="l1">+54 9 11 5555-8812<span><span class="w-est azul">Tiene cuenta</span></span></span><span class="l2">Gabriel Ortiz</span><span class="l3">Le llega una invitación a Grupo Delta</span>',
            '<span class="l1">+54 9 11 5555-8812<span><span class="w-est azul">Se invita</span></span></span><span class="l3">Le llega una invitación por WhatsApp</span>')
    t = rep(t, '<span class="w-est off">Sin cuenta</span>', '<span class="w-est azul">Se invita</span>', 2)
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok M-WA-Telefonos")
