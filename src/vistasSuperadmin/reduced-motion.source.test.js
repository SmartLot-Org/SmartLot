import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const estilosGlobales = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const vistasAnimadas = [
  "superadmin_reservas.jsx",
  "superadmin_gestion_garages.jsx",
  "gestion_empresas.jsx",
  "gestion_usuarios.jsx",
];

test("la preferencia de movimiento reducido acota las animaciones CSS globales", () => {
  assert.match(estilosGlobales, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(estilosGlobales, /animation-duration:\s*0\.01ms\s*!important/);
  assert.match(estilosGlobales, /animation-iteration-count:\s*1\s*!important/);
  assert.match(estilosGlobales, /transition-duration:\s*0\.01ms\s*!important/);
});

test("cada hook GSAP del superadmin respeta la preferencia de movimiento", () => {
  for (const archivo of vistasAnimadas) {
    const fuente = readFileSync(new URL(archivo, import.meta.url), "utf8");
    const cantidadHooks = (fuente.match(/\buseGSAP\s*\(/g) || []).length;
    const cantidadGuardas = (fuente.match(/mm\.add\("\(prefers-reduced-motion: no-preference\)"/g) || []).length;
    const cantidadLimpiezas = (fuente.match(/return\s*\(\)\s*=>\s*mm\.revert\(\)/g) || []).length;

    assert.ok(cantidadHooks > 0, `${archivo} debe contener hooks GSAP`);
    assert.equal(cantidadGuardas, cantidadHooks, `${archivo} debe guardar cada hook GSAP`);
    assert.equal(cantidadLimpiezas, cantidadHooks, `${archivo} debe limpiar cada media query`);
  }
});

test("el dropdown de filtros sigue su estado sin animación reducida", () => {
  const fuente = readFileSync(new URL("gestion_usuarios.jsx", import.meta.url), "utf8");
  assert.match(fuente, /mm\.add\("\(prefers-reduced-motion: reduce\)"/);
  assert.match(fuente, /gsap\.set\(dropdownRef\.current/);
  assert.match(fuente, /display:\s*showFilters\s*\?\s*"flex"\s*:\s*"none"/);
});
