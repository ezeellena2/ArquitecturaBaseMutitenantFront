import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "lucide-react";
import type { MeResponse } from "@/shared/api/types";
import { initials } from "@/shared/lib/initials";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { BuildingIcon, UserIcon } from "@/shared/ui/icons";
import { useSwitchAccess } from "@/tenancy/useSwitchAccess";

/// Un link del otro acceso (tableros Otro-Acceso y Otro-Acceso-Persona, con sus M-*): quien está como persona abre un link
/// de una empresa, o al revés. En lugar de mandarlo al inicio sin decir nada, la pantalla dice de quién es el link y ofrece
/// entrar con ese acceso; al entrar, abre el link (`returnTo`). Con varias organizaciones, se elige con cuál, con la
/// elegida tildada (142).
export function OtherAccessPage({ target, returnTo, organizations }: {
  target: "consumer" | "business";
  returnTo: string;
  organizations: MeResponse["organizations"];
}) {
  const { t } = useTranslation("otherAccess");
  const { switchAccess, isSwitching, hasError } = useSwitchAccess();
  const [chosen, setChosen] = useState(organizations[0]?.id ?? "");
  const groupId = useId();
  const business = target === "business";
  const title = !business ? t("personal") : organizations.length === 1 ? t("business", { name: organizations[0].name }) : t("someBusiness");
  const Icon = business ? BuildingIcon : UserIcon;

  return <div data-slot="other-access" className="flex flex-1 items-center justify-center p-6 max-md:items-stretch max-md:p-5">
    <div className="flex w-100 max-w-full flex-col items-center gap-4 text-center max-md:w-full max-md:justify-center max-md:gap-4.5">
      <span aria-hidden="true" className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]">
        <Icon className="size-6.5" />
      </span>
      <h1 className="text-[1.5rem] leading-[1.25] font-bold tracking-[-0.02em] text-[var(--t1)] max-md:text-[1.375rem]">{title}</h1>
      {business && organizations.length > 1 ? <div role="radiogroup" aria-labelledby={groupId}
        className="flex flex-col self-stretch overflow-hidden rounded-[0.75rem] border border-[var(--borde)] bg-[var(--superficie)] text-left max-md:rounded-[0.875rem]">
        <span id={groupId} className="sr-only">{t("organizations")}</span>
        {organizations.map((organization) => {
          const on = organization.id === chosen;
          return <label key={organization.id}
            className={cn("flex min-h-13 cursor-pointer items-center gap-3 border-b border-[var(--borde)] px-3.5 last:border-b-0 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-[var(--foco)] max-md:min-h-15",
              on && "bg-[var(--marca-t)]")}>
            <input type="radio" name={groupId} value={organization.id} checked={on} onChange={() => setChosen(organization.id)} className="sr-only" />
            <span aria-hidden="true" className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] text-[0.75rem] font-bold max-md:size-9 max-md:rounded-[0.625rem] max-md:text-[0.8125rem]",
              on ? "bg-[var(--superficie)] text-[var(--marca-tx)]" : "bg-[var(--s3)] text-[var(--t2)]")}>{initials(organization.name)}</span>
            <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
              <span className="text-[0.875rem] font-medium text-[var(--t1)] [overflow-wrap:anywhere] max-md:text-[1rem]">{organization.name}</span>
              {organization.roleName ? <span className="text-[0.78125rem] text-[var(--t3)] max-md:text-[0.84375rem]">{organization.roleName}</span> : null}
            </span>
            {on ? <CheckIcon aria-hidden="true" strokeWidth={2.25} className="size-5 shrink-0 text-[var(--marca)]" /> : null}
          </label>;
        })}
      </div> : null}
      {hasError ? <FormError message={t("failed")} /> : null}
      <Button type="button" className="h-10 px-5 text-[0.875rem] max-md:h-12 max-md:w-full max-md:text-[1rem]" pending={isSwitching} pendingLabel={t("entering")}
        onClick={() => { void switchAccess({ access: target, ...(business ? { tenantId: chosen } : {}), returnTo }); }}>
        {t(business ? "enterBusiness" : "enterPersonal")}
      </Button>
    </div>
  </div>;
}
