import test from 'node:test';
import assert from 'node:assert/strict';
import { createReservaRefresh, bindReservaPolling } from './reservaRefresh.js';
import { normalizeReservaDateTime } from './reservaDateTime.js';

const initial = { fecha_entrada: '2099-10-05T09:00:00', fecha_salida: '2099-10-05T11:00:00' };
const derived = { fecha: '2099-10-05', hora_entrada: '09:00', hora_salida: '11:00' };
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test('carga, 15 segundos, foco y visibilidad conservan el mismo horario', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let rows;
  let calls = 0;
  const reasons = [];
  const refresh = createReservaRefresh({
    fetchReservations: async () => ({ respuesta: true, datos: [calls++ ? derived : initial] }),
    onData: (data, reason) => { rows = data.map(normalizeReservaDateTime); reasons.push(reason); },
    onError: () => assert.fail('No debe fallar'),
  });
  const windowTarget = new EventTarget();
  const documentTarget = new EventTarget();
  documentTarget.visibilityState = 'visible';
  const cleanup = bindReservaPolling((reason) => refresh.refresh(reason), windowTarget, documentTarget, { setInterval, clearInterval });
  await refresh.refresh('initial');
  const first = structuredClone(rows);
  t.mock.timers.tick(16_000);
  await refresh.refresh();
  assert.deepEqual(rows, first);
  assert.equal(reasons.at(-1), 'interval');
  windowTarget.dispatchEvent(new Event('focus'));
  await refresh.refresh();
  assert.deepEqual(rows, first);
  assert.equal(reasons.at(-1), 'focus');
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  await refresh.refresh();
  assert.deepEqual(rows, first);
  assert.equal(reasons.at(-1), 'visibilitychange');
  documentTarget.visibilityState = 'hidden';
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  assert.equal(calls, 4);
  cleanup();
  refresh.dispose();
  windowTarget.dispatchEvent(new Event('focus'));
  t.mock.timers.tick(30_000);
  await Promise.resolve();
  assert.equal(calls, 4);
});

test('focus y visibilitychange simultáneos comparten una sola petición', async () => {
  const request = deferred();
  let calls = 0;
  const refresh = createReservaRefresh({ fetchReservations: () => { calls++; return request.promise; }, onData: () => {}, onError: () => assert.fail() });
  const first = refresh.refresh('focus');
  const second = refresh.refresh('visibilitychange');
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  request.resolve({ respuesta: true, datos: [initial] });
  await first;
});

test('una respuesta anterior a una edición no sobrescribe el resultado más reciente', async () => {
  const old = deferred();
  const current = deferred();
  let rows;
  let signal;
  let calls = 0;
  const refresh = createReservaRefresh({ fetchReservations: (options) => {
    if (!calls++) { signal = options.signal; return old.promise; }
    return current.promise;
  }, onData: (data) => { rows = data; }, onError: () => assert.fail() });
  const first = refresh.refresh('interval');
  await Promise.resolve();
  refresh.invalidate();
  assert.equal(signal.aborted, true);
  const second = refresh.refresh('edit');
  current.resolve({ respuesta: true, datos: [{ ...derived, hora_entrada: '10:00' }] });
  await second;
  old.resolve({ respuesta: true, datos: [initial] });
  await first;
  assert.equal(rows[0].hora_entrada, '10:00');
});

test('error HTTP, excepción y respuesta mal formada conservan información anterior', async () => {
  let response = { respuesta: true, datos: [initial] };
  let rows;
  let errors = 0;
  const refresh = createReservaRefresh({ fetchReservations: async () => {
    if (response instanceof Error) throw response;
    return response;
  }, onData: (data) => { rows = data; }, onError: () => { errors++; } });
  await refresh.refresh('initial');
  const previous = rows;
  for (response of [{ respuesta: false, datos: [] }, new Error('red'), { respuesta: true, datos: {} }]) {
    await refresh.refresh('interval');
    assert.equal(rows, previous);
  }
  assert.equal(errors, 3);
});

test('desmontaje cancela la petición y descarta su respuesta', async () => {
  const request = deferred();
  let signal;
  const refresh = createReservaRefresh({ fetchReservations: (options) => { signal = options.signal; return request.promise; },
    onData: () => assert.fail(), onError: () => assert.fail(), onSettled: () => assert.fail() });
  const pending = refresh.refresh();
  await Promise.resolve();
  refresh.dispose();
  assert.equal(signal.aborted, true);
  request.resolve({ respuesta: true, datos: [initial] });
  await pending;
});
