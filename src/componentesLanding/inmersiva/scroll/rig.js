// Estado CONTINUO del dibujo: el director lo escribe y las escenas lo leen en
// cada frame. Nunca pasa por React. La capa DOM habla con el 3D solo a través
// de este objeto, sin importar three.
import { componer, nuevoEstado } from './estado.js';

// Pantalla vertical: la nota va abajo y el dibujo se encuadra arriba.
// La misma consulta está en inmersiva.css; si cambia una, cambia la otra.
export const CONSULTA_VERTICAL = '(max-width: 899px) and (orientation: portrait), (max-width: 599px)';

export const rig = {
  ...componer([1], false, nuevoEstado()),
  vertical: false,
  snap: false,              // con movimiento reducido la cámara salta, no viaja
  velocidad: 0,             // velocidad del scroll: la cámara la acusa (inercia)
  requestFrame: () => {},   // lo conecta el Canvas (FrameBridge)
};
