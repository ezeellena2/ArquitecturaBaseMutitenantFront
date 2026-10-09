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
| Runner aislado y comunicación privada | `3a000026` / `2f9f21e7` | 30 grupos previstos, secuenciales después del recorrido general; API/DB/cookies reales, aún sin ejecutar |
| Escenarios ocupados y selección real de pedidos | `579fc2c34b920cef7e2ac8cd5ebb6d26b330893e` | 12/12 Node; requisitos, calidad y revisión global estática aprobados |
| Galería extendida, ícono y recaptura final | `68821751` / `36d15e0f` / `ff972f96` | 108/108 casos y 324 PNG; ocho pares nuevos y cuatro actualizados inspeccionados |
| Últimos ajustes mecánicos del arnés | `018d8e1a` / `2d991a6e0a407144111c6f56b0a38f875da090b0` | Verificación correcta; se conservan cinco criterios documentales pendientes |

El marcador sólo expresa el canal: no lleva número ni secreto. Espera la capacidad de WhatsApp, incluso si llega después del catálogo de referencia, y conserva la navegación interna y las elecciones manuales. No cambia términos, OTP ni registro cerrado.

El enlace reutiliza `PendingDeletionPanel`. La cancelación conserva el ticket sólo en memoria y la clave ante errores de red/servidor; un 429 requiere esperar y volver a tocar el botón. Tras cancelar se elimina el usuario OIDC local, se limpia la caché y se inicia una autorización Consumer nueva, preservando la cookie restaurada por el back. Un reintento de OIDC no vuelve a cancelar ni a canjear el enlace. La prueba vencida lleva al estado existente de enlace inválido; las respuestas tardías después de desmontar no cambian sesión ni navegan.

La coordinación autorizó regenerar desde back `5358f6967f16eb0fc372bc3d6c553a0fa723d3f2`, que limpia exclusivamente metadata de stubs/501. OpenAPI SHA-256 normalizado a LF: `cf80064358a63daa3be361dc4a5308d0ee52e27a31824953061eb1d44b77727d`. Schema generado SHA-256 LF: `70ff361a5c4079f19ffed7e702592eca680f76b9e88ddb3e7647815caf3fac93`. No se editaron tipos a mano ni cuerpos del contrato.

El motor Codex del arnés terminó dos veces sin mensaje final (código 1). La recuperación con `--sin-modelo` verificó e integró los dos ajustes mecánicos. Una repetición usando el CLI de la app terminó y fusionó `018d8e1a`: auto 3→0, modelo 5→0, humano 0→5; verificación del arnés correcta. Consumo informado: entrada 97652, caché 67968, salida 388, razonamiento 45, costo no disponible. Los cinco criterios quedaron sin resolver y pasaron a revisión humana: entradas de `capturar-etapa-8.mjs`, `generar-galeria-etapa-8.mjs`, `test-e2e-real-whatsapp.mjs`, `etapa8VisualApp.tsx` y `etapa8VisualFixtures.ts` en el árbol. El informe vigente es `.local/arneses/realinear-docs/20261009-1209-front.md`; los intentos previos se conservan. La skill `arnes` impide rehacer manualmente su trabajo. Este resultado no declara detectores en cero.

Después del ajuste del runner, una ejecución mecánica final fusionó `2d991a6e`: auto 2→0, modelo 5→5, humano 0→0, verificación correcta y 0 tokens. Informe final: `.local/arneses/realinear-docs/20261009-1220-front.md`. Los mismos cinco criterios quedan sin enviar al modelo y siguen pendientes; el informe anterior conserva su lista para revisión humana. No se abrió ni rehízo el archivo tocado por el arnés.

La preparación del runner real quedó versionada en `3a000026` y su ejecución secuencial después del recorrido general en `2f9f21e7`. El conteo verificado es **30 grupos, 15 por tamaño**, que conservan los 18 grupos iniciales y agregan recuperación humana, CTA del bot y baja por enlace. La revisión de calidad detectó dos escenarios que debían corregirse antes de ejecutarlo: recuperación con el mismo destino anterior/nuevo y selección del pedido con un buscador inexistente en móvil. Ambos se corrigieron en `579fc2c34b920cef7e2ac8cd5ebb6d26b330893e`: el número ocupado pertenece a otra cuenta creada por UI/OTP real; escritorio usa `searchbox` y móvil conserva 390 px, seleccionando la tarjeta por los dos métodos enmascarados del DTO y comprobando unicidad y persistencia después de F5. Pasaron 12/12 pruebas Node dirigidas, build, lint del alcance y sintaxis. Las revisiones independientes de requisitos, calidad y global estática aprobaron el resultado. No se atribuyen resultados reales a esta preparación.

La galería `68821751` amplió el catálogo a **108/108 casos, 324 PNG**. Se revisaron los ocho pares nuevos y se corrigió el ícono de WhatsApp del enlace inválido en `36d15e0f`, con 22/22 tests focales y TypeScript/lint dirigidos correctos. La recaptura `ff972f96` actualizó únicamente ocho PNG de los cuatro casos afectados y verificó 108/108. La [comparación](comparacion.md) registra las diferencias autorizadas y la actualización de las capturas afectadas.

| Verificación completa de esta continuación | Resultado |
|---|---|
| `npm run build` | Código 0; TypeScript y Vite completos |
| `npm run lint` | Código 0; sin errores, advertencias existentes |
| `npm test -- --maxWorkers=2` | Código 0; **2350/2350 tests, 255 archivos**, sin fallos ni pendientes, 1145,76 s |
| `npm run contracts:check` | Código 0; schema generado coincide con OpenAPI |
| Tests Node de IPC, comunicación saneada, captura y selección de recuperación | 12/12; revisión independiente correcta |
| `node scripts/capturar-etapa-8.mjs --verify` | Código 0; 108/108 casos |

La suite completa ejecutó el código funcional de `9ac6b8bb` con la preparación de galería `68821751`. La corrección posterior del ícono sólo cambia presentación y tiene la regresión dirigida indicada arriba. Los logs completos quedaron en `.local/reviews/e8-front-20261009/`. Los resultados iniciales continúan identificados por sus hashes anteriores.

El fixture real espera el GO coordinado sobre binarios estables del back. No se levantó Aspire ni se evaluó Meta en esta continuación. El informe no declara T13/T14 cumplidos ni cierra E8.

## Integración real posterior al GO · 2026-10-09

El GO habilitó primero el E2E general y después los 30 grupos WhatsApp, sobre código Back `8e0bb63c1638b7e5a5e52d89c28de91562b24cf6`; los HEAD posteriores del Back sólo agregaron documentación. No se editó el Back; las repeticiones usaron sus binarios estables con `--no-build`. Se usó un perfil `APPDATA` privado, `TEMP`/`TMP` persistentes y Chromium local; las claves del general se generaron únicamente en el proceso, sin usar user-secrets reales.

El general completo terminó con código **0: 36/36 pruebas** (35 subcasos y su prueba padre), sin fallos, canceladas ni omitidas, en 1800419,6797 ms. El comando fue `node --test --test-name-pattern 'registro real y puerta empresa' scripts/test-e2e-real.test.mjs`, sin `MT_E2E_ONLY_CASE`: el patrón selecciona la prueba padre general completa, no filtra sus recorridos. Log: `.local/reviews/e8-front-20261009/e2e-general.log`. Su `finally` detuvo Aspire y `aspire ps` confirmó cero sesiones antes de iniciar WhatsApp.

Los primeros intentos fallidos se conservan. El general aislado necesitó `Authentication__LoginCode__HashKey` aleatoria de 32 bytes, Base64, en el entorno del proceso. El primer runner WhatsApp expuso una espera prematura por ruta y promesas de respuesta sin manejador inmediato; `31ee77edce9b9ac2cd958d2716064f120c729616` corrigió esas esperas y agregó diagnóstico de pasos sin datos privados (17/17 Node). La repetición identificó que el operador seed tiene términos pendientes. `0a3eb4a22c7d44f848c8559287e973de416072cd` completa el checkbox y POST real `/api/legal/accept` → 204 antes de esperar la interfaz privada, y separa el contexto de navegador del operador del de Persona. Pasaron **21/21 Node**, lint y sintaxis del alcance; requisitos y calidad aprobaron ambas correcciones. Son ajustes del soporte E2E: no cambian producto ni contrato, por lo que se conserva la suite funcional completa 2350/2350 indicada arriba.

El detector documental de sólo lectura `.local/arneses/realinear-docs/20261009-1312.md` informó **auto 2, modelo 5, humano 0**, sin ejecutar correcciones y con 0 tokens. La coordinación prohibió editar el árbol durante el pase; los cinco criterios anteriores siguen pendientes de su resolución coordinada. No se declara documentación en cero.

La repetición sobre `0a3eb4a2` completó trece grupos de escritorio, incluidas la aceptación legal del operador, aprobación/rechazo humano persistidos y accesos empresariales. Terminó con código 1 al preparar el enlace de baja. El emisor aplica una ventana de 60 segundos por cuenta; cambiar el Phone mediante recuperación no cambia esa cuenta y una respuesta del bot limitada no contiene `LinkUrl`. El driver incorpora una espera real cancelable antes de cada enlace de baja, conservando cursores IPC posteriores a la espera. La verificación dirigida existente, incluidos cancelación y cierre de contextos, pasó **31/31**. No se modifican límites ni reloj de la API. Log conservado: `.local/reviews/e8-front-20261009/e2e-whatsapp-final.log`.

La espera se versionó en `980195e1f99b54618446639896522fb60784d1c4`. Su repetición encontró una falla intermitente al leer la respuesta tras F5 en la aprobación; el intento anterior había completado ese punto. La revisión del driver identificó que podía capturar un refresco iniciado antes de recargar. La corrección exige una consulta iniciada después del commit de navegación principal, manteniendo el F5 y la lectura real del estado persistido. El diagnóstico clasifica firmas conocidas con etiquetas fijas, sin publicar el mensaje de Playwright. La prueba dirigida reproduce respuestas viejas que terminan después del commit y verifica el cierre de listeners ante éxito o fallo: **35/35 Node**. Log del intento: `.local/reviews/e8-front-20261009/e2e-whatsapp-window.log`.

La correlación de F5 quedó commiteada en `4955e9a04dfe3663c0577dadbe5fc1ea700915c7`, con requisitos, calidad y revisión global aprobados. Tanto esa corrección como la ventana real mantienen las quince comprobaciones de cada tamaño; no cambian respuestas esperadas, persistencia ni puertas de autorización.

La última ejecución terminó con **30/30 grupos reales, quince en 1440 y quince en 390; código 0; 371194 ms**. Verificó OTP, cuenta, ambos accesos, webhook HMAC/deduplicación durable, bot/enlace y OIDC con state/PKCE, replay, destinos ocupados, recuperación por UI de Plataforma con aprobación/rechazo persistidos después de F5, cancelación de baja por enlace y ticket vencido sin OIDC. Log: `.local/reviews/e8-front-20261009/e2e-whatsapp-f5.log`. El Back durante esta corrida estaba en HEAD documental `734fe9096ff74ab71787b9b6dd71f9216e9ea858`, con código de producto `8e0bb63c1638b7e5a5e52d89c28de91562b24cf6`.

Comandos finales del soporte, desde Front:

```powershell
node --test scripts/test-e2e-real-case.test.mjs scripts/test-e2e-real-whatsapp-recovery.test.mjs scripts/test-e2e-real-whatsapp-action.test.mjs scripts/test-e2e-real-whatsapp-ipc.test.mjs scripts/capturar-etapa-8.test.mjs
dotnet run --project ../ArquitecturaBaseMutitenant/tools/ArquitecturaBaseMultitenant.RealE2ESetup --no-build -- --whatsapp-browser C:/Users/ezequ/source/repos/ArquitecturaBaseMutitenantFront/scripts/test-e2e-real-whatsapp.mjs
node scripts/capturar-etapa-8.mjs --verify
```

El primer comando pasó **35/35 Node**; el segundo, **30/30 grupos reales**; el tercero verificó **108/108 casos, 324 PNG**. El segundo recibió `MT_E2E_ISOLATED=1`, `APPDATA` privado, `TEMP`/`TMP` persistentes y `PLAYWRIGHT_BROWSERS_PATH` local. El cierre de la fixture liberó navegador, Vite, Kestrel y PostgreSQL propios y eliminó sus archivos privados; no queda una sesión Aspire de esta ejecución. Los intentos fallidos siguen disponibles para auditoría y no se presentan como aprobados.

Resultados vigentes para el pase: build, lint y contracts:check completos con código 0; suite funcional **2350/2350**, Node **35/35**, general real **36/36**, WhatsApp real **30/30**, galería **108/108**. Los ajustes posteriores a las suites completas son exclusivos del runner y fueron verificados con sus pruebas dirigidas y el recorrido real. Los hashes LF del contrato permanecen `cf80064358a63daa3be361dc4a5308d0ee52e27a31824953061eb1d44b77727d` (OpenAPI) y `70ff361a5c4079f19ffed7e702592eca680f76b9e88ddb3e7647815caf3fac93` (schema).

**E8 permanece abierta.** Este resultado no acredita envío ni `delivered` por Meta, el recorrido operativo T14, la prueba de retiro del módulo ni documentación en cero. Se commitea sólo Front, en `main`, sin push y preservando los cambios ajenos del recorrido.
