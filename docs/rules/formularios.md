# Formularios

**Regla:** Lo corto se edita en diálogo y lo largo en pantalla. Cada dato usa su field tipado; su error vive en el campo. Mandan los tableros Criterio de Formularios y Diálogos.

## Cómo se hace
- Todo formulario usa react-hook-form + zod, mensajes i18n y defaultValues de lo guardado; el editor se desmonta por key si cambia su registro.
- Diálogo: Dialog, título/campos/botonera y useRestoreFocusOnClose; se monta sólo abierto.
- Pantalla: Page/backTo + useEditPage (409, franja y aviso al salir con cambios; la banda no dice «Cambios sin guardar») + useEditForm (borrador y versión).
- Una Section por tema, título arena y SectionFields (16 arriba, 20 costados/abajo; relleno móvil según variante).
- Dos columnas iguales por caja; tres sólo para datos cortos; texto largo ocupa todas. Campos simples según tipo y FormField con rótulo/error/aria-describedby.
- Sin ayudas ni ejemplos; asterisco obligatorio; sólo buscador tiene placeholder. Lo que no se edita va en el mismo campo, apagado, con fondo y texto grises (A11, v113): `ReadOnlyField`, o el control deshabilitado si ya lo dibuja así (`SearchSelect`).
- Listas se leen: editar/agregar abre diálogo; permisos de rol son la única lista de grupos plegables.
- Editar: Descartar cambios + Guardar cambios; crear: Cancelar + acción. Guardar se apaga sin cambios, incluso si se revierte el orden con orderLike.
- Crear no se apaga por vacío/invalidez; se valida al enviar. pending bloquea la espera real; sólo condiciones externas bloquean fuera de ella.
- Dos motivos válidos se suman con `||`: «Guardar cambios» del Rol se apaga sin cambios y mientras corre la cuenta de un límite de uso (P2). El bloqueo de la cuenta en «Confirmá que sos vos» es la cuenta de su Retry-After (`useRetryAfterCountdown`): al terminar se puede volver a confirmar. Mientras dura, el botón queda apagado con su mismo texto, y cuándo se puede volver a probar lo dice el aviso de error de siempre (decisión del usuario del 2026-10-24).
- [Compositor del Asistente](../../../ArquitecturaBaseMutitenant/docs/features/asistente.md): unavailable representa bloqueo externo; pending va separado y no dice Guardando por bloqueo.
- mutate usa variables originales y onSuccess; reset(lo guardado) y wrote(versión enviada/respondida, relectura). Descartar/Ver lo nuevo hacen resetTo.
- La base es la lectura inicial/reiniciada y después la escritura propia; un GET de fondo no pisa borrador ni versión. version es opaca: igualdad, nunca mayor/menor.
- Una lectura con token reemplazado por el recorrido no sustituye la última escritura; adoptar explícitamente lo nuevo reinicia la base. Un diálogo cerrado no conserva base.
- Acciones inmediatas toman versión de lectura/apertura; si parten de la base, la respuesta actualiza base sin perder borrador.
- 409 muestra ConcurrencyBanner: Ver lo nuevo confirma descarte y relee; Seguir editando conserva el borrador y conflicto hasta releer. Sin retry automático.
- applyApiErrorToForm asigna campos; FormError queda sobre botones o bajo banda. En diálogo desaparece al cerrar; 409 relee raíz salvo borrador sin guardar.
- Red/5xx/429 siguen [errores](errores.md), sin duplicar el aviso de MutationCache. ReasonDialog conserva respuesta original y motivo según [Plataforma](../../../ArquitecturaBaseMutitenant/docs/features/plataforma.md).
- Un campo onSubmit (OTP/términos) limpia error al cambiar y revalida al enviar; AuthCodeStep es la excepción controlada por OtpInput, según [Identidad](../../../ArquitecturaBaseMutitenant/docs/features/identidad.md).
- Fields inválidos conservan texto, emiten null/validity=false inmediatamente y muestran error tras blur; corregir devuelve valor/true.
- DateField.invalidMessage omitido usa el común; texto lo reemplaza; null lo cede a FormField sin perder aria-invalid/valididez. Un mensaje, un aria-describedby.
- Catálogos aportan opciones y valores guardados deshabilitados; búsqueda no oculta el elegido.
- `MultiSelect creatable` (con búsqueda remota) y `SearchSelect creatable` ofrecen «Crear «X»» si lo buscado no existe sin distinguir mayúsculas, como las etiquetas de un contacto y la de una importación (E11, D10); el back valida el valor nuevo al guardar. TextLimits y máscaras fiscales salen del contrato/catálogo.
- El tipo fiscal empresarial pertenece al formulario; taxIdValidationMessage distingue largo/algoritmo; normalizar separadores antes de limitar, sin maxLength HTML de dígitos.
- Un alta/envío usa useIdempotentMutation desde apertura; [datos y API](datos-y-api.md) define cuerpo, clave, retry y abandono.
- useEditPage.onNavigationAttempt avisa sincrónicamente ruta/searchKeys aunque se bloquee; cancelar AbortSignal antes de decidir salida, crear otro dueño sólo al quedarse/cambiar grupo.
- Operaciones privadas retiran cuerpos/claves/callbacks al abandonar, revocar o limpiar caché, sin contextos UNSAFE_ ni inspección del router.
- Medidas, PhoneBand, FixedActions y hojas móviles: [responsive](responsive.md); coordinación de guardado/publicación: [sitio público](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md).

## Prohibido
- Diálogo sobre diálogo, tabla en diálogo o confirmación irreversible con ✕/acción no roja llena.
- Paneles/filas expandidos salvo permisos; columnas distintas en una caja; controles a medio ancho sin contenido.
- Casillas sueltas, switch para guardar, ayudas no pedidas o error de formulario pasajero.
- Input number para montos, input date crudo, opciones/decimales locales o base tomada de un GET ajeno.
- Límites numéricos a mano en `maxLength={número}` o `.max(número)`: salen de `validationConstraints`; los rangos int32 también se generan del formato del contrato.

## Copiá de
- `src/areas/business/roles/pages/RoleEditorPage.tsx` (E4) y `src/areas/personal/account/components/AccountDeletionDialog.tsx` (E4).

## Lo verifica
- `submit-buttons.test.ts` (E7), `harness.test.ts` (E0): botones y formato/referencias; `validation-limits.test.ts` (C10): límites sin literales en áreas y módulos.

## Detalle
[Lienzo](../design/lienzo/README.md), [tema](../architecture/tema.md) y [responsive](responsive.md).
