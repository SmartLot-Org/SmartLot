// La jornada del equipo, en funciones puras (sin three): de fx.hora a la hora
// del reloj y a cuánto se ocupa cada garage. Es un perfil de ejemplo.
import { JORNADA } from '../contenido/secciones.js';

const paso = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// fx.hora (0 a 1) → horas decimales, de JORNADA.desde a JORNADA.hasta.
export const horaDe = (hora) => JORNADA.desde + (JORNADA.hasta - JORNADA.desde) * Math.min(1, Math.max(0, hora));

export function textoHora(h) {
  const total = Math.round(h * 4) * 15;   // de a cuarto de hora
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Ocupación (0 a 1): el equipo llega entre las 8 y las 10, algunos salen a
// almorzar y a la tarde se van.
export function ocupacion(h) {
  const llegan = paso(7.6, 9.8, h);
  const almuerzo = 0.14 * paso(12.2, 13, h) * (1 - paso(13.6, 14.4, h));
  const seVan = 1 - paso(16.8, 19.4, h);
  return Math.max(0, 0.94 * llegan * seVan - almuerzo);
}

// Cada garage tiene su propio ritmo, apenas corrido.
export function ocupacionDe(i, h) {
  const corrimiento = [0, 0.35, -0.25, 0.5, -0.4, 0.2, -0.1][i % 7];
  return ocupacion(h - corrimiento) * (i === 0 ? 1 : 0.7 + ((i * 37) % 10) / 40);
}

// Atardecer (0 a 1): al final de la jornada se encienden las ventanas.
export const atardecer = (h) => paso(18, 19.8, h);
