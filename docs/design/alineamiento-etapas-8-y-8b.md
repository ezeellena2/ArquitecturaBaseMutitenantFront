# Complemento del lienzo para E8 y E8b

Fecha: 2026-10-08. Lienzo vigente v114, commit 4340891b; este documento **no modifica ni versiona** sus HTML. Registra decisiones posteriores y estados a completar antes de implementar las tareas correspondientes. Fuentes funcionales: [ADR 0049](../../../ArquitecturaBaseMutitenant/docs/decisions/0049-precisiones-whatsapp-y-asistente.md), [plan E8](../../../ArquitecturaBaseMutitenant/docs/plans/2026-10-07-etapa-8-whatsapp.md) y [E8b](../../../ArquitecturaBaseMutitenant/docs/plans/2026-10-08-etapa-8b-asistente.md).

## E8

| Tablero / estados | Cómo programarlo |
|---|---|
| Ingreso/M-Ingreso, Registro/M-Registro, Registro-Empresa/M-Registro-Empresa, Recuperar/M-Recuperar: WhatsApp | Conservar piezas; 0043 informa inexistente/ocupado bajo phone, ofrece acción real y no emite OTP ni aviso al dueño si no corresponde. |
| Cuenta, Cuenta-Agregar, Cuenta-Verificar, Cuenta-Metodo y M-* | OTP solo para verificar el método nuevo. Principal/quitar/baja desde sesión, confirmación visual y aviso posterior, sin código a otro método (0045). |
| Enlace/M-Enlace: Vista previa y Continuar | Enlace de cuenta común entra como persona; después Perfiles permite ir a empresa. No selector de acceso. Operador nunca recibe enlace; previo ahora operador muestra la misma vista Ya no sirve, sin revelar condición. |
| Mensajes: bot de ingreso | Ya existe cuenta común/Entrar. **Completar** ejemplo desconocido→registro personal WhatsApp, términos y OTP web; alta cerrada→aviso+ingreso/recuperación. No número en query ni alta en chat. |
| Mensajes: bot de operador | **Completar** mensaje libre «Para entrar, usá la web.» / “To sign in, use the website.”, sin enlace, botones ni mención de Plataforma. Su ingreso se hace en /plataforma con código. |
| Mensajes: avisos organización WhatsApp | **Completar** aprobada/rechazada y moderación bloqueada/permitido volver a publicar con textos es/en de la guía de plantillas. Permitir no republica automáticamente. Sin botones/ActionUrl nuevos. |
| Mensajes: método/recuperación en uso | Ejemplos derogados por 0043: no se implementan. RecoveryRequested a cuenta anterior tras pedido real continúa. |

## E8b

| Tablero / estado | Cómo programarlo |
|---|---|
| Asistente-Org/Personal/Plat y M-* (Tweak asistente) | Todos sus estados son fuente del plan y de su tabla D1–D26; copiar bienvenida/historial/acciones/adjuntos/exportes/topes/errores. |
| Inicio con asistente opcional (D1) | Mientras carga el import o State, y ante error de State (incluido 500/501), conservar bienvenida, áreas y Para resolver del núcleo. El error y Reintentar quedan en la región del asistente, sin presentarlo como Sin configurar; ese estado requiere `configured=false`. Ante State 403/404 se conserva el retorno al núcleo con relectura de Me; no cambia la guarda de la consulta principal del núcleo. |
| Asistente-Personal/M-*: resultado de Mis mensajes con empresas | **Completar** dentro de la respuesta existente: «Todavía no tenés mensajes con empresas» / “You don't have any messages with businesses yet.”. Atajo visible, sin link a bandeja inexistente, proveedor ni datos de prueba. |
| Asistente-Config-Org/M-*: OwnKey sin receptor | **Completar** aviso/error de mode cuando ningún Dueño activo tiene Email verificado utilizable; acción al flujo existente Mi cuenta para agregar/verificar correo. No formulario de destinatario ni alerta WhatsApp. |
| Asistente-Uso-Org, Plat-Asistente-Config/Uso y M-*; Mensajes alertas | Todos los estados vigentes. OwnKey alerta a todos los Dueños activos con Email verificado; plataforma a soporte. Cuota plataforma compartida por UserId/día UTC, propia aparte por organización; renovación formateada local, no contador permanente >10. |
| Organizacion/M-Organizacion: Módulos | Añadir contribución Asistente sin sustituir filas/políticas existentes. No habilitar WhatsApp técnico E8 como feature comercial E11. |
| Administración / Inicio de Plataforma / barra móvil | Con Asistente: grupo Administración, Inicio /plataforma, Organizaciones /plataforma/organizaciones; Asistente segunda pestaña y Difusiones/Recuperaciones pasan a Más donde existan. Sin módulo/habilitación, conducta actual completa. |

## Forma de trabajo

Modo rápido desde E7: pantallas ya aprobadas se programan directo, tests donde importan, sin visto bueno por pantalla ni captura por avance. Completar los ejemplos faltantes con las piezas existentes antes de sus tareas autorizadas; no reabrir las seis decisiones. Una sola puerta final con suites, E2E real, documentación en 0, galería lado a lado y recorrido. Los faltantes de plantillas/aprobación Meta son obligaciones de E8 T03, no estados ya resueltos por este documento.
