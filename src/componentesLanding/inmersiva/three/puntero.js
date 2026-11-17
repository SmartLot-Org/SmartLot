// Posición del cursor en coordenadas normalizadas (-1 a 1). El Canvas no
// recibe eventos (pointer-events: none, el texto va encima), así que se
// escucha la ventana. Solo cuenta un mouse real: en táctil no hay hover.
export const puntero = {
  x: 0, y: 0, cx: 0, cy: 0, activo: false,
  sobreUI: false,          // encima del texto, la barra o un control: la mira se esconde
  // Lo que hay bajo el cursor (lo escribe Realce con un rayo):
  edificio: -1, garage: -1,
  fijado: -1,              // garage con la ficha abierta por clic
};
const UI = '.plano-nota, .plano-barra, .plano-pie, .plano-regla, a, button';

let suscriptos = 0;
const mover = (e) => {
  if (e.pointerType !== 'mouse') return;
  puntero.cx = e.clientX;
  puntero.cy = e.clientY;
  puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
  puntero.y = -((e.clientY / window.innerHeight) * 2 - 1);
  puntero.activo = true;
  puntero.sobreUI = !!e.target.closest?.(UI);
};
const clic = (e) => {
  if (e.target.closest?.(UI)) return;
  puntero.fijado = puntero.garage >= 0 && puntero.garage !== puntero.fijado ? puntero.garage : -1;
};
const tecla = (e) => { if (e.key === 'Escape') puntero.fijado = -1; };
const salir = () => { puntero.activo = false; puntero.x = 0; puntero.y = 0; puntero.garage = -1; puntero.edificio = -1; };

export function escucharPuntero() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  if (suscriptos++ === 0) {
    window.addEventListener('pointermove', mover, { passive: true });
    window.addEventListener('click', clic);
    window.addEventListener('keydown', tecla);
    document.documentElement.addEventListener('pointerleave', salir);
  }
  return () => {
    if (--suscriptos === 0) {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('click', clic);
      window.removeEventListener('keydown', tecla);
      document.documentElement.removeEventListener('pointerleave', salir);
      salir();
    }
  };
}
