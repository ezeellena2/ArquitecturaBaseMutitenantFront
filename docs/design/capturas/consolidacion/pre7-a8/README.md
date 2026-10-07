# A8 · Ingreso con sesiones antiguas

Fuente: lienzo v112 (`9c1c782`), aprobado. Tablero a la izquierda y app a la derecha, a 1440 × 900 y 390 × 844.

El formulario de cada puerta y el error de sesión conservan su diseño. A8 cambia el recorrido: descarta la cookie pública antigua del operador, conserva Plataforma y pide otro ingreso mediante `prompt=login` desde el callback genérico.

| Pantalla | 1440 | 390 |
|---|---|---|
| Persona | [Comparación](ingreso/ingreso-persona-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-persona-correo-movil-390x844-lado-a-lado.png) |
| Empresa | [Comparación](ingreso/ingreso-empresa-correo-escritorio-1440x900-lado-a-lado.png) | [Comparación](ingreso/ingreso-empresa-correo-movil-390x844-lado-a-lado.png) |
| Sesión: error | [Comparación](sesion/sesion-error-escritorio-1440x900-lado-a-lado.png) | [Comparación](sesion/sesion-error-movil-390x844-lado-a-lado.png) |

La selección de WhatsApp sigue pendiente de la Etapa 8, como documenta el cierre de consolidación. La app muestra los canales que ofrece la API. La barra de estado y el indicador inferior del tablero móvil pertenecen al teléfono.

Vista en vivo, desde el front: `node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7-a8/ingreso-persona-correo-escritorio --vite http://127.0.0.1:5191`. Para el teléfono: `ingreso-persona-correo-movil`; para Empresa: `ingreso-empresa-correo-escritorio` o `ingreso-empresa-correo-movil`; para Sesión: `sesion-error-escritorio` o `sesion-error-movil`.
