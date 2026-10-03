"""Aplica el menú de Plataforma elegido por el usuario el 2026-10-03.

Gestión arriba y Administración al pie abren un único segundo panel.
Alcance aprobado: los ocho tableros de escritorio. Los móviles conservan
su menú hasta revisar la adaptación; WhatsApp sigue fuera de E5.
Correr después de los generadores que reconstruyen estos tableros.
"""
import pathlib
import re

LIENZO = pathlib.Path(__file__).resolve().parent.parent
DEST = LIENZO
MARCA = "<!-- Menú Plataforma aprobado 2026-10-03 -->"
GRUPOS = {
    'gestion': [('Organizaciones', 'Organizaciones'), ('Cuentas', 'Cuentas'), ('Recuperaciones', 'Recuperaciones')],
    'administracion': [('Auditoria-Plat', 'Auditoría'), ('Legales', 'Documentos legales'), ('Config-Plat', 'Configuración')],
}
BOARDS = ['Organizaciones', 'Organizacion', 'Cuentas', 'Cuenta-Plat', 'Recuperaciones', 'Auditoria-Plat', 'Legales', 'Config-Plat']
PADRES = {'Organizacion': 'Organizaciones', 'Cuenta-Plat': 'Cuentas'}

def svg(paths):
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'

GESTION = svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>')
ADMIN = svg('<path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z"/><path d="m9.5 12 1.8 1.8 3.4-3.6"/>')
FLECHA = '<svg class="adm-flecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
VOLVER = svg('<path d="m15 6-6 6 6 6"/>')

for name in BOARDS:
    source = (LIENZO / (name + '.dc.html')).read_text(encoding='utf-8')
    if MARCA in source:
        assert 'id="pl-panel"' in source and '{{plAbrirGestion}}' in source and '{{plAbrirAdministracion}}' in source, name
        print(name, 'sin cambios')
        continue
    parent = PADRES.get(name, name)
    grupo = 'gestion' if parent in [x[0] for x in GRUPOS['gestion']] else 'administracion'
    nav = re.search(r'<nav class="ab-sidebar__nav"[^>]*>.*?</nav>', source, re.S)
    assert nav, name
    original = nav.group(0)
    def item(board, label):
        found = re.search(r'<a[^>]*href="' + re.escape(board) + r'\.dc\.html"[^>]*>(.*?)</a>', original, re.S)
        assert found, (name, board)
        icon = re.search(r'<svg.*?</svg>', found.group(1), re.S)
        icon_markup = icon.group(0) if icon else ''
        if board == 'Config-Plat':
            icon_markup = svg('<path d="M4 6h10"/><circle cx="16" cy="6" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/><path d="M4 18h12"/><circle cx="18" cy="18" r="2"/>')
        active = ' ab-sidebar__link--active' if parent == board else ''
        current = ' aria-current="page"' if parent == board else ''
        return f'<li><a class="ab-sidebar__link{active}" href="{board}.dc.html"{current}>' + icon_markup + f'<span class="ab-sidebar__link-label">{label}</span></a></li>'
    def button(key, label, icon):
        binding = lambda prefix: '{{' + prefix + key + '}}'
        return f'<li><button type="button" class="ab-sidebar__link adm-btn {binding("plClase")}" aria-controls="pl-panel" aria-expanded="{binding("plExp")}" onClick="{binding("plAbrir")}">{icon}<span class="ab-sidebar__link-label">{label}</span>{FLECHA}</button></li>'
    primary = '<nav class="ab-sidebar__nav" aria-label="Secciones"><ul class="ab-sidebar__list">' + button('Gestion', 'Gestión', GESTION) + '</ul><div class="admin-grupo"><ul class="ab-sidebar__list">' + button('Administracion', 'Administración', ADMIN) + '</ul></div></nav>'
    source = source[:nav.start()] + primary + source[nav.end():]
    panels = []
    for key, options in GRUPOS.items():
        title = 'Gestión' if key == 'gestion' else 'Administración'
        condition = 'plEsGestion' if key == 'gestion' else 'plEsAdministracion'
        panels.append(f'<sc-if value="{{{{{condition}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="adm-cab"><strong>{title}</strong><button type="button" class="adm-cerrar" aria-label="Cerrar {title}" onClick="{{{{plCerrar}}}}">{VOLVER}</button></div><nav class="ab-sidebar__nav" aria-label="{title}"><ul class="ab-sidebar__list">' + ''.join(item(*pair) for pair in options) + '</ul></nav></sc-if>')
    panel = '<aside class="adm-panel" id="pl-panel" aria-label="{{plTitulo}}">' + ''.join(panels) + '</aside>'
    marker = '<div class="ab-app-shell__column">'
    assert marker in source, name
    source = source.replace(marker, panel + '\n  ' + marker, 1)
    source = source.replace('class="ab-root ab-app-shell"', 'class="ab-root ab-app-shell {{plMenuClase}}"', 1)
    assert '{{plMenuClase}}' in source, name
    source = source.replace('this.state = {', f"this.state = {{ plNav: '{grupo}',", 1)
    vals = '''
      plMenuClase: s.plNav ? 'adm-abierto' : '',
      plTitulo: s.plNav === 'gestion' ? 'Gestión' : 'Administración',
      plEsGestion: s.plNav === 'gestion', plEsAdministracion: s.plNav === 'administracion',
      plExpGestion: s.plNav === 'gestion' ? 'true' : 'false', plExpAdministracion: s.plNav === 'administracion' ? 'true' : 'false',
      plClaseGestion: s.plNav === 'gestion' ? 'ab-sidebar__link--active' : '',
      plClaseAdministracion: s.plNav === 'administracion' ? 'ab-sidebar__link--active' : '',
      plAbrirGestion: () => this.setState({ plNav: s.plNav === 'gestion' ? null : 'gestion' }),
      plAbrirAdministracion: () => this.setState({ plNav: s.plNav === 'administracion' ? null : 'administracion' }),
      plCerrar: () => this.setState({ plNav: null }),
'''
    assert '...this.comunes(),' in source, name
    source = source.replace('...this.comunes(),', '...this.comunes(),' + vals, 1)
    # El patrón existente usa adm-btn para un solo grupo; aquí cada botón refleja su propio panel.
    source = re.sub(r'\.ab-root\.adm-abierto \.adm-btn(?: \.adm-flecha)? \{[^}]*\}', '', source)
    source = source.replace('<head>', '<head>\n' + MARCA, 1)
    (DEST / (name + '.dc.html')).write_text(source, encoding='utf-8')
    print(name, 'ok')
