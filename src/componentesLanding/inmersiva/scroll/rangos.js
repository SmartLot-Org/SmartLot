// De los `weight` a rangos de scroll, en pantallas. Puro: sirve para razonar
// y probar el guion sin navegador.
//
// La sección 0 ya está en pantalla al cargar: solo tiene estadía. Cada una de
// las siguientes tiene una entrada de una pantalla (asoma por abajo hasta
// llegar arriba) y una estadía de `weight - 1` pantallas.

export function rangosDeScroll(pesos) {
  let cursor = 0;
  return pesos.map((peso, i) => {
    const inicio = cursor;
    const arriba = i === 0 ? inicio : inicio + 1;
    const fin = arriba + (peso - 1);
    cursor = fin;
    return { inicio, arriba, fin };
  });
}

export function largoTotal(pesos) {
  return pesos.reduce((a, b) => a + b, 0) - 1;
}

// Avance de cada sección (0 a weight) para una posición de scroll en pantallas.
export function avancesEn(posicion, pesos) {
  return rangosDeScroll(pesos).map(({ inicio, arriba }, i) => {
    const desdeQueAsoma = i === 0 ? 1 + (posicion - arriba) : posicion - inicio;
    return Math.min(Math.max(desdeQueAsoma, i === 0 ? 1 : 0), pesos[i]);
  });
}
