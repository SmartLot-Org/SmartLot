import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const view = readFileSync(new URL('./admin_pagos.jsx', import.meta.url), 'utf8');
const service = readFileSync(new URL('../servicies/API_Pagos.js', import.meta.url), 'utf8');
test('pago empresarial envia seleccion pendiente y consume importe y referencia del servidor', () => {
  assert.match(view, /movimientos.filter\(\(m\) => !m.pagado\)/);
  assert.match(view, /const orderId = pref.orderId/);
  assert.match(view, /const aCobrar = pref.amount/);
  assert.match(view, /importePendiente/);
  assert.match(view, /requiereRegularizacion/);
  assert.doesNotMatch(view, /montoTest|MONTO_MAX_TEST|unit_price|ADMIN-PAGO-|importe_original|importe_cobrado|cap \$0/);
});
test('servicio empresarial limita el contrato y conserva el de reservas propias', () => {
  const enterprise = service.slice(service.indexOf('const PagosCrearPreferencia ='), service.indexOf('const PagosCrearPreferenciaReserva'));
  assert.match(enterprise, /\{ consumosIds, idSede, idGarage, periodo, backUrls \}/);
  assert.doesNotMatch(enterprise, /metadata|unit_price|items|orderId|test:/);
  assert.match(service, /post\('\/api\/payments\/preference', \{ idReserva \}\)/);
});
