import test from "node:test";
import assert from "node:assert/strict";
import {
  aplanarReservaControlAcceso,
  obtenerReservasControlAcceso,
  reservaPerteneceAlGarage,
} from "./controlAcceso.js";

test("extrae reservas de las variantes de respuesta del control de acceso", () => {
  const reservas = [{ id_reserva: 1 }];

  assert.deepEqual(obtenerReservasControlAcceso(reservas), reservas);
  assert.deepEqual(obtenerReservasControlAcceso({ reservas }), reservas);
  assert.deepEqual(obtenerReservasControlAcceso({ data: { reservas } }), reservas);
  assert.deepEqual(obtenerReservasControlAcceso({ datos: { data: reservas } }), reservas);
});

test("no descarta una reserva cuando el endpoint acotado no repite el garage", () => {
  assert.equal(reservaPerteneceAlGarage({ id_reserva: 1 }, 8), true);
  assert.equal(reservaPerteneceAlGarage({ id_garage: 8 }, 8), true);
  assert.equal(reservaPerteneceAlGarage({ garage: { id: 8 } }, 8), true);
  assert.equal(reservaPerteneceAlGarage({ id_garage: 9 }, 8), false);
});

test("aplana reservas serializadas dentro de una fila enriquecida", () => {
  assert.deepEqual(
    aplanarReservaControlAcceso({ reserva: { id_reserva: 4, id_garage: 8 }, conductor: "Gonzalo" }),
    { id_reserva: 4, id_garage: 8, conductor: "Gonzalo", reserva: { id_reserva: 4, id_garage: 8 } }
  );
});
