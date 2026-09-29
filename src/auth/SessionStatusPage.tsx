import { CircleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { BrandMark } from "@/shared/ui/BrandMark";

export type SessionStatusPageProps =
  | { status: "starting" | "closing"; targetName?: never; loginPath?: never }
  | { status: "switching"; targetName: string; loginPath?: never }
  | { status: "error"; targetName?: never; loginPath?: string };

export function SessionStatusPage(props: SessionStatusPageProps) {
  const { t } = useTranslation("auth");
  const isError = props.status === "error";
  const title = props.status === "switching"
    ? t("session.switching.title", { targetName: props.targetName })
    : t(`session.${props.status}.title`);
  const detail = props.status === "starting" || isError
    ? t(`session.${props.status}.detail`)
    : null;

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
        <div>
          <h1 className="text-xl font-bold tracking-[-0.02em]">{title}</h1>
          {detail ? <p className="mt-1.5 text-sm text-[var(--t2)]">{detail}</p> : null}
        </div>
        {isError ? (
          <Link
            to={props.loginPath ?? "/login"}
            className="inline-flex h-12 w-[280px] max-w-full items-center justify-center rounded-xl bg-[var(--marca)] px-5 text-[15px] font-semibold text-[var(--lado-activo)] hover:bg-[var(--marca-h)] md:h-10 md:rounded-[10px]"
          >
            {t("session.error.backToLogin")}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
