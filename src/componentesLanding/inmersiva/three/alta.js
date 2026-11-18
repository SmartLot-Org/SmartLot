// El alta de tu garage en datos: en qué tramo de fx.alta se dibuja el volumen, dónde va
// la marca de la ubicación y de qué punto del volumen sale la guía de cada cota. Lo usan
// escenas/Alta.jsx (el trazo) y CotasAlta.jsx (las cotas). Solo datos, sin three.
import { G1 } from './mundo.js';

// De 0 a DIBUJO se dibujan las aristas y la ubicación; después aparecen las cotas.
export const DIBUJO = 0.6;
export const MARGEN = 0.02;   // el trazo va apenas por fuera del volumen, para no pisar sus aristas

const centro = [(G1.x0 + G1.x1) / 2, (G1.z0 + G1.z1) / 2];
export const UBICACION = [centro[0], G1.h + MARGEN + 0.01, centro[1]];

// Las guías salen del lado del volumen que mira a la cámara (x = x1), de arriba abajo
// en el orden de las cotas de contenido/garages.js: así no se cruzan.
export const ANCLAS_ALTA = {
  ubicacion: UBICACION,
  horario: [G1.x1 + MARGEN, G1.h + MARGEN, G1.z0 + 0.6],
  plazas: [G1.x1 + MARGEN, G1.h * 0.55, centro[1]],
  tarifas: [G1.x1 + MARGEN, 0, G1.z1 - 0.6],
};
