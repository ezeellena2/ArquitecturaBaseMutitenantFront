# Comparación de errores y sesión · Etapa 3a

Se capturaron diez estados, cada uno a 1440×900 y 390×844: `Error-Org` 403/404, `Perfil-Suspendido` suspendida/espera aprobación/cerrada y `Sesion` iniciando/cambiando a Grupo Delta/cambiando a Personal/cerrando/error. Son 20 pares de PNG (`-lienzo.png` y `-app.png`) generados por Playwright con iguales datos y tamaño. El manifest fija ruta, estado y tablero de cada par.

Se contrastaron estructura, marca, íconos, títulos, mensajes, orden, controles, tonos y tamaños. `Error-Org` conserva el layout de Empresa aun con un 403 o 404 de la API. `Perfil-Suspendido` ofrece los otros perfiles elegibles, mantiene legible la organización suspendida y permite salir. `Sesion` muestra los cinco mensajes y la acción de retorno cuando falla el ingreso.

## Diferencias y estados pendientes

- **Auditoría (E4):** `Error-Org` omite «Auditoría» de las migas del lienzo. Su ruta nace con la administración de la organización en E4; los controles futuros se ocultan hasta su etapa.
- **Alta de empresa (E6), Mi cuenta (3b), recuperación (E5), directorio (E7) y WhatsApp (E8):** sus controles se ocultan en todas las pantallas de 3a donde el lienzo los dibuja. Las diferencias específicas están también en los README de `ingreso`, `registro`, `publicas` e `inicios`.
- **`Error-Org` móvil: sin tablero móvil: pendiente de aprobación del usuario.** La captura `-lienzo.png` a 390×844 muestra el tablero de escritorio recortado como referencia de textos y orden; la aplicación adapta ese mismo contenido según `responsive.md`.
- **`Perfil-Suspendido` móvil: sin tablero móvil: pendiente de aprobación del usuario.** Se usa la misma referencia de escritorio recortada; la aplicación conserva contenido, textos y orden de los tres estados.
- **`Sesion` móvil: sin tablero móvil: pendiente de aprobación del usuario.** Se usa la misma referencia de escritorio recortada; la aplicación conserva contenido, textos y orden de los cinco estados.
- **Ajuste visual residual:** en `Perfil-Suspendido` de escritorio, «Salir» queda aproximadamente 5 px más abajo que en el tablero, después de igualar tamaño y posición de la tarjeta de perfiles. Se conserva el alto táctil del control de la aplicación.

No se agregaron rutas ni acciones para suplir tableros ausentes. Las tres adaptaciones móviles quedan pendientes de aprobación del usuario.
