# E8 · Preparación de galería N2/N3 y guiones

Catálogo preparado, **sin capturas nuevas ni ejecución de la puerta integral**. Conserva las 108 definiciones anteriores y suma 36 casos en 1440 × 900 y 390 × 844: 144 en total. Los PNG, el manifiesto y el índice históricos permanecen separados y conservan su fuente original.

La fuente aprobada para el siguiente pase es **v116, `21f227bcf6fd7a910272c682d5085338f8e2039c`**. El generador extrae esa revisión de Git en `.local/canvas-e8-<commit>` y sirve esa copia; no usa el WIP de v117. La extracción puede convertir LF a CRLF según Git en Windows: el test compara el contenido normalizado a LF contra el blob publicado. No se dibuja ni modifica ningún tablero.

N2 (`c7553381`) y N3 (`cb96e6e3`) aplican las decisiones posteriores sobre identidad. El runner real preparado en `9e1e4b9c` consume el IPC publicado de Back `0c9f0afb`; sus 38 grupos todavía requieren ejecución en la puerta final coordinada.

## Comparaciones añadidas

| Familia | Variantes | Casos | Referencia aprobada |
|---|---|---:|---|
| N2 · Cuentas | Phone principal sin/con nombre y Email verificado de respaldo; Email principal con Phone de respaldo; identidad recibida vacía | 8 | Cuentas / M-Cuentas |
| N2 · Ficha | Las mismas cuatro variantes, métodos y acciones según el DTO | 8 | Cuenta-Plat / M-Cuenta-Plat, Persona y Métodos de ingreso |
| N3 · Menú personal / Más | Las mismas cuatro variantes | 8 | Cuenta con menú abierto / M-Mas-Personal |
| N3 · Lateral / Cuenta y barra móvil | Phone principal sin/con nombre y respaldo Email | 4 | Cuenta / M-Cuenta |
| N3 · Empresa | Phone principal sin/con nombre; Me conserva el correo administrado de Grupo Delta | 4 | Cuenta con menú abierto / M-WA-Menu |
| N3 · Página pública | Phone principal sin/con nombre, identidad global y retorno al dominio principal | 4 | Pagina-Publica / M-Pagina-Publica, Publicada con sesión |

## Diferencias de datos y decisiones tomadas

v116 no tiene un Tweak para Phone principal sin nombre. Las referencias conservan ejemplos con nombre/correo; los casos nuevos comparan disposición, componentes y estados existentes con las variantes aprobadas de N2/N3. Cada entrada declara esta diferencia en `note`, que aparece en el índice. No se atribuye aprobación a v117 ni se promete igualdad de píxeles.

La prioridad es nombre → máscara principal recibida → correo → Sin dato. El nombre conserva su inicial y, con Phone principal, muestra la máscara como contacto. Sin nombre, Phone muestra esa máscara y una raya con Avatar apagado, sin repetir la máscara ni usarla como inicial. Phone secundario no aporta `maskedPrimaryPhone`. La máscara se muestra literalmente; nunca pasa por PhoneText ni se reconstruye como E.164.

El respaldo Email está verificado en los fixtures de métodos. Con Phone principal, la copia `Me.email`/`primaryEmail` puede ser null según el contrato; no se inventa un correo principal. El caso Empresa conserva el correo administrado real de su fixture para verificar que la identidad global Phone tenga prioridad. La variante sin identidad comprueba el vacío recibido; no acredita una nueva conducta del backend ni un estado nuevo del lienzo.

La lista móvil reutiliza las ocho filas de su fixture existente; la de escritorio conserva su paginado. Los horarios se fijan en el instante de comparación de los ejemplos. El marco Persona de Cuenta v116 es referencia del componente de cuenta global cuando el acceso actual es Empresa: no cambia los perfiles, la navegación ni los permisos. Mensajes, atención E11 y TOTP quedan fuera de esta preparación.

## Matriz de guiones para la puerta final

Los [recorridos publicados](../../recorridos/README.md), corte `a306c35f`, son el guion reproducido en la [guía versionada](../../guia/README.md). Se cotejaron sus JSON de ingreso WhatsApp, bot/enlace, agregar WhatsApp y recuperación asistida. Esta matriz distingue el runner preparado de las comprobaciones manuales pendientes; ningún paso se cuenta como aprobado por preparar fixtures o tests del generador.

| Guion / hito | Runner E8 preparado | Galería / recorrido pendiente |
|---|---|---|
| `ingresar-por-whatsapp`: número, código, verificar, Inicio | UI → login-code 202 → OTP privado → verify 200 → OIDC state/PKCE → Persona/F5; A1 también conserva el número desde Registro ocupado | Recorrido con sesión continua y galería de Ingreso; recepción/copiar en WhatsApp real por Integración |
| `el-bot-y-su-enlace`: Hola, enlace, vista previa y Continuar | Webhook HMAC/deduplicación/outbox reales del fixture; preview sin sesión; redeem único → OIDC/F5; enlace usado rechazado | Recorrido operativo Meta, entrega y botón Copiar; comparación de Enlace y estado sin nombre |
| `agregar-un-whatsapp`: agregar, código y verificar | Mi cuenta real → POST método → OTP/error/verify 204/F5; Principal/Quitar sin OTP adicional por ADR0045 | Recorrido de ocupado bajo PhoneField y países de la API; galería de Cuenta y diálogos |
| `atender-una-recuperacion`: Pending, revisar y decidir | N1: GET UI y formulario abierto → servicio real de aviso/marca/outbox → repetición sin avisos nuevos → único approve/reject con versión original → F5 persistido | Recorrido humano y galería de recuperaciones; transporte Meta aparte. Sin recarga/rebase para ocultar una carrera |
| N2: Cuentas y ficha con Phone principal + Email de respaldo | Email agregado/verificado por UI; GET paged/detail desde navegación y búsqueda UI; correlación por Me.id, máscara, acciones y F5 | Los 16 casos nuevos y revisión manual de título, contacto, métodos, avatar y acciones |
| N3: cuenta global en Persona/Empresa | GET Me/F5; máscara y raya apagada en menú/sidebar/Más/BottomNav, incluso con Email de respaldo | Los 20 casos nuevos; página pública con subdominio/retorno principal, datos con/sin nombre y vacío |

`recorrido-usuario.mjs` conserva el recorrido E7. No se agrega otro runner ni se convierte ese pase en evidencia E8. El fixture privado prohíbe transportes externos: sus OTP, outbox y sesiones reales no acreditan entrega `delivered` por Meta. La puerta final debe registrar por separado esos límites.

## Comandos preparados

Preparar el catálogo en una carpeta aparte, sin navegador, capturas ni modificación del índice histórico:

```powershell
node scripts/capturar-etapa-8.mjs --manifiesto --output .local/e8-n2-n3-gallery
node scripts/generar-galeria-etapa-8.mjs .local/e8-n2-n3-gallery
node --test scripts/capturar-etapa-8.test.mjs
```

El índice preparado debe mostrar **0/144**, no una galería ejecutada. En el corte final coordinado, con ambos checkouts fijados y los contratos regenerados/cotejados, levantar la app local:

```powershell
$env:VITE_AUTH_ISSUER = 'http://localtest.me:5192'
$env:MT_E2E_ISOLATED = '1'
npm run dev -- --host 127.0.0.1 --port 5192
```

Luego capturar y verificar **en una carpeta nueva**, para conservar las imágenes y la metadata históricas:

```powershell
node scripts/capturar-etapa-8.mjs --app-url http://localtest.me:5192 --output docs/design/capturas/etapa-8-final
node scripts/capturar-etapa-8.mjs --verify --output docs/design/capturas/etapa-8-final
```

Los filtros pertinentes son `--group cuentas-plataforma,identidad`; sirven para repetir esos casos, pero no sustituyen el catálogo completo ni la revisión humana final. `--browser-path` admite un binario ya instalado. El E2E real entra por `npm run test:e2e:real`, con los actores, PostgreSQL, OIDC y el IPC aislados de Back; no se ejecuta desde la preparación visual. Suites completas, documentos en 0, galería, recorrido y revisión independiente corresponden a la única puerta final. E8 sigue abierta y no se realiza push.
