# Piezas de empresas

Piezas que solo usan las pantallas de Empresas, armadas con las de `shared/ui` sin modificarlas.
`CompanyDialog` (crear y editar, en Empresas y en la ficha), `AddMemberDialog` y `MemberRolesDialog`: React Hook Form y zod, como Roles; cada uno es dueño de lo escrito, su guardado y su error. Al editar, mandan la versión de cuando se abrieron: `CompanyDialog` con `useEditForm`, porque la ficha le pasa su lectura viva.
`CompanyFields`: Nombre y CUIT en una fila y «Zona de negocio» (decisión 5: CUIT como tipo + número; sin zona, la de la organización). El esquema revisa el nombre y el CUIT (`useCuitType`, de `shared/referenceData`, como el registro de empresa) al tocar el botón.
Lo que el back rechaza de un dato va a su campo con `../errors.ts`; lo demás, en la franja. Leé `../../../../../docs/rules/formularios.md`.
Se montan solo abiertos, devuelven el foco (al ⋮ si los abrió un menú) y, después de un 409, `useDialogFailure` relee al cerrar. El error de la franja se va al cambiar un campo (`clear`).
