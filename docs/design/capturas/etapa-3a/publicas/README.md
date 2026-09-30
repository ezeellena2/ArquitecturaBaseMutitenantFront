# Comparación Portada y Legal · Etapa 3a

Se compararon Portada, Términos y Privacidad con `Landing`, `Landing-Movil`, `Legal` y `M-Legal` a 1440×900 y 390×844. Los seis pares se generaron con Playwright, con la misma ruta y el mismo tamaño para el lienzo y la aplicación. Las páginas legales muestran la respuesta simulada de las rutas públicas que sirve el backend.

## Diferencias aprobadas

- En la portada no aparecen los dos controles «Registrá tu empresa» (hero y cierre). El alta de empresas nace en E6 y la decisión de producto ordena ocultar todos sus accesos hasta esa etapa. En móvil, la tarjeta de perfiles sube por la ausencia del segundo botón.
- El acceso al directorio se oculta hasta E7, cuando nace su ruta.
- En los documentos, el lienzo usa versiones ilustrativas 3 y 2, fecha 01/09/2026 y un cuerpo vacío. El seed de E3a publica la versión 1 de ambos documentos, vigente desde 29/09/2026, con texto explícito de demostración. La página muestra esos datos de la API, incluido el cuerpo; las capturas simulan esa respuesta sin sustituirla por la maqueta vacía.

El encabezado, el orden del contenido, los controles restantes, los tonos y el pie se contrastaron con los pares PNG de esta carpeta. La variante Legal omite navegación de secciones y «Ayuda», como el tablero.

Tras el hallazgo 65, el capturador sirve al lienzo el mismo Inter empaquetado que usa la app. Antes, el enlace externo de Google Fonts del HTML no cargaba en Playwright local y el lienzo se dibujaba con `system-ui`, por lo que los cortes de titulares y párrafos no eran una comparación de la misma fuente. Se regeneraron los seis pares de esta carpeta con Inter local: el párrafo de la portada corta en las mismas palabras. El CTA «Crear mi cuenta» del hero y del cierre mide 40 px visuales como `.b.lg` del tablero; su área tocable se extiende a 44 px en teléfono sin cambiar su aspecto. La posición vertical de la tarjeta móvil todavía difiere por el CTA empresarial oculto hasta E6.
