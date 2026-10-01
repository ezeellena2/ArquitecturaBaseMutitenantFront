# Etapa 3b · Comparación de La cuenta

## Correcciones verificadas

- Los botones de confirmación de los diálogos siguen el lienzo: permiten confirmar con un código incompleto y muestran «Escribí los 6 números del código.». La validación local evita enviar un código incompleto. Baja muestra además el error de motivo. Tres tests existentes fallaron antes del cambio; los cuatro casos dirigidos pasaron después.
- El reintento de un 429 requiere pulsar el mismo botón después de la cuenta regresiva. No hay reenvío automático ni control agregado.
- Durante la cancelación de baja, «Salir» y «Cancelar la baja y entrar» quedan deshabilitados, como Ingreso. El test funcional falló antes y pasó después.

## Método y cobertura

122 pares app/lienzo: 244 PNG, 14 HTML de correo y 10 hojas de revisión. Capturas a 1440×900 y 390×844 con Playwright, Inter local, componentes reales de la SPA y el renderer original de cada tablero. Los OTP se ocultan solo en la imagen. El estado del prototipo se fija en memoria, sin modificar sus archivos. La corrección de `__dcUpdate` repone props/estado inicial para que Ingreso muestre efectivamente la baja pedida al capturar cancelación y aviso.

| Grupo | Pares | Cobertura |
|---|---:|---|
| Cuenta / M-Cuenta | 70 | Personal/solo empresa, limpio/sucio/guardar/descartar, idiomas y zonas, menú identidad/lateral/filas, principal/administrado/verificado/pendiente/Google, agregar/validar/verificar, reautenticación previa a agregar correo y vincular Google, principal/quitar/desvincular, avisos y baja con validaciones/operador/sesión cerrada |
| Aceptar-Terminos / M-Aceptar-Terminos | 12 | Ambos documentos, solo términos o privacidad, casilla sin/con marcar |
| Ingreso / M-Ingreso | 10 | Baja por Persona/Empresa, cancelando y aviso antes de seguir el retorno |
| Inicio-Personal / M-Inicio-Personal | 2 | Aviso de método propio |
| Mensajes | 28 | Siete plantillas de correo, es-AR/en-US, escritorio/móvil |

Los datos Lucía/Grupo Delta son fixtures del arnés visual en memoria. El HTML de correo se compone por `AccountEmailCaptures` con `IEmailTemplateRenderer`, catálogo JSON y `DisplayFormatter`, sin base ni envío. El E2E real es independiente: PostgreSQL y pickup propios, sin interceptar peticiones. Pasó 8/8: los cinco recorridos originales de 3b, la toma de cuenta por alta desde sesión abierta bloqueada, la recuperación de un correo pendiente ajeno y el proceso padre.

Reproducir: levantar Vite (`npm run dev -- --host 127.0.0.1 --port 5175`), componer HTML desde el back con `dotnet run --project tools/ArquitecturaBaseMultitenant.RealE2ESetup/ArquitecturaBaseMultitenant.RealE2ESetup.csproj -- --capture-emails <ruta absoluta a correos/html>`, ejecutar `node scripts/capturar-etapa-3b.mjs --app-url http://127.0.0.1:5175` y `node scripts/capturar-etapa-3b.mjs --verify`. El script abre el arnés existente `src/test/visualApp.html` por los parámetros de su manifest. El verificador informa `122 pares visuales 3b completos.`

## Cambios después de comparar

Se copiaron lateral «Mi cuenta», banda móvil, tabla y tarjetas, tokens `ok`/`ok-t`, bordes y tamaños de OTP, padding de diálogos, pies con Cancelar/confirmación en el orden del lienzo, errores en línea, enlaces/casilla de legales e icono de baja pendiente. Los ejemplos de idioma usan el patrón del catálogo y el formateador compartido; no cambian la preferencia al abrir la lista. Los avisos móviles quedan arriba de Guardar/Descartar. La captura espera que termine la animación del toast.

Los 118 pares previos se inspeccionaron en las diez hojas y en ampliaciones de Cuenta, selectores, diálogos, legales, Ingreso y correos. Los cuatro pares nuevos se revisaron individualmente en ambas resoluciones. No se cambiaron tableros ni se añadieron campos, rutas o acciones de producto.

### Reautenticación previa a sumar métodos

Se agregaron cuatro comparaciones: agregar correo y vincular Google, ambas en escritorio y móvil. Las capturas nuevas están en `cuenta/*-reauth-*`. La app usa el diálogo existente de cambio de método; antes de mostrar el formulario de correo o iniciar Google, pide el código enviado a un método verificado antes de la sesión. El lienzo no dibuja esta barrera para las altas, así que se compara con su estado existente de confirmación por código. Coinciden la estructura del diálogo, las seis casillas OTP, orden de acciones y tokens; cambian el título, la explicación y la etiqueta del botón para nombrar la acción correcta.

## Diferencias y motivo

| Diferencia | Motivo |
|---|---|
| WhatsApp no aparece como método ni opción | Ocultación pedida: nace en E8. El texto aprobado del aviso y «Agregar correo o teléfono» se mantienen |
| Exportar y su sugerencia en el diálogo de baja están ocultos | Ocultación pedida: E10; reduce la altura de tarjeta/diálogo respecto del prototipo |
| No se implementa bloqueo del único Dueño | Exclusión pedida: E4; operador sí tiene la política de baja de 3b |
| «Inglés (Estados Unidos)» en la lista española, y zonas habilitadas del catálogo | La API entrega los nombres traducidos y opciones habilitadas; el tablero tiene «English (United States)» y un listado de ejemplo. Se evita duplicar datos de referencia en UI |
| Fechas, versiones, destinatarios enmascarados y métodos disponibles | Son datos del contrato y `DisplayFormatter`; en las capturas se fijan datos del tablero cuando existe el caso. En cuentas reales cambian según su contexto |
| Error de operador sin OTP | La política del servidor rechaza pedir esa prueba. El tablero no trae variante de operador: se compara su diálogo con el texto resource del error, sin inventar otra pantalla |
| Correo «método agregado» describe correo; tablero ilustra WhatsApp | Variante de correo de 3b; WhatsApp queda para E8. Mensajes tiene solo tablero español y escritorio; inglés y ancho móvil se verifican con HTML real traducido y responsive |
| Agregar correo y vincular Google muestran primero una reautenticación por código | El lienzo no dibuja esta barrera de seguridad para las altas. Se compara con su diálogo existente de confirmación por código (cambiar principal); la app reusa el diálogo de reautenticación, con título y acción correspondientes al método elegido. No se agregan campos, controles ni estados de producto al tablero |
| Foco visible, iconografía de controles compartidos, interlineado y alineaciones menores de menús/toasts | Radix y Sonner mantienen teclado, foco y posicionamiento con colisiones; no se afirma identidad de píxeles. No cambian textos, orden de acciones ni estados; quedan documentadas con su motivo |

Las ocultaciones están autorizadas por el alcance. Las diferencias residuales están listadas con su motivo y no cambian estructura, texto aprobado, orden ni comportamiento de los estados del lienzo.
