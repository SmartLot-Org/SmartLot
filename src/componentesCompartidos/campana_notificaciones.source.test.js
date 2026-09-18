import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const campanaPath = new URL("./CampanaNotificaciones.jsx", import.meta.url);
const hookPath = new URL("../hooks/useNotificaciones.js", import.meta.url);

test("la campana no se monta para garagistas", async () => {
  const source = await readFile(campanaPath, "utf8");
  assert.match(source, /function CampanaNotificacionesInterna/);
  assert.match(source, /userHasRole\(usuario, ROLE_NAMES\.GARAGISTA\)/);
  assert.match(source, /if \(userHasRole\(usuario, ROLE_NAMES\.GARAGISTA\)\) return null;/);
});

test("las notificaciones no se borran automáticamente al abrir ni al navegar", async () => {
  const source = await readFile(campanaPath, "utf8");
  assert.doesNotMatch(source, /if \(isOpen\) eliminarLeidas\(\)/);
  const irATratos = source.slice(source.indexOf("const irATratos"), source.indexOf("const totalBadge"));
  assert.match(irATratos, /marcarLeida\(notificacion\.id\)/);
  assert.doesNotMatch(irATratos, /eliminar\(/);
  assert.match(source, /Limpiar leídas/);
});

test("el hook refresca al volver el foco o la visibilidad a la pestaña", async () => {
  const source = await readFile(hookPath, "utf8");
  assert.match(source, /addEventListener\("focus", alVolver\)/);
  assert.match(source, /addEventListener\("visibilitychange", alVolver\)/);
  assert.match(source, /removeEventListener\("focus", alVolver\)/);
  assert.match(source, /removeEventListener\("visibilitychange", alVolver\)/);
});
