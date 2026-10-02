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

## Roles y permisos

Las capturas cubren `Roles`, `M-Roles`, `Rol` y `M-Rol`: listado con siete roles, alta sin alcance elegido, edición de Recursos humanos, edición de Solo lectura y consulta de Dueño. Se generaron cinco estados en 1440×900 y sus cinco versiones en 390×844; el detalle por pareja está en `manifest.json` y `roles/`.

Las pantallas copiaron el lienzo v60 y usan respuestas visuales locales sin escribir datos. Los roles de sistema llegan de la API con nombres internos: la interfaz muestra «Dueño» y «Administrador» y sus descripciones aprobadas.

Las diferencias y motivos son:

- El panel Administración de la maqueta muestra también Usuarios, Empresas, Configuración, Página pública, WhatsApp y Auditoría. La app deja visible solo Roles y permisos; las demás rutas pertenecen a etapas posteriores y no se simulan.
- Al crear un rol, la app ofrece «Toda la organización». Las opciones por empresa dependen del catálogo y gestión de Empresas de E6; hasta entonces una persona no puede crear un rol con alcance específico ni elegir una empresa.
- La API entrega el identificador de la empresa, no su nombre. En el listado, los roles de alcance específico muestran «Una empresa específica» en vez de los nombres de ejemplo de la maqueta.
- En teléfono la segunda línea de la banda conserva «Vale en … · De sistema» y puede truncarse por el ancho disponible; el tablero prioriza «De sistema» en su segunda línea. El detalle y los controles siguen accesibles.
- Las casillas de roles de sistema quedan deshabilitadas y toman el tono de la marca con opacidad reducida; la maqueta las dibuja en gris. El contraste expresa el mismo estado de solo lectura.

Las capturas del lienzo son referencias de contenido y disposición; los nombres de empresas dibujados son ilustrativos y no se insertan en la base de desarrollo ni en el catálogo de respuestas del backend.
