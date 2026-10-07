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

La referencia v112 se conserva completa: `Cuenta-Baja` y `Cuenta-Metodo` todavía dibujan el OTP que la ADR 0045 ordena retirar. La fila de Nombre/Apellido del fondo se implementa en A6 y estas comparaciones se repiten al cerrarlo. La exportación pertenece a E10, según la ficha `identidad.md` del back.

Las capturas visuales usan las respuestas de prueba del capturador existente para reproducir estados. El E2E real usa front, API, PostgreSQL y pickup reales, sin interceptar peticiones ni simular sesiones.

Desde la raíz del front:

```powershell
node scripts/capturar-relevamiento.mjs --app-url http://127.0.0.1:5191 --pair registro-correo,registro-empresa-correo --out docs/design/capturas/consolidacion/pre7 --tmp .local/pre7/comparaciones
node scripts/capturar-relevamiento.mjs --verify --pair registro-correo,registro-empresa-correo --out docs/design/capturas/consolidacion/pre7
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-correo-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-correo-movil --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-empresa-correo-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7/registro-empresa-correo-movil --vite http://127.0.0.1:5191
```
