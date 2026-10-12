# Formatos: catálogo común de presentación
**Regla:** mostrar con shared/ui/format y cargar con shared/ui/fields. Solo shared/format formatea; el back usa DisplayFormatter con cultura y zona explícitas. Ambos consumen los mismos [casos](../../../ArquitecturaBaseMutitenant/docs/contracts/format-cases.json).
## Cómo se hace
- useFormat resuelve cultura efectiva, zona de `/api/me` y moneda del dato; sin sesión, relaciones del catálogo.
- Los instantes se comparan con `shared/time`: el reloj toma `Date` de cada respuesta API y avanza con `performance.now`, independiente de la fecha del dispositivo. Las esperas de reenvío usan tiempo monotónico y su texto m:ss sale de `shared/format/countdown`.
- Cultura: cuenta → selección del navegador → predeterminada habilitada. Define idioma y formato a la vez.
- La zona en pantalla es la de la cuenta en los tres accesos; fechas civiles y períodos no se convierten.
- La moneda del dato es explícita; DefaultCurrency solo precarga un importe nuevo.
- shared/referenceData entrega todas las filas traducidas con isEnabled; los selectores ofrecen habilitadas y el formato acepta valores guardados deshabilitados.
- Cultures aporta patrones, separadores y AmDesignator/PmDesignator; cultureProfiles adapta sin perfiles fijos por cultura.
- Currencies aporta MinorUnits; CurrencyTranslations, DisplaySymbol. Símbolos alfabéticos pegados al número reciben espacio CLDR.
- El signo se decide tras redondear: un negativo presentado como cero no lleva menos. Compactos/tamaños promueven unidad al llegar a mil.
- parseDecimal permite hasta 15 dígitos significativos y exige que Number recomponga el valor canónico. Si pierde precisión, conserva texto, emite null y marca invalidez.
- DataTable toma tipo, alineación, vacío y tooltip de cada columna; números, montos y porcentajes van a la derecha con tabular-nums.
- Fuera de tablas se usan los componentes; useFormat sirve fuera de JSX, por ejemplo en aria-label.
| Dato | Pieza | Presentación y límite |
|---|---|---|
| Fecha | DateText, date | es-AR 27/09/2026; en-US 09/27/2026; tooltip absoluto |
| Fecha y hora | DateText, dateTime | es-AR 27/09/2026 14:35; en-US 09/27/2026 2:35 PM, sin coma |
| Fecha corta | shortDate / shortDateTime | Solo listas del teléfono y año actual en la zona personal; otro año lleva año |
| Hora / fecha larga | time / long | 14:35 / 2:35 PM; 27 de septiembre de 2026 / September 27, 2026 |
| Relativa | relative | Actividad/último ingreso, menos de siete días; después fecha; tooltip absoluto |
| Calendario | formatCalendar | Tarjeta Auditoría de Inicio: hoy/ayer con hora, otro día solo fecha |
| Rango | DateRangeText | Dos fechas separadas por guion largo con espacios |
| Entero / decimal | NumberText | Miles y decimal de cultura; decimal con escala fija declarada |
| Cantidad | quantity | Cero a tres decimales, sin ceros sobrantes |
| Porcentaje | PercentText | Fracción 0.125 → 12,5 % / 12.5%; hasta dos decimales |
| Moneda | MoneyText | MinorUnits y símbolo de cultura; extranjera con código/prefijo; negativo sin paréntesis |
| Compacto | compact | Solo KPI con tooltip completo; 1,3 M / 1.3M |
| Tamaño / duración | FileSizeText / DurationText | bytes → 1,5 MB / 1.5 MB; segundos → 2 h 15 min |
| Teléfono | PhoneText / PhoneField | E.164; nacional si corresponde al país de cultura, internacional en otro caso |
| Zona | TimeZoneText / TimeZoneSelect | Ciudad traducida y offset actual; nunca ID crudo; orden por SortOrder, offset y ciudad |
| Cultura | CultureText / CultureSelect | Nombre del catálogo; selector en lengua propia con nombre traducido de respaldo |
| Fiscal | TaxIdText / TaxIdNumberField | Máscara/etiqueta de TaxIdTypes; entrada sin separadores; validación stdnum |
| Correo | EmailField / texto | Trim, NFC, minúsculas, IDN legible y límites UTF-8 del contrato |
| Estado / enum | EnumText / StatusBadge | enums.<Enum>.<Valor>; tono registrado una vez por feature o en shared si se comparte |
| Booleano | BooleanText | Sí/No o Yes/No; en tabla de estado se puede usar StatusDot |
| Vacío | EmptyValue | null → raya larga tenue, aria-label Sin dato |
| Texto | texto | Tal cual; largo truncado con elipsis y tooltip |
- DateField emite DateOnly sin zona; DateTimeField convierte desde zona efectiva a UTC; PercentField devuelve fracción.
- Los fields leen opciones del catálogo y muestran carga; TaxIdNumberField normaliza separadores antes de limitar dígitos.
- MonthField usa YYYY-MM, años 0001–9999, popup único accesible, sin limitar historia ni elegir por la persona.
- parseMonth distingue vacío e inválido; useFormat localiza meses y obtiene mes actual con reloj central y zona efectiva, sin definir facturación.
- Deshabilitar, cargar o cambiar el valor de MonthField desmonta popup/borrador; invalidez no se acepta como vacío.
- MoneyField precision="technical-tariff" conserva seis decimales y rechaza siete ([ADR 0051](../../../ArquitecturaBaseMutitenant/docs/decisions/0051-precision-tecnica-de-costos-ia.md)); presupuestos y presentación mantienen MinorUnits.
- LoginMethodText conserva máscaras recibidas; un Phone completo delega en PhoneText sin enlace ni reconstrucción.
- defineStatusTones exige un tono por enum; StatusMark presenta solo el punto. Colores y tonos salen del [tema](../architecture/tema.md).
- formatTimeZone obtiene offset con cultura fija de Intl; la ciudad viene traducida, sin interpretar texto localizado del navegador.
- Fechas usan time con dateTime ISO; montos con símbolo ambiguo llevan código monetario en aria-label.
- Sumar cultura agrega fila, traducciones, i18n y casos; expected/error del contrato manda sobre variantes de librerías.
## Prohibido
- toLocaleString, toLocaleDateString, toFixed, Intl o new Date para mostrar fuera de shared/format y shared/time.
- Date.now y Date.parse fuera de shared/time.
- libphonenumber-js fuera de shared/phone y shared/format; nombres de países con Intl.DisplayNames.
- Arrays/switch de monedas, culturas, países, zonas o tipos fiscales; calcular dinero/reglas de negocio en el front.
- Sustituir null por N/A, guion corto, cadena vacía o cero; enums sin traducir; formatos sueltos en JSX.
## Copiá de
- `src/areas/business/roles/columns.tsx` (E4), `src/shared/ui/format/` y `src/shared/ui/fields/` (E1).
## Lo verifica
- `format-usage.test.ts` (E1), `statusTones.test.ts` (E7)
## Detalle
[Datos de referencia](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md) y [números y moneda](../../../ArquitecturaBaseMutitenant/docs/rules/numeros-y-moneda.md).
