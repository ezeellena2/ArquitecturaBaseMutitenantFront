# Muestra visual E5

Estado: propuesta pendiente de elección; no aprueba ni reemplaza el lienzo v71.

Generador: `docs/design/lienzo/generadores/plataforma_etapa5_propuesta.py`. Ejecutarlo desde la raíz del front; salida aislada en `.artifacts/etapa-5-propuesta/`. Servir la raíz con `python -m http.server 61405 --bind 127.0.0.1` y abrir [visor conjunto](http://127.0.0.1:61405/.artifacts/etapa-5-propuesta/index.html).

Se conservan los ocho tableros de escritorio y sus estados interactivos. La propuesta aplica letra 13, campos/botones 36, encabezados arena, estados sin pastilla y dos columnas iguales. Descartar siempre queda disponible. Menú de escritorio y detalle de Auditoría conservan sus aprobaciones anteriores.

Los dieciséis móviles/estados reutilizan el marco app aprobado de Organización: título y contexto, listas de borde a borde, hojas inferiores, creación mediante + y acciones fijas. Se propone navegación Organizaciones, Cuentas, Recuperaciones y Más. Más agrupa Administración y las opciones de perfil. WhatsApp queda fuera. Se muestran además fichas, creación, suspensión, revisión de recuperación, legales, configuración y auditoría.

Verificación de la muestra: Playwright abrió escritorio y móviles, títulos correctos; Organizaciones con 1 fila renderiza 1 y con 50 renderiza 10 con paginación. Capturas de revisión en la salida aislada, sin datos de Development. El generador concurrente `telefonos_1004/app_plat_personal.py` no se modifica ni se incluye en este cambio.

Pendiente: elección conjunta del refinamiento de escritorio y del grupo móvil; comparación exhaustiva de implementación/API real al cierre de E5. Estos tableros son maquetas, no evidencia de la puerta funcional.
