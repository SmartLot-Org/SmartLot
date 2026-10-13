import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fuente = readFileSync(new URL("./superadmin_pagos_test.jsx", import.meta.url), "utf8");
const inicioIntervalo = fuente.indexOf("pollingRef.current = setInterval(async () => {");
const finIntervalo = fuente.indexOf("\n    }, POLLING_INTERVALO_MS);", inicioIntervalo);
const callbackPolling = fuente.slice(inicioIntervalo, finIntervalo);
const inicioDetener = fuente.indexOf("const detenerPolling = () => {");
const inicioIniciar = fuente.indexOf("const iniciarPollingAutomatico = ", inicioDetener);
const detenerPolling = fuente.slice(inicioDetener, inicioIniciar);
const iniciarPolling = fuente.slice(inicioIniciar, fuente.indexOf("const crearPreferencia = ", inicioIniciar));

test("el polling conserva una sola cadena PagosBuscar/PagosGetById en vuelo", () => {
  const guardia = callbackPolling.indexOf("if (pollingInFlightRef.current) return;");
  const adquirirBloqueo = callbackPolling.indexOf("pollingInFlightRef.current = true;");
  const incrementarIntento = callbackPolling.indexOf("intentos += 1;");
  const buscar = callbackPolling.indexOf("await PagosBuscar");
  const verificar = callbackPolling.indexOf("await PagosGetById");
  const liberarBloqueo = callbackPolling.indexOf("pollingInFlightRef.current = false;");

  assert.ok(inicioIntervalo >= 0 && finIntervalo > inicioIntervalo, "debe existir el intervalo de polling");
  assert.match(fuente, /const pollingInFlightRef = useRef\(false\);/);
  assert.ok(guardia >= 0 && guardia < adquirirBloqueo, "un tick ocupado debe salir sin iniciar otra cadena");
  assert.ok(adquirirBloqueo < incrementarIntento, "el bloqueo se adquiere antes de contar el intento");
  assert.ok(incrementarIntento < buscar && buscar < verificar, "el intento cubre la búsqueda y su verificación");
  assert.ok(verificar < liberarBloqueo, "el bloqueo se libera después de completar toda la cadena");
  assert.match(callbackPolling, /finally\s*\{[\s\S]*pollingInFlightRef\.current = false;/);
  assert.doesNotMatch(detenerPolling, /pollingInFlightRef\.current\s*=\s*false/, "detener no libera una consulta que sigue pendiente");
});

test("detener, reiniciar o desmontar invalida los resultados de la generación anterior", () => {
  const buscar = callbackPolling.indexOf("await PagosBuscar");
  const vigenciaTrasBuscar = callbackPolling.indexOf("if (!pollingVigente()) return;", buscar);
  const verificar = callbackPolling.indexOf("await PagosGetById");
  const vigenciaTrasVerificar = callbackPolling.indexOf("if (!pollingVigente()) return;", verificar);
  const detenerTrasVerificar = callbackPolling.indexOf("detenerPolling();", verificar);
  const actualizarEstado = callbackPolling.indexOf("setPaymentIdVerificar(pid)", verificar);
  const notificarExito = callbackPolling.indexOf("¡Pago detectado automáticamente!", verificar);
  const limpiarAlDesmontar = fuente.slice(fuente.indexOf("useEffect(() => () => {"), fuente.indexOf("const sedesFiltradas ="));

  assert.match(fuente, /const pollingGenerationRef = useRef\(0\);/);
  assert.match(detenerPolling, /pollingGenerationRef\.current\s*\+=\s*1;/);
  assert.match(iniciarPolling, /detenerPolling\(\);[\s\S]*const generacion = pollingGenerationRef\.current;/, "reiniciar invalida la generación anterior antes de capturar la nueva");
  assert.match(iniciarPolling, /const pollingVigente = \(\) => pollingGenerationRef\.current === generacion;/);
  assert.ok(buscar < vigenciaTrasBuscar && vigenciaTrasBuscar < verificar, "se descarta una búsqueda que quedó vieja antes de verificarla");
  assert.ok(verificar < vigenciaTrasVerificar && vigenciaTrasVerificar < actualizarEstado, "una verificación vieja no actualiza el estado");
  assert.ok(vigenciaTrasVerificar < detenerTrasVerificar && vigenciaTrasVerificar < notificarExito, "un resultado viejo no detiene ni notifica al polling vigente");
  assert.match(limpiarAlDesmontar, /pollingGenerationRef\.current\s*\+=\s*1;/);
  assert.match(limpiarAlDesmontar, /clearInterval\(pollingRef\.current\)/);
  assert.match(limpiarAlDesmontar, /clearTimeout\(pollingTimeoutRef\.current\)/);
  assert.match(iniciarPolling, /const detenerPorLimite = \(\) => \{\s*if \(!pollingVigente\(\)\) return;\s*detenerPolling\(\);/);
});

test("se mantienen endpoint, frecuencia nominal y límites del polling", () => {
  assert.match(fuente, /const POLLING_INTERVALO_MS = 5000;/);
  assert.match(fuente, /const POLLING_DURACION_MAXIMA_MS = 3 \* 60 \* 1000;/);
  assert.match(fuente, /const POLLING_INTENTOS_MAXIMOS = 36;/);
  assert.match(fuente, /setTimeout\(detenerPorLimite, POLLING_DURACION_MAXIMA_MS\)/);
  assert.match(fuente, /PagosBuscar\(\{ external_reference: oid \}\)/);
  assert.match(fuente, /PagosGetById\(pid\)/);
  assert.match(fuente, /Polling detenido: no se detectó pago en 3 min\. Usá Buscar por Order ID manual\./);
});
