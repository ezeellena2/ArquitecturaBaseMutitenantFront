"""Etapa 9 · Eventos nuevos en la auditoría de Plataforma (pedido de la Guía, 2026-10-16): alta y restablecimiento
del autenticador, uso de un código de recuperación y la confirmación de una acción delicada. Nunca muestran
códigos ni secretos; el restablecimiento conserva su motivo. Auditoria-Plat y M-Auditoria-Plat. Se puede volver a correr."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

# Fecha, tipo del filtro, qué pasó, sobre qué, quién, rol, motivo, IP.
NUEVOS = [
    ("27/09/2026 11:40", "cuentas", "Restableció el autenticador", "Laura Díaz", "Martín Sosa", "Operador", "Cambió de celular.", "181.45.•••.12"),
    ("27/09/2026 11:38", "ingresos", "Confirmó con el autenticador", "Plataforma", "Martín Sosa", "Operador", "—", "181.45.•••.12"),
    ("27/09/2026 11:05", "ingresos", "Ingresó con un código de recuperación", "Plataforma", "Laura Díaz", "Operador", "—", "181.45.•••.30"),
    ("27/09/2026 10:58", "ingresos", "Configuró el autenticador", "Plataforma", "Julieta Molina", "Operador", "—", "190.12.•••.4"),
]


def r(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def escritorio():
    ruta = PROJ / "Auditoria-Plat.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if NUEVOS[0][2] in t:
        print("Auditoria-Plat ya tiene los eventos")
        return
    filas = "".join(
        f"  {{ id: 'n{i}', fecha: '{f}', periodo: 0, tipo: '{tp}', que: '{q}', donde: '{d}', org: null, quien: '{w}', rol: '{rol}', motivo: '{m}', ip: '{ip}' }},\n"
        for i, (f, tp, q, d, w, rol, m, ip) in enumerate(NUEVOS, 1))
    t = r(t, "const EVENTOS = [\n",
          "const EVENTOS = [\n  // Etapa 9: alta y restablecimiento del autenticador, código de recuperación y confirmación de una acción delicada.\n" + filas)
    ruta.write_text(t, encoding="utf-8")
    print("Auditoria-Plat: 4 eventos")


def telefono():
    ruta = PROJ / "M-Auditoria-Plat.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if NUEVOS[0][2] in t:
        print("M-Auditoria-Plat ya tiene los eventos")
        return
    filas = ""
    for f, _, q, d, w, _, m, _ in NUEVOS:
        dia, hora = f.split(" ")
        l3 = f'<span class="l3">{m}</span>' if m != "—" else ""
        filas += (f'<a class="ap-fila" href="#"><div class="tx"><span class="l1"><span class="q">{q}</span><span>{dia[:5]} {hora}</span></span>'
                  f'<span class="l2">{d} · {w}</span>{l3}</div></a>')
    t = r(t, '<div class="ap-cuerpo"><a class="ap-fila" href="#"><div class="tx"><span class="l1"><span class="q">Ingresó con el autenticador</span>',
          '<div class="ap-cuerpo">' + filas + '<a class="ap-fila" href="#"><div class="tx"><span class="l1"><span class="q">Ingresó con el autenticador</span>')
    ruta.write_text(t, encoding="utf-8")
    print("M-Auditoria-Plat: 4 eventos")


if __name__ == "__main__":
    escritorio()
    telefono()
