# Campos compartidos

Estos controles cargan opciones desde `../../referenceData/` y emiten códigos del contrato; no contienen listas de monedas, países, zonas o culturas.
Leé [formatos](../../../../docs/rules/formatos.md), [formularios](../../../../docs/rules/formularios.md), [datos y API](../../../../docs/rules/datos-y-api.md) y [accesibilidad](../../../../docs/rules/accesibilidad.md).
Copiá `CurrencySelect.tsx` y `CountrySelect.tsx` (E1); `FormField` asocia el rótulo al control interno.
Los tests homónimos prueban opciones, búsqueda, carga y navegación por teclado.
`TaxIdNumberField` pide solo el número con máscara y límite de dígitos del tipo recibido del catálogo. Normaliza antes de limitar; no usa `maxLength` HTML porque los separadores pegados no son dígitos. Los tests usan `userEvent.paste` para comprobar DNI con puntos y CUIT con espacios o puntos. `taxIdValidationMessage` distingue largo y algoritmo con stdnum y textos comunes, en es y en; CUIT/CUIL y DNI usan su propio algoritmo. La selección empresarial y la conservación de un dato guardado pertenecen al formulario consumidor.
`DateField.invalidMessage` conserva el mensaje común si no se pasa; un texto lo reemplaza y `null` cede la alerta a `FormField`, sin perder el estado inválido ni la validez del control.
