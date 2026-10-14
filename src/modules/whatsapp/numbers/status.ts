import { defineStatusTones } from "@/shared/format/statusTones";

/** WA-Admin y Plat-WA-Numero (.w-est): conectado en verde, sin medio de pago en rojo y desconectado en gris. */
export const numberStatusTones = defineStatusTones("WhatsAppNumberStatus", { Connected: "success", PaymentMissing: "danger", Disconnected: "neutral" });

/** «Ir a Meta»: el medio de pago se carga en el WhatsApp Manager de la cuenta. */
export const whatsappManagerUrl = "https://business.facebook.com/wa/manage/home/";
