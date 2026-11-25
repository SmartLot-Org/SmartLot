// Silueta del logo de SmartLot (la P con la flecha), como datos puros: sin three.
// Se midió sobre el logo original (2048 × 1118 px) y se describe como lo que es:
// un trazo de ancho constante. Así la geometría sale nítida a cualquier escala,
// sin depender de un PNG ni de un modelo binario.
//
// Coordenadas finales: centradas, Y hacia arriba, alto total = 1.

const ANCHO = 37;            // ancho del trazo en px de la imagen de referencia
const CENTRO = { x: 1025, y: 558 };   // centro de la caja del logo
const ALTO = 638;            // de la punta de la flecha al pie de la P

// La P es un solo trazo abierto: arranca en la panza interior, baja por la
// diagonal, hace el pie en punta, sube, rodea la panza exterior y termina arriba
// a la izquierda. Cada tramo es una recta o un arco con centro en el ojo.
const OJO = { x: 1095, y: 521 };
const TRAZO_P = [
  { a: [1011, 450] },
  { a: [1095, 450] },
  { arco: { r: 71, desde: -90, hasta: 90 } },      // panza interior (en px: Y hacia abajo)
  { a: [953, 592] },
  { a: [890, 655] },                                // diagonal a 45°
  { a: [890, 838] },
  { a: [960, 777] },                                // pie en punta
  { a: [960, 683] },
  { a: [980, 662.5] },                              // ochava
  { a: [1095, 662.5] },
  { arco: { r: 141.5, desde: 90, hasta: -90 } },   // panza exterior
  { a: [960, 379.5] },
  { a: [960, 540] },
];

function muestrear(trazo, pasosArco) {
  const puntos = [];
  for (const t of trazo) {
    if (t.a) { puntos.push(t.a); continue; }
    const { r, desde, hasta } = t.arco;
    for (let i = 1; i <= pasosArco; i++) {
      const g = ((desde + ((hasta - desde) * i) / pasosArco) * Math.PI) / 180;
      puntos.push([OJO.x + Math.cos(g) * r, OJO.y + Math.sin(g) * r]);
    }
  }
  // Los arcos repiten el punto donde terminan las rectas.
  return puntos.filter((p, i) => i === 0 || Math.hypot(p[0] - puntos[i - 1][0], p[1] - puntos[i - 1][1]) > 1e-6);
}

// Contorno de un trazo abierto con uniones en inglete y extremos rectos.
function contornoDeTrazo(puntos, medio) {
  const izq = [];
  const der = [];
  const n = puntos.length;
  const normal = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  };
  for (let i = 0; i < n; i++) {
    let nx;
    let ny;
    if (i === 0) [nx, ny] = normal(puntos[0], puntos[1]);
    else if (i === n - 1) [nx, ny] = normal(puntos[n - 2], puntos[n - 1]);
    else {
      const n1 = normal(puntos[i - 1], puntos[i]);
      const n2 = normal(puntos[i], puntos[i + 1]);
      const bx = n1[0] + n2[0];
      const by = n1[1] + n2[1];
      const bl = Math.hypot(bx, by);
      const coseno = (bx / bl) * n1[0] + (by / bl) * n1[1];
      nx = bx / bl / coseno;
      ny = by / bl / coseno;
    }
    izq.push([puntos[i][0] + nx * medio, puntos[i][1] + ny * medio]);
    der.push([puntos[i][0] - nx * medio, puntos[i][1] - ny * medio]);
  }
  return [...izq, ...der.reverse()];
}

function bezier(p0, p1, p2, p3, pasos) {
  const salida = [];
  for (let i = 1; i <= pasos; i++) {
    const t = i / pasos;
    const u = 1 - t;
    salida.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return salida;
}

// La flecha: asta recta cortada a 45° (paralela a la diagonal de la P) y punta
// de alas cóncavas, simétrica respecto del eje del asta.
function contornoFlecha(pasosCurva) {
  const eje = 890;
  const m = ANCHO / 2;
  const punta = [eje, 239];
  const ala = [796, 331];
  const base = 333;
  const izquierda = [
    ...bezier(punta, [866, 286], [836, 324], ala, pasosCurva),
    ...bezier(ala, [820, 335], [850, base], [eje - m, base], Math.ceil(pasosCurva / 3)),
    [eje - m, 608],             // corte a 45°: x + y constante
  ];
  const espejo = (p) => [2 * eje - p[0], p[1]];
  const derecha = izquierda.slice(0, -1).map(espejo).reverse();
  return [punta, ...izquierda, [eje + m, 570], ...derecha];
}

const normalizar = (contorno) =>
  contorno.map(([x, y]) => [(x - CENTRO.x) / ALTO, (CENTRO.y - y) / ALTO]);

// Devuelve dos contornos cerrados (P y flecha), en sentido antihorario, en
// unidades de "alto del logo". `detalle` multiplica los segmentos de las curvas.
export function contornosLogo(detalle = 1) {
  const pasosArco = Math.max(6, Math.round(24 * detalle));
  const p = normalizar(contornoDeTrazo(muestrear(TRAZO_P, pasosArco), ANCHO / 2));
  const flecha = normalizar(contornoFlecha(Math.max(6, Math.round(16 * detalle))));
  return [p, flecha].map(antihorario);
}

export const PROPORCION_LOGO = 459 / ALTO;   // ancho / alto

function areaConSigno(c) {
  let a = 0;
  for (let i = 0; i < c.length; i++) {
    const [x1, y1] = c[i];
    const [x2, y2] = c[(i + 1) % c.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function antihorario(c) {
  return areaConSigno(c) < 0 ? [...c].reverse() : c;
}

export { areaConSigno };
