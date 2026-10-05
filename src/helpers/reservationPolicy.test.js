import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReservationLimit, reservationLimitLabel, reservationPolicyMessage } from './reservationPolicy.js';
import { mensajeAmigable } from './erroresMensajes.js';

test('sin límite envía null y cero conserva el bloqueo', () => {
  assert.equal(parseReservationLimit(false, '0'), null);
  assert.equal(parseReservationLimit(true, '0'), 0);
  assert.equal(parseReservationLimit(true, '32767'), 32767);
  for (const value of ['', '-1', '2.5', '32768', '1e2', 'NaN']) assert.throws(() => parseReservationLimit(true, value));
});

test('indicadores reflejan sin límite, bloqueo y máximo', () => {
  assert.equal(reservationLimitLabel(null), 'Sin límite');
  assert.equal(reservationLimitLabel(0), 'Nuevas reservas bloqueadas');
  assert.equal(reservationLimitLabel(2), 'Máximo: 2 reservas activas');
});

test('error identificable preserva mensaje, sin regla diaria ni error genérico', () => {
  const message = 'Alcanzaste el límite de 4 reservas activas definido por tu empresa.';
  assert.equal(mensajeAmigable({ code: 'RESERVATION_LIMIT_REACHED', message, details: { limit: 4, current: 4 } }), message);
  assert.equal(mensajeAmigable({ code: 'RESERVATION_LIMIT_REACHED', details: { limit: 0 } }), 'Tu empresa bloqueó temporalmente la creación de nuevas reservas.');
  assert.doesNotMatch(mensajeAmigable({ message: 'límite de reservas' }), /2 reservas/);
});

test('cotización informa cantidad vigente y restante, incluyendo cero y null', () => {
  assert.equal(reservationPolicyMessage({ sinLimite: false, limite: 2, activas: 1, restantes: 1 }), 'Reservas vigentes: 1 de 2. Te quedan 1 disponibles.');
  assert.match(reservationPolicyMessage({ sinLimite: true, limite: null, activas: 3, restantes: null }), /3. Sin límite/);
  assert.match(reservationPolicyMessage({ sinLimite: false, limite: 0, activas: 0, restantes: 0 }), /bloqueó temporalmente/);
});
