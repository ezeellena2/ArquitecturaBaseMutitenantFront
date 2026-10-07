# A10 / R03 · Identificación fiscal de empresas

Fuente visual: lienzo v112 (`9c1c782`). Diez comparaciones a 1440 × 900 y 390 × 844, tablero a la izquierda y app a la derecha. A10 pide explícitamente distinguir longitud y verificador: `33333333333` tiene once dígitos, pero su verificador es inválido; `33333333339` es válido.

La app dice «Revisá el CUIT: son 11 números.» cuando falta longitud, y «Ese CUIT no es válido: revisá los números.» cuando falla el algoritmo. En Empresas, nombre, máscara, límite y algoritmo salen del tipo efectivo del catálogo para el país de la organización. La edición conserva el tipo y número guardados si el número no cambia. Sin tipo empresarial para el país, se oculta el campo y se conserva el número existente al editar otro dato. Registro mantiene su acuerdo de CUIT argentino opcional.

El tablero v112 sólo comprueba la longitud: los casos de verificador conservan el formulario antes de enviar. `M-Empresa` dibuja una hoja estática; la comparación usa su estado «Editar empresa», con el dato original. `M-Empresas` no dibuja la hoja de creación con error. Estas diferencias se muestran, sin editar ni simular estados nuevos en el lienzo. La barra de estado y el indicador inferior del tablero móvil pertenecen al teléfono. Los datos de miembros y el módulo WhatsApp del tablero conservan su referencia histórica.

| Pantalla / estado | 1440 | 390 |
|---|---|---|
| Editar empresa | [Comparación](empresas/empresa-editar-escritorio-1440x900-lado-a-lado.png) | [Comparación](empresas/empresa-editar-movil-390x844-lado-a-lado.png) |
| Editar: verificador incorrecto | [Comparación](empresas/empresa-editar-cuit-verificador-escritorio-1440x900-lado-a-lado.png) | [Comparación](empresas/empresa-editar-cuit-verificador-movil-390x844-lado-a-lado.png) |
| Crear: longitud incorrecta | [Comparación](empresas/empresas-crear-cuit-mal-escritorio-1440x900-lado-a-lado.png) | [Comparación](empresas/empresas-crear-cuit-mal-movil-390x844-lado-a-lado.png) |
| Registro de empresa | [Comparación](registro/registro-empresa-escritorio-1440x900-lado-a-lado.png) | [Comparación](registro/registro-empresa-movil-390x844-lado-a-lado.png) |
| Registro: verificador incorrecto | [Comparación](registro/registro-empresa-cuit-verificador-escritorio-1440x900-lado-a-lado.png) | [Comparación](registro/registro-empresa-cuit-verificador-movil-390x844-lado-a-lado.png) |

Las capturas usan fixtures visuales para conservar los datos del tablero. El E2E con front/API/PostgreSQL/correo reales se verifica por separado, sin mocks.

Desde el front:

```powershell
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7-a10/empresa-editar-cuit-verificador-escritorio --vite http://127.0.0.1:5191
node scripts/recorrido-lienzo/vivo.mjs consolidacion/pre7-a10/empresa-editar-cuit-verificador-movil --vite http://127.0.0.1:5191
```

Para Registro, reemplazá el caso por `registro-empresa-cuit-verificador-escritorio` o `registro-empresa-cuit-verificador-movil`. Los otros estados usan sus mismos identificadores de la tabla.
