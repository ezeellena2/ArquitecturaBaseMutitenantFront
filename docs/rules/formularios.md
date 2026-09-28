# Formularios

**Regla:** lo corto se edita en un **diálogo** y lo largo en una **pantalla propia**. Cada campo usa su field tipado de `shared/ui/fields` y el error del servidor se ubica en su campo.

## Cómo se hace
- **Diálogo:**
  - `Dialog` con título, campos en dos columnas (un campo largo ocupa las dos), y botonera;
  - `useRestoreFocusOnClose`;
  - se monta solo mientras está abierto.
- **Pantalla:**
  - `Page` con `backTo`, `useUnsavedChangesGuard` y "Cambios sin guardar" en la cabecera;
  - el formulario es una sola hoja a ancho completo, en dos columnas, y lo asignado va debajo, en su tarjeta (como los permisos en el editor de roles).
- **Validación:** `react-hook-form` + `zod` cuando hay reglas; en un diálogo simple, un draft en `useState`. Los mensajes salen de i18n.
- **Campos:** `FormField` (rótulo, control, error, `aria-describedby`) + el field del tipo (`MoneyField`, `DateField`, `PercentField`…). El control más simple para cada dato: pocas opciones → `Select`; varias a la vez → `MultiSelect`.
- **Errores del servidor:** `applyApiErrorToForm`; lo general va en `<FormError>`.
- **Campos por tipo de dato:** `EmailField` (trim y minúsculas al escribir), `PhoneField` ([telefonos](telefonos.md)), `TaxIdField` (tipo + número, validado con `stdnum`), `MoneyField`, `DateField`… El `maxLength` de cada texto sale del contrato generado (`TextLimits` del back), nunca de un número escrito a mano.
- **Envío sin duplicados:** el guardado de un alta o un envío usa `useIdempotentMutation` ([datos-y-api](datos-y-api.md)). La clave nace al abrir el formulario.
- **Ediciones simultáneas:** el formulario guarda la `version` que vino en la ficha y la manda al guardar. Si vuelve 409 `General.ConcurrencyConflict`:
  - aparece el `ConcurrencyBanner` debajo de la banda: "Otra persona cambió esto mientras lo editabas";
  - hay dos acciones: **"Ver lo nuevo"** (recarga la ficha y descarta lo tuyo, pidiendo confirmación si había cambios) y **"Seguir editando"** (cierra el aviso; el próximo guardado vuelve a dar 409 hasta recargar).
  
  Nunca se reintenta solo.
- **Teléfono:** en el teléfono, el formulario es de una sola columna. El diálogo se abre como una hoja desde abajo que ocupa casi toda la altura, con los botones a lo ancho abajo. En una pantalla de edición, «Cancelar» y «Guardar» van en una barra fija abajo ([responsive](responsive.md)).

## Prohibido
- Un diálogo sobre otro, o una tabla dentro de un diálogo.
- Paneles desplegables o filas que se expanden.
- Textos de ayuda que nadie pidió.
- `<input type="number">` para montos, o `<input type="date">` crudo.

## Copiá de
- `src/areas/business/roles/pages/RoleEditorPage.tsx` (E4) · `src/areas/business/users/components/InviteUserDialog.tsx` (E6)

## Lo verifica
- Tests de pantalla: el recorrido del diálogo y un error del servidor ubicado en su campo.
- `parsers.test.ts` (E1).

## Detalle
[frontend.md §4, "UI y pantallas"](../architecture/frontend.md#ui-y-pantallas) · [tema.md](../architecture/tema.md) · [lienzo versionado v35](../design/lienzo/README.md): tablero «Rol» (pantalla larga con «Cambios sin guardar») y nota «estilo» (lo corto en un diálogo de 560)
