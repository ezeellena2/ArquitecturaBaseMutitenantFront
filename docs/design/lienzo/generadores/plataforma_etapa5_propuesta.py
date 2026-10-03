"""Muestra E5 separada del lienzo: no modifica tableros ni canvas pendientes de elección."""
from pathlib import Path
import html
import re
import sys

ROOT = Path(__file__).resolve().parents[4]
LIENZO = ROOT / "docs/design/lienzo"
OUT = ROOT / ".artifacts/etapa-5-propuesta"
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(Path(__file__).parent / "telefonos_1004"))
import app_marco as app
import app_estilo

DESKTOP = ["Organizaciones", "Organizacion", "Cuentas", "Cuenta-Plat", "Recuperaciones", "Legales", "Auditoria-Plat", "Config-Plat"]
CSS = """<style data-propuesta="e5-compacto">
.pagina {font-size:13px!important; padding:16px 24px!important; gap:16px!important}
.ph h1,.hero h1 {font-size:18px!important}.ph .res {font-size:13px!important}
.b {height:36px!important;font-size:13px!important}.b-sm {height:32px!important}
.in2 {min-height:36px!important;height:36px!important;font-size:13px!important}
.tt-h {background:oklch(.945 .018 76)!important;min-height:36px!important}
.tt-f {min-height:44px!important;font-size:13px!important}
.pill {background:none!important;padding:0!important;border-radius:0!important}
.dlg-h,.cab {background:oklch(.945 .018 76)!important}.dlg-h h2 {font-size:16px!important}
.dlg-f {padding:12px 20px!important}.dlg-b {gap:14px!important}
.cols2,.hoja {grid-template-columns:repeat(2,minmax(0,1fr))!important}
</style>"""


def resources(source):
    return source.replace('src="./support.js"', 'src="../../docs/design/lienzo/support.js"').replace('href="ds/', 'href="../../docs/design/lienzo/ds/').replace('src="ds/', 'src="../../docs/design/lienzo/ds/')


for name in DESKTOP:
    source = (LIENZO / f"{name}.dc.html").read_text(encoding="utf-8")
    source = source.replace("</helmet>", CSS + "</helmet>", 1)
    source = source.replace('onClick="{{descartar}}" disabled="{{limpio}}"', 'onClick="{{descartar}}"')
    source = re.sub(r'(<h1>[^<]+</h1>)<span class="pill ([^"]*)">([^<]*)</span></div><p class="res">', r'\1</div><p class="res"><span class="pill \2">\3</span> · ', source)
    (OUT / f"{name}.dc.html").write_text(resources(source), encoding="utf-8")

org_source = (OUT / "Organizaciones.dc.html").read_text(encoding="utf-8")
for count in (1, 50):
    rows = 'ORGS.slice(0,1)' if count == 1 else 'Array.from({length:50},(_,i)=>({...ORGS[i%ORGS.length],id:"demo"+i,n:"Organización "+String(i+1).padStart(2,"0")}))'
    (OUT / f"Organizaciones-{count}.dc.html").write_text(org_source.replace('orgs: ORGS,', 'orgs: ' + rows + ','), encoding="utf-8")

STYLE = app_estilo.ESTILO_X + """<style>
.ap-nav {grid-template-columns:repeat(4,1fr)}.ap-cuerpo {overflow:auto}
.ap-campo {display:grid;gap:6px;padding:12px 20px;font-size:13px}
.ap-campo input,.ap-campo select,.ap-campo textarea {padding:10px;border:1px solid var(--borde2);border-radius:10px;font:inherit;background:white;box-sizing:border-box;width:100%}
.ap-grupo {margin:8px 16px;border:1px solid var(--borde);border-radius:14px;overflow:hidden}
.ap-it {display:flex;align-items:center;justify-content:space-between;padding:14px 16px;color:var(--t1);text-decoration:none;border-bottom:1px solid var(--borde);font-size:15px}
.ap-it:last-child {border-bottom:0}.ap-gtit {font-size:13px;color:var(--t3);margin:20px 32px 4px}
.ap-det {display:grid;gap:4px;padding:10px 0;border-bottom:1px solid var(--borde)}.ap-det span {font-size:13px;color:var(--t3)}
.ap-tabs {display:flex;gap:22px;padding:12px 16px;border-bottom:1px solid var(--borde);overflow:auto;white-space:nowrap;font-size:13px}.ap-tabs b {color:var(--marca-tx)}
.ap-fijo {padding:14px 20px 34px;display:flex;gap:10px;border-top:1px solid var(--borde)}.ap-fijo .cb {flex:1;height:48px;border-radius:12px}
</style>"""


def nav(active):
    links = [("Organizaciones", "organizaciones", app.I["casa"]), ("Cuentas", "cuentas", app.I["personas"]), ("Recuperaciones", "recuperaciones", app.I["info"]), ("Más", "mas", '<span class="yo">M</span>')]
    return '<nav class="ap-nav">' + ''.join(f'<a class="{"on" if key == active else ""}" href="M-{label}.dc.html"><span class="i">{icon}</span>{label}</a>' for label, key, icon in links) + '</nav>'


def row(title, detail, status="", link="#", menu=False):
    return f'<div class="ap-fila"><a class="tx" href="{link}" style="color:inherit;text-decoration:none"><b style="font-size:15.5px">{title}</b><span class="l2">{detail}</span><span class="l3">{status}</span></a>' + (f'<button class="ap-ib" aria-label="Acciones">{app.I["kebab"]}</button>' if menu else '') + '</div>'


def field(label, value="", select=False):
    control = f'<select><option>{value}</option></select>' if select else f'<input value="{value}">'
    return f'<label class="ap-campo">{label}{control}</label>'


def buttons(danger=False, action="Guardar"):
    return '<button class="cb cb-sec">Cancelar</button>' + f'<button class="cb cb-pri" style="{"background:var(--peligro)" if danger else ""}">{action}</button>'


def mobile(name, title, content, active="mas", subtitle="Plataforma", extra="", back=None, fab=False, fixed=""):
    view = app.estado() + app.barra(title, subtitle, volver=back) + '<main class="ap-cuerpo">' + content + '</main>'
    view += (app.fab("Crear", fab if isinstance(fab,str) else "M-Crear.dc.html") if fab else '') + (fixed or nav(active)) + extra
    app.SALIDA = OUT
    source = app.pagina("M-" + name, view, STYLE, title + " · propuesta E5")
    (OUT / f"M-{name}.dc.html").write_text(resources(source), encoding="utf-8")


orgs = row("Grupo Delta", "3 empresas · 11 miembros", "● Activa · Autoservicio", "M-Organizacion.dc.html", True)
orgs += row("Gamma S.A.", "1 empresa · 1 miembro", "● Espera aprobación", menu=True)
orgs += row("Beta S.R.L.", "1 empresa · 6 miembros", "● Suspendida", menu=True)
mobile("Organizaciones", "Organizaciones", orgs, "organizaciones", fab=True)
mobile("Organizaciones-1", "Organizaciones", row("Grupo Delta", "1 empresa · 1 miembro", "● Activa", "M-Organizacion.dc.html", True), "organizaciones", fab=True)
mobile("Organizaciones-50", "Organizaciones", ''.join(row(f"Organización {n:02d}", "1 empresa · 1 miembro", "● Activa", menu=True) for n in range(1,11)) + '<div class="ap-fijo">1–10 de 50 · <button class="cb cb-sec">Siguiente</button></div>', "organizaciones", fab=True)
history = '<div class="ap-tabs"><b>Historial</b><span>Dueños</span><span>Módulos</span><span>Dominio verificado</span><span>Página pública</span></div>'
history += row("Reactivó la organización", "20/09 11:02 · Martín Sosa", "Regularizó el pago.") + row("Suspendió la organización", "18/09 16:45 · Martín Sosa", "Dos meses sin pago.")
mobile("Organizacion", "Grupo Delta", history, "organizaciones", "Activa · 3 empresas · 11 miembros", back="M-Organizaciones.dc.html")
mobile("Suspender", "Grupo Delta", history, "organizaciones", "Activa", app.hoja("Suspender organización", field("Motivo", "Revisar actividad.") , buttons(True,"Suspender")), back="M-Organizaciones.dc.html")
mobile("Crear", "Crear organización", field("Nombre", "") + field("Slug", "") + field("Correo del Dueño", "") + field("Idioma y región", "Español (Argentina)", True) + field("Zona horaria", "Buenos Aires", True), "organizaciones", back="M-Organizaciones.dc.html", fixed='<div class="ap-fijo">'+buttons(action="Crear e invitar")+'</div>')
accounts = row("Lucía Fernández", "lu•••@gmail.com", "● Activa · Personal + 2 organizaciones", "M-Cuenta.dc.html", True) + row("Pablo Ortiz", "pa•••@kappa.ejemplo.com", "● Necesita recuperación", menu=True) + row("Martín Sosa", "ma•••@ejemplo.com", "● Activa · Operador Owner", menu=True)
mobile("Cuentas", "Cuentas", accounts, "cuentas")
mobile("Cuenta", "Lucía Fernández", '<div class="ap-tabs"><b>Métodos de ingreso</b><span>Organizaciones</span><span>Historial de seguridad</span></div>' + row("lu•••@gmail.com", "Correo · Principal", "● Sirve para ingresar") + row("lu•••@delta.ejemplo.com", "Administrado por Grupo Delta", "● Sirve para ingresar"), "cuentas", "Activa", back="M-Cuentas.dc.html")
mobile("Recuperaciones", "Recuperaciones", row("Pablo Ortiz", "pa•••@kappa.ejemplo.com → pa•••@gmail.com", "● Pendiente", "M-Revisar.dc.html", True) + row("Rosa Luna", "ro•••@sigma.ejemplo.com → ro•••@gmail.com", "● Aprobado"), "recuperaciones")
mobile("Revisar", "Revisar recuperación", row("Pablo Ortiz", "Método anterior: pa•••@kappa.ejemplo.com", "Nuevo: pa•••@gmail.com · Verificado") + field("Motivo", "Identidad comprobada"), "recuperaciones", back="M-Recuperaciones.dc.html", fixed='<div class="ap-fijo">'+buttons(action="Aprobar")+'</div>')
more = '<span class="ap-gtit">Administración</span><div class="ap-grupo">' + ''.join(f'<a class="ap-it" href="M-{key}.dc.html">{title}<span>›</span></a>' for key,title in [("Auditoria","Auditoría"),("Legales","Documentos legales"),("Configuracion","Configuración")]) + '</div>'
more += '<span class="ap-gtit">Martín Sosa · Plataforma</span><div class="ap-grupo"><a class="ap-it" href="#">Perfiles <span>›</span></a><a class="ap-it" href="#">Mi cuenta <span>›</span></a><a class="ap-it" style="color:var(--peligro)" href="#">Salir</a></div>'
mobile("Más", "Más", more)
mobile("Legales", "Documentos legales", row("Términos y condiciones", "Versión 2 · Vigente desde 01/06/2026", "2 versiones", "M-Legal.dc.html") + row("Política de privacidad", "Versión 1 · Vigente desde 12/01/2026", "1 versión"), back="M-Más.dc.html", fab="M-Legal.dc.html")
mobile("Legal", "Nueva versión legal", field("Tipo", "Términos y condiciones", True) + field("Vigencia", "05/10/2026") + field("Español", "") + field("English", "") + field("Motivo", ""), back="M-Legales.dc.html", fixed='<div class="ap-fijo">'+buttons(action="Publicar")+'</div>')
mobile("Configuracion", "Configuración", field("Registro de personas", "Abierto", True) + field("Alta de organizaciones", "Requiere aprobación", True) + field("Organizaciones propias por persona", "3"), back="M-Más.dc.html", fixed='<div class="ap-fijo"><button class="cb cb-sec">Descartar cambios</button><button class="cb cb-pri">Guardar cambios</button></div>')
audit = row("Suspendió la cuenta", "26/09 17:30 · Laura Díaz", "Ana Gómez", "M-Auditoria-Detalle.dc.html") + row("Reactivó la organización", "20/09 11:02 · Martín Sosa", "Grupo Delta")
mobile("Auditoria", "Auditoría", audit, back="M-Más.dc.html")
detail = ''.join(f'<div class="ap-det"><span>{label}</span><b>{value}</b></div>' for label,value in [("Fecha y hora","26/09/2026 17:30"),("Sobre","Ana Gómez"),("Quién","Laura Díaz · Operador"),("Motivo","Denuncia de uso indebido.")])
mobile("Auditoria-Detalle", "Auditoría", audit, extra=app.hoja("Suspendió la cuenta",detail,'<button class="cb cb-sec">Cerrar</button>'), back="M-Más.dc.html")

links = ''.join(f'<button data-file="{name}.dc.html" data-width="1440">{html.escape(name)}</button>' for name in DESKTOP)
links += ''.join(f'<button data-file="Organizaciones-{count}.dc.html" data-width="1440">Organizaciones · {count} filas</button>' for count in (1,50))
links += ''.join(f'<button data-file="{p.name}" data-width="390">{html.escape(p.stem.removesuffix(".dc"))}</button>' for p in sorted(OUT.glob("M-*.dc.html")))
index = '<!doctype html><html lang="es"><meta charset="utf-8"><title>Plataforma · revisión E5</title><style>body{margin:0;background:#f6f4f0;color:#302d29;font:13px system-ui}header{padding:16px 24px;background:#ede5d7}h1{font-size:20px;margin:0 0 8px}nav{display:flex;gap:8px;flex-wrap:wrap;padding:16px}button{border:1px solid #d7cebf;background:white;border-radius:6px;padding:8px;cursor:pointer}iframe{display:block;border:1px solid #ddd;margin:16px auto;background:white;max-width:100%}a{color:#007f79}</style><header><h1>Plataforma · propuesta para revisión conjunta</h1>Menú de escritorio y detalle de Auditoría aprobados. Se presenta el refinamiento restante y el teléfono en formato app.<br>Propuesta móvil: Organizaciones, Cuentas, Recuperaciones y Más; Administración y perfil dentro de Más. WhatsApp fuera de E5.</header><nav>'+links+'</nav><iframe title="Tablero" width="1440" height="900" src="Organizaciones.dc.html"></iframe><script>document.querySelectorAll("button").forEach(b=>b.onclick=()=>{const f=document.querySelector("iframe");f.src=b.dataset.file;f.width=b.dataset.width;f.height=b.dataset.width==="390"?844:900;});</script></html>'
(OUT / "index.html").write_text(index, encoding="utf-8")
print(f"Muestra preparada: {len(DESKTOP)} escritorios y {len(list(OUT.glob('M-*.dc.html')))} móviles/estados")
