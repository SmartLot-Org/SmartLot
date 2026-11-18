// El guion de la home, armado con crearGuion (scroll/guion.js), y el deslizador
// antes / con SmartLot, que es solo de la home. Los nombres se mantienen porque
// los usan el rig, las escenas y los tests: funciones puras, sin DOM ni three.
import { SECCIONES } from '../contenido/secciones.js';
import { COREOGRAFIA } from './coreografia.js';
import { crearGuion, limitar, mezcla, nuevoEstado, suave } from './guion.js';

export { limitar, nuevoEstado, suave };

const GUION_HOME = crearGuion({ secciones: SECCIONES, guion: { coreografia: COREOGRAFIA } });

export const PESOS = GUION_HOME.pesos;
export const componer = GUION_HOME.componer;
export const avancesFinales = GUION_HOME.avancesFinales;

// ── Antes / con SmartLot ──
// En el problema, un deslizador (0 = antes, 1 = con SmartLot) lleva el dibujo
// hacia el estado del trato: los autos dejan de dar vueltas, se traza la ruta,
// el garage acepta y la cámara encuadra como en la idea. Pesa solo mientras se
// está en el problema, así el relato sigue siendo continuo al entrar y al salir.
const I_PROBLEMA = SECCIONES.findIndex((s) => s.id === 'problema');
const I_IDEA = SECCIONES.findIndex((s) => s.id === 'idea');

export function pesoComparacion(avances) {
  return limitar(avances[I_PROBLEMA] ?? 0) * (1 - limitar((avances[I_IDEA] ?? 0) * 2));
}

export function aplicarComparacion(destino, comparar, avances, vertical) {
  const k = suave(limitar(comparar)) * pesoComparacion(avances);
  if (k <= 0) return destino;
  const g = COREOGRAFIA.idea;
  const c = vertical ? g.camaraVertical : g.camara;
  destino.cam.x = mezcla(destino.cam.x, c.x, k);
  destino.cam.z = mezcla(destino.cam.z, c.z, k);
  destino.cam.lz = mezcla(destino.cam.lz, Math.log(c.zoom), k);
  destino.fx.vueltas = mezcla(destino.fx.vueltas, 0, k);
  destino.fx.traza = mezcla(destino.fx.traza, 1, k);
  destino.fx.trato = mezcla(destino.fx.trato, 1, limitar((k - 0.3) / 0.7));   // acepta cuando la ruta ya avanzó
  return destino;
}
