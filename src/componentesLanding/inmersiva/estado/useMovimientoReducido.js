import { useSyncExternalStore } from 'react';

// Preferencia de movimiento reducido del sistema, al día si cambia con la página abierta.
const CONSULTA = '(prefers-reduced-motion: reduce)';

function suscribir(aviso) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener('change', aviso);
  return () => mq.removeEventListener('change', aviso);
}

const leer = () => window.matchMedia(CONSULTA).matches;

export function useMovimientoReducido() {
  return useSyncExternalStore(suscribir, leer, () => false);
}
