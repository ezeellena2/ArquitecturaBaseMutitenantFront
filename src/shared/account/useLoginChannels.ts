import { useQuery } from "@tanstack/react-query";
import { getLoginMethods, loginMethodsQueryKey } from "./api/loginChannels";

/// Si se puede entrar con ese canal: «whatsapp» existe solo con el módulo de WhatsApp (modulos.md). Mientras carga, o si
/// no responde, no está.
export function useHasLoginChannel(key: string): boolean {
  const { data } = useQuery({ queryKey: loginMethodsQueryKey, queryFn: getLoginMethods, meta: { silent: true } });
  return data?.channels.some((channel) => channel.key === key) === true;
}
