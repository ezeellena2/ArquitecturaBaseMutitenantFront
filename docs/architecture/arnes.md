# El arnés del front

> Es el espejo de `../ArquitecturaBaseMutitenant/docs/architecture/arnes.md`: los mismos cuatro niveles, el mismo formato de ficha y la misma verificación. Objetivo: que nadie invente un componente, un formato, un hook o un texto que ya existe.

## 1. Niveles

| Nivel | Dónde |
|---|---|
| 0. Índice | `AGENTS.md` raíz (+ `CLAUDE.md` = `@AGENTS.md`) con la tabla "si vas a tocar X, leé Y" |
| 1. Fichas | `docs/rules/<tema>.md` (formato: Regla · Cómo se hace · Prohibido · Copiá de · Lo verifica · Detalle) |
| 2. Punteros | `AGENTS.md` + `CLAUDE.md` en cada carpeta del mapa (§2), de 1 a 3 líneas |
| 3. Verificación | tests de Vitest, `oxlint`, `tsc` estricto, `format-usage.test.ts`, `parity.test.ts`, `theme-tokens.test.ts`, `harness.test.ts` |

Para una pantalla, el **«Copiá de» es el [tablero correspondiente del lienzo versionado](../design/lienzo/README.md)**; prevalece sobre cualquier descripción textual. Los archivos de código de la columna «Copiá de» muestran la convención de implementación cuando ya existen.

## 2. Mapa de carpetas → punteros

El mapa de responsabilidades y punteros vive en [arbol.md](arbol.md#mapa-de-carpetas-punteros).

## 3. "Si vas a tocar X, leé Y"

La tabla vive solo en el [`AGENTS.md` raíz](../../AGENTS.md#antes-de-escribir-código-el-arnés) y no se copia acá. Una ficha nueva suma su fila ahí, en el mismo commit.

## 4. Verificación del arnés

`src/test/harness.test.ts` usa la lista explícita `ClosedStages`, que se actualiza al cerrar cada etapa sin asumir continuidad numérica. Un «Copiá de» marcado `(E#)` se exige solo cuando esa etapa está cerrada; un rango se exige cuando todas las etapas incluidas cerraron. El test falla si:
- una carpeta del mapa que ya existe no tiene `AGENTS.md` y `CLAUDE.md`;
- hay un enlace roto en un puntero o en una ficha;
- una ficha no tiene sus secciones;
- un "Lo verifica" nombra un test cuya etapa `(E#)` ya cerró y que no existe. Los tests de etapas futuras pueden no existir todavía;
- un `pages/*Page.test.tsx` no corre axe ([accesibilidad](../rules/accesibilidad.md)).

Hasta la Etapa 10, cada CI usa solo su propio checkout. Los enlaces al repo hermano se verifican cuando ese checkout está presente; el checkout cruzado y su verificación obligatoria llegan con la Etapa 10 (ADR 0016).

## 5. Cadencia de verificación

Cada cambio coherente se cierra con un test focal rojo/verde cuando hay lógica y con las comprobaciones de build y lint del alcance afectado en verde antes del commit. La puerta de etapa ejecuta `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check` completos; el CI corre los mismos, pero salta `contracts:check` porque descarga un solo repo: el chequeo cruzado llega con la Etapa 10 (ADR 0016). La puerta de etapa conserva además el E2E real desde E3a y la comparación visual con el tablero aprobado. Para una pantalla nueva, los tests cubren solo los estados y recorridos que realmente existen, además de los controles críticos aplicables de [tests](../rules/tests.md).

Mantenimiento: igual que en el back ([arnes.md §6](../../../ArquitecturaBaseMutitenant/docs/architecture/arnes.md#6-mantenimiento)), salvo la puerta de documentación a ciegas, que no forma parte de la puerta de etapa: la documentación se verifica con `realinear-docs --detectar` en 0.
