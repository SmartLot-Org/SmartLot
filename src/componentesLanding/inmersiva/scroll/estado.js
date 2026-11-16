// Composición del estado del dibujo: funciones puras, sin DOM ni three.
// Dado cuánto avanzó el scroll dentro de cada sección, devuelven el encuadre
// de cámara y los fx. El director (useStoryTimeline) es el único que las usa
// para escribir `rig`.
import { SECCIONES } from '../contenido/secciones.js';
import { COREOGRAFIA, FX_CERO } from './coreografia.js';

export const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// power2.inOut: la cámara arranca y frena suave en cada viaje.
export const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);
const mezcla = (a, b, t) => a + (b - a) * t;

const GUION = SECCIONES.map((s) => ({ ...COREOGRAFIA[s.id], id: s.id, weight: s.weight }));
export const PESOS = GUION.map((g) => g.weight);

export function nuevoEstado() {
  return { cam: { x: 0, z: 0, lz: 0 }, fx: { ...FX_CERO } };
}

/**
 * @param {number[]} avances  por sección: pantallas recorridas desde que asoma (0 a weight)
 * @param {boolean} vertical  encuadres para pantalla vertical
 * @param {{cam: object, fx: object}} destino  se escribe en el lugar, sin crear objetos
 */
export function componer(avances, vertical, destino = nuevoEstado()) {
  const encuadre = (g) => (vertical ? g.camaraVertical : g.camara);
  const c0 = encuadre(GUION[0]);
  let x = c0.x;
  let z = c0.z;
  let lz = Math.log(c0.zoom);
  const fx = destino.fx;
  for (const k in FX_CERO) fx[k] = 0;

  for (let i = 0; i < GUION.length; i++) {
    const g = GUION[i];
    const u = Math.min(Math.max(avances[i] ?? 0, 0), g.weight);
    if (i > 0) {
      // El zoom se interpola en escala logarítmica: así el acercamiento se
      // siente parejo de la ciudad a la plaza.
      const t = suave(limitar(u));
      const c = encuadre(g);
      x = mezcla(x, c.x, t);
      z = mezcla(z, c.z, t);
      lz = mezcla(lz, Math.log(c.zoom), t);
    }
    for (const f of g.fx) {
      const t = limitar((u - f.desde) / (f.hasta - f.desde));
      fx[f.clave] = mezcla(fx[f.clave], f.valor, t);
    }
  }
  destino.cam.x = x;
  destino.cam.z = z;
  destino.cam.lz = lz;
  return destino;
}

// Estado final de una sección: todo lo anterior completo, lo siguiente sin empezar.
// Es el que se muestra con movimiento reducido, donde la cámara salta por sección.
export function avancesFinales(indice) {
  return PESOS.map((peso, i) => (i <= indice ? peso : 0));
}
