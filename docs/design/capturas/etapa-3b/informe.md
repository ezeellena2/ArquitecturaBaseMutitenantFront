# Etapa 3b · Comparación de La cuenta

## Correcciones verificadas

- Los botones de confirmación de los diálogos siguen el lienzo: permiten confirmar con un código incompleto y muestran «Escribí los 6 números del código.». La validación local evita enviar un código incompleto. Baja muestra además el error de motivo. Tres tests existentes fallaron antes del cambio; los cuatro casos dirigidos pasaron después.
- El reintento de un 429 requiere pulsar el mismo botón después de la cuenta regresiva. No hay reenvío automático ni control agregado.
- Durante la cancelación de baja, «Salir» y «Cancelar la baja y entrar» quedan deshabilitados, como Ingreso. El test funcional falló antes y pasó después.

## Comparación visual

En revisión final. El manifest contiene 118 pares app/lienzo, con los estados de Cuenta, M-Cuenta, Aceptar-Terminos, M-Aceptar-Terminos, Ingreso, M-Ingreso, Inicio-Personal y Mensajes. Los correos usan HTML del renderer real en es/en; el arnés visual no conecta bases. El E2E real es independiente y usa PostgreSQL y pickup propios, sin mocks.
