# Campos compartidos

Estos controles cargan opciones desde `../../referenceData/` y emiten códigos del contrato; no contienen listas de monedas, países, zonas o culturas.
Leé [formatos](../../../../docs/rules/formatos.md), [formularios](../../../../docs/rules/formularios.md), [datos y API](../../../../docs/rules/datos-y-api.md) y [accesibilidad](../../../../docs/rules/accesibilidad.md).
Copiá `CurrencySelect.tsx` y `CountrySelect.tsx` (E1); `FormField` asocia el rótulo al control interno.
Los tests homónimos prueban opciones, búsqueda, carga y navegación por teclado.
`TaxIdNumberField` pide solo el número con máscara y límite de dígitos del tipo recibido del catálogo. Normaliza antes de limitar; no usa `maxLength` HTML porque los separadores pegados no son dígitos. Los tests usan `userEvent.paste` para comprobar DNI con puntos y CUIT con espacios o puntos. `taxIdValidationMessage` distingue largo y algoritmo con stdnum y textos comunes, en es y en; CUIT/CUIL y DNI usan su propio algoritmo. La selección empresarial y la conservación de un dato guardado pertenecen al formulario consumidor.
`DateField.invalidMessage` conserva el mensaje común si no se pasa; un texto lo reemplaza y `null` cede la alerta a `FormField`, sin perder el estado inválido ni la validez del control.

`MonthField` es el selector central de períodos `YYYY-MM` requerido por T13 (E8b); su consumidor de Uso se conecta en ese corte. El botón abre un solo popup `dialog`, con año editable y `listbox` de meses. No limita la historia: permite años 0001–9999 y no elige un período por el usuario. `useFormat` valida, localiza los nombres y obtiene el mes actual en la zona efectiva de presentación. `null` es vacío; un valor inválido se anuncia y comunica `onValidityChange(false)`, para que un formulario opcional no lo acepte como vacío. Un cambio del valor controlado, deshabilitar o cargar desmonta el popup y su borrador de año.
