# Piezas de empresas

Piezas que solo usan las pantallas de Empresas, armadas con las de `shared/ui` sin modificarlas.
`CompanyFields`: Nombre y CUIT en una fila y «Zona de negocio» (decisión 5: CUIT como tipo + número por debajo; sin zona, la de la organización).
`useCompanyValidation` revisa el nombre y el CUIT al tocar Guardar, no mientras se escribe (Criterio · Formularios).
`CompanyDialog` (crear y editar, en Empresas y en la ficha), `AddMemberDialog` y `MemberRolesDialog`: cada uno es dueño de su borrador, su guardado y su error.
Se montan solo abiertos, devuelven el foco (al ⋮ si los abrió un menú) y, después de un 409, `useDialogFailure` relee al cerrar.
