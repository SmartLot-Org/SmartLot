import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { normalizeReservaDateTime, parseReservaTimestamp, parseReservaHora, formatReservaDate, formatReservaHorario, toReservaInstant, mergeReservaEdit } from './reservaDateTime.js';

const raw = { fecha_entrada: '2026-10-05T09:00:00', fecha_salida: '2026-10-05T11:00:00' };
const dto = { fecha: '2026-10-05', hora_entrada: '09:00', hora_salida: '11:00' };

test('timestamps y DTO derivado generan exactamente las mismas fechas y horas', () => {
  const expected = { ...raw, ...dto };
  assert.deepEqual(normalizeReservaDateTime(raw), expected);
  assert.deepEqual(normalizeReservaDateTime(dto), expected);
  assert.equal(formatReservaHorario(raw), '09:00 a 11:00');
  assert.equal(formatReservaDate(normalizeReservaDateTime(raw).fecha), '05/10/2026');
});

test('acepta todos los aliases de entrada/salida y prioriza campos derivados válidos', () => {
  for (const key of ['hora_entrada', 'horaEntrada', 'hora_inicio', 'horaInicio']) {
    assert.equal(normalizeReservaDateTime({ ...raw, [key]: '10:00' }).hora_entrada, '10:00');
  }
  for (const key of ['hora_salida', 'horaSalida', 'hora_fin', 'horaFin']) {
    assert.equal(normalizeReservaDateTime({ ...raw, [key]: '12:00' }).hora_salida, '12:00');
  }
  for (const key of ['fecha_entrada', 'fechaEntrada', 'fecha_inicio', 'fechaInicio']) {
    assert.equal(normalizeReservaDateTime({ [key]: raw.fecha_entrada }).hora_entrada, '09:00');
  }
  for (const key of ['fecha_salida', 'fechaSalida', 'fecha_finalizacion', 'fechaFinalizacion']) {
    assert.equal(normalizeReservaDateTime({ [key]: raw.fecha_salida }).hora_salida, '11:00');
  }
  assert.equal(normalizeReservaDateTime({ ...raw, hora_entrada: '--:--' }).hora_entrada, '09:00');
});

test('medianoche es válida; un timestamp local nunca se interpreta como UTC', () => {
  assert.equal(parseReservaHora('00:00'), '00:00');
  const midnight = normalizeReservaDateTime({ fecha_entrada: '2026-10-05 00:00:00', fecha_salida: '2026-10-05 01:00:00' });
  assert.equal(midnight.fecha, '2026-10-05');
  assert.equal(formatReservaHorario(midnight), '00:00 a 01:00');
  assert.equal(formatReservaDate(midnight.fecha), '05/10/2026');
  assert.equal(parseReservaTimestamp('2026-10-05T00:01:00').hora, '00:01');
});

test('offsets reales se convierten a Argentina y pueden cambiar la fecha', () => {
  const value = parseReservaTimestamp('2026-10-05T01:30:00Z');
  assert.equal(value.fecha, '2026-10-04');
  assert.equal(value.hora, '22:30');
  assert.equal(parseReservaTimestamp('2026-10-05T12:00:00+00:00').hora, '09:00');
  assert.equal(parseReservaTimestamp('2026-10-05T09:00:00-03:00').hora, '09:00');
});

test('fechas incompletas o imposibles tienen estado explícito, sin inventar 00:00', () => {
  assert.equal(formatReservaHorario({}), 'Horario no disponible');
  assert.equal(formatReservaDate(null), 'Fecha no disponible');
  for (const value of ['2026-02-30T09:00:00', '2026-10-05T25:00:00', '2026-10-05T09:60:00', 'invalid']) {
    assert.equal(parseReservaTimestamp(value), null);
  }
  assert.equal(normalizeReservaDateTime({ fecha: '2026-02-30', ...raw }).fecha, '2026-10-05');
});

test('reservas que cruzan medianoche conservan fecha de salida', () => {
  const row = normalizeReservaDateTime({ fecha_entrada: '2026-10-05T23:30:00', fecha_salida: '2026-10-06T00:30:00' });
  assert.equal(row.fecha, '2026-10-05');
  assert.equal(row.fecha_salida, '2026-10-06T00:30:00');
  assert.equal(formatReservaHorario(row), '23:30 a 00:30');
});

test('edición reemplaza las horas derivadas antiguas antes de normalizar', () => {
  const edited = mergeReservaEdit({ id: 1, ...dto }, { id: 1, estado_reserva: 'confirmada' },
    { fecha_entrada: '2026-10-05T10:00:00', fecha_salida: '2026-10-05T12:00:00' });
  assert.equal(edited.hora_entrada, '10:00');
  assert.equal(edited.hora_salida, '12:00');
  assert.equal(edited.fecha, '2026-10-05');
  assert.equal(formatReservaHorario(edited), '10:00 a 12:00');
});

test('comparaciones y renderizado no dependen de la zona del proceso/navegador', () => {
  const moduleUrl = new URL('./reservaDateTime.js', import.meta.url).href;
  const code = `import {normalizeReservaDateTime,toReservaInstant} from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify([normalizeReservaDateTime(${JSON.stringify(raw)}),toReservaInstant('2026-10-05T09:00:00').toISOString()]));`;
  const results = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo'].map((TZ) =>
    execFileSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', env: { ...process.env, TZ } }).trim());
  assert.equal(new Set(results).size, 1);
  assert.equal(toReservaInstant('2026-10-05T09:00:00').toISOString(), '2026-10-05T12:00:00.000Z');
});
