# Comparación visual · Etapa 3c

Se comparó `/invitacion` con los tableros `Invitacion` y `M-Invitacion` de Figma, y el correo HTML con `Mensajes`. El manifest cubre ocho estados estables en 1440×900 y 390×844, tres estados transitorios (carga, envío y error) en ambos tamaños, y cuatro correos (es/en, con/sin código) en ambos tamaños: **30 pares completos**. Las capturas de la app usan el arnés visual existente con respuestas sintéticas; no sustituyen los E2E reales y no escriben cuentas ni organizaciones en Development. El HTML de correo proviene del renderer real y sus tests de plantilla.

## Resultado por tablero

| Referencia | Resultado | Diferencias y motivo |
|---|---|---|
| `Invitacion` · 1440×900 | La tarjeta mantiene jerarquía y ancho del tablero. | El lienzo muestra Empresa, Roles y el rol de quien invita; se omiten porque esos modelos y su API nacen en E6/E4. No se inventaron valores. |
| `M-Invitacion` · 390×844 | Todos los estados caben en 390 px sin desborde horizontal; los nombres y correos largos parten correctamente. | Se mantienen las mismas omisiones autorizadas de Empresa, Roles y rol del invitador. |
| Estados de error | Vencida, inválida y organización suspendida tienen salida legible y coherente con el estado. | Se alinearon los títulos/descripciones disponibles y el CTA «Ir al ingreso» con `/login`. El lienzo no contiene estados de carga/envío/error de red; para esos tres pares se usa como referencia el estado estable equivalente y se fotografía el transitorio real de la app. |
| Aceptación | El estado aceptado muestra el aviso de respaldo antes de continuar y conserva el acceso Business. | El enlace de WhatsApp del lienzo no se muestra: WhatsApp pertenece a E8. El CTA de agregar método deriva a Cuenta en el acceso Business implementado. |
| `Mensajes` · invitación por correo | Se verificó el HTML que entrega el renderer real en escritorio y móvil, en español e inglés, con y sin aviso de código. | El lienzo es una referencia estática en español con “ArquitecturaBase” y “Delta Norte S.A.”; el renderer usa nombre, invitador, URL y fecha actuales, y tiene recursos en inglés. El aviso de código aparece solo cuando el destino tiene Email verificado y disponible; Google-only y una cuenta nueva no reciben esa promesa. |

## Diferencias deliberadas de datos y formato

- El lienzo presenta un vencimiento relativo («En 6 días»). La pantalla muestra la fecha civil localizada («07/10/2026»): el formateador compartido del producto presenta fechas futuras como fecha absoluta y reserva el relativo para el tiempo transcurrido. Evita que una cuenta regresiva redondeada sugiera una vigencia distinta.
- El correo de ejemplo del renderer usa valores sintéticos contractuales (incluido un nombre de organización con caracteres HTML especiales); no procede de la base de desarrollo. Las cuatro variantes HTML están guardadas bajo `correos/html/` y sus capturas bajo `correos/`.
- La confirmación de envío/carga/error es estado de aplicación y no aparece en los tableros. No se añadió un estado ficticio al diseño ni una pantalla nueva.

## Archivos

`manifest.json` enumera los 30 casos, viewports, estado, respuestas de presentación o HTML y notas de comparación. `estados/`, `acciones/` y `correos/` guardan los PNG; `correos/html/` guarda el HTML real capturado por los tests del renderer. La verificación existente imprime `30 pares visuales 3c completos.`. No se añadieron guardas ni tests del arnés.
