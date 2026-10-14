import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "@/shared/ui/format/EmptyValue";

/// Los idiomas de una plantilla (CC19, `languages`): las culturas del catálogo por su nombre, separadas por coma. Una del
/// sistema va en español y en inglés; una nueva, en la cultura de quien la escribió.
export function TemplateLanguages({ languages }: { languages: readonly string[] }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading />;
  if (languages.length === 0) return <EmptyValue />;
  return <span>{languages.map((language) => format.formatCulture(language)).join(", ")}</span>;
}
