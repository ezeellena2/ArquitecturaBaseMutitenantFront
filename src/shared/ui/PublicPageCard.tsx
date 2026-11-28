import type { ComponentType, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { initials } from "@/shared/lib/initials";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "./button";
import { PhoneText } from "./format/PhoneText";
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from "./icons";

/// Los datos de la página pública de una organización, como los devuelve la API (el teléfono, en E.164). Lo que está
/// vacío no se muestra: la tarjeta lleva solo lo que la organización cargó.
export interface PublicPageCardData {
  name: string;
  description?: string | null;
  logoDataUri?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
}

/// El fondo de la página pública (tableros Pagina-Publica y M-Pagina-Publica): la tarjeta va sobre él.
export const publicPageBackdropClass = "bg-[var(--fondo)] bg-[radial-gradient(ellipse_at_80%_0%,var(--fondo-brillo),transparent_55%)]";

const filled = (value: string | null | undefined): value is string => Boolean(value?.trim());
// El sitio web se lee sin «https://» ni la barra del final, como en los tableros («delta.ejemplo.com»).
const websiteText = (website: string) => website.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
function safeWebUrl(value: string): string | null {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}
const valueClass = "text-[0.9375rem] font-medium [overflow-wrap:anywhere]";
const linkClass = cn(valueClass, "text-[var(--marca-tx)] no-underline");

// Un dato de contacto (.pp-dato): el ícono gris de 16 y, a su lado, el rótulo gris de 12,5 sobre el dato de 15.
function ContactRow({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return <li className="flex items-start gap-3 border-t border-[var(--borde)] px-4.5 py-3.5 first:border-t-0 max-md:px-3.5 max-md:py-3">
    <Icon className="mt-0.5 size-4 shrink-0 text-[var(--t3)]" />
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[0.78125rem] text-[var(--t3)]">{label}</span>
      {children}
    </span>
  </li>;
}

/// La tarjeta de la página pública de una organización (tableros Pagina-Publica y M-Pagina-Publica): el logo o las
/// iniciales, el nombre, la descripción, la dirección, el teléfono, el correo y el sitio web, e «Ingresá para continuar».
/// No sabe dónde se muestra: la vista previa conserva el CTA sin acción; la página pública le pasa el ingreso y su visibilidad.
export function PublicPageCard({ page, links = false, signInHref, onSignIn, showSignIn = true }: {
  page: PublicPageCardData;
  /** El teléfono, el correo y el sitio web como enlaces (`tel:`, `mailto:` y la web). */
  links?: boolean;
  /** A dónde lleva «Ingresá para continuar». Sin él, el botón se ve pero no hace nada. */
  signInHref?: string;
  /** Inicia el ingreso OIDC en la página pública. */
  onSignIn?: () => void;
  /** Con sesión se oculta el CTA; la vista previa lo conserva por defecto. */
  showSignIn?: boolean;
}) {
  const { t } = useTranslation();
  const { name, description, logoDataUri, address, contactPhone, contactEmail, website } = page;
  const signIn = cn(buttonVariants({ size: "lg" }), "mt-4.5 w-full max-md:h-12 max-md:rounded-[0.75rem]");
  const hasContact = filled(address) || filled(contactPhone) || filled(contactEmail) || filled(website);
  const websiteHref = links && filled(website) ? safeWebUrl(website) : null;

  return <div className="flex w-full max-w-140 flex-col items-center gap-1.5 rounded-[1.25rem] border border-[var(--borde)] bg-[var(--superficie)] p-8 text-center text-[0.9375rem] leading-[1.6] text-[var(--t1)] max-md:rounded-[1.125rem] max-md:px-4.5 max-md:pt-6 max-md:pb-5">
    {/* El logo va decorativo: el nombre está debajo. Sin logo, las iniciales en el verde claro. */}
    {filled(logoDataUri)
      ? <img src={logoDataUri} alt="" className="mb-2.5 size-21 rounded-[1.25rem] border border-[var(--borde)] object-contain max-md:mb-2 max-md:size-18 max-md:rounded-[1.125rem]" />
      : <span aria-hidden="true" className="mb-2.5 inline-flex size-21 items-center justify-center rounded-[1.25rem] border border-[var(--borde)] bg-[var(--marca-t)] text-[1.75rem] font-bold tracking-[-0.02em] text-[var(--marca-tx)] max-md:mb-2 max-md:size-18 max-md:rounded-[1.125rem] max-md:text-[1.5rem]">{initials(name)}</span>}
    <h1 className="m-0 text-[1.875rem] font-bold tracking-[-0.02em] text-[var(--t1)] max-md:text-[1.625rem]">{name}</h1>
    {filled(description) ? <p className="mt-0.5 mb-3.5 whitespace-pre-line text-[1rem] text-[var(--t2)] max-md:mb-3 max-md:text-[0.9375rem]">{description}</p> : null}
    {hasContact ? <ul className="w-full overflow-hidden rounded-[0.75rem] border border-[var(--borde)] text-left">
      {filled(address) ? <ContactRow icon={MapPinIcon} label={t("publicPageCard.address")}>
        <span className={cn(valueClass, "text-[var(--t1)]")}>{address}</span>
      </ContactRow> : null}
      {filled(contactPhone) ? <ContactRow icon={PhoneIcon} label={t("publicPageCard.phone")}>
        <PhoneText value={contactPhone} link={links ? "tel" : undefined} className={linkClass} />
      </ContactRow> : null}
      {filled(contactEmail) ? <ContactRow icon={MailIcon} label={t("publicPageCard.email")}>
        {links ? <a href={`mailto:${contactEmail.trim()}`} className={linkClass}>{contactEmail.trim()}</a> : <span className={linkClass}>{contactEmail.trim()}</span>}
      </ContactRow> : null}
      {filled(website) ? <ContactRow icon={GlobeIcon} label={t("publicPageCard.website")}>
        {websiteHref ? <a href={websiteHref} className={linkClass}>{websiteText(website)}</a> : <span className={linkClass}>{websiteText(website)}</span>}
      </ContactRow> : null}
    </ul> : null}
    {showSignIn ? onSignIn ? <button type="button" onClick={onSignIn} className={signIn}>{t("publicPageCard.signIn")}</button>
      : signInHref ? <a href={signInHref} className={signIn}>{t("publicPageCard.signIn")}</a>
        : <span className={signIn}>{t("publicPageCard.signIn")}</span> : null}
  </div>;
}
