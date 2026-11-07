import en from "./en/whatsapp.json";
import enNumbers from "./en/numbers.json";
import enChats from "./en/chats.json";
import enContacts from "./en/contacts.json";
import enBroadcasts from "./en/broadcasts.json";
import enBot from "./en/bot.json";
import enTeams from "./en/teams.json";
import enTemplates from "./en/templates.json";
import enPersonal from "./en/personal.json";
import enPhones from "./en/phones.json";
import enNumbersEnums from "./en/enums/numbers.json";
import enChatsEnums from "./en/enums/chats.json";
import enContactsEnums from "./en/enums/contacts.json";
import enBroadcastsEnums from "./en/enums/broadcasts.json";
import enBotEnums from "./en/enums/bot.json";
import enTeamsEnums from "./en/enums/teams.json";
import enTemplatesEnums from "./en/enums/templates.json";
import enPersonalEnums from "./en/enums/personal.json";
import enPhonesEnums from "./en/enums/phones.json";

// Los textos en inglés del módulo, en un archivo aparte para que se bajen recién al configurar ese idioma.
const texts = (common: object, parts: Record<string, object>) => ({ ...common, ...parts });

export default {
  whatsapp: texts(en, { numbers: enNumbers, chats: enChats, contacts: enContacts, broadcasts: enBroadcasts, bot: enBot, teams: enTeams, templates: enTemplates, personal: enPersonal, phones: enPhones }),
  enums: { ...enNumbersEnums, ...enChatsEnums, ...enContactsEnums, ...enBroadcastsEnums, ...enBotEnums, ...enTeamsEnums, ...enTemplatesEnums, ...enPersonalEnums, ...enPhonesEnums },
};
