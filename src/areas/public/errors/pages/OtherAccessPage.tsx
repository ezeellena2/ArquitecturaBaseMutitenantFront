import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MeResponse } from "@/shared/api/types";
import { initials } from "@/shared/lib/initials";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { Picker } from "@/shared/ui/Picker";
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
  const { hideActiveSection } = useAppChrome();
  // Tableros M-Otro-Acceso y M-Otro-Acceso-Persona, como M-Error-Org: la barra de abajo no marca ninguna sección.
  useEffect(() => {
    hideActiveSection?.(true);
    return () => hideActiveSection?.(false);
  }, [hideActiveSection]);
  const [chosen, setChosen] = useState(organizations[0]?.id ?? "");
  const business = target === "business";
  const title = !business ? t("personal") : organizations.length === 1 ? t("business", { name: organizations[0].name }) : t("someBusiness");
  const Icon = business ? BuildingIcon : UserIcon;

  return <div data-slot="other-access" className="flex min-h-full flex-1 items-center justify-center p-6 max-md:items-stretch max-md:p-5">
    <div className="flex w-100 max-w-full flex-col items-center gap-4 text-center max-md:w-full max-md:justify-center max-md:gap-4.5">
      <span aria-hidden="true" className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]">
        <Icon className="size-6.5" />
      </span>
      <h1 className="text-[1.5rem] leading-[1.25] font-bold tracking-[-0.02em] text-[var(--t1)] max-md:text-[1.375rem]">{title}</h1>
      {/* 262: la organización se elige en la pieza, con sus iniciales y el rol en gris. */}
      {business && organizations.length > 1 ? <div className="self-stretch text-left">
        <Picker label={t("organizations")} value={chosen} onChange={setChosen}
          options={organizations.map((organization) => ({
            value: organization.id,
            label: organization.name,
            description: organization.roleName ?? undefined,
            icon: <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-[0.375rem] bg-[var(--s3)] text-[0.6875rem] font-bold text-[var(--t2)]">{initials(organization.name)}</span>,
          }))} />
      </div> : null}
      {hasError ? <FormError message={t("failed")} /> : null}
      <Button type="button" className="h-10 px-5 text-[0.875rem] max-md:h-12 max-md:w-full max-md:text-[1rem]" pending={isSwitching} pendingLabel={t("entering")}
        onClick={() => { void switchAccess({ access: target, ...(business ? { tenantId: chosen } : {}), returnTo }); }}>
        {t(business ? "enterBusiness" : "enterPersonal")}
      </Button>
    </div>
  </div>;
}
