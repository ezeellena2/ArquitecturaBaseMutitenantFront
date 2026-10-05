# Piezas de usuarios

Piezas que solo usan las pantallas de Usuarios, armadas con las de `shared/ui` sin modificarlas.
`RolesField`: roles con «Todos» como casilla junto al rótulo (tablero Usuario); sube a `shared/ui` cuando FormField tenga ese lugar.
`AccessSheets`: las hojas del teléfono para el estado (con tilde, se cierra al elegir) y los roles (casillas y «Listo»), como M-Usuario (v99).
`InviteUserDialog` y `UserCompanyDialog`: «Invitar usuario», y «Sumar empresa» y «Cambiar roles» de la ficha, con React Hook Form y zod; se montan solo mientras están abiertos.
