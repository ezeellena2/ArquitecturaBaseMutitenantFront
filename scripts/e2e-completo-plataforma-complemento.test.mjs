import assert from "node:assert/strict";
import test from "node:test";
import { supplementPlatformDefinitions, supplementPlatformProofGroups, supplementPlatformLimitations, supplementPhoneFixtures, requireAuditOnlyActor, requirePendingOperator, requireRecoveryUnchanged, requireRejectedNotice, requireCreationProfileIsolation, requireInvitedOwnerBusinessOnly, requireIdenticalReplay, requireUniqueOrganizationNotice, requireOperatorDeletion } from "./e2e-completo-plataforma-complemento.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import * as platform from "./e2e-completo-plataforma-complemento.mjs";
import { createPlatformRecorder } from "./e2e-completo-plataforma.mjs";
import { EventEmitter } from "node:events";

test("el reenvío de la ficha usa el botón en escritorio y el menú real sólo en móvil", async () => {
  for (const width of [1440, 390]) {
    const calls = []; const email = "operador-propio@example.test";
    const control = { own: true };
    const item = { click: async (options) => { assert.deepEqual(options, { timeout: 123 }); calls.push("reenviar"); } };
    const menu = { waitFor: async () => {}, getByRole: (role, options) => { assert.equal(role, "menuitem"); assert.deepEqual(options, { name: "Reenviar invitación", exact: true }); return item; } };
    const sheet = { waitFor: async (options) => { if (options?.state === "hidden") calls.push("hoja cerrada"); }, getByRole: (role) => { assert.equal(role, "menu"); return menu; } };
    const page = { viewportSize: () => ({ width }), getByRole: (role, options) => {
      calls.push([role, options.name]); assert.equal(options.exact, true);
      if (role === "dialog") { assert.equal(options.name, email); return sheet; }
      if (options.name === `Acciones de ${email}`) {
        assert.equal(width, 390); assert.equal(role, "button");
        return { getAttribute: async (name) => { assert.equal(name, "aria-haspopup"); return "dialog"; }, click: async () => calls.push("abrir hoja") };
      }
      assert.equal(options.name, "Reenviar invitación"); assert.equal(role, "button");
      return control;
    } };
    const result = await platform.operatorInvitationResendControl({ width }, page, email);
    if (width === 1440) assert.equal(result, control);
    else await result.click({ timeout: 123 });
    assert.deepEqual(calls, width === 1440 ? [["button", "Reenviar invitación"]] : [["button", `Acciones de ${email}`], "abrir hoja", ["dialog", email], "reenviar", "hoja cerrada"]);
  }
});

test("el runner móvil complementario conserva callbacks y sólo prepara02/12 para los cinco objetivos", async () => {
  const targets = [1, 4, 17, 18, 20].map((number) => `PLAT-C-${String(number).padStart(2, "0")}`);
  const fixtures = ["PLAT-C-02", "PLAT-C-12"];
  assert.deepEqual(platform.supplementPlatformMobileBarDefinitions.map((row) => row.id), targets);
  for (const row of platform.supplementPlatformMobileBarDefinitions) assert.equal(row, supplementPlatformDefinitions.find((original) => original.id === row.id));
  const recorded = []; const executed = [];
  const h = { width: 390, record: async (id, _page, action) => { recorded.push(id); return { ok: true, value: await action() }; }, block: () => assert.fail("Sin bloqueo") };
  await platform.runSupplementPlatformMobileBarCases(h, { run: async (selected) => {
    for (const row of supplementPlatformDefinitions) {
      const result = await selected.record(row.id, () => ({}), async () => executed.push(row.id));
      if (!targets.includes(row.id) && !fixtures.includes(row.id)) assert.deepEqual(result, { ok: false, skipped: true });
    }
  } });
  assert.deepEqual(new Set(recorded), new Set(targets)); assert.equal(recorded.length, targets.length);
  assert.deepEqual(new Set(executed), new Set([...targets, ...fixtures]));
  await assert.rejects(platform.runSupplementPlatformMobileBarCases({ ...h, width: 1440 }, { run: async () => assert.fail("Sólo390") }), /390/u);
});

test("el diagnóstico HTTP distingue reenvío, revocación y alta sin publicar la query", async () => {
  for (const [method, path, status] of [["POST", "/api/platform/operators/propio/invitation/resend", 200], ["DELETE", "/api/platform/operators/propio/invitation", 204], ["POST", "/api/platform/operators/invitations", 201]]) {
    const timeout = new Error("Espera de respuesta agotada");
    const page = { waitForResponse: async () => { throw timeout; } }; const button = { click: async () => {} };
    await assert.rejects(() => platform.clickSupplementHttp(page, button, path + "?proof=privado", status, method), (error) => {
      assert.ok(error.message.startsWith(`${method} ${path}: `)); assert.equal(error.message.includes("privado"), false); assert.equal(error.cause, timeout); return true;
    });
  }
});

test("la reparación de invitaciones sólo registra04 y no prepara persona, organización ni2–3", async () => {
  assert.deepEqual(platform.platformOperatorInvitationRepairDefinitions.map((entry) => entry.id), ["PLAT-C-04"]);
  const calls = []; let closed = 0;
  const page = { isClosed: () => false, close: async () => { closed++; } };
  const h = { width: 1440, newPage: async () => page,
    login: async (target, email, access) => { assert.equal(target, page); assert.equal(email, "e2e-e9r-operator@example.test"); assert.equal(access, "platform"); throw new Error("No ingresó el operador"); },
    registerPerson: async () => assert.fail("No precisa persona"), registerBusiness: async () => assert.fail("No precisa organización"),
    record: async (id, getPage, action) => { calls.push(id); assert.equal(getPage(), page); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async () => assert.fail("No hay casos dependientes"),
  };
  await platform.runPlatformOperatorInvitationRepairCases(h);
  assert.deepEqual(calls, ["PLAT-C-04"]); assert.equal(closed, 1);
});

test("el historial de una cuenta abre Historial de seguridad y exige el motivo dentro de su panel", async () => {
  for (const present of [true, false]) {
    const calls = []; const reason = "Baja propia por Plataforma";
    const page = { getByRole: (role, options) => {
      if (role === "tab") { assert.deepEqual(options, { name: "Historial de seguridad", exact: true }); return { click: async () => calls.push("abrir historial") }; }
      assert.equal(role, "tabpanel");
      return { getByText: (text, match) => { assert.equal(text, reason); assert.deepEqual(match, { exact: true }); return { filter: ({ visible }) => { assert.equal(visible, true); return { first: () => ({ waitFor: async () => { calls.push("motivo del panel"); assert.ok(present, "El motivo no está en el historial de la cuenta."); } }) }; } }; } };
    } };
    const verify = () => platform.waitForAccountHistoryReason(page, reason);
    if (present) await verify(); else await assert.rejects(verify, /motivo no está/u);
    assert.deepEqual(calls, ["abrir historial", "motivo del panel"]);
  }
});

test("la reparación18 prepara sólo persona y organización propias por UI y comparte el ciclo completo", async () => {
  assert.deepEqual(platform.platformAccountLifecycleRepairDefinitions.map((entry) => entry.id), ["PLAT-C-18"]);
  for (const width of [1440, 390]) {
    const calls = []; const pages = ["plataforma", "pública"].map((name) => ({ name, isClosed: () => false, close: async () => calls.push(`cerrar ${name}`) })); let next = 0;
    const person = { email: "persona@example.test", me: { id: "persona" } }; const business = { email: "dueña@example.test", me: { id: "dueña" } };
    const h = { width, newPage: async () => pages[next++],
      registerPerson: async (page) => { assert.equal(page, pages[1]); calls.push("persona UI"); return person; },
      registerBusiness: async (page) => { assert.equal(page, pages[1]); calls.push("organización UI"); return business; },
      signOut: async (page) => calls.push(`salir ${page.name}`),
      login: async (page, email, access) => { assert.equal(page, pages[0]); assert.equal(email, width === 1440 ? "e2e-e9r-operator@example.test" : "e2e-e9l-operator@example.test"); assert.equal(access, "platform"); calls.push("ingreso operador UI"); return { access: "platform", effectivePermissions: { platform: ["platform.accounts.manage", "platform.audit.read"] } }; },
      record: async (id, getPage, action) => { assert.equal(id, "PLAT-C-18"); calls.push(id); assert.equal(getPage(), pages[1]); const value = await action(); assert.equal(getPage(), pages[0]); return { ok: true, value }; },
      block: async () => assert.fail("No hay otros records"),
    };
    await platform.runPlatformAccountLifecycleRepairCases(h, { lifecycle: async (actualH, state) => {
      assert.equal(actualH, h); assert.equal(state.person, person); assert.equal(state.business, business); assert.equal(state.publicSignedIn, false);
      await state.ensureFull(); calls.push("ciclo completo compartido"); return "Comprobaciones completas";
    } });
    assert.deepEqual(calls, ["PLAT-C-18", "persona UI", "salir pública", "organización UI", "salir pública", "ingreso operador UI", "ciclo completo compartido", "salir plataforma", "cerrar plataforma", "cerrar pública"]);
  }
});

test("la fila móvil de Email usa los dos métodos combinados y no exige textos separados inexistentes", () => {
  for (const sameMask of [false, true]) {
    const item = { previousMethodType: "Email", newMethodType: "Email", previousMethod: "e2•••@example.test", newMethod: sameMask ? "e2•••@example.test" : "re•••@propia.example.test" };
    const target = { text: `${item.previousMethod} → ${item.newMethod} Pendiente` };
    const all = [target, { text: `${item.newMethod} → ${item.previousMethod} Resuelto` }];
    const page = { viewportSize: () => ({ width: 390 }), getByRole: (role) => {
      assert.equal(role, "listitem"); return { filter: ({ hasText, has }) => {
        assert.equal(has, undefined, "Email se dibuja como un texto combinado, sin spans por máscara.");
        assert.equal(hasText, `${item.previousMethod} → ${item.newMethod}`);
        return all.filter((row) => row.text.includes(hasText));
      } };
    } };
    const rows = platform.supplementRecoveryRow(page, item);
    assert.ok(rows.includes(target));
    if (!sameMask) assert.deepEqual(rows, [target]);
  }
});

test("los destinos propios se distinguen aun después de ocultar el correo y conservan example.test", () => {
  const mask = (email) => email.slice(0, 2) + "•••@" + email.split("@")[1];
  const first = platform.rejectionRecoveryDestination("1234abcd"); const second = platform.rejectionRecoveryDestination("5678cdef");
  for (const email of [first, second]) assert.match(email, /^[a-z0-9-]+@[a-z0-9-]+\.example\.test$/u);
  assert.notEqual(mask(first), mask(second)); assert.notEqual(mask(first), mask("e2e-completo-persona@example.test"));
  assert.throws(() => platform.rejectionRecoveryDestination('tag"inválido'));
});

test("la reparación de recuperaciones sólo declara08/09 y bloquea09 si no pudo crear su propia persona", async () => {
  assert.deepEqual(platform.platformRecoveryRepairDefinitions.map((entry) => entry.id), ["PLAT-C-08", "PLAT-C-09"]);
  const calls = []; const blocked = []; let closed = 0;
  const h = { width: 390, base: new URL("https://localtest.me"), newPage: async () => ({ isClosed: () => false, close: async () => { closed++; } }),
    registerPerson: async () => { throw new Error("No pudo registrar su persona"); },
    registerBusiness: async () => assert.fail("No precisa organización"),
    record: async (id, _page, action) => { calls.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id) => blocked.push(id),
  };
  await platform.runPlatformRecoveryRepairCases(h);
  assert.deepEqual(calls, ["PLAT-C-08"]); assert.deepEqual(blocked, ["PLAT-C-09"]); assert.equal(closed, 2);
});

test("las dos salidas de10 capturan la página pública, conservan el timeout y sólo diagnostican metadatos de logout", async () => {
  for (const stage of ["primera-salida", "segunda-salida"]) {
    const page = new EventEmitter(); const base = new URL("https://localtest.me"); let capture;
    page.setDefaultTimeout = () => assert.fail("No amplía el timeout para hacer pasar la salida.");
    const request = { url: () => base.origin + "/connect/logout?id_token_hint=token-privado&post_logout_redirect_uri=https://localtest.me/" };
    const original = new Error("locator.waitFor: Timeout 15000ms exceeded.\nURL privada https://localtest.me/?token=privado +5491134567815"); original.name = "TimeoutError";
    await assert.rejects(() => platform.runOccupiedRecoveryStage({ base, setCapturePage: (target) => { capture = target; } }, stage, page, async () => {
      page.emit("request", request); page.emit("response", { request: () => request, status: () => 302 });
      page.emit("request", { url: () => "https://otra.example/connect/logout?id_token_hint=ajeno" });
      throw original;
    }, true), (error) => {
      assert.equal(error.cause, original); assert.ok(error.message.includes(stage)); assert.ok(error.message.includes("Timeout 15000ms exceeded"));
      assert.ok(error.message.includes('"path":"/connect/logout","status":302,"hasHint":true'));
      for (const hidden of ["token-privado", "https://", "+5491134567815", "ajeno"]) assert.equal(error.message.includes(hidden), false);
      return true;
    });
    assert.equal(capture, page);
    assert.equal(page.listenerCount("request"), 0); assert.equal(page.listenerCount("response"), 0);
  }
});

test("la reparación10 sólo registra el callback completo propio, sin preparar1–9 u organizaciones", async () => {
  assert.deepEqual(platform.platformOccupiedRecoveryRepairDefinitions.map((entry) => entry.id), ["PLAT-C-10"]);
  for (const failed of [false, true]) {
    const calls = []; const pages = ["plataforma", "pública"].map((name) => ({ name, isClosed: () => false, close: async () => calls.push("cerrar " + name) })); let next = 0;
    const h = { width: 390, base: new URL("https://localtest.me"), newPage: async () => pages[next++],
      login: async (page, email, access) => { assert.equal(page, pages[0]); assert.equal(email, "e2e-e9l-operator@example.test"); assert.equal(access, "platform"); calls.push("operador UI"); return { access: "platform", effectivePermissions: { platform: ["platform.recoveries.manage"] } }; },
      signOut: async (page) => calls.push("salir " + page.name), registerPerson: async () => assert.fail("El callback completo crea sus dos cuentas Phone"), registerBusiness: async () => assert.fail("No crea organizaciones"),
      record: async (id, getPage, action) => { assert.equal(id, "PLAT-C-10"); assert.equal(getPage(), pages[1]); calls.push(id); try { const value = await action(); return { ok: true, value }; } catch (error) { assert.equal(getPage(), pages[1]); return { ok: false, error }; } }, block: async () => assert.fail("No depende de1–9"),
    };
    await platform.runPlatformOccupiedRecoveryRepairCases(h, { occupied: async (actualH, state) => {
      assert.equal(actualH, h); await state.ensureFull(); assert.equal(state.phone.owner, "+5491134567815"); assert.equal(state.phone.occupiedNext, "+5491134567817");
      state.setCapturePage(state.publicPage); state.publicSignedIn = true; calls.push("callback completo"); if (failed) throw new Error("Salida pública fallida"); return "MethodInUse comprobado";
    } });
    assert.deepEqual(calls, ["PLAT-C-10", "operador UI", "callback completo", "salir pública", "salir plataforma", "cerrar plataforma", "cerrar pública"]);
  }
});

test("Inicio móvil exige Para resolver en su propia ruta y no lo reemplaza por ficha o Asistente", async () => {
  for (const width of [390, 1440]) {
    const calls = []; const missing = new Error("Para resolver no está disponible en el Inicio móvil.");
    const region = { waitFor: async () => { calls.push("Para resolver"); if (width === 390) throw missing; } };
    const page = { goto: async (url) => calls.push(new URL(url).pathname), getByRole: (role, options) => {
      assert.equal(role, "region"); assert.deepEqual(options, { name: "Para resolver", exact: true }); return region;
    } };
    const open = () => platform.openPlatformPendingHome({ width, base: new URL("https://localtest.me") }, page, {
      acceptNotice: async () => calls.push("Aviso Asistente escritorio"),
    });
    if (width === 390) await assert.rejects(open, (error) => error === missing);
    else assert.equal(await open(), region);
    assert.deepEqual(calls, width === 390 ? ["/plataforma", "Para resolver"] : ["/plataforma", "Aviso Asistente escritorio", "Para resolver"]);
  }
});

test("aprobar desde el listado depende de la fixture12 y se ejecuta después del Inicio13 aunque éste falle", async () => {
  for (const prepared of [false, true]) for (const homeWorks of [false, true]) {
    const events = []; const blocked = []; const page = {};
    const run = createPlatformRecorder({ record: async (id, getPage, action) => {
      assert.equal(getPage(), page); events.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; }
    }, block: async (id) => blocked.push(id) });
    const step = (number, target, action, dependencies = []) => run(`PLAT-C-${String(number).padStart(2, "0")}`, target, action, dependencies.map((value) => `PLAT-C-${String(value).padStart(2, "0")}`));
    await step(12, page, async () => { if (!prepared) throw new Error("Fixture12 ausente"); });
    await platform.runPendingOrganizationApprovalSteps({ step, page, visitHome: async () => { events.push("Inicio sin aprobar"); if (!homeWorks) throw new Error("Para resolver ausente"); }, approveFromList: async () => { events.push("Aprobar desde listado"); } });
    assert.deepEqual(blocked, prepared ? [] : ["PLAT-C-13", "PLAT-C-20"]);
    assert.deepEqual(events, prepared ? ["PLAT-C-12", "PLAT-C-13", "Inicio sin aprobar", "PLAT-C-20", "Aprobar desde listado"] : ["PLAT-C-12"]);
  }
});

test("el aviso de aprobación reconoce Aprobamos con la organización exacta y exige un único correo", () => {
  const name = "Organización propia (A)"; const reason = "Motivo interno";
  const text = `Hola. Aprobamos ${name} y terminamos el alta. Ya podés entrar como Dueño de tu organización.`;
  const message = (body) => ({ body: `Content-Type: text/plain; charset=utf-8\r\n\r\n${body}` });
  assert.equal(/aprobad/iu.test(text), false, "La plantilla actual no contiene el participio que esperaba el guion.");
  assert.equal(platform.matchesOrganizationApprovalNotice(text, name), true);
  for (const other of [text.replace(name, name + " ajena"), `No aprobamos la solicitud de alta de ${name}.`, `Te invitaron a ${name}.`, `Aprobada ${name}.`]) assert.equal(platform.matchesOrganizationApprovalNotice(other, name), false);
  const options = { name, kind: "approved", reason };
  requireUniqueOrganizationNotice([message(text)], options);
  for (const messages of [[], [message(text), message(text)], [message(text.replace(name, "Otra organización"))], [message(text + reason)]]) assert.throws(() => requireUniqueOrganizationNotice(messages, options));
});

test("la reparación sólo registra20 con fixture propia y cierra ambas sesiones aun si preparar o aprobar falla", async () => {
  assert.deepEqual(platform.platformApprovalRepairDefinitions.map((row) => row.id), ["PLAT-C-20"]);
  for (const width of [1440, 390]) for (const failedPhase of [null, "login", "prepare", "approve"]) {
    const calls = []; const closed = []; const recordIds = []; const pages = [0, 1].map((id) => ({ id, isClosed: () => false, close: async () => closed.push(id) })); let nextPage = 0;
    const fixture = { pendingBusiness: { id: "propia", name: "Pendiente propia" }, pendingOwner: "own@example.test" };
    const h = { width, newPage: async () => pages[nextPage++],
      login: async (page, email, access) => { assert.equal(page, pages[0]); assert.equal(email, width === 1440 ? "e2e-e9r-operator@example.test" : "e2e-e9l-operator@example.test"); assert.equal(access, "platform"); calls.push("login"); if (failedPhase === "login") throw new Error("Ingreso fallido"); return { access: "platform", effectivePermissions: { platform: ["platform.tenants.manage", "platform.settings.manage"] } }; },
      signOut: async (page) => calls.push(`salir${page.id}`),
      record: async (id, getPage, action) => { recordIds.push(id); assert.equal(getPage(), pages[0]); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
      block: async () => assert.fail("No depende de otros records"), registerPerson: async () => assert.fail("No crea otra persona"), registerBusiness: async () => assert.fail("No crea otra organización"),
    };
    await platform.runPlatformApprovalRepairCases(h, {
      prepare: async (target, { page, publicPage, onPublicSignedIn }) => { assert.equal(target, h); assert.equal(page, pages[0]); assert.equal(publicPage, pages[1]); calls.push("prepare"); onPublicSignedIn(); if (failedPhase === "prepare") throw new Error("Fixture fallida"); return fixture; },
      approve: async (target, { page, ...actualFixture }) => { assert.equal(target, h); assert.equal(page, pages[0]); assert.deepEqual(actualFixture, fixture); calls.push("approve"); if (failedPhase === "approve") throw new Error("Aprobación fallida"); return "Aprobación propia verificada"; },
    });
    assert.deepEqual(recordIds, ["PLAT-C-20"]); assert.deepEqual(closed, [0, 1]);
    assert.deepEqual(calls, failedPhase === "login" ? ["login"] : failedPhase === "prepare" ? ["login", "prepare", "salir1", "salir0"] : ["login", "prepare", "approve", "salir1", "salir0"]);
  }
});

test("un replay201 sin Location sigue fallando aunque conserve cuerpo e IDs", () => {
  const location = "https://localtest.me/api/platform/tenants/propia";
  const response = (value) => ({ headers: () => value === undefined ? {} : { location: value } });
  platform.requireCreatedReplayLocation(response(location), response(location));
  assert.throws(() => platform.requireCreatedReplayLocation(response(location), response(undefined)), /replay201.*Location/u);
  assert.throws(() => platform.requireCreatedReplayLocation(response(undefined), response(undefined)), /alta201.*Location/u);
  assert.throws(() => platform.requireCreatedReplayLocation(response(location), response(location + "-ajena")), /replay201.*Location/u);
});

test("el motivo de Historial se verifica en la fila propia aunque móvil lo combine con el actor", async () => {
  for (const width of [390, 1440]) for (const present of [true, false]) {
    let waited = false; const reason = "Motivo propio único";
    const result = { waitFor: async () => { waited = true; assert.ok(present, "La fila no contiene el motivo, aunque exista en el banner exterior."); } };
    const panel = {
      getByRole: (role) => { assert.equal(width, 390); assert.equal(role, "listitem"); return { filter: ({ hasText }) => { assert.equal(hasText, reason); return result; } }; },
      getByText: (text, options) => { assert.equal(width, 1440); assert.equal(text, reason); assert.deepEqual(options, { exact: true }); return { filter: () => ({ first: () => result }) }; },
    };
    const page = { getByRole: (role) => { assert.equal(role, "tabpanel"); return panel; } };
    const verify = () => platform.waitForOrganizationHistoryReason({ width }, page, reason);
    if (present) await verify(); else await assert.rejects(verify, /fila no contiene/u);
    assert.equal(waited, true);
  }
});

test("los teléfonos son exclusivos de cada ancho y del rango admitido por el control existente", () => {
  const all = [1440, 390].flatMap((width) => Object.values(supplementPhoneFixtures(width)));
  assert.equal(new Set(all).size, 8);
  for (const phone of all) assert.match(phone, /^\+54911345678(?:1[0-7])$/u);
  assert.throws(() => supplementPhoneFixtures(800));
});

test("audit-only no certifica la consulta con un operador que también puede leer organizaciones", () => {
  const me = { access: "platform", effectivePermissions: { platform: ["platform.audit.read"] } };
  assert.doesNotThrow(() => requireAuditOnlyActor(me));
  assert.throws(() => requireAuditOnlyActor({ ...me, access: "business" }));
  assert.throws(() => requireAuditOnlyActor({ ...me, effectivePermissions: { platform: ["platform.audit.read", "platform.tenants.read"] } }));
});

test("una invitación de operador no puede tener Personal, organizaciones ni permisos adicionales", () => {
  const detail = { kind: "Operator", state: "Invited", hasPersonalSpace: false, organizations: [], operatorPermissions: ["platform.audit.read"] };
  assert.doesNotThrow(() => requirePendingOperator(detail, ["platform.audit.read"]));
  for (const patch of [{ hasPersonalSpace: true }, { organizations: [{ id: "org" }] }, { state: "Active" }, { operatorPermissions: ["platform.audit.read", "platform.settings.manage"] }]) {
    assert.throws(() => requirePendingOperator({ ...detail, ...patch }, ["platform.audit.read"]));
  }
});

test("un destino ocupado debe conservar Pending, versión y métodos originales sin aprobar por inferencia", () => {
  const before = { id: "pedido", version: 7, status: "Pending" };
  const methods = [{ id: "anterior", type: "Phone", isPrimary: true }];
  assert.doesNotThrow(() => requireRecoveryUnchanged(before, { ...before }, methods, [...methods]));
  for (const after of [{ ...before, version: 8 }, { ...before, status: "Approved" }, { ...before, id: "otro" }]) assert.throws(() => requireRecoveryUnchanged(before, after, methods, methods));
  assert.throws(() => requireRecoveryUnchanged(before, before, methods, [...methods, { id: "nuevo" }]));
});

test("el aviso de rechazo real no publica el motivo interno", () => {
  const eml = "Content-Type: text/plain; charset=utf-8\r\n\r\nNo pudimos recuperar tu cuenta\r\nRevisamos tu pedido y no pudimos confirmar que la cuenta sea tuya.\r\n";
  assert.doesNotThrow(() => requireRejectedNotice(eml, "Motivo interno privado"));
  assert.throws(() => requireRejectedNotice(eml + "Motivo interno privado", "Motivo interno privado"));
  assert.throws(() => requireRejectedNotice("Content-Type: text/plain\r\n\r\nCódigo enviado", "Motivo interno privado"));
});

test("hay veinte acciones y sólo se enlazan las ramas completas con sus actores", () => {
  assert.equal(supplementPlatformDefinitions.length, 20);
  assert.equal(new Set(supplementPlatformDefinitions.map((entry) => entry.id)).size, 20);
  const known = new Set([...backendUseCases, ...guidedCases, ...screens.map((entry) => ({ id: "SCREEN-" + entry.id }))].map((entry) => entry.id));
  const covers = supplementPlatformDefinitions.flatMap((entry) => entry.covers);
  for (const id of covers) assert.ok(known.has(id));
  for (const id of ["PL-020", "PL-021", "PL-022", "PL-030", "RE-002", "RE-006", "RE-008", "RE-009"]) assert.ok(covers.includes("BACK-" + id), id);
  assert.equal(covers.includes("BACK-PL-024"), false, "Autoedición no prueba LastManager.");
  assert.equal(covers.includes("BACK-RE-007"), false, "Operadora no prueba la rama Sin cuenta.");
  for (const id of ["GUIA-crear-una-organizacion-01", "GUIA-aprobar-una-organizacion-05", "GUIA-publicar-una-version-legal-03"]) assert.ok(covers.includes(id));
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-16").covers, ["BACK-PL-007"]);
  assert.deepEqual(supplementPlatformProofGroups, { "BACK-PL-008": [["PLAT-C-20", "PLAT-C-17"]], "BACK-PL-018": [["PLAT-25", "PLAT-26", "PLAT-C-18"]] });
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-13").covers, ["GUIA-aprobar-una-organizacion-01"]);
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-20").covers, ["GUIA-aprobar-una-organizacion-02", "GUIA-aprobar-una-organizacion-03", "GUIA-aprobar-una-organizacion-04", "GUIA-aprobar-una-organizacion-05"]);
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-17").covers, []);
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-18").covers, ["GUIA-suspender-y-reactivar-03", "GUIA-suspender-y-reactivar-05"]);
  assert.deepEqual(supplementPlatformDefinitions.at(-1).covers, ["BACK-PL-006"]);
  assert.deepEqual(supplementPlatformLimitations["BACK-PL-024"].partialExecutionIds, ["PLAT-C-05"]);
  assert.match(supplementPlatformLimitations["BACK-PL-024"].reason, /gestores.*base/u);
});

test("crear una organización no crea cuenta para el Dueño pendiente ni perfiles públicos del operador", () => {
  const operator = { id: "operador", access: "platform", hasPersonalSpace: false, organizations: [] };
  const organization = { id: "org", status: "Active", ownerEmail: "own@example.test", owners: [], companyCount: 1, memberCount: 1 };
  const input = { beforeOperator: operator, afterOperator: { ...operator }, organization, ownerEmail: "own@example.test", pendingAccounts: { totalCount: 0, items: [] }, createdId: "org" };
  requireCreationProfileIsolation(input);
  for (const patch of [{ afterOperator: { ...operator, hasPersonalSpace: true } }, { afterOperator: { ...operator, organizations: [{ id: "org" }] } }, { pendingAccounts: { totalCount: 1, items: [{ id: "cuenta" }] } }, { organization: { ...organization, owners: [{ id: "operador" }] } }, { organization: { ...organization, memberCount: 2 } }]) assert.throws(() => requireCreationProfileIsolation({ ...input, ...patch }));
  const owner = { id: "dueño", access: "business", activeTenantId: "org", hasPersonalSpace: false, organizations: [{ id: "org" }] };
  requireInvitedOwnerBusinessOnly(owner, "org", "operador");
  for (const patch of [{ id: "operador" }, { hasPersonalSpace: true }, { access: "consumer" }, { activeTenantId: "otra" }, { organizations: [{ id: "otra" }] }]) assert.throws(() => requireInvitedOwnerBusinessOnly({ ...owner, ...patch }, "org", "operador"));
});

test("el replay conserva exactamente la respuesta, incluidos IDs y versión", () => {
  const receipt = { id: "org", firstCompanyId: "empresa", invitationId: "invitación", version: 1 };
  requireIdenticalReplay(receipt, { ...receipt });
  for (const patch of [{ id: "otra" }, { firstCompanyId: "otra" }, { invitationId: "otra" }, { version: 2 }]) assert.throws(() => requireIdenticalReplay(receipt, { ...receipt, ...patch }));
});

test("un aviso único de rechazo conserva el nombre público sin publicar el motivo interno", () => {
  const body = "Content-Type: text/plain; charset=utf-8\r\n\r\nNo aprobamos el alta de tu organización\r\nNo aprobamos la solicitud de alta de Organización propia. Tu cuenta y tu espacio personal siguen funcionando.";
  const options = { name: "Organización propia", kind: "rejected", reason: "Motivo interno" };
  requireUniqueOrganizationNotice([{ body }], options);
  assert.throws(() => requireUniqueOrganizationNotice([], options)); assert.throws(() => requireUniqueOrganizationNotice([{ body }, { body }], options));
  assert.throws(() => requireUniqueOrganizationNotice([{ body: body + "Motivo interno" }], options));
  assert.throws(() => requireUniqueOrganizationNotice([{ body: body.replaceAll("Organización propia", "Otra organización") }], options));
});

test("la baja del operador tiene gracia exacta de treinta días, autor, fecha real y motivo persistido", () => {
  const before = Date.parse("2026-10-20T10:00:00Z"); const after = before + 2000;
  const detail = { state: "PendingDeletion", deletion: { requestedAtUtc: "2026-10-20T10:00:01Z", scheduledForUtc: "2026-11-19T10:00:01Z", requestedByPlatform: true }, lastStateChange: { atUtc: "2026-10-20T10:00:01Z", reason: "Baja propia" } };
  requireOperatorDeletion(detail, { before, after, reason: "Baja propia" });
  for (const patch of [{ state: "Active" }, { deletion: { ...detail.deletion, requestedByPlatform: false } }, { deletion: { ...detail.deletion, scheduledForUtc: "2026-11-18T10:00:01Z" } }, { deletion: { ...detail.deletion, requestedAtUtc: "2026-10-19T10:00:01Z" } }, { lastStateChange: { ...detail.lastStateChange, reason: "Otro" } }]) assert.throws(() => requireOperatorDeletion({ ...detail, ...patch }, { before, after, reason: "Baja propia" }));
});
