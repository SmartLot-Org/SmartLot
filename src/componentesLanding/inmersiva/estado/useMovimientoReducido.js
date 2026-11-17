import { useSyncExternalStore } from 'react';

// Preferencia de movimiento reducido del sistema, al día si cambia con la página abierta.
// La consulta se crea una sola vez: getSnapshot corre en cada render.
const CONSULTA = '(prefers-reduced-motion: reduce)';
let consulta = null;
const mq = () => (consulta ??= window.matchMedia(CONSULTA));

function suscribir(aviso) {
  mq().addEventListener('change', aviso);
  return () => mq().removeEventListener('change', aviso);
}

const leer = () => mq().matches;

export function useMovimientoReducido() {
  return useSyncExternalStore(suscribir, leer, () => false);
}
