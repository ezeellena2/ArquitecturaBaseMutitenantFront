"""Tablero «Criterio · Menús y desplegables» en la página «Criterio de diseño»."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 2820
ARCHIVO = "Criterio-Menus.dc.html"
TITULO = "Criterio · Menús y desplegables"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

CSS = """  <style data-criterio="menus">
.reglas2 { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }
.reglas2 strong { color: var(--t1); font-weight: 600; }
.medidas .fil { box-sizing: border-box; }
.g3c { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.caso3 { display: flex; flex-direction: column; gap: 8px; }
.caso3 .rotc { font-size: 13px; font-weight: 600; color: var(--t2); }
.mfila { position: relative; height: 230px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; }
.mfila .r { display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 8px 0 16px; border-bottom: 1px solid var(--borde); font-size: 13px; background: oklch(0.955 0.025 185); border-radius: 11px 11px 0 0; }
.mfila .r .n { flex: 1; font-weight: 500; }
.mn { position: absolute; z-index: 3; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; min-width: 220px; display: flex; flex-direction: column; font-size: 13px; color: var(--t1); }
.mn .it { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 10px; border-radius: 6px; white-space: nowrap; }
.mn .it svg { color: var(--t3); flex-shrink: 0; }
.mn .it.h { background: var(--s2); }
.mn .it.pel, .mn .it.pel svg { color: oklch(0.52 0.19 25); }
.mn .it.on { background: var(--marca-t); color: var(--marca-tx); }
.mn .it.apag { color: var(--t3); }
.mn .it .der2 { margin-left: auto; padding-left: 16px; color: var(--t3); font-size: 12.5px; }
.mn .it .on-t { margin-left: auto; color: var(--marca-tx); }
.mn .sep { height: 1px; background: var(--borde); margin: 4px 0; }
.mn .tit { padding: 8px 10px 4px; font-size: 12.5px; font-weight: 600; color: var(--t3); }
.mn .cabu { display: flex; align-items: center; gap: 10px; padding: 10px; }
.mn .cabu .av { width: 36px; height: 36px; font-size: 15px; }
.mn .perf { display: flex; flex-direction: column; line-height: 1.3; }
.mn .perf .s { font-size: 12.5px; color: var(--t3); }
.mn .it.on .perf .s { color: var(--marca-tx); }
.ico2 { width: 28px; height: 28px; border-radius: 8px; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; flex-shrink: 0; }
.mn .it.on .ico2 { background: #fff; color: var(--marca-tx); }
.av { width: 30px; height: 30px; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.barra2 { position: relative; height: 470px; background: var(--fondo); border: 1px solid var(--borde); border-radius: 12px; }
.barra2 .tb2 { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: oklch(0.925 0.02 75); border-bottom: 1px solid oklch(0.87 0.022 75); border-radius: 11px 11px 0 0; font-size: 13px; color: var(--t2); }
.um { display: inline-flex; align-items: center; gap: 10px; padding: 4px 8px 4px 4px; border-radius: 10px; background: #fff; border: 1px solid var(--borde); }
.um .tx { display: flex; flex-direction: column; line-height: 1.25; }
.um .tx b { font-size: 13px; color: var(--t1); }
.um .tx span { font-size: 12px; color: var(--t2); }
.lat { display: flex; height: 520px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: var(--fondo); }
.lat .sb { width: 232px; flex-shrink: 0; background: oklch(0.925 0.02 75); border-right: 1px solid oklch(0.87 0.022 75); display: flex; flex-direction: column; font-size: 13px; }
.lat .sb.chico { width: 64px; align-items: center; }
.lat .sb .marca2 { height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 14px; font-weight: 700; color: var(--t1); border-bottom: 1px solid oklch(0.87 0.022 75); width: 100%; box-sizing: border-box; }
.lat .sb .brand2 { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, oklch(0.5 0.1 195), oklch(0.58 0.11 170)); flex-shrink: 0; }
.lat .sb .ctx { padding: 12px 14px; line-height: 1.35; }
.lat .sb .ctx b { display: block; color: var(--t1); }
.lat .sb .ctx span { color: var(--t3); font-size: 12.5px; }
.lat .sb nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; width: 100%; box-sizing: border-box; }
.lat .sb .ln { display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 10px; border-radius: 8px; color: oklch(0.42 0.018 60); }
.lat .sb .ln.on { background: #fff; color: oklch(0.43 0.09 195); font-weight: 600; box-shadow: 0 1px 2px oklch(0.24 0.012 60 / 0.08), 0 0 0 1px var(--borde); }
.lat .sb .ln.grupo { font-weight: 600; color: var(--t1); }
.lat .sb .ln .fl { margin-left: auto; color: var(--t3); }
.lat .sb .hijos { margin-left: 18px; padding-left: 10px; border-left: 1px solid oklch(0.85 0.026 75); display: flex; flex-direction: column; gap: 2px; }
.lat .sb .abajo { border-top: 1px solid oklch(0.87 0.022 75); padding: 8px; width: 100%; box-sizing: border-box; }
.lat .sb .pie3 { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-top: 1px solid oklch(0.87 0.022 75); width: 100%; box-sizing: border-box; }
.lat .sb .pie3 .tx { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.lat .sb .pie3 .tx span { color: var(--t3); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lat .panel { width: 232px; flex-shrink: 0; background: oklch(0.905 0.022 75); border-right: 1px solid oklch(0.85 0.026 75); display: flex; flex-direction: column; font-size: 13px; }
.lat .panel .pc { height: 52px; display: flex; align-items: center; padding: 0 14px; font-weight: 700; border-bottom: 1px solid oklch(0.85 0.026 75); }
.lat .panel nav { display: flex; flex-direction: column; gap: 2px; padding: 10px 8px; }
.lat .panel .ln { display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 10px; border-radius: 8px; color: oklch(0.42 0.018 60); }
.lat .panel .ln.on { background: #fff; color: oklch(0.43 0.09 195); font-weight: 600; box-shadow: 0 1px 2px oklch(0.24 0.012 60 / 0.08), 0 0 0 1px var(--borde); }
.lat .panel .ln.grupo { font-weight: 600; color: var(--t1); }
.lat .panel .ln .fl { margin-left: auto; color: var(--t3); }
.lat .panel .hijos { margin-left: 18px; padding-left: 10px; border-left: 1px solid oklch(0.82 0.03 75); display: flex; flex-direction: column; gap: 2px; }
.lat .resto { flex: 1; }
.tip { position: absolute; background: var(--t1); color: #fff; font-size: 12px; padding: 5px 8px; border-radius: 6px; white-space: nowrap; }
.flt { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; position: relative; height: 300px; align-items: flex-start; }
.flt .bus { width: 320px; height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 8px; background: var(--s2); display: flex; align-items: center; gap: 8px; padding: 0 12px; color: var(--t3); font-size: 13px; }
.flt .pil { height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 999px; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t2); background: #fff; }
.flt .pil.con { background: var(--marca-t); color: var(--marca-tx); border-color: oklch(0.51 0.099 195 / 0.35); font-weight: 500; }
.flt .pil.abierto { border-color: var(--borde2); color: var(--t1); }
.flt .mn .it .cnt { margin-left: auto; padding-left: 24px; color: var(--t3); font-variant-numeric: tabular-nums; }
.flt .mn .it.cero { color: var(--t3); }
.est { display: inline-flex; align-items: center; gap: 8px; color: var(--t1); font-size: 13px; margin-right: 8px; }
.est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
  </style>"""


def svg(d, w=16):
    return f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'


LAPIZ = svg('<path d="M15.5 5.5 18.5 8.5 9 18H6v-3z"/>')
PROHIBIR = svg('<circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/>')
ENVIAR = svg('<path d="M4 12 20 4l-4 16-4-7z"/><path d="m12 13 8-9"/>')
CRUZC = svg('<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/>')
CHECKC = svg('<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>')
QUITAR = svg('<circle cx="10" cy="8" r="3.5"/><path d="M4 20a6 6 0 0 1 12 0"/><path d="M16 11h5"/>')
PERSONA = svg('<circle cx="12" cy="8" r="3.75"/><path d="M5 20a7 7 0 0 1 14 0"/>')
SALIR = svg('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>')
CASA = svg('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>', 18)
ENGR = svg('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>', 18)
GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 18)
EDIF = svg('<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2"/>', 18)
MUNDO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.6 2.5 14.4 0 17"/><path d="M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>', 18)
LISTA = svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>', 18)
ESCUDO = svg('<path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/>', 18)
ABAJO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'
DERF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>'
TILDE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
KEBAB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>'
LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')


def menu_fila(nombre, estado, items):
    cuerpo = ""
    for it in items:
        if it == "-":
            cuerpo += '<div class="sep" role="separator"></div>'
        else:
            icono, texto, clase = it
            cuerpo += f'<span class="it {clase}" role="menuitem">{icono} {texto}</span>'
    return (f'<div class="mfila"><div class="r"><span class="n">{nombre}</span><span class="est">{estado}</span>'
            f'<button type="button" class="ib h" aria-label="Acciones de {nombre}">{KEBAB}</button></div>'
            f'<div class="mn" role="menu" style="right: 8px; top: 44px;">{cuerpo}</div></div>')


def fila_medida(pieza, medida, como):
    return (f'<div class="fil" style="grid-template-columns: 240px 170px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;">'
            f'<strong>{pieza}</strong><span>{medida}</span><span>{como}</span></div>')


BODY = f"""<div class="crit">
  <div>
    <h1>Menús y desplegables</h1>
    <p class="sub">Lo que se abre al tocar algo: las acciones de una fila, tu menú, el menú lateral y los filtros.</p>
  </div>

  <section>
    <h2>Menú ⋮ de una fila</h2>
    <div class="g3c">
      <div class="caso3"><span class="rotc">Usuario activo</span>{menu_fila("Tomás Acosta", "Activo", [(LAPIZ, "Editar", ""), "-", (PROHIBIR, "Deshabilitar", "pel")])}</div>
      <div class="caso3"><span class="rotc">Invitación pendiente</span>{menu_fila("Sofía Herrera", "Invitación pendiente", [(ENVIAR, "Reenviar invitación", ""), (LAPIZ, "Editar", ""), "-", (CRUZC, "Revocar invitación", "pel")])}</div>
      <div class="caso3"><span class="rotc">Usuario deshabilitado</span>{menu_fila("Marcos Giménez", "Deshabilitado", [(CHECKC, "Habilitar", ""), "-", (QUITAR, "Quitar de la organización", "pel")])}</div>
    </div>
    <ul class="reglas2" style="margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
      <li><strong>Solo lo que se puede hacer con esa fila.</strong> Lo que no aplica no aparece; nada de opciones grises.</li>
      <li><strong>Las comunes arriba;</strong> las de peligro abajo, en rojo y después de una línea.</li>
      <li><strong>Cada opción con su ícono gris</strong> y un verbo: «Editar», «Reenviar invitación».</li>
      <li><strong>Abre debajo del ⋮</strong>, alineado a la derecha. Si no hay lugar abajo, abre hacia arriba.</li>
    </ul>
  </section>

  <section>
    <h2>Tu menú, arriba a la derecha</h2>
    <div class="barra2">
      <div class="tb2"><span>Inicio / Gestión de usuarios / Usuarios</span><span class="um"><span class="av">L</span><span class="tx"><b>Lucía Fernández</b><span>Grupo Delta</span></span>{ABAJO}</span></div>
      <div class="mn" role="menu" style="right: 16px; top: 62px; width: 320px;">
        <div class="cabu"><span class="av" style="width: 36px; height: 36px; font-size: 15px;">L</span><span class="perf"><b>Lucía Fernández</b><span class="s">lucia.fernandez@delta.ejemplo.com</span></span></div>
        <div class="sep"></div>
        <div class="tit">Perfiles</div>
        <span class="it" role="menuitemradio"><span class="ico2">P</span><span class="perf">Personal<span class="s">Tu perfil personal</span></span></span>
        <span class="it on" role="menuitemradio"><span class="ico2">GD</span><span class="perf">Grupo Delta<span class="s">Dueño</span></span><span class="on-t">{TILDE}</span></span>
        <span class="it apag" role="menuitemradio"><span class="ico2">BS</span><span class="perf">Beta S.R.L.<span class="s">Suspendida</span></span></span>
        <div class="sep"></div>
        <span class="it" role="menuitem">{PERSONA} Mi cuenta</span>
        <div class="sep"></div>
        <span class="it" role="menuitem">{SALIR} Salir</span>
      </div>
      <ul class="reglas2" style="position: absolute; left: 24px; top: 92px; width: 600px;">
        <li><strong>Arriba, quién sos:</strong> nombre y correo.</li>
        <li><strong>Después, tus perfiles:</strong> se cambia de uno a otro sin volver a ingresar. El actual lleva tilde.</li>
        <li><strong>Un perfil que no está disponible</strong> queda en gris y dice por qué en la segunda línea, en lugar del rol. Al tocarlo, se abre la pantalla que lo explica.</li>
        <li><strong>Al final, Mi cuenta y Salir.</strong> Nada más.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Menú lateral</h2>
    <div class="lat">
      <div class="sb">
        <div class="marca2"><span class="brand2"></span>ArquitecturaBase</div>
        <div class="ctx"><b>Grupo Delta</b><span>Organización</span></div>
        <nav><span class="ln on">{CASA} Inicio</span></nav>
        <div class="abajo"><span class="ln on" style="box-shadow: none; background: #fff;">{ENGR} Administración <span class="fl">{DERF}</span></span></div>
        <div class="pie3"><span class="av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>
      </div>
      <div class="panel">
        <div class="pc">Administración</div>
        <nav>
          <span class="ln grupo">{GENTE} Gestión de usuarios <span class="fl">{ABAJO}</span></span>
          <div class="hijos"><span class="ln on">Usuarios</span><span class="ln">Roles y permisos</span></div>
          <span class="ln">{EDIF} Empresas</span>
          <span class="ln">{ENGR} Configuración</span>
          <span class="ln">{MUNDO} Página pública</span>
          <span class="ln">{LISTA} Auditoría</span>
        </nav>
      </div>
      <div class="resto" style="position: relative;">
        <ul class="reglas2" style="position: absolute; left: 40px; top: 28px; width: 420px;">
          <li><strong>Es igual en los tres perfiles</strong> (personal, organización y plataforma). Cambian los enlaces.</li>
          <li><strong>Arriba, Inicio y los módulos.</strong> Abajo de todo, «Administración», que abre un segundo panel al lado.</li>
          <li><strong>Un grupo con hijos</strong> se despliega en el lugar, como «Gestión de usuarios».</li>
          <li><strong>El activo va en blanco</strong> con letra petróleo.</li>
          <li><strong>Contraído</strong> muestra solo los íconos; el nombre aparece al pasar el mouse.</li>
          <li><strong>En el teléfono,</strong> ☰ lo abre encima y «Administración» se despliega adentro.</li>
        </ul>
      </div>
      <div class="sb chico" style="position: relative;">
        <div class="marca2" style="justify-content: center; padding: 0;"><span class="brand2"></span></div>
        <nav style="align-items: center; padding-top: 14px;"><span class="ln on" style="width: 32px; padding: 0; justify-content: center;">{CASA}</span></nav>
        <div class="abajo" style="display: flex; justify-content: center;"><span class="ln" style="width: 32px; padding: 0; justify-content: center;">{ENGR}</span></div>
        <div class="pie3" style="justify-content: center; padding: 10px 0;"><span class="av">L</span></div>
        <span class="tip" style="right: 70px; top: 70px;">Inicio</span>
      </div>
    </div>
  </section>

  <section>
    <h2>Filtros</h2>
    <div class="flt">
      <span class="bus">{LUPA} Buscar por nombre o correo</span>
      <span class="pil abierto" style="position: relative;">Estado {ABAJO}
        <span class="mn" role="listbox" style="left: 0; top: 42px; width: 260px;">
          <span class="it on">Todos los estados<span class="cnt">7</span></span>
          <span class="it">Activo<span class="cnt">4</span></span>
          <span class="it">Invitación pendiente<span class="cnt">1</span></span>
          <span class="it cero">Invitación vencida<span class="cnt">0</span></span>
          <span class="it">Baja pedida<span class="cnt">1</span></span>
          <span class="it">Deshabilitado<span class="cnt">1</span></span>
        </span>
      </span>
      <span class="pil con">Empresa: Delta S.A. {ABAJO}</span>
      <button type="button" class="cb cb-enl" style="font-size: 13px; height: 36px;">Limpiar filtros</button>
      <ul class="reglas2" style="position: absolute; left: 700px; top: 72px; width: 600px;">
        <li><strong>El buscador está siempre.</strong> Hasta tres filtros a la vista.</li>
        <li><strong>Un filtro elegido se pinta de petróleo</strong> y dice qué tiene elegido.</li>
        <li><strong>Cada opción dice cuántas filas trae.</strong></li>
        <li><strong>«Limpiar filtros»</strong> aparece solo si hay algo elegido.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Medidas</h2>
    <div class="medidas">
      <div class="cab" style="grid-template-columns: 240px 170px minmax(0, 1fr);"><span>Pieza</span><span>Medida</span><span>Cómo es</span></div>
      {fila_medida("Opción de un menú", "36 px", "Letra de 13 e ícono gris de 16 a la izquierda.")}
      {fila_medida("Ancho de un menú", "De 220 a 320 px", "Lo que necesite la opción más larga.")}
      {fila_medida("Separador", "1 px", "Una línea gris entre grupos de opciones.")}
      {fila_medida("Caja del menú", "Esquinas de 10 px", "Fondo blanco, borde fino y sombra suave.")}
      {fila_medida("Menú lateral", "232 px · contraído 64 px", "Arena. Opciones de 32 px con ícono de 18.")}
      {fila_medida("Panel de Administración", "232 px", "Un tono más oscuro que el menú lateral, al lado.")}
    </div>
  </section>

  <section>
    <h2>Cómo se comporta</h2>
    <ul class="reglas2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
      <li><strong>Se abre con un clic,</strong> nunca al pasar el mouse.</li>
      <li><strong>Se cierra al elegir,</strong> con Escape o con un clic afuera.</li>
      <li><strong>Uno abierto a la vez.</strong> Abrir otro cierra el anterior.</li>
      <li><strong>Se recorre con las flechas</strong> y se elige con Enter.</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Submenús que se abren al costado de otro menú.</li>
      <li>Opciones grises que no se pueden usar: si no aplica, no va.</li>
      <li>La acción principal escondida en un ⋮.</li>
      <li>Más de 8 opciones: es una pantalla o un desplegable con buscador.</li>
      <li>Íconos de colores, etiquetas o textos sueltos a la derecha que cuentan un estado.</li>
      <li>Menús que se abren al pasar el mouse.</li>
    </ul>
  </section>
</div>"""

SCRIPT = f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{ALTO}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{ si: true, no: false }};
  }}
}}
</script>"""

html = "\n".join([head, CSS, "</helmet>", "", BODY, "</x-dc>", "", SCRIPT, "</body>", "</html>", ""])
(PROJ / ARCHIVO).write_text(html, encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"][ARCHIVO] = {"x": 7600, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 1440 * 6 + 80 * 5
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
