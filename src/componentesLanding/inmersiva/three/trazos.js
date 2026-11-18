// Recorridos por la calle, dibujados como una cinta punteada sobre el asfalto. Los
// comparten la red de la home (Red.jsx) y las llegadas de /para-garages (Llegadas.jsx).
// Solo datos (arrays de posiciones), sin three.
import { OFICINA } from './mundo.js';

const ANCHO = 0.62;
const TRAZO = 0.7;     // largo de cada trazo del punteado
const HUECO = 0.45;

// Recorrido por las calles desde la oficina hasta un garage: sale por el lado
// que le queda, toma la calle de la manzana del garage y entra por su frente.
export function recorrido(g) {
  const lado = g.cx >= 0 ? 1 : -1;
  const sx = 6 * lado;
  const fila = Math.round(g.cz / 12);
  const zs = fila === 0 ? 6 : g.cz > 0 ? fila * 12 - 6 : fila * 12 + 6;
  const zFin = zs < g.cz ? g.z0 : g.z1;
  return [[OFICINA.x1 * lado, 0], [sx, 0], [sx, zs], [g.cx, zs], [g.cx, zFin]];
}

// Cinta punteada sobre la calle, en orden: se dibuja de a poco con setDrawRange.
export function cintaPunteada(puntos) {
  const caras = [];
  for (let s = 0; s < puntos.length - 1; s++) {
    const [a, b] = [puntos[s], puntos[s + 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) continue;
    const ux = (b[0] - a[0]) / len;
    const uz = (b[1] - a[1]) / len;
    const nx = (-uz * ANCHO) / 2;
    const nz = (ux * ANCHO) / 2;
    for (let t = 0; t < len; t += TRAZO + HUECO) {
      const t1 = Math.min(len, t + TRAZO);
      const p0x = a[0] + ux * t, p0z = a[1] + uz * t, p1x = a[0] + ux * t1, p1z = a[1] + uz * t1;
      caras.push(p0x + nx, 0.07, p0z + nz, p0x - nx, 0.07, p0z - nz, p1x - nx, 0.07, p1z - nz,
        p0x + nx, 0.07, p0z + nz, p1x - nx, 0.07, p1z - nz, p1x + nx, 0.07, p1z + nz);
    }
  }
  return { caras: new Float32Array(caras) };
}
