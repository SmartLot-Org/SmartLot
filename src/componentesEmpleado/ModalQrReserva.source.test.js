import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const modalPath = new URL("./ModalQrReserva.jsx", import.meta.url);

test("el QR abierto cambia a salida cuando el servidor confirma el ingreso", async () => {
  const source = await readFile(modalPath, "utf8");

  assert.match(source, /ReservasGetById\(idReserva, \{ force: true \}\)/);
  assert.match(source, /setInterval\(\(\) => \{ void actualizarEtapa\(\); \}, 2_000\)/);
  assert.match(source, /setTipoServidor\(obtenerTipoQrReserva\(reserva\)\)/);
  assert.match(source, /ReservasGetQr\(idReserva\)/);
  assert.match(source, /Código de \{tipoActual\}/);
});
