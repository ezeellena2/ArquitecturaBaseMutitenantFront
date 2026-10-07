import { CircleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { initials } from "@/shared/lib/initials";
import { BrandMark } from "@/shared/ui/BrandMark";
import { FixedActions } from "@/shared/ui/app/FixedActions";
import { Button } from "@/shared/ui/button";

export type SessionStatusPageProps =
  | { status: "starting" | "closing"; targetName?: never; loginPath?: never; onRetry?: never }
  | { status: "switching"; targetName: string; loginPath?: never; onRetry?: never }
  | { status: "error"; targetName?: never; loginPath?: string; onRetry?: () => void };

export function SessionStatusPage(props: SessionStatusPageProps) {
  const { t } = useTranslation("auth");
  const phone = useMediaQuery("(max-width: 767px)");
  const isError = props.status === "error";
  const title = props.status === "switching"
    ? t("session.switching.title", { targetName: props.targetName })
    : t(`session.${props.status}.title`);
  const detail = props.status === "starting" || isError
    ? t(`session.${props.status}.detail`)
    : null;

  const backToLogin = t("session.error.backToLogin");

  // Tablero M-Sesion: en el teléfono la pantalla es blanca y sin la marca arriba. Al entrar o salir, la marca grande y
  // un giro chico; al cambiar de lado, las iniciales con el giro alrededor; si falla, «Volver a ingresar» fijo abajo.
  if (phone) return <main className="flex min-h-dvh flex-col bg-[var(--lado-activo)] text-[var(--t1)]">
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      {isError ? <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-[var(--peligro-t)] text-[var(--peligro)]">
        <CircleAlert size={28} strokeWidth={1.75} />
      </span> : props.status === "switching" ? <span aria-hidden="true" className="relative inline-flex size-[84px] items-center justify-center">
        <span className="inline-flex size-[66px] items-center justify-center rounded-full bg-[var(--marca-t)] text-[22px] font-bold text-[var(--marca-tx)]">{initials(props.targetName)}</span>
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-[var(--borde)] border-t-[var(--marca)] [animation-duration:1.1s]" />
      </span> : <>
        <BrandMark className="size-[76px]! rounded-[22px]! [&>span]:inset-[21px]! [&>span]:rounded-[5px]! [&>span]:border-[5px]!" />
        <span aria-hidden="true" className="mt-[18px] size-[26px] animate-spin rounded-full border-[3px] border-[var(--borde)] border-t-[var(--marca)] [animation-duration:0.9s]" />
      </>}
      <h1 className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.015em]">{title}</h1>
      {detail ? <p className="text-[15px] leading-normal text-[var(--t2)]">{detail}</p> : null}
    </div>
    {/* M-Sesion (.cb.cb-pri): el botón principal, con su degradé y su sombra. */}
    {isError ? <FixedActions>
      {props.onRetry ? <Button type="button" onClick={props.onRetry}>{backToLogin}</Button>
        : <Button asChild><Link to={props.loginPath ?? "/login"}>{backToLogin}</Link></Button>}
    </FixedActions> : null}
  </main>;

  return (
    <main className="relative min-h-dvh bg-[var(--fondo)] text-[var(--t1)]">
      <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="absolute left-6 top-6 flex items-center gap-2.5 text-[17px] font-bold md:left-12 md:top-8">
          <BrandMark />
          {t("brand")}
        </span>
        {isError ? (
          <span className="flex size-[52px] items-center justify-center rounded-full bg-[var(--peligro-t)] text-[var(--peligro)]" aria-hidden="true">
            <CircleAlert size={20} strokeWidth={1.75} />
          </span>
        ) : (
          <span className="size-10 animate-spin rounded-full border-[3px] border-[var(--marca-t)] border-t-[var(--marca)]" aria-hidden="true" />
        )}
        {/* Tablero Sesion: el título y el texto con la altura normal de su letra. */}
        <div>
          <h1 className="text-xl leading-[normal] font-bold tracking-[-0.02em]">{title}</h1>
          {detail ? <p className="mt-1.5 text-sm leading-[normal] text-[var(--t2)]">{detail}</p> : null}
        </div>
        {/* Tablero Sesion (.b.b-pri.lg de 280): el botón principal de 44, con el degradé y la sombra. */}
        {isError ? (
          props.onRetry ? <Button type="button" size="lg" className="w-[280px] max-w-full" onClick={props.onRetry}>{backToLogin}</Button> : <Button asChild size="lg" className="w-[280px] max-w-full">
            <Link to={props.loginPath ?? "/login"}>{backToLogin}</Link>
          </Button>
        ) : null}
      </div>
    </main>
  );
}
