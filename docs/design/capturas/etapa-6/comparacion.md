# Comparación visual E6 · lienzo v64

Fecha: 2026-10-03. El lienzo v64 y sus móviles y diálogos están aprobados por el usuario para la Etapa 6.

`manifest.json` registra 23 estados en 1440×900 y 390×844: 46 capturas comparables de tablero y app (92 PNG). `node scripts/capturar-etapa-6.mjs --verify` confirma que cada imagen existe. Las capturas de escritorio abren el panel Administración, igual que los tableros; las pantallas con `M-*` usan su tablero móvil. Los estados sin tablero móvil de administración guardan la referencia de escritorio completa (1440×900) junto a la app a 390×844 para que no quede recortada.

## Diferencias observadas

| Estado | Diferencia | Motivo y tratamiento |
|---|---|---|
| `usuario-roles-empresa-movil`, `usuario-sumar-empresa-movil` | `M-Usuario` no representa la lista de empresas de solo lectura con menú ⋮ ni los diálogos de editar roles/sumar empresa que muestra la app. | El usuario precisó que esas acciones se guardan al momento desde diálogos. La app implementa esa instrucción; conservé el tablero original y capturé el estado móvil de la app junto a la referencia sin simular una aprobación nueva del lienzo. |
| `configuracion-quitar-dominio-escritorio`, `configuracion-quitar-dominio-movil` | El texto de la app explica que quitar el dominio detiene asociaciones nuevas, pero conserva la protección de los correos ya vinculados; el tablero dice que los diez correos actuales “siguen igual”. | Cambio aprobado por el usuario para reflejar que salir de una organización no debe reactivar el acceso Personal de exmiembros. |
| `configuracion-pendiente`, `configuracion-agregar-dominio`, `configuracion-quitar-dominio`, `pagina-publica-*`, `error-organizacion`, `aviso-guardado` (móviles) | No hay tablero móvil dedicado a esos estados de administración. Las referencias se capturaron completas en su viewport de escritorio y la app en 390×844; la app presenta los diálogos como panel inferior cuando corresponde. | No reutilicé `M-Pagina-Publica`, que pertenece a la experiencia pública y no al editor de administración. La diferencia muestra el comportamiento responsive real frente al único tablero aplicable. |
| `auditoria-lista` | El subtítulo del tablero incluye el total del período; la app conserva “Acciones realizadas en esta organización”. | El endpoint pagina por cursor y evita contar la tabla append-only. No se muestra el tamaño de la página como si fuera el total; quedó anotado en `docs/backlog.md` hasta definir una estrategia de recuento. |
| `usuarios-lista-movil`, `auditoria-lista-movil` | Los textos largos de correo/evento pueden terminar en puntos suspensivos por el ancho disponible. | El estado y el detalle completo siguen accesibles en la fila o en el botón de detalle. Los nombres de usuario, fechas y el evento principal caben después de ajustar los anchos responsivos. |

Las fixtures visuales usan la misma muestra que el lienzo: 10 de 11 personas, 3 empresas y 8 eventos visibles de auditoría. Los datos de prueba son sintéticos. El resumen de Usuarios, el botón «Invitar», el panel Administración, las columnas de Auditoría y el diálogo de moderación se alinearon con v64; no quedó otra diferencia de flujo en las capturas revisadas.

## Pares de referencia

- Usuarios y diálogos: `organizacion/usuarios-lista-*`, `usuarios-invitar-*`, `usuario-*`.
- Roles: `roles-lista-*`, `rol-editar-*`.
- Empresas: `empresas-*`, `empresa-*`.
- Configuración: `configuracion-*`.
- Página pública: `pagina-publica-*`.
- Auditoría y estados comunes: `auditoria-lista-*`, `error-organizacion-*`, `aviso-guardado-*`.

Cada par tiene archivos `*-lienzo.png` y `*-app.png` en los tamaños indicados en `manifest.json`.
