# A9 · El ingreso acepta las invitaciones vigentes

Fuente visual: lienzo v112 (`9c1c782`), aprobado. Ocho comparaciones, tablero a la izquierda y app a la derecha, a 1440 × 900 y 390 × 844. No cambia el diseño del ingreso ni la aceptación legal.

El ingreso con código acepta todas las invitaciones vigentes del correo (ADR 0047, aclaración del usuario del 2026-10-07). Empresa elige la organización habitual y deja las demás en Perfiles. Persona entra a Personal y también acepta las invitaciones. Los términos pendientes se aceptan en la pantalla existente, con la casilla inicialmente sin marcar.

Un correo administrado cuya membresía se perdió sigue sin servir para ingresar: solo una invitación de la organización dueña del dominio lo rehabilita. Una invitación de otra organización puede aceptarse desde el enlace usando otro método disponible.

| Pantalla | 1440 | 390 |
|---|---|---|
| Persona | [Comparación](ingreso/ingreso-persona-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-persona-correo-movil-390x844-lado-a-lado.png) |
| Empresa | [Comparación](ingreso/ingreso-empresa-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-empresa-correo-movil-390x844-lado-a-lado.png) |
| Términos, sin marcar | [Comparación](terminos/aceptar-ambos-sin-marcar-escritorio-1440x900-lado-a-lado.png) | [Comparación](terminos/aceptar-ambos-sin-marcar-movil-390x844-lado-a-lado.png) |
| Términos, marcado | [Comparación](terminos/aceptar-ambos-marcado-escritorio-1440x900-lado-a-lado.png) | [Comparación](terminos/aceptar-ambos-marcado-movil-390x844-lado-a-lado.png) |

Las capturas usan los fixtures visuales del relevamiento para conservar los datos del tablero; el recorrido E2E real se verifica por separado, sin mocks. La selección de WhatsApp sigue pendiente de Etapa 8. La barra de estado y el indicador inferior del tablero móvil pertenecen al teléfono.

Vista en vivo desde el front: `node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7-a9/aceptar-ambos-sin-marcar-escritorio --vite http://127.0.0.1:5191`. Para el teléfono: `aceptar-ambos-sin-marcar-movil`; la casilla marcada usa `aceptar-ambos-marcado-escritorio` o `aceptar-ambos-marcado-movil`. Las puertas usan `ingreso-persona-correo-escritorio`/`movil` e `ingreso-empresa-correo-escritorio`/`movil`.
