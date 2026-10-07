# Comparación visual · Etapa 7

**Estado: 21 comparaciones capturadas, 63 PNG verificadas y 21/21 revisadas visualmente el 2026-10-07.**
La galería está disponible para la revisión del usuario. La revisión principal y una segunda lectura de las PNG
confirmaron los estados completos, sin cortes de contenido ni controles fuera del ancho.

La referencia es el lienzo vigente **v113 (2026-10-07)**. La galería `galeria.html` se genera con las imágenes reales:
tablero a la izquierda y app a la derecha, más enlaces a cada imagen individual. El manifiesto declara 16 casos
base, compatibles con el validador de Etapa 3a, y cinco `supplementalCases` que abren los menús reales del teléfono.
La corrida completa produce **21 comparaciones y 63 PNG**.

| Pantalla | Estados | Escritorio 1440 × 900 | Teléfono 390 × 844 |
|---|---|---|---|
| Landing / Landing-Movil | Con empresas; Sin empresas | 2 páginas completas | 2 páginas completas + 2 menús abiertos |
| Directorio / M-Directorio | Con empresas; Sin resultados; Todavía no hay empresas | 3 capturas | 3 capturas + 3 menús abiertos |
| Pagina-Publica / M-Pagina-Publica | Publicada, sin sesión; Publicada, con sesión; No disponible | 3 capturas, con menú abierto en la sesión | 3 capturas, con hoja abierta en la sesión |

Los tamaños indicados son los viewports. Solo Landing se captura con `fullPage`: sus estados de empresas quedan
debajo del primer pliegue. Sus PNG conservan el ancho aprobado y la altura completa del contenido. Los suplementos
de menú abierto se capturan al inicio de la página, con altura 844. No se estiran los tableros ni se modifican sus fuentes.

Los datos son los aprobados: Grupo Delta, Omega S.A. y Sigma S.R.L.; la página de Delta incluye dirección,
teléfono, correo y sitio web. El directorio trae tres resultados y el total real tres, tal como calcula el tablero.
Sin resultados conserva la búsqueda `Zeta`. Beto Ramírez usa el contrato vigente `/api/me` con nombre y apellido,
preferencias personales, un espacio Personal, permisos vacíos y sin organizaciones empresariales. El menú se monta
con los componentes reales de perfiles; no toma su identidad del subdominio.

La app se abre en `http://localtest.me:5192` y `http://delta.localtest.me:5192`, coherentes con
`VITE_AUTH_ISSUER=http://localtest.me:5192`. El lienzo muestra `delta.plataforma.com`, `omega.plataforma.com` y
`sigma.plataforma.com`; las tarjetas de la captura muestran los hosts locales con puerto que calcula la app.
Esta diferencia de entorno se conserva y se informa: no se simula otro host ni se altera el producto para ocultarla.

Los mocks de API y sesión se limitan al arnés de captura `src/test/etapa7VisualApp.html` y a sus contextos de Playwright.
La comparación no prueba autenticación, aislamiento, navegación de regreso ni persistencia. El E2E real de la etapa
se ejecuta por separado contra front, API y base reales, sin reutilizar esos mocks.

## Ejecución final por root

Desde FRONT, con las dependencias ya instaladas y T10–T15 integrados:

```powershell
$env:VITE_AUTH_ISSUER = 'http://localtest.me:5192'
npm run dev -- --host localtest.me --port 5192
```

En otra terminal:

```powershell
node scripts/capturar-etapa-7.mjs --app-url http://localtest.me:5192
node scripts/capturar-etapa-7.mjs --verify
```

Es un servidor Vite **dev**, como el usado por Etapa 6: el build normal no incluye las entradas `/src/test`.
No se agregan entradas de captura al build del producto. `localhost:5192` no sirve para esta captura porque T10
lo clasifica como host desconocido con el issuer elegido. El script puede filtrar `--group`, `--pair` o `--id`
para repetir un caso; `--verify` siempre exige el catálogo completo, incluidos los cinco menús móviles.

`node scripts/generar-galeria-etapa-7.mjs` reconstruye la galería sin navegador a partir de las PNG disponibles.
La galería identifica expresamente los casos que todavía no tengan sus tres imágenes.

## Hallazgos de la ejecución final

`--verify` terminó con EXIT 0: «21 casos completos: 63 PNG y galería». Se revisaron también los cinco menús
móviles, los vacíos y la Landing completa hasta el pie. Las capturas nuevas de No disponible confirman el borde
corregido; se conservaron las piezas comunes y se documentan estas diferencias para el usuario.

| Caso | Hallazgo | Acción / resultado |
|---|---|---|
| Todos | Hosts `*.localtest.me:5192` frente a `*.plataforma.com` | Diferencia del entorno; las URLs se calculan desde el issuer real |
| Landing / Directorio, Con empresas | Sigma S.R.L. sin logo genera «SS»; el tablero muestra «SI» | Se conserva el helper canónico y el nombre aprobado. «SI» requeriría un logo específico; no se altera el dato para la captura |
| Landing, Con empresas / Sin empresas, ambos tamaños | Las acciones de las tarjetas existentes son botones delineados; en móvil quedan juntos, mientras el tablero los apila con un ingreso como enlace. «Probalo hoy» usa botones de ancho natural | Se conserva la composición heredada de la Landing y las piezas comunes. Todas las acciones y textos están presentes; diferencia visual pendiente de aceptación |
| Landing, ambos tamaños | Cambian alturas de botones/tarjetas, sombras, ritmo vertical y el degradado del panel final | Diferencias heredadas de estilos comunes; página completa y pie sin cortes |
| Directorio, Sin resultados, móvil y menú abierto | El mensaje de 16 px ocupa dos líneas y «Limpiar búsqueda» mide 44 px; el tablero lo muestra más chico | Se conservan la legibilidad y el tamaño táctil de la app; búsqueda y botón completos |
| Página publicada con sesión, escritorio | Al abrir con teclado, Personal recibe el fondo arena de foco en vez del petróleo del perfil marcado | Se conserva el foco del menú común. La tilde y los datos siguen presentes; en móvil el perfil marcado queda petróleo |
| Página publicada, móvil | Espaciados y altura de la hoja difieren ligeramente del tablero | Piezas comunes de contacto y menú; todos los datos y acciones completos |
| No disponible, ambos tamaños | El enlace no tenía borde por clases de borde en conflicto | Corregido con `Button asChild`, pruebas focales en verde y ambas PNG repetidas y revisadas |
