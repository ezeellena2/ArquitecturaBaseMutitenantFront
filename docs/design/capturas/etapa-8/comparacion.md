# Comparación visual · E8 Front

Referencia: **v115 (`bb7c78de`)**, tableros vigentes Ingreso, Registro, Registro-Empresa, Enlace, Recuperar, Cuenta, Cuenta-Agregar, Cuenta-Verificar, Cuenta-Metodo y sus M-*. Mensajes se usa como fuente de textos/estados; su bandeja y la atención E11 quedan fuera de Parte 2b.

La [galería](index.html) presenta cada tablero a la izquierda y la app a la derecha, en escritorio **1440 × 900** y teléfono **390 × 844**. El [manifiesto](manifest.json) declara las capacidades, respuestas tipadas y acciones usadas. Las rutas/componentes son los del producto, con sesión y API simuladas exclusivamente para esta comparación. Esta evidencia no reemplaza el E2E ni WhatsApp/Meta reales de Integración.

## Diferencias de conducta autorizadas

- **ADR 0043, también Phone:** número anterior inexistente y número nuevo ocupado se explican bajo campo antes de emitir código. El registro ocupado ofrece Ingresar. No se reproducen éxito ficticio ni avisos al titular «ya es de una cuenta» de Tweaks/ejemplos históricos.
- **ADR 0045:** Principal y Quitar confirman con la sesión. Sólo agregar/verificar un método nuevo pide OTP de posesión. El Tweak antiguo con código para quitar correo se considera sustituido; el lienzo no se modifica.
- **ADR 0049:** el enlace del bot entra como persona después de Continuar, con OIDC nuevo. Su href antiguo a Inicio-Org no define el destino. Los operadores reciben la respuesta neutra del bot en el back; no se implementa TOTP en el front.
- **Capacidad apagada:** se ocultan selector/opción/fila WhatsApp y Volver a WhatsApp sin número público. Algunos tableros sólo tienen el estado activo; en esas comparaciones la ausencia es deliberada por capacidad, no una edición del lienzo.
- **Países disponibles:** el fixture de capacidades habilita Argentina. La lista ofrece ese país, aunque el ejemplo del tablero muestre otros; se cruza con reference-data y no se amplía desde el lienzo. Los tests verifican también diez y once opciones.
- **Datos de código:** los errores compartidos dibujados con correo se reutilizan para Phone con el destino correspondiente. El teléfono se oculta como `•••• 4521`, igual a `PersonalDataMask.Phone`, aunque el ejemplo antiguo conserve parte de la característica. Los dígitos ficticios y el segundo exacto del contador no se comparan.
- **Alta empresarial Phone sin correo:** el aviso de aprobación omite el destinatario cuando `notificationEmail` es null. Conserva el estado y no inventa un correo ni lo exige.
- **Navegación de Mi cuenta:** el lienzo puede mostrar Mensajes en su marco; la app conserva la navegación existente porque la bandeja personal y atención corresponden a E11. No se agregan rutas vacías para igualar ese marco.
- **Acciones de métodos:** se respetan `canRemove`/`canMakePrimary` de cada respuesta, incluso cuando el ejemplo del lienzo presenta otros menús. El caso de quitar correo declara Google sin acciones para distinguir ambos métodos ficticios con el mismo correo. Las capacidades y permisos del fixture también gobiernan las acciones existentes de privacidad.

## Reproducción

Desde el repositorio front, con las dependencias ya presentes:

```powershell
$env:VITE_AUTH_ISSUER = 'http://localtest.me:5192'
$env:MT_E2E_ISOLATED = '1'
npm run dev -- --host 127.0.0.1 --port 5192
```

En otra terminal:

```powershell
node scripts/capturar-etapa-8.mjs --app-url http://localtest.me:5192
node scripts/capturar-etapa-8.mjs --verify
```

El arnés usa Chrome instalado (`--browser-path` permite indicar otro binario disponible), sin instalar paquetes. `--group`/`--id` limitan una repetición; `--verify` exige el catálogo completo. `node scripts/generar-galeria-etapa-8.mjs` reconstruye el índice a partir de las PNG existentes y marca los casos pendientes.

Chrome habilita las APIs de contexto seguro únicamente para el origen HTTP local de captura, necesario para `crypto.randomUUID`. En este sandbox, Vite y Chrome requieren la misma ejecución fuera de la restricción de red. La configuración no se incorpora al producto.

## Revisión final

Catálogo completo: **100/100 casos**, **300 PNG** (lienzo, app y comparación por caso). `node scripts/capturar-etapa-8.mjs --verify` terminó con código 0 y verificó los pares, tamaños y comparaciones; el índice muestra 100/100.

Se inspeccionaron 13 pares representativos: ingreso Phone y código (persona/empresa), registro ocupado, aprobación empresarial sin correo, enlace previo, recuperación ocupada y recibida, Cuenta y los diálogos de alta, código y principal. La revisión detectó y corrigió el teléfono completo del paso público de código y el avatar/alineación del aviso del enlace. No se detectó contenido crítico fuera de pantalla en esos pares. El desplazamiento vertical, los marcos móviles sin barra del sistema, las máscaras normalizadas y las diferencias de datos/capacidad están explicitados arriba; no se afirma identidad de píxeles ni revisión manual de los 100 pares.

E8 sigue abierta para T13–T14: revisión integral, E2E y recorrido real de Integración.
