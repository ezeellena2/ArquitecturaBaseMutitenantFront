# Comparación visual E4 · Criterio v60 y Mi cuenta

Las capturas se generan con `npm run test:capturas:etapa-4` y `node scripts/capturar-etapa-4.mjs --app-url http://127.0.0.1:5173`. La fuente es `docs/design/lienzo/` v60. Se comparan Cuenta, Agregar, Verificar y Baja a 1440×900; a 390×844 se compara la app con el marco móvil aprobado M-Cuenta.

## Diferencias y motivos

- El lienzo de escritorio tiene un diálogo por tablero, pero v60 no trae tableros móviles separados para esos diálogos. En teléfono el par muestra M-Cuenta como referencia del marco y el diálogo real abierto; no se presenta esa referencia como equivalencia de estado.
- Radix posiciona los diálogos de teléfono como panel inferior y desenfoca el fondo. Los tableros usan un oscurecimiento sólido; se conserva el comportamiento responsivo del componente compartido.
- Agregar un correo pide reautenticación antes de mostrar el formulario y Verificar abre el código directamente. El tablero no dibuja esa prueba previa; se conserva porque la API la exige para proteger cambios de acceso.
- Los correos y códigos de la app aparecen vacíos para que la captura no precargue datos personales ni códigos de autenticación. Los valores visibles en los tableros son datos ilustrativos.
- La pantalla de cuenta muestra correo y Google. WhatsApp y la gestión de métodos `Phone` se incorporan en E8; `Phone` nació como modelo y todavía no tiene canal para agregarse/verificarse. La opción del tablero no se habilita antes de que exista el flujo real.
- El botón «Exportar mis datos» del tablero no aparece en la app: la exportación y su API están planificadas para E10.
- M-Cuenta no incluye el bloque Privacidad que sí tiene Cuenta. La app conserva la baja disponible en teléfono para no ocultar un flujo real; el lienzo v60 no define su presentación móvil.
- El tablero Cuenta muestra el botón «Dar de baja» delineado; la app quedó alineada al borde rojo sin relleno. Dentro del diálogo se usa «Dar de baja» y el botón rojo lleno. Se oculta ✕ en la confirmación porque el Criterio de diálogos prevalece sobre la ✕ del tablero Cuenta-Baja para una acción irreversible.
- El marco de la app mantiene sus controles de navegación y usuario, que no aparecen idénticos en cada tablero Perfil personal; se verifican contra Criterio-Marco y no se alteran en una captura de contenido.

Las diferencias de alcance de WhatsApp y exportación ya tienen etapa asignada en el plan maestro; no agregan otra deuda al backlog.
