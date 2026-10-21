import assert from "node:assert/strict";
import test from "node:test";
import { assistantSupplementDefinitions, assistantSupplementProofGroups, requireProjectedAssistant, requirePrivateAttachmentMetadata, requireGlobalUsage, platformSettingsValues, requirePrivateProblem, assertGlobalSettingsRestored } from "./e2e-completo-asistente-complemento.mjs";
import * as assistant from "./e2e-completo-asistente-complemento.mjs";

test("el temporizador de fases mide inicio, duración y resultado sin emitir el valor privado del callback", async () => {
  let clock = 100; const events = []; const value = { id: "identidad-privada", email: "privado@example.test", text: "Consulta privada" };
  const phase = assistant.createAssistantPhaseTimer({ now: () => clock, emit: (event) => events.push(event) });
  clock = 105;
  assert.equal(await phase("slow-send", async () => { clock = 125; return value; }), value);
  clock = 130;
  await phase("stop-visible", async () => { clock = 137; });
  assert.deepEqual(events, [
    { phase: "slow-send", elapsedMs: 5, durationMs: 0, outcome: "started" },
    { phase: "slow-send", elapsedMs: 25, durationMs: 20, outcome: "passed" },
    { phase: "stop-visible", elapsedMs: 30, durationMs: 0, outcome: "started" },
    { phase: "stop-visible", elapsedMs: 37, durationMs: 7, outcome: "passed" },
  ]);
  for (const privateValue of Object.values(value)) assert.equal(JSON.stringify(events).includes(privateValue), false);
});

test("el temporizador conserva el error original sin publicar mensaje, URL ni datos aun si el emisor falla", async () => {
  for (const brokenEmitter of [false, true]) {
    let clock = 20; const events = [];
    const failure = new Error("id-privado correo@example.test Consulta https://private.test/?code=privado");
    const phase = assistant.createAssistantPhaseTimer({ now: () => clock, emit: (event) => { events.push(event); if (brokenEmitter) throw new Error("Emisor no disponible"); } });
    clock = 25;
    await assert.rejects(() => phase("second-generating", async () => { clock = 42; throw failure; }), (error) => error === failure);
    assert.deepEqual(events, [
      { phase: "second-generating", elapsedMs: 5, durationMs: 0, outcome: "started" },
      { phase: "second-generating", elapsedMs: 22, durationMs: 17, outcome: "failed" },
    ]);
    const serialized = JSON.stringify(events);
    for (const privateValue of [failure.message, "id-privado", "correo@", "Consulta", "https:", "code=", "Emisor"]) assert.equal(serialized.includes(privateValue), false);
  }
});

test("el temporizador sólo admite nombres de fase fijos y nunca imprime una etiqueta externa", async () => {
  const events = []; let called = false;
  const phase = assistant.createAssistantPhaseTimer({ now: () => 0, emit: (event) => events.push(event) });
  await assert.rejects(() => phase("https://private.test/?token=privado", async () => { called = true; }), /Fase de medición no permitida/u);
  assert.deepEqual(events, []); assert.equal(called, false);
});

test("el PNG de preparación termina metadata, bytes y respuesta antes de habilitar el turno activo", async () => {
  const inspected = Promise.withResolvers(); const terminal = Promise.withResolvers(); const waiting = Promise.withResolvers();
  const h = {}; const page = {}; const calls = []; let ready = false;
  const detail = { conversation: { id: "propia", title: "Consulta de prueba" } }; const attachment = { fileRoute: "/archivo-propio", conversationId: "propia" };
  const options = { fileName: "propio.png", buffer: Buffer.from([1]), inspectUpload: async () => {} };
  const pending = assistant.prepareAssistantAttachmentConversation(h, page, options, {
    send: async (actualH, target, request) => {
      assert.equal(actualH, h); assert.equal(target, page); assert.equal(request.inspectUpload, options.inspectUpload);
      assert.equal(request.fileName, options.fileName); assert.equal(request.buffer, options.buffer); assert.match(request.text, /^\[E2E:answer\]/u);
      calls.push("PNG enviado en turno inicial rápido"); return { sent: { id: "propia" }, inspectedUpload: inspected.promise };
    },
    terminal: async (target, route, id) => {
      assert.equal(target, page); assert.equal(route, "/api/organization/assistant"); assert.equal(id, "propia");
      calls.push("esperar respuesta inicial"); waiting.resolve(); await terminal.promise; return detail;
    },
  }).then((value) => { ready = true; calls.push("habilitar preparación del turno activo"); return value; });
  await waiting.promise; assert.equal(ready, false);
  terminal.resolve(); await Promise.resolve(); await Promise.resolve(); assert.equal(ready, false, "No basta iniciar la descarga antes del Fake: sus bytes deben estar comprobados.");
  inspected.resolve(attachment); assert.deepEqual(await pending, { id: "propia", detail, attachment });
  assert.deepEqual(calls, ["PNG enviado en turno inicial rápido", "esperar respuesta inicial", "habilitar preparación del turno activo"]);
});

test("el fallo en la preparación del PNG espera la otra tarea antes de permitir cleanup", async () => {
  for (const failureAt of ["archivo", "respuesta"]) {
    const failure = new Error(`Falló ${failureAt}`); const release = Promise.withResolvers(); const waiting = Promise.withResolvers(); let completed = false;
    const independent = async () => { waiting.resolve(); await release.promise; completed = true; };
    const inspectedUpload = failureAt === "archivo" ? Promise.reject(failure) : independent(); void inspectedUpload.catch(() => {});
    const pending = assistant.prepareAssistantAttachmentConversation({}, {}, {}, {
      send: async () => ({ sent: { id: "propia" }, inspectedUpload }),
      terminal: async () => failureAt === "respuesta" ? Promise.reject(failure) : independent(),
    });
    void pending.catch(() => {}); await waiting.promise; await Promise.resolve(); assert.equal(completed, false);
    release.resolve(); await assert.rejects(() => pending, (error) => error === failure); assert.equal(completed, true);
  }
});

test("la preparación lista por UI el chat propio antes del turno activo y sus acciones usan la fila seleccionada aun con títulos repetidos", async () => {
  for (const width of [1440, 390]) {
    const calls = []; const page = {}; const detail = { conversation: { id: "propia", title: "Consulta de prueba" } };
    let historyOpen = width === 1440;
    const row = { getByRole: (role, options) => {
      assert.equal(role, "button"); assert.deepEqual(options, { name: "Acciones de Consulta de prueba", exact: true });
      return { waitFor: async () => { assert.equal(historyOpen, true); calls.push("fila propia listada"); }, press: async (key) => { assert.equal(key, "Enter"); calls.push("abrir acciones de la fila propia"); } };
    } };
    const selected = { locator: (selector) => { assert.equal(selector, ".."); return row; } };
    const titleButton = { and: (current) => { assert.equal(current, "aria-current=true"); calls.push("limitar a selección propia"); return selected; } };
    page.locator = (selector) => { assert.equal(selector, '[aria-current="true"]'); return "aria-current=true"; };
    page.keyboard = { press: async (key) => { assert.equal(key, "Escape"); historyOpen = false; calls.push("cerrar historial"); } };
    page.getByRole = (role, options) => {
      assert.equal(options.exact, true);
      if (role === "menuitem") { assert.equal(options.name, "Borrar: Consulta de prueba"); return { press: async (key) => { assert.equal(key, "Enter"); calls.push("elegir Borrar"); } }; }
      assert.equal(role, "button");
      if (options.name === "Conversaciones") return { click: async () => { historyOpen = true; calls.push("abrir historial"); }, press: async (key) => { assert.equal(key, "Enter"); historyOpen = true; calls.push("abrir historial"); } };
      assert.equal(options.name, "Consulta de prueba", "No busca acciones globales ni conserva el título nulo del primer turno."); return titleButton;
    };
    const h = { width }; const primed = await assistant.prepareListedAssistantConversation(h, page, { send: async (actualH, target, text) => {
      assert.equal(actualH, h); assert.equal(target, page); assert.match(text, /^\[E2E:answer\]/u); calls.push("turno rápido propio completado"); return { id: "propia", detail };
    } });
    assert.deepEqual(primed, { id: "propia", detail, title: "Consulta de prueba" });
    assert.equal(calls[0], "turno rápido propio completado"); assert.ok(calls.includes("fila propia listada"));
    if (width === 390) assert.equal(historyOpen, false, "El compositor queda disponible para el turno lento.");
    calls.push("turno lento en el mismo ID");
    const phases = [];
    await assistant.openListedAssistantConversationAction(page, width, primed.title, "Borrar", {
      phase: async (name, action) => { phases.push(name); return action(); },
    });
    assert.deepEqual(phases, [...(width === 390 ? ["history-open"] : []), "actions-open", "delete-menuitem"]);
    assert.deepEqual(calls.slice(-2), ["abrir acciones de la fila propia", "elegir Borrar"]);
  }
});

test("el turno activo usa Enter real después de armar su waiter y conserva admisión200 y SSE", async () => {
  const calls = []; let match;
  const response = { url: () => "https://localtest.me/api/organization/assistant/conversations/propia/messages", request: () => ({ method: () => "POST" }), status: () => 200, headers: () => ({ "content-type": "text/event-stream" }) };
  const page = { waitForResponse: (predicate) => { match = predicate; calls.push("observar POST antes de Enter"); return Promise.resolve(response); }, getByRole: (role, options) => {
    assert.equal(options.exact, true);
    if (role === "textbox") { assert.equal(options.name, "Tu consulta"); return { fill: async (text) => { assert.equal(text, "[E2E:slow] Turno activo"); calls.push("escribir consulta"); } }; }
    assert.equal(role, "button"); assert.equal(options.name, "Enviar");
    return { press: async (key) => { assert.equal(key, "Enter"); assert.equal(match(response), true); calls.push("Enviar con Enter"); } };
  } };
  assert.deepEqual(await assistant.sendAssistantActiveTurn({}, page, "[E2E:slow] Turno activo"), { id: "propia" });
  assert.deepEqual(calls, ["escribir consulta", "observar POST antes de Enter", "Enviar con Enter"]);
});

test("la confirmación por Enter exige el mismo DELETE204 y no acepta409 ni un endpoint ajeno", async () => {
  const route = "/api/organization/assistant/conversations/propia";
  for (const status of [204, 409]) {
    const response = { url: () => `https://localtest.me${route}`, request: () => ({ method: () => "DELETE" }), status: () => status };
    let observing = false; let activated = false;
    const page = { waitForResponse: (predicate) => {
      observing = true; assert.equal(predicate(response), true);
      assert.equal(predicate({ ...response, request: () => ({ method: () => "GET" }) }), false);
      assert.equal(predicate({ ...response, url: () => `https://localtest.me${route}/ajena` }), false);
      return Promise.resolve(response);
    } };
    const control = { press: async (key) => { assert.equal(key, "Enter"); assert.equal(observing, true); activated = true; } };
    const result = assistant.pressAssistantActionForResponse(page, control, route, "DELETE", 204);
    if (status === 204) assert.equal(await result, response); else await assert.rejects(() => result, { actual: 409, expected: 204 });
    assert.equal(activated, true);
  }
});

test("la preparación no acredita una fila de otro ID ni inventa un título si el DTO propio aún no lo tiene", async () => {
  for (const conversation of [{ id: "otra", title: "Consulta de prueba" }, { id: "propia", title: null }]) {
    const page = { getByRole: () => assert.fail("No usa una fila sin identidad y título reales.") };
    await assert.rejects(() => assistant.prepareListedAssistantConversation({ width: 1440 }, page, { send: async () => ({ id: "propia", detail: { conversation } }) }));
  }
});

test("el feedback ajeno espera la aceptación real del aviso propio y conserva payload, 404 y privacidad", async () => {
  const calls = []; const response = { status: () => 404, json: async () => ({ code: "Assistant.Conversation.NotFound", traceId: "traza-propia" }) };
  const page = {}; const chat = { id: "chat-ajeno", detail: { messages: { items: [{ id: "pregunta", role: "user", version: 1 }, { id: "respuesta-ajena", role: "assistant", version: 7 }] } } };
  const h = { api: async (target, route, options) => {
    assert.equal(target, page); assert.equal(route, "/api/organization/assistant/conversations/chat-ajeno/messages/respuesta-ajena/feedback");
    assert.deepEqual(options, { method: "PUT", data: { rating: "up", version: 7 } }); calls.push("PUT feedback ajeno"); return response;
  } };
  const result = await assistant.requireForeignAssistantFeedbackAfterNotice(h, page, chat, async () => { calls.push("aceptar aviso del Dueño por UI"); calls.push("compositor visible"); });
  assert.equal(result.code, "Assistant.Conversation.NotFound");
  assert.deepEqual(calls, ["aceptar aviso del Dueño por UI", "compositor visible", "PUT feedback ajeno"]);
  const failure = new Error("El aviso propio no se aceptó"); let requested = false;
  await assert.rejects(() => assistant.requireForeignAssistantFeedbackAfterNotice({ api: async () => { requested = true; return response; } }, page, chat, async () => { throw failure; }), (error) => error === failure);
  assert.equal(requested, false);
});

test("el fallo de feedback identifica operación, estado y código sin imprimir cuerpo ni direcciones privadas", async () => {
  for (const code of ["Assistant.Notice.AcceptanceRequired", "https://private.test/?token=oculto"]) {
    const h = { api: async () => ({ status: () => 400, json: async () => ({ code, traceId: "privada", detail: "contenido privado", url: "https://private.test/?token=oculto" }) }) };
    const chat = { id: "ajeno", detail: { messages: { items: [{ id: "respuesta", role: "assistant", version: 7 }] } } };
    await assert.rejects(() => assistant.requireForeignAssistantFeedbackAfterNotice(h, {}, chat, async () => {}), (error) => {
      assert.match(error.message, /PUT \/api\/organization\/assistant\/conversations\/:id\/messages\/:messageId\/feedback/u);
      assert.match(error.message, /estado 400/u);
      assert.ok(error.message.includes(`problem.code ${code.startsWith("Assistant.") ? code : "no disponible"}`));
      for (const secret of ["contenido privado", "https:", "private.test", "token", "oculto", "privada"]) assert.equal(error.message.includes(secret), false);
      return true;
    });
  }
});

test("Borrar abre el diálogo mientras siguen las lecturas independientes y sólo envía tras validarlas y releer Generating", async () => {
  const calls = []; const inspected = Promise.withResolvers(); const opened = Promise.withResolvers();
  const counters = { titleCalls: 4 }; const dialog = {};
  const pending = assistant.deleteActiveAssistantConversation({
    inspectAttachment: async () => { calls.push("descarga iniciada"); await inspected.promise; calls.push("bytes y headers válidos"); },
    readCounters: async () => { calls.push("contadores reales"); return counters; },
    openDialog: async () => { calls.push("primer GET Generating"); calls.push("Borrar abierto por UI"); opened.resolve(); return dialog; },
    requireGenerating: async () => calls.push("segundo GET Generating"),
    deleteByUi: async (target) => { assert.equal(target, dialog); calls.push("DELETE204 por clic UI"); },
  });
  await opened.promise;
  assert.ok(calls.includes("descarga iniciada")); assert.equal(calls.includes("DELETE204 por clic UI"), false);
  inspected.resolve(); assert.deepEqual(await pending, { counters });
  assert.deepEqual(calls.slice(-3), ["bytes y headers válidos", "segundo GET Generating", "DELETE204 por clic UI"]);
});

test("fallo de probe o segundo Generating impide DELETE y espera la UI pendiente antes de devolver el control al cleanup", async () => {
  for (const failureAt of ["adjunto", "Generating"]) {
    const failure = new Error("Fallo " + failureAt); const open = Promise.withResolvers(); const started = Promise.withResolvers();
    let uiFinished = false; let removed = false; let cleaned = false;
    const run = async () => {
      try {
        return await assistant.deleteActiveAssistantConversation({
          inspectAttachment: async () => { if (failureAt === "adjunto") throw failure; }, readCounters: async () => ({ titleCalls: 0 }),
          openDialog: async () => { started.resolve(); await open.promise; uiFinished = true; return {}; },
          requireGenerating: async () => { if (failureAt === "Generating") throw failure; }, deleteByUi: async () => { removed = true; },
        });
      } finally { assert.equal(uiFinished, true); cleaned = true; }
    };
    const pending = run(); void pending.catch(() => {}); await started.promise;
    await Promise.resolve(); assert.equal(cleaned, false); assert.equal(removed, false);
    open.resolve(); await assert.rejects(() => pending, (error) => error === failure);
    assert.equal(cleaned, true); assert.equal(removed, false);
  }
});

test("Inicio de Administrador acepta el aviso real antes de exigir Tus empresas, sin confundir ese heading temprano con readiness", async () => {
  for (const width of [1440, 390]) for (const missingHome of [false, true]) {
    const calls = []; let accepted = false; let ready = false; const failure = new Error("Tus empresas ausente");
    const assistantReady = { or() { return this; }, first() { return this; }, waitFor: async () => { ready = true; calls.push("Asistente listo con aviso"); } };
    const notice = { or: () => assistantReady, isVisible: async () => { assert.equal(ready, true); return !accepted; },
      getByRole: (role, options) => { assert.equal(role, "button"); assert.deepEqual(options, { name: "Entendido", exact: true }); return { click: async () => { accepted = true; calls.push("aceptar aviso UI"); } }; },
      waitFor: async (options) => { assert.deepEqual(options, { state: "hidden" }); assert.equal(accepted, true); calls.push("aviso cerrado"); },
    };
    const page = { goto: async (url) => { assert.equal(url, "https://localtest.me/org"); calls.push("abrir Inicio"); }, getByRole: (role, options) => {
      if (role === "dialog") { assert.equal(width, 1440); assert.deepEqual(options, { name: "Antes de tu primera consulta", exact: true }); return notice; }
      assert.equal(role, "heading");
      if (options.name === "Tus empresas") return { waitFor: async () => {
        if (width === 1440) assert.equal(accepted, true, "El aviso modal debe estar aceptado antes de buscar su contenido oculto.");
        calls.push("Tus empresas"); if (missingHome) throw failure;
      } };
      assert.ok(["¿Qué querés consultar?", "El asistente todavía no está configurado"].includes(options.name)); return assistantReady;
    } };
    const open = () => assistant.openProjectedAssistantCompanyHome({ width, base: new URL("https://localtest.me") }, page);
    if (missingHome) await assert.rejects(open, (error) => error === failure); else await open();
    assert.deepEqual(calls, ["abrir Inicio", ...(width === 1440 ? ["Asistente listo con aviso", "aceptar aviso UI", "aviso cerrado"] : []), "Tus empresas"]);
  }
});

test("el focal de adjunto sólo registra06 y su fixture proyectada01 no recibe evidencia propia", async () => {
  assert.deepEqual(assistant.assistantAttachmentRepairDefinitions.map(({ id }) => id), ["AS-SUP-06"]);
  const records = []; let logins = 0; let closed = 0;
  const h = { width: 1440, base: new URL("https://localtest.me"), env: { command: async () => assert.fail("No llegó al control") },
    newPage: async () => ({ close: async () => closed++ }), login: async () => { logins++; throw new Error("Preparación privada de06"); },
    record: async (id, _getPage, action) => { records.push(id); try { return { ok: true, value: await action() }; } catch (error) { assert.equal(error.message, "Preparación privada de06"); return { ok: false, error }; } },
  };
  await assistant.runAssistantAttachmentRepairCases(h);
  assert.deepEqual(records, ["AS-SUP-06"]); assert.equal(logins, 1); assert.equal(closed, 2);
});

test("el adjunto local se selecciona antes de Enviar y su POST real se espera después de esa acción", async () => {
  const pending = []; const calls = []; const id = "conversacion-propia";
  const response = (suffix, status) => ({ url: () => `https://localtest.me/api/organization/assistant/conversations/${id}/${suffix}`, request: () => ({ method: () => "POST" }), status: () => status, headers: () => ({ "content-type": "text/event-stream" }) });
  const upload = response("attachments", 201); const sent = response("messages", 200);
  const page = { waitForResponse: (predicate) => { const entry = { predicate, ...Promise.withResolvers() }; pending.push(entry); return entry.promise; },
    locator: (selector) => { assert.equal(selector, 'input[type="file"]'); return { setInputFiles: async (file) => { assert.equal(file.name, "propio.png"); assert.equal(file.mimeType, "image/png"); calls.push("seleccionar local"); assert.equal(pending.length, 1); } }; },
    getByRole: (role, options) => {
      assert.equal(options.exact, true);
      if (role === "textbox") { assert.equal(options.name, "Tu consulta"); return { fill: async (text) => { assert.equal(text, "[E2E:slow] Turno con imagen"); calls.push("escribir consulta"); } }; }
      assert.equal(role, "button"); assert.equal(options.name, "Enviar");
      return { click: async () => { calls.push("Enviar UI"); assert.equal(pending.length, 2); for (const reply of [upload, sent]) { const matched = pending.filter((entry) => entry.predicate(reply)); assert.equal(matched.length, 1); matched[0].resolve(reply); } } };
    },
  };
  const result = await assistant.sendAssistantAttachmentTurn({}, page, { fileName: "propio.png", buffer: Buffer.from([1]), text: "[E2E:slow] Turno con imagen" });
  assert.equal(result.upload, upload); assert.equal(result.sent.id, id);
  assert.deepEqual(calls, ["seleccionar local", "escribir consulta", "Enviar UI"]);
});

test("el timeout del adjunto conserva su causa e identifica la etapa y ambos POST por paths seguros", async () => {
  const failure = new Error("page.waitForResponse: Timeout esperando adjunto"); let observed = 0;
  const page = { waitForResponse: () => ++observed === 1 ? Promise.reject(failure) : Promise.resolve({ status: () => 200, headers: () => ({ "content-type": "text/event-stream" }), url: () => "https://localtest.me/api/organization/assistant/conversations/privada/messages?token=oculto" }),
    locator: () => ({ setInputFiles: async () => {} }), getByRole: (role) => role === "textbox" ? { fill: async () => {} } : { click: async () => {} },
  };
  await assert.rejects(() => assistant.sendAssistantAttachmentTurn({}, page, { fileName: "privado.png", buffer: Buffer.from([1]), text: "consulta privada" }), (error) => {
    assert.equal(error.cause, failure); assert.match(error.message, /etapa esperar adjunto/u);
    for (const resource of ["attachments", "messages"]) assert.ok(error.message.includes(`POST /api/organization/assistant/conversations/:id/${resource}`));
    for (const secret of ["localtest", "oculto", "privada", "privado.png"]) assert.equal(error.message.includes(secret), false); return true;
  });
});

test("inspecciona el upload real antes de recibir la admisión del turno lento y espera sus checks antes de Borrar", async () => {
  const replies = []; const calls = []; const inspected = Promise.withResolvers(); let inspectionStarted = false;
  const response = (suffix, status) => ({ url: () => `https://localtest.me/api/organization/assistant/conversations/propia/${suffix}`, request: () => ({ method: () => "POST" }), status: () => status, headers: () => ({ "content-type": "text/event-stream" }) });
  const upload = response("attachments", 201); const sent = response("messages", 200);
  const page = { waitForResponse: (predicate) => { const reply = { predicate, ...Promise.withResolvers() }; replies.push(reply); return reply.promise; }, locator: () => ({ setInputFiles: async () => {} }),
    getByRole: (role) => role === "textbox" ? { fill: async () => {} } : { click: async () => {
      replies.find((reply) => reply.predicate(upload)).resolve(upload);
      await Promise.resolve(); await Promise.resolve();
      assert.equal(inspectionStarted, true, "No espera el POST messages para empezar metadata y descarga privada.");
      calls.push("admisión del turno lento"); replies.find((reply) => reply.predicate(sent)).resolve(sent);
    } },
  };
  const result = await assistant.sendAssistantAttachmentTurn({}, page, { fileName: "propio.png", buffer: Buffer.from([1]), text: "[E2E:slow] Consulta",
    inspectUpload: async (actual) => { assert.equal(actual, upload); inspectionStarted = true; calls.push("metadata y bytes iniciados"); await inspected.promise; calls.push("metadata y bytes verificados"); return "archivo propio"; },
  });
  const deletion = assistant.deleteActiveAssistantConversation({ inspectAttachment: () => result.inspectedUpload, readCounters: async () => ({ titleCalls: 1 }),
    openDialog: async () => { calls.push("abrir Borrar por UI"); return {}; }, requireGenerating: async () => calls.push("exigir Generating"), deleteByUi: async () => calls.push("DELETE204 por UI") });
  await Promise.resolve(); assert.equal(calls.includes("abrir Borrar por UI"), true); assert.equal(calls.includes("DELETE204 por UI"), false);
  inspected.resolve(); await deletion;
  assert.deepEqual(calls, ["metadata y bytes iniciados", "admisión del turno lento", "abrir Borrar por UI", "metadata y bytes verificados", "exigir Generating", "DELETE204 por UI"]);
});

test("la reparación del operador sólo registra05 con su callback, sin ejecutar01–04 ni06", async () => {
  assert.deepEqual(assistant.assistantOperatorRepairDefinitions.map((entry) => entry.id), ["AS-SUP-05"]);
  const records = []; let closed = 0; let logins = 0;
  const h = { width: 390, base: new URL("https://localtest.me"), env: { command: async () => assert.fail("No llegó al control") }, newPage: async () => ({ close: async () => closed++ }),
    login: async () => { logins++; throw new Error("Preparación de operador"); }, record: async (id, _getPage, action) => { records.push(id); try { return { ok: true, value: await action() }; } catch (error) { assert.equal(error.message, "Preparación de operador"); return { ok: false, error }; } },
  };
  await assistant.runAssistantOperatorRepairCases(h); assert.deepEqual(records, ["AS-SUP-05"]); assert.equal(logins, 1); assert.equal(closed, 2);
});

test("las tarifas normales se completan sólo dentro del grupo Caché, sin tocar Contexto largo", async () => {
  const filled = [];
  const cache = { getByRole: (role, options) => {
    assert.equal(role, "textbox"); assert.equal(options.exact, true);
    assert.ok(["Lectura de caché", "Escritura de 5 minutos", "Escritura de 1 hora"].includes(options.name));
    return { fill: async (value) => filled.push(["Caché", options.name, value]) };
  } };
  const dialog = { getByRole: (role, options) => {
    assert.equal(options.exact, true);
    if (role === "group") { assert.equal(options.name, "Caché · por millón de tokens"); return cache; }
    assert.equal(role, "textbox"); assert.ok(["Contexto (tokens)", "Salida máxima (tokens)"].includes(options.name), "Las etiquetas de tarifa se repiten en Contexto largo y no se buscan globalmente.");
    return { fill: async (value) => filled.push(["Límites", options.name, value]) };
  } };
  await assistant.fillAssistantModelTechnicalValues(dialog);
  assert.deepEqual(filled, [["Límites", "Contexto (tokens)", "100000"], ["Límites", "Salida máxima (tokens)", "1024"], ["Caché", "Lectura de caché", "1"], ["Caché", "Escritura de 5 minutos", "1"], ["Caché", "Escritura de 1 hora", "1"]]);
});

test("una tarifa no disponible mantiene el fallo y no recurre al input homónimo de Contexto largo", async () => {
  const failure = new Error("No apareció la tarifa normal"); let limits = 0;
  const dialog = { getByRole: (role, options) => {
    if (role === "textbox") { assert.ok(options.name.endsWith("(tokens)")); return { fill: async () => limits++ }; }
    assert.equal(role, "group"); assert.equal(options.name, "Caché · por millón de tokens");
    return { getByRole: () => ({ fill: async () => { throw failure; } }) };
  } };
  await assert.rejects(() => assistant.fillAssistantModelTechnicalValues(dialog), (error) => error === failure); assert.equal(limits, 2);
});

test("salir del acceso público espera Mi cuenta y Me200 antes de usar Salir, con captura de esa pestaña", async () => {
  const ready = Promise.withResolvers(); const waiting = Promise.withResolvers(); const calls = [];
  const page = { goto: async (url) => { assert.equal(new URL(url).pathname, "/cuenta"); calls.push("abrir cuenta"); }, getByRole: (role, options) => {
    assert.equal(role, "heading"); assert.deepEqual(options, { name: "Mi cuenta", exact: true });
    return { waitFor: async (options) => { assert.equal(options, undefined, "No aumenta el timeout."); waiting.resolve(); await ready.promise; calls.push("cuenta lista"); } };
  } };
  const h = { base: new URL("https://localtest.me"), api: async (target, route) => { assert.equal(target, page); assert.equal(route, "/api/me"); calls.push("Me200"); return { status: () => 200, json: async () => ({ access: "business" }) }; }, signOut: async (target) => { assert.equal(target, page); calls.push("salir UI"); } };
  const pending = assistant.closeAssistantPublicSession(h, page, { setCapture: (target) => { assert.equal(target, page); calls.push("captura pública"); }, discardDraft: async () => calls.push("descartar propio") });
  await waiting.promise; assert.deepEqual(calls, ["captura pública", "descartar propio", "abrir cuenta"]); ready.resolve(); await pending;
  assert.deepEqual(calls, ["captura pública", "descartar propio", "abrir cuenta", "cuenta lista", "Me200", "salir UI"]);
});

test("una cuenta que no termina de cargar sigue fallando y no llama Salir ni consulta API", async () => {
  const failure = new Error("Mi cuenta siguió cargando"); let capture;
  const page = { goto: async () => {}, getByRole: () => ({ waitFor: async () => { throw failure; } }) };
  await assert.rejects(() => assistant.closeAssistantPublicSession({ base: new URL("https://localtest.me"), api: async () => assert.fail("No hay marco listo"), signOut: async () => assert.fail("No hay marco listo") }, page, { setCapture: (target) => { capture = target; }, discardDraft: async () => {} }), (error) => error === failure);
  assert.equal(capture, page);
});

test("salir de Plataforma espera su marco y Me platform200 en la pestaña que se capturará", async () => {
  const calls = []; const frame = { or: () => frame, filter: () => frame, first: () => frame, waitFor: async () => calls.push("marco propio") };
  const page = { goto: async (url) => { assert.equal(new URL(url).pathname, "/plataforma"); calls.push("abrir plataforma"); }, getByRole: (role, options) => { assert.ok(role === "button" || role === "navigation"); if (role === "navigation") assert.deepEqual(options, { name: "Secciones", exact: true }); return frame; } };
  const h = { base: new URL("https://localtest.me"), api: async () => { calls.push("Me platform200"); return { status: () => 200, json: async () => ({ access: "platform" }) }; }, signOut: async (target) => { assert.equal(target, page); calls.push("salir UI"); } };
  await assistant.closeAssistantPlatformSession(h, page, { setCapture: (target) => { assert.equal(target, page); calls.push("captura plataforma"); }, discardDraft: async () => calls.push("descartar propio") });
  assert.deepEqual(calls, ["captura plataforma", "descartar propio", "abrir plataforma", "marco propio", "Me platform200", "salir UI"]);
});

test("la política OwnKey espera una acción real antes de decidir si debe permitirla", async () => {
  for (const alreadyAllowed of [false, true]) {
    const ready = Promise.withResolvers(); const waiting = Promise.withResolvers(); const calls = []; let loaded = false;
    const allow = { or: () => ({ filter: () => ({ first: () => ({ waitFor: async () => { waiting.resolve(); await ready.promise; loaded = true; } }) }) }), isVisible: async () => { assert.equal(loaded, true, "No se decide por ausencia durante la carga."); calls.push("decidir política"); return !alreadyAllowed; } };
    const revoke = {};
    const page = { getByRole: (role, options) => {
      if (role === "button") { assert.deepEqual(options, { name: "Acciones de Asistente", exact: true }); return { click: async () => calls.push("abrir acciones") }; }
      assert.equal(role, "menuitem"); assert.equal(options.exact, true);
      if (options.name === "Permitir su propia clave") return allow;
      assert.equal(options.name, "Solo con la clave de la plataforma"); return revoke;
    } };
    const pending = assistant.openAssistantOwnKeyPolicyAction(page); await waiting.promise; assert.deepEqual(calls, ["abrir acciones"]); ready.resolve();
    assert.equal(await pending, alreadyAllowed ? null : allow); assert.deepEqual(calls, ["abrir acciones", "decidir política"]);
  }
});

test("la reparación sólo registra02/03/04/06; la fixture01 de06 nunca recibe resultado propio", async () => {
  assert.deepEqual(assistant.assistantPreparationRepairDefinitions.map((entry) => entry.id), ["AS-SUP-02", "AS-SUP-03", "AS-SUP-04", "AS-SUP-06"]);
  const records = []; let closed = 0; let logins = 0;
  const h = { width: 1440, base: new URL("https://localtest.me"), env: { command: async () => assert.fail("No llegó al control") },
    newPage: async () => ({ close: async () => { closed++; } }), login: async (_page, email, access) => { assert.equal(email, "e2e-e9a-operator@example.test"); assert.equal(access, "platform"); logins++; throw new Error("Preparación sin ingreso"); },
    record: async (id, _getPage, action) => { records.push(id); try { return { ok: true, value: await action() }; } catch (error) { assert.equal(error.message, "Preparación sin ingreso"); return { ok: false, error }; } },
  };
  await assistant.runAssistantPreparationRepairCases(h);
  assert.deepEqual(records, ["AS-SUP-02", "AS-SUP-03", "AS-SUP-04", "AS-SUP-06"]); assert.equal(logins, 4); assert.equal(closed, 2);
});

test("Home fallido conserva la causa y sólo informa campos seguros reales sin alterar ni reintentar la UI", async () => {
  const cause = new Error("El marco no mostró Asistente"); const calls = []; const page = {};
  const privateId = "identificador-privado"; const privateText = "Texto de una conversación privada";
  const h = { api: async (target, route) => {
    assert.equal(target, page); calls.push(route);
    return { status: () => 200, json: async () => route === "/api/me" ? { access: "business", activeTenantId: privateId, features: [], effectivePermissions: { organization: ["assistant.use", "assistant.configure"] }, displayName: privateText }
      : { configured: true, canConfigure: true, quickQueries: [{ text: privateText }], conversationId: privateId } };
  } };
  await assert.rejects(() => assistant.withAssistantHomeDiagnostics(h, page, { access: "business", expectedTenantId: privateId }, async () => { calls.push("UI original"); throw cause; }), (error) => {
    assert.equal(error.cause, cause); assert.match(error.message, /El marco no mostró Asistente/u);
    assert.match(error.message, /"meAccess":"business"/u); assert.match(error.message, /"activeTenantMatch":true/u);
    assert.match(error.message, /"hasAssistantFeature":false/u); assert.match(error.message, /"assistantUse":true/u); assert.match(error.message, /"assistantConfigure":true/u);
    assert.match(error.message, /"canUseFromMe":false/u); assert.match(error.message, /"stateConfigured":true/u); assert.match(error.message, /"stateCanConfigure":true/u);
    assert.equal(error.message.includes(privateId), false); assert.equal(error.message.includes(privateText), false);
    assert.equal(error.message.includes("quickQueries"), false); return true;
  });
  assert.deepEqual(calls, ["UI original", "/api/me", "/api/organization/assistant"]);
  assert.equal(cause.message, "El marco no mostró Asistente", "No cambia el error original.");
});

test("el diagnóstico no fabrica permisos ni State cuando las lecturas no están disponibles", async () => {
  const cause = new Error("Home no disponible"); let calls = 0;
  await assert.rejects(() => assistant.withAssistantHomeDiagnostics({ api: async () => { calls++; if (calls === 1) throw new Error("Bearer privado jamás debe publicarse"); return { status: () => 403, json: async () => assert.fail("No leer ProblemDetails como State") }; } }, {}, { access: "business", expectedTenantId: "privada" }, async () => { throw cause; }), (error) => {
    assert.equal(error.cause, cause); assert.match(error.message, /"meStatus":null/u); assert.match(error.message, /"stateStatus":403/u);
    assert.match(error.message, /"activeTenantMatch":null/u); assert.match(error.message, /"canUseFromMe":null/u); assert.match(error.message, /"stateConfigured":null/u);
    assert.equal(error.message.includes("Bearer privado"), false); return true;
  });
  assert.equal(calls, 2);
});

test("Home correcto no agrega lecturas diagnósticas ni cambia su resultado", async () => {
  const result = {};
  assert.equal(await assistant.withAssistantHomeDiagnostics({ api: async () => assert.fail("Sólo diagnosticar fallos") }, {}, { access: "business", expectedTenantId: "propia" }, async () => result), result);
});

test("seis registros y los grupos de archivos/aislamiento nunca aprueban parcialmente", () => {
  assert.equal(assistantSupplementDefinitions.length, 6); assert.equal(new Set(assistantSupplementDefinitions.map((row) => row.id)).size, 6);
  assert.deepEqual(assistantSupplementDefinitions.flatMap((row) => row.covers).sort(), ["BACK-AS-002", "BACK-AS-017", "BACK-AS-019", "BACK-AS-020", "BACK-AS-021"]);
  assert.deepEqual(assistantSupplementProofGroups["BACK-AS-014"], [["MOD-03", "MOD-27", "AS-TEC-03"]]);
  assert.deepEqual(assistantSupplementProofGroups["BACK-AS-011"], [["BASE-E8B-30-4", "AS-SUP-06"]]);
  for (const alternatives of Object.values(assistantSupplementProofGroups)) for (const group of alternatives) {
    assert.ok(group.length > 1); assert.equal(new Set(group).size, group.length);
    const onlyOne = new Set(group.slice(0, 1)); assert.equal(alternatives.some((candidate) => candidate.every((id) => onlyOne.has(id))), false);
  }
});

test("la proyección exige empresa activa y uso sin configure ni permisos administrativos", () => {
  const me = { access: "business", activeTenantId: "org", effectivePermissions: { organization: ["assistant.use"], companies: { company: ["company.members.read"] }, platform: [] } };
  requireProjectedAssistant(me, "org", "company");
  for (const organization of [[], ["assistant.use", "assistant.configure"], ["assistant.use", "users.manage"]]) assert.throws(() => requireProjectedAssistant({ ...me, effectivePermissions: { ...me.effectivePermissions, organization } }, "org", "company"));
  assert.throws(() => requireProjectedAssistant(me, "ajena", "company")); assert.throws(() => requireProjectedAssistant(me, "org", "ajena"));
});

test("los metadatos del archivo sólo contienen contrato privado y nunca URL o clave de storage", () => {
  const metadata = { id: "propio", fileName: "propio.png", mediaType: "image/png", byteLength: 71, version: 4 };
  requirePrivateAttachmentMetadata(metadata, "propio.png", 71);
  for (const leak of [{ url: "https://public.invalid/file" }, { storageKey: "clave" }, { nested: { bytes: [1] } }]) assert.throws(() => requirePrivateAttachmentMetadata({ ...metadata, ...leak }, "propio.png", 71));
  assert.throws(() => requirePrivateAttachmentMetadata({ ...metadata, byteLength: 72 }, "propio.png", 71));
});

const usage = () => ({ month: "2026-10", cost: { amount: 15, currency: "USD" }, platformKeyCost: { amount: 10, currency: "USD" }, totalQueries: 4, rows: { items: [
  { kind: "organization", organizationId: "org", fundingMode: "PlatformKey", queries: 1, cost: { amount: 2, currency: "USD" } },
  { kind: "organization", organizationId: "org", fundingMode: "OwnKey", queries: 1, cost: { amount: 5, currency: "USD" } },
  { kind: "personal", organizationId: null, fundingMode: "PlatformKey", queries: 1, cost: { amount: 3, currency: "USD" } },
  { kind: "operator", organizationId: null, fundingMode: "PlatformKey", queries: 1, cost: { amount: 5, currency: "USD" } },
], totalCount: 4 } });
test("uso global exige las tres clases, ambas financiaciones y separación real de costos sin contenido privado", () => {
  requireGlobalUsage(usage(), "org", ["consulta privada"]);
  const missing = usage(); missing.rows.items.splice(1, 1); assert.throws(() => requireGlobalUsage(missing, "org"));
  const bad = usage(); bad.platformKeyCost.amount = 15; assert.throws(() => requireGlobalUsage(bad, "org"));
  const leaked = usage(); leaked.rows.items[0].conversationId = "secreto"; assert.throws(() => requireGlobalUsage(leaked, "org"));
  const text = usage(); text.rows.items[0].displayName = "consulta privada"; assert.throws(() => requireGlobalUsage(text, "org", ["consulta privada"]));
});

test("la restauración compara todos los campos públicos y conserva la clave write-only sin introducir secretos", () => {
  const settings = { defaultModelId: "modelo", allowedModelIds: ["modelo"], effort: "low", dailyMessageLimit: 50, monthlyOrganizationBudget: { amount: 10, currency: "USD" }, personalEnabled: true, retentionDays: 30, hasKey: true, maskedKeySuffix: "-key", version: 3 };
  const before = structuredClone(settings); const payload = platformSettingsValues(settings);
  assert.equal(Object.hasOwn(payload, "apiKey"), false); assert.equal(payload.keyAction, "keep"); assert.deepEqual(settings, before);
  assertGlobalSettingsRestored(settings, { ...settings, version: 8 });
  assertGlobalSettingsRestored({ ...settings, allowedModelIds: ["segundo", "modelo"] }, { ...settings, allowedModelIds: ["modelo", "segundo"] });
  for (const changed of [{ dailyMessageLimit: 51 }, { allowedModelIds: [] }, { personalEnabled: false }, { hasKey: false }]) assert.throws(() => assertGlobalSettingsRestored(settings, { ...settings, ...changed }));
});

test("la negativa privada exige código/traza y rechaza URL, bytes o cuerpo de conversación", async () => {
  const response = (body) => ({ status: () => 404, json: async () => body });
  await requirePrivateProblem(response({ code: "Assistant.Conversation.NotFound", traceId: "traza" }), 404, "Assistant.Conversation.NotFound");
  for (const leak of [{ url: "/public" }, { bytes: [1] }, { conversation: {} }]) await assert.rejects(() => requirePrivateProblem(response({ code: "Assistant.Conversation.NotFound", traceId: "traza", ...leak }), 404, "Assistant.Conversation.NotFound"));
  await assert.rejects(() => requirePrivateProblem(response({ code: "Http.NotFound", traceId: "traza" }), 404, "Assistant.Conversation.NotFound"));
});
