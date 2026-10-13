import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (await readFile(new URL("./admin_pagos.jsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const handlerStart = source.indexOf("const handlePagar = async (cuenta) => {");
const handlerEnd = source.indexOf("\n  };\n\n  return", handlerStart);
const handlePagar = source.slice(handlerStart, handlerEnd);
assert.ok(handlerStart >= 0 && handlerEnd > handlerStart, "debe encontrar handlePagar");

test("reserva el checkout antes del primer await y anula opener", () => {
  const popupIndex = handlePagar.indexOf('window.open("about:blank", "_blank")');
  const firstAwaitIndex = handlePagar.indexOf("await ");

  assert.ok(popupIndex >= 0, "debe reservar una ventana about:blank");
  assert.ok(firstAwaitIndex >= 0, "debe esperar la creación de la preferencia");
  assert.ok(popupIndex < firstAwaitIndex, "el popup debe abrirse antes del primer await");
  assert.match(handlePagar, /checkoutWindow\.opener = null/);
});

test("si el navegador bloquea el popup, informa cómo habilitarlo y no crea preferencia", () => {
  const blockedIndex = handlePagar.indexOf("if (!checkoutWindow)");
  const blockedEnd = handlePagar.indexOf("\n    const cerrarCheckout", blockedIndex);
  const preferenceIndex = handlePagar.indexOf("PagosCrearPreferencia");
  const blockedBranch = handlePagar.slice(blockedIndex, blockedEnd);

  assert.ok(blockedIndex >= 0 && blockedEnd > blockedIndex && blockedEnd < preferenceIndex);
  assert.match(blockedBranch, /Habilitá las ventanas emergentes/);
  assert.match(blockedBranch, /return;/);
});

test("cierra el popup ante respuesta fallida, URL ausente o error", () => {
  const failedResponseStart = handlePagar.indexOf("if (!res.respuesta)");
  const failedResponseEnd = handlePagar.indexOf("const pref = res.datos", failedResponseStart);
  const failedResponse = handlePagar.slice(failedResponseStart, failedResponseEnd);

  const missingUrlStart = handlePagar.indexOf("if (!url)");
  const missingUrlEnd = handlePagar.indexOf("try {", missingUrlStart);
  const missingUrl = handlePagar.slice(missingUrlStart, missingUrlEnd);

  const catchStart = handlePagar.indexOf("} catch (e) {");
  const catchEnd = handlePagar.indexOf("} finally {", catchStart);
  const catchBlock = handlePagar.slice(catchStart, catchEnd);

  assert.match(failedResponse, /cerrarCheckout\(\)/);
  assert.match(missingUrl, /cerrarCheckout\(\)/);
  assert.match(catchBlock, /cerrarCheckout\(\)/);
});

test("navega al checkout validado antes de informar éxito", () => {
  const missingUrlIndex = handlePagar.indexOf("if (!url)");
  const navigationIndex = handlePagar.indexOf("checkoutWindow.location.href = url");
  const pollingIndex = handlePagar.indexOf("iniciarPolling(orderId)");
  const successIndex = handlePagar.indexOf('icon: "success"', navigationIndex);

  assert.ok(navigationIndex > missingUrlIndex);
  assert.ok(pollingIndex > navigationIndex);
  assert.ok(successIndex > navigationIndex);
  assert.match(handlePagar, /if \(checkoutWindow\.closed\)[\s\S]*?Volvé a intentar el pago/);
});
