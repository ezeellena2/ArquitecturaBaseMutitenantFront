import { lazy } from "react";
import { AppAccountsIcon } from "@/shared/ui/icons";
import type { ModuleRoute } from "@/shared/modules/types";
import { businessGuard } from "../access";
import { ContactsIcon } from "../components/icons";
import { whatsappPanel } from "../navigation";

const ContactsPage = lazy(() => import("./pages/ContactsPage").then((module) => ({ default: module.ContactsPage })));
const ContactPage = lazy(() => import("./pages/ContactPage").then((module) => ({ default: module.ContactPage })));

// D3: ver, editar e importar contactos y cambiar el consentimiento a mano es «Atender clientes».
const guard = businessGuard("whatsapp.customers");

/** Las rutas de esta área del módulo, en el orden en que van en el menú. Las compone `registration.ts`. */
export const contactsRoutes: readonly ModuleRoute[] = [
  {
    access: "business", path: "/org/whatsapp/contactos", guard, Page: ContactsPage,
    navigation: { placement: "panel", panel: whatsappPanel, phone: true, labelKey: "whatsapp:nav.contacts", icon: ContactsIcon, phoneIcon: AppAccountsIcon },
  },
  // La ficha: Chats lleva acá con «Ver ficha».
  { access: "business", path: "/org/whatsapp/contactos/:contactId", guard, Page: ContactPage },
];
