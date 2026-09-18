import test from "node:test";
import assert from "node:assert/strict";
import { crearControlLecturasQr, puedeMostrarQrReserva } from "./qrReserva.js";

test("muestra QR para una reserva confirmada sin ingreso", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Confirmada", entrada_registrada: false }), true);
});

test("no muestra QR para una reserva no confirmada", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Cancelada" }), false);
});

test("no muestra QR para una reserva que ya registró ingreso", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Confirmada", fecha_entrada_real: "2026-09-18T10:30:00-03:00" }), false);
});

test("reconoce el estado Dentro aunque el backend no repita la fecha de ingreso", () => {
  assert.equal(puedeMostrarQrReserva({ estado: "Dentro" }), false);
  assert.equal(puedeMostrarQrReserva({ estado_reserva: "en_curso" }), false);
});

test("el control del lector bloquea frames y tokens duplicados mientras procesa", () => {
  const control = crearControlLecturasQr();
  assert.equal(control.intentar("smartlot:token-1"), true);
  assert.equal(control.intentar("smartlot:token-1"), false);
  assert.equal(control.intentar("smartlot:token-2"), false);
  control.habilitarReintento();
  assert.equal(control.intentar("smartlot:token-1"), true);
});
