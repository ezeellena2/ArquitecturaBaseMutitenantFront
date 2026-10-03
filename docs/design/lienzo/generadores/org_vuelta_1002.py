"""Decisiones de la vuelta de Organización del 2026-10-02, aplicadas sobre los tableros de escritorio.
Corre después de org_formularios2.py y antes de conectar_paginas.py. Cada tablero lleva una marca
`data-vuelta="1002-<tablero>"`: si ya la tiene, no se toca (se puede volver a correr).
El detalle de cada decisión está en el tablero «Criterio · Decisiones por pantalla»."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo


def svg(d, w=16, relleno=False):
    pinta = 'fill="currentColor"' if relleno else 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    return f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" {pinta} aria-hidden="true">{d}</svg>'


KEBAB = svg('<circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/>', relleno=True)
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>')
DER = svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', 14)

# Celdas de dos líneas: la segunda, en gris, aclara la primera (Criterio · Tablas y listas).
DOS_LINEAS = """.tt-f .dos { display: flex; flex-direction: column; gap: 1px; line-height: 1.35; min-width: 0; }
.tt-f .dos > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tt-f .dos .n2 { font-size: 12px; color: var(--t3); }
.tt-f .dos .c1 { font-weight: 500; }
.tt-f.o-alto { min-height: 52px !important; }"""


class Tablero:
    def __init__(self, nombre):
        self.nombre = nombre
        self.ruta = PROJ / f"{nombre}.dc.html"
        self.t = self.ruta.read_text(encoding="utf-8")
        self.marca = f'data-vuelta="1002-{nombre}"'

    @property
    def hecho(self):
        return self.marca in self.t

    def rep(self, a, b, n=1):
        assert self.t.count(a) == n, (self.nombre, a[:80], self.t.count(a))
        self.t = self.t.replace(a, b)

    def entre(self, ini, fin, desde=0):
        """Devuelve el texto desde `ini` hasta `fin` inclusive."""
        i = self.t.index(ini, desde)
        j = self.t.index(fin, i) + len(fin)
        return self.t[i:j]

    def guardar(self, css=""):
        self.rep("</helmet>", f"<style {self.marca}>\n{css}\n</style>\n</helmet>")
        self.ruta.write_text(self.t, encoding="utf-8")
        print("ok", self.nombre)


def usuarios():
    """Usuarios → A: Usuario (nombre y correo), Rol en la organización, Empresa (y su rol), Estado («Vence …») y ⋮."""
    b = Tablero("Usuarios")
    if b.hecho:
        return
    cabeza = b.entre('<div class="tt-h {{claseEncabezado}}"', "</div>")
    f_ini = b.t.index('<div class="tt-f {{u.clase}}"')
    celdas = b.t[f_ini:b.t.index('<span class="der envoltura">', f_ini)]
    cols = "minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.3fr) 190px 28px"
    usuario = ('<span class="dos"><sc-if value="{{u.conNombre}}" hint-placeholder-val="{{si}}"><a class="c1" href="Usuario.dc.html">{{u.nombre}}</a></sc-if>'
               '<sc-if value="{{u.sinNombre}}" hint-placeholder-val="{{no}}"><a class="c1" href="Usuario.dc.html">{{u.email}}</a></sc-if>'
               '<sc-if value="{{u.conNombre}}" hint-placeholder-val="{{si}}"><span class="n2">{{u.email}}</span></sc-if></span>')
    rol_org = ('<span class="roles"><sc-for list="{{u.rolesOrg}}" as="r" hint-placeholder-count="1"><span class="rol">{{r}}</span></sc-for>'
               '<sc-if value="{{u.sinRolesOrg}}" hint-placeholder-val="{{no}}"><span style="color: var(--t3);">—</span></sc-if></span>')
    empresa = ('<span class="dos"><sc-if value="{{u.conEmpresa}}" hint-placeholder-val="{{si}}"><span>{{u.empresa}}</span><span class="n2">{{u.rolesEmpresa}}</span></sc-if>'
               '<sc-if value="{{u.sinEmpresa}}" hint-placeholder-val="{{no}}"><span style="color: var(--t3);">—</span></sc-if></span>')
    estado = ('<span class="dos"><span><span class="pill {{u.pill}}">{{u.estado}}</span></span>'
              '<sc-if value="{{u.esInvitacion}}" hint-placeholder-val="{{no}}"><span class="n2">Vence {{u.vence}}</span></sc-if></span>')
    b.rep(cabeza, f'<div class="tt-h {{{{claseEncabezado}}}}" style="grid-template-columns: {cols};">'
          + "".join(f"<span>{x}</span>" for x in ("Usuario", "Rol en la organización", "Empresa", "Estado")) + '<span class="sr">Acciones</span></div>')
    b.rep(celdas, f'<div class="tt-f {{{{u.clase}}}} o-alto" style="grid-template-columns: {cols};">' + usuario + rol_org + empresa + estado)
    b.rep("          rolesEmpresa: primera ?", "          conEmpresa: !!primera,\n          sinEmpresa: !primera,\n          rolesEmpresa: primera ?")
    b.guardar(DOS_LINEAS)


def usuario():
    """Editar usuario → B: «Acceso a la organización» en dos columnas; «Empresas» es una lista para leer con ⋮,
    y cambiar los roles o sumar una empresa abre un diálogo chico que guarda al momento (como «Cómo entrás»)."""
    b = Tablero("Usuario")
    if b.hecho:
        return
    edif = re.search(r'<a class="w-ln" href="Empresas\.dc\.html">(<svg.*?</svg>)', b.t, flags=re.S).group(1).replace('width="18" height="18"', 'width="16" height="16"')
    lista_vieja = b.entre('<sc-if value="{{conEmpresas}}"', "</sc-for></div></sc-if>")
    b.rep(lista_vieja,
          '<sc-if value="{{conEmpresas}}" hint-placeholder-val="{{si}}"><sc-for list="{{filasEmpresa}}" as="e" hint-placeholder-count="1">'
          f'<div class="w-it"><span class="p-ic">{edif}</span><span class="dato"><b>{{{{e.textoEmp}}}}</b><span>{{{{e.textoRoles}}}}</span></span>'
          '<sc-if value="{{e.edit}}" hint-placeholder-val="{{si}}"><span class="o-dd"><button type="button" class="ib" aria-label="Acciones de {{e.textoEmp}}" '
          f'aria-haspopup="menu" aria-expanded="{{{{e.expMenuEmp}}}}" onClick="{{{{e.alternarMenuEmp}}}}">{KEBAB}</button>'
          '<sc-if value="{{e.abiertoMenuEmp}}" hint-placeholder-val="{{no}}"><div class="o-lst der" role="menu">'
          '<button type="button" class="op" role="menuitem" onClick="{{e.cambiarRoles}}">Cambiar roles</button><div class="o-sep" role="separator"></div>'
          '<button type="button" class="op pel" role="menuitem" onClick="{{e.quitarYa}}">Quitar de la empresa</button></div></sc-if></span></sc-if></div></sc-for></sc-if>')

    # El diálogo usa los mismos desplegables que la pantalla (Estado para uno solo, Roles de la organización para varios).
    i = b.t.index('<div class="w-cmp" style="width: 260px;"><span class="rt">Estado</span>')
    uno = b.t[i:b.t.index("{{errEstado}}</span></sc-if></div>", i) + len("{{errEstado}}</span></sc-if></div>")]
    uno = (uno.replace(' style="width: 260px;"', "", 1).replace("Estado", "DlgEmpresa")
           .replace('<span class="rt">DlgEmpresa</span>', '<span class="rt">Empresa</span>').replace('aria-label="DlgEmpresa"', 'aria-label="Empresa"'))
    i = b.t.index('<div class="w-cmp" style="width: 260px;"><span class="rt">Roles de la organización')
    varios = b.t[i:b.t.index("</label></sc-for></div></sc-if></div></sc-if></div>", i) + len("</label></sc-for></div></sc-if></div></sc-if></div>")]
    varios = varios.replace(' style="width: 260px;"', "", 1).replace("RolesOrg", "DlgRoles").replace("Roles de la organización", "Roles en la empresa")
    dialogo = ('<sc-if value="{{dlgEmp}}" hint-placeholder-val="{{no}}"><div class="w-oscuro" style="z-index: 6;"></div>'
               '<div class="p-dlg o-dlg-emp" role="dialog" aria-modal="true" aria-label="{{tituloDlgEmp}}">'
               f'<div class="dc"><span>{{{{tituloDlgEmp}}}}</span><button type="button" class="ib" aria-label="Cerrar" onClick="{{{{cerrarDlgEmp}}}}">{X}</button></div>'
               f'<div class="db"><sc-if value="{{{{dlgSumar}}}}" hint-placeholder-val="{{{{si}}}}">{uno}</sc-if>{varios}</div>'
               '<div class="df"><button type="button" class="cb cb-sec" onClick="{{cerrarDlgEmp}}">Cancelar</button>'
               '<button type="button" class="cb cb-pri" onClick="{{aceptarDlgEmp}}" disabled="{{noAceptaDlgEmp}}">{{textoAceptaDlgEmp}}</button></div></div></sc-if>')
    b.rep('<sc-if value="{{confirmacion}}"', dialogo + '<sc-if value="{{confirmacion}}"')

    b.rep("return { u, guardado: copia(u), ...copia(u), error: '', guardando: false };",
          "return { u, guardado: copia(u), ...copia(u), error: '', guardando: false, dlgEmp: null, dlgEmpresa: null, dlgRoles: [] };")
    b.rep("  ponerEmpresa(i, cambios) {", """  // Las empresas se cambian al momento, desde el diálogo o el ⋮: no esperan a «Guardar cambios».
  guardarEmpresas(empresas, texto) {
    const lista = empresas.map((e) => ({ c: e.c, roles: [...e.roles] }));
    this.setState({ empresas: lista, guardado: { ...this.state.guardado, empresas: lista.map((e) => ({ c: e.c, roles: [...e.roles] })) }, dlgEmp: null, abierto: null });
    this.avisar(texto.replace(/\\.\\.$/, '.')); // «… a Delta Sur S.R.L.» no lleva otro punto
  }

  aceptarDlgEmp() {
    const s = this.state;
    if (!s.dlgEmpresa) return;
    const quien = s.u.n || s.u.email;
    if (s.dlgEmp.modo === 'sumar') {
      this.guardarEmpresas([...s.empresas, { c: s.dlgEmpresa, roles: s.dlgRoles }], 'Sumamos a ' + quien + ' a ' + nombreEmpresa(s.dlgEmpresa) + '.');
    } else {
      this.guardarEmpresas(s.empresas.map((e, j) => (j === s.dlgEmp.i ? { ...e, roles: s.dlgRoles } : e)), 'Guardamos los roles en ' + nombreEmpresa(s.dlgEmpresa) + '.');
    }
  }

  quitarEmpresaYa(i) {
    const s = this.state;
    this.guardarEmpresas(s.empresas.filter((_, j) => j !== i), 'Quitamos a ' + (s.u.n || s.u.email) + ' de ' + nombreEmpresa(s.empresas[i].c) + '.');
  }

  ponerEmpresa(i, cambios) {""")
    b.rep("      filasEmpresa: s.empresas.map((e, i) => {", """      ...this.uno('DlgEmpresa', 'dlgEmpresa', EMPRESAS.filter((x) => !s.empresas.some((e) => e.c === x.id)).map((x) => ({ v: x.id, n: x.n })), 'Elegí una empresa', { alElegir: () => ({ dlgRoles: [] }) }),
      ...this.varios('DlgRoles', 'dlgRoles', s.dlgEmpresa ? rolesDeEmpresa(s.dlgEmpresa) : [], 'Ninguno'),
      dlgEmp: !!s.dlgEmp,
      dlgSumar: !!s.dlgEmp && s.dlgEmp.modo === 'sumar',
      tituloDlgEmp: !s.dlgEmp ? '' : s.dlgEmp.modo === 'sumar' ? 'Sumar empresa' : 'Roles en ' + nombreEmpresa(s.dlgEmpresa),
      textoAceptaDlgEmp: s.dlgEmp && s.dlgEmp.modo === 'sumar' ? 'Sumar' : 'Guardar',
      noAceptaDlgEmp: !s.dlgEmpresa,
      cerrarDlgEmp: () => this.setState({ dlgEmp: null, abierto: null }),
      aceptarDlgEmp: () => this.aceptarDlgEmp(),
      filasEmpresa: s.empresas.map((e, i) => {""")
    b.rep("          ariaEmpresa: 'Empresa ' + (i + 1),", """          ariaEmpresa: 'Empresa ' + (i + 1),
          abiertoMenuEmp: s.abierto === 'kemp:' + i,
          expMenuEmp: s.abierto === 'kemp:' + i ? 'true' : 'false',
          alternarMenuEmp: () => this.alternarMenu('kemp:' + i),
          cambiarRoles: () => this.setState({ dlgEmp: { modo: 'roles', i }, dlgEmpresa: e.c, dlgRoles: [...e.roles], abierto: null }),
          quitarYa: () => this.quitarEmpresaYa(i),""")
    b.rep("      sumar: () => this.setState({ empresas: [...s.empresas, { c: null, roles: [] }], abierto: null }),",
          "      sumar: () => this.setState({ dlgEmp: { modo: 'sumar' }, dlgEmpresa: null, dlgRoles: [], abierto: null }),")
    b.guardar("""/* Acceso a la organización: dos columnas iguales a todo el ancho. */
.w-caja > .p-hoja:not(.o-col) { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.w-caja > .p-hoja .w-cmp { width: auto !important; }
.w-caja .w-it .dato b { color: var(--t1) !important; font-weight: 500; }
.w-it .dato b .sc-interp { color: inherit !important; font-size: inherit !important; }
.o-sep { height: 1px; background: var(--borde); margin: 4px 0; }
.p-dlg.o-dlg-emp { overflow: visible; }
.p-dlg.o-dlg-emp .dc { border-radius: 12px 12px 0 0; }
.p-dlg.o-dlg-emp .w-cmp .ct { font-size: 13px; }""")


def roles():
    """Roles y permisos → A: Rol (con «De sistema» debajo), Vale en, Usuarios, Permisos y ⋮."""
    b = Tablero("Roles")
    if b.hecho:
        return
    cabeza = b.entre('<div class="tt-h" style="grid-template-columns: minmax(0, 1.1fr) minmax(0, 2.4fr)', "</div>")
    f_ini = b.t.index('<div class="tt-f" style="grid-template-columns: minmax(0, 1.1fr) minmax(0, 2.4fr)')
    celdas = b.t[f_ini:b.t.index('<span class="der envoltura">', f_ini)]
    cols = "minmax(0, 1.6fr) minmax(0, 1.3fr) 100px 100px 28px"
    b.rep(cabeza, f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Rol</span><span>Vale en</span>'
          '<span class="num">Usuarios</span><span class="num">Permisos</span><span class="sr">Acciones</span></div>')
    b.rep(celdas, f'<div class="tt-f o-alto" style="grid-template-columns: {cols};">'
          '<span class="dos"><a class="c1" href="Rol.dc.html">{{r.n}}</a><sc-if value="{{r.sistema}}" hint-placeholder-val="{{no}}"><span class="n2">De sistema</span></sc-if></span>'
          '<span class="c1 n">{{r.vale}}</span><span class="num">{{r.u}}</span><span class="num">{{r.p}}</span>')
    b.guardar(DOS_LINEAS)


def rol():
    """Editar un rol → A: datos en dos columnas; una fila por permiso, solo el nombre; cada área se abre y se cierra."""
    b = Tablero("Rol")
    if b.hecho:
        return
    b.rep("errPermisos: '', guardando: false };\n  }", "errPermisos: '', guardando: false, plegado: {} };\n  }")
    b.rep("        const abierto = s.abierto === clave;\n", "        const abierto = s.abierto === clave;\n"
          "        const abiertaArea = s.plegado[a.n] !== undefined ? !s.plegado[a.n] : elegidos.length > 0;\n")
    b.rep("        return {\n          n: a.n,", "        return {\n          abiertaArea, expArea: abiertaArea ? 'true' : 'false', claseFlecha: abiertaArea ? 'abierta' : '',\n"
          "          alternarArea: () => this.setState({ plegado: { ...this.state.plegado, [a.n]: abiertaArea } }),\n          n: a.n,")
    grupo = b.entre('<label class="o-grupo">', "</label>")
    b.rep(grupo, '<div class="o-grupo"><button type="button" class="o-flecha {{a.claseFlecha}}" aria-expanded="{{a.expArea}}" aria-label="Abrir o cerrar {{a.n}}" onClick="{{a.alternarArea}}">'
          + DER + '</button><input type="checkbox" checked="{{a.todos}}" onChange="{{a.alternarTodos}}" disabled="{{a.bloq}}" aria-label="{{a.ariaTodos}}">'
          '<button type="button" class="o-gnom" onClick="{{a.alternarArea}}">{{a.n}}</button><span class="cnt">{{a.cuenta}}</span></div>')
    opciones = b.entre('<sc-for list="{{a.opciones}}"', "</sc-for>")
    b.rep(opciones, '<sc-if value="{{a.abiertaArea}}" hint-placeholder-val="{{si}}">' + opciones + "</sc-if>")
    b.guardar("""/* Datos del rol: nombre y «vale en» en dos columnas a todo el ancho; la descripción ocupa las dos. */
.p-hoja.o-col .o-fila { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
.p-hoja.o-col .o-fila .w-cmp { width: auto !important; }
.p-hoja.o-col .o-fila:last-child .w-cmp { grid-column: 1 / -1; }
.w-it .dato b .sc-interp { color: inherit !important; font-size: inherit !important; }
.w-caja { flex-shrink: 0; }
/* Una fila por permiso, solo con el nombre. */
.o-perm .dato > span { display: none !important; }
.o-perm { min-height: 40px !important; padding-left: 52px !important; }
/* Cada área se abre o se cierra con la flecha o con el nombre. */
.o-grupo { cursor: default; padding-left: 8px !important; gap: 8px !important; }
.o-flecha { width: 28px; height: 28px; padding: 0; border: 0; background: none; color: var(--t3); display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; }
.o-flecha:hover { background: var(--s3); color: var(--t1); }
.o-flecha svg { transition: transform 0.15s; }
.o-flecha.abierta svg { transform: rotate(90deg); }
.o-gnom { border: 0; background: none; padding: 0; font: inherit; font-weight: 600; color: var(--t1); cursor: pointer; margin-left: 4px; }
@media (prefers-reduced-motion: reduce) { .o-flecha svg { transition: none; } }""")


def empresas():
    """Empresas → A: Empresa (con el CUIT debajo, o «Sin CUIT»), Zona horaria, Miembros, Estado y ⋮."""
    b = Tablero("Empresas")
    if b.hecho:
        return
    cols_v = "minmax(0, 1.6fr) 120px minmax(0, 1.5fr) 84px 110px 28px"
    cols = "minmax(0, 1.6fr) minmax(0, 1.4fr) 100px 150px 28px"
    b.rep(f'<div class="tt-h" style="grid-template-columns: {cols_v};"><span>Empresa</span><span>CUIT</span><span>Zona de negocio</span>'
          '<span class="num">Miembros</span><span>Estado</span><span class="sr">Acciones</span></div>',
          f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Empresa</span><span>Zona horaria</span>'
          '<span class="num">Miembros</span><span>Estado</span><span class="sr">Acciones</span></div>')
    b.rep(f'<div class="tt-f {{{{e.clase}}}}" style="grid-template-columns: {cols_v};">\n          <a class="c1" href="Empresa.dc.html">{{{{e.n}}}}</a>\n'
          '          <span class="c1 n {{e.claseCuit}}">{{e.cuit}}</span>\n          <span class="c1 n">{{e.zona}}</span>',
          f'<div class="tt-f {{{{e.clase}}}} o-alto" style="grid-template-columns: {cols};">\n          <span class="dos"><a class="c1" href="Empresa.dc.html">{{{{e.n}}}}</a>'
          '<span class="n2 {{e.claseCuit}}">{{e.cuit}}</span></span>\n          <span class="c1 n">{{e.zona}}</span>')
    b.rep("cuit: e.cuit || '—',", "cuit: e.cuit ? 'CUIT ' + e.cuit : 'Sin CUIT',")
    b.guardar(DOS_LINEAS)


def empresa():
    """Ficha de empresa → A: quedan las pestañas; Miembro (nombre y correo), Roles en la empresa, Estado y ⋮."""
    b = Tablero("Empresa")
    if b.hecho:
        return
    cols_v = "minmax(0, 1.2fr) minmax(0, 1.8fr) minmax(0, 1.6fr) 120px 28px"
    cols = "minmax(0, 1.6fr) minmax(0, 1.4fr) 150px 28px"
    b.rep(f'<div class="tt-h" style="grid-template-columns: {cols_v};"><span>Nombre</span><span>Correo</span><span>Roles en la empresa</span>'
          '<span>Estado</span><span class="sr">Acciones</span></div>',
          f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Miembro</span><span>Roles en la empresa</span>'
          '<span>Estado</span><span class="sr">Acciones</span></div>')
    b.rep(f'<div class="tt-f {{{{m.clase}}}}" style="grid-template-columns: {cols_v};">\n                    <a class="c1" href="Usuario.dc.html">{{{{m.nombre}}}}</a>\n'
          '                    <span class="c1 n">{{m.email}}</span>',
          f'<div class="tt-f {{{{m.clase}}}} o-alto" style="grid-template-columns: {cols};">\n                    <span class="dos"><a class="c1" href="Usuario.dc.html">{{{{m.nombre}}}}</a>'
          '<span class="n2">{{m.email}}</span></span>')
    b.rep('<span style="color: var(--t3);">Sin roles</span>', '<span style="color: var(--t3);">—</span>')
    b.guardar(DOS_LINEAS)


def auditoria():
    """Auditoría → A: sin cantidad arriba; «Qué pasó» abre el detalle (sin el ojo); «Cargar más» al pie."""
    b = Tablero("Auditoria-Org")
    if b.hecho:
        return
    cols_v = "140px minmax(0, 2.4fr) minmax(0, 1.4fr) minmax(0, 1.2fr) 28px"
    cols = "140px minmax(0, 2.4fr) minmax(0, 1.4fr) minmax(0, 1.2fr)"
    b.rep('<p class="res">{{resumen}}</p>', "")
    b.rep(f'<div class="tt-h" style="grid-template-columns: {cols_v};"><span>Fecha y hora</span><span>Qué pasó</span><span>Dónde</span><span>Quién</span><span class="sr">Detalle</span></div>',
          f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Fecha y hora</span><span>Qué pasó</span><span>Dónde</span><span>Quién</span></div>')
    b.rep(f'<div class="tt-f" style="grid-template-columns: {cols_v};">', f'<div class="tt-f" style="grid-template-columns: {cols};">')
    b.rep('<span class="c1">{{a.que}}</span>', '<button type="button" class="c1 o-link" aria-label="{{a.aria}}" onClick="{{a.ver}}">{{a.que}}</button>')
    b.rep(b.entre('<span class="der"><button type="button" class="ico-btn" aria-label="{{a.aria}}"', "</button></span>"), "")
    b.guardar(""".o-link { border: 0; background: none; padding: 0; font: inherit; color: var(--t1); text-align: left; cursor: pointer; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-link:hover { color: var(--marca-tx); text-decoration: underline; text-underline-offset: 3px; }""")


def error_org():
    """Sin permiso o no encontrada → A: solo el título y «Ir al inicio»."""
    b = Tablero("Error-Org")
    if b.hecho:
        return
    b.rep('<p style="margin: 8px 0 0; font-size: 15px; color: var(--t2);">{{texto}}</p>', "")
    b.guardar()


def avisos():
    """Avisos del sistema → A: sin conexión, solo el cartel; el código del error, detrás de «Copiar código»;
    «Módulo apagado» sin la línea que explica; el fondo, con Configuración en dos columnas a todo el ancho."""
    b = Tablero("Avisos")
    if b.hecho:
        return
    b.rep("return { ...base, zona: 'America/Argentina/Cordoba', aviso: TEXTOS.red, avisoTipo: 'error', reintentar: true, offline: true };",
          "return { ...base, zona: 'America/Argentina/Cordoba', offline: true };")
    b.rep('<span class="f">Código de seguimiento <button', '<span class="f"><button')
    b.rep("<code>{{traza}}</code>", "")
    b.rep("textoCopiar: s.copiado ? 'Copiado' : 'Copiar',", "textoCopiar: s.copiado ? 'Código copiado' : 'Copiar código',")
    b.rep("<h1>No encontramos esta página</h1><p>Puede que la hayan borrado o que la dirección esté mal.</p>", "<h1>No encontramos esta página</h1>")
    b.guardar("""/* Datos de la organización como en Configuración: dos columnas iguales a todo el ancho. */
.w-caja > .p-hoja.o-col { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
.w-caja > .p-hoja.o-col > .o-fila { display: contents; }
.w-caja > .p-hoja.o-col .w-cmp { width: auto !important; }""")


# Pantallas de escritorio aprobadas en la vuelta: pierden «· para aprobar» (los teléfonos y los inicios todavía no).
APROBADOS = ["Usuarios", "Usuario", "Roles", "Rol", "Empresas", "Empresa", "Configuracion", "Configuracion-Dominio",
             "Configuracion-Verificar", "Configuracion-Quitar", "Pagina-Org", "Pagina-Org-Despublicar", "Auditoria-Org", "Error-Org", "Avisos"]


def aprobar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    cambiados = 0
    for n in APROBADOS:
        b = c["boards"][f"{n}.dc.html"]
        if " · para aprobar" in b["title"]:
            b["title"] = b["title"].replace(" · para aprobar", "")
            cambiados += 1
    if cambiados:
        ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
        print("ok", cambiados, "títulos aprobados")


for paso in (usuarios, usuario, roles, rol, empresas, empresa, auditoria, error_org, avisos, aprobar):
    paso()
