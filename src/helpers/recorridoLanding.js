// Cuenta pura del recorrido de la landing: traduce el progreso del scroll
// (0..1) a pasos y encuadres. La comparten la capa DOM (paso activo) y la
// escena 3D (cámara y estados), así las dos leen exactamente lo mismo; por
// eso vive fuera de los componentes y se prueba con node:test.

const acotar01 = (valor) => Math.min(1, Math.max(0, valor));

// Curva smoothstep entre `desde` y `hasta`: 0 antes, 1 después.
export function suavizar(desde, hasta, valor) {
  const x = acotar01((valor - desde) / (hasta - desde));
  return x * x * (3 - 2 * x);
}

// Cada paso ocupa un viewport de scroll y el escenario queda fijo mientras
// pasan, así que el paso i está centrado en progreso = i / (total - 1).
export function pasoActivo(progreso, totalPasos) {
  if (totalPasos <= 1) return 0;
  return Math.round(acotar01(progreso) * (totalPasos - 1));
}

// Posición continua medida en pasos (0..total-1). La escena viaja solo en el
// tramo central entre dos pasos y queda quieta alrededor de cada uno, para
// que el texto se lea con la maqueta detenida.
export function posicionPaso(progreso, totalPasos, estadia = 0.25) {
  if (totalPasos <= 1) return 0;
  const t = acotar01(progreso) * (totalPasos - 1);
  const i = Math.min(Math.floor(t), totalPasos - 2);
  return i + suavizar(estadia, 1 - estadia, t - i);
}

// Mezcla los encuadres vecinos de `posicion`. Escribe en `salida` en lugar de
// devolver arrays nuevos porque la escena la llama en cada frame.
export function encuadreEn(posicion, encuadres, salida = { posicion: [0, 0, 0], objetivo: [0, 0, 0] }) {
  const ultimo = encuadres.length - 1;
  const p = Math.min(Math.max(posicion, 0), ultimo);
  const i = Math.min(Math.floor(p), Math.max(ultimo - 1, 0));
  const f = ultimo === 0 ? 0 : p - i;
  const a = encuadres[i];
  const b = encuadres[Math.min(i + 1, ultimo)];
  for (let k = 0; k < 3; k++) {
    salida.posicion[k] = a.posicion[k] + (b.posicion[k] - a.posicion[k]) * f;
    salida.objetivo[k] = a.objetivo[k] + (b.objetivo[k] - a.objetivo[k]) * f;
  }
  return salida;
}
