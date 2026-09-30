# Comparación de inicios y layouts · Etapa 3a

Se capturaron los inicios y los perfiles abiertos de ambos accesos a 1440×900 y 390×844, más el menú lateral abierto de ambos accesos solo a 390×844: diez casos. Cada caso conserva su par `-lienzo.png` y `-app.png` generado por Playwright con el mismo tamaño y datos de demostración. Los diez `-app.png` salen del arnés `src/test/visualApp.html`: monta las rutas de la app con un contexto de autenticación de prueba y datos de demostración, sin hacer el ingreso real. El manifest los marca `captureMode: harness`. El recorrido de ingreso con front, Api, base y correo reales se comprueba por separado con `npm run test:e2e:real`.

Se contrastaron encabezado, marca, bloque de contexto del menú, orden de enlaces, estado activo, pie de cuenta y selector de perfiles. Los estados vacíos conservan el cuerpo vacío del tablero. La organización suspendida sigue visible y legible en «Perfiles», pero no se puede elegir.

Se regeneraron los diez pares con Inter local para comparar la misma tipografía. El botón del lateral empieza a la altura del tablero, el enlace activo conserva su borde y sombra, y la capa de los menús móviles usa `--velo` (hallazgos 61 y 64). Los cambios de guardas de ruta y recuperación de sesión se comprueban en `routes.test.tsx` y `SessionRecovery.test.tsx`; el arnés de capturas sigue mostrando los estados dibujados.

## Diferencias justificadas

- **Mi cuenta (3b):** se oculta del menú lateral personal y del selector de perfiles de ambos accesos, en escritorio y teléfono. Su ruta nace en 3b. En escritorio «Salir» queda más arriba que en el tablero; en teléfono el borde superior de la hoja queda más abajo mientras «Salir» conserva casi la misma posición vertical.
- **Administración de empresa (E4):** se oculta el menú de Administración y sus accesos a funciones posteriores. El inicio `/org` queda vacío en 3a, como su tablero.
- **Bordes y tonos:** la aplicación usa los tokens de `tema.md`, incluidos los bordes de controles derivados de `--t3`; prevalecen sobre valores ilustrativos del HTML del lienzo.

La hoja de perfiles y el menú lateral conservan los controles de cierre y cambio de acceso aprobados; no se agregaron accesos de otras etapas.

Los anteriores casos `lateral-*-escritorio` repetían byte a byte los inicios de escritorio: el tablero aprobado no muestra un estado contraído al accionar su botón. Se quitaron esos dos pares y sus cuatro PNG; los laterales móviles sí abren una hoja distinta y se conservan. `inicio-personal-movil` e `inicio-org-movil` pueden ser idénticos porque los dos tableros aprobados muestran el mismo inicio vacío en ese tamaño; el manifest mantiene ambos accesos y el test de hashes permite únicamente esa repetición.
