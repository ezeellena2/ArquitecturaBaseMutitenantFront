import { Fragment, useId } from "react";
import { useController, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { NumberField } from "@/shared/ui/fields/NumberField";
import { Section, SectionFields } from "@/shared/ui/Section";
import { Picker } from "@/shared/ui/Picker";
import { rateLimitProfiles, type RateLimitProfile, type RateLimitUnit } from "../lib/rateLimits";
import type { SettingsForm } from "../pages/PlatformSettingsPage";

const units: readonly RateLimitUnit[] = ["s", "m", "h"];

/// «Límites de uso» (tableros Config-Plat y M-Config-Plat, Etapa 9): una sección más de Configuración, con el mismo
/// «Guardar cambios» y motivo. Los doce perfiles agrupados como el tablero, cada uno con pedidos y «cada» con su unidad;
/// en el teléfono, una fila «N cada M minutos» por perfil.
export function RateLimitsSection({ control, errors, onChange }: {
  control: Control<SettingsForm>; errors?: FieldErrors<SettingsForm>["rateLimits"]; onChange: (profile: RateLimitProfile) => void;
}) {
  const { t } = useTranslation("platformSettings");
  const { phone } = useAppChrome();
  // Tablero Config-Plat (.lim): la tabla en su recuadro, adentro del margen de la sección; en M-Config-Plat, las filas con
  // el margen de la tarjeta.
  return <Section title={t("rateLimits.title")} phone="inset"><SectionFields>
    <div role="group" aria-label={t("rateLimits.title")} className={phone ? "flex flex-col gap-3" : "overflow-hidden rounded-[0.625rem] border border-[var(--borde)]"}>
      {phone ? null : <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_8.75rem_13.75rem] gap-4 border-b border-[var(--borde-cab)] bg-[var(--cab)] px-4 py-2.5 text-[0.75rem] font-semibold text-[var(--t2)]">
        <span>{t("rateLimits.columns.limit")}</span><span>{t("rateLimits.columns.requests")}</span><span>{t("rateLimits.columns.every")}</span>
      </div>}
      {rateLimitProfiles.map((profile, index) => <Fragment key={profile.key}>
        {"group" in profile ? <h3 className={phone ? "mt-1.5 text-[0.8125rem] font-semibold text-[var(--t2)]"
          : `px-4 pt-3 pb-1 text-[0.8125rem] font-semibold text-[var(--t2)] ${index === 0 ? "" : "mt-1.5 border-t border-[var(--borde)]"}`}>{t(`rateLimits.groups.${profile.group}`)}</h3> : null}
        <RateLimitRow control={control} profile={profile.key} errors={errors?.[profile.key]} phone={phone} onChange={() => onChange(profile.key)} />
      </Fragment>)}
    </div>
  </SectionFields></Section>;
}

function RateLimitRow({ control, profile, errors, phone, onChange }: {
  control: Control<SettingsForm>; profile: RateLimitProfile; errors?: { permitLimit?: { message?: string }; amount?: { message?: string } };
  phone: boolean; onChange: () => void;
}) {
  const { t } = useTranslation("platformSettings");
  const id = useId();
  const name = t(`rateLimits.profiles.${profile}`);
  const permits = useController({ control, name: `rateLimits.${profile}.permitLimit` });
  const amount = useController({ control, name: `rateLimits.${profile}.amount` });
  const unit = useController({ control, name: `rateLimits.${profile}.unit` });
  const count = useWatch({ control, name: `rateLimits.${profile}.amount` }) ?? 0;
  const permitError = errors?.permitLimit?.message; const windowError = errors?.amount?.message;
  const permitErrorId = `${id}-permit`; const windowErrorId = `${id}-window`;
  const permitsField = <NumberField name={permits.field.name} value={permits.field.value} aria-label={t("rateLimits.requestsOf", { name })}
    aria-invalid={Boolean(permitError)} aria-describedby={permitError ? permitErrorId : undefined} onChange={(value) => { onChange(); permits.field.onChange(value); }} />;
  const amountField = <NumberField name={amount.field.name} value={amount.field.value} aria-label={t("rateLimits.everyOf", { name })}
    aria-invalid={Boolean(windowError)} aria-describedby={windowError ? windowErrorId : undefined} onChange={(value) => { onChange(); amount.field.onChange(value); }} />;
  const unitField = <Picker label={t("rateLimits.unitOf", { name })} value={unit.field.value} aria-invalid={Boolean(windowError) || undefined}
    onChange={(value) => { if (value === unit.field.value) return; onChange(); unit.field.onChange(value); }}
    options={units.map((value) => ({ value, label: t(`rateLimits.units.${value}`, { count }) }))} />;
  const permitMessage = permitError ? <span id={permitErrorId} role="alert" className="text-[0.78125rem] text-[var(--peligro)] max-md:text-[0.8125rem]">{permitError}</span> : null;
  const windowMessage = windowError ? <span id={windowErrorId} role="alert" className="text-[0.78125rem] text-[var(--peligro)] max-md:text-[0.8125rem]">{windowError}</span> : null;

  // Tablero M-Config-Plat: el nombre arriba y «N cada M unidad» en una fila; el error, debajo.
  if (phone) return <div className="flex flex-col gap-1.5">
    <span className="text-[0.84375rem] font-medium text-[var(--t2)]">{name}</span>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_4rem_minmax(0,1.25fr)] items-center gap-2">
      {permitsField}<span className="text-[0.875rem] text-[var(--t2)]">{t("rateLimits.every")}</span>{amountField}{unitField}
    </div>
    {permitMessage}{windowMessage}
  </div>;
  // Tablero Config-Plat (.lim-f): el nombre, los pedidos de 140 y «cada» de 220, con el número de 72 y la unidad.
  return <div className="grid grid-cols-[minmax(0,1fr)_8.75rem_13.75rem] items-start gap-4 px-4 py-2">
    <span className="pt-2 text-[0.875rem] text-[var(--t1)]">{name}</span>
    <div className="flex min-w-0 flex-col gap-1">{permitsField}{permitMessage}</div>
    <div className="flex min-w-0 flex-col gap-1"><div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">{amountField}{unitField}</div>{windowMessage}</div>
  </div>;
}
