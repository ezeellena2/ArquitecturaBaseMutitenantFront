# ArquitecturaBaseMutitenantFront: reglas para agentes

SPA del multitenant. La arquitectura canónica está en [`docs/architecture/frontend.md`](docs/architecture/frontend.md). Las convenciones de código se heredan de `../ArquitecturaBaseFront` (su `CLAUDE.md`). La fuente de las pantallas es el [lienzo versionado](docs/design/lienzo/README.md) (versión 60; 109 tableros `.dc.html`; se programa solo lo validado), junto con la sección [«UI y pantallas» de `frontend.md`](docs/architecture/frontend.md#ui-y-pantallas) y el [tema](docs/architecture/tema.md). El tablero manda sobre cualquier descripción textual. Estos reemplazan los colores, la marca azul, los tokens `--color-*`, la banda de título y el menú de `../ArquitecturaBaseFront/docs/design/visual-baseline.md`, que no se copian. El backend y el plan de desarrollo están en `../ArquitecturaBaseMutitenant/docs/`.

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
| escribir tests | [tests](docs/rules/tests.md) |

Si una regla no está escrita: **copiá cómo lo resuelve ArquitecturaBase** (`../ArquitecturaBase`, `../ArquitecturaBaseFront`); si tampoco está ahí, **decidí vos lo más simple y coherente con estos docs, anotalo en la sección «Decisiones tomadas» del informe de la etapa y seguí**. Frená y preguntá **solo** si la decisión cambia el producto (qué ve o puede hacer un usuario, una pantalla del lienzo, el modelo de accesos) o contradice una regla escrita. Una duda técnica menor nunca frena una etapa.

## Forma de trabajo
- Commits chicos, en español, con conventional commits. Cada cambio coherente se commitea con sus tests focales y las verificaciones de build y lint del alcance afectado en verde.
- **Toda pantalla nueva se dibuja primero** en el [lienzo versionado](docs/design/lienzo/README.md), con las piezas de "Gestión de usuarios" y los textos del contrato real. Se programa después de que el usuario la elige.
- Donde hay lógica, escribir primero un test focal que falle y hacerlo pasar. Al cerrar una etapa y en CI, ejecutar `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check` completos y limpios.

## Reglas
1. TS estricto: sin `any` ni `@ts-ignore`; `import type`.
2. Los tipos de la API salen de `src/shared/api/generated/schema.d.ts`, que se regenera con `npm run contracts` y no se edita a mano. Los alias escritos a mano van en `src/shared/api/types.ts`.
3. Datos solo con TanStack Query y `httpClient`. Nada de `useEffect` con fetch.
4. Los errores se deciden por `code`, nunca por el texto.
5. Todo texto de interfaz sale de i18n, en los idiomas habilitados; los nombres de datos de referencia vienen traducidos de la API. "Tenant" nunca en pantalla: se dice "Organización".
6. **Todo dato se muestra con `shared/ui/format` y se carga con `shared/ui/fields`**, según [`docs/architecture/formatos.md`](docs/architecture/formatos.md): fechas, números, moneda, porcentajes, teléfonos y vacíos, iguales en todas las pantallas. Monedas, países, zonas, culturas, tipos fiscales y sus patrones salen de `shared/referenceData` (`GET /api/reference-data`), sin arrays fijos en código. Nada de `toLocaleString`, `toLocaleDateString`, `toFixed`, `Intl.` ni `new Date(` fuera de `shared/format` y `shared/time`, según formatos.md §4. El front no calcula dinero.
7. Tokens solo en memoria. En localStorage va lo mínimo, con el prefijo `arquitecturabasemt.`.
8. Las áreas de `src/areas/` son `public` (ingresos, registros y portada), `storefront` (la página pública de la organización, una por organización y no por empresa, en su subdominio `<slug>.plataforma.com`), `personal` (acceso B2C), `business` (acceso B2B) y `platform`. Una feature no importa de otra, ni un área de otra: lo común sube a `shared/`. Al cambiar de acceso u organización se hace `queryClient.clear()`. Una persona (B2C) nunca ve "crear empresa".
9. Los permisos del front son solo experiencia de uso: decide el backend.
10. Pantallas: ficha a ancho completo; pestañas solo con dos o más tablas; lo corto en diálogo y lo largo en pantalla propia; nunca diálogo sobre diálogo; sin textos que nadie pidió.
