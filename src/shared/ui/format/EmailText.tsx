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
