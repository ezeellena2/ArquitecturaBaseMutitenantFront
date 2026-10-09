import { createInterface } from "node:readline";

/** stdout FIXTURE lo consume RealE2ESetup en privado; nunca es evidencia ni un log. */
export function fixtureProtocol(input, output, { timeoutMs = 60_000 } = {}) {
  const lines = createInterface({ input });
  let waiting = null; let closed = false;
  function fail(message) {
    closed = true;
    if (waiting) { clearTimeout(waiting.timer); waiting.reject(new Error(message)); waiting = null; }
  }
  lines.on("close", () => fail("El fixture cerró el canal privado."));
  lines.on("line", (line) => {
    if (!waiting || closed) return;
    let response;
    try { response = JSON.parse(line); }
    catch { fail("El fixture devolvió una respuesta inválida."); return; }
    if (!response || typeof response !== "object" || Array.isArray(response)) { fail("El fixture devolvió una respuesta inválida."); return; }
    if (response.error) { fail("El fixture no completó la operación."); return; }
    clearTimeout(waiting.timer); waiting.resolve(response); waiting = null;
  });
  return {
    async request(message) {
      if (closed) throw new Error("El fixture cerró el canal privado.");
      if (waiting) throw new Error("El fixture tiene una operación pendiente.");
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => fail("El fixture no respondió a tiempo."), timeoutMs);
        waiting = { resolve, reject, timer };
        output.write(`FIXTURE ${JSON.stringify(message)}\n`);
      });
    },
    close() { fail("El fixture cerró el canal privado."); lines.close(); },
  };
}
