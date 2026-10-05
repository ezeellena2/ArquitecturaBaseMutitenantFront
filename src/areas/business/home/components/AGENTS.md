# Piezas del inicio

Piezas que solo usa el inicio de la organización, armadas con las de `shared/ui` sin modificarlas.
`pendingItems.ts` traduce cada fila de «Para resolver» (área y tipo) a su texto, estado, ícono y enlace; un tipo desconocido no se muestra.
El teléfono (M-Inicio-Org y M-Inicio-Miembro, lienzo v106) es una pantalla propia, la billetera, no la de la compu achicada.
`companyDetail.ts` arma «rol · miembros» de cada empresa, igual en la compu y en el teléfono.
`HomeCards` pinta el estado de la Página pública con `StatusBadge` y los tonos que registra (`defineStatusTones`), como la Página pública; la palabra sale de `enums.HomePublicPageState`.
