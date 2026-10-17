"""Etapa 9 · correctivo R10 (pedido del Coordinador de la 9, 2026-10-16): en Roles, «Inactivar» va apagado con su motivo
debajo cuando el rol tiene usuarios (regla del 13/10 de opciones apagadas con motivo), como ya lo programó el front.
Se agrega el estado «Menú de un rol con usuarios» para verlo sin abrir el ⋮. M-Roles no tiene «Inactivar».
Se puede volver a correr."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
EST = "Menú de un rol con usuarios"


def r(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def main():
    ruta = PROJ / "Roles.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "motivoInactivar" in t:
        print("Roles ya tiene «Inactivar» apagado")
        return
    i = t.index('<sc-if value="{{r.editable}}" hint-placeholder-val="{{si}}"><div class="menu-sep" role="separator"></div><button type="button" class="menu-it pel" role="menuitem" onClick="{{r.inactivar}}">')
    j = t.index("</sc-if>", i) + len("</sc-if>")
    viejo = t[i:j]
    icono = viejo[viejo.index("<svg"):viejo.index("</svg>") + len("</svg>")]
    nuevo = (viejo.replace("{{r.editable}}", "{{r.puedeInactivar}}", 1)
             + '<sc-if value="{{r.inactivarOff}}" hint-placeholder-val="{{no}}"><div class="menu-sep" role="separator"></div>'
             f'<button type="button" class="menu-it apagado inact-off" role="menuitem" aria-disabled="true">{icono}'
             '<span class="mot">Inactivar<small>{{r.motivoInactivar}}</small></span></button></sc-if>')
    t = t[:i] + nuevo + t[j:]
    t = r(t, "        textoEditar: r.sistema ? 'Ver permisos' : 'Editar',\n",
          "        textoEditar: r.sistema ? 'Ver permisos' : 'Editar',\n"
          "        // Etapa 9 (R10): con usuarios no se puede inactivar; la opción va apagada con el motivo debajo.\n"
          "        puedeInactivar: !r.sistema && r.u === 0,\n"
          "        inactivarOff: !r.sistema && r.u > 0,\n"
          "        motivoInactivar: r.u === 1 ? 'Lo tiene 1 usuario. Quitáselo primero.' : 'Lo tienen ' + r.u + ' usuarios. Quitáselo primero.',\n")
    t = r(t, """data-props='{"$preview":{"width":1440,"height":900}}'""",
          "data-props='" + json.dumps({"estado": {"editor": "enum", "options": ["Lista", EST], "default": "Lista", "section": "Estado"},
                                       "$preview": {"width": 1440, "height": 900}}, ensure_ascii=False, separators=(",", ":")) + "'")
    t = r(t, "    this.state = { wa: false, adm: true, abierto: null,",
          f"    this.state = {{ wa: false, adm: true, abierto: props.estado === '{EST}' ? 'fila:r5' : null,")
    t = t.replace("  </style>", """
    /* Etapa 9 (R10): opción apagada con su motivo debajo */
    .menu-it.inact-off { align-items: flex-start; }
    .menu-it.inact-off svg { color: var(--t3); margin-top: 2px; }
    .menu-it .mot { display: flex; flex-direction: column; gap: 2px; }
    .menu-it .mot small { font-size: 12.5px; color: var(--t3); }
  </style>""", 1)
    ruta.write_text(t, encoding="utf-8")
    print("Roles: «Inactivar» apagado con su motivo")


if __name__ == "__main__":
    main()
