import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = path.resolve(import.meta.dirname, "..");

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function texts(value: unknown, at: string): { at: string; text: string }[] {
  if (typeof value === "string") return [{ at, text: value }];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => texts(child, `${at}.${key}`));
  return [];
}

// Los textos de un idioma, del núcleo y de los módulos.
const textsOf = (language: string) => filesIn(srcDir)
  .filter((file) => file.endsWith(".json") && new RegExp(`[\\\\/]locales[\\\\/]${language}[\\\\/]`).test(file))
  .flatMap((file) => texts(JSON.parse(readFileSync(file, "utf8")), path.relative(srcDir, file).replaceAll("\\", "/")));
const spanish = textsOf("es");
const english = textsOf("en");

// textos-y-traducciones.md: español rioplatense con voseo. Un texto que tutea se reconoce por las formas que el voseo no
// usa: el presente de «tú» («puedes» y no «podés»), «tú», «contigo» y «para ti», los imperativos irregulares («haz»,
// «ten», «pon») y los imperativos con el pronombre pegado («inténtalo» y no «intentalo», «asegúrate» y no «asegurate»).
const word = (list: string) => new RegExp(`(?<!\\p{L})(?:${list})(?!\\p{L})`, "iu");
const tuteo = word([
  "puedes|tienes|quieres|debes|eres|necesitas|sabes|vienes|prefieres|recuerdas|piensas|encuentras|vuelves|conoces",
  "escribes|eliges|pides|entiendes|pierdes|usas|haces|dices|tú|contigo|(?:para|a|de|en|por|sin|sobre|con)\\s+ti|haz|ten|pon",
  "asegúrate|fíjate|acuérdate|inténtalo|revísalo|revísala|elígelo|elígela|guárdalo|guárdala|ingrésalo|ingrésala|escríbelo",
  "confírmalo|pruébalo|cámbialo|ábrelo|cópialo|agrégalo|búscalo|complétalo|descárgalo|selecciónalo|selecciónala",
].join("|"));
// El imperativo regular de «tú» se escribe igual que el presente de «él» («Revisa», «Elige»), que las descripciones usan
// («Vuelve a entrar como persona», «Crea roles»). Cuenta como tuteo solo al empezar una oración que le habla a la persona
// («Revisa tu correo», «Elige quién te atiende») o que pide repetir («Intenta de nuevo»); el voseo lleva la tilde
// («Revisá», «Intentá»).
const imperatives = "Ingresa|Elige|Selecciona|Confirma|Escribe|Revisa|Intenta|Vuelve|Agrega|Busca|Completa|Guarda|Prueba|Toca|Cambia|Copia|Abre|Cierra|Recuerda|Verifica|Descarga|Carga|Sube|Acepta|Crea|Edita|Espera|Usa|Mira|Lee|Pide|Sigue|Olvida|Indica|Borra|Envía|Manda";
const imperative = new RegExp(`^[¿¡"«]?(?:${imperatives})(?!\\p{L})`, "u");
const toYou = word("tu|tus|te|ti|tuyo|tuya|tuyos|tuyas");
const again = new RegExp(`^[¿¡]?(?:${imperatives})\\s+(?:de nuevo|otra vez|más tarde|nuevamente)(?!\\p{L})`, "iu");

function tutea(text: string): boolean {
  if (tuteo.test(text)) return true;
  return text.split(/(?<=[.!?])\s+|\n/).map((sentence) => sentence.trim())
    .some((sentence) => (imperative.test(sentence) && toYou.test(sentence)) || again.test(sentence));
}

// Base de la 12, «Las palabras» (F6): «Dar de baja» y «Reactivar», con el estado «De baja», «Dados de baja» o «Dadas de baja»;
// «Borrar», nunca «Eliminar»; borrar la cuenta propia dice «Borrar mi cuenta», con el estado «Por borrar»; y las altas
// dicen «Agregar …»: en Usuario, «Agregar empresa» y «Agregar». Salen «Deshabilitar», «Inactivar» y, en los miembros de una
// empresa, «Volver a sumar».
const banned: readonly [RegExp, string][] = [
  [/deshabilit/i, "«Deshabilitar» o «Deshabilitado»: va «Dar de baja» o «De baja»"],
  [/inactiv/i, "«Inactivar» o «Inactivo»: va «Dar de baja» o «De baja»"],
  [/elimin/i, "«Eliminar»: va «Borrar»"],
  [/bajas? pedidas?/i, "«Baja pedida»: va «Por borrar»"],
  [/volver a sumar|volvimos a sumar/i, "«Volver a sumar»: va «Reactivar»"],
  [/^Sumar( empresa)?$/, "«Sumar empresa» o «Sumar»: va «Agregar empresa» o «Agregar»"],
  [/(dar|dando|dimos) de baja (mi|tu|la) cuenta|darte de baja/i, "la cuenta se borra: va «Borrar mi cuenta» o «Borrar la cuenta»"],
];

describe("las palabras de la base de la 12", () => {
  it("lee los textos en español del núcleo y de los módulos", () => {
    expect(spanish.length).toBeGreaterThan(500);
    expect(spanish.some(({ at }) => at.startsWith("modules/"))).toBe(true);
  });

  it("no usa ninguna de las palabras viejas", () => {
    const found = spanish.flatMap(({ at, text }) => banned.filter(([pattern]) => pattern.test(text)).map(([, why]) => `${at}: «${text}» (${why})`));
    expect(found).toEqual([]);
  });
});

// «Criterio · Diálogos» (213): una confirmación dice en una frase lo que se afecta, sin instrucciones ni «¿Estás seguro?»;
// el título es la pregunta, con el nombre de lo que se toca.
describe("las confirmaciones (213)", () => {
  const unsure = /(?<!\p{L})est(?:[aá]s?|[eé]s) segur[oa]s?(?!\p{L})|are you sure/iu;

  it("reconoce «¿Estás seguro?» sin confundirlo con un lugar seguro", () => {
    for (const text of ["¿Estás seguro?", "¿Estás segura de quitarla?", "Are you sure?", "¿Está seguro de borrarlo?"]) expect(unsure.test(text), text).toBe(true);
    for (const text of ["Guardalo en un lugar seguro.", "¿Quitar a Sofía Herrera de Grupo Delta?"]) expect(unsure.test(text), text).toBe(false);
  });

  it("nunca preguntan «¿Estás seguro?», en ningún idioma", () => {
    expect([...spanish, ...english].filter(({ text }) => unsure.test(text)).map(({ at, text }) => `${at}: «${text}»`)).toEqual([]);
  });
});

describe("el voseo y la Organización", () => {
  it("reconoce el tuteo sin confundirlo con el voseo ni con una descripción", () => {
    for (const text of ["¿Puedes revisar esto?", "Si tienes una cuenta, ingresá.", "Lo elegiste tú.", "Es para ti", "Haz clic acá",
      "Asegúrate de guardar", "Inténtalo de nuevo", "Revisa tu correo.", "Te mandamos un código. Ingresa el código que te llegó.",
      "Intenta de nuevo", "Elige quién te atiende", "No se pudo. Vuelve a intentarlo más tarde, por favor te pedimos."]) {
      expect(tutea(text), text).toBe(true);
    }
    for (const text of ["¿Podés revisar esto?", "Revisá tu correo.", "Intentá de nuevo", "Asegurate de guardar", "Intentalo de nuevo",
      "Vuelve a entrar como persona y en sus organizaciones.", "Sigue en la organización.", "Crea roles y los asigna.", "Activa",
      "Prueba hasta {{date}}", "Espera aprobación", "Dale el rol a otra persona.", "Te mandamos un código a {{destination}}.",
      "Lo ve el Dueño.", "La lista completa", "Diez", "Contenido"]) {
      expect(tutea(text), text).toBe(false);
    }
  });

  it("habla de vos en todos los textos en español", () => {
    expect(spanish.filter(({ text }) => tutea(text)).map(({ at, text }) => `${at}: «${text}»`)).toEqual([]);
  });

  it("nunca dice «tenant»: se dice «Organización»", () => {
    expect(english.length).toBeGreaterThan(500);
    expect([...spanish, ...english].filter(({ text }) => /tenant/i.test(text)).map(({ at, text }) => `${at}: «${text}»`)).toEqual([]);
  });
});
