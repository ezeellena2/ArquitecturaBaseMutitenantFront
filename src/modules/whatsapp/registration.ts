import es from "./locales/es/whatsapp.json";
import en from "./locales/en/whatsapp.json";
import esNumbers from "./locales/es/numbers.json";
import enNumbers from "./locales/en/numbers.json";
import esChats from "./locales/es/chats.json";
import enChats from "./locales/en/chats.json";
import esContacts from "./locales/es/contacts.json";
import enContacts from "./locales/en/contacts.json";
import esBroadcasts from "./locales/es/broadcasts.json";
import enBroadcasts from "./locales/en/broadcasts.json";
import esBot from "./locales/es/bot.json";
import enBot from "./locales/en/bot.json";
import esTeams from "./locales/es/teams.json";
import enTeams from "./locales/en/teams.json";
import esTemplates from "./locales/es/templates.json";
import enTemplates from "./locales/en/templates.json";
import esPersonal from "./locales/es/personal.json";
import enPersonal from "./locales/en/personal.json";
import esPhones from "./locales/es/phones.json";
import enPhones from "./locales/en/phones.json";
import esNumbersEnums from "./locales/es/enums/numbers.json";
import enNumbersEnums from "./locales/en/enums/numbers.json";
import esChatsEnums from "./locales/es/enums/chats.json";
import enChatsEnums from "./locales/en/enums/chats.json";
import esContactsEnums from "./locales/es/enums/contacts.json";
import enContactsEnums from "./locales/en/enums/contacts.json";
import esBroadcastsEnums from "./locales/es/enums/broadcasts.json";
import enBroadcastsEnums from "./locales/en/enums/broadcasts.json";
import esBotEnums from "./locales/es/enums/bot.json";
import enBotEnums from "./locales/en/enums/bot.json";
import esTeamsEnums from "./locales/es/enums/teams.json";
import enTeamsEnums from "./locales/en/enums/teams.json";
import esTemplatesEnums from "./locales/es/enums/templates.json";
import enTemplatesEnums from "./locales/en/enums/templates.json";
import esPersonalEnums from "./locales/es/enums/personal.json";
import enPersonalEnums from "./locales/en/enums/personal.json";
import esPhonesEnums from "./locales/es/enums/phones.json";
import enPhonesEnums from "./locales/en/enums/phones.json";
import { WhatsAppIcon } from "@/shared/ui/icons";
import type { ModuleRegistration } from "@/shared/modules/types";
import { platformWhatsAppPermissions, whatsappPermissions } from "./access";
import { botRoutes } from "./bot/routes";
import { broadcastsRoutes } from "./broadcasts/routes";
import { chatsRoutes } from "./chats/routes";
import { contactsRoutes } from "./contacts/routes";
import { numbersRoutes } from "./numbers/routes";
import { personalRoutes } from "./personal/routes";
import { phonesRoutes, phonesUsersActions } from "./phones/routes";
import { teamsRoutes } from "./teams/routes";
import { templatesRoutes } from "./templates/routes";

/** Las pantallas de Números: la tarjeta del Inicio y el pendiente «Números sin medio de pago» llevan ahí. */
export const numbersPath = "/org/whatsapp/numeros";

// Cada área aporta su parte del namespace `whatsapp` y sus enums: así nadie pisa el archivo de otra.
const texts = (common: object, parts: Record<string, object>) => ({ ...common, ...parts });

export const whatsappRegistration: ModuleRegistration = {
  id: "whatsapp",
  nameKey: "whatsapp:title",
  resources: {
    es: {
      whatsapp: texts(es, { numbers: esNumbers, chats: esChats, contacts: esContacts, broadcasts: esBroadcasts, bot: esBot, teams: esTeams, templates: esTemplates, personal: esPersonal, phones: esPhones }),
      enums: { ...esNumbersEnums, ...esChatsEnums, ...esContactsEnums, ...esBroadcastsEnums, ...esBotEnums, ...esTeamsEnums, ...esTemplatesEnums, ...esPersonalEnums, ...esPhonesEnums },
    },
    en: {
      whatsapp: texts(en, { numbers: enNumbers, chats: enChats, contacts: enContacts, broadcasts: enBroadcasts, bot: enBot, teams: enTeams, templates: enTemplates, personal: enPersonal, phones: enPhones }),
      enums: { ...enNumbersEnums, ...enChatsEnums, ...enContactsEnums, ...enBroadcastsEnums, ...enBotEnums, ...enTeamsEnums, ...enTemplatesEnums, ...enPersonalEnums, ...enPhonesEnums },
    },
  },
  permissions: { organization: whatsappPermissions, platform: platformWhatsAppPermissions },
  // El orden es el del menú: el panel WhatsApp (Chats, Contactos y Difusiones) y Administración › WhatsApp (Números, Bot,
  // Equipos y Plantillas); en Plataforma, Consultas y su Administración; en el perfil personal, Mensajes.
  routes: [...chatsRoutes, ...contactsRoutes, ...broadcastsRoutes, ...numbersRoutes, ...botRoutes, ...teamsRoutes, ...templatesRoutes,
    ...personalRoutes, ...phonesRoutes],
  pageActions: { users: phonesUsersActions },
  businessHome: {
    cards: [{ key: "whatsapp", titleKey: "whatsapp:home.card.title", shortKey: "whatsapp:home.card.short", detailKey: "whatsapp:home.card.numbers", icon: WhatsAppIcon, to: numbersPath }],
    pending: [{
      kind: "numberPaymentMissing", card: "whatsapp", groupKey: "whatsapp:home.pending.numberPaymentMissing.group",
      stateKey: "whatsapp:home.pending.numberPaymentMissing.state", actionKey: "whatsapp:home.pending.numberPaymentMissing.action", to: numbersPath,
      describe: (item) => ({ title: item.subject ?? "", to: item.targetId ? `${numbersPath}?numero=${encodeURIComponent(item.targetId)}` : numbersPath }),
    }],
  },
};
