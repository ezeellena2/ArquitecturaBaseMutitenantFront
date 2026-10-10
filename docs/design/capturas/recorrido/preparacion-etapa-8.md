# Preparación del recorrido E7 + E8

El recorrido conserva los treinta pasos anteriores y agrega veinticinco pasos E8 por ancho: **55 pasos y 110 comprobaciones previstas**, a 1440 y 390 px. Esta preparación no acredita ejecución, capturas, aprobación de la puerta ni cierre de E8.

La fuente de los guiones es `a306c35fd27294eacf2c967e41121e91d2ffdce0`: `ingresar-por-whatsapp`, `el-bot-y-su-enlace`, `agregar-un-whatsapp` y `atender-una-recuperacion`. La fuente visual aprobada es v116 `21f227bcf6fd7a910272c682d5085338f8e2039c`. El WIP v117 no se consume como aprobación.

| Pasos nuevos | Qué comprueban |
|---|---|
| E8-01–06 | Alta aislada por UI, ingreso WhatsApp, OTP controlado, OIDC real con state/PKCE, Personal y F5; Plataforma anterior sigue abierta. |
| E8-07–11 | Agregar y verificar WhatsApp; hacer principal y quitar sin OTP adicional según ADR0045. |
| E8-12–13 | Email de respaldo verificado por pickup; Phone principal en Me y menú/lateral o Más/barra; A1 Registro ocupado → Ingresar como persona. |
| E8-14–18 | Hola por webhook firmado, deduplicación, bot/outbox real, vista previa sin canje, Continuar/OIDC, F5, enlace usado y menú del sitio público con máscara principal. |
| E8-19 | N2: Cuentas, acciones, ficha, métodos verificados y F5 desde la pestaña de Plataforma existente. |
| E8-20–23 | Pedido Phone por UI, formulario Pending, N1 aviso real/repetición antes del único POST de aprobación con versión original, F5 después del commit e ingreso con el método nuevo. |
| E8-24–25 | Alta empresarial Phone por UI; A1 ingreso empresarial desde Registro existente, retorno `/org`, acceso business, Me y marco con máscara literal. |

E8 continúa en las mismas pestañas Personal/Plataforma antes del paso E7-30, que despublica la página. No crea otro navegador/contexto ni borra cookies. La sesión antigua firmada se carga una sola vez antes de la primera visita del recorrido anterior. El apagado existente cierra el navegador y después el entorno aunque falle un paso.

Los pasos externos de Mensajes se identifican como controlados y capturan la pantalla de la app en curso; no fabrican una captura de WhatsApp. El informe mantiene cuatro pendientes manuales: completar Google, recibir/copiar los OTP en WhatsApp real, recibir/tocar el enlace del bot y recibir el aviso de recuperación con `delivered` de Meta. No certifica E9 TOTP ni bienvenida E8b. El rechazo de recuperación y los otros estados siguen en el runner E2E específico; esta ampliación sigue el guion publicado de aprobación.

## Estado del soporte

**Puente conectado contra Back `38febf92702426ef030141b51d14cd7785d47cea`; perfil de cooldown E7 pendiente de publicación.** AppHost aislado usa `RealE2ESetup --recorrido-host` como API Testing sobre su misma base PostgreSQL, mantiene Front 5174, pickup Email y claves Data Protection para la sesión antigua. La fixture WhatsApp independiente en 5176 conserva su objetivo E2E específico; el recorrido no la encadena ni crea otro contexto.

`env.whatsapp.begin` publica por `env.command("whatsapp", request)` una orden `.whatsapp.json` atómica y consume `.whatsapp.json.done` lower camelcase, sin endpoint HTTP de control. El adaptador conserva un único cursor por escenario/destino sintético, rechaza órdenes simultáneas y solicitudes WhatsApp de más de 2048 bytes, y elimina request, respuesta y temporales después de consumirlos, también ante falla. El respaldo Email usa el pickup existente. El sender WhatsApp está prohibido y el aviso N1 se dispara sólo con la orden explícita; no se atribuye el IPC como entrega Meta.

El perfil publicado fija cooldown cero. Eso es incompatible con E7-23, que debe comprobar `429 Auth.LoginCode.ResendTooSoon`. Coordinación pidió a Back publicar cooldown real de 60 s sólo en el host unificado, conservando la fixture WhatsApp independiente y los límites productivos. Hasta ese corte el recorrido no se presenta listo para ejecutar. Los envíos E8 ya respetan cada `RetryAfter` que devuelve el servidor; otros 429, errores HTTP y RetryAfter inválidos fallan, y la cancelación interrumpe la espera. No se cambia la configuración ni las cuotas productivas desde Front.

Google construye el desafío real con un cliente sintético de Testing y verifica sólo la salida a `accounts.google.com`; no acredita autenticación del proveedor ni un cliente válido en Google.

## Verificación de la preparación

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/ezequ/AppData/Local/ms-playwright'
node --test scripts/recorrido-usuario.test.mjs scripts/recorrido-usuario-entorno.test.mjs scripts/test-e2e-real-whatsapp-recovery.test.mjs
node --check scripts/recorrido-usuario.mjs
node --check scripts/recorrido-usuario-whatsapp.mjs
node --check scripts/recorrido-usuario.test.mjs
node --check scripts/recorrido-usuario-entorno.mjs
node --check scripts/recorrido-usuario-entorno.test.mjs
```

Los tests livianos verifican la cobertura de cada paso contra el guion exacto publicado, la separación del informe/manuales, la privacidad del fallo E8, el binding del control, atomicidad/concurrencia/límite/cleanup del IPC, RetryAfter/cancelación, la versión original de N1 y las comprobaciones/cleanup anteriores. Los tests DOM usan Chromium local, sin red, API ni base; los del IPC usan únicamente archivos temporales propios. No ejecutan el recorrido del producto.

Integración ejecutará el recorrido completo una sola vez sobre el par Front/Back fijo, después de publicar y consumir también el perfil que conserva E7-23:

```powershell
node scripts/recorrido-usuario.mjs --no-build
```

`--no-build` exige un build ya verificado del mismo corte. Sin ese argumento se compila Back. Docker, Aspire y las dependencias Front deben estar disponibles. El informe final se genera en `docs/design/capturas/recorrido/<fecha Buenos Aires>/index.html` con esperado, resultado, capturas OTP enmascaradas y pendientes. E8 sigue abierta; no se realiza push.
