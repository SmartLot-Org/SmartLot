import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const servicePath = new URL("./API_Reserva.js", import.meta.url);

test("control de acceso tiene una consulta de respaldo acotada al garage y fecha", async () => {
  const source = await readFile(servicePath, "utf8");

  assert.match(source, /apiClient\.get\('\/api\/reserva',\s*\{/);
  assert.match(source, /params:\s*\{\s*id_garage:\s*idGarage,\s*fecha\s*\}/);
});
