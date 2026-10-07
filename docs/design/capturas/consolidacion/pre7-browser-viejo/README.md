# Recorrido en Chrome con sesiones previas

Prueba manual sobre el AppHost normal y su PostgreSQL persistente, en el perfil de Chrome que ya tenía sesiones. No se borraron cookies ni almacenamiento. Los correos `codex-*@example.test` son propios de la prueba; el transporte de correo de este proceso usa un pickup local. No se reemplazan respuestas de la API ni se simula el ingreso.

Las imágenes son JPEG originales del navegador, inspeccionadas en su estado final y verificadas a **1440 × 900** y **390 × 844**. `manifest.json` conserva dimensiones, descripción, paso y SHA256. Las primeras capturas tomadas durante transiciones se conservan fuera de Git en `.local/pre7/browser-viejo/capturas-transicion/` y se repitieron; no cuentan como prueba del estado final.

## Estado del recorrido

**12/16 verificaciones completas:** seis de los ocho pasos a ambos tamaños, el 2026-10-07. No se declara cerrada la puerta manual de los ocho pasos.

| Paso del plan | 1440 | 390 | Evidencia y conducta observada |
|---|---|---|---|
| 1. Persona sin cuenta | Completo | Completo | `01-sin-cuenta-*`, `01-alta-personal-*`: desde Ingresar, correo inexistente → registro con correo conservado → código → inicio Personal. |
| 2. Persona con cuenta | Completo | Completo | `02-correo-con-cuenta-*`, `02-reingreso-f5-*`: registro ofrece Ingresar con el correo conservado; código, salida, reingreso y F5. |
| 3. Google | Pendiente | Pendiente | No hay una cuenta Google propia de prueba disponible en este perfil. |
| 4. Empresa | Completo | Completo | `04-sin-empresa-*`, `04-cuit-verificador-*`, `04-alta-empresa-f5-*`, `04-perfil-dueno-*`: Sin empresa, alta con correo nuevo, CUIT inválido/válido, organización creada, ingreso posterior y F5; el perfil dice Dueño. |
| 5. Operador y persona | Pendiente | Pendiente | Falta un operador de prueba de la base normal para comprobar ambas pestañas manualmente. |
| 6. Mi cuenta | Completo | Completo | `06-cuenta-*`, `06-correo-ocupado-*`, y confirmaciones móviles: nombre/apellido guardados, agregar con un solo código del correo nuevo, cambiar principal y quitar sin código, rechazo de otro correo ocupado; datos y nuevo principal conservados tras F5. |
| 7. Recuperar | Completo | Completo | `07-recuperar-sin-cuenta-*`, `07-recuperar-ocupado-*`: errores específicos para origen sin cuenta y destino de otra cuenta. |
| 8. Errores comunes | Completo | Completo | `08-correo-invalido-*`, `08-codigo-incorrecto-*`, `08-codigo-vencido-*`, `08-reenvio-cooldown-*`: formato, código equivocado, vencimiento real y espera de reenvío; también `08-ingreso-antes-de-tiempo-390`. |

El vencimiento se verificó después de **614 segundos reales**, sin modificar el reloj. Las capturas de código incorrecto muestran `000000`, deliberadamente distinto del código emitido; no muestran un OTP real. Los códigos reales se quitaron de los controles antes de las demás capturas. Los límites de envío se conservaron y se respetó el plazo al reintentar.

Google queda pendiente: Chrome reutilizó automáticamente la sesión de Google del usuario y regresó a la app. Se cerró inmediatamente la sesión pública de la app; no se usó esa cuenta para modificar datos ni se repitió el ingreso. El plan exige correos propios y no se dispone de una cuenta Google de prueba en este perfil. La pantalla anterior al clic no prueba el resultado del proveedor.

La convivencia manual con Plataforma necesita un operador de prueba de la base normal. Los operadores del E2E pertenecen a su base aislada; no se reutilizan ni se alteran las protecciones del fixture para sembrarlos en desarrollo. Este paso no se declara aprobado por las ejecuciones automáticas.

El hallazgo `TenantAdmin` en Perfiles se corrigió en la composición de `/api/me` usando `RoleTexts.Name`; `04-perfil-dueno-1440.jpg` y `04-perfil-dueno-390.jpg` muestran «Dueño» después de reiniciar la API, conservando la sesión. Rojo unitario y HTTP observado; verde Profile 46/46, Me 8/8, builds API/AppHost sin advertencias. E2E real final A10: 2/2 recorridos (3/3 con el padre), EXIT 0, 103,155 s de Node y 104,087 s del comando. Commits BACK `8e5be0a`, FRONT `9708026f`.

Al finalizar se cerraron las pestañas de la prueba y se restableció el viewport. AppHost normal y AppHost aislado quedaron apagados.
