import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryRetrySeconds } from './recoveryRetry.js';

test('espera del servidor en segundos, fecha HTTP y cuerpo generico', () => {
  assert.equal(recoveryRetrySeconds({ headers: { 'retry-after':'180' } }),180);
  assert.equal(recoveryRetrySeconds({ headers: { 'retry-after':'Thu, 22 Oct 2026 12:01:00 GMT' } },Date.parse('2026-10-22T12:00:00Z')),60);
  assert.equal(recoveryRetrySeconds({ data:{ retry_after:60 } }),60);
});
test('headers invalidos y esperas vencidas no dejan controles bloqueados indefinidamente', () => {
  assert.equal(recoveryRetrySeconds({ headers:{ 'retry-after':'invalido' },data:{ retry_after:90 } }),90);
  assert.equal(recoveryRetrySeconds({ headers:{ 'retry-after':'Thu, 22 Oct 2026 12:00:00 GMT' } },Date.parse('2026-10-22T12:01:00Z')),1);
  assert.equal(recoveryRetrySeconds({ data:{ retry_after:-1 } }),60);
  assert.equal(recoveryRetrySeconds(),60);
});
