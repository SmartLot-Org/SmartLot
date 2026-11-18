// El guion de una página del plano: funciones puras, sin DOM ni three.
// Dado cuánto avanzó el scroll dentro de cada sección, devuelven el encuadre
// de cámara y los fx. El director (useStoryTimeline) es el único que las usa
// para escribir `rig`. Cada página trae sus secciones y su coreografía; el
// vocabulario de fx es uno solo (FX_CERO), así las escenas compartidas leen
// las mismas claves en las dos páginas.
import { FX_CERO } from './coreografia.js';

export const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// power2.inOut: la cámara arranca y frena suave en cada viaje.
export const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);
export const mezcla = (a, b, t) => a + (b - a) * t;

export function nuevoEstado() {
  return { cam: { x: 0, z: 0, lz: 0 }, fx: { ...FX_CERO } };
}

/**
 * @param {{
 *   secciones: { id: string, weight: number }[],
 *   guion: { coreografia: Record<string, object>, inicial?: Record<string, number> },
 * }} pagina
 */
export function crearGuion(pagina) {
  const { coreografia, inicial } = pagina.guion;
  const tramos = pagina.secciones.map((s) => {
    const c = coreografia[s.id];
    // Mejor fallar acá, al armar la página, que con un NaN en la cámara a mitad del scroll.
    if (!c) throw new Error(`Falta la coreografía de la sección "${s.id}"`);
    return { camara: c.camara, camaraVertical: c.camaraVertical, fx: c.fx ?? [], id: s.id, weight: s.weight };
  });
  const pesos = tramos.map((g) => g.weight);
  // Los fx parten de FX_CERO, que es el estado de la home, y la página puede
  // fijar otro arranque (en garages, tu garage empieza fuera del mapa).
  const arranque = { ...FX_CERO, ...inicial };

  /**
   * @param {number[]} avances  por sección: pantallas recorridas desde que asoma (0 a weight)
   * @param {boolean} vertical  encuadres para pantalla vertical
   * @param {{cam: object, fx: object}} destino  se escribe en el lugar, sin crear objetos
   */
  function componer(avances, vertical, destino = nuevoEstado()) {
    const encuadre = (g) => (vertical ? g.camaraVertical : g.camara);
    const c0 = encuadre(tramos[0]);
    let x = c0.x;
    let z = c0.z;
    let lz = Math.log(c0.zoom);
    const fx = destino.fx;
    for (const k in arranque) fx[k] = arranque[k];

    for (let i = 0; i < tramos.length; i++) {
      const g = tramos[i];
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
  function avancesFinales(indice) {
    return pesos.map((peso, i) => (i <= indice ? peso : 0));
  }

  return { pesos, componer, avancesFinales };
}
