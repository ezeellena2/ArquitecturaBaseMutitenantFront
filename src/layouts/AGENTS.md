# Layouts

`AppShell` envuelve la app: las franjas de red y versión nueva, la organización no disponible, la baja pedida y el 403 que bloquea la vista. `PrivateLayoutFrame` arma el marco de los tres accesos (menú lateral, `AdminPanel` y barra en la compu; la app en el teléfono) y `AccountLayout` pone `/cuenta` y `/mas` en el del acceso activo.
Leé [frontend.md §4 «Errores»](../../docs/architecture/frontend.md#errores), [errores.md](../../docs/rules/errores.md), [pantallas-y-ui.md](../../docs/rules/pantallas-y-ui.md) y el tablero [Avisos](../../docs/design/lienzo/Avisos.dc.html).
Las rutas de cada área y su menú salen del manifiesto de `navigation/<área>.ts`: un permiso se declara una sola vez. Copiá de `navigation/business.ts`.
Personal toma Inicio + módulos visibles (hasta cuatro) y Más; todos sus módulos visibles se abren también desde Más. Leé [personal](../../docs/rules/personal.md).
`SiteLayout` mantiene el marco web de Landing/Directorio y Storefront: Sheet del menú móvil, sin BottomNav; la sesión pública usa `tenancy/PublicAccessMenu`.
