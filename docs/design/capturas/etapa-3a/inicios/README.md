# Comparación de inicios y layouts · Etapa 3a

Se capturaron los inicios y los perfiles de ambos accesos a 1440×900 y 390×844: ocho casos. Cada caso conserva su par `-lienzo.png` y `-app.png` generado por Playwright con el mismo tamaño y datos de demostración, contra el lienzo vigente (`docs/design/lienzo`). Los ocho `-app.png` salen del arnés `src/test/visualApp.html`: monta las rutas de la app con un contexto de autenticación de prueba y datos de demostración, sin hacer el ingreso real. El manifest los marca `captureMode: harness`. El recorrido de ingreso con front, Api, base y correo reales se comprueba por separado con `npm run test:e2e:real`.

En escritorio se contrastaron encabezado, marca, bloque de contexto del menú, orden de enlaces, estado activo, pie de cuenta y el menú de la cuenta con sus perfiles. La organización suspendida sigue visible y legible en «Perfiles», pero no se puede elegir.

En el teléfono la pantalla es la de una app («Criterio · Marco»): no hay lateral ni menú de la cuenta. Abajo van «Inicio» y «Más»; los perfiles, la Administración, Mi cuenta y Salir están en «Más». Por eso `perfiles-*-movil` toca «Más» y se compara con `M-Mas-Personal` y `M-WA-Menu`. El inicio de la organización es la billetera de `M-Inicio-Org`: los atajos y «Para resolver». Los casos de la organización usan `visual-owner` con los datos de `/api/home`, para que la billetera y la Administración de «Más» tengan contenido.

## Diferencias justificadas

- **WhatsApp (E11):** el lienzo dibuja WhatsApp en la barra de abajo («Mensajes», «Chats», «Contactos», «Difusiones»), en los atajos y en «Para resolver»; el módulo no está y la app no los muestra.
- **«Más» de la organización:** la app dice «Roles y permisos», como el panel de Administración de la compu; `M-WA-Menu` dice «Roles».
- **Inicio personal:** `M-Inicio-Personal` dibuja el aviso de método propio; `visual-personal` ya tiene un correo propio y no lo necesita. El aviso se compara en 3b (`inicio-aviso-personal`).
- **Bordes y tonos:** la aplicación usa los tokens de `tema.md`; prevalecen sobre valores ilustrativos del HTML del lienzo.

Solo los inicios móviles vacíos pueden repetir el mismo PNG; el test de hashes no permite otra repetición.
