# Comparación Portada y Legal · Etapa 3a

Se compararon Portada, Términos y Privacidad con `Landing`, `Landing-Movil`, `Legal` y `M-Legal` a 1440×900 y 390×844. Los seis pares se generaron con Playwright, con la misma ruta y el mismo tamaño para el lienzo y la aplicación. Las páginas legales muestran la respuesta simulada de las rutas públicas que sirve el backend.

## Diferencias aprobadas

- En la portada no aparecen los dos controles «Registrá tu empresa» (hero y cierre). El alta de empresas nace en E6 y la decisión de producto ordena ocultar todos sus accesos hasta esa etapa. En móvil, la tarjeta de perfiles sube por la ausencia del segundo botón.
- El acceso al directorio se oculta hasta E7, cuando nace su ruta.
- En los documentos, el lienzo usa versiones ilustrativas 3 y 2, fecha 01/09/2026 y un cuerpo vacío. El seed de E3a publica la versión 1 de ambos documentos, vigente desde 29/09/2026, con texto explícito de demostración. La página muestra esos datos de la API, incluido el cuerpo; las capturas simulan esa respuesta sin sustituirla por la maqueta vacía.

El encabezado, el orden del contenido, los controles restantes, los tonos y el pie se contrastaron con los pares PNG de esta carpeta. La variante Legal omite navegación de secciones y «Ayuda», como el tablero.
