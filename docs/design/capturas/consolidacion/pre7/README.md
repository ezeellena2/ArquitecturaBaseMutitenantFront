# Arreglos antes de la Etapa 7 · comparaciones v112

Referencia: lienzo v112, `9c1c782`, aprobado por el usuario. Las imágenes tienen el tablero a la izquierda y la app a la derecha, a 1440 × 900 y 390 × 844. No se modifica `docs/design/lienzo/`.

## A4 · Registro con Google

Los dos registros conservan su disposición. El botón y el formulario de Google son hermanos del formulario de correo en React. El E2E real comprobó ambos POST 302 y la navegación a `accounts.google.com` con el correo vacío: 2/2, EXIT 0; FRONT `.local/pre7/a4/real-a4.log`. Implementación: `1865921`.

| Pantalla | 1440 | 390 |
|---|---|---|
| Registro de persona | [Comparación](registro/registro-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](registro/registro-correo-movil-390x844-lado-a-lado.png) |
| Registro de empresa | [Comparación](registro/registro-empresa-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](registro/registro-empresa-correo-movil-390x844-lado-a-lado.png) |

La selección de WhatsApp del tablero sigue pendiente de la Etapa 8, como en el cierre anterior. La app muestra los canales que ofrece su API.

## A5 · Mi cuenta sin código de confirmación

Comparaciones de los cinco estados afectados, a 1440 y 390. A5 y la ADR 0045 eliminan el paso de reautenticación: agregar correo pide directamente el correo nuevo, su verificación conserva un solo código, y quitar, desvincular y dar de baja conservan sus diálogos sin código. Integración 73/73, seguridad/persistencia 34/34 y E2E real focal A5 3/3, EXIT 0, 137,947 s; FRONT `.local/pre7/a5/real-a5-third.log`. Los dos intentos fallidos se conservaron y sus preparaciones se corrigieron antes de repetir el recorrido. Aspire quedó apagado. Implementación BACK `6b07c3e`, FRONT `544bfe6`.

| Estado | 1440 | 390 |
|---|---|---|
| Agregar correo | [Comparación](cuenta/agregar-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/agregar-correo-movil-390x844-lado-a-lado.png) |
| Verificar el correo nuevo | [Comparación](cuenta/agregar-correo-codigo-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/agregar-correo-codigo-movil-390x844-lado-a-lado.png) |
| Dar de baja | [Comparación](cuenta/baja-cuenta-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/baja-cuenta-movil-390x844-lado-a-lado.png) |
| Quitar correo | [Comparación](cuenta/cuenta-quitar-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/cuenta-quitar-correo-movil-390x844-lado-a-lado.png) |
| Desvincular Google | [Comparación](cuenta/cuenta-desvincular-google-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/cuenta-desvincular-google-movil-390x844-lado-a-lado.png) |

La referencia v112 se conserva completa: `Cuenta-Baja` y `Cuenta-Metodo` todavía dibujan el OTP que la ADR 0045 ordena retirar. Las diez comparaciones se repitieron con Nombre y Apellido de A6, como se detalla abajo. La exportación pertenece a E10, según la ficha `identidad.md` del back.

## A1 · El operador probado en una puerta pública

Ingreso y M-Ingreso, estado «Operador: la cuenta entra por Plataforma», en las puertas Persona y Empresa. El título, el edificio gris y los botones «Ir a Plataforma» y «Salir» salen de la v112. Esta pantalla aparece después de probar el correo; con solo la cookie de Plataforma, el ingreso público muestra su formulario, según la ADR 0044. Salir conserva la cookie de Plataforma.

| Puerta | 1440 | 390 |
|---|---|---|
| Persona | [Comparación](ingreso/ingreso-operador-persona-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-operador-persona-movil-390x844-lado-a-lado.png) |
| Empresa | [Comparación](ingreso/ingreso-operador-empresa-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-operador-empresa-movil-390x844-lado-a-lado.png) |

Las primeras capturas móviles heredaron la respuesta «Sin empresa» del caso fuente. Se conservan en `.local/pre7/a1/capturas-primeras-incorrectas*`; el test del catálogo reprodujo el fallo y pasó después de compartir la preparación explícita de ambas variantes. Las cuatro comparaciones se repitieron y verificaron, EXIT 0. Pantalla/salida 55/55, auth/traducciones 16/16, catálogo 11/11. E2E real focal A1,A3: segundo intento 3/3, 0 fallos/cancelados/omitidos, EXIT 0, 258,090 s; `real-a1-a3-second.log`. La carrera del helper con el cooldown se corrigió antes de repetir, sin ampliar los tiempos ni los topes. Aspire final `[]`, EXIT 0. Implementación FRONT `a6782b0`, ficha BACK `d15b19b`.

```powershell
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-operador-persona-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-operador-persona-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-operador-empresa-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-operador-empresa-movil --vite http://127.0.0.1:5191
```

## A2 · Correo sin cuenta o de otra cuenta

Los seis estados muestran el error de campo de la v112. En ingreso y registro, el enlace conserva el correo escrito en el destino. Recuperar consulta el correo anterior antes de pasar al siguiente paso; agregar correo rechaza un correo verificado de otra cuenta sin emitir un código.

| Estado | 1440 | 390 |
|---|---|---|
| Ingreso de persona sin cuenta | [Comparación](ingreso/ingreso-sin-cuenta-persona-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-sin-cuenta-persona-movil-390x844-lado-a-lado.png) |
| Ingreso de empresa sin cuenta | [Comparación](ingreso/ingreso-sin-cuenta-empresa-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-sin-cuenta-empresa-movil-390x844-lado-a-lado.png) |
| Registro con correo existente | [Comparación](registro/registro-correo-con-cuenta-escritorio-1440x900-lado-a-lado.png) | [Comparación](registro/registro-correo-con-cuenta-movil-390x844-lado-a-lado.png) |
| Recuperar: anterior sin cuenta | [Comparación](recuperar/recuperar-anterior-sin-cuenta-escritorio-1440x900-lado-a-lado.png) | [Comparación](recuperar/recuperar-anterior-sin-cuenta-movil-390x844-lado-a-lado.png) |
| Recuperar: nuevo de otra cuenta | [Comparación](recuperar/recuperar-nuevo-con-cuenta-escritorio-1440x900-lado-a-lado.png) | [Comparación](recuperar/recuperar-nuevo-con-cuenta-movil-390x844-lado-a-lado.png) |
| Agregar correo de otra cuenta | [Comparación](cuenta/agregar-correo-otra-cuenta-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/agregar-correo-otra-cuenta-movil-390x844-lado-a-lado.png) |

El primer capturador produjo 11/12 imágenes: la preparación de escritorio todavía buscaba «Agregar correo o teléfono». El test del catálogo reprodujo ese desacuerdo (1 fallo y 12 verdes), pasó con el nombre actual «Agregar correo» (13/13) y se repitieron las doce comparaciones en verde. Las primeras imágenes y logs se conservan en `.local/pre7/a2/capturas-primeras*`; `capturas-segundas.*` y `capturas-verificar.*` tienen EXIT 0. Después de corregir la pérdida de correo al volver de OIDC en StrictMode, se regeneraron y revisaron las doce imágenes actuales: `capturas-finales.*` y `capturas-verificar-finales.*`, ambos EXIT 0. Las dos imágenes de Agregar correo se repitieron con el fondo de A6, como se detalla abajo.

E2E real combinado A2, A1, A3 y reclamo del correo pendiente: cuarto intento **9/9**, 0 fallos/cancelados/omitidos, EXIT 0, **575,132 s**, `real-fourth.*`. Aspire después del real `[]`, EXIT 0. Los tres intentos fallidos se conservan; se corrigieron la cuota compartida de preparación y la pérdida de correo OIDC con su rojo/verde. El fallo intermitente de A1 del tercero no se reprodujo en cuatro diagnósticos ni en el cuarto combinado; no se atribuye una corrección causal. Detalle y conteos en el plan de arreglos del back.

Implementación BACK `962a71c` (37 rutas propias) y FRONT `0249b8a` (19 rutas propias), en `main`, sin push. Consulta de recuperación reforzada **6/6**, 0 fallos/omitidos, EXIT 0, **32,520 s**, `preview-readonly-final.*`: códigos, outbox y solicitudes sin cambios para correos conocidos o desconocidos. Aspire final `[]`, EXIT 0.

```powershell
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-sin-cuenta-persona-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-sin-cuenta-persona-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-sin-cuenta-empresa-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/ingreso-sin-cuenta-empresa-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-correo-con-cuenta-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-correo-con-cuenta-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/recuperar-anterior-sin-cuenta-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/recuperar-anterior-sin-cuenta-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/recuperar-nuevo-con-cuenta-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/recuperar-nuevo-con-cuenta-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/agregar-correo-otra-cuenta-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/agregar-correo-otra-cuenta-movil --vite http://127.0.0.1:5191
```

Las capturas visuales usan las respuestas de prueba del capturador existente para reproducir estados. El E2E real usa front, API, PostgreSQL y pickup reales, sin interceptar peticiones ni simular sesiones.

## A6 · Nombre y apellido separados

Cuenta usa cuatro columnas iguales en escritorio —Nombre, Apellido, Idioma y región, Zona horaria— y los campos verticales en el teléfono. El tablero y los datos visuales de la app muestran Lucía y Fernández. Las demás lecturas conservan el `DisplayName` armado por el backend.

| Estado | 1440 | 390 |
|---|---|---|
| Mi cuenta | [Comparación](cuenta/cuenta-escritorio-1440x900-lado-a-lado.png) | [Comparación](cuenta/cuenta-movil-390x844-lado-a-lado.png) |

Se repitieron también las diez imágenes de A5 y las dos de Agregar correo de otra cuenta (A2). Se conservan los límites de WhatsApp (Etapa 8), exportación (Etapa 10) y la excepción explícita del OTP antiguo que retira A5/ADR0045, sin cambiar el lienzo. Las catorce imágenes se inspeccionaron y enviaron al usuario con sus comandos de vivo.

Evidencia FRONT `.local/pre7/a6/`: `root-capturas-cuenta-a2.*` **4/4**, EXIT 0, 13,021 s; `root-capturas-a5.*` **10/10**, EXIT 0, 30,079 s; `root-capturas-verificar.*` **14/14**, EXIT 0. Los capturadores terminaron antes del E2E real. La galería reúne ahora 32 comparaciones de 16 estados.

E2E real A6 y regresiones A5/idioma: **6/6**, 0 fallos/cancelados/omitidos, EXIT 0, **168,077 s**, FRONT `.local/pre7/a6/real.*`. En ambos tamaños, cuatro combinaciones de nombre y apellido se guardan por sus partes, persisten tras F5 y aparecen como `DisplayName` o el contacto de respaldo en el menú. Las acciones de cuenta y el cambio de idioma siguen pasando con front/API/PostgreSQL/pickup reales. Front dirigido final **34/34** en seis archivos, EXIT 0, 13,70 s; build, lint dirigido y contrato EXIT 0. Backend dirigido **77/77**, unitarios **59/59** y arquitectura **45/45**; build AppHost sin advertencias ni errores. Evidencia y alcance completos en el plan del back.

Implementación BACK `de85e34` (27 rutas propias), FRONT `77a4039` (16), `main`, sin push. Aspire después del recorrido `[]`, EXIT 0 (`aspire-after.*` BACK). La migración e importación de nombres de Google siguen usando la base de A7 (`b3ffa40`), sin una segunda migración.

```powershell
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/cuenta-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/cuenta-movil --vite http://127.0.0.1:5191
```

Desde la raíz del front:

```powershell
node scripts/capturar-relevamiento.mjs --app-url http://127.0.0.1:5191 --pair registro-correo,registro-empresa-correo --out docs/design/capturas/consolidacion/pre7 --tmp .local/pre7/comparaciones
node scripts/capturar-relevamiento.mjs --verify --pair registro-correo,registro-empresa-correo --out docs/design/capturas/consolidacion/pre7
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-correo-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-correo-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-empresa-correo-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-empresa-correo-movil --vite http://127.0.0.1:5191
```
