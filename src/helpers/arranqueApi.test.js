import test from 'node:test'; import assert from 'node:assert/strict';
import { conReintentoDeArranque, esErrorDeArranque } from './arranqueApi.js';

const errorSinRespuesta = Object.assign(new Error('timeout of 45000ms exceeded'), { code: 'ECONNABORTED' });
const errorCancelado = Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' });
const errorValidacion = Object.assign(new Error('422'), { response: { status: 422, data: { message: 'dato inválido' } } });
const errorBorde = Object.assign(new Error('502'), { response: { status: 502 } });

test('clasifica como arranque los errores sin respuesta y los 5xx de borde', () => {
  assert.equal(esErrorDeArranque(errorSinRespuesta), true);
  assert.equal(esErrorDeArranque(errorBorde), true);
  assert.equal(esErrorDeArranque(errorValidacion), false);
  assert.equal(esErrorDeArranque(errorCancelado), false);
  assert.equal(esErrorDeArranque(undefined), false);
});

test('reintenta ante error de arranque y devuelve el resultado del segundo intento', async () => {
  let llamadas = 0;
  const resultado = await conReintentoDeArranque(async () => {
    llamadas += 1;
    if (llamadas === 1) throw errorSinRespuesta;
    return 'ok';
  }, { esperaMs: 1 });
  assert.equal(resultado, 'ok');
  assert.equal(llamadas, 2);
});

test('no reintenta errores de la API y propaga el error original', async () => {
  let llamadas = 0;
  await assert.rejects(
    conReintentoDeArranque(async () => { llamadas += 1; throw errorValidacion; }, { esperaMs: 1 }),
    (error) => error === errorValidacion
  );
  assert.equal(llamadas, 1);
});

test('respeta el límite de intentos y propaga el último error', async () => {
  let llamadas = 0;
  await assert.rejects(
    conReintentoDeArranque(async () => { llamadas += 1; throw errorSinRespuesta; }, { intentos: 3, esperaMs: 1 }),
    (error) => error === errorSinRespuesta
  );
  assert.equal(llamadas, 3);
});
