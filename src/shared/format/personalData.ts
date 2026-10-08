const hidden = "•••";

/** PersonalDataMask.Phone del backend: sólo los últimos cuatro dígitos, también si ya está oculto. */
export function maskPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  return digits.length < 4 ? "••••" : `•••• ${digits.slice(-4)}`;
}

/**
 * El correo tapado de los tableros («Te mandamos un código a lu•••@gmail.com», Cuenta-Verificar y Cuenta-Baja): dos letras,
 * «•••» y el dominio; una sola letra si lo de antes de la @ es corto. Es el mismo que arma `PersonalDataMask.Email` en el
 * back (datos-personales.md). Lo que ya viene tapado no muestra más; sin una @ válida, no muestra nada.
 */
export function maskEmail(value: string): string {
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return hidden;
  let visible = at > 2 ? 2 : 1;
  const masked = value.slice(0, at).search(/[•*]/u);
  if (masked >= 0 && masked < visible) visible = masked;
  return `${value.slice(0, visible)}${hidden}${value.slice(at)}`;
}
