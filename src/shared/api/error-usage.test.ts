import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "../..");

// errores.md: se decide por `error.code`, nunca por el texto. El `detail` ya viene traducido por el back y se muestra tal
// cual (en su campo, con `apiErrorMessage` o `actionErrorMessage`); nunca se compara ni se busca adentro. El `message` de
// un `Error` y el `title` de un problema no se muestran, y el `traceId` va solo en el aviso de un 5xx (`queryClient`).

// Lo que lleva un error: un nombre que lo dice (`error`, `estimateError`, `caught`, `failure`…) o el `e` de un `catch`.
const errorLike = String.raw`(?:\b\w*(?:[Ee]rror|[Ee]rr|[Ff]ailure|[Pp]roblem|[Cc]aught|[Ee]xception|[Cc]ause)|\be)\)?\??\.(?:problem\??\.)?(?:detail|title|message)\b`;
const textMethods = "includes|startsWith|endsWith|match|matchAll|search|indexOf|lastIndexOf|localeCompare|toLowerCase|toUpperCase|normalize";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "test" || entry.name === "generated" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) && !/[\\/]testSupport\.tsx?$/.test(full) ? [full] : [];
  });
}

// Los textos entre comillas no son código: `t("broadcasts.failure.title")` no lee nada. Quedan las comillas, para ver
// una comparación (`error.detail === ""`).
const withoutTexts = (source: string) => source.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\$])*`/g, (text) => `${text[0]}${text[0]}`);

function violations(relative: string, rawSource: string): string[] {
  const source = withoutTexts(rawSource);
  const normalized = relative.replaceAll("\\", "/");
  const inSharedApi = normalized.startsWith("shared/api/");
  const found: string[] = [];

  if (new RegExp(`${errorLike}\\s*(?:\\?\\.|\\.)\\s*(?:${textMethods})\\s*\\(`).test(source)
    || new RegExp(`${errorLike}\\s*[!=]==?|[!=]==?\\s*[\\w.?]*${errorLike}`).test(source)
    || new RegExp(`switch\\s*\\(\\s*[\\w.?]*${errorLike}|\\.test\\(\\s*[\\w.?]*${errorLike}`).test(source)) {
    found.push("decide por el texto de un error: va por `error.code`");
  }
  if (inSharedApi) return found;

  // El error de un campo de react-hook-form (`fieldState.error`, `getFieldState(…).error`) ya es el texto para mostrar.
  if (/(?<!(?:[Ff]ieldState|\))\.)\b(?:error|err|e|caught|failure|cause|exception)\)?\??\.message\b/.test(source)) {
    found.push("muestra el `message` crudo de un error: va `apiErrorMessage` o `actionErrorMessage`");
  }
  if (/\.problem\??\.(?:detail|title)\b|\b(?:error|err|caught|failure|cause|exception)\??\.title\b/.test(source)) {
    found.push("lee el `title` o el `detail` crudo del problema: va `error.detail` o `apiErrorMessage`");
  }
  if (/\.traceId\b/.test(source)) {
    found.push("lee el `traceId`: va solo en el aviso de un 5xx, que arma `queryClient`");
  }
  return found;
}

describe("los errores se deciden por su código", () => {
  it("detecta las decisiones por el texto y el texto crudo", () => {
    expect(violations("areas/business/roles/pages/RolesPage.tsx", 'if (error.detail.includes("ya existe")) markName();')).not.toEqual([]);
    expect(violations("modules/whatsapp/chats/Chat.tsx", 'if (caught.message?.toLowerCase().includes("taken")) retry();')).not.toEqual([]);
    expect(violations("areas/platform/tenants/Page.tsx", 'const taken = error?.problem?.title === "Conflict";')).not.toEqual([]);
    expect(violations("shared/api/queryClient.ts", 'if ("Not found" === error.detail) return;')).not.toEqual([]);
    expect(violations("areas/public/auth/Login.tsx", "switch (estimateError.message) { }")).not.toEqual([]);
    expect(violations("areas/public/auth/Login.tsx", "if (/expired/i.test(e.message)) logout();")).not.toEqual([]);
    expect(violations("areas/business/users/Users.tsx", "toastError(error.message);")).not.toEqual([]);
    expect(violations("areas/business/users/Users.tsx", "<FormError message={query.error?.message} />")).not.toEqual([]);
    expect(violations("areas/business/users/Users.tsx", "setFailure(error.problem.detail);")).not.toEqual([]);
    expect(violations("areas/business/users/Users.tsx", "copy(error.traceId);")).not.toEqual([]);
    expect(violations("shared/api/queryClient.ts", "const traceId = error.traceId; new Error(problem.detail ?? problem.title);")).toEqual([]);
    expect(violations("areas/business/roles/errors.ts", 'return error instanceof ApiError && error.code === "Roles.Role.AlreadyExists" ? "name" : null;')).toEqual([]);
    expect(violations("areas/business/roles/pages/RoleEditorPage.tsx", 'form.setError(field, { type: "server", message: error.detail ?? "" });')).toEqual([]);
    expect(violations("modules/whatsapp/broadcasts/New.tsx", 'estimateError?.field === "kind" ? estimateError.message : errors.kind?.message')).toEqual([]);
    expect(violations("areas/public/auth/errors.ts", 'if (typeof error.problem.attemptsLeft === "number") push();')).toEqual([]);
    expect(violations("modules/assistant/api/stream.ts", "const failed = z.object({ code: z.string(), traceId: z.string() });")).toEqual([]);
    expect(violations("modules/whatsapp/broadcasts/pages/BroadcastPage.tsx", 'title={t("whatsapp:broadcasts.failure.title")}')).toEqual([]);
    expect(violations("shared/account/AddLoginMethodDialog.tsx", 'error={form.getFieldState("phone", form.formState).error?.message} {fieldState.error?.message}')).toEqual([]);
  });

  it("mantiene las reglas en el código de producción", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => {
      const relative = path.relative(srcRoot, file);
      return violations(relative, readFileSync(file, "utf8")).map((error) => `${relative.replaceAll("\\", "/")}: ${error}`);
    });
    expect(problems).toEqual([]);
  });
});
