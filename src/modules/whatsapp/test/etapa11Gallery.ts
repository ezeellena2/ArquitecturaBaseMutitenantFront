import { botGalleryCases, botGalleryPending } from "../bot/gallery";
import { broadcastsGalleryCases, broadcastsGalleryPending } from "../broadcasts/gallery";
import { chatsGalleryCases, chatsGalleryPending } from "../chats/gallery";
import { contactsGalleryCases, contactsGalleryPending } from "../contacts/gallery";
import { numbersGalleryCases, numbersGalleryPending } from "../numbers/gallery";
import { personalGalleryCases, personalGalleryPending } from "../personal/gallery";
import { phonesGalleryCases, phonesGalleryPending } from "../phones/gallery";
import { teamsGalleryCases, teamsGalleryPending } from "../teams/gallery";
import { templatesGalleryCases, templatesGalleryPending } from "../templates/gallery";

/** Las pantallas nuevas o cambiadas en la E11, con su tablero; el orden es el de la galería. */
export const etapa11GalleryCases = [...chatsGalleryCases, ...contactsGalleryCases, ...broadcastsGalleryCases, ...numbersGalleryCases, ...botGalleryCases,
  ...teamsGalleryCases, ...templatesGalleryCases, ...personalGalleryCases, ...phonesGalleryCases];
export const etapa11GalleryPending = [...chatsGalleryPending, ...contactsGalleryPending, ...broadcastsGalleryPending, ...numbersGalleryPending,
  ...botGalleryPending, ...teamsGalleryPending, ...templatesGalleryPending, ...personalGalleryPending, ...phonesGalleryPending];
