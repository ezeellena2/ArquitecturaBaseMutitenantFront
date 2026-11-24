# Formularios

**Regla:** Lo corto se edita en diálogo y lo largo en pantalla. Cada dato usa su field tipado; su error vive en el campo. Mandan los tableros Criterio de Formularios y Diálogos.

## Cómo se hace
- Todo formulario usa react-hook-form + zod, mensajes i18n y defaultValues de lo guardado; el editor se desmonta por key si cambia su registro.
- Diálogo: Dialog, título/campos/botonera y useRestoreFocusOnClose; se monta sólo abierto.
- Pantalla: Page/backTo + useEditPage (409, franja y aviso al salir con cambios; la banda no dice «Cambios sin guardar») + useEditForm (borrador y versión).
- Una Section por tema, título arena y SectionFields (16 arriba, 20 costados/abajo; relleno móvil según variante). El encabezado de una Section lleva el título y, a la derecha, su acción y un ⋮ con lo demás. Qué va a la vista y qué en el ⋮ sigue a [pantallas y UI](pantallas-y-ui.md) (209). «Opciones» de un catálogo, como en ArquitecturaBase, lleva a la vista «Agregar opción», «Agregar campos · N», «Importar» y «Exportar», y en el ⋮ la plantilla, el orden y los códigos (126). Nunca cantidades: lo que hay se ve en la tabla y en el paginado (decisión del usuario del 2026-10-26).
- Dos columnas iguales por caja; tres sólo para datos cortos; texto largo ocupa todas. Campos simples según tipo y FormField con rótulo/error/aria-describedby. Un select toma el ancho de su opción más larga: sin anchos fijos que corten el texto.
- Sin leyendas ni ejemplos: la ayuda que sirve va en la (i) (`help`, base de la 12) y el renglón de abajo es sólo para el error o un dato ([pantallas y UI](pantallas-y-ui.md)); asterisco obligatorio; sólo buscador tiene placeholder. Lo que no se edita va en el mismo campo, apagado, con fondo y texto grises (A11, v113): `ReadOnlyField`, o el control deshabilitado si ya lo dibuja así (`SearchSelect`).
- Listas se leen: editar/agregar abre diálogo. Los permisos de un rol van en áreas plegables (RO3-D, 260, tablero `Rol`): cada área es una banda con la flecha, su casilla (vacía, parcial o completa), su nombre y su (i); abierta, un permiso por fila con su casilla y su nombre entero. Se abren las que tienen algo, y un rol nuevo arranca con todas cerradas; sin cuentas, buscador, filtros ni descripciones a la vista. Lo incluido (`includes` del catálogo, sin repetir la lista) queda marcado y apagado con su motivo («Lo incluye «Administrar usuarios».»). El Dueño y todo rol de sistema que no se cambia se leen con tildes, sin casillas y con sus áreas cerradas. En el teléfono, filas de 44 px, y la flecha y la casilla del área con su zona de 44 px cada una. Igual en organización, empresa y Plataforma.
- Editar: Descartar cambios + Guardar cambios; crear: Cancelar + acción. Guardar se apaga sin cambios, incluso si se revierte el orden con orderLike.
- Crear no se apaga por vacío/invalidez; se valida al enviar. Si falta un dato obligatorio, el botón queda habilitado y al tocarlo se marca el campo con el error de siempre; antes de intentar guardar, nada va en rojo, tampoco una fila recién agregada (decisión del usuario del 2026-10-24). pending bloquea la espera real; sólo condiciones externas bloquean fuera de ella.
- Dos motivos válidos se suman con `||`: «Guardar cambios» del Rol se apaga sin cambios y mientras corre la cuenta de un límite de uso (P2). El bloqueo de la cuenta en «Confirmá que sos vos» es la cuenta de su Retry-After (`useRetryAfterCountdown`): al terminar se puede volver a confirmar. Mientras dura, el botón queda apagado con su mismo texto, y cuándo se puede volver a probar lo dice el aviso de error de siempre (decisión del usuario del 2026-10-24). La única cuenta en un botón es «Reenviar en 30 s», al pedir un código.
- [Compositor del Asistente](../../../ArquitecturaBaseMutitenant/docs/features/asistente.md): unavailable representa bloqueo externo; pending va separado y no dice Guardando por bloqueo.
- mutate usa variables originales y onSuccess; reset(lo guardado) y wrote(versión enviada/respondida, relectura). Descartar/Ver lo nuevo hacen resetTo.
- La base es la lectura inicial/reiniciada y después la escritura propia; un GET de fondo no pisa borrador ni versión. version es opaca: igualdad, nunca mayor/menor.
- Una lectura con token reemplazado por el recorrido no sustituye la última escritura; adoptar explícitamente lo nuevo reinicia la base. Un diálogo cerrado no conserva base.
- Acciones inmediatas toman versión de lectura/apertura; si parten de la base, la respuesta actualiza base sin perder borrador.
- 409 muestra ConcurrencyBanner: Ver lo nuevo confirma descarte y relee; Seguir editando conserva el borrador y conflicto hasta releer. Sin retry automático.
- applyApiErrorToForm asigna campos; FormError queda sobre botones o bajo banda. En diálogo desaparece al cerrar; 409 relee raíz salvo borrador sin guardar.
- Red/5xx/429 siguen [errores](errores.md), sin duplicar el aviso de MutationCache. ReasonDialog conserva respuesta original y motivo según [Plataforma](../../../ArquitecturaBaseMutitenant/docs/features/plataforma.md).
- Un campo onSubmit (OTP/términos) limpia error al cambiar y revalida al enviar; AuthCodeStep es la excepción controlada por OtpInput, según [Identidad](../../../ArquitecturaBaseMutitenant/docs/features/identidad.md).
- Fields inválidos conservan texto y emiten null/validity=false inmediatamente; el error se muestra al tocar el botón de guardar, no al salir del campo (decisión del usuario del 2026-10-24); corregir devuelve valor/true.
- DateField.invalidMessage omitido usa el común; texto lo reemplaza; null lo cede a FormField sin perder aria-invalid/valididez. Un mensaje, un aria-describedby.
- **Elegir es la pieza `Picker`** (262; la F11 de la segunda parte de la base; los selectores de referencia de `shared/ui/fields` la usan por dentro): también el Sí o No, que arranca vacío, y de dos a cuatro opciones fijas, sin radios ni segmentados. Elegir varios adentro de un diálogo que guarda es la pieza múltiple con «Guardar», nunca una lista de casillas. `creatable` sigue ofreciendo «Crear «X»». Lo que aprendió ArquitecturaBase al programarla (traspaso 18): la lista abre con lo elegido a la vista; cerrarla devuelve el foco al campo, salvo que la elección lo lleve a otro lado, donde queda; elegir lo ya elegido también avisa, así que donde elegir reinicia algo (otro campo, una lista que depende) hace falta una guarda; una lista del servidor no dice «0 opciones» cuando ya dice que no hay.
- Catálogos aportan opciones y valores guardados deshabilitados; búsqueda no oculta el elegido.
- `Picker creatable` (una o varias, con búsqueda remota) ofrece «Crear «X»» si lo buscado no existe sin distinguir mayúsculas, como las etiquetas de un contacto y la de una importación (E11, D10); el back valida el valor nuevo al guardar. TextLimits y máscaras fiscales salen del contrato/catálogo.
- El tipo fiscal empresarial pertenece al formulario; taxIdValidationMessage distingue largo/algoritmo; normalizar separadores antes de limitar, sin maxLength HTML de dígitos.
- Un alta/envío usa useIdempotentMutation desde apertura; [datos y API](datos-y-api.md) define cuerpo, clave, retry y abandono.
- useEditPage.onNavigationAttempt avisa sincrónicamente ruta/searchKeys aunque se bloquee; cancelar AbortSignal antes de decidir salida, crear otro dueño sólo al quedarse/cambiar grupo.
- Operaciones privadas retiran cuerpos/claves/callbacks al abandonar, revocar o limpiar caché, sin contextos UNSAFE_ ni inspección del router.
- Medidas, PhoneBand, FixedActions y hojas móviles: [responsive](responsive.md); coordinación de guardado/publicación: [sitio público](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md).
- **Una pantalla de ajustes se arma como Configuración** (traspaso 9): zonas a todo el ancho, una debajo de la otra, y «Guardar» en la banda, apagado sin cambios. Cada zona es una cosa que se guarda junta, como una conexión, con sus campos en el orden en que se completan y cada botón al lado de su dato (213). Sus campos siguen en columnas iguales por caja, no del ancho de lo que llevan (163; allá, PF1-A los mide por su contenido). Lo que se lee de una cuenta va en renglones de columnas fijas (el dato, el valor, su estado y su acción), la misma pieza en «Mi cuenta» y en la administración. Mientras carga, dibuja sus zonas, sin los botones de la banda (160, [datos y API](datos-y-api.md)).
- **Ninguna elección se descarta en silencio** (162, que generaliza la 113): cambiar un tipo, una acción o una opción conserva lo escrito que sigue sirviendo (el nombre, la ayuda, el mensaje), y lo que se pierde se avisa antes de cambiar, con lo que se va: «¿Cambiar a Número? Se quitan las 4 opciones.».
- **Un dato que sirve para dos cosas dice el estado de cada una:** «Verificado» es entrar con el número, y el chat y los avisos van aparte, con la acción que los arregla (159). Quitar va en rojo antes de confirmar, también un medio de ingreso, y las altas dicen «Agregar …».

## Prohibido
- Diálogo sobre diálogo, tabla en diálogo (salvo la revisión y la grilla de importar opciones, E12), confirmación irreversible con ✕, la de algo que destruye sin su acción en rojo lleno, o rojo lleno en algo que no destruye, como aprobar (161).
- Cambiar un tipo, una acción o una opción y perder lo escrito sin avisar (162).
- Paneles/filas expandidos salvo permisos y las zonas que escribe una etapa, como las de la carga (88), las de una pregunta de catálogo, que arrancan plegadas con su resumen (145), y los pasos del alta de ARCA, con los hechos plegados y los siguientes apagados (152); columnas distintas en una caja; controles a medio ancho sin contenido.
- Casillas sueltas, switch para guardar, ayudas no pedidas o error de formulario pasajero.
- Input number para montos, input date crudo, opciones/decimales locales o base tomada de un GET ajeno.
- Límites numéricos a mano en `maxLength={número}` o `.max(número)`: salen de `validationConstraints`; los rangos int32 también se generan del formato del contrato.

## Copiá de
- `src/areas/business/roles/pages/RoleEditorPage.tsx` (E4) y `src/areas/personal/account/components/AccountDeletionDialog.tsx` (E4).

## Lo verifica
- `submit-buttons.test.ts` (E7), `harness.test.ts` (E0): botones y formato/referencias; `validation-limits.test.ts` (C10): límites sin literales en áreas y módulos.

## Detalle
[Lienzo](../design/lienzo/README.md), [tema](../architecture/tema.md) y [responsive](responsive.md).
