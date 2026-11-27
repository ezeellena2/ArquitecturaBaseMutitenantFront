import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { FormField } from "@/shared/ui/FormField";
import { Picker } from "@/shared/ui/Picker";
import { sampleContactOptions, sampleMemberOptions } from "../../api/catalogs";
import type { FormCatalogSampleMemberRow } from "../../api/types";
import type { CatalogFilters } from "../../hooks/useCatalogFilters";

/**
 * La persona o el cliente de ejemplo de la vista previa (FRM-Catalogo-Filtros y FRM-Catalogo-Contactos): en la pieza (262),
 * con la lista del servidor y su buscador adentro, y cerrada dice solo el elegido. Se guarda con el catálogo.
 */
export function SamplePicker({ filters }: { filters: CatalogFilters }) {
  return filters.source === "Contacts" ? <SampleContactPicker filters={filters} /> : <SampleMemberPicker filters={filters} />;
}

// «Vendedor · Delta S.A.»: sus roles y sus empresas, para distinguir dos con el mismo nombre.
const describeMember = (member: FormCatalogSampleMemberRow) =>
  [member.roles.join(", "), member.companies.join(", ")].filter(Boolean).join(" · ") || undefined;

/** «Persona», obligatoria con condiciones (`SampleRequired`): la vista previa la toma como quien recibe. */
export function SampleMemberPicker({ filters }: { filters: CatalogFilters }) {
  const { t } = useTranslation("forms");
  const [open, setOpen] = useState(false);
  const members = useResourceOptions(sampleMemberOptions, open);
  const chosen = filters.sample;
  return <FormField label={t("forms:catalog.sample.member")} required error={filters.sampleError}>
    <Picker value={chosen?.id ?? null} remote={members.remote} onOpenChange={setOpen} placeholder={t("forms:catalog.sample.memberPlaceholder")}
      options={members.items.map((member) => ({ value: member.memberId, label: member.name, description: describeMember(member) }))}
      selectedOptions={chosen ? [{ value: chosen.id, label: chosen.name }] : []}
      onChange={(id) => {
        const member = members.knownItems.find((item) => item.memberId === id);
        if (member) filters.setSample({ id: member.memberId, name: member.name, detail: member.companies.join(", ") || null });
      }} />
  </FormField>;
}

/** «Cliente», que puede quedar «Sin cliente»: la vista previa de los contactos no lo necesita. */
export function SampleContactPicker({ filters }: { filters: CatalogFilters }) {
  const { t } = useTranslation("forms");
  const [open, setOpen] = useState(false);
  const contacts = useResourceOptions(sampleContactOptions, open);
  const chosen = filters.sample;
  return <FormField label={t("forms:catalog.sample.contact")} error={filters.sampleError}>
    <Picker value={chosen?.id ?? ""} remote={contacts.remote} onOpenChange={setOpen}
      first={{ value: "", label: t("forms:catalog.sample.noContact") }}
      options={contacts.items.map((contact) => ({ value: contact.contactId, label: contact.name }))}
      selectedOptions={chosen ? [{ value: chosen.id, label: chosen.name }] : []}
      onChange={(id) => {
        if (!id) { filters.setSample(null); return; }
        const contact = contacts.knownItems.find((item) => item.contactId === id);
        if (contact) filters.setSample({ id: contact.contactId, name: contact.name, detail: null });
      }} />
  </FormField>;
}
