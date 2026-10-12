# ArquitecturaBaseMutitenantFront: reglas para agentes

SPA del multitenant. La arquitectura canónica está en [`docs/architecture/frontend.md`](docs/architecture/frontend.md). La fuente de las pantallas es el [lienzo versionado](docs/design/lienzo/README.md) (tableros `.dc.html`; su README dice la versión vigente; se programa solo lo validado), junto con la sección [«UI y pantallas» de `frontend.md`](docs/architecture/frontend.md#ui-y-pantallas) y el [tema](docs/architecture/tema.md). El tablero manda sobre descripciones de forma; las ADR y decisiones posteriores del usuario mandan sobre conducta, como indica el complemento E8/E8b. Estos reemplazan los colores, la marca azul, los tokens `--color-*`, la banda de título y el menú de `../ArquitecturaBaseFront/docs/design/visual-baseline.md`, que no se copian. El backend y el plan de desarrollo están en `../ArquitecturaBaseMutitenant/docs/`.

## Antes de escribir código: el arnés

**No inventes componentes, formatos, hooks ni textos que ya existen.** Para cada tema hay una ficha en [`docs/rules/`](docs/rules/README.md), y cada carpeta tiene un `AGENTS.md` corto que dice qué va ahí. Cómo funciona: [`docs/architecture/arnes.md`](docs/architecture/arnes.md).

| Si vas a… | Leé |
|---|---|
| mostrar una fecha, número, monto, % o vacío | [formatos](docs/rules/formatos.md) |
| elegir una moneda, país, zona, cultura o tipo fiscal | [datos de referencia](../ArquitecturaBaseMutitenant/docs/rules/datos-de-referencia.md), [datos-y-api](docs/rules/datos-y-api.md) y [formularios](docs/rules/formularios.md) |
| hacer un listado | [paginado-y-listados](docs/rules/paginado-y-listados.md) |
| pedir o mostrar un teléfono | [telefonos](docs/rules/telefonos.md) |
| pedir un correo, un CUIT o DNI; evitar duplicados; manejar ediciones simultáneas | [formularios](docs/rules/formularios.md), [datos-y-api](docs/rules/datos-y-api.md) |
| mostrar algo solo si la organización tiene el módulo | [accesos-y-permisos](docs/rules/accesos-y-permisos.md) |
| que se use con teclado y lector de pantalla | [accesibilidad](docs/rules/accesibilidad.md) |
| que funcione en el teléfono | [responsive](docs/rules/responsive.md) |
| llamar a la API o tipar un dato | [datos-y-api](docs/rules/datos-y-api.md) |
| manejar un error | [errores](docs/rules/errores.md) |
| hacer un formulario o diálogo | [formularios](docs/rules/formularios.md) |
| escribir un texto | [textos-y-traducciones](docs/rules/textos-y-traducciones.md) |
| decidir en qué acceso va una pantalla, u ocultar algo por permiso | [accesos-y-permisos](docs/rules/accesos-y-permisos.md) |
| armar una pantalla | [pantallas-y-ui](docs/rules/pantallas-y-ui.md), el [tema](docs/architecture/tema.md) y el [lienzo versionado](docs/design/lienzo/README.md): copiar el tablero aprobado |
| crear una feature | [estructura-y-features](docs/rules/estructura-y-features.md) |
| sumar un módulo B2C o una interacción persona/empresa | [personal](docs/rules/personal.md) y la [receta funcional del back](../ArquitecturaBaseMutitenant/docs/features/personal.md) |
| escribir tests | [tests](docs/rules/tests.md) |

Si una regla no está escrita: **copiá cómo lo resuelve ArquitecturaBase** (`../ArquitecturaBase`, `../ArquitecturaBaseFront`); si tampoco está ahí, **decidí vos lo más simple y coherente con estos docs, anotalo en una línea del plan de la etapa y seguí**. `../ArquitecturaBaseFront` es solo un respaldo para lo que no está escrito acá: su forma de trabajo (dibujar y esperar una elección por pantalla) no rige. Frená y preguntá **solo** si la decisión cambia el producto (qué ve o puede hacer un usuario, una pantalla del lienzo, el modelo de accesos) o contradice una regla escrita. Una duda técnica menor nunca frena una etapa.

## Forma de trabajo
- Commits chicos, en español, con conventional commits. Cada cambio coherente se commitea con los tests de su carpeta (`npx vitest run <carpeta>`) y `npm run lint` en verde. `npx tsc -b` se corre al terminar la tarea.
- Desde E7, **modo rápido** (pedido del usuario, 2026-10-07): programar directo lo aprobado, tests donde importan, sin visto bueno por pantalla ni capturas por avance. Una pantalla nueva sin tablero se dibuja antes. Si a un tablero vigente le falta un estado, se le pide a Diseño y se sigue con el resto. No se reabre una decisión ya autorizada. **Una sola puerta final:** suites completas, E2E real, documentación en 0, galería lado a lado y recorrido de usuario. Desde E8, contrato primero y back/front en paralelo según [la guía del back](../ArquitecturaBaseMutitenant/docs/guides/etapa-en-paralelo.md). Ver [complemento E8/E8b](docs/design/alineamiento-etapas-8-y-8b.md).
- **Velocidad y cierre liviano** (pedido explícito del usuario, 2026-10-11, igual que en el [AGENTS.md del back](../ArquitecturaBaseMutitenant/AGENTS.md)). Las etapas que quedan (11, 9 y 10) tienen que salir mucho más rápido que la 8 y la 8b. **El trabajo es programar.**
  - **Cada verificación pasa completa una sola vez por etapa.** Build, lint, tests, contrato, E2E y recorrido tienen que dar, cada uno, una corrida completa en verde. Después de un arreglo se corre solo lo que ese arreglo toca. No se repite todo al final ni se arma un corte nuevo por cada arreglo.
  - **Sin actas.** El estado de un plan es una tabla, y la documentación se toca cuando cambia una regla, un contrato o una decisión.
  - **Lo técnico lo decide quien programa, y lo avisa después.** Al usuario se le pregunta solo lo de producto.
  - **Lo que no se hace** (en la puerta de la 8 hubo 177 corridas y 558 archivos de evidencia):
    - revisiones independientes por tarea o por arreglo, como subagentes revisores de especificación o de calidad: hay una sola revisión de código, al cerrar la etapa;
    - repetir un test que ya pasó, ni corridas «de estabilidad»: un test que se pasó de tiempo se corre solo una vez más, aislado;
    - guardar evidencia (recibos, hashes, logs de diagnóstico): las salidas quedan en `.local/` y en el plan va solo la tabla final;
    - recapturar pantallas de etapas anteriores: la galería es solo de las pantallas nuevas o cambiadas en la etapa;
    - worktrees o etiquetas fuera de la puerta.
- Tests focales donde importan: lógica, permisos, privacidad, carreras y recorridos, sin rojo ceremonial por cada estado visual. Al cerrar una etapa, se corren una vez `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check`, completos y limpios. El CI corre los mismos, pero todavía no compara los contratos: descarga un solo repo y salta `contracts:check`. El chequeo cruzado llega con la Etapa 10 (ADR 0016).

## Reglas
1. TS estricto: sin `any` ni `@ts-ignore`; `import type`.
2. Los tipos de la API salen de `src/shared/api/generated/schema.d.ts`, que se regenera con `npm run contracts` y no se edita a mano. Los alias escritos a mano van en `src/shared/api/types.ts`.
3. Datos solo con TanStack Query y `httpClient`. Nada de `useEffect` con fetch.
4. Los errores se deciden por `code`, nunca por el texto.
5. Todo texto de interfaz sale de i18n, en los idiomas habilitados; los nombres de datos de referencia vienen traducidos de la API. "Tenant" nunca en pantalla: se dice "Organización".
6. **Todo dato se muestra con `shared/ui/format` y se carga con `shared/ui/fields`**, según [`docs/architecture/formatos.md`](docs/architecture/formatos.md): fechas, números, moneda, porcentajes, teléfonos y vacíos, iguales en todas las pantallas. Monedas, países, zonas, culturas, tipos fiscales y sus patrones salen de `shared/referenceData` (`GET /api/reference-data`), sin arrays fijos en código. Nada de `toLocaleString`, `toLocaleDateString`, `toFixed`, `Intl.` ni `new Date(` fuera de `shared/format` y `shared/time`, según formatos.md §4. El front no calcula dinero.
7. Tokens solo en memoria. En localStorage va lo mínimo, con el prefijo `arquitecturabasemt.`.
8. Las áreas de `src/areas/` son `public` (ingresos, registros, portada y directorio), `storefront` (la feature `site` de la página pública de una organización en su subdominio; una por organización, no por empresa), `personal` (acceso B2C), `business` (acceso B2B) y `platform` (backoffice). Una feature no importa de otra, ni un área de otra: lo común sube a `shared/`. Al cambiar de acceso u organización se hace `queryClient.clear()`. Una persona (B2C) nunca ve "crear empresa".
9. Los permisos del front son solo experiencia de uso: decide el backend.
10. Pantallas: ficha a ancho completo; una pestaña por grupo de datos, aunque tenga una sola fila, y sin barra de pestañas si hay un solo grupo; lo corto en diálogo y lo largo en pantalla propia; nunca diálogo sobre diálogo; sin textos que nadie pidió.
