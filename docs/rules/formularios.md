# Formularios

**Regla:** lo corto se edita en un **diálogo** y lo largo en una **pantalla propia**. Cada campo usa su field tipado de `shared/ui/fields` y el error del servidor se ubica en su campo. Mandan los tableros validados `Criterio-Formularios` y `Criterio-Dialogos`.

## Cómo se hace
- **Diálogo:**
  - `Dialog` con título, campos en dos columnas (un campo largo ocupa las dos), y botonera;
  - `useRestoreFocusOnClose`;
  - se monta solo mientras está abierto.
- **Pantalla:**
  - `Page` con `backTo`, `useUnsavedChangesGuard` y «Cambios sin guardar» en la segunda línea de la banda;
  - **una caja por tema** (`Section`), con el título en el encabezado arena; lo asignado va debajo, en su propia caja (como los permisos en el editor de roles);
  - **editar algo que ya existe** lleva «Descartar cambios», que vuelve a lo guardado sin salir de la pantalla, y «Guardar cambios»; **crear algo nuevo** lleva «Cancelar», que vuelve (con «¿Salir sin guardar?» si hay cambios), y la acción («Crear rol»).
- **Validación:** `react-hook-form` + `zod` cuando hay reglas; en un diálogo simple, un draft en `useState`. Los mensajes salen de i18n.
- **Campos:** `FormField` (rótulo, control, error, `aria-describedby`) + el field del tipo (`MoneyField`, `DateField`, `PercentField`…). El control más simple para cada dato: pocas opciones → `Select`; varias a la vez → `MultiSelect`.
- Los campos miden 36 px (en el teléfono, 48 con letra de 16) y el código, 44; el rótulo va arriba, con asterisco rojo si es obligatorio. Dentro de una caja, **dos columnas iguales** que ocupan todo el ancho, con las mismas columnas en todas las filas; tres solo si todos los datos son cortos, como en «Tus datos» de Mi cuenta; un texto largo ocupa las dos. Lo que es una lista (correos, dominios, empresas) va en una caja de lista, que se lee: cambiar una fila o sumar otra abre un diálogo chico. Sin ayudas debajo ni ejemplos adentro; el error aparece debajo del control inválido.
- **Permisos de un rol:** la única lista con grupos que se abren y se cierran. Cada grupo tiene su casilla de «todos» y la cuenta («3 de 3»); al entrar están abiertos los que tienen algo marcado.
- Lo que no se edita se muestra como texto, no como control deshabilitado. En una edición, solo «Guardar cambios» se deshabilita si no hay diferencias; «Descartar cambios» sigue disponible.
- **Edición inválida:** `MoneyField`, `NumberField`, `PercentField`, `DateField`, `DateTimeField` y `TimeField` conservan el texto escrito para corregirlo, pero emiten `onChange(null)` y `onValidityChange(false)` apenas falla el parseo, para que el formulario no conserve el valor anterior. El control queda inválido para el envío; el mensaje y el estado visual aparecen después de salir del campo. Al corregirlo emiten el valor parseado y `onValidityChange(true)` y retiran el error.
- **Errores del servidor:** `applyApiErrorToForm`; lo general va en `<FormError>`.
- **Campos por tipo de dato:** `EmailField` (trim y minúsculas al escribir), `PhoneField` + `CountrySelect` ([telefonos](telefonos.md)), `MoneyField` + `CurrencySelect`, `TimeZoneSelect`, `CultureSelect`, `DateField`… Sus opciones salen de `shared/referenceData`; mientras carga el catálogo muestran estado de carga. `TaxIdField` toma los tipos de `TaxIdTypes`, valida en E1 solo con `stdnum` y emite `{ type, number }` con `type = TaxIdTypes.Code` (por ejemplo, `AR-CUIT`) y `number` sin separadores; el value object y el contrato de salida `{ country, type, number }` del back llegan en E6. El `maxLength` de cada texto sale del contrato generado (`TextLimits` del back), nunca de un número escrito a mano.
- **Búsqueda en selectores:** `CountrySelect`, `CurrencySelect`, `TimeZoneSelect` y `CultureSelect` filtran las opciones disponibles sin ocultar el valor ya elegido en el control. Cada buscador anuncia su objeto (país, moneda, zona horaria o cultura). La etiqueta del valor elegido sale de cualquier fila del catálogo, incluso si luego quedó deshabilitada; la lista de nuevas opciones muestra solo filas habilitadas.
- **Envío sin duplicados:** el guardado de un alta o un envío usa `useIdempotentMutation` ([datos-y-api](datos-y-api.md)). La clave nace al abrir el formulario.
- **Ediciones simultáneas:** el formulario guarda la `version` que vino en la ficha y la manda al guardar. Si vuelve 409 `General.ConcurrencyConflict`:
  - aparece el `ConcurrencyBanner` debajo de la banda: "Otra persona cambió esto mientras lo editabas";
  - hay dos acciones: **"Ver lo nuevo"** (recarga la ficha y descarta lo tuyo, pidiendo confirmación si había cambios) y **"Seguir editando"** (cierra el aviso; el próximo guardado vuelve a dar 409 hasta recargar).
  
  Nunca se reintenta solo.
- **Teléfono** (tableros M-*): el formulario es de una sola columna, en grupos blancos sobre gris o con los campos sueltos (`Section`). El diálogo se abre como una hoja desde abajo, con manija y botones de 48 a lo ancho. En una pantalla de edición, «Descartar cambios» y «Guardar cambios» (al crear, «Cancelar» y la acción) van fijos abajo (`FixedActions`); una fila con «›» abre una hoja para elegir ([responsive](responsive.md)).

## Prohibido
- Un diálogo sobre otro, o una tabla dentro de un diálogo.
- Una confirmación destructiva con botón de cierre ✕ o acción primaria que no sea sólida roja.
- Paneles desplegables o filas que se expanden, salvo los grupos de permisos de un rol.
- Campos a medio ancho con el resto de la caja vacío, o filas con columnas distintas en la misma caja.
- Listas de casillas sueltas: van en un desplegable con casillas.
- Un interruptor en un formulario que se guarda: ahí va una casilla.
- Avisar un error de formulario con un aviso que desaparece.
- Textos de ayuda que nadie pidió.
- `<input type="number">` para montos, o `<input type="date">` crudo.
- Un array de opciones o decimales de moneda dentro de un componente; pertenecen a los [datos de referencia](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md).

## Copiá de
- `src/areas/business/roles/pages/RoleEditorPage.tsx` (E4) · `src/areas/business/users/pages/UsersPage.tsx` (E6: diálogo Invitar integrado en el listado)

## Lo verifica
- Tests de pantalla: el recorrido del diálogo y un error del servidor ubicado en su campo. `RoleEditorPage.test.tsx` (E5): al editar, «Descartar cambios» vuelve a lo guardado sin salir; al crear, «Cancelar».
- `parsers.test.ts` (E1).
- `referenceData.test.ts` (E1) y tests de los selectores (E1): opciones del catálogo, carga y `{ type: "AR-CUIT", number }` sin separadores.
- Tests de `shared/ui/fields`: borrado del valor anterior ante texto inválido, aviso tras blur y recuperación de validez al corregir.

## Detalle
[frontend.md §4, "UI y pantallas"](../architecture/frontend.md#ui-y-pantallas) · [tema.md](../architecture/tema.md) · [lienzo vigente](../design/lienzo/README.md): tableros «Criterio · Formularios y campos», «Criterio · Diálogos» y «Criterio · Botones», y «Rol», «Configuración», M-Rol y M-Configuracion como ejemplos (una caja por tema, filas del ancho de la caja, «Cambios sin guardar», «Descartar cambios»)
