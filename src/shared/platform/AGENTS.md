Piezas de Plataforma que usan varias features, sin importar APIs de un área (Etapa 5).
Leé [formularios](../../../docs/rules/formularios.md), [errores](../../../docs/rules/errores.md),
[pantallas y UI](../../../docs/rules/pantallas-y-ui.md) y [accesibilidad](../../../docs/rules/accesibilidad.md).
Copiá [ReasonDialog.tsx](ReasonDialog.tsx): se monta sólo abierto, compone las piezas comunes sin medidas propias; pide motivo y opcionalmente una fecha civil; el bloqueo conocido oculta los campos. Sin ✕ también en acciones principales.
`mutationFn` usa la API de quien lo monta; `onSuccess` recibe la respuesta original antes del cierre, también en el
reintento global. La pantalla toma la versión respondida como próxima base y nunca la de una relectura de fondo.
El 409 de concurrencia y los códigos de estado que declare el caller releen `queryRoot` al cerrar (`useDialogFailure`).
Textos comunes en `common:reasonDialog`, en es y en; cada pieza tiene su test al lado.
