import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lectorPath = new URL("./LectorQrReserva.jsx", import.meta.url);
const modalPortalPath = new URL("../componentesCompartidos/ModalPortal.jsx", import.meta.url);

test("el cierre por X, Escape u overlay respeta el guard mientras se verifica el QR", async () => {
  const [source, modalPortalSource] = await Promise.all([
    readFile(lectorPath, "utf8"),
    readFile(modalPortalPath, "utf8"),
  ]);

  assert.match(source, /const operacionEnCursoRef = useRef\(false\)/);
  assert.match(source, /const cerrar = useCallback\(\(\) => \{\s*if \(operacionEnCursoRef\.current\) return;\s*onCloseRef\.current\?\.\(\);\s*\}, \[\]\)/);
  assert.match(source, /<ModalPortal onClose=\{cerrar\} overlayClassName="lector-qr-overlay">/);
  assert.match(source, /className="lector-qr-close disabled:opacity-50 disabled:cursor-not-allowed" onClick=\{cerrar\} disabled=\{estado === "verificando"\}/);
  assert.doesNotMatch(source, /disabled=\{estado === "iniciando"\}/);
  assert.match(source, /operacionEnCursoRef\.current = true;\s*setEstado\("verificando"\)/);
  assert.match(source, /estado === "verificando" \? <div className="lector-qr-status lector-qr-status--processing" role="status">Verificando \{tipo\}\.\.\.<\/div> : null/);
  assert.match(modalPortalSource, /if \(e\.key === "Escape"\) \{\s*onClose\?\.\(\);/);
  assert.match(modalPortalSource, /onClick=\{onClose\}/);
});

test("al resolver el QR libera el lock; el éxito cierra y el error deja reintentar", async () => {
  const source = await readFile(lectorPath, "utf8");

  assert.match(source, /if \(resultado\.respuesta\) \{[\s\S]*?if \(esSalida\) onSalidaExitosaRef\.current\?\.\(resultado\.datos\);\s*else onIngresoExitosoRef\.current\?\.\(resultado\.datos\);\s*onCloseRef\.current\?\.\(\);\s*return;/);
  assert.match(source, /setError\(resultado\.datos\?\.message \|\| `No se pudo registrar \$\{esSalida \? "la salida" : "el ingreso"\} con este código\.`\);\s*setEstado\("error"\);/);
  assert.match(source, /finally \{\s*operacionEnCursoRef\.current = false;\s*controlRef\.current\.habilitarReintento\(\);\s*\}/);
  assert.match(source, /estado === "error" \? \(\s*<button type="button" className="lector-qr-retry" onClick=\{reintentar\}>[\s\S]*?Reintentar<\/button>/);
});

test("cancelar el inicio impide crear un lector tardío y limpia la instancia local", async () => {
  const source = await readFile(lectorPath, "utf8");

  assert.match(source, /const inicioRef = useRef\(null\)/);
  assert.match(source, /const \{ Html5Qrcode \} = await import\("html5-qrcode"\);\s*if \(inicio\.cancelado \|\| !montadoRef\.current\) return;\s*lector = new Html5Qrcode/);
  assert.match(source, /if \(inicio\.cancelado \|\| inicio\.detenerAlResolver \|\| !montadoRef\.current\) await detenerCamara\(lector\)/);
  assert.match(source, /if \(inicio\?\.lector === lector && inicio\.startPendiente\) \{\s*inicio\.detenerAlResolver = true;\s*return;\s*\}/);
  assert.match(source, /if \(lectorRef\.current === lector\) lectorRef\.current = null;[\s\S]*?const limpiezaExistente = limpiezasRef\.current\.get\(lector\)/);
  assert.match(source, /return \(\) => \{\s*montadoRef\.current = false;\s*const inicio = inicioRef\.current;\s*if \(inicio\) \{\s*inicio\.cancelado = true;/);
  assert.match(source, /void detenerCamara\(\);\s*\};\s*\}, \[detenerCamara, iniciarCamara\]\)/);
  assert.match(source, /try \{ await lector\.stop\(\); \} catch \{/);
  assert.match(source, /try \{ lector\.clear\(\); \} catch \{/);
});
