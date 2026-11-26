import { Fragment } from "react";

/**
 * Un correo, o un texto que puede serlo, que se parte en renglones donde lo parten los tableros: después de la @
 * («mariana.lopez@ / gmail.com») y, si el dominio solo tampoco entra, antes de uno de sus puntos («delta.ejemplo / .com»);
 * nunca en cualquier letra. Sin @, el texto va tal cual.
 */
export function EmailText({ value }: { value: string }) {
  const at = value.indexOf("@");
  if (at < 0) return <>{value}</>;
  const [first, ...rest] = value.slice(at + 1).split(".");
  return <>{value.slice(0, at + 1)}<wbr />{first}{rest.map((part, index) => <Fragment key={index}><wbr />{`.${part}`}</Fragment>)}</>;
}

/**
 * Una frase que puede nombrar un correo («¿Reenviar la invitación a julieta.molina@arquitecturabase.ejemplo.com?»): cada
 * palabra con @ se parte como `EmailText`, y lo demás va tal cual. Así un correo largo no ensancha un diálogo del teléfono.
 */
export function TextWithEmails({ value }: { value: string }) {
  if (!value.includes("@")) return <>{value}</>;
  return <>{value.split(/(\s+)/u).map((part, index) => part.includes("@") ? <EmailText key={index} value={part} /> : <Fragment key={index}>{part}</Fragment>)}</>;
}
