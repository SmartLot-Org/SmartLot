import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const servicePath = new URL("./API_Reserva.js", import.meta.url);

test("control de acceso tiene una consulta de respaldo acotada al garage y fecha", async () => {
  const source = await readFile(servicePath, "utf8");

  assert.match(source, /apiClient\.get\('\/api\/reserva',\s*\{/);
  assert.match(source, /params:\s*\{\s*id_garage:\s*idGarage,\s*fecha\s*\}/);
});

test("QR usa los endpoints y el body acordados", async () => {
  const source = await readFile(servicePath, "utf8");
  assert.match(source, /apiClient\.get\(`\/api\/reserva\/\$\{id\}\/qr`/);
  assert.match(source, /apiClient\.post\(\s*'\/api\/reserva\/qr\/check-in',\s*\{ qr \}/);
});

test("un check-in QR exitoso invalida las dependencias de reservas", async () => {
  const source = await readFile(servicePath, "utf8");
  const funcionQr = source.slice(source.indexOf("const ReservasCheckInQr"), source.indexOf("export {"));
  assert.match(funcionQr, /invalidateReservasDependencies\(\)/);
});

test("normaliza envolturas y conserva el error real del backend QR", async () => {
  const source = await readFile(servicePath, "utf8");
  assert.match(source, /payload\?\.data \?\? payload\?\.datos \?\? payload/);
  assert.match(source, /payload\?\.mensaje/);
  assert.match(source, /La solicitud del QR falló con HTTP/);
});
