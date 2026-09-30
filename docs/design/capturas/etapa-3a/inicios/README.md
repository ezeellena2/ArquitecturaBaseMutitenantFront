# Comparación de inicios y layouts · Etapa 3a

Se capturaron seis estados de inicio y navegación, cada uno a 1440×900 y 390×844: inicio personal, inicio de organización, perfiles abiertos en ambos accesos y menú lateral abierto en ambos accesos. Cada uno tiene su par `-lienzo.png` y `-app.png` generado por Playwright con el mismo tamaño y datos de demostración. Los doce `-app.png` salen del arnés `src/test/visualApp.html`: monta las rutas de la app con un contexto de autenticación de prueba y datos de demostración, sin hacer el ingreso real. El manifest los marca `captureMode: harness`. El recorrido de ingreso con front, Api, base y correo reales se comprueba por separado con `npm run test:e2e:real`.

Se contrastaron encabezado, marca, bloque de contexto del menú, orden de enlaces, estado activo, pie de cuenta y selector de perfiles. Los estados vacíos conservan el cuerpo vacío del tablero. La organización suspendida sigue visible y legible en «Perfiles», pero no se puede elegir.

## Diferencias justificadas

- **Mi cuenta (3b):** se oculta del menú lateral personal y del selector de perfiles de ambos accesos, en escritorio y teléfono. Su ruta nace en 3b. En escritorio «Salir» queda más arriba que en el tablero; en teléfono el borde superior de la hoja queda más abajo mientras «Salir» conserva casi la misma posición vertical.
- **Administración de empresa (E4):** se oculta el menú de Administración y sus accesos a funciones posteriores. El inicio `/org` queda vacío en 3a, como su tablero.
- **Bordes y tonos:** la aplicación usa los tokens de `tema.md`, incluidos los bordes de controles derivados de `--t3`; prevalecen sobre valores ilustrativos del HTML del lienzo.

La hoja de perfiles y el menú lateral conservan los controles de cierre y cambio de acceso aprobados; no se agregaron accesos de otras etapas.
