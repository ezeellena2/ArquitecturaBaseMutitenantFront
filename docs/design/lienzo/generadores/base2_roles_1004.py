"""Roles en áreas plegables (260) y lo que no se puede dar (269), para la F5 de la segunda parte de la base: `Rol-Base2` y
`M-Rol-Base2`. Las piezas están en `base2_comun.py`; los tableros parten de la copia de `base2_1004/`.

Quien edita es Lucía Fernández, la Dueña, salvo en «Lo que no podés dar», donde es Valeria Castro, con «Administración de
personas» (Usuarios y Roles enteros, «Ver empresas», «Usar el asistente» y «Atender clientes»), como en las acciones del asistente.
"""
import acciones_asistente_1004 as acc
from base2_comun import (EMPRESA, ORG, POR_QUE_DUENO, areas, copia, css, escribir, fin_div, por_estado, tablero, una_vez)

# Lo que tiene Valeria: lo demás no lo puede dar (0061).
VALERIA = {"Ver usuarios", "Invitar usuarios", "Administrar usuarios", "Ver roles", "Administrar roles", "Asignar roles", "Ver empresas",
           "Usar el asistente", "Atender clientes"}
NO_TIENE_VALERIA = {p for _, ps in ORG for p, _ in ps} - VALERIA
RH = {"Invitar usuarios", "Administrar usuarios", "Asignar roles", "Ver empresas"}
RH_ABIERTAS = {"Usuarios", "Roles", "Empresas"}
SUP = {"Administrar miembros"}

ESTADOS = ["Editar el rol Recursos humanos", "Lo incluido: su motivo", "Lo incluyen dos", "Qué permite un área", "Crear un rol",
           "Ver el rol Dueño", "Ver el rol Dueño: un área abierta", "Lo que no podés dar", "Lo que no podés dar: un área",
           "Un rol de una empresa"]


def sin_matriz(contenido, nuevo, marca='<div class="w-caja r212-caja">'):
    i = contenido.index(marca)
    j = fin_div(contenido, i)
    return contenido[:i] + nuevo + contenido[j:]


def partes(nombre):
    t = copia(nombre)
    a = t.index('<div class="w-bnd">')
    b = fin_div(t, t.index('<div class="w-body"'))
    return t[:a], t[a:b], t[b:]


def rol_base2():
    ant, rh, des = partes("rol_rh")
    _, crear, _ = partes("rol_crear")
    _, dueno, _ = partes("rol_dueno")
    ant_c = partes("rol_crear")[0]
    ant_d = partes("rol_dueno")[0]
    rh_m = lambda **k: sin_matriz(rh, areas(ORG, RH, RH_ABIERTAS, **k))
    cuerpos = [
        rh_m(),
        rh_m(tip_en="Ver roles"),
        rh_m(tip_en="Ver usuarios"),
        rh_m(info_en="Usuarios"),
        sin_matriz(crear, areas(ORG, set(), set())),
        sin_matriz(dueno, areas(ORG, set(), set(), lectura=True)),
        sin_matriz(dueno, areas(ORG, set(), {"Usuarios"}, lectura=True)),
        sin_matriz(rh, areas(ORG, RH, RH_ABIERTAS | {"Configuración"}, no_tiene=NO_TIENE_VALERIA, tip_en="Cambiar la configuración")),
        sin_matriz(rh, areas(ORG, RH, RH_ABIERTAS, no_tiene=NO_TIENE_VALERIA, tip_en="Configuración")),
    ]
    # Un rol de una empresa: «Vale en» dice la empresa y el catálogo es el de la empresa (Miembros).
    emp = rh.replace("Recursos humanos", "Supervisión").replace("Invita, edita y da de baja usuarios.", "Suma y quita a las personas de Delta S.A.")
    emp = una_vez(emp, "Vale en toda la organización · 0 usuarios lo tienen", "Vale en Delta S.A. · 2 usuarios lo tienen")
    emp = una_vez(emp, '<div class="o-txt sel">Toda la organización</div>', '<div class="o-txt sel">Delta S.A.</div>')
    cuerpos.append(sin_matriz(emp, areas(EMPRESA, SUP, {"Miembros"}, tip_en="Ver miembros")))
    # El marco: el actor es Lucía salvo en lo que no puede dar; las migas dicen el rol.
    marcos = [ant] * 4 + [ant_c] + [ant_d] * 2 + [acc.marco(ant)] * 2 + [ant]
    plantilla = por_estado([m + c + des for m, c in zip(marcos, cuerpos)])
    plantilla = plantilla.replace("Roles y permisos / Recursos humanos</", "Roles y permisos / Recursos humanos</")
    return tablero("Rol", "Editar un rol · permisos en áreas plegables · /org/roles/:id", css() + acc_extra(False), plantilla, ESTADOS,
                   1440, 900)


def acc_extra(tel):
    return ""


# ---------------------------------------------------------------------------------------------------------------- el teléfono
M_ESTADOS = ["Editar el rol Recursos humanos", "Lo incluido: su motivo", "Lo incluyen dos", "Crear un rol", "Ver el rol Dueño",
             "Ver el rol Dueño: un área abierta", "Lo que no podés dar", "Un rol de una empresa"]


def sin_matriz_tel(t, nuevo):
    i = t.index('<div class="r212t marco"')
    j = fin_div(t, i)
    return t[:i] + nuevo + t[j:]


def m_rol_base2():
    rh, crear, dueno = copia("m_rol_rh"), copia("m_rol_crear"), copia("m_rol_dueno")
    emp = rh.replace("Recursos humanos", "Supervisión").replace("Invita, edita y da de baja usuarios.", "Suma y quita a las personas de Delta S.A.")
    emp = una_vez(emp, '<div class="ct ro sel">Toda la organización', '<div class="ct ro sel">Delta S.A.')
    emp = emp.replace("Vale en toda la organización · 0 usuarios lo tienen", "Vale en Delta S.A. · 2 usuarios lo tienen")
    # «Crear un rol» llega sin la lista: se suma después de la descripción.
    if '<div class="r212t marco"' in crear:
        crear_t = sin_matriz_tel(crear, areas(ORG, set(), set()))
    else:
        k = crear.index('<div class="ct area"')
        k = fin_div(crear, crear.rindex('<div class="ap-cmp"', 0, k))
        crear_t = crear[:k] + '<span class="ap-gtit" style="margin: 6px 0px -6px;">Permisos</span>' + areas(ORG, set(), set()) + crear[k:]
    cuerpos = [
        sin_matriz_tel(rh, areas(ORG, RH, RH_ABIERTAS)),
        sin_matriz_tel(rh, areas(ORG, RH, RH_ABIERTAS, tip_en="Ver roles")),
        sin_matriz_tel(rh, areas(ORG, RH, RH_ABIERTAS, tip_en="Ver usuarios")),
        crear_t,
        sin_matriz_tel(dueno, areas(ORG, set(), set(), lectura=True)),
        sin_matriz_tel(dueno, areas(ORG, set(), {"Usuarios"}, lectura=True)),
        acc.marco(sin_matriz_tel(rh, areas(ORG, RH, RH_ABIERTAS | {"Configuración"}, no_tiene=NO_TIENE_VALERIA, tip_en="Cambiar la configuración"))),
        sin_matriz_tel(emp, areas(EMPRESA, SUP, {"Miembros"}, tip_en="Ver miembros")),
    ]
    return tablero("M-Rol", "Editar un rol · permisos en áreas plegables · teléfono", css(True), por_estado(cuerpos), M_ESTADOS, 390, 844)


TABLEROS = [("Rol-Base2", rol_base2), ("M-Rol-Base2", m_rol_base2)]


def main(solo=None):
    hechos = []
    for nombre, hacer in TABLEROS:
        if solo and nombre not in solo:
            continue
        escribir(nombre, hacer())
        hechos.append(nombre)
    return hechos


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or None)
