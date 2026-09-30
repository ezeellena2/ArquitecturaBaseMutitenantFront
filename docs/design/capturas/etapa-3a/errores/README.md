# Comparación de errores y sesión · Etapa 3a

Se capturaron diez estados, cada uno a 1440×900 y 390×844: `Error-Org` 403/404, `Perfil-Suspendido` suspendida/espera aprobación/cerrada y `Sesion` iniciando/cambiando a Grupo Delta/cambiando a Personal/cerrando/error. Hay diez pares comparables de escritorio (`-lienzo.png` y `-app.png`) y diez capturas móviles **solo de la app**. Los veinte `-app.png` salen del arnés `src/test/visualApp.html`: usa autenticación de prueba y fuerza los estados de `Perfil-Suspendido` y `Sesion`. `Error-Org` navega a las rutas de demostración `/sin-permiso` y `/no-existe`, sin recibir un 403 o 404 de la Api. El manifest marca los veinte casos `captureMode: harness`. Estos diez estados móviles no tienen referencia móvil comparable: sin tablero móvil: pendiente de aprobación del usuario. El manifest fija ruta, estado, tamaño y el tablero de escritorio usado como guía de contenido.

En escritorio se contrastaron estructura, marca, íconos, títulos, mensajes, orden, controles, tonos y tamaños. En móvil se verificó que la app adapte el contenido del tablero de escritorio según `responsive.md`; **no se declara una comparación visual aprobada a 390×844**. En la captura del arnés, `Error-Org` conserva el layout de Empresa. `Perfil-Suspendido` ofrece los otros perfiles elegibles, mantiene legible la organización suspendida y permite salir. `Sesion` muestra los cinco mensajes y la acción de retorno cuando falla el ingreso. Los tests de rutas y del middleware cubren por separado las respuestas reales de la Api.

Se regeneraron y revisaron las capturas tras los hallazgos 27, 28 y 70. El lienzo y la app usan el mismo Inter local; la fase del spinner puede cambiar entre capturas. `navigationStatus.test.tsx` verifica que la transición de sesión permanece visible mientras OIDC marca `isLoading`; `SessionRecovery.test.tsx` comprueba que tras F5 no se monte `/org` antes de recuperar la sesión; `routes.test.tsx` verifica que `/org` presenta el estado obtenido de `/api/me`. Las capturas del arnés siguen usando los estados de demostración definidos allí y no sustituyen esas pruebas de navegación.

## Diferencias y estados pendientes

- **Auditoría (E4):** `Error-Org` omite «Auditoría» de las migas del lienzo. Su ruta nace con la administración de la organización en E4; los controles futuros se ocultan hasta su etapa.
- **Alta de empresa (E6), Mi cuenta (3b), recuperación (E5), directorio (E7) y WhatsApp (E8):** sus controles se ocultan en todas las pantallas de 3a donde el lienzo los dibuja. Las diferencias específicas están también en los README de `ingreso`, `registro`, `publicas` e `inicios`.
- **`Error-Org` móvil: sin tablero móvil: pendiente de aprobación del usuario.** Sus dos capturas muestran solo la aplicación; el tablero de escritorio guía el contenido y su orden.
- **`Perfil-Suspendido` móvil: sin tablero móvil: pendiente de aprobación del usuario.** Sus tres capturas muestran solo la aplicación; el tablero de escritorio guía el contenido y su orden.
- **`Sesion` móvil: sin tablero móvil: pendiente de aprobación del usuario.** Sus cinco capturas muestran solo la aplicación; el tablero de escritorio guía el contenido y su orden.
- **Ajuste visual residual:** en `Perfil-Suspendido` de escritorio, «Salir» queda aproximadamente 5 px más abajo que en el tablero, después de igualar tamaño y posición de la tarjeta de perfiles. Se conserva el alto táctil del control de la aplicación.

No se agregaron rutas ni acciones para suplir tableros ausentes. Las tres adaptaciones móviles quedan pendientes de aprobación del usuario.
