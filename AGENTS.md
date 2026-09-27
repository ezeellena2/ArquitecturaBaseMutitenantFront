# ArquitecturaBaseMutitenantFront: reglas para agentes

SPA del multitenant. La arquitectura canónica está en [`docs/architecture/frontend.md`](docs/architecture/frontend.md). Las convenciones visuales y de código se heredan de `../ArquitecturaBaseFront` (`CLAUDE.md` y `docs/design/visual-baseline.md`). El backend y el plan de desarrollo están en `../ArquitecturaBaseMutitenant/docs/`.

## Antes de escribir código: el arnés

**No inventes componentes, formatos, hooks ni textos que ya existen.** Para cada tema hay una ficha en [`docs/rules/`](docs/rules/README.md), y cada carpeta tiene un `AGENTS.md` corto que dice qué va ahí. Cómo funciona: [`docs/architecture/arnes.md`](docs/architecture/arnes.md).

| Si vas a… | Leé |
|---|---|
| mostrar una fecha, número, monto, % o vacío | [formatos](docs/rules/formatos.md) |
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
| armar una pantalla | [pantallas-y-ui](docs/rules/pantallas-y-ui.md) (y dibujarla primero) |
| crear una feature | [estructura-y-features](docs/rules/estructura-y-features.md) |
| escribir tests | [tests](docs/rules/tests.md) |

Si una regla no está escrita, **preguntá antes de inventar**.

## Forma de trabajo
- Commits chicos, en español, con conventional commits. Commitear al cerrar cada tarea.
- **Toda pantalla nueva se dibuja primero** en el lienzo del sistema visual, con las piezas de "Gestión de usuarios" y los textos del contrato real. Se programa después de que el usuario la elige.
- No se da nada por terminado sin `npm run build`, `npm run lint` y `npm test` limpios.

## Reglas
1. TS estricto: sin `any` ni `@ts-ignore`; `import type`.
2. Los tipos de la API salen de `src/shared/api/generated/`, que se regenera con `npm run contracts` y no se edita a mano.
3. Datos solo con TanStack Query y `httpClient`. Nada de `useEffect` con fetch.
4. Los errores se deciden por `code`, nunca por el texto.
5. Todo texto sale de i18n, en es y en. "Tenant" nunca en pantalla: se dice "Organización".
6. **Todo dato se muestra con `shared/ui/format` y se carga con `shared/ui/fields`**, según [`docs/architecture/formatos.md`](docs/architecture/formatos.md): fechas, números, moneda, porcentajes, teléfonos y vacíos, iguales en todas las pantallas. Nada de `toLocaleString`, `toFixed` ni `Intl.` fuera de `shared/format`. El front no calcula dinero.
7. Tokens solo en memoria. En localStorage va lo mínimo, con el prefijo `arquitecturabasemt.`.
8. Las áreas de `src/areas/` son `public` (ingresos, registros y portada), `storefront` (página pública de una empresa, en su subdominio), `personal` (acceso B2C), `business` (acceso B2B) y `platform`. Una feature no importa de otra, ni un área de otra: lo común sube a `shared/`. Al cambiar de acceso u organización se hace `queryClient.clear()`. Una persona (B2C) nunca ve "crear empresa".
9. Los permisos del front son solo experiencia de uso: decide el backend.
10. Pantallas: ficha a ancho completo; pestañas solo con dos o más tablas; lo corto en diálogo y lo largo en pantalla propia; nunca diálogo sobre diálogo; sin textos que nadie pidió.
