// Estado amortiguado del dibujo: lo escribe CameraRig una vez por frame a partir
// de rig, y las escenas y los rótulos lo leen. El suavizado se aplica acá y en
// ningún otro lado.
import { FX_CERO } from '../scroll/coreografia';

export const vivo = {
  fx: { ...FX_CERO },
  cam: { x: 0, z: 0, lz: 0 },
  intro: 0,        // 0 → 1: el plano se dibuja al cargar (no depende del scroll)
  aparecen: 0,     // derivado de intro: tinta plena y señales
  tiempo: 0,       // segundos de movimiento ambiental (se detiene con movimiento reducido)
  pxPorUnidad: 1,
  listo: false,
};
