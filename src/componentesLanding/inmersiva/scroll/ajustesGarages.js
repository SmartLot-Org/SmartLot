// El guion de /para-garages para el director: la coreografía, el arranque y el
// interruptor "Visible / En borrador". Como el deslizador de la home, el interruptor
// pesa solo mientras se está en `control`, así el relato sigue siendo continuo al
// entrar y al salir. Funciones puras, más la conexión con el store del interruptor.
import { SECCIONES } from '../contenido/garages.js';
import { useGarages } from '../estado/garages.js';
import { COREOGRAFIA_GARAGES, INICIAL_GARAGES } from './coreografiaGarages.js';
import { limitar, mezcla } from './guion.js';

const I_CONTROL = SECCIONES.findIndex((s) => s.id === 'control');
const I_ACCION = SECCIONES.findIndex((s) => s.id === 'accion');

// Entra con `control` y se va en la primera mitad de la entrada de `accion`.
export function pesoVisibilidad(avances) {
  return limitar(avances[I_CONTROL] ?? 0) * (1 - limitar((avances[I_ACCION] ?? 0) * 2));
}

// "En borrador" saca tu garage del mapa: vuelve a la línea de trazos y los anillos de
// las sedes pasan sin encontrarlo (regla 6). No mueve la cámara.
export function aplicarVisibilidad(destino, visible, avances) {
  const k = visible ? 0 : pesoVisibilidad(avances);
  if (k <= 0) return destino;
  destino.fx.fuera = mezcla(destino.fx.fuera, 1, k);
  return destino;
}

export const GUION_GARAGES = {
  coreografia: COREOGRAFIA_GARAGES,
  inicial: INICIAL_GARAGES,
  ajustar: (destino, avances) => aplicarVisibilidad(destino, useGarages.getState().visible, avances),
  // El interruptor recompone el dibujo sin esperar al scroll.
  suscribir: (recomponer) => useGarages.subscribe((s, previo) => {
    if (s.visible !== previo.visible) recomponer();
  }),
};
