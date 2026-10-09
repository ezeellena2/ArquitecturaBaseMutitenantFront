# E8 · Front · Parte 2b

La entrega inicial del 2026-10-08 se conserva abajo. La [continuación del pase](#continuación-del-pase--2026-10-09) registra los cambios posteriores y la sincronización coordinada del contrato; E8 permanece abierta.

Alcance: T09–T12 del [plan del back](../../../../../ArquitecturaBaseMutitenant/docs/plans/2026-10-07-etapa-8-whatsapp.md), sólo este repositorio. E8 permanece abierta. T13–T14 pertenecen a Integración y no se sustituyen por las respuestas simuladas de los tests o de la galería.

Base: front `83eede09`, contrato T01 front `2c2c7e53` / back `592b964`, lienzo **v115 (`bb7c78de`)**. Se aplican ADR 0043, 0045 y 0049. No se modifica el contrato generado, el backend, el lienzo ni las fuentes de Mensajes; no se agregan TOTP, bandeja o atención E11. Commits en `main`, sin push.

## Commits

| Cambio | Hash |
|---|---|
| T09 · capacidades, PhoneField y APIs tipadas | `f44ebbe596881857452eb3c2564030bb7881c4f1` |
| Guardas de tests alineadas al contrato T01 existente | `2faf6304c550c5aee9163d74a0db01ec0cab208a` |
| T10 · ingreso y registros WhatsApp | `551f45fe5bd25626476bab69edb55c88d69ff4ad` |
| T10 · revisión de estados y clave de recorrido | `71be13e6c442de4bae6aeaf5fbbf57218e68f8ca` |
| T10 · mensajes específicos de validación Phone | `1f1cf740b697570d78042d790e137426bc4edb2b` |
| T11 · enlace del bot, recuperación Phone y representación en Plataforma | `7c4b37120f6b4063f8af47a33bb654dad8f59477` |
| T12 · métodos WhatsApp compartidos en Mi cuenta | `340fb44618bdc46719041349872aa5bf12ff02c2` |
| T12 · errores de reenvío vencido y reconciliación después de Cancelar | `b35f90efcfd5793bd4f759f5d3fb1dc9edbce6b0` |
| Revisión final · máscara del destino Phone en código | `d863875a982bbec5aa99c2ad7569b086121c846e` |
| Galería final · estilos de la vista previa del enlace | `62e251407e2dfc7bd47786d86a1be010de4b6ad3` |
| Puerta final · criterio de botones, Avatar compartido y expectativa Phone en inglés | `e4e345406a0f339a30a9c2e6adb11daffadeae62` |

## Decisiones tomadas

- El destino Phone vive sólo en memoria y en estado de navegación. El registro conserva el retorno OIDC validado; si un registro directo ocupado vuelve al ingreso sin autorización previa, verifica la posesión antes de iniciar OIDC nuevo con la puerta elegida.
- Alta empresarial con aprobación y sin `notificationEmail`/correo ingresado dice «Revisamos {organización} y te avisamos cuando esté aprobada.»: no agrega un correo obligatorio ni promete un destino inexistente. El estado y sus acciones se conservan.
- La normalización definitiva pertenece al backend. Los POST envían país y número nacional; el formato de presentación usa los helpers compartidos. Las opciones WhatsApp salen de capacidades y datos de referencia, conservando la representación de países retirados en métodos previos.
- Plataforma puede recibir métodos Phone ya ocultos en la recuperación. Se conserva esa máscara literalmente; sólo los valores E.164 pasan por `PhoneText`, sin reconstruir números ocultos.
- Los códigos de posesión se usan al verificar el método nuevo. Principal y quitar se autorizan con la sesión y confirmación directa, conforme a ADR 0045, aunque los Tweaks antiguos conserven reautenticación.
- El destino del paso público de código se oculta con `maskPhone` (últimos cuatro dígitos), conforme a la ficha de teléfonos. La galería detectó la representación completa y se corrigió con regresión dirigida rojo → verde. El pedido recibido de recuperación y la tabla de métodos conservan el formato completo previsto por sus tableros.
- Una escritura exitosa reconcilia la caché aunque se haya cerrado el diálogo mientras estaba pendiente. Los avisos y el cierre pertenecen al recorrido todavía abierto. Se cubre también el caso heredado de alta/verificación, ahora extendido a Phone, para reflejar el método o su verificación después del éxito tardío.
- El criterio de botones también se conserva en Mi cuenta: Verificar permite tocar el botón cuando el código venció, mantiene el aviso y no envía HTTP. Si un flag de método retira la acción, confirmar informa que no permite ese cambio y no manda PUT/DELETE; los menús siguen gobernados por esos flags. La guarda transversal se mantiene intacta. Se verificó con tres regresiones dirigidas y 94/94 tests afectados.
- La galería usa las rutas/componentes reales con una entrada aislada bajo `src/test`. Simula únicamente sesión y API para comparar interfaz; no acredita cookies del backend, Meta, entrega real ni persistencia.
- Vitest necesita `TEMP`/`TMP` persistentes dentro de `node_modules` en este sandbox: el directorio temporal efímero provocaba ENOENT antes de recolectar tests. No se cambia configuración del producto ni se aumenta el timeout de los tests.

## Entrega a Integración

Integración debe conectar ambos repos, ejecutar los E2E reales sin filtro, los detectores documentales de ambos repos y el recorrido WhatsApp/Meta/túnel con sesiones anteriores, y probar retiro del módulo en copia descartable. La limpieza de metadata 501 de T01 propuesta por Back exige coordinación y regeneración de contrato en ambos repos; esta Parte 2b mantiene el freeze.

La [galería](index.html) está completa: 100/100 comparaciones, 300 PNG, pares en 1440 × 900 y 390 × 844. Su [comparación](comparacion.md) registra la inspección de 13 pares y las diferencias por ADR/capacidad. El arnés de captura terminó y el servidor Vite propio quedó detenido; no se inició Aspire.

## Verificación completa

| Comando | Resultado |
|---|---|
| `npm run build` | Código 0; TypeScript y Vite completos, 3046 módulos |
| `npm run lint` | Código 0; sin errores, conserva advertencias de lienzos y áreas existentes |
| `npm test -- --maxWorkers=2` | Código 0; 2323/2323 tests, 254 archivos, sin fallos ni pendientes; TEMP/TMP persistentes |
| `npm run contracts:check` | Código 0; schema generado coincide con OpenAPI |
| `node scripts/capturar-etapa-8.mjs --verify` | Código 0; 100/100 casos completos |

La primera ejecución completa detectó tres fallos (2320/2323): color literal del avatar, guardas de botones y una expectativa en inglés anterior a la máscara. Se corrigieron en `e4e34540`, con 94/94 tests dirigidos; la repetición completa sobre ese commit pasó 2323/2323, sin filtros. Los avisos de JSDOM sobre canvas/pseudo-elementos no impidieron las pruebas; la galería se capturó con Chrome real.

Contrato congelado: `src/shared/api/generated/schema.d.ts` no tiene diff desde T01 `2c2c7e53`; blob Git `cfcb357b8041752089fbe618320b00fb3cb834e7`. SHA-256 de OpenAPI usado: `9BB3828BCB0EBE4E3217B8B70E3E153BD618E857CBB4223234C5C70967FC4078`. No se ejecuta regeneración ni se modifica el contrato.

Las revisiones independientes de especificación/calidad de T09–T12 y la revisión global están aprobadas. No se declara cerrada E8 ni cumplida la puerta de Integración por estas pruebas.

## Continuación del pase · 2026-10-09

Sobre la entrega `44ef1092`, se atendieron los encajes aprobados en la revisión del pase, sólo en Front, en `main` y sin push. Los cambios ajenos de `docs/design/guia/` y `docs/design/recorridos/` se preservan.

| Cambio | Commit | Verificación dirigida |
|---|---|---|
| Marcador público `/registro?channel=whatsapp` | `8b428edfe298e8a06c420b3bfffe0b482aa89cd5` | Marcador 15/15; ingreso Phone 32/32; build y lint correctos; revisiones de requisitos y calidad aprobadas |
| Etapas originales de cinco referencias en la ficha de teléfonos | `8daca8556001530b4b73f77223779058e369c568` | Arnés documental de tests 7/7 |
| Ajustes mecánicos del arnés de realineación | `bee02ccc7b36636026fa71f80dc435984a27e4e3` | Verificación del arnés correcta; auto 2→0, modelo 4→4, humano 0 |
| Tipos regenerados desde la metadata implementada del back | `5dfde077ac3d221661aee550288255596ee42c70` | `contracts:check` y TypeScript código 0; contratos dirigidos 7/7 |
| Baja pendiente desde el enlace del bot | `9ac6b8bbed42a8e56fbc8854b8894342be847eb4` | 22/22 focales y 81/81 de regresión; revisión independiente 98/98; build y lint correctos; requisitos y calidad aprobados |

El marcador sólo expresa el canal: no lleva número ni secreto. Espera la capacidad de WhatsApp, incluso si llega después del catálogo de referencia, y conserva la navegación interna y las elecciones manuales. No cambia términos, OTP ni registro cerrado.

El enlace reutiliza `PendingDeletionPanel`. La cancelación conserva el ticket sólo en memoria y la clave ante errores de red/servidor; un 429 requiere esperar y volver a tocar el botón. Tras cancelar se elimina el usuario OIDC local, se limpia la caché y se inicia una autorización Consumer nueva, preservando la cookie restaurada por el back. Un reintento de OIDC no vuelve a cancelar ni a canjear el enlace. La prueba vencida lleva al estado existente de enlace inválido; las respuestas tardías después de desmontar no cambian sesión ni navegan.

La coordinación autorizó regenerar desde back `5358f6967f16eb0fc372bc3d6c553a0fa723d3f2`, que limpia exclusivamente metadata de stubs/501. OpenAPI SHA-256 normalizado a LF: `cf80064358a63daa3be361dc4a5308d0ee52e27a31824953061eb1d44b77727d`. Schema generado SHA-256 LF: `70ff361a5c4079f19ffed7e702592eca680f76b9e88ddb3e7647815caf3fac93`. No se editaron tipos a mano ni cuerpos del contrato.

El motor Codex del arnés terminó dos veces sin mensaje final (código 1). La recuperación con `--sin-modelo` verificó e integró los dos ajustes mecánicos. Los cuatro criterios pendientes son las entradas de `capturar-etapa-8.mjs`, `generar-galeria-etapa-8.mjs`, `etapa8VisualApp.tsx` y `etapa8VisualFixtures.ts` en el árbol. Los informes quedaron en `.local/arneses/realinear-docs/20261009-1118-front.md`, `20261009-1121-front.md` y `20261009-1124-front.md`. Este resultado no declara detectores en cero.

La preparación del runner real y la galería de los estados afectados sigue en curso. Las suites completas de esta continuación se registrarán sobre sus commits finales; los resultados de la entrega inicial siguen identificados por sus hashes anteriores. No se levantó Aspire ni se evaluó Meta en esta continuación.
