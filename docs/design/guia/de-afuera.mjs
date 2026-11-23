// Lo que comparten capturar.mjs y capturar-recorridos.mjs para que una captura salga entera con la PC cargada.
// Cada página abre su propio contexto, sin caché: sin esto, cada tablero vuelve a pedir React (jsdelivr) y las fuentes
// (Google Fonts), y si alguno llega tarde la captura sale en blanco o con «React is not defined».

const AFUERA = /^https:\/\/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
const guardado = new Map();

// Lo de afuera se pide una sola vez por corrida y se sirve de memoria a cada página.
export async function servirDeMemoria(pagina) {
  await pagina.route(AFUERA, async (r) => {
    const url = r.request().url();
    try {
      if (!guardado.has(url)) {
        const res = await r.fetch({ timeout: 60000 });
        if (!res.ok()) throw new Error(`${res.status()} ${url}`);
        const headers = { ...res.headers() };
        // El cuerpo llega ya descomprimido: se sacan los encabezados que dirían lo contrario.
        for (const h of ['content-encoding', 'content-length', 'transfer-encoding']) delete headers[h];
        guardado.set(url, { status: res.status(), headers, body: await res.body() });
      }
      await r.fulfill(guardado.get(url));
    } catch {
      await r.abort().catch(() => {});
    }
  });
}

// El tablero ya se dibujó: hay algo visible en la página.
export async function esperarDibujo(pagina) {
  await pagina.waitForFunction(() => document.body && document.body.innerText.trim().length > 0, null, { timeout: 60000 });
}

// Con la PC cargada, una captura puede vencer o salir con un error de la página: se reintenta hasta tres veces antes de cortar.
export async function conReintentos(nombre, hacer) {
  for (let intento = 1; ; intento++) {
    try {
      return await hacer();
    } catch (e) {
      if (intento === 3) throw e;
      console.log('reintento', nombre, String(e.message).split('\n')[0]);
    }
  }
}
