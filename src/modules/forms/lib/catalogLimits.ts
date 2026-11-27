import { validationConstraints } from "@/shared/api/generated/validation";

const item = validationConstraints.FormCatalogItemHttpInput;
const update = validationConstraints.UpdateFormCatalogHttpRequest;

/**
 * Los topes de un catálogo, los mismos que valida el servidor (269 y O13): salen del contrato (`validationConstraints`),
 * nunca de un número escrito en la pantalla.
 */
export const catalogLimits = {
  /** El nombre y la descripción del catálogo. */
  name: update.name.maxLength,
  description: update.description.maxLength,
  /** El texto, el código y el detalle de una opción. */
  itemText: item.text.maxLength,
  itemCode: item.code.maxLength,
  itemDetail: item.detail.maxLength,
  /** Las opciones de un catálogo, contando las dadas de baja (42). */
  items: update.items.maxItems,
  /** Las que se quitan en un guardado: también el tope de las opciones que toca una propuesta del asistente. */
  deleteItems: update.deleteItems.maxItems,
  /** Las que muestra la vista previa, como la lista de WhatsApp; con más, «y N opciones más». */
  previewOptions: validationConstraints.FormCatalogPreviewResponse.options.maxItems,
} as const;
