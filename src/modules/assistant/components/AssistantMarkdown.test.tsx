import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { render, screen } from "@testing-library/react";
import { authIssuer } from "@/auth/issuer";
import { AssistantMarkdown } from "./AssistantMarkdown";

afterEach(() => vi.restoreAllMocks());

describe("AssistantMarkdown", () => {
  it("muestra Markdown y GFM con estructura semántica y pasa axe", async () => {
    const { container } = render(<AssistantMarkdown text={"**Importante**\n\n- primero\n- segundo\n\n1. ordenado\n\n| Nombre | Estado |\n| --- | --- |\n| Ana | Activa |\n\n```ts\nconst value = 1;\n```"} />);

    expect(screen.getByText("Importante").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("primero");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(container.firstElementChild).toHaveClass("[&_ul]:list-disc", "[&_ol]:list-decimal");
    expect(screen.getByRole("table")).toHaveTextContent("Ana");
    expect(container.querySelector("pre code")).toHaveTextContent("const value = 1;");
    expect(container.querySelector("pre")).toHaveClass("whitespace-pre-wrap", "[overflow-wrap:anywhere]");
    expect(container.querySelector("pre")).not.toHaveClass("overflow-x-auto");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("no interpreta HTML recibido como marcado ejecutable", () => {
    const { container } = render(<AssistantMarkdown text={'Hola <script>alert("x")</script><img src="https://tracking.invalid/pixel" onerror="alert(1)">'} />);

    expect(container.querySelector("script, img, [onerror]")).not.toBeInTheDocument();
    expect(container.textContent).toContain('alert("x")');
  });

  it.each([
    ["javascript:alert(1)", "JavaScript"],
    ["data:text/html,boom", "Datos"],
    ["vbscript:msgbox(1)", "VBScript"],
    ["file:///etc/passwd", "Archivo"],
    ["mailto:user@example.com", "Correo"],
    ["https:docs.example.org/guide", "HTTP sin separador"],
    ["https:/docs.example.org/guide", "HTTP con barra incompleta"],
    ["/org/roles", "Ruta relativa"],
    ["#seccion", "Fragmento"],
    ["//outside.invalid/path", "Protocol-relative"],
    ["https://user:secret@outside.invalid/", "Credenciales"],
  ])("muestra como texto el enlace no permitido: %s", (href, label) => {
    render(<AssistantMarkdown text={`[${label}](${href})`} />);

    expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument();
    expect(screen.getByText(label)).toBeVisible();
  });

  it("muestra como texto los destinos propios de la app y de la autoridad", () => {
    const ownAppPath = `${window.location.origin}/api/assistant`;
    const ownIssuerPath = `${new URL(authIssuer).origin}/api/me`;
    render(<AssistantMarkdown text={`[App](${ownAppPath}) [Autoridad](${ownIssuerPath})`} />);

    expect(screen.queryByRole("link", { name: "App" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Autoridad" })).not.toBeInTheDocument();
    expect(screen.getByText("App")).toBeVisible();
    expect(screen.getByText("Autoridad")).toBeVisible();
  });

  it.each([
    "[Documentación](https://docs.example.org/guide)",
    "[Documentación](http://docs.example.org/guide)",
    "<https://docs.example.org/guide>",
    "https://docs.example.org/guide",
    "www.docs.example.org/guide",
    "[Documentación][guide]\n\n[guide]: https://docs.example.org/guide",
  ])("ningún enlace escrito por el modelo queda clicable: %s", (text) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<AssistantMarkdown text={text} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("a, [href], [tabindex]")).not.toBeInTheDocument();
    expect(container.textContent).toMatch(/Documentación|docs.example.org/u);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("conserva el texto alternativo de imágenes sin crear elementos que pidan recursos", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<AssistantMarkdown text="Antes ![comprobante privado](https://files.example.org/private.png) después" />);

    expect(container.querySelector("img, source, picture, iframe, object, embed")).not.toBeInTheDocument();
    expect(container.textContent).toContain("comprobante privado");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
