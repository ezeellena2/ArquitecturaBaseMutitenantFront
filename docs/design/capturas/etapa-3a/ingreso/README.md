# Comparación visual de Ingreso · Etapa 3a

El manifest define 15 estados de Ingreso, cada uno con el tablero y la app a 1440 × 900 y 390 × 844. Las respuestas HTTP de la captura son de demostración; los casilleros de códigos se enmascaran en ambas imágenes. Los tests de pantalla prueban el recorrido y las decisiones por `code`.

Se compararon estructura, textos, orden, marca, panel derecho, controles, avisos y estados. La comparación detectó y permitió corregir el degradado y la cuadrícula del panel, los pictogramas, el aviso de sesión vencida, los mensajes de error, el ancho del código y los estados de reenvío.

## Diferencias justificadas con el tablero

- **WhatsApp (E8):** no aparece la pestaña ni el envío de código por WhatsApp. El texto informativo aprobado del panel derecho se conserva. Al faltar la pestaña, algunos controles quedan más arriba que en el tablero.
- **Recuperá tu cuenta (E5):** el enlace se oculta por decisión de producto.
- **Registrá tu empresa (E6):** se ocultan los enlaces del Ingreso de empresa y de los estados sin empresa/acceso inactivo por decisión de producto.
- **Estados de otras etapas:** el aviso de baja pedida nace en 3b, los cinco estados de operador con TOTP en E9 y el ingreso por WhatsApp en E8; por eso no tienen captura de la 3a. No se inventó un estado sustituto.
- **Botón del código:** permanece deshabilitado hasta completar los seis dígitos, aunque la muestra estática del lienzo lo presenta activo antes de ingresar el código. Lo exige la validación funcional del formulario.
- **Correo ya escrito:** la app conserva el correo de demostración tras un error para que se pueda reintentar; el estado estático del tablero muestra el campo vacío. Los contadores de reenvío también avanzan en la app mientras el tablero fija un instante de ejemplo.
