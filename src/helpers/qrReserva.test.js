import test from "node:test";
import assert from "node:assert/strict";
import { crearControlLecturasQr, puedeMostrarQrReserva } from "./qrReserva.js";

test("muestra QR para una reserva confirmada sin ingreso", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Confirmada", entrada_registrada: false }), true);
});

test("no muestra QR para una reserva no confirmada", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Cancelada" }), false);
});

test("mantiene el QR disponible después de registrar el ingreso", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Confirmada", fecha_entrada_real: "2026-09-18T10:30:00-03:00" }), true);
});

test("muestra el QR mientras el vehículo está dentro", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Dentro" }), true);
  assert.equal(puedeMostrarQrReserva({ estado_reserva: "en_curso" }), true);
});

test("oculta el QR una vez registrada la salida", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Finalizado" }), false);
  assert.equal(puedeMostrarQrReserva({ estado: "Dentro", fecha_salida_real: "2026-09-18T18:00:00-03:00" }), false);
});

test("el control del lector bloquea frames y tokens duplicados mientras procesa", () => {
  const control = crearControlLecturasQr();
  assert.equal(control.intentar("smartlot:token-1"), true);
  assert.equal(control.intentar("smartlot:token-1"), false);
  assert.equal(control.intentar("smartlot:token-2"), false);
  control.habilitarReintento();
  assert.equal(control.intentar("smartlot:token-1"), true);
});
