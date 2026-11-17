// Posición del cursor en coordenadas normalizadas (-1 a 1). El Canvas no
// recibe eventos (pointer-events: none, el texto va encima), así que se
// escucha la ventana. Solo cuenta un mouse real: en táctil no hay hover.
export const puntero = { x: 0, y: 0, cx: 0, cy: 0, activo: false, movido: false };

let suscriptos = 0;
const mover = (e) => {
  if (e.pointerType !== 'mouse') return;
  puntero.cx = e.clientX;
  puntero.cy = e.clientY;
  puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
  puntero.y = -((e.clientY / window.innerHeight) * 2 - 1);
  puntero.activo = true;
  puntero.movido = true;
};
const salir = () => { puntero.activo = false; puntero.x = 0; puntero.y = 0; };

export function escucharPuntero() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  if (suscriptos++ === 0) {
    window.addEventListener('pointermove', mover, { passive: true });
    document.documentElement.addEventListener('pointerleave', salir);
  }
  return () => {
    if (--suscriptos === 0) {
      window.removeEventListener('pointermove', mover);
      document.documentElement.removeEventListener('pointerleave', salir);
      salir();
    }
  };
}
